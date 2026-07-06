# Verifier

Deterministic checks on a produced render + the skill folder.

## Render checks (on `master-final.mp4`)
- `ffprobe`: `width=1080 height=1920`, `codec_name=h264`, `duration` ≈
  `(Σ beat windows + end_card.dwell) / final_speed` (±0.3s; ~22.6s for the MasterClass example).
  With music: an `aac` audio stream present.
- Detect ≥ N hard cuts (scene-change spikes) — one per beat boundary — and NO long cross-dissolves.
- Sample a frame per beat: the phone-screen region is high-contrast crisp UI (real screenshot,
  not blurred/smeared — proves the screen is a PIL composite, not AI-animated).
- The final ~3s (end card) is static (frame-diff ≈ 0).
- Effective fps ≈ base_fps × 1.15 (proves the speed finalize ran; e.g. 24 → ~27.6).

## Folder checks
- `SKILL.md` frontmatter has `name`, `description`, `status`.
- `scripts/config.example.json` parses and has `beats` (5–6, each with `screen`, `burst_out`,
  `kling_motion`, `kenburns_fallback`, `vo`), `studio_look` (`background_hex`, `rim_light_hex`),
  `cgi_plate`, `end_card` (`wordmark`, `amaranth_bar`, `tagline`), `voiceover`, `music`,
  `finalize.speed == 1.15`, `width/height/fps`.
- `scripts/PIPELINE.md` exists and maps config fields → the source working scripts
  (`gen_plates.py`, `composite_screens.py`, `build_burst_climax.py`, `gen_clips.py`,
  `build_v2_clips.py`, `build_captions.py`).
- `demo/finals/` has the reference mp4; `demo/README.md` documents the key assets
  (screen-01..06, wordmark, app icon, reference pin) as git-LFS.
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract check
- i2v model is Kling 3.0 (`kling3_0`) — NOT Seedance (Seedance breaks floating-object physics).
- Still model is nano_banana_2; plates carry a BLANK warm-glow screen (UI composited in PIL post).
- `screen_composite.hard_rule` + `end_card.method` state the UI + wordmark are REAL/PIL, never AI.
- Every beat has a `kenburns_fallback` (Kling-garble → Ken-Burns push-in).
- Assembly is hard-cut concat of the beats + end card (no dissolve filter), then 1.15x speed + grain.
