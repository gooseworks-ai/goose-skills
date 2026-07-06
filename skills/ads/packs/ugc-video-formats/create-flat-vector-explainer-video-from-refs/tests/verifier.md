# Verifier

Deterministic checks on the demo render + the skill folder.

## Render checks (on `demo/finals/spoiled-child-perfect-morning-routine.mp4`)
- `ffprobe`: `width=1080 height=1920`, `codec_name=h264`, `r_frame_rate=30/1`,
  `duration` ≈ 30s (±0.5s). An `aac` audio stream present (VO + music).
- Multiple hard/soft cuts (scene-change spikes) — one per beat boundary (≥8 scenes).
- Sample a character-scene pair of frames ~0.3–1.0s apart and `blend=difference`: the diff
  is **localized** on the face/hand (blink, spoon/pump/hand motion), NOT a uniform global
  pan and NOT a frozen identical pose — proves the cut-down was sliced from the ANIMATED
  master, not a static intermediate.
- Sample a character overlay scene: the numeral / chip / tagline region is high-contrast
  crisp DOM text (not warped/smeared), and the step's real product photo is present.
- Sample the grid scene: N distinct product photos, correct (non-stretched) aspect.

## Folder checks
- `SKILL.md` frontmatter has `name`, `description`, `status`.
- `scripts/config.example.json` parses and has `scenes` (≥8, each with `kind` + `vo`),
  `character.anchor_prompt`, `product_grid.images` (≥3), `kling.cfg_scale`, `voice.model`
  (`eleven_v3`), `music`, `captions`, `cutdowns`.
- `scripts/PIPELINE.md` maps each phase to its source script (gen_keyframes / clean_plate /
  kling_i2v / remotion / build_scene08 / render_vo / build_captions / build_master / build_30s).
- `demo/finals/` has the reference mp4; `demo/README.md` documents the source assets (git-LFS).
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract check
- Character-scene motion engine is **Kling** (`fal-ai/kling-video/v2.5-turbo/pro/image-to-video`)
  at `cfg_scale: 0.5` with a style-preserving negative — NOT a photoreal-leaning engine.
- Slate/grid/CTA scenes have `kind` ∈ slate/grid/cta and NO i2v.
- All text is a Remotion overlay (`scenes[].overlay`) — never baked into a keyframe.
- The product grid is PIL of REAL webps (`product_grid.method` says PIL / preserve aspect) — not AI.
- VO is full-sentence (`voice.model: eleven_v3`, with-timestamps) → word-by-word burned captions,
  suppressed on the slate/grid/CTA scenes.
- Cut-down source is the ANIMATED silent master (`cutdowns.source`), not a static intermediate.
