# Mode: talking-head

Delegates to `packs/video-production/talking-head-video`.

## What it does

Creates talking-head videos from any source material (docs, changelogs, blog posts, notes, transcripts). Produces multi-scene videos with AI-avatar narration over screenshots/images via HeyGen v2 API. Supports Quick Shot and Full Producer modes.

## When to pick this mode

- User has written content (docs, changelog, blog post) and wants a narrated explainer
- Goal is AI-avatar narration (no real person on camera)
- User is okay with paid AI narration (HeyGen API)

## Required input

- `--source <source-content-path>` — path to the source material (markdown, text, PDF, or URL)

Optional:
- `--brief "..."` — additional framing or emphasis for the script

## Format support

- `landscape-short` (16:9, 30–90s, default) — YouTube/LinkedIn
- `landscape-long` (16:9, 3–10min) — tutorials, webinars
- `square-social` (1:1) — Instagram/LinkedIn feed
- `vertical-short` (9:16) — TikTok/Reels (avatar reframed to vertical safe zone)

## Style hints

Default: `minimal`. Good alternatives: `tutorial`, `documentary`, `cinematic`.

Style affects: caption styling, background treatment, pacing, music bed selection. The underlying avatar choice is separate — see `talking-head-video/AVATAR-CONFIG.example.md`.

## Dispatch

Invoke the sub-skill with:

```
talking-head-video <source-content-path>
  [--aspect-ratio <mapped-from-format>]
  [--avatar <configured>]
  [--producer-mode quick|full]
```

## Environment

- `HEYGEN_API_KEY` required
- Avatar configured via `AVATAR-CONFIG.md` in the sub-skill

See `packs/video-production/talking-head-video/SKILL.md` for full setup.
