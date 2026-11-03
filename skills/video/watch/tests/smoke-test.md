# Smoke Test

Goal: prove `watch` can sample frames + audio from a short video and emit an observation report with a valid manifest.

Input: `tests/sample-input.md`.

Steps:
1. Read `SKILL.md`.
2. Run `watch` with defaults on the fixture video.
3. Save outputs to `skills/test-runs/<timestamp>/watch/`.
4. Watch the output once (the `watch` skill) and check it matches what this skill's SKILL.md says it makes.

Pass criteria:
- `frames/` contains ≥1 JPEG and frame count ≤ `max_frames` (100).
- `observation.md` exists and is timestamp-keyed.
- `manifest.json` exists, paths resolve, and audio flags are recorded.
- If Whisper was unavailable, the manifest flags `voice=skipped` rather than failing.
