# Design Style: Grid Quote Editorial

## 1. Visual Theme & Atmosphere

Grid Quote Editorial is the design language of the pull-quote spread -- the kind of widescreen panel you find on the interstitial pages of a literary magazine, the title card of a design-studio keynote, or the oversized wall-type installed at a writer's conference. It takes a single sentence and treats it like a monument. The canvas is a deep, saturated royal purple (`#2D1A5E`) -- not navy, not plum, but the specific rich indigo-violet of a velvet theater curtain or a Penguin Classics spine. Across this purple, a thin pale-pink grid (`#F2C9C4`) divides the surface into editorial cells, giving the composition the structural rhythm of a newspaper front page or a modernist poster. Into the largest cell drops the hero: a three-line pull quote set in mint-green (`#C9E8B5`) heavy rounded sans display type, occupying nearly half the width of the canvas and speaking with the confidence of a chapter opener.

The contrast is the entire identity. Three colors only: deep purple as the stage, pale pink as the scaffolding, mint green as the voice. Pink and mint against purple is a specifically editorial move -- it reads as thoughtful and literary rather than loud, because the pink is desaturated into a peach-cream and the mint is pushed toward celadon rather than neon. The grid lines are hairline-thin (1px) and never interrupt the type; they simply slice the canvas into zones that suggest "this is structured writing, not decoration." In the top-left grid cell sits a small pink opening-quotation-mark glyph (`"`) -- the signature detail that telegraphs "this is a quote card" before your eye reaches the words. At the bottom-left, the attribution sits in small pink tracked uppercase caps, whispering the source. Nothing else. No photographs, no gradients, no shadows, no illustrations. The entire style is composed from color, grid, and one enormous piece of type.

This is the design language of a literary quarterly's contributor-quote page, the typographic discipline of a Pentagram quote poster, and the editorial confidence of a Criterion Collection title card. It works because it refuses to decorate the sentence -- it simply gives it a room, draws the walls with a pink grid, and lets it speak. The mood is contemplative, literate, and quietly theatrical. It is flat by design: every element sits on the same visual plane, and depth comes from color contrast alone. This makes it a natural widescreen format -- slides and conference-room panels are its native habitat, though it carries into square and vertical formats by reducing the hero quote to two lines and tightening the grid accordingly.

**Key Characteristics:**
- Deep royal purple background (`#2D1A5E`) -- saturated, indigo-leaning, never navy
- Pale peach-pink grid overlay (`#F2C9C4`) at 1px line weight dividing the canvas into 2-3 columns x 3-4 rows
- Mint-green pull quote (`#C9E8B5`) in Figtree 800 -- the entire hero element of every slide
- Small pink opening-quote glyph (`"`) in the top-left grid cell at 96-120px
- Bottom-left attribution in tracked uppercase caps at 14-16px pink, letter-spacing 2px
- Hero quote at 88-120px line-height 1.10, left-aligned, 3-line stack preferred
- Figtree 800 (heavy rounded geometric sans) for all display type -- never regular weight
- Strictly flat: no shadows, no gradients, no rounded containers, no photographic elements
- Restricted 3-color palette: purple canvas + pink grid/glyph/attribution + mint quote
- Widescreen-native: 16:9 slides are the canonical format; other formats adapt the grid ratio

## 2. Color Palette & Roles

### Primary
- **Royal Purple** (`#2D1A5E`): Primary background. Deep, saturated indigo-violet that reads as literary and theatrical. The entire canvas sits in this color.
- **Mint Green** (`#C9E8B5`): Primary display color. Used exclusively for the hero pull quote -- never for body text, never for accents elsewhere. This is the voice of the style.
- **Peach Pink** (`#F2C9C4`): Primary structural accent. Used for grid lines, opening-quote glyph, and attribution text. The scaffolding color.

### Accent
- **Deep Purple** (`#1F0F47`): Darker variant of the background for depth-stacked panels or subtle background modulation when slides must visually separate.
- **Soft Mint** (`#D4ECB8`): Slightly lighter mint for secondary display type on multi-line layouts or subtitle accents (use sparingly).
- **Dusty Pink** (`#E5B8B3`): A shade darker than the pink, reserved for hover states or for secondary tag accents on non-quote slides.

### Neutral Scale
- **Purple Canvas** (`#2D1A5E`): Base canvas -- the only true surface color in the style.
- **Purple Inset** (`#251353`): Barely-perceptible inset for containers that need to "press into" the canvas.
- **Pink Dim** (`rgba(242, 201, 196, 0.55)`): Secondary pink for less critical structural elements like progress indicators.
- **Pink Faint** (`rgba(242, 201, 196, 0.25)`): Divider lines and tertiary structural elements.
- **Mint Dim** (`rgba(201, 232, 181, 0.80)`): Secondary mint for subordinate display text on multi-quote layouts.

### Surface & Borders
- **Surface Primary** (`#2D1A5E`): The canvas is the surface. No cards, no containers.
- **Surface Inset** (`#251353`): Used only when a slide absolutely requires a secondary zone -- never as a rounded card.
- **Grid Line** (`#F2C9C4`): The 1px pink grid line color. Applied via absolutely-positioned 1px divs.
- **Grid Line Dim** (`rgba(242, 201, 196, 0.50)`): Lighter grid variant for secondary grid lines on denser layouts.
- **Border Default** (`#F2C9C4`): There are no borders in this style beyond the grid itself. If a border is required, use the grid color at 1px.
- **Divider Rule** (`rgba(242, 201, 196, 0.30)`): A thin divider rule for separating grid cells on list layouts.

### Shadow Colors
This style is strictly flat. No shadows are used. The following are reserved for edge cases only and should be treated as "never in normal use."
- **Shadow Forbidden** -- do not use drop shadows on any element in this style.
- **Elevation via Color** -- if an element needs to "lift," use a slightly lighter purple inset rather than a shadow.

### Texture
This style has no texture. The canvas is flat color. The only "texture" is the pink grid overlay itself.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

- **Display**: `'Figtree', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Figtree', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

Figtree is a single-family style. The entire design is set in Figtree -- display at weight 800, caption at weight 500-600. Figtree has the heavy-rounded geometric character of the reference screenshot: closed apertures, friendly rounded terminals, and a confident 800-weight that reads as an editorial display face. Alternatives if Figtree is unavailable: Plus Jakarta Sans 800 (slightly more condensed) or Manrope 800 (slightly more humanist).

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Pull Quote Hero (Slides) | Figtree | 120px | 800 | 1.10 | -1px | The hero. Mint green. 3-line stack preferred. |
| Pull Quote Hero (Carousel) | Figtree | 88px | 800 | 1.10 | -0.5px | Scaled-down hero for square format. |
| Pull Quote Hero (Story) | Figtree | 116px | 800 | 1.08 | -0.5px | ~30% larger than Carousel for vertical format. |
| Pull Quote Hero (Poster) | Figtree | 96px | 800 | 1.10 | -0.5px | Poster-scaled hero. |
| Section Heading | Figtree | 56px | 800 | 1.15 | -0.5px | Used only on non-quote slides (cover, CTA). Mint. |
| Sub-heading | Figtree | 36px | 700 | 1.20 | 0px | Supporting headlines on multi-element slides. |
| Body Large | Figtree | 22px | 500 | 1.55 | 0px | Subtitles and lead paragraphs on intro slides. |
| Body | Figtree | 18px | 500 | 1.55 | 0px | Standard body text (rarely used in this style). |
| Small / Caption | Figtree | 14px | 600 | 1.50 | 0.3px | Metadata and secondary labels. |
| Attribution Caps | Figtree | 16px | 600 | 1.00 | 2px | Bottom-left attribution. Uppercase. Pink. |
| Opening Quote Glyph | Figtree | 120px | 900 | 1.00 | 0px | The pink `"` in the top-left grid cell. |
| Slide Number | Figtree | 14px | 500 | 1.00 | 1.5px | Small pink number, top-right or bottom-right. |

### Principles
- **One face, two weights**: Figtree 800 for display, Figtree 500-600 for caption. That is the entire typographic system. The weight contrast (500 vs. 800) is the visual rhythm.
- **Left-aligned always**: Every hero quote is left-aligned. Center-aligning a pull quote in this style breaks the editorial grid logic. Attribution is also left-aligned beneath the quote.
- **Three-line hero preferred**: The canonical pull quote is a 2- or 3-line stack. Longer quotes should be broken at natural clause boundaries (after commas, after "I", before verbs). Never allow a hero quote to exceed 4 lines -- shorten the quote or scale down.
- **Tracked caps for attribution only**: Uppercase with 2px letter-spacing is reserved for attribution and framework labels. The hero quote is always mixed case.
- **Tight line-height on display**: Line-height 1.08-1.10 on the hero quote is essential -- it creates the monumental stacked-block feel of the reference. Never use 1.2+ on display.
- **No italics**: This style does not use italic type. Emphasis within a quote is handled by isolating the sentence itself, not by styling individual words.
- **Opening-quote glyph is part of the type system**: The `"` glyph in the top-left is not decoration -- it is set in Figtree 900 at ~120px and treated as a typographic element, not an icon.

## 4. Component Patterns

### Grid Overlay Container (THE signature component)

The grid is rendered as absolutely-positioned 1px divs. It divides the slide into 2-3 columns and 3-4 rows. Always placed as the first child inside the slide container with `pointer-events: none` so it never interferes with content interaction.

```html
<div style="position: absolute; inset: 0; pointer-events: none;">
  <!-- Horizontal grid lines (3 lines = 4 rows) -->
  <div style="position: absolute; left: 0; right: 0; top: 25%; height: 1px; background: var(--color-grid);"></div>
  <div style="position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--color-grid);"></div>
  <div style="position: absolute; left: 0; right: 0; top: 75%; height: 1px; background: var(--color-grid);"></div>
  <!-- Vertical grid lines (2 lines = 3 columns) -->
  <div style="position: absolute; top: 0; bottom: 0; left: 12%; width: 1px; background: var(--color-grid);"></div>
  <div style="position: absolute; top: 0; bottom: 0; left: 88%; width: 1px; background: var(--color-grid);"></div>
</div>
```

For a tighter 2x3 grid (2 columns, 3 rows):

```html
<div style="position: absolute; inset: 0; pointer-events: none;">
  <!-- Horizontal grid lines -->
  <div style="position: absolute; left: 0; right: 0; top: 33.33%; height: 1px; background: var(--color-grid);"></div>
  <div style="position: absolute; left: 0; right: 0; top: 66.66%; height: 1px; background: var(--color-grid);"></div>
  <!-- Vertical grid line -->
  <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: var(--color-grid);"></div>
</div>
```

### Opening-Quote Glyph Cell

A small pink `"` glyph placed in the top-left grid cell. Always sits roughly centered within its own cell, with ~40-60px of padding from the grid line edges.

```html
<div style="position: absolute; top: 48px; left: 72px; font-family: var(--font-display); font-size: 96px; font-weight: 900; line-height: 0.80; color: var(--color-pink); margin: 0;">&ldquo;</div>
```

For widescreen Slides format, scale up the glyph to 120px and offset further into the top-left cell:

```html
<div style="position: absolute; top: 80px; left: 120px; font-family: var(--font-display); font-size: 120px; font-weight: 900; line-height: 0.80; color: var(--color-pink); margin: 0;">&ldquo;</div>
```

### Pull Quote Hero

The hero quote is the single most important component of the style. It is a huge mint-green Figtree 800 block, left-aligned, with line-height 1.10. Positioned to occupy roughly the middle-left of the canvas, starting below the second horizontal grid line.

```html
<h1 style="font-family: var(--font-display); font-size: 120px; font-weight: 800; line-height: 1.10; letter-spacing: -1px; color: var(--color-mint); margin: 0; max-width: 1400px; text-align: left;">
  I don't know<br>
  what I think<br>
  until I write it<br>
  down.
</h1>
```

For Carousel (1080x1080):

```html
<h1 style="font-family: var(--font-display); font-size: 88px; font-weight: 800; line-height: 1.10; letter-spacing: -0.5px; color: var(--color-mint); margin: 0; max-width: 900px; text-align: left;">
  I don't know<br>
  what I think<br>
  until I write<br>
  it down.
</h1>
```

### Caps Attribution

The bottom-left attribution block. Small, tracked, pink, uppercase. Sits inside the bottom-left grid cell.

```html
<p style="font-family: var(--font-display); font-size: 16px; font-weight: 600; line-height: 1.00; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); margin: 0;">Joan Didion</p>
```

With optional secondary metadata:

```html
<div style="position: absolute; bottom: 80px; left: 120px;">
  <p style="font-family: var(--font-display); font-size: 16px; font-weight: 600; line-height: 1.00; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 8px;">Joan Didion</p>
  <p style="font-family: var(--font-display); font-size: 13px; font-weight: 500; line-height: 1.00; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-pink-dim); margin: 0;">The White Album, 1979</p>
</div>
```

### Full Quote Slide (complete slide composition)

```html
<div style="position: relative; width: 1920px; height: 1080px; background: var(--color-purple); overflow: hidden;">
  <!-- Grid overlay -->
  <div style="position: absolute; inset: 0; pointer-events: none;">
    <div style="position: absolute; left: 0; right: 0; top: 25%; height: 1px; background: var(--color-grid);"></div>
    <div style="position: absolute; left: 0; right: 0; top: 75%; height: 1px; background: var(--color-grid);"></div>
    <div style="position: absolute; top: 0; bottom: 0; left: 12%; width: 1px; background: var(--color-grid);"></div>
    <div style="position: absolute; top: 0; bottom: 0; left: 88%; width: 1px; background: var(--color-grid);"></div>
  </div>
  <!-- Opening quote glyph -->
  <div style="position: absolute; top: 80px; left: 120px; font-family: var(--font-display); font-size: 120px; font-weight: 900; line-height: 0.80; color: var(--color-pink);">&ldquo;</div>
  <!-- Hero quote -->
  <h1 style="position: absolute; top: 340px; left: 300px; font-family: var(--font-display); font-size: 120px; font-weight: 800; line-height: 1.10; letter-spacing: -1px; color: var(--color-mint); margin: 0; max-width: 1400px;">
    I don't know what I<br>think until I write it<br>down.
  </h1>
  <!-- Attribution -->
  <p style="position: absolute; bottom: 120px; left: 300px; font-family: var(--font-display); font-size: 16px; font-weight: 600; line-height: 1.00; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); margin: 0;">Joan Didion</p>
</div>
```

### Cover Slide (no grid -- reserved for quote slides)

Cover slides drop the grid and use a simpler centered composition. The grid is reserved exclusively for the pull-quote interior slides.

```html
<div style="position: relative; width: 1920px; height: 1080px; background: var(--color-purple); display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 120px 160px;">
  <p style="font-family: var(--font-display); font-size: 16px; font-weight: 600; line-height: 1.00; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 48px;">Essays on Writing</p>
  <h1 style="font-family: var(--font-display); font-size: 140px; font-weight: 800; line-height: 1.05; letter-spacing: -1.5px; color: var(--color-mint); margin: 0 0 32px; max-width: 1400px;">Quotes for<br>writers who<br>write to think.</h1>
  <p style="font-family: var(--font-display); font-size: 22px; font-weight: 500; line-height: 1.55; color: var(--color-pink); margin: 0; max-width: 700px;">A collection of one-line arguments for the notebook and the blank page.</p>
</div>
```

### CTA Slide (no grid)

Like the cover, the CTA slide reserves the grid for quote interior slides and uses a simpler left-aligned composition with a mint-colored link-underline accent for the action.

```html
<div style="position: relative; width: 1920px; height: 1080px; background: var(--color-purple); display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding: 120px 160px;">
  <p style="font-family: var(--font-display); font-size: 16px; font-weight: 600; line-height: 1.00; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 48px;">Keep Reading</p>
  <h2 style="font-family: var(--font-display); font-size: 96px; font-weight: 800; line-height: 1.10; letter-spacing: -0.5px; color: var(--color-mint); margin: 0 0 56px; max-width: 1200px;">More essays on<br>writing to think.</h2>
  <a style="display: inline-block; font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--color-pink); text-decoration: underline; text-underline-offset: 8px; text-decoration-thickness: 2px; letter-spacing: 0.2px;">gooseworks.ai/essays &rarr;</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Hairline gap -- between attribution lines.
- **8px**: Tight gap -- between metadata rows.
- **16px**: Base gap -- between attribution and secondary metadata.
- **24px**: Small gap -- between grid cell padding and content.
- **32px**: Medium gap -- between header label and hero headline.
- **48px**: Standard vertical rhythm -- between major vertical content blocks.
- **72px**: Grid cell inset -- standard padding inside a grid cell.
- **120px**: Outer padding for Slides format -- breathing room at the canvas edges.
- **160px**: Story-format outer padding on left/right for large vertical breathing.
- **300px**: Hero quote left-offset on Slides format -- places the hero in the 2nd vertical column.

### Format Padding

| Format | Outer Padding | Content Max-Width | Grid Config |
|--------|---------------|-------------------|-------------|
| Carousel (1080x1080) | 72px all sides | 936px | 2 cols x 3 rows |
| Infographic (1080xN) | 72px left/right, 96px top/bottom | 936px | 2 cols x 4+ rows |
| Slides (1920x1080) **HERO** | 120px all sides | 1680px | 3 cols x 4 rows |
| Poster (1080x1350) | 72px left/right, 96px top/bottom | 936px | 2 cols x 4 rows |
| Story (1080x1920) | 60px left/right, 120px top/bottom | 960px | 2 cols x 5 rows |

**Slides is the hero format.** This style is widescreen-native -- the reference is a 16:9 quote card, and the grid + hero quote composition reads best at that aspect ratio. When designing for other formats, treat Slides as the canonical version and adapt downward.

### Alignment & Grid
- **Primary alignment**: Left-aligned for all quote slides. Cover and CTA slides may be left-aligned or vertically centered but never horizontally centered (centering breaks the editorial grid logic).
- **Grid**: The pink grid overlay is the structural organizing system. Quote slides use a 3-column 4-row grid (widescreen) or 2-column 3-row grid (square/vertical). Grid lines are 1px `#F2C9C4` with no opacity.
- **Hero quote placement**: The hero sits in the middle-left zone, starting roughly at the second horizontal grid line and extending to the third. It aligns its left edge with the first vertical grid line +180px indent.
- **Opening-quote glyph placement**: Always in the top-left grid cell, offset inward by 24-48px from the cell corners.
- **Attribution placement**: Always in the bottom-left grid cell, offset inward by 24-48px from the cell edges, left-edge aligned with the hero quote.
- **Vertical rhythm**: 48-72px gaps between top-level content blocks. The grid cells themselves provide the structural rhythm -- resist the urge to add extra spacing inside a cell.
- **Content gravity**: On widescreen, content gravitates to the left half of the canvas. The right column is intentionally empty -- it is "air" for the quote to breathe into.

## 6. Depth & Elevation

This style is **strictly flat**. There is no elevation, no shadows, no layered cards. Depth comes from color contrast alone -- mint on purple, pink on purple -- and from the grid structure defining zones.

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | Background `#2D1A5E`, no shadow | Canvas, the only surface |
| Grid (Level 1) | 1px `#F2C9C4` line overlay | Structural divider (not elevation) |
| Type (Level 2) | Mint/pink text on purple | Content elevation via color contrast |
| Disallowed | Shadows, gradients, bevels, rounded containers | Never used |

### Border Treatments
- **Grid line**: `1px solid #F2C9C4` -- the only border in the entire style. Applied only as grid dividers.
- **Grid line dim**: `1px solid rgba(242, 201, 196, 0.50)` -- for secondary grid lines on denser multi-element layouts.
- **No card borders**: Cards do not exist in this style. If you find yourself reaching for a bordered card, use a grid cell instead.
- **No rounded corners**: All structural elements are rectilinear. `border-radius: 0` is the default.

### Surface Hierarchy
On the deep purple canvas, elevation is communicated entirely by color contrast:
1. **Canvas** (`#2D1A5E`) -- the only surface. Everything sits directly on this.
2. **Grid overlay** (`#F2C9C4`) -- the structural layer, 1px thin.
3. **Attribution + glyph** (`#F2C9C4`) -- small pink elements sit at the middle of the visual stack.
4. **Hero quote** (`#C9E8B5`) -- mint green commands the highest contrast and is always the primary focal point.

## 7. Do's and Don'ts

### Do
- Use mint-green (`#C9E8B5`) for the hero pull quote exclusively. The mint is the voice of the style -- every slide has exactly one mint element.
- Use pink (`#F2C9C4`) for the grid overlay, opening-quote glyph, and attribution -- and for nothing else. Pink is the scaffolding color, not a general accent.
- Keep the purple background deep and saturated (`#2D1A5E`). Do not lighten, do not tint, do not gradient.
- Use Figtree 800 for all display type. Heavy weight is essential to the editorial-monumental feel.
- Use the grid overlay (absolutely-positioned 1px pink lines) on every pull-quote interior slide. It is the signature structural element.
- Place the opening-quote glyph in the top-left grid cell at 96-120px, Figtree 900, in pink.
- Left-align the hero pull quote with line-height 1.10 and break it into 2-4 lines at natural clause boundaries.
- Place the attribution at the bottom-left in small tracked uppercase pink, letter-spacing 2px.
- Keep the right-half of the canvas intentionally empty -- it is "breathing room" for the hero quote.
- Use widescreen Slides (1920x1080) as the canonical format for this style.
- Break long quotes at natural clause boundaries (after commas, after "I", before verbs) to preserve editorial rhythm.
- Limit each slide to exactly one pull quote. Multi-quote layouts destroy the style.

### Don't
- Don't use the grid overlay on cover slides or CTA slides. The grid is reserved exclusively for pull-quote interior slides -- covers and CTAs use a simpler ungridded composition.
- Don't use shadows. This style is flat. Drop shadows, inner shadows, glows, and bevels are all forbidden.
- Don't use rounded corners. All structural elements are rectilinear. No `border-radius` anywhere except optional minor radius on CTA buttons (and even then, prefer sharp).
- Don't use more than 2 colors beyond the purple canvas. Mint for the quote, pink for the structure. That is the entire palette. Adding a third accent breaks the style.
- Don't use Figtree at regular weight (400) for display type. Display is always 800. Light or regular weight mint-on-purple looks washed-out and non-editorial.
- Don't center-align the hero quote. Left-alignment is part of the style's editorial grid logic.
- Don't use the grid with more than 3 columns or more than 4 rows. Denser grids read as technical/engineering, not editorial.
- Don't use italics for emphasis within a quote. The quote itself is the emphasis.
- Don't add icons, illustrations, or photography. This style is pure type + grid.
- Don't use gradients. The background is flat purple, the type is flat mint/pink.
- Don't let the hero quote exceed 4 lines. If the quote is longer, shorten it or scale down the font size. 3 lines is the canonical target.
- Don't mix this style with other accent colors from the broader palette. Purple-pink-mint is a closed system.
- Don't let the grid lines interact with content -- always use `pointer-events: none` on the grid overlay.
- Don't use Figtree 800 for body/caption text. Weight 500-600 is the correct subordinate weight.

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

**Slides (1920x1080) is the hero format for this style.** The reference is a widescreen editorial quote card, and the grid + hero + attribution composition reads best at that aspect ratio. Design for Slides first, then adapt.

### Slides (1920x1080px) -- HERO FORMAT
- **Typography scale**: Pull Quote Hero at 120px Figtree 800, line-height 1.10, letter-spacing -1px. Cover headline at 140px. CTA headline at 96px. Attribution at 16px letter-spacing 2px.
- **Padding**: 120px all sides. Content area is 1680x840px.
- **Grid**: 3 columns x 4 rows. Vertical lines at 12% and 88% (leaving wide center column). Horizontal lines at 25% and 75% (creating a central middle band for the hero quote).
- **Hero placement**: Quote starts at roughly x=300 (inside the second column), y=340 (just below the upper horizontal line), and wraps at max-width 1400px.
- **Opening-quote glyph**: Top-left grid cell at top=80, left=120, 120px Figtree 900 in pink.
- **Attribution**: Bottom-left grid cell at bottom=120, left=300 (aligned with hero quote left edge).
- **Cover slide**: No grid. Left-aligned, vertically centered, with a small pink framework-label at the top.
- **CTA slide**: No grid. Left-aligned mint headline with pink underlined CTA link.
- **Swipe indicator**: Thin pink segments at the top-right corner, each 40px wide, 2px tall, 8px apart. Active segment in full pink, inactive in `rgba(242, 201, 196, 0.35)`.

### Carousel (1080x1080px)
- **Typography scale down**: Pull Quote Hero becomes 88px (from 120px). Cover headline becomes 96px. Attribution stays 14-16px.
- **Padding**: 72px on all sides. Content area is 936x936px.
- **Grid**: 2 columns x 3 rows. Single vertical line at 50%, two horizontal lines at 33% and 67%. A simpler grid suited to the square format.
- **Hero placement**: Quote starts at roughly x=144 (inside the left column), y=380, max-width 840px, typically 3-4 lines.
- **Opening-quote glyph**: Top-left at top=72, left=72, 80px Figtree 900.
- **Attribution**: Bottom-left at bottom=72, left=144 (aligned with hero quote left edge).
- **Cover slide**: No grid. Framework label at top, centered vertical stack with left-aligned text.
- **Content slides**: Each slide carries one quote. Quote-card series works as a carousel of 5-8 quotes.

### Infographic (1080px wide, variable height)
- **Typography**: Full scale. Pull Quote Hero at 88px (Carousel scale). Section dividers at 48px.
- **Padding**: 72px left/right, 96px top/bottom.
- **Grid**: 2 columns x N rows. Vertical line at 50%. Horizontal lines every 400px creating stacked quote "rooms."
- **Layout**: Stack multiple quote slides vertically, each one its own grid cell with its own opening-quote glyph and attribution. Treat each quote-zone as a mini-slide within the infographic.
- **Vertical rhythm**: Each quote zone is 500-700px tall depending on quote length. No decorative dividers between zones -- the pink grid lines do the structural work.
- **Footer**: Pink tracked-caps label at the bottom, centered or left-aligned.

### Poster (1080x1350px)
- **Typography**: Pull Quote Hero at 96px. Section heading at 56px. Attribution at 16px.
- **Padding**: 72px left/right, 96px top/bottom.
- **Grid**: 2 columns x 4 rows. Vertical line at 50%, three horizontal lines at 25%, 50%, 75%.
- **Composition**: Top third for framework label and opening-quote glyph. Middle two thirds for the hero pull quote. Bottom third for attribution and optional secondary metadata.
- **Hero placement**: Quote starts at roughly x=144, y=420, max-width 900px, 3-4 lines.
- **Use case**: Single monumental quote-as-poster, suitable for wall-print, social share image, or event poster.

### Story (1080x1920px)
- **Typography scale up**: Pull Quote Hero becomes 116px Figtree 800 (approximately 30% larger than Carousel's 88px). Cover headline at 124px. CTA headline at 88px. Attribution at 18px letter-spacing 2px.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Grid**: 2 columns x 5 rows. Vertical line at 50%. Horizontal lines at 20%, 40%, 60%, 80%. The taller vertical aspect takes more horizontal divisions to maintain the editorial rhythm.
- **Hero placement**: Quote starts at roughly x=120 (inside the left column), y=700, max-width 880px, wrapping 4-5 lines naturally. Content clusters in y=400 to y=1500.
- **Opening-quote glyph**: Top-left cell at top=200, left=120, 96px Figtree 900 (smaller than Slides due to narrower canvas). Must sit inside the top safe zone.
- **Attribution**: Bottom-left at bottom=240, left=120 (respecting bottom safe zone).
- **Cover slide**: No grid. Framework label at top of safe zone. Cover headline centered vertically with the hero scaled to 124px. Supporting line in pink below.
- **CTA slide**: No grid. Mint CTA headline, pink underlined link, both inside safe zones.
- **Max 10 slides**: Story carousels should not exceed 10 slides. Each slide holds exactly one quote.
- **Progress indicator**: Thin pink segments at the top of the safe zone (y=120) -- inactive in `rgba(242, 201, 196, 0.35)`, active in full pink `#F2C9C4`.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Royal Purple | `#2D1A5E` | Primary background -- the entire canvas |
| Mint Green | `#C9E8B5` | Pull quote display color -- hero only |
| Peach Pink | `#F2C9C4` | Grid lines, opening-quote glyph, attribution |
| Deep Purple | `#1F0F47` | Inset/depth variant of background |
| Soft Mint | `#D4ECB8` | Secondary mint for multi-line subtitle accents |
| Dusty Pink | `#E5B8B3` | Hover/secondary pink |
| Pink Dim | `rgba(242,201,196,0.55)` | Secondary pink for inactive elements |
| Pink Faint | `rgba(242,201,196,0.25)` | Dividers, tertiary structure |
| Grid Line | `#F2C9C4` | 1px grid overlay line color |
| Purple Inset | `#251353` | Subtle depth stepping within canvas |

### Font Declarations

```css
/* Display and body (single-family system) */
font-family: 'Figtree', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-purple: #2D1A5E;
  --color-mint: #C9E8B5;
  --color-pink: #F2C9C4;

  /* Colors -- Accent */
  --color-purple-deep: #1F0F47;
  --color-purple-inset: #251353;
  --color-mint-soft: #D4ECB8;
  --color-pink-dusty: #E5B8B3;

  /* Colors -- Dim Variants */
  --color-pink-dim: rgba(242, 201, 196, 0.55);
  --color-pink-faint: rgba(242, 201, 196, 0.25);
  --color-mint-dim: rgba(201, 232, 181, 0.80);

  /* Colors -- Surfaces */
  --color-surface-primary: #2D1A5E;
  --color-surface-inset: #251353;

  /* Colors -- Borders / Grid */
  --color-grid: #F2C9C4;
  --color-grid-dim: rgba(242, 201, 196, 0.50);
  --color-divider: rgba(242, 201, 196, 0.30);

  /* Colors -- Shadows (forbidden in this style) */
  --shadow-none: none;

  /* Typography -- Families */
  --font-display: 'Figtree', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Figtree', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes (Slides-format canonical) */
  --text-hero-slides: 120px;
  --text-hero-carousel: 88px;
  --text-hero-story: 116px;
  --text-hero-poster: 96px;
  --text-section-heading: 56px;
  --text-sub-heading: 36px;
  --text-body-large: 22px;
  --text-body: 18px;
  --text-small: 14px;
  --text-attribution: 16px;
  --text-glyph: 120px;

  /* Typography -- Weights */
  --weight-display: 800;
  --weight-display-extra: 900;
  --weight-heading: 700;
  --weight-attribution: 600;
  --weight-body: 500;

  /* Typography -- Line Heights */
  --leading-hero: 1.10;
  --leading-hero-tight: 1.08;
  --leading-heading: 1.15;
  --leading-body: 1.55;
  --leading-caption: 1.50;
  --leading-number: 1.00;

  /* Typography -- Letter Spacing */
  --tracking-hero: -1px;
  --tracking-heading: -0.5px;
  --tracking-body: 0px;
  --tracking-caption: 0.3px;
  --tracking-caps: 2px;

  /* Spacing */
  --space-hairline: 4px;
  --space-tight: 8px;
  --space-base: 16px;
  --space-small: 24px;
  --space-medium: 32px;
  --space-standard: 48px;
  --space-cell-inset: 72px;
  --space-slides-padding: 120px;
  --space-story-padding: 160px;
  --space-hero-offset: 300px;

  /* Borders */
  --radius-none: 0px;
  --grid-line-width: 1px;

  /* Grid -- Slides (3x4) */
  --grid-slides-col-1: 12%;
  --grid-slides-col-2: 88%;
  --grid-slides-row-1: 25%;
  --grid-slides-row-2: 50%;
  --grid-slides-row-3: 75%;

  /* Grid -- Carousel (2x3) */
  --grid-carousel-col-1: 50%;
  --grid-carousel-row-1: 33.33%;
  --grid-carousel-row-2: 66.66%;

  /* Grid -- Story (2x5) */
  --grid-story-col-1: 50%;
  --grid-story-row-1: 20%;
  --grid-story-row-2: 40%;
  --grid-story-row-3: 60%;
  --grid-story-row-4: 80%;
}
```

### System Font Fallbacks
- **Sans-serif (if Figtree fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Alternative heavy rounded sans:** `'Plus Jakarta Sans', 'Manrope', -apple-system, sans-serif` (set both at weight 800)
