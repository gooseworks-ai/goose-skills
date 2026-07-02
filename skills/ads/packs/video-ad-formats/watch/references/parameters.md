# `watch` parameter reference

## `video`
Path to a local video file (`.mp4`, `.mov`, `.mkv`, `.webm`). Required.

## `ranges`
Optional list of `[start, end]` pairs. Each timestamp accepts `SS`, `MM:SS`, or `HH:MM:SS`. Defaults to `[[0, duration]]` (whole video).

Multiple ranges are valid — e.g. `[["0:00", "0:05"], ["0:28", "0:32"]]` to inspect a hook and an end card without watching the middle. The `max_frames` budget is divided across ranges proportionally to their duration.

## `fps`
Frame sampling rate. Hard cap **2 fps**. When unset, auto-scale from total resolved range duration:

| Total resolved duration | Auto fps | Frame budget hint |
|---|---|---|
| ≤ 5s | 2 fps | up to 10 frames |
| 5–15s | 2 fps | up to 30 frames |
| 15–30s | ~2 fps | up to 60 frames |
| 30–60s | ~1.3 fps | up to 80 frames |
| 1–3 min | ~0.6 fps | up to 100 frames |
| 3–10 min | ~0.25 fps | 100 frames (cap) |
| > 10 min | sparse | 100 frames (warn caller) |

## `max_frames`
Default 100. Hard cap across all ranges combined.

## `resolution`
Frame width in pixels. Default 512. Bump to 1024 only when on-screen text legibility matters (logos, captions, code on screen).

## `include_voice` / `include_music` / `include_sfx`
All default `true` — by default the skill considers voiceover, music, and sound effects in addition to frames. Disable individually to skip that audio dimension. Setting all three to `false` runs frames-only and is flagged in the manifest.

`include_voice=true` requires a Whisper backend (Groq or OpenAI). If neither is available the skill degrades to frames-only and warns; it does not fail.

## `focus`
Optional free-text prompt that biases the observation report. Examples:

- `"watch the end card"` — concentrate detail in the last few seconds
- `"judge cut timing on the beat drop"` — annotate cuts vs. audio peaks
- `"check on-screen text legibility"` — implies bumping `resolution` to 1024

`focus` does not change defaults automatically; callers should set `resolution`, `ranges`, etc. to match.
