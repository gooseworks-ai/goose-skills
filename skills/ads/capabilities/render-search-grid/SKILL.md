---
name: render-search-grid
description: Render a 'search-grid' (Pinterest search-moodboard) video from a config — a real-DOM page with four continuous beats (masonry search grid + typing hook with counter-drift columns → 3 cards slide in from the right and stack → the top card box-grows to fullscreen then swipe-left ×2 through captioned feature shots → warm end card), frame-stepped via Chromium and encoded with FFmpeg — deterministic assembly, FREE (real brand photos + logo; the optional music bed comes from create-music-elevenlabs), so type/logo/photos stay pixel-crisp. Use for the search-grid format.
status: active
---

# render-search-grid

Render the 'search-grid' format from a config. It is a **deterministic** assembler — no
generative image/video, no AI-rendered text. Everything on screen is the brand's REAL
product/lifestyle photography + logo, so the typed hook, feature captions, wordmark, and
photos stay pixel-crisp. The **only** paid input is an optional music bed, produced upstream
by `create-music-elevenlabs` and passed to `render.py --music`.

## The format (four beats, one continuous ~18s motion piece, 1080×1920)

1. **Search** (0–5s) — a 3-column masonry grid of the brand's catalog behind a Pinterest
   search bar; a believable phrase types in letter-by-letter. Side columns drift DOWN, the
   middle column drifts UP (counter-parallax).
2. **Cards** (5–7s) — 3 room/product cards slide in from the RIGHT and stack over a warm
   blurred backdrop.
3. **Features** (7–14.5s) — the TOP card **physically expands** (its box grows from the
   stacked rect to full-screen, animating width/height — NOT `transform:scale`, which would
   stretch the image), then **swipe-left → swipe-left** through the SAME 3 rooms, each now
   full-bleed with a caption. The 3 cards ARE the 3 features.
4. **End card** (14.5–18s) — hero + wordmark + tagline + CTA on a warm background.

## Scripts (all free / deterministic)

- `scripts/build_html.py --config config.json --out index.html` — config → a single
  self-contained HTML page exposing `window.seek(tMs)` (images base64-embedded).
- `scripts/capture.js --html index.html --out frames --fps 30 --duration 18000` — headless
  Chromium frame-steps `seek()` to a PNG per frame (auto-discovers a cached Playwright
  chromium, or pass `--exe`).
- `scripts/render.py --config config.json [--music bed.m4a] --out master.mp4` — orchestrates
  build → capture → FFmpeg (muxes the bed with `-map 0:v:0 -map 1:a:0` when `--music` is
  given; `$0` silent pass without it).
- `scripts/prep_assets.py crop in.jpg out.jpg` / `logo logo.jpg wordmark.png` — the two
  fixes this format needs almost every time: crop baked-in white L/R margins off heroes, and
  key the white out of a black-on-white logo JPG to a transparent PNG.

See `scripts/config.example.json` for the full config shape (a real worked example).

## Config contract (bound by the recipe/orchestrator at remix time)

`canvas`, `hook`, `grid_cols` (3 columns × 6 distinct tiles), `rooms` (exactly 3
`{image, caption}` — the cards AND the features), `stack_bg` (blurred warm backdrop),
`endcard` (`hero`, `wordmark`, `tagline`, `cta`, `bg`). Craft rules the renderer assumes the
inputs already honor: real brand assets only; 6 distinct tiles/column so the drift never
repeats; warm (never near-white) backdrops; cropped hero margins; transparent-bg wordmark;
captions/tagline/CTA are the brand's OWN approved copy (no invented claims).

## Prereqs

`node` + `playwright-core` (or a cached Playwright chromium) and `ffmpeg` on PATH; `python3`
with Pillow (for `prep_assets.py`).
