# Skill: Create Custom Style from Reference Image

Extract the visual design language from a reference image and produce a publishable style bundle — a `gooseworks-style.json` manifest plus rendered example PNGs — that the user can push to the central Gooseworks library via `npx gooseworks styles publish`.

---

## When to Use

The user provides a reference image — a screenshot, design mockup, mood board, website capture, or any visual reference — and wants to capture its design language as a reusable style. The output is a working directory containing:

- `gooseworks-style.json` — the manifest (the slim-format spec lives in its `designMd` field)
- `<format>.png` — at least one rendered example (the hero); 2–3 recommended

The user then runs `npx gooseworks styles publish` from that directory to push the style to the catalog, where it becomes immediately discoverable by other agents via `npx gooseworks styles list/search/get`.

---

## Phase 1: Receive & Analyze the Image

### Step 1 -- Get the image

Ask the user to provide the reference image. Accept any of:
- A file path to an image on disk (PNG, JPG, WebP, etc.)
- A screenshot pasted into the conversation
- A URL to a publicly accessible image (use WebFetch to download it first, then read the downloaded file)

### Step 2 -- View the image

Read the image using the Read tool. The Read tool supports image files natively -- it will display the image contents visually for analysis.

If the image is unclear, low resolution, or only shows a partial design, ask the user if they have a better reference or if they want to proceed with what is available.

### Step 3 -- Systematic visual analysis

Examine the image carefully and work through every item in this checklist. Write your analysis out explicitly before moving to Phase 2 -- do not skip ahead.

**Colors:**
- Identify the 3-5 dominant colors in the design.
- For each color, estimate a clean hex value that matches the observed color family. Agent vision cannot extract exact hex codes, so pick well-balanced values within the right family (e.g., if you see a warm red, choose something like `#c94a4a` rather than guessing at the last digit).
- Classify each color by its role:
  - **Background** -- the dominant surface color
  - **Primary text** -- the main reading color
  - **Accent** -- the color used for emphasis, CTAs, highlights, interactive elements
  - **Secondary accent** -- a quieter supporting color if present
  - **Neutral/surface** -- any additional grays, tints, or surface colors for cards and containers
- Note whether the palette is warm, cool, or neutral in overall temperature.

**Typography:**
- Is the heading typeface serif, sans-serif, slab-serif, or monospace?
- Is the body typeface the same family or a different one?
- Estimate weight range: light (100-300), regular (400), medium (500), semibold (600), bold (700), heavy (800-900)?
- Is letter-spacing tight (negative tracking), normal, or wide (positive tracking)?
- Is line height compact or generous?
- Classify the overall type feel: geometric, humanist, elegant, technical, rounded, condensed, modern-clean.

**Layout:**
- Dense or spacious? How much whitespace surrounds elements?
- Grid-based or free-form? How many columns?
- Primary alignment: left-aligned, centered, or mixed?
- Card-based or flat sections? Do elements live in containers with visible borders/backgrounds?
- What is the overall content density -- minimal (few elements, lots of space) or information-rich?

**Mood:**
- Dark or light theme?
- Professional, playful, elegant, technical, warm, cold, editorial, brutalist, organic, corporate?
- What kind of brand or publication does this feel like? Name 2-3 analogies.

**Depth & Elevation:**
- Flat design with no shadows?
- Subtle shadows for slight lift?
- Heavy drop shadows or elevation?
- Borders: visible borders on containers, or borderless?
- If shadows exist, are they cool (gray/black) or warm-tinted?

**Special Elements:**
- Any gradients? Linear, radial, or mesh?
- Background patterns or textures?
- Glow effects, blur, or glassmorphism?
- Decorative elements: lines, shapes, icons, illustrations?
- Any distinctive UI patterns: pills, tags, badges, numbered items, progress indicators?

Write the full analysis as a structured list before continuing.

---

## Phase 2: Map to Available Fonts

The reference image likely uses fonts that may be proprietary or unavailable. Map the observed typography to the nearest freely available alternatives.

### Step 1 -- Classify the observed fonts

Based on your analysis, classify the heading and body fonts into one of these categories:

| Category | Characteristics |
|----------|----------------|
| Geometric sans | Clean, circular letterforms, even stroke width (e.g., Futura, Proxima Nova) |
| Humanist sans | Slightly organic, calligraphic influence, warm (e.g., Gill Sans, Frutiger) |
| Elegant serif | High stroke contrast, refined details, display-oriented (e.g., Didot, Bodoni) |
| Body serif | Moderate contrast, designed for reading at text sizes (e.g., Charter, Cambria) |
| Monospace | Fixed-width, technical feel (e.g., Courier, SF Mono) |
| Rounded | Rounded terminals and corners, friendly feel (e.g., VAG Rounded) |
| Condensed/heavy | Narrow letterforms or high weight, impactful (e.g., Impact, Anton) |
| Modern clean | Contemporary geometric sans with subtle personality (e.g., Satoshi, General Sans) |
| Slab serif | Thick, block-like serifs, sturdy feel (e.g., Rockwell, Clarendon) |

### Step 2 -- Select replacement fonts

Use this lookup table to pick the best available match from Google Fonts or Fontshare:

| Category | Recommended Options |
|----------|-------------------|
| Geometric sans | Space Grotesk, Inter, DM Sans, Plus Jakarta Sans |
| Humanist sans | Nunito, Source Sans Pro, Open Sans |
| Elegant serif | Playfair Display, Cormorant Garamond, EB Garamond |
| Body serif | Lora, Merriweather, Source Serif Pro |
| Monospace | JetBrains Mono, Fira Code, IBM Plex Mono |
| Rounded | Nunito, Varela Round, Comfortaa |
| Condensed/heavy | Archivo Black, Oswald, Bebas Neue |
| Modern clean | Satoshi (Fontshare), General Sans (Fontshare) |
| Slab serif | Roboto Slab, Zilla Slab, Arvo |

**Selection rules:**
- Pick one font for display/headings and one for body text. They can be the same family if the reference uses a single typeface.
- If the reference clearly uses a well-known free font (e.g., Inter, Roboto, Playfair Display), use it directly.
- Prefer Google Fonts over Fontshare for wider availability.
- Always include system font fallbacks in the font stack.

### Step 3 -- Build the Google Fonts link

Construct the `<link>` tag with the selected fonts and the specific weights needed:
- Display font: include weights 400, 700, and optionally 900. Include italic variants if the reference uses italic headings.
- Body font: include weights 300, 400, 500, and optionally 600.

---

## Phase 3: Generate the Slim Style File

Generate a slim style spec — the markdown that will live in the manifest's `designMd` field. This is the same structure used by every published Gooseworks style. Do NOT generate the verbose 9-section DESIGN.md format.

If you need a structural reference, fetch one of the established slim specs from the catalog:

```bash
npx gooseworks styles get brutalist
npx gooseworks styles get matt-gray
```

Pick whichever is closest in mood to what you're producing. The slim spec should be **4–8KB** and contain these sections in order:

### Section 1: Header

```markdown
# Style Name

2-4 sentence prose description of the style's visual identity. Describe the mood, the palette logic,
the typography pairing, and what makes this style distinctive. Reference real-world analogies
(e.g., "the feel of a Scandinavian furniture catalog," "fintech dashboard energy").

> Custom style — extracted from reference image
```

### Section 2: Palette

A flat table with 6-12 rows. Every color gets a hex code and a role description. Include: background, primary text, accent, secondary accent (if present), card/surface colors, border colors, and any secondary text tones.

```markdown
## Palette

| Hex | Role |
|-----|------|
| `#xxxxxx` | Background (primary canvas) |
| `#xxxxxx` | Primary text |
| `#xxxxxx` | Accent — emphasis, CTAs, highlights |
| ... | ... |
```

**Color quality rules:**
- Don't use pure black (`#000000`) or pure white (`#ffffff`) unless the reference clearly does.
- Text-on-background contrast must meet WCAG AA (4.5:1 minimum). Mentally verify.
- Keep total palette to 6-12 named colors.

### Section 3: Typography

Include the Google Fonts `<link>` tag (if using webfonts), Display and Body font-family declarations with fallback stacks, a hierarchy table with 8-9 rows, and 3-5 Principles bullets.

```markdown
## Typography

**Google Fonts**

\`\`\`html
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
\`\`\`

- **Display:** `'Font Name', fallback, sans-serif`
- **Body:** `'Font Name', fallback, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking | Transform |
|------|------|------|--------|-------------|----------|-----------|
| Display Hero | ... | 72px | 700 | 1.10 | -1px | none |
| Section Heading | ... | 48px | 700 | 1.15 | -0.5px | none |
| Sub-heading | ... | 32px | 600 | 1.20 | 0 | none |
| Body Large | ... | 22px | 500 | 1.55 | 0 | none |
| Body | ... | 18px | 400 | 1.55 | 0 | none |
| Caption | ... | 12-14px | 400 | 1.40 | ... | ... |
| Big Number | ... | 64-100px | 800 | 1.00 | ... | none |
| Label | ... | 14px | 500-600 | 1.00 | ... | ... |
| CTA | ... | 16-18px | 700 | 1.00 | ... | ... |

**Principles**

- 3-5 bullets explaining the typographic logic (why these pairings, tracking behavior, uppercase rules, etc.)
```

### Section 4: Layout

Bullet list covering format padding, border rules, radius, alignment, spacing, and any special layout elements (grids, textures, decorative patterns).

```markdown
## Layout

- Format padding: carousel Xpx · infographic X/X · slides Xpx · poster X/X.
- Border rules (thickness, color, style).
- Border-radius rules.
- Alignment rules (left, center, mixed).
- Card/container rules (bg, border, padding, radius).
- Any special elements (dot grids, background patterns, decorative shapes).
- Vertical rhythm and spacing between sections.
```

### Section 5: Do / Don't

5-6 Do rules and 5-6 Don't rules. Each must be specific and actionable with exact values (hex codes, px sizes, font names, weights). These encode the guardrails that prevent drifting off-style.

```markdown
## Do / Don't

**Do**

- [Specific rule with exact values]
- ...

**Don't**

- [Specific rule with exact values]
- ...
```

### Section 6: CSS Snippets

A `:root` variables block defining all CSS custom properties, followed by 4-5 self-contained component patterns as inline-styled HTML blocks. Each component must use the style's colors, fonts, and spacing directly (inline styles, not CSS variables in the HTML — the `:root` block is for reference).

Required components:
1. **Title block** — hero/header with headline, optional subtitle, optional label
2. **Numbered item or step** — stat, step number, or numbered list element
3. **Card** — bordered or surfaced container with content
4. **CTA block** — call-to-action button
5. **One style-specific component** — whatever is most distinctive about this style (quote block, stat display, tag system, grid pattern, etc.)

```markdown
## CSS snippets

### `:root` variables

\`\`\`css
:root {
  --color-bg: #...;
  --color-text: #...;
  --color-accent: #...;
  /* all palette colors */

  --font-display: '...', fallback;
  --font-body: '...', fallback;

  /* borders, radius, shadows, spacing as needed */
}
\`\`\`

### Title block (brief description)

\`\`\`html
<div style="...">...</div>
\`\`\`

### Numbered item (brief description)

\`\`\`html
<div style="...">...</div>
\`\`\`

[...3 more components...]
```

**Important:** Study the component snippets in `npx gooseworks styles get brutalist` and `npx gooseworks styles get matt-gray` for the right level of detail. Each snippet should be a complete, copy-pasteable HTML block with all styles inline.

---

## Phase 4: Build the Publishable Bundle

The agent assembles a working directory containing the manifest and rendered examples, then calls the publish command. The directory layout is:

```
<working-dir>/
  gooseworks-style.json     # the manifest
  <hero-format>.png         # mandatory hero render (e.g., poster.png)
  <other-format>.png        # optional, recommend 2–3 total
  <other-format>.png
```

### Step 1 — Pick a name and check for collisions

Ask the user what they want to name the style. Suggest 2–3 descriptive names based on the mood and palette (e.g., `arctic-minimal`, `warm-startup`, `dark-technical`, `sunset-editorial`). Slug must be lowercase-kebab-case (`[a-z0-9-]+`).

**Collision check:** run `npx gooseworks styles get <slug>` — if the catalog returns a hit, the slug is taken. Suggest an alternative.

(If the user prefers, they can omit `slug` from the manifest entirely and let the backend auto-generate one. A 409 collision response includes a `suggestedSlug` and the CLI handles re-submission.)

### Step 2 — Render at least one example (the hero)

The hero is mandatory. Pick the format that best showcases the style. Hero priority order if you can render multiple:

```
poster > carousel > infographic > slides > chart > story > tweet
```

For each example you want to include:

1. Fetch the format spec: `npx gooseworks formats get <format>`.
2. Generate HTML at the format's exact pixel dimensions, using the slim spec from Phase 3 — palette hex codes, fonts, signature visual moves all wired in. Use the standard "5 Tips for Building a Startup in 2026" brief (or a brief the user prefers) so the example demonstrates real content density, not lorem ipsum.
3. Run the screenshot tool from this skill pack to render the PNG into the working directory:
   ```bash
   node [skill-pack-dir]/screenshot/screenshot.js \
     --format <format> \
     --input <path-to-html> \
     --output <working-dir>/<format>.png \
     --font-delay 1500
   ```

Recommended: **2–3 total examples** so the catalog tile shows variety.

### Step 3 — Write the manifest

Write `<working-dir>/gooseworks-style.json` matching the shape documented in `SKILL.md` §17.1. Required fields:

```json
{
  "name": "Display Name",
  "slug": "display-name",
  "description": "50–200 words, keyword-dense, lead with mood + use case…",
  "designMd": "<full slim spec from Phase 3 — palette, typography, layout, do/don't, CSS snippets>",
  "moodGroup": "Organic & Warm",
  "tags": ["warm", "editorial", "dtc"],
  "palette": [
    { "hex": "#XXXXXX", "role": "background" },
    { "hex": "#XXXXXX", "role": "ink" },
    { "hex": "#XXXXXX", "role": "accent" }
  ],
  "examples": [
    { "format": "poster", "isHero": true, "file": "./poster.png", "caption": "Hero render" },
    { "format": "carousel", "file": "./carousel.png" }
  ]
}
```

**Constraints to respect:**

- `description`: 20–1000 chars, but aim for 50–200 words. Lead with mood + use case, then typography signals, palette signals, and industry/audience fit. Avoid generic adjectives like "beautiful" or "modern" alone — pair them with concrete signals. This field is what makes the style discoverable.
- `designMd`: minimum 50 chars; use the full slim spec from Phase 3.
- `moodGroup` (optional): `"Dark & Moody"`, `"Light & Editorial"`, `"Organic & Warm"`, `"Bold & Energetic"`, `"Retro & Cinematic"`, `"Structural & Technical"`, or `"Friendly Corporate"`.
- `tags`: 3–10 lowercase tags covering mood, density, formality, era, industry-fit. Skip tags that just restate the name.
- `examples`: minimum 1, exactly one with `isHero: true`. `format` must be a slug returned by `npx gooseworks formats list`.

### Step 4 — Publish

From the working directory:

```bash
cd <working-dir>
npx gooseworks styles publish
```

The CLI reads `gooseworks-style.json`, uploads the referenced PNGs to S3, and registers the style in the catalog. On a 409 slug collision, the CLI re-submits with the suggested slug.

### Step 5 — Confirm

Tell the user:

- The published slug and the URL where the style lives in the catalog.
- A 3–4 line summary of the extracted style: theme (dark/light), primary palette (background + text + accent hex codes), font pairing, and overall mood.
- How any agent can now use it:
  ```
  /goose-graphics --style <slug> --format <format> --brief "..."
  ```

---

## Important Notes

### On Color Accuracy

Agent vision identifies color families, not exact hex values. The goal is to produce a **coherent, well-balanced palette** that captures the spirit of the reference, not to pixel-match it. When estimating hex values:

- Identify the color family first (warm red, cool blue, muted green, near-black, warm gray, etc.)
- Pick a clean, well-balanced hex within that family
- Verify contrast: primary text on background must be at least 4.5:1 (WCAG AA). For dark themes, light text on dark backgrounds. For light themes, dark text on light backgrounds.
- Use 3-5 primary colors max. Most well-designed references use very few colors -- adding more dilutes the identity.
- When in doubt, desaturate slightly. Oversaturated colors extracted from compressed images tend to look garish in production.

### On Font Matching

The goal is **typographic equivalence**, not exact matching. A geometric sans is a geometric sans -- whether it is Circular, Proxima Nova, or Inter. Match the category, weight range, and tracking behavior. The resulting designs will feel right even if the exact typeface differs.

### On Completeness

Every section of the slim spec must be filled with substantive, specific content. Do not leave any section with placeholder text like "TBD" or "adjust as needed." The spec should be immediately usable via `--style <slug>` without further editing.

### On Format

The slim spec MUST follow the Palette → Typography → Layout → Do/Don't → CSS snippets shape. Do NOT generate the verbose 9-section DESIGN.md format with sections like "Visual Theme & Atmosphere," "Depth & Elevation," or "Format Adaptation Notes." The slim format is what the generation pipeline reads.
