# Design Style: Paper & Ink

## 1. Visual Theme & Atmosphere

Paper & Ink is the design language of the printed word at its most refined -- the tradition of literary magazines, broadsheet newspapers, and beautifully typeset books brought into digital form. The off-white background (`#faf8f5`) is not simply white; it is the warm cream of quality uncoated stock, the kind of paper you encounter in a first-edition hardcover or the pages of The New York Times Magazine. Every design decision in this system traces back to the conventions of print typography: generous margins, careful leading, hairline rules as structural punctuation, and the quiet authority of well-set serif type.

The typographic pairing of Cormorant Garamond and Lora creates a system rooted entirely in serif tradition. Cormorant Garamond is the display face -- an elegant, high-contrast serif inspired by Claude Garamond's sixteenth-century designs but redrawn for digital with sharper detail and more dramatic proportions. At display sizes (40px+), its fine hairlines and generous swashes create headlines that feel genuinely literary, as if set in hot metal. Lora is the body companion -- a contemporary serif designed specifically for screen reading, with sturdy serifs and well-balanced proportions that remain legible at 16px on any device. The contrast between Cormorant's delicate display elegance and Lora's workmanlike reliability mirrors the structure of a well-designed book: the title page seduces, the body text serves.

Deep red (`#c41e3a`) is the sole accent colour -- the crimson of a dropped capital letter in an illuminated manuscript, of the masthead of a storied newspaper. Used for drop caps, pull quote marks, accent rules, and call-to-action elements, it provides the only chromatic punctuation in an otherwise monochrome palette. Warm gray (`#6b6560`) handles secondary text, captions, and metadata with the quiet dignity of printer's gray. The entire palette is deliberately restrained: black, cream, red, gray. This is a system that believes ornament is distraction and that the best design is invisible, letting the content command every ounce of attention.

Drop caps (CSS `::first-letter`), pull quotes with oversized quotation marks, and thin hairline rules (1px borders) are the decorative vocabulary -- borrowed directly from centuries of editorial print design.

**Key Characteristics:**
- Off-white/cream background (`#faf8f5`) -- the colour of quality uncoated paper, warm and easy on the eyes
- True black (`#000000`) for primary text -- no charcoal softening, this style has the confidence to use full black
- Cormorant Garamond for all display type (40px+) -- high-contrast, elegant serif with genuine literary presence
- Lora for all body text -- sturdy, screen-optimized serif that reads beautifully at text sizes
- Deep red (`#c41e3a`) as the singular accent colour for drop caps, rules, pull quotes, and CTAs
- Warm gray (`#6b6560`) for secondary text, captions, timestamps, and metadata
- Hairline rules (`1px solid`) as structural dividers -- the visual punctuation of editorial layout
- Drop caps using CSS `::first-letter` at 4-5x the body text size, coloured in deep red
- Pull quotes with large decorative quotation marks in deep red, set in Cormorant Garamond italic
- Generous margins and white space -- content breathes in the tradition of book design
- Serif throughout -- no sans-serif anywhere in the system

## 2. Color Palette & Roles

### Primary
- **Paper** (`#faf8f5`): Primary background. The warm cream of quality uncoated stock.
- **Ink** (`#000000`): Primary text colour. True black for maximum authority and readability.
- **Deep Red** (`#c41e3a`): Primary accent. Drop caps, pull quote marks, accent rules, CTAs, and focal points.

### Accent
- **Dark Red** (`#9e1830`): Hover/active state for deep red elements. Richer and more saturated.
- **Light Red** (`rgba(196,30,58,0.08)`): Background tint for highlighted blocks and featured callouts.
- **Red Rule** (`#c41e3a`): Solid red for horizontal accent rules and drop cap colour.

### Neutral Scale
- **True Black** (`#000000`): Headlines, primary body text, and high-emphasis elements.
- **Near Black** (`#1a1a18`): Secondary headlines and subheadings on lighter backgrounds.
- **Warm Gray** (`#6b6560`): Secondary text for captions, bylines, timestamps, and metadata.
- **Medium Gray** (`#9a9590`): Placeholder text, disabled elements, and de-emphasized content.
- **Light Gray** (`#c8c4c0`): Hairline rules, borders, and structural dividers.
- **Pale Gray** (`#e8e5e0`): Background for inset panels, blockquotes, and recessed areas.
- **Off-White** (`#f4f1ec`): Alternate surface for subtle section differentiation.

### Surface & Borders
- **Surface Primary** (`#faf8f5`): The default page background.
- **Surface Inset** (`#f4f1ec`): Recessed panels, sidebar backgrounds, and blockquote containers.
- **Surface Highlight** (`rgba(196,30,58,0.05)`): Very faint red wash for featured content areas.
- **Border Hairline** (`#c8c4c0`): Standard `1px solid` hairline rule for section dividers and table borders.
- **Border Strong** (`#000000`): Black `1px solid` for top-of-article rules and major structural borders.
- **Border Accent** (`#c41e3a`): Red `1px solid` or `2px solid` for accent rules and featured borders.
- **Border Faint** (`#e8e5e0`): Barely visible divider for dense list content.

### Shadow Colors
- **Shadow Soft** (`rgba(0,0,0,0.06)`): Minimal shadow for barely-there lift. Used sparingly.
- **Shadow Medium** (`rgba(0,0,0,0.10)`): Moderate shadow for modal or overlay contexts.
- **Shadow Deep** (`rgba(0,0,0,0.15)`): Maximum shadow depth -- still subtle, print design avoids heavy shadows.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
```

- **Display**: `'Cormorant Garamond', Garamond, 'Times New Roman', serif`
- **Body**: `'Lora', Georgia, 'Times New Roman', serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Cormorant Garamond | 72px | 700 | 1.05 | -1px | Cover headlines, major feature titles |
| Section Heading | Cormorant Garamond | 48px | 700 | 1.10 | -0.5px | Major section titles |
| Sub-heading | Cormorant Garamond | 32px | 600 | 1.20 | 0px | Subsection titles, card headings |
| Body Large | Lora | 20px | 400 | 1.70 | 0px | Lead paragraphs, article introductions |
| Body | Lora | 16px | 400 | 1.75 | 0.1px | Standard reading text |
| Small / Caption | Lora | 13px | 400 | 1.50 | 0.3px | Bylines, timestamps, metadata |
| Big Numbers | Cormorant Garamond | 72px | 700 | 1.00 | -1px | Statistics, key metrics |
| Pull Quote | Cormorant Garamond | 36px | 400 | 1.35 | 0px | Italic. Featured quotations with large marks |
| Drop Cap | Cormorant Garamond | 80px | 700 | 0.85 | 0px | CSS ::first-letter, deep red colour |
| Byline Label | Lora | 12px | 600 | 1.00 | 1.5px | Uppercase bylines ("BY SARAH CHEN") |
| CTA Text | Lora | 15px | 600 | 1.00 | 0.5px | Button text, calls to action |

### Principles
- **Serif throughout**: Cormorant Garamond for display, Lora for body. No sans-serif anywhere. This is an explicitly serif system.
- **Display vs. body contrast**: Cormorant Garamond's high-contrast, elegant forms handle display sizes (32px+). Lora's sturdier design handles body text (20px and below). Never swap them.
- **Generous line height**: 1.70-1.75 for body text creates a classical, book-like reading rhythm. The generous leading is not wasted space -- it is a core feature of the reading experience.
- **Drop caps**: Use CSS `::first-letter` on the first paragraph of major sections. Set in Cormorant Garamond at 700 weight, approximately 5x the body size, coloured in deep red (`#c41e3a`), floated left with right margin.
- **Uppercase sparingly**: Reserved for bylines and small structural labels only. Headlines are always mixed case in the tradition of book titling.
- **Italic for quotation**: Pull quotes use Cormorant Garamond italic at 36px. The italic forms of Cormorant are genuinely calligraphic and beautiful at display sizes.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: #faf8f5; padding: 80px 60px; text-align: center;">
  <div style="width: 100%; height: 1px; background: #000000; margin: 0 0 32px;"></div>
  <p style="font-family: 'Lora', Georgia, serif; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #6b6560; margin: 0 0 20px;">The Gooseworks Report</p>
  <h1 style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 72px; font-weight: 700; line-height: 1.05; letter-spacing: -1px; color: #000000; margin: 0 0 20px;">The Future of<br>Autonomous Work</h1>
  <div style="width: 40px; height: 2px; background: #c41e3a; margin: 0 auto 20px;"></div>
  <p style="font-family: 'Lora', Georgia, serif; font-size: 20px; font-weight: 400; line-height: 1.70; color: #6b6560; max-width: 540px; margin: 0 auto;">How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.</p>
  <div style="width: 100%; height: 1px; background: #000000; margin: 40px 0 0;"></div>
</div>
```

### Feature Block with Drop Cap

```html
<div style="background-color: #faf8f5; padding: 48px 60px; max-width: 720px;">
  <h2 style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 32px; font-weight: 600; line-height: 1.20; color: #000000; margin: 0 0 24px;">Persistent Memory Across Sessions</h2>
  <p style="font-family: 'Lora', Georgia, serif; font-size: 16px; font-weight: 400; line-height: 1.75; letter-spacing: 0.1px; color: #000000; margin: 0;">
    <span style="float: left; font-family: 'Cormorant Garamond', Garamond, serif; font-size: 80px; font-weight: 700; line-height: 0.85; color: #c41e3a; margin: 0 12px 0 0; padding-top: 4px;">E</span>very agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost between conversations, enabling a continuity of work that transforms how teams interact with their AI coworkers.</p>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 48px 32px; background: #faf8f5; border-top: 1px solid #c8c4c0; border-bottom: 1px solid #c8c4c0;">
  <p style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 72px; font-weight: 700; line-height: 1.00; letter-spacing: -1px; color: #c41e3a; margin: 0 0 8px;">47%</p>
  <p style="font-family: 'Lora', Georgia, serif; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #000000; margin: 0 0 16px;">Faster Response</p>
  <p style="font-family: 'Lora', Georgia, serif; font-size: 16px; font-weight: 400; line-height: 1.75; color: #6b6560; max-width: 320px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-top: 1px solid #000000; border-bottom: 1px solid #000000;">
  <div style="padding: 40px 32px; border-right: 1px solid #c8c4c0;">
    <p style="font-family: 'Lora', Georgia, serif; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #6b6560; margin: 0 0 16px;">Without Goose</p>
    <h3 style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 32px; font-weight: 600; line-height: 1.20; color: #000000; margin: 0 0 16px;">Manual & Fragmented</h3>
    <p style="font-family: 'Lora', Georgia, serif; font-size: 16px; font-weight: 400; line-height: 1.75; color: #6b6560; margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
  </div>
  <div style="padding: 40px 32px; border-left: 2px solid #c41e3a;">
    <p style="font-family: 'Lora', Georgia, serif; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #c41e3a; margin: 0 0 16px;">With Goose</p>
    <h3 style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 32px; font-weight: 600; line-height: 1.20; color: #000000; margin: 0 0 16px;">Orchestrated & Autonomous</h3>
    <p style="font-family: 'Lora', Georgia, serif; font-size: 16px; font-weight: 400; line-height: 1.75; color: #6b6560; margin: 0;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid #e8e5e0;">
  <span style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 24px; font-weight: 700; color: #c41e3a; min-width: 28px; line-height: 1.20;">&#8226;</span>
  <div>
    <h4 style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 24px; font-weight: 600; line-height: 1.25; color: #000000; margin: 0 0 8px;">Multi-Channel Access</h4>
    <p style="font-family: 'Lora', Georgia, serif; font-size: 16px; font-weight: 400; line-height: 1.75; color: #6b6560; margin: 0;">Reach your AI coworkers through Slack, Telegram, WhatsApp, or the web -- wherever your team already works.</p>
  </div>
</div>
```

### Pull Quote Block

```html
<div style="padding: 48px 60px; border-top: 1px solid #c8c4c0; border-bottom: 1px solid #c8c4c0; text-align: center; background: #faf8f5;">
  <span style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 80px; font-weight: 700; line-height: 0.5; color: #c41e3a; display: block; margin-bottom: 8px;">&#8220;</span>
  <p style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 36px; font-weight: 400; font-style: italic; line-height: 1.35; color: #000000; max-width: 640px; margin: 0 auto 24px;">It felt less like configuring software and more like onboarding a new team member.</p>
  <div style="width: 40px; height: 1px; background: #c41e3a; margin: 0 auto 16px;"></div>
  <p style="font-family: 'Lora', Georgia, serif; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #6b6560; margin: 0;">Sarah Chen, VP Operations</p>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: #faf8f5; border-top: 2px solid #000000; border-bottom: 2px solid #000000;">
  <h2 style="font-family: 'Cormorant Garamond', Garamond, serif; font-size: 48px; font-weight: 700; line-height: 1.10; letter-spacing: -0.5px; color: #000000; margin: 0 0 16px;">Ready to meet your team?</h2>
  <p style="font-family: 'Lora', Georgia, serif; font-size: 18px; font-weight: 400; line-height: 1.70; color: #6b6560; max-width: 480px; margin: 0 auto 32px;">Deploy your first AI coworker in under five minutes. No setup fees, no long-term commitments.</p>
  <a style="display: inline-block; background: #c41e3a; color: #faf8f5; font-family: 'Lora', Georgia, serif; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; text-decoration: none; padding: 14px 36px; border-radius: 0px;">Get Started</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between inline elements and tight label pairs.
- **8px**: Tight gap -- between stat number and label, between rule and adjacent text.
- **12px**: Small gap -- between icon and text in list items.
- **16px**: Base gap -- between body paragraphs, standard text spacing.
- **20px**: Medium-small gap -- between heading and subtitle in title blocks.
- **24px**: Medium gap -- between components within a section, list item padding.
- **32px**: Section internal -- padding inside content blocks, gap between grid columns.
- **40px**: Large internal -- padding in title blocks between rules and content.
- **48px**: Section divider -- vertical space between major content sections.
- **60px**: Large section padding -- hero, CTA, and pull quote vertical padding.
- **80px**: Maximum section padding -- cover pages and high-impact title sections.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 720px (narrow column) |
| Slides (1920x1080) | 80px all sides | 1200px (narrow for readability) |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 720px (narrow column) |

### Alignment & Grid
- **Primary alignment**: Left-aligned for body text, always. Center-aligned for title blocks, stats, pull quotes, and CTA sections.
- **Narrow column**: Body text should not exceed 720px wide (approximately 65-75 characters per line), following classical typographic measure.
- **Hairline rules**: `1px solid #c8c4c0` as section dividers between major content blocks. `1px solid #000000` for strong structural borders (top of page, top of article).
- **Red accent rules**: `2px solid #c41e3a` used sparingly as decorative punctuation -- below title block headings, on preferred side of comparison grids.
- **Vertical rhythm**: Consistent 48px gaps between major sections. Hairline rules sit between sections, serving as visual punctuation.
- **Margins over padding**: Prefer generous margins around content rather than padded containers. Content should sit on the paper, not inside boxes.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#faf8f5` | Page canvas -- the default and dominant state |
| Subtle (Level 1) | `rgba(0,0,0,0.04) 0px 1px 4px` | Barely perceptible lift for interactive elements on hover |
| Card (Level 2) | `rgba(0,0,0,0.06) 0px 2px 8px` | Rare -- only for modal contexts or overlay panels |
| Overlay (Level 3) | `rgba(0,0,0,0.10) 0px 4px 16px` | Modals and floating panels. Maximum shadow depth in this system. |

### Border Treatments
- **Hairline rule**: `1px solid #c8c4c0` -- the primary structural element. Used between sections, above and below pull quotes, and as table borders.
- **Strong rule**: `1px solid #000000` or `2px solid #000000` -- used at the top of the page and for major structural breaks.
- **Accent rule**: `2px solid #c41e3a` -- deep red accent line. Used below title headings, on featured borders, and as small horizontal marks (40px wide, centered).
- **Faint divider**: `1px solid #e8e5e0` -- barely visible line for list items and dense content separation.
- **No border-radius**: This style uses 0px border-radius on everything. Sharp, square corners are fundamental to the print/editorial aesthetic.

### Surface Hierarchy
Print-inspired design is almost entirely flat. Depth is communicated through rules and whitespace, not shadows:
1. **Paper** (`#faf8f5`) -- the primary surface. Nearly everything sits on this layer.
2. **Off-White** (`#f4f1ec`) -- a slightly darker cream for inset panels, blockquote backgrounds, and sidebar areas.
3. **Pale Gray** (`#e8e5e0`) -- the darkest background surface, used for recessed input fields or de-emphasized zones.
4. **Highlight** (`rgba(196,30,58,0.05)`) -- the faintest red wash for featured content callouts.

Shadows are almost never used. The structural vocabulary is hairline rules, whitespace, and typographic scale -- the same tools that print designers have relied on for centuries.

## 7. Do's and Don'ts

### Do
- Use Cormorant Garamond for all display headings (32px+) and pull quotes -- its elegant, high-contrast forms are the visual signature.
- Use Lora for all body text (20px and below) -- designed for screen readability with sturdy serifs.
- Apply drop caps (CSS `::first-letter`) to opening paragraphs of major sections, set in Cormorant Garamond 700, deep red.
- Use hairline rules (`1px solid #c8c4c0`) between every major section -- they are the structural glue of this style.
- Use deep red (`#c41e3a`) sparingly but consistently: drop caps, pull quote marks, accent rules, CTAs.
- Keep body text columns narrow (max 720px) -- classical typographic measure for comfortable reading.
- Use generous line height (1.70-1.75) for body text -- the spacious leading of well-set book type.
- Center pull quotes with oversized quotation marks in deep red for editorial drama.
- Use 0px border-radius on all elements -- sharp corners are non-negotiable.
- Frame content with strong rules at page/section boundaries (top and bottom).

### Don't
- Don't use sans-serif fonts anywhere -- Cormorant Garamond and Lora are the entire typographic system. No exceptions.
- Don't use rounded corners on any element -- this is a print-inspired style. Corners are always square.
- Don't use shadows for standard content -- depth comes from rules and whitespace, not box-shadows.
- Don't use Cormorant Garamond below 24px -- its fine hairlines become indistinct at small sizes. Switch to Lora.
- Don't use more than one accent colour -- deep red is the only chromatic element. No blues, greens, or purples.
- Don't use bold body text (Lora 700) for emphasis in paragraphs -- use italic (Lora 400 italic) instead, in the tradition of book typography.
- Don't use coloured backgrounds or gradient backgrounds -- the paper colour (`#faf8f5`) is the only surface. Content sits on paper, period.
- Don't crowd content into cards or containers -- this style uses open layouts with rules as separators, not boxed components.
- Don't use decorative icons or emoji -- if visual markers are needed, use typographic ornaments (bullet, em dash, pilcrow) in deep red.
- Don't set body text wider than 720px -- long lines are the cardinal sin of typography.

## 8. Responsive Behavior

This is a fixed-dimension graphics system — it responds across **format dimensions**, not device breakpoints. The same visual language adapts from a 1080x1080 square to a 1920x1080 widescreen to a 1080x1920 vertical story by scaling type, padding, and composition to fit the frame. The detailed per-format adaptations live in §9 Format Adaptation Notes; this section captures the principles that govern all of them.

- **Type ramps with frame size.** Headlines scale up on Slides (1920x1080) and Story (1080x1920), scale down on Carousel (1080x1080). Body copy holds a readable floor (~16-22px) across every format; never drop below 14px or the render stops being legible at native social resolution.
- **Padding scales with the narrow edge.** Use ~60px padding on 1080-wide frames, ~80px on 1920-wide frames. Story (1080x1920) adds extra top/bottom padding (~120px) to reserve safe zones for platform UI chrome.
- **Safe zones are non-negotiable on Story.** Reserve the top 160px (profile/progress bar) and bottom 160px (reply input) — no load-bearing text or focal elements there.
- **One idea per frame.** Content density does not grow with frame size. Bigger frames earn more breathing room, not more content. A Slides deck shows the same one idea per slide as the Carousel, just larger.
- **Signature components stay constant.** The style's signature move (accent colour, hero component, tag/badge treatment) keeps the same visual weight across formats — the composition around it adapts, the move itself does not.
- **Aspect-ratio aware composition.** Square frames → centred or two-column grid. Vertical → single centred column with vertical rhythm. Widescreen → left-heavy 60/40 split (content left, breathing room or supporting visuals right). Portrait poster → three vertical zones (headline / content / CTA).
- **Raster export.** Everything is rendered to PNG at the target pixel dimensions via Playwright — no CSS media queries, no fluid layouts. Each format is its own fixed canvas.

## 9. Format Adaptation Notes

### Carousel (1080x1080px)
- **Typography scale down**: Display Hero becomes 56px (from 72px). Section Heading becomes 40px. Sub-heading stays 32px. Body stays 16px.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Title centered vertically. Strong black rule at top and bottom. Publication-style label in uppercase above headline. Red accent rule (40px) below headline. Subtitle in warm gray.
- **Content slides**: Left-aligned text. Drop cap on opening paragraph. One concept per slide with a hairline rule at the top.
- **Stat slides**: Single stat centered. Big number in deep red (Cormorant Garamond 72px). Label in uppercase Lora. Hairline rules above and below.
- **Swipe indicator**: Small black dots at bottom center, 6px diameter, 12px gap. Simple and unadorned.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 72px for the title section.
- **Padding**: 60px left/right. 80px top/bottom. Content column capped at 720px, centered.
- **Section spacing**: 48px vertical gap between major sections. Hairline rules between every section.
- **Vertical rhythm**: Title block with strong rules top and bottom. Body sections with drop caps. Pull quotes centered with oversized red quotation marks. Stat sections framed by hairline rules. CTA at bottom with strong black borders.
- **Footer**: Warm gray text, 12px Lora, centered. Simple horizontal rule above.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 80px. Section Heading becomes 56px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Content max-width capped at 1200px, centered for readability.
- **Layout**: Center-biased composition. Content occupies the central column with generous margins on both sides -- like an open book spread.
- **Title slides**: Headline centered. Strong black rule at top of frame, red accent rule below headline. Subtitle in warm gray.
- **Content slides**: 2-column for comparisons (divided by a hairline rule, not a gap). Single narrow column for narrative.
- **Stat slides**: Up to 3 stats in a row, separated by vertical hairline rules. Each stat: big number in red, label in uppercase black.

### Poster (1080x1350px)
- **Typography**: Display Hero at 64px. Section Heading at 40px. Body at 16px.
- **Padding**: 60px left/right, 80px top/bottom. Content column capped at 720px.
- **Composition**: Top quarter for title block with strong rules. Middle half for body content with drop cap, pull quote, or stat. Bottom quarter for CTA with strong rules.
- **Vertical flow**: Strong rules delineate the three zones. The middle section can hold a centred pull quote with large red quotation marks for visual impact.
- **CTA placement**: Centered in the bottom zone. Button in deep red with square corners. Framed by strong black rules above and below.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 72px in Cormorant Garamond with its signature high-contrast strokes (approximately 30% larger than Carousel 56px). Section Heading becomes 52px. Body Large becomes 22px in Lora -- still screen-optimized serif, never sans-serif. Drop caps scale to roughly 120-140px in deep red.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760. Inside the safe zone, content column capped at 820px for comfortable measure.
- **Layout**: Single centered column with book-margin whitespace. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Warm cream background (`#faf8f5`) runs edge-to-edge like the page of a first-edition hardcover.
- **Cover slide**: 1px full-width hairline black rule at the top of the content zone. Cormorant Garamond headline at 72px in ink-black, centered, 2-3 lines deep with generous leading. Below it, a Lora italic subtitle at 22px in warm gray. A second hairline rule closes the composition. Everything is quiet authority -- the typography is the decoration.
- **Content slides**: One idea per slide. Lead each slide with a deep red (`#c41e3a`) drop cap at 120-140px set in Cormorant Garamond, the opening paragraph flowing in Lora at 22px alongside it. Alternatively, a pull quote in Cormorant Garamond italic at 56px with oversized deep red quotation marks floating above and below. Thin 1px hairline rules separate sections.
- **CTA slide**: Thin black hairline rules frame top and bottom of the content zone. Cormorant Garamond headline at 56px centered, Lora italic subtitle at 20px. Deep red button with square corners (no border-radius -- the printed-press mindset forbids it) and Cormorant Garamond CTA text in cream.
- **Progress indicator**: 1px hairline segmented rules at the top of the safe zone -- inactive at `#6b6560` (warm gray), active in deep red (`#c41e3a`). Feels like the folio marks along the top of a well-set book page.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Paper | `#faf8f5` | Primary background |
| Ink | `#000000` | Primary text |
| Deep Red | `#c41e3a` | Accent: drop caps, rules, pull quotes, CTAs |
| Dark Red | `#9e1830` | Hover/active state for red elements |
| Near Black | `#1a1a18` | Secondary headlines |
| Warm Gray | `#6b6560` | Secondary text, captions, metadata |
| Medium Gray | `#9a9590` | Placeholder, disabled text |
| Light Gray | `#c8c4c0` | Hairline rules, standard borders |
| Pale Gray | `#e8e5e0` | Faint dividers, inset backgrounds |
| Off-White | `#f4f1ec` | Alternate surface, recessed panels |

### Font Declarations

```css
font-family: 'Cormorant Garamond', Garamond, 'Times New Roman', serif;
font-family: 'Lora', Georgia, 'Times New Roman', serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
```

### Drop Cap CSS

```css
.drop-cap::first-letter {
  font-family: 'Cormorant Garamond', Garamond, serif;
  font-size: 5em;
  font-weight: 700;
  color: #c41e3a;
  float: left;
  line-height: 0.85;
  margin: 0 12px 0 0;
  padding-top: 4px;
}
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-paper: #faf8f5;
  --color-ink: #000000;
  --color-deep-red: #c41e3a;

  /* Colors -- Accent */
  --color-dark-red: #9e1830;
  --color-light-red: rgba(196, 30, 58, 0.08);
  --color-red-rule: #c41e3a;

  /* Colors -- Neutral Scale */
  --color-near-black: #1a1a18;
  --color-warm-gray: #6b6560;
  --color-medium-gray: #9a9590;
  --color-light-gray: #c8c4c0;
  --color-pale-gray: #e8e5e0;
  --color-off-white: #f4f1ec;

  /* Colors -- Surfaces */
  --color-surface-primary: #faf8f5;
  --color-surface-inset: #f4f1ec;
  --color-surface-highlight: rgba(196, 30, 58, 0.05);

  /* Colors -- Borders */
  --color-border-hairline: #c8c4c0;
  --color-border-strong: #000000;
  --color-border-accent: #c41e3a;
  --color-border-faint: #e8e5e0;

  /* Colors -- Shadows */
  --shadow-soft: rgba(0, 0, 0, 0.06);
  --shadow-medium: rgba(0, 0, 0, 0.10);
  --shadow-deep: rgba(0, 0, 0, 0.15);

  /* Typography -- Families */
  --font-display: 'Cormorant Garamond', Garamond, 'Times New Roman', serif;
  --font-body: 'Lora', Georgia, 'Times New Roman', serif;

  /* Typography -- Sizes */
  --text-display-hero: 72px;
  --text-section-heading: 48px;
  --text-sub-heading: 32px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number: 72px;
  --text-pull-quote: 36px;
  --text-drop-cap: 80px;
  --text-byline: 12px;
  --text-cta: 15px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-heading: 600;
  --weight-body: 400;
  --weight-body-medium: 500;
  --weight-label: 600;

  /* Typography -- Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.10;
  --leading-sub-heading: 1.20;
  --leading-body-large: 1.70;
  --leading-body: 1.75;
  --leading-small: 1.50;
  --leading-number: 1.00;
  --leading-pull-quote: 1.35;
  --leading-drop-cap: 0.85;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium-small: 20px;
  --space-medium: 24px;
  --space-large: 32px;
  --space-xl: 40px;
  --space-section: 48px;
  --space-hero: 60px;
  --space-max: 80px;

  /* Borders */
  --radius-standard: 0px;

  /* Layout */
  --measure-body: 720px;
  --measure-wide: 960px;
  --measure-slide: 1200px;

  /* Shadows -- Composed */
  --shadow-card: rgba(0,0,0,0.06) 0px 2px 8px;
  --shadow-overlay: rgba(0,0,0,0.10) 0px 4px 16px;
}
```

### System Font Fallbacks
- **Display serif (if Cormorant Garamond fails to load):** `Garamond, 'Times New Roman', serif`
- **Body serif (if Lora fails to load):** `Georgia, 'Times New Roman', serif`
