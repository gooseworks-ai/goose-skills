# Verifier

Use these shared verifiers when applicable:

- `../../../verifiers/package/verify-output-manifest.md`
- `../../../verifiers/video/verify-playable-video.md` (for the source video, not the frames)

Skill-specific pass criteria:
- `frames/` JPEG count ≤ `max_frames`.
- Every entry in `manifest.json.ranges` has at least one frame in `frames/`, unless the range duration is shorter than `1 / fps`.
- `observation.md` is timestamp-keyed and contains no verdicts.
- When `include_voice=true`, either `transcript.json` exists OR `manifest.json.warnings` contains `voice=skipped`.
