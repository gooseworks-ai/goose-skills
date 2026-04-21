# Design Style: Magazine Red

## 1. Visual Theme & Atmosphere

Magazine Red is the design language of the modern editorial pitch deck — the visual equivalent of a startup founder who reads Monocle on the plane and keeps a stack of Fast Company back issues on the coffee table. It draws from the Swiss-influenced editorial tradition (think Yale School of Art, Aperture Magazine, Wallpaper* covers) but strips away the fussiness, leaving only the load-bearing elements: a warm cream paper stock, a single hot red accent, and display type so massive it nearly bursts the frame. The background is not white — it is a deliberate off-white cream (`#F2EEE2`), the color of uncoated book paper under warm gallery lighting. This single choice shifts the entire register away from "tech deck" toward "editorial artifact" and makes every other element feel more considered.

The defining gesture is the massive tomato-red headline. Headlines are set in a heavy condensed sans at 180–240px, in ALL CAPS, in a saturated brick-tomato red (`#C33A1F`), and composed so they nearly fill the width of the frame. This is not a cautious headline — it is the headline as event. The chosen typeface is **Anton** (from Google Fonts), a contemporary condensed display sans with extreme weight that captures the industrial confidence of Druk Condensed or Knockout without the license. Anton's severe verticality means "PITCH DECK" on two lines reads as architecture. Body type is **Inter**, handling every supporting role — small tracked uppercase labels, captions, bracketed section numbers, and metadata — in a deep espresso brown-black (`#2B2119`) that reads warmer than true black against the cream.

The accent system is ruthlessly restricted: red for display headlines and bracketed section markers, dark brown-black for body copy, cream for background, and nothing else. Decorative scaffolding comes from a small set of signature patterns: **bracketed numbers `[1]` `[2]` `[3]`** as numbered list markers, **parenthetical `(05)` page numbers** set in red condensed sans, **small tracked uppercase labels** ("INNOVATING SOLUTIONS FOR A CHANGING WORLD") that sit quietly in the corners, and **rectangular photo cutouts** with name/role captions set in all-caps sans below. Compositions lean into deliberate asymmetric whitespace — generous airspace above the headline, photos pushed to one side, a single red `(05)` anchoring the negative space on the opposite edge. The mood is confident-but-restrained editorial design: Paper & Ink quarterly meets a Series A deck built by someone with taste.

**Key Characteristics:**
- Warm cream paper background (`#F2EEE2`) — never white, never gray, always warm
- Massive tomato-red condensed sans headlines (`#C33A1F`) in ALL CAPS, sized at 180–240px to fill frame width
- Anton (or Oswald 700 fallback) for display — extreme vertical condensation, single weight
- Inter for body, captions, labels, and metadata — weights 400–700
- Bracketed section numbers `[1]` `[2]` in red display sans as list markers
- Parenthetical page numbers `(05)` in red display sans as compositional anchors
- Small tracked uppercase labels (2px letter-spacing, 12–14px) for corner metadata
- Deep espresso brown-black (`#2B2119`) for all body text — warmer than true black
- Rectangular photo cutouts with all-caps sans name/role captions below
- Generous asymmetric whitespace — headlines live in the top third, photos in the bottom half
- No borders, no shadows, no rounded corners — editorial flatness throughout
- No gradients, no textures, no decorative glyphs beyond brackets and parentheses

## 2. Color Palette & Roles

### Primary
- **Cream Paper** (`#F2EEE2`): Primary background. A warm off-white with a slight yellow undertone that reads as uncoated book paper. Never use pure white.
- **Espresso Black** (`#2B2119`): Primary text color. A warm brown-black that sits harmoniously with the cream background without creating the harsh contrast of pure black.
- **Tomato Red** (`#C33A1F`): Primary accent. Used for all display headlines, bracketed numbers, parenthetical page numbers, and the single-accent emphasis role. The red of a well-worn Penguin Classics spine.

### Accent
- **Brick Red** (`#A82E17`): Hover/active state and a slightly darker variant for secondary emphasis when two reds must coexist.
- **Rust Red** (`#B83327`): Alternative display headline tone — slightly deeper, used when headlines sit over photography or need extra weight.

### Neutral Scale
- **Cream Deep** (`#ECE6D6`): A slightly darker cream for subtle surface shifts — photo backgrounds, quiet panels.
- **Paper Fold** (`#E4DCC8`): The warmest cream, used for inset cards or photo frame backgrounds when surface separation is needed.
- **Ink Warm** (`#2B2119`): Body text (same as Espresso Black).
- **Ink Medium** (`#4A3E33`): Secondary text, captions, subheadings, descriptive body copy.
- **Ink Light** (`#7A6B5C`): Tertiary text, photo credit lines, quiet metadata.
- **Ink Mute** (`rgba(43, 33, 25, 0.45)`): Page numbers and watermarks when not in red.

### Surface & Borders
- **Surface Primary** (`#F2EEE2`): The canvas itself — cards rarely exist in this style, content sits directly on the cream.
- **Surface Inset** (`#ECE6D6`): Subtle inset zones when differentiation is needed.
- **Surface Photo Frame** (`#E4DCC8`): Background for rectangular photo containers when a photo needs a quiet mat.
- **Border Hairline** (`rgba(43, 33, 25, 0.15)`): Thin hairline rules for editorial dividers. Used sparingly.
- **Border Rule** (`#2B2119`): Full-weight rule lines for the rare full-width divider — 1px solid.
- **Divider Whitespace**: The preferred "divider" is actual whitespace, not a line. Use 48–80px vertical gaps instead of rules.

### Shadow Colors
- **Shadow None** (`none`): The default. This style is flat — no drop shadows on cards, no lift on photos, no elevation language.
- **Shadow Paper** (`0 1px 2px rgba(43, 33, 25, 0.08)`): Optional whisper-shadow for photos only, to hint at paper lift. Use at most on hero photos.
- **Shadow Photo** (`0 2px 12px rgba(43, 33, 25, 0.10)`): Maximum elevation allowed — reserved for a single featured photo per composition.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display**: `'Anton', 'Oswald', 'Bebas Neue', Impact, sans-serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Massive Hero | Anton | 240px | 400 | 0.88 | -2px | Cover headlines — "PITCH DECK" scale. Nearly fills frame width. Always ALL CAPS red. |
| Display Hero | Anton | 180px | 400 | 0.90 | -1.5px | Standard hero headlines — "OUR TEAM" scale. ALL CAPS red. |
| Display Large | Anton | 120px | 400 | 0.92 | -1px | Section titles in compact formats. ALL CAPS red. |
| Display Medium | Anton | 88px | 400 | 0.94 | -0.5px | Sub-sections and secondary headlines. ALL CAPS red. |
| Big Number | Anton | 140px | 400 | 0.90 | -1px | Parenthetical `(05)` page numbers in red. |
| Bracket Number | Anton | 56px | 400 | 1.0 | 0px | `[1]` `[2]` `[3]` list markers in red. |
| Heading 1 | Inter | 28px | 700 | 1.25 | -0.2px | Body-set section headings. Espresso black. |
| Heading 2 | Inter | 20px | 700 | 1.30 | 0px | Sub-headings within body content. |
| Label Caps | Inter | 13px | 600 | 1.20 | 2px | Tracked uppercase corner labels — "PRESENTED BY / OLIVIA WILSON" |
| Label Caps Small | Inter | 11px | 700 | 1.20 | 1.8px | Photo caption names and roles in ALL CAPS. |
| Body Large | Inter | 18px | 500 | 1.55 | 0px | Intro paragraphs and lead copy. |
| Body | Inter | 15px | 500 | 1.60 | 0px | Standard body text. Espresso black. |
| Body Small | Inter | 13px | 500 | 1.55 | 0px | Description text in photo captions and side-columns. Ink medium. |
| Subtitle Red | Inter | 16px | 700 | 1.30 | 0.5px | Tomato red, ALL CAPS — used as headline subtitles like "MARKETING EXPERTS AT YOUR SERVICE". |

### Principles

- **Red display type is the only scale-maximizer**: The Anton red headline should always be sized to nearly fill the frame width. If it fits comfortably with lots of room, it is too small. Measure fit by computing a font-size that yields a line that is 90–95% of the content-area width.
- **Inter handles everything that is not a scream**: Every non-headline element — captions, labels, body copy, bracketed lists — uses Inter. The style's contrast comes from the extreme jump between 240px red Anton and 15px espresso Inter, not from mid-tier type experiments.
- **Letter-spacing discipline**: Anton display headlines use negative tracking (-1px to -2px) because condensed capitals already feel tight; the negative value makes the line read as a single unit. Small uppercase labels go the other way, using +2px tracking for an editorial small-caps feel.
- **No italics, no mixed case for red**: Red is reserved for ALL CAPS Anton display type, bracketed numbers, parenthetical page numbers, and the rare red subtitle. Never set body paragraphs in red.
- **Line-height tight on display, loose on body**: Display headlines sit at 0.88–0.94 line-height so stacked lines kiss each other like a Swiss poster. Body text sits at 1.55–1.60 for generous reading rhythm.
- **Uppercase for metadata only**: Mixed case is the default for body copy and headings set in Inter. ALL CAPS is reserved for the red display headline, small tracked corner labels, photo caption names/roles, and the red Inter subtitle.

## 4. Component Patterns

### Massive Red Headline (Cover Pattern)

The signature pattern. A display headline set to nearly fill the frame, anchored in the top third, with tracked corner labels in the remaining corners.

```html
<div style="background-color: var(--color-bg); padding: 80px 100px; position: relative; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
  <!-- Top-left corner label -->
  <div style="position: absolute; top: 80px; left: 100px; font-family: var(--font-body); font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-ink); line-height: 1.4;">
    INNOVATING<br>SOLUTIONS FOR A<br>CHANGING WORLD
  </div>
  <!-- Top-right corner label -->
  <div style="position: absolute; top: 80px; right: 100px; font-family: var(--font-body); font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-ink); line-height: 1.4; text-align: right;">
    PRESENTED BY<br>OLIVIA WILSON
  </div>
  <!-- The massive red headline -->
  <h1 style="font-family: var(--font-display); font-size: 240px; font-weight: 400; line-height: 0.88; letter-spacing: -2px; color: var(--color-red); margin: 0; text-transform: uppercase;">
    PITCH<br>DECK
  </h1>
</div>
```

### Photo Grid with Captions (Team/Portrait Pattern)

Three rectangular portrait cutouts in a horizontal row, each with an ALL CAPS role title and name below, aligned to form a small editorial type-block.

```html
<div style="padding: 80px 100px; background-color: var(--color-bg);">
  <!-- Red headline -->
  <h2 style="font-family: var(--font-display); font-size: 180px; font-weight: 400; line-height: 0.90; letter-spacing: -1.5px; color: var(--color-red); margin: 0 0 32px; text-transform: uppercase;">OUR TEAM</h2>
  <!-- Red subtitle -->
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--color-red); margin: 0 0 80px; line-height: 1.3;">
    MARKETING &nbsp; EXPERTS<br>AT YOUR SERVICE
  </p>
  <!-- Photo grid -->
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 48px; max-width: 720px;">
    <!-- Portrait 1 -->
    <div>
      <div style="width: 100%; aspect-ratio: 3/4; background-color: var(--color-photo-frame); margin: 0 0 20px; overflow: hidden;">
        <img src="portrait-1.jpg" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="">
      </div>
      <div style="display: flex; gap: 16px;">
        <div style="font-family: var(--font-body); font-size: 11px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: var(--color-ink); line-height: 1.3;">CHEF<br>MARKETING<br>OFFICER</div>
        <div style="font-family: var(--font-body); font-size: 11px; font-weight: 500; letter-spacing: 1.8px; text-transform: uppercase; color: var(--color-ink-medium); line-height: 1.3;">OLIVIA<br>WILSON</div>
      </div>
    </div>
    <!-- Portrait 2 -->
    <div>
      <div style="width: 100%; aspect-ratio: 3/4; background-color: var(--color-photo-frame); margin: 0 0 20px; overflow: hidden;">
        <img src="portrait-2.jpg" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="">
      </div>
      <div style="display: flex; gap: 16px;">
        <div style="font-family: var(--font-body); font-size: 11px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: var(--color-ink); line-height: 1.3;">GRAPHIC<br>DESIGN</div>
        <div style="font-family: var(--font-body); font-size: 11px; font-weight: 500; letter-spacing: 1.8px; text-transform: uppercase; color: var(--color-ink-medium); line-height: 1.3;">RICHARD<br>SANCHEZ</div>
      </div>
    </div>
    <!-- Portrait 3 -->
    <div>
      <div style="width: 100%; aspect-ratio: 3/4; background-color: var(--color-photo-frame); margin: 0 0 20px; overflow: hidden;">
        <img src="portrait-3.jpg" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="">
      </div>
      <div style="display: flex; gap: 16px;">
        <div style="font-family: var(--font-body); font-size: 11px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: var(--color-ink); line-height: 1.3;">DIGITAL<br>MARKETING</div>
        <div style="font-family: var(--font-body); font-size: 11px; font-weight: 500; letter-spacing: 1.8px; text-transform: uppercase; color: var(--color-ink-medium); line-height: 1.3;">AARON<br>LOEB</div>
      </div>
    </div>
  </div>
</div>
```

### Bracketed Numbered List Item

The `[1]` `[2]` `[3]` pattern for checklist-style content. Red bracket number at large scale, title and body in espresso.

```html
<div style="display: flex; gap: 32px; padding: 40px 0; border-bottom: 1px solid var(--color-border-hairline);">
  <div style="font-family: var(--font-display); font-size: 56px; font-weight: 400; line-height: 1.0; color: var(--color-red); flex-shrink: 0; min-width: 80px;">
    [1]
  </div>
  <div style="flex: 1;">
    <h3 style="font-family: var(--font-body); font-size: 28px; font-weight: 700; line-height: 1.25; letter-spacing: -0.2px; color: var(--color-ink); margin: 0 0 12px;">Research the Company</h3>
    <p style="font-family: var(--font-body); font-size: 15px; font-weight: 500; line-height: 1.60; color: var(--color-ink-medium); margin: 0;">Understand the company's mission, values, and recent achievements before walking into the interview room.</p>
  </div>
</div>
```

### Parenthetical Page Number Anchor

The `(05)` red number used as a compositional anchor in negative space, paired with a short body column.

```html
<div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 60px; align-items: start; padding: 80px 0;">
  <div style="font-family: var(--font-display); font-size: 140px; font-weight: 400; line-height: 0.90; letter-spacing: -1px; color: var(--color-red);">
    (05)
  </div>
  <div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 500; line-height: 1.60; color: var(--color-ink-medium); margin: 0; max-width: 280px;">Our team of marketing professionals combines experience and passion to deliver results. From strategists to designers, every team member brings unique skills to the table.</p>
  </div>
</div>
```

### Editorial Photo Block with Caption

A single large photo with an ALL CAPS name label and role below — the Paper-&-Ink magazine treatment.

```html
<figure style="margin: 0; padding: 0;">
  <div style="width: 100%; aspect-ratio: 4/5; background-color: var(--color-photo-frame); margin: 0 0 24px; overflow: hidden;">
    <img src="photo.jpg" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="">
  </div>
  <figcaption style="display: flex; justify-content: space-between; align-items: flex-start;">
    <div style="font-family: var(--font-body); font-size: 11px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: var(--color-ink); line-height: 1.3;">
      CHIEF<br>MARKETING<br>OFFICER
    </div>
    <div style="font-family: var(--font-body); font-size: 11px; font-weight: 500; letter-spacing: 1.8px; text-transform: uppercase; color: var(--color-ink-medium); line-height: 1.3; text-align: right;">
      OLIVIA<br>WILSON
    </div>
  </figcaption>
</figure>
```

### Red Subtitle Block

The ALL CAPS red subtitle that appears below a massive red headline to give it editorial context.

```html
<div style="padding: 24px 0;">
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--color-red); margin: 0; line-height: 1.3;">
    MARKETING &nbsp; EXPERTS<br>AT YOUR SERVICE
  </p>
</div>
```

### Interview Checklist Cover Pattern

The `[Practical tips for confidence and success]` pattern — massive red headline stacked on three lines, tight bracketed subtitle below, small metadata label and a diagonal line element anchoring the top-right.

```html
<div style="background-color: var(--color-bg); padding: 80px; position: relative;">
  <!-- Massive red stacked headline -->
  <h1 style="font-family: var(--font-display); font-size: 160px; font-weight: 400; line-height: 0.92; letter-spacing: -1px; color: var(--color-red); margin: 0 0 28px; text-transform: none;">
    Interview<br>Success<br>Checklist
  </h1>
  <!-- Bracketed subtitle -->
  <p style="font-family: var(--font-display); font-size: 36px; font-weight: 400; line-height: 1.0; color: var(--color-ink); margin: 0 0 48px;">
    [Practical tips for confidence and success]
  </p>
  <!-- Small metadata label with marker glyph -->
  <div style="display: flex; align-items: flex-start; gap: 12px;">
    <div style="width: 14px; height: 18px; background-color: var(--color-ink); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%); flex-shrink: 0; margin-top: 2px;"></div>
    <div style="font-family: var(--font-body); font-size: 12px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: var(--color-ink); line-height: 1.4;">
      SAVE THIS FOR<br>YOUR NEXT<br>INTERVIEW
    </div>
  </div>
</div>
```

### Two-Column Content Block

A simple two-column body layout — red headline on the left, body copy on the right.

```html
<div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 80px; align-items: start; padding: 60px 0;">
  <h2 style="font-family: var(--font-display); font-size: 120px; font-weight: 400; line-height: 0.92; letter-spacing: -1px; color: var(--color-red); margin: 0; text-transform: uppercase;">
    WHY<br>NOW
  </h2>
  <div style="padding-top: 12px;">
    <h3 style="font-family: var(--font-body); font-size: 20px; font-weight: 700; line-height: 1.30; color: var(--color-ink); margin: 0 0 16px;">The market is shifting.</h3>
    <p style="font-family: var(--font-body); font-size: 15px; font-weight: 500; line-height: 1.60; color: var(--color-ink-medium); margin: 0;">Every decade, a new medium reshapes who gets to distribute and who gets distributed. Right now, AI is the medium. The companies that act now will define the next generation.</p>
  </div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap — between inline icon/bullet and label text.
- **8px**: Tight gap — within small label blocks and bracket-to-number spacing.
- **12px**: Small gap — between small uppercase labels and their paired values.
- **16px**: Base gap — between photo caption role and name columns.
- **20px**: Caption gap — between photo and its caption block.
- **24px**: Small section gap — between red headline and its red subtitle.
- **32px**: Medium gap — between bracketed number and its body content in lists.
- **48px**: Section gap — between major content blocks; vertical gap between list items; gap between photos in a grid.
- **60px**: Large gap — column gap in two-column layouts.
- **80px**: Section padding — outer padding on carousels, infographics, posters; large vertical rhythm between headline and photo grid.
- **100px**: Wide outer padding — slides format outer padding.
- **120px**: Story format horizontal padding.

### Format Padding

| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 80px all sides | 920px |
| Infographic (1080xN) | 80px left/right, 100px top/bottom | 920px |
| Slides (1920x1080) | 100px all sides | 1720px |
| Poster (1080x1350) | 80px left/right, 100px top/bottom | 920px |
| Story (1080x1920) | 120px left/right, 60px top/bottom | 840px |

### Alignment & Grid
- **Primary alignment**: Left-aligned. This style is deeply left-aligned in keeping with editorial magazine layout tradition. Center-aligned composition is rarely used and only for the Massive Red Headline cover pattern when a single phrase (e.g., "OUR TEAM") is the only element on the canvas.
- **Grid**: Two-column and three-column grids are the norm. Three-column for photo grids with captions, two-column for red-headline-left / body-right compositions.
- **Corner labels**: Small tracked uppercase labels are anchored to the corners of the canvas via `position: absolute` with identical insets (typically 80px from top and side).
- **Vertical rhythm**: The dominant rhythm is: generous top whitespace → massive red headline → short pause → red subtitle or bracketed subtitle → large gap → photo grid or body content.
- **Content gravity**: On wide formats (slides, carousel), content pulls to the left edge. On tall formats (poster, story), content stacks vertically with the red headline anchoring the top third.
- **Whitespace as divider**: The preferred separator between content blocks is whitespace, not a rule line. Reach for 48–80px of vertical air instead of a border.
- **Photo aspect ratios**: Portrait photos use 3:4. Hero photos use 4:5. Landscape photos use 3:2. Rectangles with hard corners only — never rounded.

## 6. Depth & Elevation

Magazine Red is a flat style. It derives its visual energy from type scale and color contrast, not from shadows or elevation tricks. The entire elevation system is intentionally minimal.

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, cream background | The default — everything lives here |
| Photo (Level 1) | No shadow, rectangular cutout on cream | Photo blocks sit flush with the canvas |
| Inset (Level 2) | `background: #ECE6D6`, no shadow | Rare inset zones when surface differentiation is needed |
| Photo Lift (Level 3) | `0 2px 12px rgba(43, 33, 25, 0.10)` | Maximum elevation — reserved for a single featured photo per composition |
| — | — | — |

### Border Treatments
- **No-border default**: Cards, photos, and containers have no borders. Their edges are defined by whitespace and the implicit rectangle of their content.
- **Hairline rule**: `1px solid rgba(43, 33, 25, 0.15)` — used only to separate list items in bracketed numbered lists. Never on container edges.
- **Full rule**: `1px solid #2B2119` — used only for the rare full-width editorial divider between major sections. Avoid when possible; prefer whitespace.
- **No rounded corners anywhere**: Border-radius is always `0`. Photo cutouts are strict rectangles. The one exception is the occasional illustrative shape that references a pinned-paper corner, but this is rare.

### Surface Hierarchy
The cream background is the stage, and the hierarchy comes from three levers only:
1. **Type scale** — massive red display vs. small espresso body creates a 10× contrast that establishes order without any structural help.
2. **Color** — red signals "this matters most"; espresso is the reading layer; cream is the quiet substrate.
3. **Whitespace** — generous air around the headline makes the headline feel important; tight clustering around captions makes captions feel like supporting cast.

## 7. Do's and Don'ts

### Do
- Use Anton (or Oswald 700) for every display headline in tomato red (`#C33A1F`), ALL CAPS, sized at 180–240px to nearly fill the frame width — this is the style's defining gesture.
- Use the warm cream background (`#F2EEE2`) as the canvas for every format — this is what makes the style read as editorial, not tech.
- Use bracketed numbers `[1]` `[2]` `[3]` in red Anton at 56px as list markers for numbered content.
- Use parenthetical page numbers like `(05)` in red Anton at 120–140px as compositional anchors in negative space.
- Use small tracked uppercase labels (13px Inter 600, 2px letter-spacing) for corner metadata — "PRESENTED BY", "INNOVATING SOLUTIONS".
- Use rectangular photo cutouts with hard corners and ALL CAPS caption blocks showing role + name in two columns.
- Use generous asymmetric whitespace above headlines — never crowd the top edge.
- Use Inter for every non-headline element — body, captions, labels, metadata.
- Use espresso brown-black (`#2B2119`) for body text — it reads warmer than pure black against the cream.
- Use negative letter-spacing (-1px to -2px) on all Anton display headlines for tight, architectural line reads.
- Use line-height 0.88–0.94 on display headlines so stacked lines kiss each other.
- Use left-alignment as the default for all content compositions.

### Don't
- Don't use pure white (`#ffffff`) as a background — the cream (`#F2EEE2`) is the identity. Pure white destroys the editorial feel.
- Don't use pure black (`#000000`) for text — use espresso (`#2B2119`) for the warm editorial read.
- Don't use rounded corners anywhere — photos, containers, dividers are all strict rectangles with `border-radius: 0`.
- Don't use red for body text, captions, or any long-form reading content — red is reserved for display headlines, bracketed numbers, parenthetical numbers, and the occasional short red subtitle.
- Don't use drop shadows on containers or cards — this style is flat.
- Don't use decorative elements beyond brackets, parentheses, and the optional ALL CAPS labels — no icons, no illustrations, no dot grids, no gradients.
- Don't use a second accent color — the palette is red, espresso, and cream. No blues, no yellows, no greens.
- Don't use small display headlines — if the headline is under 120px, it is not doing its job. Scale it up or rethink the composition.
- Don't mix cases in display headlines — they are always ALL CAPS (the one Interview Checklist variant uses sentence case but still at massive scale). Red is never set in lowercase body scale.
- Don't use serif type for body — Inter is the only body typeface in this style.
- Don't center-align body content — left-alignment is the rule. Center alignment is reserved for single-word cover compositions only.
- Don't use borders on containers — whitespace is the separator, not a box.

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
- **Typography scale down**: Massive Hero becomes 180px (from 240px). Display Hero becomes 140px. Display Large stays at 120px. Body stays at 15px.
- **Padding**: 80px on all sides. Content area is 920x920px.
- **Cover slide**: Massive red Anton headline in ALL CAPS, stacked on two lines to nearly fill the 920px content width. Tracked corner labels in top-left and top-right (13px, 2px letter-spacing). Generous top whitespace (at least 140px before headline begins). No photo on cover — the headline is the art.
- **Team/Photo slide**: Red headline top-left (e.g., "OUR TEAM" at 140px). Red subtitle below in 16px Inter 700 uppercase. Three portrait cutouts in a row below, each with ALL CAPS role/name caption. Optional `(05)` anchor in the far right column.
- **Bracketed list slide**: Each `[1]` bracket at 56px red, with 28px Inter 700 heading and 15px body text beside it. Items separated by 48px vertical gaps and hairline dividers.
- **Swipe indicator**: Small tracked uppercase page number in the bottom-right corner (e.g., "01 / 07" at 11px Inter 600, 1.8px tracking, espresso color).

### Infographic (1080px wide, variable height)
- **Typography**: Massive Hero at 200px for the cover section. Display Hero at 160px for section dividers. Body copy at 15–16px.
- **Padding**: 80px left/right. 100px top/bottom margins.
- **Section spacing**: 80–100px vertical gap between sections. Dividers are always whitespace, never rules.
- **Vertical rhythm**: Red display headline → red subtitle → photo or data block → bracketed numbered list → next red headline. Alternate between single-column body passages and multi-column photo/caption grids.
- **Footer**: Small tracked uppercase byline and URL (11px Inter 600, 1.8px tracking) centered or left-aligned at the bottom, separated from the last section by 80px.

### Slides (1920x1080px)
- **Typography scale up**: Massive Hero becomes 280px (from 240px). Display Hero becomes 220px. Display Large becomes 160px. Body Large becomes 22px. Body at 17px.
- **Padding**: 100px on all sides. Content area is 1720x880px.
- **Cover slides**: Massive red Anton headline left-aligned, filling roughly 70–80% of the horizontal width. Corner labels at top-left and top-right. Generous whitespace in the bottom-right where a `(05)` page anchor can sit.
- **Content slides**: Two-column layout. Red headline on the left (120–160px), body content on the right (15–18px Inter). Left column anchors the composition; right column breathes.
- **Team slides**: Red headline top-left, three or four portrait cutouts in a horizontal row below with ALL CAPS caption blocks. A single red `(05)` in the right sidebar as the compositional anchor.
- **Section divider slides**: Single massive red headline on a cream background, centered horizontally, with no body content. Pure type as art.

### Poster (1080x1350px)
- **Typography**: Massive Hero at 200px. Display Hero at 160px. Body at 16px.
- **Padding**: 80px left/right, 100px top/bottom.
- **Composition**: Top third is the red display headline and bracketed or red subtitle. Middle third is a hero photo or bracketed numbered list. Bottom third is body content and the small tracked metadata label.
- **Vertical flow**: Headline → subtitle → breathing room (80px) → photo or list → breathing room (60px) → body text → metadata label at bottom.
- **CTA placement**: Small tracked uppercase label at the bottom-left, paired with a simple URL — no pill buttons, no rounded CTAs.

### Story (1080x1920px)
- **Typography**: Massive Hero becomes 240px for the hero headline (this is the "hero ~30% bigger" treatment for Story format — taller canvas demands larger display type to hold the proportion). Display Hero at 180px. Body at 17px. Bracket numbers at 64px.
- **Padding**: 120px left/right, 60px top/bottom. Content area is 840x1800px.
- **Composition**: The tall canvas splits naturally into three vertical zones. Top zone (640px tall): tracked corner labels and the massive red headline. Middle zone (640px tall): a single large portrait cutout (4:5 ratio) or a bracketed numbered list. Bottom zone (640px tall): body copy, red subtitle, and a tracked metadata label at the footer.
- **Hero headline**: The hero red headline is set ~30% larger than in Carousel format — if Carousel uses 180px, Story uses 240px. The headline is anchored at the top zone (60px from the top) and left-aligned within the 840px content width.
- **Photo treatment**: Story format benefits from one large 4:5 portrait cutout in the middle zone, 720px tall, extending nearly edge-to-edge within the 840px content width, with an ALL CAPS caption block directly below.
- **Footer bar**: At the bottom of the canvas (60px from the bottom edge), a small tracked uppercase label — "SWIPE UP" or "@HANDLE" — in 13px Inter 600 with 2px letter-spacing, left-aligned. Optional `(01)` page anchor on the right.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Cream Paper | `#F2EEE2` | Primary background — warm off-white |
| Tomato Red | `#C33A1F` | Display headlines, bracketed numbers, parenthetical numbers |
| Espresso Black | `#2B2119` | Primary body text, labels, captions |
| Ink Medium | `#4A3E33` | Secondary text, descriptive body copy |
| Ink Light | `#7A6B5C` | Tertiary text, photo credits, quiet metadata |
| Brick Red | `#A82E17` | Hover/active red, deeper accent variant |
| Rust Red | `#B83327` | Alternative display red — deeper tone |
| Cream Deep | `#ECE6D6` | Subtle inset background |
| Paper Fold | `#E4DCC8` | Photo frame background |
| Border Hairline | `rgba(43,33,25,0.15)` | Thin rule between list items |
| Ink Mute | `rgba(43,33,25,0.45)` | Page numbers, watermarks |

### Font Declarations

```css
/* Display (massive red headlines and bracketed numbers only) */
font-family: 'Anton', 'Oswald', 'Bebas Neue', Impact, sans-serif;

/* Body (everything else) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-bg: #F2EEE2;
  --color-red: #C33A1F;
  --color-ink: #2B2119;

  /* Colors -- Accent */
  --color-red-brick: #A82E17;
  --color-red-rust: #B83327;

  /* Colors -- Neutral Scale */
  --color-cream-deep: #ECE6D6;
  --color-photo-frame: #E4DCC8;
  --color-ink-medium: #4A3E33;
  --color-ink-light: #7A6B5C;
  --color-ink-mute: rgba(43, 33, 25, 0.45);

  /* Colors -- Surfaces */
  --color-surface-primary: #F2EEE2;
  --color-surface-inset: #ECE6D6;
  --color-surface-photo: #E4DCC8;

  /* Colors -- Borders */
  --color-border-hairline: rgba(43, 33, 25, 0.15);
  --color-border-rule: #2B2119;

  /* Colors -- Shadows */
  --shadow-none: none;
  --shadow-paper: 0 1px 2px rgba(43, 33, 25, 0.08);
  --shadow-photo: 0 2px 12px rgba(43, 33, 25, 0.10);

  /* Typography -- Families */
  --font-display: 'Anton', 'Oswald', 'Bebas Neue', Impact, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-massive-hero: 240px;
  --text-display-hero: 180px;
  --text-display-large: 120px;
  --text-display-medium: 88px;
  --text-big-number: 140px;
  --text-bracket-number: 56px;
  --text-h1: 28px;
  --text-h2: 20px;
  --text-body-large: 18px;
  --text-body: 15px;
  --text-body-small: 13px;
  --text-subtitle-red: 16px;
  --text-label-caps: 13px;
  --text-label-caps-small: 11px;

  /* Typography -- Weights */
  --weight-display: 400;
  --weight-heading: 700;
  --weight-body: 500;
  --weight-label: 600;
  --weight-label-strong: 700;

  /* Typography -- Line Heights */
  --leading-massive: 0.88;
  --leading-display: 0.90;
  --leading-display-large: 0.92;
  --leading-display-medium: 0.94;
  --leading-heading: 1.25;
  --leading-body: 1.60;
  --leading-label: 1.30;

  /* Typography -- Letter Spacing */
  --tracking-massive: -2px;
  --tracking-display: -1.5px;
  --tracking-display-large: -1px;
  --tracking-heading: -0.2px;
  --tracking-label: 2px;
  --tracking-label-small: 1.8px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-caption: 20px;
  --space-headline-sub: 24px;
  --space-list-gap: 32px;
  --space-section: 48px;
  --space-column: 60px;
  --space-outer: 80px;
  --space-wide: 100px;
  --space-story: 120px;

  /* Borders */
  --radius-none: 0;
  --border-hairline: 1px solid rgba(43, 33, 25, 0.15);
  --border-rule: 1px solid #2B2119;
}
```

### System Font Fallbacks
- **Display (if Anton fails to load):** `'Oswald', 'Bebas Neue', Impact, 'Arial Narrow Bold', sans-serif`
- **Body (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
