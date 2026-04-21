# Design Style: Archive Fashion

## 1. Visual Theme & Atmosphere

Archive Fashion is the design language of a curated boutique catalog -- the visual equivalent of a mailed lookbook from a quiet Parisian concept store that happens to be running an end-of-season sale. Inspired by editorial fashion catalogs, vintage department store mailers, and the minimal-but-warm aesthetic of independent fashion labels, this style frames a photographic hero inside a stone-beige paper border and stops the scroll with exactly one tilted pink sticker in the corner. The stone background (`#E6DCC8`) is not white and not cream -- it is the muted, slightly dusty tone of raw linen, unbleached card stock, or the matte paper used in high-end catalogs. It feels tactile, physical, mailed.

The typography layers three distinct voices. **Cormorant Garamond** handles the small italic "Galerie" wordmark at the top of the frame -- thin, refined, almost a whisper, the way a legacy brand letterhead signs itself. **Inter** at weight 700 carries the main catalog headline ("ARCHIVE DESIGN SALE") in a medium-tall sans that feels confident but never loud, stacked on two lines and centered like a department store banner. **Caveat**, the handwritten italic script, lives exclusively on the tilted pink sticker -- it is the personal note scrawled over a printed catalog, the Post-it stuck to a page in the mailroom. The script is intimate; the sans is the brand; the italic serif is the heritage. Together they tell a story that the photo alone cannot: this is vintage, this is curated, this is on sale right now.

The signature move is the **tilted candy-pink sticker** -- a speech-bubble or price-tag shape (`#F4B8D4`) rotated about -8 degrees in the bottom-left corner of the composition, with a curved inner border and a soft drop shadow so it reads as an object stuck onto the catalog page rather than rendered into it. It is the ONE decorative element the style permits. Everything else is quiet. The stone frame insets the photograph with a generous ~50px margin all around, and the photograph itself lives in a darker brown/taupe environment that keeps the composition warm and enveloping. No gradients, no icons, no flourishes -- just a photographic frame, centered type, and the one tilted pink note.

**Key Characteristics:**
- Stone beige (`#E6DCC8`) as the dominant outer frame -- warm, unbleached, physical
- Deep taupe brown (`#4A352A`) as the photographic environment inside the frame
- Near-black (`#1A1410`) for all primary text -- never pure black
- Candy pink (`#F4B8D4`) reserved exclusively for the sticker -- one use per composition
- Cormorant Garamond italic 400-500 for the small "Galerie"-style wordmark
- Inter 700 at 44px+ for the stacked catalog headline, centered, 2 lines
- Cormorant Garamond uppercase tracked caps for dates and small labels
- Caveat handwritten italic for sticker copy only -- never for headlines
- Photo inset inside the stone frame with a consistent ~50px all-around margin
- Tilted pink sticker rotated -5 to -10deg in the bottom-left corner, one per composition
- No gradients, no icons, no background patterns -- pure editorial calm
- Soft drop shadow on the sticker only, ~4px y-offset, 12px blur, pink-tinted

## 2. Color Palette & Roles

### Primary
- **Stone Beige** (`#E6DCC8`): Primary outer frame background. The raw linen / unbleached card stock tone of a premium mailed catalog.
- **Near-Black** (`#1A1410`): Primary text color. Deep warm near-black tuned to the stone background, never pure black.
- **Taupe Brown** (`#4A352A`): Inset photo environment. The darker brown/taupe surround that cradles the hero photograph.

### Accent
- **Candy Pink** (`#F4B8D4`): The sticker fill. Used exclusively for the single tilted pink sticker element -- never as a general accent.
- **Deep Pink Ink** (`#8B3A5C`): Text color for sticker copy when contrast is needed -- a muted rose ink that reads on the candy-pink fill.

### Neutral Scale
- **Stone Deeper** (`#D8C9B0`): Slightly darker stone for subtle borders, dividers, and secondary surfaces.
- **Stone Lighter** (`#EFE6D6`): Slightly lighter stone for inset highlights inside the frame.
- **Warm Brown** (`#6B4C3B`): Mid-tone warm brown, used for secondary text within photo environments.
- **Muted Text** (`#7A6B5D`): Metadata, subtle labels inside the stone frame.
- **Ink Trace** (`rgba(26,20,16,0.45)`): Low-contrast supporting text.
- **Divider Rule** (`rgba(26,20,16,0.12)`): Hairline dividers on the stone surface.

### Surface & Borders
- **Surface Stone** (`#E6DCC8`): The outer frame canvas.
- **Surface Photo Frame** (`#4A352A`): The inset photo container background.
- **Surface Sticker** (`#F4B8D4`): The candy-pink sticker fill.
- **Border Hairline** (`rgba(26,20,16,0.12)`): Quietest separator for labels and dates.
- **Border Sticker Inner** (`rgba(139,58,92,0.35)`): The inner curved rose line running just inside the sticker edge.
- **Border Sticker Outer** (`rgba(26,20,16,0.06)`): Barely-there outer pink border definition.

### Shadow Colors
- **Shadow Whisper** (`rgba(74,53,42,0.06)`): Ambient, for the photo inset subtle lift.
- **Shadow Sticker** (`rgba(139,58,92,0.18)`): Pink-tinted drop shadow beneath the tilted sticker.
- **Shadow Deep** (`rgba(26,20,16,0.14)`): Medium depth for featured sticker hover states.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Inter:wght@400;500;600;700;800&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Wordmark (Galerie logo)**: `'Cormorant Garamond', Georgia, 'Times New Roman', serif` (italic 500)
- **Display (catalog headline)**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Label (dates, tracked caps)**: `'Cormorant Garamond', Georgia, 'Times New Roman', serif` (uppercase 500, wide tracking)
- **Sticker script**: `'Caveat', 'Brush Script MT', cursive`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Wordmark | Cormorant Garamond | 28px | 500 italic | 1.0 | 0.5px | The small "Galerie" logo at top center |
| Display Hero | Inter | 72px | 700 | 1.05 | -1.5px | Catalog headline, stacked on 2 lines |
| Display (1:1) | Inter | 56px | 700 | 1.05 | -1px | Same headline scaled to square formats |
| Tracked Caps Date | Cormorant Garamond | 14px | 500 | 1.2 | 2.5px | "FEBRUARY 13 - 16" small uppercase |
| Section Heading | Inter | 32px | 600 | 1.15 | -0.5px | Inside-frame secondary headings |
| Body Large | Inter | 20px | 500 | 1.55 | 0px | Supporting paragraphs |
| Body | Inter | 17px | 500 | 1.55 | 0px | Standard body text |
| Small / Caption | Inter | 13px | 500 | 1.45 | 0.3px | Metadata, attributions |
| Sticker Headline | Caveat | 32px | 700 | 1.1 | 0px | "SPECIAL OFFER" on the tilted sticker |
| Sticker Body | Caveat | 20px | 500 | 1.25 | 0px | Promo code + terms handwritten on sticker |
| Sticker Foot | Caveat | 16px | 600 | 1.2 | 0.5px | "ENDS JUNE 10TH, 12PM EST" |

### Principles
- **Three-voice layering**: Thin italic serif (heritage wordmark) + bold sans (catalog headline) + handwritten script (personal note). Never collapse any two into one voice.
- **Centered catalog header**: The top third of any composition stacks the wordmark, the 2-line sans headline, and the tracked-caps date, all center-aligned. This is the catalog masthead pattern -- do not left-align it.
- **Tracked caps for dates only**: Dates, editions, and small labels use Cormorant Garamond uppercase with ~2.5px tracking. Never use this treatment for body text.
- **Caveat stays on the sticker**: The handwritten Caveat font appears ONLY inside the tilted pink sticker. Using it elsewhere breaks the spell.
- **Bold sans at scale**: The main catalog headline is always Inter 700 at 44-72px depending on format, stacked across 2 lines, centered, with slightly negative letter-spacing for density.
- **No italic sans**: Italic treatment belongs to Cormorant Garamond (wordmark, dates) and Caveat (sticker). Inter is never italicized.

## 4. Component Patterns

### Stone Frame Container (the core structural component)

```html
<div style="background-color: var(--color-stone); padding: 50px; width: 100%; max-width: 1080px; aspect-ratio: 1 / 1; position: relative; font-family: var(--font-body);">
  <!-- Inset photo container -->
  <div style="position: absolute; inset: 50px; background-color: var(--color-taupe); overflow: hidden;">
    <!-- photo or content -->
  </div>
  <!-- Centered catalog header overlay sits above the inset, in the stone band -->
  <div style="position: relative; z-index: 2; text-align: center; padding: 30px 40px 0;">
    <!-- wordmark / headline / date stack goes here -->
  </div>
</div>
```

### Centered Catalog Header

```html
<div style="text-align: center; padding: 20px 40px 36px;">
  <div style="font-family: var(--font-display-serif); font-size: 28px; font-weight: 500; font-style: italic; color: var(--color-near-black); letter-spacing: 0.5px; line-height: 1.0; margin: 0 0 24px;">Galerie</div>
  <h1 style="font-family: var(--font-body); font-size: 56px; font-weight: 700; line-height: 1.05; letter-spacing: -1px; color: var(--color-near-black); margin: 0 0 18px; text-transform: uppercase;">ARCHIVE<br>DESIGN SALE</h1>
  <p style="font-family: var(--font-display-serif); font-size: 14px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-near-black); margin: 0;">FEBRUARY 13 - 16</p>
</div>
```

### Inset Brown Photo Container

```html
<div style="position: relative; width: 100%; aspect-ratio: 1 / 1; background-color: var(--color-stone); padding: 50px;">
  <div style="position: absolute; inset: 50px; background-color: var(--color-taupe); overflow: hidden; box-shadow: var(--shadow-photo);">
    <img src="hero.jpg" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
  </div>
</div>
```

### Tilted Pink Sticker (the signature move)

```html
<div style="position: absolute; left: 70px; bottom: 90px; transform: rotate(-8deg); background-color: var(--color-pink); padding: 26px 36px; border-radius: 120px 140px 110px 130px / 90px 100px 80px 110px; box-shadow: 0 8px 24px rgba(139,58,92,0.18), 0 2px 6px rgba(26,20,16,0.08); text-align: center; max-width: 260px; z-index: 10; font-family: var(--font-script);">
  <!-- Inner curved rose border to suggest double-line sticker -->
  <div style="position: absolute; inset: 8px; border: 1.5px solid rgba(139,58,92,0.35); border-radius: 110px 130px 100px 120px / 82px 92px 72px 100px; pointer-events: none;"></div>
  <div style="position: relative;">
    <p style="font-family: var(--font-script); font-size: 28px; font-weight: 700; line-height: 1.05; color: var(--color-near-black); margin: 0 0 10px; font-style: italic;">SPECIAL OFFER</p>
    <p style="font-family: var(--font-script); font-size: 18px; font-weight: 500; line-height: 1.25; color: var(--color-near-black); margin: 0 0 4px; font-style: italic;">Use code <span style="text-decoration: underline;">DESIGN20</span></p>
    <p style="font-family: var(--font-script); font-size: 18px; font-weight: 500; line-height: 1.25; color: var(--color-near-black); margin: 0 0 12px; font-style: italic;">at checkout for 20% off</p>
    <p style="font-family: var(--font-script); font-size: 14px; font-weight: 600; line-height: 1.2; letter-spacing: 0.3px; color: var(--color-near-black); margin: 0; font-style: italic;">ENDS JUNE 10TH, 12PM EST</p>
  </div>
</div>
```

### Numbered Item (inside the stone frame for multi-card compositions)

```html
<div style="padding: 24px 0; border-bottom: 1px solid var(--color-border-hairline);">
  <p style="font-family: var(--font-display-serif); font-size: 13px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-muted-text); margin: 0 0 10px;">EDITION 01</p>
  <h3 style="font-family: var(--font-body); font-size: 28px; font-weight: 700; line-height: 1.15; letter-spacing: -0.5px; color: var(--color-near-black); margin: 0;">The Sweater, Reimagined</h3>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 32px; background-color: var(--color-stone-lighter); border: 1px solid var(--color-border-hairline);">
  <p style="font-family: var(--font-body); font-size: 64px; font-weight: 700; line-height: 1.0; letter-spacing: -2px; color: var(--color-near-black); margin: 0 0 12px;">20%</p>
  <p style="font-family: var(--font-display-serif); font-size: 13px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-near-black); margin: 0;">OFF ARCHIVE PIECES</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
  <div style="background-color: var(--color-taupe); aspect-ratio: 3 / 4; position: relative;">
    <div style="position: absolute; bottom: 24px; left: 24px; right: 24px;">
      <p style="font-family: var(--font-display-serif); font-size: 12px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--color-stone); margin: 0 0 6px;">COLLECTION I</p>
      <h3 style="font-family: var(--font-body); font-size: 22px; font-weight: 700; line-height: 1.2; color: var(--color-stone); margin: 0;">Winter Archive</h3>
    </div>
  </div>
  <div style="background-color: var(--color-taupe); aspect-ratio: 3 / 4; position: relative;">
    <div style="position: absolute; bottom: 24px; left: 24px; right: 24px;">
      <p style="font-family: var(--font-display-serif); font-size: 12px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--color-stone); margin: 0 0 6px;">COLLECTION II</p>
      <h3 style="font-family: var(--font-body); font-size: 22px; font-weight: 700; line-height: 1.2; color: var(--color-stone); margin: 0;">Atelier Edit</h3>
    </div>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 40px 50px; background-color: var(--color-stone-lighter); border-left: 2px solid var(--color-near-black);">
  <p style="font-family: var(--font-display-serif); font-size: 28px; font-weight: 500; font-style: italic; line-height: 1.35; color: var(--color-near-black); margin: 0 0 20px;">"Every piece tells a story the season almost forgot."</p>
  <p style="font-family: var(--font-display-serif); font-size: 12px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-muted-text); margin: 0;">THE GALERIE EDITORS</p>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 48px 40px; position: relative;">
  <p style="font-family: var(--font-display-serif); font-size: 13px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-near-black); margin: 0 0 20px;">LIMITED RELEASE</p>
  <h2 style="font-family: var(--font-body); font-size: 48px; font-weight: 700; line-height: 1.05; letter-spacing: -1px; color: var(--color-near-black); margin: 0 0 32px; text-transform: uppercase;">Shop<br>The Archive</h2>
  <a style="display: inline-block; background: var(--color-near-black); color: var(--color-stone); font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 18px 44px; border-radius: 0;">Enter Galerie</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- inside tracked-caps labels.
- **8px**: Tight gap -- between wordmark baseline and first hairline.
- **12px**: Small gap -- between headline lines and subheadings.
- **18px**: Stack gap -- between headline and tracked-caps date below.
- **24px**: Header internal -- between wordmark and main headline.
- **32px**: Section internal -- inside the stone frame between content blocks.
- **40px**: Grid gap -- between paired photo cards in comparison layouts.
- **50px**: Frame inset -- the signature stone-to-photo margin (the core structural unit).
- **80px**: Section divider -- between major vertical blocks on taller formats.

### Format Padding
| Format | Outer Stone Frame | Inner Photo Inset | Content Max-Width |
|--------|------------------|-------------------|-------------------|
| Carousel (1080x1080) | 50px all sides | 50px additional | 980px |
| Infographic (1080xN) | 60px L/R, 80px T/B | 50px additional | 960px |
| Slides (1920x1080) | 80px all sides | 60px additional | 1760px |
| Poster (1080x1350) | 60px L/R, 80px T/B | 50px additional | 960px |
| Story (1080x1920) | 60px L/R, 120px T/B | 50px additional | 960px |

### Alignment & Grid
- **Primary alignment**: Center-aligned for catalog headers, wordmark, and date labels. Left-aligned inside secondary content cards only.
- **Frame inset rule**: The photo container is always inset from the stone frame by ~50px on all sides. This margin is non-negotiable -- it is the visual signature that makes the composition feel like a mailed catalog page.
- **Sticker placement**: Bottom-left corner, with roughly 60-80px offset from the stone frame's inner photo edge. Always one sticker, never two, always rotated -5 to -10deg.
- **Vertical rhythm**: Top third is the catalog header band (in stone). Middle + bottom two-thirds is the inset photo environment. The sticker straddles the bottom-left edge between the two.
- **Content gravity**: Heavy top-center (catalog header), heavy bottom-left (sticker). The rest is photo quiet.
- **No grid patterns**: No dot grids, no stripes, no decorative background textures. The stone canvas is the only texture.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, stone `#E6DCC8` | Outer frame canvas |
| Photo Inset (Level 1) | `inset 0 1px 2px rgba(26,20,16,0.04)` + taupe bg | The darker photo container |
| Sticker Rest (Level 2) | `0 8px 24px rgba(139,58,92,0.18), 0 2px 6px rgba(26,20,16,0.08)` | The tilted pink sticker (default) |
| Sticker Lifted (Level 3) | `0 14px 36px rgba(139,58,92,0.24), 0 3px 8px rgba(26,20,16,0.12)` | Hover / featured state for the sticker |
| Overlay (Level 4) | `0 24px 56px rgba(26,20,16,0.22)` | Modals and overlays (rare) |

### Border Treatments
- **Hairline divider**: `1px solid rgba(26,20,16,0.12)` -- used beneath catalog headers and between list items inside the frame.
- **Photo frame border**: No explicit border -- the color contrast between stone beige and taupe brown IS the border.
- **Sticker outer shape**: Asymmetric `border-radius` like `120px 140px 110px 130px / 90px 100px 80px 110px` to suggest a hand-cut speech bubble rather than a perfect ellipse.
- **Sticker inner rose line**: `1.5px solid rgba(139,58,92,0.35)` positioned 8px inside the sticker shape with a matching asymmetric radius -- this is the double-line detail that sells the sticker illusion.
- **CTA button border**: None. CTAs are solid near-black blocks with no border-radius.

### Surface Hierarchy
1. **Stone Frame** (`#E6DCC8`) -- the outermost canvas, the paper itself.
2. **Photo Environment** (`#4A352A`) -- the inset taupe container, warmer and recessed.
3. **Photo Content** -- the actual imagery, living inside the taupe container.
4. **Sticker** (`#F4B8D4`) -- the singular raised element, tilted and drop-shadowed, breaking the frame.

## 7. Do's and Don'ts

### Do
- Use stone beige (`#E6DCC8`) as the outer frame color on every composition -- it is the visual signature of the style.
- Inset the photo with a generous ~50px margin all around -- the stone band is what makes this feel like a catalog, not a poster.
- Use the tilted pink sticker (`#F4B8D4`) as the ONE decorative focal point -- rotate it -5 to -10deg in the bottom-left corner.
- Use Caveat handwritten italic for sticker copy -- it is the personal-note voice that counters the formal catalog header.
- Use Cormorant Garamond italic at 28px for the small "Galerie"-style wordmark at top center.
- Use Inter 700 at 44-72px for the main catalog headline, stacked on 2 lines, centered.
- Use tracked caps (Cormorant Garamond, 2.5px letter-spacing, uppercase) for dates and small labels like "FEBRUARY 13 - 16".
- Add a pink-tinted drop shadow (`0 8px 24px rgba(139,58,92,0.18)`) beneath the sticker so it reads as a physical object stuck to the page.
- Use an asymmetric `border-radius` on the sticker to suggest a hand-cut speech bubble rather than a perfect ellipse.
- Keep the photo environment warm and dark (taupe brown `#4A352A`) -- cool backgrounds break the catalog mood.
- Leave the stone frame empty except for the catalog header and the sticker -- silence is part of the style.

### Don't
- Don't center photos edge-to-edge -- always inset them from the stone frame with the ~50px margin.
- Don't use more than 1 sticker per composition -- the singular pink note is the scroll-stopper, two stickers dilute it.
- Don't straighten the sticker -- the -8deg tilt IS the personality. A rotation of 0deg is dead on arrival.
- Don't use Caveat anywhere except on the sticker -- it belongs to the handwritten note voice and nowhere else.
- Don't use pure white (`#FFFFFF`) or pure black (`#000000`) -- always use stone (`#E6DCC8`) and warm near-black (`#1A1410`).
- Don't use rounded corners on CTA buttons or cards -- this style is editorial and flat-cornered except for the sticker.
- Don't use Inter italic for anything -- italic belongs to Cormorant Garamond (heritage) and Caveat (handwritten).
- Don't add dot grids, stripes, gradients, icons, or decorative patterns -- the stone canvas is the only texture.
- Don't color the catalog headline anything but near-black (`#1A1410`) -- the pink stays on the sticker.
- Don't stack more than 2 lines in the main headline -- the catalog banner is always 2 lines, centered.
- Don't place the sticker anywhere except bottom-left -- bottom-right, top-left, and top-right all break the convention.
- Don't use cool or blue-tinted photography -- source warm, brown, stone-friendly imagery to match the palette.

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
- **Typography scale**: Display Hero becomes 56px Inter 700 (from 72px). Wordmark stays 28px Cormorant Garamond italic. Tracked date stays 14px. Sticker headline stays Caveat 28-32px.
- **Frame**: 50px outer stone frame padding. Photo container is inset with an additional 50px margin, leaving an inner photo area of approximately 880x880px.
- **Cover slide**: Stone frame at 50px. Top ~30% of the frame is the catalog header (wordmark + stacked headline + tracked date). Bottom ~70% is the inset taupe photo container. Pink sticker rotated -8deg sits in the bottom-left, approximately 70px from the left edge and 90px from the bottom.
- **Content slides**: Same stone frame. Replace the photo container with a stone-lighter content card holding numbered items, stats, or grid layouts. Omit the sticker on purely informational slides -- it is reserved for hero/cover and promo slides.
- **Promo slide**: Always includes the tilted pink sticker, always with Caveat script copy, always in the bottom-left.

### Infographic (1080px wide, variable height)
- **Typography**: Full scale -- Display Hero at 72px, Section Heading at 48px. Wordmark at 32px for the masthead.
- **Padding**: 60px left/right, 80px top/bottom outer. Inner photo / content zones maintain the 50px inset rule.
- **Masthead**: Catalog header stacks at the top (wordmark + 2-line headline + tracked date) with a hairline divider below.
- **Vertical rhythm**: Alternate between inset photo sections (taupe) and stone-lighter content cards. 80px vertical gaps between sections.
- **Sticker**: Exactly one sticker per infographic, placed beside the hero photo zone in the top third of the layout.
- **Footer**: Tracked-caps label, hairline divider, small Cormorant Garamond italic sign-off.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 96px Inter 700. Section Heading at 56px. Wordmark at 36px Cormorant Garamond italic. Tracked date at 16px with 3px letter-spacing.
- **Padding**: 80px outer stone frame. Photo inset at 60-80px additional.
- **Layout**: Horizontal split -- left 40% stone band with centered catalog header; right 60% inset taupe photo container. Sticker rotated -8deg sits on the seam between the two bands, in the bottom-left of the photo zone.
- **Content slides**: Two-column -- left column for catalog header + tracked caps + numbered items, right column for photo or data visualization in the taupe frame.
- **CTA slide**: Centered catalog header treatment, no sticker, dark near-black pill button with Inter 600 tracked caps label.

### Poster (1080x1350px)
- **Typography**: Display Hero at 64px Inter 700. Wordmark at 30px Cormorant Garamond italic. Tracked date at 14px.
- **Padding**: 60px left/right, 80px top/bottom outer stone frame. Photo inset at 50px additional.
- **Composition**: Top ~25% for catalog header (wordmark, stacked headline, tracked date). Middle ~60% for the inset taupe photo container. Bottom ~15% for secondary tracked-caps label or small CTA.
- **Sticker placement**: Bottom-left corner of the photo zone, rotated -8deg, overlapping the photo edge into the bottom stone band.
- **Vertical flow**: Reads top-to-bottom -- catalog masthead, photo hero, tracked-caps footer.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 80px Inter 700 (slightly larger than Carousel 56px). Wordmark at 34px Cormorant Garamond italic. Tracked date at 15px with 3px letter-spacing. Sticker copy: Caveat 36px for the headline, Caveat 22px for the body, Caveat 16px for the footer line.
- **Padding**: 120px top/bottom + 60px left/right outer stone frame. Safe zones: 180px top and 200px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical content must sit inside y=180 to y=1720. Photo inset at 50px additional inside the stone frame.
- **Layout**: Single centered column. Content max-width 960px. Vertical center of gravity -- catalog masthead in y=220 to y=620, inset taupe photo container from y=640 to y=1700, pink sticker overlapping the bottom-left corner of the photo zone around y=1500-1700.
- **Cover slide**: Stone frame edge-to-edge. Catalog header stacks at the top (Cormorant Garamond italic "Galerie" wordmark, then Inter 700 80px headline on 2 lines, then Cormorant Garamond tracked-caps date). Inset taupe photo container fills the remaining vertical space. Tilted pink sticker rotated -8deg at approximately left=80px, bottom=260px, with asymmetric border-radius and the pink-tinted drop shadow.
- **Content slides**: Same stone frame and masthead. Replace the photo with a stone-lighter content card containing numbered items or stats. Sticker omitted unless the slide is a promo slide.
- **CTA slide**: Catalog header at top. Centered near-black pill button (no border-radius, tracked-caps label) in the lower-middle of the frame. Optional sticker in bottom-left with a final call ("Last Chance").
- **Progress indicator**: Thin segments at y=60 (inside the safe zone) -- inactive in `rgba(26,20,16,0.15)`, active in near-black (`#1A1410`). Keeps the catalog aesthetic without competing with the sticker.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Stone Beige | `#E6DCC8` | Outer frame background |
| Near-Black | `#1A1410` | Primary text, CTA button fill |
| Taupe Brown | `#4A352A` | Inset photo container background |
| Candy Pink | `#F4B8D4` | Sticker fill (one use only) |
| Deep Pink Ink | `#8B3A5C` | Sticker inner border, accent text |
| Stone Deeper | `#D8C9B0` | Subtle borders, secondary surfaces |
| Stone Lighter | `#EFE6D6` | Content card highlights |
| Warm Brown | `#6B4C3B` | Secondary text on photo environments |
| Muted Text | `#7A6B5D` | Metadata inside the stone frame |

### Font Declarations

```css
/* Display serif (wordmark, tracked dates, quotes) */
font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;

/* Body sans (catalog headline, body text, CTAs) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

/* Script (sticker copy only) */
font-family: 'Caveat', 'Brush Script MT', cursive;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Inter:wght@400;500;600;700;800&family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-stone: #E6DCC8;
  --color-near-black: #1A1410;
  --color-taupe: #4A352A;

  /* Colors -- Accent */
  --color-pink: #F4B8D4;
  --color-pink-ink: #8B3A5C;

  /* Colors -- Neutral Scale */
  --color-stone-deeper: #D8C9B0;
  --color-stone-lighter: #EFE6D6;
  --color-warm-brown: #6B4C3B;
  --color-muted-text: #7A6B5D;
  --color-ink-trace: rgba(26, 20, 16, 0.45);
  --color-divider: rgba(26, 20, 16, 0.12);

  /* Colors -- Surfaces */
  --color-surface-stone: #E6DCC8;
  --color-surface-photo: #4A352A;
  --color-surface-sticker: #F4B8D4;
  --color-surface-card: #EFE6D6;

  /* Colors -- Borders */
  --color-border-hairline: rgba(26, 20, 16, 0.12);
  --color-border-sticker-inner: rgba(139, 58, 92, 0.35);
  --color-border-sticker-outer: rgba(26, 20, 16, 0.06);

  /* Colors -- Shadows */
  --shadow-whisper: rgba(74, 53, 42, 0.06);
  --shadow-sticker: rgba(139, 58, 92, 0.18);
  --shadow-deep: rgba(26, 20, 16, 0.14);

  /* Composed Shadows */
  --shadow-photo: inset 0 1px 2px rgba(26, 20, 16, 0.04);
  --shadow-sticker-rest: 0 8px 24px rgba(139, 58, 92, 0.18), 0 2px 6px rgba(26, 20, 16, 0.08);
  --shadow-sticker-lift: 0 14px 36px rgba(139, 58, 92, 0.24), 0 3px 8px rgba(26, 20, 16, 0.12);
  --shadow-overlay: 0 24px 56px rgba(26, 20, 16, 0.22);

  /* Typography -- Families */
  --font-display-serif: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-script: 'Caveat', 'Brush Script MT', cursive;

  /* Typography -- Sizes */
  --text-wordmark: 28px;
  --text-display-hero: 72px;
  --text-display-square: 56px;
  --text-section-heading: 32px;
  --text-body-large: 20px;
  --text-body: 17px;
  --text-small: 13px;
  --text-tracked-date: 14px;
  --text-sticker-headline: 32px;
  --text-sticker-body: 20px;
  --text-sticker-foot: 16px;

  /* Typography -- Weights */
  --weight-wordmark: 500;
  --weight-display: 700;
  --weight-heading: 600;
  --weight-body: 500;
  --weight-body-bold: 700;
  --weight-tracked: 500;
  --weight-script: 700;

  /* Typography -- Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.15;
  --leading-body: 1.55;
  --leading-tracked: 1.2;
  --leading-script: 1.1;
  --leading-number: 1.0;

  /* Typography -- Letter Spacing */
  --tracking-display: -1.5px;
  --tracking-display-square: -1px;
  --tracking-heading: -0.5px;
  --tracking-body: 0px;
  --tracking-tracked-date: 2.5px;
  --tracking-cta: 2px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-stack: 18px;
  --space-header-internal: 24px;
  --space-section-internal: 32px;
  --space-grid-gap: 40px;
  --space-frame-inset: 50px;
  --space-section-divider: 80px;

  /* Borders */
  --radius-card: 0px;
  --radius-cta: 0px;
  --radius-sticker: 120px 140px 110px 130px / 90px 100px 80px 110px;
  --radius-sticker-inner: 110px 130px 100px 120px / 82px 92px 72px 100px;

  /* Sticker rotation */
  --sticker-rotate: -8deg;
}
```

### System Font Fallbacks
- **Display serif (if Cormorant Garamond fails to load):** `Georgia, 'Times New Roman', serif`
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Script (if Caveat fails to load):** `'Brush Script MT', 'Lucida Handwriting', cursive`
