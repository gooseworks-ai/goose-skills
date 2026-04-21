# Design Style: Garden Blur

## 1. Visual Theme & Atmosphere

Garden Blur is the visual language of authenticity -- the kind of design you see from lifestyle brands, personal creators, and wellness-adjacent products that want to feel real, grounded, and human. The defining feature is a heavily blurred photographic backdrop of natural greenery -- warm olive tones, sage greens, earthy browns, and soft bokeh light spots that evoke a sun-dappled garden viewed through a window. This is not a flat color or a CSS gradient; it is a living, breathing photograph rendered as atmosphere through aggressive Gaussian blur (30-50px). The blur transforms a specific photograph into a universal mood: warmth, growth, presence.

Against this rich organic backdrop, crisp white cards (`#ffffff`) emerge with generous rounded corners (24px) and clean edges. The contrast is the entire story -- raw nature made abstract versus precise digital typography. The cards carry no visible border and minimal shadow; the depth of field blur provides all the elevation they need. Inside the cards, the typographic system is restrained and modern: a single sans-serif family (Inter from Google Fonts, matching the system-UI feel of the reference) handles every role from bold display names to quiet metadata handles. The weight range is narrow -- 400 for body, 500 for secondary, 700 for names and emphasis -- creating hierarchy through weight alone, never through decorative treatment.

The color story is deliberately quiet inside the cards. Near-black charcoal (`#1c1c1e`) for primary text, warm medium gray (`#8e8e93`) for secondary text and icons, and a single muted accent -- a dusty rose (`#a3867a`) -- for interactive highlights like the heart icon. This restraint is intentional: all the visual energy lives in the blurred backdrop, and the card content stays clean and readable. The overall effect feels like scrolling through a thoughtful person's feed while sitting in a greenhouse -- digital content that doesn't forget the physical world exists. Think of the aesthetic sensibility of Kinfolk magazine crossed with the clean card patterns of iOS notification design.

**Key Characteristics:**
- Blurred photographic backdrop of natural greenery with warm olive (`#6b7a52`), sage (`#8a9668`), and earthy brown (`#7a6b52`) tones
- Heavy Gaussian blur (30-50px) on the background image, creating a painterly bokeh atmosphere
- White (`#ffffff`) card surfaces with large rounded corners (24px) floating on the blurred backdrop
- Near-black charcoal (`#1c1c1e`) for primary text -- dark enough for strong contrast, warm enough to avoid coldness
- Inter at weights 400-700 throughout -- one font family, clean and system-native in feel
- Warm medium gray (`#8e8e93`) for all secondary text, handles, metadata, and icons
- Dusty rose (`#a3867a`) as the sole accent color -- used sparingly for interactive highlights
- No visible card borders -- depth comes from the contrast between sharp white cards and the soft blurred background
- Generous internal card padding (32-40px) with relaxed line heights for a breathable reading experience
- Social-card component pattern: circular avatar, name/handle pair, body text, interaction icon row
- Minimal UI chrome -- three-dot menus, outline icons, no filled buttons inside content cards

## 2. Color Palette & Roles

### Primary
- **White** (`#ffffff`): Card and container surface. The primary content background that creates contrast against the blurred backdrop.
- **Near-Black Charcoal** (`#1c1c1e`): Primary text color. Warm-leaning dark for high readability without the harshness of pure black.
- **Dusty Rose** (`#a3867a`): Primary accent. Used for interactive highlights (heart icon, active states), the only chromatic color inside the cards.

### Accent
- **Warm Taupe** (`#b89e8e`): Lighter accent for hover states, secondary interactive elements, and soft highlights.
- **Deep Rose** (`#8a6e62`): Darker accent for pressed/active states on interactive elements.
- **Sage Tint** (`#d4dcc8`): Background tint derived from the garden backdrop, used for subtle tag backgrounds or highlighted sections.

### Neutral Scale
- **Near-Black Charcoal** (`#1c1c1e`): Primary text, display names, headings, and high-emphasis content.
- **Dark Gray** (`#3a3a3c`): Secondary text for descriptions and supporting body copy.
- **Medium Gray** (`#636366`): Tertiary text for timestamps, bylines, and less prominent metadata.
- **Warm Gray** (`#8e8e93`): Handles, icons, placeholder text, and de-emphasized UI elements.
- **Light Gray** (`#c7c7cc`): Borders, dividers, and subtle structural lines within cards.
- **Pale Gray** (`#f2f2f7`): Hover surface tint on white cards, subtle background for inset sections.

### Surface & Borders
- **Surface Primary** (`#ffffff`): Card and container background.
- **Surface Tinted** (`#faf8f6`): Warm-tinted surface for featured or highlighted cards.
- **Surface Backdrop**: Blurred photographic image with dominant tones of olive (`#6b7a52`), sage (`#8a9668`), and earthy brown (`#7a6b52`).
- **Border Default** (`rgba(28,28,30,0.08)`): Subtle border for card edges when needed (usually omitted).
- **Border Accent** (`rgba(163,134,122,0.4)`): Rose-tinted border for active or featured elements.
- **Border Light** (`rgba(28,28,30,0.05)`): Barely visible divider for list items and sections within cards.

### Shadow Colors
- **Shadow Warm** (`rgba(107,122,82,0.12)`): Primary shadow -- green-tinted ambient glow that ties cards to the garden backdrop.
- **Shadow Medium** (`rgba(107,122,82,0.18)`): Medium elevation for featured cards and hover states.
- **Shadow Soft** (`rgba(28,28,30,0.06)`): Neutral soft shadow for minimal depth.
- **Shadow Deep** (`rgba(28,28,30,0.20)`): Deep shadow for modals and overlays.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Inter | 56px | 700 | 1.12 | -0.8px | Hero headlines, cover statements |
| Section Heading | Inter | 36px | 700 | 1.18 | -0.4px | Major section titles |
| Sub-heading | Inter | 24px | 600 | 1.25 | -0.2px | Card headings, subsection titles |
| Body Large | Inter | 20px | 400 | 1.55 | -0.1px | Lead paragraphs, tweet-style body text |
| Body | Inter | 16px | 400 | 1.60 | 0px | Standard reading text |
| Display Name | Inter | 17px | 700 | 1.25 | 0px | User names, bold inline labels |
| Small / Caption | Inter | 14px | 400 | 1.45 | 0px | Handles, metadata, timestamps |
| Big Numbers | Inter | 52px | 700 | 1.00 | -0.5px | Statistics, key metrics |
| Label | Inter | 12px | 500 | 1.00 | 0.3px | Uppercase tag labels, category markers |
| CTA Text | Inter | 15px | 600 | 1.00 | 0.2px | Button text |

### Principles
- **One family, weight-driven hierarchy**: Inter handles every role. Hierarchy comes from size and weight shifts, not font-family mixing. This mirrors the system-UI feel of the reference.
- **Regular weight for body**: Weight 400 for body text keeps the reading experience clean and neutral. Weight 500 is reserved for secondary emphasis like handles and captions that need slight differentiation.
- **Bold for names and display**: Weight 700 is used for display names, hero text, and big numbers. It creates clear focal points without needing color differentiation.
- **Tight tracking at large sizes**: Negative letter-spacing (-0.4px to -0.8px) at 36px+ keeps large text feeling compact and modern. At body sizes, tracking is neutral (0px).
- **Relaxed line heights for body**: 1.55-1.60 for body text creates the open, breathable reading rhythm that matches the spacious card layout.
- **No uppercase in body content**: Uppercase is reserved for tiny labels (12px) only. All headings, names, and body text use natural casing.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="position: relative; width: 100%; height: 100%; background: url('garden-backdrop.jpg') center/cover no-repeat; filter: blur(0px);">
  <div style="position: absolute; inset: 0; backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); background: rgba(107,122,82,0.15);"></div>
  <div style="position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; height: 100%; padding: 60px;">
    <div style="background: var(--color-white); border-radius: 24px; padding: 48px 40px; max-width: 600px; width: 100%; text-align: center;">
      <h1 style="font-family: var(--font-display); font-size: 56px; font-weight: 700; line-height: 1.12; letter-spacing: -0.8px; color: var(--color-charcoal); margin: 0 0 16px;">Thoughts from the garden</h1>
      <p style="font-family: var(--font-body); font-size: 20px; font-weight: 400; line-height: 1.55; color: var(--color-warm-gray); margin: 0;">A collection of ideas worth sharing.</p>
    </div>
  </div>
</div>
```

### Social Card (Signature Component)

```html
<div style="background: var(--color-white); border-radius: 24px; padding: 32px; max-width: 540px;">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--color-pale-gray); overflow: hidden;"><img src="avatar.jpg" style="width: 100%; height: 100%; object-fit: cover;"></div>
      <div>
        <p style="font-family: var(--font-display); font-size: 17px; font-weight: 700; line-height: 1.25; color: var(--color-charcoal); margin: 0;">Noah Carter</p>
        <p style="font-family: var(--font-body); font-size: 14px; font-weight: 400; line-height: 1.45; color: var(--color-warm-gray); margin: 0;">@noahcarter</p>
      </div>
    </div>
    <span style="color: var(--color-warm-gray); font-size: 20px; letter-spacing: 2px;">&#8943;</span>
  </div>
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 400; line-height: 1.55; letter-spacing: -0.1px; color: var(--color-charcoal); margin: 0 0 24px;">Doing great work is simple: open the doc, stare at it, question your life choices, rewrite everything, drink coffee, and suddenly it's 4PM. Repeat.</p>
  <div style="display: flex; gap: 20px;">
    <span style="color: var(--color-accent); font-size: 18px;">&#9829;</span>
    <span style="color: var(--color-warm-gray); font-size: 18px;">&#9633;</span>
    <span style="color: var(--color-warm-gray); font-size: 18px;">&#8679;</span>
  </div>
</div>
```

### Stat Display

```html
<div style="background: var(--color-white); border-radius: 24px; padding: 40px 32px; text-align: center;">
  <p style="font-family: var(--font-display); font-size: 52px; font-weight: 700; line-height: 1.00; letter-spacing: -0.5px; color: var(--color-accent); margin: 0 0 8px;">4PM</p>
  <p style="font-family: var(--font-body); font-size: 12px; font-weight: 500; letter-spacing: 0.3px; text-transform: uppercase; color: var(--color-charcoal); margin: 0 0 12px;">Average Realization Time</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-warm-gray); max-width: 280px; margin: 0 auto;">The moment when the day's ambition meets reality and coffee stops working.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
  <div style="background: var(--color-white); border-radius: 24px; padding: 36px 28px;">
    <div style="display: inline-block; background: var(--color-pale-gray); border-radius: 20px; padding: 4px 14px; margin-bottom: 16px;">
      <span style="font-family: var(--font-body); font-size: 12px; font-weight: 500; color: var(--color-warm-gray);">Before</span>
    </div>
    <h3 style="font-family: var(--font-display); font-size: 24px; font-weight: 600; line-height: 1.25; letter-spacing: -0.2px; color: var(--color-charcoal); margin: 0 0 10px;">Scattered & Manual</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-medium-gray); margin: 0;">Context scattered across tabs, threads, and half-finished docs nobody remembers starting.</p>
  </div>
  <div style="background: var(--color-white); border-radius: 24px; padding: 36px 28px; border: 2px solid rgba(163,134,122,0.4);">
    <div style="display: inline-block; background: rgba(163,134,122,0.1); border-radius: 20px; padding: 4px 14px; margin-bottom: 16px;">
      <span style="font-family: var(--font-body); font-size: 12px; font-weight: 600; color: var(--color-accent);">After</span>
    </div>
    <h3 style="font-family: var(--font-display); font-size: 24px; font-weight: 600; line-height: 1.25; letter-spacing: -0.2px; color: var(--color-charcoal); margin: 0 0 10px;">Focused & Flowing</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-medium-gray); margin: 0;">One place, one rhythm, one conversation that remembers where you left off.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 16px; align-items: flex-start; padding: 20px 0; border-bottom: 1px solid rgba(28,28,30,0.05);">
  <div style="width: 36px; height: 36px; min-width: 36px; display: flex; align-items: center; justify-content: center; background: rgba(163,134,122,0.1); border-radius: 50%; color: var(--color-accent); font-size: 16px;">&#10003;</div>
  <div>
    <h4 style="font-family: var(--font-display); font-size: 17px; font-weight: 700; line-height: 1.25; color: var(--color-charcoal); margin: 0 0 4px;">Persistent Context</h4>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.60; color: var(--color-warm-gray); margin: 0;">Your agent remembers every conversation, every file, every preference -- no repetition needed.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="background: var(--color-white); border-radius: 24px; padding: 36px 32px; border-left: 3px solid var(--color-accent);">
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 400; font-style: italic; line-height: 1.55; color: var(--color-charcoal); margin: 0 0 20px;">"The best tools disappear into your workflow. You stop thinking about the tool and start thinking about the work."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--color-accent), #8a9668);"></div>
    <div>
      <p style="font-family: var(--font-body); font-size: 15px; font-weight: 600; color: var(--color-charcoal); margin: 0;">Elena Vasquez</p>
      <p style="font-family: var(--font-body); font-size: 13px; font-weight: 400; color: var(--color-warm-gray); margin: 0;">Head of Product, Meridian</p>
    </div>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 48px 36px; background: var(--color-white); border-radius: 24px;">
  <h2 style="font-family: var(--font-display); font-size: 36px; font-weight: 700; line-height: 1.18; letter-spacing: -0.4px; color: var(--color-charcoal); margin: 0 0 12px;">Start something real</h2>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.55; color: var(--color-warm-gray); max-width: 420px; margin: 0 auto 28px;">No setup. No configuration maze. Just open it and go.</p>
  <a style="display: inline-block; background: var(--color-charcoal); color: #ffffff; font-family: var(--font-body); font-size: 15px; font-weight: 600; letter-spacing: 0.2px; text-decoration: none; padding: 14px 32px; border-radius: 12px;">Get Started</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between name and handle vertically, between icon and inline count.
- **8px**: Tight gap -- between stat number and label, between small grouped elements.
- **12px**: Small gap -- between heading and subtitle within a card, between avatar and name block.
- **16px**: Base gap -- between body paragraphs, between compact list items.
- **20px**: Card gap -- between cards in a grid, between interaction icons in a row, between avatar row and body text.
- **24px**: Medium gap -- between body text and interaction row, standard list item vertical padding.
- **32px**: Card padding -- internal padding for standard cards.
- **40px**: Large card padding -- internal padding for hero and featured cards.
- **48px**: Section divider -- vertical space between major content blocks on the backdrop.
- **60px**: Hero padding -- top/bottom padding for cover sections.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 48px all sides | 984px |
| Infographic (1080xN) | 40px left/right, 48px top/bottom | 1000px |
| Slides (1920x1080) | 60px all sides | 1800px |
| Poster (1080x1350) | 40px left/right, 48px top/bottom | 1000px |

### Alignment & Grid
- **Primary alignment**: Left-aligned text inside cards. Center-aligned for hero titles, stat displays, and CTA blocks.
- **Grid**: Single white card centered on backdrop for social-card layouts. 2-column grid with 20px gaps for comparison and feature cards. Single-column for narrative and quote content.
- **Card placement**: Cards should be centered on the blurred backdrop with visible backdrop margin on all sides -- the backdrop is a framing device, not wallpaper.
- **Rounded corners**: 24px for all cards and major containers. 12px for buttons. 50% (circular) for avatars and small icon containers. 20px for pill badges.
- **Content gravity**: On widescreen formats (1920x1080), center the card(s) with generous margins. The blurred backdrop should be prominently visible as atmospheric framing. On square formats, the card can fill more of the frame but should never touch the edges.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Backdrop (Level 0) | Blurred photographic image, no shadow | Page canvas, atmospheric base layer |
| Resting (Level 1) | `rgba(107,122,82,0.08) 0px 2px 12px` | Subtle lift for secondary elements on the backdrop |
| Card (Level 2) | `rgba(107,122,82,0.12) 0px 4px 24px, rgba(28,28,30,0.04) 0px 1px 4px` | Standard card elevation on blurred backdrop |
| Featured (Level 3) | `rgba(107,122,82,0.18) 0px 8px 36px, rgba(28,28,30,0.06) 0px 2px 8px` | Featured cards, hover states |
| Overlay (Level 4) | `rgba(28,28,30,0.20) 0px 16px 48px` | Modals, overlays, floating panels |

### Border Treatments
- **Standard border**: None. Cards in this style rely on the contrast between the white surface and the blurred backdrop for definition. Borders are generally omitted.
- **Active border**: `2px solid rgba(163,134,122,0.4)` -- rose-tinted border for featured or selected containers.
- **Divider line**: `1px solid rgba(28,28,30,0.05)` -- barely visible separator for list items within cards.
- **Accent rule**: `3px solid var(--color-accent)` -- left-side accent bar for quote blocks and highlighted sections.

### Surface Hierarchy
On the blurred photographic backdrop, elevation is communicated primarily through contrast and blur differential:
1. **Backdrop** (blurred photograph, olive/sage/brown tones) -- the atmospheric base. Always blurred at 30-50px.
2. **Surface** (`#ffffff`) -- white cards with sharp edges float above the soft backdrop. The blur-to-sharp transition is the primary depth cue.
3. **Tinted Surface** (`#faf8f6`) -- warm-tinted cards for featured content, slightly distinguishable from pure white.
4. **Inset** (`#f2f2f7`) -- recessed areas within white cards for input fields or secondary panels.

Green-tinted shadows (`rgba(107,122,82,0.08-0.18)`) maintain the connection between the card and the natural backdrop, preventing the cards from feeling pasted on.

## 7. Do's and Don'ts

### Do
- Use a blurred photographic backdrop with natural greenery, warm olive, and sage tones as the atmospheric base for every design.
- Apply heavy Gaussian blur (30-50px) to the backdrop image so it reads as texture and color, not as a specific photograph.
- Float white cards (`#ffffff`) with 24px border-radius on the blurred backdrop -- the sharp-vs-soft contrast is the signature of this style.
- Use Inter at weight 400 for body text and 700 for display names and headings -- hierarchy through weight, not decoration.
- Keep the interior of cards quiet and restrained: near-black text (`#1c1c1e`), warm gray (`#8e8e93`) for secondary elements, minimal accent color.
- Use dusty rose (`#a3867a`) as the only accent color inside cards, and use it sparingly -- one or two elements per card maximum.
- Maintain generous card padding (32-40px) and relaxed line heights (1.55-1.60) for body text.
- Use circular avatars (border-radius: 50%) for profile images, sized at 44-48px.
- Leave visible backdrop margin around cards -- the blurred garden is a framing device and should always be seen.
- Use outline-style icons (not filled) for interaction elements like heart, comment, and share.
- Choose backdrop photos with warm, golden-hour lighting for the most cohesive feel.

### Don't
- Don't use pure black (`#000000`) for text -- always use near-black charcoal (`#1c1c1e`) to maintain warmth.
- Don't use sharp corners (border-radius: 0-8px) on cards -- the minimum card radius is 24px in this style.
- Don't add visible borders to cards unless marking them as featured or active. The blur-to-sharp contrast provides all the definition needed.
- Don't use multiple bright accent colors -- this style uses a single muted accent (dusty rose `#a3867a`) and neutral grays. No blues, greens, or saturated reds inside cards.
- Don't use heavy drop shadows on cards -- shadows should be subtle and green-tinted (`rgba(107,122,82,0.12)`), not dark or dramatic.
- Don't use a solid color or CSS gradient as the backdrop -- the style requires a blurred photograph with organic texture and variation.
- Don't use weight 700 for body text or small labels -- bold is reserved for display names (17px+) and headings (24px+).
- Don't crowd the backdrop -- cards should occupy 60-75% of the frame at most, leaving the blurred garden visible.
- Don't use filled/solid icons -- this style uses outline icons with warm gray (`#8e8e93`) stroke.
- Don't use uppercase text for anything except small labels (12px) -- headings and names are always mixed case.
- Don't use cold-toned backdrops (blue sky, ice, concrete) -- the backdrop must feel warm, organic, and garden-like.
- Don't use dark mode cards or dark surfaces -- the entire aesthetic depends on white cards against a warm, blurred natural backdrop.

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
- **Typography scale down**: Display Hero becomes 44px (from 56px). Section Heading becomes 30px. Sub-heading stays 24px. Body Large stays 20px.
- **Padding**: 48px on all sides. Card(s) centered within the frame.
- **Cover slide**: Single white card centered on the blurred backdrop. Title and subtitle inside the card. Backdrop visible on all sides.
- **Content slides**: One social card per slide, centered. Or one concept card per slide with heading + body text.
- **Stat slides**: Single stat centered within a white card. Big number in accent color, label below.
- **Swipe indicator**: Small dots at bottom center, 7px diameter, 10px gap. Active dot in charcoal, inactive dots at 25% opacity.

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Hero at 56px for the title section.
- **Padding**: 40px left/right, 48px top/bottom margins.
- **Section spacing**: 32px vertical gap between cards. Each major section is its own white card floating on the continuous blurred backdrop.
- **Vertical rhythm**: Alternate between social cards, stat displays, and text cards. The blurred backdrop runs continuously behind all cards, creating a vertical garden strip.
- **Footer**: Secondary text, 13px Inter, centered within a final card or directly on the backdrop in white.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 64px. Section Heading becomes 44px. Body Large becomes 22px.
- **Padding**: 60px on all sides. Content area is 1800x960px.
- **Layout**: Cards centered with generous backdrop visibility. The wide format means more backdrop is visible -- use this to create atmosphere.
- **Title slides**: Single large white card (max 720px wide) centered on frame with headline and subtitle.
- **Content slides**: 2-3 cards in a row for comparisons with 20px gaps. Single large card for narrative content.
- **Stat slides**: Up to 3 stat cards in a row, evenly spaced, with visible backdrop between them.

### Poster (1080x1350px)
- **Typography**: Display Hero at 48px. Section Heading at 32px. Body at 16px.
- **Padding**: 40px left/right, 48px top/bottom.
- **Composition**: Top section for hero card with headline. Middle section for feature cards (single column or 2-column grid). Bottom section for CTA card.
- **Vertical flow**: Cards stack vertically with 24px gaps. The blurred backdrop fills the tall frame, providing continuous warmth between card sections.
- **CTA placement**: In its own white card at the bottom, with a dark charcoal button centered.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 56px (approximately 30% larger than Carousel 44px). Section Heading becomes 40px in Inter 700. Body Large becomes 22px in Inter 400. Names stay at Inter 700, handles in Inter 500 medium gray.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 880px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. The heavily blurred photographic backdrop of greenery (olive, sage, earthy browns, bokeh highlights) fills the entire frame so every card floats on that sun-dappled atmosphere.
- **Cover slide**: Single tall white card (24px radius, 32-40px internal padding, no visible border) centered in the safe zone. Headline in Inter 700 at 56px near-black charcoal with relaxed 1.2 line-height, short subtitle in warm medium gray below. The blurred garden shows above, below, and to the sides of the card -- whitespace is atmosphere.
- **Content slides**: One social-style card per slide. Circular avatar 56px at top, name in Inter 700 and handle in Inter 500 medium gray beside it, body content in Inter 400 at 22px, and an icon row along the bottom (outline icons in medium gray with one dusty-rose heart as the accent). Only one card per slide so the content breathes inside the garden light.
- **CTA slide**: A single white card with the headline in Inter 700 at 48px, a short line of supporting body, and a rounded pill button in near-black charcoal with white Inter 600 CTA text. Dusty rose (`#a3867a`) underline or micro-icon adds the one accent.
- **Progress indicator**: Ultra-thin segmented bars (2px, 6px gap) at the top inside the safe zone in `rgba(255,255,255,0.5)` for inactive and solid white for active. The subtlety matches the restrained UI chrome of the rest of the system.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| White | `#ffffff` | Card and container surface |
| Near-Black Charcoal | `#1c1c1e` | Primary text, headings, display names |
| Dusty Rose | `#a3867a` | Accent: interactive highlights, heart icons, active states |
| Warm Taupe | `#b89e8e` | Hover/light accent states |
| Deep Rose | `#8a6e62` | Pressed/active accent states |
| Sage Tint | `#d4dcc8` | Tag backgrounds, subtle highlights |
| Dark Gray | `#3a3a3c` | Secondary text, descriptions |
| Medium Gray | `#636366` | Tertiary text, timestamps |
| Warm Gray | `#8e8e93` | Handles, icons, metadata, placeholders |
| Light Gray | `#c7c7cc` | Borders, dividers |
| Pale Gray | `#f2f2f7` | Hover surface, inset backgrounds |
| Tinted Surface | `#faf8f6` | Featured card background |
| Backdrop Olive | `#6b7a52` | Dominant backdrop tone (for solid fallback) |
| Backdrop Sage | `#8a9668` | Secondary backdrop tone |
| Backdrop Brown | `#7a6b52` | Tertiary backdrop tone |

### Font Declarations

```css
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-white: #ffffff;
  --color-charcoal: #1c1c1e;
  --color-accent: #a3867a;

  /* Colors -- Accent */
  --color-warm-taupe: #b89e8e;
  --color-deep-rose: #8a6e62;
  --color-sage-tint: #d4dcc8;

  /* Colors -- Neutral Scale */
  --color-dark-gray: #3a3a3c;
  --color-medium-gray: #636366;
  --color-warm-gray: #8e8e93;
  --color-light-gray: #c7c7cc;
  --color-pale-gray: #f2f2f7;

  /* Colors -- Surfaces */
  --color-surface-primary: #ffffff;
  --color-surface-tinted: #faf8f6;
  --color-backdrop-olive: #6b7a52;
  --color-backdrop-sage: #8a9668;
  --color-backdrop-brown: #7a6b52;

  /* Colors -- Borders */
  --color-border-default: rgba(28, 28, 30, 0.08);
  --color-border-accent: rgba(163, 134, 122, 0.4);
  --color-border-light: rgba(28, 28, 30, 0.05);

  /* Colors -- Shadows */
  --shadow-warm: rgba(107, 122, 82, 0.12);
  --shadow-warm-medium: rgba(107, 122, 82, 0.18);
  --shadow-soft: rgba(28, 28, 30, 0.06);
  --shadow-deep: rgba(28, 28, 30, 0.20);

  /* Typography -- Families */
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 56px;
  --text-section-heading: 36px;
  --text-sub-heading: 24px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-display-name: 17px;
  --text-small: 14px;
  --text-big-number: 52px;
  --text-label: 12px;
  --text-cta: 15px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-heading: 600;
  --weight-body-medium: 500;
  --weight-body: 400;
  --weight-label: 500;

  /* Typography -- Line Heights */
  --leading-display: 1.12;
  --leading-heading: 1.18;
  --leading-sub-heading: 1.25;
  --leading-body-large: 1.55;
  --leading-body: 1.60;
  --leading-small: 1.45;
  --leading-number: 1.00;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-card-gap: 20px;
  --space-medium: 24px;
  --space-card-padding: 32px;
  --space-large: 40px;
  --space-section: 48px;
  --space-hero: 60px;

  /* Borders */
  --radius-card: 24px;
  --radius-button: 12px;
  --radius-pill: 20px;
  --radius-avatar: 50%;

  /* Shadows -- Composed */
  --shadow-card: rgba(107,122,82,0.12) 0px 4px 24px, rgba(28,28,30,0.04) 0px 1px 4px;
  --shadow-featured: rgba(107,122,82,0.18) 0px 8px 36px, rgba(28,28,30,0.06) 0px 2px 8px;

  /* Backdrop Blur */
  --backdrop-blur: 40px;
}
```

### System Font Fallbacks
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Background Generation

**IMPORTANT: Use a real photograph for the backdrop, NOT CSS gradients or radial-gradient stacks.** CSS gradients cannot replicate the organic bokeh and natural light variation this style requires. The backdrop must be a real nature photograph.

**Recommended approach:** Use an Unsplash image of natural greenery, gardens, or foliage. Apply CSS `filter: blur(16px)` and `transform: scale(1.15)` to create the garden-blur effect.

```css
.garden-blur-backdrop {
  position: absolute;
  inset: 0;
  background-image: url('YOUR_IMAGE_URL_HERE');
  background-size: cover;
  background-position: center;
  filter: blur(16px);
  transform: scale(1.15); /* prevents blur edge artifacts */
  z-index: 0;
}
```

**Good image search terms for Unsplash:** "garden bokeh", "green leaves sunlight", "nature golden hour", "foliage warm light", "botanical garden blur"

**Never fall back to CSS gradients.** If no image URL is available, ask the user for one or search Unsplash. The entire aesthetic depends on organic photographic texture — gradients will look flat and artificial.
