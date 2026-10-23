# Verifier

Use these shared verifiers when applicable:

- `../../../verifiers/video/verify-playable-video.md` (duration, codec, aspect)
- `../../../verifiers/package/verify-output-manifest.md` (meta.json shape)

Skill-specific pass criteria:
- Output MP4 plays end-to-end (ffprobe returns duration ≈ `--duration` within ±0.5s)
- Aspect ratio and resolution match request
- Audio track present iff `--generate-audio` (use `ffprobe -show_streams`)
- `meta.json` records `gateway: "fal"`, `model: "bytedance/seedance-2.0/reference-to-video"`, a non-null `seed`, and a `video_url`
- No silent retry on `content_policy_violation` — script exit code 3 (policy) or 4 (NSFW) surfaces correctly
