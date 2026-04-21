# Design Style: Heatwave Orange

## 1. Visual Theme & Atmosphere

Heatwave Orange is the design language of a high-confidence copywriting brand that wants every slide to feel like a magazine cover. It draws from the aesthetic of modern Instagram carousel creators (think Copywriting Tips, High Signal, indie newsletter brands) crossed with the broadcast graphics of a sports channel -- heavy sans-serif headlines, saturated heat-orange surfaces, and corner-radiating "speed line" decorations that give every slide a sense of forward motion. The mood is assertive, direct, and slightly loud. There is no whispering in this style. Every slide shouts its point, then hands the reader a round lavender arrow and says "keep going."

The signature move is a **three-background variant system**: every carousel deliberately rotates between near-white (`#F0EFEA`), saturated heat-orange (`#E06A2C`), and near-black (`#0D0D0D`). This is not decorative -- it is structural. Cover slides are white. Content slides are orange. Quote or pause slides are black. CTA slides return to orange. The rotation creates rhythm across a 5-slide carousel the way cuts create rhythm in a music video: white grabs attention, orange delivers the lesson, black gives the reader a breath, orange brings them home. On the white variant, a **peach highlight block** sits behind one word of the headline (e.g., "Headline?" in the cover) -- it mimics a highlighter stroke and is the one moment of warmth in an otherwise cool slide. On orange and black variants, text is always pure white. The headline type is heavy Inter 900 at 72-90px, stacked 3-4 lines, tight leading, tight tracking.

The second signature element is the **line-wave corner decoration**: a set of thin horizontal curving lines radiating from the bottom-right corner, drawn as SVG paths with stroke and no fill. On white slides the lines are peach. On orange slides the lines are a slightly lighter orange-white tint. On black slides they are gold/tan. They look like topographic contour lines, radio waves, or the speed lines behind a cartoon runner. A small round lavender arrow button (`#D0C8E8`) sits at the bottom-right of every slide as a "swipe next" indicator -- it is the one soft element in an otherwise hard composition, and the color contrast with the heat-orange is the brand's visual fingerprint. A metadata strip at the top of every slide labels the content: category ("Copywriting Tips"), author ("Sebastian Bennett"), and handle ("@reallygreatsite").

**Key Characteristics:**
- Three-background variant system: near-white (`#F0EFEA`), heat-orange (`#E06A2C`), near-black (`#0D0D0D`) -- rotated deliberately across a carousel
- Heavy sans-serif headlines in Inter 900 at 72-90px, stacked 3-4 lines, tight leading (1.05)
- Peach highlight block (`#F2A36A`) behind one word on white slides only
- Line-wave corner decoration (SVG curved paths) at bottom-right on at least half of slides
- Round lavender arrow button (`#D0C8E8`) with black arrow at bottom-right as swipe indicator
- Metadata strip at top: small Inter 500 labels for category, author, handle
- White text on orange and black variants; near-black text on white variant
- Left-aligned headlines on content slides; generous left padding (60-80px)
- Minimum type weight is 600 -- no thin fonts, ever
- No rounded corners on text blocks; 6px radius on example tags; fully round only on the arrow button

## 2. Color Palette & Roles

### Primary
- **Heat Orange** (`#E06A2C`): Primary accent and dominant slide surface color for content and CTA slides. The heart of the brand -- warm, saturated, almost sunburnt.
- **Heat Orange Light** (`#E37230`): A slightly lighter tint used for hover states, highlight flourishes, and secondary orange surfaces.
- **Near-White** (`#F0EFEA`): Cover slide background. Not pure white -- a warm cream-adjacent neutral that keeps the style from feeling sterile.
- **Near-Black** (`#0D0D0D`): Quote/pause slide background and all primary text on white slides. Deep, inky, but not pure black.
- **Pure White** (`#FFFFFF`): Primary text on orange and black variants.

### Accent
- **Peach Highlight** (`#F2A36A`): The signature highlighter block behind one word on white slides. A warm peach that sits between cream and orange.
- **Peach Deep** (`#E0896B`): Alternate peach for the line-wave decoration on white slides.
- **Lavender Button** (`#D0C8E8`): The soft round arrow button fill. The single cool color in the palette -- its job is to contrast the heat.
- **Lavender Deep** (`#C8BFE0`): Hover/active state for the lavender button.
- **Gold Tan** (`#C9A46B`): Tint for line-wave decoration on black variant slides only.

### Neutral Scale
- **Off-White** (`#F0EFEA`): Primary cream background.
- **Off-White 2** (`#E8E6DF`): A slightly darker cream for subtle inset surfaces on white slides.
- **Charcoal** (`#2B2B2B`): Secondary text on white slides (metadata, handle).
- **Tertiary Gray** (`#6A6A6A`): Muted labels and low-priority text on white slides.
- **Orange Dim** (`rgba(255,255,255,0.7)`): Secondary text on orange slides (handle, metadata sublabels).
- **Black Dim** (`rgba(255,255,255,0.65)`): Secondary text on black slides.

### Surface & Borders
- **Surface White** (`#F0EFEA`): White slide background.
- **Surface Orange** (`#E06A2C`): Orange slide background.
- **Surface Black** (`#0D0D0D`): Black slide background.
- **Surface Tag Dark** (`#0D0D0D`): Black "Example" tag fill on orange slides.
- **Surface Tag Peach** (`#F2A36A`): Peach highlight block behind headline words on white slides.
- **Border Subtle** (`rgba(0,0,0,0.08)`): Rare divider line on white slides.
- **Border White-on-Orange** (`rgba(255,255,255,0.25)`): Thin dividers on orange variants.
- **Divider Rule** (`rgba(255,255,255,0.15)`): Metadata strip dividers on dark variants.

### Shadow Colors
- **Shadow Warm** (`rgba(224,106,44,0.25)`): Subtle orange-tinted ambient shadow for raised elements on white slides.
- **Shadow Medium** (`rgba(0,0,0,0.18)`): Standard shadow for the lavender arrow button.
- **Shadow Deep** (`rgba(0,0,0,0.30)`): High-elevation shadow -- rarely used, this style is mostly flat.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

- **Display & Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

A single-family system. Inter does everything from the 72px hero headline to the 14px metadata label. The variation comes from weight (400 through 900) and size, not from mixing typefaces. This keeps the style feeling like one voice shouting at different volumes.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Inter | 88px | 900 | 1.05 | -2px | Headline stack, 3-4 lines. Used on cover and content slides. |
| Display Stack | Inter | 76px | 900 | 1.05 | -1.5px | Slightly smaller headline variant for longer text. |
| Section Heading | Inter | 56px | 900 | 1.08 | -1px | Mid-size headline for dense content slides. |
| Sub-heading | Inter | 32px | 800 | 1.15 | -0.5px | Supporting statement below a headline. |
| Body Large | Inter | 22px | 600 | 1.45 | 0px | Example text, supporting lines on content slides. |
| Body | Inter | 18px | 600 | 1.50 | 0px | Standard body text. |
| Small / Caption | Inter | 14px | 500 | 1.45 | 0.2px | Metadata strip: category, author, handle. |
| Big Numbers | Inter | 120px | 900 | 1.00 | -3px | Statistics on content or poster slides. |
| Tag Label | Inter | 16px | 800 | 1.00 | 0.3px | Black "Example" tag text on orange slides. |
| CTA Text | Inter | 18px | 800 | 1.00 | 0.3px | Button text, close-out lines. |

### Principles
- **Single family, multiple voices**: Every weight from 400 to 900 is on the table. Inter 900 is the headline voice, Inter 600 is the body voice, Inter 500 is the caption voice. No other families.
- **Minimum weight is 600**: This style has no use for 300 or 400 light weight body text. If you need a softer voice, use 600; if you need a harder voice, use 900. Weight is the main axis of expression.
- **Tight leading on headlines**: Headlines stack 3-4 lines with line-height 1.05. The stack is the composition -- it is meant to read like a magazine cover wordmark, not a paragraph.
- **Left-aligned by default**: Every headline on every content slide is left-aligned. Center-alignment is reserved for the cover slide in some variants. The metadata strip and the arrow button sit at opposite corners to create visual tension.
- **Tight tracking on large sizes**: Hero and display sizes get -1px to -2px letter-spacing. Body text sits at 0. Metadata gets +0.2px. Never use wide tracking -- this style is compact and assertive.
- **Mixed case always**: Headlines and body are mixed case. Uppercase is reserved only for the tiny "EXAMPLE" tag when tag-labeled, and even then only at 16px.

## 4. Component Patterns

### Title Block -- WHITE Variant (Cover Slide)

```html
<div style="background-color: #F0EFEA; padding: 60px; position: relative; min-height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
  <!-- Metadata strip -->
  <div style="font-family: var(--font-body); font-size: 14px; font-weight: 500; color: #2B2B2B; letter-spacing: 0.2px;">Copywriting Tips</div>

  <!-- Line-wave corner decoration (see component below) -->

  <!-- Headline stack -->
  <div style="position: relative; z-index: 2;">
    <h1 style="font-family: var(--font-body); font-size: 88px; font-weight: 900; line-height: 1.05; letter-spacing: -2px; color: #0D0D0D; margin: 0;">
      How to write<br>
      a better<br>
      <span style="background: #F2A36A; padding: 4px 18px; display: inline-block; color: #0D0D0D;">Headline?</span>
    </h1>
  </div>

  <!-- Footer: author + arrow -->
  <div style="display: flex; align-items: flex-end; justify-content: space-between; position: relative; z-index: 2;">
    <div>
      <p style="font-family: var(--font-body); font-size: 18px; font-weight: 700; color: #0D0D0D; margin: 0 0 2px;">Sebastian Bennett</p>
      <p style="font-family: var(--font-body); font-size: 14px; font-weight: 500; color: #6A6A6A; margin: 0;">@reallygreatsite</p>
    </div>
    <!-- Arrow button here -->
  </div>
</div>
```

### Title Block -- ORANGE Variant (Content Slide)

```html
<div style="background-color: #E06A2C; padding: 60px; position: relative; min-height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
  <div style="font-family: var(--font-body); font-size: 14px; font-weight: 500; color: #FFFFFF; letter-spacing: 0.2px;">Copywriting Tips</div>

  <div style="position: relative; z-index: 2;">
    <h1 style="font-family: var(--font-body); font-size: 80px; font-weight: 900; line-height: 1.05; letter-spacing: -1.5px; color: #FFFFFF; margin: 0 0 40px;">
      Use "you" to<br>
      address the<br>
      readers
    </h1>

    <!-- Black example tag -->
    <span style="display: inline-block; background: #0D0D0D; color: #FFFFFF; font-family: var(--font-body); font-size: 16px; font-weight: 800; padding: 10px 22px; letter-spacing: 0.3px; margin: 0 0 18px;">Example</span>
    <p style="font-family: var(--font-body); font-size: 22px; font-weight: 600; line-height: 1.45; color: #FFFFFF; margin: 0;">This is how you can earn<br>more money</p>
  </div>

  <div style="display: flex; align-items: flex-end; justify-content: space-between; position: relative; z-index: 2;">
    <p style="font-family: var(--font-body); font-size: 18px; font-weight: 700; color: #FFFFFF; margin: 0;">Sebastian Bennett</p>
    <!-- Arrow button here -->
  </div>
</div>
```

### Title Block -- BLACK Variant (Quote / CTA Slide)

```html
<div style="background-color: #0D0D0D; padding: 60px; position: relative; min-height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
  <div style="font-family: var(--font-body); font-size: 14px; font-weight: 500; color: #FFFFFF; letter-spacing: 0.2px;">Copywriting Tips</div>

  <div style="position: relative; z-index: 2;">
    <h1 style="font-family: var(--font-body); font-size: 84px; font-weight: 900; line-height: 1.05; letter-spacing: -1.5px; color: #FFFFFF; margin: 0;">
      Follow us to<br>
      get more<br>
      <span style="background: #F2A36A; padding: 4px 18px; display: inline-block; color: #0D0D0D;">Information</span><br>
      and tips like<br>
      this.
    </h1>
  </div>

  <div style="display: flex; align-items: flex-end; justify-content: space-between; position: relative; z-index: 2;">
    <div>
      <p style="font-family: var(--font-body); font-size: 18px; font-weight: 700; color: #FFFFFF; margin: 0 0 2px;">Sebastian Bennett</p>
      <p style="font-family: var(--font-body); font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.65); margin: 0;">@reallygreatsite</p>
    </div>
    <!-- Arrow button here -->
  </div>
</div>
```

### Line-Wave Corner Decoration (SVG, bottom-right)

The signature decoration -- a set of thin curving horizontal lines radiating from the bottom-right corner of the slide. Adjust `stroke` color per variant:
- White slide: `stroke="#E0896B"` (peach)
- Orange slide: `stroke="rgba(255,255,255,0.55)"` (white tint)
- Black slide: `stroke="#C9A46B"` (gold tan)

```html
<svg width="560" height="640" viewBox="0 0 560 640"
     style="position: absolute; right: 0; bottom: 0; pointer-events: none; z-index: 1;"
     fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M560 40 Q 380 52, 180 100"   stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 80 Q 380 94, 160 146"   stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 120 Q 380 136, 140 192" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 160 Q 380 178, 130 238" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 200 Q 380 220, 130 282" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 240 Q 380 262, 140 324" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 280 Q 380 304, 160 362" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 320 Q 380 344, 190 398" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 360 Q 380 382, 220 432" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 400 Q 380 418, 260 462" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 440 Q 420 452, 300 490" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 480 Q 450 488, 340 514" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 520 Q 480 524, 380 540" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M560 560 Q 500 562, 420 570" stroke="#E0896B" stroke-width="2.5" stroke-linecap="round"/>
</svg>
```

### Peach Highlight Word (White variant only)

Inline span that wraps one highlighted word in a cover headline. Used exclusively on white-variant slides.

```html
<span style="background: #F2A36A; padding: 4px 18px; display: inline-block; color: #0D0D0D; line-height: 1.05;">Headline?</span>
```

### Arrow Button Circle (bottom-right swipe indicator)

A round lavender button with a black arrow. Present on every slide as the "swipe next" affordance.

```html
<div style="width: 68px; height: 68px; border-radius: 50%; background: #D0C8E8; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.18);">
  <svg width="26" height="14" viewBox="0 0 26 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 7 L23 7 M17 1 L23 7 L17 13" stroke="#0D0D0D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
```

### Black "Example" Tag (Orange variant)

A sharp-edged black pill for labeling example text on orange slides. Note: not rounded, just slightly inset padding.

```html
<span style="display: inline-block; background: #0D0D0D; color: #FFFFFF; font-family: var(--font-body); font-size: 16px; font-weight: 800; padding: 10px 22px; letter-spacing: 0.3px; border-radius: 2px;">Example</span>
```

### Big Number Stat (Orange variant)

```html
<div style="padding: 40px 0;">
  <p style="font-family: var(--font-body); font-size: 120px; font-weight: 900; line-height: 1.00; letter-spacing: -3px; color: #FFFFFF; margin: 0 0 12px;">87%</p>
  <p style="font-family: var(--font-body); font-size: 22px; font-weight: 600; line-height: 1.45; color: #FFFFFF; max-width: 420px; margin: 0;">of readers decide to keep reading based on the headline alone.</p>
</div>
```

### Metadata Strip (top of every slide)

```html
<div style="display: flex; align-items: center; gap: 16px; font-family: var(--font-body); font-size: 14px; font-weight: 500; letter-spacing: 0.2px;">
  <span style="color: #0D0D0D;">Copywriting Tips</span>
  <!-- On orange/black, swap color to #FFFFFF -->
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- inside the peach highlight padding.
- **8px**: Tight gap -- between small metadata items.
- **12px**: Small gap -- between stat number and its caption.
- **16px**: Base gap -- between author name and handle.
- **24px**: Medium gap -- between headline and supporting statement.
- **32px**: Section internal -- gap between metadata strip and headline block.
- **40px**: Content gap -- between headline block and example tag block.
- **48px**: Section divider -- vertical space between major content blocks.
- **60px**: Standard slide padding -- carousel outer margin.
- **80px**: Maximum section padding -- infographic and slides outer margin.
- **120px**: Story format top/bottom padding.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| Story (1080x1920) | 120px top/bottom, 60px left/right | 960px |

### Alignment & Grid
- **Primary alignment**: Left-aligned on all content slides. The cover slide is also left-aligned but starts the headline block roughly 35% down the slide (not at the top).
- **Headline stack**: Headlines always stack 3-4 lines. Do not let them run as a single long line. Manually break lines to control the composition.
- **Metadata strip**: Always at the top-left. Never centered, never right-aligned.
- **Arrow button**: Always at the bottom-right. Never inside a headline, never at the top.
- **Author signature**: Always at the bottom-left, opposite the arrow button. The vertical axis between metadata (top-left), headline (center-left), and author (bottom-left) creates a strong left spine.
- **Line-wave decoration**: Always at bottom-right, flowing toward upper-left. Never top-left. Never top-right. The wave must "run into" the headline from outside the frame.
- **Vertical rhythm**: 40-48px gaps between top-level content blocks. Headlines breathe. Example tags and supporting text hug close (12-18px).
- **Single-column**: This style does not use multi-column layouts. One headline, one supporting block, one arrow. Always.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, solid variant background | Slide canvas, headline text, the vast majority of elements |
| Subtle (Level 1) | `0 2px 6px rgba(0,0,0,0.12)` | Hover states on the lavender arrow button |
| Card (Level 2) | `0 4px 12px rgba(0,0,0,0.18)` | The lavender arrow button itself |
| Warm (Level 3) | `0 8px 24px rgba(224,106,44,0.25)` | Rare: featured cards on white slides only |
| Overlay (Level 4) | `0 16px 40px rgba(0,0,0,0.30)` | Modals and overlays (rarely used) |

### Border Treatments
- **No card borders**: This style does not use bordered cards. Content is defined by the slide background color and typographic weight, not by containers.
- **Divider rule (dark variants)**: `1px solid rgba(255,255,255,0.15)` -- used only to separate metadata items on dark slides.
- **Divider rule (light variants)**: `1px solid rgba(0,0,0,0.08)` -- used rarely to separate metadata items on white slides.
- **Arrow button edge**: No visible border. Definition comes from the shadow.

### Surface Hierarchy
This style uses **background color swaps** as the primary depth mechanism, not shadows. The three variants (white, orange, black) are the three levels of surface:
1. **Flat background** -- the dominant variant color fills the entire slide.
2. **Peach highlight block** -- sits directly on the white background with no shadow, purely a color overlay.
3. **Black example tag** -- sits directly on the orange background with no shadow.
4. **Lavender arrow button** -- the one element with a real shadow, giving it the highest elevation on every slide.

Elevation is rare in this style. Keep it reserved for the arrow button and the occasional hover state.

## 7. Do's and Don'ts

### Do
- **Use the three-variant system deliberately**. A 5-slide carousel rotates: Cover WHITE -> Content ORANGE -> Content ORANGE -> Quote BLACK -> CTA ORANGE. This rotation is the backbone of the style.
- **Use the line-wave decoration on at least half of slides**. It is the visual signature. Place it at bottom-right, flowing into the slide.
- **Use peach highlight (`#F2A36A`) only on white slides**. Wrap one key word in the headline with a peach block -- never more than one word.
- **Use Inter 900 for every headline**. The heavy weight is non-negotiable. Drop to 800 only if 900 is unavailable.
- **Place the metadata strip at the top-left of every slide**. Category first, author handle second line below.
- **Place the lavender arrow button at the bottom-right of every slide**. It is the only rounded element in the composition.
- **Stack headlines 3-4 lines with manual line breaks**. The block shape matters as much as the words.
- **Use tight letter-spacing (-1px to -2px) on all display sizes**. Loose tracking reads wrong in this style.
- **Keep the color palette restricted**. Orange, white, black, peach, and lavender. No blues, no greens, no additional accents.
- **Use Inter 600 minimum for body text**. The style speaks at a confident volume.
- **Name the slide variants when briefing**. Label them WHITE, ORANGE, or BLACK in comments so the rotation stays intentional.

### Don't
- **Don't make all-orange carousels**. Without the rotation, the style is boring and loses its cover-story energy. Always mix at least two variants per carousel.
- **Don't use peach highlight on orange slides**. Peach and heat-orange have almost no contrast -- the highlight will disappear.
- **Don't use thin fonts**. Nothing lighter than Inter 600. Never use weights 300 or 400 for body or headline text.
- **Don't use rounded corners on text blocks, tags, or cards**. The only round element allowed is the lavender arrow button. Peach highlight and example tag have 0-2px radius.
- **Don't center-align content slides**. Headlines are always left-aligned.
- **Don't let a headline run as a single line**. Force 3-4 line stacks with `<br>` tags.
- **Don't mix typefaces**. Inter only. No serifs, no monospace, no display fonts.
- **Don't place the line-wave decoration at the top of the slide**. It always anchors from the bottom-right corner.
- **Don't use more than one peach-highlighted word per headline**. The highlight is a hook, not an ornament.
- **Don't forget the lavender arrow button**. Every slide needs a swipe affordance, even the last one.
- **Don't use shadows on text**. Shadows are reserved for the arrow button and (rarely) featured cards.
- **Don't introduce new colors**. Stick to the 8-color palette. Extra colors dilute the brand.

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
- **Typography scale**: Display Hero is 88px for cover slides, 80px for content slides. Big Numbers at 120px.
- **Padding**: 60px on all sides. Content area 960x960px.
- **Variant rotation**: A 5-slide carousel should follow the pattern Cover WHITE -> Content ORANGE -> Content ORANGE -> Quote BLACK -> CTA ORANGE. For 3-slide carousels use WHITE -> ORANGE -> BLACK. For 7-slide carousels, insert an additional ORANGE and a second BLACK for rhythm.
- **Cover slide (WHITE)**: Metadata strip top-left. Headline block positioned center-vertical with peach highlight on last word. Author block bottom-left. Arrow bottom-right. Line-wave decoration bottom-right, peach.
- **Content slides (ORANGE)**: Left-aligned headline stack. Optional black "Example" tag + supporting line below. Line-wave decoration optional, white tint.
- **Quote slide (BLACK)**: Left-aligned headline stack, optionally with peach-highlighted word. Gold-tan line-wave decoration required.
- **CTA slide (ORANGE)**: "Follow for more" headline, arrow button prominent.
- **Swipe indicator**: The lavender arrow button at bottom-right on every slide is itself the swipe indicator. No dots needed.

### Infographic (1080px wide, variable height)
- **Typography**: Display Hero at 88px for the title section. Section Heading at 56px for internal divisions.
- **Padding**: 60px left/right, 80px top/bottom.
- **Variant rotation**: Use full-bleed variant bands. A single infographic can stack a WHITE title band, an ORANGE body band, a BLACK quote band, and an ORANGE CTA band -- each full-width.
- **Section spacing**: 80px vertical gap between variant bands. No borders between them -- the color change is the divider.
- **Line-wave decoration**: Place one instance in the bottom-right corner of the overall composition and one at the transition between the first two bands for rhythm.
- **Footer**: Author signature and handle in a bottom strip, color matching the final band.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 120px. Section Heading becomes 72px. Body Large becomes 28px.
- **Padding**: 80px on all sides. Content area 1760x920px.
- **Layout**: Headlines stack 2-3 lines (shorter stacks for wider canvas). Content block occupies left 65% of the slide; line-wave decoration occupies right 35%.
- **Cover slide**: Headline left-aligned, peach-highlighted word optional. Metadata top-left, author bottom-left, arrow bottom-right.
- **Content slide (ORANGE)**: Left headline, supporting black example tag and text on the left. Line-wave decoration extends from right edge across the right third of the slide.
- **Quote slide (BLACK)**: Full-slide headline, centered in the left 65%. Gold-tan line-wave on the right.

### Poster (1080x1350px)
- **Typography**: Display Hero at 96px. Big Numbers at 140px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top zone (15%) for metadata strip. Middle zone (60%) for the headline stack, peach-highlighted where applicable. Bottom zone (25%) for author signature, supporting text, and arrow button.
- **Variant choice**: Posters are typically single-variant -- pick ONE of WHITE, ORANGE, or BLACK for the entire poster. The variant choice defines the poster's tone.
- **Line-wave decoration**: Always present on posters, flowing from bottom-right up and to the left, extending further than on carousel format (up to 60% of poster width).

### Story (1080x1920px)
- **Typography**: Display Hero becomes 104px (the largest practical size for the narrow format). Supporting text 26px. Big Numbers at 144px.
- **Padding**: **120px top/bottom**, 60px left/right. The generous top/bottom padding reserves space for Instagram/IG Story UI chrome (profile bubble at top, reply bar at bottom).
- **Hero sizing**: The hero headline stack takes ~30% more vertical space than in carousel format -- this format is built for thumb-stopping impact. Use 104px headline at line-height 1.03 for maximum density.
- **Layout**: Single-column, everything stacks vertically. Metadata strip at top (below Story chrome). Headline block centered vertically, left-aligned, occupying ~50% of the vertical space. Author signature and arrow button anchored near the bottom chrome safe zone.
- **Variant choice**: Story carousels rotate WHITE -> ORANGE -> BLACK across 3 stories, or single-variant for a standalone story.
- **Line-wave decoration**: Required on every Story. Because the format is tall, use a vertically-extended wave that runs from bottom-right up to 80% of the slide height. Scale the SVG viewBox to 560x1280 for stories.
- **Arrow button**: Position slightly higher than in square formats (at ~85% vertical position) so it clears the Instagram reply bar.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Heat Orange | `#E06A2C` | Orange variant background, primary accent |
| Heat Orange Light | `#E37230` | Hover / secondary orange surface |
| Near-White | `#F0EFEA` | White variant background (cream) |
| Near-Black | `#0D0D0D` | Black variant background, primary text on white |
| Pure White | `#FFFFFF` | Primary text on orange and black variants |
| Peach Highlight | `#F2A36A` | Signature highlight block on white slides |
| Peach Deep | `#E0896B` | Line-wave decoration on white slides |
| Lavender Button | `#D0C8E8` | Round arrow button fill |
| Lavender Deep | `#C8BFE0` | Arrow button hover state |
| Gold Tan | `#C9A46B` | Line-wave decoration on black slides |
| Charcoal | `#2B2B2B` | Secondary text on white slides |
| Tertiary Gray | `#6A6A6A` | Muted metadata on white slides |

### Font Declarations

```css
/* Display and body (single family system) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-orange: #E06A2C;
  --color-orange-light: #E37230;
  --color-white-bg: #F0EFEA;
  --color-black-bg: #0D0D0D;
  --color-white: #FFFFFF;

  /* Colors -- Accent */
  --color-peach-highlight: #F2A36A;
  --color-peach-deep: #E0896B;
  --color-lavender: #D0C8E8;
  --color-lavender-deep: #C8BFE0;
  --color-gold-tan: #C9A46B;

  /* Colors -- Neutral Scale */
  --color-off-white: #F0EFEA;
  --color-off-white-2: #E8E6DF;
  --color-charcoal: #2B2B2B;
  --color-tertiary: #6A6A6A;
  --color-orange-dim: rgba(255, 255, 255, 0.7);
  --color-black-dim: rgba(255, 255, 255, 0.65);

  /* Colors -- Surfaces */
  --color-surface-white: #F0EFEA;
  --color-surface-orange: #E06A2C;
  --color-surface-black: #0D0D0D;
  --color-surface-tag-dark: #0D0D0D;
  --color-surface-tag-peach: #F2A36A;

  /* Colors -- Borders */
  --color-border-subtle: rgba(0, 0, 0, 0.08);
  --color-border-white-on-orange: rgba(255, 255, 255, 0.25);
  --color-divider-dark: rgba(255, 255, 255, 0.15);

  /* Colors -- Shadows */
  --shadow-warm: rgba(224, 106, 44, 0.25);
  --shadow-medium: rgba(0, 0, 0, 0.18);
  --shadow-deep: rgba(0, 0, 0, 0.30);

  /* Typography -- Families */
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 88px;
  --text-display-stack: 76px;
  --text-section-heading: 56px;
  --text-sub-heading: 32px;
  --text-body-large: 22px;
  --text-body: 18px;
  --text-small: 14px;
  --text-big-number: 120px;
  --text-tag: 16px;
  --text-cta: 18px;

  /* Typography -- Weights */
  --weight-headline: 900;
  --weight-sub-heading: 800;
  --weight-body-bold: 700;
  --weight-body: 600;
  --weight-caption: 500;

  /* Typography -- Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.08;
  --leading-sub-heading: 1.15;
  --leading-body-large: 1.45;
  --leading-body: 1.50;
  --leading-small: 1.45;
  --leading-number: 1.00;

  /* Typography -- Letter Spacing */
  --tracking-hero: -2px;
  --tracking-display: -1.5px;
  --tracking-heading: -1px;
  --tracking-sub: -0.5px;
  --tracking-body: 0px;
  --tracking-caption: 0.2px;
  --tracking-tag: 0.3px;

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
  --space-story: 120px;

  /* Borders */
  --radius-tag: 2px;
  --radius-button: 50%;
  --radius-none: 0px;

  /* Composed Shadows */
  --shadow-button: 0 4px 12px rgba(0, 0, 0, 0.18);
  --shadow-button-hover: 0 2px 6px rgba(0, 0, 0, 0.12);
  --shadow-warm-card: 0 8px 24px rgba(224, 106, 44, 0.25);
  --shadow-overlay: 0 16px 40px rgba(0, 0, 0, 0.30);
}
```

### Slide Variant System (quick reference)

```
VARIANT     BACKGROUND    TEXT       HIGHLIGHT   LINE-WAVE COLOR       USE
-------     ----------    ----       ---------   ---------------       ---
WHITE       #F0EFEA       #0D0D0D    #F2A36A     #E0896B (peach)       Cover, title slides
ORANGE      #E06A2C       #FFFFFF    none        rgba(255,255,255,.55) Content slides, CTA
BLACK       #0D0D0D       #FFFFFF    #F2A36A     #C9A46B (gold-tan)    Quote, pause, final CTA
```

### System Font Fallbacks
- **Inter (if Google Fonts fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
