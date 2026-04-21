# Design Style: Terminal

## 1. Visual Theme & Atmosphere

Terminal is the visual language of the command line made tangible -- the aesthetic of a developer who lives in the terminal, who finds beauty in monospaced type, blinking cursors, and the soft glow of phosphor green on a dark screen. The dark charcoal background (`#1a1a2e`) is not just dark mode; it is the colour of a terminal emulator at 2am, slightly blue-shifted from pure black, carrying the subtle warmth of a CRT display. Every element on this canvas is informed by the grammar of command-line interfaces: monospaced type, grid-aligned layouts, uppercase labels with wide letter-spacing, and the disciplined economy of a system that wastes nothing.

JetBrains Mono is the sole typeface, used for everything -- headers, body text, labels, statistics, buttons. There is no typographic contrast between serif and sans-serif here; hierarchy is established purely through size, weight, and colour. This is a deliberate constraint that reinforces the terminal metaphor: in a CLI, everything is monospaced, and that uniformity is the source of its visual integrity. At large display sizes (48px+), JetBrains Mono has a distinctive character -- its generous x-height and distinctive letterforms (the slashed zero, the curved lowercase `l`) make it surprisingly effective for headlines. Uppercase labels with 2-4px letter-spacing evoke the cadence of system status messages and log output.

Matrix green (`#00ff41`) is the primary text and accent colour -- the unmistakable hue of green-screen terminals and Hollywood hacker sequences. It is used for primary text, active states, key metrics, and any element that should feel "live" or "active." Amber (`#ffb000`) serves as the secondary accent, evoking the amber phosphor of early IBM terminals and providing a warm counterpoint to the cool green. Amber is used for warnings, highlights, important labels, and elements that need to stand apart from the green without breaking the retro-tech vocabulary. Dim gray (`#4a4a5a`) handles borders, inactive elements, and the subtle grid patterns that create the architectural framework of the layout.

A subtle scanline overlay effect using `repeating-linear-gradient` adds the final layer of atmosphere -- thin, semi-transparent horizontal lines that evoke CRT monitors without degrading readability. This is applied at low opacity (0.03-0.05) as a background texture, never over text directly.

**Key Characteristics:**
- Dark charcoal background (`#1a1a2e`) with slight blue undertone -- the colour of a terminal window, not generic dark mode
- Matrix green (`#00ff41`) as primary text and accent -- the signature colour of this entire system
- Amber (`#ffb000`) as secondary accent for warnings, highlights, and warm focal points
- JetBrains Mono for ALL text -- headers, body, labels, buttons. No sans-serif, no serif. Monospace only.
- Uppercase labels with wide letter-spacing (2-4px) for system-style category markers and status labels
- Scanline overlay effect via `repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, transparent 1px, transparent 2px)` for CRT texture
- Grid background patterns using subtle dotted or lined grids in dim gray (`#4a4a5a`) at low opacity
- Blinking cursor animations (`@keyframes blink`) appended to headings and active elements
- Code-block aesthetics: content presented in bordered containers that evoke terminal windows

## 2. Color Palette & Roles

### Primary
- **Terminal Dark** (`#1a1a2e`): Primary background. Dark charcoal with a blue undertone evoking late-night coding sessions.
- **Matrix Green** (`#00ff41`): Primary text and accent. The signature terminal green for headings, body text, and active elements.
- **Amber** (`#ffb000`): Secondary accent. Used for warnings, highlights, key labels, and warm focal points.

### Accent
- **Bright Green** (`#33ff66`): Hover state for green elements. Slightly lighter and warmer.
- **Dark Amber** (`#cc8e00`): Hover/active state for amber elements.
- **Dim Green** (`#00cc33`): Muted green for secondary text and less prominent body copy.
- **Cyan** (`#00d4ff`): Tertiary accent for links, info states, and occasional emphasis. Used sparingly.

### Neutral Scale
- **Dim Gray** (`#4a4a5a`): Borders, grid lines, and inactive UI elements.
- **Dark Surface** (`#12122a`): Inset panels, code blocks, and recessed areas.
- **Mid Dark** (`#222240`): Elevated surface for cards and containers.
- **Faint Gray** (`#3a3a4e`): Secondary borders, subtle dividers.
- **Ghost Gray** (`#2a2a3e`): Tertiary surface, nested containers.
- **Muted Green** (`#00802a`): Disabled green text, low-emphasis indicators.

### Surface & Borders
- **Surface Primary** (`#222240`): Card and container background -- one step lighter than the canvas.
- **Surface Inset** (`#12122a`): Recessed panels, terminal output areas, code blocks.
- **Surface Canvas** (`#1a1a2e`): The base background layer.
- **Border Default** (`rgba(0,255,65,0.15)`): Green-tinted border for standard containers.
- **Border Accent** (`rgba(255,176,0,0.3)`): Amber-tinted border for highlighted or warning containers.
- **Border Dim** (`rgba(74,74,90,0.5)`): Subtle gray border for inactive or background elements.
- **Divider Rule** (`#00ff41`): Solid green for horizontal accent rules.

### Shadow Colors
- **Shadow Green** (`rgba(0,255,65,0.06)`): Green-tinted ambient glow for on-palette elevation.
- **Shadow Deep** (`rgba(0,0,0,0.5)`): Deep shadow for high-elevation elements.
- **Shadow Soft** (`rgba(0,0,0,0.3)`): Standard shadow for cards.
- **Shadow Glow** (`rgba(0,255,65,0.1)`): Green glow effect for featured/active elements.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`
- **Body**: `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | JetBrains Mono | 56px | 700 | 1.10 | -0.5px | Hero headlines, primary statement |
| Section Heading | JetBrains Mono | 36px | 700 | 1.15 | 0px | Major section titles |
| Sub-heading | JetBrains Mono | 24px | 600 | 1.20 | 0px | Card titles, subsection headers |
| Body Large | JetBrains Mono | 18px | 400 | 1.70 | 0px | Lead paragraphs, introductions |
| Body | JetBrains Mono | 15px | 400 | 1.75 | 0.2px | Standard reading text |
| Small / Caption | JetBrains Mono | 12px | 400 | 1.50 | 0.5px | Metadata, timestamps, path labels |
| Big Numbers | JetBrains Mono | 56px | 700 | 1.00 | 0px | Statistics, key metrics |
| System Label | JetBrains Mono | 12px | 600 | 1.00 | 3px | Uppercase system labels ("STATUS: ACTIVE") |
| CTA Text | JetBrains Mono | 14px | 600 | 1.00 | 2px | Button text, uppercase |
| Prompt Prefix | JetBrains Mono | 15px | 500 | 1.00 | 0px | Command prompt characters ($ > //) |

### Principles
- **Monospace only**: JetBrains Mono handles every typographic role. No sans-serif, no serif. The constraint is the identity.
- **Wide tracking for labels**: System labels and category markers use 2-4px letter-spacing in uppercase to evoke log output and status messages.
- **Generous line height for body**: 1.70-1.75 for body text compensates for the inherently denser texture of monospaced type.
- **Size does the heavy lifting**: Without font-family contrast, hierarchy depends on size jumps. Display at 56px, section at 36px, sub at 24px -- clear, stepped reductions.
- **Green for live, amber for highlight**: Primary text in green, highlighted or warning text in amber. Gray for inactive or de-emphasized content.
- **Blinking cursor**: Append a blinking block cursor (`_`) to hero headings using CSS `@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }` with `animation: blink 1s step-end infinite`.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: #1a1a2e; padding: 80px 60px; text-align: left; position: relative; background-image: repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, transparent 1px, transparent 2px);">
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #ffb000; margin: 0 0 24px;">// SYSTEM BRIEFING</p>
  <h1 style="font-family: 'JetBrains Mono', monospace; font-size: 56px; font-weight: 700; line-height: 1.10; letter-spacing: -0.5px; color: #00ff41; margin: 0 0 8px;">The Future of<br>Autonomous Work<span style="animation: blink 1s step-end infinite; display: inline-block;">_</span></h1>
  <div style="width: 60px; height: 2px; background: #00ff41; margin: 24px 0;"></div>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 400; line-height: 1.70; color: #00cc33; max-width: 600px;">How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.</p>
</div>
```

### Terminal Card

```html
<div style="background: #222240; border: 1px solid rgba(0,255,65,0.15); border-radius: 4px; overflow: hidden;">
  <div style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #12122a; border-bottom: 1px solid rgba(0,255,65,0.15);">
    <span style="width: 10px; height: 10px; border-radius: 50%; background: #ff5f57;"></span>
    <span style="width: 10px; height: 10px; border-radius: 50%; background: #ffbd2e;"></span>
    <span style="width: 10px; height: 10px; border-radius: 50%; background: #28c840;"></span>
    <span style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 400; letter-spacing: 0.5px; color: #4a4a5a; margin-left: 8px;">~/goose/agents</span>
  </div>
  <div style="padding: 32px 24px;">
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #ffb000; margin: 0 0 12px;">FEATURE_01</p>
    <h3 style="font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 600; line-height: 1.20; color: #00ff41; margin: 0 0 12px;">Persistent Memory</h3>
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 400; line-height: 1.75; letter-spacing: 0.2px; color: #00cc33; margin: 0;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="background: #222240; border: 1px solid rgba(0,255,65,0.15); border-radius: 4px; padding: 40px 24px; text-align: center;">
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 56px; font-weight: 700; line-height: 1.00; color: #00ff41; margin: 0 0 8px; text-shadow: 0 0 20px rgba(0,255,65,0.3);">47%</p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #ffb000; margin: 0 0 12px;">FASTER RESPONSE</p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 400; line-height: 1.75; letter-spacing: 0.2px; color: #00cc33; max-width: 280px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: rgba(0,255,65,0.15); border-radius: 4px; overflow: hidden;">
  <div style="background: #222240; padding: 40px 24px;">
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #4a4a5a; margin: 0 0 16px;">// BEFORE</p>
    <h3 style="font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 600; line-height: 1.20; color: #00ff41; margin: 0 0 12px;">Manual & Fragmented</h3>
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 400; line-height: 1.75; letter-spacing: 0.2px; color: #00cc33; margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between tabs.</p>
  </div>
  <div style="background: #222240; padding: 40px 24px; border-left: 2px solid #ffb000;">
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #ffb000; margin: 0 0 16px;">// AFTER</p>
    <h3 style="font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 600; line-height: 1.20; color: #00ff41; margin: 0 0 12px;">Orchestrated & Autonomous</h3>
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 400; line-height: 1.75; letter-spacing: 0.2px; color: #00cc33; margin: 0;">AI coworkers handle research, drafting, and follow-up. Your team focuses on decisions.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 16px; align-items: flex-start; padding: 20px 0; border-bottom: 1px solid rgba(74,74,90,0.5);">
  <span style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 500; color: #ffb000; min-width: 24px;">$</span>
  <div>
    <h4 style="font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; line-height: 1.25; color: #00ff41; margin: 0 0 6px;">multi-channel --access</h4>
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 400; line-height: 1.75; letter-spacing: 0.2px; color: #00cc33; margin: 0;">Reach your AI coworkers through Slack, Telegram, WhatsApp, or the web -- wherever your team already works.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="background: #12122a; padding: 40px 32px; border-left: 2px solid #ffb000; border-radius: 4px;">
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #4a4a5a; margin: 0 0 16px;">// TESTIMONIAL</p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 400; line-height: 1.55; color: #00ff41; margin: 0 0 20px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #ffb000; margin: 0;">-- SARAH CHEN // VP OPERATIONS</p>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: #222240; border: 1px solid rgba(0,255,65,0.15); border-radius: 4px; position: relative; background-image: repeating-linear-gradient(0deg, rgba(0,255,65,0.02) 0px, transparent 1px, transparent 2px);">
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #ffb000; margin: 0 0 20px;">// READY?</p>
  <h2 style="font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 700; line-height: 1.15; color: #00ff41; margin: 0 0 16px;">Deploy your first agent<span style="animation: blink 1s step-end infinite; display: inline-block;">_</span></h2>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 400; line-height: 1.75; color: #00cc33; max-width: 480px; margin: 0 auto 32px;">Up and running in under five minutes. No setup fees, no long-term commitments.</p>
  <a style="display: inline-block; background: transparent; color: #00ff41; font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 14px 36px; border: 2px solid #00ff41; border-radius: 4px;">$ get-started</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between inline elements and tight icon/label pairs.
- **8px**: Tight gap -- between terminal window dots, between stat number and label.
- **12px**: Small gap -- between heading and body text within a terminal card.
- **16px**: Base gap -- between body paragraphs, between list items, terminal card title bar padding.
- **20px**: List padding -- vertical padding for list items.
- **24px**: Medium gap -- internal padding for terminal card content areas.
- **32px**: Card padding -- primary content padding inside containers.
- **40px**: Section internal -- padding for quote blocks and stat displays.
- **48px**: Section divider -- vertical space between major content blocks.
- **60px**: Large section padding -- hero and CTA block top/bottom padding.
- **80px**: Maximum section padding -- cover slides and high-impact displays.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 48px all sides | 984px |
| Infographic (1080xN) | 48px left/right, 60px top/bottom | 984px |
| Slides (1920x1080) | 60px all sides | 1800px |
| Poster (1080x1350) | 48px left/right, 60px top/bottom | 984px |

### Alignment & Grid
- **Primary alignment**: Left-aligned text for body and heading content. Center-aligned only for stat numbers and CTA blocks.
- **Grid**: Use 2-column grids for comparisons with 2px gap (the gap becomes a visible green border). 3-column for stat grids on widescreen. Single-column for narrative.
- **Terminal window chrome**: Cards include a title bar with traffic-light dots (red, amber, green circles) and a path label, mimicking a terminal window.
- **Scanline overlay**: Apply `repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, transparent 1px, transparent 2px)` as a background-image on hero sections and cover slides.
- **Grid background**: For large canvases, use a subtle dot-grid pattern: `radial-gradient(circle, rgba(74,74,90,0.3) 1px, transparent 1px)` with `background-size: 24px 24px`.
- **Content gravity**: Left-aligned. On widescreen slides, content hugs the left side with generous right margin for breathing room.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#1a1a2e` | Page canvas, base layer |
| Subtle (Level 1) | `rgba(0,0,0,0.3) 0px 2px 8px` | Slight lift for secondary containers |
| Card (Level 2) | `rgba(0,0,0,0.4) 0px 4px 16px, rgba(0,255,65,0.04) 0px 0px 12px` | Standard terminal card elevation |
| Featured (Level 3) | `rgba(0,0,0,0.5) 0px 8px 32px, rgba(0,255,65,0.08) 0px 0px 24px` | Featured elements, active terminal windows |
| Glow (Level 4) | `rgba(0,0,0,0.6) 0px 16px 48px, rgba(0,255,65,0.12) 0px 0px 40px` | Hero elements, high-priority overlays with green glow |

### Border Treatments
- **Standard border**: `1px solid rgba(0,255,65,0.15)` -- green-tinted line that evokes terminal window borders.
- **Accent border**: `2px solid #ffb000` -- solid amber for left-border accents on quotes and highlighted containers.
- **Active border**: `1px solid rgba(0,255,65,0.4)` -- brighter green for active/selected containers.
- **Grid gap border**: `2px` gap filled with surface or green-tinted background for comparison grids.
- **Divider line**: `1px solid rgba(74,74,90,0.5)` -- dim gray for list separators.

### Surface Hierarchy
On the dark canvas, elevation uses slight lightness shifts and green-tinted glow:
1. **Canvas** (`#1a1a2e`) -- the darkest layer, the terminal background.
2. **Surface** (`#222240`) -- cards and terminal windows step up by becoming slightly lighter with a purple undertone.
3. **Inset** (`#12122a`) -- recessed areas (code output, inner panels) sit darker than the canvas.
4. **Ghost** (`#2a2a3e`) -- nested containers within cards.

Green-tinted glow effects (`rgba(0,255,65,0.04-0.12)`) on elevated elements create the characteristic "lit terminal" feel, as if the green text is casting light onto its container.

## 7. Do's and Don'ts

### Do
- Use JetBrains Mono for ALL text -- headers, body, labels, buttons, everything. The monospace constraint is the entire identity.
- Use uppercase + wide letter-spacing (2-4px) for system labels, category markers, and status indicators.
- Apply the scanline overlay (`repeating-linear-gradient`) on hero sections and cover backgrounds for CRT atmosphere.
- Use matrix green (`#00ff41`) as the primary text colour on dark backgrounds -- it is the signature of this style.
- Use amber (`#ffb000`) for highlights, warnings, and secondary emphasis that needs to stand apart from green.
- Include terminal window chrome (traffic-light dots + path label) on card components for authenticity.
- Add blinking cursor animations to hero headlines and active input fields.
- Use `text-shadow: 0 0 20px rgba(0,255,65,0.3)` on big numbers and hero stats for a subtle phosphor glow.
- Keep border-radius at 4px maximum -- terminals are sharp, not rounded.
- Use `//` prefix comments in labels and headings to evoke code comments.

### Don't
- Don't use sans-serif or serif fonts anywhere -- JetBrains Mono is the ONLY typeface. No Inter, no Playfair, no system sans-serif.
- Don't use rounded corners above 4px -- this is a sharp, technical aesthetic. No soft corners.
- Don't use gradients for surfaces or buttons -- backgrounds are flat, solid colours. Gradients are reserved for scanline overlays only.
- Don't use matrix green for backgrounds or large filled areas -- it is a text and accent colour, not a surface colour.
- Don't use white (`#ffffff`) for text -- it breaks the terminal illusion. Use green or amber only.
- Don't use more than 3 colours per slide -- green, amber, and dim gray. No blues, purples, or reds (except traffic-light dots in chrome).
- Don't increase body text size above 18px -- monospaced type at large sizes creates uncomfortably wide text blocks.
- Don't use drop caps or decorative typography -- this style is disciplined and mechanical, not literary.
- Don't center-align body text -- left-alignment is the grammar of terminal output. Center only stats and CTAs.
- Don't use soft shadows or ambient glow without the green tint -- all elevation effects must feel like phosphor light.

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
- **Typography scale down**: Display Hero becomes 44px (from 56px). Section Heading becomes 28px. Sub-heading stays 24px. Body stays 15px.
- **Padding**: 48px on all sides. Content area is 984x984px.
- **Cover slide**: Left-aligned title with blinking cursor. Amber system label above. Scanline overlay on background. Green horizontal rule below title.
- **Content slides**: Terminal card with window chrome. One concept per slide with system label and description.
- **Stat slides**: Single stat centered. Big number in green with text-shadow glow. Amber label below.
- **Swipe indicator**: Small green squares at bottom-left (not circles), 6px, 12px gap. Active square filled, others outline only.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 56px for the title section.
- **Padding**: 48px left/right. 60px top/bottom margins.
- **Section spacing**: 48px vertical gap between major sections. Green horizontal rules (60px wide) between sections.
- **Vertical rhythm**: Alternate between terminal cards and full-width sections. Use `//` comment labels to introduce each section. Numbered items use green monospaced numbers with amber labels.
- **Footer**: Dim gray text, 12px JetBrains Mono, with a final green rule above and a `> exit` prompt.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 64px. Section Heading becomes 44px. Body Large becomes 20px.
- **Padding**: 60px on all sides. Content area is 1800x960px.
- **Layout**: Left-heavy composition. Title and body occupy the left 55%. Right side can contain a terminal card or stat display.
- **Title slides**: Left-aligned headline with blinking cursor. Amber label above. Green rule below. Scanline overlay on full background.
- **Content slides**: 2-column terminal cards for comparisons. Single terminal card for narrative.
- **Stat slides**: Up to 3 stats in a row, each in its own terminal card with window chrome.

### Poster (1080x1350px)
- **Typography**: Display Hero at 48px. Section Heading at 32px. Body at 15px.
- **Padding**: 48px left/right, 60px top/bottom.
- **Composition**: Top third for hero headline with scanline overlay. Middle third for terminal cards (content or stats). Bottom third for CTA in a terminal card.
- **Vertical flow**: Green horizontal rules separate the three zones. Each zone is introduced by an amber `//` label.
- **Background**: Apply subtle dot-grid pattern across the full poster for depth.
- **CTA placement**: Terminal-styled button with green border at the bottom, centered within a card.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 56px in JetBrains Mono (approximately 30% larger than Carousel 44px). Section Heading becomes 36px. Body Large becomes 20px. Labels stay at 14-16px uppercase with 2-4px letter-spacing. Everything monospaced -- no exceptions.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 920px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Dark charcoal background (`#1a1a2e`) runs edge-to-edge with the signature scanline overlay (`repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, transparent 1px, transparent 2px)`) applied across the full canvas. Optional dim-gray dot-grid beneath the scanlines for architectural depth.
- **Cover slide**: Amber (`#ffb000`) `//` comment-style label at the top inside the safe zone in uppercase with wide tracking. Matrix green (`#00ff41`) JetBrains Mono headline at 56px below, framed as if it were a terminal output. A blinking green cursor (`@keyframes blink`) trails the last character of the headline. Short green body text below.
- **Content slides**: One bordered "terminal window" card per slide, 1px dim-gray border with a subtle dark-mid surface. Inside: amber `//` label at the top, matrix green heading at 36px, and green/dim body content. Stats rendered in matrix green at 72px with blinking cursors feel genuinely "live." Grid-aligned to the monospace rhythm throughout.
- **CTA slide**: Terminal card centered in the middle zone. Amber `//` label, matrix green JetBrains Mono headline at 44px, green body line, and a terminal-styled button -- 1px solid matrix green border, transparent fill, green uppercase text with wide tracking. A blinking cursor sits inside the button to signal "input required."
- **Progress indicator**: ASCII-style progress bar at the top of the safe zone rendered in monospace: matrix green filled blocks (`█`) for complete, dim gray (`░`) for incomplete, wrapped in square brackets (`[███░░░░]`). Scanlines preserved across it. The progress indicator IS the aesthetic.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Terminal Dark | `#1a1a2e` | Primary background (canvas) |
| Matrix Green | `#00ff41` | Primary text, accent, rules, active states |
| Amber | `#ffb000` | Secondary accent: labels, warnings, highlights |
| Bright Green | `#33ff66` | Hover state for green elements |
| Dark Amber | `#cc8e00` | Hover state for amber elements |
| Dim Green | `#00cc33` | Secondary text, body copy |
| Cyan | `#00d4ff` | Tertiary accent, links (used sparingly) |
| Dim Gray | `#4a4a5a` | Borders, grid lines, inactive elements |
| Dark Surface | `#12122a` | Inset panels, code blocks |
| Mid Dark | `#222240` | Card/container surface |
| Faint Gray | `#3a3a4e` | Secondary borders |
| Ghost Gray | `#2a2a3e` | Nested containers |
| Muted Green | `#00802a` | Disabled text |

### Font Declarations

```css
font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-terminal-dark: #1a1a2e;
  --color-matrix-green: #00ff41;
  --color-amber: #ffb000;

  /* Colors -- Accent */
  --color-bright-green: #33ff66;
  --color-dark-amber: #cc8e00;
  --color-dim-green: #00cc33;
  --color-cyan: #00d4ff;

  /* Colors -- Neutral Scale */
  --color-dim-gray: #4a4a5a;
  --color-dark-surface: #12122a;
  --color-mid-dark: #222240;
  --color-faint-gray: #3a3a4e;
  --color-ghost-gray: #2a2a3e;
  --color-muted-green: #00802a;

  /* Colors -- Surfaces */
  --color-surface-primary: #222240;
  --color-surface-inset: #12122a;
  --color-surface-canvas: #1a1a2e;

  /* Colors -- Borders */
  --color-border-default: rgba(0, 255, 65, 0.15);
  --color-border-accent: rgba(255, 176, 0, 0.3);
  --color-border-active: rgba(0, 255, 65, 0.4);
  --color-border-dim: rgba(74, 74, 90, 0.5);
  --color-divider-rule: #00ff41;

  /* Colors -- Shadows */
  --shadow-green: rgba(0, 255, 65, 0.06);
  --shadow-deep: rgba(0, 0, 0, 0.5);
  --shadow-soft: rgba(0, 0, 0, 0.3);
  --shadow-glow: rgba(0, 255, 65, 0.1);

  /* Typography -- Families */
  --font-display: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  --font-body: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

  /* Typography -- Sizes */
  --text-display-hero: 56px;
  --text-section-heading: 36px;
  --text-sub-heading: 24px;
  --text-body-large: 18px;
  --text-body: 15px;
  --text-small: 12px;
  --text-big-number: 56px;
  --text-label: 12px;
  --text-cta: 14px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-heading: 600;
  --weight-body: 400;
  --weight-label: 600;
  --weight-prompt: 500;

  /* Typography -- Line Heights */
  --leading-display: 1.10;
  --leading-heading: 1.15;
  --leading-sub-heading: 1.20;
  --leading-body-large: 1.70;
  --leading-body: 1.75;
  --leading-small: 1.50;
  --leading-number: 1.00;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-base: 16px;
  --space-list: 20px;
  --space-medium: 24px;
  --space-card-padding: 32px;
  --space-large: 40px;
  --space-section: 48px;
  --space-hero: 60px;
  --space-max: 80px;

  /* Borders */
  --radius-standard: 4px;

  /* Shadows -- Composed */
  --shadow-card: rgba(0,0,0,0.4) 0px 4px 16px, rgba(0,255,65,0.04) 0px 0px 12px;
  --shadow-featured: rgba(0,0,0,0.5) 0px 8px 32px, rgba(0,255,65,0.08) 0px 0px 24px;

  /* Effects */
  --scanline-overlay: repeating-linear-gradient(0deg, rgba(0,255,65,0.03) 0px, transparent 1px, transparent 2px);
  --dot-grid: radial-gradient(circle, rgba(74,74,90,0.3) 1px, transparent 1px);
  --dot-grid-size: 24px 24px;
  --text-glow-green: 0 0 20px rgba(0,255,65,0.3);
}

/* Animation */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

### System Font Fallbacks
- **Monospace (if JetBrains Mono fails to load):** `'Fira Code', 'Courier New', monospace`
