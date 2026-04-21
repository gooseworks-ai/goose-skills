# Design Style: Iridescent Y2K

## 1. Visual Theme & Atmosphere

Iridescent Y2K is a brutalist-meets-futurist poster language where utilitarian Swiss grids collide with a single dreamy chrome artifact. The canvas is a warm stone beige (`#ECE8DD`) — not white, not gray, but the dusty tone of recycled paper or a matte museum wall — and everything on it is set in rigid, rectangular, near-black architecture. Into that disciplined frame drops one thing: a liquid-metal iridescent blob smeared with hot pink, cyan, lavender, and pearl highlights. That single organic object carries the entire emotional weight of the composition. Everything else — the headline, the bordered metadata table, the footer — is deliberately severe, almost wire-frame, so that the blob reads as both product hero and light source.

The typography is heavy, condensed geometric sans in near-black (`#111111`) — Archivo Black at display size, set in short stacked lines, left-aligned, with slightly negative tracking. The headline feels like a hot-stamped metal plate: oversized, structural, unapologetic. Supporting metadata runs in Space Mono at medium weight inside a thin-ruled 3-cell table that looks photocopied from a club flyer. The pairing mirrors the compositional tension: the chunky display face is the grid, the mono is the fine print, and the iridescent blob is the only soft, analog thing in the frame. This is the visual dialect of Apple's Vision Pro reveal, Nike Y2K lookbooks, and the cover of a Dover Street Market zine — pearlescent chrome inside brutalist scaffolding.

The accent system is the iridescence itself. There is no secondary color to manage, no tag pills, no swatches — the only chromatic event on the page is the gradient blob, and its job is to be the surprise. Everywhere else, the design commits to near-black ink on stone beige with thin 1–2px rules. That restraint is what makes the blob feel expensive instead of decorative: it reads as a captured 3D render that happens to be sitting on a piece of paper, like a photographic negative of a dream pinned to a bulletin board.

**Key Characteristics:**
- Warm stone beige background (`#ECE8DD`) — dusty, slightly toasted, never white
- Near-black ink (`#111111`) for all text, rules, and table borders — commanding but softer than pure black
- Archivo Black for display headlines — heavy, condensed geometric sans, stacked 1–3 words per line, left-aligned, `-2px` tracking
- Space Mono medium (500) for all metadata, labels, and footer text — technical, left-aligned or grid-aligned
- Iridescent chrome blob as the one hero visual — conic/radial gradient of hot pink `#FF6EC7`, cyan `#8DEBFF`, lavender `#C79DFF`, pale pink `#FFE8F0`, and pearl `#F6F3FA`, masked into an organic `border-radius: 50% 40% 60% 30% / 40% 50% 30% 60%` morph shape with `filter: blur(0.5px)` for liquid softness
- Bordered 3-cell metadata table at the bottom — thin 1.5px near-black rules forming rigid rectangular cells, no radius, no fill
- Small tracked uppercase footer text at 11–12px, `letter-spacing: 1.5px`, sitting flush to bottom edge
- Brutalist grid scaffolding: every element is either a heavy type block, a thin-ruled box, or the iridescent blob — nothing else competes
- Sharp 0px corners everywhere except the blob — no rounded containers, no soft shadows, no pills
- One flavor of iridescence only — never flat pink or flat cyan; the point is the gradient shift, not the hue
- Left-aligned primary axis, with the 3-cell metadata table spanning full content width at the bottom
- Zero decorative texture, zero photography, zero illustrations — the blob is the entire visual economy

## 2. Color Palette & Roles

### Primary
- **Stone Beige** (`#ECE8DD`): Primary background. A warm, dusty off-white with a faint yellow-gray undertone that reads as recycled card stock, not digital white. This is the canvas and nothing else uses it.
- **Near-Black Ink** (`#111111`): Primary text, rule lines, table borders, headline fill. Softer than pure black, closer to a dark print ink.
- **Iridescent Gradient** (multi-stop): Primary accent, applied only to the hero blob. See the five-stop gradient below.

### Iridescent Gradient Stops
- **Hot Pink** (`#FF6EC7`): Warm iridescence peak. Used as the dominant magenta-pink reflection in the blob.
- **Cyan Shimmer** (`#8DEBFF`): Cool iridescence peak. The opposing chrome highlight, especially in recessed curves.
- **Lavender Midtone** (`#C79DFF`): Purple bridge between the pink and cyan stops. Gives the blob its dreamy dusk quality.
- **Pearl Pink** (`#FFE8F0`): Near-white highlight rim. Sits at the topmost curves of the blob for wet-plastic sheen.
- **Pearl Lilac** (`#F6F3FA`): Soft neutral pearl. Used as the lowest-contrast stop to blend the gradient into the stone background.

### Neutral Scale
- **Ink Secondary** (`#2B2B2B`): Slightly softened near-black. Used for very small metadata where full near-black would feel too heavy.
- **Ink Tertiary** (`#555555`): Quieter metadata, footer-adjacent text.
- **Stone Darker** (`#D8D2C3`): Subtle inset for a recessed card surface. Used rarely — reserved for secondary containers.
- **Stone Lighter** (`#F2EEE4`): Subtle inset for a lifted surface. Used rarely.
- **Rule Gray** (`rgba(17,17,17,0.85)`): Primary border rule — a softened near-black that reads as crisp at 1.5px without feeling computed.

### Surface & Borders
- **Surface Primary** (`#ECE8DD`): Always the page background — containers do not have their own fill.
- **Surface Inset** (`#E4DFD1`): Rare recessed surface, used only inside a metadata table cell that needs emphasis.
- **Border Default** (`1.5px solid #111111`): The primary rule. Every table cell, every metadata container, every hairline divider uses this exact weight. The thickness is deliberate — thicker than a web default rule, thinner than a headline.
- **Border Strong** (`2px solid #111111`): For the outer frame of the metadata table and section dividers. Slightly chunkier to sit alongside the heavy headline without feeling fragile.
- **Divider Rule** (`1px solid rgba(17,17,17,0.4)`): Faint internal dividers when needed inside long cells.

### Shadow Colors
- **Blob Glow** (`rgba(255,110,199,0.25)`): The only shadow in the system. A faint pink-tinted ambient halo placed under the iridescent blob to anchor it to the canvas without creating a hard drop shadow.
- **Blob Glow Deep** (`rgba(199,157,255,0.20)`): Optional lavender-tinted under-halo stacked below the pink halo for a slightly thicker atmospheric bloom.
- **Shadow None** (`none`): The explicit rule for everything else. Headlines, tables, and text cast no shadows.

### Texture
- **No Texture**: This style uses no patterns, no dot grids, no noise, no paper grain. The warmth of the stone beige plus the organic blob provides all the tactility the composition needs.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

- **Display**: `'Archivo Black', 'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- **Body / Metadata**: `'Space Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Archivo Black | 140px | 400 (native heavy) | 0.88 | -2px | The poster headline. Stacked 1–3 words per line, left-aligned. Archivo Black is only available at a single heavy weight. |
| Display Medium | Archivo Black | 104px | 400 | 0.90 | -1.5px | Secondary title for slides and carousel hero cards. |
| Display Small | Archivo Black | 72px | 400 | 0.92 | -1px | Section label on content slides. |
| Subtitle | Space Mono | 18px | 500 | 1.45 | 0.4px | Support line under the display headline. Sentence case. |
| Body | Space Mono | 14px | 500 | 1.55 | 0.3px | Standard body text in metadata cells and descriptions. |
| Body Bold | Space Mono | 14px | 700 | 1.55 | 0.3px | Emphasis within mono body text. |
| Metadata Label | Space Mono | 13px | 500 | 1.35 | 0.6px | Inside bordered table cells. Often uppercase. |
| Metadata Value | Space Mono | 16px | 700 | 1.30 | 0.2px | Primary value in a metadata cell (time, date, status). |
| Big Numbers | Archivo Black | 96px | 400 | 0.90 | -1.5px | Stats, countdowns, key metrics. |
| Footer Text | Space Mono | 12px | 500 | 1.40 | 1.5px (uppercase) | Bottom-edge attribution, handles, venue. Always uppercase. |
| CTA Text | Space Mono | 14px | 700 | 1.00 | 1.2px (uppercase) | Button text. Always uppercase, wide tracking. |

### Principles
- **Only one display face**: Archivo Black is the single display voice. Do not introduce a second display font under any circumstances. Its weight and rigidity are the backbone of the style.
- **Mono everywhere else**: Every non-headline string — metadata, body, labels, footer — is set in Space Mono. The uniform mono voice across every supporting element is what makes the headline feel monumental by contrast.
- **Stack short lines, don't wrap**: Headlines should be broken into 1–3 word lines with an explicit `<br>`. Lines should be roughly equal length for a solid rectangular type mass. Never run a headline as a single long line.
- **Negative tracking on display**: Apply `letter-spacing: -2px` at 140px and scale proportionally (`-1.5px` at 104px, `-1px` at 72px). The chunky geometry needs tight packing to feel carved.
- **Tight display leading**: `line-height: 0.88–0.92` for all display sizes. The letters nearly touch the line above — this is essential for the poster mass.
- **Uppercase footers, mixed-case headlines**: Headlines are mixed case or all caps depending on the word (acronyms like "HOLO" read naturally in caps). Footers, CTAs, and table labels are always uppercase with 0.6–1.5px positive tracking for the utilitarian label feel.
- **No italics, ever**: Neither Archivo Black nor the design language supports italic emphasis. Emphasis is achieved through the iridescent blob, not type styling.

## 4. Component Patterns

### Brutalist Headline Block

```html
<div style="display: block; text-align: left; padding: 0;">
  <h1 style="font-family: var(--font-display); font-size: 140px; font-weight: 400; line-height: 0.88; letter-spacing: -2px; color: var(--color-ink); margin: 0; text-transform: uppercase;">
    HOLO<br>PARTY
  </h1>
  <p style="font-family: var(--font-mono); font-size: 18px; font-weight: 500; line-height: 1.45; letter-spacing: 0.4px; color: var(--color-ink-secondary); margin: 24px 0 0; max-width: 560px;">
    An iridescent night of chrome sound, liquid light, and free drinks until the blob melts.
  </p>
</div>
```

### Iridescent Blob Hero

The hero visual of the entire style. Approximates a 3D chrome render in pure CSS using a layered conic-gradient for the iridescent shift and a radial-gradient for the pearl highlight, masked into an organic morphing shape.

```html
<div style="position: relative; width: 560px; height: 560px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
  <!-- Ambient iridescent glow under the blob -->
  <div style="
    position: absolute;
    inset: 40px;
    background: radial-gradient(circle at 50% 55%, rgba(255,110,199,0.25) 0%, rgba(199,157,255,0.20) 35%, rgba(141,235,255,0.10) 60%, transparent 80%);
    filter: blur(40px);
    pointer-events: none;
  "></div>

  <!-- The blob itself -->
  <div style="
    position: relative;
    width: 460px;
    height: 460px;
    border-radius: 52% 48% 58% 42% / 46% 54% 46% 54%;
    background:
      radial-gradient(circle at 35% 30%, #FFE8F0 0%, rgba(255,232,240,0) 28%),
      radial-gradient(circle at 70% 75%, #F6F3FA 0%, rgba(246,243,250,0) 32%),
      conic-gradient(from 210deg at 50% 50%,
        #C79DFF 0%,
        #FF6EC7 18%,
        #FFE8F0 32%,
        #8DEBFF 52%,
        #C79DFF 70%,
        #FF6EC7 85%,
        #C79DFF 100%);
    box-shadow:
      inset 40px 60px 80px rgba(255,232,240,0.55),
      inset -30px -50px 70px rgba(141,235,255,0.35),
      inset 0 0 120px rgba(199,157,255,0.25);
    filter: blur(0.5px) saturate(1.1);
    animation: blobMorph 14s ease-in-out infinite;
  "></div>
</div>

<style>
  @keyframes blobMorph {
    0%, 100% { border-radius: 52% 48% 58% 42% / 46% 54% 46% 54%; }
    33%      { border-radius: 44% 56% 50% 50% / 58% 42% 58% 42%; }
    66%      { border-radius: 60% 40% 44% 56% / 50% 60% 40% 50%; }
  }
</style>
```

### Bordered Metadata Table (3-cell)

The rigid counterweight to the organic blob. Always sits at the bottom of the composition, spanning full content width. Top row holds two larger labels, bottom row holds three equal cells.

```html
<div style="width: 100%; border: 2px solid var(--color-ink); background: var(--color-bg);">
  <!-- Top row: 2 cells -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1.5px solid var(--color-ink);">
    <div style="padding: 20px 24px; border-right: 1.5px solid var(--color-ink);">
      <p style="font-family: var(--font-mono); font-size: 28px; font-weight: 700; line-height: 1.10; letter-spacing: -0.2px; color: var(--color-ink); margin: 0; text-transform: uppercase;">Free<br>Drinks</p>
    </div>
    <div style="padding: 20px 24px; text-align: right;">
      <p style="font-family: var(--font-mono); font-size: 16px; font-weight: 500; line-height: 1.30; letter-spacing: 0.3px; color: var(--color-ink-secondary); margin: 0 0 4px; text-transform: uppercase;">20 June 2030</p>
      <p style="font-family: var(--font-mono); font-size: 26px; font-weight: 700; line-height: 1.10; letter-spacing: 0.2px; color: var(--color-ink); margin: 0;">5:00 PM</p>
    </div>
  </div>
  <!-- Bottom row: 3 cells -->
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr;">
    <div style="padding: 18px 20px; border-right: 1.5px solid var(--color-ink); text-align: center;">
      <p style="font-family: var(--font-mono); font-size: 13px; font-weight: 500; line-height: 1.35; letter-spacing: 0.6px; color: var(--color-ink); margin: 0; text-transform: uppercase;">DJ Drew Feig</p>
    </div>
    <div style="padding: 18px 20px; border-right: 1.5px solid var(--color-ink); text-align: center;">
      <p style="font-family: var(--font-mono); font-size: 13px; font-weight: 500; line-height: 1.35; letter-spacing: 0.6px; color: var(--color-ink); margin: 0; text-transform: uppercase;">Live Music</p>
    </div>
    <div style="padding: 18px 20px; text-align: center;">
      <p style="font-family: var(--font-mono); font-size: 13px; font-weight: 500; line-height: 1.35; letter-spacing: 0.6px; color: var(--color-ink); margin: 0; text-transform: uppercase;">Free Entry</p>
    </div>
  </div>
</div>
```

### Numbered Item

```html
<div style="display: grid; grid-template-columns: 80px 1fr; gap: 24px; padding: 24px 0; border-top: 1.5px solid var(--color-ink);">
  <div style="font-family: var(--font-display); font-size: 48px; font-weight: 400; line-height: 1.00; letter-spacing: -1px; color: var(--color-ink);">01</div>
  <div>
    <p style="font-family: var(--font-mono); font-size: 14px; font-weight: 700; line-height: 1.45; letter-spacing: 0.3px; color: var(--color-ink); margin: 0 0 6px; text-transform: uppercase;">Arrive Early</p>
    <p style="font-family: var(--font-mono); font-size: 14px; font-weight: 500; line-height: 1.55; letter-spacing: 0.3px; color: var(--color-ink-secondary); margin: 0;">Doors at 5:00 PM. The iridescent room fills fast — line forms around the corner on Rimberio.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="padding: 32px 24px; border: 2px solid var(--color-ink); text-align: left;">
  <p style="font-family: var(--font-display); font-size: 96px; font-weight: 400; line-height: 0.90; letter-spacing: -1.5px; color: var(--color-ink); margin: 0;">4.2K</p>
  <p style="font-family: var(--font-mono); font-size: 13px; font-weight: 500; line-height: 1.35; letter-spacing: 0.6px; color: var(--color-ink-secondary); margin: 12px 0 0; text-transform: uppercase;">RSVPs Since Drop</p>
</div>
```

### Comparison Grid (2-column bordered)

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; border: 2px solid var(--color-ink);">
  <div style="padding: 32px 28px; border-right: 1.5px solid var(--color-ink);">
    <p style="font-family: var(--font-mono); font-size: 13px; font-weight: 500; letter-spacing: 0.6px; color: var(--color-ink-secondary); margin: 0 0 16px; text-transform: uppercase;">Analog Night</p>
    <h3 style="font-family: var(--font-display); font-size: 40px; font-weight: 400; line-height: 0.92; letter-spacing: -0.8px; color: var(--color-ink); margin: 0 0 16px; text-transform: uppercase;">Dim Room<br>Warm Beer</h3>
    <p style="font-family: var(--font-mono); font-size: 14px; font-weight: 500; line-height: 1.55; color: var(--color-ink-secondary); margin: 0;">The usual weekend. Nothing shimmers, nothing melts, nothing glows.</p>
  </div>
  <div style="padding: 32px 28px;">
    <p style="font-family: var(--font-mono); font-size: 13px; font-weight: 500; letter-spacing: 0.6px; color: var(--color-ink-secondary); margin: 0 0 16px; text-transform: uppercase;">Holo Party</p>
    <h3 style="font-family: var(--font-display); font-size: 40px; font-weight: 400; line-height: 0.92; letter-spacing: -0.8px; color: var(--color-ink); margin: 0 0 16px; text-transform: uppercase;">Chrome<br>Liquid Light</h3>
    <p style="font-family: var(--font-mono); font-size: 14px; font-weight: 500; line-height: 1.55; color: var(--color-ink-secondary); margin: 0;">A room full of iridescent sound. Doors at 5. Free until they aren't.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 40px 32px; border-left: 2px solid var(--color-ink); border-right: 2px solid var(--color-ink); border-top: 1.5px solid var(--color-ink); border-bottom: 1.5px solid var(--color-ink);">
  <p style="font-family: var(--font-display); font-size: 56px; font-weight: 400; line-height: 0.95; letter-spacing: -1px; color: var(--color-ink); margin: 0 0 24px; text-transform: uppercase;">"The blob<br>is the party."</p>
  <p style="font-family: var(--font-mono); font-size: 12px; font-weight: 500; letter-spacing: 1.5px; color: var(--color-ink-secondary); margin: 0; text-transform: uppercase;">— DJ Drew Feig, Rimberio Club</p>
</div>
```

### Footer Block

```html
<div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0 0; border-top: 1.5px solid var(--color-ink); margin-top: 32px;">
  <p style="font-family: var(--font-mono); font-size: 12px; font-weight: 500; letter-spacing: 1.5px; color: var(--color-ink); margin: 0; text-transform: uppercase;">@ReallyGreatSite</p>
  <p style="font-family: var(--font-mono); font-size: 12px; font-weight: 500; letter-spacing: 1.5px; color: var(--color-ink); margin: 0; text-transform: uppercase;">Rimberio Club</p>
</div>
```

### CTA Block

```html
<div style="text-align: left; padding: 48px 0;">
  <h2 style="font-family: var(--font-display); font-size: 104px; font-weight: 400; line-height: 0.90; letter-spacing: -1.5px; color: var(--color-ink); margin: 0 0 32px; text-transform: uppercase;">Come<br>Melt</h2>
  <a style="display: inline-block; padding: 18px 36px; border: 2px solid var(--color-ink); background: var(--color-bg); font-family: var(--font-mono); font-size: 14px; font-weight: 700; letter-spacing: 1.2px; color: var(--color-ink); text-decoration: none; text-transform: uppercase;">RSVP Now →</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap — between a tracked label and its adjacent value.
- **8px**: Tight gap — between a metadata label and its value within a cell.
- **12px**: Small gap — between a stat number and its caption.
- **16px**: Base gap — between body lines in dense metadata.
- **20px**: Cell padding — standard internal padding for metadata table cells.
- **24px**: Medium gap — between the display headline and its subtitle.
- **32px**: Section gap — between a hero block and the metadata table.
- **48px**: Large gap — between major composition zones (headline / blob / table).
- **60px**: Content padding — standard outer padding on carousel and poster formats.
- **80px**: Max padding — slide-format outer padding and top-of-frame breathing room.
- **120px**: Story outer padding — vertical breathing room for the 1080×1920 story format.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| **Story (1080x1920)** | **60px left/right, 120px top/bottom** | **960px** |

### Alignment & Grid
- **Primary alignment**: Left-aligned for all headline and content blocks. The metadata table spans full content width and uses its own internal alignment (left for label cells, right for time cells, center for status cells).
- **Grid**: The metadata table is always a strict grid — usually 2 cells on top, 3 cells on bottom, all sharing 1.5px near-black rules. No offset, no overlap, no negative space between cells.
- **Hero zone**: The iridescent blob occupies the visual center of the composition, either directly below the headline or in a central inset. On posters, it sits inside a bordered frame. On stories, it sits free on the canvas with only its pink glow for support.
- **Three-zone composition**: Every layout in this style follows a three-zone rhythm — (1) heavy headline block at top, (2) iridescent blob in the middle, (3) bordered metadata table at the bottom. Break this rhythm only for content-heavy slides, and even then preserve the headline-at-top rule.
- **No centered body text**: Only the CTA text inside a button and the bottom row of the metadata table cells may be center-aligned. Everything else aligns left or to the grid.
- **Full-bleed is forbidden**: Content never touches the outer edge of the frame. The stone beige canvas must always frame the composition on all four sides by at least the format's minimum padding.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#ECE8DD` | Page canvas, base layer — the default for 95% of elements |
| Ruled (Level 1) | `1.5px solid #111111` border, no shadow | Metadata table cells, content dividers |
| Framed (Level 2) | `2px solid #111111` border, no shadow | Table outer frame, stat blocks, quote blocks |
| Glowing (Level 3) | `radial-gradient(rgba(255,110,199,0.25), rgba(199,157,255,0.20), transparent)` blur 40px ambient halo | The iridescent blob only |
| Overlay (Level 4) | Inset headline, `box-shadow: inset 40px 60px 80px rgba(255,232,240,0.55)` | Inset chrome treatments on display type (rare) |

### Border Treatments
- **Standard rule**: `1.5px solid #111111` with `border-radius: 0` — the primary rule for all dividers and internal cell borders. Never soften this into a gray.
- **Frame rule**: `2px solid #111111` with `border-radius: 0` — used exclusively for the outer perimeter of the metadata table and any content block that acts as a "framed" unit.
- **Faint divider**: `1px solid rgba(17,17,17,0.4)` — used very sparingly for tertiary internal dividers within long cells.
- **No rounded corners**: Corner radius on any bordered element is always `0`. The only radius in this entire style is on the iridescent blob, where it is an organic morph, not a geometric rounding.

### Surface Hierarchy
On the stone beige canvas, depth is communicated almost entirely through border weight and the iridescent glow:
1. **Background** (`#ECE8DD`) — the neutral canvas, completely flat.
2. **Framed block** (`2px solid #111111`) — the strongest structural container. Metadata tables, stat displays, quote blocks.
3. **Ruled block** (`1.5px solid #111111`) — internal divisions inside framed blocks.
4. **Iridescent blob** — the only non-flat element in the entire system. Its halo is the only shadow this style permits.

The rule: if it's not type, it's a straight black line. If it's not a straight black line, it's the blob.

## 7. Do's and Don'ts

### Do
- Use Archivo Black at 140px for the primary poster headline, stacked in 1–3 word lines with `line-height: 0.88` and `letter-spacing: -2px`.
- Use Space Mono at 500 weight for all metadata, body, and table labels — this is the utilitarian voice of the system.
- **Do use CSS conic-gradient and radial-gradient for the iridescent blob.** Layer a `conic-gradient(from 210deg, #C79DFF, #FF6EC7, #FFE8F0, #8DEBFF, #C79DFF)` with a radial pearl highlight on top, inside an organic `border-radius: 52% 48% 58% 42% / 46% 54% 46% 54%` mask. The gradient shift is the point.
- Use a 3-cell bordered metadata table at the bottom of every composition where there is structured information to display — it's the signature structural component.
- Use thin 1.5–2px near-black `#111111` rules with `border-radius: 0` for every bordered container.
- Use the warm stone beige `#ECE8DD` as the background on every format. It is non-negotiable — never swap it for white or gray.
- Use uppercase tracked small text (`letter-spacing: 1.5px`, 12px) for footers, handles, and venue attributions at the bottom edge.
- Use the pink + lavender ambient glow (`radial-gradient(rgba(255,110,199,0.25), rgba(199,157,255,0.20), transparent)` blur 40px) under the blob to anchor it to the canvas — this is the only shadow the system permits.
- Animate the blob's `border-radius` subtly (14s ease-in-out infinite) when the format supports animation — even a frozen render benefits from being designed with the morph in mind.
- Break headlines into short stacked lines of roughly equal length to create a solid rectangular type mass.

### Don't
- **Don't use flat pink, flat cyan, or any single-hue accent.** The iridescence is the entire point. A flat pink blob is a mascot; a gradient blob is a signature.
- Don't use any font other than Archivo Black for display or any font other than Space Mono for metadata/body. A second display face destroys the contrast that makes the headline feel monumental.
- Don't use rounded corners on any container, card, table, or button. `border-radius: 0` is the rule. The only radius allowed anywhere is the organic morphing blob.
- Don't use drop shadows on type, tables, or containers. The only shadow in the system is the blob's ambient iridescent halo.
- Don't use white `#FFFFFF` or pure black `#000000`. The stone beige background and near-black ink are what give the style its warmth — pure values make it look digital.
- Don't add a second accent color. No yellow pills, no green tags, no blue links — the blob is the only chromatic event.
- Don't center-align headline text. Headlines are always left-aligned. Center alignment is reserved for CTA buttons and center-status table cells.
- Don't use generous line-height on display type. `line-height: 0.88–0.92` is mandatory for the chunky mass effect.
- Don't let the iridescent blob touch the edge of the frame. It always sits inside the padded content zone with breathing room.
- Don't decorate with icons, emoji, illustrations, photos, or noise texture. The blob is the entire visual economy.
- Don't use more than one iridescent blob in a single composition. The blob works because it's singular — a field of blobs becomes wallpaper.
- Don't use italic type. Archivo Black has no italic, and the system does not want italic emphasis anywhere.

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
- **Typography scale down**: Display Hero becomes 104px (from 140px). Display Medium becomes 80px. Body stays 14px.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Headline stacked top-left, iridescent blob center-right or center, metadata table spans full content width at bottom.
- **Content slides**: Display Small headline at top-left, left-aligned content block, optional framed stat block, footer rule with handle on the left and page counter (e.g. "02/08") on the right.
- **Swipe indicator**: Tiny 1.5px tracked uppercase "SWIPE →" in Space Mono at the bottom-right corner, 12px. No dots.
- **Blob placement**: One blob per slide maximum. On cover slide it can sit at 60% of the frame height. On content slides it shrinks to ~280–320px and sits inline with content.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Hero at 140px for the title section. Display Small at 72px for each section head.
- **Padding**: 60px left/right. 80px top/bottom margins.
- **Section rhythm**: Each section opens with a 72px Display Small section head, followed by a horizontal 1.5px rule, followed by the content block. 48px vertical gap between sections.
- **Vertical flow**: Title section → iridescent blob hero → 3-cell metadata table summary → alternating numbered items and framed stat blocks → closing quote block → footer with handle and venue.
- **Footer**: 1.5px rule across full content width, with tracked uppercase handle on the left and venue on the right.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 180px. Display Medium becomes 128px. Body becomes 16px. Metadata Value becomes 20px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Two-zone horizontal split — headline + optional subtitle on the left ~55% of the frame, iridescent blob on the right ~45%. Metadata table spans full content width at the bottom.
- **Title slides**: Headline left, blob right, no metadata table — just a tracked handle and date at the bottom.
- **Content slides**: Display Small section head top-left, content block left-aligned below, small blob (240px) as a visual punctuation in the top-right corner, metadata table at bottom if needed.
- **CTA slides**: Headline left, blob right, bordered CTA button below the headline, tracked venue attribution at the bottom.

### Poster (1080x1350px)
- **Typography**: Display Hero at 140px (cover-accurate). Display Medium at 104px. Body at 14px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for the stacked heavy headline (left-aligned). Middle third for the framed iridescent blob inside a 2px bordered box. Bottom third for the 3-cell metadata table plus a thin footer rule with handle and venue.
- **Frame the blob**: On poster format the blob sits inside a `2px solid #111111` bordered rectangle — this replicates the reference composition exactly. The rectangle touches both side margins of the content area.
- **Vertical flow**: Headline → framed blob → metadata table → footer handle/venue.

### Story (1080x1920px) ← the tall format
- **Typography scale up**: Display Hero becomes 168px (from 140px). Display Medium becomes 120px. Body stays 14px with metadata value at 18px. **Hero blob is ~30% larger than its poster size** — roughly 640×640 from the poster's 460×460 — to fill the tall frame with presence.
- **Padding**: 60px left/right, **120px top/bottom** for generous vertical breathing room.
- **Composition**: Four-zone vertical stack — (1) stacked heavy headline at the top-left, (2) generous empty stone beige breathing room, (3) oversized iridescent blob centered horizontally with its pink+lavender glow anchoring it to the canvas (no bordered frame — the blob sits free on the stone), (4) 3-cell bordered metadata table spanning full content width at the bottom, followed by a thin 1.5px footer rule with handle on the left and venue on the right.
- **Hero blob treatment**: No bordered frame on the story format. The blob sits free with only its iridescent halo — this exploits the tall frame by letting the chrome organic shape breathe against the canvas the way a sculpture sits on a plinth.
- **Vertical rhythm**: 48px gap between headline and blob zone, 64px gap between blob zone and metadata table, 20px gap between metadata table and footer rule. The empty space above and below the blob is load-bearing — it is the silence that makes the iridescence feel precious.
- **Safe zones**: Top 120px and bottom 220px are reserved from story UI chrome (profile handle, reply box, progress bar). Keep the headline below the top 120px safe zone and the footer above the bottom 220px safe zone.
- **Animation (optional)**: If the story output supports CSS animation, apply the 14s `blobMorph` keyframe animation to the blob. If static, capture the blob mid-morph at a frame that shows maximum iridescent shift (roughly 33% into the keyframe).

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Stone Beige | `#ECE8DD` | Primary background — the canvas |
| Near-Black Ink | `#111111` | Primary text, rules, table borders |
| Ink Secondary | `#2B2B2B` | Softened small metadata |
| Ink Tertiary | `#555555` | Quieter metadata, supporting copy |
| Stone Darker | `#D8D2C3` | Rare recessed surface |
| Stone Lighter | `#F2EEE4` | Rare lifted surface |
| Hot Pink | `#FF6EC7` | Iridescent gradient stop (warm peak) |
| Cyan Shimmer | `#8DEBFF` | Iridescent gradient stop (cool peak) |
| Lavender Midtone | `#C79DFF` | Iridescent gradient stop (bridge) |
| Pearl Pink | `#FFE8F0` | Iridescent gradient stop (highlight rim) |
| Pearl Lilac | `#F6F3FA` | Iridescent gradient stop (soft blend) |
| Blob Glow | `rgba(255,110,199,0.25)` | Ambient pink halo under blob |
| Blob Glow Deep | `rgba(199,157,255,0.20)` | Ambient lavender halo under blob |

### Font Declarations

```css
/* Display (headlines only) */
font-family: 'Archivo Black', 'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif;

/* Body / Metadata (everything else) */
font-family: 'Space Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace;
```

### Google Fonts Link

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-bg: #ECE8DD;
  --color-ink: #111111;
  --color-ink-secondary: #2B2B2B;
  --color-ink-tertiary: #555555;

  /* Colors -- Stone neutrals */
  --color-stone-darker: #D8D2C3;
  --color-stone-lighter: #F2EEE4;

  /* Colors -- Iridescent gradient stops */
  --color-iri-hot-pink: #FF6EC7;
  --color-iri-cyan: #8DEBFF;
  --color-iri-lavender: #C79DFF;
  --color-iri-pearl-pink: #FFE8F0;
  --color-iri-pearl-lilac: #F6F3FA;

  /* Colors -- Ambient glow (blob only) */
  --color-glow-pink: rgba(255, 110, 199, 0.25);
  --color-glow-lavender: rgba(199, 157, 255, 0.20);
  --color-glow-cyan: rgba(141, 235, 255, 0.10);

  /* Colors -- Borders */
  --color-border-default: #111111;
  --color-border-strong: #111111;
  --color-divider-faint: rgba(17, 17, 17, 0.4);

  /* Typography -- Families */
  --font-display: 'Archivo Black', 'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-mono: 'Space Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace;

  /* Typography -- Sizes */
  --text-display-hero: 140px;
  --text-display-medium: 104px;
  --text-display-small: 72px;
  --text-big-number: 96px;
  --text-subtitle: 18px;
  --text-body: 14px;
  --text-metadata-label: 13px;
  --text-metadata-value: 16px;
  --text-footer: 12px;
  --text-cta: 14px;

  /* Typography -- Weights */
  --weight-display: 400;      /* Archivo Black is single-weight */
  --weight-mono-regular: 400;
  --weight-mono-medium: 500;
  --weight-mono-bold: 700;

  /* Typography -- Line Heights */
  --leading-display-tight: 0.88;
  --leading-display: 0.90;
  --leading-display-loose: 0.92;
  --leading-subtitle: 1.45;
  --leading-body: 1.55;
  --leading-metadata: 1.35;
  --leading-footer: 1.40;

  /* Typography -- Letter Spacing */
  --track-display-tight: -2px;
  --track-display: -1.5px;
  --track-display-loose: -1px;
  --track-subtitle: 0.4px;
  --track-metadata: 0.6px;
  --track-footer: 1.5px;
  --track-cta: 1.2px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-cell: 20px;
  --space-medium: 24px;
  --space-section: 32px;
  --space-large: 48px;
  --space-content: 60px;
  --space-max: 80px;
  --space-story: 120px;

  /* Borders -- all radius is 0 except the blob */
  --radius-none: 0;
  --border-rule: 1.5px solid #111111;
  --border-frame: 2px solid #111111;
  --border-faint: 1px solid rgba(17, 17, 17, 0.4);

  /* Iridescent blob composed values */
  --blob-shape: 52% 48% 58% 42% / 46% 54% 46% 54%;
  --blob-gradient:
    radial-gradient(circle at 35% 30%, #FFE8F0 0%, rgba(255,232,240,0) 28%),
    radial-gradient(circle at 70% 75%, #F6F3FA 0%, rgba(246,243,250,0) 32%),
    conic-gradient(from 210deg at 50% 50%,
      #C79DFF 0%,
      #FF6EC7 18%,
      #FFE8F0 32%,
      #8DEBFF 52%,
      #C79DFF 70%,
      #FF6EC7 85%,
      #C79DFF 100%);
  --blob-inset-shadow:
    inset 40px 60px 80px rgba(255,232,240,0.55),
    inset -30px -50px 70px rgba(141,235,255,0.35),
    inset 0 0 120px rgba(199,157,255,0.25);
  --blob-halo: radial-gradient(circle at 50% 55%,
    rgba(255,110,199,0.25) 0%,
    rgba(199,157,255,0.20) 35%,
    rgba(141,235,255,0.10) 60%,
    transparent 80%);
}
```

### System Font Fallbacks
- **Display (if Archivo Black fails to load):** `'Arial Black', 'Helvetica Neue', Helvetica, Arial, sans-serif` — always bump to a 900-weight fallback.
- **Body / Metadata (if Space Mono fails to load):** `'JetBrains Mono', 'Menlo', 'Consolas', monospace` — any fixed-width sans with a technical feel.
