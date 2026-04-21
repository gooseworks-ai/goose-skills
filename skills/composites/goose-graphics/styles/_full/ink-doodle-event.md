# Design Style: Ink Doodle Event

## 1. Visual Theme & Atmosphere

Ink Doodle Event is the visual language of a hand-pulled skate-zine poster that was drawn with a brush pen on a sheet of kraft paper, photographed under flat studio light, and tacked to the inside of a skate-shop window. It borrows from the DIY aesthetic of 1990s Bay Area skate culture, the loose-line cartooning of Matt Groening's early Life in Hell strips, and the calligraphic flourishes of mid-century wedding stationery — three references that should not work together and that precisely because of that collision create a flyer with enormous character. The surface is always a warm wheat-beige (`#EAD9AE`) that reads as kraft paper or sand. The ink is a single near-pure black (`#0E0E0E`). Every mark on the page looks as if it came from one of three tools: a brush pen (the loose illustrations), a calligraphic nib (the cursive script headline), or a typewriter ribbon (the date and address metadata). Nothing is mechanical, nothing is bright, and nothing is symmetric.

The color story is almost absurdly narrow: one warm paper tone, one ink. The wheat background (`#EAD9AE`) is a mid-value warm beige that sits between raw sienna and oat — it is never yellow, never orange, and never approaching cream. The ink (`#0E0E0E`) is a near-black that reads as permanent marker rather than printer black — it has a touch of warmth so it feels ink-on-paper rather than screen-black-on-screen-white. That is the whole palette. There are no accent colors, no highlights, no secondary tones. The only tonal variation allowed comes from the halftone dot pattern inside the spiky sun icon — a field of black dots on the wheat surface that reads as mid-gray at a distance but resolves into dots up close. That halftone feel, borrowed from 1970s screen-printed gig posters, is what prevents the two-color palette from feeling sterile.

The typographic system is three distinct voices. A flowing calligraphic script (Yellowtail) handles the one-word hero headline — "Sunday", "Saturday", "Friday", whatever the event day is — set at 140-160px with enormous descenders and swashes that the rest of the composition has to make space for. A classical body serif (Fraunces) in italic at weight 400 handles the small pieces of flavour text that flank the central illustration: "skate", "club", short tags, or quotes. A clean monospace (DM Mono) handles the hard metadata at the top of the frame: the date, the time, the edition number. The visual vocabulary is just as restricted: one hand-drawn loose-line character illustration (a dog's head with a skateboard, a cat stretching, a pigeon wearing sunglasses — always a character, never an object or a geometric shape), one halftone sun or spiky ornament, and the calligraphic headline. That is the entire kit. The feel is handmade, skate culture meets calligraphy, casual without being sloppy, charming without being cute.

**Key Characteristics:**
- Wheat/kraft paper background (`#EAD9AE`) — warm beige, sits between oat and raw sienna, never yellow, never cream
- Ink black text and illustrations (`#0E0E0E`) — near-pure black with a whisper of warmth, reads as permanent marker
- Yellowtail calligraphic script for the single-word hero headline — 140-160px, with enormous descender swashes that the layout must accommodate
- Fraunces Italic at weight 400-500 for flanking flavour text ("skate", "club", quotes) — refined italic serif as a counterbalance to the loose illustration
- DM Mono at weight 400 for top-row metadata (dates, times, edition numbers) — classical monospace energy, typewriter-ribbon feel
- Hand-drawn loose single-stroke SVG illustrations — brush-pen stroke with `stroke-width: 6`, `stroke-linecap: round`, `stroke-linejoin: round`, no fills, intentionally asymmetric
- Halftone dot-filled spiky sun icon as the secondary decorative element — dotted fill inside a spiky outline, 1970s screen-print energy
- No cards, no borders, no rounded containers — the whole composition reads as a single sheet of paper with ink on it
- No sans-serif fonts anywhere — the entire typographic system is serif, script, and monospace only
- No saturated colors, no gradients, no shadows, no glass — the palette is wheat and ink and nothing else
- Top-row metadata hugs the corners of the frame with the script headline overlapping between them — the date and time are placed at y≈6% from the top, the headline descends into and through them

## 2. Color Palette & Roles

### Primary
- **Wheat Paper** (`#EAD9AE`): Primary background. Warm kraft beige, mid-value. Sits between oat and raw sienna. Reads as a sheet of recycled paper under flat studio light. Never substitute a cream, buttermilk, or pure beige — the warmth and the slight green undertone are what keep it feeling like paper rather than a cheap manila folder.
- **Ink Black** (`#0E0E0E`): Primary ink. Used for every piece of type, every illustration stroke, every halftone dot. Near-pure black with a trace of warmth so it reads as brush-pen ink rather than screen black. Never substitute pure `#000000` — it reads as plastic.

### Accent
This style has no accent colors. The palette is strictly two-color. The only permitted "third tone" is the optical mid-gray that emerges from halftone dot patterns — and that is a function of the black ink on the wheat paper, not a separate color.

- **Wheat Highlight** (`#F0E1BA`): A very slightly lighter wheat used exclusively for rare paper-grain highlights in format variations. Use almost never.
- **Wheat Shadow** (`#DCCA9C`): A very slightly darker wheat used exclusively for a subtle paper-edge vignette in poster formats. Use almost never.

### Neutral Scale
- **Ink 100** (`#0E0E0E`): Primary ink — all type, all illustration strokes, all halftone dots.
- **Ink 80** (`rgba(14, 14, 14, 0.80)`): Secondary ink for supporting metadata where a whisper of recession is needed. Use rarely.
- **Ink 60** (`rgba(14, 14, 14, 0.60)`): Tertiary annotations, hairline dividers, slide numbers. Use rarely.
- **Ink 40** (`rgba(14, 14, 14, 0.40)`): Whisper accents and very quiet background texture overlays. Use almost never.
- **Ink 20** (`rgba(14, 14, 14, 0.20)`): Reserved for halftone dot patterns and subtle paper-grain noise only.

### Surface & Borders
- **Surface Primary** (`#EAD9AE`): The flat wheat canvas. Edge-to-edge, never containered, never tinted.
- **Surface Inset** (`rgba(14, 14, 14, 0.04)`): A barely-there ink wash for extremely rare inset moments. Use almost never — this style is unapologetically flat.
- **Hairline Ink** (`rgba(14, 14, 14, 0.35)`): The only border treatment allowed. A 1px ink hairline that can separate the top metadata row from the central composition when a divider is explicitly needed. Use sparingly.
- **Hairline Ink Strong** (`rgba(14, 14, 14, 0.55)`): A slightly heavier 1px ink divider for format-spanning rules. Use sparingly.

### Shadow Colors
This style has no drop shadows. Everything sits flat on the paper. The following are permitted only for rare special cases.

- **Paper Grain** (`rgba(14, 14, 14, 0.06)`): A tissue-thin ink overlay that can be composited across the canvas as a print-grain / recycled-paper texture effect.
- **Halftone Ink** (`#0E0E0E`): The ink color used inside halftone dot patterns — always at 100% opacity, never softened. Halftone effects come from dot density, not from color transparency.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Yellowtail&family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" rel="stylesheet">
```

- **Script Display**: `'Yellowtail', 'Pinyon Script', 'Brush Script MT', cursive` — used at 140-160px for the single-word hero headline. Yellowtail is a connected brush-script with generous descenders and swashes. Pick Yellowtail (never Dancing Script, never Great Vibes) — the brush-pen feel must feel hand-drawn, not printed.
- **Italic Serif**: `'Fraunces', Georgia, 'Times New Roman', serif` — used italic at weight 400-500 for every piece of supporting body text, flanking labels ("skate", "club"), and classical serif metadata.
- **Mono Metadata**: `'DM Mono', 'IBM Plex Mono', 'Courier Prime', Courier, monospace` — used at weight 400 for hard metadata: dates, times, edition numbers, small captions. Typewriter-ribbon feel.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Script Hero | Yellowtail | 160px | 400 | 0.95 | -2px | The single-word calligraphic headline ("Sunday"). Extra top margin required for ascender loops. Extra bottom margin required for descender swashes. `padding-top: 40px; padding-bottom: 60px;` around the headline is standard. |
| Script Secondary | Yellowtail | 96px | 400 | 1.00 | -1px | Smaller script role for non-hero slides where the headline still needs to sing. |
| Flanking Italic | Fraunces Italic | 24px | 400 | 1.20 | 0.2px | The "skate" / "club" words that flank the central illustration. Mixed case. Italic is mandatory. Never set these in uppercase. |
| Body Italic | Fraunces Italic | 20px | 400 | 1.50 | 0.2px | Rare long-form body text. Italic preserved. Mixed case. |
| Body Roman | Fraunces | 18px | 400 | 1.55 | 0.2px | Long-form body copy when italic would be too ornate. Upright, mixed case. Use rarely. |
| Top Metadata | DM Mono | 22px | 400 | 1.20 | 0.5px | The top-row date and time. Placed at the very top corners of the frame. Mixed case with numerals. |
| Address Footer | Fraunces | 20px | 400 | 1.40 | 0.2px | The two-line address at the bottom of the frame. Upright, mixed case. Classical serif, never mono. |
| Small Caption | DM Mono | 14px | 400 | 1.30 | 0.5px | Slide numbers, edition marks, footers. Mixed case. |
| Framework Tag | Fraunces Italic | 16px | 500 | 1.20 | 0.5px | Small italic tags when a category label is needed. Rare. |

### Principles
- **Three voices, no sans-serif**: Script, italic serif, and mono. The entire typographic identity is defined by the absence of any sans-serif — the moment you reach for Inter, DM Sans, or Satoshi, the style collapses into a generic modern flyer.
- **The one-word hero**: The Yellowtail script headline is always a single word. Two-word headlines break the calligraphic rhythm and force line breaks that the descender swashes cannot accommodate. If you need more words, they go in Fraunces italic below.
- **Swash space is non-negotiable**: Yellowtail letters like "y", "g", "J", "S" carry huge descender and ascender flourishes. The layout must leave 40-60px of breathing room above and below the script headline so those swashes do not collide with other elements.
- **Italic serif flanks the illustration**: The "skate" and "club" words (or whatever the equivalent flanking label is) are always set in Fraunces italic at 24px, placed on the left and right of the central illustration, visually gripping the art from both sides. Never stack them above or below — they always flank.
- **Mono is reserved for metadata**: DM Mono only appears at the very top of the frame for the date and time, and occasionally for small captions. Never use mono for headlines, body, or addresses — it breaks the handmade feel.
- **Mixed case always**: Every piece of type on the page is mixed case. The only exception is when the user supplies pre-uppercased content — never apply `text-transform: uppercase` to anything in this style.

## 4. Component Patterns

### Event Poster Layout (Full Composition)

The full composition has four stacked zones: top metadata row (date + time), script headline, central illustration with flanking italic labels, and bottom address footer. This is the hero pattern for this style.

```html
<div style="position: relative; width: 1080px; height: 1080px; background-color: var(--color-wheat); padding: 60px; box-sizing: border-box; font-family: var(--font-body); color: var(--color-ink); overflow: hidden;">
  <!-- Top metadata row -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
    <span style="font-family: var(--font-mono); font-size: 22px; font-weight: 400; color: var(--color-ink); letter-spacing: 0.5px;">08.16.2025</span>
    <span style="font-family: var(--font-mono); font-size: 22px; font-weight: 400; color: var(--color-ink); letter-spacing: 0.5px;">1pm &ndash; 5pm</span>
  </div>

  <!-- Script headline -->
  <h1 style="font-family: var(--font-script); font-size: 160px; font-weight: 400; line-height: 0.95; letter-spacing: -2px; color: var(--color-ink); text-align: center; margin: 20px 0 40px; padding: 0 20px;">Sunday</h1>

  <!-- Central row: flanking italic + illustration -->
  <div style="display: flex; align-items: center; justify-content: center; gap: 40px; margin: 20px 0 40px;">
    <span style="font-family: var(--font-body); font-size: 24px; font-weight: 400; font-style: italic; color: var(--color-ink);">skate</span>
    <!-- illustration slot (see Hand-drawn Ink Illustration component below) -->
    <div style="width: 480px; height: 360px;"><!-- SVG inserted here --></div>
    <span style="font-family: var(--font-body); font-size: 24px; font-weight: 400; font-style: italic; color: var(--color-ink);">club</span>
  </div>

  <!-- Bottom address footer -->
  <div style="position: absolute; left: 60px; right: 60px; bottom: 60px; text-align: center; font-family: var(--font-body); font-size: 20px; font-weight: 400; line-height: 1.40; color: var(--color-ink);">
    Waller Street Skatepark<br>
    751 Stanyan St, San Francisco, CA 94117
  </div>
</div>
```

### Hand-drawn Ink Illustration Slot

A loose single-stroke character drawing rendered as inline SVG. The example below is a dog's head with a skateboard balanced on top — the hero illustration of this style. Stroke must be `fill: none; stroke: #0E0E0E; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round;`. The paths are intentionally asymmetric and loose — they should feel drawn in one motion, not assembled from geometric primitives. Never use perfect circles, rectangles, or mathematical curves.

```html
<svg viewBox="0 0 480 360" width="480" height="360" xmlns="http://www.w3.org/2000/svg" style="display: block;">
  <g fill="none" stroke="#0E0E0E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- Skateboard balanced on top of head -->
    <path d="M 180 70 Q 200 58, 240 56 Q 285 54, 325 62 Q 345 66, 355 76 Q 345 88, 320 92 Q 280 96, 235 94 Q 195 92, 178 86 Q 168 78, 180 70 Z" />
    <!-- Skateboard wheel (left) -->
    <circle cx="205" cy="96" r="5" />
    <!-- Skateboard wheel (right) -->
    <circle cx="320" cy="98" r="5" />

    <!-- Main dog head outline — one continuous loose curve -->
    <path d="M 155 120
             C 145 100, 155 90, 175 95
             C 195 100, 215 110, 240 112
             C 275 115, 305 120, 335 135
             C 370 155, 395 185, 405 225
             C 412 260, 400 290, 370 305
             C 340 318, 310 312, 285 300
             C 270 293, 260 290, 250 295
             C 238 302, 225 310, 210 305
             C 195 298, 185 282, 178 265
             C 172 248, 165 230, 155 215
             C 142 195, 135 175, 140 155
             C 143 140, 148 128, 155 120 Z" />

    <!-- Floppy left ear — loose hanging curve -->
    <path d="M 160 135
             C 130 155, 110 180, 105 215
             C 102 240, 115 260, 140 265
             C 160 268, 175 258, 180 240" />

    <!-- Floppy right ear — shorter -->
    <path d="M 330 130
             C 355 140, 375 155, 385 175" />

    <!-- Eye — simple dot -->
    <circle cx="230" cy="180" r="4" fill="#0E0E0E" />

    <!-- Nose — small filled blob -->
    <circle cx="165" cy="245" r="9" fill="#0E0E0E" />

    <!-- Mouth — loose curve -->
    <path d="M 158 262 C 170 278, 190 282, 205 270" />

    <!-- Collar line across the neck -->
    <path d="M 280 310 C 310 320, 340 322, 365 315" />
  </g>
</svg>
```

### Halftone Spiky Sun Icon

A radial sun with a spiky outline and a halftone dot pattern filling the interior. This is the secondary decorative element of the style — the 1970s screen-printed detail that prevents the two-color palette from feeling sterile. Place it near the illustration as a small accent (60-140px). The dot pattern is built with a `<defs><pattern>` block so the dots tile cleanly inside the spiky shape.

```html
<svg viewBox="0 0 200 200" width="140" height="140" xmlns="http://www.w3.org/2000/svg" style="display: block;">
  <defs>
    <pattern id="halftone-dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="2" fill="#0E0E0E" />
    </pattern>
  </defs>

  <!-- Spiky sun outline — 12-point star-like shape, loose and hand-drawn -->
  <path d="M 100 10
           L 115 45 L 150 30 L 145 70
           L 185 75 L 160 105 L 190 130
           L 150 140 L 165 180 L 125 165
           L 110 195 L 90 160 L 55 180
           L 60 140 L 20 130 L 50 100
           L 15 75 L 55 70 L 45 30
           L 85 45 Z"
        fill="url(#halftone-dots)"
        stroke="#0E0E0E"
        stroke-width="5"
        stroke-linejoin="round" />
</svg>
```

### Display Script Headline (Standalone)

```html
<h1 style="font-family: var(--font-script); font-size: 160px; font-weight: 400; line-height: 0.95; letter-spacing: -2px; color: var(--color-ink); text-align: center; margin: 0; padding: 40px 20px 60px;">Sunday</h1>
```

The 40px top / 60px bottom padding is load-bearing — it is the breathing room that Yellowtail's enormous descenders on "y", "g", and "J" need. Remove it and the swashes clip the layout below.

### Top Metadata Row

```html
<div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; font-family: var(--font-mono); font-size: 22px; font-weight: 400; color: var(--color-ink); letter-spacing: 0.5px;">
  <span>08.16.2025</span>
  <span>1pm &ndash; 5pm</span>
</div>
```

The row is placed at the very top of the frame (y≈6% from the top edge). The script headline is then placed immediately below, and intentionally overlaps the metadata vertically — the calligraphic letterforms weave between the mono date and time. This is the signature composition move of the style.

### Bottom Address Footer

```html
<div style="text-align: center; font-family: var(--font-body); font-size: 20px; font-weight: 400; line-height: 1.40; color: var(--color-ink);">
  Waller Street Skatepark<br>
  751 Stanyan St, San Francisco, CA 94117
</div>
```

Always two lines: venue name on line one, full address on line two. Always classical serif (Fraunces upright, not italic, not mono). Always centered. Always at the very bottom of the frame with 60px bottom margin.

### Flanking Italic Labels

```html
<div style="display: flex; align-items: center; justify-content: center; gap: 40px;">
  <span style="font-family: var(--font-body); font-size: 24px; font-weight: 400; font-style: italic; color: var(--color-ink);">skate</span>
  <div style="width: 480px; height: 360px;"><!-- illustration --></div>
  <span style="font-family: var(--font-body); font-size: 24px; font-weight: 400; font-style: italic; color: var(--color-ink);">club</span>
</div>
```

The two italic labels always flank the central illustration horizontally — one on each side, vertically centered. They are small compared to the illustration (24px vs. 360px) and they read as flavour text, not as headings. Common flanking pairings: "skate / club", "good / times", "hello / friend", "open / late", "first / edition".

### Paper Grain Overlay

```html
<div style="position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(14,14,14,0.06) 1px, transparent 1px),
    radial-gradient(circle at 70% 80%, rgba(14,14,14,0.05) 1px, transparent 1px);
  background-size: 7px 7px, 11px 11px;"></div>
```

A tissue-thin speckle overlay that emulates the grain of recycled kraft paper. Optional — apply only when the composition feels too clean and needs a whisper of texture.

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap — inside halftone dot patterns.
- **8px**: Tight gap — between flanking italic label and adjacent element when space is constrained.
- **16px**: Base gap — between the bottom of the script headline swashes and the central illustration.
- **24px**: Small section — between top metadata row and the script headline.
- **40px**: Flanking gap — between each italic flanking label and the central illustration.
- **48px**: Section divider — between the central illustration block and the bottom address footer.
- **60px**: Outer frame padding — the standard margin from the edge of the canvas to any content.
- **80px**: Breathing room for script descenders — the vertical space needed below the Yellowtail headline for its swashes.
- **120px**: Story format top/bottom safe zone — reserved for platform UI.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| Story (1080x1920) | 60px left/right, 120px top/bottom | 960px |

### Alignment & Grid
- **Primary alignment**: Centered. Everything in this style is centered along the vertical axis — the script headline, the illustration, the address footer. The only exceptions are the top metadata row (left date, right time) and rare compositions that call for an off-axis illustration.
- **Vertical flow**: Top-row metadata → script headline → central illustration with flanking italic → bottom address footer. This top-to-bottom rhythm is the composition template of the style and should not be broken.
- **No grid**: There is no column grid. The composition is a single centered column, and horizontal placement is driven by the content itself (the illustration sits center, the flanking italic labels sit immediately left and right of it).
- **Overlap is good**: The script headline is intentionally allowed to overlap the top metadata row vertically — the calligraphic swashes of letters like "S" and "y" should weave between the date and time. This overlap is the signature move.
- **Illustration gravity**: The central illustration is always the visual anchor — it occupies roughly 40-50% of the frame's height and is placed so its horizontal center sits at the exact center of the composition.
- **No containers**: No cards, no borders, no backgrounds, no rounded corners. Every element sits directly on the wheat paper surface.

## 6. Depth & Elevation

This style is flat. There are no shadows, no elevations, no layered surfaces. The entire composition sits on a single plane — the wheat paper — with ink marks on top of it.

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#EAD9AE` | The entire canvas. This is the only level. |
| Hairline (Level 1) | `1px solid rgba(14,14,14,0.35)` | Rare ink hairline divider between top metadata and headline. |
| Hairline Strong (Level 2) | `1px solid rgba(14,14,14,0.55)` | Slightly heavier hairline for format-spanning rules. Rare. |
| Grain Overlay (Level 3) | `rgba(14,14,14,0.06)` speckle pattern | Optional paper-grain texture for hand-made feel. |
| Halftone Fill (Level 4) | `#0E0E0E` dots at 10px spacing | Interior fill for the spiky sun and any other halftone decorative element. |

### Border Treatments
- **No containers**: This style has no cards and no bordered containers. The only "borders" that exist are hairline dividers between zones — and they should be used sparingly, only when a composition feels like it needs a structural rule.
- **Hairline divider**: `1px solid rgba(14, 14, 14, 0.35)` — used to separate the top metadata row from the central composition when an explicit divider is needed. Default: no divider.
- **Hairline strong**: `1px solid rgba(14, 14, 14, 0.55)` — used for format-spanning rules in infographic layouts.
- **Illustration stroke**: `stroke: #0E0E0E; stroke-width: 6; stroke-linecap: round; stroke-linejoin: round;` — this is the canonical brush-pen stroke for every hand-drawn element. Never thinner than 5, never thicker than 8.

### Surface Hierarchy
1. **Paper** (`#EAD9AE`) — the wheat canvas, edge-to-edge.
2. **Ink marks** (`#0E0E0E`) — type, illustrations, halftone dots, all sitting directly on the paper.
3. **Halftone zones** — areas where the ink is broken into a dot pattern to create optical mid-gray.

Depth does not come from shadows or layers. It comes from the density and weight of the ink marks — a thick brush-pen stroke reads as closer than a thin mono caption, and a halftone-dot field reads as further back than a solid ink line.

## 7. Do's and Don'ts

### Do
- Use Yellowtail for the one-word script hero headline at 140-160px. This is the single most important element of the style — nothing else carries the handmade calligraphic identity.
- Use loose, asymmetric, hand-drawn SVG illustrations for the central character. Paths should feel drawn in one motion — never assemble illustrations from perfect circles, rectangles, or smooth Bezier curves. Intentional imperfection is the aesthetic.
- Always use `stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; fill: none;` for illustration strokes. This is the canonical brush-pen feel.
- Use the halftone dot-filled spiky sun as a secondary decorative element — place it small (60-140px) near the central illustration for a 1970s screen-print accent.
- Use the kraft wheat paper background (`#EAD9AE`) as the edge-to-edge canvas. This is the only background — never substitute a cream, buttermilk, or pure beige.
- Use Fraunces italic at 24px for the small flanking labels that sit immediately left and right of the central illustration. These labels grip the illustration from both sides.
- Use DM Mono for the top-row date and time metadata at 22px, placed in the top-left and top-right corners of the frame with 60px outer padding.
- Use Fraunces upright for the two-line address footer at the bottom of the frame, always centered.
- Allow the script headline to overlap the top metadata row vertically — the calligraphic swashes should weave through the date and time. This is the signature composition move.
- Keep headlines to a single word whenever possible. Yellowtail's descenders do not work well across line breaks.
- Leave 40-60px of breathing room above and below the script headline for swashes and descenders.

### Don't
- Don't use geometric precision in the illustrations. No perfect circles, no clean rectangles, no smooth symmetric curves. The whole point is that the drawings feel hand-made, brush-pen, one-continuous-motion. A dog's two ears should be different lengths. A sun's twelve spikes should be different sizes. Imperfection is the aesthetic.
- Don't use any sans-serif font anywhere in the composition — not Inter, not DM Sans, not Satoshi, not Space Grotesk. The moment a sans-serif appears, the style collapses into a generic modern flyer. The system is strictly serif + script + mono.
- Don't use saturated colors. No red, no blue, no green, no yellow accent, no gradient. The palette is wheat (`#EAD9AE`) and ink (`#0E0E0E`) and nothing else. Any third color breaks the identity.
- Don't use drop shadows, glow effects, or elevation. This style is flat — every mark sits directly on the paper.
- Don't use cards, borders, rounded containers, or backgrounds. The composition is a single wheat paper surface with ink marks on it.
- Don't use pure black (`#000000`) for ink — always use `#0E0E0E`. Pure black reads as screen-plastic, not brush-pen ink.
- Don't use pure white or cream for the background — always use the warm wheat `#EAD9AE`. Cream reads as stationery, wheat reads as kraft paper.
- Don't use `text-transform: uppercase` on anything. The entire style is mixed case. If the reference shows uppercase, it is a case of the source content already being uppercase — never force it with CSS.
- Don't use multi-word headlines in Yellowtail script. Keep the hero to a single word ("Sunday", "Saturday", "Summer", "Skate"). Multi-word calligraphic headlines collapse under their own descenders.
- Don't use symmetric, mathematically-generated shapes for the halftone sun. The spiky outline should be irregular — 12-ish spikes of varying length, hand-drawn feel.
- Don't place the illustration off-center. The central illustration is the visual anchor and always sits on the horizontal centerline.
- Don't clutter the composition with more than one illustration and one halftone ornament. The visual vocabulary is intentionally restricted.

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
- **Typography scale**: Script Hero stays at 160px. Top metadata at 22px DM Mono. Flanking italic at 24px Fraunces italic. Address footer at 20px Fraunces upright.
- **Padding**: 60px all sides. Content area is 960x960px.
- **Cover slide**: Full event poster composition — top metadata row, script headline, central illustration with flanking italic labels, bottom address footer. The canonical layout.
- **Content slides**: Swap the central illustration for a Fraunces italic body block at 32-40px, centered, 700px max-width. The top metadata row and bottom address footer can be replaced with slide-specific metadata (e.g., "Page 02 / 08" in DM Mono).
- **CTA slide**: Single Yellowtail word centered at 180px (slightly larger than cover), with a small Fraunces italic subtitle below at 24px. Top metadata row can be dropped.
- **Swipe indicator**: Small ink dots at the bottom center, 6px diameter with 8px gap, inactive at `rgba(14,14,14,0.25)` and active at `#0E0E0E`.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Script Hero at 160px for the title section. Section headings in Fraunces italic at 48px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Section structure**: Each section is a vertical block with the Fraunces italic heading on top, a loose hand-drawn illustration or halftone ornament in the middle, and Fraunces upright body copy below. Sections are separated by 48px vertical gaps and an optional `1px solid rgba(14,14,14,0.35)` hairline divider.
- **Vertical rhythm**: Alternate illustration-heavy sections with text-heavy sections to give the reader visual breathing room. Never stack three illustration sections in a row.
- **Footer**: Fraunces upright 14px, centered, with an optional DM Mono edition marker.

### Slides (1920x1080px)
- **Typography scale up**: Script Hero becomes 220px (from 160px). Flanking italic becomes 32px. Top metadata becomes 28px DM Mono. Address footer becomes 24px Fraunces upright.
- **Padding**: 80px all sides. Content area is 1760x920px.
- **Layout**: The widescreen format works best when the central illustration is placed off-center (say, 60% from the left) with the script headline centered and the flanking italic / metadata filling the remaining horizontal space. This is the only format where off-center illustration placement is allowed, because the wide canvas needs the horizontal rhythm.
- **Title slides**: Top metadata row at y≈80px, Script Hero centered at y≈300px, central illustration at y≈500-900px, address footer at y≈980px.
- **Content slides**: Fraunces italic heading at 56px left-aligned, Fraunces upright body at 22px left-aligned, optional small hand-drawn ornament in the right third.
- **CTA slides**: Single Yellowtail word at 240px, centered, with a small Fraunces italic tagline below.

### Poster (1080x1350px)
- **Typography**: Script Hero at 180px (slightly larger than carousel to fill the taller canvas). Flanking italic at 26px. Top metadata at 24px DM Mono. Address footer at 22px Fraunces upright.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top sixth for the metadata row. Next third for the script headline and its breathing room. Middle third for the central illustration with flanking italic labels. Bottom fifth for the address footer.
- **Vertical flow**: Reads top to bottom as a classic event poster. This is the format that most closely matches the canonical reference image.
- **Grain overlay**: Apply the optional paper-grain overlay in this format more readily — posters benefit from the hand-made texture.

### Story (1080x1920px)
- **Typography scale up**: Script Hero becomes 180px (from 160px — only slightly larger because the vertical format needs breathing room more than it needs scale). Flanking italic becomes 26px Fraunces italic. Top metadata becomes 24px DM Mono. Address footer becomes 22px Fraunces upright.
- **Padding**: 60px left/right, 120px top/bottom. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 920px. The composition is vertically luxurious — cluster the event-poster elements in y=280 to y=1700, leaving generous wheat paper whitespace above and below.
- **Cover slide**: Top metadata row at y≈200. Script Hero at y≈360-560 (with generous swash room). Central illustration at y≈680-1180. Flanking italic labels at the vertical midline of the illustration. Halftone spiky sun ornament near the illustration at 120px. Address footer at y≈1550-1640.
- **Content slides**: One event detail per slide. Fraunces italic heading at 56px, body copy in Fraunces upright at 22px, single loose hand-drawn ornament at 200-300px below the body. Centered vertically within the safe zone.
- **CTA slide**: Single Yellowtail word at 200px, centered at y≈800. Fraunces italic tagline below at 28px. No button — the call to action is the event itself. The address footer becomes the CTA by virtue of being the only thing telling you where to go.
- **Progress indicator**: Thin ink segments at y≈80 (inside the top safe zone) — inactive in `rgba(14,14,14,0.25)`, active in `#0E0E0E`. Hairline height 2px, segments separated by 6px gaps.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Wheat Paper | `#EAD9AE` | Primary background, edge-to-edge canvas |
| Ink Black | `#0E0E0E` | All type, all illustration strokes, all halftone dots |
| Wheat Highlight | `#F0E1BA` | Rare paper-grain highlight |
| Wheat Shadow | `#DCCA9C` | Rare paper-edge vignette |
| Ink 80 | `rgba(14,14,14,0.80)` | Rare secondary ink |
| Ink 60 | `rgba(14,14,14,0.60)` | Rare tertiary annotation |
| Ink 40 | `rgba(14,14,14,0.40)` | Very rare whisper accents |
| Ink 20 | `rgba(14,14,14,0.20)` | Halftone dot zones, paper-grain overlay |
| Hairline Ink | `rgba(14,14,14,0.35)` | Rare hairline divider |
| Hairline Ink Strong | `rgba(14,14,14,0.55)` | Rare format-spanning rule |
| Paper Grain | `rgba(14,14,14,0.06)` | Optional kraft paper texture overlay |

### Font Declarations

```css
/* Script display (the one-word hero headline) */
font-family: 'Yellowtail', 'Pinyon Script', 'Brush Script MT', cursive;

/* Italic serif body (flanking labels, body copy, address footer) */
font-family: 'Fraunces', Georgia, 'Times New Roman', serif;

/* Monospace metadata (dates, times, edition numbers) */
font-family: 'DM Mono', 'IBM Plex Mono', 'Courier Prime', Courier, monospace;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Yellowtail&family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors — Primary */
  --color-wheat: #EAD9AE;
  --color-ink: #0E0E0E;

  /* Colors — Accent (rare) */
  --color-wheat-highlight: #F0E1BA;
  --color-wheat-shadow: #DCCA9C;

  /* Colors — Neutral Scale */
  --color-ink-80: rgba(14, 14, 14, 0.80);
  --color-ink-60: rgba(14, 14, 14, 0.60);
  --color-ink-40: rgba(14, 14, 14, 0.40);
  --color-ink-20: rgba(14, 14, 14, 0.20);

  /* Colors — Surfaces */
  --color-surface-primary: #EAD9AE;
  --color-surface-inset: rgba(14, 14, 14, 0.04);

  /* Colors — Borders */
  --color-hairline: rgba(14, 14, 14, 0.35);
  --color-hairline-strong: rgba(14, 14, 14, 0.55);

  /* Colors — Texture */
  --color-paper-grain: rgba(14, 14, 14, 0.06);

  /* Typography — Families */
  --font-script: 'Yellowtail', 'Pinyon Script', 'Brush Script MT', cursive;
  --font-body: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-mono: 'DM Mono', 'IBM Plex Mono', 'Courier Prime', Courier, monospace;

  /* Typography — Sizes */
  --text-script-hero: 160px;
  --text-script-secondary: 96px;
  --text-flanking-italic: 24px;
  --text-body-italic: 20px;
  --text-body-roman: 18px;
  --text-top-metadata: 22px;
  --text-address-footer: 20px;
  --text-small-caption: 14px;
  --text-framework-tag: 16px;

  /* Typography — Weights */
  --weight-script: 400;
  --weight-body: 400;
  --weight-body-medium: 500;
  --weight-mono: 400;

  /* Typography — Line Heights */
  --leading-script: 0.95;
  --leading-flanking: 1.20;
  --leading-body: 1.55;
  --leading-address: 1.40;
  --leading-mono: 1.20;

  /* Typography — Letter Spacing */
  --tracking-script: -2px;
  --tracking-flanking: 0.2px;
  --tracking-mono: 0.5px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-base: 16px;
  --space-small-section: 24px;
  --space-flanking: 40px;
  --space-section: 48px;
  --space-outer: 60px;
  --space-swash: 80px;
  --space-story-safe: 120px;

  /* Illustration Stroke */
  --illustration-stroke-color: #0E0E0E;
  --illustration-stroke-width: 6;
  --illustration-stroke-linecap: round;
  --illustration-stroke-linejoin: round;

  /* Halftone */
  --halftone-dot-color: #0E0E0E;
  --halftone-dot-size: 2px;
  --halftone-dot-spacing: 10px;
}
```

### System Font Fallbacks
- **Script (if Yellowtail fails to load):** `'Pinyon Script', 'Brush Script MT', cursive`
- **Serif (if Fraunces fails to load):** `Georgia, 'Times New Roman', serif`
- **Mono (if DM Mono fails to load):** `'IBM Plex Mono', 'Courier Prime', Courier, monospace`
