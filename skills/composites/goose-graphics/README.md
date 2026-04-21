# goose-graphics — Agent Skills pack for visual graphics

`goose-graphics` is a portable visual skill pack for the Agent Skills ecosystem. It bundles 36 aesthetic presets (each authored in the VoltAgent 9-section DESIGN.md format), 7 social-first format specs (carousel, story, infographic, slides, poster, chart, tweet), an extract-style workflow for reference images, and a Playwright-based HTML-to-PNG export pipeline.

Any host that reads `SKILL.md` can load the pack — Claude Code agents calling it for automated render, Goose pipelines wiring it into content generation, Cursor/Codex projects picking it up via `.cursor/rules/` or `~/.codex/skills/`. Individual style files under `styles/_full/<slug>.md` are authored to Claude Design's DESIGN.md spec so they can also be uploaded directly into CD as design-system scaffolds.

## Host compatibility

`SKILL.md` auto-loads on most Agent Skills hosts once the pack is installed at the right path. Claude Design is the one host that does not auto-load skill packs — instead, it consumes individual style files (DESIGN.md) via manual upload from `styles/_full/<slug>.md`.

| Host | Install | Notes |
|---|---|---|
| Claude Code | `npx goose-skills install goose-graphics --claude` | Lands at `~/.claude/skills/goose-graphics/` |
| Claude Desktop | (same install as above) | Auto-shared — Desktop reads `~/.claude/skills/` |
| Claude Cowork | (same install as above) | Built on Claude Desktop; same skill dir |
| Goose (Block) | (same install as above) | Auto-discovers `~/.claude/skills/` + `~/.config/goose/skills/` |
| Cursor | `npx goose-skills install goose-graphics --cursor --project-dir .` | Writes `.cursor/rules/goose-goose-graphics.mdc` |
| Codex (OpenAI) | `npx goose-skills install goose-graphics --codex` | Writes `~/.codex/skills/goose-graphics/` |
| Claude Design | Download a DESIGN.md from styles.gooseworks.ai and upload via CD's "Create new design system" | Per-style DESIGN.md upload; no CLI sync |

## Directory Structure

```
goose-graphics/
  SKILL.md                        # Entry-point skill (router)
  README.md                       # This file
  skill.meta.json                 # Goose-skills installation metadata
  .claude-plugin/plugin.json      # Claude Code plugin descriptor
  formats/                        # 7 format specs
    carousel.md, story.md, infographic.md, slides.md,
    poster.md, chart.md, tweet.md
  styles/                         # 36 slim style preset files + tools
    index.json                    # Canonical list of all 36 presets
    <slug>.md × 36                # Slim presets (~6-8KB each)
    extract-style.md              # Derive a custom style from a reference image
    _full/                        # Full-prose archive (~30KB each)
      <slug>.md × 36
  sources/
    unsplash.md, ascii-art.md
  screenshot/
    screenshot.js, package.json   # Playwright HTML-to-PNG export
  examples/
    <style-slug>/                 # Per-style example outputs
    references/canva-figma/       # Canva + Figma reference screenshots
```

## Formats

| Format | Dimensions | Output |
|--------|-----------|--------|
| Carousel | 1080x1080px per slide | One PNG per slide (up to 10) |
| Story | 1080x1920px per slide | One PNG per slide (up to 10) |
| Infographic | 1080px wide, variable height | Single PNG |
| Slides | 1920x1080px per slide | One PNG per slide |
| Poster | 1080x1350px | Single PNG |
| Chart | 1080x1080px | Single PNG |
| Tweet | 1080x1080px | Single PNG |

## Style Presets (36 total)

The single source of truth is `styles/index.json`. The README, SKILL.md, and any consuming tool should read from that file. Presets are grouped into 7 moods:

| Group | Count | Slugs |
|-------|-------|-------|
| Dark & Moody | 7 | `midnight-editorial`, `deep-ocean`, `golden-dusk`, `terminal`, `bw-editorial-drop`, `masked-object-editorial`, `grid-quote-editorial` |
| Light & Editorial | 7 | `clean-slate`, `paper-and-ink`, `matt-gray`, `magazine-red`, `sunburst-editorial`, `product-minimal`, `archive-fashion` |
| Organic & Warm | 6 | `warm-earth`, `garden-blur`, `soft-cloud`, `peach-pop`, `pastel-organic-shapes`, `aurora-app-launch` |
| Bold & Energetic | 5 | `electric-burst`, `highlighter-yellow`, `heatwave-orange`, `split-yellow-product`, `blueprint-sticky` |
| Retro & Cinematic | 5 | `cinematic-romance`, `vintage-duotone-poster`, `retro-line-art`, `iridescent-y2k`, `ink-doodle-event` |
| Structural & Technical | 5 | `brutalist`, `frosted-lens`, `card-toss`, `venn-infographic`, `social-post-card` |
| Friendly Corporate | 1 | `mint-pixel-corporate` |

You can also extract a custom style from any reference image via `styles/extract-style.md`.

## Slim vs Full Style Files

Each style ships in two forms:

- **Slim** (`styles/<slug>.md`) — ~6-8KB each. A tight, consistent spec: palette (hex + role), typography rules (fonts, weights, tracking, Google Fonts link), layout rules, do/don't list, and reusable CSS snippets. **This is what the skill loads during generation.** Designed to fit comfortably inside a prompt without ballooning context.
- **Full** (`styles/_full/<slug>.md`) — ~30KB each. The original atmospheric prose brief with extensive component patterns, format adaptation notes, and detailed rationale. Preserved verbatim from the pre-slim baseline. Use this when you need the long-form voice — for extract-style prompting, when the slim file is ambiguous, or when building net-new related styles.

All 36 styles follow the same slim template so Claude and humans can both reason about them predictably.

## Args-based Invocation

This skill supports three invocation modes. See SKILL.md §2 for full details.

```bash
# Full args — one-shot generate (fastest)
/goose-graphics --style matt-gray --format carousel --brief "How founders find their first 100 customers"

# Reference-driven — extract style from image, then build
/goose-graphics --ref ~/Desktop/mood.png --format poster --brief "Studio open house"

# Partial args — Claude asks only for what's missing
/goose-graphics --style deep-ocean --format slides

# No args — full interactive flow
/goose-graphics
```

Flags:

- `--style <slug>` — any slug in `styles/index.json`
- `--format <format>` — `carousel` · `story` · `infographic` · `slides` · `poster` · `chart` · `tweet`
- `--brief "..."` — topic / content description
- `--ref <image-path>` — use image-to-style extraction instead of a preset

## Image Sourcing

- **Unsplash** — Search and embed high-quality stock photography (requires `UNSPLASH_ACCESS_KEY` environment variable).
- **ASCII art** — Generate decorative ASCII art elements via CSS/HTML.

## Installation

```bash
cd screenshot && npm install && npx playwright install chromium
```

For cross-platform installation via the `goose-skills` CLI:

```bash
npx goose-skills install goose-graphics
```

See `skill.meta.json` for installation metadata.

## Usage

Invoke via `/goose-graphics` in Claude Code. The skill walks you through format selection, style choice, image sourcing, and HTML generation, then automatically exports PNGs — or jump straight to generate by passing args (see above).

## Testing

Automated testing harness lives in a separate workstream (GOOSE-1357) — check the `testing/` subdirectory once that lands.
