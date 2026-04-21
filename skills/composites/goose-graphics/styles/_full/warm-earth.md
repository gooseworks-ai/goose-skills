# Design Style: Warm Earth

## 1. Visual Theme & Atmosphere

Warm Earth is the design language of handmade quality and Mediterranean warmth -- the visual equivalent of a sun-bleached terracotta courtyard, a handwritten recipe on cream paper, a linen-wrapped journal from a coastal bookshop. The warm cream canvas (`#faf3eb`) is not merely a background; it is the colour of parchment, of unbleached cotton, of morning light on plaster walls. Every element placed upon it inherits that warmth, creating compositions that feel tactile, inviting, and deeply human.

The typeface choice -- Nunito for both display and body -- reinforces this philosophy of approachable craft. Nunito is a rounded sans-serif whose soft terminals and generous letter spacing create a friendly, open voice without ever becoming childish or casual. At display sizes (48px+), its rounded forms at weight 700-800 produce headlines that feel welcoming and substantial, like hand-painted shop signage. At body sizes, lighter weights (300-400) maintain excellent readability while preserving the rounded warmth. The single-family approach keeps the visual identity cohesive: hierarchy comes from size and weight, while the consistent rounded character ensures every piece of text feels like it belongs to the same story.

Terracotta (`#c67a4a`) is the accent that gives this system its soul. It is the colour of clay pots, of desert sunsets, of aged brick -- a warm orange-brown that feels both ancient and alive. Used for accent lines, numbering, CTAs, and focal points, it carries an organic energy that synthetic colours cannot replicate. Sage green (`#7a9e7e`) serves as the secondary accent, bringing the natural complement to the warm palette -- the colour of olive leaves, of herb gardens, of aged copper patina. Together, terracotta and sage create a palette rooted in the natural world: earth and plant, clay and leaf, warmth and shade. Soft rounded corners (12-16px) on containers echo Nunito's rounded terminals, creating a visual consistency between type and layout. Warm shadows with brown undertones (`rgba(61,43,31,0.08)`) keep elevation effects on-palette, ensuring that even depth feels organic.

**Key Characteristics:**
- Warm cream background (`#faf3eb`) as the dominant surface -- the warmth of unbleached paper, not the sterility of white
- Dark brown (`#3d2b1f`) for all primary text -- a rich, readable brown warmer than black
- Nunito for all typography -- rounded sans-serif, friendly and approachable at every weight
- Terracotta (`#c67a4a`) as the primary accent for numbering, rules, CTAs, and focal elements
- Sage green (`#7a9e7e`) as the secondary accent for supporting elements, tags, and natural contrast
- Soft rounded corners (12-16px) on all containers -- echoing the rounded terminals of Nunito
- Warm brown-tinted shadows using `rgba(61,43,31,0.08)` -- elevation that stays earthy and organic
- Natural, flowing spacing -- generous but not stark, comfortable but not cramped
- Textural warmth -- every element should feel like it could exist on handmade paper

## 2. Color Palette & Roles

### Primary
- **Cream** (`#faf3eb`): Primary background. A warm off-white with yellow-pink undertone, like sun-warmed parchment.
- **Dark Brown** (`#3d2b1f`): Primary text colour. A rich brown-black with warm undertones -- the colour of dark roasted coffee or aged walnut.
- **Terracotta** (`#c67a4a`): Primary accent. Used for numbering, horizontal rules, CTA buttons, and focal-point elements. The earthy signature colour.

### Accent
- **Sage Green** (`#7a9e7e`): Secondary accent for tags, supporting highlights, success states, and natural contrast against terracotta.
- **Deep Sage** (`#5c8060`): Darker sage for hover/active states on green interactive elements.
- **Warm Tan** (`#d4a574`): Lighter terracotta variant for borders, decorative elements, and secondary emphasis.
- **Deep Terracotta** (`#a85e30`): Darker terracotta for hover/active states on primary interactive elements.

### Neutral Scale
- **Linen** (`#f5ece0`): Elevated surface -- cards, containers, and content panels sitting above the cream background.
- **Sand** (`#ebe0d0`): Secondary surface for nested containers, input fields, and inset areas.
- **Tan Border** (`#d9cbb8`): Visible border for inputs, dividers, and structural lines.
- **Warm Medium** (`#a89a8a`): Disabled text, placeholder content, and subtle dividers.
- **Clay Gray** (`#8a7b6b`): Tertiary text for timestamps, metadata, and low-priority labels.
- **Earth Gray** (`#6b5d4f`): Secondary body text and descriptions.

### Surface & Borders
- **Surface Primary** (`#f5ece0`): Card and container background.
- **Surface Inset** (`#f0e6d8`): Recessed areas, code blocks, and inset panels.
- **Border Default** (`rgba(61,43,31,0.12)`): Standard warm border for cards and dividers.
- **Border Accent** (`rgba(198,122,74,0.3)`): Terracotta-tinted border for active or featured elements.
- **Border Strong** (`rgba(61,43,31,0.2)`): Higher-contrast border for prominent containers.
- **Divider Rule** (`#c67a4a`): Solid terracotta for horizontal accent rules (typically 2px height).

### Shadow Colors
- **Shadow Warm** (`rgba(61,43,31,0.08)`): Primary shadow -- brown-tinted ambient for on-palette elevation.
- **Shadow Deep** (`rgba(61,43,31,0.16)`): Deep shadow for high-elevation elements like modals.
- **Shadow Soft** (`rgba(61,43,31,0.05)`): Standard shadow layer for cards and containers.
- **Shadow Ambient** (`rgba(198,122,74,0.04)`): Subtle terracotta ambient for barely-there warmth.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap" rel="stylesheet">
```

- **Display**: `'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Nunito | 72px | 800 | 1.10 | -1px | Cover headlines, single impactful statement |
| Section Heading | Nunito | 48px | 700 | 1.15 | -0.5px | Major section titles |
| Sub-heading | Nunito | 32px | 700 | 1.20 | -0.25px | Subsection titles, card headings |
| Body Large | Nunito | 20px | 300 | 1.70 | 0px | Lead paragraphs, introductions |
| Body | Nunito | 16px | 400 | 1.70 | 0.1px | Standard reading text |
| Small / Caption | Nunito | 13px | 400 | 1.50 | 0.3px | Metadata, attributions, timestamps |
| Big Numbers | Nunito | 64px | 800 | 1.00 | -0.5px | Statistics, key metrics, hero data |
| Numbered Label | Nunito | 14px | 600 | 1.00 | 1.5px | Uppercase step labels ("01 -- HARVEST") |
| CTA Text | Nunito | 15px | 700 | 1.00 | 0.5px | Button and call-to-action text |

### Principles
- **Rounded warmth at every size**: Nunito's soft, rounded terminals are the typographic expression of this style's personality. The rounded forms should be visible even at display sizes -- never use a tight tracking that obscures them.
- **Heavier display weights**: Unlike sharp geometric fonts that look best at 700, Nunito benefits from 800 weight at hero sizes. The extra weight gives the rounded forms substance and presence.
- **Generous line height for body**: 1.70 for body text (slightly more than typical) creates a relaxed, unhurried reading pace that matches the organic theme.
- **Minimal negative tracking**: Because Nunito's letterforms are already round and open, aggressive negative tracking works against the design. Limit tracking to -1px at the largest sizes.
- **Moderate letter-spacing at small sizes**: Captions and labels use 0.3px-1.5px tracking for legibility, consistent with the open, breathable feel.
- **Uppercase sparingly**: Reserve uppercase + wide tracking for numbered labels and CTA buttons. Headlines are always mixed case to preserve the friendly, conversational tone.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: var(--color-cream); padding: 80px 60px; text-align: center;">
  <div style="width: 60px; height: 3px; background: var(--color-terracotta); margin: 0 auto 32px; border-radius: 2px;"></div>
  <h1 style="font-family: var(--font-display); font-size: 72px; font-weight: 800; line-height: 1.10; letter-spacing: -1px; color: var(--color-dark-brown); margin: 0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 300; line-height: 1.70; color: var(--color-earth-gray); max-width: 600px; margin: 0 auto;">How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.</p>
  <div style="width: 60px; height: 3px; background: var(--color-terracotta); margin: 40px auto 0; border-radius: 2px;"></div>
</div>
```

### Numbered Item

```html
<div style="display: flex; gap: 24px; align-items: flex-start; padding: 32px 0; border-bottom: 1px solid rgba(61,43,31,0.12);">
  <span style="font-family: var(--font-display); font-size: 48px; font-weight: 800; line-height: 1.00; color: var(--color-terracotta); min-width: 72px;">01</span>
  <div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-sage); margin: 0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.20; letter-spacing: -0.25px; color: var(--color-dark-brown); margin: 0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.70; color: var(--color-earth-gray); margin: 0;">Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 24px; background: var(--color-linen); border: 1px solid rgba(61,43,31,0.12); border-radius: 16px;">
  <p style="font-family: var(--font-display); font-size: 64px; font-weight: 800; line-height: 1.00; letter-spacing: -0.5px; color: var(--color-terracotta); margin: 0 0 8px;">47%</p>
  <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-dark-brown); margin: 0 0 12px;">FASTER RESPONSE</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.70; color: var(--color-earth-gray); max-width: 280px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: rgba(61,43,31,0.12); border-radius: 16px; overflow: hidden;">
  <div style="background: var(--color-linen); padding: 40px 32px;">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; letter-spacing: 0.3px; color: var(--color-clay-gray); margin: 0 0 16px;">Without Goose</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.20; letter-spacing: -0.25px; color: var(--color-dark-brown); margin: 0 0 16px;">Manual & Fragmented</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.70; color: var(--color-earth-gray); margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
  </div>
  <div style="background: var(--color-linen); padding: 40px 32px; border-left: 3px solid var(--color-terracotta);">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; letter-spacing: 0.3px; color: var(--color-terracotta); margin: 0 0 16px;">With Goose</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 700; line-height: 1.20; letter-spacing: -0.25px; color: var(--color-dark-brown); margin: 0 0 16px;">Orchestrated & Autonomous</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.70; color: var(--color-earth-gray); margin: 0;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid rgba(61,43,31,0.12);">
  <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; background: rgba(122,158,126,0.15); border-radius: 12px; color: var(--color-sage); font-size: 18px;">&#9679;</div>
  <div>
    <h4 style="font-family: var(--font-display); font-size: 22px; font-weight: 700; line-height: 1.25; color: var(--color-dark-brown); margin: 0 0 8px;">Persistent Memory</h4>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.70; color: var(--color-earth-gray); margin: 0;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 48px 40px; border-left: 3px solid var(--color-terracotta); background: var(--color-surface-inset); border-radius: 0 16px 16px 0;">
  <p style="font-family: var(--font-display); font-size: 32px; font-weight: 400; font-style: italic; line-height: 1.35; letter-spacing: -0.25px; color: var(--color-dark-brown); margin: 0 0 24px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 32px; height: 3px; background: var(--color-terracotta); border-radius: 2px;"></div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-clay-gray); margin: 0;">SARAH CHEN, VP OPERATIONS</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: var(--color-linen); border: 1px solid rgba(198,122,74,0.3); border-radius: 16px;">
  <h2 style="font-family: var(--font-display); font-size: 40px; font-weight: 700; line-height: 1.15; letter-spacing: -0.5px; color: var(--color-dark-brown); margin: 0 0 16px;">Ready to meet your team?</h2>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 300; line-height: 1.70; color: var(--color-earth-gray); max-width: 480px; margin: 0 auto 32px;">Deploy your first AI coworker in under five minutes. No setup fees, no long-term commitments.</p>
  <a style="display: inline-block; background: var(--color-terracotta); color: var(--color-cream); font-family: var(--font-body); font-size: 15px; font-weight: 700; letter-spacing: 0.5px; text-decoration: none; padding: 16px 40px; border-radius: 12px;">Get Started</a>
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
- **Horizontal rules**: 3px tall with rounded ends (border-radius: 2px), terracotta (`#c67a4a`), 60px wide, centered -- used as section dividers and decorative accents. The rounded rule ends reinforce the soft, organic feel.
- **Vertical rhythm**: Maintain consistent 48px gaps between top-level sections. Use 24px gaps between items within a section.
- **Content gravity**: On widescreen slides (1920x1080), anchor content to the left two-thirds of the frame. Leave the right third as breathing room or for supporting imagery.
- **Organic flow**: Avoid rigid grids where possible. Let content breathe with generous but not mechanical spacing. The overall feel should be comfortable, like a well-set table.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#faf3eb` | Page canvas, base layer |
| Subtle (Level 1) | `rgba(61,43,31,0.05) 0px 2px 8px` | Slight lift for list items on hover |
| Card (Level 2) | `rgba(61,43,31,0.08) 0px 8px 24px, rgba(198,122,74,0.04) 0px 0px 12px` | Standard card and container elevation |
| Featured (Level 3) | `rgba(61,43,31,0.12) 0px 16px 40px, rgba(198,122,74,0.06) 0px 0px 20px` | Featured cards, quote blocks, hero elements |
| Overlay (Level 4) | `rgba(61,43,31,0.2) 0px 24px 60px` | Modals, overlays, high-priority popups |

### Border Treatments
- **Standard border**: `1px solid rgba(61,43,31,0.12)` -- warm, barely visible brown line that defines edges while maintaining the organic feel.
- **Active border**: `1px solid rgba(198,122,74,0.3)` -- terracotta-tinted border for featured or active containers.
- **Accent rule**: `3px solid #c67a4a` with `border-radius: 2px` -- rounded terracotta line used as a left-border accent on quote blocks and featured items, or as horizontal dividers.
- **Divider line**: `1px solid rgba(61,43,31,0.08)` -- nearly invisible separator for dense list content.

### Surface Hierarchy
On warm cream backgrounds, elevation is communicated through subtle warmth shifts:
1. **Background** (`#faf3eb`) -- the warmest, brightest layer, the canvas.
2. **Surface** (`#f5ece0`) -- cards and containers step up by becoming slightly more saturated.
3. **Inset** (`#f0e6d8`) -- recessed areas are a touch deeper and warmer than the card surface.
4. **Elevated** (`#ebe0d0`) -- the highest non-overlay surface, noticeably warmer for nested content inside cards.

Brown-tinted shadows (`rgba(61,43,31,0.05-0.12)`) and terracotta ambient glows (`rgba(198,122,74,0.04-0.06)`) ensure that depth effects feel like natural shadow cast by warm light, not cold digital drops.

## 7. Do's and Don'ts

### Do
- Use terracotta (`#c67a4a`) as the primary accent and sage green (`#7a9e7e`) as the secondary -- they are the earth-and-plant pairing that defines this style.
- Use Nunito at weight 800 for hero headlines and big numbers -- the extra-bold rounded forms have real visual impact.
- Keep body text in Nunito at weight 300-400 -- lightness keeps the reading experience relaxed and natural.
- Use rounded corners (12-16px) on all containers and cards -- consistency between rounded type and rounded layout is essential.
- Maintain generous line height (1.70) for body text -- the warm palette invites a leisurely reading pace.
- Use rounded terracotta rules (3px, 60px wide, border-radius: 2px) as section dividers -- they are the visual punctuation of this style.
- Add brown-tinted shadows (`rgba(61,43,31,...)`) to elevation effects to stay on-palette.
- Use `border-left: 3px solid #c67a4a` with rounded ends on quote blocks and comparison "preferred" sides.
- Allow sage green backgrounds (`rgba(122,158,126,0.15)`) for icon containers and tag fills.

### Don't
- Don't use sharp corners (0-4px radius) -- everything in this style has rounded edges that match the type.
- Don't use saturated or synthetic colours (neon, electric blue, hot pink) -- every colour should feel like it exists in nature.
- Don't use Nunito below weight 300 -- the rounded terminals lose definition at thin weights.
- Don't use pure white (`#ffffff`) for backgrounds -- always use cream (`#faf3eb`) or warmer to preserve the earthy tone.
- Don't use pure black (`#000000`) for text -- always use dark brown (`#3d2b1f`) for warm contrast.
- Don't apply weight 800 to body text -- reserve extra-bold for display sizes (48px+) only.
- Don't use more than 2 accent colours per slide -- terracotta and sage only. No blues, purples, or bright reds.
- Don't center-align body paragraphs -- only headlines, stats, and CTAs should be centered.
- Don't use cold-toned shadows (pure `rgba(0,0,0,...)`) -- always tint shadows with brown to maintain palette warmth.
- Don't place more than 3 stat numbers in a single row -- each number needs space to feel organic, not crammed.

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
- **Cover slide**: Title centered vertically and horizontally. Terracotta rule above and below (60px wide, 3px tall, rounded). Subtitle in earth gray.
- **Content slides**: Left-aligned text. One concept per slide. Number in terracotta (48px Nunito weight 800) at top-left; content below.
- **Stat slides**: Single stat centered. Big number at 64px. Label and description below.
- **Swipe indicator**: Small sage green dots at bottom center, 8px diameter, 12px gap. Active dot in terracotta.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 72px for the title section.
- **Padding**: 60px left/right. 80px top/bottom margins.
- **Section spacing**: 64px vertical gap between major sections. Rounded terracotta rules (60px wide, centered) between sections.
- **Vertical rhythm**: Alternate between full-width sections and 2-column grids. Use numbered items for sequential content, stat displays for key metrics, and quote blocks for testimonials.
- **Footer**: Clay gray text, 13px Nunito, with a final terracotta rule above.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 80px. Section Heading becomes 56px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Left-heavy composition. Title and body text occupy the left 60% of the frame. Right 40% is breathing room or supporting content (stats, organic illustrations).
- **Title slides**: Headline centered on frame. Terracotta rule centered. Subtitle below.
- **Content slides**: 2-column max for comparisons. Single column for narrative.
- **Stat slides**: Up to 3 stats in a row, evenly spaced across the full width, each in a rounded container.

### Poster (1080x1350px)
- **Typography**: Display Hero at 64px. Section Heading at 40px. Body at 16px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for headline with terracotta rule. Middle third for key content (stats, list, or comparison). Bottom third for CTA or closing statement.
- **Vertical flow**: Content reads top-to-bottom with clear sections. Terracotta rules separate the three zones with organic rhythm.
- **CTA placement**: Always in the bottom zone, centered, with generous padding above. Terracotta button with rounded corners.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 72px in Nunito 700-800 (approximately 30% larger than Carousel 56px). Section Heading becomes 52px. Body Large becomes 22px in Nunito 400. Numbering labels stay in Nunito 600 uppercase.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 920px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Warm cream background (`#faf3eb`) runs edge-to-edge -- sun-warmed parchment carrying through the whole vertical frame.
- **Cover slide**: Short terracotta (`#c67a4a`) rule 2px tall, 80px wide, with rounded caps, centered above the headline. Nunito 700-800 headline at 72px in dark brown (`#3d2b1f`), stacked in 2-3 lines with the rounded terminals feeling handmade. Nunito 400 subtitle below at 22px in warm medium brown. A second terracotta rule closes the composition. Every curve and radius echoes the rounded sans-serif terminals.
- **Content slides**: One idea per slide, framed in a soft-cornered card (12-16px radius) with warm brown-tinted shadow (`rgba(61,43,31,0.08)`). Terracotta number or rule anchors the top, Nunito 700 sub-heading at 44px in dark brown, Nunito 400 body at 22px. Sage green (`#7a9e7e`) accents for success indicators or tags.
- **CTA slide**: Headline at 56px in Nunito 800 dark brown. Short Nunito 400 subtitle. Terracotta pill button with 16px border-radius and cream Nunito 700 CTA text. Everything tactile, inviting, like it could exist on handmade paper.
- **Progress indicator**: Soft rounded pill segments at the top of the safe zone (4px tall, fully rounded) -- inactive in `rgba(61,43,31,0.15)`, active in terracotta (`#c67a4a`). Rounded segments match Nunito's rounded terminals -- visual consistency between type and chrome.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Cream | `#faf3eb` | Primary background |
| Dark Brown | `#3d2b1f` | Primary text |
| Terracotta | `#c67a4a` | Accent: numbers, rules, CTAs, focal points |
| Sage Green | `#7a9e7e` | Secondary accent: tags, icons, natural contrast |
| Deep Sage | `#5c8060` | Hover/active state for sage elements |
| Warm Tan | `#d4a574` | Lighter terracotta variant, decorative borders |
| Deep Terracotta | `#a85e30` | Hover/active state for terracotta elements |
| Linen | `#f5ece0` | Card/container surface |
| Surface Inset | `#f0e6d8` | Recessed panels, code blocks |
| Sand | `#ebe0d0` | Nested containers, elevated surfaces |
| Tan Border | `#d9cbb8` | Structural borders, input fields |
| Warm Medium | `#a89a8a` | Disabled text, subtle dividers |
| Clay Gray | `#8a7b6b` | Tertiary text, descriptions |
| Earth Gray | `#6b5d4f` | Secondary text, body descriptions |

### Font Declarations

```css
font-family: 'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-cream: #faf3eb;
  --color-dark-brown: #3d2b1f;
  --color-terracotta: #c67a4a;

  /* Colors -- Accent */
  --color-sage: #7a9e7e;
  --color-deep-sage: #5c8060;
  --color-warm-tan: #d4a574;
  --color-deep-terracotta: #a85e30;

  /* Colors -- Neutral Scale */
  --color-linen: #f5ece0;
  --color-sand: #ebe0d0;
  --color-tan-border: #d9cbb8;
  --color-warm-medium: #a89a8a;
  --color-clay-gray: #8a7b6b;
  --color-earth-gray: #6b5d4f;

  /* Colors -- Surfaces */
  --color-surface-primary: #f5ece0;
  --color-surface-inset: #f0e6d8;

  /* Colors -- Borders */
  --color-border-default: rgba(61, 43, 31, 0.12);
  --color-border-accent: rgba(198, 122, 74, 0.3);
  --color-border-strong: rgba(61, 43, 31, 0.2);
  --color-divider-rule: #c67a4a;

  /* Colors -- Shadows */
  --shadow-warm: rgba(61, 43, 31, 0.08);
  --shadow-deep: rgba(61, 43, 31, 0.16);
  --shadow-soft: rgba(61, 43, 31, 0.05);
  --shadow-ambient: rgba(198, 122, 74, 0.04);

  /* Typography -- Families */
  --font-display: 'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

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
  --weight-display: 800;
  --weight-heading: 700;
  --weight-body-light: 300;
  --weight-body: 400;
  --weight-label: 600;
  --weight-cta: 700;

  /* Typography -- Line Heights */
  --leading-display: 1.10;
  --leading-heading: 1.15;
  --leading-sub-heading: 1.20;
  --leading-body-large: 1.70;
  --leading-body: 1.70;
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
  --radius-standard: 16px;
  --radius-small: 12px;
  --radius-rule: 2px;

  /* Shadows -- Composed */
  --shadow-card: rgba(61,43,31,0.08) 0px 8px 24px, rgba(198,122,74,0.04) 0px 0px 12px;
  --shadow-featured: rgba(61,43,31,0.12) 0px 16px 40px, rgba(198,122,74,0.06) 0px 0px 20px;
}
```

### System Font Fallbacks
- **Sans-serif (if Nunito fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
