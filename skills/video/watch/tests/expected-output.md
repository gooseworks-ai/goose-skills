# Expected Output

A successful `watch` run produces:

- `observation.md` — timestamp-keyed report describing what is on screen and (when enabled) what is heard. No verdicts or recommendations.
- `frames/*.jpg` — sampled frames referenced from the report.
- `transcript.json` — present only when `include_voice=true` and a Whisper backend ran successfully.
- `manifest.json` — captures: resolved `ranges`, resolved `fps`, frame count, `max_frames`, `resolution`, the three audio flags, output paths, and any warnings (e.g. `voice=skipped` when Whisper was unavailable).

Negative shape:
- No "good"/"bad" framing in `observation.md`.
- No silent skips: every disabled or degraded dimension is named in the manifest.
