#!/usr/bin/env python3
"""Crop a generated board photo and measure its writable surface. Free, local.

    python prep-plate.py --project <dir> [--src board.png] [--write]

Takes the raw plate from `gen-art.py --plate` and does the three things that were done by hand
on the first build, each of which took a throwaway script and a guess:

  CROP    the board must FILL the frame with its side edges running out of shot, a band of room
          above and a sliver of easel below. Showing the whole board with its legs and the floor
          reads as a product photo OF a whiteboard rather than as standing at one.
  QUAD    the writable surface is found by eroding the bright low-saturation mask until it
          breaks away from the window and the wall, taking the largest piece, and growing it
          back. A plain brightness test leaks into the window every time.
  INSET   the quad is pulled inside the caption safe zone BEFORE anything maps through it, so
          nothing downstream has to clamp - and clamping is what has repeatedly dragged labels
          onto each other in this project.

Writes `art/plate/board-final.png` and the measured quad into `episode.json`'s base keys.
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

W, H = 1080, 1920
SAFE_T, SAFE_B = 285, 1635
ZOOM = 1.05            # must match render.py's crop
MARGIN = 14            # how far inside the aluminium the ink is allowed
SIDE = 70              # and how far in from the FRAME, so content breathes


def board_mask(im):
    a = np.array(im).astype(int)
    mx, mn = a.max(2), a.min(2)
    bright = (mn > 165) & ((mx - mn) < 30)
    # Erode hard first. The board touches the window and the wall through a few bright pixels,
    # and without this the "largest bright region" is the board plus half the room.
    er = ndimage.binary_erosion(bright, np.ones((25, 25)))
    lab, n = ndimage.label(er)
    if n == 0:
        sys.exit("could not find a board in this plate")
    sizes = ndimage.sum(er, lab, range(1, n + 1))
    keep = int(np.argmax(sizes)) + 1
    return ndimage.binary_dilation(lab == keep, np.ones((25, 25))) & bright


def quad_of(m):
    """Four corners of the writable surface, from rows sampled inside the mask."""
    ys = np.where(m.any(1))[0]
    y0, y1 = ys.min(), ys.max()
    rows = []
    for f in np.linspace(0.08, 0.92, 9):
        r = int(y0 + (y1 - y0) * f)
        c = np.where(m[r])[0]
        if len(c) > m.shape[1] * 0.3:
            rows.append((r, c.min(), c.max()))
    if len(rows) < 3:
        sys.exit("the board's edges could not be measured")
    # fit each side as a line through the sampled rows, so a tilt is carried rather than lost
    rr = np.array([r for r, _, _ in rows], dtype=float)
    ll = np.array([l for _, l, _ in rows], dtype=float)
    hh = np.array([h for _, _, h in rows], dtype=float)
    lf, hf = np.polyfit(rr, ll, 1), np.polyfit(rr, hh, 1)
    top, bot = float(rows[0][0]), float(rows[-1][0])
    return [[np.polyval(lf, top), top], [np.polyval(hf, top), top],
            [np.polyval(hf, bot), bot], [np.polyval(lf, bot), bot]]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, type=Path)
    ap.add_argument("--src", default="board.png")
    ap.add_argument("--write", action="store_true")
    A = ap.parse_args()
    P = A.project.resolve()
    src = P / "art" / "plate" / A.src
    if not src.exists():
        sys.exit(f"no plate at {src} - run gen-art.py --plate first")

    im = Image.open(src).convert("RGB")
    m = board_mask(im)
    ys, xs = np.where(m.any(1))[0], np.where(m.any(0))[0]
    by0, by1, bx0, bx1 = ys.min(), ys.max(), xs.min(), xs.max()
    bw, bh = bx1 - bx0, by1 - by0
    print(f"plate {im.size}   board bbox x {bx0}..{bx1}  y {by0}..{by1}")

    # crop: side edges run out of shot, a band of room above, a sliver below
    cx0 = bx0 + bw * 0.03
    cx1 = bx1 - bw * 0.03
    cy1 = min(im.height, by1 + bh * 0.04)
    cw = cx1 - cx0
    ch = cw * H / W
    cy0 = cy1 - ch
    if cy0 < 0:                                  # not enough room above: widen instead
        cy0, ch = 0.0, cy1
        cw = ch * W / H
        mid = (cx0 + cx1) / 2
        cx0, cx1 = mid - cw / 2, mid + cw / 2
    box = (int(cx0), int(cy0), int(cx0 + cw), int(cy0 + ch))
    crop = im.crop(box).resize((W, H), Image.LANCZOS)
    sx, sy = W / cw, H / ch
    print(f"crop {box}  ->  {W}x{H}")

    q = quad_of(board_mask(crop))
    # INSET. The render crops at ZOOM about the centre, so plate y maps to
    # screen = (y - (H/2 - H/(2*ZOOM))) * ZOOM. Solve that for the safe zone and keep the quad
    # inside it, with a little slack for the handheld drift.
    off = H / 2 - H / (2 * ZOOM)
    lo = SAFE_T / ZOOM + off + 6
    hi = SAFE_B / ZOOM + off - 6
    for p in q:
        p[1] = min(max(p[1], lo), hi)
    q[0][0] += MARGIN; q[3][0] += MARGIN
    q[1][0] -= MARGIN; q[2][0] -= MARGIN
    # A tight crop makes the board overflow the frame, so its writable surface runs nearly edge
    # to edge and the quad came out at x 10..1065. Content drawn there touches the frame. Hold
    # it inside a side margin as well as inside the board.
    for pt in q:
        pt[0] = min(max(pt[0], SIDE), W - SIDE)
    q = [[int(round(x)), int(round(y))] for x, y in q]
    print(f"writable quad (inset, inside the safe zone): {q}")

    if not A.write:
        print("\nDRY RUN. Pass --write to save board-final.png and the quad.")
        return
    dest = P / "art" / "plate" / "board-final.png"
    crop.save(dest)
    ep = P / "episode.json"
    EP = json.loads(ep.read_text(encoding="utf-8")) if ep.exists() else {}
    EP["plate"], EP["quad"] = "board-final.png", q
    ep.write_text(json.dumps(EP, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {dest}\nwrote {ep} (plate + quad)")


if __name__ == "__main__":
    main()
