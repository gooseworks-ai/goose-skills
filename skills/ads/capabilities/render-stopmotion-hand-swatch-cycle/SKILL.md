---
name: render-stopmotion-hand-swatch-cycle
description: Assemble a stop-motion hand-swatch-cycle product-demo ad from a config — a sequence of still PLATES (one hand swiping a single-barrel cosmetic across a cream skin-patch, the barrel + swatch changing per plate while the hand, background, crop, and lighting stay locked) is PNG→mp4 loop-encoded at each plate's own stop-motion hold (fast motion frames 150–250ms, per-shade ~380ms, hero beats 1100–1800ms), concat-demuxed with HARD cuts into a silent master, closed on a Playwright HTML-rendered branded end card (serif tagline + sans subtitle + real logo SVG over a hero BG, never AI-rendered text), and muxed with a pre-sourced music track playing under the end card with a fade tail (no VO). This is the FREE deterministic assembly stage (loop-encode + concat-demux + end-card render + music mux); the master-anchor plate, shade plates, and end-card BG come from create-image-gpt-image-fal and the track from create-music-elevenlabs. Use for the stopmotion-hand-swatch-cycle format.
status: active
---

# render-stopmotion-hand-swatch-cycle

Assemble a **stop-motion hand-swatch-cycle** ad from a config: a fast, tactile product demo where a
single hand swipes ONE cosmetic barrel across a cream "skin-patch" test surface, and the shade of
the barrel AND the painted swatch stripe changes on every frame while the hand, background, crop,
and lighting hold still — cycling the variant family so the viewer self-identifies their match, then
a hero-pick payoff and a branded end card. This capability is the **FREE, deterministic assembly** —
the per-plate PNG→mp4 loop encode, the concat-demux, the end-card render, and the music mux.

`scripts/config.example.json` is the worked example (DIBS Beauty "Pick Your Match", ~16.6s 1080×1920
9:16, ~24 cycle plates + finale beats + a 3s end card); `scripts/PIPELINE.md` maps every config
block to its source step and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are separate
capabilities — the master-anchor plate + the per-shade / motion / finale plates + the end-card hero
BG (`create-image-gpt-image-fal`, gpt-image-2 EDIT mode, each plate anchored to the SAME
master-anchor — never chained), and the music track (`create-music-elevenlabs`, or a brand-supplied
mp3). Given the ordered plate PNGs + per-plate holds + the end-card hero BG + the brand logo SVG +
the music track, `render-stopmotion-hand-swatch-cycle` loop-encodes each plate at its hold,
concat-demuxes with hard cuts into a silent master, appends the HTML-rendered end card, and muxes the
music under it → the master. Re-cuts (re-timed holds, a re-ordered cycle, a swapped end card) reuse
the existing plates / track and cost **$0**.

## Contract (the free assembly)

- **Still plates, not i2v — held for tuned durations.** Each plate is a static PNG loop-encoded
  (`ffmpeg -loop 1 -t <pose_hold_ms>`) to 1080×1920 @ 30fps crf18. This is stop-motion — discrete
  held frames, no camera moves, no character animation. Do not animate the plates.
- **Fast stop-motion cadence, HARD cuts.** Motion / half-painted plates hold 150–250ms, per-shade
  plates ~380ms (or ~1000ms for a slower cycle), hero / bookend beats 1100–1800ms; average ~380ms.
  Concat-**demux** the plate mp4s in order with hard cuts (`ffmpeg -f concat`) — NO dissolves. The
  frame-swap tactility is the whole point; a crossfade erases it.
- **Concat-demux, not filter_complex.** The plates are silent stills, so the `concat` demuxer over
  the ordered plate list is correct and cheapest. (`filter_complex` is only needed when clips carry
  mismatched audio — these don't.)
- **The music carries it — no VO.** A pre-sourced brand instrumental (128–130 BPM works well),
  volume ≈0.4, fade in/out. Do not add a spoken voiceover or a second bed.
- **End card via Playwright HTML from the real logo SVG — never AI-render brand text.** A serif
  tagline + sans subtitle + the real logo SVG composited over a hero product/swatch BG by an HTML
  template (Chromium headless), rendered to a silent ~3s clip. A diffusion model garbles a wordmark.
- **Music plays UNDER the end card with a fade tail — no silent tail.** Mux the track over the whole
  video including the end card, fade over the last ~0.5s so the video ends WITH the music.
- **FFmpeg composite, deterministic, FREE.** Loop-encode each plate, concat-demux on hard cuts,
  append the end card, mux the music with a fade tail → a 1080×1920 h264+aac master (~16.6s). No paid
  calls, no keys (beyond the Playwright/Chromium the end-card render needs).
