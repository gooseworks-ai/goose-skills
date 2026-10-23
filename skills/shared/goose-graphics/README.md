# goose-graphics — Agent Skills pack for visual graphics

`goose-graphics` is a portable visual skill pack for the Agent Skills ecosystem. Styles and formats live in the central Gooseworks library — fetched on demand via `npx gooseworks` instead of bundled into this repo. The skill pairs that catalog with an extract-style workflow for reference images, an Unsplash + ASCII art image-sourcing layer, and a Playwright-based HTML-to-PNG export pipeline.

Any host that reads `SKILL.md` can load the pack — Claude Code agents calling it for automated render, Goose pipelines wiring it into content generation, Cursor/Codex projects picking it up via `.cursor/rules/` or `~/.codex/skills/`. Each published style ships a slim DESIGN.md spec, fetchable via `npx gooseworks styles get <slug>`, that can also be uploaded directly into Claude Design as a design-system scaffold.

## Host compatibility

`SKILL.md` auto-loads on most Agent Skills hosts once the pack is installed at the right path. Claude Design is the one host that does not auto-load skill packs — instead, it consumes individual style files (DESIGN.md) one at a time, fetched on demand via `npx gooseworks styles get <slug>`.

| Host | Install | Notes |
|---|---|---|
| Claude Code | `npx goose-skills install goose-graphics --claude` | Lands at `~/.claude/skills/goose-graphics/` |
| Claude Desktop | (same install as above) | Auto-shared — Desktop reads `~/.claude/skills/` |
| Claude Cowork | (same install as above) | Built on Claude Desktop; same skill dir |
| Goose (Block) | (same install as above) | Auto-discovers `~/.claude/skills/` + `~/.config/goose/skills/` |
| Cursor | `npx goose-skills install goose-graphics --cursor --project-dir .` | Writes `.cursor/rules/goose-goose-graphics.mdc` |
| Codex (OpenAI) | `npx goose-skills install goose-graphics --codex` | Writes `~/.codex/skills/goose-graphics/` |
| Claude Design | `npx gooseworks styles get <slug>` → upload the resulting DESIGN.md via CD's "Create new design system" | Per-style DESIGN.md upload; no CLI sync |

## Directory Structure

```
goose-graphics/
  SKILL.md                        # Entry-point skill (router)
  README.md                       # This file
  skill.meta.json                 # Goose-skills installation metadata
  .claude-plugin/plugin.json      # Claude Code plugin descriptor
  extract-style.md                # Derive a publishable custom style from a reference image
  sources/
    unsplash.md, ascii-art.md     # Image-sourcing helpers
  screenshot/
    screenshot.js, package.json   # Playwright HTML-to-PNG export
```

Styles, formats, and example renders live in the central Gooseworks library — discoverable via `npx gooseworks styles list` and `npx gooseworks formats list`.

## Discovering styles and formats

```bash
npx gooseworks styles list
npx gooseworks styles search "warm editorial"
npx gooseworks styles get <slug>          # returns the slim DESIGN.md

npx gooseworks formats list
npx gooseworks formats get <slug>         # returns the format spec
```

Always list or search before assuming a slug exists — the catalog is community-driven.

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

- `--style <slug>` — any slug returned by `npx gooseworks styles list`
- `--format <slug>` — any slug returned by `npx gooseworks formats list`
- `--brief "..."` — topic / content description
- `--ref <image-path>` — use image-to-style extraction instead of a preset

## Publishing styles and formats

When the user creates a new aesthetic via `extract-style.md` (or `/goose-graphics-create-style`) and wants other agents to discover it, publish to the catalog:

```bash
cd <working-dir-with-bundle>
npx gooseworks styles publish      # uses gooseworks-style.json
npx gooseworks formats publish     # uses gooseworks-format.json
```

See SKILL.md §17 for the manifest shapes.

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
