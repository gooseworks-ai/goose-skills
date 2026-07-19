# Smoke Test

Given one native talking-head clip per beat (voice + lips generated together — no separate VO), the
brand's real UGC demo clips (or the product's own autocropped UI stills / screen recordings), the
real product photos, and the brand palette, `render-creator-pip-listicle` assembles the master: build
ONE full-1080×1920 transparent overlay PNG per beat (title pill; + demo PiP top-right + bottom product
card + rank number on product beats), cover-scale the creator clip to 1080×1920 and overlay the PNG
for the whole beat while keeping the native audio, hard-concat all beats @ 30fps, and burn the
captions last as PIL PNG overlays → 1080×1920 h264+aac (~46s).

Pass when the assembly runs to a valid MP4 and:
- structure is a hook → N product beats → CTA; the creator is **FULL-FRAME the whole beat** — there
  is **NO cut to a full-frame product shot** (`per_beat_shots = 1`); hard-concat the per-beat
  composites;
- on each product beat, three persistent overlays ride on the full-frame creator for the whole beat:
  the **title pill** top-center, the **demo PiP** top-right, and the **bottom product card**; hook +
  CTA carry the title pill only;
- the demo PiP is **autocropped to FILL its window** (no letterbox whitespace; a wide UI still → a
  short + wide window), sits top-right with a hairline border, and is **MUTED**; the product card is
  pinned bottom and legible (rounded thumbnail + "N · CATEGORY" small-caps + serif name); a counting
  rank number rides the product card on product beats; the title pill is persistent top-center;
- the creator's native audio is continuous across each beat — the spoken voice is the entire audio
  (no separate VO); the same creator face holds across every beat;
- captions are white ~2-word chunks positioned CLEAR of the PiP (top) and card (bottom), rendered as
  timed PIL PNG overlays (this ffmpeg has no libass), timed deterministically from the known per-beat
  script, brand tokens spelled correctly;
- the products are the REAL product photos / real UGC (or the product's own real UI still) — never
  AI-regenerated (no mangled labels);
- **no paid call is made in the composite/stitch stage** — the creator anchor comes from
  `create-image-fal` (Seedream v5 Pro, `bytedance/seedream/v5/pro/text-to-image`, no `fal-ai/`
  prefix) and the N native clips from `create-video-fal` (Seedance 2.0,
  `bytedance/seedance-2.0/reference-to-video`); this assembly is $0, and a re-cut reuses the existing
  native clips + overlays.
