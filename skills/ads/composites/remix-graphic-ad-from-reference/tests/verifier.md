# Verifier — remix-graphic-ad-from-reference

Shared logic: `skills/verifiers/image/`.

## Automated
- **File exists + non-empty:** `finals/<out>.png` size > 0.
- **Dimensions:** equal the requested aspect mapped to a goose-graphics canvas
  (1080×1080, 1080×1350, or 1080×1920, × deviceScaleFactor 2 on the HTML path).
- **Alpha sanity (HTML path):** `working/<product>-cutout.png` has >2% transparent pixels
  (background actually removed) and a non-trivial opaque region (product survived).
- **Provenance (AI path):** `working/ai-gen/PROVENANCE.md` records engine, model, and credits.

```bash
python3 - <<'PY'
from PIL import Image; import numpy as np, sys, glob
f=glob.glob("finals/*.png")[0]; im=Image.open(f); print("size",im.size)
assert im.size[0] in (2160,) or im.size[0] in (1080,1856,1744), im.size
PY
```

## Vision (LLM) checks
- Layout matches the reference anatomy (same zones/reading order).
- Product label/logo correct and undistorted.
- All copy strings present + correctly spelled; discount value == input.
- No overlapping/illegible text; legible at 256px thumbnail.
