#!/usr/bin/env python3
"""Composite each standalone artwork into the lit poster frame of the photoreal plate.
Reintroduces the plate's real leaf-shadow/lighting onto the poster + adds glass sheen."""
import os, ast
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
PLATE = Image.open(os.path.join(HERE, "bg/plate_final.png")).convert("RGB")
W, H = PLATE.size
c = ast.literal_eval(open(os.path.join(HERE, "bg/corners.txt")).read())
# inset 4px so artwork never bleeds onto the wood frame
def inset(p, dx, dy): return (p[0] + dx, p[1] + dy)
TL = inset(c["tl"], 4, 4); TR = inset(c["tr"], -4, 4)
BR = inset(c["br"], -4, -4); BL = inset(c["bl"], 4, -4)
QUAD = [TL, TR, BR, BL]

OUT = os.path.join(HERE, "frames_v2"); os.makedirs(OUT, exist_ok=True)

def find_coeffs(output_pts, input_pts):
    A = []
    for (xo, yo), (xi, yi) in zip(output_pts, input_pts):
        A.append([xo, yo, 1, 0, 0, 0, -xi * xo, -xi * yo])
        A.append([0, 0, 0, xo, yo, 1, -yi * xo, -yi * yo])
    A = np.array(A, dtype=np.float64)
    B = np.array(input_pts, dtype=np.float64).reshape(8)
    return np.linalg.solve(A, B)

# --- shadow/light map from the empty plate interior (canvas space) ---
plate_np = np.asarray(PLATE).astype(np.float32)
luma = 0.2126 * plate_np[..., 0] + 0.7152 * plate_np[..., 1] + 0.0722 * plate_np[..., 2]
# reference "fully-lit" white = high percentile inside the quad bbox
xs = [p[0] for p in QUAD]; ys = [p[1] for p in QUAD]
sub = luma[min(ys):max(ys), min(xs):max(xs)]
ref = np.percentile(sub, 97)
mapf = np.clip(luma / max(ref, 1.0), 0.25, 1.0)
mapf = 1.0 - (1.0 - mapf) * 0.85          # 0.85 = shadow strength
mapf = np.stack([mapf] * 3, axis=-1)       # HxWx3

# glass sheen (soft diagonal highlight) + edge inner shadow, built once in quad space
sheen = Image.new("L", (W, H), 0)
sd = ImageDraw.Draw(sheen)
sd.polygon(QUAD, fill=0)
# a bright band across the upper-left of the poster
band = Image.new("L", (W, H), 0)
bd = ImageDraw.Draw(band)
bx0, by0 = TL; bx1 = TR[0]
bd.polygon([(bx0, by0), (bx0 + (bx1 - bx0) * 0.55, by0),
            (bx0, by0 + (BL[1] - by0) * 0.62)], fill=42)
band = band.filter(ImageFilter.GaussianBlur(70))
sheen_np = np.asarray(band).astype(np.float32)[..., None]

def coeffs_for():
    inp = [(0, 0), (1480 - 1, 0), (1480 - 1, 2136 - 1), (0, 2136 - 1)]
    return find_coeffs(QUAD, inp)

COEFFS = coeffs_for()

for i in range(1, 12):
    art = Image.open(os.path.join(HERE, f"art/art_std_{i:02d}.png")).convert("RGBA")
    warped = art.transform((W, H), Image.PERSPECTIVE, COEFFS, Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    wnp = np.asarray(warped).astype(np.float32)
    rgb = wnp[..., :3]; alpha = wnp[..., 3:4] / 255.0
    rgb = rgb * mapf                       # bake real leaf-shadow onto poster
    rgb = np.clip(rgb + sheen_np, 0, 255)  # glass sheen highlight
    out = plate_np.copy()
    out = out * (1 - alpha) + rgb * alpha  # alpha composite over plate
    Image.fromarray(out.astype(np.uint8)).save(os.path.join(OUT, f"frame_{i:02d}.png"))
    print("wrote", f"frame_{i:02d}.png")
