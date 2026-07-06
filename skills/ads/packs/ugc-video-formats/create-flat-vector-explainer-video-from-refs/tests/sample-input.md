# Sample Input

## Brief
A flat-vector product-routine explainer for **Spoiled Child** — one illustrated
creator-character walks through the **4-product morning routine** (collagen drink → face
serum → eye cream → hair treatment), one step per beat, each with a large corner numeral,
a labelled chip + tagline, and the step's real product photo. Character scenes are Kling
i2v (subtle motion, flat-vector held); all text is an animated Remotion overlay; the
closing "4 is enough." grid is a PIL composite of the 4 real product photos. Full-sentence
eleven_v3 VO + word-by-word captions + lo-fi music. Vertical 9:16, ~30s (cut from a ~50s
master).

## Concept
- Single countable point: **the perfect morning routine is just 4 products** (not twenty).
- Motif: **"THE PERFECT ROUTINE = 4 PRODUCTS"** → **"4 is enough."** → CTA.
- Concept label: **morning routine** (NOT "skincare" — step 4 is a hair treatment).

## Assets (git-LFS — fetch+checkout first)
- character: re-render a FRESH flat-vector anchor at `assets/character-lock/creator-anchor.png`
  (style-descriptor only from the brand's photoreal character — never a chained ref).
- real product webps (per-step callout + closing grid):
  `assets/products/{e27-main-bottle,s33-bottle-close,t31-main-product,h30-main-product}.webp`

## Scenes (10 beats)
1. hook (20 products, "Why?") · 2. beat · 3. slate "THE PERFECT ROUTINE = 4 PRODUCTS"
· 4. 01 collagen drink · 5. 02 face serum · 6. 03 eye cream · 7. 04 hair treatment
· 8. PIL grid "4 is enough." · 9. mirror callback · 10. CTA "Build your morning routine →"

Character scenes (1,2,4,5,6,7,9) = Kling i2v. Slate/grid/CTA (3,8,10) = Remotion text.

## VO + music
- VO: ElevenLabs **Eryn** (`dMyQqiVXTU80dDl2eNK8`), eleven_v3, with-timestamps, full sentences.
- Music: lo-fi pop 95–105 BPM, VO-forward, instrumental.

Full config: `scripts/config.example.json`. Reference render:
`demo/finals/spoiled-child-perfect-morning-routine.mp4`.
