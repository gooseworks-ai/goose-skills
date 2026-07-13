---
name: render-model-comparison-grid
description: Render a 'model comparison grid' video from a config — a fal-style "same prompt, N contenders" showcase — a dark real-DOM stage where per beat a monospace prompt fades in centered, docks to a small top strip, then a labeled 2-4 panel grid (static images OR muted video clips, mixable per cell) staggers in and holds for comparison, plus a minimal end card — frame-stepped via Playwright (video cells are frame-seeked deterministically) and encoded with FFmpeg. Deterministic assembly, FREE (cell media comes from create-image-fal / create-video-fal, music from create-music-elevenlabs), text stays pixel-crisp. Use for the model-comparison-grid format.
status: active
---

# render-model-comparison-grid

Render the 'model comparison grid' format from a config. The signature of this format is a
**"Same prompt. N models."** gauntlet: a dark stage where, per beat, a `PROMPT` eyebrow +
the (condensed) prompt **fades in** centered in monospace and holds readable ~0.8s, then
docks to a small top strip while a **grid of 2-4 labeled panels** staggers in (0.15s apart)
and holds for side-by-side comparison. A persistent model/variant label sits under each
panel; column order is identical on every beat. Ends on a minimal end card (headline +
column names only — **no meta-stats line**).

The grid is **media-agnostic per cell**: any cell is a static image or a **muted video
clip** (i2v outputs, screen recordings), mixable within one beat. Video cells loop during
the hold and are **frame-seeked deterministically** (the renderer awaits each seek), so the
render never depends on wall-clock playback timing.

The renderer itself is FREE/deterministic (Playwright frame-step + FFmpeg). The paid inputs
are separate capabilities: the cell **images** come from `create-image-fal`, the cell
**clips** from `create-video-fal`, and the **music bed** from `create-music-elevenlabs`.
Prompt text and labels are real DOM — never AI-rendered.

Default shape: 5 beats × 4.5s + 2.5s end card = 25.0s @ 1280×720/30fps, all configurable
from one `config.json`.

## Run
build_composition.py --config config.json --output hyperframe.html ; render_seekable_hyperframe.py hyperframe.html master-silent.mp4 <duration> --fps 30 --width 1280 --height 720 — dark stage, staggered grid, deterministic, $0. The config schema is documented at the top of `scripts/build_composition.py`; `scripts/config.example.json` IS the shipped worked example (re-point the cell paths at your own media).

`build_composition.py` validates every cell path and the column count (2-4), infers each
cell's media type from its extension (`.png/.jpg/.jpeg/.webp` → image; `.mp4/.mov/.webm/.m4v`
→ muted video), and emits a self-contained HTML that exposes `window.mediaReady()` +
`window.renderAt(t)`. `render_seekable_hyperframe.py` awaits both, so `<video>` cells seek
to the right frame before each screenshot — never a frozen first frame.

## Contract
- Deterministic + FREE (Playwright frame-step + FFmpeg); no paid calls in this capability.
- Columns = panels-per-beat (2-4); every beat supplies exactly that many cells, same order.
- The template recipe (DB) supplies the config; cell images/clips + music are separate
  capabilities.
- State is computed entirely in `renderAt(t)` — never CSS `animation-delay`/transitions
  (Playwright scrubbing traps delayed animations in pre-state).
- Video cells must decode in the render Chromium (H.264 yes, ProRes no — transcode `.mov`
  ProRes to H.264 first). An images-only grid has no decode dependency.
