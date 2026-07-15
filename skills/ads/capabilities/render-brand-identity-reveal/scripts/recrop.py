#!/usr/bin/env python3
"""Re-crop the high-res plate tighter (closer camera) so the frame is bigger.
Detects the poster interior in the original, then crops a 9:16 window that puts the
interior at a target width fraction, keeping wall above and the plant in the corner."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage

SRC = "bg/plate_sage_1.png"
FRAC = float(sys.argv[1]) if len(sys.argv) > 1 else 0.72   # interior width / output width
TOP_FRAC = float(sys.argv[2]) if len(sys.argv) > 2 else 0.13  # interior top as frac of output H

im = Image.open(SRC).convert("RGB")
W0, H0 = im.size
a = np.asarray(im).astype(np.int32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
mx = a.max(2); mn = a.min(2)
val = mx; sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
mask = (val > 150) & (sat < 0.16) & (np.abs(R - G) < 26) & (np.abs(G - B) < 26)
lbl, n = ndimage.label(mask)
sizes = ndimage.sum(np.ones_like(lbl), lbl, range(1, n + 1))
mask = lbl == (int(np.argmax(sizes)) + 1)
ys, xs = np.where(mask)
ix0, iy0, ix1, iy1 = xs.min(), ys.min(), xs.max(), ys.max()
iw, ih = ix1 - ix0, iy1 - iy0
icx = (ix0 + ix1) / 2
print("interior in original:", ix0, iy0, ix1, iy1, "w,h", iw, ih)

# crop width so interior spans FRAC of output width
CW = iw / FRAC
CH = CW * 1920 / 1080
scale = 1080 / CW
# horizontal: center on interior center
cx0 = icx - CW / 2
# vertical: interior top at TOP_FRAC of output
cy0 = iy0 - (TOP_FRAC * 1920) / scale
# clamp inside original
cx0 = max(0, min(cx0, W0 - CW))
cy0 = max(0, min(cy0, H0 - CH))
box = (int(round(cx0)), int(round(cy0)), int(round(cx0 + CW)), int(round(cy0 + CH)))
print("crop box:", box, "-> scale", round(scale, 3))
crop = im.crop(box).resize((1080, 1920), Image.LANCZOS)
crop.save("bg/plate_final.png")
print("saved bg/plate_final.png")
