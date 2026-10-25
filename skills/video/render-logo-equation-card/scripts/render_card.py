#!/usr/bin/env python3
"""Render the two card PNGs for a logo-equation card ad.

The card is the whole message. It is a static 1080x672 black plate that sits over
b-roll; the ONLY animated thing in the format is the CTA line, which hard-cuts in
partway through. So this script emits two plates:

    card-no-cta.png     shown from 0s until the reveal
    card-with-cta.png   shown from the reveal to the end

Geometry defaults were measured off the reference ad by scanning the source card
for rows containing bright pixels -- not by eye. See references/format-spec.md.

Usage:
    python render_card.py card.json --out-dir work/

card.json:
    {"logos": ["partner-icon.png", "brand-icon.png"],   # square APP ICONS, partner left
     "partner": {"name": "Slack", "integration_confirmed": true},
     "headline": ["= your standup, written", "before anyone opens Slack"],
     "steps": ["1. ...", "2. ...", "3. ...", "4. ..."],
     "cta": "Try it free at example.com"}

GUARDRAILS (the platform names another brand only as plain co-existence, never as an
endorsement, partnership or ranking; two logos side by side already imply a link):
  * `partner.integration_confirmed` must be true: the user confirmed the product really
    works with the partner (an integration, a plugin, an import). No confirmation, no card.
  * The copy may not say partner / partnership / official / endorsed / certified /
    approved by / recommended by / "#1" / "best", nor use the partner's name in the CTA.
  * No comment-bait CTA ("comment X and I'll send the link"): nothing replies to comments.
  * No em or en dashes; exactly two logos, two headline lines, four steps.
"""
import argparse, json, sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from _fonts import paths as font_paths

W, CARD_H = 1080, 672
WHITE = (255, 255, 255)

# --- measured off the reference ad (1080x1920). Do not "tidy" these numbers. ---
DEFAULT_GEOM = {
    "tile": 180, "tile_gap": 87, "tile_top": 150, "tile_radius": 38,
    "head_top": 366, "head_pitch": 48, "head_max_width": 716,
    "list_top": 480, "list_pitch": 38, "list_x": 136,
    "cta_top": 641,
    "plus_size": 58, "list_size": 30, "cta_size": 26,
}

DASHES = ("—", "–")  # em / en dash
BANNED = ("partner", "partnership", "official", "endorsed", "endorse", "certified", "approved by",
          "recommended by", "#1", "number one", "best ")


def key_to_white(path, tol=78, pad=0.12):
    """Knock an app icon's flat brand backdrop out to white, then centre it.

    Two traps, both hit during the reference build:
      * App icons are usually RGBA with rounded corners. Sampling pixel (2,2) as
        "the background" returns a TRANSPARENT corner, which converts to black --
        so keying does nothing and the brand backdrop survives. Composite the
        alpha onto white FIRST.
      * Take the DOMINANT non-white colour as the backdrop, never a corner pixel.
    """
    im = Image.open(path)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        im = Image.alpha_composite(Image.new("RGBA", im.size, (255, 255, 255, 255)), im)
    im = im.convert("RGB")
    a = np.array(im).astype(int)
    flat = a.reshape(-1, 3)
    nonwhite = flat[flat.sum(axis=1) < 720]
    if len(nonwhite):
        vals, counts = np.unique(nonwhite, axis=0, return_counts=True)
        backdrop = vals[counts.argmax()]
        a[np.sqrt(((a - backdrop) ** 2).sum(axis=2)) < tol] = WHITE
    im = Image.fromarray(a.astype(np.uint8))

    g = np.array(im.convert("L"))
    nz = np.nonzero(g < 235)
    if len(nz[0]):
        im = im.crop((nz[1].min(), nz[0].min(), nz[1].max() + 1, nz[0].max() + 1))
    side = int(max(im.size) * (1 + pad * 2))
    out = Image.new("RGB", (side, side), WHITE)
    out.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return out


def fit_font(path, lines, max_w, lo=24, hi=90):
    """Largest size at which every line fits inside max_w."""
    d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    best = lo
    for size in range(lo, hi):
        f = ImageFont.truetype(path, size)
        if max(d.textlength(l, font=f) for l in lines) <= max_w:
            best = size
        else:
            break
    return ImageFont.truetype(path, best)


def draw_at_cap(d, x, cap_top, text, font, fill, center=False):
    """Place text by its INK top, not PIL's em box.

    PIL's y is the em box top, which sits above the glyph. Measured geometry is
    cap-top, so text placed naively lands low and collides with the block below.
    """
    bb = d.textbbox((0, 0), text, font=font)
    x0 = (W - (bb[2] - bb[0])) / 2 - bb[0] if center else x
    d.text((x0, cap_top - bb[1]), text, font=font, fill=fill)


def check_fit(spec, geom):
    """Every row of text must fit the card at the size it will actually render.

    The headline is fitted by fit_font, which only shrinks: when even the smallest size is
    too wide it returns that size anyway and the line runs off the card. Steps and the CTA
    are drawn at FIXED sizes with no width check at all, so a long step simply overflows
    the right edge. Nothing here raised an error for either -- the plate rendered, looked
    finished, and was wrong. Check the copy against the geometry before drawing it.

    Margins are symmetric: a step starts at list_x, so it may not come closer than list_x to
    the right edge either. The CTA is centred and gets the same margins.
    """
    d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    bold, reg, ital = spec["fonts"]["bold"], spec["fonts"]["regular"], spec["fonts"]["italic"]
    out = []
    head, steps = spec.get("headline", []), spec.get("steps", [])
    if len(head) != 2:
        out.append("headline must be exactly 2 lines, got %d" % len(head))
    if len(steps) != 4:
        out.append("steps must be exactly 4, got %d" % len(steps))
    if head:
        fh = fit_font(bold, head, geom["head_max_width"])
        widest = max(d.textlength(l, font=fh) for l in head)
        if widest > geom["head_max_width"]:
            out.append("headline is %dpx wide even at the smallest size (%dpx); the card allows %dpx"
                       % (widest, fh.size, geom["head_max_width"]))
    room = W - 2 * geom["list_x"]
    fs = ImageFont.truetype(reg, geom["list_size"])
    for i, line in enumerate(steps, 1):
        w = d.textlength(line, font=fs)
        if w > room:
            out.append("step %d is %dpx wide, the card allows %dpx: %r" % (i, w, room, line))
    if spec.get("cta"):
        w = d.textlength(spec["cta"], font=ImageFont.truetype(ital, geom["cta_size"]))
        if w > room:
            out.append("CTA is %dpx wide, the card allows %dpx: %r" % (w, room, spec["cta"]))
    return out


def build(spec, geom, with_cta):
    img = Image.new("RGB", (W, CARD_H), (0, 0, 0))
    d = ImageDraw.Draw(img)
    bold, reg, ital = spec["fonts"]["bold"], spec["fonts"]["regular"], spec["fonts"]["italic"]

    tile, gap, top, radius = geom["tile"], geom["tile_gap"], geom["tile_top"], geom["tile_radius"]
    cx = W // 2
    positions = [cx - gap // 2 - tile, cx + gap // 2]
    for x, art in zip(positions, spec["logos"]):
        a = key_to_white(art).resize((tile, tile), Image.LANCZOS)
        mask = Image.new("L", (tile, tile), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, tile - 1, tile - 1], radius, fill=255)
        img.paste(a, (x, top), mask)

    draw_at_cap(d, 0, top + tile // 2 - 30, "+",
                ImageFont.truetype(bold, geom["plus_size"]), WHITE, center=True)

    fh = fit_font(bold, spec["headline"], geom["head_max_width"])
    for i, line in enumerate(spec["headline"]):
        draw_at_cap(d, 0, geom["head_top"] + i * geom["head_pitch"], line, fh, WHITE, center=True)

    fs = ImageFont.truetype(reg, geom["list_size"])
    for i, line in enumerate(spec["steps"]):
        draw_at_cap(d, geom["list_x"], geom["list_top"] + i * geom["list_pitch"],
                    line, fs, (240, 240, 240))

    if with_cta and spec.get("cta"):
        draw_at_cap(d, 0, geom["cta_top"], spec["cta"],
                    ImageFont.truetype(ital, geom["cta_size"]), (200, 200, 200), center=True)
    return img


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spec", type=Path, help="card JSON, see examples/card.example.json")
    ap.add_argument("--out-dir", type=Path, default=Path("."))
    args = ap.parse_args()

    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    spec["fonts"] = font_paths(spec.get("fonts"))
    geom = {**DEFAULT_GEOM, **spec.get("geometry", {})}
    partner = spec.get("partner") or {}
    if not partner.get("integration_confirmed"):
        sys.exit("ERROR: partner.integration_confirmed is not true. Two logos read as a partnership; "
                 "only render this card when the user confirmed the product really works with %s."
                 % (partner.get("name") or "the partner"))
    copy = [*spec.get("headline", []), *spec.get("steps", []), spec.get("cta", "")]
    for line in copy:
        low = " %s " % line.lower()
        hit = next((w for w in BANNED if w in low), None)
        if hit:
            sys.exit("ERROR: %r implies endorsement or ranking (%r). State what the product does with "
                     "the partner, not a relationship." % (line, hit.strip()))
    cta = spec.get("cta", "").lower()
    if "comment" in cta:
        sys.exit("ERROR: comment-bait CTA; nothing replies to comments. Use a plain CTA (a URL or 'try it free').")
    if partner.get("name") and partner["name"].lower() in cta:
        sys.exit("ERROR: the CTA names the partner; the CTA is the brand's own.")
    problems = check_fit(spec, geom)
    if problems:
        sys.exit("card does not fit:\n  - " + "\n  - ".join(problems))

    # Hard gate: dashes render badly in this typeface at this size and read as
    # a hyphen. The reference brand explicitly rejected them.
    for s in spec["headline"] + spec["steps"] + [spec.get("cta", "")]:
        for dash in DASHES:
            if dash in s:
                sys.exit(f"ERROR: em/en dash in card text -- rewrite it: {s!r}")

    if len(spec["logos"]) != 2:
        sys.exit("ERROR: this format is an equation between exactly two logos.")
    # Logo paths in a spec are relative to wherever it was written. The shipped example named
    # assets/brand/..., which exists in no checkout, so the example never rendered as-is.
    # Try as given, then beside the spec, then this skill's demo/assets by file name.
    resolved = []
    for logo in spec["logos"]:
        tries = [Path(logo), args.spec.parent / logo]
        hit = next((t for t in tries if t.exists()), None)
        if not hit:
            sys.exit("ERROR: logo not found: %s (tried %s)" % (logo, ", ".join(map(str, tries))))
        resolved.append(str(hit))
    spec["logos"] = resolved
    if len(spec["steps"]) != 4:
        sys.exit(f"ERROR: the format takes exactly 4 steps, got {len(spec['steps'])}.")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    build(spec, geom, False).save(args.out_dir / "card-no-cta.png")
    build(spec, geom, True).save(args.out_dir / "card-with-cta.png")
    print(f"[render_card] wrote card-no-cta.png and card-with-cta.png to {args.out_dir}")
    print(f"[render_card] headline fitted at {fit_font(spec['fonts']['bold'], spec['headline'], geom['head_max_width']).size}px")


if __name__ == "__main__":
    main()
