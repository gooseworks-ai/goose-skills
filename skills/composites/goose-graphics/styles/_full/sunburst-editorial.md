# Design Style: Sunburst Editorial

## 1. Visual Theme & Atmosphere

Sunburst Editorial is the design language of a mid-century boutique publishing house — the visual equivalent of a refined editorial carousel built by someone who keeps a shelf of Penguin Classics and a stack of old New Yorker issues within arm's reach. The style sits at the intersection of 1950s book-cover design, slow-reading literary magazines, and the small-press stationery shop aesthetic. Every slide feels like a page torn from a well-designed paperback: a near-white cream canvas (`#FBFAF4`), generous margins, a serif headline that commands the page like a chapter title, and body copy that reads like prose rather than sales copy. The canvas is deliberately *not* pure white — it is a warm, paper-stock cream that flatters the black text and lets the decorative elements sing without ever feeling like a glaring screen surface.

The dual-serif typography system — DM Serif Display for the headline and Lora for the body — creates an elegant, quiet tension between authority and readability. DM Serif Display is a high-contrast display serif with classical proportions and subtle flourishes; at 72-84px, weight 400, stacked on two lines and left-aligned, it reads like the title of a literary essay. Lora is a Bresse-sisters-style text serif designed for long-form reading; at 18-20px it delivers four to seven lines of body copy that invite the reader to actually *read*, not skim. Headlines and body are both in mixed case — there is no uppercase screaming, no tag pills, no modern startup affectation. The text is the content. The style's authority comes from restraint.

The signature move — the element that transforms this from "a nice serif carousel" into the Sunburst Editorial style — is the **decorative geometric collage in the top-right corner**: a stack of overlapping shapes including a mustard-yellow rectangle (`#D8AD38`), a forest-green rectangle (`#1E4A30`), a thin-line black sunburst (radiating lines from a small central circle), and occasionally a topographic contour blob. These elements nest, overlap, and crop each other like pieces of a hand-pasted collage. A second signature element — the hand-drawn-feeling numbered circle marker in the top-left corner (a thin outlined circle with a small open gap at its top, a number in serif inside) — reinforces the artisanal, craft-paper feel. The footer carries a brand name on the left and a URL on the right, both set in small rust-orange (`#C85A1F`) serif text, like the imprint line on the spine of a clothbound book. Think *Liceria & Co. meets Reader's Digest 1962 meets a modern independent zine*.

**Key Characteristics:**
- Near-white cream background (`#FBFAF4`) — warm paper-stock, never pure white
- Near-black serif text (`#1A1A1A`) — maximum readability without the harshness of pure black
- DM Serif Display at weight 400 for all headlines — stacked, left-aligned, 60–84px
- Lora at weight 400-500 for body text — 18–20px, line-height 1.65, classical reading rhythm
- Numbered circle marker in top-left (`~78px` diameter), thin 1.5px outline with a small open gap at top (hand-drawn feel), number in serif inside
- Signature sunburst + geometric collage in top-right corner (mustard rect + forest green rect + black sunburst radial lines + thin outlined circle)
- Mustard yellow accent (`#D8AD38`) — geometric collage block
- Forest green accent (`#1E4A30`) — geometric collage block
- Rust / brick-orange accent (`#C85A1F`) — footer text, byline, page numbers, small decorative marks
- Page numbers in rust serif, small (12-14px), bottom corners
- Generous padding (60-80px outer) — content breathes like a printed page
- No rounded corners on geometric shapes — the collage is deliberately hard-edged

## 2. Color Palette & Roles

### Primary
- **Cream** (`#FBFAF4`): Primary background. A warm, very light cream that reads as printed paper rather than screen white. The signature surface of the style — never substitute pure white.
- **Near-Black** (`#1A1A1A`): Primary text and sunburst line color. Used for all headlines and body copy. Confident without the flatness of `#000`.
- **Rust Orange** (`#C85A1F`): Primary accent. Used exclusively for footer text, byline, page numbers, and small editorial marks. This is the "imprint color" — the color of the publisher's mark on the spine.

### Accent
- **Mustard Yellow** (`#D8AD38`): Decorative block color. Used only in the sunburst collage and occasional inline decorative blocks. A warm, aged gold — never neon.
- **Forest Green** (`#1E4A30`): Decorative block color. Used only in the sunburst collage and occasional inline decorative blocks. A deep, bottle-green — the color of old library binding.
- **Rust Deep** (`#A54617`): Hover/active state for rust orange elements. Used on links and interactive rust text.

### Neutral Scale
- **Cream Deep** (`#F4F1E8`): Slightly deeper cream for inset panels and quiet recesses.
- **Secondary Text** (`#3D3A36`): Warm dark gray for subtitles and supporting prose. Keeps the body in the warm family — never cool gray.
- **Tertiary Text** (`#6B6660`): Warm mid-gray for metadata, attributions, captions.
- **Muted Text** (`rgba(26,26,26,0.35)`): Very low-emphasis text like slide numbers when not using rust.
- **Pencil Gray** (`rgba(26,26,26,0.65)`): Used for the thin outline of the numbered circle marker to evoke a pencil-drawn feel.

### Surface & Borders
- **Surface Primary** (`#FBFAF4`): The canvas itself — cards are rarely used; content sits directly on the background.
- **Surface Inset** (`#F4F1E8`): Deeper cream for the occasional inset panel or pull-quote background.
- **Border Hairline** (`rgba(26,26,26,0.15)`): Ultra-thin hairline for quiet dividers.
- **Border Default** (`rgba(26,26,26,0.25)`): Standard thin line for the numbered circle marker and sparse dividers.
- **Border Rust** (`rgba(200,90,31,0.4)`): Rust-tinted hairline for occasional accent rules.
- **Divider Rule** (`rgba(26,26,26,0.12)`): Subtle section divider.

### Shadow Colors
- **Shadow Warm Subtle** (`rgba(120,80,30,0.05)`): Ambient warm shadow for a hint of paper depth.
- **Shadow Warm Medium** (`rgba(120,80,30,0.10)`): Standard warm shadow — rarely used; this style is mostly flat.
- **Shadow Warm Deep** (`rgba(120,80,30,0.18)`): For the rare elevated element (inset pull-quote, featured card).

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
```

- **Display**: `'DM Serif Display', Georgia, 'Times New Roman', serif`
- **Body**: `'Lora', Georgia, 'Times New Roman', serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | DM Serif Display | 84px | 400 | 1.05 | -1.5px | Chapter/title headlines. Stack on 2 lines, left-aligned. |
| Section Heading | DM Serif Display | 72px | 400 | 1.05 | -1px | Content-slide headlines. Always 2-line stack. |
| Sub-heading | DM Serif Display | 44px | 400 | 1.15 | -0.5px | Secondary headlines, pull-quote titles. |
| Body Large | Lora | 20px | 400 | 1.65 | 0px | Lead paragraphs and standard body copy. |
| Body | Lora | 18px | 400 | 1.65 | 0px | Standard reading text — 4 to 7 lines per block. |
| Body Italic | Lora (italic) | 18px | 400 | 1.65 | 0px | Gentle emphasis within body prose. |
| Small / Caption | Lora | 13px | 500 | 1.50 | 0.2px | Metadata, attributions, captions. |
| Big Numbers | DM Serif Display | 72px | 400 | 1.00 | -1px | Statistics and key metrics. |
| Numbered Marker | DM Serif Display | 32px | 400 | 1.00 | 0px | Inside the numbered circle marker. |
| Footer Brand | Lora | 14px | 500 | 1.40 | 0.3px | Footer brand mark, set in rust orange. |
| Footer URL | Lora | 14px | 500 | 1.40 | 0.3px | Footer URL, set in rust orange. |
| Page Number | Lora | 13px | 500 | 1.00 | 0.3px | Slide number in rust orange. |

### Principles
- **Serif everything**: Both display and body are serifs. There is no sans-serif in this style — that is the defining discipline. Mixing in a sans would shatter the literary, printed-page feel.
- **Stacked headlines**: Headlines always break onto two lines. "Be Clear and / Concise." "Regular / Updates." The line break is deliberate — it creates the magazine-title silhouette.
- **Display weight 400, not 700**: DM Serif Display only ships at weight 400 — resist the urge to simulate boldness. The letterforms already have high stroke contrast; they carry weight without extra.
- **Body line-height 1.65**: Long-form reading rhythm. Tighter than 1.5 feels cramped on a serif; looser than 1.7 breaks cohesion. 1.65 is the sweet spot for Lora at 18-20px.
- **Rust for the imprint, not the content**: Rust orange is used *only* for footer brand, URL, page numbers, and occasional editorial marks. Never for headlines, never for body text, never for large decorative fills.
- **Left-align the text, center is forbidden**: Content text is always left-aligned. Title slides, content slides, and most CTA slides use left alignment. Only the decorative collage sits in the top-right.
- **Mixed case always**: Never uppercase headlines. The style is a printed book — books do not shout.

## 4. Component Patterns

### Numbered Circle Marker (Top-Left)

The hand-drawn-feeling outlined circle with a number inside. Built with inline SVG so the "open gap at top" is controllable and crisp at any size. Placed at the top-left of title and content slides.

```html
<div style="position: absolute; top: 60px; left: 60px; width: 78px; height: 78px;">
  <svg viewBox="0 0 78 78" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
    <!-- Hand-drawn feel: an arc that leaves a small gap at the top -->
    <path d="M 42 4 A 35 35 0 1 1 36 4"
          fill="none"
          stroke="rgba(26,26,26,0.65)"
          stroke-width="1.5"
          stroke-linecap="round" />
  </svg>
  <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'DM Serif Display', Georgia, serif; font-size: 32px; font-weight: 400; color: #1A1A1A; line-height: 1;">1</div>
</div>
```

### Sunburst Collage (Top-Right Signature Element)

The signature visual — a collage of overlapping geometric shapes and a thin-line black sunburst in the top-right corner. Drop this inline SVG into any title slide and every other content slide. Dimensions are ~220×260px; scale with the `width` wrapper.

```html
<div style="position: absolute; top: 0; right: 0; width: 240px; height: 280px; pointer-events: none;">
  <svg viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
    <!-- Mustard rectangle (sits behind, top) -->
    <rect x="150" y="0" width="90" height="130" fill="#D8AD38" />
    <!-- Forest green rectangle (sits behind, bottom-right) -->
    <rect x="170" y="110" width="70" height="170" fill="#1E4A30" />
    <!-- Sunburst: 24 radiating lines from central point -->
    <g stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round">
      <line x1="140" y1="90" x2="140" y2="30" />
      <line x1="140" y1="90" x2="155.5" y2="33.9" />
      <line x1="140" y1="90" x2="170" y2="43.9" />
      <line x1="140" y1="90" x2="182.4" y2="60" />
      <line x1="140" y1="90" x2="190" y2="78.8" />
      <line x1="140" y1="90" x2="195" y2="90" />
      <line x1="140" y1="90" x2="190" y2="101.2" />
      <line x1="140" y1="90" x2="182.4" y2="120" />
      <line x1="140" y1="90" x2="170" y2="136.1" />
      <line x1="140" y1="90" x2="155.5" y2="146.1" />
      <line x1="140" y1="90" x2="140" y2="150" />
      <line x1="140" y1="90" x2="124.5" y2="146.1" />
      <line x1="140" y1="90" x2="110" y2="136.1" />
      <line x1="140" y1="90" x2="97.6" y2="120" />
      <line x1="140" y1="90" x2="90" y2="101.2" />
      <line x1="140" y1="90" x2="85" y2="90" />
      <line x1="140" y1="90" x2="90" y2="78.8" />
      <line x1="140" y1="90" x2="97.6" y2="60" />
      <line x1="140" y1="90" x2="110" y2="43.9" />
      <line x1="140" y1="90" x2="124.5" y2="33.9" />
    </g>
    <!-- Thin outlined circle at the center of the sunburst -->
    <circle cx="140" cy="90" r="13" fill="#FBFAF4" stroke="#1A1A1A" stroke-width="1.5" />
    <!-- Tiny dot inside the circle (small sun icon) -->
    <circle cx="140" cy="90" r="3" fill="#1A1A1A" />
  </svg>
</div>
```

### Title Block (Cover / Content Header)

```html
<div style="background-color: var(--color-bg); padding: 60px; position: relative; min-height: 100%;">
  <!-- Numbered circle marker (top-left) -->
  <div style="position: absolute; top: 60px; left: 60px; width: 78px; height: 78px;">
    <svg viewBox="0 0 78 78" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
      <path d="M 42 4 A 35 35 0 1 1 36 4" fill="none" stroke="rgba(26,26,26,0.65)" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 32px; color: var(--color-near-black); line-height: 1;">1</div>
  </div>

  <!-- Sunburst collage (top-right) goes here — see component above -->

  <!-- Headline -->
  <div style="position: absolute; left: 60px; right: 60px; top: 240px;">
    <h1 style="font-family: var(--font-display); font-size: 84px; font-weight: 400; line-height: 1.05; letter-spacing: -1.5px; color: var(--color-near-black); margin: 0 0 40px; max-width: 70%;">Be Clear and<br>Concise</h1>
    <p style="font-family: var(--font-body); font-size: 20px; font-weight: 400; line-height: 1.65; color: var(--color-near-black); max-width: 78%; margin: 0;">Communicate your ideas in a straightforward manner to avoid misunderstandings. Avoid jargon and overly complex sentences, as these can lead to confusion. It's also helpful to organize your thoughts logically, presenting them in a step-by-step fashion.</p>
  </div>

  <!-- Footer -->
  <div style="position: absolute; left: 60px; right: 60px; bottom: 60px; display: flex; justify-content: space-between; align-items: baseline;">
    <span style="font-family: var(--font-body); font-size: 14px; font-weight: 500; letter-spacing: 0.3px; color: var(--color-rust);">Liceria &amp; Co.</span>
    <span style="font-family: var(--font-body); font-size: 14px; font-weight: 500; letter-spacing: 0.3px; color: var(--color-rust);">reallygreatsite.com</span>
  </div>
</div>
```

### Serif Editorial Body (Standard Body Component)

Standard body component with Lora text and a drop-style opening — the first few words of the first paragraph can be set slightly larger for a literary opening flourish.

```html
<div style="max-width: 78%;">
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.65; color: var(--color-near-black); margin: 0 0 18px;">
    <span style="font-family: var(--font-display); font-size: 22px; line-height: 1; color: var(--color-near-black);">Keep the team informed</span>
    with frequent progress reports and updates. Regular communication helps ensure everyone is on the same page and can address any issues promptly.
  </p>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.65; color: var(--color-near-black); margin: 0;">
    Additionally, consider scheduling brief but regular check-ins, either through virtual meetings or written summaries, to discuss milestones, challenges, and next steps.
  </p>
</div>
```

### Numbered Item (Within Body Flow)

```html
<div style="display: flex; gap: 24px; padding: 20px 0; border-top: 1px solid rgba(26,26,26,0.12);">
  <div style="flex-shrink: 0; font-family: var(--font-display); font-size: 32px; color: var(--color-rust); line-height: 1; min-width: 44px;">01</div>
  <div>
    <h3 style="font-family: var(--font-display); font-size: 26px; font-weight: 400; line-height: 1.2; color: var(--color-near-black); margin: 0 0 8px;">Be Clear and Concise</h3>
    <p style="font-family: var(--font-body); font-size: 17px; font-weight: 400; line-height: 1.6; color: var(--color-secondary); margin: 0;">Avoid jargon and overly complex sentences; prefer examples and analogies to make your points more relatable.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="padding: 40px 0; max-width: 360px;">
  <p style="font-family: var(--font-display); font-size: 96px; font-weight: 400; line-height: 1.0; letter-spacing: -2px; color: var(--color-near-black); margin: 0 0 12px;">47<span style="color: var(--color-rust);">%</span></p>
  <div style="width: 48px; height: 1.5px; background: var(--color-rust); margin: 0 0 14px;"></div>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.55; color: var(--color-secondary); margin: 0;">Teams respond to leads nearly twice as fast when editorial discipline meets modern tooling.</p>
</div>
```

### Comparison Grid (2-Column Editorial)

```html
<div style="display: grid; grid-template-columns: 1fr 1px 1fr; gap: 40px; align-items: start;">
  <div>
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 500; letter-spacing: 0.5px; color: var(--color-rust); margin: 0 0 12px; text-transform: uppercase;">Before</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 400; line-height: 1.15; color: var(--color-near-black); margin: 0 0 14px;">Manual &amp;<br>Fragmented</h3>
    <p style="font-family: var(--font-body); font-size: 17px; font-weight: 400; line-height: 1.6; color: var(--color-secondary); margin: 0;">Slack threads, spreadsheets, and endless context switching between a dozen tabs.</p>
  </div>
  <div style="background: rgba(26,26,26,0.15); align-self: stretch;"></div>
  <div>
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 500; letter-spacing: 0.5px; color: var(--color-rust); margin: 0 0 12px; text-transform: uppercase;">After</p>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 400; line-height: 1.15; color: var(--color-near-black); margin: 0 0 14px;">Orchestrated<br>&amp; Calm</h3>
    <p style="font-family: var(--font-body); font-size: 17px; font-weight: 400; line-height: 1.6; color: var(--color-secondary); margin: 0;">Research, drafting, and follow-up handled quietly in the background while the team focuses on decisions.</p>
  </div>
</div>
```

### Pull-Quote Block

```html
<div style="padding: 44px 0 44px 32px; border-left: 2px solid var(--color-rust); max-width: 80%;">
  <p style="font-family: var(--font-display); font-size: 34px; font-weight: 400; font-style: italic; line-height: 1.25; color: var(--color-near-black); margin: 0 0 24px;">It felt less like configuring software and more like onboarding a new colleague.</p>
  <div style="display: flex; align-items: center; gap: 14px;">
    <div style="width: 28px; height: 1.5px; background: var(--color-rust);"></div>
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 500; letter-spacing: 0.3px; color: var(--color-tertiary); margin: 0;">Sarah Chen, VP Operations</p>
  </div>
</div>
```

### CTA Block

```html
<div style="padding: 60px; position: relative; min-height: 100%;">
  <!-- Sunburst collage goes in top-right -->

  <div style="max-width: 72%; position: absolute; left: 60px; right: 60px; top: 240px;">
    <h2 style="font-family: var(--font-display); font-size: 84px; font-weight: 400; line-height: 1.05; letter-spacing: -1.5px; color: var(--color-near-black); margin: 0 0 32px;">Meet your<br>new coworker.</h2>
    <p style="font-family: var(--font-body); font-size: 20px; font-weight: 400; line-height: 1.65; color: var(--color-secondary); max-width: 90%; margin: 0 0 40px;">Deploy your first AI coworker in minutes. Start free, scale when ready.</p>
    <a style="display: inline-block; font-family: var(--font-body); font-size: 18px; font-weight: 600; color: var(--color-rust); text-decoration: none; border-bottom: 1.5px solid var(--color-rust); padding-bottom: 4px; letter-spacing: 0.2px;">Get started &rarr;</a>
  </div>

  <!-- Footer -->
  <div style="position: absolute; left: 60px; right: 60px; bottom: 60px; display: flex; justify-content: space-between; align-items: baseline;">
    <span style="font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--color-rust);">Liceria &amp; Co.</span>
    <span style="font-family: var(--font-body); font-size: 14px; font-weight: 500; color: var(--color-rust);">reallygreatsite.com</span>
  </div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap — within a single inline element.
- **8px**: Tight gap — between a label and its adjacent text.
- **14px**: Small gap — between a subtitle and the headline below it.
- **20px**: Base gap — between body paragraphs.
- **32px**: Section internal — gap between headline and first body paragraph.
- **40px**: Content gap — between stacked content components within a slide.
- **48px**: Section divider — vertical space between major content blocks.
- **60px**: Standard outer padding — the default page margin.
- **80px**: Wide outer padding — used on slides and posters.
- **120px**: Story-format outer padding — used on vertical Story format only.

### Format Padding

| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| Story (1080x1920) | 120px left/right, 60px top/bottom | 840px |

### Alignment & Grid
- **Primary alignment**: Left-aligned for *all* content — headlines, body, footers. The only exception is when a byline or credit needs to sit in the right corner of a footer row.
- **Grid**: Content sits in a generous single column or a 2-column editorial split for comparisons. Never use more than 2 columns; this is a reading style, not a dashboard style.
- **Corner zones**: Top-left is reserved for the numbered circle marker. Top-right is reserved for the sunburst collage (on title slides and every other content slide). Bottom-left and bottom-right are reserved for the rust footer band.
- **Vertical rhythm**: Maintain 40-48px gaps between top-level sections. Leave generous breathing room — if in doubt, add 20px more.
- **Content gravity**: On most slides, content settles in the middle-left zone, with the headline starting around the 35-45% vertical line and body flowing below it. Never center.
- **Headline stack**: Always break headlines onto 2 lines manually. The line break is a design decision, not a wrapping accident.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#FBFAF4` | The default — almost every element lives here |
| Hairline (Level 1) | `1px solid rgba(26,26,26,0.12)` divider | Section separators within body flow |
| Subtle (Level 2) | `0 2px 8px rgba(120,80,30,0.05)` | Rare — a pull-quote hovering slightly |
| Card (Level 3) | `0 8px 24px rgba(120,80,30,0.10)` | Featured editorial card, almost never used |
| Overlay (Level 4) | `0 16px 40px rgba(120,80,30,0.18)` | Modal or drop panel, essentially unused |

### Border Treatments
- **Hairline divider**: `1px solid rgba(26,26,26,0.12)` — the standard divider between numbered items or editorial blocks.
- **Thin content rule**: `1.5px solid rgba(26,26,26,0.25)` — for the numbered circle marker and other sparse outlined elements.
- **Rust accent rule**: `2px solid #C85A1F` — used as the left border of a pull-quote block, or as a short horizontal rule under a stat number.
- **No rounded corners on shapes**: All decorative geometric blocks in the collage are hard-edged rectangles. Never use `border-radius` on the mustard or forest green blocks.

### Surface Hierarchy
On this cream canvas, depth is almost always flat. Elevation is communicated not through shadow but through **line weight, color temperature, and whitespace**:
1. **Cream** (`#FBFAF4`) — the canvas. 95% of every slide lives here.
2. **Near-black type** (`#1A1A1A`) — the primary foreground, commanding attention through serif mass.
3. **Rust footer text** (`#C85A1F`) — a quiet second voice, the publisher's imprint.
4. **Geometric collage blocks** (mustard, forest green) — the loudest surface in the style, but confined entirely to the top-right corner.
5. **Sunburst lines** — black on cream, visually layered on top of the mustard and green blocks.

## 7. Do's and Don'ts

### Do
- Use the sunburst collage on every title slide and *every other* content slide. The rhythm is: slide 1 has it, slide 2 doesn't, slide 3 has it, slide 4 doesn't. This creates alternation without overuse.
- Use the numbered circle marker (thin outline with a small top gap) in the top-left corner of every numbered content slide. The number inside should be in DM Serif Display at 32px.
- Use DM Serif Display at weight 400 for all headlines. Resist the urge to apply `font-weight: 700` — it is not a supported weight and will render as faux-bold.
- Use rust orange (`#C85A1F`) for footer brand text, footer URL, page numbers, stat accents, and pull-quote rules — the small editorial marks only.
- Break every headline into 2 lines manually with a `<br>`. The stacked silhouette is core to the style.
- Keep body copy in Lora at 18-20px with line-height 1.65 — the long-form reading rhythm.
- Use the near-white cream background (`#FBFAF4`) on every slide without exception. The cream is the style.
- Keep all decorative geometric shapes (mustard rect, forest green rect) with hard corners — no `border-radius`.
- Left-align all content — headline, body, numbered items, pull-quotes.
- Include the footer brand + URL line on every carousel slide. It is the imprint, and it anchors the publication feel.
- Use italic Lora for gentle emphasis in body prose — never bold.
- Build the sunburst with inline SVG using the provided component. Do not use a background-image or PNG.

### Don't
- Don't use the sunburst collage on every single slide — it will overwhelm. Use it on alternating slides only.
- Don't use pure white (`#FFFFFF`) or pure black (`#000000`). The cream (`#FBFAF4`) and near-black (`#1A1A1A`) are non-negotiable.
- Don't use modern sans-serif fonts (Inter, DM Sans, Space Grotesk) for headlines — this style is serif-only. Mixing in a sans is the single biggest way to destroy the aesthetic.
- Don't center-align content. Editorial type reads left-aligned.
- Don't use yellow pill tags, step labels, or any modern "carousel framework" UI elements. This is not that style.
- Don't use mustard or forest green for text — they live only in the collage blocks.
- Don't use rust orange for headlines or body text — it is reserved for footer marks, page numbers, and small editorial accents.
- Don't round the corners of the geometric collage shapes. Hard edges only.
- Don't use rounded corners larger than 4px on any element. This style is flat and editorial.
- Don't use drop shadows on body content. The style is deliberately flat.
- Don't add icons, emoji, or illustrations. The sunburst collage is the only decorative element.
- Don't stack more than 2 lines in the headline, or use more than 7 lines of body copy per slide. Reading space is the luxury.
- Don't uppercase headlines. Ever. Books do not shout.

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
- **Typography scale**: Display Hero at 72px (down from 84px). Section Heading at 64px. Body at 18px, line-height 1.65.
- **Padding**: 60px all sides. Content area is 960x960px.
- **Cover slide**: Numbered circle marker top-left ("1"). Sunburst collage top-right. Headline stacked on 2 lines, starting ~45% down the slide, max-width 70%. Short 3-4 line lead paragraph below. Footer brand + URL in rust at bottom.
- **Content slides**: Numbered marker (2, 3, 4...) top-left. Sunburst collage top-right on alternating slides only. Headline starts mid-slide. Body flows below, 4-7 lines. Rust footer at bottom.
- **CTA slide**: Same title-slide structure with the CTA link in rust-underlined text. Sunburst in top-right.
- **Swipe indicator**: Omit — this is a style that trusts the reader to turn the page. If required, use small rust dots, 6px diameter, bottom center.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Hero at 84px for the top section.
- **Padding**: 60px left/right, 80px top/bottom.
- **Section spacing**: 80px vertical gap between major sections.
- **Top zone**: Numbered marker + sunburst collage + hero headline + lead paragraph.
- **Middle zones**: Numbered item components stacked with hairline dividers, or editorial 2-column splits with the thin vertical rule between them.
- **Bottom zone**: Rust footer band with brand + URL.
- **Sunburst placement**: Only at the very top of the infographic, never in the middle sections.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero at 108px. Section Heading at 88px. Body at 22px with line-height 1.65.
- **Padding**: 80px all sides. Content area 1760x920px.
- **Layout**: Content occupies left ~65% of slide. Sunburst collage sits in top-right corner, scaled to ~320x380px to balance the widescreen format.
- **Title slide**: Numbered marker top-left (scaled to 100px). Stacked headline on 2 lines with 108px serif. Lead paragraph below, max-width 1100px. Rust footer row at bottom spanning left-to-right.
- **Content slide**: Headline on the left 55%. Body and editorial components fill left 65%. Sunburst remains top-right. Generous whitespace on the right of the content.
- **CTA slide**: Centered headline + rust-underlined CTA link. Sunburst top-right. Footer rust band bottom.

### Poster (1080x1350px)
- **Typography**: Display Hero at 92px. Section Heading at 72px. Body at 19px with line-height 1.65.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third — numbered marker top-left, sunburst collage top-right. Middle third — headline stack and lead paragraph. Bottom third — secondary body block or numbered items. Footer at the very bottom with rust brand + URL.
- **Vertical flow**: A full editorial page — reads top to bottom like a printed poster pinned to a café wall.

### Story (1080x1920px)
- **Typography scale**: Display Hero at 108px (hero ~30% bigger than carousel for the vertical scale). Section Heading at 84px. Body at 22px with line-height 1.65.
- **Padding**: 120px left/right, 60px top/bottom — wider horizontal margin than other formats to preserve the editorial gutters on a phone screen.
- **Content max-width**: 840px.
- **Cover/title layout**: Numbered marker top-left at ~100px. Sunburst collage top-right scaled to ~300x360px. Hero headline stacked on 2-3 lines starting ~40% down the canvas. Lead paragraph of 4-6 lines beneath. Footer rust band at the bottom (above any Story UI safe zone).
- **Content slide layout**: Same corner zones. Headline occupies the upper-middle third. Body flows down to the lower third. Generous whitespace above the headline is the key to the Story format's cinematic feel.
- **Safe zones**: Keep critical text 180px from the top and 280px from the bottom to avoid Story UI chrome (username, reply bar). The outer 120px horizontal padding handles the left/right safe zones.
- **Sunburst rhythm**: On Story decks of 3+ slides, the sunburst appears on the first, third, fifth slides — alternating as with carousels.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Cream | `#FBFAF4` | Primary background (all slides, all formats) |
| Near-Black | `#1A1A1A` | Primary text, sunburst lines, numbered marker text |
| Rust Orange | `#C85A1F` | Footer brand, URL, page numbers, stat accents, pull-quote rules |
| Mustard Yellow | `#D8AD38` | Sunburst collage block only |
| Forest Green | `#1E4A30` | Sunburst collage block only |
| Rust Deep | `#A54617` | Hover/active state for rust elements |
| Cream Deep | `#F4F1E8` | Inset panels, rare recessed areas |
| Secondary Text | `#3D3A36` | Subtitles, supporting prose |
| Tertiary Text | `#6B6660` | Metadata, captions, attributions |
| Pencil Gray | `rgba(26,26,26,0.65)` | Thin outline of numbered circle marker |
| Border Hairline | `rgba(26,26,26,0.12)` | Section dividers |

### Font Declarations

```css
/* Display — headlines, big numbers, numbered marker */
font-family: 'DM Serif Display', Georgia, 'Times New Roman', serif;

/* Body — everything else */
font-family: 'Lora', Georgia, 'Times New Roman', serif;
```

### Google Fonts Link

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors — Primary */
  --color-bg: #FBFAF4;
  --color-near-black: #1A1A1A;
  --color-rust: #C85A1F;

  /* Colors — Decorative Accents (collage only) */
  --color-mustard: #D8AD38;
  --color-forest: #1E4A30;
  --color-rust-deep: #A54617;

  /* Colors — Neutral Scale */
  --color-cream-deep: #F4F1E8;
  --color-secondary: #3D3A36;
  --color-tertiary: #6B6660;
  --color-muted: rgba(26, 26, 26, 0.35);
  --color-pencil: rgba(26, 26, 26, 0.65);

  /* Colors — Surfaces */
  --color-surface-primary: #FBFAF4;
  --color-surface-inset: #F4F1E8;

  /* Colors — Borders */
  --color-border-hairline: rgba(26, 26, 26, 0.12);
  --color-border-default: rgba(26, 26, 26, 0.25);
  --color-border-rust: rgba(200, 90, 31, 0.4);
  --color-divider: rgba(26, 26, 26, 0.12);

  /* Colors — Shadows */
  --shadow-subtle: rgba(120, 80, 30, 0.05);
  --shadow-medium: rgba(120, 80, 30, 0.10);
  --shadow-deep: rgba(120, 80, 30, 0.18);

  /* Typography — Families */
  --font-display: 'DM Serif Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Lora', Georgia, 'Times New Roman', serif;

  /* Typography — Sizes */
  --text-display-hero: 84px;
  --text-section-heading: 72px;
  --text-sub-heading: 44px;
  --text-body-large: 20px;
  --text-body: 18px;
  --text-small: 13px;
  --text-big-number: 72px;
  --text-marker: 32px;
  --text-footer: 14px;

  /* Typography — Weights */
  --weight-display: 400;
  --weight-body: 400;
  --weight-body-medium: 500;
  --weight-body-bold: 600;

  /* Typography — Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.15;
  --leading-sub-heading: 1.20;
  --leading-body: 1.65;
  --leading-small: 1.50;
  --leading-number: 1.00;

  /* Typography — Letter Spacing */
  --tracking-display: -1.5px;
  --tracking-heading: -1px;
  --tracking-body: 0px;
  --tracking-footer: 0.3px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 14px;
  --space-base: 20px;
  --space-medium: 32px;
  --space-gap: 40px;
  --space-section: 48px;
  --space-outer: 60px;
  --space-wide: 80px;
  --space-story: 120px;

  /* Borders */
  --radius-none: 0;
  --radius-hair: 2px;
  --border-thin: 1px solid rgba(26, 26, 26, 0.12);
  --border-thick: 1.5px solid rgba(26, 26, 26, 0.25);
  --border-rust: 2px solid #C85A1F;

  /* Numbered Marker */
  --marker-size: 78px;
  --marker-stroke: 1.5px;
  --marker-color: rgba(26, 26, 26, 0.65);

  /* Sunburst Collage */
  --collage-width: 240px;
  --collage-height: 280px;
}
```

### System Font Fallbacks
- **Display (if DM Serif Display fails to load):** `Georgia, 'Times New Roman', serif`
- **Body (if Lora fails to load):** `Georgia, 'Times New Roman', serif`

### Quick-Reference Checklist for Agents
Before finalizing any Sunburst Editorial slide, confirm:
1. Background is `#FBFAF4` (not pure white).
2. All text is serif — no sans-serif anywhere.
3. Headline is stacked on 2 lines, left-aligned, in DM Serif Display weight 400.
4. Body is in Lora at 18-20px with line-height 1.65.
5. Numbered circle marker (with top gap) is in the top-left of every numbered slide.
6. Sunburst collage is in the top-right of title slides and every other content slide.
7. Footer has brand name + URL in rust orange (`#C85A1F`), small serif.
8. No rounded corners on the decorative geometric blocks.
9. No yellow pill tags, step labels, or modern carousel UI elements.
10. Content is left-aligned — never centered.
