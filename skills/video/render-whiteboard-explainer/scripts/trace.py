#!/usr/bin/env python3
"""Turn a generated line drawing into ordered STROKES the page can draw itself. Free.

    python vectorise.py --project <dir>

Reads  <project>/art/*.png        black line art on white, from gen-vignettes.py
Writes <project>/art/paths.json   {name: ["M ... L ...", ...]} on a 100x100 grid

Why not just show the PNG. The whole format is that a mark appears as its word is spoken, and a
raster cannot draw itself stroke by stroke. Tracing the drawing's CENTRELINES gives real paths,
which drop straight into the existing `icon` machinery: measured length, stroke-dasharray
write-on, and a pen nib that follows the ink. Nothing downstream has to change.

Centrelines, not outlines. Tracing the contour of a 6px marker stroke gives a loop around it,
so animating that draws a long thin sausage rather than a line. Skeletonising first collapses
each stroke to one pixel wide, and then the trace IS the stroke.

Order matters: strokes are emitted longest-first, because that is the order a hand works in -
the big shapes, then the detail inside them.
"""
import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from skimage.morphology import skeletonize

N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def trace(skel):
    """Walk a 1px skeleton into polylines, breaking at junctions and endpoints."""
    H, W = skel.shape
    pts = {(y, x) for y, x in zip(*np.nonzero(skel))}
    deg = {p: sum((p[0] + dy, p[1] + dx) in pts for dy, dx in N8) for p in pts}
    used = set()
    lines = []

    def walk(start, first):
        line = [start, first]
        used.add(frozenset((start, first)))
        cur, prev = first, start
        while deg.get(cur, 0) == 2:
            nxt = None
            for dy, dx in N8:
                q = (cur[0] + dy, cur[1] + dx)
                if q in pts and q != prev and frozenset((cur, q)) not in used:
                    nxt = q
                    break
            if nxt is None:
                break
            used.add(frozenset((cur, nxt)))
            line.append(nxt)
            prev, cur = cur, nxt
        return line

    # open strokes first: start at every endpoint and every junction
    for p in sorted(pts, key=lambda p: (deg[p] != 1, p)):
        if deg[p] == 2:
            continue
        for dy, dx in N8:
            q = (p[0] + dy, p[1] + dx)
            if q in pts and frozenset((p, q)) not in used:
                lines.append(walk(p, q))
    # anything left is a closed loop with no endpoint
    for p in pts:
        for dy, dx in N8:
            q = (p[0] + dy, p[1] + dx)
            if q in pts and frozenset((p, q)) not in used:
                lines.append(walk(p, q))
    return lines


def to_paths(png, grid=100.0, min_len=14, eps=1.1, dot_area=26, dot_size=7):
    img = cv2.imread(str(png), cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise RuntimeError(f"cannot read {png}")
    # the generated art is near-pure black on near-pure white, so a mid threshold is safe;
    # Otsu would chase JPEG-ish noise in the white field.
    ink = (img < 128).astype(np.uint8)
    if ink.sum() == 0:
        raise RuntimeError(f"{png.name} has no ink at all")
    # Dots are not speckle. Skeletonising a 4px grain leaves one pixel, which the length filter
    # then throws away -- and in the first test that deleted the entire stream of falling
    # powder, which is the ACTION in the drawing. Small blobs are pulled out first and kept as
    # their own short marks.
    nlab, lab, stats, cent = cv2.connectedComponentsWithStats(ink, connectivity=8)
    dots = []
    keep = np.ones_like(ink)
    for i in range(1, nlab):
        a = stats[i, cv2.CC_STAT_AREA]
        w_, h_ = stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
        if a <= dot_area and max(w_, h_) <= dot_size:
            dots.append((cent[i][0], cent[i][1]))
            keep[lab == i] = 0
    skel = skeletonize((ink * keep).astype(bool))
    lines = trace(skel)

    # crop to the drawing and scale into a grid box, keeping aspect
    ys, xs = np.nonzero(ink)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    span = max(y1 - y0, x1 - x0) or 1
    k = grid / span
    ox = (grid - (x1 - x0) * k) / 2
    oy = (grid - (y1 - y0) * k) / 2

    out = []
    for line in lines:
        if len(line) < min_len:
            continue                      # speckle, not a stroke
        pl = np.array([[p[1], p[0]] for p in line], dtype=np.float32).reshape(-1, 1, 2)
        pl = cv2.approxPolyDP(pl, eps, False).reshape(-1, 2)
        if len(pl) < 2:
            continue
        d = " ".join(
            ("M" if i == 0 else "L") + f" {(px - x0) * k + ox:.1f} {(py - y0) * k + oy:.1f}"
            for i, (px, py) in enumerate(pl))
        out.append((len(line), d))
    # longest first: the big shapes before the detail inside them
    out.sort(key=lambda t: -t[0])
    paths = [d for _, d in out]
    # dots last, as a hand would flick them in after the shapes they belong to
    for cx, cy in dots:
        x = (cx - x0) * k + ox
        y = (cy - y0) * k + oy
        paths.append(f"M {x:.1f} {y:.1f} L {x + 0.55:.1f} {y:.1f}")
    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, type=Path)
    ap.add_argument("--dir", type=Path,
                    help="folder holding the drawings; paths.json is written beside them. "
                         "Default: <project>/art")
    ap.add_argument("--min-len", type=int, default=14)
    A = ap.parse_args()
    art = A.dir.resolve() if A.dir else A.project.resolve() / "art"
    if not art.is_dir():
        sys.exit(f"no drawings folder at {art}")
    paths = {}
    # hand*.png is a photograph, not line art, and tracing it produced 72 nonsense "strokes"
    # that would have shown up as a selectable vignette.
    for png in sorted(art.glob("*.png")):
        if png.stem.startswith("hand") or png.stem.startswith("_"):
            continue
        p = to_paths(png, min_len=A.min_len)
        paths[png.stem] = p
        tot = sum(len(x.split(" L ")) for x in p)
        print(f"  {png.stem:12s} {len(p):3d} strokes, {tot:5d} points")
    (art / "paths.json").write_text(json.dumps(paths, indent=1), encoding="utf-8")
    print(f"wrote {art / 'paths.json'}")


if __name__ == "__main__":
    main()
