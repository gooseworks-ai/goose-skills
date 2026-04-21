# Design Style: Vintage Duotone Poster

## 1. Visual Theme & Atmosphere

Vintage Duotone Poster is a mid-century letterpress aesthetic pulled straight from a 1950s drive-in marquee. It is the visual language of a printed event flyer stapled to a telephone pole outside a small-town cinema -- two-color halftone reproduction, chunky brush-script display type, and a heavy condensed poster sans that hits like a hammer. The canvas is a deep forest green (`#2D4D3A`) that reads less like a digital background and more like the ink-saturated fiber of pulp board stock. Against that green, a single dusty salmon pink (`#EDB5A7`) does all the work -- it is the only accent, used for type, photography tint, halftone dots, and the thin corner rules. The restraint is the point. When every mark on the canvas is one of two colors, the composition feels authored, printed, and deliberate.

The signature move is a **duotone halftone photograph** -- a black-and-white portrait re-inked into green shadows and pink highlights, printed through a dot screen so the image breathes with visible texture. In CSS this is achieved with a stacked filter chain (`grayscale(100%) contrast(120%) sepia(100%) hue-rotate(...)` plus a pink-tinted `mix-blend-mode: screen` overlay), or more reliably by pre-processing the image in Photoshop/Figma as a true duotone and dropping it in as a static asset. Either way, the photograph is not decoration -- it is the hero. It occupies the lower two-thirds of the composition, bleeds to the edges, and carries all the human warmth while the typography handles authority and impact.

The typography pairs a **chunky 1950s brush script** for the emotional word with a **heavy condensed poster sans in ALL CAPS** for the impact word. The script word floats with personal handwriting energy -- rounded, slightly slanted, dropping below baseline. The condensed sans word below it is set enormous, nearly edge-to-edge, so tight the tracking almost collapses. This stacking -- casual script over commanding sans -- is how 1950s movie posters shouted their titles from a block away. Event metadata (`@reallygreatsite`, `08/09 10 PM`, `FREE ENTRY`) is set small in uppercase sans and pushed into the left and right margins beside the photograph, creating a symmetric frame that reads like a ticket stub. The whole thing feels like a Saul Bass rough, a Hatch Show Print run, or a Criterion Collection sleeve for a forgotten B-movie.

**Key Characteristics:**
- Deep forest green background (`#2D4D3A`) -- the ink-saturated canvas, never lighter, never a gradient
- Dusty salmon pink (`#EDB5A7`) as the **sole** accent -- for type, photo tint, rules, halftone dots, and every mark
- Duotone halftone photography occupying the lower two-thirds -- green shadows, pink highlights, visible grain
- Chunky brush-script display font for the emotional word (Alfa Slab One as the fallback, Rubik Puddles for true brush feel)
- Heavy condensed poster sans (Oswald / Bebas Neue) for the impact word, set in ALL CAPS at ~200-280px
- Stacked two-word headline: script on top (~30% of headline height), condensed sans below (~70%)
- Metadata in small uppercase sans (14-18px, weight 600, letter-spacing 2px) pushed to left/right margins
- Subtle film grain / halftone dot texture overlay at 6-10% opacity -- never flat
- Thin 1-2px pink rules for dividers and corner accents -- never rounded
- High contrast between type and ground -- 4.8:1 ratio minimum for all pink-on-green text
- Zero use of rounded corners, gradients, or drop shadows -- this is a printed artifact

## 2. Color Palette & Roles

### Primary
- **Forest Green** (`#2D4D3A`): Primary background. A deep, slightly desaturated forest green that reads as printed ink on pulp board. The dominant surface across every format.
- **Dusty Pink** (`#EDB5A7`): Primary accent and primary text. The sole content color -- headlines, body, metadata, rules, halftone highlights, photograph tint. Its dustiness is load-bearing; a brighter coral would look digital.
- **Deep Green** (`#1F3528`): A darker forest green used for photograph shadows, subtle recessed panels, and the deep end of the duotone gradient.

### Accent
- **Pink Highlight** (`#F5CFC6`): A slightly paler pink for halftone highlights, photograph catch-lights, and hover states. Used sparingly -- never as a second accent color, only as a lightness variant of the primary pink.
- **Pink Shadow** (`#D9948A`): A slightly deeper pink for the darker end of pink type on ambiguous ground, or for drop-cap emphasis. The lower bound of the pink range.

### Neutral Scale
- **Green Canvas** (`#2D4D3A`): The base green.
- **Green Inset** (`#264030`): A recessed green for inset panels -- ~10% darker than the canvas.
- **Green Deep** (`#1F3528`): The deepest end of any duotone gradient.
- **Pink Text Primary** (`#EDB5A7`): All primary type.
- **Pink Text Muted** (`rgba(237, 181, 167, 0.65)`): Secondary text, metadata lines, slide numbers.
- **Pink Text Faint** (`rgba(237, 181, 167, 0.35)`): Borders, dividers, watermarks.

### Surface & Borders
- **Surface Primary** (`#2D4D3A`): The canvas itself. Cards and containers do not use a different fill -- they are defined by borders and rules only.
- **Surface Inset** (`#264030`): Rare recessed panel color -- 10% darker than the canvas.
- **Border Default** (`rgba(237, 181, 167, 0.35)`): Standard 1px pink rule for dividers and thin corner accents.
- **Border Strong** (`rgba(237, 181, 167, 0.65)`): 2px pink rule for featured borders and framing devices.
- **Border Accent** (`#EDB5A7`): Full-opacity pink border for the rare emphasized container.
- **Divider Rule** (`rgba(237, 181, 167, 0.25)`): Faint hairline for internal section separators.

### Shadow Colors
- **Shadow None** (`transparent`): The default. This style uses no drop shadows.
- **Shadow Ink** (`rgba(31, 53, 40, 0.5)`): A deep green "ink bleed" used only on duotone photograph edges where a soft vignette is needed.
- **Grain Overlay** (`rgba(237, 181, 167, 0.06)`): The pink film-grain texture applied as a full-canvas overlay at very low opacity.

### Texture
- **Halftone Dots**: `radial-gradient(circle, rgba(237, 181, 167, 0.12) 1px, transparent 1.5px)` at `4px 4px` spacing. Applied as a subtle overlay on photograph areas to simulate print-screen reproduction.
- **Film Grain**: `radial-gradient(circle, rgba(237, 181, 167, 0.08) 0.5px, transparent 1px)` at `3px 3px` spacing. Applied across the entire canvas at low opacity for paper-stock feel.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Oswald:wght@400;500;600;700&family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Script Display** (`Alfa Slab One`, fallback `Georgia, serif`): Used exclusively for the "emotional word" in a stacked headline -- the equivalent of "Movie" in the reference. Chunky, slab-like, with a hand-drawn vintage presence. Alfa Slab One is the closest Google Font to the reference's brush-script feel while remaining legible and impactful.
- **Impact Display** (`Oswald`, fallback `Impact, sans-serif`): Used for the "impact word" -- the equivalent of "NIGHT". Heavy condensed sans at weight 700, set in ALL CAPS at poster-scale sizes.
- **Metadata** (`Oswald`, weight 600): Small uppercase sans for event metadata, handles, dates, and CTA labels. Same family as the impact word for compositional unity.
- **Body** (`Inter`, fallback `-apple-system, Helvetica, Arial, sans-serif`): Reserved for rare body-text overflow cases. This style is display-heavy -- most compositions contain very little body text.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Script | Alfa Slab One | 140px | 400 | 0.95 | -2px | The emotional word. Slightly tilted via `transform: rotate(-3deg)`. Positioned to overlap the impact word slightly. |
| Display Impact | Oswald | 240px | 700 | 0.85 | -4px | The impact word. ALL CAPS. Set nearly edge-to-edge. Tight tracking. |
| Section Heading | Oswald | 72px | 700 | 0.95 | -1px | Section dividers. ALL CAPS. |
| Sub-heading | Oswald | 48px | 600 | 1.05 | 0px | Card headings. ALL CAPS. |
| Body Large | Inter | 22px | 500 | 1.55 | 0.3px | Body overflow, rare. |
| Body | Inter | 18px | 500 | 1.55 | 0.3px | Standard body text when needed. |
| Metadata Large | Oswald | 32px | 600 | 1.10 | 2px | "08/09 10 PM" -- corner metadata at poster scale. ALL CAPS. |
| Metadata | Oswald | 18px | 600 | 1.20 | 2px | Standard metadata, handles, tags. ALL CAPS. |
| Metadata Small | Oswald | 14px | 600 | 1.20 | 2.5px | Fine print, slide numbers, credits. ALL CAPS. |
| Big Numbers | Oswald | 180px | 700 | 0.90 | -3px | Stat displays. ALL CAPS. |
| CTA Label | Oswald | 24px | 700 | 1.00 | 3px | Button text. ALL CAPS. |

### Principles
- **Two fonts do everything.** Alfa Slab One for the single emotional word. Oswald for everything else. This is a binary type system -- the restraint is the style.
- **Stack the headline.** Display headlines are always two words, stacked vertically: script on top, condensed sans below. The script word is ~30% of the total headline height, the impact word is ~70%. They overlap slightly (negative margin, -20px to -40px) to feel hand-composed.
- **ALL CAPS is the default.** Oswald is used almost exclusively in uppercase. Mixed case is reserved for the rare body-text overflow. The only lowercase letters in the reference are in the `@reallygreatsite` handle.
- **Tight tracking on display, wide tracking on metadata.** Display Impact runs at -4px letter-spacing for edge-to-edge impact. Metadata runs at +2px to +2.5px for that "etched plate" feel.
- **Line height collapses at display scale.** The impact word sits at 0.85 line height so stacked words almost touch. Metadata sits at 1.10-1.20 for breathing room.
- **Never italicize.** This style has no italic variants. The script font provides the "soft" energy; nothing else needs to lean.
- **Slight rotation on the script word.** Apply `transform: rotate(-3deg)` or `rotate(-2deg)` to the script word for hand-set-on-press energy. Never rotate anything else.

## 4. Component Patterns

### Title Block (Stacked Script + Impact Headline)

```html
<div style="background-color: var(--color-green); padding: 80px 60px; text-align: center; position: relative; overflow: hidden;">
  <!-- Film grain overlay -->
  <div style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(237,181,167,0.08) 0.5px, transparent 1px); background-size: 3px 3px; pointer-events: none;"></div>
  <div style="position: relative; z-index: 1;">
    <h1 style="margin: 0; line-height: 0.85;">
      <span style="display: block; font-family: var(--font-script); font-size: 140px; font-weight: 400; color: var(--color-pink); line-height: 0.95; letter-spacing: -2px; transform: rotate(-3deg); margin: 0 0 -30px;">Movie</span>
      <span style="display: block; font-family: var(--font-impact); font-size: 240px; font-weight: 700; color: var(--color-pink); line-height: 0.85; letter-spacing: -4px; text-transform: uppercase;">NIGHT</span>
    </h1>
  </div>
</div>
```

### Event Metadata Strip (Signature Component)

```html
<div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 0 60px; gap: 40px;">
  <!-- Left metadata block -->
  <div style="text-align: left;">
    <p style="font-family: var(--font-impact); font-size: 18px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 16px;">@reallygreatsite</p>
    <p style="font-family: var(--font-impact); font-size: 32px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); line-height: 1.10; margin: 0;">08/09<br>10 PM</p>
  </div>
  <!-- Right metadata block -->
  <div style="text-align: right;">
    <p style="font-family: var(--font-impact); font-size: 18px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 16px;">@reallygreatsite</p>
    <p style="font-family: var(--font-impact); font-size: 32px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); line-height: 1.10; margin: 0;">FREE<br>ENTRY</p>
  </div>
</div>
```

### Duotone Halftone Photograph

```html
<!-- Approach A: Pre-processed duotone image (RECOMMENDED) -->
<div style="position: relative; overflow: hidden; background-color: var(--color-green);">
  <img src="path/to/duotone-image.png" alt="" style="display: block; width: 100%; height: auto; mix-blend-mode: screen; opacity: 0.95;">
  <!-- Halftone dot overlay -->
  <div style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(237,181,167,0.12) 1px, transparent 1.5px); background-size: 4px 4px; pointer-events: none;"></div>
</div>

<!-- Approach B: CSS-only duotone from a grayscale source image -->
<div style="position: relative; overflow: hidden; background-color: var(--color-green);">
  <img src="path/to/bw-photo.jpg" alt="" style="display: block; width: 100%; height: auto; filter: grayscale(100%) contrast(120%) brightness(0.9); mix-blend-mode: screen;">
  <!-- Pink tint layer -->
  <div style="position: absolute; inset: 0; background-color: #EDB5A7; mix-blend-mode: multiply; pointer-events: none;"></div>
  <!-- Halftone dot overlay -->
  <div style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(45,77,58,0.3) 1px, transparent 1.5px); background-size: 4px 4px; pointer-events: none;"></div>
</div>
```

### Numbered Item (Poster Bullet)

```html
<div style="padding: 32px 0; display: flex; align-items: flex-start; gap: 32px;">
  <span style="font-family: var(--font-impact); font-size: 72px; font-weight: 700; color: var(--color-pink); line-height: 0.85; letter-spacing: -2px;">01</span>
  <div style="flex: 1; padding-top: 12px;">
    <p style="font-family: var(--font-impact); font-size: 32px; font-weight: 700; letter-spacing: -0.5px; text-transform: uppercase; color: var(--color-pink); line-height: 1.10; margin: 0 0 8px;">FIND YOUR SEAT</p>
    <p style="font-family: var(--font-impact); font-size: 16px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(237,181,167,0.65); line-height: 1.40; margin: 0;">Doors open thirty minutes before showtime.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 24px; border-top: 2px solid rgba(237,181,167,0.65); border-bottom: 2px solid rgba(237,181,167,0.65);">
  <p style="font-family: var(--font-impact); font-size: 180px; font-weight: 700; line-height: 0.85; letter-spacing: -4px; color: var(--color-pink); margin: 0 0 12px;">1957</p>
  <p style="font-family: var(--font-impact); font-size: 18px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-pink); margin: 0;">YEAR IT ALL BEGAN</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1px 1fr; gap: 0; align-items: stretch;">
  <div style="padding: 40px 32px; text-align: center;">
    <p style="font-family: var(--font-impact); font-size: 14px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(237,181,167,0.65); margin: 0 0 16px;">BEFORE</p>
    <p style="font-family: var(--font-impact); font-size: 56px; font-weight: 700; line-height: 0.95; letter-spacing: -1px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 12px;">SILENT</p>
    <p style="font-family: var(--font-impact); font-size: 16px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(237,181,167,0.65); line-height: 1.40; margin: 0;">Piano accompaniment only.</p>
  </div>
  <div style="background: rgba(237,181,167,0.35);"></div>
  <div style="padding: 40px 32px; text-align: center;">
    <p style="font-family: var(--font-impact); font-size: 14px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(237,181,167,0.65); margin: 0 0 16px;">AFTER</p>
    <p style="font-family: var(--font-impact); font-size: 56px; font-weight: 700; line-height: 0.95; letter-spacing: -1px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 12px;">TALKIES</p>
    <p style="font-family: var(--font-impact); font-size: 16px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(237,181,167,0.65); line-height: 1.40; margin: 0;">Sound changed everything.</p>
  </div>
</div>
```

### List Item

```html
<div style="padding: 20px 0; border-bottom: 1px solid rgba(237,181,167,0.35); display: flex; align-items: baseline; gap: 24px;">
  <span style="font-family: var(--font-impact); font-size: 18px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(237,181,167,0.65); min-width: 40px;">01</span>
  <p style="flex: 1; font-family: var(--font-impact); font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-transform: uppercase; color: var(--color-pink); line-height: 1.10; margin: 0;">DOUBLE FEATURE</p>
  <span style="font-family: var(--font-impact); font-size: 14px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(237,181,167,0.65);">08/09</span>
</div>
```

### Quote Block

```html
<div style="padding: 60px 40px; text-align: center; border-top: 2px solid rgba(237,181,167,0.65); border-bottom: 2px solid rgba(237,181,167,0.65);">
  <p style="font-family: var(--font-script); font-size: 64px; font-weight: 400; line-height: 1.05; letter-spacing: -1px; color: var(--color-pink); margin: 0 0 32px; transform: rotate(-1deg);">"the show<br>must go on"</p>
  <div style="display: inline-flex; align-items: center; gap: 16px;">
    <div style="width: 40px; height: 2px; background: var(--color-pink);"></div>
    <p style="font-family: var(--font-impact); font-size: 14px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-pink); margin: 0;">CURTAIN CALL, 1952</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 80px 40px; position: relative;">
  <!-- Film grain overlay -->
  <div style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(237,181,167,0.08) 0.5px, transparent 1px); background-size: 3px 3px; pointer-events: none;"></div>
  <div style="position: relative; z-index: 1;">
    <p style="font-family: var(--font-impact); font-size: 18px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: rgba(237,181,167,0.65); margin: 0 0 24px;">ONE NIGHT ONLY</p>
    <h2 style="margin: 0 0 48px; line-height: 0.85;">
      <span style="display: block; font-family: var(--font-script); font-size: 96px; font-weight: 400; color: var(--color-pink); line-height: 0.95; letter-spacing: -1.5px; transform: rotate(-3deg); margin: 0 0 -20px;">Get Your</span>
      <span style="display: block; font-family: var(--font-impact); font-size: 160px; font-weight: 700; color: var(--color-pink); line-height: 0.85; letter-spacing: -3px; text-transform: uppercase;">TICKETS</span>
    </h2>
    <a style="display: inline-block; border: 2px solid var(--color-pink); color: var(--color-pink); font-family: var(--font-impact); font-size: 24px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; text-decoration: none; padding: 20px 48px;">RSVP NOW</a>
  </div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between stacked headline words when they overlap.
- **8px**: Tight gap -- between metadata lines, between icon and label.
- **12px**: Small gap -- between stat number and its caption.
- **16px**: Base gap -- between metadata rows, between body paragraphs.
- **24px**: Medium gap -- between tag and adjacent content.
- **32px**: Standard section internal -- between heading and first content block.
- **40px**: Content gap -- between list items, between major elements.
- **60px**: Large gap -- side padding for most formats.
- **80px**: Section padding -- top/bottom padding for title and CTA blocks.
- **120px**: Hero padding -- top/bottom for Story format hero sections.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| **Story (1080x1920)** | **60px left/right, 120px top/bottom** | **960px** |

### Alignment & Grid
- **Primary alignment**: Center-aligned for title blocks and CTA blocks. Left-aligned for list content. The reference's signature layout is a centered headline stack with metadata pushed to both margins.
- **Grid**: The poster grid is effectively a two-column metadata frame (left + right) wrapping a central photo + headline column. Carousels use a single-column stack.
- **Headline stacking**: Stacked script + impact headlines are always center-aligned with slight overlap (-20px to -40px negative margin between the two words).
- **Metadata placement**: Event metadata always sits in the left and right margins beside the photograph, never over it. On narrower formats, metadata collapses into a centered single-column strip.
- **Photograph placement**: Duotone photo occupies the lower 50-66% of the canvas, bleeding to the left and right edges. Never let the photograph cross into the headline zone.
- **Vertical rhythm**: 48px between top-level sections, 32px between components within a section, 16px between metadata lines.
- **Content gravity**: Everything reads top-to-bottom with the photograph anchoring the bottom and the headline anchoring the top -- a printed-poster hierarchy.
- **Halftone texture**: Applied as a full-canvas overlay at 6-10% opacity. Never applied to type itself.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#2D4D3A` | Page canvas, base layer |
| Rule (Level 1) | `1px solid rgba(237, 181, 167, 0.35)` | Standard divider rule between list items |
| Frame (Level 2) | `2px solid rgba(237, 181, 167, 0.65)` top + bottom | Emphasized section frame for stats and quotes |
| Outline (Level 3) | `2px solid #EDB5A7` full border | CTA buttons and rare emphasized containers |
| Photograph (Level 4) | Duotone image with optional `inset 0 -40px 80px rgba(31, 53, 40, 0.5)` vignette | Full-bleed photograph with soft ink-bleed edge |

### Border Treatments
- **Standard rule**: `1px solid rgba(237, 181, 167, 0.35)` with `border-radius: 0`. Used for list item dividers and internal section separators. Thin, pink, always sharp-cornered.
- **Featured frame**: `2px solid rgba(237, 181, 167, 0.65)` top and bottom only. Used to emphasize stat blocks and quote blocks. Never a full border, only top+bottom rules.
- **CTA outline**: `2px solid #EDB5A7` on all four sides, sharp corners (`border-radius: 0`). The only component that uses a full four-sided border.
- **Divider hairline**: `1px solid rgba(237, 181, 167, 0.25)` -- the faintest visible rule, used to separate metadata lines within a block.

### Surface Hierarchy
On a deep green canvas, depth comes from **type weight**, **rule thickness**, and **photograph placement** -- never from shadows or background tints:
1. **Background** (`#2D4D3A`) -- the single canvas color. Never tinted or gradient.
2. **Type** (`#EDB5A7`) -- all content sits one level above the canvas via pink ink.
3. **Rules** (`rgba(237, 181, 167, 0.35)` to `#EDB5A7`) -- horizontal lines define regions without adding fills.
4. **Photograph** -- the duotone image is the highest-impact element, occupying the largest surface area and carrying the most visual weight.
5. **Impact headline** -- set at 200px+, it competes with the photograph for primacy and wins by scale alone.

## 7. Do's and Don'ts

### Do
- Use forest green (`#2D4D3A`) as the **only** background color. Never tint it, never gradient it, never swap it for black.
- Use dusty pink (`#EDB5A7`) as the **sole** accent for every mark on the canvas -- type, rules, photograph tint, halftone dots.
- Stack headlines in two words: script on top (Alfa Slab One), impact below (Oswald ALL CAPS). The stacking is the style.
- Set the impact word at 200-280px with letter-spacing -4px so it runs nearly edge-to-edge.
- Rotate the script word -3deg for hand-set-on-press energy. Never rotate anything else.
- Use duotone halftone photography with visible dot texture -- it is the heart of the aesthetic.
- Push event metadata into the left and right margins beside the photograph to create a symmetric ticket-stub frame.
- Use ALL CAPS for Oswald everywhere -- section headings, metadata, list items, stats, CTAs.
- Set metadata at letter-spacing +2px to +2.5px for that etched-plate feel.
- Apply a faint film-grain overlay (6-8% opacity) across the entire canvas for paper-stock texture.
- Use sharp corners (`border-radius: 0`) on every container and button. This is a letterpress aesthetic, not a modern app.
- Keep body text extremely minimal -- this style is display-driven, not reading-driven.

### Don't
- Don't use pure black (`#000000`) anywhere. The darkest tone is `#1F3528`.
- Don't use pure white (`#ffffff`) anywhere. The lightest tone is pink highlight `#F5CFC6`.
- Don't introduce a third color. Two colors plus their tonal variants is the entire palette.
- Don't use drop shadows, glows, or gradients. This style is flat two-color print reproduction.
- Don't use rounded corners on any element -- containers, buttons, tags, or photographs.
- Don't use mixed case for Oswald. It is ALL CAPS everywhere except the rare body overflow.
- Don't italicize anything. The script font provides all the soft energy; no italic variants exist in this style.
- Don't place photographs in the headline zone -- the top third is for type only.
- Don't use thin type weights (300-400) for the impact word. Oswald runs at 700 minimum.
- Don't track the display impact word loose. It must be -4px letter-spacing to feel like a poster.
- Don't use icons, emoji, or illustrations. The only imagery is duotone halftone photography.
- Don't center-align list items or body text -- only headlines and CTAs are centered.
- Don't add secondary background tints or card fills -- cards are defined by rules alone.
- Don't skip the halftone / grain overlay -- a perfectly smooth green canvas reads as digital, not printed.

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
- **Typography scale**: Display Script 120px. Display Impact 200px. Section Heading 64px. Metadata Large 28px. Body 18px.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Stacked script + impact headline centered. Duotone photograph below (lower 50% of canvas). Metadata strips in left/right margins beside the photo.
- **Content slides**: Single-column stack. Section heading in Oswald ALL CAPS at 64px. List items or numbered sequence below with sharp pink rule dividers.
- **Card slides**: Quote blocks and stat blocks framed by 2px pink rules top and bottom.
- **Swipe indicator**: Small pink squares at bottom center, 6px x 6px, active dot in full pink, inactive in 35% pink. Never circles -- this style rejects roundness.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Impact at 240px for the title. Numbered items at 72px.
- **Padding**: 60px left/right. 80px top/bottom.
- **Section spacing**: 64px vertical gap between sections. Use 2px pink rules between major sections.
- **Vertical rhythm**: Alternate between full-bleed duotone photographs and pure-type sections. Use numbered list items (01, 02, 03) for sequential content.
- **Footer**: Small metadata in Oswald at 14px, letter-spacing +2.5px, 65% pink. Above the footer, a 1px hairline rule.

### Slides (1920x1080px)
- **Typography scale up**: Display Script 180px. Display Impact 320px. Section Heading 96px. Metadata Large 40px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Title/CTA slides are centered with the stacked script + impact headline. Content slides use a left-aligned two-column layout: type on the left, duotone photograph on the right (or vice versa).
- **Title slides**: Script word + impact word stacked center. Metadata strips on left and right margins. Duotone photograph bleeds from one edge.
- **Content slides**: Section heading in Oswald ALL CAPS at 96px, left-aligned. Numbered list below. Optional duotone photograph in the right third.
- **CTA slides**: Stacked headline center. 2px pink-outlined button below.

### Poster (1080x1350px)
- **Typography**: Display Script 140px. Display Impact 240px. Metadata Large 32px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: **This is the reference layout.** Top third: stacked script + impact headline. Middle to bottom: full-bleed duotone photograph. Left and right margins beside the photograph: event metadata strips with handle at top, details below.
- **Vertical flow**: Headline anchors the top, photograph anchors the bottom, metadata frames the middle.
- **CTA placement**: Integrated into the photograph margins as a metadata block ("FREE ENTRY", "RSVP NOW"). No separate button -- the metadata itself is the call to action.

### Story (1080x1920px)
- **Typography scale up**: Display Script 180px. Display Impact 320px (~33% larger than carousel). Section Heading 88px. Metadata Large 40px.
- **Padding**: **120px top/bottom** + **60px left/right**. The extra vertical padding is critical -- Story format needs breathing room above and below to feel composed rather than cramped.
- **Composition**: Full vertical hierarchy. Top 30%: stacked script + impact headline centered with 120px top padding. Middle 50-60%: full-bleed duotone photograph with metadata strips in left/right margins at the photo's midline. Bottom 15-20%: CTA outlined button centered with 120px bottom padding.
- **Safe zones**: Keep all critical content within 60px of the left/right edges and 120px of the top/bottom edges to avoid Instagram/TikTok UI overlap (profile, actions, caption).
- **Hero emphasis**: Hero type in Story format is **~30% larger** than carousel equivalent -- Display Impact at 320px vs 200px -- because the vertical canvas demands scale to feel anchored.
- **Motion hint**: Story posts support optional subtle entrance animation -- a 200ms fade on the script word, 300ms delayed on the impact word -- but the base design must read perfectly as a static frame.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Forest Green | `#2D4D3A` | Primary background, the only canvas color |
| Dusty Pink | `#EDB5A7` | Primary text, all accents, photo tint |
| Deep Green | `#1F3528` | Photo shadows, duotone deep end |
| Pink Highlight | `#F5CFC6` | Photo highlights, rare hover states |
| Pink Shadow | `#D9948A` | Deep pink variant, rare emphasis |
| Pink Text Muted | `rgba(237, 181, 167, 0.65)` | Secondary text, metadata |
| Pink Text Faint | `rgba(237, 181, 167, 0.35)` | Borders, divider rules |
| Green Inset | `#264030` | Recessed panels (rare) |

### Font Declarations

```css
/* Script Display (emotional word only) */
font-family: 'Alfa Slab One', Georgia, 'Times New Roman', serif;

/* Impact Display + Metadata (everything else) */
font-family: 'Oswald', Impact, 'Arial Narrow', sans-serif;

/* Body (rare overflow only) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Oswald:wght@400;500;600;700&family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-green: #2D4D3A;
  --color-pink: #EDB5A7;
  --color-green-deep: #1F3528;

  /* Colors -- Accent */
  --color-pink-highlight: #F5CFC6;
  --color-pink-shadow: #D9948A;

  /* Colors -- Neutral Scale */
  --color-green-canvas: #2D4D3A;
  --color-green-inset: #264030;
  --color-pink-text-primary: #EDB5A7;
  --color-pink-text-muted: rgba(237, 181, 167, 0.65);
  --color-pink-text-faint: rgba(237, 181, 167, 0.35);

  /* Colors -- Surfaces */
  --color-surface-primary: #2D4D3A;
  --color-surface-inset: #264030;

  /* Colors -- Borders */
  --color-border-default: rgba(237, 181, 167, 0.35);
  --color-border-strong: rgba(237, 181, 167, 0.65);
  --color-border-accent: #EDB5A7;
  --color-divider: rgba(237, 181, 167, 0.25);

  /* Colors -- Shadows (rarely used) */
  --shadow-none: transparent;
  --shadow-ink: rgba(31, 53, 40, 0.5);
  --grain-overlay: rgba(237, 181, 167, 0.06);

  /* Typography -- Families */
  --font-script: 'Alfa Slab One', Georgia, 'Times New Roman', serif;
  --font-impact: 'Oswald', Impact, 'Arial Narrow', sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-script: 140px;
  --text-display-impact: 240px;
  --text-section-heading: 72px;
  --text-sub-heading: 48px;
  --text-metadata-large: 32px;
  --text-metadata: 18px;
  --text-metadata-small: 14px;
  --text-body-large: 22px;
  --text-body: 18px;
  --text-big-number: 180px;
  --text-cta: 24px;

  /* Typography -- Weights */
  --weight-script: 400;
  --weight-impact: 700;
  --weight-heading: 700;
  --weight-metadata: 600;
  --weight-body: 500;

  /* Typography -- Line Heights */
  --leading-display-script: 0.95;
  --leading-display-impact: 0.85;
  --leading-heading: 0.95;
  --leading-metadata: 1.10;
  --leading-body: 1.55;

  /* Typography -- Letter Spacing */
  --tracking-display-script: -2px;
  --tracking-display-impact: -4px;
  --tracking-heading: -1px;
  --tracking-metadata: 2px;
  --tracking-metadata-tight: 2.5px;
  --tracking-cta: 3px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-large: 32px;
  --space-gap: 40px;
  --space-section: 48px;
  --space-outer: 60px;
  --space-max: 80px;
  --space-hero: 120px;

  /* Borders */
  --radius-none: 0;
  --border-rule: 1px solid rgba(237, 181, 167, 0.35);
  --border-frame: 2px solid rgba(237, 181, 167, 0.65);
  --border-outline: 2px solid #EDB5A7;
  --border-divider: 1px solid rgba(237, 181, 167, 0.25);

  /* Texture */
  --halftone-dots: radial-gradient(circle, rgba(237, 181, 167, 0.12) 1px, transparent 1.5px);
  --halftone-size: 4px 4px;
  --film-grain: radial-gradient(circle, rgba(237, 181, 167, 0.08) 0.5px, transparent 1px);
  --film-grain-size: 3px 3px;

  /* Transforms */
  --rotate-script: rotate(-3deg);
  --rotate-script-subtle: rotate(-1deg);
}
```

### System Font Fallbacks
- **Script (if Alfa Slab One fails to load):** `Georgia, 'Times New Roman', serif` -- a heavy serif that approximates the chunky display feel.
- **Impact (if Oswald fails to load):** `Impact, 'Arial Narrow', 'Helvetica Condensed', sans-serif` -- the closest system-level condensed heavy sans.
- **Body (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`.

### Duotone Photograph Recipe

**Recommended (Pre-processed):** Process the source image in Photoshop or Figma as a true duotone using `#2D4D3A` (shadows) and `#EDB5A7` (highlights), export as PNG with transparent background, then drop it in as a standard `<img>` element. This gives the cleanest print-quality result.

**CSS-only fallback:** Stack the following on a grayscale source image:
1. Container with `background-color: #2D4D3A`
2. `<img>` with `filter: grayscale(100%) contrast(120%) brightness(0.9); mix-blend-mode: screen`
3. Pink tint layer (`background: #EDB5A7; mix-blend-mode: multiply`)
4. Halftone dot overlay (`background-image: radial-gradient(circle, rgba(45,77,58,0.3) 1px, transparent 1.5px); background-size: 4px 4px`)

The CSS-only approach is approximate -- true duotone requires per-pixel remapping that only image editors can deliver. When fidelity matters, pre-process.
