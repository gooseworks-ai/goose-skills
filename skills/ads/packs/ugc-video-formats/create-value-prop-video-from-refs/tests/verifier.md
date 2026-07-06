# Verifier

Deterministic checks on a produced render + the skill folder.

## Render checks (on `finals/master-*-with-music.mp4`)
- `ffprobe`: `width=1080 height=1920`, `codec_name=h264`, `r_frame_rate=<fps>/1`,
  `duration` within 10-20s (default ~17s = `hook_s + Σ prop_s + endcard_s`, ±0.3s).
- An `aac` audio stream is present with `bit_rate ≥ 100000` (or a silent `anullsrc`
  track if `music_brief: null`).
- `volumedetect` mean volume between −25 and −34 dB (background level — music must not
  overpower). The Som demo lands at mean −31 dB / 191 kbps / 17.0s.
- Detect 3-5 prop-beat boundaries as hard cuts (scene-change spikes) — one per claim —
  and NO long cross-dissolves.
- Sample a mid-frame per prop beat: the ≤4-word claim region is high-contrast crisp
  navy text (legible sound-off), with a per-SKU product visual present.

## Folder checks
- `SKILL.md` frontmatter has `name` (= slug `create-value-prop-video-from-refs`),
  `description`, `status: active`.
- `scripts/{render_master,build_storyboard_preview,build_text_overlays,fire_music}.py`
  exist and parse (`python3 -c "import ast; ast.parse(open(f).read())"`).
- `scripts/config.example.json` parses and has `skus` (≥3), `value_props` (3-5, each
  `label` ≤4 words), `hook_line`, `tagline`, `palette.sku_accents`, `pacing`,
  `music_brief`, `aspect`, `duration_s`.
- `scripts/PIPELINE.md` exists (config→script map).
- `shared/` has `_shared.css`, `_shared.js`, `animations/registry.yml`,
  `beat-templates/{hook-sticker,prop-row,prop-hero,endcard-wordmark}.html`.
- `demo/finals/` has the reference mp4; `demo/README.md` documents the run (SKU PNGs may
  be documented git-LFS pointers).
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract check
- Archetype is VP-SWAP: a per-SKU visual swap per claim, hero rotating; NO flat
  variety-pack image reused as every canvas.
- Every `value_props[].label` ≤4 words; count is 3-5; optional benefit sentence ≤12 words.
- Headline color = `palette.ink` (navy); the per-flavor color appears only on the accent
  rule, never the headline.
- No CSS `@keyframes` / `setTimeout` in any beat HTML (animation via `renderAt(t)` only).
- Music mix is −14 dB with `normalize=0` + explicit `-map 0:v -map 1:a` (or silent).
