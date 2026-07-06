# Verifier

Deterministic checks on a produced render + the skill folder.

## Render checks (on `master-final.mp4`)
- `ffprobe`: `width=1080 height=1920`, `codec_name=h264`, `r_frame_rate=<fps>/1`,
  `duration` within 20–30s (25s default) ±0.5s. Music present: an `aac` stream with
  `bit_rate` ≈ 192000 (NOT ~1000 — the default-mapping silent-audio bug).
- Detect ≥ 13 hard cuts (scene-change spikes) — one per intercut boundary — and NO long
  cross-dissolves.
- The last ~3.5s (end card) shows the brand logo and subtle continuous motion (frame-diff
  small but NON-zero — proves it is not frozen).
- Sample a spec-card frame: high-contrast crisp text, within-frame (no bleed).
- Sample a hypermotion segment frame: one product, no people/hands, no text overlay.

## Folder checks
- `SKILL.md` frontmatter has `name`, `description`, `status`.
- `scripts/config.example.json` parses and has `product_image`, `logo_png`,
  `spec_callouts` (4–6), `hypermotion_i2v.prompt_blocks` (all 5 blocks),
  `text_cards`, `end_card.logo_png`, `beat_structure.concat_order`, `music`.
- `scripts/PIPELINE.md` exists and documents Phase 0–4 + the 11 PIL techniques.
- `demo/finals/` has the reference mp4; `demo/README.md` documents the worked example
  (mp4 + covers/logo may be documented git-LFS pointers).
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract check
- ONE hypermotion i2v model = Seedance (`fal-ai/bytedance/seedance/v2/pro/image-to-video`),
  diced into 5–6 segments — NOT 5–6 separate Seedance calls.
- The Seedance prompt carries ALL 5 blocks including the ABSOLUTE CONSTRAINTS block.
- The end card uses the **real logo PNG** (`end_card.logo_png`), not a typeset wordmark.
- Assembly is hard-cut concat of the intercut order + a SEPARATE explicit-map music mux
  (no dissolve filter, no default audio mapping).
- Brand voice ∈ industrial | sport | party | utility; palette = black BG + Space Grotesk
  Bold + accent (NOT cream paper / EB Garamond).
