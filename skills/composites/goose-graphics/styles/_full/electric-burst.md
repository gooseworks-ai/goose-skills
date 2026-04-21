# Design Style: Electric Burst

## 1. Visual Theme & Atmosphere

Electric Burst is the design language of maximum impact -- the visual equivalent of a stadium floodlight cutting through darkness, of a neon sign on a rain-slicked street, of a festival lineup poster that stops you mid-scroll. The near-black canvas (`#0a0a0a`) is not understated; it is a stage designed to make everything on it scream. Where other dark styles use darkness for sophistication, Electric Burst uses it as a launchpad for visual volume. This is not calm. This is not quiet. This is the design language of bold claims, oversized numbers, and unapologetic confidence.

The typographic pairing of Archivo Black and Inter creates a deliberate collision of energies. Archivo Black -- a heavy, slightly condensed display face with nearly uniform stroke width -- delivers headlines that hit like a wall of sound. Its dense, block-like letterforms at display sizes (64px+) are designed to be read from a distance, to be felt before they are parsed. This is type as physical presence. Against this brutalist display face, Inter provides clean, neutral body text that never competes with the headlines. The contrast is extreme by design: Archivo Black is all personality, all weight, all impact; Inter is all clarity, all function, all readability. The display type makes the claim; the body type delivers the evidence.

Neon yellow (`#e6ff00`) is the accent that electrifies this system. It is not a friendly yellow or a warm gold -- it is a fluorescent, almost phosphorescent hue that reads as energy, urgency, and technological edge. On the black background, it glows with the intensity of a highlighter under UV light. Hot pink (`#ff2d6f`) serves as the secondary accent, adding a second voltage to the palette -- the colour of laser beams, of concert wristbands, of urgent notifications. Together, neon yellow and hot pink create a palette that is deliberately confrontational: these are not colours that politely request attention; they seize it. The glow effect -- achieved through layered `text-shadow` and `box-shadow` using the accent colours -- is the signature technique of this style, giving key elements an actual luminous quality that no flat colour alone can deliver.

**Key Characteristics:**
- Near-black background (`#0a0a0a`) as the dominant surface -- darkness as amplifier, not atmosphere
- Pure white (`#ffffff`) for all primary text -- maximum contrast, no compromise
- Archivo Black for all display type -- heavy, condensed, oversized, felt before read
- Inter for all body text -- clean, neutral counterpoint to the heavy display face
- Neon yellow (`#e6ff00`) as the primary accent for numbers, CTAs, highlights, and glow effects
- Hot pink (`#ff2d6f`) as the secondary accent for supporting emphasis, tags, and secondary focal points
- Glow effects via `text-shadow` and `box-shadow` using accent colours at low opacity -- elements that literally luminescence
- Oversized numbers (200px+ for hero stats) -- data as visual spectacle
- Maximum contrast everywhere -- this style has no quiet mode

## 2. Color Palette & Roles

### Primary
- **Void** (`#0a0a0a`): Primary background. Near-black with a neutral undertone -- the darkest viable canvas.
- **White** (`#ffffff`): Primary text colour. Pure white for maximum contrast against the void.
- **Neon Yellow** (`#e6ff00`): Primary accent. Used for hero numbers, CTA buttons, glow effects, and primary focal points. The signature colour.

### Accent
- **Hot Pink** (`#ff2d6f`): Secondary accent for tags, secondary highlights, alternate CTAs, and supporting focal points.
- **Dark Yellow** (`#b8cc00`): Muted neon for hover/active states on yellow elements and secondary labels.
- **Dark Pink** (`#cc2459`): Darker pink for hover/active states on pink interactive elements.
- **Yellow Glow** (`rgba(230,255,0,0.15)`): Low-opacity neon for glow halos and ambient light effects.
- **Pink Glow** (`rgba(255,45,111,0.15)`): Low-opacity pink for secondary glow effects.

### Neutral Scale
- **Dark Surface** (`#141414`): Elevated surface -- cards, containers, and content panels sitting above the void.
- **Charcoal** (`#1e1e1e`): Secondary surface for nested containers, input fields, and inset areas.
- **Graphite** (`#2a2a2a`): Tertiary surface for deeply nested content.
- **Steel** (`#555555`): Disabled text, placeholder content, and subtle dividers.
- **Ash** (`#888888`): Tertiary text for timestamps, metadata, and low-priority labels.
- **Silver** (`#aaaaaa`): Secondary body text and descriptions.

### Surface & Borders
- **Surface Primary** (`#141414`): Card and container background.
- **Surface Inset** (`#111111`): Recessed areas, code blocks, and inset panels.
- **Border Default** (`rgba(255,255,255,0.1)`): Standard whisper-thin border for cards and dividers.
- **Border Accent Yellow** (`rgba(230,255,0,0.3)`): Neon yellow border for active or featured elements.
- **Border Accent Pink** (`rgba(255,45,111,0.3)`): Hot pink border for secondary featured elements.
- **Border Strong** (`rgba(255,255,255,0.2)`): Higher-contrast border for prominent containers.
- **Divider Rule** (`#e6ff00`): Solid neon yellow for horizontal accent rules (typically 3px height).

### Shadow Colors
- **Shadow Neon** (`rgba(230,255,0,0.12)`): Primary glow shadow -- neon-tinted ambient for on-palette luminescence.
- **Shadow Pink** (`rgba(255,45,111,0.12)`): Secondary glow shadow for pink-accented elements.
- **Shadow Deep** (`rgba(0,0,0,0.6)`): Deep shadow for high-elevation elements.
- **Shadow Soft** (`rgba(0,0,0,0.3)`): Standard shadow layer for cards and containers.
- **Shadow Ambient** (`rgba(230,255,0,0.06)`): Subtle neon ambient for barely-there glow.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'Archivo Black', Impact, 'Arial Black', sans-serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Archivo Black | 80px | 400 | 1.00 | -1px | Cover headlines, maximum visual impact (Archivo Black has one weight) |
| Section Heading | Archivo Black | 56px | 400 | 1.05 | -0.5px | Major section titles |
| Sub-heading | Archivo Black | 36px | 400 | 1.10 | 0px | Subsection titles, card headings |
| Body Large | Inter | 20px | 400 | 1.60 | 0px | Lead paragraphs, introductions |
| Body | Inter | 16px | 400 | 1.65 | 0px | Standard reading text |
| Small / Caption | Inter | 13px | 500 | 1.50 | 0.5px | Metadata, attributions, timestamps |
| Big Numbers | Archivo Black | 200px | 400 | 0.85 | -4px | Oversized statistics, hero data -- the spectacle numbers |
| Numbered Label | Inter | 14px | 700 | 1.00 | 3px | Uppercase step labels ("01 -- ATTACK") |
| CTA Text | Inter | 16px | 700 | 1.00 | 1.5px | Button and call-to-action text, uppercase |

### Principles
- **Extreme weight contrast**: Archivo Black (the heaviest available weight, rendered at its native 400 which is already ultra-bold) owns the headlines. Inter at 400 provides a stark contrast. The collision between the two is the energy source of this style.
- **Oversized is the default**: Hero numbers at 200px. Display headlines at 80px. This style operates at sizes that other styles would consider absurd. Scale is the message.
- **Tight line height for display**: 1.00 or less for display type and big numbers. Headlines should feel stacked and compressed, like lines on a concert poster.
- **Wide tracking on labels**: Numbered labels and CTA text use 1.5px-3px tracking with uppercase -- this creates the contrast between the dense display type and the spaced-out functional type.
- **Body text is functional**: Inter at 400 weight, standard tracking, comfortable line height (1.65). Body text's job is to be read quickly, not to be noticed. All personality lives in the display type.
- **Archivo Black has one weight**: Unlike variable-weight fonts, Archivo Black comes in a single weight. Size and colour are the only tools for display hierarchy.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: var(--color-void); padding: 80px 60px; text-align: center;">
  <p style="font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--color-neon-yellow); margin: 0 0 24px;">THE FUTURE OF WORK</p>
  <h1 style="font-family: var(--font-display); font-size: 80px; font-weight: 400; line-height: 1.00; letter-spacing: -1px; color: var(--color-white); text-transform: uppercase; margin: 0 0 24px; text-shadow: 0 0 40px rgba(230,255,0,0.15);">AUTONOMOUS<br>TEAMS</h1>
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 400; line-height: 1.60; color: var(--color-silver); max-width: 600px; margin: 0 auto;">How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.</p>
  <div style="width: 80px; height: 3px; background: var(--color-neon-yellow); margin: 40px auto 0; box-shadow: 0 0 12px rgba(230,255,0,0.4);"></div>
</div>
```

### Numbered Item

```html
<div style="display: flex; gap: 24px; align-items: flex-start; padding: 32px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
  <span style="font-family: var(--font-display); font-size: 56px; font-weight: 400; line-height: 1.00; color: var(--color-neon-yellow); min-width: 80px; text-shadow: 0 0 20px rgba(230,255,0,0.3);">01</span>
  <div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--color-hot-pink); margin: 0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family: var(--font-display); font-size: 36px; font-weight: 400; line-height: 1.10; color: var(--color-white); margin: 0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-silver); margin: 0;">Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 48px 24px; background: var(--color-dark-surface); border: 1px solid rgba(230,255,0,0.3); border-radius: 4px; box-shadow: 0 0 30px rgba(230,255,0,0.08);">
  <p style="font-family: var(--font-display); font-size: 200px; font-weight: 400; line-height: 0.85; letter-spacing: -4px; color: var(--color-neon-yellow); margin: 0 0 16px; text-shadow: 0 0 60px rgba(230,255,0,0.3), 0 0 120px rgba(230,255,0,0.1);">47</p>
  <p style="font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--color-white); margin: 0 0 12px;">PERCENT FASTER</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-silver); max-width: 320px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
  <div style="background: var(--color-dark-surface); padding: 40px 32px;">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 500; letter-spacing: 0.5px; color: var(--color-ash); margin: 0 0 16px;">Without Goose</p>
    <h3 style="font-family: var(--font-display); font-size: 36px; font-weight: 400; line-height: 1.10; color: var(--color-white); margin: 0 0 16px;">Manual & Fragmented</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-silver); margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
  </div>
  <div style="background: var(--color-dark-surface); padding: 40px 32px; border-left: 3px solid var(--color-neon-yellow); box-shadow: inset 20px 0 40px rgba(230,255,0,0.05);">
    <p style="font-family: var(--font-body); font-size: 13px; font-weight: 500; letter-spacing: 0.5px; color: var(--color-neon-yellow); margin: 0 0 16px;">With Goose</p>
    <h3 style="font-family: var(--font-display); font-size: 36px; font-weight: 400; line-height: 1.10; color: var(--color-white); margin: 0 0 16px;">Orchestrated & Autonomous</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-silver); margin: 0;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
  <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,45,111,0.3); border-radius: 4px; color: var(--color-hot-pink); font-size: 18px; box-shadow: 0 0 12px rgba(255,45,111,0.1);">&#9650;</div>
  <div>
    <h4 style="font-family: var(--font-display); font-size: 24px; font-weight: 400; line-height: 1.15; color: var(--color-white); margin: 0 0 8px;">Persistent Memory</h4>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-silver); margin: 0;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 48px 40px; border-left: 3px solid var(--color-hot-pink); background: var(--color-surface-inset); box-shadow: inset 20px 0 40px rgba(255,45,111,0.05);">
  <p style="font-family: var(--font-display); font-size: 36px; font-weight: 400; line-height: 1.15; color: var(--color-white); margin: 0 0 24px;">"IT FELT LESS LIKE CONFIGURING SOFTWARE AND MORE LIKE ONBOARDING A NEW TEAM MEMBER."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 32px; height: 3px; background: var(--color-hot-pink); box-shadow: 0 0 8px rgba(255,45,111,0.4);"></div>
    <p style="font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--color-ash); margin: 0;">SARAH CHEN, VP OPERATIONS</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: var(--color-dark-surface); border: 1px solid rgba(230,255,0,0.3); border-radius: 4px; box-shadow: 0 0 40px rgba(230,255,0,0.08);">
  <h2 style="font-family: var(--font-display); font-size: 48px; font-weight: 400; line-height: 1.05; color: var(--color-white); text-transform: uppercase; margin: 0 0 16px;">Ready to meet<br>your team?</h2>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.60; color: var(--color-silver); max-width: 480px; margin: 0 auto 32px;">Deploy your first AI coworker in under five minutes. No setup fees, no long-term commitments.</p>
  <a style="display: inline-block; background: var(--color-neon-yellow); color: var(--color-void); font-family: var(--font-body); font-size: 16px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; padding: 18px 48px; border-radius: 4px; box-shadow: 0 0 20px rgba(230,255,0,0.3), 0 0 60px rgba(230,255,0,0.1);">Get Started</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between icon and inline label.
- **8px**: Tight gap -- between sub-label and heading, between stat number and label.
- **16px**: Small-base gap -- between heading and body text, between body paragraphs.
- **24px**: Medium gap -- between components within a section, standard list item padding.
- **32px**: Section internal -- padding inside cards and containers, gap between grouped items.
- **48px**: Section divider -- vertical space between major content blocks.
- **60px**: Large section padding -- top/bottom padding for hero and CTA blocks.
- **80px**: Maximum section padding -- cover slides and high-impact hero areas.
- **120px**: Oversized spacing -- used above and below hero stat numbers to give them stage presence.

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
- **Accent rules**: 3px tall, neon yellow (`#e6ff00`), 80px wide, with a glow shadow (`box-shadow: 0 0 12px rgba(230,255,0,0.4)`) -- used as section dividers and energy accents.
- **Vertical rhythm**: Maintain consistent 48px gaps between top-level sections. Use 24px gaps between items within a section.
- **Content gravity**: On widescreen slides (1920x1080), oversized numbers or headlines can bleed into the full width. Body text anchors to the left 60%.
- **Visual impact zones**: Each slide or section should have one dominant element (a massive number, a glowing headline, a neon CTA) that occupies disproportionate visual weight. Everything else supports it.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#0a0a0a` | Page canvas, base layer |
| Subtle (Level 1) | `rgba(0,0,0,0.3) 0px 2px 8px` | Slight lift for list items on hover |
| Card (Level 2) | `rgba(0,0,0,0.4) 0px 8px 24px, rgba(230,255,0,0.04) 0px 0px 16px` | Standard card and container elevation |
| Glow (Level 3) | `rgba(0,0,0,0.5) 0px 16px 40px, rgba(230,255,0,0.08) 0px 0px 30px` | Featured cards, stat displays, hero elements |
| Overlay (Level 4) | `rgba(0,0,0,0.7) 0px 24px 60px, rgba(230,255,0,0.12) 0px 0px 40px` | Modals, overlays, high-priority popups |

### Border Treatments
- **Standard border**: `1px solid rgba(255,255,255,0.1)` -- barely visible white line that defines edges in the darkness.
- **Neon border**: `1px solid rgba(230,255,0,0.3)` -- yellow-tinted border for featured or active containers, paired with a glow shadow.
- **Pink border**: `1px solid rgba(255,45,111,0.3)` -- pink-tinted border for secondary featured elements.
- **Accent rule**: `3px solid #e6ff00` with `box-shadow: 0 0 12px rgba(230,255,0,0.4)` -- glowing neon line used as horizontal dividers and left-border accents.
- **Divider line**: `1px solid rgba(255,255,255,0.06)` -- nearly invisible separator for dense list content.

### Surface Hierarchy
On near-black backgrounds, elevation is communicated through lightness and glow:
1. **Void** (`#0a0a0a`) -- the darkest layer, the stage.
2. **Surface** (`#141414`) -- cards and containers step up by becoming slightly lighter.
3. **Inset** (`#111111`) -- recessed areas sit between void and surface.
4. **Elevated** (`#1e1e1e`) -- the highest non-overlay surface for nested content.

Neon glow shadows (`rgba(230,255,0,0.04-0.12)`) add luminescent energy to elevation. Featured elements should feel like they are emitting light, not just reflecting it. The glow effect is the primary depth differentiator -- a card with a neon glow reads as more important than a card with only a dark shadow.

### Glow Technique Reference
- **Text glow**: `text-shadow: 0 0 20px rgba(230,255,0,0.3), 0 0 60px rgba(230,255,0,0.1)` -- for neon-coloured text.
- **Box glow**: `box-shadow: 0 0 20px rgba(230,255,0,0.3), 0 0 60px rgba(230,255,0,0.1)` -- for CTA buttons and featured containers.
- **Inset glow**: `box-shadow: inset 20px 0 40px rgba(230,255,0,0.05)` -- for the "preferred" side of comparison panels.
- **Rule glow**: `box-shadow: 0 0 12px rgba(230,255,0,0.4)` -- for accent rules and dividers.

## 7. Do's and Don'ts

### Do
- Use neon yellow (`#e6ff00`) as the primary accent and hot pink (`#ff2d6f`) as the secondary -- they are the dual-voltage energy source of this style.
- Use Archivo Black only for display text (36px and above) and oversized numbers -- it has one weight and exists for impact.
- Keep body text in Inter at weight 400-500 -- clean and functional, letting the display type carry the personality.
- Use glow effects (`text-shadow` and `box-shadow` with accent colours) on focal elements -- glowing neon is the visual signature.
- Make stat numbers absurdly large (200px for hero stats, 120px for supporting stats) -- this style treats data as visual spectacle.
- Use uppercase for Archivo Black headlines and labels -- the condensed letterforms are designed for all-caps impact.
- Add `text-shadow` to neon-coloured text to create the luminescence effect -- flat neon text loses the electric feel.
- Use 3px accent rules with glow shadows as section dividers.
- Keep border-radius at 4px or 0px -- this is a sharp, angular style.

### Don't
- Don't use Archivo Black for body text or small sizes -- it is illegible below 24px and was never designed for reading.
- Don't use more than 2 accent colours per slide -- neon yellow and hot pink only. No blues, greens, or oranges.
- Don't skip the glow effect on accent-coloured elements -- without the glow, neon colours look flat and lose their electric character.
- Don't use pure white (`#ffffff`) for backgrounds -- always use `#0a0a0a` or darker surfaces.
- Don't use light or pastel colours anywhere -- every colour in this system is either near-black, pure white, or high-saturation neon.
- Don't use rounded corners above 4px -- this style is sharp and aggressive, not soft or friendly.
- Don't center-align body paragraphs -- only headlines, stats, and CTAs should be centered.
- Don't use subtle or muted accents -- if something gets an accent colour, it should be at full intensity with a glow.
- Don't place more than 2 oversized stat numbers on a single slide -- each number needs space to radiate.
- Don't use thin font weights (300 or below) for Inter body text -- the dark background demands at least 400 weight for readability.

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
- **Typography scale down**: Display Hero becomes 64px (from 80px). Section Heading becomes 48px. Sub-heading stays 36px. Body stays 16px.
- **Big Numbers**: Scale down from 200px to 120px for carousel format -- still oversized, but contained.
- **Padding**: 60px on all sides. Content area is 960x960px.
- **Cover slide**: Title centered in uppercase Archivo Black. Neon yellow label above. Glowing accent rule below. Subtitle in silver.
- **Content slides**: Left-aligned text. One concept per slide. Number in neon yellow (56px) at top-left with glow; content below.
- **Stat slides**: Single stat centered. Oversized number at 120px in neon yellow with glow. Label and description below.
- **Swipe indicator**: Small neon yellow dots at bottom center, 8px diameter, 12px gap. Active dot with glow effect.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 80px for the title section. Big Numbers at 200px for hero stats.
- **Padding**: 60px left/right. 80px top/bottom margins.
- **Section spacing**: 64px vertical gap between major sections. Glowing neon rules (80px wide, centered) between sections.
- **Vertical rhythm**: Alternate between full-width sections and 2-column grids. Use numbered items for sequential content, oversized stat displays for key metrics, and quote blocks for testimonials.
- **Footer**: Ash gray text, 13px Inter, with a final glowing neon rule above.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 96px. Section Heading becomes 64px. Body Large becomes 22px.
- **Big Numbers**: Full 200px+ on widescreen slides. Numbers can span the full width as a background element.
- **Padding**: 80px on all sides. Content area is 1760x920px.
- **Layout**: Oversized numbers and headlines can command the full frame. Body text anchors to the lower-left or right third.
- **Title slides**: Headline in uppercase, centered, with neon glow. Label above in hot pink.
- **Content slides**: 2-column max for comparisons. Single column for narrative.
- **Stat slides**: Single oversized number centered with full glow treatment. Supporting text below.

### Poster (1080x1350px)
- **Typography**: Display Hero at 72px. Section Heading at 48px. Body at 16px. Big Numbers at 160px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for headline in uppercase with glow. Middle third for key content (oversized stat, list, or comparison). Bottom third for CTA with glowing button.
- **Vertical flow**: Content reads top-to-bottom with high contrast between zones. Glowing neon rules separate the three sections.
- **CTA placement**: Always in the bottom zone, centered, with generous padding above. Neon yellow button with full glow effect.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 84px in Archivo Black (approximately 30% larger than Carousel 64px). Section Heading becomes 60px. Body Large becomes 22px in Inter. Big Numbers for hero stats blow up to 240px -- data as visual spectacle, maximised for the tall frame.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 960px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. The near-black (`#0a0a0a`) void runs edge-to-edge so neon accents feel even more radioactive in the tall format.
- **Cover slide**: Archivo Black uppercase headline at 84px in white, tight letter-spacing, stacked in 2-3 lines filling the middle of the safe zone. One key word highlighted in neon yellow (`#e6ff00`) with heavy `text-shadow: 0 0 32px rgba(230,255,0,0.5), 0 0 64px rgba(230,255,0,0.25)` so it genuinely glows against the void. Optional hot pink (`#ff2d6f`) tag above the headline.
- **Content slides**: One oversized stat per slide -- the number pushed to 240px in neon yellow with full glow, filling half the vertical safe zone. Short Inter label in uppercase tracked pink or white below. Body copy in Inter 400 at 22px. Glow effects limited to the single hero number per slide so the impact doesn't dilute.
- **CTA slide**: Full-frame black void with an Archivo Black headline at 64px centered in the middle zone. Neon yellow button with pill radius, black Inter text, and `box-shadow: 0 0 40px rgba(230,255,0,0.45)` so the button reads as a light source. Optional hot pink secondary text below.
- **Progress indicator**: Thin segmented bars at the top inside the safe zone, 3px tall, neon yellow for the active segment with glow shadow, `rgba(255,255,255,0.2)` for inactive. The active segment should look electrified -- this style doesn't do subtle.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Void | `#0a0a0a` | Primary background |
| White | `#ffffff` | Primary text |
| Neon Yellow | `#e6ff00` | Primary accent: numbers, CTAs, glows, focal points |
| Hot Pink | `#ff2d6f` | Secondary accent: tags, labels, secondary highlights |
| Dark Yellow | `#b8cc00` | Hover/active for neon elements, secondary labels |
| Dark Pink | `#cc2459` | Hover/active for pink elements |
| Dark Surface | `#141414` | Card/container surface |
| Surface Inset | `#111111` | Recessed panels, code blocks |
| Charcoal | `#1e1e1e` | Nested containers, elevated surfaces |
| Graphite | `#2a2a2a` | Tertiary surfaces |
| Steel | `#555555` | Disabled text, subtle dividers |
| Ash | `#888888` | Tertiary text, timestamps |
| Silver | `#aaaaaa` | Secondary text, descriptions |

### Font Declarations

```css
font-family: 'Archivo Black', Impact, 'Arial Black', sans-serif;
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-void: #0a0a0a;
  --color-white: #ffffff;
  --color-neon-yellow: #e6ff00;

  /* Colors -- Accent */
  --color-hot-pink: #ff2d6f;
  --color-dark-yellow: #b8cc00;
  --color-dark-pink: #cc2459;
  --color-yellow-glow: rgba(230, 255, 0, 0.15);
  --color-pink-glow: rgba(255, 45, 111, 0.15);

  /* Colors -- Neutral Scale */
  --color-dark-surface: #141414;
  --color-charcoal: #1e1e1e;
  --color-graphite: #2a2a2a;
  --color-steel: #555555;
  --color-ash: #888888;
  --color-silver: #aaaaaa;

  /* Colors -- Surfaces */
  --color-surface-primary: #141414;
  --color-surface-inset: #111111;

  /* Colors -- Borders */
  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-neon: rgba(230, 255, 0, 0.3);
  --color-border-pink: rgba(255, 45, 111, 0.3);
  --color-border-strong: rgba(255, 255, 255, 0.2);
  --color-divider-rule: #e6ff00;

  /* Colors -- Shadows */
  --shadow-neon: rgba(230, 255, 0, 0.12);
  --shadow-pink: rgba(255, 45, 111, 0.12);
  --shadow-deep: rgba(0, 0, 0, 0.6);
  --shadow-soft: rgba(0, 0, 0, 0.3);
  --shadow-ambient: rgba(230, 255, 0, 0.06);

  /* Typography -- Families */
  --font-display: 'Archivo Black', Impact, 'Arial Black', sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 80px;
  --text-section-heading: 56px;
  --text-sub-heading: 36px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number: 200px;
  --text-label: 14px;
  --text-cta: 16px;

  /* Typography -- Weights */
  --weight-display: 400;
  --weight-body: 400;
  --weight-body-medium: 500;
  --weight-label: 700;
  --weight-cta: 700;

  /* Typography -- Line Heights */
  --leading-display: 1.00;
  --leading-heading: 1.05;
  --leading-sub-heading: 1.10;
  --leading-body-large: 1.60;
  --leading-body: 1.65;
  --leading-small: 1.50;
  --leading-number: 0.85;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-large: 32px;
  --space-section: 48px;
  --space-hero: 60px;
  --space-max: 80px;
  --space-spectacle: 120px;

  /* Borders */
  --radius-standard: 4px;

  /* Shadows -- Composed */
  --shadow-card: rgba(0,0,0,0.4) 0px 8px 24px, rgba(230,255,0,0.04) 0px 0px 16px;
  --shadow-glow: rgba(0,0,0,0.5) 0px 16px 40px, rgba(230,255,0,0.08) 0px 0px 30px;
  --shadow-neon-glow: 0 0 20px rgba(230,255,0,0.3), 0 0 60px rgba(230,255,0,0.1);
  --shadow-pink-glow: 0 0 20px rgba(255,45,111,0.3), 0 0 60px rgba(255,45,111,0.1);
  --shadow-rule-glow: 0 0 12px rgba(230,255,0,0.4);

  /* Glow -- Text Shadows */
  --glow-text-neon: 0 0 20px rgba(230,255,0,0.3), 0 0 60px rgba(230,255,0,0.1);
  --glow-text-pink: 0 0 20px rgba(255,45,111,0.3), 0 0 60px rgba(255,45,111,0.1);
  --glow-text-hero: 0 0 40px rgba(230,255,0,0.15);
}
```

### System Font Fallbacks
- **Display (if Archivo Black fails to load):** `Impact, 'Arial Black', sans-serif`
- **Body (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
