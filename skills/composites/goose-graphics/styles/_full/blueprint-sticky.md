# Design Style: Blueprint Sticky

## 1. Visual Theme & Atmosphere

Blueprint Sticky is the design language of a product launch caught mid-draft -- the visual equivalent of taking a screenshot of the Figma canvas right before the team ships. A saturated cobalt blue (`#2450F5`) floods the entire composition edge-to-edge, but the blue is never empty: a faint blueprint grid of thin lighter-blue lines crosshatches the whole background, evoking the dotted canvas of Figma, the guide rails of Notion, or an architect's technical drawing. The grid is the signature; it transforms a flat blue rectangle into a workspace, a surface on which ideas are still being pinned. This is not the calm navy of corporate finance or the sky blue of SaaS pastels -- it is the pure, electric, high-chroma blue of a design tool loading up for the first time.

The content sits on top of this grid as if it were dropped onto a digital desk. Two tilted sticky notes -- one candy pink (`#F4B8D4`), one bright highlighter yellow (`#F4E34A`) -- overlap at opposing angles, their rotations set just enough off-axis to feel physically placed but never enough to feel chaotic. The stickies carry the body copy in a handwritten-feeling sans serif, giving the composition a human annotation on top of the machined grid. Corner date labels in white Inter 600 anchor the composition top-left and top-right like a calendar event, while a massive bottom-left headline in Inter 900 at 80-100px -- "Product Launch" -- punches through in pure white with a small yellow curved underline accenting one key word. A tiny underlined URL (`www.zentime.com`) floats below the sticky stack, the sort of detail you'd type into a presenter note.

The result is a hybrid: half Figma launch-page screenshot, half scattered desk. It reads as contemporary, tool-native, and slightly handmade -- the design language of an indie SaaS launch tweet, a Notion release note, or a Product Hunt coming-soon page for a design-forward app. It differs sharply from Card Toss (which scatters cards on a black void with pastel-friendly confidence) through four explicit moves: (a) saturated cobalt blue is the identity -- no black canvas, no pastel tints, just pure `#2450F5`; (b) the blueprint grid overlay is mandatory and pervasive, not decorative; (c) the vibe is a Figma-launch-page / canvas screenshot, not an App Store press kit; (d) the composition uses underlined URLs and small curved yellow underline accents as structural punctuation, where Card Toss uses floating off-white circles.

**Key Characteristics:**
- Saturated cobalt blue background (`#2450F5`) edge-to-edge -- not navy, not sky, pure electric cobalt
- Blueprint grid overlay in lighter cobalt (`#4870F8` at 30% opacity), 80px spacing, across the entire canvas
- Two sticky notes per composition: pink (`#F4B8D4`) tilted -3 to -8deg and yellow (`#F4E34A`) tilted +4 to +8deg
- Sticky notes use soft shadows and rounded corners (`12px` radius) with torn-edge feel
- Handwritten-feeling Inter 400/500 body copy on stickies at 18-22px
- Massive Inter 900 white headline, 80-100px, anchored bottom-left
- Small yellow curved SVG underline accent below one word of the headline
- Corner date labels: "16 February" top-left and "17" top-right, Inter 600 white at 36-48px
- Underlined URL in pale blue or white below the sticky stack (e.g. `www.zentime.com`)
- Maximum of 2 sticky notes per slide -- three is the absolute upper bound, never more
- Inter as the single typeface -- weights 400, 500, 600, and 900 only
- Pure white (`#FFFFFF`) for all text on the cobalt canvas -- no cream, no off-white

## 2. Color Palette & Roles

### Primary
- **Cobalt Blue** (`#2450F5`): Primary background. A saturated, electric cobalt that sits between pure blue and true violet-blue. This is the identity color.
- **Blueprint White** (`#FFFFFF`): Primary text color on the cobalt canvas. Used for headlines, corner dates, and URL labels.
- **Sticky Pink** (`#F4B8D4`): Primary sticky note surface color. Candy pink, leaning slightly warm.

### Accent
- **Sticky Yellow** (`#F4E34A`): Secondary sticky note color and underline accent color. Bright highlighter yellow.
- **Cobalt Grid Line** (`#4870F8`): Blueprint grid overlay line color at 30% opacity.
- **Cobalt Deep** (`#1F4AF0`): Alternate cobalt for gradients or deepening the canvas edge.
- **Hover Pink** (`#E89FBF`): Pressed/hover state for pink sticky interactions.
- **Hover Yellow** (`#E5D23A`): Pressed/hover state for yellow sticky interactions.

### Neutral Scale
- **Sticky Text** (`#1A1A1A`): Near-black for body copy on sticky note surfaces -- always dark on bright sticky colors.
- **Muted White** (`rgba(255,255,255,0.70)`): Secondary white for URL labels and quieter marks.
- **Faint White** (`rgba(255,255,255,0.40)`): Metadata, footnotes, and decorative inline marks.
- **Sticky Edge Warm** (`#EBDDD0`): Subtle warm tint for sticky note torn-edge highlight.
- **Sticky Shadow Color** (`rgba(20,40,120,0.35)`): Blue-tinted shadow for sticky notes on cobalt background.

### Surface & Borders
- **Surface Canvas** (`#2450F5`): The cobalt blue background.
- **Surface Sticky Pink** (`#F4B8D4`): Pink sticky note fill.
- **Surface Sticky Yellow** (`#F4E34A`): Yellow sticky note fill.
- **Border Sticky** (`none`): Sticky notes have no borders -- the saturated fill against cobalt defines the edge.
- **Border Faint** (`rgba(255,255,255,0.18)`): Rare thin dividers on cobalt.
- **Divider Grid** (`rgba(72,112,248,0.30)`): Blueprint grid line color.
- **URL Underline** (`rgba(255,255,255,0.70)`): Underline under URL labels.

### Shadow Colors
- **Shadow Sticky** (`rgba(20,40,120,0.35)`): Primary sticky note drop shadow -- blue-tinted to sit naturally on cobalt.
- **Shadow Sticky Deep** (`rgba(15,30,100,0.45)`): Heavier shadow for the overlapping sticky corner.
- **Shadow Ambient** (`rgba(20,40,120,0.20)`): Subtle lift for decorative elements.
- **Shadow Headline Glow** (`rgba(255,255,255,0.05)`): Optional faint white aura behind the headline for extra presence.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

- **Display**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Inter | 96px | 900 | 0.95 | -3px | Massive bottom-left headline. Pure white on cobalt. |
| Section Heading | Inter | 64px | 900 | 1.00 | -2px | Secondary large headlines for multi-slide formats |
| Sub-heading | Inter | 36px | 800 | 1.10 | -1px | Card-level headings on sticky notes |
| Date Label Big | Inter | 48px | 600 | 1.00 | -1px | Corner date number ("16", "17") |
| Date Label Small | Inter | 20px | 600 | 1.10 | 0.3px | Month name next to big date number ("February") |
| Sticky Body Large | Inter | 22px | 500 | 1.45 | 0px | Primary sticky note body copy |
| Sticky Body | Inter | 18px | 400 | 1.50 | 0px | Standard sticky note body text |
| Sticky Bold | Inter | 18px | 600 | 1.45 | 0px | Emphasis words within sticky body |
| URL Label | Inter | 16px | 500 | 1.20 | 0.5px | Underlined URLs (e.g. "www.zentime.com") |
| Caption | Inter | 13px | 500 | 1.45 | 0.4px | Metadata and footnote marks |
| Big Numbers | Inter | 140px | 900 | 0.90 | -4px | Oversized stats for content slides |
| CTA Text | Inter | 18px | 700 | 1.00 | 0.3px | Button and CTA label text |

### Principles
- **Single-family system**: Inter handles everything -- display, body, labels, CTAs. The tension comes entirely from weight contrast (400 for sticky body, 900 for the headline) rather than font pairing. This is deliberate: Blueprint Sticky is a tool-native style, and tools ship with one typeface.
- **Weight 900 is the signature**: The bottom-left headline is always Inter 900 at the largest size the format allows. This is the anchor element -- nothing else competes with it for weight.
- **Sticky body reads handwritten**: On sticky notes, body copy uses weight 400 or 500 at a relaxed 1.45-1.50 line height. The goal is legibility with a slightly soft, annotated feel -- not bold corporate body copy.
- **Tight negative tracking on big type**: Headlines at 80-100px use -2px to -3px letter spacing. Inter 900 is wide by default, and negative tracking keeps the headline feeling poster-weight rather than webpage-weight.
- **Mixed case always for headlines**: "Product Launch" not "PRODUCT LAUNCH". Uppercase is reserved only for short tracked labels under 14px.
- **White on cobalt is the only headline treatment**: Headlines are pure white. Sticky body is near-black on pink/yellow. These two contrast modes are fixed -- never invert.

## 4. Component Patterns

### Blueprint Grid Overlay

The grid is applied as a CSS background on the canvas element using a repeating linear-gradient pair. This is applied to every slide -- it is the blueprint.

```html
<div style="background-color: var(--color-cobalt); background-image: linear-gradient(to right, var(--color-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-grid-line) 1px, transparent 1px); background-size: 80px 80px; position: relative; padding: 60px; min-height: 1080px;">
  <!-- slide content -->
</div>
```

For a more Figma-canvas feel, an SVG variant with dashed guides can be used:

```html
<svg style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="blueprint-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#4870F8" stroke-width="1" stroke-opacity="0.30" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
</svg>
```

### Tilted Sticky Note (Pink)

```html
<div style="background-color: var(--color-sticky-pink); padding: 40px 36px; border-radius: 12px; transform: rotate(-6deg); max-width: 460px; box-shadow: 0 20px 48px var(--shadow-sticky), 0 6px 16px var(--shadow-sticky-deep); position: relative;">
  <p style="font-family: var(--font-body); font-size: 22px; font-weight: 500; line-height: 1.45; color: var(--color-sticky-text); margin: 0;">Your calendar's about to get smarter.<br><br>No more back-and-forth, just clean scheduling. Join the waitlist for early access.</p>
</div>
```

### Tilted Sticky Note (Yellow)

```html
<div style="background-color: var(--color-sticky-yellow); padding: 36px 32px; border-radius: 12px; transform: rotate(4deg); max-width: 420px; box-shadow: 0 20px 48px var(--shadow-sticky), 0 6px 16px var(--shadow-sticky-deep); position: relative;">
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 500; line-height: 1.45; color: var(--color-sticky-text); margin: 0;">Ships Feb 17. Built for founders who hate calendar tetris.</p>
</div>
```

### Corner Date Labels

```html
<!-- Top-left: "16 February" stacked -->
<div style="position: absolute; top: 56px; left: 60px; color: var(--color-white); font-family: var(--font-body);">
  <div style="font-size: 48px; font-weight: 600; line-height: 1.00; letter-spacing: -1px;">16</div>
  <div style="font-size: 20px; font-weight: 600; line-height: 1.10; letter-spacing: 0.3px; margin-top: 4px;">February</div>
</div>

<!-- Top-right: "17" standalone -->
<div style="position: absolute; top: 56px; right: 60px; color: var(--color-white); font-family: var(--font-body); font-size: 48px; font-weight: 600; line-height: 1.00; letter-spacing: -1px;">17</div>
```

### Massive White Headline

```html
<div style="position: absolute; bottom: 80px; left: 60px; color: var(--color-white); font-family: var(--font-body);">
  <h1 style="font-size: 96px; font-weight: 900; line-height: 0.95; letter-spacing: -3px; color: var(--color-white); margin: 0;">Product<br>Launch</h1>
  <!-- Yellow curved underline SVG sits below one word -->
  <svg width="220" height="16" viewBox="0 0 220 16" style="display: block; margin-top: 4px; margin-left: 0;" xmlns="http://www.w3.org/2000/svg">
    <path d="M 4 10 Q 110 2 216 10" stroke="#F4E34A" stroke-width="4" fill="none" stroke-linecap="round" />
  </svg>
</div>
```

### Curved Underline Accent (Standalone)

```html
<svg width="180" height="14" viewBox="0 0 180 14" xmlns="http://www.w3.org/2000/svg">
  <path d="M 4 9 Q 90 1 176 9" stroke="#F4E34A" stroke-width="4" fill="none" stroke-linecap="round" />
</svg>
```

### Underlined URL Label

```html
<a style="display: inline-block; color: var(--color-white); font-family: var(--font-body); font-size: 16px; font-weight: 500; letter-spacing: 0.5px; text-decoration: underline; text-decoration-color: rgba(255,255,255,0.70); text-underline-offset: 4px; text-decoration-thickness: 1px;">www.zentime.com</a>
```

### Stat Display on Sticky

```html
<div style="background-color: var(--color-sticky-yellow); padding: 48px 40px; border-radius: 12px; transform: rotate(-3deg); max-width: 420px; box-shadow: 0 20px 48px var(--shadow-sticky); text-align: center;">
  <p style="font-family: var(--font-body); font-size: 140px; font-weight: 900; line-height: 0.90; letter-spacing: -4px; color: var(--color-sticky-text); margin: 0 0 8px;">2.3x</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 500; line-height: 1.45; color: var(--color-sticky-text); margin: 0;">faster scheduling than calendar apps</p>
</div>
```

### CTA Block on Cobalt

```html
<div style="position: relative; padding: 60px; text-align: left;">
  <h2 style="font-family: var(--font-body); font-size: 80px; font-weight: 900; line-height: 0.95; letter-spacing: -2.5px; color: var(--color-white); margin: 0 0 24px;">Join the<br>waitlist</h2>
  <a style="display: inline-block; background: var(--color-white); color: var(--color-cobalt); font-family: var(--font-body); font-size: 18px; font-weight: 700; letter-spacing: 0.3px; text-decoration: none; padding: 18px 40px; border-radius: 40px;">Get early access</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between date number and month label.
- **8px**: Tight gap -- between headline and curved underline.
- **12px**: Small gap -- between sticky body lines when tightening.
- **16px**: Base gap -- between heading and supporting label.
- **24px**: Medium gap -- between headline and CTA button.
- **32px**: Content gap -- between stacked content blocks.
- **40px**: Sticky vertical padding -- standard internal padding top/bottom inside sticky notes.
- **56px**: Corner inset -- distance from canvas edge for corner date labels.
- **60px**: Scene padding -- outer canvas padding on all sides.
- **80px**: Grid cell size -- blueprint overlay spacing, also bottom-anchor inset for headline.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| Story (1080x1920) | 60px left/right, 120px top/bottom | 920px |

### Alignment & Grid
- **Primary alignment**: Left-aligned, bottom-anchored. The massive headline lives in the bottom-left quadrant. Stickies cluster in the upper-right to middle-right zone.
- **Grid spacing**: The blueprint grid is 80px x 80px across every format. Never change the grid cell size -- it is the blueprint identity.
- **Sticky rotation range**: Pink stickies rotate -3deg to -8deg (left lean). Yellow stickies rotate +4deg to +8deg (right lean). Never exceed +/- 10deg. The opposing tilts are mandatory.
- **Sticky overlap**: The yellow sticky tucks under the pink sticky by 30-60px at one corner. Pink always sits on top (higher z-index).
- **Corner date labels**: Always at 56-60px inset from top edge. "DD Month" stacked top-left. Standalone "DD" top-right.
- **Headline placement**: Always bottom-left, 80px from the bottom edge and 60px from the left edge. Two-line headline max.
- **URL label**: Sits 16-24px below the sticky stack, left-aligned under the stickies, in pale white with solid or dashed underline.
- **Content gravity**: The composition reads as a diagonal from bottom-left (headline) to upper-right (stickies and top-right date). The curved yellow underline under the headline pulls the eye into the stickies.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#2450F5` with grid overlay | Canvas base layer |
| Subtle (Level 1) | `0 4px 12px rgba(20,40,120,0.20)` | URL labels, small decorative marks |
| Sticky (Level 2) | `0 20px 48px rgba(20,40,120,0.35), 0 6px 16px rgba(15,30,100,0.45)` | Standard tilted sticky notes |
| Featured (Level 3) | `0 28px 64px rgba(20,40,120,0.40), 0 10px 24px rgba(15,30,100,0.50)` | Primary/hero sticky with heaviest lift |
| Overlay (Level 4) | `0 32px 80px rgba(15,30,100,0.55)` | Modals or popups (rare) |

### Border Treatments
- **Sticky note**: `border: none; border-radius: 12px` -- the saturated fill against cobalt defines the edge. No stroke.
- **URL underline**: `text-decoration: underline; text-decoration-color: rgba(255,255,255,0.70); text-underline-offset: 4px; text-decoration-thickness: 1px` -- a thin pale line beneath URL labels.
- **Grid line**: `1px solid rgba(72,112,248,0.30)` -- the blueprint grid is rendered as 1px lines on an 80px cadence.
- **Divider (rare)**: `1px solid rgba(255,255,255,0.18)` -- for rare content dividers on cobalt outside sticky notes.

### Surface Hierarchy
On the cobalt canvas with blueprint grid, depth is communicated through three layers:
1. **Canvas + Grid** (`#2450F5` + `#4870F8` grid lines) -- the flat blueprint floor. Nothing else lives at this level.
2. **Sticky notes** (`#F4B8D4` pink, `#F4E34A` yellow) -- elevated objects with strong blue-tinted shadows, always rotated, always overlapping in pairs.
3. **Headline + corner dates** (`#FFFFFF`) -- pure white type floats above everything, with the headline anchored bottom-left and dates anchored in the top corners. Type is flat (no shadow) -- it is graphic, not objecty.

Shadows are always blue-tinted (`rgba(20,40,120,*)`) rather than neutral black, so sticky notes feel like they belong on the cobalt surface rather than being dropped onto it from a different scene.

## 7. Do's and Don'ts

### Do
- Use saturated cobalt blue (`#2450F5`) as the background on every slide -- this is the identity and it is non-negotiable.
- Apply the blueprint grid overlay (`#4870F8` at 30% opacity, 80px spacing) on every slide -- it IS the blueprint.
- Use sticky notes in opposing tilt angles: pink at -3 to -8deg (left lean) and yellow at +4 to +8deg (right lean).
- Use Inter 900 for the massive bottom-left headline at 80-100px with -2px to -3px letter spacing.
- Use a small yellow (`#F4E34A`) curved SVG underline to accent one key word of the headline.
- Keep text on sticky notes at near-black (`#1A1A1A`) for maximum readability on bright sticky colors.
- Place corner date labels in the top-left and top-right corners (Inter 600 white, stacked "DD Month" style).
- Include a small underlined URL (Inter 500, pale white, 16px) below the sticky stack for the Figma-launch-page feel.
- Overlap the pink and yellow sticky notes by 30-60px at the corner where they meet, pink on top.
- Use blue-tinted shadows (`rgba(20,40,120,0.35)`) on stickies -- not neutral black shadows.
- Keep sticky notes at `border-radius: 12px` -- slightly rounded, slightly tactile.

### Don't
- Don't use pastel backgrounds -- cobalt (`#2450F5`) is the identity. No navy, no sky blue, no light blue tints.
- Don't skip the grid overlay -- a cobalt slide without the blueprint grid is off-brand. The grid IS the blueprint.
- Don't use more than 3 sticky notes in a single composition -- two is the ideal count, three is the absolute maximum.
- Don't over-rotate stickies -- keep all rotations between -10deg and +10deg. Anything beyond that reads chaotic, not annotated.
- Don't use neutral black shadows -- sticky shadows must be blue-tinted to sit naturally on the cobalt canvas.
- Don't use a second typeface -- Inter is the only family. Weight contrast (400 vs 900) carries the hierarchy.
- Don't place the headline anywhere other than bottom-left. The bottom-left anchor is fixed.
- Don't use uppercase for the main headline -- "Product Launch" is always mixed case. Uppercase is only for 14px-and-below tracked labels.
- Don't invert the sticky contrast -- text on stickies is always near-black, never white.
- Don't add gradients to the background -- flat cobalt with grid overlay only. No mesh gradients, no radial fades.
- Don't use more than two sticky colors per composition -- pink and yellow are the only sticky surface colors.
- Don't use thin headline weights (under 800) -- Inter 900 is the signature. Inter 800 is acceptable only as a fallback.
- Don't decorate with icons, emoji, or illustrations -- the sticky notes and curved underline are the only decorative elements.

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
- **Typography scale**: Display Hero drops to 88px. Section Heading drops to 56px. Sticky body stays 18-22px.
- **Padding**: 60px on all sides. Content area 960x960.
- **Grid overlay**: Full 80px blueprint grid across the canvas.
- **Cover slide**: Corner date labels top-left ("16 February") and top-right ("17"). One pink sticky (-6deg) and one yellow sticky (+4deg) overlapping in the upper-right to middle zone. Massive Inter 900 headline bottom-left, two lines max. Curved yellow underline under one word. Small underlined URL below the sticky stack.
- **Content slides**: One sticky per slide for single-focus content, or the two-sticky cluster for denser slides. Headline can shrink to 64-72px on content slides to make room for sticky content.
- **Swipe indicator**: Small white dots (`#FFFFFF`, 8px, 12px gap) at bottom center, active dot fully opaque, inactive at 40% opacity.

### Infographic (1080px wide, variable height)
- **Typography**: Full scale. Display Hero at 96px for the top section.
- **Padding**: 60px left/right, 80px top/bottom.
- **Grid overlay**: Extends the full height of the variable canvas.
- **Section flow**: Alternate sticky clusters down the page. Each section has one pink + one yellow sticky pair with a small headline label above and optional URL below. Between sections, the grid breathes for 80-120px of empty cobalt.
- **Top section**: Corner dates + massive headline + hero sticky pair.
- **Footer**: Small centered URL label and a tiny Inter 500 caption line.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 120px. Section Heading becomes 80px. Sticky body scales to 24px.
- **Padding**: 80px on all sides. Content area 1760x920.
- **Grid overlay**: 80px blueprint grid across the wide canvas.
- **Layout**: Headline anchors bottom-left. Sticky pair clusters in the right-center zone with more horizontal breathing room. Corner dates top-left and top-right.
- **Title slides**: Massive Inter 900 headline bottom-left, two stickies right of center, corner dates, curved underline.
- **Content slides**: Smaller headline (80px) top-left, sticky cluster center-right, support copy in a third small sticky or inline on the cobalt with tight white text.
- **CTA slides**: Single large white headline, white pill button on cobalt, single pink sticky as emphasis element.

### Poster (1080x1350px)
- **Typography**: Display Hero at 88px. Section Heading at 56px. Sticky body at 20px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third: corner dates and sticky pair. Middle third: breathing grid with optional URL label. Bottom third: massive Inter 900 headline anchored bottom-left with curved yellow underline.
- **Vertical flow**: The poster reads top-to-bottom: dates set the scene, stickies deliver the content, headline closes the deal.
- **CTA placement**: Optional white pill button at the very bottom, centered or below the headline on the left.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 104px in Inter 900 (approximately 18% larger than Carousel 88px) with -3px letter spacing. Section Heading becomes 68px. Sticky Body Large becomes 24px in Inter 500. Date Label Big becomes 56px in Inter 600. URL label stays at 16px Inter 500.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column feel, but asymmetric inside. Content max-width 920px. Vertical center of gravity -- cluster sticky content in y=500 to y=1300 range. Grid overlay runs edge-to-edge across the full 1080x1920 canvas at 80px spacing so the blueprint is always visible.
- **Cover slide**: Corner date labels at y=160 (top-left "16 February" stacked, top-right "17"). Pink sticky (-6deg) centered around y=620 at 460px wide. Yellow sticky (+5deg) tucked under pink at y=780 at 420px wide, offset right by 40-60px. Small underlined URL (`www.zentime.com`) at y=1080 centered under the sticky stack. Massive Inter 900 headline at y=1300 to y=1500, bottom-left anchored, 104px, two lines ("Product" / "Launch"). Yellow curved underline at y=1520 under one word. All of this sits inside the safe zone.
- **Content slides**: One hero sticky per slide with rotation -6deg to +6deg. Headline above or below the sticky depending on content weight. Corner dates remain at y=160. Optional single secondary sticky tucked under the primary by 40-60px. Grid overlay runs the full canvas.
- **CTA slide**: Massive Inter 900 headline ("Join the waitlist") at y=700 to y=1000, left-aligned. White pill button (`#FFFFFF` fill, cobalt text, 40px radius) at y=1100 with Inter 700 CTA text. Small pink sticky at y=1280 with a one-line supporting message, tilted -4deg. Underlined URL at y=1500.
- **Progress indicator**: Thin white segments at the top of the safe zone (y=120) -- inactive at `rgba(255,255,255,0.30)`, active at pure white. 4-6px height, 14px gaps.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Cobalt Blue | `#2450F5` | Primary background, the identity color |
| Cobalt Deep | `#1F4AF0` | Alternate cobalt for depth |
| Cobalt Grid Line | `#4870F8` | Blueprint grid overlay lines (30% opacity) |
| Blueprint White | `#FFFFFF` | Headlines, corner dates, URL labels |
| Sticky Pink | `#F4B8D4` | Pink sticky note fill |
| Sticky Yellow | `#F4E34A` | Yellow sticky note fill + curved underline accent |
| Sticky Text | `#1A1A1A` | Body copy on sticky notes |
| Hover Pink | `#E89FBF` | Pressed/hover state for pink |
| Hover Yellow | `#E5D23A` | Pressed/hover state for yellow |
| Muted White | `rgba(255,255,255,0.70)` | Secondary white for URLs |
| Faint White | `rgba(255,255,255,0.40)` | Metadata and footnotes |
| Sticky Edge Warm | `#EBDDD0` | Torn-edge highlight tint |

### Font Declarations

```css
/* Display and body (single family) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-cobalt: #2450F5;
  --color-cobalt-deep: #1F4AF0;
  --color-white: #FFFFFF;
  --color-sticky-pink: #F4B8D4;
  --color-sticky-yellow: #F4E34A;

  /* Colors -- Accent */
  --color-grid-line: rgba(72, 112, 248, 0.30);
  --color-grid-line-solid: #4870F8;
  --color-hover-pink: #E89FBF;
  --color-hover-yellow: #E5D23A;
  --color-sticky-text: #1A1A1A;

  /* Colors -- Neutral Scale */
  --color-muted-white: rgba(255, 255, 255, 0.70);
  --color-faint-white: rgba(255, 255, 255, 0.40);
  --color-sticky-edge-warm: #EBDDD0;

  /* Colors -- Surfaces */
  --color-surface-canvas: #2450F5;
  --color-surface-sticky-pink: #F4B8D4;
  --color-surface-sticky-yellow: #F4E34A;

  /* Colors -- Borders */
  --color-border-faint: rgba(255, 255, 255, 0.18);
  --color-url-underline: rgba(255, 255, 255, 0.70);

  /* Colors -- Shadows */
  --shadow-sticky: rgba(20, 40, 120, 0.35);
  --shadow-sticky-deep: rgba(15, 30, 100, 0.45);
  --shadow-ambient: rgba(20, 40, 120, 0.20);
  --shadow-headline-glow: rgba(255, 255, 255, 0.05);

  /* Typography -- Families */
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 96px;
  --text-section-heading: 64px;
  --text-sub-heading: 36px;
  --text-date-big: 48px;
  --text-date-small: 20px;
  --text-sticky-large: 22px;
  --text-sticky-body: 18px;
  --text-url: 16px;
  --text-caption: 13px;
  --text-big-number: 140px;
  --text-cta: 18px;

  /* Typography -- Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-extrabold: 800;
  --weight-black: 900;

  /* Typography -- Line Heights */
  --leading-hero: 0.95;
  --leading-heading: 1.00;
  --leading-sub-heading: 1.10;
  --leading-sticky: 1.45;
  --leading-body: 1.50;
  --leading-number: 0.90;

  /* Typography -- Letter Spacing */
  --tracking-hero: -3px;
  --tracking-heading: -2px;
  --tracking-sub: -1px;
  --tracking-label: 0.3px;
  --tracking-url: 0.5px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-large: 32px;
  --space-sticky-padding: 40px;
  --space-corner-inset: 56px;
  --space-scene: 60px;
  --space-grid: 80px;

  /* Borders */
  --radius-sticky: 12px;
  --radius-button: 40px;

  /* Shadows -- Composed */
  --shadow-sticky-default: 0 20px 48px rgba(20,40,120,0.35), 0 6px 16px rgba(15,30,100,0.45);
  --shadow-sticky-featured: 0 28px 64px rgba(20,40,120,0.40), 0 10px 24px rgba(15,30,100,0.50);
  --shadow-ambient-lift: 0 4px 12px rgba(20,40,120,0.20);
  --shadow-overlay: 0 32px 80px rgba(15,30,100,0.55);

  /* Blueprint Grid */
  --grid-cell: 80px;
  --grid-image: linear-gradient(to right, rgba(72,112,248,0.30) 1px, transparent 1px), linear-gradient(to bottom, rgba(72,112,248,0.30) 1px, transparent 1px);

  /* Sticky Rotations */
  --rotate-pink-default: rotate(-6deg);
  --rotate-pink-soft: rotate(-3deg);
  --rotate-pink-strong: rotate(-8deg);
  --rotate-yellow-default: rotate(4deg);
  --rotate-yellow-soft: rotate(2deg);
  --rotate-yellow-strong: rotate(8deg);
}
```

### System Font Fallbacks
- **Inter (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
