# Design Style: Midnight Editorial

## 1. Visual Theme & Atmosphere

Midnight Editorial draws from the tradition of luxury magazine design -- the kind of publication where every spread is a composition, where white space is replaced by the authority of darkness. The near-black canvas (`#0d0d0d`) is not mere absence of light; it is a deliberate stage that forces every element placed upon it to earn its presence. Warm cream text (`#f5f0e8`) floats against this darkness like type on heavy black stock, creating a reading experience that feels intimate, considered, and expensive. This is the design language of Monocle after hours, of a Kinfolk issue printed in negative, of the programme for an invitation-only event.

The typographic pairing of Playfair Display and Inter creates the tension that makes this style work. Playfair Display -- a transitional serif with high contrast between thick and thin strokes -- delivers headlines that carry the authority of engraved letterpress plates. Its serifs are sharp, its bowls generous, its italic forms genuinely calligraphic. Against this, Inter provides clean, highly legible sans-serif body text that never competes with the display type. The contrast between serif display and sans-serif body mirrors the editorial convention of magazine design: the headline seduces, the body informs. At display sizes (64px+), Playfair Display runs at weight 700 with moderate negative letter-spacing (-1px), creating dense headline blocks that command attention without crowding.

Copper (`#c17f59`) is the accent that elevates this system from dark-mode-generic to genuinely editorial. It is not gold (too flashy), not bronze (too dull), but a warm metallic tone that reads as luxurious without ostentation -- the colour of a foil-stamped spine, of aged hardware on a leather portfolio. Used sparingly for accent lines, numbering, and interactive elements, copper creates focal points that guide the eye without breaking the mood. The secondary muted gold (`#a89067`) provides a quieter companion for borders, secondary labels, and decorative rules. Together they establish a warm metallic vocabulary against the cool darkness. Subtle `1px solid rgba(245,240,232,0.1)` borders create structure through whisper-thin lines, while box shadows use warm-tinted RGBA values to preserve the palette's warmth even in depth effects.

**Key Characteristics:**
- Near-black background (`#0d0d0d`) as the dominant surface -- darkness as a design decision, not a dark-mode toggle
- Warm cream (`#f5f0e8`) for all primary text -- softer and warmer than white, reducing eye strain on dark surfaces
- Playfair Display at weight 700 for all display type -- sharp transitional serifs for editorial authority
- Inter at weight 300-400 for body text -- clean, highly legible sans-serif that defers to the serif headlines
- Copper (`#c17f59`) as the singular accent colour for numbering, rules, CTAs, and focal points
- Muted gold (`#a89067`) as secondary accent for borders, captions, and quiet emphasis
- Negative letter-spacing at display sizes (-1px at 64px, -0.5px at 40px) for tight, editorial headline blocks
- Warm-tinted shadows using `rgba(197,127,89,0.08)` -- elevation that stays on-palette
- Thin horizontal rules and generous vertical spacing to create an unhurried, magazine-like rhythm

## 2. Color Palette & Roles

### Primary
- **Midnight** (`#0d0d0d`): Primary background. Near-black with a neutral undertone -- darker than charcoal, warmer than pure `#000000`.
- **Cream** (`#f5f0e8`): Primary text colour. A warm off-white with subtle yellow undertone that softens contrast and adds warmth.
- **Copper** (`#c17f59`): Primary accent. Used for numbering, horizontal rules, CTA buttons, and focal-point elements. The signature colour.

### Accent
- **Muted Gold** (`#a89067`): Secondary accent for borders, captions, sub-labels, and decorative lines. Quieter than copper.
- **Warm White** (`#ede7db`): Tertiary accent for hover states and high-emphasis body text. Slightly darker than cream.
- **Deep Copper** (`#9a6347`): Darker copper for hover/active states on interactive elements.

### Neutral Scale
- **Charcoal** (`#1a1a1a`): Elevated surface -- cards, containers, content panels sitting above the midnight background.
- **Dark Gray** (`#2a2a2a`): Secondary surface for nested containers, input fields, and inset areas.
- **Medium Gray** (`#4a4a4a`): Disabled text, placeholder content, and subtle dividers.
- **Soft Gray** (`#6b6b6b`): Tertiary text for timestamps, metadata, and low-priority labels.
- **Light Gray** (`#8a8a8a`): Used sparingly for de-emphasized captions on dark surfaces.

### Surface & Borders
- **Surface Primary** (`#1a1a1a`): Card and container background.
- **Surface Inset** (`#141414`): Recessed areas, code blocks, and inset panels.
- **Border Default** (`rgba(245,240,232,0.1)`): Standard whisper-thin border for cards and dividers.
- **Border Accent** (`rgba(193,127,89,0.3)`): Copper-tinted border for active or featured elements.
- **Border Strong** (`rgba(245,240,232,0.2)`): Higher-contrast border for prominent containers.
- **Divider Rule** (`#c17f59`): Solid copper for horizontal accent rules (typically 2px height).

### Shadow Colors
- **Shadow Warm** (`rgba(197,127,89,0.08)`): Primary shadow -- copper-tinted ambient glow for on-palette elevation.
- **Shadow Deep** (`rgba(0,0,0,0.4)`): Deep shadow for high-elevation elements like modals.
- **Shadow Soft** (`rgba(0,0,0,0.2)`): Standard shadow layer for cards and containers.
- **Shadow Ambient** (`rgba(197,127,89,0.04)`): Subtle warm ambient for barely-there lift.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

- **Display**: `'Playfair Display', Georgia, 'Times New Roman', serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Playfair Display | 72px | 700 | 1.05 | -1.5px | Cover headlines, single impactful statement |
| Section Heading | Playfair Display | 48px | 700 | 1.10 | -1px | Major section titles |
| Sub-heading | Playfair Display | 32px | 700 | 1.15 | -0.5px | Subsection titles, card headings |
| Body Large | Inter | 20px | 300 | 1.60 | 0px | Lead paragraphs, introductions |
| Body | Inter | 16px | 400 | 1.65 | 0px | Standard reading text |
| Small / Caption | Inter | 13px | 400 | 1.50 | 0.3px | Metadata, attributions, timestamps |
| Big Numbers | Playfair Display | 64px | 900 | 1.00 | -1px | Statistics, key metrics, hero data |
| Numbered Label | Inter | 14px | 600 | 1.00 | 2px | Uppercase step labels ("01 -- STRATEGY") |
| CTA Text | Inter | 15px | 600 | 1.00 | 0.8px | Button and call-to-action text, uppercase |

### Principles
- **Serif/sans-serif tension**: Playfair Display owns the headlines; Inter owns everything else. Never use Inter for display headings or Playfair for body text.
- **Light body, heavy display**: Inter at 300-400 weight keeps body text airy and readable. Playfair at 700-900 weight creates dense, authoritative headlines. The weight contrast reinforces the hierarchy.
- **Tracking opens at small sizes**: Negative letter-spacing for display type (-1.5px to -0.5px) creates tight editorial blocks. Body text uses neutral tracking. Captions and labels use positive tracking (0.3px-2px) for legibility at small sizes.
- **Generous line height for body**: 1.60-1.65 for body text creates a relaxed, magazine-like reading rhythm on dark backgrounds where dense text becomes fatiguing.
- **Uppercase sparingly**: Reserve uppercase + wide tracking for numbered labels and CTA buttons only. Headlines are always mixed case.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: var(--color-midnight); padding: 80px 60px; text-align: center;">
  <div style="width: 60px; height: 2px; background: var(--color-copper); margin: 0 auto 32px;"></div>
  <h1 style="font-family: var(--font-display); font-size: 72px; font-weight: 700; line-height: 1.05; letter-spacing: -1.5px; color: var(--color-cream); margin: 0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 300; line-height: 1.60; color: var(--color-muted-gold); max-width: 600px; margin: 0 auto;">How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.</p>
  <div style="width: 60px; height: 2px; background: var(--color-copper); margin: 40px auto 0;"></div>
</div>
```

### Numbered Item

```html
<div style="display: flex; gap: 24px; align-items: flex-start; padding: 32px 0; border-bottom: 1px solid var(--color-border-default);">
  <span style="font-family: var(--font-display); font-size: 48px; font-weight: 700; line-height: 1.00; color: var(--color-copper); min-width: 72px;">01</span>
  <div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-muted-gold); margin: 0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.15; letter-spacing: -0.5px; color: var(--color-cream); margin: 0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-soft-gray); margin: 0;">Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 24px; background: var(--color-charcoal); border: 1px solid var(--color-border-default); border-radius: 4px;">
  <p style="font-family: var(--font-display); font-size: 64px; font-weight: 900; line-height: 1.00; letter-spacing: -1px; color: var(--color-copper); margin: 0 0 8px;">47%</p>
  <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-cream); margin: 0 0 12px;">FASTER RESPONSE</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-soft-gray); max-width: 280px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: var(--color-border-default); border-radius: 4px; overflow: hidden;">
  <div style="background: var(--color-charcoal); padding: 40px 32px;">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; letter-spacing: 0.3px; color: var(--color-muted-gold); margin: 0 0 16px;">Without Goose</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.15; letter-spacing: -0.5px; color: var(--color-cream); margin: 0 0 16px;">Manual & Fragmented</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-soft-gray); margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
  </div>
  <div style="background: var(--color-charcoal); padding: 40px 32px; border-left: 2px solid var(--color-copper);">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; letter-spacing: 0.3px; color: var(--color-copper); margin: 0 0 16px;">With Goose</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.15; letter-spacing: -0.5px; color: var(--color-cream); margin: 0 0 16px;">Orchestrated & Autonomous</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-soft-gray); margin: 0;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid var(--color-border-default);">
  <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--color-border-accent); border-radius: 4px; color: var(--color-copper); font-size: 18px;">&#9670;</div>
  <div>
    <h4 style="font-family: var(--font-display); font-size: 22px; font-weight: 700; line-height: 1.20; color: var(--color-cream); margin: 0 0 8px;">Persistent Memory</h4>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-soft-gray); margin: 0;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 48px 40px; border-left: 2px solid var(--color-copper); background: var(--color-surface-inset);">
  <p style="font-family: var(--font-display); font-size: 32px; font-weight: 400; font-style: italic; line-height: 1.35; letter-spacing: -0.5px; color: var(--color-cream); margin: 0 0 24px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 32px; height: 2px; background: var(--color-copper);"></div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-muted-gold); margin: 0;">SARAH CHEN, VP OPERATIONS</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: var(--color-charcoal); border: 1px solid var(--color-border-accent); border-radius: 4px;">
  <h2 style="font-family: var(--font-display); font-size: 40px; font-weight: 700; line-height: 1.10; letter-spacing: -0.75px; color: var(--color-cream); margin: 0 0 16px;">Ready to meet your team?</h2>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 300; line-height: 1.60; color: var(--color-soft-gray); max-width: 480px; margin: 0 auto 32px;">Deploy your first AI coworker in under five minutes. No setup fees, no long-term commitments.</p>
  <a style="display: inline-block; background: var(--color-copper); color: var(--color-midnight); font-family: var(--font-body); font-size: 15px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; text-decoration: none; padding: 16px 40px; border-radius: 4px;">Get Started</a>
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
- **60px**: Large section padding -- top/bottom padding for hero and CTA blocks.
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
- **Horizontal rules**: 2px tall, copper (`#c17f59`), 60px wide, centered -- used as section dividers and decorative accents above/below headlines.
- **Vertical rhythm**: Maintain consistent 48px gaps between top-level sections. Use 24px gaps between items within a section.
- **Content gravity**: On widescreen slides (1920x1080), anchor content to the left two-thirds of the frame. Leave the right third as breathing room or for supporting imagery.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#0d0d0d` | Page canvas, base layer |
| Subtle (Level 1) | `rgba(0,0,0,0.2) 0px 2px 8px` | Slight lift for list items on hover |
| Card (Level 2) | `rgba(0,0,0,0.3) 0px 8px 24px, rgba(197,127,89,0.04) 0px 0px 12px` | Standard card and container elevation |
| Featured (Level 3) | `rgba(0,0,0,0.4) 0px 16px 40px, rgba(197,127,89,0.08) 0px 0px 20px` | Featured cards, quote blocks, hero elements |
| Overlay (Level 4) | `rgba(0,0,0,0.6) 0px 24px 60px` | Modals, overlays, high-priority popups |

### Border Treatments
- **Standard border**: `1px solid rgba(245,240,232,0.1)` -- barely visible cream line that defines edges without adding visual weight.
- **Active border**: `1px solid rgba(193,127,89,0.3)` -- copper-tinted border for featured or active containers.
- **Accent rule**: `2px solid #c17f59` -- solid copper line used as a left-border accent on quote blocks and featured items, or as horizontal dividers.
- **Divider line**: `1px solid rgba(245,240,232,0.06)` -- nearly invisible separator for dense list content.

### Surface Hierarchy
On dark backgrounds, elevation is communicated through lightness rather than shadows alone:
1. **Background** (`#0d0d0d`) -- the darkest layer, the canvas.
2. **Surface** (`#1a1a1a`) -- cards and containers step up by becoming slightly lighter.
3. **Inset** (`#141414`) -- recessed areas sit between background and surface, subtly darker than cards.
4. **Elevated** (`#2a2a2a`) -- the highest non-overlay surface, used for nested content inside cards.

Copper-tinted ambient shadows (`rgba(197,127,89,0.04-0.08)`) add warmth to elevation and prevent the dark-on-dark layering from feeling cold or lifeless.

## 7. Do's and Don'ts

### Do
- Use copper (`#c17f59`) exclusively as the accent colour -- it is the entire chromatic identity of this style.
- Use Playfair Display only for display headings (32px and above) and big numbers -- never for body text or UI labels.
- Keep body text in Inter at weight 300-400 -- lightness keeps the reading experience relaxed and editorial.
- Use horizontal copper rules (2px, 60px wide) as section dividers -- they are the visual punctuation of this style.
- Maintain generous line height (1.60-1.65) for body text -- dark backgrounds demand more breathing room.
- Use uppercase + wide letter-spacing (2px) only for small labels and numbered item categories.
- Add warm-tinted shadows (`rgba(197,127,89,...)`) to elevation effects to stay on-palette.
- Use `border-left: 2px solid #c17f59` on quote blocks and comparison "preferred" sides.
- Limit each slide/section to one focal stat or headline -- editorial design lets single ideas breathe.

### Don't
- Don't use more than 2 accent colours per slide -- copper and muted gold only. No blues, greens, or reds.
- Don't use Playfair Display below 22px -- its high-contrast serifs become illegible at small sizes.
- Don't use pure white (`#ffffff`) for text -- always use cream (`#f5f0e8`) to preserve the warm tone.
- Don't use pure black (`#000000`) for backgrounds -- always use `#0d0d0d` for the subtle warmth difference.
- Don't apply bold weight (600+) to Inter body text -- it breaks the light, airy reading feel.
- Don't use rounded corners above 4px -- this style is sharp and architectural, not soft and friendly.
- Don't center-align body paragraphs -- only headlines, stats, and CTAs should be centered.
- Don't use gradients -- this is a flat, editorial palette. Depth comes from layering surfaces, not colour blends.
- Don't place more than 3 stat numbers in a single row -- each number needs space to command attention.
- Don't use decorative icons or emoji -- if an icon is needed, use a simple geometric shape (diamond, line, dot) in copper.

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
- **Cover slide**: Title centered vertically and horizontally. Copper rule above and below. Subtitle in muted gold.
- **Content slides**: Left-aligned text. One concept per slide. Number in copper (48px Playfair) at top-left; content below.
- **Stat slides**: Single stat centered. Big number at 72px. Label and description below.
- **Swipe indicator**: Small muted gold dots at bottom center, 8px diameter, 12px gap.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 72px for the title section.
- **Padding**: 60px left/right. 80px top/bottom margins.
- **Section spacing**: 64px vertical gap between major sections. Copper rules (60px wide, centered) between sections.
- **Vertical rhythm**: Alternate between full-width sections and 2-column grids. Use numbered items for sequential content, stat displays for key metrics, and quote blocks for testimonials.
- **Footer**: Muted gold text, 13px Inter, with a final copper rule above.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 80px. Section Heading becomes 56px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Left-heavy composition. Title and body text occupy the left 60% of the frame. Right 40% is breathing room or supporting content (stats, small illustrations).
- **Title slides**: Headline centered on frame. Copper rule centered. Subtitle below.
- **Content slides**: 2-column max for comparisons. Single column for narrative.
- **Stat slides**: Up to 3 stats in a row, evenly spaced across the full width.

### Poster (1080x1350px)
- **Typography**: Display Hero at 64px. Section Heading at 40px. Body at 16px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for headline. Middle third for key content (stats, list, or comparison). Bottom third for CTA or closing statement.
- **Vertical flow**: Content reads top-to-bottom with clear sections. Copper rules separate the three zones.
- **CTA placement**: Always in the bottom zone, centered, with generous padding above.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 72px in Playfair Display 700 with -1px letter-spacing (approximately 30% larger than Carousel 56px). Section Heading becomes 52px. Body Large becomes 22px in Inter 300-400. Copper numbering and labels scale to 16px with wide tracking.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 920px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Near-black (`#0d0d0d`) canvas runs edge-to-edge like heavy black stock. Generous vertical breathing room between elements preserves the unhurried magazine rhythm.
- **Cover slide**: Thin copper (`#c17f59`) horizontal rule 60px wide centered above the headline. Playfair Display headline at 72px in warm cream, tight -1px tracking, 2-3 lines deep. Copper rule below. Subtitle in Inter 300 at 22px in muted gold below the second rule. The whole composition whispers -- like the opening spread of a private members' magazine.
- **Content slides**: Copper uppercase label at 16px with 2px tracking at the top of the content block. Playfair Display sub-heading at 52px in cream with italic pull-quote treatment when apt. Inter 300-400 body at 22px in cream below. A single thin copper rule separates heading from body. One idea per slide, heavily rested on whitespace.
- **CTA slide**: Playfair Display headline at 56px centered in the middle zone. Short Inter 300 subtitle. Copper pill button (`#c17f59`) with cream Inter 600 uppercase text and a warm `rgba(197,127,89,0.2)` glow shadow. Thin copper rule closes the composition below.
- **Progress indicator**: Whisper-thin segments 1px tall at the top of the safe zone -- inactive at `rgba(245,240,232,0.15)`, active in solid copper. No glow, no animation -- just letterpress-quiet structural marks.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Midnight | `#0d0d0d` | Primary background |
| Cream | `#f5f0e8` | Primary text |
| Copper | `#c17f59` | Accent: numbers, rules, CTAs, focal points |
| Muted Gold | `#a89067` | Secondary accent: borders, captions, labels |
| Warm White | `#ede7db` | Hover state text, high-emphasis body |
| Deep Copper | `#9a6347` | Hover/active state for copper elements |
| Charcoal | `#1a1a1a` | Card/container surface |
| Surface Inset | `#141414` | Recessed panels, code blocks |
| Dark Gray | `#2a2a2a` | Nested containers, elevated surfaces |
| Medium Gray | `#4a4a4a` | Disabled text, subtle dividers |
| Soft Gray | `#6b6b6b` | Tertiary text, descriptions |
| Light Gray | `#8a8a8a` | De-emphasized captions |

### Font Declarations

```css
font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors — Primary */
  --color-midnight: #0d0d0d;
  --color-cream: #f5f0e8;
  --color-copper: #c17f59;

  /* Colors — Accent */
  --color-muted-gold: #a89067;
  --color-warm-white: #ede7db;
  --color-deep-copper: #9a6347;

  /* Colors — Neutral Scale */
  --color-charcoal: #1a1a1a;
  --color-dark-gray: #2a2a2a;
  --color-medium-gray: #4a4a4a;
  --color-soft-gray: #6b6b6b;
  --color-light-gray: #8a8a8a;

  /* Colors — Surfaces */
  --color-surface-primary: #1a1a1a;
  --color-surface-inset: #141414;

  /* Colors — Borders */
  --color-border-default: rgba(245, 240, 232, 0.1);
  --color-border-accent: rgba(193, 127, 89, 0.3);
  --color-border-strong: rgba(245, 240, 232, 0.2);
  --color-divider-rule: #c17f59;

  /* Colors — Shadows */
  --shadow-warm: rgba(197, 127, 89, 0.08);
  --shadow-deep: rgba(0, 0, 0, 0.4);
  --shadow-soft: rgba(0, 0, 0, 0.2);
  --shadow-ambient: rgba(197, 127, 89, 0.04);

  /* Typography — Families */
  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography — Sizes */
  --text-display-hero: 72px;
  --text-section-heading: 48px;
  --text-sub-heading: 32px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number: 64px;
  --text-label: 14px;
  --text-cta: 15px;

  /* Typography — Weights */
  --weight-display: 700;
  --weight-display-heavy: 900;
  --weight-body-light: 300;
  --weight-body: 400;
  --weight-label: 600;

  /* Typography — Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.10;
  --leading-sub-heading: 1.15;
  --leading-body-large: 1.60;
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
  --space-hero: 60px;
  --space-max: 80px;

  /* Borders */
  --radius-standard: 4px;

  /* Shadows — Composed */
  --shadow-card: rgba(0,0,0,0.3) 0px 8px 24px, rgba(197,127,89,0.04) 0px 0px 12px;
  --shadow-featured: rgba(0,0,0,0.4) 0px 16px 40px, rgba(197,127,89,0.08) 0px 0px 20px;
}
```

### System Font Fallbacks
- **Serif (if Playfair Display fails to load):** `Georgia, 'Times New Roman', serif`
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
