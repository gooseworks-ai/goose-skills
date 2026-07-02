---
name: watch
description: Watch a rendered video (whole file or specific ranges) at a chosen fidelity and emit a timestamp-keyed observation report. Observation only — no edits, no verdicts.
---

# watch

## Purpose

Look at a rendered video and report what is actually on screen and in the audio. By default it watches the entire video and considers visuals, voiceover, music, and sound effects. Callers can narrow the scope (specific timestamp ranges, lower frame rate, disable audio tracks) when they want a cheaper or more focused pass.

This is the observation primitive that `watch-and-refine` calls before deciding what to fix. Other review and editing skills can call it directly.

## Inputs

- `video` — path to a local video file. Required.
- `ranges` — optional list of `[start, end]` timestamps to watch. Accepts `SS`, `MM:SS`, or `HH:MM:SS`. Defaults to the whole video.
- `fps` — frame sampling rate. Defaults to auto by duration (≤30s → 1–2 fps, 30s–1min → ~1 fps, 1–3min → ~0.5 fps, 3–10min → ~0.25 fps). Hard cap 2 fps.
- `max_frames` — hard cap on total frames sampled across all ranges. Default 100.
- `resolution` — frame width in px. Default 512. Bump to 1024 only when on-screen text legibility matters.
- `include_voice` — bool, default `true`. Transcribe spoken VO/dialogue.
- `include_music` — bool, default `true`. Describe music presence, swells, drops, gain relative to VO.
- `include_sfx` — bool, default `true`. Note sound effects, foley, transition stingers.
- `focus` — optional free-text prompt describing what to pay attention to (e.g. "watch the end card", "judge cut timing on the beat drop").

If all three audio flags are `false`, the skill runs frames-only and notes this in the manifest.

## Workflow

1. Validate `video` exists and is readable. Probe duration with `ffprobe`.
2. Resolve `ranges`: if empty, use `[0, duration]`. Reject ranges outside the file duration.
3. Resolve `fps`: use caller value if provided, else auto-scale from total resolved range duration. Clamp at 2 fps.
4. Allocate the `max_frames` budget across ranges proportionally to range duration.
5. Extract frames with `ffmpeg` into `frames/` at the resolved `fps` and `resolution`.
6. If any audio flag is true, extract the audio for the resolved ranges to a working WAV. Run a transcript pass when `include_voice=true`; degrade to frames-only and flag a warning if no Whisper backend is available.
7. Compose `observation.md` — a timestamp-keyed report. Each entry references the frame paths visible during that window plus any transcript line and audio notes (music/SFX) for the same window. If `focus` is set, lead each entry with what was observed about that focus.
8. Write `manifest.json` capturing the resolved inputs (ranges, fps, frame count, audio flags) and output paths.

## Output

- `observation.md` — timestamp-keyed observation report. No verdicts, no "good/bad" framing.
- `frames/*.jpg` — sampled frames referenced from the report.
- `transcript.json` — word-timestamped transcript, only when `include_voice=true` and a Whisper backend was available.
- `manifest.json` — resolved inputs and output paths.

## Quality Checks

- Frame count never exceeds `max_frames`.
- Every range produced at least one frame, unless the range is shorter than `1 / fps`.
- When `include_voice=true`, the transcript covers the resolved ranges (no >500ms gap inside a VO segment unless the audio itself is silent there).
- All paths in `manifest.json` resolve to real files.
- The report contains no recommendations — it describes only what was observed.

## Failure Modes

- Missing or unreadable `video`.
- A `ranges` entry falls outside the file duration.
- `include_voice=true` but no Whisper backend is configured — degrade to frames-only and flag a warning in the manifest.
- `max_frames` budget too tight to give every range at least one frame — surface which ranges were skipped.

## References

- `references/parameters.md` — full parameter reference, defaults, and the auto-fps budget table.
