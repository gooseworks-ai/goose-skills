#!/usr/bin/env python3
"""Place the brand's real logo file onto a finished render. No model or network calls.

Usage:
  python3 place_logo.py render.png logo.png out.png --corner br --width 0.18 [--margin 0.04] [--plate auto|none|#RRGGBB]

The render is never overwritten. --corner is one of tl, tr, bl, br, tc, bc. --width is the logo width as a
fraction of the render width. --plate adds a rounded backing plate behind the logo: "auto" picks white or
near-black, whichever contrasts more with the logo itself; "none" places the logo bare; a hex colour forces
that colour. Prints the box it used as JSON so the batch file can record it.
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageStat

CORNERS = {"tl", "tr", "bl", "br", "tc", "bc"}


def luminance(rgb):
    r, g, b = (c / 255 for c in rgb[:3])
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def box_for(corner, canvas, size, margin):
    cw, ch = canvas
    w, h = size
    mx, my = round(cw * margin), round(cw * margin)
    x = {"l": mx, "r": cw - w - mx, "c": (cw - w) // 2}[corner[1]]
    y = my if corner[0] == "t" else ch - h - my
    return x, y


def place(render_path, logo_path, out_path, corner="br", width=0.18, margin=0.04, plate="auto"):
    if corner not in CORNERS:
        raise ValueError(f"corner must be one of {sorted(CORNERS)}")
    if not 0.03 <= width <= 0.6:
        raise ValueError("width must be between 0.03 and 0.6 of the render width")
    render_path, logo_path, out_path = Path(render_path), Path(logo_path), Path(out_path)
    if out_path.resolve() in {render_path.resolve(), logo_path.resolve()}:
        raise ValueError("out must be a new file; the render and the logo are never overwritten")
    base = Image.open(render_path).convert("RGBA")
    logo = Image.open(logo_path).convert("RGBA")
    lw = round(base.width * width)
    lh = round(logo.height * lw / logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    pad = round(lw * 0.12) if plate != "none" else 0
    bw, bh = lw + 2 * pad, lh + 2 * pad
    x, y = box_for(corner, base.size, (bw, bh), margin)
    used = "none"
    if plate != "none":
        if plate == "auto":
            alpha = logo.getchannel("A")
            lum = luminance(ImageStat.Stat(logo.convert("RGB"), mask=alpha).mean)
            colour = (255, 255, 255, 235) if lum < 0.55 else (20, 20, 20, 235)
        else:
            h = plate.lstrip("#")
            colour = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
        layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle((x, y, x + bw, y + bh), radius=round(bh * 0.3), fill=colour)
        base = Image.alpha_composite(base, layer)
        used = "#%02x%02x%02x" % colour[:3]
    base.alpha_composite(logo, (x + pad, y + pad))
    base.convert("RGB").save(out_path, "PNG")
    return {"out": str(out_path), "box": [x, y, bw, bh], "logo_size": [lw, lh], "corner": corner, "plate": used}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("render")
    p.add_argument("logo")
    p.add_argument("out")
    p.add_argument("--corner", default="br")
    p.add_argument("--width", type=float, default=0.18)
    p.add_argument("--margin", type=float, default=0.04)
    p.add_argument("--plate", default="auto")
    a = p.parse_args(argv)
    try:
        print(json.dumps(place(a.render, a.logo, a.out, a.corner, a.width, a.margin, a.plate)))
    except (ValueError, OSError) as e:
        print(f"place_logo: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
