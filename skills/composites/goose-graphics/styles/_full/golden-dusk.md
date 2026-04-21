# Design Style: Golden Dusk

## 1. Visual Theme & Atmosphere

Golden Dusk is the design language of quiet luxury -- the kind found not in logos or conspicuous branding, but in the weight of the paper, the precision of the typesetting, the way a single gold foil detail on a navy cover signals "this is for people who notice." The dark navy background (`#0f1629`) is not the flat black of a dark mode toggle; it is the deep, inky blue of a midnight sky just after the last light fades, carrying warmth in its depth. Warm white text (`#f5f2ed`) reads against this surface like cream stock embossed onto a leather portfolio -- soft, warm, and deliberately chosen over stark white.

The typographic system uses DM Sans throughout -- a geometric sans-serif from Google Fonts that walks the line between modern and classic. At display sizes (48px+), DM Sans runs at weight 500-600 with generous letter-spacing (+0.5px to +1px), creating headlines that feel spaced and considered, like the masthead of a premium publication. For body text, DM Sans drops to weight 300-400, achieving the light, confident reading style pioneered by Stripe and Apple -- text that whispers rather than shouts, trusting the reader to lean in. The single-family approach keeps the design cohesive and sophisticated; the hierarchy comes from weight, size, and spacing rather than from font contrast.

Gold (`#d4a853`) is the signature accent -- not the bright gold of a trophy, but the aged, muted gold of antique hardware, of a well-worn signet ring, of old-money understatement. It appears in thin linear-gradients on accent bars, in hairline borders (`1px solid rgba(212,168,83,0.3)`), and in small typographic details. Copper (`#b87333`) serves as the secondary accent, providing warmth below gold in the hierarchy -- for secondary borders, metadata labels, and hover states. Together, gold and copper establish a warm metallic vocabulary that feels premium without veering into gaudy territory. The rule is restraint: gold is the spice, not the dish.

**Key Characteristics:**
- Dark navy background (`#0f1629`) -- warm, deep, inky blue with subtle blue undertone
- Warm white (`#f5f2ed`) for all primary text -- softer than pure white, carrying the warmth of cream stock
- Gold (`#d4a853`) as the primary accent -- muted, aged, restrained. Used for accent bars, numbers, and focal points
- Copper (`#b87333`) as secondary accent -- warmer and darker than gold, for borders, labels, and secondary emphasis
- DM Sans throughout: weight 500-600 for display, weight 300-400 for body. Single-family elegance
- Generous letter-spacing at display sizes (+0.5px to +1px) for an open, premium feel
- Hairline borders (`1px solid rgba(212,168,83,0.3)`) -- gold-tinted, barely visible, structurally precise
- Subtle gold linear-gradients on accent elements (bars, rules, button backgrounds)
- Weight 300 for body text -- light, confident, trusting the content to carry itself
- Premium restraint in every choice -- if in doubt, remove rather than add

## 2. Color Palette & Roles

### Primary
- **Deep Navy** (`#0f1629`): Primary background. A warm, inky blue-black that feels richer than pure dark grey.
- **Warm White** (`#f5f2ed`): Primary text colour. Cream-toned white that softens contrast and adds warmth.
- **Gold** (`#d4a853`): Primary accent. Used for accent bars, numbering, CTAs, and focal-point elements. The signature colour.

### Accent
- **Copper** (`#b87333`): Secondary accent for borders, captions, secondary labels, and hover states on gold elements.
- **Light Gold** (`#e8c877`): Tertiary accent for hover states and high-emphasis text. Brighter than gold.
- **Deep Gold** (`#b8923d`): Darker gold for active states on interactive elements.

### Neutral Scale
- **Navy Surface** (`#162040`): Elevated surface -- cards, containers, content panels sitting above the navy background.
- **Navy Light** (`#1c2a50`): Secondary surface for nested containers, input fields, and inset areas.
- **Slate** (`#3d4a6b`): Disabled text, placeholder content, and subtle dividers.
- **Muted Blue** (`#6b7a9e`): Tertiary text for timestamps, metadata, and low-priority labels.
- **Silver Blue** (`#8a96b5`): Used sparingly for de-emphasized captions on dark surfaces.

### Surface & Borders
- **Surface Primary** (`#162040`): Card and container background.
- **Surface Inset** (`#111b33`): Recessed areas, code blocks, and inset panels.
- **Border Default** (`rgba(212,168,83,0.15)`): Whisper-thin gold border for cards and dividers.
- **Border Accent** (`rgba(212,168,83,0.3)`): Gold-tinted border for active or featured elements.
- **Border Strong** (`rgba(245,242,237,0.12)`): Higher-contrast warm white border for prominent containers.
- **Border Copper** (`rgba(184,115,51,0.3)`): Copper-tinted border for secondary emphasis.
- **Divider Rule** (`#d4a853`): Solid gold for horizontal accent rules (typically 1px height).

### Shadow Colors
- **Shadow Gold** (`rgba(212,168,83,0.06)`): Primary shadow -- gold-tinted ambient glow for on-palette elevation.
- **Shadow Deep** (`rgba(0,0,0,0.5)`): Deep shadow for high-elevation elements like modals.
- **Shadow Soft** (`rgba(0,0,0,0.3)`): Standard shadow layer for cards and containers.
- **Shadow Ambient** (`rgba(212,168,83,0.03)`): Subtle gold ambient for barely-there lift.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&display=swap" rel="stylesheet">
```

- **Display**: `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | DM Sans | 72px | 600 | 1.05 | +0.5px | Open, premium feel. Generous tracking |
| Section Heading | DM Sans | 48px | 600 | 1.10 | +0.5px | Major section titles |
| Sub-heading | DM Sans | 32px | 500 | 1.20 | 0px | Subsection titles, card headings |
| Body Large | DM Sans | 20px | 300 | 1.65 | 0px | Lead paragraphs, introductions |
| Body | DM Sans | 16px | 400 | 1.70 | 0.1px | Standard reading text |
| Small / Caption | DM Sans | 13px | 400 | 1.50 | 0.5px | Metadata, attributions, timestamps |
| Big Numbers | DM Sans | 64px | 700 | 1.00 | -0.5px | Statistics, key metrics, hero data |
| Label | DM Sans | 13px | 500 | 1.00 | 2.5px | Uppercase category labels ("01 -- STRATEGY") |
| CTA Text | DM Sans | 15px | 600 | 1.00 | 1.5px | Button and call-to-action text, uppercase |

### Principles
- **Single-family elegance**: DM Sans handles everything from display to body to labels. Hierarchy is established through weight, size, and letter-spacing alone. No serif/sans-serif tension -- the sophistication comes from restraint.
- **Light body, medium display**: Body text at weight 300-400 creates an airy, confident reading experience. Display at 500-600 (not 700-900) keeps headlines refined rather than aggressive.
- **Open tracking at display sizes**: Positive letter-spacing (+0.5px to +1px) for headlines creates the premium, spaced-out feel of luxury brand typesetting. Body text uses minimal tracking.
- **Wide letter-spacing on labels**: Uppercase labels at 2.5px letter-spacing create elegant, widely-set category markers that feel curated and intentional.
- **Generous line height for body**: 1.65-1.70 for body text creates a luxuriously spaced reading rhythm. Dark backgrounds demand generous breathing room.
- **Weight 300 as a statement**: The lightest body weight signals confidence -- the content is strong enough to stand without typographic emphasis.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: #0f1629; padding: 80px 60px; text-align: center;">
  <div style="width: 80px; height: 1px; background: linear-gradient(90deg, transparent, #d4a853, transparent); margin: 0 auto 40px;"></div>
  <h1 style="font-family: 'DM Sans', sans-serif; font-size: 72px; font-weight: 600; line-height: 1.05; letter-spacing: 0.5px; color: #f5f2ed; margin: 0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 20px; font-weight: 300; line-height: 1.65; color: #b87333; max-width: 560px; margin: 0 auto;">How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.</p>
  <div style="width: 80px; height: 1px; background: linear-gradient(90deg, transparent, #d4a853, transparent); margin: 40px auto 0;"></div>
</div>
```

### Numbered Item

```html
<div style="display: flex; gap: 24px; align-items: flex-start; padding: 32px 0; border-bottom: 1px solid rgba(212,168,83,0.15);">
  <span style="font-family: 'DM Sans', sans-serif; font-size: 48px; font-weight: 700; line-height: 1.00; color: #d4a853; min-width: 72px;">01</span>
  <div>
    <p style="font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: #b87333; margin: 0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family: 'DM Sans', sans-serif; font-size: 32px; font-weight: 500; line-height: 1.20; color: #f5f2ed; margin: 0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #6b7a9e; margin: 0;">Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 24px; background: #162040; border: 1px solid rgba(212,168,83,0.15); border-radius: 4px;">
  <p style="font-family: 'DM Sans', sans-serif; font-size: 64px; font-weight: 700; line-height: 1.00; letter-spacing: -0.5px; color: #d4a853; margin: 0 0 8px;">47%</p>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: #f5f2ed; margin: 0 0 12px;">FASTER RESPONSE</p>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #6b7a9e; max-width: 280px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(212,168,83,0.15); border-radius: 4px; overflow: hidden;">
  <div style="background: #162040; padding: 40px 32px;">
    <p style="font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400; letter-spacing: 0.5px; color: #b87333; margin: 0 0 16px;">Without Goose</p>
    <h3 style="font-family: 'DM Sans', sans-serif; font-size: 32px; font-weight: 500; line-height: 1.20; color: #f5f2ed; margin: 0 0 16px;">Manual & Fragmented</h3>
    <p style="font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #6b7a9e; margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
  </div>
  <div style="background: #162040; padding: 40px 32px; border-left: 1px solid rgba(212,168,83,0.3);">
    <p style="font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 400; letter-spacing: 0.5px; color: #d4a853; margin: 0 0 16px;">With Goose</p>
    <h3 style="font-family: 'DM Sans', sans-serif; font-size: 32px; font-weight: 500; line-height: 1.20; color: #f5f2ed; margin: 0 0 16px;">Orchestrated & Autonomous</h3>
    <p style="font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #6b7a9e; margin: 0;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid rgba(212,168,83,0.15);">
  <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(212,168,83,0.3); border-radius: 4px; color: #d4a853; font-size: 18px;">&#9670;</div>
  <div>
    <h4 style="font-family: 'DM Sans', sans-serif; font-size: 22px; font-weight: 500; line-height: 1.25; color: #f5f2ed; margin: 0 0 8px;">Persistent Memory</h4>
    <p style="font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 400; line-height: 1.70; color: #6b7a9e; margin: 0;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 48px 40px; border-left: 1px solid rgba(212,168,83,0.3); background: #111b33;">
  <p style="font-family: 'DM Sans', sans-serif; font-size: 32px; font-weight: 300; font-style: italic; line-height: 1.35; color: #f5f2ed; margin: 0 0 24px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 32px; height: 1px; background: #d4a853;"></div>
    <p style="font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase; color: #b87333; margin: 0;">SARAH CHEN, VP OPERATIONS</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: #162040; border: 1px solid rgba(212,168,83,0.3); border-radius: 4px;">
  <h2 style="font-family: 'DM Sans', sans-serif; font-size: 40px; font-weight: 600; line-height: 1.10; letter-spacing: 0.5px; color: #f5f2ed; margin: 0 0 16px;">Ready to meet your team?</h2>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 300; line-height: 1.65; color: #6b7a9e; max-width: 480px; margin: 0 auto 32px;">Deploy your first AI coworker in under five minutes. No setup fees, no long-term commitments.</p>
  <a style="display: inline-block; background: linear-gradient(135deg, #d4a853, #b87333); color: #0f1629; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; padding: 16px 40px; border-radius: 4px;">Get Started</a>
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
- **Grid**: Use a simple 2-column grid for comparison layouts. Single-column for narrative and list content. 3-column for stat grids on widescreen slides. Grids separated by 1px gold-tinted borders, not gaps.
- **Horizontal rules**: 1px tall, gold linear-gradient (`linear-gradient(90deg, transparent, #d4a853, transparent)`), 80px wide, centered -- used as section dividers with a fading-light quality.
- **Vertical rhythm**: Maintain consistent 48px gaps between top-level sections. Use 24px gaps between items within a section.
- **Content gravity**: On widescreen slides (1920x1080), anchor content to the left two-thirds of the frame. Leave the right third as breathing room or for supporting metrics.
- **Restraint principle**: Every layout decision should feel like a subtraction. If a section can work with fewer elements, remove the extras.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#0f1629` | Page canvas, base layer |
| Subtle (Level 1) | `rgba(0,0,0,0.3) 0px 2px 8px` | Slight lift for list items on hover |
| Card (Level 2) | `rgba(0,0,0,0.4) 0px 8px 24px, rgba(212,168,83,0.03) 0px 0px 12px` | Standard card and container elevation |
| Featured (Level 3) | `rgba(0,0,0,0.5) 0px 16px 40px, rgba(212,168,83,0.06) 0px 0px 20px` | Featured cards, quote blocks, hero elements |
| Overlay (Level 4) | `rgba(0,0,0,0.7) 0px 24px 60px` | Modals, overlays, high-priority popups |

### Border Treatments
- **Standard border**: `1px solid rgba(212,168,83,0.15)` -- barely visible gold-tinted line that defines edges with whisper-thin precision.
- **Active border**: `1px solid rgba(212,168,83,0.3)` -- gold-tinted border for featured or active containers.
- **Copper border**: `1px solid rgba(184,115,51,0.3)` -- copper-tinted border for secondary elements and hover states.
- **Accent rule**: `1px solid #d4a853` -- solid gold line used as horizontal dividers and accent bars.
- **Divider line**: `1px solid rgba(245,242,237,0.06)` -- nearly invisible separator for dense list content.
- **Gradient rule**: `linear-gradient(90deg, transparent, #d4a853, transparent)` -- fading gold rule for section dividers. 1px height.

### Surface Hierarchy
On dark navy backgrounds, elevation is communicated through lightness and warmth:
1. **Background** (`#0f1629`) -- the deepest layer, the canvas.
2. **Inset** (`#111b33`) -- recessed areas sit between background and surface.
3. **Surface** (`#162040`) -- cards and containers step up by becoming slightly lighter.
4. **Elevated** (`#1c2a50`) -- the highest non-overlay surface, used for nested content inside cards.

Gold-tinted ambient shadows (`rgba(212,168,83,0.03-0.06)`) add warmth to elevation and prevent the dark-on-dark layering from feeling cold. The gold influence should be barely perceptible -- like catching the glint of a gold pen on a dark desk.

## 7. Do's and Don'ts

### Do
- Use gold (`#d4a853`) as the spice, not the dish -- accent bars, numbers, CTAs, and single focal points only.
- Use DM Sans at weight 300 for body text -- the lightness signals confidence and luxury.
- Use generous letter-spacing (+0.5px to +1px) on display headings for an open, premium feel.
- Use hairline borders (`1px solid rgba(212,168,83,0.15)`) to define structure without adding visual weight.
- Use subtle gold linear-gradients on accent rules for the signature fading-light effect.
- Maintain generous line height (1.65-1.70) for body text -- luxury design gives words room to breathe.
- Use copper (`#b87333`) for secondary labels, metadata, and secondary borders -- it is gold's quieter companion.
- Limit each slide/section to one focal stat or headline -- restraint is the hallmark of premium design.
- Use the gradient rule (`linear-gradient(90deg, transparent, #d4a853, transparent)`) as the signature section divider.
- Keep CTA buttons understated -- a subtle gradient and moderate padding, never oversized or aggressive.

### Don't
- Don't use gold on large surfaces (backgrounds, full-width bars) -- gold is an accent, not a surface colour.
- Don't use weight 700+ for display headings -- 500-600 is the ceiling. Heavy type breaks the refined feel.
- Don't use pure white (`#ffffff`) for text -- always use warm white (`#f5f2ed`) to preserve the warm tone.
- Don't use pure black (`#000000`) for backgrounds -- always use deep navy (`#0f1629`) for the colour depth.
- Don't use bright or saturated colours alongside gold -- no blues, greens, or oranges. Only gold and copper.
- Don't apply more than one gold gradient per section -- multiple gradients feel garish, not premium.
- Don't use rounded corners above 4px -- this style is precise and architectural, not soft or playful.
- Don't center-align body paragraphs -- only headlines, stats, and CTAs should be centered.
- Don't use thick borders (2px+) -- hairline (1px) borders are the rule. Thickness breaks the delicate feel.
- Don't use decorative icons or emoji -- if a visual marker is needed, use a diamond (&#9670;) or thin line in gold.
- Don't overuse uppercase -- reserve it for labels (13px) and CTA buttons only. Headlines are always mixed case.

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
- **Cover slide**: Title centered vertically and horizontally. Gold gradient rule above and below (80px wide). Subtitle in copper.
- **Content slides**: Left-aligned text. One concept per slide. Gold number (48px DM Sans, weight 700) at top-left; content below.
- **Stat slides**: Single stat centered. Big number at 56px in gold. Label and description below.
- **Swipe indicator**: Small gold dots at bottom center, 6px diameter, 12px gap, using `rgba(212,168,83,0.5)` for inactive and `#d4a853` for active.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 72px for the title section.
- **Padding**: 60px left/right. 80px top/bottom margins.
- **Section spacing**: 64px vertical gap between major sections. Gold gradient rules (80px wide, centered) between sections.
- **Vertical rhythm**: Alternate between full-width sections and 2-column grids. Use numbered items for sequential content, stat displays for key metrics, and quote blocks for testimonials.
- **Footer**: Copper text, 13px DM Sans weight 400, with a final gold gradient rule above.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 80px. Section Heading becomes 56px. Body Large becomes 22px.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Left-heavy composition. Title and body text occupy the left 60% of the frame. Right 40% is breathing room or supporting content.
- **Title slides**: Headline centered on frame. Gold gradient rule centered. Subtitle in copper below.
- **Content slides**: 2-column max for comparisons. Single column for narrative.
- **Stat slides**: Up to 3 stats in a row, each in its own gold-bordered panel with generous internal padding.

### Poster (1080x1350px)
- **Typography**: Display Hero at 64px. Section Heading at 40px. Body at 16px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for headline. Middle third for key content (stats, list, or comparison). Bottom third for CTA or closing statement.
- **Vertical flow**: Content reads top-to-bottom with clear sections. Gold gradient rules separate the three zones.
- **CTA placement**: Always in the bottom zone, centered, with generous padding above. Gold-to-copper gradient button.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 72px in DM Sans 600 with +0.75px letter-spacing (approximately 30% larger than Carousel 56px). Section Heading becomes 52px. Body Large becomes 22px at weight 300 for the signature whisper-style reading voice. Numbering labels stay at 14px with wide tracking in gold.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 920px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Deep navy background (`#0f1629`) runs edge-to-edge with optional subtle gradient to `#132036` for extra warmth.
- **Cover slide**: Thin gold (`#d4a853`) linear-gradient accent bar 2px tall, 80px wide centered above the headline. DM Sans 600 headline at 72px in warm white with generous +0.75px letter-spacing, carefully kerned. Subtitle below in warm white at 22px weight 300. A second gold bar below the subtitle closes the composition. Everything quiet, considered, expensive -- like the masthead of a private members' publication.
- **Content slides**: One idea per slide. Copper (`#b87333`) uppercase label at 14px with 2px tracking anchors the top of the content block, followed by a DM Sans 600 sub-heading at 52px in warm white, then weight-300 body copy in cream. A hairline gold-tinted divider (`1px solid rgba(212,168,83,0.3)`) separates heading from body. Restraint is the feature -- never fill the frame.
- **CTA slide**: Warm white headline at 56px centered in the middle zone. Short body in weight 300. Gold-to-copper linear-gradient button (pill radius, 8px) with navy text in DM Sans 600. Final hairline gold divider below the CTA as a visual sign-off.
- **Progress indicator**: Whisper-thin gold segments 1.5px tall at the top of the safe zone -- inactive segments at `rgba(212,168,83,0.25)`, active at full gold. No glow, no animation -- just precise hardware-like marks, in keeping with the aged-metal vocabulary.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Deep Navy | `#0f1629` | Primary background |
| Warm White | `#f5f2ed` | Primary text |
| Gold | `#d4a853` | Accent: numbers, rules, CTAs, focal points |
| Copper | `#b87333` | Secondary accent: borders, captions, labels |
| Light Gold | `#e8c877` | Hover state text, high-emphasis elements |
| Deep Gold | `#b8923d` | Hover/active state for gold elements |
| Navy Surface | `#162040` | Card/container surface |
| Surface Inset | `#111b33` | Recessed panels, code blocks |
| Navy Light | `#1c2a50` | Nested containers, elevated surfaces |
| Slate | `#3d4a6b` | Disabled text, subtle dividers |
| Muted Blue | `#6b7a9e` | Tertiary text, descriptions |
| Silver Blue | `#8a96b5` | De-emphasized captions |

### Font Declarations

```css
font-family: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-deep-navy: #0f1629;
  --color-warm-white: #f5f2ed;
  --color-gold: #d4a853;

  /* Colors -- Accent */
  --color-copper: #b87333;
  --color-light-gold: #e8c877;
  --color-deep-gold: #b8923d;

  /* Colors -- Neutral Scale */
  --color-navy-surface: #162040;
  --color-navy-light: #1c2a50;
  --color-slate: #3d4a6b;
  --color-muted-blue: #6b7a9e;
  --color-silver-blue: #8a96b5;

  /* Colors -- Surfaces */
  --color-surface-primary: #162040;
  --color-surface-inset: #111b33;

  /* Colors -- Borders */
  --color-border-default: rgba(212, 168, 83, 0.15);
  --color-border-accent: rgba(212, 168, 83, 0.3);
  --color-border-strong: rgba(245, 242, 237, 0.12);
  --color-border-copper: rgba(184, 115, 51, 0.3);
  --color-divider-rule: #d4a853;

  /* Colors -- Shadows */
  --shadow-gold: rgba(212, 168, 83, 0.06);
  --shadow-deep: rgba(0, 0, 0, 0.5);
  --shadow-soft: rgba(0, 0, 0, 0.3);
  --shadow-ambient: rgba(212, 168, 83, 0.03);

  /* Typography -- Families */
  --font-display: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 72px;
  --text-section-heading: 48px;
  --text-sub-heading: 32px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number: 64px;
  --text-label: 13px;
  --text-cta: 15px;

  /* Typography -- Weights */
  --weight-display: 600;
  --weight-display-medium: 500;
  --weight-display-heavy: 700;
  --weight-body-light: 300;
  --weight-body: 400;
  --weight-label: 500;

  /* Typography -- Line Heights */
  --leading-display: 1.05;
  --leading-heading: 1.10;
  --leading-sub-heading: 1.20;
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
  --radius-standard: 4px;

  /* Shadows -- Composed */
  --shadow-card: rgba(0,0,0,0.4) 0px 8px 24px, rgba(212,168,83,0.03) 0px 0px 12px;
  --shadow-featured: rgba(0,0,0,0.5) 0px 16px 40px, rgba(212,168,83,0.06) 0px 0px 20px;

  /* Gradients */
  --gradient-gold: linear-gradient(135deg, #d4a853, #b87333);
  --gradient-rule: linear-gradient(90deg, transparent, #d4a853, transparent);
}
```

### System Font Fallbacks
- **Sans-serif (if DM Sans fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
