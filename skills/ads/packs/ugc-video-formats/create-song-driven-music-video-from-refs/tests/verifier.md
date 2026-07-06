# Verifier

Deterministic checks on a produced render + the skill folder.

## Render checks (on `renders/master-v3.mp4`)
- `ffprobe`: `width=1080 height=1920`, `codec_name=h264`, `r_frame_rate=<fps>/1`,
  `duration` ≈ the song length (~28s, ±0.3s). An `aac` audio stream is present (the song).
- Detect ≥ N hard cuts (scene-change spikes) — one per tableau boundary — and NO long
  cross-dissolves (one optional match-cut into the hero reveal).
- The hook word lands on the chorus drop: the caption event carrying `song.hook_word`
  ("fall") starts at ≈ `song.hook_target_sec` (~15.24s), on the tableau flagged `is_hook`.
- Sample one frame from each of the N beats: all read in the one look pack (same
  paper-craft/claymation register + palette) — no beat is off-style.
- The final window (`end_card.overlay_window_sec`) shows the composited brand lockup.

## Folder checks
- `SKILL.md` frontmatter has `name`, `description`, `status`.
- `scripts/config.example.json` parses and has `song` (with `structure`, `hook_word`,
  `lyrics_md`), `look_pack` (`style_opener` + `negative_tail`), `tableaux` (N≥8, each with
  `keyframe_prompt` + `motion_hint` + `lyric_anchor` + `caption`), `captions` (source =
  `words.json`), `keyframe_engine`, `clip_engine`, `end_card`.
- `scripts/PIPELINE.md` exists and maps song → ElevenLabs `music_v1`, keyframes → Higgsfield
  `gpt_image_2`, clips → Higgsfield `kling3_0`, captions → `build_captions_v2.py`, assembly →
  `promote_master*.py`.
- `demo/finals/` has the reference mp4; `demo/README.md` documents the key assets + git-LFS.
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract check
- The song carries the narration — `config` has NO voiceover/VO track and no separate music
  bed; `song.force_instrumental` is `false` (the track is sung).
- Captions source is the song's word timings (`audio/words.json`), NOT Whisper.
- Exactly one `tableaux[].is_hook` beat, and its window covers `song.hook_target_sec`.
- One `look_pack` drives every keyframe (shared `style_opener` + `negative_tail`).
- The end card is composited (`end_card.engine: "pil"`) from a real `brand_asset` — never
  AI-rendered text.
