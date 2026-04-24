# goose-video — Agent Skills pack for video creation

`goose-video` is a portable video skill pack for the Agent Skills ecosystem. It's a **router** skill — it does not generate video itself. It dispatches to the five standalone skills in `packs/video-production/`, layering on two additional axes (**format** + **style**) so the same underlying skill can output to different aspect ratios and visual treatments.

It loads in any host that reads `SKILL.md` — Claude Code, Claude Desktop, Claude Cowork, Goose, Cursor, Codex.

## Design principles

- **Wrap, don't absorb.** The five sub-skills remain directly invocable on their own. `/goose-video` is the umbrella for users who'd rather describe the outcome than pick a skill up front.
- **Three orthogonal axes.** A video is defined by: (1) mode — what kind of video, (2) format — aspect ratio and duration target, (3) style — visual treatment.
- **Deterministic delegation.** Once mode + format + style are known, this skill invokes the appropriate sub-skill with the right parameters and hands off.

## Directory Structure

```
goose-video/
  SKILL.md                        # Entry-point skill (router)
  README.md                       # This file
  skill.meta.json                 # Goose-skills installation metadata
  modes/                          # Dispatch specs — one per sub-skill
    index.json
    product-reel.md
    talking-head.md
    clip-repurpose.md
    polish.md
    beat-sync-reel.md
  formats/                        # Aspect ratio + duration specs
    index.json
    vertical-short.md
    vertical-story.md
    square-social.md
    landscape-short.md
    landscape-long.md
  styles/                         # Visual treatment presets
    index.json
    cinematic.md
    energetic.md
    minimal.md
    documentary.md
    tutorial.md
    ugc-handheld.md
    motion-graphic.md
    kinetic-type.md
  sources/
    stock-footage.md              # Pexels / Pixabay
    music.md                      # Royalty-free music selection
    captions.md                   # Whisper + Remotion captions
  examples/
    <mode-slug>/                  # Per-mode example outputs
```

## Modes (5)

| Mode | Delegates to | Best for |
|------|-------|----------|
| **product-reel** | `packs/video-production/product-reel-generator` | Instagram-ready product reels from an e-commerce page URL |
| **talking-head** | `packs/video-production/talking-head-video` | AI-avatar narration over screenshots/slides (HeyGen) |
| **clip-repurpose** | `packs/video-production/video-clipper` | Long-form → short vertical clips with auto-captions |
| **polish** | `packs/video-production/video-polish` | Zoom/pan on an existing screen recording (Remotion) |
| **beat-sync-reel** | `packs/video-production/beat-sync-reel` | Product image cuts synced to audio beats — free, no AI video gen |

## Formats (5)

| Format | Aspect | Duration | Platforms |
|--------|--------|----------|-----------|
| vertical-short | 9:16 | 15–60s | TikTok, Reels, YouTube Shorts |
| vertical-story | 9:16 | 15–30s | Stories, Snapchat |
| square-social | 1:1 | 15–30s | Instagram/LinkedIn feed |
| landscape-short | 16:9 | 30–90s | YouTube, LinkedIn, X |
| landscape-long | 16:9 | 3–10min | Tutorials, long-form |

## Styles (8 starter presets)

cinematic · energetic · minimal · documentary · tutorial · ugc-handheld · motion-graphic · kinetic-type

See `styles/index.json` for the canonical list and `styles/<slug>.md` for per-style specs (palette, typography, pacing, caption style, music genre hints, transition recipes).

## Args-based Invocation

```bash
# Full args — one-shot
/goose-video --mode product-reel --format vertical-short --style energetic --source https://shop.example.com/products/widget

# Partial — skill asks for the missing pieces
/goose-video --mode talking-head --brief "How we cut onboarding time by 40%"

# No args — full interactive flow
/goose-video
```

Flags:

- `--mode <slug>` — one of the 5 modes
- `--format <slug>` — one of the 5 formats
- `--style <slug>` — optional; defaults per mode if omitted
- `--brief "..."` — topic / description
- `--source <path-or-url>` — input material (required for most modes)

## Installation

```bash
npx goose-skills install goose-video
```

Installing `goose-video` also installs the five underlying skills from `packs/video-production/` as dependencies.

See `skill.meta.json` for installation metadata.

## Usage

Invoke via `/goose-video` in Claude Code. The skill walks you through mode selection, format choice, style selection, and source collection, then dispatches to the right sub-skill — or jump straight to generate by passing args (see above).

## Relationship to `packs/video-production/`

The five video sub-skills ship in `packs/video-production/` and remain **directly invocable** on their own:

- `/product-reel-generator`
- `/talking-head-video`
- `/video-clipper`
- `/video-polish`
- `/beat-sync-reel`

`goose-video` is the **wrap** — a higher-level interface that adds format + style axes and a unified invocation. Choose the umbrella when you want to describe the outcome; choose the individual skill when you know exactly which tool you need.
