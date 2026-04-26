---
name: create-goose-graphics-style
description: >
  End-to-end skill that turns a single reference image into a fully-installed,
  example-rendered style preset for the goose-graphics composite. Analyzes the
  image, writes the slim style spec, registers it in styles/index.json, generates
  all 7 format examples using the standard brief, renders PNGs via Playwright,
  and updates examples/manifest.json. Invoke with /create-goose-graphics-style.
tags: [graphics, design, automation]
---

# Create Goose Graphics Style

Automates the full workflow for adding a brand-new style preset to the
`goose-graphics` skill — the one we use when the user hands us a reference image
and says "make this a style." Mirrors exactly what a human designer does:
analyze image → write slim spec → register style → generate one example per
format (poster, infographic, carousel, slides, story, chart, tweet) → render
PNGs → update manifest.

This skill is opinionated and end-to-end. Do not stop halfway. By the time you
finish, the user should be able to immediately call
`/goose-graphics --style <new-slug> --format <any>` and get correct output.

## Prerequisites

- The `goose-graphics` skill must be installed in the same workspace. This skill
  writes files into `goose-graphics/styles/`, `goose-graphics/examples/`, and
  uses `goose-graphics/screenshot/screenshot.js` to render PNGs.
- The screenshot tool's dependencies must be installed
  (`goose-graphics/screenshot/node_modules/` must exist). If not, run:
  ```bash
  cd <path-to>/goose-graphics/screenshot && npm install && npx playwright install chromium
  ```

## Invocation

```
/create-goose-graphics-style --ref <image-path> [--name <slug>] [--group <group-name>]
```

- `--ref <image-path>` (required) — path to the reference image (PNG/JPG/WebP).
- `--name <slug>` (optional) — desired style slug in lowercase-kebab-case
  (e.g., `pillow-block`, `neon-dashboard`). If omitted, propose 2-3 candidate
  names after analyzing the image and ask the user to pick.
- `--group <group-name>` (optional) — which group in `styles/index.json` the
  style belongs to. One of: `Dark & Moody`, `Light & Editorial`,
  `Organic & Warm`, `Bold & Energetic`, `Retro & Cinematic`,
  `Structural & Technical`, `Friendly Corporate`, `Halftone & Pixel`. If
  omitted, infer from the image and confirm with the user.

If the user says "I want a new style for goose-graphics" without args, ask for
the reference image path first, then proceed.

## Standard Brief

All examples are generated using the same brief used by the rest of the skill's
example library, so users can compare styles apples-to-apples:

> **Brief:** `5 Tips for Building a Startup in 2026`
>
> **Tips (use these verbatim, adapt phrasing per style voice):**
> 1. Ship fast, learn faster
> 2. Build AI into the core
> 3. Hire for leverage, not headcount
> 4. Obsess over 10 users before 10,000
> 5. Revenue beats runway

Always use this brief. Do not invent your own — it makes the example library
inconsistent.

## Workflow

### Step 1 — Receive & analyze the image

1. Read the image with the `Read` tool (it supports PNG/JPG/WebP natively).
2. Work through this analysis checklist explicitly. **Write the analysis out
   in plain text before moving on** — do not skip ahead.

   **Palette** — identify 3-6 dominant colors. For each, propose a hex value in
   the right family (you cannot extract exact hex; pick well-balanced values).
   Classify each by role: background/canvas, primary surface, accent, secondary
   accent, text, muted text, borders/dividers, any neon/highlight color.

   **Typography** — heading face (serif / sans / slab / mono), body face
   (same or different family), weight range, tracking (negative / normal /
   positive), line-height (tight / generous), overall feel
   (geometric / humanist / elegant / technical / rounded / condensed). Map to
   a Google Fonts equivalent (Inter, Fraunces, Playfair Display, Space Grotesk,
   IBM Plex Mono, etc.).

   **Layout & shape language** — corner radius (sharp / 12px / 28px squircle /
   pill / circle), borders (yes / no), shadows (yes / no / subtle), tile
   density, alignment, whether elements overlap.

   **Signature visual moves** — what makes this style THIS style? Examples:
   "pillowy 28px squircle tiles with hero numerals bottom-right",
   "blush canvas + oversized black serif money stats",
   "dark jewel surfaces + neon pink pill labels". Lead with these — they're
   what differentiates the style across formats.

   **Mood / category** — dark/light, calm/loud, premium/playful. Use this to
   pick the `--group` if not provided.

3. **Critical separation of concerns:** A style is an aesthetic SYSTEM
   (palette + typography + signature visual moves) that flexes across all 7
   formats. It is NOT a fixed composition. If your analysis describes "5 cards
   in a bento grid" or "3 vertical insight cards," you are mixing format into
   style. Re-frame in terms of palette, typography, and signature visual moves
   that any format can adopt.

### Step 2 — Pick name and group

If `--name` was provided, use it. Otherwise propose 2-3 candidates derived from
the signature moves (e.g. `pillow-block`, `pastel-ledger`, `neon-dashboard`)
and ask the user to pick. Slug must be lowercase-kebab-case.

If `--group` was provided, use it. Otherwise pick the best fit from the eight
groups in `styles/index.json` and confirm.

### Step 3 — Write the slim style spec

Create `<goose-graphics>/styles/<slug>.md`. Mirror the structure of an existing
slim spec (e.g., `styles/dot-grid-stat.md`, `styles/pillow-block.md`,
`styles/blush-annual.md`, `styles/neon-dashboard.md`) — read one of those first
if unsure of the shape.

Required sections, in this order:

1. **Title (h1)** — display name (Title Case).
2. **Tagline paragraph** — 2-3 sentences describing the aesthetic and the
   signature move. End with the vibe / brand analogy.
3. **`## Palette`** — markdown table with `Hex | Role` columns. Include
   semi-transparent variants (`rgba(...)`) where the style uses them.
4. **`## Typography`** — Google Fonts `<link>` block, font CSS variable lines,
   then a type table with columns `Role | Font | Size | Weight | Line-height
   | Tracking`. Include rows for hero, display, body, label, caption, brand.
   End with a **Principles** sub-list (3-5 bullets).
5. **`## Layout`** — bullet list. **Must include a "Format padding" line**
   listing per-format padding (carousel/infographic/slides/poster/story/chart/
   tweet). Then 4-6 aesthetic-principle bullets.
6. **`## Do / Don't`** — two sub-lists, 5 bullets each.
7. **`## CSS snippets`** — `:root` variables block, then 1-2 ready-to-paste
   HTML snippets demonstrating the signature move (e.g. a hero tile, a card,
   a CTA pill).

Keep it under ~200 lines / 8KB. Aesthetic-only — no fixed compositions.

### Step 4 — Register the style in `styles/index.json`

1. Read `<goose-graphics>/styles/index.json`.
2. Bump `count` by 1.
3. Add a new entry to the chosen group's `styles` array:
   ```json
   { "slug": "<slug>", "name": "<Display Name>", "tagline": "<one-line, ≤120 chars>" }
   ```
   The tagline must be short and evocative — it appears in the picker UI.
4. If the chosen group does not exist yet (rare), create it.
5. Sanity-check: `count` must equal the sum of `len(group.styles)` across all
   groups.

### Step 5 — Generate example HTML for all 7 formats

Create one example per format. Each demonstrates the aesthetic flexing across
formats — proving it's style, not composition. Use the standard brief
(see "Standard Brief" above).

| Format | Output dir | File | Dimensions | Notes |
|---|---|---|---|---|
| poster | `examples/<slug>/poster/` | `index.html` | 1080×1350 portrait | Hero composition with all 5 tips |
| infographic | `examples/<slug>/infographic/` | `index.html` | 1080×variable | Tall vertical, 5 tip sections stacked |
| carousel | `examples/<slug>/carousel/` | `slide-01.html` | 1080×1080 | Single representative cover slide |
| slides | `examples/<slug>/slides/` | `slide-01.html` | 1920×1080 | Single representative widescreen slide |
| story | `examples/<slug>/story/` | `slide-01.html` | 1080×1920 vertical | Single representative story slide |
| chart | `examples/<slug>/chart/` | `index.html` | 1080×1080 | Bar / line / block chart of stats from the 5 tips |
| tweet | `examples/<slug>/tweet/` | `index.html` | 1080×1080 | **Testimonial card on decorative background**, NOT a poster |

**Critical:** the tweet format is a simulated tweet/testimonial card centered on
a decorative background styled with the new aesthetic — see
`examples/dot-grid-stat/tweet/index.html` and any of the existing tweets
(`pillow-block`, `blush-annual`, `neon-dashboard`) for the convention.
Background uses the new style's palette/shapes; the centered card looks like a
real social-media post (avatar, display name, handle, body, timestamp,
engagement metrics).

**HTML rules** (apply to every example):

- Self-contained single HTML file — inline `<style>` block + Google Fonts `<link>`.
- Fixed pixel sizes only. NO `vw`/`vh`/`%`/`rem`/`em`/`clamp()`.
- Outer dimensions match the format spec exactly:
  `html, body { width: Xpx; height: Ypx; overflow: hidden; }`. Infographic is
  the exception: width fixed, height grows.
- Use exactly the palette hex codes and font links from the slim spec — do not
  invent new colors.
- Maintain the signature visual moves from the spec across all 7 formats. If
  a format can't fit the signature move comfortably, scale the move down — do
  not abandon it.

If you need to parallelize, you may dispatch one Agent subagent per group of
formats (e.g. "static formats" + "multi-slide formats" + "tweet+chart"), but
make sure each subagent has read the slim spec first and is given the standard
brief verbatim.

### Step 6 — Render PNGs

For each example, run the screenshot tool from the goose-graphics directory:

```bash
node screenshot/screenshot.js \
  --format <format> \
  --input ./examples/<slug>/<format>/<file> \
  --output ./examples/<slug>/<format>/exports/<output>.png \
  --font-delay 1500
```

- For `poster`, `infographic`, `chart`, `tweet`: input is `index.html`, output
  filename is `output.png`.
- For `carousel`, `slides`, `story`: input is `slide-01.html` (or the
  containing directory; the tool accepts either), output filename is
  `slide-01.png`.

Then copy each rendered PNG to `example.png` in the same format folder so the
catalog UI can find it:

```bash
# poster / infographic / chart / tweet
cp examples/<slug>/<format>/exports/output.png examples/<slug>/<format>/example.png
# carousel / slides / story
cp examples/<slug>/<format>/exports/slide-01.png examples/<slug>/<format>/example.png
```

If a render fails (chromium missing, font load timeout, oversized content
overflowing), fix the HTML and re-render. Common failure modes:

- Content overflows the fixed canvas → reduce font sizes or simplify layout.
- Fonts not loaded → bump `--font-delay` to 2000.
- Playwright/chromium not installed → run the install command from
  Prerequisites.

### Step 7 — Update `examples/manifest.json`

Append 7 new entries to `entries`, one per format, using this shape:

```json
"<slug>/<format>": {
  "generated_at": "<ISO 8601 timestamp>",
  "html": "<slug>/<format>",
  "png": "<slug>/<format>/example.png",
  "model": "opus",
  "status": "success"
}
```

Use the current date for `generated_at`. After the edit, validate the JSON
parses (e.g., `python3 -c "import json; json.load(open('examples/manifest.json'))"`).

### Step 8 — Visual QA

Read 2-3 of the rendered `example.png` files (poster, tweet, chart are the
highest-signal ones) and visually verify:

- Aesthetic matches the reference image's vibe.
- Signature visual moves appear consistently across formats.
- No obvious overflow, broken layout, or missing fonts.
- Tweet looks like a real social-media post, not a poster.

If anything looks off, fix the HTML and re-render. Don't ship broken examples.

### Step 9 — Report

Tell the user what was created:

- Path to the new style spec (`styles/<slug>.md`).
- Confirmation that `index.json` was updated (new count).
- The 7 rendered example paths and a one-line summary of each.
- The exact command to use the new style:
  `/goose-graphics --style <slug> --format <format> --brief "..."`

## Notes on existing patterns to reuse

- `goose-graphics/styles/dot-grid-stat.md` is the canonical slim-spec shape.
- `goose-graphics/styles/pillow-block.md`, `blush-annual.md`, and
  `neon-dashboard.md` are recent worked examples following this exact workflow.
- `goose-graphics/examples/dot-grid-stat/<format>/` shows the canonical example
  shape for every format.
- `goose-graphics/screenshot/screenshot.js` is the rendering pipeline; it sets
  format-specific viewport and capture mode.
- `goose-graphics/formats/<format>.md` documents each format's spec and content
  limits — read the relevant one if you're unsure how a format should behave.

## Anti-patterns to avoid

- **Don't bake a fixed composition into the style spec.** "5-tile bento" or
  "3 vertical insight cards" is composition, not style. Style = palette +
  typography + signature visual moves.
- **Don't ship fewer than 7 format examples.** The catalog UI assumes the full
  set per style.
- **Don't render the tweet as a poster.** It must be a testimonial card on a
  decorative background.
- **Don't invent your own brief** for the examples. Always use "5 Tips for
  Building a Startup in 2026" with the five canonical tips.
- **Don't forget to bump `count` in `styles/index.json`** or the picker UI
  will report a mismatch.
- **Don't skip the visual QA step.** A render that overflows or has missing
  fonts is worse than no example.
