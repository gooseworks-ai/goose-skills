# Smoke Test

Given N still plates (a master-anchor hand + barrel + empty cream-patch, then per-shade / motion /
finale plates with ONE locked hand + crop + background), an end-card hero BG + brand logo SVG, and a
pre-sourced music track, `render-stopmotion-hand-swatch-cycle` assembles the master: loop-encode each
plate at its own stop-motion hold, concat-demux with HARD cuts into a silent body master, append a
Playwright HTML-rendered branded end card, mux the music under it → 1080×1920 h264+aac (~16.6s).

Pass when the assembly runs to a valid MP4 and:
- each plate is a still held for its `pose_hold_ms` (fast motion 150–250ms, per-shade ~380ms, hero
  1100–1800ms); hard cuts between plates (no crossfades); the ONE locked hand + crop + background
  holds across every cycle plate (no drift);
- each swatch stripe is the real variant color (grounded on the shade's swatch + hero refs);
- the end card is a Playwright HTML render (serif tagline + sans subtitle + the real logo SVG over
  the hero BG, no AI-rendered text), the music carrying under it with a fade tail (no silent tail);
- the music is the entire bed — no separate VO;
- **no paid call is made** — the master-anchor plate, the shade / motion / finale plates, and the
  end-card BG come from `create-image-gpt-image-fal`, and the track from `create-music-elevenlabs`;
  this assembly is **$0** and a re-cut (re-timed holds, a re-ordered cycle, a swapped end card) reuses
  the existing plates.
