# Expected Output

## Artifacts
- `master-final.mp4` — 1080×1920, ≈10s, 25fps, **h264** (+ aac music bed; silent
  with `--no-music`). Exactly 250 frames at 10s/25fps.
- `hyperframe.html` — the built promo card (real DOM; reusable for re-renders).
- A poster still (any late frame — the card is static after ~2s).

## Visual shape (per frame, once landed)
- Brand **wordmark** centered at top; a big bold **headline** (+ optional sub) under it.
- A **2×3 grid** of six tiles: one `product` tile (real product contained on a soft
  band), `photo` tiles (real lifestyle images, cover-cropped), one `off` tile (big
  serif "% OFF"), one `code` tile (dark, promo code with an accent-colored prefix).
- A row of outlined **feature chips** near the bottom.

## Motion + audio
- 0–~2s: brand fades in → headline drops in → sub fades → tiles slide in from the
  right on a staggered beat → chips fade up. Then the whole card holds static.
- Music (if present): an instrumental bed energetic from t=0 (no sparse intro),
  fading the last 0.5s. No VO, no dialogue.

## Non-goals
- No generative video, no talking head, no captions.
- No AI-rendered wordmark/%/code/copy (all DOM/SVG — always crisp).
- No invented offer: the "% OFF" and promo code are the brand's own approved figures.
