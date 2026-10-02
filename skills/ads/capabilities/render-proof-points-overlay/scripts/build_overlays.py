#!/usr/bin/env python3
"""Build the pill PNG overlays for a "perfect-score + proof-points" ad.

Config-driven (reads config.json) so the same engine renders any brand:
- one persistent white SCORE header pill (trailing medal),
- one persistent orange SUBHEAD pill (trailing finger-down),
- 3-4 green-CHECK proof pills (leading check), each auto-sized to its copy.

The reference look (the format's source reel + its worked example) is: bold rounded pills,
Twemoji icons pasted as PNGs (PIL cannot render Apple Color Emoji), icons
vertically centered on the pill middle. See SKILL.md Phase 3 for the rules.

Usage:  build_overlays.py --config config.json --out-dir <run>/generated/overlays
"""
import argparse
import json
import pathlib
import math
from PIL import Image, ImageDraw, ImageFont

# ---- font resolution (bold is load-bearing: regular reads as a generic UI card) ----
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/SFNS.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def load_font(size):
    for p in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    raise RuntimeError("No bold TrueType font found; install Arial or DejaVu Sans.")


SYMBOL_FONTS = [
    "/System/Library/Fonts/Apple Symbols.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "C:/Windows/Fonts/seguisym.ttf",
]


def text_runs(text, font):
    """Keep the bold face for text; use a real glyph when that face lacks a symbol."""
    missing = font.getmask("\u0378")  # unassigned codepoint: this font's missing-glyph box
    missing_signature = (missing.size, bytes(missing))
    runs = []
    for ch in text:
        chosen = font
        mask = font.getmask(ch)
        if not ch.isspace() and (mask.size, bytes(mask)) == missing_signature:
            for path in SYMBOL_FONTS:
                try:
                    candidate = ImageFont.truetype(path, font.size)
                except OSError:
                    continue
                glyph, absent = candidate.getmask(ch), candidate.getmask("\u0378")
                if glyph.getbbox() and (glyph.size, bytes(glyph)) != (absent.size, bytes(absent)):
                    chosen = candidate
                    break
            else:
                raise ValueError(f"No installed font contains {ch!r}; install a Unicode symbol font.")
        if runs and runs[-1][1] is chosen:
            runs[-1] = (runs[-1][0] + ch, chosen)
        else:
            runs.append((ch, chosen))
    return runs


def measure(draw, text, font):
    runs = text_runs(text, font)
    width = math.ceil(sum(draw.textlength(part, font=face) for part, face in runs))
    height = max((draw.textbbox((0, 0), part, font=face)[3] - draw.textbbox((0, 0), part, font=face)[1]
                  for part, face in runs), default=0)
    return width, height


def draw_text(draw, xy, text, font, fill):
    x, y = xy
    for part, face in text_runs(text, font):
        draw.text((x, y), part, font=face, fill=fill, anchor="lm")
        x += draw.textlength(part, font=face)


class Icons:
    """Loads Twemoji PNGs from an icons dir (check.png / medal.png / finger-down.png)."""

    def __init__(self, icons_dir):
        self.dir = pathlib.Path(icons_dir)
        self.cache = {}

    def get(self, name):
        if name not in self.cache:
            self.cache[name] = Image.open(self.dir / name).convert("RGBA")
        return self.cache[name]

    def painter(self, name):
        def _paint(target, x, y, size):
            icon = self.get(name).resize((size, size), Image.LANCZOS)
            target.alpha_composite(icon, (x, y))
        return _paint


def rounded_pill(lines, font, pad_x=36, pad_y=14, bg=(255, 255, 255, 255),
                 fg=(0, 0, 0, 255), radius=28, trailing_icon=None, leading_icon=None,
                 icon_scale=0.95, icon_line=-1, min_width=0, min_height=0):
    """Render one rounded-rect pill. Icon is sized off single-line cap-height and
    pasted beside the entire text block (trailing = after the longest line; leading = left).
    Both icons vertically center on the pill's geometric middle."""
    dummy = Image.new("RGBA", (10, 10))
    d = ImageDraw.Draw(dummy)
    cap = d.textbbox((0, 0), "Hg", font=font)
    cap_h = cap[3] - cap[1]

    widths, heights = [], []
    for ln in lines:
        w, h = measure(d, ln, font)
        widths.append(w)
        heights.append(h)
    line_gap = 6
    text_h = max(heights) * len(lines) + line_gap * (len(lines) - 1)

    icon_pad = max(8, int(cap_h * 0.15))
    icon_size = int(cap_h * icon_scale)

    target = icon_line if icon_line >= 0 else len(lines) + icon_line
    extra = (icon_pad + icon_size) if trailing_icon else 0
    text_w = max(widths) + extra

    lead_extra = (icon_pad + icon_size) if leading_icon else 0
    box_w = max(min_width, text_w + 2 * pad_x + lead_extra)
    box_h = max(min_height, text_h + 2 * pad_y, icon_size + 2 * pad_y if trailing_icon or leading_icon else 0)

    img = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, box_w - 1, box_h - 1], radius=radius, fill=bg)

    text_x = pad_x + lead_extra
    line_h = max(heights) if heights else 0
    block_h = len(lines) * line_h + line_gap * (len(lines) - 1)
    block_top = (box_h - block_h) // 2
    icon_y = (box_h - icon_size) // 2

    if leading_icon:
        leading_icon(img, pad_x, icon_y, icon_size)

    for i, ln in enumerate(lines):
        cy = block_top + i * (line_h + line_gap) + line_h // 2
        draw_text(d, (text_x, cy), ln, font=font, fill=fg)
        if trailing_icon and i == target:
            trailing_icon(img, text_x + max(widths) + icon_pad, icon_y, icon_size)
    return img


def tup(v):
    return tuple(v) if isinstance(v, list) else v


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--icons-dir", default=None, help="defaults to <run>/assets/icons")
    ap.add_argument("--out-dir", required=True)
    args = ap.parse_args()

    cfg = json.loads(pathlib.Path(args.config).read_text())
    out = pathlib.Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    icons_dir = args.icons_dir or (pathlib.Path(args.config).resolve().parent / "assets" / "icons")
    icons = Icons(icons_dir)

    ov = cfg["overlays"]
    # The copy is per brand (the recipe ships it empty): fail clearly instead of
    # rendering blank pills.
    missing = [k for k, v in (("overlays.header.lines", ov.get("header", {}).get("lines")),
                              ("overlays.subhead.lines", ov.get("subhead", {}).get("lines")),
                              ("overlays.proof_points", ov.get("proof_points"))) if not v]
    if missing:
        raise SystemExit(f"[ov] missing copy: {', '.join(missing)}. Fill it with the brand's own, "
                         f"operator-approved claims (see overlays._example_content for the shape).")

    # 1. white SCORE header (trailing medal on line index icon_line, default 0)
    h = ov["header"]
    hdr1 = rounded_pill(h["lines"], load_font(h.get("font_size", 54)),
                        pad_x=h.get("pad_x", 38), pad_y=h.get("pad_y", 14),
                        bg=tup(h.get("bg", [255, 255, 255, 245])),
                        fg=tup(h.get("fg", [15, 15, 15, 255])),
                        radius=h.get("radius", 34),
                        trailing_icon=icons.painter(h.get("icon", "medal.png")),
                        icon_scale=h.get("icon_scale", 1.35),
                        icon_line=h.get("icon_line", 0))
    hdr1.save(out / "01-header-white.png")
    print(f"[ov] 01 white header  {hdr1.size}")

    # 2. orange SUBHEAD (width-matched to header so the two stack cleanly)
    s = ov["subhead"]
    hdr2 = rounded_pill(s["lines"], load_font(s.get("font_size", 50)),
                        pad_x=s.get("pad_x", 34), pad_y=s.get("pad_y", 10),
                        bg=tup(s.get("bg", [244, 92, 50, 245])),
                        fg=tup(s.get("fg", [255, 255, 255, 255])),
                        radius=s.get("radius", 30),
                        trailing_icon=icons.painter(s.get("icon", "finger-down.png")),
                        icon_scale=s.get("icon_scale", 1.30),
                        min_width=hdr1.size[0])
    hdr2.save(out / "02-header-orange.png")
    print(f"[ov] 02 orange sub    {hdr2.size}")

    # 3-N. green-check proof pills (auto-sized to content — NO min_width)
    pf = ov["proof_points"]
    font_check = load_font(ov.get("proof_font_size", 40))
    for i, pp in enumerate(pf, start=3):
        p = rounded_pill([pp["line_a"], pp["line_b"]], font_check,
                         pad_x=24, pad_y=14, radius=24,
                         bg=(255, 255, 255, 248), fg=(15, 15, 15, 255),
                         leading_icon=icons.painter("check.png"), icon_scale=1.0)
        name = f"{i:02d}-check-{pp.get('slug', i)}.png"
        p.save(out / name)
        print(f"[ov] {name}  {p.size}")

    print(f"[ov] built {2 + len(pf)} overlays -> {out}")


if __name__ == "__main__":
    main()
