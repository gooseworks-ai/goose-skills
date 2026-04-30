---
name: goose-graphics-create-format
description: >
  Creates a new graphics format spec (custom canvas dimensions + content rules)
  and publishes it to the Gooseworks library so any agent can render against it.
  Use when the existing community formats (carousel, story, infographic, slides,
  poster, chart, tweet, plus community additions) don't fit the user's canvas —
  e.g., LinkedIn banner 1584×396, story cover 1080×1920, event flyer 8.5×11in.
  Mirrors goose-graphics-create-style but for formats.
tags: [design, content]
---

# Create Goose Graphics Format

Authors a new graphics format and publishes it to the central Gooseworks library
via `npx gooseworks formats publish`. The output is a working directory with a
`gooseworks-format.json` manifest plus at least one rendered example PNG paired
with an existing style.

## When to use this skill

Use when the user wants a new named format with its own content rules —
a story cover, a podcast cover, a square testimonial — that maps to one
of the seven built-in canvas sizes (carousel, infographic, slides,
poster, story, chart, tweet). The new format defines new rules and a
new slug; it inherits dimensions from one of those canvases.

**Custom canvas dimensions are not supported.** If the user wants a
canvas size that isn't in the seven built-ins (e.g. LinkedIn banner
1584×396, US Letter 2550×3300), tell them honestly — that requires a
code change to the `goose-graphics` skill pack's `FORMAT_CONFIGS` and is
out of scope for this skill. Suggest the closest existing canvas
instead.

**Always check first:** run `npx gooseworks formats list` (or `formats search
"banner"` etc.) to see whether a community-published format already covers the
use case. If one fits, just use it via the regular `goose-graphics` flow.

## Prerequisites

- The `goose-graphics` skill must be installed in the same workspace —
  this skill uses `goose-graphics/screenshot/screenshot.js` to render
  examples and pulls style specs via `npx gooseworks styles get <slug>`.
  Install via:
  ```bash
  npx gooseworks install --claude --with goose-graphics
  ```
  (Swap `--claude` for `--cursor` or `--codex` as needed.) See the install
  page on the hub for the canonical command:
  https://skills.gooseworks.ai/skills/goose-graphics
- The screenshot tool's dependencies must be installed
  (`goose-graphics/screenshot/node_modules/` must exist). If not:
  ```bash
  cd <path-to>/goose-graphics/screenshot && npm install && npx playwright install chromium
  ```
- The user must be signed in to gooseworks (`npx gooseworks login`) for publish
  to authenticate.

## Inputs

- A brief describing the canvas: dimensions, intended use (platform / surface),
  and content density rules.
- Optional: a reference image showing the desired layout.

## Outputs (in a working directory)

```
<working-dir>/
  gooseworks-format.json    # manifest (see "Manifest format" below)
  example-1.png             # at least one rendered example (REQUIRED)
  example-2.png             # optional; recommend 2–3 examples across styles
  example-3.png
```

The backend rejects publish with an empty `examples` array — at least one
rendered example is mandatory.

## Workflow

### Step 1 — Pick a canvas (from the fixed allow-list) and confirm intent

A new format is **a new slug + new content rules over one of the seven
built-in canvas sizes** — *not* a new canvas. Custom dimensions are not
supported: every renderer in the system (CLI screenshot tool, hub, other
agents) is locked to this allow-list, and creating a format with custom
`width`/`height` would produce something nobody can render.

Pick the canvas the new format should use:

| Canvas slug   | Dimensions | Best for                                   |
|---------------|------------|--------------------------------------------|
| `poster`      | 1080×1350  | Vertical hero composition, single panel    |
| `infographic` | 1080×var.  | Tall vertical scroll, multi-section        |
| `carousel`    | 1080×1080  | Square single panel / multi-slide          |
| `slides`      | 1920×1080  | Widescreen / presentation                  |
| `story`       | 1080×1920  | Vertical full-screen (IG/TikTok stories)   |
| `chart`       | 1080×1080  | Square data viz                            |
| `tweet`       | 1080×1080  | Square testimonial / social card           |

Then ask the user:

- Which canvas best fits the use case? (Pick from the table above.)
- What is this format for? (Surface, platform, audience.)
- What is the maximum content density? (Title length, body length, item
  counts, whether it's single-panel or multi-panel.)

The new format inherits the canvas's `width`/`height` exactly. Set the
manifest's `width`/`height` fields to the canvas's dimensions verbatim
(e.g. 1080/1350 for a poster-canvas format). Do not invent new
dimensions — the publish step will reject anything that doesn't match
one of the seven canvases.

If the user wants a canvas that isn't in the list (e.g. LinkedIn banner
1584×396), tell them honestly: that's a code change to the
`goose-graphics` skill pack's `FORMAT_CONFIGS` and is out of scope for
this skill. Suggest the closest existing canvas instead.

### Step 2 — Pick a name and slug

Suggest 2–3 descriptive names that lead with the platform / surface
(e.g., `linkedin-banner`, `story-cover`, `podcast-cover`, `event-flyer-letter`).
Slug must be lowercase-kebab-case (`[a-z0-9-]+`).

**Collision check:** run `npx gooseworks formats get <slug>` — if the catalog
returns a hit, the slug is taken. Suggest an alternative.

(The user may omit `slug` from the manifest; the backend auto-generates one.
On 409 the CLI prompts you to accept the server's suggested slug; pass
`--yes` at publish time to auto-accept.)

### Step 3 — Draft `contentRulesMd`

This is the load-bearing field — it teaches future agents how to fill the
canvas. Cover, in this order:

- **When to use this format vs the alternatives.** One or two sentences.
- **Maximum content density.** Exact limits: title word count, body word count,
  number of items / panels / slides, whether images are required or optional.
- **Per-section content rules.** Header, body, CTA, footer — what goes where,
  what shape, what size. If the format is single-panel, list the elements
  (title, hero, byline, etc.) and their max sizes.
- **Typography signals.** Recommended display font sizes and hierarchy at this
  canvas size (e.g., "Display hero ~140–180px on a 1584×396 banner").
- **Spacing and rhythm.** Padding, margins, vertical rhythm.

Aim for at least 50 chars (the minimum) but 300–800 chars is the sweet spot.
Treat `contentRulesMd` as the spec a fresh agent would read to render this
format correctly without further guidance.

### Step 4 — Render at least one example

Pair the new format with an existing published style. Recommended: render
**2–3 examples across different styles** so the catalog tile demonstrates the
format's flexibility.

For each example:

1. Pick a style: `npx gooseworks styles list | head` and choose 2–3 with
   contrasting moods (e.g., `matt-gray`, `neon-dashboard`, `brutalist`).
2. Fetch its slim spec: `npx gooseworks styles get <slug>`.
3. Generate HTML at the **exact** target dimensions, using the chosen style's
   palette, fonts, and signature visual moves. The HTML rules from the
   `goose-graphics` rendering pipeline apply:
   - Self-contained single HTML file with inline `<style>` block + Google Fonts
     `<link>`.
   - Fixed pixel sizes only — no `vw`/`vh`/`%`/`rem`/`em`/`clamp()`.
   - Outer dimensions match exactly:
     `html, body { width: <W>px; height: <H>px; overflow: hidden; }`.
4. Render via the screenshot tool from the `goose-graphics` skill pack,
   passing the **canvas slug** (carousel/infographic/slides/poster/story/
   chart/tweet — the one chosen in Step 1), not the new format's slug:
   ```bash
   node <path-to>/goose-graphics/screenshot/screenshot.js \
     --format <canvas-slug> \
     --input <path-to-html> \
     --output <working-dir>/example-N.png \
     --font-delay 1500
   ```
   This works out of the box — the new format inherits the canvas's
   dimensions, so no code changes are needed anywhere.

### Step 5 — Write `gooseworks-format.json`

Match the shape documented in `goose-graphics/SKILL.md` §17.2. Required:

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

**Constraints to respect:**

- `name`: 1–120 chars
- `description`: 20–1000 chars (**required**). See guidelines below.
- `width` / `height`: **must match one of the seven built-in canvases
  exactly** (1080×1080, 1080×1350, 1920×1080, 1080×1920, or
  1080×variable for infographic). Custom dimensions will render fine
  locally if you stretch the rules but will fail for any other agent that
  pulls the format later, since their `screenshot.js` only accepts the
  built-in canvas slugs.
- `contentRulesMd`: minimum 50 chars (**required**)
- `tags`: 3–10 lowercase strings. See guidelines below.
- `examples`: minimum 1 (**required**); `styleSlug` is optional but recommended.

### Step 6 — Publish

```bash
cd <working-dir>
npx gooseworks formats publish
```

The CLI reads `gooseworks-format.json`, validates it client-side, uploads the
manifest plus the example PNGs, and registers the format in the catalog.

**Slug-collision UX:** if the slug is taken, the CLI prompts
`Slug 'X' is taken. Use 'Y' instead?` with the server's suggestion. Pass
`--yes` to auto-accept (useful for scripted runs):

```bash
npx gooseworks formats publish --yes
```

**Success output:**

```
Published format: <slug>
https://skills.gooseworks.ai/formats/<slug>
```

**Exit codes:** `0` success, `1` transient/auth (network, 401, 5xx), `2` user
error (400 validation, 403 not owner, 413 file too large, declined 409).

**Amending a published format later:**

```bash
npx gooseworks formats update <slug>
```

Same manifest format; no slug-collision retry (the slug is locked).

### Step 7 — Confirm

Tell the user:

- The published slug and the URL where the format lives in the catalog.
- The dimensions and the styles used for the examples.
- How any agent can now use it:
  ```
  /goose-graphics --style <any-slug> --format <new-slug> --brief "..."
  ```

## Description-writing guidelines

Same shape as styles — 50–200 words, keyword-dense — but lead with **canvas
and content density** instead of mood.

- Lead with canvas + surface: `"1080×1080 square testimonial card for X
  feed posts."`
- Mention single-panel vs multi-panel and approximate text limits.
- Mention intended platform / surface (`Instagram Stories`, `LinkedIn`,
  `print event flyer`, etc.).
- Mention audience and use case
  (`"Use for product launches and event reminders where the viewer scrolls past
  in 2 seconds."`).
- Avoid generic adjectives. Be concrete: pixel counts, word counts, surfaces.

Example:

> "1080×1920 vertical canvas for Instagram and TikTok stories. Single-panel
> composition, 5-word title max, large hero image or stat, optional brand mark
> in the lower 10% of the canvas. Use for quick announcements and engagement
> posts where the viewer scrolls past in 2 seconds."

## Tag-writing guidelines

3–10 lowercase tags. Common format tags:

- **Aspect:** `vertical`, `square`, `portrait`, `landscape`, `banner`,
  `panoramic`
- **Structure:** `single-panel`, `multi-slide`, `multi-panel`
- **Surface:** `story`, `feed`, `cover`, `flyer`, `presentation`, `print`
- **Use:** `social`, `ad`, `editorial`, `event`
- **Platform fit:** `linkedin`, `instagram`, `tiktok`, `youtube`, `twitter`

Skip tags that just restate the slug.

## Anti-patterns to avoid

- **Don't ship without rendered examples.** The backend rejects empty
  `examples`. Render at least one — recommend 2–3 across contrasting styles.
- **Don't bake style decisions into `contentRulesMd`.** The format describes
  canvas + content density; the style describes palette + typography. Keep them
  separate so any style can pair with any format.
- **Don't skip the dimensions sanity-check.** A typo here is permanent — every
  agent rendering against the format will produce off-size output.
- **Don't reference local files in this skill pack** in the published manifest.
  All paths in `examples[].file` are relative to the working directory and live
  on the user's machine, not in this repo.
- **Don't publish without checking `npx gooseworks formats list` first** — if
  the format already exists, point the user at it instead of publishing a
  duplicate.
