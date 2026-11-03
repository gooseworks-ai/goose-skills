# Smoke test — remix-graphic-ad-from-reference

**Goal:** route a known reference→product pair and produce a finished PNG with correct copy.

## Steps
1. Provide a reference ad image (e.g. a product+sky+text Pinterest pin), a clean product render
   PNG, and copy changes (headline, 3 callouts, social-proof line, discount %).
2. Run the skill with `route_hint=auto`.
3. Confirm it writes its anatomy paragraph, picks a route, and explains why.

## Pass criteria
- A PNG is written to `finals/` at the requested dimensions (e.g. 1080×1350 → 2160×2700 on HTML path).
- The product label/logo is present and undistorted.
- Every supplied copy string appears, correctly spelled, and the discount value matches the input.
- A route + cost line is recorded (engine used, why, credits spent if AI).
- HTML path additionally leaves an editable `working/index.html` + product cutout.

## Quick checks
```bash
# dimensions
python3 -c "from PIL import Image;print(Image.open('finals/<out>.png').size)"
# non-empty
test -s finals/<out>.png && echo OK
```
