---
name: goose-graphics
description: Portable visual skill pack for the Agent Skills ecosystem (Claude Code, Claude Desktop, Claude Cowork, Claude Design, Goose, Cursor, Codex). Ships 36 aesthetic presets in DESIGN.md format, 7 social-first format specs, extract-style from reference images, and automatic PNG export via Playwright.
---

## 1. Overview

`goose-graphics` is a portable visual skill pack for the Agent Skills ecosystem. It bundles 36 aesthetic presets (each authored in the VoltAgent 9-section DESIGN.md format), 7 social-first format specs (carousel, story, infographic, slides, poster, chart, tweet), an extract-style workflow for reference images, and a Playwright-based HTML-to-PNG export pipeline.

It loads in any host that reads `SKILL.md` — Claude Code agents calling it for automated render, Goose pipelines wiring it into content generation, Cursor/Codex projects picking it up via `.cursor/rules/` or `~/.codex/skills/`. Individual style files under `styles/_full/<slug>.md` are authored to Claude Design's DESIGN.md spec so they can also be uploaded directly into CD as design-system scaffolds.

Everything is self-contained: format templates, style systems, image sourcing instructions, and the screenshot pipeline all live within this skill pack directory.

## 2. Invocation

This skill supports **three invocation modes** — all-args, partial-args, and interactive. Pick the fastest path for the ask.

### 2.1 Full-args invocation (fastest path)

```
/goose-graphics --style <slug> --format <format> [--brief "..."] [--ref <image-path>]
```

- `--style <slug>` — one of the preset slugs (see `styles/index.json` or §6). Required for style-selected generation. Omit to let the user pick interactively.
- `--format <format>` — one of `carousel`, `story`, `infographic`, `slides`, `poster`, `chart`, `tweet`. Required for format-selected generation.
- `--brief "..."` — the topic / content description. Replaces the Content Discovery phase.
- `--ref <image-path>` — if present, extract an ad-hoc style from the reference image for this single render instead of using a preset. When `--ref` is provided, `--style` is ignored. **For creating a persistent named style preset that includes example renders, use the dedicated `/create-goose-graphics-style` skill instead.**

**Three branches:**

1. **All required args present** (`--style` + `--format` + `--brief` OR `--ref` + `--format` + `--brief`) → skip discovery, skip style selection, proceed directly to §7 (Set Output Path) and §8 (Generate HTML).
2. **Partial args** → ask only for the missing pieces. If `--style` is set but `--format` is not, ask only for format. If `--brief` is missing, ask only for the topic/content.
3. **No args** → run the interactive flow from §3 onward.

### 2.2 Examples

```bash
# Full args — one-shot generate
/goose-graphics --style matt-gray --format carousel --brief "How founders find their first 100 customers in 2026"

# Reference-driven — extract a one-off style from an image and build with it
/goose-graphics --ref ~/Desktop/mood.png --format poster --brief "Summer studio open house, August 14"

# Partial — Claude asks for the missing brief
/goose-graphics --style deep-ocean --format slides

# No args — full interactive flow
/goose-graphics
```

To **create a persistent named style preset** (slim spec + all 7 format example renders + index/manifest registration), use the dedicated `/create-goose-graphics-style` skill instead.

### 2.3 Defaults when args are partial but unambiguous

- If `--brief` is missing but clearly inferable from subsequent user text, don't block — proceed.
- If `--format` is missing, default to asking (there is no safe default across formats).
- If `--style` is missing and `--ref` is missing, ask — style is load-bearing.

## 3. Host compatibility

`SKILL.md` (this file) auto-loads on most Agent Skills hosts once the pack is installed at the right path. Claude Design is the one host that does not auto-load skill packs — instead, it consumes individual style files (DESIGN.md) via manual upload from `styles/_full/<slug>.md`.

| Host | Install | Notes |
|---|---|---|
| Claude Code | `npx goose-skills install goose-graphics --claude` | Lands at `~/.claude/skills/goose-graphics/` |
| Claude Desktop | (same install as above) | Auto-shared — Desktop reads `~/.claude/skills/` |
| Claude Cowork | (same install as above) | Built on Claude Desktop; same skill dir |
| Goose (Block) | (same install as above) | Auto-discovers `~/.claude/skills/` + `~/.config/goose/skills/` |
| Cursor | `npx goose-skills install goose-graphics --cursor --project-dir .` | Writes `.cursor/rules/goose-goose-graphics.mdc` |
| Codex (OpenAI) | `npx goose-skills install goose-graphics --codex` | Writes `~/.codex/skills/goose-graphics/` |
| Claude Design | Download a DESIGN.md from styles.gooseworks.ai and upload via CD's "Create new design system" | Per-style DESIGN.md upload; no CLI sync |

## 4. First-Run Setup

Before first use, check whether the screenshot tool's dependencies are installed. Look for a `node_modules/` directory inside the `screenshot/` folder (relative to this skill file).

If `node_modules/` does **not** exist, run:

```bash
cd [skill-pack-dir]/screenshot && npm install && npx playwright install chromium
```

Replace `[skill-pack-dir]` with the absolute path to the directory containing this SKILL.md file.

## 5. Interactive Workflow

```
1. Discover Intent   --> What format? What content?
2. Select Style      --> Choose from 36 presets or extract from reference image
3. Select Sources    --> Unsplash photos? ASCII art? None?
4. Set Output Path   --> Where to save exports
5. Generate HTML     --> Using format skill + style preset + sources
6. Screenshot        --> Playwright PNG export
7. Deliver           --> Present results with file listing
```

## 6. Step 1: Discover Intent

Ask the user what they want to create. Present these format options:

| Format | Dimensions | Best For |
|--------|-----------|----------|
| **Carousel** | 1080x1080px per slide | LinkedIn, Instagram multi-slide posts |
| **Story** | 1080x1920px per slide | Instagram/LinkedIn Stories, TikTok, Snapchat |
| **Infographic** | 1080px wide, variable height | Social media, blog embeds |
| **Slides** | 1920x1080px per slide | Presentations, webinars |
| **Poster** | 1080x1350px | Instagram posts, event flyers |
| **Chart** | 1080x1080px | Single data chart graphic |
| **Tweet** | 1080x1080px | Tweet-sized square screenshot |

Once the user chooses a format, read the corresponding format skill file:

```
formats/carousel.md
formats/story.md
formats/infographic.md
formats/slides.md
formats/poster.md
formats/chart.md
formats/tweet.md
```

Then follow that format skill's **Content Discovery** phase to gather the topic, content, and any other format-specific inputs from the user.

## 7. Step 2: Select Style

Present the **34 style presets**, grouped by mood. The canonical list lives in `styles/index.json` — when in doubt, read that file.

**Dark & Moody**
1. **Midnight Editorial** — Dark, elegant magazine aesthetic with copper accents.
2. **Deep Ocean** — Calm cyan glow on deep blue-black.
3. **Golden Dusk** — Warm gold highlights on dark navy.
4. **Terminal** — Green-on-dark monospace hacker aesthetic.
5. **BW Editorial Drop** — Grayscale photo top + yellow Anton display on black drop panel.
6. **Masked Object Editorial** — Navy + photo clipped into an object silhouette + italic Playfair.

**Light & Editorial**
7. **Clean Slate** — Ultra-minimal white canvas, single blue accent.
8. **Paper & Ink** — Classic serif editorial with red accent on cream.
9. **Matt Gray** — Playfair italic green + yellow pill tags on light gray.
10. **Magazine Red** — Massive tomato-red condensed headlines on cream paper.
11. **Sunburst Editorial** — Mid-century book cover feel with serif + collage accents.
12. **Product Minimal** — Apple-style white canvas, hero product photo, underlined URL.
13. **Archive Fashion** — Stone beige catalog frame + brown photo inset + pink sticker.

**Organic & Warm**
14. **Warm Earth** — Organic terracotta and sage on cream.
15. **Garden Blur** — Soft botanical backgrounds with translucent card overlays.
16. **Peach Pop** — DTC beauty: monospace testimonials on peach + blue blocks.
17. **Pastel Organic Shapes** — Cream canvas with one pistachio circle half off-frame.
18. **Aurora App Launch** — Rainbow mesh gradient + phone mockup + frosted-glass footer.

**Bold & Energetic**
19. **Electric Burst** — Bold neon yellow and hot pink on black.
20. **Highlighter Yellow** — Saturated yellow + heavy black sans + white-rect italic emphasis.
21. **Heatwave Orange** — Three-variant white/orange/black system + line-wave accents.
22. **Split Yellow Product** — Vivid mustard 2/3 headline slab + gray body panel + yellow photo.
23. **Blueprint Sticky** — Cobalt blueprint grid + tilted pink/yellow sticky notes.

**Retro & Cinematic**
24. **Cinematic Romance** — Portrait photo canvas + hot pink chancery script headlines.
25. **Vintage Duotone Poster** — Forest green + dusty pink halftone, 1950s letterpress.
26. **Retro Line Art** — Powder blue + cream hand-drawn cocktail-poster line art.
27. **Iridescent Y2K** — Brutalist grid + chrome iridescent blob hero, Y2K club poster.
28. **Ink Doodle Event** — Kraft paper + loose hand-drawn ink character + Yellowtail script.

**Structural & Technical**
29. **Brutalist** — Raw heavy borders, system fonts, no decoration.
30. **Frosted Lens** — Glassmorphism + blurred photography backgrounds.
31. **Card Toss** — Scattered tilted cards with sticky-note energy.
32. **Venn Infographic** — Translucent three-circle Venn diagrams + floating info cards.
33. **Social Post Card** — Blurred real scene + simulated Instagram post card as hero.

**Friendly Corporate**
34. **Mint Pixel Corporate** — Pale mint + lime pixel-staircase corner decorations.

The user may also say: **"I have a reference image"** — in that case, read `styles/extract-style.md` and follow its workflow to derive a custom style in slim format from the provided image. The extracted style is saved to `styles/<name>.md` alongside the presets and is immediately usable. After the style is saved, continue the workflow from Step 3 onward using the newly created style.

After the user selects a preset, read the corresponding style file from `styles/<slug>.md` (e.g., `styles/midnight-editorial.md`, `styles/heatwave-orange.md`). Each slim style file contains everything you need to generate: palette, typography, layout, do/don'ts, and ready-to-paste CSS snippets. For the full prose deep-dive (rare — use for extract-style prompting or when nuance is missing), read `styles/_full/<slug>.md`.

## 8. Step 3: Image Sources (Optional)

Ask the user: **"Do you want to include images in your graphic?"**

Options:

- **Unsplash photos** — Read `sources/unsplash.md` and follow its search workflow to find and embed high-quality stock photography.
- **ASCII art decorations** — Read `sources/ascii-art.md` and follow its workflow to generate and embed ASCII art elements.
- **Both** — Read both source files and incorporate both types.
- **No images** — Skip this step entirely. The graphic will use pure CSS/HTML styling only.

## 9. Step 4: Output Path

Ask the user: **"Where should I save the exports?"**

Default location: `./goose-graphics-exports/`

Within that directory, create a subfolder using this naming convention:

```
[YYYY-MM-DD]-[slugified-name]/
```

For example: `2026-04-17-q2-product-roadmap/`

## 10. Step 5: Generate HTML

Follow the chosen format skill's **HTML Generation** phase. When generating:

- Apply the chosen style preset's CSS variables, typography rules, color palette, and spacing system — the slim style file has everything you need.
- Incorporate image sources (Unsplash URLs or ASCII art blocks) if the user selected any in Step 3.
- Follow the format skill's content density limits and structural requirements exactly.
- Write all HTML files to the output directory established in Step 4.

## 11. Step 6: Screenshot

Run the screenshot script to export HTML files to high-resolution PNGs:

```bash
node [skill-pack-dir]/screenshot/screenshot.js --format FORMAT --input INPUT_PATH --output OUTPUT_PATH
```

Where:
- `[skill-pack-dir]` is the absolute path to this skill pack's directory.
- `FORMAT` is one of: `carousel`, `story`, `infographic`, `slides`, `poster`, `chart`, `tweet`.
- `INPUT_PATH` is the directory or file containing the generated HTML.
- `OUTPUT_PATH` is the directory where PNG files should be saved.

## 12. Step 7: Deliver

Present the results to the user:

- List all generated files (HTML source files and PNG exports) with their file sizes.
- Provide the full path to the output directory.
- Suggest how to preview: open the HTML files in a browser, or view the PNG files directly.
- For carousels and slides, note the slide count and order.

## 13. Special Modes

- **"Surprise me"** — Pick the carousel format and a random style preset from `styles/index.json`. Ask the user only for content/topic, then generate everything else automatically.
- **Multi-format** — If the user says "make this as both a carousel and an infographic," run the full workflow twice using the same content and style but different format skills. Save outputs in separate subdirectories.
- **Style preview** — Before committing to full generation, produce a single sample slide or section so the user can approve the visual direction. If they want changes, adjust the style or switch presets before generating the rest.

## 14. File Reference

### Formats
| File | Description |
|------|-------------|
| `formats/carousel.md` | Multi-slide square carousel (1080x1080px). LinkedIn/Instagram. |
| `formats/story.md` | Vertical 9:16 stories (1080x1920px). Instagram/LinkedIn Stories, TikTok. |
| `formats/infographic.md` | Tall vertical infographic (1080px wide, variable height). |
| `formats/slides.md` | Widescreen presentation slides (1920x1080px). |
| `formats/poster.md` | Portrait poster graphic (1080x1350px). |
| `formats/chart.md` | Single data chart graphic. |
| `formats/tweet.md` | Tweet-sized square screenshot. |

### Styles

The canonical list of all 36 style presets lives in `styles/index.json` (slug, display name, mood group, one-line tagline). Individual slim style files at `styles/<slug>.md` give you the full spec (palette, typography, layout, do/don't, CSS snippets). Archived full-prose versions live in `styles/_full/<slug>.md` if you need the deeper atmospheric reference.

Ad-hoc styles extracted via `--ref` or the "I have a reference image" interactive option may be saved to `styles/<name>.md` in the same slim format as presets, but they are not added to `index.json` and ship without example renders. To create a properly registered preset with full example coverage, use the `/create-goose-graphics-style` skill.

### Image Sources
| File | Description |
|------|-------------|
| `sources/unsplash.md` | Search and embed Unsplash stock photography. |
| `sources/ascii-art.md` | Generate and embed ASCII art decorations. |

### Screenshot Tool
| File | Description |
|------|-------------|
| `screenshot/screenshot.js` | Playwright-based HTML-to-PNG export script. |
| `screenshot/package.json` | Node.js dependencies for the screenshot tool. |

### Examples
| Path | Description |
|------|-------------|
| `examples/<style-slug>/` | Per-style example output directories. |
| `examples/references/canva-figma/` | Canva + Figma style reference screenshots. |
