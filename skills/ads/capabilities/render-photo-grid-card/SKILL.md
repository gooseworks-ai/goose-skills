---
name: render-photo-grid-card
description: Render a 'photo-grid promo card' video from a config — a real-DOM card with a FIXED header/footer and a CONTINUOUSLY SCROLLING 2-row grid of MIXED tiles (video clips, product/lifestyle stills, big-serif %-OFF, dark promo-code or CTA) + feature chips, frame-stepped via Playwright with real-time <video> playback and encoded with FFmpeg — deterministic assembly, FREE (the clips + music come from create-video-fal + create-music-elevenlabs), text stays pixel-crisp. Use for the photo-grid-promo-card format.
status: active
---

# render-photo-grid-card

Render the 'photo-grid promo card' format from a config. The signature of this format is a
**continuously scrolling 2-row grid** (NOT a static card) under a fixed header (brand
wordmark + big headline + sub) and fixed feature chips. The grid-viewport scrolls left
across the whole ~10s, edge-faded with a CSS mask, and its tiles are **mixed media**:
`video` clips playing inside tiles, `band-product`/`photo` stills, big-serif `pct`/`off`
type tiles, and a dark `code` (promo code) or `cta` tile.

The renderer itself is FREE/deterministic (Playwright frame-step + FFmpeg). The paid inputs
are separate capabilities: the tile **clips** come from `create-video-fal` (i2v of the
product heroes, or clips extracted from the brand's own ad corpus) and the **music** from
`create-music-elevenlabs`. Text (wordmark, %, code) is real DOM — never AI-rendered.

## Run
build_card.py --config config.json --out hyperframe.html ; render.py --config config.json --html hyperframe.html --out master-silent.mp4 — 1080x1920, scrolling grid, deterministic, $0.

Clip tiles are driven by FRAME-SWAP, not `<video>`: `render.py` pre-extracts each clip to
PNG frames with ffmpeg, preloads them, and swaps each `<img class="vidframe">`'s src per
output frame. This is because Playwright's bundled Chromium can't decode `<video>` H.264
over file:// (open-source build, no proprietary codecs) — it hangs on `canplay`. Letting
ffmpeg decode makes it codec-independent AND deterministic. Provide clips longer than the
master (or the swap just loops them); a subtle `setpts`-slow reads as cinematic.

## Contract
- Deterministic + FREE (Playwright frame-step + FFmpeg); no paid calls in this capability.
- Tiles-per-row = grid columns (`cols`), NOT total tiles; the grid fills row-major.
- The template recipe (DB) supplies the config; clips + music are separate capabilities.
