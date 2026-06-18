#!/usr/bin/env python3
"""Cut a product out to a transparent PNG for the HTML-overlay remix path.

Handles two common cases automatically:
  1. Renders that already ship palette/alpha transparency  -> just normalize to RGBA + autocrop.
  2. Product on a white/solid background                   -> edge-connected flood fill, which
     removes the background WITHOUT punching holes in interior white logos/text on the label.

Usage:
  python3 cutout_product.py SRC [OUT] [--thresh 42] [--preview sky]
"""
import sys, argparse
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

PREVIEW_BG = {"sky": (150, 180, 228), "white": (255, 255, 255), "magenta": (255, 0, 255)}


def already_transparent(im_rgba):
    a = np.array(im_rgba)[:, :, 3]
    return (a < 10).mean() > 0.02  # >2% fully-transparent pixels => has a real alpha channel


def floodfill_bg(rgb, thresh):
    w, h = rgb.size
    SENT = (255, 0, 255)
    work = rgb.copy()
    seeds = [(x, 0) for x in range(0, w, 10)] + [(x, h - 1) for x in range(0, w, 10)]
    seeds += [(0, y) for y in range(0, h, 10)] + [(w - 1, y) for y in range(0, h, 10)]
    for sx, sy in seeds:
        r, g, b = work.getpixel((sx, sy))
        if min(r, g, b) > 175:  # only seed on light background pixels
            ImageDraw.floodfill(work, (sx, sy), SENT, thresh=thresh)
    arr = np.array(work)
    mask = np.all(arr == SENT, axis=-1)
    out = np.dstack([np.array(rgb), np.where(mask, 0, 255).astype("uint8")])
    return Image.fromarray(out, "RGBA")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out", nargs="?", default="product-cutout.png")
    ap.add_argument("--thresh", type=int, default=42, help="flood-fill tolerance for white-bg case")
    ap.add_argument("--preview", choices=list(PREVIEW_BG), help="also write <out>.preview.png on a bg")
    args = ap.parse_args()

    src_rgba = Image.open(args.src).convert("RGBA")
    if already_transparent(src_rgba):
        rgba = src_rgba
    else:
        rgba = floodfill_bg(Image.open(args.src).convert("RGB"), args.thresh)

    # feather edge to kill halo, then autocrop to content
    alpha = rgba.split()[3].filter(ImageFilter.GaussianBlur(0.8))
    rgba.putalpha(alpha)
    bbox = rgba.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)
    rgba.save(args.out)
    frac = round((np.array(rgba)[:, :, 3] < 10).mean(), 3)
    print(f"saved {args.out} size={rgba.size} transparent_frac={frac}")

    if args.preview:
        bg = Image.new("RGBA", rgba.size, PREVIEW_BG[args.preview] + (255,))
        bg.alpha_composite(rgba)
        p = args.out + ".preview.png"
        bg.convert("RGB").save(p)
        print(f"preview {p}")


if __name__ == "__main__":
    main()
