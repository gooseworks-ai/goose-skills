# Expected output — remix-graphic-ad-from-reference

For the sample input:

- `finals/<brand-slug>-<headline-slug>_<WxH>.png` — finished ad matching the reference layout:
  sky bg, product centered, headline "Start feeling good, / from the gut.", three benefit callouts
  with arrows, ★★★★★ + "10,000+ happy customers" + brand URL, scalloped "up to 45% OFF your first
  order" seal in brand colors.
- If routed **html**: also `working/index.html` + `working/<product>-cutout.png` (editable copy/price).
- If routed **gpt_image_2**: also `working/ai-gen/gpt-v1.png` +
  `working/ai-gen/PROVENANCE.md` (URL, model, prompt, credits).
- A route + cost record, e.g. `route=html reason="product on flat bg" gen=$0`, or `route=gpt_image_2 reason="real hand-held product" credits=7 (~$0.33)`.

## Acceptance
- Copy + discount exactly as supplied; label undistorted; no colliding text; legible at thumbnail.
- Dimensions match the requested aspect mapped to a goose-graphics canvas (×2 device scale on HTML path).
