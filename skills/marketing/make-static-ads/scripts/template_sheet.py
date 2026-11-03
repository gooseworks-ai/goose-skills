#!/usr/bin/env python3
"""Lay images side by side with a caption under each, so the marketer can see them. No model calls.

Usage:
  python3 template_sheet.py out.jpg --title "Ad 1 · balanced · No sink required" \
      "A (chosen): your bundle ad=https://…/a.png" "B: library, lifestyle=https://…/b.jpg" "C: library, 3D=c.png"

Each tile is "caption=source" (the caption has no "="; a URL may); a source is an https URL or a local path. The first tile is outlined as the
chosen one; pass --no-chosen to outline none (for example "Based on" → "Finished ad" at hand-off). Prints the
output path and the tile count as JSON.
"""
import argparse
import io
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

TILE_H = 640
PAD = 24
CAPTION_H = 96
TITLE_H = 72
CHOSEN = (46, 125, 50)


def load(source):
    if source.startswith(("http://", "https://")):
        req = urllib.request.Request(source, headers={"User-Agent": "make-static-ads/template_sheet"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return Image.open(io.BytesIO(r.read())).convert("RGB")
    return Image.open(Path(source)).convert("RGB")


def font(size):
    for name in ("Helvetica.ttc", "Arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def wrap(draw, text, f, width):
    lines, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if line and draw.textlength(trial, font=f) > width:
            lines.append(line)
            line = word
        else:
            line = trial
    lines.append(line)
    return "\n".join(lines[:3])


def parse_tile(arg):
    caption, sep, source = arg.partition("=")
    if not sep or not caption or not source:
        raise ValueError(f'tile must be "caption=source": {arg!r}')
    return caption.strip(), source.strip()


def sheet(out, tiles, title="", chosen=True):
    if not tiles:
        raise ValueError("give at least one tile")
    images = []
    for caption, source in tiles:
        img = load(source)
        w = round(img.width * TILE_H / img.height)
        images.append((caption, img.resize((w, TILE_H), Image.LANCZOS)))
    width = PAD + sum(img.width + PAD for _, img in images)
    top = TITLE_H if title else PAD
    canvas = Image.new("RGB", (width, top + TILE_H + CAPTION_H + PAD), "white")
    draw = ImageDraw.Draw(canvas)
    if title:
        draw.text((PAD, 20), title, fill="black", font=font(32))
    x = PAD
    for i, (caption, img) in enumerate(images):
        canvas.paste(img, (x, top))
        if chosen and i == 0:
            draw.rectangle((x - 6, top - 6, x + img.width + 6, top + TILE_H + 6), outline=CHOSEN, width=6)
        draw.multiline_text((x, top + TILE_H + 12), wrap(draw, caption, font(24), img.width),
                            fill=CHOSEN if chosen and i == 0 else "black", font=font(24), spacing=4)
        x += img.width + PAD
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, "JPEG", quality=88)
    return {"out": str(out), "tiles": len(images)}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("out")
    p.add_argument("tiles", nargs="+")
    p.add_argument("--title", default="")
    p.add_argument("--no-chosen", action="store_true")
    a = p.parse_args(argv)
    try:
        tiles = [parse_tile(t) for t in a.tiles]
        print(json.dumps(sheet(a.out, tiles, a.title, not a.no_chosen)))
    except (ValueError, OSError) as e:
        print(f"template_sheet: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
