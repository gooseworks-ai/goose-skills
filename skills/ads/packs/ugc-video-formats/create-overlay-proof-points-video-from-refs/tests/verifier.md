# Verifier

Deterministic checks on a produced render + the skill folder.

## Render checks (on `master-final.mp4`)
- `ffprobe` reports `width=1080 height=1920`, `codec_name=h264`, `duration` within
  ±0.1s of `duration_sec` (default 10). With music: an `aac` audio stream present.
- Sample ≥6 frames spanning the timeline (`ffmpeg -ss <t> -frames:v 1`):
  - at t < first `reveal_time` (e.g. 1.5s): both header pills present, ZERO proof
    pills visible;
  - at t > last `reveal_time` (e.g. 7s): both headers + all N proof pills visible;
  - each proof pill is fully inside the frame (no pixel of the pill's bbox is
    clipped at x<0 or x>1080);
  - header/pill regions contain high-contrast crisp text (edge density above
    threshold — not blurred / not smeared by the video model).
- The product label region is stable across frames (no large frame-to-frame morph),
  confirming the i2v held the label.

## Folder checks
- `SKILL.md` frontmatter has `name`, `description`, `status`.
- `scripts/{one_shot,fetch_icons,gen_base_clip,gen_music,build_overlays,compose_master}.py`
  exist and `python3 -c "import ast; ast.parse(open(f).read())"` parses each.
- `build_overlays.py --help` and `compose_master.py --help` exit 0.
- `scripts/config.example.json` parses as JSON and has `overlays.header`,
  `overlays.subhead`, `overlays.proof_points` (3–4), and `layout.reveal_times`.
- `demo/finals/` has the reference mp4; `demo/assets/refs/` has the product image
  (or documented as git-LFS); `demo/assets/icons/` has the 3 Twemoji PNGs.
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract check
- Exactly two persistent header pills (white score + orange sub) that appear at
  t=0 and never disappear.
- Proof-pill count is 3 or 4; reveal times are strictly increasing; pills alternate
  LEFT (`pill_left_x`) / RIGHT (`W-w-margin`) X positions.
- `build_overlays.py` uses Twemoji PNGs (icons pasted from `assets/icons`), NOT a
  system emoji font (PIL cannot render Apple Color Emoji).
