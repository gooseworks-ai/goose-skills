# Design Style: Highlighter Yellow

## 1. Visual Theme & Atmosphere

Highlighter Yellow is the design language of the viral self-help Instagram carousel -- the visual shorthand for a question that stops the thumb mid-scroll. It draws from the aesthetic of personal-development creators, productivity coaches, and the "journal page meets highlighter pen" school of social graphics. The entire canvas is flooded with a saturated, mid-lemon yellow (`#F4DC2E`) -- not pastel, not electric, not mustard. This is the exact tone of a brand-new Stabilo Boss highlighter swiped across a fresh notebook page, and it is the single most important color decision in the style. Paired with near-black text (`#1A1A1A`), the contrast is maximum and the legibility is brutal; you cannot scroll past this.

The signature move -- the thing that makes this style instantly recognizable -- is the **white-rectangle italic emphasis span**. One key word in every headline is lifted out of the sentence and dropped into a crisp white block (`#FFFFFF`) with sharp corners, inline padding, and the word itself rendered in italic at the same heavy weight as the headline. It reads like someone took a highlighter to the page, then came back with a white-out correction tape and re-wrote the key word in their own handwriting. It is the punch, the emphasis, the "this is the idea" marker. Used once per slide, it is electric. Used twice, it loses its voltage. This is non-negotiable: one white-rect word per slide.

The typography is single-family, single-weight: **Inter at weight 900** (Black), tightly tracked at -1px, left-aligned, stacked in 3-line headlines that hit like a question you can't unask. A subtle dot-grid texture sits on the yellow background -- small near-black dots on a 16px grid at ~12% opacity -- giving the canvas the feel of journal dot-grid paper without competing with the typography. Below the headline, a thin horizontal black rule divides the hook from the follow-up, and at the bottom of every slide sits a white URL pill styled like a browser search bar, complete with a magnifying glass icon, plus a small black bookmark icon in the corner. The feel: high-energy, unapologetic, bold, and 100% built for the feed.

**Key Characteristics:**
- Saturated highlighter yellow background (`#F4DC2E`) -- mid-lemon, dead-center saturation, never pastel, never mustard
- Dot-grid texture overlay -- near-black dots on a 16px grid at 12% opacity, using CSS radial-gradient
- Near-black primary text (`#1A1A1A`) -- maximum contrast, no pure black harshness
- Inter Black (weight 900) for all headlines -- 56-72px in Carousel, -1px letter-spacing
- White-rectangle italic emphasis span -- one key word per slide in a white block with italic type
- Left-aligned 3-line question headlines -- never centered, always stacked
- Thin horizontal rule divider (`1px solid #1A1A1A`) between hook and follow-up
- White URL pill at the bottom with magnifying glass icon -- browser search bar styling
- Small black bookmark icon in the bottom corner
- Sharp or near-sharp edges (0-4px border-radius) on the white rects; URL pill is fully rounded
- Single typeface throughout (Inter) -- no serif, no secondary font

## 2. Color Palette & Roles

### Primary
- **Highlighter Yellow** (`#F4DC2E`): Primary background color. Saturated mid-lemon yellow. This is the entire canvas and it is non-negotiable -- no gradients, no tints, no alternatives.
- **Near-Black** (`#1A1A1A`): Primary text color, divider rule, dot-grid dots, bookmark icon. Used everywhere text or structure needs to exist.
- **Pure White** (`#FFFFFF`): The white-rectangle emphasis block, the URL pill, the icon surfaces. Reserved for the signature emphasis treatment -- white is load-bearing here, not decorative.

### Accent
- **Highlighter Yellow Deep** (`#F4D41E`): Hover/active or slightly darker yellow variant for layered backgrounds if ever needed. Rarely used.
- **Highlighter Yellow Bright** (`#F6E038`): Alternate yellow one step brighter for variation between slides in a carousel, if the designer wants tonal rhythm. Still within the saturated-lemon family.

### Neutral Scale
- **Secondary Text** (`#3A3A3A`): Subtitles, supporting copy, minor labels. Only used when a second text level is needed -- this style prefers single-level typographic hierarchy.
- **Tertiary Text** (`rgba(26,26,26,0.6)`): Metadata, URL domain text inside the pill, bookmark count.
- **Muted Dot Grid** (`rgba(26,26,26,0.12)`): The dot-grid texture color. Visible but not distracting.
- **Subtle Text** (`rgba(26,26,26,0.4)`): Watermarks and slide numbers on the yellow canvas.

### Surface & Borders
- **Surface White** (`#FFFFFF`): White-rectangle emphasis block, URL pill, icon surface.
- **Surface Inset** (`#F9E668`): Rare lighter-yellow inset panel if needed for secondary callouts.
- **Border Default** (`#1A1A1A`): 1px or 2px solid near-black border used for the divider rule and sometimes around icons.
- **Border Rule** (`1px solid #1A1A1A`): The thin horizontal divider between headline and follow-up text.
- **Divider Subtle** (`rgba(26,26,26,0.2)`): Secondary divider when a lighter touch is needed.

### Shadow Colors
- **Shadow None** (none): This style is FLAT. Shadows are antithetical to the highlighter feel.
- **Shadow Micro** (`0 1px 0 rgba(26,26,26,0.08)`): Only used on the URL pill to give it the faintest sense of lift. Never on anything else.
- **Shadow Card** (`0 2px 0 #1A1A1A`): Optional 2px offset "sticker shadow" on white rectangles -- use sparingly.

### Texture
- **Dot Grid**: `radial-gradient(circle, rgba(26,26,26,0.12) 1.5px, transparent 1.5px)` at `16px 16px` spacing. Applied as a full-bleed overlay on every slide.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700;1,900&display=swap" rel="stylesheet">
```

- **Display & Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Italic emphasis**: `'Inter', ...` with `font-style: italic` (same family, italic variant)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Inter | 72px | 900 | 1.08 | -1.5px | Headline question on Story/Slides |
| Headline Large | Inter | 64px | 900 | 1.08 | -1px | Headline question on Carousel/Poster |
| Headline | Inter | 56px | 900 | 1.08 | -1px | Compact Carousel headline |
| Emphasis Italic | Inter | matches headline | 900 | matches | -1px | White-rect word, `font-style: italic` |
| Sub-heading | Inter | 32px | 900 | 1.15 | -0.5px | Follow-up sentence under divider |
| Body Large | Inter | 22px | 500 | 1.55 | 0px | Secondary copy when needed |
| Body | Inter | 18px | 500 | 1.55 | 0px | Standard body text, rarely used |
| Small / Caption | Inter | 14px | 500 | 1.50 | 0.2px | URL pill text, metadata |
| URL Pill Text | Inter | 16px | 500 | 1.00 | 0px | Inside the white search-bar pill |
| Icon Label | Inter | 12px | 700 | 1.00 | 1px | Uppercase micro-labels, rare |

### Principles
- **Single family, heavy weight**: Inter Black (900) for every headline. This is not a style that mixes weights in the headline -- the weight IS the tone of voice.
- **Tight tracking**: `-1px` letter-spacing on headlines 56px+ is essential. Looser tracking softens the punch.
- **Left-align always for long headlines**: 3-line question stacks are always left-aligned. Centering a 3-line headline kills its rhythm.
- **Italic emphasis, same weight**: When a word goes into the white-rect emphasis block, it stays at weight 900 and flips to `font-style: italic`. Never drop the weight.
- **Mixed case, question mark**: Headlines are sentence case with a terminal question mark. This style is literally built around questions.
- **No serif anywhere**: Resist the urge to add a display serif. The single-sans discipline is the style's identity.
- **Compact line-height**: `1.08` for headlines, `1.15` for sub-headings. Anything looser and the stacked effect breaks.

## 4. Component Patterns

### Highlighter Emphasis Span (THE SIGNATURE MOVE)

```html
<span style="display: inline-block; background: #FFFFFF; color: #1A1A1A; font-family: 'Inter', sans-serif; font-weight: 900; font-style: italic; padding: 2px 14px 4px; margin: 0 2px; border-radius: 4px; line-height: inherit;">stuck</span>
```

**Rules:** Use exactly ONCE per slide. The span sits inline inside the headline, picks up the headline's font-size and line-height, and changes ONLY to italic + white background. Padding is asymmetric (2px top, 4px bottom) so the block extends slightly below the word's baseline -- the hand-highlighter-pen feel. Border-radius `4px` keeps the edge crisp. Never use for two words in the same slide.

### Question Headline (with Highlighter Emphasis)

```html
<h1 style="font-family: 'Inter', sans-serif; font-size: 64px; font-weight: 900; line-height: 1.08; letter-spacing: -1px; color: #1A1A1A; text-align: left; margin: 0 0 32px; max-width: 900px;">
  Why do I feel
  <span style="display: inline-block; background: #FFFFFF; color: #1A1A1A; font-weight: 900; font-style: italic; padding: 2px 14px 4px; margin: 0 2px; border-radius: 4px;">stuck</span>
  <br>in life?
</h1>
```

### Divider Rule

```html
<div style="width: 80px; height: 2px; background: #1A1A1A; margin: 24px 0 24px;"></div>
```

**Variant (full-width):**
```html
<div style="width: 100%; height: 1px; background: #1A1A1A; margin: 28px 0;"></div>
```

Used to separate the headline from the follow-up sentence. Short `80px` version for left-aligned layouts, full-width for more editorial rhythm.

### Follow-Up Block (Sub-headline with Inline Emphasis)

```html
<p style="font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 900; line-height: 1.15; letter-spacing: -0.5px; color: #1A1A1A; text-align: left; margin: 0 0 48px; max-width: 820px;">
  It's not always an
  <span style="display: inline-block; background: #FFFFFF; color: #1A1A1A; font-weight: 900; font-style: italic; padding: 2px 10px 3px; margin: 0 2px; border-radius: 4px;">easy</span>
  question to answer.
</p>
```

Same treatment as the headline but at 32px. Note: if the main headline already uses a white-rect emphasis, the follow-up should NOT -- pick one or the other per slide.

### URL Pill (Search-Bar Styled)

```html
<div style="display: inline-flex; align-items: center; gap: 10px; background: #FFFFFF; padding: 14px 24px; border-radius: 999px; box-shadow: 0 1px 0 rgba(26,26,26,0.08);">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="7"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
  <span style="font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 500; color: #1A1A1A; letter-spacing: 0.2px;">www.gooseworks.ai</span>
</div>
```

### Bookmark Icon (Bottom Corner Mark)

```html
<svg width="22" height="28" viewBox="0 0 22 28" fill="#1A1A1A" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 2h18v24l-9-6-9 6V2z"></path>
</svg>
```

Placed in the bottom-right or top-right corner as a small ownership/save marker.

### Slide Canvas (Full Wrapper with Dot-Grid)

```html
<div style="background: #F4DC2E; padding: 80px 60px; position: relative; overflow: hidden;">
  <!-- Dot grid overlay -->
  <div style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(26,26,26,0.12) 1.5px, transparent 1.5px); background-size: 16px 16px; pointer-events: none;"></div>
  <div style="position: relative; z-index: 1;">
    <!-- slide content -->
  </div>
</div>
```

### Numbered Item (Sequential List Variant)

```html
<div style="padding: 20px 0; text-align: left;">
  <h2 style="font-family: 'Inter', sans-serif; font-size: 48px; font-weight: 900; line-height: 1.10; letter-spacing: -0.8px; color: #1A1A1A; margin: 0;">
    1. You've
    <span style="display: inline-block; background: #FFFFFF; color: #1A1A1A; font-weight: 900; font-style: italic; padding: 2px 12px 4px; border-radius: 4px;">outgrown</span>
    <br>your current situation.
  </h2>
</div>
```

### Closing Statement Block

```html
<p style="font-family: 'Inter', sans-serif; font-size: 40px; font-weight: 900; line-height: 1.10; letter-spacing: -0.5px; color: #1A1A1A; text-align: left; margin: 0;">
  The answer is closer<br>than you think.
</p>
```

## 5. Layout Principles

### Spacing Scale
- **2px**: Micro gap -- white-rect emphasis span inner padding top.
- **4px**: Border radius on white-rect emphasis spans and small surfaces.
- **8px**: Tight gap -- between icon and adjacent text.
- **12px**: Small gap -- between label elements.
- **16px**: Base gap -- dot-grid spacing, between inline items.
- **24px**: Medium gap -- between divider rule and adjacent text.
- **32px**: Section internal -- gap between headline and divider, or headline components.
- **48px**: Content gap -- between major content blocks within a slide.
- **60px**: Side padding on Carousel/Poster formats.
- **80px**: Top/bottom padding on Carousel/Poster, all-sides on Slides.
- **120px**: Vertical padding on Story format.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 80px top/bottom, 60px left/right | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 80px top/bottom, 60px left/right | 960px |
| Story (1080x1920) | 120px top/bottom, 60px left/right | 960px |

### Alignment & Grid
- **Primary alignment**: LEFT-aligned for all long-form content, headlines, and follow-up blocks. Never center a 3-line headline.
- **Centered allowed**: Only for the URL pill and bookmark icon at the bottom of slides.
- **No columns**: This style is single-column top-to-bottom. No side-by-side card grids -- the headline owns the slide.
- **Vertical rhythm**: Top zone for headline (60% of vertical space), middle zone for divider + follow-up (25%), bottom zone for URL pill + bookmark (15%).
- **Content gravity**: Headlines sit in the upper two-thirds; the URL pill anchors the bottom. Never center a headline vertically -- the weight is always top-heavy.
- **Dot-grid texture**: Applied globally on every slide as a background overlay. Never remove it.
- **White-rect placement**: The emphasized word should fall in the center or toward the end of a line for visual balance. Avoid putting it at the very start of a line.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, `#F4DC2E` bg | Page canvas, all structural surfaces |
| Dot Grid (Level 0.5) | Radial-gradient texture overlay | Background texture on every slide |
| Sticker (Level 1) | `0 2px 0 #1A1A1A` (optional) | White-rect emphasis spans if desired |
| Pill Lift (Level 1) | `0 1px 0 rgba(26,26,26,0.08)` | URL pill only |
| Flat Border (Level 0) | `1px solid #1A1A1A` | Divider rule, icon outlines |

### Border Treatments
- **Standard divider rule**: `1px solid #1A1A1A`, no radius -- the thin horizontal separator between headline and follow-up.
- **Short accent rule**: `2px solid #1A1A1A` at 80px wide -- used as a punctuation mark between content blocks.
- **White-rect edge**: `border-radius: 4px` on emphasis spans -- crisp but not pixel-sharp.
- **URL pill edge**: `border-radius: 999px` -- fully rounded, the only place in the style where full radius is used.
- **No card borders**: Do not box content in bordered cards. The yellow canvas is the only container.

### Surface Hierarchy
This is a FLAT style. Depth is communicated through color contrast and typography weight, not shadows.
1. **Background** (`#F4DC2E`) -- the yellow canvas, the one and only surface.
2. **Dot-grid overlay** (`rgba(26,26,26,0.12)`) -- texture layer, not an elevation step.
3. **White rect** (`#FFFFFF`) -- the highest-contrast element, reserved for emphasis.
4. **URL pill** (`#FFFFFF` + micro shadow) -- anchors the bottom of the slide.
5. **Near-black text** (`#1A1A1A`) -- sits on top of everything as primary content.

## 7. Do's and Don'ts

### Do
- Use saturated highlighter yellow (`#F4DC2E`) as the background on EVERY slide. Never pastel, never mustard, never desaturated.
- Use Inter Black (weight 900) for every headline at 56-72px with -1px letter-spacing.
- Use the white-rectangle italic emphasis treatment exactly ONCE per slide. One word, one block, one punch.
- Left-align all long-form headlines. Stack headlines on 2-3 lines for rhythm.
- Apply the dot-grid overlay to every slide using the 16px radial-gradient recipe.
- Place a thin horizontal rule between the headline and the follow-up sentence.
- End every slide with a white URL pill containing a magnifying glass icon -- it grounds the bottom.
- Add a small black bookmark icon in the corner as the signature mark.
- Keep the white-rect padding asymmetric (2px top, 4px bottom) so it extends below the baseline.
- Use sentence case with a terminal question mark for headlines -- this style lives on questions.
- Keep everything flat -- no shadows, no gradients, no bevels.
- Use `4px` border-radius on the white-rect emphasis spans and nothing on divider rules.

### Don't
- Don't use the white-rect emphasis on more than one word per slide -- it loses its pop the moment it appears twice.
- Don't use yellow below 80% saturation -- pastel yellow kills the signature instantly. No `#FEF9C3`, no mustard `#C9A227`.
- Don't center-align a long headline -- 3-line question stacks must be left-aligned.
- Don't introduce a serif typeface anywhere. Single-family Inter 900 discipline.
- Don't use shadows on headlines or body text -- this is a flat style.
- Don't add decorative icons beyond the magnifying glass (in the URL pill) and the bookmark mark.
- Don't use pure black (`#000000`) -- always `#1A1A1A` for text and structure.
- Don't introduce a secondary accent color. The yellow + black + white triad is the identity.
- Don't drop the weight in the white-rect emphasis span -- stay at 900, just flip to italic.
- Don't use card containers or bordered boxes -- the yellow canvas holds everything.
- Don't use the dot grid at high opacity -- keep it at `rgba(26,26,26,0.12)` so it feels like paper texture.
- Don't put the white-rect emphasis word at the very start of a line -- mid-line or end-of-line placement reads better.

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
- **Typography scale**: Headline at 64px (weight 900, -1px tracking). Sub-heading at 32px. URL pill at 16px.
- **Padding**: 80px top/bottom, 60px left/right. Content area 960x920.
- **Cover slide**: 3-line question headline with one white-rect italic emphasis word. Divider rule below. Optional follow-up sentence. URL pill bottom-center. Bookmark icon top-right or bottom-right.
- **Content slides**: Left-aligned headline (shorter, 1-2 lines). Supporting text below divider. Consistent URL pill footer.
- **Dot-grid texture**: Full-bleed overlay on every slide.
- **Swipe indicator**: 3 small near-black dots (`#1A1A1A`, 8px diameter) at the bottom center above the URL pill. Active dot is solid, inactive dots are `rgba(26,26,26,0.3)`.

### Infographic (1080px wide, variable height)
- **Typography**: Display Hero at 72px for the title section. Headlines at 48-56px for each numbered section. Follow-up text at 24px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Section spacing**: 64px vertical gap between numbered sections. Thin horizontal divider between each.
- **Layout**: Numbered question format -- each section starts with a bold number (1., 2., 3.) followed by a question, each with its own white-rect emphasis word (but only ONE per section, never multiple in the same headline).
- **Footer**: URL pill centered at the very bottom with bookmark icon in the corner.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero at 96px (weight 900, -1.5px tracking). Section Heading at 64px. Body Large at 24px.
- **Padding**: 80px all sides. Content area 1760x920.
- **Layout**: Left-aligned content with ~60% width for the headline block. The right ~40% breathes empty (dot-grid visible). White-rect emphasis word in the headline.
- **Title slides**: 3-line question headline. Divider rule. Follow-up sentence. URL pill at bottom-left. Bookmark icon at top-right.
- **Content slides**: Single headline + supporting text. No multi-column layouts.

### Poster (1080x1350px)
- **Typography**: Display Hero at 80px. Section Heading at 48px. Body at 20px.
- **Padding**: 80px top/bottom, 60px left/right.
- **Composition**: Top half for the big question headline (with white-rect emphasis). Middle for divider + follow-up sentence. Bottom third for optional supporting copy. URL pill centered at the very bottom.
- **Vertical flow**: Reads top-to-bottom. The headline owns the top two-thirds of the canvas.

### Story (1080x1920px)
- **Typography scale up**: Display Hero at 88px (weight 900, -1.5px tracking). Hero element sized ~30% bigger than Carousel equivalent. Follow-up at 36px.
- **Padding**: 120px top/bottom, 60px left/right. Content area 960x1680.
- **Composition**: Top 15% is safe-zone margin (avoid UI overlays from Instagram/TikTok Stories). Headline occupies vertical zone 15-60%. Divider rule at 65%. Follow-up sentence 65-80%. URL pill at 85%. Bookmark icon in the corner.
- **Hero emphasis**: The white-rect italic word is visually the largest ever -- the Story format is the most dramatic canvas for the signature move. Boost the emphasis word's padding to `4px 18px 6px` for extra presence.
- **Safe zones**: Keep all content within 120px top/bottom padding so mobile UI doesn't crop the message.
- **Dot-grid texture**: Full-bleed, same 16px recipe -- critical for the tactile "journal page" feel at the larger canvas.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Highlighter Yellow | `#F4DC2E` | Primary background, every slide |
| Highlighter Yellow Bright | `#F6E038` | Alternate variation |
| Highlighter Yellow Deep | `#F4D41E` | Darker variant, rare |
| Near-Black | `#1A1A1A` | All primary text, dividers, dots, icons |
| Pure White | `#FFFFFF` | White-rect emphasis, URL pill |
| Secondary Text | `#3A3A3A` | Rare secondary copy |
| Tertiary Text | `rgba(26,26,26,0.6)` | URL domain text |
| Dot Grid | `rgba(26,26,26,0.12)` | Background texture dots |
| Muted | `rgba(26,26,26,0.4)` | Slide numbers, watermarks |

### Font Declarations

```css
/* All typography -- single family */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

/* Headline */
font-weight: 900;
letter-spacing: -1px;

/* White-rect emphasis */
font-style: italic;
font-weight: 900;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700;1,900&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-bg: #F4DC2E;
  --color-bg-bright: #F6E038;
  --color-bg-deep: #F4D41E;
  --color-near-black: #1A1A1A;
  --color-white: #FFFFFF;

  /* Colors -- Text */
  --color-secondary: #3A3A3A;
  --color-tertiary: rgba(26, 26, 26, 0.6);
  --color-muted: rgba(26, 26, 26, 0.4);
  --color-subtle: rgba(26, 26, 26, 0.25);

  /* Colors -- Surfaces */
  --color-surface-white: #FFFFFF;
  --color-surface-inset: #F9E668;

  /* Colors -- Borders */
  --color-border-default: #1A1A1A;
  --color-border-subtle: rgba(26, 26, 26, 0.2);
  --color-divider: #1A1A1A;

  /* Colors -- Shadows (mostly flat) */
  --shadow-none: none;
  --shadow-pill: 0 1px 0 rgba(26, 26, 26, 0.08);
  --shadow-sticker: 0 2px 0 #1A1A1A;

  /* Texture -- Dot Grid */
  --dot-grid: radial-gradient(circle, rgba(26, 26, 26, 0.12) 1.5px, transparent 1.5px);
  --dot-grid-size: 16px 16px;

  /* Typography -- Families */
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 72px;
  --text-headline-large: 64px;
  --text-headline: 56px;
  --text-sub-heading: 32px;
  --text-body-large: 22px;
  --text-body: 18px;
  --text-small: 14px;
  --text-url-pill: 16px;
  --text-icon-label: 12px;

  /* Typography -- Weights */
  --weight-headline: 900;
  --weight-sub-heading: 900;
  --weight-body: 500;
  --weight-emphasis: 900;

  /* Typography -- Line Heights */
  --leading-headline: 1.08;
  --leading-sub: 1.15;
  --leading-body: 1.55;
  --leading-tight: 1.00;

  /* Typography -- Letter Spacing */
  --tracking-headline: -1px;
  --tracking-display: -1.5px;
  --tracking-sub: -0.5px;
  --tracking-body: 0px;

  /* Spacing */
  --space-micro: 2px;
  --space-radius: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-large: 32px;
  --space-gap: 48px;
  --space-side: 60px;
  --space-top: 80px;
  --space-story: 120px;

  /* Borders */
  --radius-emphasis: 4px;
  --radius-pill: 999px;
  --radius-none: 0px;
  --border-divider: 1px solid #1A1A1A;
  --border-rule-thick: 2px solid #1A1A1A;
}
```

### System Font Fallbacks
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Signature Recipe (Copy-Paste Starter)

```html
<div style="background: #F4DC2E; padding: 80px 60px; position: relative; overflow: hidden; font-family: 'Inter', sans-serif;">
  <div style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(26,26,26,0.12) 1.5px, transparent 1.5px); background-size: 16px 16px; pointer-events: none;"></div>
  <div style="position: relative; z-index: 1;">
    <h1 style="font-size: 64px; font-weight: 900; line-height: 1.08; letter-spacing: -1px; color: #1A1A1A; text-align: left; margin: 0 0 28px;">
      Why do I feel
      <span style="display: inline-block; background: #FFFFFF; font-weight: 900; font-style: italic; padding: 2px 14px 4px; border-radius: 4px;">stuck</span>
      <br>in life?
    </h1>
    <div style="width: 80px; height: 2px; background: #1A1A1A; margin: 0 0 24px;"></div>
    <p style="font-size: 28px; font-weight: 900; line-height: 1.15; letter-spacing: -0.5px; color: #1A1A1A; margin: 0 0 48px;">It's not always an easy question to answer.</p>
    <div style="display: inline-flex; align-items: center; gap: 10px; background: #FFFFFF; padding: 14px 24px; border-radius: 999px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <span style="font-size: 16px; font-weight: 500; color: #1A1A1A;">www.gooseworks.ai</span>
    </div>
  </div>
</div>
```
