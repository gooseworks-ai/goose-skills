---
name: graphic-case-study
description: Create professionally designed B2B SaaS case study PDFs as HTML + CSS, then export them to PDF. Use when the user needs a polished customer story for sales, marketing, website, email, or enablement use, wants a challenge-to-solution-to-results narrative, and needs structured 1 to 4 page layouts with Gooseworks-compatible styling and print-ready output.
tags: [content, design]
---

# Graphic Case Study

Create professionally designed B2B SaaS case studies as HTML + CSS first, then export to PDF.

This skill is for one of the most important B2B proof assets: a polished customer success story that can be used in sales follow-up, website resources, outbound collateral, decks, and nurture campaigns. The output should feel credible, specific, and conversion-oriented, not like a generic marketing flyer.

## Core Promise

1. Extract or clarify the customer story details
2. Shape the narrative into a classic proof arc
3. Design each page with a consistent visual system
4. Keep the document tight, measurable, and scannable
5. Export a print-ready PDF

## Best Fit

- Sales-ready customer proof assets
- Website case study downloads
- Outbound follow-up PDFs
- Customer success spotlights
- Product ROI stories
- Enablement collateral for reps and partners

## Use Something Else

- If the user needs a broader multi-topic lead magnet, use `graphic-ebook`.
- If the user needs a slide presentation, use `graphic-slide-deck`.
- If the user only needs a chart or metric visual, use `graphic-chart`.
- If the user needs architecture or workflow diagrams inside the case study, use `technical-blog-graphics`.

## Required Intake

Ask only for what is missing, but always resolve these fields before full generation:

1. Customer name or anonymized label
2. Customer context: size, industry, or use case
3. Core challenge
4. Solution or implementation story
5. Measurable results
6. Testimonial, if available
7. Page count target
8. Style choice
9. Customer logo inclusion, if available
10. Your brand/logo for closing or footer treatment

Suggested question phrasing:

- Who is the customer? If needed, should I anonymize them?
- What was the core challenge before using your product?
- What specifically did your product or service do to solve it?
- What measurable results can we include: time saved, efficiency gains, revenue lift, cost reduction, or error reduction?
- Do you have a customer quote or testimonial to include?
- Should this be a 1-page summary, a 2-page standard case study, or a 4-page detailed version?
- Which style should I use? I can list Gooseworks styles, use a validated case-study style, or match your brand.
- Should I include the customer logo and your logo? If yes, provide the assets or URLs.

## Default Length Guidance

| Format | Recommended Use |
|--------|-----------------|
| `1` page | Summary card for quick follow-up or website download |
| `2` pages | Standard sales-ready case study |
| `4` pages | Detailed proof asset with richer context and visuals |

If the user wants depth but only one page, compress to the strongest story beats and three proof points. Do not cram.

## Story Structure

The default narrative arc should be:

1. Customer context
2. Challenge
3. Solution
4. Results
5. Testimonial
6. CTA or next step

This flow is proven because it moves from credibility to pain to action to proof.

## Style Selection

Use the Gooseworks style ecosystem rather than inventing a disconnected case-study design language.

### Preferred Style Flow

1. If the user names a style, verify it exists:

```bash
npx gooseworks styles list
npx gooseworks styles search "clean slate"
npx gooseworks styles get <slug>
```

2. If the user says "match our brand":

- If they provide brand references or an existing one-pager, use `goose-graphics-create-style` first
- If they provide a company website, use `visual-brand-extractor`

3. If the user has no style preference, recommend from the validated case-study styles below.

### Validated Case-Study Styles

These styles are especially suitable for B2B SaaS case studies:

- `clean-slate` - white, professional, enterprise-safe
- `midnight-editorial` - dark, premium, strong for AI and tech brands
- `matt-gray` - neutral, credible, classic B2B
- `product-minimal` - whitespace-heavy, good for product screenshots
- `mint-pixel-corporate` - modern corporate, fresh but polished
- `warm-earth` - approachable, good for services and consulting
- `brutalist` - bold, differentiating, startup-forward
- `magazine-red` - editorial, strong for agencies or creative positioning

### Style Matching Heuristics

| Case Study Need | Good Style Direction |
|-----------------|----------------------|
| Enterprise credibility | `clean-slate`, `matt-gray` |
| Premium AI or technical brand | `midnight-editorial`, `product-minimal` |
| Warm customer success story | `warm-earth`, `soft-cloud` |
| Bold startup proof asset | `brutalist`, `magazine-red` |
| Product-led story with screenshots | `product-minimal`, `clean-slate` |

## Output Structure

Required output:

```text
case-study/[customer-name]-pages/
  page-01.html
  page-02.html
  ...
```

Optional but recommended support files:

```text
case-study/[customer-name]-pages/
  index.html
  print.html
  assets/
```

Required PDF output:

```text
case-study/[customer-name].pdf
```

## Page Layout Library

Use these layouts intentionally. Do not force every page into the same template.

| Layout | Purpose |
|--------|---------|
| `cover` | Customer name, headline result, logo, hook |
| `overview` | Customer profile, industry, use case, implementation summary |
| `challenge` | Problem context and pain |
| `solution` | Product or service response with feature callouts |
| `results` | Metrics, ROI, stat blocks, supporting proof |
| `testimonial` | Pull quote from the customer |
| `closing-cta` | Brand, contact, next step, or product follow-up |

## Layout Mapping Heuristics

Choose layouts based on page intent:

- Strong opening claim -> `cover`
- Reader orientation -> `overview`
- Before-state pain -> `challenge`
- How it worked -> `solution`
- Proof and ROI -> `results`
- Customer voice -> `testimonial`
- Conversion prompt -> `closing-cta`

Results pages should usually be visually heavier than challenge pages. The proof is the hero.

## Standard Page Structures

### 1-Pager

Typical sequence:

1. Cover
2. Short challenge block
3. Short solution block
4. Three key stats
5. Quote or testimonial

This should feel like a sharp summary card, not a compressed brochure.

### 2-Pager

Typical sequence:

1. Cover plus overview
2. Challenge plus solution
3. Results
4. Testimonial plus CTA

This is the default format for most B2B use.

### 4-Pager

Typical sequence:

1. Cover
2. Overview
3. Challenge
4. Solution
5. Results
6. Testimonial
7. Supporting visuals or proof
8. Closing CTA

Use the longer format only when the story truly supports more context, screenshots, or charts.

## Case Study Workflow

### Step 1 - Understand the Proof Asset

Before designing anything, understand:

- who the audience is
- what sales or marketing job the case study is meant to do
- how specific the claims can be
- whether the customer should be named or anonymized
- what proof is strongest: metrics, quote, implementation complexity, or brand recognition

This determines the tone and structure more than the raw notes do.

### Step 2 - Normalize the Story

Always convert raw notes into a clear story table before rendering pages.

Use a planning table like:

| Section | Core Message | Proof Element | Layout |
|---------|--------------|---------------|--------|
| Cover | Big outcome for this customer | headline stat | cover |
| Challenge | Manual work or risk before the product | problem summary | challenge |
| Solution | What changed operationally | feature or workflow callouts | solution |
| Results | Tangible lift after adoption | metrics or chart | results |
| Testimonial | Customer validation in their voice | quote | testimonial |

Do not start page design until the story is coherent and evidence-backed.

### Step 3 - Tighten for Credibility

Case studies win on specificity.

Rules:

- prefer concrete numbers over vague claims
- keep the customer context concise but real
- use three standout metrics when possible
- avoid inflated marketing language
- keep quotes believable and not over-edited

If the user does not provide measurable results, push the story toward concrete operational outcomes instead of inventing metrics.

### Step 4 - Build the Visual System

Once style is chosen, apply it consistently across the whole asset:

- cover hierarchy
- stat block styling
- quote treatment
- logo placement
- caption and metadata treatment
- footer or page number system
- screenshot or chart framing

The case study should feel like one unified proof document.

### Step 5 - Generate HTML Pages

Each page should be its own HTML file sized for the selected export format.

Recommended default size:

- `1200x1697` for portrait

Acceptable alternate size:

- `1200x900` for landscape `4:3`

Choose portrait unless the user explicitly wants landscape or the story is more visual than narrative.

For each page:

- use a fixed pixel artboard
- keep content fully within the page bounds
- preserve generous margins
- use the chosen style's palette, type, spacing, and component logic
- add comments only when helpful for future edits

Recommended additional files:

- `index.html` for browser preview
- `print.html` to assemble all pages for PDF generation

## Rendering Rules

### HTML Rules

- HTML first, then PDF
- one page per file
- inline or local CSS is fine, but keep the design system consistent
- prefer self-contained page files where practical
- use local `assets/` for logos, screenshots, charts, and diagrams

### Page Safety Rules

- never let content overflow the page
- never rely on scrolling
- never shrink text until the proof becomes hard to read
- keep stats and quotes visually prominent
- leave enough whitespace to make the story feel premium

### Content Rules

- write for skimmability and trust
- emphasize business outcomes, not empty adjectives
- keep jargon under control
- make the before and after state obvious
- keep CTA language direct and sales-appropriate

## Testimonial Rules

If a testimonial is provided:

- preserve the customer's meaning
- trim only for clarity and layout
- attribute it clearly when allowed
- make it visually distinct from body copy

If no testimonial is provided:

- do not fabricate one
- use a stronger results page or customer overview instead

## Anonymization Rules

If the customer must be anonymized:

- replace the name with a credible descriptor like `Fortune 500 Retailer` or `Series B Fintech Platform`
- remove logos and overly identifying context
- keep industry, scale, and use case if they help the story
- preserve the proof, even when the brand is hidden

An anonymized case study should still feel specific, not vague.

## Results Presentation

Results should usually carry the visual center of gravity.

Use:

- large stat blocks
- concise narrative explanation
- a chart only when it genuinely clarifies the improvement
- one to three metrics as the hero proof points

If a chart would materially improve the story, use `graphic-chart` for the supporting visual rather than faking one in prose.

## PDF Export

This skill should output a PDF after the HTML pages are complete.

Preferred method:

- generate a `print.html` with one page per printed sheet
- use a browser or Playwright print-to-PDF flow

Print requirements:

- one case-study page per PDF page
- no browser chrome
- zero accidental page breaks
- preserve background colors and images
- maintain the intended portrait or landscape sizing

If exporting via Playwright or Chromium, ensure print CSS forces clean page boundaries.

## Recommended Print CSS

Use print rules like:

- fixed page width and height
- `page-break-after: always` on each page wrapper
- final page wrapper `page-break-after: auto`
- `print-color-adjust: exact`

The goal is a merged PDF that looks like a designed sales asset, not a web article.

## Success Criteria

A strong output from this skill should feel:

- sales-ready without manual redesign
- specific and credible
- visually consistent across pages
- easy to skim in PDF form
- strong enough to send directly to prospects or publish on a site

## Dependencies

Required skill:

- `goose-graphics`

Recommended skills:

- `visual-brand-extractor`
- `goose-graphics-create-style`
- `graphic-chart`

## Example Request

```text
Create a 2-page case study for Acme Corp. They were spending 20 hours per week on manual reporting. We automated it. They saved 80% of that time and reduced errors by 95%. Use midnight-editorial style.
```

Expected result:

- a planned case study structure
- HTML pages in `case-study/[customer-name]-pages/`
- a matching print-ready PDF in `case-study/[customer-name].pdf`
