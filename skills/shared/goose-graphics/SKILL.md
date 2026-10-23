---
name: goose-graphics
description: Portable visual skill pack for the Agent Skills ecosystem (Claude Code, Claude Desktop, Claude Cowork, Claude Design, Goose, Cursor, Codex). Discovers community-published styles + formats via the gooseworks CLI, runs an extract-style workflow on reference images, and exports rendered PNGs via Playwright.
---

## 1. Overview

`goose-graphics` is a portable visual skill pack for the Agent Skills ecosystem. Styles and formats live in the central Gooseworks library — fetched on demand via `npx gooseworks` instead of bundled into this repo. The skill pairs that catalog with an extract-style workflow for reference images, an Unsplash + ASCII art image-sourcing layer, and a Playwright-based HTML-to-PNG export pipeline.

It loads in any host that reads `SKILL.md` — Claude Code agents calling it for automated render, Goose pipelines wiring it into content generation, Cursor/Codex projects picking it up via `.cursor/rules/` or `~/.codex/skills/`. Each style ships a slim DESIGN.md spec via `npx gooseworks styles get <slug>`, which can also be uploaded directly into Claude Design as a design-system scaffold.

Format templates, image-sourcing helpers, and the screenshot pipeline live in this skill pack. Styles, formats, and example renders are fetched on demand from the central library — no slugs are baked in.

## 2. Invocation

This skill supports **three invocation modes** — all-args, partial-args, and interactive. Pick the fastest path for the ask.

### 2.1 Full-args invocation (fastest path)

```
/goose-graphics --style <slug> --format <format> [--brief "..."] [--ref <image-path>]
```

- `--style <slug>` — any community-published style slug. Discover with `npx gooseworks styles list` / `search`. Required for style-selected generation. Omit to let the user pick interactively.
- `--format <format>` — any community-published format slug (e.g., `carousel`, `story`, `infographic`, `slides`, `poster`, `chart`, `tweet`, plus any community additions). Discover with `npx gooseworks formats list`. Required for format-selected generation.
- `--brief "..."` — the topic / content description. Replaces the Content Discovery phase.
- `--ref <image-path>` — if present, extract an ad-hoc style from the reference image for this single render instead of using a preset. When `--ref` is provided, `--style` is ignored. **For creating a persistent published style that other agents can discover, use the dedicated `/goose-graphics-create-style` skill instead.**

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

To **create a persistent published style** (slim spec + hero render + a few additional examples, pushed to the central library so other agents can discover it), use the dedicated `/goose-graphics-create-style` skill instead.

### 2.3 Defaults when args are partial but unambiguous

- If `--brief` is missing but clearly inferable from subsequent user text, don't block — proceed.
- If `--format` is missing, default to asking (there is no safe default across formats).
- If `--style` is missing and `--ref` is missing, ask — style is load-bearing.

## 3. Discovering styles and formats

Styles and formats live in the central Gooseworks library, not in this skill pack. **Always list or search before assuming a slug exists** — the catalog is community-driven and changes over time.

```bash
# List or search styles
npx gooseworks styles list
npx gooseworks styles search "warm editorial"
npx gooseworks styles list --mood "Organic & Warm" --tag warm

# Fetch a specific style's DESIGN.md (the slim spec) — pipe into Claude Design,
# or include in the agent context for HTML generation
npx gooseworks styles get <slug>

# Same shape for formats
npx gooseworks formats list
npx gooseworks formats search "vertical"
npx gooseworks formats get <slug>
```

When the user names a style or format, run `list` / `search` first, then `get` the spec for the chosen slug. Never assume a slug exists from memory — slugs come and go as the community publishes and retires entries.

## 4. Publishing your style

When the user creates a new aesthetic via `extract-style.md` (or via the dedicated `/goose-graphics-create-style` skill) and is happy with it, publish it to the community library so other agents and users can discover it:

```bash
cd <directory-with-rendered-examples>
npx gooseworks styles publish
```

The CLI expects a `gooseworks-style.json` manifest in the working directory plus the referenced PNG files. See **§13 Manifest format** for the exact shape.

### 4.1 Description-writing guidelines (load-bearing)

The description is what makes the style discoverable by AI agents searching the catalog. Treat it as a search index, not flavor text.

- **50–200 words, keyword-dense.**
- **Lead with mood + use case.** "Bold magazine-cover energy for product launches and event posters."
- **Mention typography signals.** "Massive condensed sans-serif headlines paired with a delicate body serif."
- **Mention palette signals.** "Rust orange + cream + near-black."
- **Mention industry / audience fit if relevant.** "DTC beauty, indie publishing, event flyers."
- **Avoid generic adjectives alone.** "Beautiful," "modern," "clean" mean nothing without concrete signals — pair them with palette, typography, or industry context.

### 4.2 Tag-writing guidelines

- **3–10 lowercase tags.**
- Cover: **mood** (warm, dark, energetic), **density** (sparse, dense), **formality** (corporate, editorial, playful), **era** (mid-century, y2k, retro), **industry-fit** (saas, dtc, beauty, finance).
- Skip tags that just restate the name.

### 4.3 Example count guidance

- **Hero is mandatory** — exactly one example marked `isHero: true`. Pick the format that best showcases the style.
- **2–3 additional formats recommended** so the directory tile shows variety.
- **Hero priority order** if you can render multiple: `poster > carousel > infographic > slides > chart > story > tweet`.

## 5. Publishing your format

When the existing community-published formats don't fit the user's canvas (e.g., LinkedIn banner 1584×396, story cover 1080×1920, event flyer 8.5×11in), use the sibling `/goose-graphics-create-format` skill to produce a format spec and at least one rendered example, then publish:

```bash
cd <directory-with-format-bundle>
npx gooseworks formats publish
```

Format publishing **requires at least one rendered example** — the backend rejects an empty `examples` array. See **§13 Manifest format** for the exact shape of `gooseworks-format.json`.

Description and tag guidelines for formats follow the same rules as styles (§4.1, §4.2), but lead with **dimensions + content density** instead of mood:

> "1080×1920 vertical canvas for Instagram and TikTok stories. Single-panel composition, 5-word title max, large hero image or stat. Use for quick announcements and engagement posts where the viewer scrolls past in 2 seconds."

## 6. Host compatibility

`SKILL.md` (this file) auto-loads on most Agent Skills hosts once the pack is installed at the right path. Claude Design is the one host that does not auto-load skill packs — instead, it consumes individual style files (DESIGN.md) one at a time via manual upload, fetched on demand via `npx gooseworks styles get <slug>`.

| Host | Install | Notes |
|---|---|---|
| Claude Code | `npx goose-skills install goose-graphics --claude` | Lands at `~/.claude/skills/goose-graphics/` |
| Claude Desktop | (same install as above) | Auto-shared — Desktop reads `~/.claude/skills/` |
| Claude Cowork | (same install as above) | Built on Claude Desktop; same skill dir |
| Goose (Block) | (same install as above) | Auto-discovers `~/.claude/skills/` + `~/.config/goose/skills/` |
| Cursor | `npx goose-skills install goose-graphics --cursor --project-dir .` | Writes `.cursor/rules/goose-goose-graphics.mdc` |
| Codex (OpenAI) | `npx goose-skills install goose-graphics --codex` | Writes `~/.codex/skills/goose-graphics/` |
| Claude Design | `npx gooseworks styles get <slug>` → upload the resulting DESIGN.md via CD's "Create new design system" | Per-style DESIGN.md upload; no CLI sync |

## 7. First-Run Setup

Before first use, check whether the screenshot tool's dependencies are installed. Look for a `node_modules/` directory inside the `screenshot/` folder (relative to this skill file).

If `node_modules/` does **not** exist, run:

```bash
cd [skill-pack-dir]/screenshot && npm install && npx playwright install chromium
```

Replace `[skill-pack-dir]` with the absolute path to the directory containing this SKILL.md file.

## 8. Interactive Workflow

```
1. Discover Intent   --> What format? What content?
2. Select Style      --> Pick from the catalog or extract from reference image
3. Select Sources    --> Unsplash photos? ASCII art? None?
4. Set Output Path   --> Where to save exports
5. Generate HTML     --> Using format spec + style spec + sources
6. Screenshot        --> Playwright PNG export
7. Deliver           --> Present results with file listing
```

## 9. Step 1: Discover Intent

Ask the user what they want to create. Run `npx gooseworks formats list` to see the current catalog. The seven baseline formats are:

| Format | Dimensions | Best For |
|--------|-----------|----------|
| **Carousel** | 1080x1080px per slide | LinkedIn, Instagram multi-slide posts |
| **Story** | 1080x1920px per slide | Instagram/LinkedIn Stories, TikTok, Snapchat |
| **Infographic** | 1080px wide, variable height | Social media, blog embeds |
| **Slides** | 1920x1080px per slide | Presentations, webinars |
| **Poster** | 1080x1350px | Instagram posts, event flyers |
| **Chart** | 1080x1080px | Single data chart graphic |
| **Tweet** | 1080x1080px | Tweet-sized square screenshot |

The community library may publish additional formats (story covers, podcast covers, square testimonials, etc.) — always run `list` first rather than assuming only the seven baseline slugs exist. Note that every community format must use one of the seven canvas sizes above (the renderer is locked to that allow-list); they differ from the baselines only in name, intent, and content rules. If no published format fits the user's needs, suggest the `/goose-graphics-create-format` skill.

Once the user chooses a format, fetch its full spec:

```bash
npx gooseworks formats get <format-slug>
```

The returned `spec.md` (or content rules) describes layout, content density, and per-section content rules. Follow its **Content Discovery** phase to gather the topic, content, and any other format-specific inputs from the user.

## 10. Step 2: Select Style

If the user hasn't specified a style, point them at the full catalog so they can browse visually:

> Browse the style catalog at **https://skills.gooseworks.ai/styles** to see every published style with rendered examples.

Then run `npx gooseworks styles list` (or `search "..."` / `list --mood "..." --tag ...`) to surface relevant options inline. Present the candidates in groups by mood with their taglines so the user can pick.

The user may also say: **"I have a reference image"** — in that case, read `extract-style.md` (in this skill pack) and follow its workflow to derive a custom style from the provided image. That workflow ends in a publishable bundle (`gooseworks-style.json` + rendered PNGs) the user can publish via `npx gooseworks styles publish`. After publishing, continue the workflow from Step 3 onward using the new slug.

After the user picks a slug, fetch its slim spec:

```bash
npx gooseworks styles get <slug>
```

The returned DESIGN.md contains everything you need to generate: palette, typography, layout, do/don'ts, and ready-to-paste CSS snippets.

## 11. Step 3: Image Sources (Optional)

Ask the user: **"Do you want to include images in your graphic?"**

Options:

- **Unsplash photos** — Read `sources/unsplash.md` and follow its search workflow to find and embed high-quality stock photography.
- **ASCII art decorations** — Read `sources/ascii-art.md` and follow its workflow to generate and embed ASCII art elements.
- **Both** — Read both source files and incorporate both types.
- **No images** — Skip this step entirely. The graphic will use pure CSS/HTML styling only.

## 12. Step 4: Output Path

Ask the user: **"Where should I save the exports?"**

Default location: `./goose-graphics-exports/`

Within that directory, create a subfolder using this naming convention:

```
[YYYY-MM-DD]-[slugified-name]/
```

For example: `2026-04-17-q2-product-roadmap/`

## 13. Step 5: Generate HTML

Follow the chosen format spec's **HTML Generation** phase. When generating:

- Apply the chosen style's CSS variables, typography rules, color palette, and spacing system — the DESIGN.md returned by `styles get` has everything you need.
- Incorporate image sources (Unsplash URLs or ASCII art blocks) if the user selected any in Step 3.
- Follow the format spec's content density limits and structural requirements exactly.
- Write all HTML files to the output directory established in Step 4.

## 14. Step 6: Screenshot

Run the screenshot script to export HTML files to high-resolution PNGs:

```bash
node [skill-pack-dir]/screenshot/screenshot.js --format CANVAS --input INPUT_PATH --output OUTPUT_PATH
```

Where:
- `[skill-pack-dir]` is the absolute path to this skill pack's directory.
- `CANVAS` is **always one of the seven built-in canvas slugs**, never the format's catalog slug. The renderer's allow-list is strict — passing a community format slug like `story-cover` or `linkedin-banner` will fail.
- `INPUT_PATH` is the directory or file containing the generated HTML.
- `OUTPUT_PATH` is the directory where PNG files should be saved.

**Map the format's `width`/`height` (from `npx gooseworks formats get <slug>`) to a canvas slug using this table:**

| width × height       | Canvas slug   |
|----------------------|---------------|
| 1080 × 1080          | `carousel`    |
| 1080 × 1350          | `poster`      |
| 1920 × 1080          | `slides`      |
| 1080 × 1920          | `story`       |
| 1080 × ≥1080 (variable) | `infographic` |

Examples:
- Built-in `poster` (1080×1350) → `--format poster`.
- Community `story-cover` (1080×1920) → `--format story` (because the format inherits the `story` canvas).
- Community `linkedin-quote-card` (1080×1080) → `--format carousel` (any 1080×1080 catalog format renders against the `carousel` canvas).

If the format's `width`/`height` doesn't match any row above, the format was published incorrectly — report it to the user and stop. Don't try to render with custom dimensions; the tool can't.

## 15. Step 7: Deliver

Present the results to the user:

- List all generated files (HTML source files and PNG exports) with their file sizes.
- Provide the full path to the output directory.
- Suggest how to preview: open the HTML files in a browser, or view the PNG files directly.
- For carousels and slides, note the slide count and order.

## 16. Special Modes

- **"Surprise me"** — Pick the carousel format and a random style returned by `npx gooseworks styles list`. Ask the user only for content/topic, then generate everything else automatically.
- **Multi-format** — If the user says "make this as both a carousel and an infographic," run the full workflow twice using the same content and style but different format slugs. Save outputs in separate subdirectories.
- **Style preview** — Before committing to full generation, produce a single sample slide or section so the user can approve the visual direction. If they want changes, adjust the style or switch slugs before generating the rest.

## 17. Manifest format

These manifests are CLI inputs the user produces in their own working directory before running `publish`. They never live in this repo.

### 17.1 Style manifest (`gooseworks-style.json`)

```json
{
  "name": "Desert Sunset",
  "slug": "desert-sunset",
  "description": "Warm dusk gradients with rust and amber on cream paper. Editorial serif headlines paired with a single sans-serif accent. Built for DTC beauty product launches, lifestyle long-form, and event posters where you want a confident, sun-soaked, high-end magazine feel.",
  "designMd": "# Desert Sunset\n\n…full slim spec markdown — palette table, typography table, layout rules, do/don'ts, optional CSS variables block…",
  "moodGroup": "Organic & Warm",
  "tags": ["warm", "desert", "editorial", "serif", "dtc"],
  "palette": [
    { "hex": "#E06A2C", "role": "primary" },
    { "hex": "#3A1F1A", "role": "ink" },
    { "hex": "#F5EFE7", "role": "paper" }
  ],
  "examples": [
    { "format": "poster", "isHero": true, "file": "./poster.png", "caption": "Hero render" },
    { "format": "carousel", "file": "./carousel.png" },
    { "format": "story", "file": "./story.png" }
  ]
}
```

Field constraints:
- `name`: 1–120 chars
- `slug`: optional kebab-case `[a-z0-9-]+`; backend auto-generates if absent. A collision returns 409 with a `suggestedSlug` — the CLI handles re-submission.
- `description`: 20–1000 chars (**required**)
- `designMd`: minimum 50 chars (**required**)
- `moodGroup`: optional; one of `"Dark & Moody"`, `"Light & Editorial"`, `"Organic & Warm"`, `"Bold & Energetic"`, `"Retro & Cinematic"`, `"Structural & Technical"`, `"Friendly Corporate"`
- `tags`: array of strings (default `[]`)
- `palette`: array of `{ hex: "#RRGGBB", role?: string }`
- `examples`: array, **minimum 1 entry**, **exactly one** with `isHero: true`
- `examples[].format`: slug of an existing graphics format (any from `npx gooseworks formats list`)
- `examples[].file`: relative path to the PNG in the working directory

### 17.2 Format manifest (`gooseworks-format.json`)

```json
{
  "name": "Story Cover",
  "slug": "story-cover",
  "description": "1080×1920 vertical cover slide for Instagram and TikTok stories. Single hero panel, 5-word title max, optional brand mark in the lower 10%. Use for product launches and event reminders where the viewer scrolls past in 2 seconds.",
  "width": 1080,
  "height": 1920,
  "contentRulesMd": "## Rules\n\n- Title: 5 words max, large display, centered or top-left\n- One hero element (image, stat, or large icon) in the upper 70% of the canvas\n- Optional brand mark in the lower 10%, ≤8% of canvas height\n…",
  "tags": ["story", "vertical", "social", "instagram", "tiktok"],
  "examples": [
    { "file": "./example-1.png", "styleSlug": "matt-gray", "caption": "Paired with matt-gray" },
    { "file": "./example-2.png", "styleSlug": "neon-dashboard" }
  ]
}
```

Field constraints:
- `name`: 1–120 chars
- `slug`: optional kebab-case
- `description`: 20–1000 chars (**required**)
- `width` / `height`: **must match one of the seven built-in canvases**: 1080×1080 (carousel/chart/tweet), 1080×1350 (poster), 1920×1080 (slides), 1080×1920 (story), or 1080×≥1080 (infographic). Custom dimensions are rejected at publish time because the renderer's allow-list is strict.
- `contentRulesMd`: minimum 50 chars (**required**)
- `tags`: array of strings
- `examples`: array, **minimum 1 entry** (**required** — the backend rejects empty)
- `examples[].styleSlug`: optional reference to which style was used to render the example

## 18. File reference

This skill pack ships only the local helpers needed to render and source images — styles, formats, and example renders all come from the central library via `npx gooseworks`.

### Image sources
| File | Description |
|------|-------------|
| `sources/unsplash.md` | Search and embed Unsplash stock photography. |
| `sources/ascii-art.md` | Generate and embed ASCII art decorations. |

### Extract style
| File | Description |
|------|-------------|
| `extract-style.md` | Derive a custom style from a reference image and produce a publishable bundle (`gooseworks-style.json` + rendered PNGs). |

### Screenshot tool
| File | Description |
|------|-------------|
| `screenshot/screenshot.js` | Playwright-based HTML-to-PNG export script. |
| `screenshot/package.json` | Node.js dependencies for the screenshot tool. |
