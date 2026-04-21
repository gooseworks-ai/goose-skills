# Design Style: Deep Ocean

## 1. Visual Theme & Atmosphere

Deep Ocean draws its language from the luminescent world beneath the surface -- where bioluminescent organisms pulse with cyan light against an infinite dark, where sonar pings trace through navy-black water, and where every point of light earns its presence through sheer contrast with the surrounding void. The deep blue-black background (`#0a1628`) is not simply dark; it carries the chromatic depth of ocean water at 200 metres, where the last traces of sunlight dissolve into indigo. Light blue-gray text (`#c8d6e5`) reads against this surface like the ghostly luminescence of deep-sea creatures -- visible, legible, but never harsh. The overall effect is one of calm immersion: the viewer is underwater, surrounded by information that glows with quiet authority.

The typographic system uses Satoshi from Fontshare -- a clean, modern sans-serif that feels technical without being cold, geometric without being rigid. At display sizes (48px+), Satoshi at weight 700 delivers headlines with clarity and confidence, its letterforms open and legible even against dark backgrounds. For body text, Satoshi at weight 400 provides an excellent reading experience with clean, even strokes. The single-family approach maintains the immersive atmosphere -- switching fonts would break the environmental consistency, like switching camera angles in a documentary. Everything stays within the same visual current.

Cyan-teal (`#00d4aa`) is the accent colour -- the bioluminescent glow that gives this style its signature character. It is not the cold cyan of a loading spinner but a warm teal that sits between cyan and green, carrying the organic quality of sea-glass or phosphorescent plankton. On dark surfaces, it creates a genuine glow effect through box-shadows (`box-shadow: 0 0 20px rgba(0,212,170,0.3)`) that simulate light emission rather than mere colour application. Muted blue (`#3d6b99`) serves as the secondary accent -- the ambient colour of deep water itself, used for secondary borders, background tints, and quiet structural elements that maintain the oceanic environment without competing with the cyan focal points.

**Key Characteristics:**
- Deep blue-black background (`#0a1628`) -- oceanic depth with chromatic richness, not flat black
- Light blue-gray text (`#c8d6e5`) -- soft, luminescent readability against dark surfaces
- Cyan-teal accent (`#00d4aa`) -- bioluminescent glow for focal points, numbers, CTAs, and interactive elements
- Muted blue secondary (`#3d6b99`) -- ambient ocean colour for borders, secondary elements, and structural tints
- Satoshi font throughout: weight 700 for display, weight 400-500 for body. Clean, modern, technical
- Glow effects on accent elements: `box-shadow: 0 0 20px rgba(0,212,170,0.3)` for simulated light emission
- Dark gradient backgrounds using subtle shifts between navy tones for environmental depth
- Calm authority -- professional without being corporate, immersive without being distracting
- Thin borders using muted blue (`1px solid rgba(61,107,153,0.3)`) for structural definition
- Environmental consistency -- every element feels like it belongs underwater

## 2. Color Palette & Roles

### Primary
- **Deep Ocean** (`#0a1628`): Primary background. A blue-black with chromatic depth, like ocean water beyond the photic zone.
- **Luminous Gray** (`#c8d6e5`): Primary text colour. Light blue-gray with a cool undertone that reads as natural light through water.
- **Cyan Glow** (`#00d4aa`): Primary accent. The bioluminescent focal colour for numbers, rules, CTAs, and interactive highlights.

### Accent
- **Muted Blue** (`#3d6b99`): Secondary accent for borders, secondary labels, and ambient structural elements.
- **Bright Cyan** (`#33e8c0`): Tertiary accent for hover states and high-emphasis text. A brighter, more energetic cyan.
- **Deep Teal** (`#009b7d`): Darker cyan for active states on interactive elements.

### Neutral Scale
- **Navy Surface** (`#0e1f3a`): Elevated surface -- cards, containers, content panels sitting above the ocean background.
- **Navy Mid** (`#132847`): Secondary surface for nested containers, input fields, and inset areas.
- **Dark Slate** (`#2a4060`): Disabled text, placeholder content, and subtle dividers.
- **Ocean Gray** (`#5a7a9e`): Tertiary text for timestamps, metadata, and low-priority labels.
- **Silver Sea** (`#8aa0b8`): Used sparingly for de-emphasized captions on dark surfaces.

### Surface & Borders
- **Surface Primary** (`#0e1f3a`): Card and container background.
- **Surface Inset** (`#091320`): Recessed areas, code blocks, and inset panels.
- **Border Default** (`rgba(61,107,153,0.25)`): Standard muted-blue border for cards and dividers.
- **Border Accent** (`rgba(0,212,170,0.3)`): Cyan-tinted border for active or featured elements.
- **Border Strong** (`rgba(200,214,229,0.12)`): Higher-contrast cool border for prominent containers.
- **Border Muted** (`rgba(61,107,153,0.15)`): Subtle blue border for dense list content.
- **Divider Rule** (`#00d4aa`): Solid cyan for horizontal accent rules (typically 2px height).

### Shadow Colors
- **Shadow Glow** (`rgba(0,212,170,0.15)`): Primary glow shadow -- cyan-tinted light emission for accent elements.
- **Shadow Ambient** (`rgba(0,212,170,0.08)`): Subtle cyan ambient glow for on-palette elevation.
- **Shadow Deep** (`rgba(0,0,0,0.5)`): Deep shadow for high-elevation elements like modals.
- **Shadow Soft** (`rgba(0,0,0,0.3)`): Standard shadow layer for cards and containers.
- **Shadow Faint** (`rgba(0,212,170,0.04)`): Barely perceptible glow for subtle lift.

## 3. Typography Rules

### Font Families

**Fontshare CDN:**
```html
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
```

- **Display**: `'Satoshi', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Satoshi', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Satoshi | 72px | 700 | 1.05 | -1px | Bold, clear, authoritative |
| Section Heading | Satoshi | 48px | 700 | 1.10 | -0.5px | Major section titles |
| Sub-heading | Satoshi | 32px | 700 | 1.15 | -0.3px | Subsection titles, card headings |
| Body Large | Satoshi | 20px | 400 | 1.65 | 0px | Lead paragraphs, introductions |
| Body | Satoshi | 16px | 400 | 1.70 | 0.1px | Standard reading text |
| Small / Caption | Satoshi | 13px | 400 | 1.50 | 0.3px | Metadata, attributions, timestamps |
| Big Numbers | Satoshi | 64px | 700 | 1.00 | -1px | Statistics, key metrics, hero data |
| Label | Satoshi | 14px | 500 | 1.00 | 2px | Uppercase category labels ("01 -- RESEARCH") |
| CTA Text | Satoshi | 15px | 700 | 1.00 | 1px | Button and call-to-action text, uppercase |

### Principles
- **Single-family immersion**: Satoshi handles all typographic roles. Switching fonts would break the environmental consistency. Hierarchy comes from weight and size.
- **Bold display, regular body**: Satoshi at weight 700 for display type creates confident, clear headlines. Weight 400 for body keeps reading comfortable and unforced.
- **Tight tracking at display, open at small sizes**: Negative letter-spacing (-1px to -0.3px) at display sizes creates dense, impactful headlines. Small labels open up (2px) for legibility.
- **Generous line height for body**: 1.65-1.70 for body text ensures comfortable reading against dark backgrounds where dense text becomes fatiguing.
- **Medium weight for labels**: Weight 500 for labels provides a subtle emphasis above body weight (400) without the heaviness of 700.
- **Uppercase sparingly**: Reserved for labels and CTA buttons only. All headlines use mixed case for a professional, calm tone.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background: linear-gradient(180deg, #0a1628 0%, #0e1f3a 100%); padding: 80px 60px; text-align: center;">
  <div style="width: 60px; height: 2px; background: #00d4aa; margin: 0 auto 32px; box-shadow: 0 0 12px rgba(0,212,170,0.3);"></div>
  <h1 style="font-family: 'Satoshi', sans-serif; font-size: 72px; font-weight: 700; line-height: 1.05; letter-spacing: -1px; color: #c8d6e5; margin: 0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family: 'Satoshi', sans-serif; font-size: 20px; font-weight: 400; line-height: 1.65; color: #5a7a9e; max-width: 600px; margin: 0 auto;">How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.</p>
  <div style="width: 60px; height: 2px; background: #00d4aa; margin: 40px auto 0; box-shadow: 0 0 12px rgba(0,212,170,0.3);"></div>
</div>
```

### Numbered Item

```html
<div style="display: flex; gap: 24px; align-items: flex-start; padding: 32px 0; border-bottom: 1px solid rgba(61,107,153,0.25);">
  <span style="font-family: 'Satoshi', sans-serif; font-size: 48px; font-weight: 700; line-height: 1.00; color: #00d4aa; min-width: 72px; text-shadow: 0 0 20px rgba(0,212,170,0.3);">01</span>
  <div>
    <p style="font-family: 'Satoshi', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #3d6b99; margin: 0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family: 'Satoshi', sans-serif; font-size: 32px; font-weight: 700; line-height: 1.15; letter-spacing: -0.3px; color: #c8d6e5; margin: 0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family: 'Satoshi', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #5a7a9e; margin: 0;">Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 24px; background: #0e1f3a; border: 1px solid rgba(61,107,153,0.25); border-radius: 8px;">
  <p style="font-family: 'Satoshi', sans-serif; font-size: 64px; font-weight: 700; line-height: 1.00; letter-spacing: -1px; color: #00d4aa; margin: 0 0 8px; text-shadow: 0 0 24px rgba(0,212,170,0.3);">47%</p>
  <p style="font-family: 'Satoshi', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #c8d6e5; margin: 0 0 12px;">FASTER RESPONSE</p>
  <p style="font-family: 'Satoshi', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #5a7a9e; max-width: 280px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(61,107,153,0.25); border-radius: 8px; overflow: hidden;">
  <div style="background: #0e1f3a; padding: 40px 32px;">
    <p style="font-family: 'Satoshi', sans-serif; font-size: 13px; font-weight: 400; letter-spacing: 0.3px; color: #3d6b99; margin: 0 0 16px;">Without Goose</p>
    <h3 style="font-family: 'Satoshi', sans-serif; font-size: 32px; font-weight: 700; line-height: 1.15; letter-spacing: -0.3px; color: #c8d6e5; margin: 0 0 16px;">Manual & Fragmented</h3>
    <p style="font-family: 'Satoshi', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #5a7a9e; margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
  </div>
  <div style="background: #0e1f3a; padding: 40px 32px; border-left: 2px solid #00d4aa;">
    <p style="font-family: 'Satoshi', sans-serif; font-size: 13px; font-weight: 400; letter-spacing: 0.3px; color: #00d4aa; margin: 0 0 16px;">With Goose</p>
    <h3 style="font-family: 'Satoshi', sans-serif; font-size: 32px; font-weight: 700; line-height: 1.15; letter-spacing: -0.3px; color: #c8d6e5; margin: 0 0 16px;">Orchestrated & Autonomous</h3>
    <p style="font-family: 'Satoshi', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #5a7a9e; margin: 0;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid rgba(61,107,153,0.25);">
  <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,212,170,0.3); border-radius: 8px; color: #00d4aa; font-size: 18px; box-shadow: 0 0 12px rgba(0,212,170,0.15);">&#9670;</div>
  <div>
    <h4 style="font-family: 'Satoshi', sans-serif; font-size: 22px; font-weight: 700; line-height: 1.20; color: #c8d6e5; margin: 0 0 8px;">Persistent Memory</h4>
    <p style="font-family: 'Satoshi', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #5a7a9e; margin: 0;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 48px 40px; border-left: 2px solid #00d4aa; background: linear-gradient(90deg, rgba(0,212,170,0.04) 0%, transparent 40%); border-radius: 0 8px 8px 0;">
  <p style="font-family: 'Satoshi', sans-serif; font-size: 32px; font-weight: 400; font-style: italic; line-height: 1.35; letter-spacing: -0.3px; color: #c8d6e5; margin: 0 0 24px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 32px; height: 2px; background: #00d4aa; box-shadow: 0 0 8px rgba(0,212,170,0.3);"></div>
    <p style="font-family: 'Satoshi', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #3d6b99; margin: 0;">SARAH CHEN, VP OPERATIONS</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: linear-gradient(180deg, #0e1f3a, #132847); border: 1px solid rgba(0,212,170,0.2); border-radius: 8px;">
  <h2 style="font-family: 'Satoshi', sans-serif; font-size: 40px; font-weight: 700; line-height: 1.10; letter-spacing: -0.5px; color: #c8d6e5; margin: 0 0 16px;">Ready to meet your team?</h2>
  <p style="font-family: 'Satoshi', sans-serif; font-size: 18px; font-weight: 400; line-height: 1.65; color: #5a7a9e; max-width: 480px; margin: 0 auto 32px;">Deploy your first AI coworker in under five minutes. No setup fees, no long-term commitments.</p>
  <a style="display: inline-block; background: #00d4aa; color: #0a1628; font-family: 'Satoshi', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; text-decoration: none; padding: 16px 40px; border-radius: 8px; box-shadow: 0 0 24px rgba(0,212,170,0.3);">Get Started</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between icon and inline label.
- **8px**: Tight gap -- between sub-label and heading, between stat number and label.
- **12px**: Small gap -- between heading and body text within a component.
- **16px**: Base gap -- between body paragraphs, between list items in compact mode.
- **24px**: Medium gap -- between components within a section, standard list item padding.
- **32px**: Section internal -- padding inside cards and containers, gap between grouped items.
- **48px**: Section divider -- vertical space between major content blocks.
- **60px**: Large section padding -- top/bottom padding for hero and CTA blocks.
- **80px**: Maximum section padding -- cover slides and high-impact hero areas.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |

### Alignment & Grid
- **Primary alignment**: Left-aligned text for body content. Center-aligned for hero titles, stats, and CTA blocks.
- **Grid**: Use a simple 2-column grid for comparison layouts. Single-column for narrative and list content. 3-column for stat grids on widescreen slides.
- **Horizontal rules**: 2px tall, cyan (`#00d4aa`) with glow shadow, 60px wide, centered -- used as section dividers.
- **Vertical rhythm**: Maintain consistent 48px gaps between top-level sections. Use 24px gaps between items within a section.
- **Content gravity**: On widescreen slides (1920x1080), anchor content to the left two-thirds of the frame. Leave the right third as breathing room.
- **Gradient backgrounds**: Subtle `linear-gradient(180deg, #0a1628, #0e1f3a)` shifts between sections to create environmental depth -- like descending deeper underwater.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#0a1628` | Page canvas, base layer |
| Subtle (Level 1) | `rgba(0,0,0,0.3) 0px 2px 8px` | Slight lift for list items on hover |
| Card (Level 2) | `rgba(0,0,0,0.3) 0px 8px 24px, rgba(0,212,170,0.04) 0px 0px 12px` | Standard card and container elevation |
| Featured (Level 3) | `rgba(0,0,0,0.4) 0px 16px 40px, rgba(0,212,170,0.08) 0px 0px 20px` | Featured cards, quote blocks, hero elements |
| Glow (Level 3+) | `0px 0px 20px rgba(0,212,170,0.3), 0px 0px 40px rgba(0,212,170,0.1)` | Accent elements that emit light: numbers, CTAs, glowing rules |
| Overlay (Level 4) | `rgba(0,0,0,0.6) 0px 24px 60px` | Modals, overlays, high-priority popups |

### Border Treatments
- **Standard border**: `1px solid rgba(61,107,153,0.25)` -- muted blue line that defines edges with oceanic calm.
- **Active border**: `1px solid rgba(0,212,170,0.3)` -- cyan-tinted border for featured or active containers.
- **Accent rule**: `2px solid #00d4aa` -- solid cyan line used as a left-border accent on quote blocks and featured items, or as horizontal dividers.
- **Muted border**: `1px solid rgba(61,107,153,0.15)` -- barely visible separator for dense list content.
- **Glow border**: `1px solid rgba(0,212,170,0.3)` combined with `box-shadow: 0 0 12px rgba(0,212,170,0.15)` -- border that emits light.

### Surface Hierarchy
On deep ocean backgrounds, elevation communicates through lightness and blue-shift:
1. **Background** (`#0a1628`) -- the deepest layer, the abyss.
2. **Inset** (`#091320`) -- recessed areas sit darker than the background, like trenches.
3. **Surface** (`#0e1f3a`) -- cards and containers step up by becoming lighter, rising through the water column.
4. **Elevated** (`#132847`) -- the highest non-overlay surface, closest to the light.

Cyan-tinted ambient shadows (`rgba(0,212,170,0.04-0.08)`) simulate bioluminescent light emission. On accent elements, the glow effect (`0 0 20px rgba(0,212,170,0.3)`) makes elements appear to generate their own light rather than merely reflecting it.

## 7. Do's and Don'ts

### Do
- Use cyan-teal (`#00d4aa`) as the bioluminescent accent -- it should feel like it emits light on the dark surface.
- Apply glow effects (`box-shadow: 0 0 20px rgba(0,212,170,0.3)`) on cyan accent elements -- numbers, rules, buttons, and active borders.
- Use subtle gradient backgrounds (`linear-gradient(180deg, #0a1628, #0e1f3a)`) to create depth between sections.
- Use Satoshi at weight 700 for display headings and weight 400 for body -- the weight range creates clear hierarchy.
- Use muted blue (`#3d6b99`) for secondary labels, metadata, and structural borders -- it is the ambient water colour.
- Maintain generous line height (1.65-1.70) for body text -- dark backgrounds demand breathing room.
- Use 8px border-radius on cards and containers -- slightly more rounded than editorial styles, matching the organic underwater feel.
- Use `text-shadow: 0 0 20px rgba(0,212,170,0.3)` on large cyan numbers for the glowing data effect.
- Limit glow effects to 1-2 elements per section -- bioluminescence is rare, which is what makes it striking.
- Use horizontal cyan rules (2px, 60px wide) with glow shadows as section dividers.

### Don't
- Don't use more than 2 accent colours per section -- cyan and muted blue only. No golds, reds, or greens.
- Don't use pure white (`#ffffff`) for text -- always use light blue-gray (`#c8d6e5`) to maintain the underwater tone.
- Don't use pure black (`#000000`) for backgrounds -- always use deep blue-black (`#0a1628`) for chromatic depth.
- Don't overdo glow effects -- more than 2 glowing elements per section breaks the calm, immersive mood.
- Don't use border-radius above 8px -- this style is modern and technical, not bubbly or playful.
- Don't center-align body paragraphs -- only headlines, stats, and CTAs should be centered.
- Don't use hard-edged box shadows without the cyan tint -- all elevation should carry a faint oceanic glow.
- Don't use warm colours (oranges, yellows, reds) -- they break the cool, deep-water palette entirely.
- Don't use Satoshi below weight 400 for body text -- unlike some styles, Deep Ocean doesn't use ultra-light weights.
- Don't place more than 3 stat numbers in a single row -- each glowing number needs space to breathe and emit.
- Don't use decorative icons or emoji -- if a visual marker is needed, use a diamond (&#9670;) or small circle in cyan.

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
- **Typography scale down**: Display Hero becomes 56px (from 72px). Section Heading becomes 40px. Sub-heading stays 32px. Body stays 16px.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Title centered vertically and horizontally. Cyan glowing rule above and below. Subtitle in muted blue.
- **Content slides**: Left-aligned text. One concept per slide. Glowing cyan number (48px Satoshi) at top-left; content below.
- **Stat slides**: Single stat centered. Big number at 56px with cyan glow. Label and description below.
- **Swipe indicator**: Small dots at bottom center, 8px diameter, 12px gap, using `rgba(0,212,170,0.3)` for inactive and `#00d4aa` with glow for active.
- **Background**: Use `linear-gradient(180deg, #0a1628, #0e1f3a)` on all slides for depth.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 72px for the title section.
- **Padding**: 60px left/right. 80px top/bottom margins.
- **Section spacing**: 64px vertical gap between major sections. Cyan glowing rules (60px wide, centered) between sections.
- **Vertical rhythm**: Alternate between full-width sections and 2-column grids. Use numbered items for sequential content, stat displays for key metrics, and quote blocks for testimonials.
- **Background gradient**: Gradual shift from `#0a1628` at the top to `#0e1f3a` at the bottom -- simulating increasing depth.
- **Footer**: Muted blue text, 13px Satoshi, with a final cyan glowing rule above.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 80px. Section Heading becomes 56px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Left-heavy composition. Title and body text occupy the left 60% of the frame. Right 40% is breathing room or supporting content.
- **Title slides**: Headline centered on frame. Cyan glowing rule centered. Subtitle below in ocean gray.
- **Content slides**: 2-column max for comparisons. Single column for narrative. Muted blue borders between columns.
- **Stat slides**: Up to 3 stats in a row, each with glowing cyan numbers, evenly spaced with muted blue borders.

### Poster (1080x1350px)
- **Typography**: Display Hero at 64px. Section Heading at 40px. Body at 16px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for headline. Middle third for key content (stats, list, or comparison). Bottom third for CTA or closing statement.
- **Vertical flow**: Content reads top-to-bottom with clear sections. Cyan glowing rules separate the three zones.
- **CTA placement**: Always in the bottom zone, centered, with generous padding above. Cyan button with glow shadow.
- **Background**: Subtle gradient from lighter navy at top to deeper navy at bottom.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 72px (approximately 30% larger than Carousel 56px). Section Heading becomes 52px. Body Large becomes 22px. Big Numbers for hero stats become 84px with full cyan glow text-shadow.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 960px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. The background gradient runs a longer arc (`linear-gradient(180deg, #0a1628 0%, #0e1f3a 100%)`), so the top of the canvas feels like the surface and the bottom like the abyss -- the viewer descends as they read.
- **Cover slide**: Headline in Satoshi 700 at 72px in luminous gray centered inside the safe zone. A 2px cyan rule 80px wide sits above and below the headline, each with `box-shadow: 0 0 16px rgba(0,212,170,0.35)` so the rules literally glow in the void. Subtitle in ocean gray below. Keep the composition symmetrical -- the stillness is part of the underwater mood.
- **Content slides**: One concept per slide -- a glowing cyan numeral (`01`, `02`) at 84px with `text-shadow: 0 0 24px rgba(0,212,170,0.3)` anchored upper-left inside the safe zone, then a muted-blue uppercase label, then the Satoshi 700 sub-heading, then body in ocean gray. Limit glow to one element per slide so bioluminescence stays rare and striking.
- **CTA slide**: Navy-mid surface card (`#132847`) centered in the middle zone with a 1px cyan-tinted border. Satoshi 700 headline at 56px in luminous gray, short supporting copy, and a cyan (`#00d4aa`) pill button with `box-shadow: 0 0 28px rgba(0,212,170,0.35)` for true light emission.
- **Progress indicator**: Thin segmented rules at the top of the safe zone, 2px tall, styled as dim muted-blue (`rgba(61,107,153,0.25)`) for inactive and glowing cyan (`#00d4aa` with `0 0 12px rgba(0,212,170,0.3)`) for the active segment -- each segment feels like a sonar ping.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Deep Ocean | `#0a1628` | Primary background |
| Luminous Gray | `#c8d6e5` | Primary text |
| Cyan Glow | `#00d4aa` | Accent: numbers, rules, CTAs, glowing focal points |
| Muted Blue | `#3d6b99` | Secondary accent: borders, labels, structural elements |
| Bright Cyan | `#33e8c0` | Hover state text, high-emphasis elements |
| Deep Teal | `#009b7d` | Hover/active state for cyan elements |
| Navy Surface | `#0e1f3a` | Card/container surface |
| Surface Inset | `#091320` | Recessed panels, code blocks |
| Navy Mid | `#132847` | Nested containers, elevated surfaces |
| Dark Slate | `#2a4060` | Disabled text, subtle dividers |
| Ocean Gray | `#5a7a9e` | Tertiary text, descriptions |
| Silver Sea | `#8aa0b8` | De-emphasized captions |

### Font Declarations

```css
font-family: 'Satoshi', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Fontshare Link

```html
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-deep-ocean: #0a1628;
  --color-luminous-gray: #c8d6e5;
  --color-cyan-glow: #00d4aa;

  /* Colors -- Accent */
  --color-muted-blue: #3d6b99;
  --color-bright-cyan: #33e8c0;
  --color-deep-teal: #009b7d;

  /* Colors -- Neutral Scale */
  --color-navy-surface: #0e1f3a;
  --color-navy-mid: #132847;
  --color-dark-slate: #2a4060;
  --color-ocean-gray: #5a7a9e;
  --color-silver-sea: #8aa0b8;

  /* Colors -- Surfaces */
  --color-surface-primary: #0e1f3a;
  --color-surface-inset: #091320;

  /* Colors -- Borders */
  --color-border-default: rgba(61, 107, 153, 0.25);
  --color-border-accent: rgba(0, 212, 170, 0.3);
  --color-border-strong: rgba(200, 214, 229, 0.12);
  --color-border-muted: rgba(61, 107, 153, 0.15);
  --color-divider-rule: #00d4aa;

  /* Colors -- Shadows */
  --shadow-glow: rgba(0, 212, 170, 0.15);
  --shadow-ambient: rgba(0, 212, 170, 0.08);
  --shadow-deep: rgba(0, 0, 0, 0.5);
  --shadow-soft: rgba(0, 0, 0, 0.3);
  --shadow-faint: rgba(0, 212, 170, 0.04);

  /* Typography -- Families */
  --font-display: 'Satoshi', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Satoshi', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 72px;
  --text-section-heading: 48px;
  --text-sub-heading: 32px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number: 64px;
  --text-label: 14px;
  --text-cta: 15px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-body: 400;
  --weight-label: 500;

  /* Typography -- Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.10;
  --leading-sub-heading: 1.15;
  --leading-body-large: 1.65;
  --leading-body: 1.70;
  --leading-small: 1.50;
  --leading-number: 1.00;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-large: 32px;
  --space-section: 48px;
  --space-hero: 60px;
  --space-max: 80px;

  /* Borders */
  --radius-standard: 8px;

  /* Shadows -- Composed */
  --shadow-card: rgba(0,0,0,0.3) 0px 8px 24px, rgba(0,212,170,0.04) 0px 0px 12px;
  --shadow-featured: rgba(0,0,0,0.4) 0px 16px 40px, rgba(0,212,170,0.08) 0px 0px 20px;
  --shadow-glow-accent: 0px 0px 20px rgba(0,212,170,0.3), 0px 0px 40px rgba(0,212,170,0.1);

  /* Gradients */
  --gradient-depth: linear-gradient(180deg, #0a1628, #0e1f3a);
  --gradient-glow: linear-gradient(90deg, rgba(0,212,170,0.04), transparent);
}
```

### System Font Fallbacks
- **Sans-serif (if Satoshi fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
