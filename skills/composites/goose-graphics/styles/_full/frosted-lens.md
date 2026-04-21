# Design Style: Frosted Lens

## 1. Visual Theme & Atmosphere

Frosted Lens is the design language of controlled contrast -- a vibrant, kinetic energy field glimpsed through a pristine white window. The defining tension is between chaos and clarity: a background of blurred, streaked color (hot pinks, electric teals, deep blues, and warm ambers in motion-blur trails) and a large, softly rounded white card (`#ffffff` with 20-24px radius) that floats above it like a frosted glass panel. Inside the card, everything is calm, data-forward, and deliberately minimal. Outside, everything is alive and chromatic. This is the aesthetic of a tech startup's Series B announcement, of a Stripe product page meets a Figma conference slide -- polished data visualization dressed in startup energy.

The typography is clean, contemporary sans-serif -- the kind of type you see on Y Combinator demo day decks and modern SaaS dashboards. Headings in DM Sans at semibold weight feel confident without being aggressive. Body text at regular weight is open and readable. A spaced-uppercase brand label ("INFRENCECORE") anchors the top of the card with quiet authority. The color story inside the card is deliberately restrained: a fresh sage-mint green (`#7CB68E`) for primary data bars, a muted dusty rose (`#D4A0A0`) for secondary data, and near-black text. The green bars are the heroes -- growing left to right like a growth chart, each topped with a clean data label in dark text. Below the chart, a bold statement headline in near-black seals the narrative.

The magic of this style is the layering. The blurred chromatic background creates depth and energy without competing with the content. The white card acts as a lens or viewport -- a controlled space where information is presented with Swiss-level precision. The rounded corners (20-24px) soften the card enough to feel modern and approachable without becoming bubbly. Shadows are medium-depth and slightly warm-tinted, reinforcing the sense that the card floats above a luminous surface. This is the visual language of a company that wants to say: "We move fast, but our data is clean."

**Key Characteristics:**
- Vibrant blurred/abstract background with motion-blur color streaks (pinks `#E8457A`, teals `#3CBCB4`, blues `#2E5C9A`, ambers `#D4943C`)
- Large white card overlay (`#ffffff`) with generous border-radius (20-24px) as the primary content surface
- Sage-mint green (`#7CB68E`) as the primary accent for data visualization and positive metrics
- Dusty rose (`#D4A0A0`) as a soft secondary accent for supporting data elements
- Near-black (`#1A1A1A`) for all primary text -- warm enough to avoid harshness
- Clean sans-serif typography (DM Sans) with spaced uppercase for brand labels and category tags
- Medium card shadow (`0 8px 32px rgba(0,0,0,0.12)`) for floating-card depth
- Generous internal card padding (40-48px) with content centered or left-aligned within the card
- Data-forward layout: bar charts, big numbers, and growth metrics are the focal content
- Strong contrast between energetic exterior and calm, minimal interior -- the "frosted lens" effect
- Border-radius of 20-24px on the main card surface, 8-12px on internal elements like chart bars
- Statement headlines below data visualizations that editorialize the numbers

## 2. Color Palette & Roles

### Primary
- **White** (`#ffffff`): Primary card surface. The frosted lens through which all content is viewed. Pure white for maximum contrast against the chromatic background.
- **Near-Black** (`#1A1A1A`): Primary text colour. Warm black for headlines, data labels, and body copy inside the card.
- **Sage Mint** (`#7CB68E`): Primary accent. Used for main data bars, positive metrics, growth indicators, and key callouts. Fresh, optimistic, and distinctly startup.

### Accent
- **Dusty Rose** (`#D4A0A0`): Secondary data accent. Used for secondary bars, comparison data, and softer supporting elements. Muted and non-competing.
- **Dark Sage** (`#5A9A6E`): Hover and active state for sage mint elements. Deeper, more saturated.
- **Warm Gray** (`#6B7280`): Secondary text colour for descriptions, axis labels, captions, and supporting copy.

### Neutral Scale
- **Snow** (`#F5F5F5`): Elevated surface inside cards -- nested containers, chart backgrounds, and inset panels.
- **Light Border** (`#E8E8E8`): Subtle borders for internal card elements, axis lines, and structural dividers.
- **Mid Gray** (`#D1D5DB`): Disabled states, placeholder text, and inactive chart elements.
- **Cool Gray** (`#9CA3AF`): Tertiary text for timestamps, footnotes, and low-priority metadata.
- **Slate** (`#4B5563`): Secondary headings and medium-emphasis labels within the card.
- **Charcoal** (`#374151`): High-emphasis body text, slightly lighter than primary for visual layering.

### Surface & Borders
- **Surface Primary** (`#ffffff`): The main card surface.
- **Surface Inset** (`#F8F8F8`): Recessed areas within cards -- chart plot areas, code blocks, nested panels.
- **Border Default** (`rgba(0,0,0,0.06)`): Subtle internal card borders for structural separation.
- **Border Accent** (`rgba(124,182,142,0.35)`): Sage-tinted border for active or featured data elements.
- **Border Strong** (`rgba(0,0,0,0.12)`): Higher-contrast border for prominent internal containers.
- **Divider Rule** (`#7CB68E`): Solid sage for accent rules and active indicators.

### Shadow Colors
- **Shadow Subtle** (`rgba(0,0,0,0.06)`): Light ambient shadow for internal card elements.
- **Shadow Medium** (`rgba(0,0,0,0.12)`): Standard card elevation shadow -- the primary floating-card shadow.
- **Shadow Deep** (`rgba(0,0,0,0.18)`): High-elevation elements like overlays and featured panels.
- **Shadow Warm** (`rgba(30,20,15,0.08)`): Warm-tinted ambient shadow that complements the chromatic background.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | DM Sans | 64px | 700 | 1.08 | -1.5px | Hero headlines, bold growth statements |
| Section Heading | DM Sans | 42px | 700 | 1.12 | -1px | Major section titles inside cards |
| Sub-heading | DM Sans | 28px | 600 | 1.20 | -0.5px | Subsection titles, card sub-headers |
| Body Large | DM Sans | 20px | 400 | 1.60 | 0px | Lead paragraphs, statement text below charts |
| Body | DM Sans | 16px | 400 | 1.60 | 0px | Standard reading text |
| Small / Caption | DM Sans | 13px | 400 | 1.45 | 0.15px | Axis labels, footnotes, metadata |
| Big Numbers | DM Sans | 56px | 700 | 1.00 | -1px | Data labels on charts, hero statistics |
| Brand Label | DM Sans | 12px | 500 | 1.00 | 2.5px | Uppercase spaced brand name, category tags |
| Data Label | DM Sans | 18px | 600 | 1.00 | -0.25px | Chart data values (200k, 400k, 1.1m) |
| CTA Text | DM Sans | 15px | 600 | 1.00 | 0.3px | Button and call-to-action text |

### Principles
- **Single family, flexible hierarchy**: DM Sans handles everything from brand labels to hero numbers. Its geometric-yet-friendly character matches the startup-meets-precision mood. Hierarchy is built through size, weight, and tracking.
- **Tight tracking at display sizes**: -1.5px at 64px, -1px at 42px, -0.5px at 28px. Headlines should feel modern and confident, not loose or casual.
- **Wide tracking for brand labels**: Uppercase text at 12-13px uses 2-3px letter-spacing. This creates the spaced, authoritative look seen in the "INFRENCECORE" label.
- **Regular weight for body text**: Weight 400 for body copy keeps the interior of the card feeling light and clean. The contrast with bold 700 headlines creates clear hierarchy.
- **Generous line height**: 1.60 for body text ensures readability inside the white card where dense text would feel cramped against the open, airy aesthetic.
- **Data labels are semibold**: Chart annotations and data values use weight 600 at 18px -- prominent enough to read at a glance, but not competing with the headline.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="position: relative; width: 100%; min-height: 600px; background: linear-gradient(135deg, #E8457A 0%, #3CBCB4 35%, #2E5C9A 65%, #D4943C 100%); filter: blur(0px); display: flex; align-items: center; justify-content: center; padding: 60px;">
  <div style="background: var(--color-white); border-radius: 24px; padding: 56px 48px; box-shadow: var(--shadow-card); max-width: 640px; width: 100%;">
    <p style="font-family: var(--font-display); font-size: 12px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-warm-gray); margin: 0 0 32px;">COMPANY NAME</p>
    <h1 style="font-family: var(--font-display); font-size: 64px; font-weight: 700; line-height: 1.08; letter-spacing: -1.5px; color: var(--color-near-black); margin: 0 0 20px;">Growth That<br>Speaks for Itself</h1>
    <p style="font-family: var(--font-body); font-size: 20px; font-weight: 400; line-height: 1.60; color: var(--color-warm-gray); margin: 0;">The fastest growing AI infrastructure company in the industry.</p>
  </div>
</div>
```

### Numbered Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 28px 0; border-bottom: 1px solid rgba(0,0,0,0.06);">
  <span style="font-family: var(--font-display); font-size: 42px; font-weight: 700; line-height: 1.00; letter-spacing: -1px; color: var(--color-sage-mint); min-width: 64px;">01</span>
  <div>
    <p style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-cool-gray); margin: 0 0 8px;">INFRASTRUCTURE</p>
    <h3 style="font-family: var(--font-display); font-size: 28px; font-weight: 600; line-height: 1.20; letter-spacing: -0.5px; color: var(--color-near-black); margin: 0 0 10px;">Scalable from day one</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-warm-gray); margin: 0;">Built to handle millions of inference requests from the start, with auto-scaling that keeps latency under 50ms at any volume.</p>
  </div>
</div>
```

### Stat Display (Bar Chart Growth)

```html
<div style="background: var(--color-white); border-radius: 24px; padding: 48px 40px; box-shadow: var(--shadow-card);">
  <p style="font-family: var(--font-display); font-size: 12px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-warm-gray); margin: 0 0 32px;">ANNUAL REVENUE</p>
  <div style="display: flex; align-items: flex-end; gap: 16px; height: 240px; margin-bottom: 32px;">
    <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
      <span style="font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--color-near-black); margin-bottom: 8px;">200k</span>
      <div style="width: 100%; height: 80px; background: var(--color-dusty-rose); border-radius: 8px 8px 0 0;"></div>
      <span style="font-family: var(--font-body); font-size: 13px; font-weight: 400; color: var(--color-cool-gray); margin-top: 8px;">2024</span>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
      <span style="font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--color-near-black); margin-bottom: 8px;">400k</span>
      <div style="width: 100%; height: 140px; background: linear-gradient(180deg, var(--color-sage-mint), var(--color-dusty-rose)); border-radius: 8px 8px 0 0;"></div>
      <span style="font-family: var(--font-body); font-size: 13px; font-weight: 400; color: var(--color-cool-gray); margin-top: 8px;">2025</span>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
      <span style="font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--color-near-black); margin-bottom: 8px;">1.1m</span>
      <div style="width: 100%; height: 220px; background: var(--color-sage-mint); border-radius: 8px 8px 0 0;"></div>
      <span style="font-family: var(--font-body); font-size: 13px; font-weight: 400; color: var(--color-cool-gray); margin-top: 8px;">2026</span>
    </div>
  </div>
  <h2 style="font-family: var(--font-display); font-size: 28px; font-weight: 700; line-height: 1.20; letter-spacing: -0.5px; color: var(--color-near-black); margin: 0;">The fastest growing AI Infrastructure company in the industry.</h2>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
  <div style="background: var(--color-white); border-radius: 20px; padding: 36px 32px; box-shadow: var(--shadow-subtle);">
    <p style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-dusty-rose); margin: 0 0 16px;">BEFORE</p>
    <h3 style="font-family: var(--font-display); font-size: 28px; font-weight: 600; line-height: 1.20; letter-spacing: -0.5px; color: var(--color-near-black); margin: 0 0 12px;">Slow & Fragmented</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-warm-gray); margin: 0;">Teams manually routing requests, waiting minutes for cold starts, and piecing together multiple providers.</p>
  </div>
  <div style="background: var(--color-white); border-radius: 20px; padding: 36px 32px; box-shadow: var(--shadow-subtle); border-left: 3px solid var(--color-sage-mint);">
    <p style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-sage-mint); margin: 0 0 16px;">AFTER</p>
    <h3 style="font-family: var(--font-display); font-size: 28px; font-weight: 600; line-height: 1.20; letter-spacing: -0.5px; color: var(--color-near-black); margin: 0 0 12px;">Fast & Unified</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-warm-gray); margin: 0;">One API, sub-50ms latency, auto-scaling inference that handles spikes without breaking a sweat.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 16px; align-items: flex-start; padding: 20px 0; border-bottom: 1px solid rgba(0,0,0,0.06);">
  <div style="width: 36px; height: 36px; min-width: 36px; display: flex; align-items: center; justify-content: center; background: rgba(124,182,142,0.12); border-radius: 10px; color: var(--color-sage-mint); font-size: 14px;">&#9650;</div>
  <div>
    <h4 style="font-family: var(--font-display); font-size: 20px; font-weight: 600; line-height: 1.25; color: var(--color-near-black); margin: 0 0 6px;">Auto-Scaling Inference</h4>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-warm-gray); margin: 0;">Handles traffic spikes automatically. Zero cold starts, zero manual intervention, zero downtime.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="background: var(--color-white); border-radius: 20px; padding: 40px 36px; box-shadow: var(--shadow-subtle); border-left: 3px solid var(--color-sage-mint);">
  <p style="font-family: var(--font-display); font-size: 28px; font-weight: 400; line-height: 1.35; letter-spacing: -0.5px; color: var(--color-near-black); margin: 0 0 24px;">"We migrated our entire inference stack in a weekend. Latency dropped 60% and we haven't touched it since."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 28px; height: 3px; background: var(--color-sage-mint); border-radius: 2px;"></div>
    <p style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-cool-gray); margin: 0;">ALEX CHEN, CTO AT SCALEAI</p>
  </div>
</div>
```

### CTA Block

```html
<div style="background: var(--color-white); border-radius: 24px; padding: 52px 40px; box-shadow: var(--shadow-card); text-align: center;">
  <h2 style="font-family: var(--font-display); font-size: 36px; font-weight: 700; line-height: 1.12; letter-spacing: -1px; color: var(--color-near-black); margin: 0 0 14px;">Ready to scale?</h2>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.60; color: var(--color-warm-gray); max-width: 440px; margin: 0 auto 28px;">Deploy your first model in under five minutes. No infrastructure headaches, no long-term contracts.</p>
  <a style="display: inline-block; background: var(--color-sage-mint); color: var(--color-white); font-family: var(--font-body); font-size: 15px; font-weight: 600; letter-spacing: 0.3px; text-decoration: none; padding: 14px 36px; border-radius: 12px;">Get Started</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between icon and inline label, between data label and bar top.
- **8px**: Tight gap -- between chart bar and axis label, between sub-label and heading.
- **12px**: Small gap -- between heading and body text within a component.
- **16px**: Base gap -- between chart bars, between body paragraphs.
- **20px**: Medium-small gap -- between grid items, between list items in compact mode.
- **24px**: Medium gap -- between components within a card, standard list item padding.
- **32px**: Section internal -- between brand label and chart, between chart and headline.
- **40px**: Card internal padding -- left/right padding inside the primary card surface.
- **48px**: Large card padding -- top/bottom padding inside the primary card surface.
- **60px**: Background padding -- space between the card edge and the chromatic background edge.
- **80px**: Maximum section padding -- cover layouts and high-impact hero areas.

### Format Padding
| Format | Background Padding | Card Padding | Card Border Radius | Content Max-Width |
|--------|--------------------|--------------|-------------------|-------------------|
| Carousel (1080x1080) | 48px all sides | 40px all sides | 24px | 984px |
| Infographic (1080xN) | 48px left/right, 60px top/bottom | 40px left/right, 48px top/bottom | 24px | 984px |
| Slides (1920x1080) | 60px all sides | 48px all sides | 24px | 1800px |
| Poster (1080x1350) | 48px left/right, 60px top/bottom | 40px left/right, 48px top/bottom | 24px | 984px |

### Alignment & Grid
- **Primary alignment**: Left-aligned text for body content inside cards. Center-aligned for hero titles, single stats, and CTA blocks.
- **Card-centric layout**: The white card is always the dominant structural element. Content lives inside cards, never directly on the chromatic background.
- **Grid**: Single-column for narrative and chart content inside cards. 2-column grid for comparison layouts, with each column in its own rounded card. 3-column for stat grids on widescreen slides.
- **Accent rules**: 3px wide, sage mint (`#7CB68E`), used as left borders on featured cards and quote blocks -- never as horizontal dividers. Structural separation comes from spacing and card boundaries.
- **Vertical rhythm**: Maintain consistent 32px gaps between elements within a card. Use 20px gaps between grid items. Card padding provides the outer breathing room.
- **Chart alignment**: Bar charts align to the bottom of the chart area. Data labels sit directly above their respective bars. Axis labels sit directly below.
- **Background composition**: The chromatic blur background should extend to all edges. The card floats centered or slightly above center for visual balance.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Background (Level 0) | Chromatic blur gradient, no shadow | The energetic base layer -- blurred color streaks |
| Flat Card (Level 1) | `background: #ffffff; border-radius: 24px;` | Simple white card with no shadow, for nested internal panels |
| Standard Card (Level 2) | `0 4px 20px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)` | The primary floating card -- the frosted lens surface |
| Featured Card (Level 3) | `0 8px 32px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.08)` | Hero cards, featured data displays, key stat panels |
| Overlay (Level 4) | `0 16px 56px rgba(0,0,0,0.18)` | Modals, overlays, high-priority popups above the card layer |

### Border Treatments
- **Card border**: None by default. The shadow and white surface against the chromatic background provide sufficient definition. Do not add borders to the main card.
- **Internal border**: `1px solid rgba(0,0,0,0.06)` -- subtle separator for list items and internal card sections.
- **Accent border**: `3px solid #7CB68E` -- sage mint left-border for featured panels and quote blocks. Always on the left edge, never top or bottom.
- **Divider line**: `1px solid rgba(0,0,0,0.04)` -- nearly invisible separator for dense content within cards.

### Surface Hierarchy
The defining depth relationship in this style is between the chromatic background and the white card:
1. **Background** (chromatic blur) -- the deepest layer, full of energy and color. This is a CSS gradient with blur, or a blurred image.
2. **Primary Card** (`#ffffff` with Level 2-3 shadow, 24px radius) -- the frosted lens. This is where all content lives. The shadow and radius create the floating effect.
3. **Inset Surface** (`#F8F8F8` inside cards) -- recessed areas within the card for chart backgrounds or nested panels.
4. **Data Elements** (colored bars, stat numbers) -- the highest visual layer within the card, using color to pop forward.

The white card's shadow against the colorful background is the signature depth mechanism. Inside the card, depth is communicated through subtle color differences (white vs. `#F8F8F8`) rather than additional shadows. Avoid nesting shadowed cards inside shadowed cards.

## 7. Do's and Don'ts

### Do
- Always place content inside a white card (`#ffffff`) with `border-radius: 24px` -- the card-on-chromatic-background is the signature of this style.
- Use sage mint (`#7CB68E`) as the primary accent for positive data, growth metrics, and CTAs -- it is the optimistic signal color.
- Use dusty rose (`#D4A0A0`) only as a secondary data color for comparison bars and supporting metrics -- never for CTAs or headlines.
- Keep the chromatic background abstract and blurred -- motion-blur streaks, not recognizable imagery or sharp gradients.
- Use spaced uppercase (letter-spacing: 2-3px) for brand labels and category tags at 12-13px size.
- Maintain generous card padding (40-48px) -- content should breathe inside the white surface.
- Use `border-radius: 8-12px` for internal elements (chart bars, buttons, icon containers) to echo the card's rounded aesthetic.
- Let data visualizations (bar charts, line graphs, big numbers) be the hero content -- this style is data-forward.
- Use a single bold statement headline below or beside the data to editorialize the numbers.
- Include a brand label in spaced uppercase at the top of the card to anchor the composition.

### Don't
- Don't place text or content directly on the chromatic background -- everything lives inside the white card.
- Don't use sharp corners (0px radius) on the main card -- the minimum is 20px. Sharp corners break the frosted-lens softness.
- Don't use more than 2 chromatic accent colors inside the card (sage mint + dusty rose). The card interior is calm and restrained.
- Don't use CSS gradients for the background -- use a real photograph or artwork with `filter: blur(24px)`. CSS gradients look flat and artificial; this style requires organic chromatic texture from a real image.
- Don't use heavy black drop shadows -- shadows should be medium-depth (`rgba(0,0,0,0.08-0.12)`) and diffused. Harsh shadows feel dated against this aesthetic.
- Don't use weight 700 for body text inside the card -- keep body at 400 to maintain the clean, open feel.
- Don't apply borders to the main white card -- the shadow against the chromatic background provides all the definition needed.
- Don't center-align body paragraphs -- only headlines, single stats, and CTAs should be centered.
- Don't use gradients inside the card for backgrounds or text -- the card interior is flat white. Gradients belong to the background layer only.
- Don't exceed 3 data bars or metrics in a single chart row -- each element needs space to read clearly.
- Don't use serif fonts or monospace fonts -- the clean sans-serif is essential to the modern startup feel.
- Don't place the card flush against the background edge -- maintain at least 48px of visible chromatic background on all sides.

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
- **Typography scale down**: Display Hero becomes 48px (from 64px). Section Heading becomes 36px. Sub-heading stays 28px. Body stays 16px. Data Labels stay 18px.
- **Background padding**: 48px on all sides. The chromatic blur is visible as a vibrant border around the card.
- **Card**: Single white card fills most of the frame (984x984px content area). Border-radius 24px. Padding 40px inside.
- **Cover slide**: Brand label at top, hero headline centered, subtitle in warm gray below. Card floats on chromatic background.
- **Data slides**: Bar chart or single big stat centered in the card. Statement headline below the data.
- **Swipe indicator**: Small white dots with 50% opacity at bottom of the chromatic background area, 8px diameter, 12px gap. Active dot fully opaque.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 64px for the title section.
- **Background**: Chromatic blur runs the full height. Multiple white cards stacked vertically with 24px gaps between them.
- **Card stacking**: Each major section gets its own card. Cards share the same 24px radius and 40px internal padding.
- **Section spacing**: 24px vertical gap between cards. No additional dividers needed -- the chromatic background peeks through the gaps.
- **Vertical rhythm**: Alternate between data-focused cards (charts, stats) and narrative cards (quote blocks, feature lists).
- **Footer**: Final card contains CTA. Brand label repeats in a small card at the very bottom.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 72px with -2px tracking. Section Heading becomes 48px. Body Large becomes 22px. Data Labels become 22px.
- **Background padding**: 60px on all sides.
- **Card sizing**: Card can be full-width (1800x960px) or split into 2 side-by-side cards for comparison layouts.
- **Title slides**: Single large card centered. Brand label, headline, and subtitle vertically stacked inside.
- **Data slides**: Card with chart on the left 60%, statement headline on the right 40% -- or chart centered with headline below.
- **Two-card layouts**: Two rounded cards side-by-side with 24px gap between them. Chromatic background visible in the gap.

### Poster (1080x1350px)
- **Typography**: Display Hero at 56px. Section Heading at 36px. Body at 16px.
- **Background padding**: 48px left/right, 60px top/bottom.
- **Composition**: Single tall white card occupying most of the frame. Top zone for brand label and headline. Middle zone for data visualization. Bottom zone for statement headline and CTA.
- **Vertical flow**: Content reads top-to-bottom inside the card. Generous 32px spacing between zones.
- **CTA placement**: Always in the bottom zone of the card, centered, with a sage mint button.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 64px (approximately 30% larger than Carousel 48px). Section Heading becomes 48px in DM Sans 600. Body Large becomes 22px. Data labels become 22px. Brand label (spaced uppercase) stays 14px at the top of the card.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: A single tall white card (`#ffffff`, 24px radius) occupies roughly 860px wide by 1520px tall, centered at y=200 to y=1720 inside the safe zone. The blurred chromatic background (pinks, teals, blues, ambers in motion) fills the frame behind it so the card still reads as a frosted lens floating over movement.
- **Cover slide**: Brand label (`INFERENCECORE`) spaced uppercase at the top of the card, then the headline in DM Sans 600 at 64px in near-black centered inside the card, then supporting body in near-black/warm gray below. Keep the interior calm -- all the visual energy lives in the blurred exterior.
- **Content slides**: Tall vertical bar chart as the hero element filling the middle two-thirds of the card, with sage-mint (`#7CB68E`) primary bars and dusty rose (`#D4A0A0`) secondary bars, each topped with a dark data label. Below the chart, a bold near-black statement headline editorializes the numbers. One chart or one metric block per slide -- the data is the story.
- **CTA slide**: Inside the same white card, centered headline at 56px in DM Sans 600 near-black, short supporting line, and a sage-mint pill button with near-black DM Sans 700 CTA text. Medium warm card shadow (`0 16px 48px rgba(0,0,0,0.14)`) stays under the card throughout the story.
- **Progress indicator**: Thin progress segments (2px, 4px gap) at the top of the safe zone in sage-mint at 40% opacity for inactive and full sage-mint for active -- placed above the card so the card's interior stays pristine.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| White | `#ffffff` | Primary card surface |
| Near-Black | `#1A1A1A` | Primary text |
| Sage Mint | `#7CB68E` | Accent: primary data, CTAs, growth indicators |
| Dark Sage | `#5A9A6E` | Hover/active state for sage elements |
| Dusty Rose | `#D4A0A0` | Secondary data bars, comparison metrics |
| Snow | `#F5F5F5` | Nested card surfaces, inset panels |
| Surface Inset | `#F8F8F8` | Chart backgrounds, recessed areas |
| Light Border | `#E8E8E8` | Internal structural borders |
| Mid Gray | `#D1D5DB` | Disabled states, placeholders |
| Cool Gray | `#9CA3AF` | Tertiary text, axis labels |
| Warm Gray | `#6B7280` | Secondary text, descriptions |
| Slate | `#4B5563` | Secondary headings |
| Charcoal | `#374151` | High-emphasis body text |
| BG Pink | `#E8457A` | Chromatic background streak |
| BG Teal | `#3CBCB4` | Chromatic background streak |
| BG Blue | `#2E5C9A` | Chromatic background streak |
| BG Amber | `#D4943C` | Chromatic background streak |

### Font Declarations

```css
font-family: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-white: #ffffff;
  --color-near-black: #1A1A1A;
  --color-sage-mint: #7CB68E;

  /* Colors -- Accent */
  --color-dark-sage: #5A9A6E;
  --color-dusty-rose: #D4A0A0;
  --color-warm-gray: #6B7280;

  /* Colors -- Neutral Scale */
  --color-snow: #F5F5F5;
  --color-light-border: #E8E8E8;
  --color-mid-gray: #D1D5DB;
  --color-cool-gray: #9CA3AF;
  --color-slate: #4B5563;
  --color-charcoal: #374151;

  /* Colors -- Surfaces */
  --color-surface-primary: #ffffff;
  --color-surface-inset: #F8F8F8;

  /* Colors -- Chromatic Background */
  --color-bg-pink: #E8457A;
  --color-bg-teal: #3CBCB4;
  --color-bg-blue: #2E5C9A;
  --color-bg-amber: #D4943C;

  /* Colors -- Borders */
  --color-border-default: rgba(0, 0, 0, 0.06);
  --color-border-accent: rgba(124, 182, 142, 0.35);
  --color-border-strong: rgba(0, 0, 0, 0.12);
  --color-divider-rule: #7CB68E;

  /* Colors -- Shadows */
  --shadow-subtle-color: rgba(0, 0, 0, 0.06);
  --shadow-medium-color: rgba(0, 0, 0, 0.12);
  --shadow-deep-color: rgba(0, 0, 0, 0.18);
  --shadow-warm-color: rgba(30, 20, 15, 0.08);

  /* Typography -- Families */
  --font-display: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 64px;
  --text-section-heading: 42px;
  --text-sub-heading: 28px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number: 56px;
  --text-brand-label: 12px;
  --text-data-label: 18px;
  --text-cta: 15px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-sub-heading: 600;
  --weight-body: 400;
  --weight-body-light: 300;
  --weight-label: 500;
  --weight-cta: 600;

  /* Typography -- Line Heights */
  --leading-display: 1.08;
  --leading-heading: 1.12;
  --leading-sub-heading: 1.20;
  --leading-body-large: 1.60;
  --leading-body: 1.60;
  --leading-small: 1.45;
  --leading-number: 1.00;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium-small: 20px;
  --space-medium: 24px;
  --space-large: 32px;
  --space-card-padding: 40px;
  --space-card-padding-lg: 48px;
  --space-background: 60px;
  --space-max: 80px;

  /* Borders */
  --radius-card: 24px;
  --radius-internal: 12px;
  --radius-small: 8px;
  --radius-button: 12px;

  /* Shadows -- Composed */
  --shadow-subtle: 0 2px 12px rgba(0,0,0,0.06);
  --shadow-card: 0 4px 20px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06);
  --shadow-featured: 0 8px 32px rgba(0,0,0,0.12), 0 16px 48px rgba(0,0,0,0.08);
  --shadow-overlay: 0 16px 56px rgba(0,0,0,0.18);

  /* Background Gradient */
  --bg-chromatic: linear-gradient(135deg, #E8457A 0%, #3CBCB4 30%, #2E5C9A 60%, #D4943C 100%);
}
```

### System Font Fallbacks
- **Sans-serif (if DM Sans fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Background Generation

**IMPORTANT: Use a real image for the background, NOT CSS gradients.** CSS gradients cannot replicate the organic, chromatic quality this style requires. The background must be a real photograph or artwork — abstract, colorful, and high-energy.

**Recommended approach:** Use an Unsplash image or similar source with vibrant, abstract colors. Apply CSS `filter: blur(24px)` and `transform: scale(1.15)` to create the frosted effect.

```css
.frosted-lens-bg {
  position: absolute;
  inset: 0;
  background-image: url('YOUR_IMAGE_URL_HERE');
  background-size: cover;
  background-position: center;
  filter: blur(24px);
  transform: scale(1.15); /* prevents blur edge artifacts */
  z-index: 0;
}
```

**Good image search terms for Unsplash:** "abstract colorful", "gradient art", "colorful bokeh", "abstract painting vibrant", "iridescent texture"

**Fallback only (if no image is available):** Use the CSS variable `--bg-chromatic` as a last resort, but always prefer a real image.

```css
  --bg-chromatic: linear-gradient(135deg, #E8457A 0%, #3CBCB4 30%, #2E5C9A 60%, #D4943C 100%);
```
