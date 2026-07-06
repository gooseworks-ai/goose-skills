# Verifier

Deterministic checks on a produced render + the skill folder.

## Render checks (on `master-final.mp4`)
- `ffprobe`: `width=1080 height=1920`, `codec_name=h264`, `r_frame_rate=25/1`,
  `nb_frames == round(duration_sec*25)` (250 at 10s), `duration` within ±0.1s.
  With music: an `aac` audio stream present.
- Sample ≥5 frames: at t≈0.1s few/no tiles visible; at t≈3s all 6 tiles + chips
  visible and static; late frames identical (static hold — frame-diff ≈ 0).
- Text regions (wordmark, headline, "% OFF", code) are high-contrast crisp (edge
  density above threshold — not blurred; proves no generative smear).

## Folder checks
- `SKILL.md` frontmatter has `name`, `description`, `status`.
- `scripts/{one_shot,build_card,render,gen_music}.py` exist and parse
  (`python3 -c "import ast; ast.parse(open(f).read())"`); `scripts/_shared.js` present.
- `build_card.py --help` exits 0; `scripts/config.example.json` parses and has
  `wordmark`, `headline`, `tiles` (exactly 6), and a `music` block.
- `demo/finals/` has the reference mp4; `demo/assets/` has the wordmark + product
  (product may be a documented git-LFS pointer).
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract check
- Exactly 6 tiles; tile `type` ∈ {product, photo, off, code}.
- All on-screen text is DOM/SVG (build_card emits it) — NOT an image/video of text.
- Motion is a pure function of `t` via `initRenderer`/`renderAt` (deterministic
  frame-step), not a timeline of video clips.
