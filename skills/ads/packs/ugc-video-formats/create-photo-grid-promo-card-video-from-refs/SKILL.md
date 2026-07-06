---
name: create-photo-grid-promo-card-video-from-refs
description: >-
  Produce a single vertical "photo-grid promo card" ad (≈10s, 9:16) from a
  brand's real assets — a designed feed card that animates in: brand wordmark,
  a big bold headline + sub, a 2×3 grid of six tiles (real product on a soft
  band, lifestyle photos, a big-serif "% OFF" tile, a dark promo-CODE tile), and
  a row of outlined feature chips, all sliding in from the right on a staggered
  beat then holding. Engine is DETERMINISTIC — a real-DOM HTML card frame-stepped
  to PNG per frame via Playwright, encoded with FFmpeg, over a music bed. NO
  generative video and NO AI-rendered text, so the wordmark, %, code, and copy
  stay pixel-crisp. Use when the user wants a seasonal/promo/offer feed card
  (Father's Day, sale, launch) built from real product photos + an offer, or
  points at a "photo-grid / promo-card" reference. NOT for a talking-head UGC
  video (use create-ugc-*-video-from-refs) and NOT for a system-UI trend
  (use the airdrop / imessage composite molecules).
status: active
---

# create-photo-grid-promo-card-video-from-refs

## Purpose

Recreate the **designed "promo card" feed ad**: a branded card — wordmark, a big
headline, a 2×3 grid of product + lifestyle + offer tiles, and feature chips —
that animates in with a staggered slide-in and holds. It reads as a premium DTC
brand's own seasonal/offer creative (a Father's Day gift card, a sale card, a
launch card), not as UGC. The canonical worked example is Hume Health's "For dad,
by Hume." Father's Day band promo (`demo/`).

This is the **third member of the composite sub-family** (alongside
`create-airdrop-notification-carousel-video-from-refs` and
`create-imessage-notification-cascade-video-from-refs`): everything is a real-DOM
HTML card **frame-stepped** to PNG and encoded — the whole point is that the
wordmark, the "25% OFF", the promo code, and the copy stay **pixel-crisp**, which
a video model would smear. No generative video, no lip-sync, no captions. The
**only** paid step is an optional ElevenLabs music bed (~$0.30); the card + render
are free and deterministic.

Use this when the brand has:
- A clean product image + a wordmark (SVG/PNG).
- An offer worth showing (a % off + a promo code), or feature flexes.
- 2–3 lifestyle photos (real; the grid mixes them with the product + type tiles).

## Inputs

Required (all in one `config.json` — copy `config.example.json`, which IS the Hume
worked example):
- **Wordmark** — brand logo (SVG or PNG path). Rendered as real DOM — never
  AI-generated.
- **Headline** — the big bold line (may contain `<br/>`), e.g. "For dad,<br/>by Hume."
- **6 tiles** — the 2×3 grid, each typed:
  - `product` — the real product image on a soft band (`object-fit: contain`).
  - `photo` — a lifestyle image (cover-cropped). Real photos only.
  - `off` — a big serif "% OFF" tile (`pct` + `label`).
  - `code` — a dark promo-code tile (`label`, `value`, optional `accent_prefix`
    to color the letters part of the code).

Optional (defaults in `config.example.json`):
- **Sub** — the line under the headline.
- **Chips** — outlined feature pills at the bottom (e.g. "14 DAY BATTERY").
- **Palette** — `ink / ink_soft / bg / bg_tile / bg_band / accent` (defaults to the
  Hume cyan set).
- **Music prompt** — ElevenLabs Music bed (default warm wellness, energetic from t=0).
- **Dims / fps / duration** — default 1080×1920, 25fps, 10s.

Assets are git-LFS in brand folders — **fetch + checkout each first** (pointers are
~131-byte stubs): `git lfs fetch --include="<path>" origin HEAD && git lfs checkout "<path>"`.

## Engine (scripts/)

| Script | Does |
|---|---|
| `one_shot.py` | Driver: `build_card → render → gen_music (PAID) → mux`. `--no-music` produces a silent master with **$0** spend. |
| `build_card.py` | Config → `hyperframe.html`: the full promo card (wordmark, headline, sub, 6 typed tiles, chips) with the staggered slide-in motion baked in. All text is real DOM. |
| `render.py` | Playwright frame-steps `hyperframe.html` — calls `window.renderAt(t)` per frame, screenshots, encodes with FFmpeg (crf18). Pure function of time → deterministic. |
| `_shared.js` | The renderer scaffold (`initRenderer` / `renderAt` / `clamp01` / `tw` / `easeOut`). Bundled into the card so motion is a pure function of `t`. |
| `gen_music.py` | **PAID.** ElevenLabs Music bed; energetic-from-t=0 prompt (no sparse intro on a 10s card), loudnorm −16, fades the tail. |

Requires Playwright chromium, `ffmpeg`, `requests`; `ELEVENLABS_API_KEY` from
`gtm-goose/.env` for the music step only.

## Workflow

### Phase 0 — Intake (real assets first)
Derive the checklist: wordmark, product image, headline/sub, the offer (% + code),
2–3 lifestyle photos, feature chips, palette. **Research the knowable unknowns
first** — pull the brand's real wordmark + product photo + palette from the brand
kit (`clients/<brand>/brand-assets/…`); LFS-fetch each. Ask only the true taste
calls (headline, which offer, which photos). Write `config.json`. **Never
AI-render the wordmark or invent proof — a "25% OFF / CODE DAD25" must be the
brand's real, operator-approved offer.**

### Phase 1 — Build + render the card [no paid calls]
`one_shot.py --config config.json --run-dir <run> --no-music`. This builds the HTML
and frame-steps a **silent** master — fully free. `/watch` it; tune copy, tiles,
palette, timings in `config.json`; re-render.

### Phase 2 — Music + mux [PAID — GATE]
`one_shot.py` without `--no-music` generates the ElevenLabs bed and muxes it.
**Wait for approval before the music call** (the only spend). If a screenshot times
out under Playwright, open the HTML in a fresh page target and retry, or screenshot
the frames via the chrome-devtools MCP and encode with `render.py`'s ffmpeg block.

### Phase 3 — Watch / QC (mandatory before ship)
`/watch` the master. Confirm: wordmark + headline + code + "% OFF" are crisp; every
photo tile fully fills its tile (cover-crop, no letterbox); the product tile reads
(contained on its band); tiles slide in on the beat then hold; the music kicks in
immediately (no dead intro). Fix `config.json`; re-render.

## Decision Rules

- **Never AI-render text.** Wordmark, headline, "% OFF", code, and chips are DOM/SVG
  composited so they stay sharp — a video model smears type.
- **Real product + real photos only.** The card's credibility is real brand assets;
  no AI-generated products in the grid.
- **Real offer only.** The "% OFF" and promo code are the brand's own approved figures.
- **Cover-crop photo tiles; contain the product tile.** Lifestyle photos fill
  edge-to-edge; the product sits on its soft band via `object-fit: contain`.
- **Staggered slide-in, then hold.** Brand → headline → sub → tiles (right-to-left
  stagger) → chips, all in the first ~2s; static hold for the rest. Don't loop-animate.
- **Motion is a pure function of `t`** (`renderAt(t)`) — keep it deterministic so the
  frame-step render is reproducible.

## Output

- `master-final.mp4` — 1080×1920, ≈10s, h264 (+ aac music). Silent variant with
  `--no-music`.
- A poster still (any late frame — the card is static after ~2s).
- `hyperframe.html` — the built card (keep for re-renders / edits).

## Quality Checks

- Canvas 1080×1920, 25fps, duration == `duration_sec`; exactly 250 frames at 10s/25fps.
- Wordmark, headline, "% OFF", promo code, chips all crisp at 1080p (no blur/smear).
- 6 tiles in a clean 2×3 grid; product tile contained on its band; photo tiles cover-cropped.
- Tiles slide in from the right on a staggered beat in the first ~2s, then hold static.
- Music (if present) is energetic from t=0 and fades the tail; silent variant is truly silent.

## Failure Modes

- **Broken image tile (tiny glyph)** → the tile's image is a git-LFS pointer (131
  bytes) or a missing path; fetch+checkout the real asset (`git lfs fetch --include
  … origin HEAD && git lfs checkout …`) or fix the path. A `photo` tile with no
  image falls back to a soft gradient placeholder by design.
- **Playwright missing / screenshot timeout** → `build_card.py` then screenshot the
  HTML via the chrome-devtools MCP at each frame time (`window.renderAt(t)`), then
  encode with `render.py`'s ffmpeg block.
- **Fonts not applied** → the card waits on `document.fonts.ready` (Fontshare
  Cabinet Grotesk + Zodiak); ensure network access at render, or self-host the woff2.
- **Sparse music intro on a 10s card** → the prompt says "energetic from t=0"; if the
  bed still ramps, raise `trim_intro_sec` to hard-trim the lead-in.
- **Grain/heavy-video temptation** → don't; the format's whole value is crisp static
  design. No generative video in the grid.

## Skill location & related

- Composite-render siblings authored the same way (real-DOM card → frame-step →
  ffmpeg): the AirDrop-carousel and iMessage-cascade formats.
- The remix twin — `remix-photo-grid-promo-card-from-sample` — is what the app's
  format tab calls; it swaps the brand into this builder's `config.json` and
  publishes the result back through the goose-video runtime.
