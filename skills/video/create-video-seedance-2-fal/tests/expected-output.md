# Expected Output

Files in `coworkers/test-runs/<timestamp>/create-video-seedance-2-fal/`:

- `clip.mp4` — MP4 clip, duration ≈ `--duration` (±0.5s), aspect ratio matches `--aspect-ratio`, resolution matches `--resolution`
  - Must have an audio track when `--generate-audio` (default true)
  - File size > 10 KB (smaller = error payload disguised)
- `clip.mp4.meta.json` — JSON with at least:
  - `gateway: "fal"`
  - `model: "bytedance/seedance-2.0/reference-to-video"`
  - `prompt: "<the prompt passed>"`
  - `image_refs: [<list of local paths>]`
  - `resolution: "<requested>"`
  - `duration: <int>`
  - `aspect_ratio: "<requested>"`
  - `generate_audio: <bool>`
  - `seed: <int>` (FAL-returned; reuse for deterministic re-runs)
  - `video_url: "<https://...>"`
  - `cost_estimate_usd: <float>`
  - `wrote_at: "<ISO timestamp>"`

No `error` field. No moderation rejection in `result_meta`.
