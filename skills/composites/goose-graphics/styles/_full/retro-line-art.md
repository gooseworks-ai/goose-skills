# Design Style: Retro Line Art

## 1. Visual Theme & Atmosphere

Retro Line Art is the visual language of a Parisian cocktail-menu poster printed on thick cotton card — the kind of boutique invitation you would slide into an envelope for a speakeasy opening. It borrows from mid-century lounge posters, 1960s cafe signage, and Didone-era fashion-magazine typography, then strips the execution back to two ink colors: a dusty powder blue background and cream-white type-and-line-art floating on top. Every piece of art on the page is drawn as if it came off a single nib pen — thin, continuous, decorative, a little imperfect — and every piece of type is set as if it were being printed in metal on an old proof press. The overall feel is hand-made, boutique, and unapologetically retro without tipping into kitsch.

The color story is deliberately narrow and deliberately desaturated. The powder blue (`#7BA3C6`) is not a sky blue and not a navy — it is a dusty, mid-value, slightly gray-leaning blue that reads as if it were mixed from a jar of ink and a drop of warm water. Cream (`#F5F0E6`) is the second ink — never pure white, always warmed toward bone or parchment — and it is used for every piece of type, every line-art stroke, and every corner label. The restricted two-color treatment is the whole aesthetic: the moment a third ink color appears, the poster stops reading as a vintage menu and starts reading as a modern flyer. The only "third color" allowed is a darker blue-shadow (`#5A84AA`) used exclusively as an offset echo behind a single display letter — the stylized "P" in the poster's massive PARTY word is printed twice, with the back copy offset two or three pixels down-and-right, to simulate a misregistered two-color press run.

The typographic system is a classic Didone-display-italic paired with a massive Didone-display-upright, bookended by a tracked-wide geometric sans for all the small metadata around the edges. A refined italic serif (Cormorant Garamond Italic at weight 500) handles the "script" word at the top of the composition — "Cocktail" — flowing across the page with dramatic entry and exit strokes. Below it, a muscular Didone upright (Playfair Display at weight 900) handles the massive display word — "PARTY" — set so large it fills nearly half the horizontal width of the poster, with one stylized drop-shadow letter providing the single moment of visual imperfection. For every other piece of text on the page — the club name, the date, the entrance fee, the address, the RSVP — a clean geometric sans (DM Sans at weight 500-700) is set in all caps with 1.5px of positive letter-spacing, arranged as four corner-metadata strips that frame the central illustration. The decorative language is just as restricted: a single hand-drawn cocktail glass rendered as a cream line-art SVG fills the lower portion of the canvas, and small sparkle glyphs (✦ ✧ + ×) are scattered around it like tiny stars. That is the entire vocabulary — two colors, three type roles, one illustration, and a handful of sparkles.

**Key Characteristics:**
- Dusty powder blue background (`#7BA3C6`) — desaturated, mid-value, never bright-sky, never navy
- Cream/bone text color (`#F5F0E6`) — never pure white, always warmed toward parchment
- Darker blue shadow-ink (`#5A84AA`) reserved exclusively for offset echo on one display letter
- Cormorant Garamond Italic at weight 500 for the "script" word — the refined Didone-italic display treatment
- Playfair Display at weight 900 for massive upright display words — set at 180-240px
- DM Sans at weights 500-700 for all small metadata — all caps, 1.5-2px positive tracking
- Hand-drawn single-stroke SVG line-art illustrations in cream stroke on blue — no fills, thin 2-2.5px strokes
- Sparkle glyphs (✦ ✧ + ×) at 20-32px scattered as decorative accents, never more than 6 per composition
- Corner metadata strips — three labels arranged in a row (left / center / right) across the top of every slide
- Echo offset shadow on one display letter — achieved with CSS `text-shadow: 4px 4px 0 var(--color-blue-shadow)` or a duplicated absolute-positioned element
- No cards, no borders, no rounded corners — the composition reads as a single flat printed sheet
- Italic script word always overlaps or underlaps the upright display word — the two headline words are intentionally entangled, not stacked cleanly

## 2. Color Palette & Roles

### Primary
- **Powder Blue** (`#7BA3C6`): Primary background. Dusty, slightly gray-leaning mid-blue. The whole poster sits on this surface. Never use a bright or saturated blue in its place.
- **Cream** (`#F5F0E6`): Primary ink color. Used for every piece of type, every line-art stroke, every label. Warmed toward bone/parchment — never pure white.
- **Blue Shadow** (`#5A84AA`): A darker desaturated blue used exclusively for the offset echo behind one display letter. Also usable for very subtle background gradations if needed. Never used for type or illustration strokes.

### Accent
- **Cream Glow** (`#FAF5EB`): A slightly lighter cream for micro-highlights on sparkle glyphs and occasional emphasis. Use sparingly — the composition reads as two-color, not three.
- **Blue Mid** (`#6E9BC0`): An alternate background tone 3-4 steps darker than Powder Blue. Used for format variations where a slightly moodier canvas is wanted (e.g., Story format).
- **Ink Dark** (`#3D5A75`): A deep blue-gray used only for very dense cluster effects (never for text). Reserve for decorative grit.

### Neutral Scale
- **Cream 100** (`#F5F0E6`): Primary ink — all type, all line art.
- **Cream 80** (`rgba(245, 240, 230, 0.80)`): Secondary labels and supporting metadata.
- **Cream 60** (`rgba(245, 240, 230, 0.60)`): Tertiary annotations, slide numbers, footers.
- **Cream 40** (`rgba(245, 240, 230, 0.40)`): Hairline dividers and whisper accents.
- **Cream 20** (`rgba(245, 240, 230, 0.20)`): Only for very subtle decorative grain or dotted pattern overlays.

### Surface & Borders
- **Surface Primary** (`#7BA3C6`): The flat canvas. Never tinted, never gradient-ed except in intentional moments of the Story format.
- **Surface Inset** (`rgba(90, 132, 170, 0.25)`): A very quiet inset panel for rare container treatments. Use almost never — this style is flat.
- **Hairline Cream** (`rgba(245, 240, 230, 0.35)`): The only border treatment allowed. 1px cream hairlines separate metadata strips from the central illustration when needed.
- **Hairline Cream Strong** (`rgba(245, 240, 230, 0.55)`): A slightly heavier 1px cream divider for format-spanning rules.

### Shadow Colors
- **Echo Shadow** (`#5A84AA`): The offset echo shadow — solid color, no blur, used with an offset of 4-6px down-and-right behind one display letter.
- **Soft Blur** (`rgba(61, 90, 117, 0.25)`): A whisper-soft blue shadow at 12px blur for the very rare case you need a hint of depth on a container. Almost never used.
- **Grain Overlay** (`rgba(61, 90, 117, 0.10)`): A tissue-thin blue-gray shadow that can be composited across the canvas as a print-grain effect.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,400;1,700;1,900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Script Display**: `'Cormorant Garamond', 'Playfair Display', Georgia, serif` — used italic, weight 500, for the "Cocktail" word
- **Display**: `'Playfair Display', Georgia, 'Times New Roman', serif` — used upright, weight 900, for the "PARTY" word
- **Body/Metadata**: `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif` — used all caps, weight 500-700, for every piece of small text

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Script Display | Cormorant Garamond Italic | 160px | 500 | 1.00 | -2px | The "Cocktail" script word. Italic is mandatory. Overlaps with Upright Display below. |
| Upright Display | Playfair Display | 240px | 900 | 0.95 | -6px | The massive "PARTY" display word. Upright only. One letter gets the offset echo shadow. |
| Section Heading | Playfair Display | 88px | 900 | 1.00 | -2px | Smaller display role for non-hero slides. Still upright, still all caps. |
| Sub-heading | Cormorant Garamond Italic | 56px | 500 | 1.10 | -0.5px | Secondary italic script for subtitle/intro lines. |
| Metadata Strip | DM Sans | 14px | 600 | 1.25 | 1.8px | Corner labels. All caps. The 1.8px positive tracking is non-negotiable. |
| Metadata Bold | DM Sans | 16px | 700 | 1.20 | 1.5px | Emphasized corner labels — "STARTING AT 08:00PM", "20 OCT". All caps. |
| Body | DM Sans | 18px | 500 | 1.55 | 0.3px | Rare body-text use. Mixed case allowed only when absolutely needed. |
| Big Number | Playfair Display | 120px | 900 | 1.00 | -3px | Big metric display. Same treatment as upright display. |
| Caption | DM Sans | 12px | 500 | 1.30 | 1.5px | Slide numbers, footers, addresses. All caps. |
| CTA Text | DM Sans | 14px | 700 | 1.20 | 2px | All caps CTA — no button chrome, just underlined or flanked by dashes. |

### Principles
- **Two-serif tension, one-sans frame**: The style's identity lives in the clash between Cormorant Garamond Italic (elegant, flowing, script-like) and Playfair Display at weight 900 (muscular, monumental, upright). DM Sans exists only to frame those two serifs with small all-caps metadata — it never carries the emotional weight of the composition.
- **Italic + upright entangled, never stacked**: The script word and the upright display word must visually overlap or tuck into each other. Never set them as two tidy centered lines. The "Cocktail" should flow across the top of "PARTY" with descenders that kiss the tops of the upright letters.
- **All-caps corner metadata is the frame**: Every piece of small text on the canvas is set in all caps with 1.5-2px positive tracking. Mixed case is almost never used. The uniform all-caps treatment is what makes the composition read as a printed poster rather than a web page.
- **One letter gets the echo shadow, never more**: The offset echo shadow is applied to exactly one letter per composition — typically the dominant letter of the display word (the "P" in "PARTY"). Applying it to multiple letters destroys the hand-set-type illusion.
- **Negative tracking on display, positive tracking on metadata**: Display serifs are always tightly tracked (-2 to -6px) to feel confidently set. Metadata sans is always loosely tracked (+1.5 to +2px) to feel like printer's caps-and-small-caps. Never reverse this.
- **Line heights are tight on display, generous on metadata**: Display type runs at 0.95-1.00 line height so upright and italic words can overlap. Metadata runs at 1.20-1.30 to give each small label room to breathe inside its corner.

## 4. Component Patterns

### Corner Metadata Strip (top-of-canvas frame)

Three labels arranged in a row across the top of every slide — typically a left label, a center label, and a right label. This pattern appears on every slide of this style and functions as the visual frame for the central composition.

```html
<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: start; padding: 0 0 48px 0;">
  <div style="text-align: left;">
    <p style="font-family: var(--font-sans); font-size: 16px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cream); margin: 0; line-height: 1.20;">BORCELLE<br>CLUB</p>
  </div>
  <div style="text-align: center;">
    <p style="font-family: var(--font-sans); font-size: 16px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cream); margin: 0; line-height: 1.20;">20 OCT</p>
  </div>
  <div style="text-align: right;">
    <p style="font-family: var(--font-sans); font-size: 16px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cream); margin: 0; line-height: 1.20;">ENTRANCE<br>20$</p>
  </div>
</div>
```

### Headline Block (Script + Echo-Shadow Display)

The signature move — an italic script word flowing above a massive upright display word, with one letter of the display word receiving the offset echo shadow. The script and upright are deliberately entangled via negative top-margin on the upright.

```html
<div style="text-align: center; position: relative;">
  <h1 style="font-family: var(--font-script); font-size: 160px; font-weight: 500; font-style: italic; line-height: 1.00; letter-spacing: -2px; color: var(--color-cream); margin: 0; position: relative; z-index: 2;">Cocktail</h1>
  <h2 style="font-family: var(--font-display); font-size: 240px; font-weight: 900; line-height: 0.95; letter-spacing: -6px; color: var(--color-cream); margin: -60px 0 0 0; position: relative; z-index: 1;">
    <span style="position: relative; display: inline-block;">
      <span style="position: absolute; left: 5px; top: 5px; color: var(--color-blue-shadow); z-index: 0;">P</span>
      <span style="position: relative; z-index: 1;">P</span>
    </span>ARTY
  </h2>
</div>
```

Alternative single-element echo using `text-shadow`:

```html
<h2 style="font-family: var(--font-display); font-size: 240px; font-weight: 900; line-height: 0.95; letter-spacing: -6px; color: var(--color-cream); text-shadow: 5px 5px 0 var(--color-blue-shadow); margin: 0;">PARTY</h2>
```

### Line Art Illustration Slot (inline SVG cocktail glass)

A hand-drawn single-stroke line-art illustration embedded inline as an SVG. Strokes are cream, 2-2.5px wide, no fills. The illustration fills the lower portion of the canvas and is the visual anchor of the composition. The SVG below is a reference cocktail glass — replace the `<path>` data with any hand-drawn line art that matches the brief (wine glass, martini, champagne coupe, lemon wedge, olive, palm frond, etc.).

```html
<div style="display: flex; justify-content: center; align-items: center; padding: 32px 0;">
  <svg viewBox="0 0 400 480" width="340" height="408" xmlns="http://www.w3.org/2000/svg" style="display: block;">
    <g fill="none" stroke="var(--color-cream)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Lemon slice wedge on rim -->
      <circle cx="110" cy="180" r="48"/>
      <line x1="110" y1="132" x2="110" y2="228"/>
      <line x1="62" y1="180" x2="158" y2="180"/>
      <line x1="76" y1="146" x2="144" y2="214"/>
      <line x1="144" y1="146" x2="76" y2="214"/>
      <!-- Coupe glass bowl -->
      <path d="M 60 200 Q 200 360 340 200"/>
      <ellipse cx="200" cy="200" rx="140" ry="18"/>
      <!-- Liquid surface decoration -->
      <path d="M 90 215 Q 200 250 310 215" stroke-dasharray="4 6"/>
      <!-- Stem -->
      <line x1="200" y1="340" x2="200" y2="440"/>
      <!-- Base -->
      <ellipse cx="200" cy="445" rx="70" ry="8"/>
      <line x1="130" y1="445" x2="270" y2="445"/>
    </g>
  </svg>
</div>
```

For other subjects, use the same pattern: `<svg>` with `fill="none"` and `stroke="var(--color-cream)"` at `stroke-width="2.2"`. Always embed inline so the stroke color inherits the theme variable. Never use raster illustrations — always SVG.

### Sparkle Glyph Cluster

Scattered decorative sparkles around the central illustration. Use Unicode glyphs (✦ ✧ + ×) set in Playfair Display or Cormorant Garamond at 20-32px in cream. Absolute-positioned relative to the parent composition.

```html
<div style="position: relative;">
  <span style="position: absolute; top: 40px; right: 80px; font-family: var(--font-display); font-size: 28px; color: var(--color-cream); opacity: 0.9;">✦</span>
  <span style="position: absolute; top: 120px; left: 60px; font-family: var(--font-display); font-size: 20px; color: var(--color-cream); opacity: 0.8;">+</span>
  <span style="position: absolute; top: 200px; right: 140px; font-family: var(--font-display); font-size: 24px; color: var(--color-cream); opacity: 0.85;">✧</span>
  <span style="position: absolute; bottom: 80px; left: 120px; font-family: var(--font-display); font-size: 22px; color: var(--color-cream); opacity: 0.8;">×</span>
  <span style="position: absolute; bottom: 140px; right: 60px; font-family: var(--font-display); font-size: 26px; color: var(--color-cream); opacity: 0.9;">✦</span>
</div>
```

Rules: 4-6 sparkles per composition, never more. Mix the four glyph shapes (no single-shape clusters). Vary the sizes between 18-32px. Keep opacity between 0.75-0.95 so they feel hand-placed, not machine-uniform.

### Bottom Metadata Strip (triple-column footer)

A mirror of the Corner Metadata Strip, placed at the bottom of the canvas. Three labels in a row — typically time/address on the left, venue detail in the center, contact on the right.

```html
<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: end; padding: 48px 0 0 0;">
  <div style="text-align: left;">
    <p style="font-family: var(--font-sans); font-size: 18px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cream); margin: 0 0 8px; line-height: 1.20;">STARTING<br>AT 08:00PM</p>
    <p style="font-family: var(--font-sans); font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cream-80); margin: 0; line-height: 1.30;">123 ANYWHERE ST.<br>ANY CITY ST 12345</p>
  </div>
  <div style="text-align: center;">
    <p style="font-family: var(--font-sans); font-size: 16px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cream); margin: 0; line-height: 1.30;">DRINKS<br>LIVE MUSIC</p>
  </div>
  <div style="text-align: right;">
    <p style="font-family: var(--font-sans); font-size: 16px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cream); margin: 0; line-height: 1.30;">RSVP TO OLIVIA<br>+123-456-7890</p>
  </div>
</div>
```

### Stat Display (Big Number + Italic Caption)

```html
<div style="text-align: center; padding: 40px 24px;">
  <p style="font-family: var(--font-display); font-size: 160px; font-weight: 900; line-height: 1.00; letter-spacing: -4px; color: var(--color-cream); text-shadow: 5px 5px 0 var(--color-blue-shadow); margin: 0 0 12px;">47</p>
  <p style="font-family: var(--font-script); font-size: 42px; font-weight: 500; font-style: italic; line-height: 1.20; color: var(--color-cream); margin: 0 0 16px;">cocktails served</p>
  <p style="font-family: var(--font-sans); font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--color-cream-80); margin: 0;">OPENING NIGHT · 20 OCT</p>
</div>
```

### Quote Block (Italic Script + Attribution)

```html
<div style="padding: 48px 40px; text-align: center;">
  <p style="font-family: var(--font-script); font-size: 56px; font-weight: 500; font-style: italic; line-height: 1.15; color: var(--color-cream); margin: 0 0 32px;">"The martini drinker says more with a raised eyebrow than most people say in a paragraph."</p>
  <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
    <div style="width: 48px; height: 1px; background: var(--color-cream); opacity: 0.6;"></div>
    <p style="font-family: var(--font-sans); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--color-cream); margin: 0;">OLIVIA WILDE</p>
    <div style="width: 48px; height: 1px; background: var(--color-cream); opacity: 0.6;"></div>
  </div>
</div>
```

### CTA Block (No Button Chrome)

The CTA is never a filled button. It is a piece of all-caps cream type flanked by horizontal rules or small sparkles — the composition itself is the CTA.

```html
<div style="text-align: center; padding: 60px 40px;">
  <p style="font-family: var(--font-script); font-size: 72px; font-weight: 500; font-style: italic; line-height: 1.10; color: var(--color-cream); margin: 0 0 32px;">Join us</p>
  <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
    <div style="width: 64px; height: 1px; background: var(--color-cream);"></div>
    <p style="font-family: var(--font-sans); font-size: 16px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-cream); margin: 0;">RSVP TO OLIVIA · +123-456-7890</p>
    <div style="width: 64px; height: 1px; background: var(--color-cream);"></div>
  </div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap — between a sparkle glyph and a metadata label.
- **8px**: Tight gap — between a big number and its caption.
- **12px**: Small gap — between metadata label lines inside a corner strip.
- **16px**: Base gap — between metadata rows.
- **24px**: Medium gap — between sparkle clusters and their anchoring illustration.
- **32px**: Line-art-to-type gap — between the line-art illustration and the nearest type block.
- **48px**: Frame gap — between the corner metadata strip and the main headline.
- **60px**: Outer padding (carousel, poster, infographic).
- **80px**: Outer padding (slides, generous formats).
- **120px**: Outer padding (Story format, generous vertical framing).

### Format Padding
| Format | Dimensions | Outer Padding | Content Max-Width |
|--------|------------|---------------|-------------------|
| Carousel | 1080x1080 | 60px all sides | 960px |
| Infographic | 1080xN | 60px left/right, 80px top/bottom | 960px |
| Slides | 1920x1080 | 80px all sides | 1760px |
| Poster | 1080x1350 | 60px left/right, 80px top/bottom | 960px |
| Story | 1080x1920 | 120px left/right, 60px top/bottom | 840px |

### Alignment & Grid
- **Primary alignment**: Centered for the main headline and illustration. The corner metadata strips use a 3-column grid with left / center / right text alignment.
- **Grid**: The canvas is a single centered column with a 3-column metadata row at top and a 3-column metadata row at bottom. No card grids. No sidebar layouts.
- **Vertical rhythm**: Top metadata strip → 48px gap → headline block → 32px gap → line-art illustration → 48px gap → bottom metadata strip. This rhythm is consistent across every format.
- **Illustration gravity**: The line-art illustration is always the visual anchor. Place it in the lower-center of the canvas, occupying roughly 40-50% of the vertical space.
- **Sparkle placement**: Sparkles are scattered around the illustration, not the type. Never place sparkles on top of or immediately adjacent to a display word — they should feel like they are orbiting the line art.
- **No borders, no cards**: This style has no bordered containers. Every element sits directly on the powder blue canvas.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#7BA3C6` | The entire canvas. This style is 95% flat. |
| Offset Echo (Level 1) | `text-shadow: 5px 5px 0 #5A84AA` | Exactly one display letter per composition. |
| Hairline Divider (Level 2) | `1px solid rgba(245, 240, 230, 0.35)` | The only border treatment. Horizontal dividers between metadata and central composition when needed. |
| Soft Blue Glow (Level 3) | `0 0 24px rgba(90, 132, 170, 0.35)` | Very rare. Only for the center sparkle in a sparkle cluster, to suggest a twinkle. |
| Print Grain (Level 4) | Repeating `radial-gradient(circle, rgba(61, 90, 117, 0.08) 1px, transparent 1.5px) 3px 3px` | Optional tissue-thin noise overlay across the whole canvas. Use to sell the printed-paper illusion. |

### Border Treatments
- **Hairline cream rule**: `1px solid rgba(245, 240, 230, 0.35)` — the only border. Used for horizontal dividers between corner metadata strips and the central illustration on very dense slides. Never used on cards or containers because this style has no cards.
- **Hairline cream rule strong**: `1px solid rgba(245, 240, 230, 0.55)` — a slightly heavier rule for full-width dividers when a stronger separation is needed (e.g., between two sections of an infographic).
- **No container borders**: There are no bordered cards, no rounded rectangles, no panel frames. Every visual structure in this style is achieved through typography, illustration, and whitespace.
- **No shadows on containers**: Containers do not exist. If they did, they would not cast shadows.

### Surface Hierarchy
All depth in this style comes from typography weight and line-art density, not from lighting or shadow. The hierarchy from most prominent to least:
1. **Upright Display Word** (`Playfair Display 900`, cream, one letter with echo shadow) — the single strongest element on any composition.
2. **Script Display Word** (`Cormorant Garamond Italic 500`, cream) — the second strongest. Entangled with the display word above it.
3. **Line-art Illustration** (cream stroke on blue, 2.2px) — the visual anchor, but subordinate to type.
4. **Corner Metadata** (DM Sans all-caps, cream, 14-18px) — the frame that defines the edges of the composition.
5. **Sparkle Glyphs** (20-32px cream, 0.75-0.95 opacity) — the atmospheric dressing. Whisper-level, never dominant.

## 7. Do's and Don'ts

### Do
- Use the powder blue background (`#7BA3C6`) for every canvas. This is the single most identifiable element of the style.
- Use cream (`#F5F0E6`) — never pure white — for every piece of type and every illustration stroke.
- Set the "script" display word in Cormorant Garamond Italic at weight 500, and set the "upright" display word in Playfair Display at weight 900. The two-serif tension is the identity.
- Entangle the script word and the upright display word with negative margins — they should visually overlap, never stack cleanly.
- Apply the offset echo shadow (`text-shadow: 5px 5px 0 var(--color-blue-shadow)`) to exactly one letter per composition — typically the dominant letter of the display word.
- Embed line-art illustrations as inline SVG with `fill="none"`, `stroke="var(--color-cream)"`, and `stroke-width="2.2"` — always hand-drawn, always single-stroke, always cream on blue.
- Use three-column corner metadata strips (top-of-canvas and bottom-of-canvas) to frame every composition. This is the structural signature.
- Set every piece of small text in all caps with 1.5-2px positive letter-spacing using DM Sans at weight 600-700.
- Scatter 4-6 sparkle glyphs (✦ ✧ + ×) around the line-art illustration, mixing shapes and varying sizes between 18-32px.
- Leave generous whitespace around the central illustration. This style is quiet — let the blue canvas breathe.
- Use negative tracking (-2 to -6px) on display type and positive tracking (+1.5 to +2px) on metadata sans. Never reverse this rule.

### Don't
- Don't use pure white (`#ffffff`) anywhere — always use cream (`#F5F0E6`). Pure white destroys the vintage-print illusion.
- Don't use a bright sky blue or a navy blue — only the specific dusty `#7BA3C6` works. Oversaturated blues make the composition look like a modern flyer.
- Don't use filled SVG illustrations — strokes only. Fills turn the line art into clip art.
- Don't apply the echo shadow to more than one letter per composition. Multiple echoes look like a video-game glitch.
- Don't use bordered cards, rounded rectangles, or container backgrounds. This style is flat and every element sits directly on the canvas.
- Don't use mixed case for metadata. All small text is always all caps with positive tracking.
- Don't stack the script word and the upright word as two tidy centered lines — they must visually overlap.
- Don't use modern geometric sans (Inter, Space Grotesk, etc.) for display — only Cormorant Garamond Italic and Playfair Display work for headlines.
- Don't use a third color beyond powder blue, cream, and blue-shadow. The restricted two-color treatment is the entire identity.
- Don't use more than 6 sparkles per composition. Sparkle overcrowding destroys the hand-placed feel.
- Don't apply drop shadows with blur radius — the offset echo is always solid, zero blur, zero spread.
- Don't use raster illustrations, photography, or icon sets. Only hand-drawn inline SVG line art belongs in this style.
- Don't add decorative UI elements like dot grids, progress bars, or swipe indicators. The corner metadata strips are the only frame this composition needs.

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
- **Typography scale**: Script Display scales down to 120px. Upright Display scales down to 180px. Section Heading scales to 72px. Metadata stays at 14-16px.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Corner metadata strip at top (3 labels). Script + upright headline entangled in the center (top half). Line-art illustration in the lower half. Bottom metadata strip. 4-6 sparkles scattered around the illustration.
- **Content slides**: Top metadata strip with the slide's topic label as the center cell. Main content in the middle — typically a script-italic phrase followed by a single upright display word. Line-art decoration or sparkles at the bottom.
- **Card slides**: This style does not use card grids. For a "multi-item" slide, use a vertical list of script-italic phrases with a single upright display word as the title.
- **Swipe indicator**: Tiny cream hairlines at the bottom center — 3-5 short dashes (24x1px each, 8px gap), with the active dash slightly thicker. No dots.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Script Display at 140px, Upright Display at 200-220px for the hero section. Section headings at 88px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Section spacing**: 80px vertical gap between sections. Use 1px cream hairline dividers (`rgba(245, 240, 230, 0.35)`) only between very dense sections.
- **Vertical rhythm**: Each section has its own corner metadata strip at the top, its own centered headline, and its own supporting line-art illustration. Treat every section as a mini-poster.
- **Footer**: Bottom metadata strip with a closing all-caps line and a script-italic sign-off above it.

### Slides (1920x1080px)
- **Typography scale up**: Script Display at 180px, Upright Display at 280-300px. Section Heading at 120px. Metadata at 18-20px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Centered composition — corner metadata strip at top, entangled script+upright headline in the center-left, line-art illustration in the center-right, sparkles scattered between. The 16:9 ratio invites a left/right split rather than a strict top/bottom split.
- **Title slides**: Top metadata strip. Massive centered headline with the upright word receiving the echo shadow. Line-art illustration to the right of or behind the headline. Bottom metadata strip.
- **Content slides**: Smaller section heading (top-left). Script-italic supporting line below. Line-art illustration anchored to the right side. Corner metadata continues to frame.
- **CTA slides**: Script "Join us" at top center. Single centered line-art illustration. Bottom metadata strip with the RSVP line flanked by cream hairline rules.

### Poster (1080x1350px)
- **Typography**: Script Display at 140px, Upright Display at 220-240px. Section Heading at 100px. Metadata at 16-18px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top zone (120px) for the 3-column corner metadata strip. Upper-middle zone for the entangled script + upright headline. Lower-middle zone for the line-art illustration (largest and most prominent here — the illustration takes 45-50% of the canvas height). Bottom zone (140px) for the bottom metadata strip.
- **Vertical flow**: Top metadata → 48px → headline → 32px → illustration → 48px → bottom metadata.
- **CTA placement**: Bottom metadata's right cell is typically the RSVP / contact line. No separate CTA button.

### Story (1080x1920px)
- **Dimensions**: 1080 wide by 1920 tall — vertical 9:16 format for mobile stories.
- **Padding**: 120px left/right, 60px top/bottom. The 120px horizontal padding is generous to give the vertical composition room to breathe.
- **Typography scale up**: Hero is roughly 30% larger than carousel. Script Display at 160px, Upright Display at 240px (matching the carousel hero dimensions proportionally scaled up). Section Heading at 100px. Metadata at 16-18px.
- **Composition**: The vertical ratio demands a single-column, top-to-bottom flow. Top zone (240px) for the 3-column corner metadata strip. Upper-middle zone (500-600px) for the entangled script + upright headline — treat this as the most dramatic moment of the whole story. Middle zone (700-800px) for the line-art illustration, centered and larger than in any other format — this is the hero. Lower zone (300px) for the bottom metadata strip.
- **Illustration sizing**: The line-art illustration in Story format is roughly 1.3x larger than in the carousel hero (matching the ~30% upscale note). Aim for an SVG rendered at 640-720px wide inside the 840px content column.
- **Sparkle placement**: 5-7 sparkles scattered down the full length of the composition — one cluster near the headline, one cluster around the illustration, one tiny sparkle near the bottom metadata.
- **Bottom metadata**: The 3-column footer remains but is slightly more compact. The Story format benefits from a cream hairline rule (`1px solid rgba(245, 240, 230, 0.35)`) above the bottom metadata strip to define the footer zone.
- **Mobile-first considerations**: Avoid elements in the extreme top 120px and extreme bottom 240px of the canvas (these zones are often cropped or covered by platform UI on Instagram/TikTok Stories).

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Powder Blue | `#7BA3C6` | Primary background canvas |
| Cream | `#F5F0E6` | Primary ink — all type, all line art |
| Blue Shadow | `#5A84AA` | Offset echo shadow on one display letter |
| Cream Glow | `#FAF5EB` | Micro-highlights on sparkles |
| Blue Mid | `#6E9BC0` | Alternate canvas for Story format |
| Ink Dark | `#3D5A75` | Dense decorative grit only |
| Cream 80 | `rgba(245, 240, 230, 0.80)` | Secondary metadata labels |
| Cream 60 | `rgba(245, 240, 230, 0.60)` | Tertiary annotations, slide numbers |
| Cream 40 | `rgba(245, 240, 230, 0.40)` | Hairline dividers |
| Hairline Cream | `rgba(245, 240, 230, 0.35)` | The only allowed border |

### Font Declarations

```css
/* Script Display (italic serif — "Cocktail") */
font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
font-style: italic;
font-weight: 500;

/* Upright Display (massive Didone — "PARTY") */
font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
font-weight: 900;

/* Metadata Sans (corner labels, all caps) */
font-family: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
font-weight: 600;
letter-spacing: 1.8px;
text-transform: uppercase;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,400;1,700;1,900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-bg: #7BA3C6;
  --color-cream: #F5F0E6;
  --color-blue-shadow: #5A84AA;

  /* Colors -- Accent */
  --color-cream-glow: #FAF5EB;
  --color-blue-mid: #6E9BC0;
  --color-ink-dark: #3D5A75;

  /* Colors -- Neutral Scale (cream alpha tones) */
  --color-cream-100: #F5F0E6;
  --color-cream-80: rgba(245, 240, 230, 0.80);
  --color-cream-60: rgba(245, 240, 230, 0.60);
  --color-cream-40: rgba(245, 240, 230, 0.40);
  --color-cream-20: rgba(245, 240, 230, 0.20);

  /* Colors -- Surfaces */
  --color-surface-primary: #7BA3C6;
  --color-surface-inset: rgba(90, 132, 170, 0.25);

  /* Colors -- Borders */
  --color-hairline: rgba(245, 240, 230, 0.35);
  --color-hairline-strong: rgba(245, 240, 230, 0.55);

  /* Colors -- Shadows */
  --shadow-echo: #5A84AA;
  --shadow-soft-blur: 0 0 24px rgba(90, 132, 170, 0.35);
  --shadow-grain: rgba(61, 90, 117, 0.10);

  /* Typography -- Families */
  --font-script: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-sans: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-script-display: 160px;
  --text-upright-display: 240px;
  --text-section-heading: 88px;
  --text-sub-heading: 56px;
  --text-metadata-bold: 16px;
  --text-metadata-strip: 14px;
  --text-body: 18px;
  --text-big-number: 120px;
  --text-caption: 12px;
  --text-cta: 14px;

  /* Typography -- Weights */
  --weight-script: 500;
  --weight-display: 900;
  --weight-metadata: 600;
  --weight-metadata-bold: 700;
  --weight-body: 500;

  /* Typography -- Line Heights */
  --leading-display: 0.95;
  --leading-script: 1.00;
  --leading-heading: 1.00;
  --leading-metadata: 1.20;
  --leading-body: 1.55;
  --leading-caption: 1.30;

  /* Typography -- Tracking */
  --track-display: -6px;
  --track-script: -2px;
  --track-metadata: 1.8px;
  --track-metadata-bold: 1.5px;
  --track-cta: 2px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-art-gap: 32px;
  --space-frame: 48px;
  --space-outer-carousel: 60px;
  --space-outer-slides: 80px;
  --space-outer-story: 120px;

  /* Effects */
  --echo-offset: 5px 5px 0 var(--color-blue-shadow);
  --illustration-stroke-width: 2.2px;
  --illustration-stroke-color: var(--color-cream);
}
```

### System Font Fallbacks
- **Script (if Cormorant Garamond fails to load):** `'Playfair Display', Georgia, 'Times New Roman', serif`
- **Display (if Playfair Display fails to load):** `Georgia, 'Times New Roman', serif`
- **Sans (if DM Sans fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
