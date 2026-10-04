---
name: render-ui-morph-ad
description: Render a brand-bound single-shape motion ad with pure-time HTML, local audio, and deterministic Playwright export.
owner: team
status: experimental
version: 1
created: 2026-10-04
updated: 2026-10-04
level: atom
category: motion-graphics
variant-of: null
tags: [video, motion-graphics]
---

# Human version

Make a short brand film from a real logo, font, palette and state list. One shape changes size and content as the story progresses. Exports portrait or square video with crisp text and an original sound bed. **Media generation costs zero.** The cards illustrate a workflow; they are concept animation rather than actual software screenshots or generated campaign results.

---

# Agent version

## Purpose

Render a reusable single-shape motion ad. Animation is a pure function of time: forward, backward and out-of-order seeks produce the same pixels.

## Inputs

- Python 3.10+, Playwright, installed Chromium, FFmpeg with libx264/AAC. Setup: `python3 -m pip install playwright`, `python3 -m playwright install chromium`.
- Config: `brand`, `cta`, `url`, `logo` (real PNG), `font` (real WOFF2), `palette` (`paper`, `ink`, `accent`, `muted`), optional `bpm` (80–160; default 120), `footer`, and 4–12 `states`. Assets resolve relative to the config.
- Each state: `kind`, `title` (≤54 chars), optional `description`, `label`, `items` (≤3; ≤24 chars each). Kinds: button, brief, brain, ads, photos, social, library, cta. First must be button; last must be cta.
- Aspect 9:16 or 1:1; default width 1080, fps 30. Square uses its own layout, never a portrait crop.
- Optional `--loop` returns visually to the opening state; ads default to a held CTA. The synthesized soundtrack fades out and is not an audio loop. `--mute` makes a silent video; `--music path.wav` uses a supplied licensed bed.

## Workflow

1. Bind all copy and identity from supplied brand evidence. Label product cards as concept animation. Never invent metrics, discounts, testimonials or authentic product UI. Use owned or licensed assets.
2. Fill `scripts/config.example.json`; save the state list before rendering.
3. Build HTML: `python3 scripts/build_composition.py --config config.json --output working/index.html --ratio 9:16`. Await fonts, decode all images, call `window.renderAt(t)`, and inspect each state and morph peak.
4. Render: `python3 scripts/render.py --config config.json --output finals/ad.mp4 --ratio 9:16 --work-dir working/portrait`. A broken default executable can be replaced with `--ffmpeg /path/to/working/ffmpeg`. Repeat with 1:1 and a different output/work directory.
5. The driver embeds local assets, morphs one persistent shell with closed-form damped responses, crossfades content, animates a cursor, synthesizes original seeded percussion, then screenshots each frame and muxes H.264/yuv420p with stereo AAC.
6. Watch the encoded output with [[composes::watch]]. Decode the whole file, inspect every transition, verify mobile text and CTA hold, and measure final audio. No speech means transcription/subtitles are not applicable.

## Output

Final MP4, JPG poster and `.manifest.json`. Working HTML, silent intermediate and WAV bed stay in the working directory. Keep a frame sheet and decode, timing, audio and deterministic-seek evidence.

## Quality Checks

- Fonts/images decode. LFS pointers fail before rendering.
- Duration equals `states × 240 / bpm` within one frame; dimensions/fps match.
- Text stays inside the canvas at settled and peak frames. Check inner labels too.
- Every state moves. No CSS transitions, timers or accumulated state.
- CTA remains readable on the final frame. Loop mode's last sampled frame equals its first; inspect the preceding transition too.
- Audio is audible/unclipped. Local synthesis uses seed 47 and no borrowed samples.
- Identity/claims match the requested brand. Illustrative cards are clearly described as concepts.

## Failure Modes

| Problem | Recovery |
| --- | --- |
| 130-byte LFS pointer | Fetch that asset and verify byte size. |
| FFmpeg crashes on a missing library | Check `ffmpeg -version`; pass a working standalone executable. |
| Long post text is truncated | Use the untrimmed response's `note_tweet.note_tweet_results.result.text`. |
| Text clips during a morph | Shorten copy or change geometry; check both layouts. |
| Loop flashes through earlier states | Morph the final shell directly to the first; never rewind the whole timeline. |
| Clean stills conceal faulty timing | Inspect frames extracted from the actual MP4 around every boundary. |

## Related

- [[references::render-model-comparison-grid]] — another deterministic DOM renderer.
- [[composes::watch]] — finished-render observation.
