# Design Style: Split Yellow Product

## 1. Visual Theme & Atmosphere

Split Yellow Product is the design language of the contemporary product poster — a distilled marketing artifact inspired by modernist European furniture advertising and the confident editorial layouts found in magazines like Apartamento, Kinfolk's product reviews, and IKEA campaign posters. It is the visual equivalent of a product landing page collapsed into a single still frame: one booming headline, one crisp paragraph of voice, one clean hero shot, and nothing else. The defining move is a rigid 2/3 + 1/3 split of the canvas — the top two-thirds is a saturated mustard yellow block carrying a massive three-line headline, and the bottom third is subdivided horizontally into a warm gray body-copy panel and a darker olive-yellow panel holding the product photo.

The palette is deliberately restricted: a single dominant vivid mustard yellow (`#f4d624`) drives the composition, paired with a warm pale gray (`#e8e5dd`) that cools the bottom-left quadrant just enough to give the body copy breathing room, a darker yellow-to-olive gradient (`#e5c51a` → `#b59a00`) behind the product to create depth without introducing a new hue, and a near-black (`#141414`) that carries every piece of text. There is no white anywhere in the composition — the warm gray replaces it and keeps the temperature consistently warm. Inter at weight 900 handles the headline at 88-96px, left-aligned and slightly tucked into the top-left corner, treated as architecture rather than text. Inter 500 handles the body copy in the gray panel, and Inter 700 tracked uppercase handles the small brand wordmark anchored at the bottom-left corner. A single typeface family, one dominant color, and one structural grid — that is the entire style.

The mood is confident, catalog-grade, and Scandinavian-adjacent: it feels like a product ad torn from a design quarterly, a limited-edition furniture drop, or the cover of a lighting showroom's seasonal lookbook. It rejects minimalist neutrality in favor of a single assertive brand color, and it rejects maximalist collage in favor of a single architectural grid. The tension between the shouting headline on the top yellow slab and the quiet caption on the bottom gray panel is what makes it memorable — it reads like a poster that knows exactly what it wants to say.

**Key Characteristics:**
- Vivid mustard yellow (`#f4d624`) as the dominant surface — covers roughly 60% of the canvas in the top block and the bottom-right product panel
- Warm pale gray (`#e8e5dd`) for the body-copy panel — cools the composition without introducing white
- Near-black (`#141414`) for all text — headline and body — never pure black
- Inter 900 for the massive headline at 88-96px with slightly negative tracking (-2px)
- Inter 500 for body copy at 20-22px in near-black on the warm gray panel
- Inter 700 tracked uppercase for the small bottom-left brand wordmark
- Rigid 2/3 top + 1/3 bottom split, with the bottom subdivided roughly 45/55 into gray panel (left) + dark yellow panel (right)
- Darkening yellow gradient (`#e5c51a` → `#b59a00`) as the backdrop for product photography — yellow fading into olive at the bottom of the panel
- Left-aligned headline with top and left padding of 60-80px — the headline hugs the top-left corner
- No rounded corners, no shadows, no borders — structure comes entirely from the panel split and the flat color blocks
- Single product photo centered within the dark-yellow panel, occupying roughly 65-75% of the panel's height
- Brand wordmark set in two stacked lines, tracked 2-3px uppercase, anchored to the bottom-left corner with 40-60px padding

## 2. Color Palette & Roles

### Primary
- **Vivid Yellow** (`#f4d624`): The dominant surface color. Fills the entire top 2/3 of the canvas and serves as the starting point of the product photo gradient. This is a saturated school-bus/mustard yellow — vivid, warm, and unapologetic.
- **Near-Black** (`#141414`): The only text color in the composition. Used for the massive headline on the yellow block, for body copy on the gray panel, and for the brand wordmark. Never pure black — the slight warmth keeps it aligned with the palette.
- **Warm Pale Gray** (`#e8e5dd`): The body-copy panel background. A desaturated warm gray that cools the bottom-left quadrant just enough to let the body copy sit quietly while the rest of the poster shouts. Replaces white entirely in the composition.

### Accent
- **Dark Mustard** (`#e5c51a`): Top of the product photo gradient. A slightly darker, earthier yellow that connects the primary yellow block to the olive bottom without introducing a new hue.
- **Olive** (`#b59a00`): Bottom of the product photo gradient. A desaturated olive-yellow that grounds the product photo and gives it visual weight at the base of the composition.
- **Yellow-Hover** (`#e8c91a`): Slightly darker mustard for hover/active states when this style is adapted to web. Keeps interactivity on-palette.

### Neutral Scale
- **Gray Panel** (`#e8e5dd`): Primary warm gray for body-copy panel.
- **Gray Deep** (`#d9d6ce`): Slightly darker gray for subtle panel dividers or secondary surfaces.
- **Gray Text Secondary** (`#3a3a38`): For secondary metadata or lower-priority labels on the gray panel.
- **Gray Border** (`rgba(20, 20, 20, 0.12)`): Barely-there border for dividing adjacent panels if needed.
- **Muted Text** (`rgba(20, 20, 20, 0.55)`): Captions, attributions, footnote text.
- **Tracked Wordmark** (`#141414`): The bottom-left brand wordmark color — same as primary text.

### Surface & Borders
- **Surface Yellow** (`#f4d624`): Primary yellow block. Flat, no gradient.
- **Surface Gray** (`#e8e5dd`): Body-copy panel.
- **Surface Gradient Start** (`#e5c51a`): Top of the product photo panel.
- **Surface Gradient End** (`#b59a00`): Bottom of the product photo panel.
- **Border Default** (`rgba(20, 20, 20, 0.12)`): Optional hairline if two panels need a visible seam — in most compositions, panels butt directly against each other with no visible border.
- **Panel Seam** (`rgba(20, 20, 20, 0.08)`): The subtle divider between the yellow top block and the bottom split. Usually invisible — the color contrast does the work.
- **Divider Rule** (`rgba(20, 20, 20, 0.15)`): Thin rule for separating content within the gray panel if needed.

### Shadow Colors
- **Shadow None**: This style uses flat color blocks with no shadows. Depth comes entirely from the gradient in the product panel.
- **Shadow Product** (`rgba(120, 100, 0, 0.35)`): If the product photo needs a subtle cast shadow at its base, use this warm olive shadow tone — never a cool gray shadow.
- **Shadow Deep** (`rgba(40, 35, 0, 0.40)`): Deep olive shadow for the bottom of the product photo gradient, blending into the gradient.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
```

- **Display**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

Single family, four weights — 400, 500, 700, 900. The entire type system is Inter.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Inter | 92px | 900 | 0.95 | -2px | Massive headline on yellow block. Usually 3 lines. Slightly negative tracking tightens the heavy letterforms. |
| Display Small | Inter | 72px | 900 | 0.98 | -1.5px | Shorter 2-line headlines or smaller format variants. |
| Section Heading | Inter | 48px | 900 | 1.00 | -1px | Sub-headlines inside the gray panel or carousel slides. |
| Sub-heading | Inter | 28px | 700 | 1.15 | -0.3px | Section titles within body content. |
| Body Large | Inter | 22px | 500 | 1.45 | 0px | Lead paragraphs and primary body copy in the gray panel. |
| Body | Inter | 20px | 500 | 1.50 | 0px | Standard body copy — 5-7 lines in the bottom gray panel. Inter 500 is the default voice weight. |
| Body Bold | Inter | 20px | 700 | 1.50 | 0px | Emphasis within body paragraphs. |
| Small / Caption | Inter | 14px | 500 | 1.45 | 0.2px | Metadata, image credits, dates. |
| Big Numbers | Inter | 96px | 900 | 0.95 | -2.5px | Statistics, pricing, large data points. |
| Wordmark | Inter | 14px | 700 | 1.10 | 2.5px | Uppercase, tracked, stacked 2 lines. Brand mark anchored bottom-left. |
| CTA Text | Inter | 16px | 700 | 1.00 | 0.4px | Button text. Uppercase optional. |

### Principles
- **Single family, strict weight steps**: Inter handles everything. The distance between weight 500 and weight 900 does all the hierarchical work — there is no need for a second font family to create contrast.
- **Massive display, quiet body**: The headline at 92px Inter 900 and the body at 20px Inter 500 are the two typographic poles of the composition. Everything else is either support for or a variant on one of these two.
- **Negative tracking on heavy weights**: Inter 900 at display sizes needs slightly negative tracking (-1 to -2px) to prevent the heavy letterforms from looking loose. At body sizes, tracking is 0.
- **Left-aligned everything**: Both the headline and the body copy are left-aligned. Center alignment breaks the grid. The wordmark is anchored bottom-left, not centered.
- **Uppercase only for the wordmark**: The only uppercase element in this style is the tracked brand wordmark at the bottom-left. Headlines and body are always mixed case.
- **Line height tightens with weight**: Display Hero runs at 0.95 line height (tight, so the three lines stack like a slab). Body runs at 1.50 (airy, so 6-7 lines in a small panel remain readable).

## 4. Component Patterns

### Split Block Container (Signature Layout)

The structural backbone of the style. A rigid 2/3 + 1/3 grid where the top block is a single yellow slab and the bottom is subdivided into a gray body panel and a dark-yellow product panel.

```html
<div style="width: 1080px; height: 1350px; display: grid; grid-template-rows: 60% 40%; background: var(--color-yellow);">
  <!-- TOP: Yellow headline block -->
  <div style="background: var(--color-yellow); padding: 72px 72px 48px 72px; display: flex; align-items: flex-start;">
    <h1 style="font-family: var(--font-display); font-size: 92px; font-weight: 900; line-height: 0.95; letter-spacing: -2px; color: var(--color-near-black); margin: 0; max-width: 940px;">Where<br>design meets<br>atmosphere.</h1>
  </div>
  <!-- BOTTOM: Split into gray + dark yellow -->
  <div style="display: grid; grid-template-columns: 45% 55%; background: var(--color-gray-panel);">
    <!-- Bottom-left: Gray body panel -->
    <div style="background: var(--color-gray-panel); padding: 60px 40px 60px 72px; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
      <p style="font-family: var(--font-body); font-size: 20px; font-weight: 500; line-height: 1.50; color: var(--color-near-black); margin: 0;">A statement lamp designed to transform your space. Sculptural shape, warm ambient glow, timeless elegance.</p>
      <div style="font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-near-black); line-height: 1.10;">FORMA<br>LIGHTS</div>
    </div>
    <!-- Bottom-right: Dark yellow product panel -->
    <div style="background: linear-gradient(180deg, var(--color-gradient-start) 0%, var(--color-gradient-end) 100%); padding: 40px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
      <img src="[product-image]" alt="Product" style="max-width: 70%; max-height: 85%; object-fit: contain;" />
    </div>
  </div>
</div>
```

### Massive Yellow Headline Block

The signature headline treatment. Inter 900 at 92px, left-aligned with generous top padding, sitting on the primary yellow surface. The headline is the loudest element on the page and must dominate the top 60% of the canvas.

```html
<div style="background: var(--color-yellow); padding: 72px 72px 48px 72px; min-height: 60%;">
  <h1 style="font-family: var(--font-display); font-size: 92px; font-weight: 900; line-height: 0.95; letter-spacing: -2px; color: var(--color-near-black); margin: 0; max-width: 940px;">Where<br>design meets<br>atmosphere.</h1>
</div>
```

### Body Panel (Gray) with Wordmark

Warm pale gray body copy container with the brand wordmark anchored to the bottom-left corner. The body copy sits in the top portion of the panel and the wordmark anchors the bottom — the two elements are vertically spread using `justify-content: space-between`.

```html
<div style="background: var(--color-gray-panel); padding: 60px 40px 60px 72px; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 500; line-height: 1.50; color: var(--color-near-black); margin: 0; max-width: 320px;">A statement lamp designed to transform your space. Sculptural shape, warm ambient glow, timeless elegance.</p>
  <div style="font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-near-black); line-height: 1.10;">FORMA<br>LIGHTS</div>
</div>
```

### Product Photo Panel (Dark Yellow)

A darker yellow-to-olive gradient panel holding a centered product photograph. The gradient runs top-to-bottom: vivid mustard at the top blending into olive at the bottom. The product photo sits centered, occupying roughly 65-75% of the panel's vertical height.

```html
<div style="background: linear-gradient(180deg, var(--color-gradient-start) 0%, var(--color-gradient-end) 100%); display: flex; align-items: center; justify-content: center; padding: 40px; position: relative; overflow: hidden; height: 100%;">
  <img src="[product-image]" alt="Product hero" style="max-width: 72%; max-height: 80%; object-fit: contain; display: block;" />
</div>
```

### Numbered Item (Content Carousel Slide)

For content carousel slides that need numbered framework steps — numbers set large in Inter 900 on the yellow background with headline and body below.

```html
<div style="background: var(--color-yellow); padding: 72px; display: flex; flex-direction: column; gap: 24px;">
  <div style="font-family: var(--font-display); font-size: 120px; font-weight: 900; line-height: 0.85; letter-spacing: -3px; color: var(--color-near-black); margin: 0;">01</div>
  <h2 style="font-family: var(--font-display); font-size: 56px; font-weight: 900; line-height: 1.00; letter-spacing: -1px; color: var(--color-near-black); margin: 0; max-width: 720px;">Design that fills the room.</h2>
  <p style="font-family: var(--font-body); font-size: 22px; font-weight: 500; line-height: 1.45; color: var(--color-near-black); margin: 0; max-width: 620px;">Sculptural forms that define the atmosphere of a space without demanding attention.</p>
</div>
```

### Stat Display

A statistic presented in Inter 900 at display size on the yellow block, with a small supporting label below. Used for hero metrics or pricing callouts.

```html
<div style="background: var(--color-yellow); padding: 80px 72px; text-align: left;">
  <div style="font-family: var(--font-display); font-size: 160px; font-weight: 900; line-height: 0.90; letter-spacing: -4px; color: var(--color-near-black); margin: 0 0 16px;">86%</div>
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 500; line-height: 1.45; color: var(--color-near-black); margin: 0; max-width: 480px;">of customers say the lamp transformed how their space feels at night.</p>
</div>
```

### Comparison Grid (2-Column)

Two panels side-by-side, each with a heavy heading and body copy. Used for before/after, product variants, or feature comparison. One panel yellow, one panel gray — using the signature color split.

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; width: 100%; min-height: 520px;">
  <div style="background: var(--color-yellow); padding: 60px 48px; display: flex; flex-direction: column; justify-content: flex-end;">
    <h3 style="font-family: var(--font-display); font-size: 56px; font-weight: 900; line-height: 0.98; letter-spacing: -1px; color: var(--color-near-black); margin: 0 0 20px;">Warm glow</h3>
    <p style="font-family: var(--font-body); font-size: 20px; font-weight: 500; line-height: 1.50; color: var(--color-near-black); margin: 0;">2700K amber output tuned for evening ambient lighting in living rooms and bedrooms.</p>
  </div>
  <div style="background: var(--color-gray-panel); padding: 60px 48px; display: flex; flex-direction: column; justify-content: flex-end;">
    <h3 style="font-family: var(--font-display); font-size: 56px; font-weight: 900; line-height: 0.98; letter-spacing: -1px; color: var(--color-near-black); margin: 0 0 20px;">Cool focus</h3>
    <p style="font-family: var(--font-body); font-size: 20px; font-weight: 500; line-height: 1.50; color: var(--color-near-black); margin: 0;">4000K neutral output tuned for reading, working, and task lighting in studios.</p>
  </div>
</div>
```

### Quote Block

A pull quote set in Inter 700 at display size on the yellow block, with the attribution in tracked uppercase below. No quotation marks — the weight and size carry the emphasis.

```html
<div style="background: var(--color-yellow); padding: 80px 72px;">
  <p style="font-family: var(--font-display); font-size: 52px; font-weight: 900; line-height: 1.05; letter-spacing: -0.8px; color: var(--color-near-black); margin: 0 0 40px; max-width: 900px;">It felt less like turning on a light and more like changing the temperature of the room.</p>
  <div style="font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-near-black); line-height: 1.10;">SARAH CHEN<br>DESIGN DIRECTOR</div>
</div>
```

### CTA Block

A call-to-action using the signature split grid — headline on the yellow top, CTA button anchored in the gray bottom panel. The button is near-black with yellow text, inverting the main palette.

```html
<div style="display: grid; grid-template-rows: 65% 35%; width: 100%; height: 100%;">
  <div style="background: var(--color-yellow); padding: 72px 72px 40px 72px;">
    <h2 style="font-family: var(--font-display); font-size: 88px; font-weight: 900; line-height: 0.95; letter-spacing: -1.8px; color: var(--color-near-black); margin: 0;">Light your<br>space today.</h2>
  </div>
  <div style="background: var(--color-gray-panel); padding: 48px 72px; display: flex; align-items: center; justify-content: space-between;">
    <p style="font-family: var(--font-body); font-size: 20px; font-weight: 500; line-height: 1.45; color: var(--color-near-black); margin: 0; max-width: 360px;">Free shipping on orders over $200. Lifetime warranty.</p>
    <a style="display: inline-block; background: var(--color-near-black); color: var(--color-yellow); font-family: var(--font-body); font-size: 16px; font-weight: 700; letter-spacing: 0.4px; text-decoration: none; padding: 22px 48px; text-transform: uppercase;">Shop now</a>
  </div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap — between inline label and icon.
- **8px**: Tight gap — between stacked wordmark lines.
- **16px**: Base gap — between body paragraphs.
- **24px**: Small gap — between headline and body on carousel slides.
- **32px**: Medium gap — between section elements.
- **40px**: Panel inner spacing — padding inside the gray or dark yellow panels (top/bottom).
- **48px**: Block separation — vertical space between stacked content blocks.
- **60px**: Panel padding — standard horizontal padding inside the gray body panel.
- **72px**: Canvas padding — standard outer padding for poster and carousel formats (left/right, top).
- **80px**: Large outer padding — slides and hero sections.
- **120px**: Story format outer padding (top/bottom) — vertical safe zone for 1080x1920.

### Format Padding
| Format | Outer Padding | Top Block Height | Bottom Split |
|--------|---------------|------------------|--------------|
| Carousel (1080x1080) | 60px edges | 55% yellow | 45% (45/55 gray/dark-yellow) |
| Infographic (1080xN) | 60px left/right, 72px top/bottom | Variable | Stacked vertical sections |
| Slides (1920x1080) | 80px all sides | 60% yellow | 40% (45/55 gray/dark-yellow) |
| Poster (1080x1350) | 72px left/right, 72px top / 60px bottom | 58% yellow | 42% (45/55 gray/dark-yellow) |
| Story (1080x1920) | 120px top/bottom, 60px left/right | 55% yellow | 45% (45/55 gray/dark-yellow), hero ~30% bigger |

### Alignment & Grid
- **Primary alignment**: Everything is left-aligned. Headlines hug the top-left corner of the yellow block. Body copy sits against the left edge of the gray panel. The brand wordmark anchors the bottom-left. There is no center-aligned content in this style.
- **Grid**: The signature 2/3 top + 1/3 bottom split with the bottom subdivided 45/55 (gray panel / dark yellow panel) is the defining layout. The top yellow block is always a single undivided slab. The bottom is always split horizontally into exactly two panels. Three panels in the split breaks the style.
- **Headline placement**: The headline is left-aligned with top padding of ~72px and left padding of ~72px. It occupies up to 85% of the yellow block's width and hugs the top — never center-aligned vertically within the block.
- **Body panel gravity**: Body copy sits at the top of the gray panel with 60px top padding. The brand wordmark anchors the bottom-left with 60px bottom padding. The two are vertically spread with `justify-content: space-between`.
- **Product photo gravity**: The product photo is centered both horizontally and vertically within the dark yellow panel, occupying 65-75% of the panel's dimensions. The gradient behind it darkens from top to bottom to push the product photo toward the bottom visually.
- **Panel seams**: Panels butt directly against each other with no visible border. The color contrast between the yellow, gray, and dark yellow panels creates the structural separation.
- **Vertical rhythm**: The three elements of the composition — headline, body, product — each occupy their own distinct panel. Do not mix them. Do not add a fourth panel.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, flat color block | Yellow block, gray panel — all top-level surfaces |
| Gradient (Level 1) | `linear-gradient(180deg, #e5c51a 0%, #b59a00 100%)` | Product photo panel background only |
| Product Shadow (Level 2) | `0 20px 40px rgba(120, 100, 0, 0.35)` | Subtle cast shadow under product photo if needed |
| Inset Deep (Level 3) | `inset 0 -80px 120px rgba(40, 35, 0, 0.30)` | Darkened bottom of the product panel for extra depth |
| Modal Overlay (Level 4) | `0 32px 80px rgba(40, 35, 0, 0.45)` | Only for interactive overlays or expanded CTAs |

### Border Treatments
- **No standard borders**: This style does not use borders on components. Structure comes from the flat color panels.
- **Panel seam**: When two panels butt against each other, they share a 0px seam. The color contrast provides the visible separation.
- **Hairline divider** (`1px solid rgba(20, 20, 20, 0.12)`): Only used inside the gray panel when separating stacked content blocks within the same panel.
- **No rounded corners**: All corners are sharp 0px. Rounded corners break the structural grid.

### Surface Hierarchy
On this style, depth is communicated through color steps and gradients rather than shadows:
1. **Yellow Block** (`#f4d624`) — the loudest, most saturated surface. Dominates attention.
2. **Dark Yellow Gradient** (`#e5c51a` → `#b59a00`) — a deeper, darker step in the same hue. Creates a sense of recession behind the product photo.
3. **Gray Panel** (`#e8e5dd`) — the quietest surface. Cools the composition and provides the reading canvas for body copy.
4. **Near-Black Text** (`#141414`) — sits above all surfaces as the consistent text color.
5. **Near-Black Button** (`#141414` with yellow text) — the strongest anchor when used. Inverts the palette.

## 7. Do's and Don'ts

### Do
- Use vivid mustard yellow (`#f4d624`) as the dominant surface — it should cover roughly 55-65% of the total canvas area.
- Use near-black Inter 900 for headlines at 88-96px with slightly negative tracking (-1 to -2px).
- Use warm pale gray (`#e8e5dd`) for the body panel to cool the composition — this replaces white everywhere.
- Use the darkening yellow gradient (`#e5c51a` → `#b59a00`) as the photo backdrop, never a flat color behind product photos.
- Use the rigid 2/3 top + 1/3 bottom split as the structural backbone — the top is always undivided yellow, the bottom is always split into exactly two panels (gray + dark yellow).
- Left-align everything: headline, body copy, and wordmark.
- Anchor the brand wordmark to the bottom-left corner with 2.5px tracked uppercase in Inter 700, stacked on two lines.
- Keep headlines to 3 lines maximum on the primary yellow block — more than 3 lines breaks the density balance.
- Use Inter as the single font family at weights 400, 500, 700, and 900 only — no other weights.
- Center the product photo both horizontally and vertically within the dark yellow panel at 65-75% of the panel's dimensions.
- Use 72px as the default outer padding for poster and carousel formats, stepping up to 120px top/bottom for story format.

### Don't
- Don't use white backgrounds anywhere in the composition — the warm gray (`#e8e5dd`) replaces white entirely.
- Don't use non-Inter fonts — this is a single-family typographic system. No serifs, no monospace, no secondary fonts.
- Don't use more than 3 panels in the split — the 2/3 yellow + 1/3 (gray + dark yellow) structure is the signature and must not be subdivided further.
- Don't use pure black (`#000000`) or pure white (`#ffffff`) — always near-black (`#141414`) and warm gray (`#e8e5dd`).
- Don't use rounded corners on any panel — all panel corners are sharp 0px.
- Don't center-align the headline or body copy — everything is left-aligned.
- Don't use shadows on components — depth is carried by the product-panel gradient alone.
- Don't add borders to panels — structure comes from color contrast between adjacent panels.
- Don't use Inter weight 600 or weight 800 — only 400, 500, 700, and 900 are part of the system.
- Don't place the headline in the center or bottom of the yellow block — it must hug the top-left with 72px padding.
- Don't introduce a second accent color (red, blue, green) — the palette is strictly yellow family + warm gray + near-black.
- Don't use multiple product photos in the dark yellow panel — exactly one hero product, centered.
- Don't replace the darkening yellow gradient with a flat yellow behind product photos — the gradient-to-olive is essential for depth.

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
- **Typography scale down**: Display Hero becomes 80px (from 92px). Section Heading becomes 44px. Body stays 20px.
- **Padding**: 60px outer on all sides.
- **Layout**: The 2/3 + 1/3 split applies but is compressed. Top yellow block is 55% of height (594px). Bottom split is 45% (486px), subdivided 45/55 into gray body panel (~486px wide) and dark yellow product panel (~594px wide).
- **Cover slide**: Full signature layout — massive 3-line headline on yellow, body + wordmark on gray, product photo on dark yellow.
- **Content slides**: Numbered slides use the full yellow block with the number set at 120px Inter 900 in the top-left, headline below at 56px, body at 22px. No bottom split on content slides — keep the yellow block pure for dense numbered content.
- **CTA slide**: Use the CTA block pattern — yellow top with headline, gray bottom with body and dark near-black button.
- **Swipe indicator**: Small near-black dots at the bottom center of content slides only (8px diameter). Active dot in solid near-black, inactive in `rgba(20, 20, 20, 0.25)`.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Hero at 92px for the title section.
- **Padding**: 60px left/right. 72px top/bottom margins.
- **Section spacing**: Alternate between full-width yellow blocks and gray panels for vertical rhythm. Each major section is a full-width panel (either yellow or gray) with a heading and 2-4 content blocks inside.
- **Vertical flow**: Start with a signature 2/3 + 1/3 split hero at the top (55% yellow, 45% split). Below that, continue with alternating yellow and gray sections stacked vertically. End with a gray footer panel containing the wordmark.
- **Footer**: Gray panel (`#e8e5dd`), 120px tall, with the brand wordmark centered-left at 72px from the left edge.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 108px. Section Heading becomes 64px. Body Large becomes 24px.
- **Padding**: 80px on all sides.
- **Layout**: The 2/3 + 1/3 split applies horizontally for 16:9 — top yellow block is 60% of height (648px), bottom split is 40% (432px), subdivided 45/55 into gray (864px wide) and dark yellow (1056px wide).
- **Title slides**: Hero layout with massive headline on yellow block, body + wordmark on gray, product hero on dark yellow.
- **Content slides**: Full yellow block with left-aligned headline at 88px Inter 900, body at 24px Inter 500 in a 60% width column on the left. Right 40% reserved for a large product image or number callout.
- **CTA slides**: Split layout — yellow top with "Light your space today." at 108px, gray bottom with CTA button and supporting copy.

### Poster (1080x1350px) — PRIMARY FORMAT
- **Typography**: Display Hero at 92px (the reference value). Section Heading at 48px. Body at 20px.
- **Padding**: 72px left/right, 72px top, 60px bottom.
- **Composition**: The signature 2/3 + 1/3 split is the defining layout of this format.
  - **Top 58% (~783px tall)**: Solid yellow block (`#f4d624`) with the massive 3-line headline left-aligned, hugging the top-left corner with 72px top/left padding. The headline at 92px Inter 900 with -2px tracking and 0.95 line height stacks into three tight rows that occupy 70-80% of the block's height. Remaining space below the headline is empty yellow — let it breathe.
  - **Bottom 42% (~567px tall)**: Horizontally split into two panels with no visible border between them.
    - **Left panel (~45%, ~486px wide)**: Warm pale gray (`#e8e5dd`). Body copy in Inter 500 at 20px, 6-7 lines, left-aligned at the top with 60px top padding and 72px left padding. Brand wordmark ("FORMA / LIGHTS") anchored to the bottom-left with 60px bottom padding, 14px Inter 700 uppercase tracked 2.5px, stacked on two lines.
    - **Right panel (~55%, ~594px wide)**: Dark yellow gradient (`#e5c51a` → `#b59a00`) running top-to-bottom. Product photo centered both horizontally and vertically, occupying 70-75% of the panel's dimensions. No caption, no label — the product carries itself.
- **Vertical flow**: The poster reads top-to-bottom as a single statement — headline announces the concept, body explains it, product shows it.
- **No CTA**: The poster format does not include a button. The product photo is the CTA.

### Story (1080x1920px) — EXTENDED VERTICAL
- **Typography scale**: Display Hero at 96px Inter 900 — approximately 30% larger than the Carousel 72px equivalent to account for the taller canvas. Section Heading at 56px. Body Large at 24px Inter 500. Body at 22px Inter 500. Wordmark stays at 14px Inter 700 tracked 2.5px uppercase.
- **Padding**: 120px top/bottom (safe zones for platform UI), 60px left/right. Safe zones: 160px top reserved for profile avatar and progress bar, 160px bottom reserved for reply input. All critical content must sit inside y=160 to y=1760.
- **Composition**: The signature 2/3 + 1/3 split applies vertically with amplified proportions for the 9:16 canvas.
  - **Top 55% (~1056px tall, inside safe zone ~936px)**: Solid yellow block (`#f4d624`) with the massive 3-line headline left-aligned, hugging the top-left corner with 120px top padding (inside the safe zone) and 60px left padding. The headline at 96px Inter 900 with -2px tracking and 0.95 line height stacks into three tight rows. **The hero headline is approximately 30% bigger than the poster format to compensate for the taller canvas and longer viewing distance on mobile screens.** Let the bottom half of the yellow block breathe as empty yellow.
  - **Bottom 45% (~864px tall)**: Horizontally split into two panels with no visible border.
    - **Left panel (~45%, ~486px wide)**: Warm pale gray (`#e8e5dd`). Body copy in Inter 500 at 24px (scaled up for readability at arm's length on mobile), 6-8 lines, left-aligned at the top with 60px top padding and 60px left padding. Brand wordmark anchored bottom-left with 120px bottom padding (inside the safe zone), 14px Inter 700 uppercase tracked 2.5px, stacked on two lines.
    - **Right panel (~55%, ~594px wide)**: Dark yellow gradient (`#e5c51a` → `#b59a00`) running top-to-bottom. Product photo centered, ~30% larger than the poster format — occupying roughly 80% of the panel's dimensions to maximize product visibility on mobile.
- **Progress indicator**: Thin segments at the top of the safe zone (y=60 to y=72) — inactive in `rgba(20, 20, 20, 0.25)`, active in solid near-black (`#141414`). The dark-on-yellow progress bar reads cleanly without competing with the headline below.
- **Single slide concept**: Story format is a single slide — one concept, one headline, one product. Do not chain multiple content slides in this format.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Vivid Yellow | `#f4d624` | Primary surface, top yellow block |
| Near-Black | `#141414` | All text, wordmark, CTA button fill |
| Warm Pale Gray | `#e8e5dd` | Body copy panel, replaces white |
| Dark Mustard | `#e5c51a` | Top of product photo gradient |
| Olive | `#b59a00` | Bottom of product photo gradient |
| Yellow Hover | `#e8c91a` | Interactive hover state |
| Gray Deep | `#d9d6ce` | Secondary surface variant |
| Gray Text Secondary | `#3a3a38` | Secondary metadata text |
| Gray Border | `rgba(20, 20, 20, 0.12)` | Hairline dividers |
| Muted Text | `rgba(20, 20, 20, 0.55)` | Captions, footnotes |
| Shadow Product | `rgba(120, 100, 0, 0.35)` | Product cast shadow |
| Shadow Deep | `rgba(40, 35, 0, 0.40)` | Deep gradient shadow |

### Font Declarations

```css
/* Display & Body (single family) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-yellow: #f4d624;
  --color-near-black: #141414;
  --color-gray-panel: #e8e5dd;

  /* Colors -- Accent */
  --color-gradient-start: #e5c51a;
  --color-gradient-end: #b59a00;
  --color-yellow-hover: #e8c91a;

  /* Colors -- Neutral Scale */
  --color-gray-deep: #d9d6ce;
  --color-gray-text-secondary: #3a3a38;
  --color-gray-border: rgba(20, 20, 20, 0.12);
  --color-muted-text: rgba(20, 20, 20, 0.55);

  /* Colors -- Surfaces */
  --color-surface-yellow: #f4d624;
  --color-surface-gray: #e8e5dd;
  --color-surface-gradient: linear-gradient(180deg, #e5c51a 0%, #b59a00 100%);

  /* Colors -- Borders */
  --color-border-default: rgba(20, 20, 20, 0.12);
  --color-panel-seam: rgba(20, 20, 20, 0.08);
  --color-divider: rgba(20, 20, 20, 0.15);

  /* Colors -- Shadows */
  --shadow-product: 0 20px 40px rgba(120, 100, 0, 0.35);
  --shadow-deep: inset 0 -80px 120px rgba(40, 35, 0, 0.30);
  --shadow-overlay: 0 32px 80px rgba(40, 35, 0, 0.45);

  /* Typography -- Families */
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 92px;
  --text-display-small: 72px;
  --text-section-heading: 48px;
  --text-sub-heading: 28px;
  --text-body-large: 22px;
  --text-body: 20px;
  --text-small: 14px;
  --text-big-number: 96px;
  --text-wordmark: 14px;
  --text-cta: 16px;

  /* Typography -- Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 700;
  --weight-heavy: 900;

  /* Typography -- Line Heights */
  --leading-display: 0.95;
  --leading-heading: 1.00;
  --leading-sub-heading: 1.15;
  --leading-body-large: 1.45;
  --leading-body: 1.50;
  --leading-small: 1.45;
  --leading-wordmark: 1.10;

  /* Typography -- Letter Spacing */
  --tracking-display: -2px;
  --tracking-heading: -1px;
  --tracking-sub-heading: -0.3px;
  --tracking-body: 0px;
  --tracking-wordmark: 2.5px;
  --tracking-cta: 0.4px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-base: 16px;
  --space-small: 24px;
  --space-medium: 32px;
  --space-panel-inner: 40px;
  --space-block: 48px;
  --space-panel: 60px;
  --space-canvas: 72px;
  --space-large: 80px;
  --space-story-safe: 120px;

  /* Borders */
  --radius-none: 0px;

  /* Grid -- Signature Split */
  --split-top: 58%;
  --split-bottom: 42%;
  --split-bottom-left: 45%;
  --split-bottom-right: 55%;
}
```

### System Font Fallbacks
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **No serif fallback needed** — this style does not use serif typography.
