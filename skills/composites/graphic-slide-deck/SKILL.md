---
name: graphic-slide-deck
description: Create professionally designed HTML + CSS slide decks for sales, pitch, work, conference, and onboarding presentations, with optional PDF export. Use when the user needs a polished slide deck from a brief, outline, or existing content, wants goose-graphics-compatible style themes, and needs structured slide layouts, browser-previewable HTML, or print-ready PDF output.
tags: [content, design]
---

# Graphic Slide Deck

Create professionally designed slide decks as HTML + CSS first, then export to PDF if requested.

This skill is for real presentation work: investor decks, sales decks, internal strategy decks, onboarding decks, conference talks, and polished work presentations. It should feel structured, editorial, and presentation-ready, not like a generic web page broken into slides.

## Core Promise

1. Clarify the deck purpose, audience, and desired outcome
2. Plan the deck before designing it
3. Generate one HTML file per slide using a consistent visual system
4. Keep every slide presentation-safe and viewport-safe
5. Export to PDF when requested

## Best Fit

- Investor pitch decks
- Sales call decks
- Product or company overviews
- Internal strategy decks
- Conference or keynote slide decks
- Onboarding or training decks

## Use Something Else

- If the user only needs a single presentation graphic or one hero slide, use `goose-graphics`.
- If the user wants a social carousel rather than a full presentation, use `goose-graphics` with `carousel`.
- If the user wants a video or animated presentation, use `vid-motion-graphics`.

## Required Intake

Ask only for what is missing, but always resolve these fields before full generation:

1. Purpose
2. Audience
3. Key message or desired outcome
4. Slide count target
5. Source content: existing content or draft-from-scratch brief
6. Style choice
7. Output format: HTML only, PDF only, or both
8. Aspect ratio: `16:9` or `1:1`

Suggested question phrasing:

- What is this deck for: sales call, investor pitch, internal presentation, conference talk, or onboarding?
- Who will see it: prospects, investors, team, executives, or public audience?
- What should the audience believe, do, or decide after this deck?
- How many slides do you want? If you are unsure, suggest a range based on deck type.
- Do you already have content, or should I draft it from scratch?
- Which style should I use? I can list goose-graphics styles, use one of the validated deck styles, or match your brand.
- Do you want HTML only, or PDF too?

## Default Slide Count Guidance

| Deck Type | Recommended Count |
|-----------|-------------------|
| Investor pitch | 10-15 |
| Sales deck | 5-12 |
| Internal work deck | 8-20 |
| Conference talk | 12-30 |
| Onboarding deck | 8-20 |

If the user asks for too many ideas on too few slides, split or simplify. A readable deck beats a cramped deck.

## Style Selection

This skill should use the Gooseworks style ecosystem rather than inventing an isolated one-off deck system.

### Preferred Style Flow

1. If the user names a style, verify it exists:

```bash
npx gooseworks styles list
npx gooseworks styles search "clean slate"
npx gooseworks styles get <slug>
```

2. If the user says "match our brand":

- If they provide a reference image or existing deck visual, use `goose-graphics-create-style` first
- If they provide a website and want a brand-derived system, use `visual-brand-extractor`

3. If the user has no style preference, recommend from the validated deck styles below.

### Validated Deck Styles

These styles are especially suitable for slide decks:

- `midnight-editorial` — dark background, high contrast, editorial typography
- `matt-gray` — neutral gray, clean, professional
- `clean-slate` — white background, minimal, corporate-safe
- `brutalist` — bold, high-energy, startup-forward
- `mint-pixel-corporate` — fresh corporate, mint + white
- `product-minimal` — product-focused, lots of whitespace
- `magazine-red` — bold red accents, editorial punch
- `soft-cloud` — light pastels, approachable, SaaS-friendly

### Style Matching Heuristics

| Deck Need | Good Style Direction |
|-----------|----------------------|
| Investor pitch | `midnight-editorial`, `matt-gray`, `product-minimal` |
| Corporate work deck | `clean-slate`, `matt-gray`, `mint-pixel-corporate` |
| Startup sales deck | `brutalist`, `magazine-red`, `midnight-editorial` |
| Friendly onboarding | `soft-cloud`, `clean-slate`, `mint-pixel-corporate` |
| Product presentation | `product-minimal`, `clean-slate`, `matt-gray` |

## Output Structure

Required output:

```text
deck/[name]-slides/
  slide-01.html
  slide-02.html
  slide-03.html
  ...
```

Optional but recommended support files:

```text
deck/[name]-slides/
  index.html
  print.html
  assets/
```

If PDF is requested:

```text
deck/[name].pdf
```

## Slide Layout Library

Use these layouts intentionally. Do not force every slide into the same template.

| Layout | Use Case |
|--------|----------|
| `title-hero` | Opening slide with headline, subtext, optional visual |
| `section-divider` | Section break or chapter marker |
| `text-full` | Text-heavy point, concise bullets, framework explanation |
| `text-left-image-right` | Explanation paired with screenshot or visual |
| `image-left-text-right` | Visual-first slide with supporting explanation |
| `two-column-text` | Comparisons, pros/cons, before/after |
| `image-full` | Full-bleed image or product screenshot with minimal overlay |
| `image-grid` | 2x2 or 3x2 screenshot collage |
| `stat-highlight` | Big metrics, traction, KPIs |
| `quote-callout` | Testimonial, pull quote, or principle statement |
| `comparison-table` | Feature matrix or option comparison |
| `timeline` | Milestones, roadmap, company story, rollout plan |
| `closing-cta` | Ask, next steps, contact, follow-up |

## Layout Mapping Heuristics

Choose layouts based on slide intent:

- Opening thesis -> `title-hero`
- New chapter -> `section-divider`
- Dense but important explanation -> `text-full`
- Product walkthrough or screenshot -> `text-left-image-right` or `image-left-text-right`
- Metrics or traction -> `stat-highlight`
- Competitive matrix -> `comparison-table`
- Story arc or milestones -> `timeline`
- Final ask -> `closing-cta`

Avoid using `text-full` for too many slides in a row. Alternate density and rhythm.

## Deck Workflow

### Step 1 - Understand the Deck Job

Before building slides, understand:

- What decision or outcome the deck is trying to drive
- What the audience already knows
- What objections or questions they likely have
- Whether the deck is narrative, proof-driven, tactical, or visual

This determines the deck shape more than the topic alone.

### Step 2 - Build the Slide Outline First

Always outline the deck before rendering slides.

Use a planning table like:

| Slide | Purpose | Core Message | Layout |
|-------|---------|--------------|--------|
| 1 | Open strong | Why this matters now | title-hero |
| 2 | Problem | Current pain or gap | text-full |
| 3 | Solution | What we do | text-left-image-right |
| 4 | Proof | Results or traction | stat-highlight |

Do not start slide design until the outline is coherent.

### Step 3 - Enforce Presentation Density

Every slide must be readable at presentation distance.

Rules:

- One core idea per slide
- 4 to 6 bullets max on text slides
- 3 to 4 KPIs max on stat slides
- Comparison tables must stay readable, not spreadsheet-like
- If a slide starts becoming a memo, split it

If the user gives too much content, distribute it across more slides rather than shrinking it into illegibility.

### Step 4 - Build the Visual System

Once style is chosen, apply it consistently across the whole deck:

- Headline scale
- Body text rhythm
- Accent color usage
- Spacing system
- Caption / metadata treatment
- Image framing
- Footer or slide number convention

The deck should feel like one designed artifact, not disconnected pages.

### Step 5 - Generate HTML Slides

Each slide should be its own HTML file sized to the chosen aspect ratio.

Default sizes:

- `16:9` -> `1920x1080`
- `1:1` -> `1080x1080`

For each slide:

- Use fixed pixel canvas dimensions for the slide artboard
- Keep content fully within the slide bounds
- Use the chosen style's palette, typography, and spacing signals
- Add comments only where helpful for future edits

Recommended additional files:

- `index.html` to preview the deck in sequence
- `print.html` to assemble all slides in print order for PDF generation

## Rendering Rules

### HTML Rules

- HTML first, no PowerPoint-first assumptions
- One slide per file
- Inline or local CSS is fine, but keep the visual system consistent
- Prefer self-contained slide files where practical
- Use local `assets/` for screenshots, logos, and charts

### Slide Safety Rules

- Never let content overflow the slide
- Never require scrolling inside a slide
- Never shrink text so far that the slide becomes unreadable
- Keep title hierarchy obvious
- Keep margins generous

### Aspect Ratio Rules

- `16:9` is default for presentation use
- `1:1` is acceptable for LinkedIn or square sharing decks
- If the user asks for both, build the main deck first and only then adapt

## PDF Export

If the user requests PDF, export from HTML after the deck is visually complete.

Preferred method:

- Generate a `print.html` with one slide per printed page
- Use a browser or Playwright print-to-PDF flow

Print requirements:

- One slide per page
- No browser chrome
- Zero unexpected page breaks
- Preserve background colors and images

If exporting via Playwright or Chromium, ensure print CSS forces page boundaries cleanly.

## Recommended Print CSS

Use print rules like:

- fixed slide width/height converted for print pages
- `page-break-after: always` on each slide wrapper
- final slide wrapper `page-break-after: auto`
- `print-color-adjust: exact`

The goal is a merged PDF that looks like slides, not a flowing document.

## Suggested Deck Shapes

### Investor Pitch

Typical sequence:

1. Title / thesis
2. Problem
3. Why now
4. Solution
5. Product
6. Market
7. Business model
8. Traction
9. Go-to-market
10. Competition
11. Team
12. Ask

### Sales Deck

Typical sequence:

1. Title / relevance
2. Customer problem
3. Current broken workflow
4. Solution overview
5. Product screenshots
6. Results / proof
7. Implementation or process
8. CTA / next step

### Internal Work Deck

Typical sequence:

1. Topic / objective
2. Current state
3. Findings
4. Options
5. Recommendation
6. Timeline
7. Risks
8. Next steps

## Image and Screenshot Usage

Use images deliberately:

- Product screenshots for proof or walkthroughs
- Diagrams when structure matters
- Photo-based slides only when they support the message

Do not add decorative stock imagery to serious work decks unless it truly improves comprehension.

## If Content Must Be Drafted

If the user asks you to draft deck content from scratch:

1. Build the slide outline first
2. Draft concise slide copy for each slide
3. Keep slides punchy and speakable
4. Avoid full paragraphs unless the slide is intentionally text-led

Write for slides, not for documents.

## Success Criteria

A strong output from this skill should feel:

- Presentation-ready without needing manual redesign
- Structured around audience and outcome
- Visually consistent across all slides
- Readable on screen and in PDF
- Easy to preview in browser and easy to present live

## Dependencies

Required skill:

- `goose-graphics`

Recommended skills:

- `visual-brand-extractor`
- `goose-graphics-create-style`

## Example Request

```text
Create a 15-slide investor pitch deck for our AI analytics SaaS. Audience is Series A VCs. Use the midnight-editorial style. Output both HTML and PDF.
```

Expected result:

- A planned 15-slide deck
- HTML slides in `deck/[name]-slides/`
- Matching print-ready PDF in `deck/[name].pdf`
