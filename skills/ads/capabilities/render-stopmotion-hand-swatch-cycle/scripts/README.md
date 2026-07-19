# render-stopmotion-hand-swatch-cycle scripts — the FREE assembly

`render-stopmotion-hand-swatch-cycle` is the **deterministic, $0 assembly stage** of the stop-motion
hand-swatch-cycle format. The paid stages (the master-anchor plate, the N per-shade / motion / finale
plates, the end-card hero BG, the music track) are separate capabilities —
`create-image-gpt-image-fal` and `create-music-elevenlabs`. This capability spends nothing: it takes
the ordered plate PNGs + per-plate holds + the end-card hero BG + the brand logo SVG + the music
track and stitches the finished master. Re-cuts (re-timed holds, a re-ordered cycle, a swapped end
card, a different track) reuse the existing plates and cost **$0**.

`config.example.json` is the worked example (DIBS Beauty "Pick Your Match", ~16.6s 1080×1920).
`PIPELINE.md` maps every config block to its source step. This README documents the FREE assembly
pieces that `render-stopmotion-hand-swatch-cycle` owns.

## 1. Still plates — PNG→mp4 loop-encode at each plate's stop-motion hold

Each plate is a static PNG, loop-encoded to a short mp4 at its own `pose_hold_ms` (`ffmpeg -loop 1
-t <hold>`, scale/crop to 1080×1920 @ 30fps crf18). This is stop-motion — discrete held frames, no
camera moves, no character animation. The holds set the cadence: fast motion / half-painted plates
150–250ms, per-shade plates ~380ms (or ~1000ms for a slower, more scannable cycle), hero / bookend
beats 1100–1800ms. Average ~380ms gives the tactile frame-swap feel.

## 2. Concat-demux on hard cuts

Concat-**demux** the plate mp4s in order (`ffmpeg -f concat` over the ordered plate list) with HARD
cuts — no dissolves. The frame-swap tactility is the whole point of stop-motion; a crossfade erases
it. Concat-demux (not `filter_complex`) is correct because the plates are silent stills with no audio
to reconcile. DIBS v3 ran 27 plate clips into a ~13.6s silent body master.

## 3. End card — Playwright HTML from the real logo SVG, no AI text

The end card is a Playwright (Chromium headless) render of an HTML template — a serif tagline + a
sans subtitle + the real logo SVG composited over a `gpt-image-2` hero product/swatch BG — rendered
to a silent ~3s clip. The brand text is **never** AI-rendered — a diffusion model garbles a wordmark.
On macOS pick a font with the em-dash / middle-dot glyph for the subtitle separator.

## 4. FFmpeg composite + music mux

FFmpeg stitches the master: loop-encode each plate, concat-demux on hard cuts into the silent body
master, append the end card holding ~3s, then mux the pre-sourced music track (volume ≈0.4, fade
in/out) OVER the whole video including the end card with a fade at the tail (no silent tail — the
video ends WITH the music). The music IS the bed — no separate VO. Output is a 1080×1920 h264 + aac
master (~16.6s). Deterministic, no paid calls, no keys (beyond the Playwright/Chromium the end-card
render needs).
