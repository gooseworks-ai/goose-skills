# Design Style: Mint Pixel Corporate

## 1. Visual Theme & Atmosphere

Mint Pixel Corporate is the design language of a friendly corporate newsletter — the visual equivalent of a Canva business-tips template that a mid-market ops team actually wants to open on a Monday morning. It pairs the warmth of a Mailchimp campaign with the quietly branded structure of a printed internal magazine, and it gets its identity from one unusual choice: **tiny pixel-art staircases of green squares**, scattered in the corners of every slide like Minecraft blocks that escaped into a business deck. The feel is corporate-friendly rather than corporate-sterile. Think of a family-run design agency pitching to a regional bank, or a LinkedIn Learning course on sustainable leadership — polite, upbeat, and unmistakably templated in the best possible way.

The palette runs on a **two-background variant system**. Cover slides are set on a saturated **forest green** (`#207A3E`) canvas with light cream typography, anchoring the deck with editorial weight. Content slides flip to a pale **mint cream** (`#EAF4C3`) canvas — an almost-pastel yellow-green that reads as airy, nostalgic, and unmistakably "wellness brochure." Inside both variants, the same accent machinery does the work: saturated **lime green** (`#A4D23C`) blocks, rounded rectangles, and a short dark forest green (`#1E6B3A`) for shadow offsets and pixel accents. The lime and forest tones nest together — lime always sits in front, forest always behind — creating a shallow 2-tone offset that makes every photo, headline slab, and decorative square look gently extruded from the page.

Typography is a single humanist sans (**Nunito**) used at 400/600/700 for everything from the 40px section heading down to the 12px metadata strip. There is no serif anywhere in the system — the friendliness comes entirely from Nunito's slightly rounded terminals and warm x-height, reinforced by **justified body text** that gives every content slide the quiet gravity of a printed newsletter column. The signature decorative elements — the pixel staircase clusters, the lime-green asterisk/snowflake glyph inside a tiny square, the offset photo containers with a colored rectangle peeking out behind — are small, repeatable, and deeply load-bearing. Skip them and the style collapses into any other mint-and-green template. Commit to them and the deck instantly reads as "Mint Pixel Corporate."

**Key Characteristics:**
- Two-background variant system: forest green (`#207A3E`) cover + pale mint cream (`#EAF4C3`) content slides — never mix on the same slide
- Pixel staircase corner decorations: 4-6 small 16-24px squares in lime (`#A4D23C`) + forest (`#1E6B3A`), arranged in a staircase/pixel-art stagger
- Lime green (`#A4D23C`) for headline slab backgrounds, accent squares, and the photo offset rectangle
- Dark forest green (`#1E6B3A`) for text on mint backgrounds, pixel accents, and the photo offset base
- Cream (`#F5F8E6`) for all text on the forest green cover
- Nunito at 700 for headlines, 400 for justified body text, 600 for metadata strip — no serif anywhere
- Offset photo containers: rounded-corner image with a lime green rectangle peeking out ~20px down/right as a color shadow
- Lime green square (32-40px) containing a white asterisk glyph (`❋` or `*`) as a decorative accent
- 3-column header metadata strip ("Brand | Category | Date") at top of every content slide with thin vertical dividers
- Justified body text (`text-align: justify`) — never left-ragged on content slides
- Headlines sit inside a full-width or half-width lime green rounded rectangle slab
- Footer row with author name (left) and handle (right), separated by a vertical divider

## 2. Color Palette & Roles

### Primary
- **Forest Green** (`#207A3E`): Cover slide background. A saturated, friendly forest green — the exact shade of a healthy houseplant in good light.
- **Mint Cream** (`#EAF4C3`): Content slide background. A pale yellow-green, almost pastel lime. The slide surface for every non-cover page.
- **Dark Forest** (`#1E6B3A`): Primary text color on mint backgrounds, pixel accent color, and the darker half of the offset photo container. Slightly deeper than the cover background so it reads as type weight, not camouflage.

### Accent
- **Lime Green** (`#A4D23C`): The primary accent. Used for headline slab backgrounds, pixel corner squares, offset photo rectangles, and asterisk accent squares. Saturated but not neon.
- **Lime Light** (`#B4DC48`): Slightly brighter lime used for hover/active states and secondary pixel squares for depth variation within a staircase cluster.
- **Cream** (`#F5F8E6`): Text color on the forest green cover. A warm off-white with a hint of the same yellow-green as the mint background.

### Neutral Scale
- **Text Primary Mint** (`#1E6B3A`): Dark forest for all body text on mint content slides.
- **Text Primary Cover** (`#F5F8E6`): Cream for all text on the forest green cover.
- **Text Secondary** (`#3E8A4E`): A mid forest tone for metadata, captions, and the header strip on mint slides.
- **Text Muted** (`#6BA36B`): Softer mid-green for tertiary metadata on cover (e.g., "December, 2028" subdued variant).
- **Border Soft** (`rgba(30, 107, 58, 0.2)`): Thin dividers in the header strip and footer row.
- **Border Strong** (`rgba(30, 107, 58, 0.4)`): Higher-contrast divider for separators that need to carry weight.

### Surface & Borders
- **Surface Cover** (`#207A3E`): Primary cover surface.
- **Surface Content** (`#EAF4C3`): Primary content slide surface.
- **Surface Slab** (`#A4D23C`): Lime green rectangle slab behind headlines and as photo offset background.
- **Surface Photo Offset** (`#1E6B3A`): Dark forest rectangle used as the secondary offset layer behind photos for two-tone depth.
- **Border Slab** (`rgba(30, 107, 58, 0.0)`): Lime slabs are borderless — they rely on the mint background for separation.
- **Divider Vertical** (`1px solid rgba(30, 107, 58, 0.25)`): Thin vertical rule between header strip columns and footer name/handle.

### Shadow Colors
- **Shadow Pixel** (`#1E6B3A`): Used as an offset "color shadow" — not a blur, just a solid dark forest square peeking out from behind a lime element.
- **Shadow Ambient** (`rgba(30, 107, 58, 0.08)`): Very light forest-tinted ambient shadow for elevated photo containers.
- **Shadow Deep** (`rgba(30, 107, 58, 0.15)`): Slightly deeper variant for featured cards and headline slabs if additional lift is needed.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display**: `'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

Mint Pixel Corporate uses a single-family system. Nunito carries headlines, body, metadata, and accents. The friendliness comes from its slightly rounded terminals, warm x-height, and wide apertures — it is the humanist sans that looks most like a hand-lettered business card without drifting into comic-sans territory.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Cover Hero | Nunito | 52px | 700 | 1.15 | -0.3px | Cover slide headline on forest green. Cream text. Mixed case. |
| Section Heading | Nunito | 40px | 700 | 1.18 | -0.2px | Content slide headline inside lime slab. Dark forest text. |
| Sub-heading | Nunito | 28px | 700 | 1.25 | 0px | Secondary headlines and large callouts. |
| Body Large | Nunito | 18px | 400 | 1.60 | 0px | Intro paragraphs and lead copy. Justified. |
| Body | Nunito | 16px | 400 | 1.65 | 0px | Standard body text. Always `text-align: justify` on content slides. |
| Body Bold | Nunito | 16px | 700 | 1.65 | 0px | Emphasis words inside body copy. |
| Metadata | Nunito | 12px | 600 | 1.40 | 0.3px | Header strip ("Arowwai Industries", "Business Tips", "December, 2028"). Mixed case. |
| Footer Label | Nunito | 13px | 600 | 1.40 | 0.2px | Author name and handle at bottom. |
| Small / Caption | Nunito | 12px | 500 | 1.50 | 0px | Photo captions and auxiliary labels. |
| Big Number | Nunito | 64px | 800 | 1.00 | -0.5px | Statistics and key metrics on content slides. |
| CTA Text | Nunito | 14px | 700 | 1.00 | 0.3px | Button labels. |

### Principles
- **Single family discipline**: Every text element uses Nunito. Do not mix in a serif, a monospace, or a display font. The consistency is what makes the system feel templated-in-a-good-way.
- **Weight as hierarchy**: Use weight (400/600/700/800) rather than font family to establish hierarchy. Headlines are 700. Body is 400. Metadata is 600 to stand apart from body.
- **Justified body text is mandatory**: On every content slide, body paragraphs use `text-align: justify` with `hyphens: auto`. This is the clearest visual tell of the style — left-ragged body text instantly breaks the look.
- **Moderate headline size**: Headlines sit around 40-52px — large enough to command, small enough to fit inside a lime slab without overflowing. Never scale past 64px.
- **Mixed case always**: Headlines and body are mixed case with sentence-case capitalization. Uppercase is reserved only for nothing — even the metadata strip uses Title Case.
- **Tight tracking on headlines, neutral on body**: Headlines use `-0.2px` to `-0.3px` letter-spacing to tighten the rounded letterforms. Body stays at 0px.
- **Line height for warmth**: Body at 1.60-1.65 creates airy, newsletter-column reading. Headlines at 1.15-1.18 keep them compact inside the lime slab.

## 4. Component Patterns

### Title Block -- Cover Slide (forest green variant)

```html
<div style="background-color: var(--color-cover-bg); padding: 60px 60px 80px; position: relative; min-height: 900px; display: flex; flex-direction: column;">
  <!-- Header metadata strip -->
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; gap: 0; padding-bottom: 48px;">
    <div style="font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-cream); opacity: 0.85;">Arowwai Industries</div>
    <div style="text-align: center; font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-cream); opacity: 0.85; border-left: 1px solid rgba(245,248,230,0.35); border-right: 1px solid rgba(245,248,230,0.35); padding: 4px 0;">Business Tips</div>
    <div style="text-align: right; font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-cream); opacity: 0.85;">December, 2028</div>
  </div>

  <!-- Hero headline -->
  <h1 style="font-family: var(--font-display); font-size: 52px; font-weight: 700; line-height: 1.15; letter-spacing: -0.3px; color: var(--color-cream); text-align: center; margin: 24px 0 40px;">Leadership and<br>Business Lessons for<br>Sustainable Growth</h1>

  <!-- Offset photo container (see dedicated component below) -->
  <div style="flex: 1;"><!-- photo with pixel decorations goes here --></div>

  <!-- Footer row -->
  <div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding-top: 40px;">
    <div style="font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--color-cream); opacity: 0.85;">Hannah Morales</div>
    <div style="width: 1px; height: 16px; background: rgba(245,248,230,0.35);"></div>
    <div style="text-align: right; font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--color-cream); opacity: 0.85;">@reallygreatsite</div>
  </div>
</div>
```

### Title Block -- Content Slide (mint variant)

```html
<div style="background-color: var(--color-content-bg); padding: 48px 60px 60px; position: relative; min-height: 900px; display: flex; flex-direction: column;">
  <!-- Header metadata strip -->
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; gap: 0; padding-bottom: 40px;">
    <div style="font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-text-secondary);">Arowwai Industries</div>
    <div style="text-align: center; font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-text-secondary); border-left: 1px solid rgba(30,107,58,0.25); border-right: 1px solid rgba(30,107,58,0.25); padding: 4px 0;">Business Tips</div>
    <div style="text-align: right; font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-text-secondary);">December, 2028</div>
  </div>

  <!-- Headline inside lime slab -->
  <div style="background: var(--color-lime); border-radius: 12px; padding: 40px 44px; margin: 32px 0 40px;">
    <h2 style="font-family: var(--font-display); font-size: 40px; font-weight: 700; line-height: 1.18; letter-spacing: -0.2px; color: var(--color-text-primary); margin: 0;">Lead with Long-<br>Term Vision</h2>
  </div>

  <!-- Body (justified) -->
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-text-primary); text-align: justify; hyphens: auto; max-width: 640px; margin: 0;">Sustainable growth begins with clarity of direction. Strong leaders focus not only on short-term results but also on long-term impact. A clear vision helps teams stay aligned, make better decisions, and build momentum that lasts beyond temporary success.</p>

  <!-- Footer row -->
  <div style="margin-top: auto; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding-top: 40px;">
    <div style="font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--color-text-secondary);">Hannah Morales</div>
    <div style="width: 1px; height: 16px; background: rgba(30,107,58,0.3);"></div>
    <div style="text-align: right; font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--color-text-secondary);">@reallygreatsite</div>
  </div>
</div>
```

### Pixel Staircase Corner (the signature)

A cluster of 4-6 small squares arranged in a staircase/pixel-art stagger. Place in slide corners, next to headline slabs, and beside photos. Mix lime and dark forest squares for depth.

```html
<!-- Top-left pixel staircase (descending) -->
<div style="position: absolute; top: 120px; left: 60px; width: 80px; height: 80px;">
  <div style="position: absolute; top: 0; left: 0; width: 28px; height: 28px; background: var(--color-lime); border-radius: 2px;"></div>
  <div style="position: absolute; top: 0; left: 32px; width: 20px; height: 20px; background: var(--color-dark-forest); border-radius: 2px;"></div>
  <div style="position: absolute; top: 32px; left: 20px; width: 16px; height: 16px; background: var(--color-lime); border-radius: 2px;"></div>
  <div style="position: absolute; top: 40px; left: 40px; width: 24px; height: 24px; background: var(--color-dark-forest); border-radius: 2px;"></div>
</div>

<!-- Small 3-square staircase (bottom-right of a photo) -->
<div style="position: absolute; bottom: -12px; right: -12px; width: 60px; height: 60px;">
  <div style="position: absolute; top: 0; right: 28px; width: 16px; height: 16px; background: var(--color-lime); border-radius: 2px;"></div>
  <div style="position: absolute; top: 12px; right: 12px; width: 20px; height: 20px; background: var(--color-dark-forest); border-radius: 2px;"></div>
  <div style="position: absolute; bottom: 0; right: 0; width: 24px; height: 24px; background: var(--color-lime); border-radius: 2px;"></div>
</div>
```

**Rules for the staircase:**
- Always 3-6 squares. Never a single isolated square (looks like a bullet point); never more than 6 (looks like a mosaic).
- Squares are 14-28px. Mix at least two sizes per cluster.
- Alternate lime and dark forest — never two lime touching without a dark forest between, never two dark forests touching.
- Each square has `border-radius: 2px` (softened, not sharp — matches the rounded headline slab).
- Staircase direction varies per corner: top-left descends down-and-right, top-right descends down-and-left, etc.
- Use at least one staircase cluster per slide. Two clusters on content slides is standard.

### Offset Photo Container

A photo in a rounded rectangle with a lime green rectangle peeking out ~20px down/right behind it, plus an optional dark forest rectangle at the opposite offset. This is the "Canva stacked photo" pattern.

```html
<div style="position: relative; display: inline-block; width: 360px; height: 240px; margin: 20px 20px 32px 0;">
  <!-- Lime offset rectangle (back layer) -->
  <div style="position: absolute; top: 20px; left: 20px; width: 100%; height: 100%; background: var(--color-lime); border-radius: 12px;"></div>
  <!-- Dark forest offset rectangle (secondary back layer) -->
  <div style="position: absolute; top: -12px; left: -12px; width: 60px; height: 60px; background: var(--color-dark-forest); border-radius: 4px;"></div>
  <!-- Photo (front layer) -->
  <img src="PHOTO_URL" alt="" style="position: relative; width: 100%; height: 100%; object-fit: cover; border-radius: 12px; display: block;">
</div>
```

**Rules:**
- The lime rectangle is always offset 16-24px in one diagonal direction (typically down-right).
- Photos are always rounded 12px. Lime offset matches the same radius.
- Optional dark forest "corner block" can be added at the opposite corner for extra two-tone depth.
- Pair every offset photo with at least one pixel staircase cluster near its corner.

### Asterisk Square Accent

A small lime-green square containing a white or dark forest asterisk/snowflake glyph. Used as a decorative "dot" near headlines, photos, or section breaks.

```html
<div style="display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: var(--color-lime); border-radius: 4px; font-family: var(--font-body); font-size: 24px; font-weight: 700; color: var(--color-cream); line-height: 1;">❋</div>
```

**Variants:**
- 32px square + 18px glyph: inline accent near body text.
- 40px square + 24px glyph: near headlines and photos (standard).
- 56px square + 32px glyph: prominent cover slide accent.
- Glyph options: `❋`, `✳`, `✤`, or a plain `*`. The `❋` (eight-pointed snowflake) is the closest to the reference.
- On the forest cover, glyph is cream (`#F5F8E6`); on mint content slides, glyph is cream or dark forest depending on contrast.

### Header Metadata Strip

A 3-column top bar with brand name, category, and date separated by thin vertical dividers. Mandatory on every content slide.

```html
<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; gap: 0; padding-bottom: 40px;">
  <div style="font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-text-secondary);">Arowwai Industries</div>
  <div style="text-align: center; font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-text-secondary); border-left: 1px solid rgba(30,107,58,0.25); border-right: 1px solid rgba(30,107,58,0.25); padding: 4px 0;">Business Tips</div>
  <div style="text-align: right; font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-text-secondary);">December, 2028</div>
</div>
```

**Rules:**
- Always 3 columns, equal width, grid-based (not flex with justify-between — must be true thirds).
- Left column: brand name, left-aligned. Middle: category, center-aligned. Right: date, right-aligned.
- Vertical dividers are `1px solid rgba(30,107,58,0.25)` on the middle column's left and right borders.
- Text is Nunito 12px, weight 600, mixed case, color `--color-text-secondary` on mint or cream with 0.85 opacity on cover.

### Numbered Item

```html
<div style="display: flex; gap: 20px; padding: 20px 0;">
  <div style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: var(--color-lime); border-radius: 8px; font-family: var(--font-body); font-size: 20px; font-weight: 800; color: var(--color-text-primary);">1</div>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-text-primary); text-align: justify; hyphens: auto; margin: 0;">Sustainable growth begins with clarity of direction. Strong leaders focus not only on short-term results but also on long-term impact.</p>
</div>
```

### Stat Display

```html
<div style="display: inline-block; padding: 28px 36px; background: var(--color-lime); border-radius: 12px; text-align: left;">
  <p style="font-family: var(--font-display); font-size: 64px; font-weight: 800; line-height: 1.00; letter-spacing: -0.5px; color: var(--color-text-primary); margin: 0 0 4px;">47%</p>
  <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; line-height: 1.40; color: var(--color-text-primary); margin: 0; text-transform: none;">Faster response times</p>
</div>
```

### Quote Block

```html
<div style="padding: 36px 40px; background: var(--color-lime); border-radius: 12px; position: relative;">
  <p style="font-family: var(--font-body); font-size: 22px; font-weight: 700; line-height: 1.40; color: var(--color-text-primary); margin: 0 0 20px; text-align: justify; hyphens: auto;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 24px; height: 2px; background: var(--color-text-primary); border-radius: 1px;"></div>
    <p style="font-family: var(--font-body); font-size: 12px; font-weight: 600; letter-spacing: 0.3px; color: var(--color-text-primary); margin: 0;">Sarah Chen, VP Operations</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: var(--color-content-bg); position: relative;">
  <h2 style="font-family: var(--font-display); font-size: 40px; font-weight: 700; line-height: 1.18; letter-spacing: -0.2px; color: var(--color-text-primary); margin: 0 0 20px;">Meet your new coworker</h2>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-text-primary); max-width: 520px; margin: 0 auto 36px;">Deploy your first AI coworker in minutes. Start free, scale when ready.</p>
  <a style="display: inline-block; background: var(--color-lime); color: var(--color-text-primary); font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 0.3px; text-decoration: none; padding: 16px 40px; border-radius: 28px;">Get Started Free</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap — pixel staircase inter-square spacing, badge internal padding.
- **8px**: Tight gap — between metadata strip label and divider, numbered item icon gap.
- **12px**: Small gap — between headline lines, between footer name and divider.
- **16px**: Base gap — between body paragraphs, between pixel cluster squares in some arrangements.
- **20px**: Photo offset distance — the canonical "stacked photo" offset value.
- **24px**: Medium gap — between section heading and body text, between headline slab and next element.
- **32px**: Block gap — between headline slab and body copy, between metadata strip and headline on content slides.
- **40px**: Section gap — between major content blocks, between header strip and headline, between body and footer.
- **48px**: Large section gap — between cover header strip and hero headline.
- **60px**: Outer padding — standard left/right canvas padding.
- **80px**: Maximum padding — vertical padding on cover and Story formats.
- **120px**: Story format horizontal padding (wider canvas for 1080x1920).

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| **Story (1080x1920)** | **120px left/right, 60px top/bottom** | **840px** |

### Alignment & Grid
- **Primary alignment**: Left-aligned for headlines and body on content slides; center-aligned for cover slide hero. Body text is always `text-align: justify`.
- **Grid**: The header metadata strip is always a 3-column grid (`1fr 1fr 1fr`). The footer row is a 3-column grid (`1fr auto 1fr`) with a vertical divider in the middle.
- **Headline slab width**: Lime headline slabs are either full-width (left and right aligned to content max-width) or partial-width (60-75% of content area) leaving room for a photo or pixel cluster beside them.
- **Photo placement**: Offset photo containers sit top-left, top-right, or inline-left of a body paragraph. Never centered.
- **Pixel staircase anchoring**: Every slide has at least one pixel cluster near a corner. Content slides typically have two (diagonally opposite corners).
- **Vertical rhythm**: Maintain 32-40px gaps between headline slab and body, 40-48px gaps between major sections.
- **Content gravity on Story format**: On 1080x1920, stack elements vertically with more breathing room — headline slab, offset photo, body, pixel accent — each separated by 48-60px.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, solid background color | Canvas (cover or mint), most slides |
| Color Offset (Level 1) | `20px` lime or dark forest solid rectangle offset behind an element | Photo containers, the signature "stacked" effect |
| Soft (Level 2) | `0 4px 12px rgba(30,107,58,0.08)` | Optional subtle lift on headline slabs |
| Elevated (Level 3) | `0 8px 24px rgba(30,107,58,0.12)` | Featured quote blocks, CTA buttons on hover |
| Overlay (Level 4) | `0 16px 40px rgba(30,107,58,0.18)` | Modals or floating callouts (rarely used) |

### Border Treatments
- **No visible borders on slabs**: Lime headline slabs and photo containers have zero border — they rely on color contrast against the mint background.
- **Thin metadata dividers**: `1px solid rgba(30,107,58,0.25)` for vertical dividers in the header strip and footer row.
- **Pixel square rounding**: All pixel-cluster squares use `border-radius: 2px` — softened enough to harmonize with the rounded slabs, sharp enough to still read as pixel-art.
- **Slab corner radius**: Lime headline slabs and photo containers use `border-radius: 12px`. Small asterisk accent squares use `border-radius: 4px`. Buttons use `border-radius: 28px`.
- **No stroke-based dividers on body**: Do not use horizontal rules (`<hr>`) — sections are separated by whitespace and color-block transitions, never by lines.

### Surface Hierarchy
Depth in Mint Pixel Corporate is communicated through **color offset**, not through blur shadows:
1. **Background** (mint `#EAF4C3` or cover `#207A3E`) — flat canvas.
2. **Color offset layer** (lime `#A4D23C` or dark forest `#1E6B3A`) — solid rectangle peeking out behind a photo or slab, creating a 2-tone "stacked" effect. This is the primary depth signal.
3. **Foreground element** (photo, headline slab, body text) — sits above the offset.
4. **Pixel accents** (staircase clusters, asterisk squares) — float on top, structurally decorative, never functional.
Blur shadows are almost never used. When they are, they are subtle and tinted with dark forest for palette consistency.

## 7. Do's and Don'ts

### Do
- **Use the pixel staircase corner decoration on every slide.** It is the signature — at least one cluster of 3-6 lime and dark forest squares per slide, usually two on content slides in diagonally opposite corners.
- **Use the two-background variant system strictly.** Cover slide uses forest green (`#207A3E`). All content slides use mint cream (`#EAF4C3`). Never mix a forest element into a mint slide or vice versa beyond the lime accent system.
- **Always include the 3-column header metadata strip on content slides.** `Brand Name | Category | Date` with thin vertical dividers between columns.
- **Use justified body text (`text-align: justify; hyphens: auto;`) on every content slide.** Left-ragged body text instantly breaks the look.
- **Use lime green (`#A4D23C`) as the primary accent for headline slabs, photo offsets, and accent squares.** It is the only saturated color on mint slides.
- **Use Nunito for everything.** Headlines at 700, body at 400, metadata at 600. No serif, no monospace, no secondary display font.
- **Use the offset photo container pattern.** A photo with a lime rectangle peeking 20px down-right behind it, optionally with a dark forest corner block at the opposite offset.
- **Include the asterisk glyph (`❋`) inside a small lime square** as a decorative accent near headlines or photos — at least once per deck.
- **Set headlines inside a lime rounded rectangle slab** rather than letting them float on the mint canvas.
- **Use dark forest (`#1E6B3A`) as the only text color on mint slides.** Cream (`#F5F8E6`) is the only text color on the cover.
- **Keep headlines at 40-52px.** Moderate scale, never massive.
- **Include the author name + handle footer row** with a vertical divider between them on every slide.

### Don't
- **Don't use serif fonts.** Playfair, Cormorant, Fraunces — any serif will kill the friendly newsletter feel. Nunito only.
- **Don't use saturated colors outside the forest + lime + mint system.** No blues, no reds, no oranges, no purples. Even within green, stay on the exact forest/lime/mint triad.
- **Don't skip the pixel staircase decoration.** It is the identity. A Mint Pixel Corporate slide without pixel clusters is just a beige Canva template.
- **Don't use left-ragged body text.** Always justify.
- **Don't use massive 72px+ headlines.** The style is moderate-scale — headlines top out at 52px on the cover, 40px on content slides.
- **Don't mix the two backgrounds on a single slide.** Forest green is cover-only. Mint is content-only.
- **Don't use sharp corners on photos, slabs, or buttons.** Everything has `border-radius: 12px` (slabs/photos) or `border-radius: 4px` (small accents) or `border-radius: 28px` (buttons).
- **Don't use drop-shadow blur for depth.** Use the color-offset stacked pattern — a solid lime or dark forest rectangle behind an element — as the primary depth signal.
- **Don't use a single pixel square by itself** — it reads as a bullet point. Always 3-6 squares in a cluster.
- **Don't use uppercase headlines or body text.** Mixed case only.
- **Don't skip the header metadata strip on content slides.** The "Brand | Category | Date" bar is load-bearing.
- **Don't use emoji or illustrative icons.** The asterisk glyph (`❋`) is the only decorative glyph in the system.

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
- **Typography scale**: Cover Hero at 52px. Section Heading (content) at 40px. Body at 16px. Metadata at 12px.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Forest green background. Header metadata strip at top in cream. Hero headline centered in cream, 3 lines max. Offset photo container below, centered or left-aligned with pixel staircase clusters in corners. Footer row at bottom with name/handle.
- **Content slides**: Mint cream background. Header metadata strip (mandatory). Lime headline slab below strip (full or partial width). Justified body paragraph under slab. Optional offset photo in top-right or top-left. Pixel staircase clusters in 2 diagonal corners. Footer row at bottom.
- **Swipe indicator**: Small 8px dark forest squares at bottom center, active one in lime — matching the pixel aesthetic.

### Infographic (1080px wide, variable height)
- **Typography**: Cover Hero at 52px for the top section. Section Heading at 40px for each block.
- **Padding**: 60px left/right, 80px top/bottom. Vertical content flows continuously.
- **Top section**: Forest green "cover" band (300-400px tall) with title and metadata strip, followed by mint cream sections below.
- **Section spacing**: 60px vertical gap between mint content sections. Each section gets its own lime headline slab and justified body paragraph.
- **Pixel clusters**: Place 1 cluster per section, alternating corners down the page to create rhythm.
- **Footer**: Mint band with footer row (name + handle) and a pixel staircase cluster in each bottom corner.

### Slides (1920x1080px)
- **Typography scale up**: Cover Hero at 72px. Section Heading at 56px. Body Large at 20px. Body at 18px. Metadata at 14px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Two-column friendly. Left column holds the lime headline slab + justified body paragraph; right column holds the offset photo container with pixel staircase clusters around it.
- **Cover slide**: Forest green full-bleed. Centered hero title. Offset photo below title, 50-60% width, with pixel clusters. Footer row at bottom.
- **Content slides**: Mint background. Header strip at top (mandatory). Left: lime slab headline + justified body. Right: offset photo with pixel clusters. Footer row at bottom.
- **CTA slides**: Mint background. Centered headline in lime slab, short body, lime rounded button, pixel clusters in all four corners.

### Poster (1080x1350px)
- **Typography**: Cover Hero at 60px. Section Heading at 44px. Body at 17px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for metadata strip + hero headline (inside lime slab if mint variant, or cream type if forest variant). Middle third for offset photo container (larger — up to 480px wide). Bottom third for justified body paragraph and footer row.
- **Vertical flow**: Reads top-to-bottom. Pixel staircase clusters appear at least in 2 corners (typically top-left and bottom-right).
- **Variant choice**: Forest green for event/announcement posters; mint for editorial/content posters.

### Story (1080x1920px)
- **Typography scale up (~30% bigger than carousel)**: Cover Hero at **68px** (52 × 1.3). Section Heading at **52px** (40 × 1.3). Body Large at **22px**. Body at **20px** (16 × 1.25 for legibility at arm's length on phone). Metadata at **14px**. Footer at **16px**.
- **Padding**: **120px left/right, 60px top/bottom**. Content area is 840x1800px. The wider side padding keeps content in the "safe zone" clear of phone UI overlays (profile pic, reply bar, tap zones).
- **Cover slide (forest green)**: Metadata strip at top in cream. Hero headline centered, 3-4 lines, cream type at 68px. Offset photo container mid-canvas, ~720px tall. Pixel staircase clusters in all 4 corners. Footer row with name/handle near bottom.
- **Content slide (mint)**: Metadata strip at top. Lime headline slab spanning near-full-width below strip. Offset photo below slab, 640x480. Justified body paragraph below photo with generous 22px body size. Pixel clusters in top-left and bottom-right corners. Asterisk square accent beside the photo or headline. Footer row at bottom.
- **Layout notes**: Because Story is tall and narrow, stack elements vertically with 60-80px gaps between blocks. Avoid side-by-side photo + text layouts — they squeeze on a 9:16 canvas. Pixel clusters get ~30% larger (20-36px squares vs 14-28px on carousel) to match the bigger hero.
- **Safe zones**: Keep critical content (headline, body) between 280px from top and 300px from bottom on 1920px height to clear Instagram/TikTok UI chrome. The header strip sits just inside this safe zone, and the footer row sits just above it.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Forest Green | `#207A3E` | Cover slide background |
| Mint Cream | `#EAF4C3` | Content slide background |
| Dark Forest | `#1E6B3A` | Primary text on mint, pixel accent, photo offset dark layer |
| Lime Green | `#A4D23C` | Headline slabs, photo offset, pixel accent, accent squares |
| Lime Light | `#B4DC48` | Secondary pixel squares, hover/active states |
| Cream | `#F5F8E6` | Text on forest green cover |
| Text Secondary | `#3E8A4E` | Metadata strip, captions on mint |
| Text Muted | `#6BA36B` | Tertiary metadata |
| Border Soft | `rgba(30, 107, 58, 0.2)` | Header strip dividers |
| Border Strong | `rgba(30, 107, 58, 0.4)` | Prominent dividers |
| Shadow Ambient | `rgba(30, 107, 58, 0.08)` | Subtle lift on photos |
| Shadow Deep | `rgba(30, 107, 58, 0.15)` | Elevated cards |

### Font Declarations

```css
/* Display and body (single family) */
font-family: 'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-cover-bg: #207A3E;
  --color-content-bg: #EAF4C3;
  --color-dark-forest: #1E6B3A;
  --color-text-primary: #1E6B3A;
  --color-cream: #F5F8E6;

  /* Colors -- Accent */
  --color-lime: #A4D23C;
  --color-lime-light: #B4DC48;

  /* Colors -- Neutral Scale */
  --color-text-secondary: #3E8A4E;
  --color-text-muted: #6BA36B;

  /* Colors -- Surfaces */
  --color-surface-cover: #207A3E;
  --color-surface-content: #EAF4C3;
  --color-surface-slab: #A4D23C;
  --color-surface-photo-offset: #1E6B3A;

  /* Colors -- Borders */
  --color-border-soft: rgba(30, 107, 58, 0.2);
  --color-border-strong: rgba(30, 107, 58, 0.4);
  --color-divider-vertical: rgba(30, 107, 58, 0.25);
  --color-divider-cover: rgba(245, 248, 230, 0.35);

  /* Colors -- Shadows */
  --shadow-ambient: rgba(30, 107, 58, 0.08);
  --shadow-medium: rgba(30, 107, 58, 0.12);
  --shadow-deep: rgba(30, 107, 58, 0.18);

  /* Typography -- Families */
  --font-display: 'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-cover-hero: 52px;
  --text-section-heading: 40px;
  --text-sub-heading: 28px;
  --text-body-large: 18px;
  --text-body: 16px;
  --text-body-small: 14px;
  --text-metadata: 12px;
  --text-footer: 13px;
  --text-big-number: 64px;
  --text-cta: 14px;

  /* Typography -- Weights */
  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-extrabold: 800;

  /* Typography -- Line Heights */
  --leading-hero: 1.15;
  --leading-heading: 1.18;
  --leading-sub-heading: 1.25;
  --leading-body-large: 1.60;
  --leading-body: 1.65;
  --leading-metadata: 1.40;
  --leading-number: 1.00;

  /* Typography -- Tracking */
  --tracking-hero: -0.3px;
  --tracking-heading: -0.2px;
  --tracking-body: 0px;
  --tracking-metadata: 0.3px;
  --tracking-cta: 0.3px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-photo-offset: 20px;
  --space-medium: 24px;
  --space-block: 32px;
  --space-section: 40px;
  --space-large: 48px;
  --space-outer: 60px;
  --space-max: 80px;
  --space-story-outer: 120px;

  /* Borders */
  --radius-slab: 12px;
  --radius-photo: 12px;
  --radius-pixel: 2px;
  --radius-accent: 4px;
  --radius-button: 28px;

  /* Shadows (composed) */
  --shadow-soft: 0 4px 12px rgba(30, 107, 58, 0.08);
  --shadow-elevated: 0 8px 24px rgba(30, 107, 58, 0.12);
  --shadow-overlay: 0 16px 40px rgba(30, 107, 58, 0.18);
}
```

### System Font Fallbacks
- **Sans-serif (if Nunito fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
