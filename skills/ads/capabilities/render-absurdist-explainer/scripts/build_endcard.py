#!/usr/bin/env python3
"""build_endcard.py — the REAL-product end card (1080x1920), composited in PIL.

Ports the validated end-card recipe from the format's reference runs. The end card is ALWAYS a composite of the real
retail product photo — NEVER an AI-rendered cartoon bottle (both reference runs shipped
an AI bottle first and had to re-shoot with the real photo). ALL brand text is typeset
here with PIL ImageDraw.text — never AI-rendered.

Layout (top -> bottom):
  - background: the brand's primary palette colour, OR (default) sampled from the product
    photo's own edge pixel for a seamless paste.
  - the real product photo, scaled to ~1015px tall, centred, offset y=88.
  - brand wordmark (large, brand primary colour).
  - product line (medium).
  - claim rows (small, grey).
  - a CTA pill (rounded-rect in the brand accent colour, white text).

Every text colour is checked against the colour behind it. If the contrast is too low
to read, that text is drawn in white or near-black instead and a warning is printed.

Reads a config.json; writes endcard.png into --out (or the config's end_card.image).
"""
import argparse, json, os, sys
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920

# Neutral fallbacks used ONLY when config.brand_palette omits a colour. Every real run
# passes the brand's own palette; these are deliberately brand-less greys.
NEUTRAL_PRIMARY = (34, 34, 34)
NEUTRAL_ACCENT = (34, 34, 34)
NEUTRAL_GREY = (107, 107, 107)

# Text on the end card must reach this contrast ratio (WCAG) against what is behind it.
# 3.0 is the WCAG floor for large text; every line here is 35px or bigger.
MIN_CONTRAST = 3.0
# The CTA is white on the accent pill. White on a mid-tone brand colour is a normal
# button look, so only step in when it is close to unreadable.
MIN_CTA_CONTRAST = 2.0
WHITE = (255, 255, 255)
NEAR_BLACK = (20, 20, 20)

# Portable font fallback chain: DejaVu (most Linux), then macOS Arial, then Windows
# Arial and Segoe UI, then a DejaVu on the font path, then Pillow's built-in.
# Bold + regular variants each.
_WIN_FONTS = os.path.join(os.environ.get("WINDIR", "C:/Windows"), "Fonts")
_BOLD_CANDS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    os.path.join(_WIN_FONTS, "arialbd.ttf"),
    os.path.join(_WIN_FONTS, "segoeuib.ttf"),
    "DejaVuSans-Bold.ttf",
]
_REG_CANDS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    os.path.join(_WIN_FONTS, "arial.ttf"),
    os.path.join(_WIN_FONTS, "segoeui.ttf"),
    "DejaVuSans.ttf",
]
_warned_default_font = False


def font(bold, size):
    global _warned_default_font
    for c in (_BOLD_CANDS if bold else _REG_CANDS):
        try:
            return ImageFont.truetype(c, size)
        except OSError:
            continue
    if not _warned_default_font:
        sys.stderr.write("WARNING: no TrueType font found - using Pillow's built-in font. "
                         "Install DejaVu or Arial for a clean end card.\n")
        _warned_default_font = True
    try:
        return ImageFont.load_default(size=size)   # Pillow >= 10.1 honours the size
    except TypeError:
        return ImageFont.load_default()


def _luminance(rgb):
    def chan(v):
        v = v / 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (chan(v) for v in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = _luminance(a), _luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def readable(label, colour, behind, floor=MIN_CONTRAST):
    """Return colour, or white / near-black when colour is too close to what is behind it."""
    ratio = contrast(colour, behind)
    if ratio >= floor:
        return colour
    swap = max((WHITE, NEAR_BLACK), key=lambda c: contrast(c, behind))
    sys.stderr.write(f"WARNING: {label} colour #{'%02x%02x%02x' % tuple(colour[:3])} has contrast "
                     f"{ratio:.1f}:1 on #{'%02x%02x%02x' % tuple(behind[:3])} (need {floor}:1) - "
                     f"drawing it in #{'%02x%02x%02x' % swap} instead.\n")
    return swap


def _hex(s, default=(0, 0, 0)):
    if not s:
        return default
    s = s.lstrip("#")
    if len(s) == 3:
        s = "".join(ch * 2 for ch in s)
    try:
        return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return default


def main():
    ap = argparse.ArgumentParser(description="Build the real-product end card PNG.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", help="output PNG path (defaults to config.end_card.image)")
    a = ap.parse_args()

    with open(a.config, encoding="utf-8-sig") as f:   # UTF-8, with or without a BOM
        cfg = json.load(f)
    ec = cfg["end_card"]
    palette = cfg.get("brand_palette", {})

    missing = [k for k in ("primary", "accent") if not palette.get(k)]
    if missing:
        sys.stderr.write(f"WARNING: brand_palette missing {missing} - using neutral greys. "
                         "Pass the brand's own hex colours.\n")
    primary = _hex(palette.get("primary"), NEUTRAL_PRIMARY)
    primary_lite = _hex(palette.get("primary_lite") or palette.get("primary"), primary)
    accent = _hex(palette.get("accent"), NEUTRAL_ACCENT)
    grey = _hex(palette.get("grey"), NEUTRAL_GREY)

    prod = Image.open(ec["product_image"]).convert("RGB")

    # background: explicit brand bg, else sample the product photo's own edge pixel
    if ec.get("background"):
        bg = _hex(ec["background"], (255, 255, 255))
    else:
        bg = prod.getpixel((6, 6))

    # a brand colour can sit too close to the background (dark on a dark photo)
    primary = readable("wordmark", primary, bg)
    primary_lite = readable("product line", primary_lite, bg)
    grey = readable("claims", grey, bg)
    cta_text = readable("CTA text", WHITE, accent, MIN_CTA_CONTRAST)

    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)

    # product photo, scaled to height ~1015, centred, offset y=88
    ph = int(ec.get("product_height", 1015))
    pw = int(prod.width * ph / prod.height)
    img.paste(prod.resize((pw, ph), Image.LANCZOS), ((W - pw) // 2, int(ec.get("product_y", 88))))

    def line(y, text, fnt, fill):
        d.text((W // 2, y), text, font=fnt, fill=fill, anchor="ma")

    # typeset copy block
    y = int(ec.get("copy_y", 1190))
    line(y, ec["wordmark"], font(True, 100), primary); y += 128
    if ec.get("product_line"):
        line(y, ec["product_line"], font(True, 46), primary_lite); y += 96
    for claim in ec.get("claims", []):
        line(y, claim, font(False, 35), grey); y += 56
    y += 36

    # CTA pill (rounded-rect in the accent colour, white text)
    cta = ec.get("cta")
    if cta:
        cf = font(True, 43)
        bb = d.textbbox((0, 0), cta, font=cf)
        cw, chh = bb[2] - bb[0], bb[3] - bb[1]
        padx, pady = 50, 30
        pw2, ph2 = cw + 2 * padx, chh + 2 * pady
        px = (W - pw2) // 2
        d.rounded_rectangle([px, y, px + pw2, y + ph2], radius=ph2 // 2, fill=accent)
        d.text((W // 2, y + ph2 // 2), cta, font=cf, fill=cta_text, anchor="mm")

    out = a.out or ec["image"]
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    img.save(out)
    print("wrote", out, img.size)


if __name__ == "__main__":
    main()
