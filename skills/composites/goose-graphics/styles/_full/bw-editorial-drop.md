# Design Style: BW Editorial Drop

## 1. Visual Theme & Atmosphere

BW Editorial Drop is the visual language of a contemporary luxury fashion house reimagined as an Instagram product drop. It is the poster you'd tape up on the back wall of a SoHo eyewear boutique the day a new collaboration lands -- half campaign photography, half product-launch announcement, all attitude. The frame is cut cleanly in two: the **top ~60% is a full-bleed black-and-white high-contrast photograph** (think silver-gelatin print, crushed shadows, specular chrome highlights), and the **bottom ~40% is a near-black drop panel** (`#0A0A0A`) carrying a two-line display headline in saturated highlighter yellow. The composition reads like the closing frame of a music-video bumper or the back cover of a 90s fashion zine -- no gradient, no ornament, just photograph-on-top, typography-on-bottom, separated by a hard horizon line.

The typographic signature is a single massive **Anton ALL CAPS headline** set in highlighter yellow (`#F4ED2B`) at 92-120px, with aggressively tight negative tracking so the letters brick up against each other. Anton is a condensed heavy sans in the lineage of Alternate Gothic and Impact -- chunky, narrow, unapologetic. At display size it reads less like typography and more like silkscreen graffiti pressed into the black panel. The headline always runs to two lines ("OUR NEW / CRUSH", "FALL / DROP 2026") -- never one long line, never three -- because the two-line stack is the shape of this style. Below or flanking the headline, **Inter 500/600 in tracked white uppercase** handles all the metadata: product specs in the bottom-left ("100% UV SCRATCH-RESISTANT"), a CTA in the bottom-right ("SHOP NOW TO ELEVATE YOUR LOOK"). The metadata is kept deliberately small (11-13px) and wide-tracked (0.12em), mimicking the fine print stamped on a product label.

The photograph is the other half of the identity, and it must be **true black-and-white** -- not duotone, not sepia, not a color image with grayscale filter laid on top as an afterthought. When an image is imported, it gets piped through `filter: grayscale(100%) contrast(1.2) brightness(0.95)` to crush the midtones toward a silver-print tonal range. The subject should be editorial: a face, a hand, a product held against skin, a piece of chrome catching light -- never a landscape, never a flat-lay. The hard horizon where the photograph meets the black panel is the most important compositional line in the entire frame, and it is always dead-straight, always unblurred, always uncompromised. The analogies: Helmut Lang archive, Calvin Klein 1996, Arca album art, a Kendrick cover drop, a Hood By Air lookbook. The mood is luxury-fashion-house confidence welded to 90s-music-video restraint.

**Key Characteristics:**
- True black-and-white photography occupying the top ~60% of the frame, full-bleed, hard edges
- Near-black drop panel (`#0A0A0A`) occupying the bottom ~40%, flat fill, no gradient
- Massive Anton 900 display headline in highlighter yellow (`#F4ED2B`) at 92-120px, two lines, ALL CAPS
- Aggressively tight tracking on the display (-0.02em to -0.04em) so letters brick together
- Inter 500/600 tracked-uppercase metadata in white, 11-13px, `letter-spacing: 0.12em`, in bottom-left and bottom-right corners
- Exactly two metadata labels per frame: product spec (bottom-left) and CTA micro-copy (bottom-right)
- Photograph filter stack: `grayscale(100%) contrast(1.2) brightness(0.95)` for silver-print tonal range
- Zero decorative elements -- no icons, no rules, no badges, no gradients, no rounded corners
- Zero use of color anywhere except the yellow display headline -- photograph is BW, panel is black, metadata is white
- Hard horizon line between photograph and black panel -- always straight, always pixel-sharp
- Vertical 4:5 poster (1080x1350) or 9:16 story (1080x1920) as the native formats
- Left-aligned or centered headline, never right-aligned -- the yellow block always sits flush left or centered in the drop panel

## 2. Color Palette & Roles

### Primary
- **Drop Black** (`#0A0A0A`): The near-black drop panel that carries the headline. Slightly warmer than pure black to avoid digital flatness, but still reads as black on every screen. The dominant surface of the bottom 40% and the canvas color for single-panel variants.
- **Highlighter Yellow** (`#F4ED2B`): The sole chromatic color in the entire style. Used exclusively for the massive Anton display headline. Reads as fluorescent, electric, almost radioactive against the drop black. Reserved for display only -- never for body, never for metadata, never for anything else.
- **Signal White** (`#FFFFFF`): Used exclusively for tracked-uppercase metadata in the corners. The photograph remains grayscale, but the white metadata labels sit on top of the black panel as pure `#FFFFFF`.

### Accent
- **Yellow Hover** (`#F8F34A`): A slightly brighter variant of highlighter yellow for hover/active states on interactive elements. Used rarely -- this style is primarily static.
- **Yellow Shadow** (`#D4CD1F`): A slightly darker variant used for optional 1-2px text shadow on the display headline when it sits over particularly bright photograph regions in hybrid layouts. Used sparingly.
- **Deep Black** (`#000000`): The only time true `#000000` appears -- inside the photograph's crushed shadows after the contrast filter. Never used as a background fill.

### Neutral Scale
- **Panel Black** (`#0A0A0A`): The drop panel fill.
- **Sub Panel** (`#0F0F0F`): A barely-lighter variant for rare recessed areas (spec plates, secondary info strips). 5% lift.
- **Photo Black** (`#000000`): Crushed shadows inside the BW photograph only.
- **Photo Mid** (`#6A6A6A`): The mid-gray range of the photograph -- flesh tones and mid-value fabric.
- **Photo Highlight** (`#EEEEEE`): The photograph's brightest specular highlights (chrome, catch-lights).
- **Metadata White** (`#FFFFFF`): Corner label text.
- **Metadata Muted** (`rgba(255, 255, 255, 0.6)`): Secondary metadata (slide counters, very rare).

### Surface & Borders
- **Surface Drop** (`#0A0A0A`): The black drop panel -- the primary surface for all typography.
- **Surface Sub** (`#0F0F0F`): Rare secondary strip under the headline for a secondary label (used in the Story format only).
- **Border Default** (`rgba(255, 255, 255, 0.12)`): A faint hairline rule used exclusively to separate stacked metadata columns in the Story format. 1px only.
- **Border None** (`transparent`): The default. This style has no card borders -- the horizon line between photograph and black panel is the only structural edge.
- **Divider Rule** (`rgba(255, 255, 255, 0.08)`): An even fainter hairline for the rare inline divider.

### Shadow Colors
- **Shadow None** (`transparent`): The default. This style uses no drop shadows anywhere. All depth comes from the photograph itself.
- **Photo Vignette** (`rgba(0, 0, 0, 0.35)`): An optional soft vignette applied to the photograph's bottom edge to blend into the black drop panel when the horizon line is too abrupt. Linear gradient, 60px tall.
- **Display Glow** (`rgba(244, 237, 43, 0.0)`): Reserved at 0 opacity. This style does not glow its headline. Kept in the palette as a guardrail.

### Texture
- **Grayscale Filter**: `grayscale(100%) contrast(1.2) brightness(0.95)` -- applied as a CSS filter to any imported photograph to force the silver-print tonal range.
- **No Grain**: Unlike vintage styles, this is a clean digital black-and-white. No halftone dots, no film grain overlay, no noise. The photograph's own tonal range carries all the texture.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'Anton', 'Oswald', Impact, 'Arial Narrow', sans-serif`
- **Body / Metadata**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Anton | 120px | 400 | 0.92 | -0.03em | Two-line yellow headline in the drop panel. Anton only ships a single weight (400) but reads as 900. ALL CAPS. |
| Display Large | Anton | 108px | 400 | 0.92 | -0.03em | Poster variant headline. |
| Display Medium | Anton | 92px | 400 | 0.94 | -0.025em | Carousel headline. |
| Display Small | Anton | 72px | 400 | 0.94 | -0.02em | Tight format or secondary slide headline. |
| Metadata Label | Inter | 12px | 600 | 1.30 | 0.12em | The bottom-left / bottom-right tracked-uppercase corner labels. ALL CAPS. |
| Metadata Small | Inter | 11px | 500 | 1.30 | 0.14em | The smallest fine-print label (credits, counters). ALL CAPS. |
| Body Cap | Inter | 14px | 500 | 1.45 | 0.08em | Rare secondary copy in the Story format sub-panel. ALL CAPS. Hard cap -- never exceed 16px. |
| Credit / Slug | Inter | 11px | 500 | 1.30 | 0.16em | Photo credits, issue numbers, slide counters. |
| CTA Label | Inter | 12px | 600 | 1.30 | 0.14em | The bottom-right CTA micro-copy ("SHOP NOW TO ELEVATE YOUR LOOK"). |

### Principles
- **Anton is display-only, yellow-only**: Anton appears exactly once per frame, always in the drop panel, always in highlighter yellow, always in ALL CAPS, always at 72px or larger. It is never used for subtitles, body text, labels, or anything that isn't the single hero headline.
- **Inter is metadata-only, white-only, uppercase-only**: Inter exists in this style purely to label the corners with tracked-uppercase product-label fine print. It is never set in sentence case. It is never set larger than 16px. It is never set in any color other than white.
- **Two lines, never one**: The display headline is always structured as a two-line stack. "OUR NEW / CRUSH" is the reference shape. A one-line headline reads as a billboard; a three-line headline reads as a menu -- this style wants neither.
- **Tight negative tracking as identity**: The display headline uses `letter-spacing: -0.02em to -0.04em` -- not for elegance but for weight. Anton letters brick together and form a single dense block, which is the point.
- **Wide positive tracking on metadata**: The corner labels use `letter-spacing: 0.12em to 0.16em` -- the opposite extreme. The tension between the tight-tracked display and the wide-tracked metadata is a core signature of this style.
- **Mixed case is forbidden**: Every character of visible type in this style is uppercase. Mixed case breaks the editorial-drop energy instantly.
- **No font below 11px, no body font above 16px**: The corner metadata is the floor; 16px is the ceiling for any non-display text. The entire visual budget for size goes to the Anton headline.

## 4. Component Patterns

### Title Block (Full Frame: Photograph + Drop Panel)

```html
<div style="width: 1080px; height: 1350px; background: var(--color-panel); position: relative; overflow: hidden; font-family: var(--font-body);">
  <!-- Photograph (top 60%) -->
  <div style="position: absolute; top: 0; left: 0; right: 0; height: 60%; overflow: hidden;">
    <img src="hero.jpg" alt="" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(1.2) brightness(0.95); display: block;">
    <!-- Optional soft vignette to blend into drop panel -->
    <div style="position: absolute; left: 0; right: 0; bottom: 0; height: 60px; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.35));"></div>
  </div>
  <!-- Drop Panel (bottom 40%) -->
  <div style="position: absolute; left: 0; right: 0; bottom: 0; height: 40%; background: var(--color-panel); padding: 64px 60px 72px;">
    <!-- Massive Yellow Display Headline -->
    <h1 style="font-family: var(--font-display); font-size: 120px; font-weight: 400; line-height: 0.92; letter-spacing: -0.03em; text-transform: uppercase; color: var(--color-yellow); margin: 0; text-align: center;">OUR NEW<br>CRUSH</h1>
    <!-- Corner Metadata Labels -->
    <div style="position: absolute; left: 60px; bottom: 40px; font-family: var(--font-body); font-size: 12px; font-weight: 600; line-height: 1.3; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-white);">100% UV<br>SCRATCH-RESISTANT</div>
    <div style="position: absolute; right: 60px; bottom: 40px; text-align: right; font-family: var(--font-body); font-size: 12px; font-weight: 600; line-height: 1.3; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-white);">SHOP NOW TO<br>ELEVATE YOUR LOOK</div>
  </div>
</div>
```

### Full-Bleed BW Photo Container

```html
<div style="position: absolute; top: 0; left: 0; right: 0; height: 60%; overflow: hidden;">
  <img src="hero.jpg" alt="" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(1.2) brightness(0.95); display: block;">
</div>
```

### Black Drop Panel with Yellow Display

```html
<div style="background: var(--color-panel); padding: 72px 60px; position: relative;">
  <h1 style="font-family: var(--font-display); font-size: 108px; font-weight: 400; line-height: 0.92; letter-spacing: -0.03em; text-transform: uppercase; color: var(--color-yellow); margin: 0; text-align: center;">FALL<br>DROP 2026</h1>
</div>
```

### Corner Metadata Labels (Bottom-Left + Bottom-Right Pair)

```html
<div style="position: absolute; left: 60px; bottom: 40px; font-family: var(--font-body); font-size: 12px; font-weight: 600; line-height: 1.3; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-white);">
  SS26 EDITION<br>CHROME SERIES
</div>
<div style="position: absolute; right: 60px; bottom: 40px; text-align: right; font-family: var(--font-body); font-size: 12px; font-weight: 600; line-height: 1.3; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-white);">
  AVAILABLE 04.15<br>WORLDWIDE
</div>
```

### Massive Yellow Display Block (Standalone)

```html
<h1 style="font-family: var(--font-display); font-size: 120px; font-weight: 400; line-height: 0.92; letter-spacing: -0.03em; text-transform: uppercase; color: var(--color-yellow); margin: 0; text-align: center; background: var(--color-panel); padding: 80px 60px;">TWO<br>THOUSAND<br>TWENTY-SIX</h1>
```

### Full-Bleed Photo Slide (No Drop Panel)

```html
<div style="width: 1080px; height: 1350px; background: var(--color-panel); position: relative; overflow: hidden;">
  <img src="editorial.jpg" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(1.2) brightness(0.95);">
  <!-- Slug in top-left corner -->
  <div style="position: absolute; top: 40px; left: 60px; font-family: var(--font-body); font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-white);">EDITORIAL 01 / CHROME</div>
  <!-- Slide counter in bottom-right -->
  <div style="position: absolute; bottom: 40px; right: 60px; font-family: var(--font-body); font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-white);">02 / 08</div>
</div>
```

### Split Frame (Photo Left, Drop Panel Right)

```html
<div style="width: 1920px; height: 1080px; display: grid; grid-template-columns: 60% 40%; background: var(--color-panel);">
  <div style="overflow: hidden;">
    <img src="hero.jpg" alt="" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(1.2) brightness(0.95);">
  </div>
  <div style="padding: 80px 60px; position: relative; display: flex; flex-direction: column; justify-content: center;">
    <h1 style="font-family: var(--font-display); font-size: 108px; font-weight: 400; line-height: 0.92; letter-spacing: -0.03em; text-transform: uppercase; color: var(--color-yellow); margin: 0;">OUR NEW<br>CRUSH</h1>
    <div style="position: absolute; left: 60px; bottom: 48px; font-family: var(--font-body); font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-white); line-height: 1.3;">100% UV<br>SCRATCH-RESISTANT</div>
    <div style="position: absolute; right: 60px; bottom: 48px; text-align: right; font-family: var(--font-body); font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-white); line-height: 1.3;">SHOP NOW TO<br>ELEVATE YOUR LOOK</div>
  </div>
</div>
```

### CTA Frame (All Drop Panel, No Photo)

```html
<div style="width: 1080px; height: 1350px; background: var(--color-panel); position: relative; display: flex; align-items: center; justify-content: center; padding: 80px 60px;">
  <h1 style="font-family: var(--font-display); font-size: 140px; font-weight: 400; line-height: 0.90; letter-spacing: -0.035em; text-transform: uppercase; color: var(--color-yellow); margin: 0; text-align: center;">SHOP<br>THE<br>DROP</h1>
  <div style="position: absolute; left: 60px; bottom: 48px; font-family: var(--font-body); font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-white); line-height: 1.3;">LINK IN BIO<br>04.15.2026</div>
  <div style="position: absolute; right: 60px; bottom: 48px; text-align: right; font-family: var(--font-body); font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-white); line-height: 1.3;">LIMITED<br>WORLDWIDE</div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **0px**: The horizon line between the photograph and the drop panel. No gap, no rule, no blur. Pixel-sharp edge.
- **4px**: Micro gap inside multi-line metadata labels.
- **8px**: Tight gap between stacked metadata lines.
- **16px**: Standard gap between the last headline line and any optional sub-label in the drop panel.
- **24px**: Gap between major metadata clusters within a single corner.
- **40px**: Distance from the frame edge to the bottom of corner metadata blocks.
- **48px**: Standard bottom padding for the drop panel when the headline sits centered.
- **60px**: Standard horizontal padding (left/right) for every format. The corner metadata sits flush to this margin.
- **72px**: Top padding inside the drop panel above the headline.
- **80px**: Maximum padding on the Slides (1920x1080) format.

### Format Padding
| Format | Outer Padding | Photo Height | Drop Panel Height | Content Max-Width |
|--------|---------------|--------------|-------------------|-------------------|
| Carousel (1080x1080) | 60px horizontal | 55% (594px) | 45% (486px) | 960px |
| Infographic (1080xN) | 60px horizontal, 80px vertical | Variable | 400-500px per drop | 960px |
| Slides (1920x1080) | 80px horizontal | 60% (648px) OR split-right 40% | 40% (432px) OR split-right full-height | 1760px |
| Poster (1080x1350) | 60px horizontal, 72px vertical | 60% (810px) | 40% (540px) | 960px |
| Story (1080x1920) | 60px horizontal, 120px top / 160px bottom safe zone | 58% (1113px) | 42% (807px) | 960px |

### Alignment & Grid
- **Headline alignment**: Centered in the drop panel by default. Left-aligned is the acceptable variant for asymmetric compositions. Right-aligned is forbidden -- the yellow block always anchors to the left or to dead-center.
- **Corner metadata**: Always in a bottom-left + bottom-right pair. Never three corners, never a single corner. The pair creates the "product label" symmetry that is core to the identity. Bottom-left is always left-aligned, bottom-right is always right-aligned.
- **Horizon ratio**: 60/40 is the canonical split (photograph / drop panel). 55/45 is acceptable for formats that need more typographic room (Carousel). 50/50 is forbidden -- it flattens the hierarchy.
- **Grid**: This style uses no internal grid. Content is positioned absolutely from the frame edges using the 60px horizontal rhythm. Cards, columns, and containers are not used.
- **Vertical rhythm**: The drop panel has exactly one primary element (the Anton headline) and exactly two secondary elements (the corner labels). No additional hierarchy fits inside the drop panel -- if more content is needed, move to a multi-slide sequence.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, `#0A0A0A` drop panel fill | The entire style. Default everywhere. |
| Photograph (Level 1) | The BW photograph itself, bleeding to the frame edges | The only "elevated" element -- depth comes from the photograph's own tonal range |
| Vignette (Level 2) | `linear-gradient(to bottom, transparent, rgba(0,0,0,0.35))` 60px tall | Optional blend between the photograph's bottom edge and the drop panel |
| Horizon Edge (Level 3) | `0 -1px 0 rgba(0,0,0,1)` -- a 1px hard line at the horizon if the photograph has a bright bottom edge | Only used when the photograph's lower border is too bright to sit cleanly on the drop panel |
| Display Shadow (Level 4) | Forbidden | This style never applies shadow, glow, or stroke to the Anton headline |

### Border Treatments
- **Default border**: `none`. Cards, panels, and containers in this style have no visible borders. Structure comes from the hard horizon line and the 60px margin rhythm.
- **Horizon line**: The pixel-sharp edge where the photograph meets the drop panel. This is the only structural line in the composition and it must be razor-straight.
- **Hairline divider (rare)**: `1px solid rgba(255, 255, 255, 0.12)` -- used only to separate stacked metadata groups inside the Story format's sub-panel.
- **No rounded corners**: All edges are square. `border-radius: 0` is the default and the rule.

### Surface Hierarchy
On this style, depth is binary: there is the photograph, and there is the drop panel. Everything else is flat against the drop panel.
1. **Photograph** -- full tonal range of the BW image, the only source of visual depth.
2. **Drop Panel** (`#0A0A0A`) -- the flat surface that carries all typography.
3. **Yellow Headline** (`#F4ED2B`) -- pure fill, no shadow, no glow; sits visually on top of the drop panel as the highest-contrast element.
4. **White Metadata** (`#FFFFFF`) -- the second-highest contrast element, anchored to the corners.

## 7. Do's and Don'ts

### Do
- Use **true black-and-white photography** -- import the image and run it through `filter: grayscale(100%) contrast(1.2) brightness(0.95)`. The photograph must read as silver-print, not colorized.
- Use highlighter yellow (`#F4ED2B`) **exclusively for the Anton display headline** -- nothing else in the frame is yellow, ever.
- Use **Anton for the display** at 92-120px, always in ALL CAPS, always at weight 400 (which reads as 900), always with `-0.02em to -0.04em` negative tracking.
- Structure the display headline as exactly **two lines** -- the two-line stack is the shape of this style.
- Place corner metadata in **bottom-left and bottom-right as a pair** of tracked-uppercase Inter labels at 12px, `letter-spacing: 0.12em`, white on the drop panel.
- Maintain a **60/40 horizon split** -- photograph on top, near-black drop panel on bottom, hard pixel-sharp edge between them.
- Keep the drop panel near-black (`#0A0A0A`) -- slightly warmer than pure black, but unambiguously black on every screen.
- Use exactly **two Inter weights** -- 500 for the smallest credit/slug copy, 600 for the primary metadata labels.
- Use `letter-spacing: 0.12em to 0.16em` on all metadata -- the wide positive tracking is the deliberate foil to the tight negative tracking on the headline.
- Treat the **horizon line** between photograph and drop panel as the most important compositional element in the frame -- always straight, always sharp, always uncompromised.

### Don't
- **Don't duotone the photograph.** This style is true B&W. Duotone, sepia, split-tone, or any color cast breaks the identity. If you want duotone, use `vintage-duotone-poster.md` instead.
- **Don't use colored backgrounds.** The only allowed background is the near-black drop panel (`#0A0A0A`). No gray, no off-black, no colored panel, no gradient.
- **Don't use body text above 16px.** This style reserves size exclusively for the Anton display headline. The corner metadata caps at 12-13px, the rare Body Cap in the Story sub-panel caps at 16px. Nothing else gets to be big.
- Don't use yellow anywhere except the display headline -- never yellow body, never yellow metadata, never yellow borders.
- Don't set the display headline in mixed case or sentence case -- ALL CAPS is the rule.
- Don't set the display headline to one line or three lines -- two lines is the shape.
- Don't apply drop shadow, stroke, glow, outline, or any effect to the yellow headline. Pure flat fill only.
- Don't use serif, script, or any typeface besides Anton for the display and Inter for the metadata.
- Don't right-align the headline. Center or left only.
- Don't add rounded corners anywhere. `border-radius: 0` is a hard rule.
- Don't add decorative elements -- no icons, no badges, no pills, no rules, no illustrations, no emoji.
- Don't use pure white (`#FFFFFF`) anywhere except the metadata labels, and don't use pure black (`#000000`) anywhere except the crushed shadows inside the photograph.

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
- **Typography scale**: Anton display drops to **92px** (from 120px). Line-height 0.94, tracking -0.025em. Metadata stays at 12px.
- **Padding**: 60px horizontal, 48px vertical.
- **Horizon split**: 55/45 -- photograph top 594px, drop panel bottom 486px. The square format needs slightly more room for typography.
- **Cover slide**: Full BW photo on top, drop panel with 2-line Anton headline centered, bottom-left + bottom-right metadata labels.
- **Content slides**: Can alternate full-bleed BW photo slides (with a single slug in the top-left and a slide counter in the bottom-right) and drop-panel slides (all black, massive yellow headline, corner metadata).
- **CTA slide**: All drop panel, no photograph. Anton at 108-120px, centered. "SHOP THE DROP" style CTA with LINK IN BIO metadata.
- **Slide counter**: Bottom-right, Inter 500 11px, `letter-spacing: 0.16em`, white. "02 / 08" format.

### Infographic (1080px wide, variable height)
- **Typography**: Display Hero at 108px at the top. Each subsequent drop-panel section uses Display Medium at 92px.
- **Padding**: 60px horizontal, 80px top/bottom.
- **Vertical rhythm**: Alternate full-bleed BW photograph sections (800-900px tall) with 400-500px drop panels carrying yellow Anton headlines. Each drop panel repeats the bottom-left + bottom-right metadata pair.
- **Section spacing**: 0px -- sections butt directly against each other. The horizon line between each photograph and its drop panel is the only visible separator.
- **Footer**: The final drop panel functions as the CTA. No additional footer chrome.

### Slides (1920x1080px)
- **Typography scale**: Display Hero at **108px** (slightly smaller than poster because the horizontal format needs the room). Metadata at 13px.
- **Padding**: 80px horizontal.
- **Layout options**:
  - **Horizontal 60/40**: Photograph on the left 60%, drop panel on the right 40%. Headline left-aligned in the drop panel. Corner metadata at bottom-left (60px from left edge) and bottom-right (60px from right edge) of the drop panel only.
  - **Full BW photo**: Pure editorial shot with slug top-left and counter bottom-right.
  - **All drop panel**: CTA slide, Anton at 140px, centered, corner metadata pair.
- **Title slides**: Split frame with photograph left, Anton headline right.
- **Content slides**: Full-bleed photograph with slug/counter corners.

### Poster (1080x1350px)
- **Typography**: Display Hero at **120px** -- this is the canonical size for the style. Line-height 0.92, tracking -0.03em.
- **Padding**: 60px horizontal, 72px top (inside the drop panel), 48px bottom.
- **Composition**: 60/40 horizon split -- photograph on top (810px), drop panel on bottom (540px). Anton headline centered in the drop panel, bottom-left + bottom-right corner metadata 40px from the bottom edge.
- **This is the native format** -- the reference screenshot is a 4:5 poster and every value in this file is calibrated to it first.
- **CTA placement**: The drop panel itself is the CTA. No additional button, no additional chrome.

### Story (1080x1920px)
- **Typography scale**: Display Hero at **132px** for maximum vertical impact (the tall format swallows typography if you scale to carousel size). Line-height 0.92, tracking -0.035em. Metadata at 13px.
- **Padding**: 60px horizontal, 120px top / 160px bottom safe zones (reserved for platform UI -- avatar, progress bar, reply input). All critical content sits inside y=120 to y=1760.
- **Horizon split**: 58/42 -- photograph top 1113px, drop panel bottom 807px. The extra vertical room in the Story format goes to the drop panel so the massive Anton headline has space to breathe and a rare second line of Body Cap sub-copy can sit beneath it.
- **Cover slide**: Full BW photograph on top. Drop panel on bottom with a 132px two-line Anton headline centered, an optional 14px Body Cap sub-label (ALL CAPS, 0.08em tracking, white, `rgba(255,255,255,0.85)` opacity) 24px below the headline, and the bottom-left + bottom-right corner metadata pair at 48px from the bottom safe zone edge.
- **Content slides**: Can run full-bleed BW photo with slug top-left (inside the top safe zone) and slide counter bottom-right (inside the bottom safe zone), or use the split layout. The drop panel can carry a second horizontal hairline rule (`1px solid rgba(255,255,255,0.12)`) 16px above the corner metadata to separate the headline block from the spec block -- the only case this style uses a visible divider.
- **CTA slide**: All drop panel, Anton at 148px centered, bottom-left "LINK IN STICKER" / bottom-right "LIMITED DROP" metadata pair.
- **Progress indicator**: Handled by the Story platform -- do not draw a custom progress bar.
- **Tap zones**: Keep the Anton headline centered on x=540 (horizontal center) so edge taps for prev/next don't obscure type.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Drop Black | `#0A0A0A` | Drop panel fill, primary canvas |
| Highlighter Yellow | `#F4ED2B` | Display headline only -- nothing else |
| Signal White | `#FFFFFF` | Corner metadata labels only |
| Yellow Hover | `#F8F34A` | Hover/active state for yellow (rare) |
| Yellow Shadow | `#D4CD1F` | Optional 1-2px text shadow on yellow over bright photo regions (rare) |
| Sub Panel | `#0F0F0F` | Rare recessed strip in Story format |
| Metadata Muted | `rgba(255,255,255,0.6)` | Secondary metadata (slide counters) |
| Border Default | `rgba(255,255,255,0.12)` | 1px hairline for Story sub-panel divider |
| Photo Vignette | `rgba(0,0,0,0.35)` | Optional gradient blend at photo bottom edge |

### Font Declarations

```css
/* Display (yellow headline only) */
font-family: 'Anton', 'Oswald', Impact, 'Arial Narrow', sans-serif;

/* Body / Metadata (white corner labels only) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-panel: #0A0A0A;
  --color-yellow: #F4ED2B;
  --color-white: #FFFFFF;

  /* Colors -- Accent */
  --color-yellow-hover: #F8F34A;
  --color-yellow-shadow: #D4CD1F;
  --color-deep-black: #000000;

  /* Colors -- Neutral Scale */
  --color-sub-panel: #0F0F0F;
  --color-photo-black: #000000;
  --color-photo-mid: #6A6A6A;
  --color-photo-highlight: #EEEEEE;
  --color-metadata-white: #FFFFFF;
  --color-metadata-muted: rgba(255, 255, 255, 0.6);

  /* Colors -- Surfaces */
  --color-surface-drop: #0A0A0A;
  --color-surface-sub: #0F0F0F;

  /* Colors -- Borders */
  --color-border-default: rgba(255, 255, 255, 0.12);
  --color-divider: rgba(255, 255, 255, 0.08);
  --color-border-none: transparent;

  /* Colors -- Shadows */
  --shadow-none: transparent;
  --shadow-photo-vignette: rgba(0, 0, 0, 0.35);
  --shadow-display-glow: rgba(244, 237, 43, 0.0);

  /* Typography -- Families */
  --font-display: 'Anton', 'Oswald', Impact, 'Arial Narrow', sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 120px;
  --text-display-large: 108px;
  --text-display-medium: 92px;
  --text-display-small: 72px;
  --text-metadata-label: 12px;
  --text-metadata-small: 11px;
  --text-body-cap: 14px;
  --text-credit-slug: 11px;
  --text-cta-label: 12px;

  /* Typography -- Weights */
  --weight-display: 400;
  --weight-metadata: 600;
  --weight-metadata-small: 500;
  --weight-cta: 600;

  /* Typography -- Line Heights */
  --leading-display-hero: 0.92;
  --leading-display-medium: 0.94;
  --leading-metadata: 1.30;
  --leading-body-cap: 1.45;

  /* Typography -- Letter Spacing */
  --tracking-display-hero: -0.03em;
  --tracking-display-medium: -0.025em;
  --tracking-metadata: 0.12em;
  --tracking-metadata-small: 0.14em;
  --tracking-credit-slug: 0.16em;
  --tracking-body-cap: 0.08em;

  /* Spacing */
  --space-horizon: 0px;
  --space-micro: 4px;
  --space-tight: 8px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-corner-offset: 40px;
  --space-drop-bottom: 48px;
  --space-frame: 60px;
  --space-drop-top: 72px;
  --space-max: 80px;

  /* Borders */
  --radius-none: 0;

  /* Composition Ratios */
  --ratio-photo: 60%;
  --ratio-drop: 40%;
  --ratio-photo-carousel: 55%;
  --ratio-drop-carousel: 45%;
  --ratio-photo-story: 58%;
  --ratio-drop-story: 42%;

  /* Filters */
  --filter-bw: grayscale(100%) contrast(1.2) brightness(0.95);
}
```

### System Font Fallbacks
- **Display (if Anton fails to load):** `'Oswald', Impact, 'Arial Narrow Bold', 'Arial Narrow', sans-serif` -- Oswald 900 is the closest widely-available backup. Impact is the ultimate OS-level fallback.
- **Body / Metadata (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
