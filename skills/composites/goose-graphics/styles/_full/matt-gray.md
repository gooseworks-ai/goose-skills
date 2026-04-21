# Design Style: Matt Gray

## 1. Visual Theme & Atmosphere

Matt Gray is the design language of the modern founder-creator -- the visual equivalent of a high-engagement Instagram carousel that teaches, persuades, and converts. Inspired by the personal brand aesthetic of Matt Gray (@matthgray), this style combines the authority of classic serif typography with the clarity of modern sans-serif body text, all set against a light gray canvas that feels like premium paper stock viewed on a screen. The light gray background (`#ececec`) is not white -- it is the muted, slightly industrial tone of a concrete studio wall, creating a calm, distraction-free reading surface.

The dual typeface system -- Playfair Display for display headlines and Inter for body text -- creates a distinctive tension between editorial gravitas and startup clarity. Playfair Display is a transitional serif with high contrast between thick and thin strokes, designed for display use. At large sizes (48px+), its elegant letterforms command attention the way a magazine cover commands a newsstand. The signature move is setting key phrases in italic Playfair Display coloured in deep forest green (`#2d5a1e`) -- this italic-green treatment transforms ordinary headlines into memorable, brand-defining statements. "How to build *a personal brand*" -- the italic green words are the hook, the promise, the thing the audience came for. Inter handles everything below the headline: body text, labels, tags, and CTAs. At weight 500-700, Inter is crisp, readable, and authoritative without being cold.

The accent system uses two elements: deep forest green (`#2d5a1e`) for italic headline emphasis and small decorative dots, and soft yellow-lime (`#e5f59e`) for pill-shaped tags that label categories, steps, and callouts. The yellow tags are the visual shorthand for "this is a framework" -- they signal structure, steps, and actionable takeaways. Together, the green italic type and yellow pill tags are the most recognisable elements of this style. A subtle dot-grid texture on title and CTA slides adds depth and craft without competing with content. Cards use thin borders (`rgba(0,0,0,0.12)`) with 12px rounded corners, creating structured content areas that feel like notebook sections.

**Key Characteristics:**
- Light gray background (`#ececec`) as the dominant surface -- not white, not dark, just neutral enough to let content breathe
- Near-black (`#1a1a1a`) for all primary text -- maximum contrast without pure black harshness
- Playfair Display for headlines -- classic serif authority, weight 700-800
- Inter for body text, labels, and CTAs -- modern sans-serif clarity
- Deep forest green (`#2d5a1e`) for italic headline emphasis -- the signature "hook word" treatment
- Soft yellow-lime (`#e5f59e`) for pill tags -- category labels, step numbers, framework markers
- Dot-grid texture on hero/CTA slides -- subtle craft detail using CSS radial-gradient
- Thin-bordered cards with 12px radius -- structured without being rigid
- Dark pill CTA buttons -- near-black background, white text, fully rounded (40px radius)
- Bold, direct body text -- Inter at weight 600-700 for a confident, no-fluff voice

## 2. Color Palette & Roles

### Primary
- **Light Gray** (`#ececec`): Primary background. A neutral, slightly warm gray that reads as modern and premium.
- **Near-Black** (`#1a1a1a`): Primary text colour. Bold and commanding without the flatness of pure black.
- **Forest Green** (`#2d5a1e`): Primary accent. Used exclusively for italic headline emphasis words and small decorative dots.

### Accent
- **Yellow-Lime** (`#e5f59e`): Tag pill fills for categories, step labels, and framework markers. The visual shorthand for "actionable structure."
- **Dark Green** (`#1e4015`): Hover/active state for green interactive elements.
- **Light Green** (`#d4e8d0`): Subtle green tint for backgrounds or hover states when needed.

### Neutral Scale
- **Card White** (`rgba(255,255,255,0.3)`): Semi-transparent white for card backgrounds -- lets the gray canvas show through.
- **Card Border** (`rgba(0,0,0,0.12)`): Standard thin border for cards and containers.
- **Secondary Text** (`#4a4a4a`): Descriptions, subtitles, and supporting copy.
- **Tertiary Text** (`#777777`): Timestamps, metadata, and low-priority labels.
- **Muted Text** (`rgba(0,0,0,0.25)`): Slide numbers and watermarks.
- **Border Strong** (`rgba(0,0,0,0.18)`): Higher-contrast border for prominent containers.

### Surface & Borders
- **Surface Primary** (`rgba(255,255,255,0.3)`): Card and container background.
- **Surface Inset** (`rgba(255,255,255,0.15)`): Recessed areas and inset panels.
- **Surface Tag** (`#e5f59e`): Yellow-lime fill for pill tags.
- **Border Default** (`rgba(0,0,0,0.12)`): Standard card border.
- **Border Accent** (`rgba(45,90,30,0.3)`): Green-tinted border for featured elements.
- **Divider Rule** (`rgba(0,0,0,0.08)`): Subtle divider lines.

### Shadow Colors
- **Shadow Subtle** (`rgba(0,0,0,0.04)`): Barely-there ambient shadow.
- **Shadow Medium** (`rgba(0,0,0,0.08)`): Standard card shadow.
- **Shadow Deep** (`rgba(0,0,0,0.12)`): High-elevation elements.

### Texture
- **Dot Grid**: `radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px)` at `32px 32px` spacing. Applied to title slides and CTA slides for subtle texture.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display**: `'Playfair Display', Georgia, 'Times New Roman', serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Playfair Display | 72px | 700 | 1.10 | -1px | Cover headlines. Key phrases in italic green. |
| Section Heading | Playfair Display | 48px | 700 | 1.15 | -0.5px | Major section titles. Italic green for emphasis words. |
| Sub-heading | Playfair Display | 32px | 600 | 1.20 | 0px | Card headings, subsection titles |
| Body Large | Inter | 22px | 500 | 1.55 | 0px | Subtitles and lead paragraphs |
| Body | Inter | 18px | 600 | 1.55 | 0px | Standard body text -- bolder than typical for confident voice |
| Body Bold | Inter | 18px | 700 | 1.55 | 0px | Emphasis body text, closing statements |
| Small / Caption | Inter | 14px | 500 | 1.50 | 0.2px | Metadata, attributions, timestamps |
| Big Numbers | Playfair Display | 64px | 800 | 1.00 | -0.5px | Statistics and key metrics |
| Tag Label | Inter | 14px | 600 | 1.00 | 0px | Yellow pill tag text |
| Framework Label | Inter | 14px | 500 | 1.00 | 2px | Uppercase bordered label ("GOOSEWORKS", "FRAMEWORK") |
| CTA Text | Inter | 16px | 700 | 1.00 | 0.3px | Button text |

### Principles
- **Serif/sans-serif tension**: Playfair Display for headlines creates editorial authority. Inter for everything else creates startup clarity. The contrast is the style's identity.
- **Italic green as the hook**: The most distinctive element. In any headline, identify the key promise or emotional phrase and set it in `font-style: italic; color: #2d5a1e`. This is not decorative -- it is the visual equivalent of a hook in a tweet.
- **Bold body text**: Inter at weight 600-700 for body text creates a confident, direct voice. This is not a style for light, airy reading -- it is a style for frameworks, steps, and action.
- **Mixed case always**: Headlines and body are always mixed case. Uppercase is reserved only for small framework labels and the bordered label at the top of title slides.
- **Generous but not extreme spacing**: This style uses more moderate spacing than minimalist styles -- content is dense enough to feel valuable, but not so dense it overwhelms.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: var(--color-bg); padding: 80px 60px; text-align: center; position: relative;">
  <!-- Dot grid texture -->
  <div style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px); background-size: 32px 32px; pointer-events: none;"></div>
  <div style="position: relative; z-index: 1;">
    <div style="display: inline-block; font-family: var(--font-body); font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--color-near-black); border: 1px solid rgba(0,0,0,0.12); padding: 8px 24px; background: rgba(255,255,255,0.5); margin: 0 0 48px;">FRAMEWORK</div>
    <h1 style="font-family: var(--font-display); font-size: 72px; font-weight: 700; line-height: 1.10; letter-spacing: -1px; color: var(--color-near-black); margin: 0 0 32px;">How to build<br><em style="color: var(--color-green);">a personal brand</em><br>(in just 7 days)</h1>
    <p style="font-family: var(--font-body); font-size: 22px; font-weight: 500; line-height: 1.55; color: var(--color-secondary); max-width: 650px; margin: 0 auto;">A step-by-step framework for founders who want to build in public.</p>
  </div>
</div>
```

### Numbered Item with Yellow Tag

```html
<div style="padding: 32px 0;">
  <span style="display: inline-block; background: var(--color-yellow-tag); font-family: var(--font-body); font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; color: var(--color-near-black); margin: 0 0 12px;">Step 1</span>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 700; line-height: 1.55; color: var(--color-near-black); margin: 0;">Build your personal brand.<br>Attention is the new oil.<br>Your personal brand is the pipeline.</p>
</div>
```

### Bordered Card with Tag

```html
<div style="border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; padding: 28px 24px; background: rgba(255,255,255,0.3);">
  <span style="display: inline-block; background: var(--color-yellow-tag); font-family: var(--font-body); font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; color: var(--color-near-black); margin: 0 0 12px;">1. Writing</span>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 600; line-height: 1.55; color: var(--color-near-black); margin: 0;">It's your superpower.<br>SEO is writing. Sales is writing. Hiring is writing.<br>Audience growth is writing.</p>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 24px; border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; background: rgba(255,255,255,0.3);">
  <p style="font-family: var(--font-display); font-size: 64px; font-weight: 800; line-height: 1.00; letter-spacing: -0.5px; color: var(--color-green); margin: 0 0 8px;">47%</p>
  <span style="display: inline-block; background: var(--color-yellow-tag); font-family: var(--font-body); font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; color: var(--color-near-black); margin: 0 0 12px;">FASTER RESPONSE</span>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 500; line-height: 1.55; color: var(--color-secondary); max-width: 280px; margin: 0 auto;">Teams respond to leads nearly twice as fast with AI-powered workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; overflow: hidden;">
  <div style="padding: 40px 32px; background: rgba(255,255,255,0.3);">
    <span style="display: inline-block; background: rgba(0,0,0,0.06); font-family: var(--font-body); font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; color: var(--color-secondary); margin: 0 0 16px;">Without AI</span>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 600; line-height: 1.20; color: var(--color-near-black); margin: 0 0 16px;">Manual & Fragmented</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 500; line-height: 1.55; color: var(--color-secondary); margin: 0;">Slack threads, spreadsheets, and context-switching between a dozen tabs.</p>
  </div>
  <div style="padding: 40px 32px; background: rgba(255,255,255,0.3); border-left: 1px solid rgba(0,0,0,0.12);">
    <span style="display: inline-block; background: var(--color-yellow-tag); font-family: var(--font-body); font-size: 14px; font-weight: 600; padding: 6px 16px; border-radius: 20px; color: var(--color-near-black); margin: 0 0 16px;">With Goose</span>
    <h3 style="font-family: var(--font-display); font-size: 32px; font-weight: 600; line-height: 1.20; color: var(--color-near-black); margin: 0 0 16px;">Orchestrated & Autonomous</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 500; line-height: 1.55; color: var(--color-secondary); margin: 0;">AI coworkers handle research, drafting, and follow-up. Your team focuses on decisions.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 48px 40px; border-left: 3px solid var(--color-green); background: rgba(255,255,255,0.3); border-radius: 0 12px 12px 0;">
  <p style="font-family: var(--font-display); font-size: 32px; font-weight: 400; font-style: italic; line-height: 1.35; color: var(--color-near-black); margin: 0 0 24px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 32px; height: 3px; background: var(--color-green); border-radius: 2px;"></div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--color-tertiary); margin: 0;">SARAH CHEN, VP OPERATIONS</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; position: relative;">
  <!-- Dot grid texture -->
  <div style="position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px); background-size: 32px 32px; pointer-events: none;"></div>
  <div style="position: relative; z-index: 1;">
    <span style="display: inline-block; background: var(--color-yellow-tag); font-family: var(--font-body); font-size: 14px; font-weight: 600; padding: 8px 20px; border-radius: 20px; color: var(--color-near-black); margin: 0 0 32px;">gooseworks.ai</span>
    <h2 style="font-family: var(--font-display); font-size: 64px; font-weight: 700; line-height: 1.10; letter-spacing: -0.5px; color: var(--color-near-black); margin: 0 0 28px;">Meet your<br><em style="color: var(--color-green);">new coworker</em></h2>
    <p style="font-family: var(--font-body); font-size: 22px; font-weight: 500; line-height: 1.60; color: var(--color-secondary); max-width: 600px; margin: 0 auto 44px;">Deploy your first AI coworker in minutes. Start free, scale when ready.</p>
    <a style="display: inline-block; background: var(--color-near-black); color: #ffffff; font-family: var(--font-body); font-size: 16px; font-weight: 700; letter-spacing: 0.3px; text-decoration: none; padding: 20px 52px; border-radius: 40px;">Get Started Free</a>
  </div>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between icon and inline label.
- **8px**: Tight gap -- between tag and adjacent text, between stat number and label.
- **12px**: Small gap -- between tag pill and body text within a card.
- **16px**: Base gap -- between body paragraphs, between list items in compact mode.
- **24px**: Medium gap -- between components within a section.
- **28px**: Card internal padding -- standard padding inside bordered cards.
- **32px**: Section internal -- gap between heading and first content block.
- **40px**: Content gap -- between cards in a layout, between major content elements.
- **48px**: Section divider -- vertical space between major content blocks.
- **80px**: Maximum section padding -- cover slides and CTA areas.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |

### Alignment & Grid
- **Primary alignment**: Left-aligned for content slides. Center-aligned for title slides and CTA slides.
- **Grid**: Bordered cards can stack vertically or use a 2-column grid for the bottom row (1 card spanning full width on top, 2 cards side-by-side below -- the Matt Gray "focus grid" pattern).
- **Yellow pill tags**: Always inline-block, rounded 20px, placed above the content they label.
- **Vertical rhythm**: Maintain consistent 40-48px gaps between top-level sections. Use 12px gaps between tag and body within a card.
- **Content gravity**: On widescreen slides (1920x1080), content slides use left-aligned layouts with ~70% width. Title/CTA slides are centered.
- **Dot grid texture**: Applied via CSS pseudo-element on title slides and CTA slides only. Never on content-heavy slides.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#ececec` | Page canvas, base layer |
| Card (Level 1) | `1px solid rgba(0,0,0,0.12)` + `rgba(255,255,255,0.3)` bg | Standard bordered cards |
| Subtle (Level 2) | `0 2px 8px rgba(0,0,0,0.06)` | Hover states on cards |
| Elevated (Level 3) | `0 8px 24px rgba(0,0,0,0.10)` | Featured cards, dropdowns |
| Overlay (Level 4) | `0 16px 40px rgba(0,0,0,0.15)` | Modals and overlays |

### Border Treatments
- **Standard card border**: `1px solid rgba(0,0,0,0.12)` with `border-radius: 12px` -- the primary container definition method. Thin, visible, structural.
- **Framework label border**: `1px solid rgba(0,0,0,0.12)` with no border-radius (or minimal) -- for the rectangular "FRAMEWORK" / "GOOSEWORKS" label at the top of title slides.
- **Connected cards**: Cards in a focus grid share borders. Top card has `border-radius: 12px 12px 0 0`. Bottom-left has `border-radius: 0 0 0 12px`. Bottom-right has `border-radius: 0 0 12px 0`. Shared edges collapse to a single 1px line.
- **Divider line**: `1px solid rgba(0,0,0,0.08)` -- for separating content sections within a single slide.

### Surface Hierarchy
On light gray backgrounds, elevation comes from border definition and subtle transparency:
1. **Background** (`#ececec`) -- the neutral canvas.
2. **Card** (`rgba(255,255,255,0.3)`) -- containers are slightly lighter than the canvas, defined primarily by their border.
3. **Tag** (`#e5f59e`) -- yellow-lime tags sit above everything as the highest-contrast surface element.
4. **CTA Button** (`#1a1a1a`) -- dark buttons are the strongest visual anchor on any slide.

## 7. Do's and Don'ts

### Do
- Use Playfair Display italic in forest green (`#2d5a1e`) for the key phrase in every headline -- this is the single most important visual element of the style.
- Use yellow-lime (`#e5f59e`) pill tags for all category labels, step numbers, and framework markers -- they are the structural scaffolding of the content.
- Use Inter at weight 600-700 for body text -- this style speaks with confidence and directness.
- Use the dot-grid texture on title and CTA slides -- it adds craft and depth to otherwise minimal slides.
- Use the bordered "FRAMEWORK" label at the top of title slides -- it signals the content type.
- Use dark pill buttons (`#1a1a1a`, white text, 40px radius) for CTAs -- the dark button against the light gray canvas is a strong focal point.
- Use the "focus grid" card layout: one full-width card on top, two half-width cards below, all sharing borders.
- Include a bold closing statement at the bottom of content slides -- a punchy one-liner that reinforces the lesson.
- Keep cards at 12px border-radius -- rounded enough to feel modern, square enough to feel structured.

### Don't
- Don't use green for anything other than italic headline emphasis and small decorative dots -- it is not a general-purpose accent.
- Don't use the dot-grid texture on content-heavy slides -- it competes with dense text and card layouts.
- Don't use light body text weights (300-400) -- this style demands bold, direct communication at weight 600+.
- Don't use serif type (Playfair Display) for body text -- reserve it strictly for headlines and big numbers.
- Don't use sharp corners (0px radius) on cards -- always use 12px radius.
- Don't use coloured backgrounds for cards -- always use semi-transparent white (`rgba(255,255,255,0.3)`).
- Don't use blue, red, or other accent colours -- only green and yellow-lime. The restricted palette is the identity.
- Don't center-align body text on content slides -- only title and CTA slides are centered.
- Don't use decorative elements beyond the dot grid and green dots -- no icons, no emoji, no illustrations.
- Don't use more than 3 cards per slide -- each card needs room to deliver its point.

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
- **Typography scale down**: Display Hero becomes 56px (from 72px). Section Heading becomes 40px. Body stays 18px.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Bordered "FRAMEWORK" label centered at top. Headline centered with italic green hook phrase. Dot-grid texture. Subtitle below in secondary text.
- **Content slides**: Left-aligned. Yellow pill tag above body text. Bold Inter body. Closing bold statement at bottom.
- **Card slides**: Focus grid layout (1 card top, 2 cards bottom) or single full-width card.
- **Swipe indicator**: Small gray dots at bottom center, 8px diameter. Active dot in forest green.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Hero at 72px for the title section.
- **Padding**: 60px left/right. 80px top/bottom margins.
- **Section spacing**: 48px vertical gap between sections. No decorative rules -- card borders provide structure.
- **Vertical rhythm**: Alternate between full-width sections and focus grid card layouts. Use yellow-tagged steps for sequential content.
- **Footer**: Secondary text, 14px Inter, with a closing bold statement.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 88px. Section Heading becomes 56px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Title/CTA slides are centered with dot-grid texture. Content slides are left-aligned with ~70% width.
- **Title slides**: Bordered label at top. Serif headline with italic green hook. Subtitle below. Yellow tag for metadata.
- **Content slides**: Section heading (serif, left-aligned). Bold intro line. Focus grid cards with yellow tags. Bold closing statement.
- **CTA slides**: Yellow tag at top. Serif headline with italic green. Subtitle. Dark pill button. Dot-grid texture.

### Poster (1080x1350px)
- **Typography**: Display Hero at 64px. Section Heading at 40px. Body at 18px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for headline with bordered label and italic green hook. Middle third for focus grid cards with yellow tags. Bottom third for bold closing statement and CTA.
- **Vertical flow**: Content reads top-to-bottom. Cards provide structural rhythm.
- **CTA placement**: Bottom zone, centered, dark pill button with yellow tag above.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 72px in Playfair Display 700-800 (approximately 30% larger than Carousel 56px). Section Heading becomes 52px. Body Large becomes 22px in Inter 500-600. Pill tag text stays at Inter 600 14px uppercase.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 920px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Light gray background (`#ececec`) runs edge-to-edge, with an optional subtle dot-grid radial-gradient texture on cover and CTA slides for the signature craft detail.
- **Cover slide**: Soft yellow-lime (`#e5f59e`) pill tag at the top of the content block (the framework marker). Below it, the hero Playfair Display headline at 72px with the signature move: 2-3 words set in *italic Playfair Display* coloured in deep forest green (`#2d5a1e`) -- the hook phrase. The italic-green words are the entire reason this slide exists. A short Inter 500 supporting line sits below in near-black.
- **Content slides**: One numbered framework step per slide. Yellow pill tag at top (`STEP 02` or similar). Thin-bordered card with 12px radius holding the Playfair Display heading at 48-52px (italic-green hook optional) and Inter 600 body below. Small forest-green dot decorations flank the heading for craft. Cards feel like notebook sections.
- **CTA slide**: Dot-grid texture background. Yellow pill tag above the headline. Playfair Display CTA headline at 56px with an italic-green hook word. Dark near-black pill button (40px radius) with white Inter 700 CTA text. A thin bordered card frames the whole CTA block.
- **Progress indicator**: Thin segments at the top of the safe zone -- inactive in `rgba(0,0,0,0.12)`, active in near-black (`#1a1a1a`). The dark-on-gray keeps the structural rhythm without competing with the forest-green accent.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Light Gray | `#ececec` | Primary background |
| Near-Black | `#1a1a1a` | Primary text, CTA button fill |
| Forest Green | `#2d5a1e` | Italic headline emphasis, decorative dots |
| Dark Green | `#1e4015` | Hover/active state for green elements |
| Yellow-Lime | `#e5f59e` | Tag pill fills |
| Card White | `rgba(255,255,255,0.3)` | Card backgrounds |
| Card Border | `rgba(0,0,0,0.12)` | Card and container borders |
| Secondary Text | `#4a4a4a` | Descriptions, subtitles |
| Tertiary Text | `#777777` | Metadata, attributions |
| Muted | `rgba(0,0,0,0.25)` | Slide numbers |

### Font Declarations

```css
/* Display (headlines only) */
font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;

/* Body (everything else) */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-bg: #ececec;
  --color-near-black: #1a1a1a;
  --color-green: #2d5a1e;

  /* Colors -- Accent */
  --color-yellow-tag: #e5f59e;
  --color-dark-green: #1e4015;
  --color-light-green: #d4e8d0;

  /* Colors -- Neutral Scale */
  --color-card-white: rgba(255, 255, 255, 0.3);
  --color-card-border: rgba(0, 0, 0, 0.12);
  --color-secondary: #4a4a4a;
  --color-tertiary: #777777;
  --color-muted: rgba(0, 0, 0, 0.25);
  --color-border-strong: rgba(0, 0, 0, 0.18);

  /* Colors -- Surfaces */
  --color-surface-primary: rgba(255, 255, 255, 0.3);
  --color-surface-inset: rgba(255, 255, 255, 0.15);
  --color-surface-tag: #e5f59e;

  /* Colors -- Borders */
  --color-border-default: rgba(0, 0, 0, 0.12);
  --color-border-accent: rgba(45, 90, 30, 0.3);
  --color-divider: rgba(0, 0, 0, 0.08);

  /* Colors -- Shadows */
  --shadow-subtle: rgba(0, 0, 0, 0.04);
  --shadow-medium: rgba(0, 0, 0, 0.08);
  --shadow-deep: rgba(0, 0, 0, 0.12);

  /* Typography -- Families */
  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 72px;
  --text-section-heading: 48px;
  --text-sub-heading: 32px;
  --text-body-large: 22px;
  --text-body: 18px;
  --text-small: 14px;
  --text-big-number: 64px;
  --text-tag: 14px;
  --text-cta: 16px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-display-extra: 800;
  --weight-sub-heading: 600;
  --weight-body: 600;
  --weight-body-bold: 700;
  --weight-body-medium: 500;
  --weight-tag: 600;
  --weight-cta: 700;

  /* Typography -- Line Heights */
  --leading-display: 1.10;
  --leading-heading: 1.15;
  --leading-sub-heading: 1.20;
  --leading-body-large: 1.55;
  --leading-body: 1.55;
  --leading-small: 1.50;
  --leading-number: 1.00;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-card-padding: 28px;
  --space-large: 32px;
  --space-gap: 40px;
  --space-section: 48px;
  --space-max: 80px;

  /* Borders */
  --radius-card: 12px;
  --radius-tag: 20px;
  --radius-cta: 40px;

  /* Texture */
  --dot-grid: radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px);
  --dot-grid-size: 32px 32px;
}
```

### System Font Fallbacks
- **Serif (if Playfair Display fails to load):** `Georgia, 'Times New Roman', serif`
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
