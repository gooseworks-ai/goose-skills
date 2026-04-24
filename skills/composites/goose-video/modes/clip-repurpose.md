# Mode: clip-repurpose

Delegates to `packs/video-production/video-clipper`.

## What it does

Repurposes long-form video (podcasts, interviews, talks) into short-form vertical clips for Instagram Reels, TikTok, and YouTube Shorts. Handles transcription, moment selection, clip extraction, speaker-tracked reframing (16:9 → 9:16), and animated captions.

## When to pick this mode

- User has an existing long-form video (30min+ podcast, keynote, webinar)
- Goal is to extract the best 3–10 moments as standalone vertical clips
- User wants speaker-aware reframing and animated captions baked in

## Required input

- `--source <long-form-video-path-or-url>` — local file or YouTube/Vimeo/etc. URL

Optional:
- `--brief "..."` — topic or angle guidance for moment selection (e.g., "focus on hiring stories")

## Format support

- `vertical-short` (9:16, default) — TikTok/Reels/Shorts
- `vertical-story` (9:16, shorter) — Stories
- `square-social` (1:1) — feed variants

Landscape formats unsupported — this mode is specifically about the 16:9 → 9:16 reframe transformation. For landscape pass-through, use `polish` instead.

## Style hints

Default: `documentary`. Good alternatives: `energetic`, `ugc-handheld`.

Style affects: caption styling (font, animation, position), music bed (if audio is added), cut timing, hook-first ordering.

## Dispatch

Invoke the sub-skill with:

```
video-clipper <source-video-path-or-url>
  [--num-clips <n>]
  [--min-duration <seconds>]
  [--max-duration <seconds>]
  [--caption-style <mapped-from-style>]
```

## Environment

- OpenAI API key (or local Whisper) for transcription
- FFmpeg on PATH
- Python for speaker tracking

See `packs/video-production/video-clipper/SKILL.md` for full setup.
