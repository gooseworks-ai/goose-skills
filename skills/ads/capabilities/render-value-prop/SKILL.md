---
name: render-value-prop
description: Render a designed 'value prop' video from a config — 3-5 noun-phrase benefit claims (<=4 words each) revealed sequentially over per-SKU product visuals, one crisp editorial frame per claim (hook sticker -> N claim beats -> brand end card). Deterministic PIL/HTML beat renderer frame-stepped via Playwright and encoded with FFmpeg, sound-off legible, hard cuts, uniform pacing. FREE (no paid calls); music is added separately (create-music-elevenlabs). Use for the value-prop format.
status: active
---

# render-value-prop

Render a designed 'value prop' video from a config: a hook sticker, then one beat per short noun-phrase benefit claim (<=4 words each — "Drug-Free", "Zero Sugar", "NSF Certified"), each pairing the claim headline with a per-SKU product visual (the hero SKU rotates beat to beat so the eye anchor shifts), then a brand-wordmark end card. Text + product carry the spot — no narration, no talking head — and it is built to be legible sound-off. Every beat is a pure function of beat-local time `t` (deterministic PIL start frames + Playwright hyperframes + FFmpeg); no CSS keyframes, no setTimeout. FREE (no paid calls); music is a separate capability (create-music-elevenlabs), or ship silent for $0.

## Run
`render_master.py --config config.json --project <dir>` -> `<dir>/finals/master-clean.mp4` (silent),
1080x1920, deterministic, $0. The renderer is **fully config-driven** — palette, copy, SKUs,
pacing, hook, logo and end card all come from `config.json` (schema = `ad_sample.recipe.config`;
see `config.example.json`). Nothing is hardcoded to one brand. `build_storyboard_preview.py` is an
optional free preview gallery for the gate; `build_text_overlays.py` is optional (transparent
text-zone PNGs for compositing claims over a motion clip).

Environment: run with a **Python that has Playwright** (override the frame-render interpreter with
`RENDER_PYTHON`); `ffmpeg` is auto-discovered (`FFMPEG` env > PATH > common prefixes). The frame
renderer `render_hyperframe.py` is **bundled** in `scripts/` — no external atom to fetch.

## Contract
- Deterministic + FREE (Playwright frame-step + FFmpeg); no paid calls, no AI-rendered text.
- Claims are noun phrases, <=4 words; never <3, never >5. Optional benefit sentence <=12 words.
- One product visual per beat; rotate which SKU is the hero. Never reuse a flat variety-pack image as every canvas.
- Sound-off legibility is the bar: the headline uses the config `palette.ink` color on `palette.bg`;
  the per-beat **accent** color (from `value_props[].accent` — a SKU-accent slug or a hex) is the
  accent rule, not the headline.
- Product widths **auto-scale from each image's aspect ratio** (target display height), so tall
  sachet cutouts and wide product packshots both frame correctly.
- Assets are packshots, not always transparent cutouts: set `palette.bg` to the product image's
  background color for seamless compositing (free — avoids a paid background-removal step).
- Uniform pacing (hook ~3.0s, props 2.0-2.5s each, endcard ~2.0s); total lands in the 10-20s window (~17s). No acceleration curve.
- No human face is the focus. End card uses the brand wordmark **image** when a hi-res one
  (aspect >= ~1.2, i.e. a real >=1200x600 wordmark) is provided via `config.logo`; otherwise it
  **falls back to a typographic `brand_name` wordmark** (many brands ship only a favicon).
- Music is added separately by create-music-elevenlabs (quiet instrumental bed at -14 dB), or ship silent.
