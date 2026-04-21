# Design Style: Cinematic Romance

## 1. Visual Theme & Atmosphere

Cinematic Romance is the design language of a streaming-platform teaser poster -- the visual equivalent of a Netflix limited-series key art or a Vogue title card caught in the opening seconds of a perfume commercial. Inspired by Borcelle-style cinematic brand films, this style treats the photograph as the entire design surface: a full-bleed, cool-graded portrait fills the canvas edge to edge, blurred just enough to feel atmospheric, and type floats directly on top of it. There is no card, no frame, no chrome, no container. The photo IS the design. A heavy-slant hot pink script headline swoops across the middle of the composition with long confident descenders, framed above by a tight uppercase sans-serif "PRESENTS" line and below by an uppercase sans-serif logline set in the same hot pink.

The color grade is the signature move. Every photograph passes through a cool cyan-teal tint (`#3a5f6b` to `#5a8591`) that desaturates skin, flattens highlights, and unifies otherwise clashing inputs into a single cinematic palette. This teal background creates the perfect foil for the hot pink (`#E8449A`) display type -- the complementary tension between cool teal and hot pink is what makes this style feel like a romance-genre title card rather than generic editorial. The pink is never muted: it is hot, saturated, fully lit, with enough magenta to push through the blur and dominate the composition. The script typeface is the most recognisable element -- a heavy, steeply-slanted chancery display face (Allura, standing in for Monotype Corsiva / Allura Pro) with tight letter connections, pronounced ball terminals, and exaggerated descenders on letters like `g`, `y`, and `L`.

The supporting type is tiny, uppercase, letter-spaced, and always hot pink. It serves as the "studio presents" line above the script and the logline below it -- both framing the script like cinematic credits. A minimal UI chrome element (a small square pause button in the bottom-left corner, and optionally a small triangle play indicator at bottom-center) sells the "this is a movie poster" fiction without becoming a real control. Real-world analogies: a Netflix originals key art card, a 1970s Harlequin romance paperback cover reimagined for streaming, the opening title of a Sofia Coppola film, the teaser poster for a Luca Guadagnino romance.

**Key Characteristics:**
- Full-bleed cool-graded portrait photograph as the entire canvas -- no borders, no frames, no cards
- Cool cyan-teal color grade (`#3a5f6b` background tone) unifies all photography
- Hot pink (`#E8449A`) as the only type color -- script headline, uppercase top line, and uppercase logline
- Heavy-slant script display face (Allura) for the central headline, 180-240px on 1080 canvas
- Uppercase tracked sans-serif (Inter) for the "STUDIO PRESENTS" line at ~14px, letter-spacing 3-4px
- Uppercase centered sans-serif logline in the same hot pink, 16-20px, line-height 1.45
- Type centered horizontally and vertically stacked: top line, huge script, logline
- Blurred atmospheric photography (8-16px Gaussian blur) -- never sharp, always soft
- Minimal cinematic UI chrome: 40x40px dark pause square bottom-left, optional triangle play bottom-center
- No cards, no borders, no shadows on containers -- depth comes entirely from the photograph
- Content-only slides (no photo available) fall back to a dark-teal-to-hot-pink radial/linear gradient
- Zero use of white backgrounds -- the style breaks the moment a white surface appears
- Text shadow on script headline: subtle `0 2px 20px rgba(0,0,0,0.35)` for legibility over photo
- Body-copy slides use hot pink on deep teal, never white on white

## 2. Color Palette & Roles

### Primary
- **Teal Graded** (`#3a5f6b`): Primary canvas tone. The cool cyan-teal that every photo is graded toward and that content-only slides fall back to. Reads as cinematic, slightly desaturated, atmospheric.
- **Hot Pink** (`#E8449A`): Primary and only type color. Used for every headline, every logline, every uppercase line. Vivid, saturated, lit. This is the signature hue of the style.
- **Off-White Dim** (`#f2e6ec`): Softened near-white for rare cases where pink-on-teal contrast fails. Always tinted warm pink, never pure white.

### Accent
- **Pink Deep** (`#C1297A`): Hover/active state for pink interactive elements and the second stop in the dark-to-pink gradient fallback.
- **Pink Hot** (`#FF5FAE`): Brighter pink used for the "now playing" indicator dot, hover glow, and any ultra-highlighted word inside the script headline.
- **Teal Deep** (`#1f3942`): The darker end of the teal gradient, used for vignette corners and content slides that need a dark base.

### Neutral Scale
- **Ink** (`#0d1a1f`): Near-black with a teal undertone. Used for the pause-button chrome and any dark UI element. Never pure black.
- **Graded Skin** (`#b88e87`): The color family that skin tones collapse to under the teal grade -- warm peach muted by cool wash. Useful when generating synthetic photo placeholders.
- **Teal Mid** (`#4b7583`): The midtones of the canvas blur -- useful for photo-less content slide backgrounds.
- **Teal Highlight** (`#78a2ad`): The blown highlights of the graded photo -- rim light, edge of cheek, hair backlight.
- **Caption Pink Dim** (`rgba(232,68,154,0.72)`): Slightly muted hot pink for secondary captions and metadata.

### Surface & Borders
- **Surface Canvas** (`linear-gradient(180deg, #1f3942 0%, #3a5f6b 40%, #4b7583 100%)`): The content-only slide background when no photo is available.
- **Surface Romantic** (`radial-gradient(ellipse at 50% 60%, #E8449A 0%, #C1297A 35%, #1f3942 100%)`): Alternate fallback for CTA slides -- dark teal corners bleeding into a hot pink center.
- **Surface Inset** (`rgba(13,26,31,0.35)`): Subtle dark scrim laid over photos to boost type legibility, never more than 35% opacity.
- **Border None**: This style has effectively no borders. Containers are invisible.
- **Divider Rule** (`rgba(232,68,154,0.35)`): Thin hot-pink line used once per slide at most -- under a logline or between the script and a caption.

### Shadow Colors
- **Type Glow Pink** (`0 0 32px rgba(232,68,154,0.25)`): Soft pink glow around the script headline to make it feel lit.
- **Type Shadow Dark** (`0 2px 20px rgba(13,26,31,0.45)`): Drop shadow under the script for legibility on lighter photo areas.
- **Vignette** (`radial-gradient(ellipse at center, transparent 40%, rgba(13,26,31,0.6) 100%)`): Dark vignette applied on top of every photo to pull focus toward the center.
- **Caption Halo** (`0 1px 10px rgba(13,26,31,0.55)`): Faint shadow behind uppercase caption text.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Allura&family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

- **Display Script**: `'Allura', 'Great Vibes', 'Monotype Corsiva', 'Apple Chancery', cursive`
- **Body / UI**: `'Inter', 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Script | Allura | 220px | 400 | 0.90 | 0px | The huge pink script headline. Only weight Allura has. |
| Presents Line | Inter | 14px | 600 | 1.00 | 3.5px | "BORCELLE STUDIO PRESENTS" above the script. Uppercase. |
| Logline | Inter | 18px | 600 | 1.45 | 1.2px | Uppercase centered copy below the script. Max 3 lines. |
| Episode Label | Inter | 12px | 700 | 1.00 | 4px | "EPISODE ONE" / "CHAPTER 01" metadata. Uppercase. |
| Body Large | Inter | 22px | 500 | 1.55 | 0.3px | Long-form reading copy on content slides. Hot pink on teal. |
| Body | Inter | 18px | 500 | 1.60 | 0.2px | Standard body on content slides. |
| Caption | Inter | 13px | 500 | 1.40 | 1px | Photo credits, scene metadata, timestamps. Uppercase. |
| Big Number | Allura | 180px | 400 | 0.90 | 0px | Script-set numerals for stat displays. Pink. |
| Stat Label | Inter | 13px | 600 | 1.00 | 3px | Uppercase label below a big script number. |
| UI Element | Inter | 11px | 600 | 1.00 | 2px | Pause button label, scene index, "NOW PLAYING". |

### Principles
- **Script as the sole voice of authority**: Only the headline is script. Everything else is uppercase sans. The contrast between heavy-slant cursive and geometric uppercase is the style's core typographic tension. Never set body copy in script -- it becomes illegible instantly.
- **Hot pink is non-negotiable**: Every piece of type, regardless of hierarchy, is `#E8449A`. This is not a style where color communicates hierarchy -- size, case, and weight do. Color is identity.
- **Uppercase everywhere except the script**: Supporting type is always uppercase with 1-4px letter-spacing. Mixed case appears only inside the script headline.
- **Tracking scales inversely with size**: Tiny caption text (12px) gets 3-4px of spacing; 18px logline copy gets 1.2px; the script headline has 0px tracking because Allura's connected letterforms cannot be stretched.
- **Line height is tight**: Script runs at 0.90 (letters almost touching descender to ascender). Loglines run at 1.45. This echoes poster typesetting -- dense, not airy.
- **Type lives on the photo**: There is no type-against-solid-surface treatment in the cover slide. The type sits directly on the image with a subtle drop shadow for legibility.
- **One script per slide**: Never more than one script-set phrase. Multiple script headlines compete and break the poster fiction.

## 4. Component Patterns

### Title Block (Cover / Hero Over Photo)

```html
<div style="position: relative; width: 100%; min-height: 608px; background: linear-gradient(180deg, #1f3942 0%, #3a5f6b 55%, #4b7583 100%); overflow: hidden; text-align: center;">
  <!-- Photo layer (replace with actual image when available) -->
  <div style="position: absolute; inset: 0; background-image: url('photo.jpg'); background-size: cover; background-position: center; filter: blur(12px) saturate(0.85) hue-rotate(-10deg) brightness(0.85);"></div>
  <!-- Teal grade overlay -->
  <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(31,57,66,0.55) 0%, rgba(58,95,107,0.35) 50%, rgba(31,57,66,0.65) 100%); mix-blend-mode: multiply;"></div>
  <!-- Vignette -->
  <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 40%, rgba(13,26,31,0.55) 100%);"></div>
  <!-- Content -->
  <div style="position: relative; z-index: 2; padding: 72px 60px 120px; display: flex; flex-direction: column; justify-content: center; min-height: 608px;">
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 3.5px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 32px; text-shadow: 0 1px 10px rgba(13,26,31,0.55);">Borcelle Studio Presents</p>
    <h1 style="font-family: var(--font-display); font-size: 220px; font-weight: 400; line-height: 0.90; color: var(--color-pink); margin: 0 0 40px; text-shadow: 0 2px 20px rgba(13,26,31,0.45), 0 0 32px rgba(232,68,154,0.25);">Love Language</h1>
    <p style="font-family: var(--font-body); font-size: 18px; font-weight: 600; letter-spacing: 1.2px; line-height: 1.45; text-transform: uppercase; color: var(--color-pink); max-width: 720px; margin: 0 auto; text-shadow: 0 1px 10px rgba(13,26,31,0.55);">Love Language explores the unspoken connections that bind people, revealing how love transcends words through shared glances, gestures, and moments of understanding.</p>
  </div>
  <!-- Pause chrome -->
  <div style="position: absolute; bottom: 28px; left: 28px; z-index: 3; width: 40px; height: 40px; background: rgba(13,26,31,0.85); display: flex; align-items: center; justify-content: center; border-radius: 2px;">
    <div style="display: flex; gap: 4px;"><span style="width: 4px; height: 14px; background: #f2e6ec;"></span><span style="width: 4px; height: 14px; background: #f2e6ec;"></span></div>
  </div>
</div>
```

### Numbered Item (Chapter Card Over Gradient)

```html
<div style="position: relative; padding: 64px 60px; background: linear-gradient(135deg, #1f3942 0%, #3a5f6b 60%, #4b7583 100%); overflow: hidden; text-align: center;">
  <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 70%, rgba(232,68,154,0.18) 0%, transparent 60%);"></div>
  <div style="position: relative; z-index: 1;">
    <p style="font-family: var(--font-body); font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 24px;">Chapter One</p>
    <h2 style="font-family: var(--font-display); font-size: 140px; font-weight: 400; line-height: 0.90; color: var(--color-pink); margin: 0 0 28px; text-shadow: 0 2px 20px rgba(13,26,31,0.45);">First Glance</h2>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 600; letter-spacing: 1.2px; line-height: 1.50; text-transform: uppercase; color: var(--color-pink); max-width: 560px; margin: 0 auto;">The moment across a crowded room when the world softens and everything else falls away.</p>
  </div>
</div>
```

### Stat Display (Script Numeral)

```html
<div style="position: relative; padding: 80px 40px; background: linear-gradient(180deg, #1f3942 0%, #3a5f6b 100%); text-align: center; overflow: hidden;">
  <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(232,68,154,0.15) 0%, transparent 55%);"></div>
  <div style="position: relative; z-index: 1;">
    <p style="font-family: var(--font-display); font-size: 180px; font-weight: 400; line-height: 0.90; color: var(--color-pink); margin: 0 0 12px; text-shadow: 0 2px 24px rgba(13,26,31,0.5);">92%</p>
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--color-pink); margin: 0;">Of Viewers Finished The Series</p>
  </div>
</div>
```

### Comparison Grid (Two Photo Halves)

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: 540px;">
  <div style="position: relative; background: linear-gradient(180deg, #1f3942 0%, #3a5f6b 100%); overflow: hidden; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(232,68,154,0.12) 0%, transparent 60%);"></div>
    <div style="position: relative; z-index: 1; text-align: center; padding: 40px;">
      <p style="font-family: var(--font-body); font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 20px;">Act I</p>
      <h3 style="font-family: var(--font-display); font-size: 96px; font-weight: 400; line-height: 0.90; color: var(--color-pink); margin: 0 0 20px;">The Meeting</h3>
      <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--color-pink); max-width: 320px; margin: 0 auto;">A chance encounter at the last train of the night.</p>
    </div>
  </div>
  <div style="position: relative; background: linear-gradient(180deg, #3a5f6b 0%, #1f3942 100%); overflow: hidden; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(232,68,154,0.12) 0%, transparent 60%);"></div>
    <div style="position: relative; z-index: 1; text-align: center; padding: 40px;">
      <p style="font-family: var(--font-body); font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 20px;">Act II</p>
      <h3 style="font-family: var(--font-display); font-size: 96px; font-weight: 400; line-height: 0.90; color: var(--color-pink); margin: 0 0 20px;">The Letter</h3>
      <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--color-pink); max-width: 320px; margin: 0 auto;">Words she could never say in person.</p>
    </div>
  </div>
</div>
```

### List Item (Scene Index)

```html
<div style="display: flex; align-items: baseline; gap: 32px; padding: 24px 0; border-bottom: 1px solid rgba(232,68,154,0.25);">
  <span style="font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--color-pink); min-width: 64px;">S01 &middot; E03</span>
  <div style="flex: 1;">
    <h4 style="font-family: var(--font-display); font-size: 56px; font-weight: 400; line-height: 0.95; color: var(--color-pink); margin: 0 0 8px;">In the Rain</h4>
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(232,68,154,0.72); margin: 0;">Directed by S. Coppola &middot; 42 Minutes</p>
  </div>
</div>
```

### Quote Block (Floating Script Pull-Quote)

```html
<div style="position: relative; padding: 100px 80px; background: linear-gradient(180deg, #1f3942 0%, #3a5f6b 50%, #1f3942 100%); text-align: center; overflow: hidden;">
  <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(232,68,154,0.18) 0%, transparent 65%);"></div>
  <div style="position: relative; z-index: 1;">
    <p style="font-family: var(--font-body); font-size: 12px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: var(--color-pink); margin: 0 0 36px;">A Critic Wrote</p>
    <p style="font-family: var(--font-display); font-size: 96px; font-weight: 400; line-height: 0.95; color: var(--color-pink); margin: 0 0 36px; text-shadow: 0 2px 20px rgba(13,26,31,0.5);">"Breathtaking."</p>
    <div style="display: inline-block; width: 48px; height: 2px; background: var(--color-pink); margin: 0 0 20px;"></div>
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: var(--color-pink); margin: 0;">The New Yorker</p>
  </div>
</div>
```

### CTA Block (Teaser Finale)

```html
<div style="position: relative; padding: 100px 60px; background: radial-gradient(ellipse at 50% 60%, #E8449A 0%, #C1297A 30%, #1f3942 100%); text-align: center; overflow: hidden;">
  <div style="position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 40%, rgba(13,26,31,0.45) 100%);"></div>
  <div style="position: relative; z-index: 1;">
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 3.5px; text-transform: uppercase; color: #f2e6ec; margin: 0 0 32px; text-shadow: 0 1px 10px rgba(13,26,31,0.55);">Streaming April 14</p>
    <h2 style="font-family: var(--font-display); font-size: 180px; font-weight: 400; line-height: 0.90; color: #f2e6ec; margin: 0 0 40px; text-shadow: 0 2px 24px rgba(13,26,31,0.55);">Watch Now</h2>
    <a style="display: inline-block; font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #1f3942; background: #f2e6ec; padding: 20px 56px; text-decoration: none; border-radius: 2px;">Play Trailer</a>
  </div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between the two vertical bars of the pause-button glyph.
- **8px**: Tight gap -- between stat numeral and its label.
- **12px**: Small gap -- between logline line breaks if a hard break is used.
- **20px**: Base gap -- between episode label and chapter title.
- **32px**: Medium gap -- between "STUDIO PRESENTS" line and the script headline.
- **40px**: Primary gap -- between script headline and logline below it.
- **60px**: Section padding -- left/right canvas margin on cover slides.
- **80px**: Large padding -- top padding on CTA and cover slides.
- **120px**: Extra-large padding -- top/bottom padding for Story format.
- **160px**: Story safe zone -- keep all type at least 160px from top/bottom edges on 1080x1920 canvases.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px left/right, 80px top/bottom | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 100px top/bottom | 960px |
| **Story (1080x1920)** | **60px left/right, 120px top/bottom** | **960px** (160px top/bottom safe zones) |

### Alignment & Grid
- **Primary alignment**: Centered for everything. This is a poster style -- content is axial, vertically stacked, and horizontally centered.
- **Vertical stack**: Every slide follows the pattern `[uppercase label] -> [script headline] -> [uppercase logline]`. Optional fourth line: thin pink divider + secondary caption.
- **Grid**: Single-column dominates. Two-column grids appear only for comparison/act-break slides, and both halves must share the same teal grade so they read as one image.
- **Content gravity**: Title and cover slides center vertically within the canvas. Content slides may anchor the script headline at ~55% canvas height (golden ratio low) to leave room for a logline beneath.
- **Photo treatment**: Full-bleed, blurred 8-16px, saturation 0.85, teal multiply overlay at 35-55%, dark vignette at corners. Every photo passes through this pipeline.
- **Chrome**: 40x40px dark pause square sits at `bottom: 28px; left: 28px;` on cover slides. Optional small triangle play indicator at `bottom: 28px; left: 50%;` translateX(-50%). No other UI chrome exists.
- **No cards**: Containers are invisible. If a content region needs separation, it gets its own gradient canvas -- not a card.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | Teal gradient canvas, no overlay | Base content slides with no photo |
| Graded (Level 1) | Photo + teal multiply overlay at 40% + dark vignette | Standard cover slides with background photography |
| Lit (Level 2) | Level 1 + radial pink glow `rgba(232,68,154,0.15)` at 50% 60% | Feature slides where the script headline is the focal point |
| Cinematic (Level 3) | Level 2 + `text-shadow: 0 2px 20px rgba(13,26,31,0.45), 0 0 32px rgba(232,68,154,0.25)` on headline | Hero cover slides |
| Chrome (Level 4) | Pause button `rgba(13,26,31,0.85)` 40x40 square at bottom-left | UI chrome layer that sits above everything |

### Border Treatments
- **No standard borders**: This style does not use borders on containers. Depth comes from photography, gradient, and vignette -- never from rectangles with outlines.
- **Thin pink rule** (`1px solid rgba(232,68,154,0.35)` or `2px solid #E8449A`): Used exactly once per slide, either under a logline or as a 48x2px horizontal accent between quote body and attribution.
- **Divider accent** (`width: 48px; height: 2px; background: #E8449A;`): Short centered horizontal rule. Appears in quote blocks and CTA blocks as a separator.
- **Chrome corners** (`border-radius: 2px` on pause button): The only rounded corners in the style. Almost-square, just softened enough to feel like UI rather than a hard block.

### Surface Hierarchy
On a photo canvas, depth is communicated by optical weight, not shadows:
1. **Photograph layer** (bottom) -- blurred, graded, vignetted. Provides atmosphere.
2. **Teal multiply overlay** (`rgba(31,57,66,0.35-0.55)`) -- unifies the photo with the palette.
3. **Vignette layer** (dark radial) -- pulls the eye toward center.
4. **Pink radial glow** (subtle `rgba(232,68,154,0.15)`) -- optional, adds the lit-from-within romance feeling.
5. **Type layer** -- the script headline, loglines, and labels in hot pink sit above everything.
6. **Chrome layer** -- the pause square sits above type, darker than type, in the corner only.

## 7. Do's and Don'ts

### Do
- Do use a full-bleed, blurred, teal-graded photograph as the cover canvas whenever a photo is available.
- Do set every piece of type in hot pink (`#E8449A`) -- every label, every headline, every logline, no exceptions.
- Do use Allura (or the closest available chancery script) for the central headline, sized 180-240px on a 1080 canvas with line-height 0.90.
- Do wrap the script headline with an uppercase 12-14px "STUDIO PRESENTS" label above and an uppercase 16-20px logline below.
- Do apply a subtle text shadow `0 2px 20px rgba(13,26,31,0.45)` on the script headline for legibility over photos.
- Do apply the teal multiply overlay at 35-55% opacity to every background photo -- this is the grade that makes everything feel cinematic.
- Do add the small 40x40px dark pause square `rgba(13,26,31,0.85)` at `bottom: 28px; left: 28px;` on cover slides to sell the poster fiction.
- Do fall back to a `linear-gradient(180deg, #1f3942 0%, #3a5f6b 55%, #4b7583 100%)` canvas when no photo is available.
- Do use 3-4px letter-spacing on uppercase labels -- the tight geometric tracking is part of the signature.
- Do use `text-transform: uppercase` on every supporting type element.
- Do keep cover slides axial and centered -- script headline dead-centre, label and logline stacked above and below.
- Do use `filter: blur(12px) saturate(0.85)` on the photo layer to achieve the atmospheric look.

### Don't
- Don't use white backgrounds. A white surface breaks the cinematic fiction instantly. Fallback is always dark teal to pink gradient.
- Don't use any color other than hot pink for type. No black text, no white text, no teal text. Pink only. (Exception: the CTA block button can invert to `#f2e6ec` on pink.)
- Don't use sharp, unblurred photography. Photos must always be softened 8-16px. The style is atmospheric, not editorial-sharp.
- Don't set body copy in the script typeface. Allura is headline-only. Body copy is always Inter uppercase.
- Don't use mixed case on supporting type. Loglines, labels, captions, and metadata are always uppercase.
- Don't use cards, borders, or frames around content. Type floats on the photo. If you need structural separation, use a new gradient canvas, not a container.
- Don't use drop shadows on cards (there are no cards). The only shadow in the style is the subtle pink/dark shadow on the script headline.
- Don't use more than one script-set phrase per slide. Multiple scripts compete and collapse the hierarchy.
- Don't use green, blue, orange, or any non-pink accent. The palette is teal + hot pink. Anything else breaks the identity.
- Don't use serif body fonts. Supporting type is geometric sans only (Inter).
- Don't use tight letter-spacing on uppercase labels. Minimum 2px, ideal 3-4px.
- Don't set the script headline below 140px on a 1080 canvas -- it needs to dominate. Sub-140px script reads as afterthought.

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
- **Typography scale**: Display Script becomes 180px (from 220px baseline). Presents Line stays 14px. Logline stays 18px. Episode Label 12px.
- **Padding**: 60px left/right, 80px top/bottom. Content area is 960x920px.
- **Cover slide**: Full-bleed teal-graded photo. "STUDIO PRESENTS" label centered at ~25% canvas height. Script headline centered at ~50%. Logline centered at ~72%. Pause chrome at bottom-left.
- **Content slides**: If no photo, use dark-teal-to-pink gradient fallback. Single script headline per slide, max 2 lines. Logline underneath. Optional episode label above.
- **Comparison slides**: Split into two vertical halves (540x1080 each), each a self-contained graded canvas with its own script headline and caption.
- **Swipe indicator**: Small hot-pink dots at `bottom: 12px` center, 6px diameter, `rgba(232,68,154,0.4)` inactive and `#E8449A` active.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Script at 220px for the title section. Scene-index list items use 56px Allura.
- **Padding**: 60px left/right, 80px top/bottom.
- **Section spacing**: 120px vertical gap between major sections (larger than other styles -- the cinematic pacing demands breathing room).
- **Vertical rhythm**: Alternate between full-bleed photo sections and gradient-only sections. Never two full-bleed photo sections in a row -- introduce a gradient interlude between them.
- **Footer**: Small "END OF FEATURE" label in uppercase hot pink + small pink divider rule. No logo lockup.

### Slides (1920x1080px)
- **Typography scale up**: Display Script becomes 280px. Presents Line becomes 16px. Logline becomes 22px.
- **Padding**: 80px all sides. Content area is 1760x920px.
- **Layout**: Axial, centered. The script headline sits dead-center vertically with 120-160px clearance above and below for the label and logline.
- **Title slides**: Full-bleed graded photo. Vertical stack center-aligned: label (top), script (middle), logline (bottom). Pause chrome at `bottom: 40px; left: 40px;`.
- **Content slides**: Either full-bleed photo or gradient canvas. Script headline at center, logline beneath. Optional thin pink rule and attribution beneath logline.
- **CTA slides**: Dark-teal-to-hot-pink radial gradient. "STREAMING APRIL 14" label at top. Script "Watch Now" at center. Light CTA button at bottom.

### Poster (1080x1350px)
- **Typography**: Display Script at 240px. Presents Line at 14px. Logline at 18px.
- **Padding**: 60px left/right, 100px top/bottom.
- **Composition**: Full-bleed blurred photo across the entire 1080x1350 canvas. Vertical content stack: "STUDIO PRESENTS" at 22% height, script headline at 48% height, logline at 72% height, episode/metadata label at 88% height.
- **Vertical flow**: Poster is the purest expression of the style -- one photo, one script, one logline. No sectioning.
- **CTA placement**: Small rectangular button (no border-radius or 2px) at bottom-center, 160px above the canvas edge, labeled "PLAY TRAILER" or "STREAM NOW" in uppercase.

### Story (1080x1920px)
- **Typography**: Display Script becomes 280-320px (30% larger than carousel to fill the vertical canvas). Presents Line becomes 16px. Logline becomes 20px.
- **Padding**: 60px left/right, 120px top/bottom. Safe zones of 160px top and bottom to avoid Instagram/TikTok UI chrome overlay.
- **Composition**: Full-bleed 9:16 blurred graded photo. The portrait orientation finally gives the photograph room to breathe -- face fills the canvas from top to ~70%, type stack occupies the lower-middle third. Label at ~45% height, script headline at ~58% height, logline at ~75% height.
- **Max slides**: 10 per story (Instagram's cap). Each slide is a complete poster moment -- not a fragment of a carousel.
- **Interaction cues**: Optional small "SWIPE UP" or "HOLD TO PAUSE" uppercase label at `bottom: 180px` center in `rgba(232,68,154,0.72)`. Pause chrome sits at `bottom: 180px; left: 60px;` to stay inside the safe zone.
- **Content-only slides**: Dark-teal-to-hot-pink radial gradient fallback. Same vertical stack pattern as photo slides.
- **Episode sequencing**: Use 12px "EPISODE 01" labels at the top safe zone (180px from top) to indicate position in a multi-slide story arc.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Teal Graded | `#3a5f6b` | Primary canvas tone, photo grade target |
| Hot Pink | `#E8449A` | All type, every single element |
| Pink Deep | `#C1297A` | Hover/active state, gradient stop |
| Pink Hot | `#FF5FAE` | Highlighted accents, glow |
| Teal Deep | `#1f3942` | Gradient corners, dark canvas base |
| Teal Mid | `#4b7583` | Mid-tone content slide bg |
| Teal Highlight | `#78a2ad` | Rim light, highlight family |
| Off-White Dim | `#f2e6ec` | Warm-tinted light for CTA inversions |
| Ink | `#0d1a1f` | Pause chrome, UI darks |
| Graded Skin | `#b88e87` | Skin-tone family under grade |
| Caption Pink Dim | `rgba(232,68,154,0.72)` | Secondary captions, metadata |

### Font Declarations

```css
/* Display Script (headlines only) */
font-family: 'Allura', 'Great Vibes', 'Monotype Corsiva', 'Apple Chancery', cursive;

/* Body / UI (everything else) */
font-family: 'Inter', 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Allura&family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-teal: #3a5f6b;
  --color-pink: #E8449A;
  --color-off-white: #f2e6ec;

  /* Colors -- Accent */
  --color-pink-deep: #C1297A;
  --color-pink-hot: #FF5FAE;
  --color-teal-deep: #1f3942;

  /* Colors -- Neutral Scale */
  --color-ink: #0d1a1f;
  --color-skin-graded: #b88e87;
  --color-teal-mid: #4b7583;
  --color-teal-highlight: #78a2ad;
  --color-caption-pink: rgba(232, 68, 154, 0.72);

  /* Colors -- Surfaces */
  --surface-canvas: linear-gradient(180deg, #1f3942 0%, #3a5f6b 55%, #4b7583 100%);
  --surface-romantic: radial-gradient(ellipse at 50% 60%, #E8449A 0%, #C1297A 30%, #1f3942 100%);
  --surface-inset: rgba(13, 26, 31, 0.35);
  --surface-photo-multiply: rgba(31, 57, 66, 0.45);

  /* Colors -- Borders */
  --border-none: none;
  --border-pink-thin: 1px solid rgba(232, 68, 154, 0.35);
  --border-pink-accent: 2px solid #E8449A;

  /* Colors -- Shadows */
  --shadow-type-dark: 0 2px 20px rgba(13, 26, 31, 0.45);
  --shadow-type-glow: 0 0 32px rgba(232, 68, 154, 0.25);
  --shadow-type-cinematic: 0 2px 20px rgba(13, 26, 31, 0.45), 0 0 32px rgba(232, 68, 154, 0.25);
  --shadow-caption-halo: 0 1px 10px rgba(13, 26, 31, 0.55);
  --vignette: radial-gradient(ellipse at center, transparent 40%, rgba(13, 26, 31, 0.6) 100%);

  /* Photo treatment */
  --photo-filter: blur(12px) saturate(0.85) brightness(0.85);
  --photo-overlay: linear-gradient(180deg, rgba(31,57,66,0.55) 0%, rgba(58,95,107,0.35) 50%, rgba(31,57,66,0.65) 100%);

  /* Typography -- Families */
  --font-display: 'Allura', 'Great Vibes', 'Monotype Corsiva', 'Apple Chancery', cursive;
  --font-body: 'Inter', 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-script: 220px;
  --text-display-script-slides: 280px;
  --text-display-script-story: 300px;
  --text-display-script-carousel: 180px;
  --text-presents: 14px;
  --text-logline: 18px;
  --text-episode-label: 12px;
  --text-body-large: 22px;
  --text-body: 18px;
  --text-caption: 13px;
  --text-big-number: 180px;
  --text-stat-label: 13px;
  --text-ui: 11px;

  /* Typography -- Weights */
  --weight-display: 400;
  --weight-label: 600;
  --weight-label-bold: 700;
  --weight-body: 500;
  --weight-body-bold: 600;
  --weight-ui: 700;

  /* Typography -- Line Heights */
  --leading-display: 0.90;
  --leading-label: 1.00;
  --leading-logline: 1.45;
  --leading-body: 1.60;
  --leading-caption: 1.40;

  /* Typography -- Letter Spacing */
  --tracking-presents: 3.5px;
  --tracking-episode: 4px;
  --tracking-logline: 1.2px;
  --tracking-body: 0.3px;
  --tracking-caption: 1px;
  --tracking-ui: 2px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 20px;
  --space-medium: 32px;
  --space-gap: 40px;
  --space-section: 60px;
  --space-large: 80px;
  --space-xl: 120px;
  --space-safe-zone: 160px;

  /* Borders & Radius */
  --radius-chrome: 2px;
  --radius-none: 0px;

  /* Chrome */
  --chrome-pause-size: 40px;
  --chrome-pause-bg: rgba(13, 26, 31, 0.85);
  --chrome-pause-glyph: #f2e6ec;
}
```

### System Font Fallbacks
- **Display Script (if Allura fails to load):** `'Great Vibes', 'Monotype Corsiva', 'Apple Chancery', 'Brush Script MT', cursive`
- **Body / UI (if Inter fails to load):** `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Emergency fallback for Allura:** Allura is the only Google Fonts option that captures the heavy-slant chancery + long descender feel of Monotype Corsiva. If Allura fails, `Great Vibes` is the second-best match (slightly lighter weight but same calligraphic family). Never fall back to `Dancing Script` -- it's too casual and breaks the cinematic tone.
