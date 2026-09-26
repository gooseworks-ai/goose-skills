#!/usr/bin/env python3
"""build_endcard.py — the REAL-product end card (1080x1920), composited in PIL.

Ports the validated end-card recipe from the Soteri "pH villain" run
(generated/endcard/build_endcard.py). The end card is ALWAYS a composite of the real
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

Reads a config.json; writes endcard.png into --out (or the config's end_card.image).
"""
import argparse, json, os, sys
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920

# Portable font fallback chain: DejaVu (ships with Pillow / most Linux), then macOS
# Arial, then Windows Arial, then Pillow's built-in. Bold + regular variants each.
_BOLD_CANDS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "DejaVuSans-Bold.ttf",
]
_REG_CANDS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "DejaVuSans.ttf",
]


def font(bold, size):
    for c in (_BOLD_CANDS if bold else _REG_CANDS):
        try:
            return ImageFont.truetype(c, size)
        except OSError:
            continue
    return ImageFont.load_default()


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

    cfg = json.load(open(a.config))
    ec = cfg["end_card"]
    palette = cfg.get("brand_palette", {})

    primary = _hex(palette.get("primary"), (46, 111, 94))
    primary_lite = _hex(palette.get("primary_lite") or palette.get("primary"), primary)
    accent = _hex(palette.get("accent"), (232, 103, 76))
    grey = _hex(palette.get("grey"), (107, 111, 105))
    white = (255, 255, 255)

    prod = Image.open(ec["product_image"]).convert("RGB")

    # background: explicit brand bg, else sample the product photo's own edge pixel
    if ec.get("background"):
        bg = _hex(ec["background"], (255, 255, 255))
    else:
        bg = prod.getpixel((6, 6))

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
        d.text((W // 2, y + ph2 // 2), cta, font=cf, fill=white, anchor="mm")

    out = a.out or ec["image"]
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    img.save(out)
    print("wrote", out, img.size)


if __name__ == "__main__":
    main()
