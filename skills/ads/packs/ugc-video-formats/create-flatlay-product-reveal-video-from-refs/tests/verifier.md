# Verifier

Deterministic checks on a produced render + the skill folder.

## Render checks (on `master-final.mp4`)
- `ffprobe`: `width=1080 height=1920`, `codec_name=h264`, `r_frame_rate=<fps>/1`,
  `duration` ≈ `N*(beat_i2v.duration/beat_speed) + insert + end_card.dwell` (±0.3s).
  With music: an `aac` audio stream present.
- Detect ≥ N hard cuts (scene-change spikes) — one per beat boundary — and NO long
  cross-dissolves.
- Sample a held-product frame per beat: the cover region is high-contrast crisp text
  (not blurred/smeared — proves Veo held the cover).
- The final ~3s (end card) is static (frame-diff ≈ 0).

## Folder checks
- `SKILL.md` frontmatter has `name`, `description`, `status`.
- `scripts/{one_shot,gen_flat_covers,build_start_frames,gen_beats,gen_fd_card,render_endcard,gen_music,build_master}.py`
  exist and parse (`python3 -c "import ast; ast.parse(open(f).read())"`).
- `build_master.py --help` and `build_start_frames.py --help` exit 0.
- `scripts/config.example.json` parses and has `beats` (3–5), `tabletop_bg`,
  `end_card.html`, `beat_speed`, `flat_cover`, `beat_i2v`, `music`.
- `demo/finals/` has the reference mp4; `demo/assets/` has the tabletop plate +
  end-card html (covers/plate may be documented git-LFS pointers).
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract check
- Beat i2v model is Veo (`fal-ai/veo3/image-to-video`) — NOT Seedance.
- The flat-cover + beat prompts both carry the "preserve art/text/names/logo exactly"
  constraint.
- Assembly is hard-cut concat of speed-adjusted beats + end card (no dissolve filter).
