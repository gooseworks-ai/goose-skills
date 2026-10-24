#!/usr/bin/env python3
"""prep_assets.py — two asset fixes this format needs almost every time.

1) crop  — brand hero/lifestyle JPGs often have baked-in white L/R (or T/B) margins.
           object-fit:cover can't create white, so edge-white = baked into the source.
           Crops to the non-white content bbox so the image fills its card edge-to-edge.
2) logo  — brand logo assets are frequently black-on-WHITE JPGs; over a photo or a
           colored end-card background they show an ugly white box. Keys the white out
           to a transparent PNG (alpha = 255 - luminance) so the wordmark floats clean.

Usage:
  python3 prep_assets.py crop  in.jpg out.jpg
  python3 prep_assets.py logo  logo.jpg wordmark.png   [--ink 20,18,16]
"""
import argparse
from PIL import Image


def crop(src, dst):
    im = Image.open(src).convert("RGB"); w, h = im.size; px = im.load()
    def col_white(x): return sum(1 for y in range(0, h, 4) if min(px[x, y]) > 243) / (h // 4) > 0.97
    def row_white(y): return sum(1 for x in range(0, w, 4) if min(px[x, y]) > 243) / (w // 4) > 0.97
    L = 0
    while L < w and col_white(L): L += 1
    R = w - 1
    while R > 0 and col_white(R): R -= 1
    T = 0
    while T < h and row_white(T): T += 1
    B = h - 1
    while B > 0 and row_white(B): B -= 1
    out = im.crop((L, T, R + 1, B + 1))
    out.save(dst, quality=95)
    print(f"cropped {im.size} -> {out.size} (removed L{L} R{w-1-R} T{T} B{h-1-B})")


def logo(src, dst, ink):
    lg = Image.open(src).convert("RGB"); w, h = lg.size; px = lg.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0)); o = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            o[x, y] = (ink[0], ink[1], ink[2], max(0, min(255, int(255 - (r + g + b) / 3))))
    out.save(dst)
    print(f"transparent wordmark -> {dst} {out.size}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("crop"); c.add_argument("src"); c.add_argument("dst")
    l = sub.add_parser("logo"); l.add_argument("src"); l.add_argument("dst"); l.add_argument("--ink", default="20,18,16")
    a = ap.parse_args()
    if a.cmd == "crop":
        crop(a.src, a.dst)
    else:
        logo(a.src, a.dst, [int(x) for x in a.ink.split(",")])


if __name__ == "__main__":
    main()
