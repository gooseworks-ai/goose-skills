# Design Style: Clean Slate

## 1. Visual Theme & Atmosphere

Clean Slate is the design language of radical reduction -- the visual equivalent of a perfectly empty desk with one carefully chosen object on it. The pure white canvas (`#ffffff`) is not blank; it is a deliberate assertion that every element must justify its existence. This is the aesthetic of Vercel's dashboard, of Linear's marketing pages, of a Dieter Rams product photographed against infinity white. There is nowhere to hide in this much light. Every pixel of padding, every shade of gray, every typographic decision is exposed and accountable.

The single typeface approach -- Space Grotesk for both display and body -- creates a unified visual voice that reinforces the reductive philosophy. Space Grotesk is a geometric sans-serif with distinctive character: its proportional spacing, open apertures, and subtly squared curves give it personality without ornamentation. At display sizes (48px+), it runs with aggressive negative tracking (-1.5px to -2px), creating dense, architecturally precise headline blocks that feel engineered rather than designed. At body sizes, lighter weights (300-400) open up into clean, highly readable text. The single-family approach means hierarchy is established entirely through size, weight, and spacing -- no serif/sans-serif tension, just pure typographic scale.

Blue (`#0066ff`) is the sole accent colour -- a precise, saturated hue that reads as confident and technical without being cold. It is not a brand blue or a link blue; it is a signal colour, used the way an architect uses a single red line on a blueprint. Against the white field, it vibrates with controlled intensity. The restraint of a single accent means that when blue appears -- as a button fill, an underline, a stat number -- the eye goes there immediately. Light gray (`#f5f5f5`) provides the subtlest possible surface differentiation, creating depth through barely-there value shifts rather than shadows or borders. The signature "shadow-as-border" technique (`box-shadow: 0 0 0 1px rgba(0,0,0,0.08)`) defines containers with a line so fine it feels structural rather than decorative -- like the edge of a sheet of paper, not a drawn border.

**Key Characteristics:**
- Pure white background (`#ffffff`) as the dominant surface -- whiteness as an active design choice, not a default
- Near-black (`#171717`) for all primary text -- warm enough to avoid harshness, dark enough for maximum legibility
- Space Grotesk for all typography -- single family, hierarchy through size and weight only
- Tight tracking at display sizes (-1.5px to -2px) for dense, engineered headline blocks
- Blue (`#0066ff`) as the singular accent colour for CTAs, focal numbers, and interactive elements
- Light gray (`#f5f5f5`) for subtle surface differentiation -- depth through value, not shadow
- Shadow-as-border technique (`box-shadow: 0 0 0 1px rgba(0,0,0,0.08)`) for container definition
- Extreme whitespace -- sections breathe with 64-80px gaps, content floats in generous margins
- No gradients, no rounded corners above 8px, no decorative elements -- every mark is functional

## 2. Color Palette & Roles

### Primary
- **White** (`#ffffff`): Primary background. Pure, uncompromised white -- the canvas against which everything else is measured.
- **Near-Black** (`#171717`): Primary text colour. A warm black that avoids the harshness of `#000000` while maintaining commanding contrast.
- **Blue** (`#0066ff`): Primary accent. Used for CTAs, focal statistics, active states, and any element that demands immediate attention.

### Accent
- **Light Blue** (`#e6f0ff`): Blue tint for hover backgrounds, tag fills, and subtle emphasis areas.
- **Dark Blue** (`#0052cc`): Hover/active state for blue interactive elements. Deeper, more saturated.
- **Warm Gray Text** (`#6b7280`): Secondary text colour for descriptions, captions, and supporting copy.

### Neutral Scale
- **Snow** (`#f5f5f5`): Elevated surface -- cards, containers, and content panels sitting above the white background.
- **Light Border** (`#ebebeb`): Visible border for inputs, dividers, and structural lines when shadow-as-border is insufficient.
- **Mid Gray** (`#d4d4d4`): Disabled states, placeholder text, and inactive elements.
- **Cool Gray** (`#9ca3af`): Tertiary text for timestamps, metadata, and low-priority labels.
- **Slate** (`#4b5563`): Secondary headings and medium-emphasis text.
- **Charcoal** (`#374151`): High-emphasis body text, slightly lighter than primary for visual breathing room.

### Surface & Borders
- **Surface Primary** (`#f5f5f5`): Card and container background.
- **Surface Inset** (`#fafafa`): Recessed areas, code blocks, and inset panels.
- **Border Default** (`rgba(0,0,0,0.08)`): Shadow-as-border for standard containers.
- **Border Accent** (`rgba(0,102,255,0.3)`): Blue-tinted border for active or featured elements.
- **Border Strong** (`rgba(0,0,0,0.15)`): Higher-contrast border for prominent containers and inputs.
- **Divider Rule** (`#0066ff`): Solid blue for accent rules (typically 2px height).

### Shadow Colors
- **Shadow Subtle** (`rgba(0,0,0,0.04)`): Primary ambient shadow for minimal lift.
- **Shadow Medium** (`rgba(0,0,0,0.08)`): Standard card elevation.
- **Shadow Deep** (`rgba(0,0,0,0.12)`): High-elevation elements like dropdowns and modals.
- **Shadow Border** (`rgba(0,0,0,0.08)`): The signature 0-spread ring shadow used as a border replacement.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Space Grotesk | 72px | 700 | 1.05 | -2px | Hero headlines, single powerful statement |
| Section Heading | Space Grotesk | 48px | 700 | 1.10 | -1.5px | Major section titles |
| Sub-heading | Space Grotesk | 32px | 600 | 1.15 | -0.75px | Subsection titles, card headings |
| Body Large | Space Grotesk | 20px | 300 | 1.65 | 0px | Lead paragraphs, introductions |
| Body | Space Grotesk | 16px | 400 | 1.65 | 0px | Standard reading text |
| Small / Caption | Space Grotesk | 13px | 400 | 1.50 | 0.2px | Metadata, attributions, timestamps |
| Big Numbers | Space Grotesk | 64px | 700 | 1.00 | -1.5px | Statistics, key metrics, hero data |
| Numbered Label | Space Grotesk | 14px | 500 | 1.00 | 1.5px | Uppercase step labels ("01 -- STRATEGY") |
| CTA Text | Space Grotesk | 15px | 600 | 1.00 | 0.5px | Button and call-to-action text |

### Principles
- **One family, total discipline**: Space Grotesk handles everything. Hierarchy is achieved through size, weight, and tracking alone. This constraint is the style's identity.
- **Aggressive tracking at display sizes**: -2px at 72px, -1.5px at 48px, -0.75px at 32px. Headlines should feel tight, precise, and engineered -- like type on a technical drawing.
- **Light body weight**: Body text at weight 300-400 creates an airy, open reading experience. The geometric letterforms of Space Grotesk maintain clarity even at light weights.
- **Tracking opens at small sizes**: Captions and labels use positive tracking (0.2px-1.5px) for legibility. Uppercase labels always use wide tracking.
- **Generous line height**: 1.65 for body text ensures comfortable reading on bright white backgrounds where dense text becomes tiring.
- **Uppercase sparingly**: Reserve uppercase + wide tracking for numbered labels and small UI elements. Headlines and body are always mixed case.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: var(--color-white); padding: 80px 60px; text-align: center;">
  <p style="font-family: var(--font-display); font-size: 14px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-blue); margin: 0 0 24px;">THE FUTURE OF WORK</p>
  <h1 style="font-family: var(--font-display); font-size: 72px; font-weight: 700; line-height: 1.05; letter-spacing: -2px; color: var(--color-near-black); margin: 0 0 24px;">Autonomous Teams,<br>Real Results</h1>
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 300; line-height: 1.65; color: var(--color-warm-gray); max-width: 560px; margin: 0 auto;">How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.</p>
</div>
```

### Numbered Item

```html
<div style="display: flex; gap: 24px; align-items: flex-start; padding: 32px 0; border-bottom: 1px solid rgba(0,0,0,0.08);">
  <span style="font-family: var(--font-display); font-size: 48px; font-weight: 700; line-height: 1.00; letter-spacing: -1.5px; color: var(--color-blue); min-width: 72px;">01</span>
  <div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cool-gray); margin: 0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 600; line-height: 1.15; letter-spacing: -0.75px; color: var(--color-near-black); margin: 0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-warm-gray); margin: 0;">Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 24px; background: var(--color-snow); box-shadow: 0 0 0 1px rgba(0,0,0,0.08); border-radius: 8px;">
  <p style="font-family: var(--font-display); font-size: 64px; font-weight: 700; line-height: 1.00; letter-spacing: -1.5px; color: var(--color-blue); margin: 0 0 8px;">47%</p>
  <p style="font-family: var(--font-body); font-size: 14px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-near-black); margin: 0 0 12px;">FASTER RESPONSE</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-warm-gray); max-width: 280px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(0,0,0,0.08); border-radius: 8px; overflow: hidden;">
  <div style="background: var(--color-white); padding: 40px 32px;">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; letter-spacing: 0.2px; color: var(--color-cool-gray); margin: 0 0 16px;">Without Goose</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 600; line-height: 1.15; letter-spacing: -0.75px; color: var(--color-near-black); margin: 0 0 16px;">Manual & Fragmented</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-warm-gray); margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
  </div>
  <div style="background: var(--color-white); padding: 40px 32px; border-left: 2px solid var(--color-blue);">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; letter-spacing: 0.2px; color: var(--color-blue); margin: 0 0 16px;">With Goose</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 600; line-height: 1.15; letter-spacing: -0.75px; color: var(--color-near-black); margin: 0 0 16px;">Orchestrated & Autonomous</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-warm-gray); margin: 0;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid rgba(0,0,0,0.08);">
  <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); border-radius: 8px; color: var(--color-blue); font-size: 16px;">&#9632;</div>
  <div>
    <h4 style="font-family: var(--font-display); font-size: 22px; font-weight: 600; line-height: 1.20; color: var(--color-near-black); margin: 0 0 8px;">Persistent Memory</h4>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-warm-gray); margin: 0;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 48px 40px; border-left: 2px solid var(--color-blue); background: var(--color-surface-inset);">
  <p style="font-family: var(--font-display); font-size: 32px; font-weight: 400; line-height: 1.35; letter-spacing: -0.75px; color: var(--color-near-black); margin: 0 0 24px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 32px; height: 2px; background: var(--color-blue);"></div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cool-gray); margin: 0;">SARAH CHEN, VP OPERATIONS</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: var(--color-snow); box-shadow: 0 0 0 1px rgba(0,0,0,0.08); border-radius: 8px;">
  <h2 style="font-family: var(--font-display); font-size: 40px; font-weight: 700; line-height: 1.10; letter-spacing: -1px; color: var(--color-near-black); margin: 0 0 16px;">Ready to meet your team?</h2>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 300; line-height: 1.65; color: var(--color-warm-gray); max-width: 480px; margin: 0 auto 32px;">Deploy your first AI coworker in under five minutes. No setup fees, no long-term commitments.</p>
  <a style="display: inline-block; background: var(--color-blue); color: var(--color-white); font-family: var(--font-body); font-size: 15px; font-weight: 600; letter-spacing: 0.5px; text-decoration: none; padding: 14px 36px; border-radius: 6px;">Get Started</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between icon and inline label.
- **8px**: Tight gap -- between sub-label and heading, between stat number and label.
- **12px**: Small gap -- between heading and body text within a component.
- **16px**: Base gap -- between body paragraphs, between list items in compact mode.
- **24px**: Medium gap -- between components within a section, standard list item padding.
- **32px**: Section internal -- padding inside cards and containers, gap between grouped items.
- **48px**: Section divider -- vertical space between major content blocks.
- **64px**: Large section padding -- top/bottom padding for hero and CTA blocks.
- **80px**: Maximum section padding -- cover slides and high-impact hero areas.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |

### Alignment & Grid
- **Primary alignment**: Left-aligned text for body content. Center-aligned for hero titles, stats, and CTA blocks.
- **Grid**: Use a simple 2-column grid for comparison layouts. Single-column for narrative and list content. 3-column for stat grids on widescreen slides.
- **Accent rules**: 2px tall, blue (`#0066ff`), used sparingly as underlines beneath hero text or as section openers -- never centered decorative rules. This style prefers structural whitespace over decorative dividers.
- **Vertical rhythm**: Maintain consistent 48px gaps between top-level sections. Use 24px gaps between items within a section.
- **Content gravity**: On widescreen slides (1920x1080), anchor content to the left two-thirds of the frame. Leave the right third as breathing room or for supporting imagery.
- **Gallery-like whitespace**: Treat the white background as active design space. Generous margins (60-80px) ensure content floats freely rather than filling the frame.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#ffffff` | Page canvas, base layer |
| Ring (Level 1) | `0 0 0 1px rgba(0,0,0,0.08)` | Standard container definition -- the signature shadow-as-border |
| Subtle (Level 2) | `0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08)` | Cards and content panels with barely-there lift |
| Elevated (Level 3) | `0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.08)` | Featured cards, dropdowns, hover states |
| Overlay (Level 4) | `0 12px 40px rgba(0,0,0,0.12)` | Modals, overlays, high-priority popups |

### Border Treatments
- **Shadow-as-border**: `box-shadow: 0 0 0 1px rgba(0,0,0,0.08)` -- the primary method for defining containers. Produces a hairline border effect that is softer and more refined than a CSS border.
- **Structural border**: `1px solid rgba(0,0,0,0.08)` -- fallback for contexts where box-shadow is unavailable (table cells, grid gaps).
- **Accent border**: `2px solid #0066ff` -- blue accent for active states, featured panels, and the left border on quote blocks.
- **Divider line**: `1px solid rgba(0,0,0,0.06)` -- nearly invisible separator for dense list content.

### Surface Hierarchy
On white backgrounds, elevation is communicated through minimal shadow rather than colour shifts:
1. **Background** (`#ffffff`) -- the purest layer, the canvas.
2. **Surface** (`#f5f5f5`) -- cards and containers step up with the subtlest possible gray.
3. **Inset** (`#fafafa`) -- recessed areas sit between background and surface.
4. **Elevated** (`#ffffff` with Level 2-3 shadow) -- the highest non-overlay surface uses white with shadow to separate from the white canvas.

The shadow-as-border ring (`rgba(0,0,0,0.08)`) is the primary depth mechanism. Real drop shadows are reserved for interactive states (hover) and high-elevation overlays. Most of the time, a single-pixel ring shadow is all a container needs.

## 7. Do's and Don'ts

### Do
- Use the shadow-as-border technique (`box-shadow: 0 0 0 1px rgba(0,0,0,0.08)`) as the primary container definition method -- it is the signature of this style.
- Use blue (`#0066ff`) exclusively as the accent colour -- it is the only chromatic element in the entire system.
- Keep Space Grotesk at tight tracking (-1.5px to -2px) for display sizes -- loose headlines break the engineered precision.
- Maintain extreme whitespace between sections (48-80px) -- this style breathes through emptiness.
- Use weight contrast within the single typeface: 700 for display, 300-400 for body, 500-600 for labels and CTAs.
- Keep border-radius at 6-8px maximum -- subtle rounding, never bubbly.
- Let the white background do the work -- empty space is the primary design element.
- Use uppercase + tracking only for small labels and category tags.
- Limit each slide/section to one focal stat or headline -- clean design lets single ideas command the space.

### Don't
- Don't introduce additional accent colours -- no greens, oranges, or purples. Blue and the gray scale only.
- Don't use heavy drop shadows -- this style relies on ring shadows and barely-there lifts, not dramatic depth.
- Don't use a background colour darker than `#f5f5f5` for any surface -- this is a light, airy style.
- Don't apply weight 700 to body text -- it creates visual heaviness that contradicts the clean aesthetic.
- Don't use rounded corners above 8px -- anything rounder than that shifts from "precise" to "playful."
- Don't use decorative elements, icons, or emoji -- if a visual marker is needed, use a small geometric square (&#9632;) in blue.
- Don't center-align body paragraphs -- only headlines, stats, and CTAs should be centered.
- Don't use gradients or colour fills beyond `#f5f5f5` -- this is a monochromatic palette. Depth comes from shadow and spacing, not colour.
- Don't place more than 3 stat numbers in a single row -- each number needs space to breathe.
- Don't use borders and box-shadows simultaneously on the same element -- choose one method of definition.

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
- **Cover slide**: Title centered vertically and horizontally. Blue uppercase label above the headline. Subtitle in warm gray below.
- **Content slides**: Left-aligned text. One concept per slide. Number in blue (48px) at top-left; content below.
- **Stat slides**: Single stat centered. Big number at 64px in blue. Label and description below.
- **Swipe indicator**: Small mid-gray dots at bottom center, 8px diameter, 12px gap. Active dot in blue.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 72px for the title section.
- **Padding**: 60px left/right. 80px top/bottom margins.
- **Section spacing**: 64px vertical gap between major sections. Thin 1px gray rules between sections -- no decorative accent rules, just structural dividers.
- **Vertical rhythm**: Alternate between full-width sections and 2-column grids. Use numbered items for sequential content, stat displays for key metrics, and quote blocks for testimonials.
- **Footer**: Cool gray text, 13px Space Grotesk, with a final thin rule above.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 80px with -2.5px tracking. Section Heading becomes 56px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Left-heavy composition. Title and body text occupy the left 60% of the frame. Right 40% is breathing room or supporting content (stats, minimal visuals).
- **Title slides**: Headline centered on frame. Blue label above. Subtitle below.
- **Content slides**: 2-column max for comparisons. Single column for narrative.
- **Stat slides**: Up to 3 stats in a row, evenly spaced, each in a ring-shadow container.

### Poster (1080x1350px)
- **Typography**: Display Hero at 64px. Section Heading at 40px. Body at 16px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for headline and blue label. Middle third for key content (stats, list, or comparison). Bottom third for CTA or closing statement.
- **Vertical flow**: Content reads top-to-bottom with clear sections. Generous whitespace separates the three zones -- no decorative dividers needed.
- **CTA placement**: Always in the bottom zone, centered, with generous padding above. Blue button against white.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 72px with -2px tracking (approximately 30% larger than Carousel 56px). Section Heading becomes 52px with -1.5px tracking. Body Large becomes 22px at weight 300 for the signature airy reading feel. Big Numbers at 80px in blue.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 960px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Aggressive whitespace above and below the focal element -- this style breathes through emptiness, and the tall frame should feel mostly empty.
- **Cover slide**: Tiny blue uppercase label at 14px with 1.5px tracking sitting around y=520, followed by the hero headline in Space Grotesk 700 at 72px centered, then a 20px weight-300 subtitle in warm gray below. The whole block occupies only the central third of the frame; pure white does the rest. Optional 2px x 64px blue accent rule centered between label and headline.
- **Content slides**: One concept per slide, engineered precision throughout. Oversized blue stat or blue numeral (72-80px) anchors the upper third; Space Grotesk 600 sub-heading and 16px warm-gray body sit below. Use a single shadow-as-border container (`box-shadow: 0 0 0 1px rgba(0,0,0,0.08)`) around stat blocks -- never a real border.
- **CTA slide**: Space Grotesk 700 headline at 56px centered in the middle zone. Weight-300 subtitle below. Blue (`#0066ff`) pill button at 6-8px radius centered just above the bottom safe zone, with `Get Started` in Space Grotesk 600 at 15px.
- **Progress indicator**: Thin segmented bars (one per slide) at the very top inside the safe zone, 4px tall, 1px gap between segments. Inactive segments in `rgba(0,0,0,0.08)`; active segment solid `#0066ff`. Keeps the signal-color discipline.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| White | `#ffffff` | Primary background |
| Near-Black | `#171717` | Primary text |
| Blue | `#0066ff` | Accent: CTAs, numbers, active states, focal points |
| Light Blue | `#e6f0ff` | Hover backgrounds, tag fills, subtle emphasis |
| Dark Blue | `#0052cc` | Hover/active state for blue elements |
| Snow | `#f5f5f5` | Card/container surface |
| Surface Inset | `#fafafa` | Recessed panels, code blocks |
| Light Border | `#ebebeb` | Structural borders, input fields |
| Mid Gray | `#d4d4d4` | Disabled states, placeholders |
| Cool Gray | `#9ca3af` | Tertiary text, timestamps |
| Warm Gray | `#6b7280` | Secondary text, descriptions |
| Slate | `#4b5563` | Secondary headings |
| Charcoal | `#374151` | High-emphasis body text |

### Font Declarations

```css
font-family: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-white: #ffffff;
  --color-near-black: #171717;
  --color-blue: #0066ff;

  /* Colors -- Accent */
  --color-light-blue: #e6f0ff;
  --color-dark-blue: #0052cc;
  --color-warm-gray: #6b7280;

  /* Colors -- Neutral Scale */
  --color-snow: #f5f5f5;
  --color-light-border: #ebebeb;
  --color-mid-gray: #d4d4d4;
  --color-cool-gray: #9ca3af;
  --color-slate: #4b5563;
  --color-charcoal: #374151;

  /* Colors -- Surfaces */
  --color-surface-primary: #f5f5f5;
  --color-surface-inset: #fafafa;

  /* Colors -- Borders */
  --color-border-default: rgba(0, 0, 0, 0.08);
  --color-border-accent: rgba(0, 102, 255, 0.3);
  --color-border-strong: rgba(0, 0, 0, 0.15);
  --color-divider-rule: #0066ff;

  /* Colors -- Shadows */
  --shadow-ring: rgba(0, 0, 0, 0.08);
  --shadow-subtle: rgba(0, 0, 0, 0.04);
  --shadow-medium: rgba(0, 0, 0, 0.08);
  --shadow-deep: rgba(0, 0, 0, 0.12);

  /* Typography -- Families */
  --font-display: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 72px;
  --text-section-heading: 48px;
  --text-sub-heading: 32px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number: 64px;
  --text-label: 14px;
  --text-cta: 15px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-sub-heading: 600;
  --weight-body-light: 300;
  --weight-body: 400;
  --weight-label: 500;
  --weight-cta: 600;

  /* Typography -- Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.10;
  --leading-sub-heading: 1.15;
  --leading-body-large: 1.65;
  --leading-body: 1.65;
  --leading-small: 1.50;
  --leading-number: 1.00;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-large: 32px;
  --space-section: 48px;
  --space-hero: 64px;
  --space-max: 80px;

  /* Borders */
  --radius-standard: 8px;
  --radius-small: 6px;

  /* Shadows -- Composed */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.08);
  --shadow-featured: 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.08);
  --shadow-border: 0 0 0 1px rgba(0,0,0,0.08);
}
```

### System Font Fallbacks
- **Sans-serif (if Space Grotesk fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
