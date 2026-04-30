---
name: goose-graphics-create-style
description: >
  End-to-end skill that turns a single reference image into a published
  Gooseworks style — analyzes the image, drafts the slim style spec, renders
  a hero example plus 2-3 additional formats via Playwright, writes the
  `gooseworks-style.json` manifest, and publishes via
  `npx gooseworks styles publish` so other agents can discover it. Mirrors
  goose-graphics-create-format but for styles.
tags: [design, content]
---

# Create Goose Graphics Style

Authors a new graphics style and publishes it to the central Gooseworks
library via `npx gooseworks styles publish`. The output is a working
directory with a `gooseworks-style.json` manifest plus a hero rendered
example and 2-3 additional examples that demonstrate the aesthetic flexing
across formats.

## When to use this skill

Use when the user has a reference image and wants the aesthetic available
as a reusable, discoverable style — so any future
`/goose-graphics --style <slug> --format <any>` call can render against it.

**Always check first:** run `npx gooseworks styles list` (or
`npx gooseworks styles search "warm editorial"`) to see whether a
community-published style already covers the look. If one fits, just use
it via the regular `goose-graphics` flow.

## Prerequisites

- The `goose-graphics` skill must be installed in the same workspace —
  this skill uses its `screenshot/screenshot.js` to render examples.
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
- The user must be signed in to Gooseworks (`npx gooseworks login`) for
  `publish` to authenticate.

## Invocation

```
/goose-graphics-create-style --ref <image-path> [--name <slug>] [--mood <mood-group>]
```

- `--ref <image-path>` (required) — path to the reference image
  (PNG/JPG/WebP).
- `--name <slug>` (optional) — desired style slug in lowercase-kebab-case
  (e.g., `pillow-block`, `neon-dashboard`). If omitted, propose 2-3
  candidate names after analyzing the image and ask the user to pick.
- `--mood <mood-group>` (optional) — which `moodGroup` the style belongs
  to. One of: `Dark & Moody`, `Light & Editorial`, `Organic & Warm`,
  `Bold & Energetic`, `Retro & Cinematic`, `Structural & Technical`,
  `Friendly Corporate`. If omitted, infer from the image and confirm.

If the user says "I want a new style for goose-graphics" without args, ask
for the reference image path first, then proceed.

## Outputs (in a working directory)

```
<working-dir>/
  gooseworks-style.json   # manifest (see "Manifest format" below)
  poster.png              # hero example (REQUIRED — exactly one with isHero: true)
  carousel.png            # additional examples (recommend 2-3 across formats)
  infographic.png
  ...
```

The backend rejects `publish` with an empty `examples` array or with no
hero — exactly one example must be marked `isHero: true`.

## Standard Brief

All examples are generated using the same brief used by the rest of the
catalog, so users can compare styles apples-to-apples:

> **Brief:** `5 Tips for Building a Startup in 2026`
>
> **Tips (use these verbatim, adapt phrasing per style voice):**
> 1. Ship fast, learn faster
> 2. Build AI into the core
> 3. Hire for leverage, not headcount
> 4. Obsess over 10 users before 10,000
> 5. Revenue beats runway

Always use this brief. Do not invent your own — it makes the catalog
inconsistent.

## Workflow

### Step 1 — Receive & analyze the image

1. Read the image with the `Read` tool (it supports PNG/JPG/WebP natively).
2. Work through this analysis checklist explicitly. **Write the analysis
   out in plain text before moving on** — do not skip ahead.

   **Palette** — identify 3-6 dominant colors. For each, propose a hex
   value in the right family (you cannot extract exact hex; pick
   well-balanced values). Classify each by role: background/canvas,
   primary surface, accent, secondary accent, text, muted text,
   borders/dividers, any neon/highlight color.

   **Typography** — heading face (serif / sans / slab / mono), body face
   (same or different family), weight range, tracking (negative / normal /
   positive), line-height (tight / generous), overall feel
   (geometric / humanist / elegant / technical / rounded / condensed).
   Map to a Google Fonts equivalent (Inter, Fraunces, Playfair Display,
   Space Grotesk, IBM Plex Mono, etc.).

   **Layout & shape language** — corner radius (sharp / 12px / 28px
   squircle / pill / circle), borders (yes / no), shadows
   (yes / no / subtle), tile density, alignment, whether elements overlap.

   **Signature visual moves** — what makes this style THIS style?
   Examples: "pillowy 28px squircle tiles with hero numerals
   bottom-right", "blush canvas + oversized black serif money stats",
   "dark jewel surfaces + neon pink pill labels". Lead with these — they
   differentiate the style across formats.

   **Mood / category** — dark/light, calm/loud, premium/playful. Use this
   to pick the `moodGroup` if not provided.

3. **Critical separation of concerns:** A style is an aesthetic SYSTEM
   (palette + typography + signature visual moves) that flexes across all
   formats. It is NOT a fixed composition. If your analysis describes
   "5 cards in a bento grid" or "3 vertical insight cards," you are
   mixing format into style. Re-frame in terms of palette, typography,
   and signature visual moves that any format can adopt.

### Step 2 — Pick name, slug, and moodGroup

If `--name` was provided, use it. Otherwise propose 2-3 candidates derived
from the signature moves (e.g. `pillow-block`, `pastel-ledger`,
`neon-dashboard`) and ask the user to pick. Slug must be
lowercase-kebab-case (`[a-z0-9-]+`).

**Collision check:** run `npx gooseworks styles get <slug>` — if the
catalog returns a hit, the slug is taken. Suggest an alternative.

(The user may omit `slug` from the manifest; the backend auto-generates
one. On 409 the CLI prompts you to accept the server's suggested slug;
pass `--yes` at publish time to auto-accept.)

If `--mood` was provided, use it. Otherwise pick the best fit from the
seven `moodGroup` values (see §Invocation) and confirm.

### Step 3 — Draft the slim style spec

This becomes the `designMd` field of the manifest in step 5. Hold it in
memory; do not write it to disk until step 5 packages it into the
manifest. Mirror the structure of canonical slim specs (e.g.
`dot-grid-stat`, `pillow-block`, `blush-annual`, `neon-dashboard`) — fetch
one as a reference if unsure of the shape:

```bash
npx gooseworks styles get dot-grid-stat
```

Required sections, in this order:

1. **Title (h1)** — display name (Title Case).
2. **Tagline paragraph** — 2-3 sentences describing the aesthetic and the
   signature move. End with the vibe / brand analogy.
3. **`## Palette`** — markdown table with `Hex | Role` columns. Include
   semi-transparent variants (`rgba(...)`) where the style uses them.
4. **`## Typography`** — Google Fonts `<link>` block, font CSS variable
   lines, then a type table with columns `Role | Font | Size | Weight |
   Line-height | Tracking`. Include rows for hero, display, body, label,
   caption, brand. End with a **Principles** sub-list (3-5 bullets).
5. **`## Layout`** — bullet list. **Must include a "Format padding" line**
   listing per-format padding
   (carousel/infographic/slides/poster/story/chart/tweet). Then 4-6
   aesthetic-principle bullets.
6. **`## Do / Don't`** — two sub-lists, 5 bullets each.
7. **`## CSS snippets`** — `:root` variables block, then 1-2
   ready-to-paste HTML snippets demonstrating the signature move
   (e.g. a hero tile, a card, a CTA pill).

Keep it under ~200 lines / 8KB. Aesthetic-only — no fixed compositions.
Minimum length is 50 chars (the manifest validator's floor); the sweet
spot for the catalog is 2000-6000 chars.

### Step 4 — Render hero + 2-3 additional examples

Pick a hero format (the one example that best showcases the aesthetic),
plus 2-3 additional formats so the catalog tile shows variety. **Hero
priority order:**

```
poster > carousel > infographic > slides > chart > story > tweet
```

i.e. start at `poster` and walk down until you hit a format that fits the
aesthetic well.

For each example, generate HTML at the format's exact dimensions using the
slim spec's palette, fonts, and signature visual moves, and the standard
brief above. Format dimensions:

| Format | Dimensions | Notes |
|---|---|---|
| poster | 1080×1350 portrait | Hero composition with all 5 tips |
| infographic | 1080×variable | Tall vertical, 5 tip sections stacked |
| carousel | 1080×1080 | Single representative cover slide |
| slides | 1920×1080 | Single representative widescreen slide |
| story | 1080×1920 vertical | Single representative story slide |
| chart | 1080×1080 | Bar / line / block chart of stats from the 5 tips |
| tweet | 1080×1080 | **Testimonial card on decorative background**, NOT a poster |

**Critical:** the tweet format is a simulated tweet/testimonial card
centered on a decorative background styled with the new aesthetic — not a
poster. Background uses the new style's palette/shapes; the centered card
looks like a real social-media post (avatar, display name, handle, body,
timestamp, engagement metrics).

**HTML rules** (apply to every example):

- Self-contained single HTML file — inline `<style>` block + Google Fonts
  `<link>`.
- Fixed pixel sizes only. NO `vw`/`vh`/`%`/`rem`/`em`/`clamp()`.
- Outer dimensions match the format spec exactly:
  `html, body { width: Xpx; height: Ypx; overflow: hidden; }`. Infographic
  is the exception: width fixed, height grows.
- Use exactly the palette hex codes and font links from the slim spec —
  do not invent new colors.
- Maintain the signature visual moves across every example. If a format
  can't fit the move comfortably, scale it down — do not abandon it.

Render each via the screenshot tool, writing PNGs **directly into the
working directory** (one PNG per format, named after the format slug):

```bash
node <path-to>/goose-graphics/screenshot/screenshot.js \
  --format <format> \
  --input <path-to-html> \
  --output <working-dir>/<format>.png \
  --font-delay 1500
```

**Single-file vs directory input:** carousel, slides, and story are
"multi-file" formats by default — if `--input` is a directory, the tool
renders every `.html` file inside it to numbered `slide-NN.png` files in
the `--output` directory. For the single representative slide we want
here, pass a single `.html` file as `--input` and a single PNG path as
`--output` — the tool detects the file input and writes one PNG. The
other formats (poster, infographic, chart, tweet) are always single-file.

Common failure modes:

- Content overflows the fixed canvas → reduce font sizes or simplify
  layout.
- Fonts not loaded → bump `--font-delay` to 2000.
- Playwright/chromium not installed → run the install command from
  Prerequisites.

### Step 5 — Write `gooseworks-style.json`

Match the shape documented in `goose-graphics/SKILL.md` §17.1. Required:

```json
{
  "name": "Desert Sunset",
  "slug": "desert-sunset",
  "description": "Warm dusk gradients with rust and amber on cream paper. Editorial serif headlines paired with a single sans-serif accent. Built for DTC beauty product launches, lifestyle long-form, and event posters where you want a confident, sun-soaked, high-end magazine feel.",
  "designMd": "# Desert Sunset\n\n…full slim spec markdown from step 3 — palette table, typography table, layout rules, do/don'ts, CSS snippets…",
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

**Constraints to respect:**

- `name`: 1-120 chars
- `slug`: optional kebab-case `[a-z0-9-]+`; backend auto-generates if
  absent. A 409 collision returns a server-suggested slug — the CLI
  handles the retry.
- `description`: 20-1000 chars (**required**). See guidelines below.
- `designMd`: minimum 50 chars (**required**) — the spec from step 3.
- `moodGroup`: optional; one of the seven values listed in §Invocation.
- `tags`: array of 3-10 lowercase strings. See guidelines below.
- `palette`: array of `{ hex: "#RRGGBB", role?: string }`.
- `examples`: array, **minimum 1 entry**, **exactly one** with
  `isHero: true`.
- `examples[].format`: slug of an existing graphics format
  (any from `npx gooseworks formats list`).
- `examples[].file`: relative path to the PNG in the working directory.

### Step 6 — Visual QA

Read 2-3 of the rendered PNGs (the hero plus the most distinct two) and
visually verify:

- Aesthetic matches the reference image's vibe.
- Signature visual moves appear consistently across formats.
- No obvious overflow, broken layout, or missing fonts.
- If you rendered a tweet, it looks like a real social-media post, not a
  poster.

If anything looks off, fix the HTML and re-render. Don't ship broken
examples.

### Step 7 — Publish

```bash
cd <working-dir>
npx gooseworks styles publish
```

The CLI reads `gooseworks-style.json`, validates it client-side, uploads
the manifest plus the example PNGs, and registers the style in the
catalog.

**Slug-collision UX:** if the slug is taken, the CLI prompts
`Slug 'X' is taken. Use 'Y' instead?` with the server's suggestion. Pass
`--yes` to auto-accept (useful for scripted runs):

```bash
npx gooseworks styles publish --yes
```

**Success output:**

```
Published style: <slug>
https://skills.gooseworks.ai/styles/<slug>
```

**Exit codes:** `0` success, `1` transient/auth (network, 401, 5xx), `2`
user error (400 validation, 403 not owner, 413 file too large, declined
409).

**Amending a published style later:**

```bash
npx gooseworks styles update <slug>
```

Same manifest format; no slug-collision retry (the slug is locked).

### Step 8 — Confirm

Tell the user:

- The published slug and the catalog URL.
- The dimensions/formats used for the examples.
- The exact command future agents will use to render with the new style:
  `/goose-graphics --style <slug> --format <format> --brief "..."`.

## Description-writing guidelines (load-bearing)

The description is what makes the style discoverable by AI agents
searching the catalog. Treat it as a search index, not flavor text.

- **50-200 words, keyword-dense.**
- **Lead with mood + use case.** "Bold magazine-cover energy for product
  launches and event posters."
- **Mention typography signals.** "Massive condensed sans-serif headlines
  paired with a delicate body serif."
- **Mention palette signals.** "Rust orange + cream + near-black."
- **Mention industry / audience fit if relevant.** "DTC beauty, indie
  publishing, event flyers."
- **Avoid generic adjectives alone.** "Beautiful," "modern," "clean" mean
  nothing without concrete signals — pair them with palette, typography,
  or industry context.

## Tag-writing guidelines

3-10 lowercase tags. Cover:

- **Mood:** `warm`, `dark`, `energetic`, `calm`
- **Density:** `sparse`, `dense`
- **Formality:** `corporate`, `editorial`, `playful`
- **Era:** `mid-century`, `y2k`, `retro`
- **Industry-fit:** `saas`, `dtc`, `beauty`, `finance`

Skip tags that just restate the slug.

## Notes on existing patterns to reuse

- Fetch a canonical slim spec to mirror its shape:
  `npx gooseworks styles get dot-grid-stat`,
  `npx gooseworks styles get pillow-block`,
  `npx gooseworks styles get blush-annual`,
  `npx gooseworks styles get neon-dashboard`.
- `goose-graphics/screenshot/screenshot.js` is the rendering pipeline; it
  sets format-specific viewport and capture mode.
- `npx gooseworks formats get <format>` returns each format's spec and
  content limits — fetch the relevant one if you're unsure how a format
  should behave.

## Anti-patterns to avoid

- **Don't bake a fixed composition into the style spec.** "5-tile bento"
  or "3 vertical insight cards" is composition, not style. Style =
  palette + typography + signature visual moves.
- **Don't ship without a hero example.** The backend rejects manifests
  with no `isHero: true` entry.
- **Don't render the tweet as a poster.** It must be a testimonial card
  on a decorative background.
- **Don't invent your own brief** for the examples. Always use "5 Tips
  for Building a Startup in 2026" with the five canonical tips.
- **Don't skip the visual QA step.** A render that overflows or has
  missing fonts is worse than no example.
- **Don't publish without checking `npx gooseworks styles list` first** —
  if the look already exists in the catalog, point the user at it instead
  of publishing a duplicate.
