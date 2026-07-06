---
name: airdrop-notification-carousel-video
description: >-
  Produce a single vertical "AirDrop" share-sheet notification ad (about 6-8s,
  9:16) from a brand's real product photos — the viral iOS AirDrop trend ("Brand
  would like to share a ___ - Decline / Accept"), remixed for any brand. The
  native AirDrop card springs up and its preview window cycles through a carousel
  of real product images, landing on a range/lineup payoff with an Accept tap; a
  notification chime plus soft ticks track the swaps. The engine is deterministic
  — an HTML card (real DOM text) rendered to PNG, chroma-keyed, its preview window
  filled per-product in Pillow, then animated and audio-synthed with FFmpeg. No
  generative video, so the UI text and wordmark stay pixel-crisp and every product
  on screen is a real brand photo. Use when someone references the "AirDrop
  notification" / "would like to share" trend, wants a scroll-stopping product-
  carousel spot, or has a brand with product photography. Not for talking-head UGC
  video, and not for a static single-image ad (drop the carousel and export one
  frame). Needs python3 (numpy, Pillow), ffmpeg, and a headless Chrome (Playwright).
tags: [ads, content, social, design]
---

# airdrop-notification-carousel-video

## What it does

Recreates the viral **iOS "AirDrop" notification ad** — a native share-sheet card
("**Brand** would like to share a *doughnut* · Decline / Accept") with a product
photo in the preview — as a **product carousel** for any brand: the preview window
flips through many real product images and lands on a range/lineup payoff.

The reusable core is a **deterministic composite engine**: a real-DOM AirDrop card
is rendered once, chroma-keyed, and its preview window refilled per product, then
animated. This is deliberately **not** generative video — the whole point of the
format is crisp system-UI text and **real** product photography, both of which a
video model would smear. Nothing here calls a paid model; it runs entirely on
Playwright + Pillow + FFmpeg.

Default output is about **6-8s** (`first_hold + N·per + final_hold`), 1080×1920,
h264 + aac.

## Inputs

Required:
- **Brand line** — sender name (bold, e.g. `acme.`) + message (`would like to share
  a candle`). Mirror the trend's noun-product joke.
- **Product images** — 6-16 ordered **real** product photos (the carousel). Clean
  on-white PDP hero shots work best; a lifestyle shot or two adds variety.
- **Final / payoff image** — the shot held at the end (a lineup / family / "whole
  range" image reads as "the entire collection").

Optional:
- **Wordmark** — a brand logo SVG (inlined into the band) or a text fallback.
- **Tagline** — the band line under the wordmark (e.g. a real proof point like
  `100k+ sold` — use only true claims the brand actually makes).
- **Accent** — the Accept-button / brand color (default rose `#d98695`); **band
  color** (default cream `#f5e9da`).
- **Timing** — `per` (seconds per image, default 0.34), `first_hold` (1.0),
  `final_hold` (2.1), `slide` (0.72). Lower `per` = more frenetic.

## Engine (scripts/)

| Script | Does |
|---|---|
| `build_card.py` | Brand params → `chrome.html` + `chrome-pressed.html`: the AirDrop card on a **green page** (`#00e000`) with a **magenta preview window** (`#ff00ff`) and a solid brand band. Text is real DOM — never AI-rendered. |
| `one_shot.py` | Glue: `build_card` → headless-Chrome screenshot of both card states (Playwright) → `compose_carousel`. One JSON config, one MP4. |
| `compose_carousel.py` | The render engine: green-key the card → detect the magenta window → fill it with each product (cover-crop) → blurred per-product backdrop with a slow push-in → card spring-up + carousel + Accept tap → synth audio (whoosh / chime / ticks / pop) → encode h264 + aac. |

**Chroma contract (load-bearing):** `#00e000` green = page background (keyed to the
card's alpha), `#ff00ff` magenta = preview window (replaced per product). Neither
color may appear in the card art or the product photos.

Install deps: `pip install numpy Pillow playwright && playwright install chromium`,
and have `ffmpeg` on `PATH`.

## Workflow

### 1 — Gather real assets
Collect the brand line, a wordmark (SVG or text), the accent color, 8-14 ordered
product photos, and a payoff image. Pull product photos from the brand's site or
your own library — **use real photos**, never AI-generated products, and never
invent proof claims (a `100k+ sold` band must be the brand's own figure). If your
product files are git-LFS pointers, materialize them before rendering.

### 2 — Build the card
```
python3 scripts/build_card.py --brand "acme." --message "would like to share a candle" \
  --tagline "The best-selling scent - 100k+ sold" \
  --wordmark-svg logo.svg --accent "#d98695" --out-dir work/
```

### 3 — Screenshot both card states
Render `work/chrome.html` and `work/chrome-pressed.html` to PNG with a headless
Chrome (fullPage) → `chrome-green.png` / `chrome-green-pressed.png`. `one_shot.py`
does this with Playwright; any headless Chrome (Puppeteer, etc.) works. A dpr-2
screenshot (2160×3840) is fine — the engine rescales.

### 4 — Compose
```
python3 scripts/compose_carousel.py \
  --chrome work/chrome-green.png --chrome-pressed work/chrome-green-pressed.png \
  --images "p1.png,p2.png,p3.png,..." --final-image lineup.jpg --out ad.mp4
```
Or do steps 2-4 in one call from a JSON config:
```
python3 scripts/one_shot.py --config config.json --out ad.mp4
```

### 5 — Watch / QC
Extract a frame strip across the timeline; confirm every product **fully fills**
the window (no magenta), the card text + wordmark are crisp, the carousel reads, it
lands on the payoff + Accept tap, and audio ticks track the swaps. Fix, re-compose,
re-watch.

## Config schema (one_shot.py)

```json
{
  "brand": "acme.",
  "message": "would like to share a candle",
  "tagline": "The best-selling scent - 100k+ sold",
  "wordmark_svg": "logo.svg",
  "accent": "#d98695",
  "band_color": "#f5e9da",
  "images": ["p1.png", "p2.png", "p3.png"],
  "final_image": "lineup.jpg",
  "timing": {"per": 0.34, "first_hold": 1.0, "final_hold": 2.1, "slide": 0.72}
}
```

## Decision rules

- **Real product photos only.** The format's credibility is that these look like
  real AirDropped items. No AI-generated products in the carousel.
- **Never AI-render text.** Card UI, wordmark, and band are DOM / SVG composited, so
  `AirDrop`, `Decline`, `Accept`, and the brand line stay sharp. Image models
  misspell even short known strings — keep all text in the DOM layer.
- **Cover-crop the window.** A white-bg PDP shot reading as "product floating in a
  white tile" is on-brand and fine; warm/lifestyle shots fill edge-to-edge.
- **End on the range.** The payoff image should say "the whole line" (lineup /
  family / all-variants) — the carousel builds to it.
- **Hard cuts, on rhythm.** Trend aesthetic = snappy swaps + a tick per swap. Don't
  crossfade.
- **Duration is derived**, not trimmed: `first_hold + (N-1)·per + final_hold`. Add
  images or raise `per` to lengthen; don't cut the audio short.

## Output

- `<name>.mp4` — 1080×1920, about 6-8s, h264 + aac (chime + per-swap ticks + Accept
  pop).
- A poster still (extract a payoff frame).

## Quality checks

- No green/magenta leaks anywhere in-frame.
- Card title, brand line, wordmark, and buttons are crisp at 1080p.
- 6 or more distinct real product images cycle; each fully fills the window.
- Lands on the payoff image + a visible Accept tap-highlight.
- Audio: chime on card-land, a tick on each swap, a pop on the tap.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Tiny broken images in the window | Product files were git-LFS pointers | Materialize the real files before rendering. |
| Green halo around the card, or magenta showing in the window | A product photo contains near-pure green/magenta, or the key thresholds are off | Swap the image, or tighten `window_mask` / `key_green` thresholds in `compose_carousel.py`. |
| Screenshot step fails | No headless Chrome | `pip install playwright && playwright install chromium`, or screenshot with another headless Chrome and call `compose_carousel.py` directly. |
| Baked-in text on a product shot shows in the window (e.g. `SHADE 02`) | The source photo has burned-in labels | Usually fine (reads as real PDP art); reorder or cover-crop tighter if it clashes. |
