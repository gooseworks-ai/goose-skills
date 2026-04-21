# Design Style: Pastel Organic Shapes

## 1. Visual Theme & Atmosphere

Pastel Organic Shapes is the design language of the soft-spoken content creator -- the visual equivalent of a handmade riso print scanned onto cream paper. It draws from the tradition of mid-century editorial illustration, Japanese stationery design, and the modern feminine-neutral creator aesthetic that dominates Instagram carousels from lifestyle brands, coaching studios, and boutique creative agencies. The signature move is the large pale pistachio circle positioned half off the edge of the frame -- a single bold organic shape that does all the structural heavy lifting while the rest of the composition breathes. This is the opposite of dense, information-rich design. It is confidence through restraint.

The warm cream background (`#F5F1E6`) is not white -- it is the color of unbleached paper, a slight yellow-cream wash that softens every other element on the page. Against this cream, the pale pistachio green (`#DCEAB4`) reads as gentle, not bright. The greens in this palette are always desaturated, always tinted slightly gray, always pale enough that black text reads cleanly when placed on top. The typography pairing is Playfair Display (a classic Didone-influenced serif with high stroke contrast) set in ALL CAPS at weight 400 with generous letter-spacing, paired with Inter for the small uppercase sans metadata labels. Setting a serif in all caps is unusual -- it sacrifices readability for monumentality -- but at the carousel scale of 3-4 stacked lines, it creates the feeling of a quiet declaration chiseled into stone.

The composition logic is organic-shape-first. Every slide is built around one signature pistachio circle extending off the right edge of the frame, with a smaller cream oval or circle sitting as the content container. Text lives inside the shapes. The shapes are the grid. Body text is centered when short and left-aligned inside the cream oval when longer. A thin-outlined arrow indicator in the top-right corner telegraphs "swipe next" without any heavy UI chrome. The feel is editorial, gentle, and feminine-neutral -- think a natural-wellness brand's launch kit, a ceramics studio's social feed, or a coaching practice's welcome guide.

**Key Characteristics:**
- Warm cream background (`#F5F1E6`) -- unbleached-paper tone, the foundation of the palette
- Pale pistachio (`#DCEAB4`) as the ONLY color accent -- no reds, no blues, no secondary colors
- Large pistachio circle positioned half off-frame at the right edge -- THE signature move
- Smaller cream/off-white circle or oval as the content container, often overlapping the pistachio
- Playfair Display serif headlines in ALL CAPS, weight 400, letter-spacing 2-3px, centered
- Inter small-caps uppercase for metadata labels (`@handle`, `STUDIO NAME`) at bottom
- Near-black text (`#1A1A1A`) -- not pure black, just enough contrast for cream surfaces
- Thin-outlined arrow in rounded-rectangle container in the top-right as swipe-next indicator
- Maximum 2 shapes per slide -- restraint is the aesthetic
- Generous whitespace dominates the layout -- 50%+ of the frame is negative space
- No shadows, no gradients, no textures -- perfectly flat cream-and-pistachio composition
- Circles and ovals only -- no sharp rectangular cards, no hard right angles on containers

## 2. Color Palette & Roles

### Primary
- **Warm Cream** (`#F5F1E6`): Primary background. A soft, slightly yellow-warm cream that reads as unbleached paper. Always the base layer.
- **Near-Black** (`#1A1A1A`): Primary text color. All headlines, body text, and arrow icons. Never pure black -- the `#1A` gives it a gentler feel against cream.
- **Pale Pistachio** (`#DCEAB4`): Primary accent and signature shape color. Used for the large off-frame circle. Pale, desaturated, and slightly gray-green -- never saturated.

### Accent
- **Lighter Cream** (`#FAF7EC`): Inner cream oval / content container color. One step lighter than the background so it reads as a distinct surface without needing a border.
- **Deeper Pistachio** (`#C9DDA0`): Hover/active state for pistachio elements, or a subtle 1px outline inside the main pistachio shape if needed.
- **Pistachio Outline** (`#BFD390`): Thin line color for the optional outline frame around the entire slide (as seen in the references).

### Neutral Scale
- **Text Primary** (`#1A1A1A`): Headlines and primary body copy.
- **Text Secondary** (`#4A4A4A`): Body copy inside the cream oval when set at smaller sizes.
- **Text Metadata** (`#5C5C5C`): The bottom row uppercase labels (`@REALLYGREATSITE`, `STUDIO SHOWDE`).
- **Text Muted** (`rgba(26,26,26,0.5)`): Slide numbers, watermarks, low-priority metadata.
- **Outline Thin** (`rgba(26,26,26,0.35)`): The thin outline around the arrow indicator.

### Surface & Borders
- **Surface Background** (`#F5F1E6`): Primary canvas.
- **Surface Container** (`#FAF7EC`): Inner cream oval content container.
- **Surface Accent** (`#DCEAB4`): Large pistachio signature shape.
- **Border Thin** (`rgba(26,26,26,0.4)`): Outline for the arrow indicator and (optional) thin frame around the slide.
- **Border Subtle** (`rgba(26,26,26,0.12)`): Divider rules if needed -- rarely used.
- **Divider Rule** (`rgba(26,26,26,0.08)`): Barely-there horizontal rules, used sparingly.

### Shadow Colors
This style is almost entirely shadow-free. Depth is communicated via shape layering and color contrast, not elevation.
- **Shadow None** (`transparent`): Default -- no shadow on any element.
- **Shadow Whisper** (`rgba(26,26,26,0.03)`): Barely perceptible, only for the cream oval content container if additional separation is needed.
- **Shadow Subtle** (`rgba(26,26,26,0.06)`): Reserved for poster/print adaptations where slight depth helps.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'Playfair Display', Georgia, 'Times New Roman', serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Case | Notes |
|------|------|------|--------|-------------|----------------|------|-------|
| Display Hero | Playfair Display | 56px | 400 | 1.18 | 2px | UPPERCASE | Main carousel headline, 3-4 lines stacked tight |
| Section Heading | Playfair Display | 40px | 400 | 1.20 | 1.5px | UPPERCASE | Slide subheadings inside cream oval |
| Sub-heading | Playfair Display | 28px | 400 | 1.25 | 1px | UPPERCASE | Small headline inside cream oval container |
| Inner Headline | Playfair Display | 20px | 500 | 1.30 | 0.5px | UPPERCASE | Tight headline in small circle container |
| Body Large | Inter | 16px | 400 | 1.65 | 0.3px | normal | Body text inside cream oval when longer |
| Body | Inter | 13px | 400 | 1.65 | 0.5px | UPPERCASE | Sparse body copy inside small circle container |
| Metadata | Inter | 12px | 500 | 1.40 | 1.5px | UPPERCASE | Bottom row labels -- `@handle`, `STUDIO NAME` |
| Caption | Inter | 11px | 500 | 1.40 | 1px | UPPERCASE | Slide numbers, small labels |
| Big Numbers | Playfair Display | 72px | 400 | 1.00 | 1px | -- | Statistics and key metrics |

### Principles

- **Serif in ALL CAPS is the signature.** Setting Playfair Display in uppercase at weight 400 with generous tracking transforms readable type into quiet monuments. Every primary headline follows this rule. Mixed case is never used for main headlines.
- **Letter-spacing scales with size.** At 56px the tracking is ~2px. At smaller sizes like 20px it tightens to 0.5px. At metadata-level 12px it widens again to 1.5px (because tight-tracked small caps read as cramped).
- **Light weights only.** Playfair Display is used at 400 and occasionally 500. Never 700 or 800. The headline authority comes from size and tracking, not weight -- this is what keeps the style feeling gentle.
- **Inter is the quiet partner.** Inter never headlines. It handles metadata, small-body, and the rare label. When used, it is always uppercase, tracked, and at weight 400-500. Mixed-case Inter appears only for body-large inside the cream oval when copy is longer.
- **Line height is breathing room.** Headlines at 1.18-1.30 leading feel tight but not cramped. Body copy inside the oval sits at 1.65 to give sparse paragraphs air.
- **Center everything short, left-align everything long.** Headlines, metadata, and short labels are centered. The moment body copy exceeds ~3 lines inside the cream oval, switch to left-alignment so the ragged edge doesn't fight the organic shape.

## 4. Component Patterns

### Slide Frame (Optional Outer Outline)

```html
<div style="position: relative; width: 1080px; height: 1080px; background-color: var(--color-bg); overflow: hidden; box-sizing: border-box; padding: 60px;">
  <!-- Optional thin outlined frame seen in the references -->
  <div style="position: absolute; inset: 40px; border: 1.5px solid var(--color-pistachio-outline); pointer-events: none;"></div>
  <!-- Content goes here -->
</div>
```

### Circle Container (Signature Off-Frame Pistachio)

The core signature move. A large pale pistachio circle positioned so half (or slightly more) of it extends off the right edge of the frame. Achieve it with absolute positioning and a huge `border-radius`. The circle is sized roughly equal to the slide height so only ~55-60% of it is visible.

```html
<div style="position: absolute; top: 50%; right: -540px; transform: translateY(-50%); width: 1080px; height: 1080px; background-color: var(--color-pistachio); border-radius: 50%;"></div>
```

Variations by edge:
- **Right edge (default):** `right: -540px`
- **Left edge mirror:** `left: -540px`
- **Bottom-right corner:** `right: -400px; bottom: -400px; top: auto; transform: none;`

Sizing ratio: the circle diameter should be 90-100% of the slide's shortest dimension.

### Inner Cream Oval (Content Container)

A smaller, centered cream circle or oval that holds the tight headline + body text. Sits adjacent to or overlapping the pistachio shape. Its background is one step lighter than the canvas so it reads as a distinct surface without needing any border.

```html
<div style="position: absolute; left: 140px; top: 50%; transform: translateY(-50%); width: 340px; height: 340px; background-color: var(--color-cream-light); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; box-sizing: border-box; text-align: center;">
  <h3 style="font-family: var(--font-display); font-size: 20px; font-weight: 500; line-height: 1.30; letter-spacing: 0.5px; text-transform: uppercase; color: var(--color-near-black); margin: 0 0 16px;">It's time to delegate.</h3>
  <p style="font-family: var(--font-body); font-size: 12px; font-weight: 400; line-height: 1.65; letter-spacing: 1px; text-transform: uppercase; color: var(--color-near-black); margin: 0;">Your business grows faster when you let others share the load.</p>
</div>
```

To make it an oval instead of a circle, use unequal width/height and `border-radius: 50%` -- the browser will render an ellipse automatically.

### Swipe Arrow Indicator (Corner)

A thin-outlined arrow inside a rounded-rectangle container, positioned in the top-right corner as a "swipe next" indicator. The outline is the only drawn stroke on the slide.

```html
<div style="position: absolute; top: 80px; right: 80px; width: 56px; height: 56px; border: 1.5px solid var(--color-border-thin); border-radius: 14px; display: flex; align-items: center; justify-content: center;">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M13 6L19 12L13 18" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
```

### Hero Headline Block (Centered ALL CAPS Serif)

For cover slides. A 3-4 line serif headline stacked tight, centered, in ALL CAPS.

```html
<div style="position: absolute; top: 140px; left: 100px; right: 100px; text-align: center;">
  <h1 style="font-family: var(--font-display); font-size: 56px; font-weight: 400; line-height: 1.18; letter-spacing: 2px; text-transform: uppercase; color: var(--color-near-black); margin: 0;">
    Stop wasting<br>
    precious time<br>
    on tasks that<br>
    don't move<br>
    the needle
  </h1>
</div>
```

### Metadata Footer (Bottom Row)

Tracked uppercase sans labels at the bottom of every slide. Left slot is the handle, right slot is the studio/brand.

```html
<div style="position: absolute; bottom: 80px; left: 80px; right: 80px; display: flex; justify-content: space-between; align-items: center;">
  <span style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-metadata);">@reallygreatsite</span>
  <span style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-metadata);">Studio Showde</span>
</div>
```

### Quote Block (Inside Cream Oval)

When the content is a quote or longer paragraph, use left-alignment inside a larger cream oval.

```html
<div style="position: absolute; left: 120px; top: 50%; transform: translateY(-50%); width: 420px; height: 420px; background-color: var(--color-cream-light); border-radius: 50%; display: flex; flex-direction: column; justify-content: center; padding: 72px; box-sizing: border-box;">
  <p style="font-family: var(--font-display); font-size: 20px; font-weight: 400; font-style: italic; line-height: 1.45; color: var(--color-near-black); margin: 0 0 20px; text-align: left;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <p style="font-family: var(--font-body); font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-metadata); margin: 0; text-align: left;">Sarah Chen, VP Ops</p>
</div>
```

### Numbered Step (Inside Small Circle)

```html
<div style="position: relative; width: 280px; height: 280px; background-color: var(--color-cream-light); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; box-sizing: border-box; text-align: center;">
  <span style="font-family: var(--font-display); font-size: 48px; font-weight: 400; line-height: 1.00; color: var(--color-near-black); margin: 0 0 8px;">01</span>
  <p style="font-family: var(--font-body); font-size: 11px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-near-black); margin: 0; line-height: 1.50;">Identify the<br>time-wasters</p>
</div>
```

### Big Number Stat

```html
<div style="text-align: center;">
  <p style="font-family: var(--font-display); font-size: 72px; font-weight: 400; line-height: 1.00; color: var(--color-near-black); margin: 0 0 12px;">47%</p>
  <p style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-metadata); margin: 0;">Faster Response</p>
</div>
```

## 5. Layout Principles

### Spacing Scale

- **4px**: Micro gap -- inside arrow icon.
- **8px**: Tight gap -- between stat number and its label.
- **12px**: Small gap -- between headline lines and sub-label inside the cream oval.
- **16px**: Base gap -- between paragraphs inside the cream oval.
- **24px**: Medium gap -- between metadata row items.
- **40px**: Oval inner padding -- standard padding inside the inner cream oval.
- **48px**: Oval inner padding (large) -- for larger cream ovals holding more copy.
- **60px**: Slide outer padding -- default outer frame padding.
- **80px**: Slide outer padding (wide) -- for content slides with more breathing room.
- **120px**: Story outer padding -- 1080x1920 story-format padding.

### Format Padding

| Format | Outer Padding | Content Max-Width | Hero Circle Size |
|--------|---------------|-------------------|------------------|
| Carousel (1080x1080) | 80px all sides | 920px | 1080px (100% of slide height) |
| Infographic (1080xN) | 60px left/right, 100px top/bottom | 960px | 800px (scaled per section) |
| Slides (1920x1080) | 120px all sides | 1680px | 1400px |
| Poster (1080x1350) | 80px left/right, 100px top/bottom | 920px | 1100px |
| **Story (1080x1920)** | **120px left/right, 60px top/bottom** | **840px** | **1400px (~30% bigger than carousel)** |

### Alignment & Grid

- **Primary alignment**: Centered for all headlines and metadata. Left-aligned for body copy that exceeds ~3 lines inside the cream oval.
- **No grid system.** The composition is shape-driven, not column-driven. Every slide is built around one off-frame pistachio circle and one inner cream oval. Position these two shapes first, then place text inside them.
- **Two shapes max.** Never more than one pistachio shape and one cream oval per slide. If a slide feels empty, that is correct -- whitespace is the point.
- **The signature position.** On 90% of slides, the pistachio circle extends off the right edge with the cream oval centered-left. Invert occasionally (pistachio off the left, oval right) to keep a carousel visually varied.
- **Vertical center line.** The cream oval always sits on the vertical midline of the slide unless a slide places its headline at the top (cover slide), in which case the oval moves to the bottom third.
- **Arrow in the same corner.** The swipe arrow is always top-right on carousel slides. Never moves.
- **Metadata stays pinned.** The metadata footer is always at the bottom, with `@handle` on the left and `brand name` on the right, on every slide except the final CTA slide.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow. Background `#F5F1E6` | Page canvas, base layer |
| Shape (Level 1) | No shadow. Pistachio circle sits on the canvas by color contrast alone | Large signature pistachio shape |
| Container (Level 2) | No shadow. Cream oval `#FAF7EC` sits on canvas by one-step lighter color | Inner cream oval content container |
| Whisper (Level 3) | `0 2px 12px rgba(26,26,26,0.03)` | Rare -- only if cream oval needs more separation in print output |
| Subtle (Level 4) | `0 4px 20px rgba(26,26,26,0.06)` | Reserved for poster print adaptations |

### Border Treatments

- **No borders on shapes.** Circles and ovals never have borders. Their edge comes from color contrast alone. This is a strict rule.
- **Frame outline (optional)** : `1.5px solid rgba(26,26,26,0.35)` -- a thin outline inset 40px from the slide edge, creating a subtle frame. Seen in both references. Optional per slide.
- **Arrow container outline**: `1.5px solid rgba(26,26,26,0.4)` with `border-radius: 14px` -- the only hard-edged element on the slide.
- **No divider rules.** Content is separated by whitespace and shape, never by lines.

### Surface Hierarchy

On cream backgrounds, depth comes from color layering, not shadows:
1. **Background** (`#F5F1E6`) -- warm cream canvas, the base of everything.
2. **Pistachio Shape** (`#DCEAB4`) -- the large signature shape sits above the canvas purely via color contrast.
3. **Cream Oval** (`#FAF7EC`) -- the inner container sits above the pistachio via a one-step lighter cream. On the canvas directly, the one-step lightness still reads.
4. **Text** (`#1A1A1A`) -- near-black text is the highest-contrast element on every slide.
5. **Arrow Outline** (`rgba(26,26,26,0.4)`) -- the thin-outlined arrow is the only hard geometric element.

The total effect is a quiet layering of tinted creams with one gentle green shape and one small interactive element. There is never a drop shadow on a shape in this style.

## 7. Do's and Don'ts

### Do

- **Use ALL CAPS on serif headlines** -- this is unusual but it is the signature of the style. Every primary headline is Playfair Display at weight 400 in uppercase with 1.5-2px letter-spacing.
- **Use pistachio (`#DCEAB4`) as the ONLY color accent.** No secondary colors. No reds, blues, yellows, or oranges. The restricted palette is the identity.
- **Keep shapes organic** (circles and ovals only). Never rectangles, never sharp cards, never hard right-angled containers for content. Content lives inside circles.
- **Position the pistachio circle half off-frame.** Use absolute positioning with a negative `right: -540px` value so the circle extends beyond the slide edge. This off-frame composition is the single most important visual move.
- **Keep the pistachio PALE.** The green must be desaturated and slightly gray. A saturated pistachio kills the style instantly. If in doubt, lighten and desaturate further.
- **Use the thin-outlined arrow in the top-right corner** as a swipe-next indicator. It is the one interactive-looking element on every slide.
- **Use tracked uppercase Inter at 12px** for the bottom-row metadata (`@handle`, `STUDIO NAME`). Letter-spacing 1.5px.
- **Let whitespace dominate** -- 50%+ of every slide should be empty cream canvas. Sparse layouts are correct.
- **Use at most 2 shapes per slide** (one pistachio, one cream). More shapes destroy the restraint that defines the style.
- **Center short text, left-align long text.** Headlines and metadata are centered. The moment body copy inside a cream oval exceeds ~3 lines, switch to left-alignment.
- **Use weight 400** for Playfair Display headlines. The monumentality comes from size and tracking, not weight.

### Don't

- **Don't center-align body text if it's long.** Inside a cream oval, long copy (4+ lines) must be left-aligned so the ragged right edge doesn't fight the organic shape.
- **Don't use more than 2 shapes per slide.** One pistachio, one cream oval. That is the budget.
- **Don't make the pistachio saturated.** It must be pale. If it competes visually with the headline text, desaturate it further.
- **Don't use Playfair Display at weight 700 or above.** Heavy serifs break the gentle atmosphere. Stick to 400-500.
- **Don't use mixed-case headlines.** Uppercase is the rule for serif display type in this style.
- **Don't add borders to circles or ovals.** Their edge comes from color contrast. A border on the pistachio shape would kill the organic feel.
- **Don't use drop shadows on shapes.** The style is flat. Depth comes from color layering alone.
- **Don't introduce secondary colors** -- no reds, blues, yellows, oranges, or purples. Cream and pistachio only.
- **Don't use rectangular content cards.** Everything lives inside circles or ovals. Rectangles are reserved for the slide frame itself and the arrow container.
- **Don't use tight leading on body copy.** Body text at 1.65 line height gives sparse paragraphs the air they need.
- **Don't fill the slide.** If a slide feels "too empty," you are doing it right. Resist the urge to add elements.
- **Don't use decorative icons, emoji, or illustrations.** The only non-text element is the swipe arrow.

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

- **Typography scale**: Display Hero at 56px. Section Heading at 40px. Sub-heading at 28px. Body inside cream oval at 13px uppercase or 16px mixed-case. Metadata at 12px.
- **Padding**: 80px on all sides. Optional inset frame at 40px from the edge.
- **Composition**: One pistachio circle (1080px diameter) positioned at `right: -540px` so half extends off-frame. One cream oval (340px circle or 340x280px ellipse) centered-left at roughly `left: 140px, top: 50%`.
- **Cover slide**: Full 3-4 line ALL CAPS headline stacked tight, centered, in the left half of the slide. Pistachio circle on the right. Optional cream oval with a secondary phrase at bottom-left.
- **Content slides**: Headline sits inside the cream oval. Pistachio circle is decoration. Body copy follows underneath in uppercase 13px or mixed-case 16px left-aligned.
- **Final CTA slide**: Larger cream oval (420px) centered with CTA text. Pistachio circle behind. No bottom metadata -- replaced with a single centered handle.
- **Swipe indicator**: Thin-outlined arrow in a 56x56px rounded-rectangle container in the top-right corner at `top: 80px, right: 80px`.

### Infographic (1080px wide, variable height)

- **Typography**: Display Hero at 64px. Section Heading at 44px. Body at 16px mixed-case.
- **Padding**: 60px left/right, 100px top/bottom.
- **Composition**: Vertical flow of 4-6 sections. Each section is a single "hero" with a cream oval or circle holding the section content. Alternate the pistachio circle side -- top section has it on the right, next on the left, next on the right. This creates a gentle zig-zag rhythm down the page.
- **Section spacing**: 120px vertical gap between sections. The large whitespace is a feature.
- **Footer**: Metadata row at the very bottom. No elaborate closing CTA -- keep the style's quiet-exit tradition.

### Slides (1920x1080px)

- **Typography scale up**: Display Hero at 88px. Section Heading at 64px. Body inside cream oval at 20px mixed-case or 16px uppercase. Metadata at 16px.
- **Padding**: 120px on all sides.
- **Layout**: Horizontal composition -- the pistachio circle is even larger (1400-1500px) and extends off the right edge. Cream oval is larger too (500px diameter) and positioned left-of-center.
- **Title slides**: Headline centered on the left half at 88px, pistachio circle right. Arrow indicator moved to bottom-right.
- **Content slides**: Cream oval is the focal point, positioned center-left. Pistachio circle fills the right third of the frame.
- **CTA slides**: Extra large cream oval (600px) dead-center. Pistachio circle behind, partially visible on both sides if needed.

### Poster (1080x1350px)

- **Typography**: Display Hero at 64px. Section Heading at 44px. Body at 14-16px.
- **Padding**: 80px left/right, 100px top/bottom.
- **Composition**: Top third -- headline centered in ALL CAPS. Middle third -- pistachio circle + cream oval composition. Bottom third -- body copy and CTA.
- **Vertical flow**: Content reads top-to-bottom. The pistachio circle in the middle acts as a visual anchor.
- **CTA placement**: Bottom zone, centered, small tracked uppercase label. No dark button -- the style never uses buttons. If a link is needed, it appears as uppercase underlined text.

### Story (1080x1920px) -- Vertical Mobile

- **Typography scale**: Display Hero at 72px (larger than carousel to account for tall format). Section Heading at 48px. Body inside cream oval at 14px uppercase or 18px mixed-case. Metadata at 14px.
- **Padding**: 120px left/right, 60px top/bottom. The wider horizontal padding keeps the headline reading as a narrow column, which matches the style's elegant feel.
- **Hero circle size**: ~1400px (roughly 30% bigger than the carousel's 1080px hero) so the off-frame pistachio circle remains the dominant shape at the tall aspect ratio. Position it at `right: -700px; top: 50%; transform: translateY(-50%)` or `bottom: -500px` for a bottom-anchored variant.
- **Composition**: The pistachio circle occupies roughly the lower-right quadrant or extends from the right edge across the middle vertical. The cream oval sits either above-center (if the pistachio is bottom) or center-left (if the pistachio is right).
- **Layout**: Headline top-third, centered ALL CAPS across the full content width (~840px). Cream oval center of slide holding the secondary phrase. Pistachio circle anchoring the bottom-right. Metadata at the bottom safe area (above the ~180px Instagram UI overlay zone).
- **Safe zones**: Reserve top 140px and bottom 240px for Instagram UI (profile, reply, reactions). Keep all critical text inside the middle 1540px vertical zone.
- **Swipe arrow**: Not needed for stories (single-screen format). Replace with a small uppercase "SWIPE UP" or "TAP" label in the bottom safe zone if a CTA is needed.
- **Story-specific convention**: Because the format is taller, the pistachio circle can be rotated to sit at the bottom-right corner (`right: -500px; bottom: -500px; top: auto; transform: none`) with the cream oval centered above it, creating a stacked vertical composition unique to story format.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Warm Cream | `#F5F1E6` | Primary background |
| Lighter Cream | `#FAF7EC` | Inner cream oval content container |
| Pale Pistachio | `#DCEAB4` | Large off-frame signature circle |
| Deeper Pistachio | `#C9DDA0` | Hover/active state for pistachio |
| Pistachio Outline | `#BFD390` | Optional thin outline frame |
| Near-Black | `#1A1A1A` | Primary text, arrow icon |
| Text Secondary | `#4A4A4A` | Body copy in cream oval |
| Text Metadata | `#5C5C5C` | Bottom-row tracked labels |
| Text Muted | `rgba(26,26,26,0.5)` | Slide numbers |
| Border Thin | `rgba(26,26,26,0.4)` | Arrow container outline |
| Outline Thin | `rgba(26,26,26,0.35)` | Optional frame outline |

### Font Declarations

```css
/* Display (headlines only, always UPPERCASE, weight 400) */
font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;

/* Body (metadata, small labels, long-form copy in oval) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-bg: #F5F1E6;
  --color-cream-light: #FAF7EC;
  --color-pistachio: #DCEAB4;
  --color-near-black: #1A1A1A;

  /* Colors -- Accent */
  --color-pistachio-deep: #C9DDA0;
  --color-pistachio-outline: #BFD390;

  /* Colors -- Neutral Scale */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #4A4A4A;
  --color-metadata: #5C5C5C;
  --color-text-muted: rgba(26, 26, 26, 0.5);

  /* Colors -- Surfaces */
  --color-surface-bg: #F5F1E6;
  --color-surface-container: #FAF7EC;
  --color-surface-accent: #DCEAB4;

  /* Colors -- Borders */
  --color-border-thin: rgba(26, 26, 26, 0.4);
  --color-border-outline: rgba(26, 26, 26, 0.35);
  --color-border-subtle: rgba(26, 26, 26, 0.12);
  --color-divider: rgba(26, 26, 26, 0.08);

  /* Colors -- Shadows (almost never used) */
  --shadow-none: transparent;
  --shadow-whisper: 0 2px 12px rgba(26, 26, 26, 0.03);
  --shadow-subtle: 0 4px 20px rgba(26, 26, 26, 0.06);

  /* Typography -- Families */
  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 56px;
  --text-section-heading: 40px;
  --text-sub-heading: 28px;
  --text-inner-headline: 20px;
  --text-body-large: 16px;
  --text-body: 13px;
  --text-metadata: 12px;
  --text-caption: 11px;
  --text-big-number: 72px;

  /* Typography -- Weights */
  --weight-display: 400;
  --weight-display-mid: 500;
  --weight-body: 400;
  --weight-metadata: 500;

  /* Typography -- Line Heights */
  --leading-display: 1.18;
  --leading-heading: 1.20;
  --leading-sub-heading: 1.25;
  --leading-inner: 1.30;
  --leading-body: 1.65;
  --leading-metadata: 1.40;
  --leading-number: 1.00;

  /* Typography -- Letter Spacing */
  --tracking-display: 2px;
  --tracking-heading: 1.5px;
  --tracking-sub: 1px;
  --tracking-inner: 0.5px;
  --tracking-body: 0.5px;
  --tracking-metadata: 1.5px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-oval-padding: 40px;
  --space-oval-padding-lg: 48px;
  --space-outer: 60px;
  --space-outer-wide: 80px;
  --space-story: 120px;

  /* Borders */
  --radius-circle: 50%;
  --radius-arrow: 14px;
  --border-thin: 1.5px;

  /* Signature Shape Sizing */
  --circle-hero-carousel: 1080px;
  --circle-hero-story: 1400px;
  --circle-hero-slides: 1500px;
  --circle-offset-right: -540px;
  --circle-offset-story: -700px;
  --oval-content-carousel: 340px;
  --oval-content-story: 380px;
  --oval-content-slides: 500px;
}
```

### System Font Fallbacks
- **Serif (if Playfair Display fails to load):** `Georgia, 'Times New Roman', serif`
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
