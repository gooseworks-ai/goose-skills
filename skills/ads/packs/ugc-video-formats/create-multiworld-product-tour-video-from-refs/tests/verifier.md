# Verifier

Deterministic checks on a produced render + the skill folder.

## Render checks (on `finals/master-v2.mp4`)
- `ffprobe`: `width=720 height=1280`, `codec_name=h264`, `r_frame_rate=<fps>/1`,
  `duration` ≈ `3×(arrival+macro) + end_card.dwell` = `3×8 + 3 = 27.0s` (±0.3s). An `aac`
  audio stream is present.
- Detect ≥ 6 hard cuts (scene-change spikes) — one per scene boundary — and NO long
  cross-dissolves (the S06→S07 whip is allowed).
- **Silent scenes:** Whisper the audio → music only, NO speech in S01–S06; NO burned
  captions in S01–S06 (text appears ONLY on the end-card segment).
- The final ~3s (end card) is static (frame-diff ≈ 0) with legible HTML text.
- Sample an arrival frame per world: the environment dominates, the bottle is small (not
  a macro). Sample a macro frame per world: top-down product + botanical, no hands.
- Sealed-bottle spot check: no sampled frame shows the bottle open / cap-off / spraying.

## Folder checks
- `SKILL.md` frontmatter has `name`, `description`, `status`.
- `scripts/config.example.json` parses and has `worlds` (3, each with `product_uuid`,
  `arrival_prompt`, `macro_prompt`, `world`, `palette`, `botanical`), `scene_grid` (7),
  `higgsfield.model`, `higgsfield.safety_block`, `end_card` (`nb2_prompt`, `html`,
  `overlay`), `music`, `master`.
- `scripts/PIPELINE.md` maps each config field to its source generation step.
- `demo/finals/` has the reference mp4; `demo/README.md` documents the worked example +
  git-LFS assets living in the source project.
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract check
- Clip model is Higgsfield Marketing Studio `marketing_studio_video/product_showcase`
  grounded on imported product UUIDs — one arrival + one macro per world (6 total).
- Every clip prompt carries the SEALED-BOTTLE safety block (no open/spray + no
  smoke/vapor/aerosol + no whip-pans/shake + label-match + no on-screen text).
- End-card background is NB2 with an explicit "no text/typography" clause; headline +
  scent labels + arrows + wordmark are HTML/Playwright-composited, never AI-rendered.
- Audio is one instrumental music bed — no VO audition, no scene captions
  (silent/music-led).
- Assembly is trim-to-grid → hard-cut concat + music mux/loudnorm (no dissolve filter).
