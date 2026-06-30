# Verifier — remix-apple-notes-ad-from-sample

Shared logic: `skills/verifiers/video/` (playable + caption-safe checks).

## Automated
- **Playable video:** `working/final.mp4` exists, non-empty, `ffprobe` decodes it, has an audio
  stream, duration within ±20% of the source sample's.
- **Thumbnail:** `working/final-thumb.jpg` exists, non-empty, decodes.
- **Render row contract:** terminal status `complete`; `output_url` + `thumbnail_url` both match
  `^/api/ads/projects/.+/render-file\?path=working/`; `duration_sec` within 0.5s of ffprobe;
  last `stage` = `export`.
- **Note parity:** `working/note.json` has the same `pre_typed_body` count and `typed_body` count
  (±1) as the source's `recipe.note`, per-paragraph pacing carried over, and `end_card` present
  with the brand's CTA code.

## Manual (watch the output)
- No source-brand word, product, or code anywhere (note text, end card).
- Every character in `typed_body` types in exactly once; no per-paragraph flicker — the only cut is
  the 300ms typing → end-card crossfade.
- Per-keystroke iPhone keyboard SFX lands with the visible keystrokes (or a calm music bed on a
  `--no-sfx` cut); yellow `#FFCC00` cursor sits at the end of the actively-typing paragraph.
- End-card wordmark is the brand's real asset (not styled text), product bottle on transparent BG,
  brand-color background.
- The note would pass as a real iPhone screen recording — a calm, considered voice, no marketing
  register.
