# Design Style: Brutalist

## 1. Visual Theme & Atmosphere

Brutalist design is the anti-design movement made intentional -- a deliberate rejection of polish, decoration, and visual comfort in favour of raw structural honesty. The name borrows from brutalist architecture, where raw concrete (beton brut) is left exposed, where structural columns are celebrated rather than hidden behind drywall, where the building's skeleton IS the aesthetic. In digital form, this translates to heavy black borders on white surfaces, oversized type that crowds its container, exposed grid lines, and a total refusal of decorative flourish. Nothing is rounded. Nothing is softened. Nothing is hidden.

The palette is binary: white (`#ffffff`) and black (`#000000`), with red (`#ff0000`) as the sole accent -- pure, unblended, straight from the hexadecimal extremes. There is no secondary colour. There is no gradient. There is no shadow. The absence of these conventions is not a limitation but a manifesto. Every border is 3-4px solid black. Every corner is 0px radius. Every heading screams in uppercase at 100px or larger. The style strips away the entire vocabulary of "professional" web design -- the subtle shadows, the 8px border-radius, the tasteful colour palettes -- and replaces it with the raw materials of visual communication: type, line, and contrast.

System fonts only. Arial, Helvetica, monospace. No Google Fonts, no Fontshare, no CDN links. The fonts that ship with every operating system are the concrete and steel of this style. Arial and Helvetica in heavy weights deliver blunt, industrial headlines. Monospace (Courier New, monospace) provides the exposed-infrastructure feel for labels and metadata -- like reading the building's blueprints stamped directly onto the facade. The deliberate use of "ugly" fonts is central to the philosophy: beauty is found in function, not ornament.

**Key Characteristics:**
- Pure white background (`#ffffff`) -- no off-whites, no creams, no warmth. Clinical, stark, honest.
- Pure black (`#000000`) for all text and structural borders -- maximum contrast, zero ambiguity.
- Red (`#ff0000`) as the only accent -- used sparingly for emphasis, warnings, and focal points. No secondary colour exists.
- Heavy borders EVERYWHERE: 3-4px solid black on cards, containers, images, and section dividers.
- Zero border-radius on all elements -- sharp 90-degree corners without exception.
- No shadows, no gradients, no blurs -- depth is communicated through borders and overlap only.
- Uppercase headers at extreme sizes (100px+) with heavy weight (800-900).
- System fonts exclusively: Arial, Helvetica for sans-serif; Courier New, monospace for code/labels.
- Asymmetric layouts that deliberately break grid expectations.
- Exposed grid lines and structural borders visible as design elements.

## 2. Color Palette & Roles

### Primary
- **White** (`#ffffff`): Primary background. Pure, unmodified white. The raw canvas.
- **Black** (`#000000`): Primary text and all structural borders. The ink and the steel.
- **Red** (`#ff0000`): The sole accent colour. Used for emphasis, active states, and focal points. Pure red, no mixing.

### Accent
- **Red** (`#ff0000`): There is only one accent. It is used for underlines, active borders, highlight bars, and CTA buttons.
- **No Secondary**: This style deliberately omits a secondary colour. If you need hierarchy below red, use black at reduced opacity.

### Neutral Scale
- **White** (`#ffffff`): Primary background and empty space.
- **Light Gray** (`#f0f0f0`): Alternate background for zebra-striped rows or inset panels.
- **Medium Gray** (`#cccccc`): Exposed grid lines and structural guides.
- **Dark Gray** (`#333333`): Secondary text for descriptions and body copy when contrast reduction is needed.
- **Black** (`#000000`): Primary text, borders, and structural elements.

### Surface & Borders
- **Surface Primary** (`#ffffff`): All cards and containers sit on white.
- **Surface Alternate** (`#f0f0f0`): Alternate panels for visual separation.
- **Border Standard** (`3px solid #000000`): The default border treatment. Heavy, visible, structural.
- **Border Heavy** (`4px solid #000000`): Emphasis border for featured containers and outer frames.
- **Border Accent** (`3px solid #ff0000`): Red border for active or highlighted elements.
- **Divider Rule** (`3px solid #000000`): Horizontal structural dividers between sections.

### Shadow Colors
- **None**: This style uses no shadows. Depth is communicated exclusively through borders, layering, and overlap. If an element needs to feel elevated, give it a heavier border or offset it with visible displacement.

## 3. Typography Rules

### Font Families

**No CDN required -- system fonts only:**

- **Display**: `Arial, Helvetica, sans-serif`
- **Body**: `Arial, Helvetica, sans-serif`
- **Mono**: `'Courier New', Courier, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Transform | Notes |
|------|------|------|--------|-------------|----------------|-----------|-------|
| Display Hero | Arial | 120px | 900 | 0.90 | -2px | uppercase | Massive, crowding the container edges |
| Section Heading | Arial | 80px | 900 | 0.95 | -1px | uppercase | Dominant section markers |
| Sub-heading | Arial | 48px | 800 | 1.00 | -0.5px | uppercase | Subsection titles |
| Body Large | Arial | 20px | 400 | 1.55 | 0px | none | Lead paragraphs |
| Body | Arial | 16px | 400 | 1.60 | 0px | none | Standard reading text |
| Small / Caption | Courier New | 12px | 400 | 1.40 | 1px | uppercase | Metadata, labels, timestamps |
| Big Numbers | Arial | 100px | 900 | 1.00 | -2px | none | Statistics, metrics |
| Structural Label | Courier New | 14px | 400 | 1.00 | 3px | uppercase | Category markers ("01 -- STRATEGY") |
| CTA Text | Arial | 18px | 800 | 1.00 | 2px | uppercase | Button text, calls to action |

### Principles
- **One family, two faces**: Arial/Helvetica handles all display and body text. Courier New/monospace handles labels and metadata. This two-track system mirrors the structural vs. informational divide.
- **Extreme size contrast**: Headers run 100px+ while body sits at 16px. The ratio (6:1 or higher) creates the visual tension that defines brutalism.
- **Uppercase for all headings**: Every heading from Sub-heading up is uppercase. Mixed case is reserved for body text only.
- **Tight line height for display**: 0.90-1.00 for headlines creates intentional crowding -- letters overlap, descenders collide. This is deliberate.
- **Monospace for exposed structure**: Labels, timestamps, and metadata use Courier New to look like system output or architectural notations stamped on the design.
- **Heavy weight only at display sizes**: Body text stays at 400 (regular). The weight jump from 400 body to 900 display reinforces the brutalist hierarchy.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background-color: #ffffff; padding: 60px; border: 4px solid #000000;">
  <div style="width: 100%; height: 4px; background: #000000; margin: 0 0 40px;"></div>
  <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 120px; font-weight: 900; line-height: 0.90; letter-spacing: -2px; text-transform: uppercase; color: #000000; margin: 0 0 24px;">THE FUTURE<br>OF WORK</h1>
  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 400; line-height: 1.55; color: #333333; max-width: 600px; margin: 0 0 32px;">How AI coworkers are reshaping the way teams operate, collaborate, and deliver results.</p>
  <div style="width: 100%; height: 4px; background: #000000;"></div>
</div>
```

### Numbered Item

```html
<div style="display: flex; gap: 24px; align-items: flex-start; padding: 32px 0; border-bottom: 3px solid #000000;">
  <span style="font-family: Arial, Helvetica, sans-serif; font-size: 80px; font-weight: 900; line-height: 1.00; color: #ff0000; min-width: 120px;">01</span>
  <div>
    <p style="font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: #000000; margin: 0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family: Arial, Helvetica, sans-serif; font-size: 48px; font-weight: 800; line-height: 1.00; letter-spacing: -0.5px; text-transform: uppercase; color: #000000; margin: 0 0 12px;">FIND BUYERS FIRST</h3>
    <p style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; line-height: 1.60; color: #333333; margin: 0;">Monitor hiring signals, funding events, and tech stack changes to identify high-intent prospects the moment they enter the market.</p>
  </div>
</div>
```

### Stat Display

```html
<div style="text-align: center; padding: 40px 24px; background: #ffffff; border: 4px solid #000000;">
  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 100px; font-weight: 900; line-height: 1.00; letter-spacing: -2px; color: #ff0000; margin: 0 0 8px;">47%</p>
  <p style="font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: #000000; margin: 0 0 12px;">FASTER RESPONSE</p>
  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; line-height: 1.60; color: #333333; max-width: 280px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 4px solid #000000;">
  <div style="background: #ffffff; padding: 40px 32px; border-right: 3px solid #000000;">
    <p style="font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 400; letter-spacing: 1px; text-transform: uppercase; color: #333333; margin: 0 0 16px;">WITHOUT GOOSE</p>
    <h3 style="font-family: Arial, Helvetica, sans-serif; font-size: 48px; font-weight: 800; line-height: 1.00; text-transform: uppercase; color: #000000; margin: 0 0 16px;">MANUAL</h3>
    <p style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; line-height: 1.60; color: #333333; margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
  </div>
  <div style="background: #f0f0f0; padding: 40px 32px; border-left: 4px solid #ff0000;">
    <p style="font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 400; letter-spacing: 1px; text-transform: uppercase; color: #ff0000; margin: 0 0 16px;">WITH GOOSE</p>
    <h3 style="font-family: Arial, Helvetica, sans-serif; font-size: 48px; font-weight: 800; line-height: 1.00; text-transform: uppercase; color: #000000; margin: 0 0 16px;">AUTONOMOUS</h3>
    <p style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; line-height: 1.60; color: #333333; margin: 0;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 3px solid #000000;">
  <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; border: 3px solid #000000; background: #ff0000; color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 900;">+</div>
  <div>
    <h4 style="font-family: Arial, Helvetica, sans-serif; font-size: 28px; font-weight: 800; line-height: 1.05; text-transform: uppercase; color: #000000; margin: 0 0 8px;">PERSISTENT MEMORY</h4>
    <p style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 400; line-height: 1.60; color: #333333; margin: 0;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="padding: 48px 40px; border-left: 4px solid #ff0000; border-top: 3px solid #000000; border-bottom: 3px solid #000000; background: #f0f0f0;">
  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 36px; font-weight: 900; line-height: 1.15; text-transform: uppercase; color: #000000; margin: 0 0 24px;">"IT FELT LESS LIKE CONFIGURING SOFTWARE AND MORE LIKE ONBOARDING A NEW TEAM MEMBER."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 40px; height: 3px; background: #ff0000;"></div>
    <p style="font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: #000000; margin: 0;">SARAH CHEN // VP OPERATIONS</p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: #000000; border: 4px solid #000000;">
  <h2 style="font-family: Arial, Helvetica, sans-serif; font-size: 80px; font-weight: 900; line-height: 0.95; letter-spacing: -1px; text-transform: uppercase; color: #ffffff; margin: 0 0 16px;">GET STARTED</h2>
  <p style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 400; line-height: 1.55; color: #cccccc; max-width: 480px; margin: 0 auto 32px;">Deploy your first AI coworker in under five minutes. No setup fees. No long-term commitments.</p>
  <a style="display: inline-block; background: #ff0000; color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 20px 48px; border: 3px solid #ffffff;">START NOW</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **0px**: No gap. Elements touching or overlapping is acceptable and even encouraged.
- **8px**: Micro gap -- minimal separation between tightly related elements.
- **16px**: Base gap -- between body paragraphs, between compact list items.
- **24px**: Medium gap -- between components within a section.
- **32px**: Standard padding inside containers and cards.
- **48px**: Section divider -- vertical space between major content blocks.
- **60px**: Section padding -- top/bottom padding for hero areas and major sections.
- **80px**: Maximum section padding -- cover slides and high-impact areas.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 48px all sides | 984px |
| Infographic (1080xN) | 48px left/right, 60px top/bottom | 984px |
| Slides (1920x1080) | 60px all sides | 1800px |
| Poster (1080x1350) | 48px left/right, 60px top/bottom | 984px |

### Alignment & Grid
- **Primary alignment**: Left-aligned for all text. Center-alignment is used only for CTA blocks and single stat displays.
- **Grid**: Visible grid lines encouraged. Use `border-right` and `border-bottom` to show the grid structure. 2-column for comparisons, single-column for narrative. No gap between grid cells -- use borders as separators.
- **Horizontal rules**: 3-4px solid black, full-width, used as structural dividers between every major section.
- **Vertical rhythm**: Deliberately uneven. Some sections pack tightly while others have generous space. The inconsistency is intentional.
- **Asymmetric layouts**: Headers may extend beyond the content area. Numbers may be oversized and overlap other elements. Text blocks may be intentionally misaligned.
- **Content overflow**: It is acceptable and desirable for oversized type to be clipped by container edges. This reinforces the raw, structural feel.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No treatment, white background | Default state for all elements |
| Bordered (Level 1) | `3px solid #000000` border, no shadow | Standard containers, cards, and content blocks |
| Heavy (Level 2) | `4px solid #000000` border, no shadow | Featured containers, outer frames, hero sections |
| Accent (Level 3) | `4px solid #ff0000` border, no shadow | Active or highlighted elements, featured cards |
| Inverted (Level 4) | Black background, white text, heavy border | Maximum emphasis: CTAs, critical callouts |

### Border Treatments
- **Standard border**: `3px solid #000000` -- the workhorse. Used on every container, card, and content block.
- **Heavy border**: `4px solid #000000` -- outer frames, hero sections, and high-emphasis containers.
- **Accent border**: `3px solid #ff0000` -- red border for active, featured, or "preferred" elements.
- **Accent heavy**: `4px solid #ff0000` -- left-border treatment on quote blocks and highlighted sections.
- **Divider**: `3px solid #000000` -- full-width horizontal rules between sections.

### Surface Hierarchy
Brutalism communicates hierarchy through borders and inversion, not through shadow or subtle surface shifts:
1. **White** (`#ffffff`) -- the default surface. Most content lives here.
2. **Light Gray** (`#f0f0f0`) -- alternate panels for zebra-striping or inset areas.
3. **Black** (`#000000`) -- inverted surfaces for maximum contrast. Used for CTAs and high-emphasis blocks.
4. **Red on White** -- red borders or red text on white surface for accent emphasis.

There are no shadows. There are no gradients. There are no blurs. Elevation is a border, and importance is a colour inversion.

## 7. Do's and Don'ts

### Do
- Use heavy borders (3-4px solid black) on EVERY container, card, and content block -- borders are the structural skeleton of this style.
- Use uppercase for all headings and labels -- mixed case is reserved for body text only.
- Use extreme font sizes (100px+) for hero headlines -- the type should feel like it barely fits.
- Use red (`#ff0000`) as the only accent colour -- it is the only chromatic relief in a binary palette.
- Use system fonts only (Arial, Helvetica, Courier New, monospace) -- no web fonts, no CDN links.
- Use 0px border-radius everywhere -- sharp corners without exception.
- Use monospace (Courier New) for labels, metadata, and structural annotations.
- Use black backgrounds with white text for CTA blocks and maximum-emphasis sections.
- Let oversized type crowd or clip at container edges -- this is intentional, not a bug.
- Use full-width horizontal rules (3px black) as section dividers.

### Don't
- Don't use any shadows -- no box-shadow, no text-shadow, no drop-shadow. Zero.
- Don't use any gradients -- no linear-gradient, no radial-gradient. Flat colour only.
- Don't use border-radius -- not 2px, not 4px, not 1px. The value is 0px, always.
- Don't introduce a secondary colour -- no blues, no greens, no oranges. Only black, white, and red.
- Don't use web fonts or CDN links -- system fonts are the raw material of this style.
- Don't use Inter, Playfair Display, DM Sans, Satoshi, or any other web font.
- Don't use light font weights (300) for headings -- display type is 800-900 weight only.
- Don't center-align body paragraphs -- left-alignment is the default for all text.
- Don't use opacity or transparency for decorative effect -- elements are either fully visible or absent.
- Don't soften anything -- no hover transitions, no easing, no animation. State changes are instant.
- Don't use decorative icons or illustrations -- if a visual is needed, use geometric shapes (squares, lines, plus signs) in black or red.

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
- **Typography scale**: Display Hero at 80px (from 120px). Section Heading at 60px. Sub-heading at 40px. Body stays 16px.
- **Padding**: 48px on all sides. Content area is 984x984px.
- **Cover slide**: Title left-aligned, uppercase, running nearly edge to edge. Full-width black rules top and bottom. Red accent on a single word or number.
- **Content slides**: Left-aligned. One idea per slide. Oversized number in red at top; content below with heavy bottom border.
- **Stat slides**: Single stat centered. Number at 80px in red. Label in Courier New below. Heavy black border framing the entire slide.
- **Navigation**: No swipe dots -- instead, a Courier New page counter in the corner ("03/07").

### Infographic (1080px wide, variable height)
- **Typography**: Full-scale hierarchy. Display Hero at 120px for the title block.
- **Padding**: 48px left/right. 60px top/bottom margins.
- **Section spacing**: Sections separated by full-width 3px black rules. No whitespace as separator -- always a visible rule.
- **Vertical rhythm**: Alternate between full-width sections and 2-column grids with visible grid borders. Use numbered items for sequences, stat blocks for metrics, and quote blocks for testimonials.
- **Structure**: Expose the grid. Every section has visible borders. The infographic should look like an architectural blueprint or a newspaper broadsheet.
- **Footer**: Black bar, full width, white text in Courier New.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero at 140px. Section Heading at 100px. Body Large at 22px.
- **Padding**: 60px on all sides. Content area is 1800x960px.
- **Layout**: Asymmetric. Title and body text may occupy only 60% of the frame, with the remaining space intentionally empty or containing a single oversized number/graphic.
- **Title slides**: Massive uppercase headline, left-aligned, with full-width black rules.
- **Content slides**: 2-column with visible border separator. No gap between columns.
- **Stat slides**: Up to 3 stats in a row, each in its own bordered cell with no gap.

### Poster (1080x1350px)
- **Typography**: Display Hero at 100px. Section Heading at 60px. Body at 16px.
- **Padding**: 48px left/right, 60px top/bottom.
- **Composition**: Top section for headline (takes up as much space as needed). Middle for content. Bottom for CTA in inverted black block.
- **Vertical flow**: Heavy black rules divide the three zones. Each zone is a distinct bordered section.
- **CTA placement**: Always in a full-width inverted (black background, white text) block at the bottom with a red-bordered button.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 104px (approximately 30% larger than Carousel). Section Heading becomes 80px. Body Large becomes 22px. Big Numbers push to 140px.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 960px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. Asymmetric rules may deliberately extend past the 960px column to reinforce the brutalist grid break.
- **Cover slide**: Massive uppercase headline crowding the horizontal bounds of the safe zone, letters tight at 0.90 line-height so descenders collide. Full-width 4px black rule above and below the headline. A single word or the hero number in red (`#ff0000`) carries the accent -- everything else is pure black-on-white. The signature "barely fits" feeling translates vertically: let the headline stack three or four lines deep.
- **Content slides**: One idea per slide with a massive numbered marker (`01`, `02`) in red at 140px+ anchored upper-left, and the content block below bounded by a 3px black rule on top and bottom. Courier New structural label (uppercase, wide tracking) sits immediately above each heading like a blueprint annotation.
- **CTA slide**: Full-frame inverted block -- black background, white Arial uppercase headline at 80px, and a red-bordered button (`3px solid #ff0000`) at the bottom of the safe zone with `START NOW` in Arial 800.
- **Progress indicator**: Courier New page counter (`03 / 07`) in the top-right corner inside the safe zone at 14px with 3px letter-spacing. No dots, no bars -- the exposed monospace counter IS the indicator.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| White | `#ffffff` | Primary background |
| Black | `#000000` | Primary text, all borders |
| Red | `#ff0000` | Accent: numbers, active borders, CTAs, emphasis |
| Light Gray | `#f0f0f0` | Alternate surface, inset panels |
| Medium Gray | `#cccccc` | Exposed grid lines, structural guides |
| Dark Gray | `#333333` | Secondary body text, descriptions |

### Font Declarations

```css
font-family: Arial, Helvetica, sans-serif;
font-family: 'Courier New', Courier, monospace;
```

### System Fonts Only

No CDN link required. This style uses system fonts exclusively. Do not add any `<link>` tags for fonts.

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-white: #ffffff;
  --color-black: #000000;
  --color-red: #ff0000;

  /* Colors -- Neutral Scale */
  --color-light-gray: #f0f0f0;
  --color-medium-gray: #cccccc;
  --color-dark-gray: #333333;

  /* Colors -- Surfaces */
  --color-surface-primary: #ffffff;
  --color-surface-alternate: #f0f0f0;
  --color-surface-inverted: #000000;

  /* Colors -- Borders */
  --color-border-standard: #000000;
  --color-border-accent: #ff0000;
  --border-standard: 3px solid #000000;
  --border-heavy: 4px solid #000000;
  --border-accent: 3px solid #ff0000;
  --border-accent-heavy: 4px solid #ff0000;
  --border-divider: 3px solid #000000;

  /* Colors -- Shadows */
  /* None. This style uses no shadows. */

  /* Typography -- Families */
  --font-display: Arial, Helvetica, sans-serif;
  --font-body: Arial, Helvetica, sans-serif;
  --font-mono: 'Courier New', Courier, monospace;

  /* Typography -- Sizes */
  --text-display-hero: 120px;
  --text-section-heading: 80px;
  --text-sub-heading: 48px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 12px;
  --text-big-number: 100px;
  --text-label: 14px;
  --text-cta: 18px;

  /* Typography -- Weights */
  --weight-display: 900;
  --weight-display-medium: 800;
  --weight-body: 400;

  /* Typography -- Line Heights */
  --leading-display: 0.90;
  --leading-heading: 0.95;
  --leading-sub-heading: 1.00;
  --leading-body-large: 1.55;
  --leading-body: 1.60;
  --leading-small: 1.40;
  --leading-number: 1.00;

  /* Spacing */
  --space-none: 0px;
  --space-micro: 8px;
  --space-base: 16px;
  --space-medium: 24px;
  --space-large: 32px;
  --space-section: 48px;
  --space-hero: 60px;
  --space-max: 80px;

  /* Borders */
  --radius-standard: 0px;

  /* Shadows -- None */
  --shadow-card: none;
  --shadow-featured: none;
}
```

### System Font Fallbacks
- **Sans-serif:** `Arial, Helvetica, sans-serif` -- this IS the primary font, no fallback needed.
- **Monospace:** `'Courier New', Courier, monospace` -- for labels, metadata, and structural text.
