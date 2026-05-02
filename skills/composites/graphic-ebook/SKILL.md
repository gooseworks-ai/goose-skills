---
name: graphic-ebook
description: Create professionally designed B2B SaaS e-books as HTML + CSS, then export them to PDF. Use when the user needs a lead magnet, gated content asset, nurture guide, or thought-leadership e-book from a brief or existing content, wants Gooseworks-compatible style themes, and needs structured portrait page layouts with print-ready output.
tags: [content, design]
---

# Graphic Ebook

Create professionally designed B2B SaaS e-books as HTML + CSS first, then export to PDF.

This skill is for serious marketing collateral: lead magnets, gated guides, executive primers, mini-reports, and nurture assets that should feel editorial, branded, and polished. The output should read like a designed publishing asset, not a long web page dumped into PDF.

## Core Promise

1. Clarify the e-book topic, audience, and desired outcome
2. Plan the page structure before designing anything
3. Draft or shape content into page-sized sections
4. Generate one HTML file per page using a consistent visual system
5. Export a clean, print-ready PDF

## Best Fit

- B2B SaaS lead magnets
- Gated guides
- Thought-leadership mini reports
- Nurture content assets
- Product education e-books
- Research or benchmark summaries

## Use Something Else

- If the user needs a presentation deck, use `graphic-slide-deck`.
- If the user only needs one infographic, hero visual, or social graphic, use `goose-graphics`.
- If the user needs supporting charts or data visuals, use `graphic-chart`.
- If the user needs technical diagrams or architecture visuals inside the e-book, use `technical-blog-graphics`.

## Required Intake

Ask only for what is missing, but always resolve these fields before full generation:

1. Topic
2. Audience
3. Desired action or CTA
4. Page count target
5. Source content: existing content or draft-from-scratch brief
6. Style choice
7. Brand name
8. Logo inclusion, if available

Suggested question phrasing:

- What is the e-book topic? Be specific about the promise or angle.
- Who is the target audience: role, company type, company size, and main pain point?
- What should the reader do after reading: book a demo, download a template, share the content, or something else?
- How many pages do you want? If you are unsure, suggest a range based on depth.
- Do you already have content, or should I draft it from scratch?
- Which style should I use? I can list Gooseworks styles, use one of the validated e-book styles, or match your brand.
- What brand name and logo, if any, should appear on the cover and footer?

## Default Page Count Guidance

| Ebook Type | Recommended Count |
|------------|-------------------|
| Quick guide | 3-5 |
| Standard lead magnet | 5-7 |
| Thought-leadership report | 6-10 |
| Research summary | 6-10 |

If the user tries to fit too much into too few pages, increase the page count or simplify the scope. A readable asset converts better than a cramped one.

## Style Selection

Use the Gooseworks style ecosystem instead of inventing a disconnected e-book aesthetic.

### Preferred Style Flow

1. If the user names a style, verify it exists:

```bash
npx gooseworks styles list
npx gooseworks styles search "clean slate"
npx gooseworks styles get <slug>
```

2. If the user says "match our brand":

- If they provide a reference image, existing PDF, or visual sample, use `goose-graphics-create-style` first
- If they provide a website and want a brand-derived system, use `visual-brand-extractor`

3. If the user has no style preference, recommend from the validated e-book styles below.

### Validated Ebook Styles

These styles are especially suitable for B2B SaaS e-books:

- `clean-slate` - white background, professional, B2B-safe
- `midnight-editorial` - dark, premium, thought-leadership feel
- `matt-gray` - neutral, clean, timeless
- `product-minimal` - whitespace-heavy, ideal for product-led guides
- `warm-earth` - approachable, startup-friendly
- `soft-cloud` - light, airy, SaaS-forward
- `brutalist` - bold, disruptive, high-energy positioning
- `magazine-red` - editorial punch for trend or research reports

### Style Matching Heuristics

| Ebook Need | Good Style Direction |
|------------|----------------------|
| Executive thought leadership | `midnight-editorial`, `matt-gray` |
| Product education | `product-minimal`, `clean-slate` |
| Demand generation guide | `clean-slate`, `soft-cloud`, `warm-earth` |
| Category creation or bold POV | `brutalist`, `magazine-red` |
| Benchmark or research report | `matt-gray`, `midnight-editorial`, `magazine-red` |

## Output Structure

Required output:

```text
ebook/[name]-pages/
  page-01.html
  page-02.html
  page-03.html
  ...
```

Optional but recommended support files:

```text
ebook/[name]-pages/
  index.html
  print.html
  assets/
```

Required PDF output:

```text
ebook/[name].pdf
```

## Page Layout Library

Use these layouts intentionally. Do not force every page into the same template.

| Layout | Purpose |
|--------|---------|
| `cover` | Title, subtitle, brand, hero visual |
| `toc` | Table of contents with numbered sections |
| `chapter-intro` | Section opener with short summary |
| `text-column` | Dense content in one or two columns |
| `text-sidebar` | Main copy with sidebar for stats, tips, or quotes |
| `full-image` | Full-page visual, illustration, product shot, or diagram |
| `quote-callout` | Pull quote or strong point-of-view statement |
| `stat-grid` | Metrics, benchmark figures, or proof points |
| `closing-cta` | Summary, next step, contact, or conversion prompt |

## Layout Mapping Heuristics

Choose layouts based on page intent:

- First impression -> `cover`
- Reader navigation -> `toc`
- New section -> `chapter-intro`
- Educational explanation -> `text-column`
- Main narrative plus proof or aside -> `text-sidebar`
- Visual break or conceptual diagram -> `full-image`
- Memorable takeaway -> `quote-callout`
- Data-backed proof -> `stat-grid`
- Final conversion push -> `closing-cta`

Avoid long runs of dense text pages. Break rhythm with visuals, stats, or chapter openers.

## Ebook Workflow

### Step 1 - Understand the Content Job

Before building pages, understand:

- What the reader is trying to learn or solve
- What level of sophistication the audience has
- What credibility signals are needed
- What action the asset is meant to drive
- Whether the e-book is educational, opinionated, research-driven, or product-adjacent

This determines the page flow more than the topic name alone.

### Step 2 - Build the Page Outline First

Always outline the e-book before rendering pages.

Use a planning table like:

| Page | Purpose | Core Message | Layout |
|------|---------|--------------|--------|
| 1 | Hook the reader | Why this guide matters | cover |
| 2 | Orient | What is inside | toc |
| 3 | Section open | Frame the first major idea | chapter-intro |
| 4 | Teach | Main guidance or framework | text-column |
| 5 | Prove | Metrics or examples | stat-grid |
| 6 | Convert | Summary + CTA | closing-cta |

Do not start page design until the outline feels coherent and proportional.

### Step 3 - Shape Content for Page Density

E-book pages should feel designed, not stuffed.

Rules:

- One core idea per page
- Prefer short paragraphs over walls of copy
- Use sidebars for tips, stats, and standout points
- Turn abstract ideas into frameworks, charts, diagrams, or pull quotes where possible
- Split pages before shrinking text to make everything fit

If the user provides too much content, redistribute it across more pages or tighten the writing.

### Step 4 - Build the Visual System

Once style is chosen, apply it consistently across the full e-book:

- Cover treatment
- Heading scale
- Body-copy rhythm
- Sidebar styling
- Accent color usage
- Page numbers or footer system
- Diagram and chart framing
- CTA treatment

The e-book should feel like one designed publication, not unrelated pages.

### Step 5 - Generate HTML Pages

Each page should be its own HTML file sized for portrait export.

Default page size:

- `1200x1697`

For each page:

- Use a fixed pixel artboard
- Keep all content fully within the page bounds
- Preserve generous margins
- Use the chosen style's palette, type, spacing, and component behavior
- Add comments only where helpful for future edits

Recommended additional files:

- `index.html` for browser preview
- `print.html` to assemble all pages in print order for PDF generation

## Rendering Rules

### HTML Rules

- HTML first, then PDF
- One page per file
- Inline or local CSS is fine, but keep the system consistent
- Prefer self-contained page files where practical
- Use local `assets/` for logos, screenshots, charts, and diagrams

### Page Safety Rules

- Never let content overflow the page
- Never rely on scrolling
- Never reduce type until the page becomes hard to read
- Keep clear hierarchy between title, section labels, body, and footnotes
- Leave breathing room around visuals and sidebars

### Content Rules

- Write for skim-readability and conversion, not academic density
- Keep claims specific and credible
- Use charts, proof blocks, and frameworks when they clarify the message
- Make the CTA explicit on the closing page

## PDF Export

This skill should output a PDF after the HTML pages are complete.

Preferred method:

- Generate a `print.html` with one page per printed sheet
- Use a browser or Playwright print-to-PDF flow

Print requirements:

- One e-book page per PDF page
- No browser chrome
- Zero accidental page breaks
- Preserve background colors and images
- Keep portrait sizing consistent across the document

If exporting via Playwright or Chromium, ensure print CSS forces exact page boundaries cleanly.

## Recommended Print CSS

Use print rules like:

- fixed portrait page width and height
- `page-break-after: always` on each page wrapper
- final page wrapper `page-break-after: auto`
- `print-color-adjust: exact`

The goal is a merged PDF that looks like a designed publication, not a scrolling web article.

## Suggested Ebook Shapes

### Quick Guide

Typical sequence:

1. Cover
2. TOC
3. Problem or context
4. Framework or playbook
5. Example or proof
6. CTA

### Thought-Leadership Ebook

Typical sequence:

1. Cover
2. TOC
3. Thesis or trend framing
4. Section intro
5. Core argument
6. Supporting proof
7. Framework or model
8. Implications
9. Recommendation
10. CTA

### Product-Education Ebook

Typical sequence:

1. Cover
2. TOC
3. Problem framing
4. Best-practice framework
5. Common mistakes
6. Product-supported approach
7. Results or case proof
8. CTA

## If Content Must Be Drafted

If the user asks you to draft from scratch:

1. Build the page outline first
2. Draft concise page copy per page
3. Keep the tone aligned with the target reader
4. Favor clarity, specificity, and B2B usefulness
5. Avoid sounding generic, inflated, or obviously AI-written

Write for a polished lead magnet, not a blog post pasted into PDF.

## Success Criteria

A strong output from this skill should feel:

- Print-ready without manual redesign
- Structured around audience and CTA
- Visually consistent across all pages
- Readable in PDF on desktop and tablet
- Polished enough to use as a real gated asset

## Dependencies

Required skill:

- `goose-graphics`

Recommended skills:

- `visual-brand-extractor`
- `goose-graphics-create-style`
- `graphic-chart`
- `technical-blog-graphics`

## Example Request

```text
Create a 6-page e-book titled "The B2B SaaS Guide to Reducing Churn." Audience: Customer Success Managers at 50-500 person SaaS companies. Use clean-slate style. CTA: book a demo of our platform.
```

Expected result:

- A planned 6-page e-book
- HTML pages in `ebook/[name]-pages/`
- Matching print-ready PDF in `ebook/[name].pdf`
