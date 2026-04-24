# Mode: polish

Delegates to `packs/video-production/video-polish`.

## What it does

Takes an existing screen recording or demo video and adds professional zoom/pan effects synchronized to the narration. Uses transcript-driven zoom targeting and Remotion for rendering. Optionally replaces audio with a soundtrack.

## When to pick this mode

- User has an existing screen recording (product demo, tutorial, walkthrough)
- Goal is to make it feel polished — zoom into relevant UI elements as narration references them
- User wants captions and/or replacement audio

## Required input

- `--source <existing-video-file-path>` — local video file (mp4, mov preferred)

Optional:
- `--brief "..."` — emphasis hints for zoom targeting

## Format support

- `landscape-short` (16:9, default) — 30–90s polished demos
- `landscape-long` (16:9) — 3–10min full walkthroughs

Vertical and square formats unsupported — polish preserves the source aspect ratio, which is typically landscape for screen recordings. Use `clip-repurpose` if you need to reframe to vertical.

## Style hints

Default: `tutorial`. Good alternatives: `minimal`, `cinematic`.

Style affects: zoom speed and easing, caption styling, music bed, transition treatment.

## Dispatch

Invoke the sub-skill with:

```
video-polish <existing-video-file-path>
  [--zoom-intensity <low|medium|high>]
  [--replace-audio <path-or-slug>]
  [--caption-style <mapped-from-style>]
```

## Environment

- Remotion (Node — run `npm install` in the sub-skill directory)
- OpenAI API key (or local Whisper) for transcript + zoom targeting
- FFmpeg on PATH

See `packs/video-production/video-polish/SKILL.md` for full setup.
