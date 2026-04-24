# Mode: beat-sync-reel

Delegates to `packs/video-production/beat-sync-reel`.

## What it does

Generates Instagram Reels where product image cuts are synced to audio beats. Accepts audio as a local file, URL, or search query. Uses librosa for beat detection, FFmpeg Ken Burns for scene animation, and Pillow for text overlays.

**No AI video generation** — fully free, fast, and scalable. Best mode when budget matters and you have strong product photography already.

## When to pick this mode

- User has product images (photography, renders) and wants a reel fast and free
- Goal is rhythm-driven pacing (cuts on the beat)
- User wants to avoid paid AI video APIs

## Required input

- `--source <product-images-plus-audio>` — can be one of:
  - Directory path containing product images + an audio file
  - List of image paths/URLs + `--audio <path-url-or-query>`

Optional:
- `--audio <path|url|search-query>` — audio source. If a search query (e.g., "upbeat lofi"), the sub-skill resolves via its configured music source.
- `--brief "..."` — optional text overlay content

## Format support

- `vertical-short` (9:16, default) — TikTok/Reels/Shorts
- `vertical-story` (9:16, shorter) — Stories

Square and landscape unsupported — this mode is vertical-first.

## Style hints

Default: `energetic`. Good alternatives: `kinetic-type`, `minimal`.

Style affects: cut frequency (beat density), text overlay treatment, Ken Burns intensity, color grading.

## Dispatch

Invoke the sub-skill with:

```
beat-sync-reel <images-and-audio>
  [--duration <seconds>]
  [--text "..."]
  [--text-style <mapped-from-style>]
```

## Environment

- Python 3.10+ with `librosa`, `Pillow`, `numpy`, `requests`
- FFmpeg on PATH
- No paid API keys required (unless `--audio` resolves via a paid music source)

See `packs/video-production/beat-sync-reel/SKILL.md` for full setup.
