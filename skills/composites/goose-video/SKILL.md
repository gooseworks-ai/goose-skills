---
name: goose-video
description: Portable video skill pack for the Agent Skills ecosystem. Wraps five video-production skills (product reels, talking-head, clip repurposing, screen-recording polish, beat-sync reels) under one invocation, with aspect-ratio formats and visual style presets.
---

## 1. Overview

`goose-video` is a portable video skill pack for the Agent Skills ecosystem. It's a router skill — it does not generate video itself. Instead, it dispatches to the five standalone skills in `packs/video-production/`, layering on two additional axes (format + style) so the same underlying skill can output to different aspect ratios and visual treatments.

Design principles:

- **Wrap, don't absorb.** The five sub-skills remain directly invocable on their own. `/goose-video` is the umbrella entry point for users who'd rather describe the outcome ("a 30-second TikTok about our launch") than pick a skill name up front.
- **Three orthogonal axes.** A video is defined by: (1) **mode** — what kind of video, (2) **format** — aspect ratio and duration target, (3) **style** — visual treatment.
- **Deterministic delegation.** Once mode + format + style are known, this skill invokes the appropriate sub-skill with the right parameters and hands off. No magic.

It loads in any host that reads `SKILL.md` — Claude Code, Claude Desktop, Claude Cowork, Goose, Cursor, Codex.

## 2. Invocation

```
/goose-video --mode <slug> --format <format> [--style <slug>] [--brief "..."] [--source <path-or-url>]
```

- `--mode <slug>` — one of `product-reel`, `talking-head`, `clip-repurpose`, `polish`, `beat-sync-reel`. See `modes/index.json`.
- `--format <slug>` — one of `vertical-short`, `vertical-story`, `square-social`, `landscape-short`, `landscape-long`. See `formats/index.json`.
- `--style <slug>` — optional; one of the presets in `styles/index.json`. Defaults per mode if omitted.
- `--brief "..."` — topic / description / source content.
- `--source <path-or-url>` — input material (product page URL, source video path, script path, etc.). Required for most modes.

**Three branches (same pattern as goose-graphics §2.1):**

1. **All required args present** → skip discovery, dispatch directly to the chosen mode's sub-skill with format + style applied.
2. **Partial args** → ask only for missing pieces. If `--mode` is set but `--format` is not, ask only for format.
3. **No args** → run the interactive flow from §3.

### 2.1 Examples

```bash
# Full args — one-shot reel from product page
/goose-video --mode product-reel --format vertical-short --style energetic --source https://shop.example.com/products/widget

# Repurpose a long podcast into TikTok clips
/goose-video --mode clip-repurpose --format vertical-short --source ~/Downloads/episode-47.mp4

# Talking-head explainer, square for LinkedIn feed
/goose-video --mode talking-head --format square-social --brief "How we cut onboarding time by 40%" --source ~/docs/onboarding-redesign.md

# Polish an existing demo recording
/goose-video --mode polish --format landscape-short --style tutorial --source ~/demos/q2-demo.mov

# No args — full interactive flow
/goose-video
```

## 3. Host compatibility

`SKILL.md` (this file) auto-loads on most Agent Skills hosts once installed. The router reads its sub-skill references via the local skill directory.

| Host | Install | Notes |
|---|---|---|
| Claude Code | `npx goose-skills install goose-video --claude` | Lands at `~/.claude/skills/goose-video/` |
| Claude Desktop | (same install as above) | Auto-shared — Desktop reads `~/.claude/skills/` |
| Claude Cowork | (same install as above) | Built on Claude Desktop; same skill dir |
| Goose (Block) | (same install as above) | Auto-discovers `~/.claude/skills/` + `~/.config/goose/skills/` |
| Cursor | `npx goose-skills install goose-video --cursor --project-dir .` | Writes `.cursor/rules/goose-goose-video.mdc` |
| Codex (OpenAI) | `npx goose-skills install goose-video --codex` | Writes `~/.codex/skills/goose-video/` |

Installing `goose-video` also installs the five underlying skills from `packs/video-production/` as dependencies — the router needs them to dispatch.

## 4. First-Run Setup

Each mode has its own environment requirements — API keys, Python packages, fonts, etc. The router reads the target mode's sub-skill and surfaces any missing setup before invocation.

Common requirements:

- **FFmpeg** — required by `beat-sync-reel`, `product-reel-generator`, `video-clipper`, `video-polish`
- **Python 3.10+** with `librosa`, `Pillow`, `requests` — `beat-sync-reel`, `product-reel-generator`
- **Remotion** (Node) — `video-polish`
- **HeyGen API key** (`HEYGEN_API_KEY`) — `talking-head-video`
- **Higgsfield API key** (`HIGGSFIELD_API_KEY`) — `product-reel-generator`

See each sub-skill's SKILL.md for exact setup steps.

## 5. Interactive Workflow

```
1. Discover Intent   --> What kind of video? (pick a mode)
2. Select Format     --> What aspect ratio + duration target?
3. Select Style      --> Visual treatment (optional — mode has a default)
4. Collect Source    --> Input material for the mode
5. Dispatch          --> Hand off to the sub-skill with parameters
6. Deliver           --> Return the sub-skill's output
```

## 6. Step 1: Discover Intent

Ask the user what kind of video they want to make. Present the five modes:

| Mode | Best For | Input |
|------|----------|-------|
| **product-reel** | Instagram-ready product reels from e-commerce pages | Product page URL |
| **talking-head** | Explainer videos with AI avatar narration over slides/screenshots | Source docs, changelogs, script |
| **clip-repurpose** | Short-form clips extracted from a long-form video | Long-form video file or URL |
| **polish** | Professional zoom/pan on an existing screen recording | Existing recording file |
| **beat-sync-reel** | Product image cuts synced to audio beats — free, fast, no AI video gen | Product images + audio |

Read the corresponding file in `modes/<slug>.md` for the full dispatch spec.

## 7. Step 2: Select Format

Present the format options — aspect ratio + duration target, independent of mode:

| Format | Aspect | Duration | Platforms |
|--------|--------|----------|-----------|
| **vertical-short** | 9:16 | 15–60s | TikTok, Reels, YouTube Shorts |
| **vertical-story** | 9:16 | 15–30s | Instagram/LinkedIn Stories, Snapchat |
| **square-social** | 1:1 | 15–30s | Instagram feed, LinkedIn feed |
| **landscape-short** | 16:9 | 30–90s | YouTube, LinkedIn, Twitter/X |
| **landscape-long** | 16:9 | 3–10min | YouTube long-form, tutorials, webinars |

See `formats/<slug>.md` for dimensions, safe zones, and per-platform caveats.

Not every mode supports every format — check `modes/<slug>.md` for the `supports` list. For example, `beat-sync-reel` is vertical-only; `polish` accepts whatever the source recording's aspect ratio is.

## 8. Step 3: Select Style (Optional)

Each mode has a default style. If the user wants a specific visual treatment, present the style presets from `styles/index.json`:

- **cinematic** — film-grain, letterbox bars, slow handheld pans, muted palette
- **energetic** — fast cuts, bass-heavy beats, bold text overlays, saturated color
- **minimal** — clean backgrounds, simple type, generous whitespace, quiet audio
- **documentary** — B-roll heavy, interview-style framing, soft music, natural palette
- **tutorial** — screencast-driven, zoom/pan emphasis, explanation-forward captions
- **ugc-handheld** — phone-camera feel, raw edits, authentic and unpolished
- **motion-graphic** — animated type, shape play, no live footage
- **kinetic-type** — word-heavy, text-as-subject, rhythmic cuts to beats

After the user selects, read `styles/<slug>.md` for the full treatment spec (palette, typography, pacing, caption style, music genre hints, transition recipes).

## 9. Step 4: Collect Source

Each mode needs input material. Consult `modes/<slug>.md` for the required input type and collection workflow:

- `product-reel` — product page URL
- `talking-head` — source content path (docs/notes/script)
- `clip-repurpose` — long-form video path or URL
- `polish` — existing video file path
- `beat-sync-reel` — product images + audio (file, URL, or search query)

## 10. Step 5: Dispatch

Once mode + format + style + source are known, invoke the underlying sub-skill with the consolidated parameters. The router is responsible for translating format + style into sub-skill parameters (e.g., setting aspect ratio flags, selecting a music track, applying a caption template).

See `modes/<slug>.md` for the exact dispatch contract per mode.

## 11. Step 6: Deliver

Return the sub-skill's output to the user. Standardize the delivery format:

- Output video file path(s) with duration, resolution, file size
- Thumbnail/poster frame if applicable
- Caption file (.srt or .vtt) if captions were generated
- Per-platform upload hints if format maps cleanly to a known platform

## 12. Special Modes

- **"Surprise me"** — Pick `product-reel` with `vertical-short` format and `energetic` style. Ask only for the product URL.
- **Multi-format** — If the user says "make this as both a vertical-short and a square-social," run the mode twice with different format flags. Save outputs in separate subdirectories.
- **Mode preview** — Before committing to full generation, produce a single-scene preview so the user can approve the visual direction before paying for full API calls (especially relevant for `product-reel` via Higgsfield and `talking-head` via HeyGen).

## 13. File Reference

### Modes
| File | Description |
|------|-------------|
| `modes/index.json` | Canonical list of all modes |
| `modes/product-reel.md` | Dispatch spec for `packs/video-production/product-reel-generator` |
| `modes/talking-head.md` | Dispatch spec for `packs/video-production/talking-head-video` |
| `modes/clip-repurpose.md` | Dispatch spec for `packs/video-production/video-clipper` |
| `modes/polish.md` | Dispatch spec for `packs/video-production/video-polish` |
| `modes/beat-sync-reel.md` | Dispatch spec for `packs/video-production/beat-sync-reel` |

### Formats
| File | Description |
|------|-------------|
| `formats/index.json` | Canonical list of all formats |
| `formats/vertical-short.md` | 9:16, 15–60s (TikTok, Reels, Shorts) |
| `formats/vertical-story.md` | 9:16, 15–30s (Stories) |
| `formats/square-social.md` | 1:1, 15–30s (Instagram/LinkedIn feed) |
| `formats/landscape-short.md` | 16:9, 30–90s (YouTube, LinkedIn) |
| `formats/landscape-long.md` | 16:9, 3–10min (long-form, tutorials) |

### Styles
| File | Description |
|------|-------------|
| `styles/index.json` | Canonical list of all style presets |
| `styles/<slug>.md` | Per-style spec: palette, typography, pacing, caption style, music hints |

### Sources
| File | Description |
|------|-------------|
| `sources/stock-footage.md` | Pexels / Pixabay video search and embedding |
| `sources/music.md` | Royalty-free music selection |
| `sources/captions.md` | Transcription + caption styling (Whisper, Remotion captions) |
