---
name: render-photo-grid-card
description: >-
  Render a designed 'photo-grid promo card' video from a config: a real-DOM HTML card (wordmark + headline + 2xN tile grid of product/lifestyle/%-OFF/promo-code + feature chips) frame-stepped to PNG via Playwright and encoded with FFmpeg. Deterministic, FREE (no paid calls), text stays pixel-crisp. The template recipe supplies the config; music is added separately (create-music-elevenlabs). Use for the photo-grid-promo-card format.
status: active
---

# render-photo-grid-card

Render a designed 'photo-grid promo card' video from a config: a real-DOM HTML card (wordmark + headline + 2xN tile grid of product/lifestyle/%-OFF/promo-code + feature chips) frame-stepped to PNG via Playwright and encoded with FFmpeg. Deterministic, FREE (no paid calls), text stays pixel-crisp. The template recipe supplies the config; music is added separately (create-music-elevenlabs). Use for the photo-grid-promo-card format.

## Run
build_card.py --config config.json --out hyperframe.html ; render.py --config config.json --html hyperframe.html --out master-silent.mp4 — 1080x1920, deterministic, $0.

## Contract
- Deterministic + FREE (Playwright frame-step + FFmpeg); no paid calls, no AI-rendered text.
- The template recipe (DB) supplies the card config; music is a separate capability.
