# Design Style: Peach Pop

## 1. Visual Theme & Atmosphere

Peach Pop is the design language of modern DTC beauty and wellness brands -- the visual equivalent of a curated shelfie on a warm morning, a skincare routine laid out on a marble countertop, a playful unboxing video filmed in golden hour light. The warm peach canvas (`#fce8d8`) is not simply a background; it is the colour of flushed skin, of ripe apricots, of a sun-warmed blush compact. Every element placed upon it inherits that gentle warmth, creating compositions that feel fresh, approachable, and confidently feminine without being precious.

The typographic system pairs two distinct voices: Space Mono for testimonials and featured text, and DM Sans for attribution and supporting copy. Space Mono -- a fixed-width typeface with geometric personality -- delivers testimonial quotes in uppercase with wide tracking, giving customer words the authority of a product label or packaging callout. Its monospaced letterforms feel intentional and designed, like text stamped onto a product box. DM Sans, a clean geometric sans-serif, handles names, labels, and smaller text with quiet professionalism. This mono-plus-sans pairing is a hallmark of contemporary DTC brands that want to feel both editorial and accessible -- think Glossier's packaging meets a tech-forward skincare startup.

Cornflower blue (`#3B9BFF`) is the accent that electrifies this otherwise warm palette. It arrives as bold geometric blocks -- checkerboard patterns and offset squares -- flanking the central product image, creating a visual pop that is impossible to scroll past. The blue is not decorative filler; it is a strategic contrast agent. Against the warm peach, it creates maximum chromatic tension without conflict, the way a bright blue sky frames a terracotta building. Blue five-pointed stars serve as rating indicators, reinforcing the accent colour's role as the voice of social proof and trust. The overall effect is playful, confident, and clean -- a brand that takes its formulations seriously but never takes itself too seriously.

**Key Characteristics:**
- Warm peach background (`#fce8d8`) as the dominant surface -- the warmth of sun-kissed skin, not sterile white
- Near-black (`#1a1a2e`) for primary text -- a deep navy-black that is softer than pure black
- Cornflower blue (`#3B9BFF`) as the sole accent colour for stars, decorative blocks, and interactive elements
- Space Mono (monospace) for testimonial headlines -- uppercase, tracked, bold, stamp-like authority
- DM Sans for attribution text and supporting labels -- clean, geometric, quietly professional
- Geometric block patterns (checkerboard/offset squares) as decorative framing elements in the accent blue
- Rounded corners (12-16px) on product images and photo containers
- Flat design with minimal shadow -- depth comes from colour contrast and geometric layering, not elevation
- Star ratings in accent blue (`#3B9BFF`) as a recurring social proof motif
- Center-aligned testimonial text blocks arranged in a 2x2 grid around a central product image

## 2. Color Palette & Roles

### Primary
- **Peach** (`#fce8d8`): Primary background. A warm, rosy off-white with pink-orange undertone, like the inside of a seashell or the lightest peach skin.
- **Dark Navy** (`#1a1a2e`): Primary text colour. A near-black with cool blue undertone -- softer than true black, crisp against the warm background.
- **Cornflower Blue** (`#3B9BFF`): Primary accent. Used for star ratings, geometric decorative blocks, interactive elements, and all emphasis. The singular pop colour.

### Accent
- **Deep Blue** (`#2878D0`): Darker blue for hover/active states on interactive elements and pressed geometric blocks.
- **Light Peach** (`#fdd9c4`): Slightly deeper peach for subtle emphasis, borders, and hover states on the warm surface.
- **Pale Blue** (`#8CC5FF`): Lighter tint of the accent for backgrounds of secondary containers or subtle highlights.

### Neutral Scale
- **Cream** (`#fef4ec`): Elevated surface -- cards, photo containers, and content panels sitting above the peach background.
- **Blush** (`#f5d6c3`): Secondary surface for nested containers and inset areas.
- **Warm Border** (`#e8c4ad`): Visible border for dividers and structural lines.
- **Dusty Rose** (`#b89a8a`): Disabled text, placeholder content, and subtle dividers.
- **Warm Gray** (`#8a7668`): Tertiary text for timestamps, metadata, and low-priority labels.
- **Cocoa** (`#5c4a3e`): Secondary body text and descriptions.

### Surface & Borders
- **Surface Primary** (`#fef4ec`): Card and photo container background.
- **Surface Inset** (`#f8e4d2`): Recessed areas and inset panels within the peach canvas.
- **Border Default** (`rgba(26,26,46,0.10)`): Standard subtle border for cards and dividers.
- **Border Accent** (`rgba(59,155,255,0.3)`): Blue-tinted border for active or featured elements.
- **Border Strong** (`rgba(26,26,46,0.18)`): Higher-contrast border for prominent containers.
- **Divider Rule** (`#3B9BFF`): Solid blue for accent rules and decorative lines (typically 3px height).

### Shadow Colors
- **Shadow Warm** (`rgba(26,26,46,0.06)`): Primary shadow -- cool-tinted ambient for subtle elevation.
- **Shadow Deep** (`rgba(26,26,46,0.14)`): Deep shadow for high-elevation elements like modals.
- **Shadow Soft** (`rgba(26,26,46,0.04)`): Nearly invisible shadow for cards and containers.
- **Shadow Blue** (`rgba(59,155,255,0.06)`): Subtle blue ambient glow for accent-adjacent elements.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
```

- **Display**: `'Space Mono', 'Courier New', monospace`
- **Body**: `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Space Mono | 56px | 700 | 1.10 | 2px | Uppercase, hero statement, monospaced impact |
| Section Heading | Space Mono | 36px | 700 | 1.15 | 1.5px | Uppercase, major section titles |
| Testimonial Quote | Space Mono | 22px | 700 | 1.30 | 1px | Uppercase, customer quotes -- the signature element |
| Sub-heading | DM Sans | 28px | 700 | 1.25 | -0.25px | Subsection titles, product names |
| Body Large | DM Sans | 20px | 400 | 1.65 | 0px | Lead paragraphs, introductions |
| Body | DM Sans | 16px | 400 | 1.65 | 0.1px | Standard reading text |
| Attribution | DM Sans | 13px | 400 | 1.40 | 1.5px | Uppercase, customer names below quotes |
| Small / Caption | DM Sans | 12px | 400 | 1.50 | 0.3px | Metadata, footnotes |
| Big Numbers | Space Mono | 64px | 700 | 1.00 | 0px | Statistics, key metrics |
| CTA Text | DM Sans | 15px | 700 | 1.00 | 0.5px | Button and call-to-action text |

### Principles
- **Monospace for authority**: Space Mono in uppercase with generous tracking transforms customer quotes into design elements with the weight of packaging copy. The monospaced grid gives each word equal visual presence.
- **Sans-serif for support**: DM Sans handles all secondary text -- names, labels, body copy. Its geometric simplicity never competes with the monospace headlines.
- **Uppercase is the default for display text**: All Space Mono usage is uppercase with positive letter-spacing (1-2px). This is non-negotiable -- it is the signature of the style.
- **Attribution in small caps style**: Customer names appear in DM Sans at 13px, uppercase, with wide tracking (1.5px), creating a quiet label that feels like fine print on a product box.
- **Generous line height for mono**: Monospace text at 1.30 line height ensures multi-line testimonials remain readable despite the inherently wider letterforms.
- **Weight contrast, not size contrast**: Headlines and quotes both use weight 700 in Space Mono. Hierarchy comes from size and tracking changes, not weight variation within the mono family.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: var(--color-peach); padding: 80px 60px; text-align: center;">
  <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 20px;">
    <span style="color: var(--color-blue); font-size: 24px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 24px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 24px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 24px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 24px;">&#9733;</span>
  </div>
  <h1 style="font-family: var(--font-display); font-size: 56px; font-weight: 700; line-height: 1.10; letter-spacing: 2px; text-transform: uppercase; color: var(--color-dark-navy); margin: 0 0 24px;">What Our Customers Say</h1>
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 400; line-height: 1.65; color: var(--color-cocoa); max-width: 540px; margin: 0 auto;">Real reviews from real people who made the switch.</p>
</div>
```

### Testimonial Card (Signature Element)

```html
<div style="text-align: center; padding: 32px 24px;">
  <div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 16px;">
    <span style="color: var(--color-blue); font-size: 18px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 18px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 18px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 18px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 18px;">&#9733;</span>
  </div>
  <p style="font-family: var(--font-display); font-size: 22px; font-weight: 700; line-height: 1.30; letter-spacing: 1px; text-transform: uppercase; color: var(--color-dark-navy); margin: 0 0 12px;">The only serum I actually finish.</p>
  <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-warm-gray); margin: 0;">Bianca Vieira</p>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 24px; background: var(--color-cream); border-radius: 16px;">
  <p style="font-family: var(--font-display); font-size: 64px; font-weight: 700; line-height: 1.00; color: var(--color-blue); margin: 0 0 8px;">97%</p>
  <p style="font-family: var(--font-display); font-size: 14px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-dark-navy); margin: 0 0 12px;">Would Recommend</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-cocoa); max-width: 280px; margin: 0 auto;">Based on 2,400+ verified customer reviews collected over the past year.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px; background: var(--color-warm-border); border-radius: 16px; overflow: hidden;">
  <div style="background: var(--color-cream); padding: 40px 32px;">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-warm-gray); margin: 0 0 16px;">Before</p>
    <h3 style="font-family: var(--font-display); font-size: 22px; font-weight: 700; line-height: 1.30; letter-spacing: 1px; text-transform: uppercase; color: var(--color-dark-navy); margin: 0 0 16px;">Dull & Uneven</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-cocoa); margin: 0;">Inconsistent texture, visible pores, and a tired complexion that no amount of concealer could fix.</p>
  </div>
  <div style="background: var(--color-cream); padding: 40px 32px; border-left: 3px solid var(--color-blue);">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-blue); margin: 0 0 16px;">After</p>
    <h3 style="font-family: var(--font-display); font-size: 22px; font-weight: 700; line-height: 1.30; letter-spacing: 1px; text-transform: uppercase; color: var(--color-dark-navy); margin: 0 0 16px;">Smooth & Glowing</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-cocoa); margin: 0;">Visibly refined pores, even tone, and a natural radiance after just four weeks of daily use.</p>
  </div>
</div>
```

### Geometric Accent Block (Decorative)

```html
<div style="position: relative; display: flex; gap: 8px; flex-wrap: wrap; width: 120px;">
  <div style="width: 52px; height: 52px; background: var(--color-blue); border-radius: 4px;"></div>
  <div style="width: 52px; height: 52px; background: var(--color-blue); border-radius: 4px;"></div>
  <div style="width: 52px; height: 52px; background: var(--color-blue); border-radius: 4px;"></div>
  <div style="width: 52px; height: 52px; background: transparent;"></div>
  <div style="width: 52px; height: 52px; background: transparent;"></div>
  <div style="width: 52px; height: 52px; background: var(--color-blue); border-radius: 4px;"></div>
</div>
```

### Product Image Container

```html
<div style="max-width: 320px; margin: 0 auto; border-radius: 16px; overflow: hidden; background: var(--color-cream);">
  <img src="product.jpg" style="width: 100%; height: auto; display: block; border-radius: 16px;" alt="Product image" />
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: var(--color-cream); border: 1px solid rgba(59,155,255,0.3); border-radius: 16px;">
  <div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 20px;">
    <span style="color: var(--color-blue); font-size: 20px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 20px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 20px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 20px;">&#9733;</span>
    <span style="color: var(--color-blue); font-size: 20px;">&#9733;</span>
  </div>
  <h2 style="font-family: var(--font-display); font-size: 36px; font-weight: 700; line-height: 1.15; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-dark-navy); margin: 0 0 16px;">Try It Risk-Free</h2>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.65; color: var(--color-cocoa); max-width: 420px; margin: 0 auto 32px;">Join thousands of happy customers. 30-day money-back guarantee.</p>
  <a style="display: inline-block; background: var(--color-blue); color: #ffffff; font-family: var(--font-body); font-size: 15px; font-weight: 700; letter-spacing: 0.5px; text-decoration: none; padding: 16px 40px; border-radius: 12px;">Shop Now</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between star icons in a rating row.
- **8px**: Tight gap -- between geometric blocks in decorative patterns.
- **12px**: Small gap -- between testimonial text and attribution name.
- **16px**: Base gap -- between star row and testimonial text, between body paragraphs.
- **24px**: Medium gap -- between components within a section, standard card internal padding.
- **32px**: Section internal -- padding inside testimonial cards, gap between grouped items.
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
- **Primary alignment**: Center-aligned for all testimonial blocks, star ratings, and headlines. Left-aligned only for longer body paragraphs in editorial contexts.
- **Grid**: Use a 2x2 grid for testimonial layouts with a central product image. 2-column for comparison layouts. Single-column for narrative content.
- **Geometric accents**: Blue block clusters are positioned at the left and right edges of the composition, flanking the central content. They occupy roughly 15-20% of the horizontal space on each side.
- **Vertical rhythm**: Maintain consistent 48px gaps between top-level sections. Use 16px gaps between items within a testimonial card (stars > text > name).
- **Content gravity**: The central axis is dominant. Product images and key content anchor to the vertical center. Testimonials distribute evenly in the four quadrants around the center.
- **Symmetry**: The overall composition is symmetrical across the vertical axis. Left-side decorative blocks mirror right-side blocks. Top testimonials mirror bottom testimonials.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#fce8d8` | Page canvas, base layer -- the default for this style |
| Subtle (Level 1) | `rgba(26,26,46,0.04) 0px 2px 8px` | Slight lift for photo containers on hover |
| Card (Level 2) | `rgba(26,26,46,0.06) 0px 6px 20px, rgba(59,155,255,0.04) 0px 0px 10px` | Product image containers and featured cards |
| Featured (Level 3) | `rgba(26,26,46,0.10) 0px 12px 32px, rgba(59,155,255,0.06) 0px 0px 16px` | Hero product showcases, modal-like overlays |
| Overlay (Level 4) | `rgba(26,26,46,0.18) 0px 20px 48px` | Full overlays and popups |

### Border Treatments
- **Standard border**: `1px solid rgba(26,26,46,0.10)` -- barely visible, cool-neutral line for subtle structure.
- **Active border**: `1px solid rgba(59,155,255,0.3)` -- blue-tinted border for featured or active containers.
- **Accent rule**: `3px solid #3B9BFF` -- blue line used as a left-border accent on comparison "preferred" sides or as horizontal dividers.
- **Divider line**: `1px solid rgba(26,26,46,0.06)` -- nearly invisible separator between list items.

### Surface Hierarchy
This style is predominantly flat. Depth is communicated through colour contrast rather than elevation:
1. **Background** (`#fce8d8`) -- the warm peach canvas, the foundation.
2. **Surface** (`#fef4ec`) -- photo containers and cards step up by becoming lighter and less saturated.
3. **Accent blocks** (`#3B9BFF`) -- geometric blue elements sit visually "on top" through pure chromatic contrast, not shadow.
4. **Product image** -- the photo itself, framed by the lighter surface container with rounded corners, is the focal point at the highest perceived depth.

Shadows are used sparingly. The style achieves layering through colour temperature shifts (warm background to cooler card surfaces) and the bold contrast of blue geometric elements.

## 7. Do's and Don'ts

### Do
- Use cornflower blue (`#3B9BFF`) as the only accent colour -- it is the singular pop that defines this style against the warm peach.
- Use Space Mono in uppercase with letter-spacing of 1-2px for all testimonial headlines and display text -- the monospaced uppercase treatment is the signature.
- Use DM Sans at weight 400 for attribution names and body text -- its quiet geometry supports without competing.
- Use five-pointed star ratings (&#9733;) in `#3B9BFF` as the standard social proof element -- stars always appear above the testimonial text.
- Use rounded corners (12-16px) on all photo containers and cards -- they soften the geometric rigour of the blue blocks.
- Use geometric blue block patterns (checkerboard or offset squares, ~50px blocks with ~8px gaps) as decorative framing elements on the left and right sides.
- Centre-align all testimonial cards -- quote text, star ratings, and attribution names are all centred.
- Keep the palette to three primary colours only: peach (`#fce8d8`), dark navy (`#1a1a2e`), and blue (`#3B9BFF`).
- Maintain at least 48px separation between testimonial cards to prevent visual crowding.

### Don't
- Don't introduce additional accent colours (no green, orange, red, or purple) -- the blue-on-peach contrast is the entire identity.
- Don't use Space Mono in lowercase or mixed case -- it must always be uppercase with positive letter-spacing.
- Don't use heavy drop shadows -- this is a flat, colour-driven style. Maximum shadow opacity is 0.10 for card-level elements.
- Don't use pure white (`#ffffff`) for backgrounds -- always use peach (`#fce8d8`) or cream (`#fef4ec`) to maintain warmth.
- Don't use pure black (`#000000`) for text -- use dark navy (`#1a1a2e`) for warm-cool balance.
- Don't place geometric blue blocks in the centre of the composition -- they are edge/framing elements only.
- Don't use serif fonts anywhere -- the mono-plus-sans pairing is the complete typographic system.
- Don't make geometric accent blocks rounded -- they should have minimal border-radius (0-4px) to contrast with the rounded photo containers.
- Don't use gradients on the background -- the peach should be a solid, flat colour.
- Don't set testimonial text below 18px -- monospace text loses readability at small sizes.
- Don't use more than 5 stars in a rating -- the five-star row is the standard unit.

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
- **Typography scale down**: Display Hero becomes 44px (from 56px). Testimonial Quote stays 22px. Attribution stays 13px.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Title centered vertically. Star row above title. Geometric blue blocks on left and right edges.
- **Testimonial slides**: One testimonial per slide, centered. Stars above, quote in the middle, name below. Geometric blocks on edges for brand continuity.
- **Product slide**: Product image centered with rounded container. 2-3 testimonial excerpts arranged around it.
- **Swipe indicator**: Small blue dots at bottom center, 8px diameter, 12px gap. Active dot in `#3B9BFF`, inactive in `rgba(59,155,255,0.3)`.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Hero at 56px for the title section.
- **Padding**: 60px left/right, 80px top/bottom margins.
- **Section spacing**: 64px vertical gap between major sections. Thin blue rule (3px, 60px wide, centered) between sections.
- **Testimonial grid**: Arrange testimonials in 2-column grid. Each card has stars, quote, and name. Alternate with stat displays and product images.
- **Geometric accents**: Blue block clusters at the top and bottom of the infographic, and optionally flanking the product image mid-page.
- **Footer**: Warm gray text, 12px DM Sans, with a final blue rule above.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 64px. Testimonial Quote becomes 28px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Symmetric composition. Title slides centred. Content slides can use 2-column or 3-column grids.
- **Title slides**: Headline centered. Star row above. Geometric blocks flanking the text block.
- **Testimonial slides**: 2-3 testimonials side by side with product image between them.
- **Stat slides**: Up to 3 stats in a row, each in a rounded container on cream background.

### Poster (1080x1350px)
- **Typography**: Display Hero at 48px. Testimonial Quote at 22px. Body at 16px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top zone for headline with star ratings. Middle zone for product image flanked by geometric blue blocks. Bottom zone for 2-4 testimonial cards in a 2x2 grid.
- **Vertical flow**: Stars and headline at top, product image in the optical centre, testimonials below. Geometric accents on the left and right edges of the middle zone.
- **CTA placement**: Below the testimonial grid, centered, with blue button and generous padding above.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 56px in Space Mono uppercase with wide tracking (approximately 30% larger than Carousel 44px). Testimonial Quote becomes 28px in Space Mono uppercase. Attribution in DM Sans at 16px. Star ratings in blue at 28px.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 920px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Warm peach background (`#fce8d8`) runs edge-to-edge so the sun-kissed-skin warmth fills the tall frame.
- **Cover slide**: Row of cornflower blue (`#3B9BFF`) stars centered above the headline. Space Mono uppercase headline at 56px with wide letter-spacing in dark navy (`#1a1a2e`), stacked in 2-3 lines. Blue geometric checkerboard or offset-square blocks flank the headline to the left and right, creating the signature chromatic tension against the peach canvas. DM Sans attribution below.
- **Content slides**: One testimonial per slide. Space Mono testimonial quote at 28px uppercase in dark navy centered, with a product image or photo container (12-16px radius) above or below. Blue geometric blocks decorate the edges. A horizontal row of blue star ratings sits above or below the quote. Keep the composition flat -- depth comes from color contrast and geometric layering, not shadows.
- **CTA slide**: Blue geometric blocks on both vertical edges. Space Mono headline at 44px centered in dark navy. Short DM Sans supporting copy. Bright blue (`#3B9BFF`) pill button with peach or white DM Sans 700 CTA text.
- **Progress indicator**: Row of blue filled squares (not circles -- the geometric square IS the motif) at the top of the safe zone, 8px squares with 6px gap. Inactive squares at 30% opacity, active at full opacity. Consistent with the checkerboard vocabulary.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Peach | `#fce8d8` | Primary background |
| Dark Navy | `#1a1a2e` | Primary text |
| Cornflower Blue | `#3B9BFF` | Accent: stars, geometric blocks, CTAs, focal points |
| Deep Blue | `#2878D0` | Hover/active state for blue elements |
| Light Peach | `#fdd9c4` | Subtle emphasis, borders |
| Pale Blue | `#8CC5FF` | Secondary highlights, light backgrounds |
| Cream | `#fef4ec` | Card/container surface, photo frames |
| Surface Inset | `#f8e4d2` | Recessed panels |
| Blush | `#f5d6c3` | Nested containers, elevated surfaces |
| Warm Border | `#e8c4ad` | Structural borders |
| Dusty Rose | `#b89a8a` | Disabled text, subtle dividers |
| Warm Gray | `#8a7668` | Tertiary text, attribution names |
| Cocoa | `#5c4a3e` | Secondary text, body descriptions |

### Font Declarations

```css
/* Display / Testimonials */
font-family: 'Space Mono', 'Courier New', monospace;

/* Body / Attribution */
font-family: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-peach: #fce8d8;
  --color-dark-navy: #1a1a2e;
  --color-blue: #3B9BFF;

  /* Colors -- Accent */
  --color-deep-blue: #2878D0;
  --color-light-peach: #fdd9c4;
  --color-pale-blue: #8CC5FF;

  /* Colors -- Neutral Scale */
  --color-cream: #fef4ec;
  --color-blush: #f5d6c3;
  --color-warm-border: #e8c4ad;
  --color-dusty-rose: #b89a8a;
  --color-warm-gray: #8a7668;
  --color-cocoa: #5c4a3e;

  /* Colors -- Surfaces */
  --color-surface-primary: #fef4ec;
  --color-surface-inset: #f8e4d2;

  /* Colors -- Borders */
  --color-border-default: rgba(26, 26, 46, 0.10);
  --color-border-accent: rgba(59, 155, 255, 0.3);
  --color-border-strong: rgba(26, 26, 46, 0.18);
  --color-divider-rule: #3B9BFF;

  /* Colors -- Shadows */
  --shadow-warm: rgba(26, 26, 46, 0.06);
  --shadow-deep: rgba(26, 26, 46, 0.14);
  --shadow-soft: rgba(26, 26, 46, 0.04);
  --shadow-blue: rgba(59, 155, 255, 0.06);

  /* Typography -- Families */
  --font-display: 'Space Mono', 'Courier New', monospace;
  --font-body: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 56px;
  --text-section-heading: 36px;
  --text-testimonial: 22px;
  --text-sub-heading: 28px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-attribution: 13px;
  --text-small: 12px;
  --text-big-number: 64px;
  --text-cta: 15px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-heading: 700;
  --weight-body: 400;
  --weight-body-light: 300;
  --weight-label: 400;
  --weight-cta: 700;

  /* Typography -- Line Heights */
  --leading-display: 1.10;
  --leading-heading: 1.15;
  --leading-testimonial: 1.30;
  --leading-sub-heading: 1.25;
  --leading-body-large: 1.65;
  --leading-body: 1.65;
  --leading-attribution: 1.40;
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
  --radius-block: 4px;
  --radius-none: 0px;

  /* Shadows -- Composed */
  --shadow-card: rgba(26,26,46,0.06) 0px 6px 20px, rgba(59,155,255,0.04) 0px 0px 10px;
  --shadow-featured: rgba(26,26,46,0.10) 0px 12px 32px, rgba(59,155,255,0.06) 0px 0px 16px;
}
```

### System Font Fallbacks
- **Monospace (if Space Mono fails to load):** `'Courier New', Courier, monospace`
- **Sans-serif (if DM Sans fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
