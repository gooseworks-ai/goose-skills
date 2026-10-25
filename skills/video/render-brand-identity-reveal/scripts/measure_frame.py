#!/usr/bin/env python3
"""Detect the bright blank poster interior in the plate and report its 4 corners."""
import numpy as np
from PIL import Image, ImageDraw

im = Image.open("bg/plate_final.png").convert("RGB")
a = np.asarray(im).astype(np.int32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
mx = a.max(2); mn = a.min(2)
val = mx
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
# poster interior: bright, low saturation, near-neutral (not green wall, not tan frame)
mask = (val > 150) & (sat < 0.16) & (np.abs(R - G) < 26) & (np.abs(G - B) < 26)

# keep the largest connected component via simple flood using scipy if present, else bbox of mask
try:
    from scipy import ndimage
    lbl, n = ndimage.label(mask)
    if n:
        sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
        biggest = int(np.argmax(sizes)) + 1
        mask = lbl == biggest
except Exception as e:
    print("no scipy, using raw mask:", e)

ys, xs = np.where(mask)
s = xs + ys
d = xs - ys
tl = (xs[np.argmin(s)], ys[np.argmin(s)])
br = (xs[np.argmax(s)], ys[np.argmax(s)])
tr = (xs[np.argmax(d)], ys[np.argmax(d)])
bl = (xs[np.argmin(d)], ys[np.argmin(d)])
print("bbox:", xs.min(), ys.min(), xs.max(), ys.max())
print("TL", tl, "TR", tr, "BR", br, "BL", bl)

# draw for verification
g = im.copy(); dr = ImageDraw.Draw(g)
for p, c in [(tl, (255, 0, 0)), (tr, (0, 120, 255)), (br, (255, 0, 255)), (bl, (0, 200, 0))]:
    dr.ellipse([p[0]-10, p[1]-10, p[0]+10, p[1]+10], fill=c)
dr.line([tl, tr, br, bl, tl], fill=(255, 0, 0), width=3)
g.save("bg/plate_corners.png")
with open("bg/corners.txt", "w") as f:
    f.write(repr({"tl": tl, "tr": tr, "br": br, "bl": bl}))
print("saved plate_corners.png")
