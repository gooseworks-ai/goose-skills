---
name: render-value-prop
description: Render a designed 'value prop' video from a config — 3-5 noun-phrase benefit claims (<=4 words each) revealed sequentially over per-SKU product visuals, one crisp editorial frame per claim (hook sticker -> N claim beats -> brand end card). Deterministic PIL/HTML beat renderer frame-stepped via Playwright and encoded with FFmpeg, sound-off legible, hard cuts, uniform pacing. FREE (no paid calls); music is added separately (create-music-elevenlabs). Use for the value-prop format.
status: active
---

# render-value-prop

Render a designed 'value prop' video from a config: a hook sticker, then one beat per short noun-phrase benefit claim (<=4 words each — "Drug-Free", "Zero Sugar", "NSF Certified"), each pairing the claim headline with a per-SKU product visual (the hero SKU rotates beat to beat so the eye anchor shifts), then a brand-wordmark end card. Text + product carry the spot — no narration, no talking head — and it is built to be legible sound-off. Every beat is a pure function of beat-local time `t` (deterministic PIL start frames + Playwright hyperframes + FFmpeg); no CSS keyframes, no setTimeout. FREE (no paid calls); music is a separate capability (create-music-elevenlabs), or ship silent for $0.

## Run
build_storyboard_preview.py (free preview gallery for the gate) ; render_master.py -> finals/master-*-clean.mp4 (silent) — 1080x1920, deterministic, $0. build_text_overlays.py is optional (transparent text-zone PNGs for compositing claims over a motion clip).

## Contract
- Deterministic + FREE (PIL + Playwright frame-step + FFmpeg); no paid calls, no AI-rendered text.
- Claims are noun phrases, <=4 words; never <3, never >5. Optional benefit sentence <=12 words.
- One product visual per beat; rotate which SKU is the hero. Never reuse a flat variety-pack image as every canvas.
- Sound-off legibility is the bar: headline stays ink navy on white; per-flavor color is the accent rule, not the headline.
- Uniform pacing (hook ~3.0s, props 2.0-2.5s each, endcard ~2.0s); total lands in the 10-20s window (~17s). No acceleration curve.
- No human face is the focus. End card is the brand's real wordmark (>=1200x600), no chromatic aberration.
- Music is added separately by create-music-elevenlabs (quiet instrumental bed at -14 dB), or ship silent.
