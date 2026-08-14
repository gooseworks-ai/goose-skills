---
name: blog-visual-generator
description: >
  Generates a complete set of publication-ready visuals and infographics for any blog post URL.
  Use this skill whenever the user provides a blog post link and asks for visuals, diagrams,
  infographics, illustrations, or images to accompany it — even if they just say "make visuals
  for this post", "illustrate this article", "add graphics", or "generate images for my blog".
  Also triggers for requests like "create a visual summary", "turn this into infographics",
  or "make this more visual". Produces: hero image, section flowcharts, comparison panels,
  stat infographics, and pipeline diagrams — all inline in chat AND as a downloadable HTML file.
  Always use this skill when a blog URL is present and any visual/graphic intent is expressed.
---

# Blog Visual Generator

Generates a complete, publication-ready visual set for any blog post from a URL.
Covers: hero image · flowcharts · infographics · comparison panels · stat cards · pipelines.
Output: inline widgets (show_widget) + downloadable HTML file.

---

## PHASE 0 — SETUP (run before anything else)

### Step 0-A: Fetch and analyse the blog post

Use `web_fetch` on the provided URL. Extract:

| Variable | What to detect |
|---|---|
| `BLOG_TITLE` | Post headline |
| `BLOG_TONE` | Technical / Strategy-GTM / Tutorial / Concept-Explainer / Mixed |
| `BLOG_SECTIONS` | List of all H2/H3 headings and their content summaries |
| `BLOG_DENSITY` | Count of sections (≥6 = Compact, 3–5 = Balanced, ≤2 = Spacious) |
| `BLOG_BRAND_COLORS` | Any hex codes, brand names, or color signals found in the page CSS or content |
| `BLOG_THEME_HINT` | Light / Dark / Neutral — inferred from brand colors and post tone |
| `BLOG_FONT_HINT` | Editorial prose → Inter/sans · Code-heavy → Mono-accent |
| `BLOG_INFOGRAPHIC_SECTIONS` | 1–3 sections with: key stats, numbered lists, before/after, or 3–5 discrete items |

Store all as `[BLOG_*]` variables. Use them throughout generation.

### Step 0-B: Detect brand palette

Attempt to infer the brand palette from `[BLOG_BRAND_COLORS]`:

- If specific hex codes are found → use them as ACCENT1, ACCENT2, ACCENT3
- If a known brand is detected (e.g. Stormy AI → indigo/teal/amber) → apply its palette
- If no signal → fall back to **Stormy AI Match**: `#4F63D2 · #0D9488 · #D97706`

Then apply theme:
- Light hint or Strategy/GTM/Tutorial tone → `BG=#FFFFFF, TEXT=#0F172A, MUTED=#64748B`
- Dark hint or code/agent-heavy → `BG=#0F1117, TEXT=#F0F4FF, MUTED=#8B95A8`
- Neutral → default Light

Lock the **Active Style Profile** (tokens finalised after Step 0-C).

---

### Step 0-C: Style Preference Intake — MANDATORY, ALWAYS RUNS FIRST

**This step is REQUIRED. Never skip it. Never proceed to Phase 1 without completing it.**

After fetching and analysing the blog post, always present this message verbatim (substituting [BLOG_TITLE]):

---

> *"I've analysed **[BLOG_TITLE]** and detected its structure and brand style. Before I generate anything, I'd love to tailor the visuals to your taste.*
>
> *You have three options:*
> *— **A)** Upload a reference image (brand kit screenshot, a design you love, a color palette) — I'll match its aesthetic exactly.*
> *— **B)** Answer the quick style questionnaire below — takes ~30 seconds.*
> *— **C)** Say "use your defaults" and I'll proceed with the auto-detected brand palette.*"

---

#### Option A — Reference image uploaded

If the user uploads any image, examine it carefully and extract:

| Signal | What to look for |
|---|---|
| Background color | Light / dark / colored — approximate hex |
| Primary + accent colors | Dominant hex values used for text, buttons, highlights |
| Font weight impression | Light, regular, bold, or heavy — judge from the weight of visible text |
| Corner style | Are shapes sharp, rounded, or pill-shaped? |
| Density | Breathing room — spacious, balanced, or compact? |
| Overall mood | Minimal / editorial / corporate / vibrant / technical |

Map all extracted signals to the Active Style Profile. Set `SOURCE: Reference image`. Note any inferences made (e.g. "inferred dark theme from near-black background"). Then proceed to Phase 1 — no questionnaire needed unless the user also wants to fine-tune specific settings.

#### Option B — Questionnaire (MCQ Intake)

Present **all 8 questions at once** in a single message. Never ask them one at a time.

---

**Q1 — Theme**
*Overall color feel of the visuals:*
- **A)** ☀️ Light — white/light-gray backgrounds, dark text (clean, editorial)
- **B)** 🌙 Dark — near-black backgrounds, light text (bold, dramatic)
- **C)** 🎨 Brand-matched — auto-detect from the blog's own palette
- **D)** 🖌️ Custom — I'll specify hex codes *(if D: ask for BG, text, and up to 3 accent hex codes after they answer)*

**Q2 — Accent palette**
*Color mood for highlights, node fills, stat numbers:*
- **A)** 🔵 Indigo + Teal — professional, SaaS
- **B)** 🟠 Amber + Coral — warm, energetic
- **C)** 🟣 Purple + Pink — creative, bold
- **D)** 🟢 Green + Teal — growth, health, nature
- **E)** ⚫ Monochrome — grayscale only
- **F)** 🎯 Match blog brand — auto-detect
- **G)** 🖌️ Custom — I'll provide hex codes

**Q3 — Typography weight**
*How bold should text in diagrams and cards feel?*
- **A)** Regular — clean and lightweight (font-weight 500)
- **B)** Bold — strong and prominent (font-weight 700) ← recommended
- **C)** Heavy — maximum impact, large commanding labels (font-weight 800)

**Q4 — Font style**
- **A)** Sans-serif — modern, clean (Inter / system-ui)
- **B)** Mono-accent — code-friendly, technical (monospace for labels)
- **C)** Mixed — sans-serif for headings, monospace for data and code labels

**Q5 — Corner style**
- **A)** Rounded — soft corners (rx = 10–14px) ← default
- **B)** Sharp — no corner radius (rx = 0)
- **C)** Pill — fully rounded ends

**Q6 — Layout density**
*Breathing room between diagram elements:*
- **A)** Spacious — generous padding, fewer elements per visual
- **B)** Balanced — standard spacing ← default
- **C)** Compact — tighter layout, more information per visual

**Q7 — Connector line style**
- **A)** Straight with L-bends ← default
- **B)** Curved / organic
- **C)** Dashed for secondary connections

**Q8 — Napkin AI prompts**
*Include a Napkin AI re-creation prompt after each flowchart and pipeline?*
- **A)** Yes — include prompts
- **B)** No ← default

---

After the user answers, map all selections to the Active Style Profile and lock it before Phase 1.

#### Option C — "Use your defaults" / user skips

Apply auto-detected values from Step 0-B. Set `SOURCE: Auto-detected`.
Always apply these baseline text rendering defaults regardless:

```
FONT_WEIGHT_LABEL:  700
FONT_WEIGHT_TITLE:  700
FONT_SIZE_LABEL:    15px
FONT_SIZE_SUBTITLE: 13px
MIN_CONTRAST_RATIO: 5:1
```

---

### Active Style Profile lock (set after Step 0-C, before Phase 1)

```
THEME:              [Light / Dark / Custom]
BG:                 [hex]
TEXT_PRIMARY:       [hex]
TEXT_MUTED:         [hex]
ACCENT1:            [hex]   ← input / source / trigger nodes
ACCENT2:            [hex]   ← processing / logic nodes
ACCENT3:            [hex]   ← decision / output nodes
FONT_STACK:         [Inter,sans-serif / monospace / mixed]
FONT_WEIGHT_LABEL:  [600 / 700 / 800]
FONT_WEIGHT_TITLE:  [700 / 800]
FONT_SIZE_LABEL:    [14px / 15px / 16px]
FONT_SIZE_SUBTITLE: [12px / 13px / 14px]
CORNER_RADIUS:      [rx value for SVG / border-radius for HTML]
DENSITY:            [Spacious / Balanced / Compact]
LINE_STYLE:         [L-bend / Curved / Dashed]
NAPKIN:             [true / false]
SOURCE:             [Auto-detected / User-defined / Reference image / Mixed]
```

---

## PHASE 1 — SECTION SCORING

Score every section 1–5 for visual opportunity:

| Score | Criteria |
|---|---|
| 5 | Multi-step workflow, comparison table, numbered protocol, pipeline with named tools |
| 4 | 3+ discrete items, before/after, classification system, stat-rich section |
| 3 | Conceptual explanation, single process, quote-anchored insight |
| 2 | Transitional paragraph, background context |
| 1 | Intro/outro filler, meta-commentary |

**Generate a visual for every section scoring ≥ 3**, plus always generate the Hero.

For each qualifying section, assign a visual type:

- Numbered list / protocol → **Icon Callout Infographic** (HTML)
- Before/after / comparison table → **Comparison Panel** (HTML)
- Key stats / metrics → **Editorial Stat Cards** (HTML)
- Multi-step workflow / pipeline → **Flowchart or Pipeline** (SVG)
- Single concept with spatial structure → **Concept Diagram** (SVG)
- Post summary / conclusion → **Pipeline Overview** (SVG)

---

## PHASE 2 — GENERATION RULES

### Pre-generation checklist (run before every single visual)

**Layout:**
- Explicit `<rect>` background fill as first SVG element (never transparent backgrounds in SVG)
- Box width ≥ (longest_label_chars × 8.5) + 36px
- Box height: 48px (1-line label) / 64px (2-line label) / 80px (3-line label)
- 18px horizontal padding, 12px vertical padding inside every box
- `dominant-baseline="central"` on all SVG `<text>` elements
- SVG viewBox width always 680, height = lowest element bottom + 40px
- Max 10 nodes per SVG diagram — split into Part A / Part B if more needed
- All connector `<path>` elements must carry `fill="none"`
- No arrows crossing through unrelated boxes — use L-bend routing

**Text (verify every element before finalising):**
- All label text in boxes: font-weight ≥ FONT_WEIGHT_LABEL (never below 600)
- All title text: font-weight ≥ FONT_WEIGHT_TITLE (never below 700)
- Font sizes: labels ≥ FONT_SIZE_LABEL, subtitles ≥ FONT_SIZE_SUBTITLE
- Full-color accent fill → text = `#FFFFFF`, weight = 700 — no exceptions
- Light-tint fill → text = 800/900 shade of same ramp, weight = 700
- Dark fill → text = 50/100 shade of same ramp, weight = 700
- Contrast ratio ≥ 5:1 on every text/background pair
- Never use MUTED or secondary colors for text inside boxes

**HTML infographics:**
- Stat numbers: font-size ≥ 32px, font-weight 700, color = ACCENT (never gray)
- Card labels: font-size ≥ 14px, font-weight 700, color = TEXT_PRIMARY
- Badge text: font-size ≥ 12px, font-weight 700, background ↔ text contrast ≥ 5:1
- Body text inside cards: font-size ≥ 13px, font-weight 500, line-height 1.65

---

### TEXT RENDERING STANDARDS

Text is the most critical element in information graphics. These rules are non-negotiable and apply to every SVG and HTML visual produced by this skill.

#### SVG text — mandatory rules

**Rule T1 — Weight is always explicit.**
Every `<text>` element inside or adjacent to a filled shape must carry an explicit `font-weight` attribute. Never rely on a CSS class default. Use `font-weight="700"` for node labels and titles, `font-weight="600"` for subtitles, `font-weight="500"` only for body/caption text in clearly light areas.

**Rule T2 — Minimum font sizes are hard floors.**
- Node labels (primary): 15px minimum
- Node subtitles (secondary line): 13px minimum
- Connector / arrow labels: 12px minimum
- Legend or footnote text: 12px minimum
These floors apply regardless of density setting. If compact mode is selected, reduce spacing between elements — not font sizes.

**Rule T3 — Contrast is computed, not assumed.**
For every `<text>` element, follow this decision tree:
```
Fill is full-color accent (ACCENT1/2/3)?  → text = #FFFFFF, weight 700
Fill is light tint (opacity < 0.3 or 50–200 stop)?  → text = 900-stop of that color, weight 700
Fill is dark (800–950 stop)?  → text = 50-stop of that color, weight 700
Background is white/near-white?  → text = #0F172A, weight 600+
Background is dark (#111–#1F)?  → text = #F0F4FF, weight 600+
```
Never place gray on gray. Never place a light accent on a light tint of the same hue.

**Rule T4 — Text must not clip or overflow.**
Before placing any label, compute: `char_count × font_size × 0.6 + (2 × h_padding) ≤ box_width`.
If the label is too long: shorten it (abbreviate, use two lines, or widen the box). Never let text visually overflow its container.

**Rule T5 — Two-line labels use tspan correctly.**
```xml
<text x="..." y="..." text-anchor="middle" font-weight="700" font-size="15">
  <tspan x="..." dy="-0.65em">First line</tspan>
  <tspan x="..." dy="1.4em">Second line</tspan>
</text>
```
Both tspans inherit `font-weight` from the parent. Set it on the parent `<text>` explicitly.

**Rule T6 — Letter spacing on bold short labels.**
For step numbers, badge text, or any all-caps label ≤ 6 characters, add `letter-spacing="0.04em"` to prevent cramping at bold weight.

**Rule T7 — Halo stroke when label overlaps a connector.**
If a text element must sit over a line or arrow, add:
`paint-order="stroke fill"` + `stroke="[BG color]"` + `stroke-width="5"` on the `<text>`.
This creates a legible knockout halo. Use sparingly — prefer placing labels in clear space.

#### HTML text — mandatory rules

**Rule H1 — Stat numbers are the hero.**
```css
.stat-number { font-size: 36px; font-weight: 700; color: [ACCENT]; line-height: 1; }
```
Never make a stat number gray, muted, or smaller than 28px.

**Rule H2 — Card titles are always bold.**
```css
.card-title { font-size: 14px; font-weight: 700; color: [TEXT_PRIMARY]; margin-bottom: 6px; }
```
Never use font-weight 400 or 500 for a card title.

**Rule H3 — Table headers are styled, not default.**
```css
th { font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: [TEXT_MUTED]; background: [BG_SECONDARY]; }
```

**Rule H4 — Badge and pill labels are always readable.**
```css
.badge { font-size: 12px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 10px; border-radius: 999px; }
```
The badge background and text color must contrast ≥ 5:1. Never use the same hue at similar lightness.

**Rule H5 — Comparison panel "winning" column is visually dominant.**
The new/better column gets: `border: 2px solid [ACCENT1]`, title at `font-weight: 700; color: [ACCENT1]`, and a subtle tint background. The old/worse column gets muted styling — gray border, secondary text color — so the contrast between columns is immediately readable.

**Rule H6 — No italic text anywhere in diagrams or infographics.**
Italic reduces legibility at small sizes in visual graphics. Use font-weight variation and color instead.

---

### Color encoding (never sequence-color)

| Semantic role | Color |
|---|---|
| Input / source / trigger | ACCENT1 |
| Processing / logic | ACCENT2 |
| Decision / branch | ACCENT3 |
| Output / result / success | SUCCESS (#059669) |
| Error / fallback | WARNING or DANGER |
| External system / API | NEUTRAL |
| Memory / storage | Purple (#7C3AED) |

Every color assignment must also pass the contrast check in Rule T3 before use.

### Visual sequence

Generate in this order:
1. **Hero image** (SVG) — always first
2. **Section visuals** in reading order (top to bottom of post)

After each visual, print the Napkin AI prompt if `NAPKIN=true` and the visual type qualifies (flowcharts, pipelines, hero, architecture diagrams — NOT stat cards or comparison panels).

---

## PHASE 3 — OUTPUT FORMAT

### Per visual block

```
────────────────────────────────────────
**Visual [N]: [Title]**
Covers: [section name]
Visual type: [hero / flowchart / infographic / comparison / pipeline / stat-cards]
Format: [SVG / HTML]
What it shows: [1 sentence]

▶ [rendered inline via show_widget]

📌 NAPKIN AI PROMPT: [only if NAPKIN=true and type qualifies]
[prompt text]
────────────────────────────────────────
```

### Style profile header (print once, before Visual 1)

```
### 🎨 Active Style Profile
Theme:        [Light / Dark / Custom]
Background:   [hex]
Text:         [primary hex] / [muted hex]
Palette:      [name — ACCENT1 · ACCENT2 · ACCENT3]
Font:         [stack]
Weight:       Labels [N] / Titles [N]
Sizes:        Labels [px] / Subtitles [px]
Corners:      [rx / border-radius value]
Density:      [Spacious / Balanced / Compact]
Line style:   [L-bend / Curved / Dashed]
Napkin AI:    [Yes / No]
Source:       [Auto-detected / User-defined / Reference image / Mixed]
```

### Final summary table (print after all visuals)

```
### ✅ Visual Summary
| # | Title | Type | Format | Section |
|---|-------|------|--------|---------|
...

Total: [N] visuals · Theme: [X] · Palette: [X] · Density: [X]
```

### Downloadable HTML file

After all visuals are shown inline, compile into a single self-contained HTML file:

- One `<section>` per visual with a visible label heading
- All SVGs embedded inline (no external references)
- All HTML infographics as `<div>` blocks
- Background matches THEME; Inter font via Google Fonts `<link>`
- All text in the HTML file must comply with TEXT RENDERING STANDARDS (Rules H1–H6)
- Print-friendly `<style>`: page breaks between sections, no link underlines
- Save to `/mnt/user-data/outputs/blog-visuals-[slug].html`
- Present via `present_files` tool

---

## PHASE 4 — CONTENT ACCURACY RULES

- Use ONLY information explicitly stated in the blog post
- Never invent steps, metrics, tools, or connections not mentioned in the post
- Use exact labels and terminology from the post — do not paraphrase node labels
- Preserve all logical ordering and hierarchy exactly as written
- For comparison visuals: reproduce only the columns/rows the post actually lists

---

## Reference files

Read these when needed — do not load all upfront:

| File | When to read |
|---|---|
| `references/visual-types.md` | Deciding which visual type fits a section |
| `references/style-tokens.md` | Looking up full hex token table for a named palette |
