# Design Style: Soft Cloud

## 1. Visual Theme & Atmosphere

Soft Cloud is the visual language of modern SaaS at its most inviting -- the kind of interface design you see in a product that wants you to feel at home the moment you land on the page. The pale gradient background drifts from lavender (`#e8e0f0`) to mint (`#d8f0e8`), creating a sense of openness and calm that immediately signals approachability. This is not the sterile white of enterprise dashboards or the aggressive dark mode of developer tools -- it is a gentle, airy canvas that breathes. White cards (`#ffffff`) float above this gradient like clouds in a pastel sky, their generous rounded corners (16-20px) and soft shadows removing any sharpness or tension from the layout.

The typographic identity rests entirely on Plus Jakarta Sans, a geometric sans-serif from Google Fonts that balances friendliness with professionalism. At weight 600, headlines feel confident without being aggressive. At weight 500, body text reads as warm and approachable without sacrificing clarity. The rounded terminals and open apertures of Plus Jakarta Sans complement the soft geometry of the card-based layout -- everything works together to say "modern, trustworthy, easy." There is no serif counterpoint here; the entire system speaks in one friendly voice, varying only in size and weight to establish hierarchy.

Soft purple (`#8b6cc7`) serves as the primary accent colour, adding just enough chromatic energy to guide the eye without overwhelming the pastel tranquility of the canvas. It appears in buttons, active states, and key metrics -- moments where the design needs to say "look here" without shouting. Mint (`#5cb8a5`) operates as the secondary accent, used for success states, secondary actions, and supporting indicators. Together, purple and mint create a cool-toned accent vocabulary that feels fresh and contemporary. The interplay between the gradient background, white card surfaces, and these two accent colours produces a layered, dimensional aesthetic that is unmistakably modern SaaS -- think Notion's calm confidence crossed with Linear's polished softness.

**Key Characteristics:**
- Pale gradient background from lavender (`#e8e0f0`) to mint (`#d8f0e8`) -- a dreamy canvas that sets the tone instantly
- White (`#ffffff`) card surfaces floating above the gradient with soft shadows and rounded corners (16-20px)
- Dark charcoal (`#2d2d3d`) for all primary text -- dark enough for strong contrast, warm enough to avoid harshness
- Plus Jakarta Sans at weight 500-600 throughout -- one font family, friendly and geometric
- Soft purple (`#8b6cc7`) as primary accent for buttons, links, stats, and focal points
- Mint (`#5cb8a5`) as secondary accent for success states, secondary CTAs, and supporting elements
- Generous border-radius (16-20px) on all cards and containers -- softness is structural, not decorative
- Soft shadows using `rgba(139,108,199,0.08)` -- purple-tinted ambient glow that stays on-palette
- Ample white space and relaxed padding to maintain the airy, breathable feel

## 2. Color Palette & Roles

### Primary
- **Lavender** (`#e8e0f0`): Gradient start colour. The left/top anchor of the background gradient.
- **Mint Background** (`#d8f0e8`): Gradient end colour. The right/bottom anchor of the background gradient.
- **White** (`#ffffff`): Card and container surface. The primary content background.
- **Dark Charcoal** (`#2d2d3d`): Primary text colour. Rich and warm without being pure black.
- **Soft Purple** (`#8b6cc7`): Primary accent. Buttons, links, key metrics, and focal-point elements.

### Accent
- **Mint** (`#5cb8a5`): Secondary accent for success states, tags, and secondary CTAs.
- **Deep Purple** (`#6b4fa7`): Darker purple for hover/active states on interactive elements.
- **Light Purple** (`#a78fd4`): Lighter purple for backgrounds of badges, tags, and subtle highlights.
- **Light Mint** (`#d0f0e4`): Background tint for success messages and positive indicators.

### Neutral Scale
- **Dark Charcoal** (`#2d2d3d`): Primary text, headings, and high-emphasis labels.
- **Charcoal** (`#4a4a5a`): Secondary text for descriptions and supporting copy.
- **Warm Gray** (`#6b6b7a`): Tertiary text for timestamps, metadata, and captions.
- **Medium Gray** (`#9a9aaa`): Placeholder text, disabled labels, and de-emphasized content.
- **Light Gray** (`#c8c8d4`): Borders, dividers, and subtle UI lines.
- **Pale Gray** (`#f0eef4`): Subtle surface tint for hover states on white cards.

### Surface & Borders
- **Surface Primary** (`#ffffff`): Card and container background.
- **Surface Tinted** (`#f8f5fc`): Lightly purple-tinted surface for featured or highlighted cards.
- **Surface Gradient** (`linear-gradient(135deg, #e8e0f0, #d8f0e8)`): Page-level background.
- **Border Default** (`rgba(45,45,61,0.1)`): Standard border for cards and containers.
- **Border Accent** (`rgba(139,108,199,0.3)`): Purple-tinted border for active or featured elements.
- **Border Light** (`rgba(45,45,61,0.06)`): Subtle divider for list items and table rows.

### Shadow Colors
- **Shadow Purple** (`rgba(139,108,199,0.08)`): Primary shadow -- purple-tinted ambient glow for on-palette elevation.
- **Shadow Medium** (`rgba(139,108,199,0.12)`): Medium elevation for featured cards and hover states.
- **Shadow Soft** (`rgba(45,45,61,0.06)`): Neutral soft shadow for subtle depth.
- **Shadow Deep** (`rgba(45,45,61,0.15)`): Deep shadow for modals and overlays.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'Plus Jakarta Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Plus Jakarta Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Plus Jakarta Sans | 64px | 700 | 1.10 | -1px | Hero headlines, cover statements |
| Section Heading | Plus Jakarta Sans | 40px | 700 | 1.15 | -0.5px | Major section titles |
| Sub-heading | Plus Jakarta Sans | 28px | 600 | 1.20 | -0.25px | Card headings, subsection titles |
| Body Large | Plus Jakarta Sans | 20px | 500 | 1.60 | 0px | Lead paragraphs, introductions |
| Body | Plus Jakarta Sans | 16px | 400 | 1.65 | 0px | Standard reading text |
| Small / Caption | Plus Jakarta Sans | 13px | 500 | 1.50 | 0.2px | Metadata, timestamps, captions |
| Big Numbers | Plus Jakarta Sans | 56px | 700 | 1.00 | -0.5px | Statistics, key metrics |
| Label | Plus Jakarta Sans | 13px | 600 | 1.00 | 0.5px | Uppercase tag labels, category markers |
| CTA Text | Plus Jakarta Sans | 15px | 600 | 1.00 | 0.3px | Button text |

### Principles
- **One family, many weights**: Plus Jakarta Sans handles every role. Hierarchy is created through size and weight variation, not font-family contrast.
- **Medium weights for body**: Weight 400-500 for body text keeps the reading experience warm and approachable. Avoid weight 300 -- it feels too thin for this friendly style.
- **Bold for display only**: Weight 700 is reserved for display headings (28px+) and big numbers. Do not use 700 for body text or small labels.
- **Relaxed line heights**: 1.60-1.65 for body text creates an open, breathable reading rhythm that matches the airy visual theme.
- **Uppercase sparingly**: Reserve uppercase + letter-spacing for small labels and category markers only. Headlines and body text are always mixed case.

## 4. Component Patterns

### Title Block (Cover / Header Section)

```html
<div style="background: linear-gradient(135deg, #e8e0f0, #d8f0e8); padding: 80px 60px; text-align: center;">
  <div style="display: inline-block; background: rgba(139,108,199,0.12); border-radius: 24px; padding: 6px 20px; margin-bottom: 24px;">
    <span style="font-family: var(--font-body); font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--color-purple);">Introducing</span>
  </div>
  <h1 style="font-family: var(--font-display); font-size: 64px; font-weight: 700; line-height: 1.10; letter-spacing: -1px; color: var(--color-charcoal); margin: 0 0 20px;">Your AI Team,<br>Always On</h1>
  <p style="font-family: var(--font-body); font-size: 20px; font-weight: 500; line-height: 1.60; color: var(--color-secondary-text); max-width: 560px; margin: 0 auto;">Deploy intelligent coworkers that handle research, drafting, and coordination while you focus on what matters.</p>
</div>
```

### Feature Card

```html
<div style="background: var(--color-white); border-radius: 20px; padding: 40px 32px; box-shadow: 0px 4px 20px rgba(139,108,199,0.08); border: 1px solid rgba(45,45,61,0.06);">
  <div style="width: 48px; height: 48px; border-radius: 14px; background: rgba(139,108,199,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
    <span style="color: var(--color-purple); font-size: 22px;">&#9672;</span>
  </div>
  <h3 style="font-family: var(--font-display); font-size: 28px; font-weight: 600; line-height: 1.20; letter-spacing: -0.25px; color: var(--color-charcoal); margin: 0 0 12px;">Persistent Memory</h3>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-secondary-text); margin: 0;">Every agent maintains its own filesystem, notes, and learned preferences across sessions. Context is never lost between conversations.</p>
</div>
```

### Stat Display

```html
<div style="background: var(--color-white); border-radius: 20px; padding: 40px 32px; text-align: center; box-shadow: 0px 4px 20px rgba(139,108,199,0.08); border: 1px solid rgba(45,45,61,0.06);">
  <p style="font-family: var(--font-display); font-size: 56px; font-weight: 700; line-height: 1.00; letter-spacing: -0.5px; color: var(--color-purple); margin: 0 0 8px;">47%</p>
  <p style="font-family: var(--font-body); font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--color-charcoal); margin: 0 0 12px;">Faster Response</p>
  <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-secondary-text); max-width: 280px; margin: 0 auto;">Teams using AI coworkers respond to inbound leads nearly twice as fast as manual workflows.</p>
</div>
```

### Comparison Grid

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
  <div style="background: var(--color-white); border-radius: 20px; padding: 40px 32px; box-shadow: 0px 4px 20px rgba(139,108,199,0.08); border: 1px solid rgba(45,45,61,0.06);">
    <div style="display: inline-block; background: rgba(45,45,61,0.06); border-radius: 24px; padding: 4px 14px; margin-bottom: 16px;">
      <span style="font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--color-warm-gray);">Without Goose</span>
    </div>
    <h3 style="font-family: var(--font-display); font-size: 28px; font-weight: 600; line-height: 1.20; letter-spacing: -0.25px; color: var(--color-charcoal); margin: 0 0 12px;">Manual & Fragmented</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-secondary-text); margin: 0;">Teams juggle Slack threads, spreadsheets, and context-switching between a dozen tabs to coordinate basic workflows.</p>
  </div>
  <div style="background: var(--color-white); border-radius: 20px; padding: 40px 32px; box-shadow: 0px 4px 20px rgba(139,108,199,0.08); border: 2px solid rgba(139,108,199,0.3);">
    <div style="display: inline-block; background: rgba(139,108,199,0.1); border-radius: 24px; padding: 4px 14px; margin-bottom: 16px;">
      <span style="font-family: var(--font-body); font-size: 13px; font-weight: 600; color: var(--color-purple);">With Goose</span>
    </div>
    <h3 style="font-family: var(--font-display); font-size: 28px; font-weight: 600; line-height: 1.20; letter-spacing: -0.25px; color: var(--color-charcoal); margin: 0 0 12px;">Orchestrated & Autonomous</h3>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-secondary-text); margin: 0;">AI coworkers handle research, drafting, and follow-up autonomously. Your team focuses on decisions, not busywork.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; gap: 20px; align-items: flex-start; padding: 24px 0; border-bottom: 1px solid rgba(45,45,61,0.06);">
  <div style="width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center; background: rgba(139,108,199,0.1); border-radius: 12px; color: var(--color-purple); font-size: 18px;">&#10003;</div>
  <div>
    <h4 style="font-family: var(--font-display); font-size: 20px; font-weight: 600; line-height: 1.25; color: var(--color-charcoal); margin: 0 0 6px;">Multi-Channel Access</h4>
    <p style="font-family: var(--font-body); font-size: 16px; font-weight: 400; line-height: 1.65; color: var(--color-secondary-text); margin: 0;">Reach your AI coworkers through Slack, Telegram, WhatsApp, or the web -- wherever your team already works.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="background: var(--color-white); border-radius: 20px; padding: 40px 32px; border-left: 4px solid var(--color-purple); box-shadow: 0px 4px 20px rgba(139,108,199,0.08);">
  <p style="font-family: var(--font-display); font-size: 24px; font-weight: 500; font-style: italic; line-height: 1.45; color: var(--color-charcoal); margin: 0 0 20px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #8b6cc7, #5cb8a5);"></div>
    <div>
      <p style="font-family: var(--font-body); font-size: 15px; font-weight: 600; color: var(--color-charcoal); margin: 0;">Sarah Chen</p>
      <p style="font-family: var(--font-body); font-size: 13px; font-weight: 500; color: var(--color-warm-gray); margin: 0;">VP Operations, Acme Corp</p>
    </div>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px; background: var(--color-white); border-radius: 24px; box-shadow: 0px 8px 32px rgba(139,108,199,0.12);">
  <h2 style="font-family: var(--font-display); font-size: 40px; font-weight: 700; line-height: 1.15; letter-spacing: -0.5px; color: var(--color-charcoal); margin: 0 0 16px;">Ready to meet your team?</h2>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 500; line-height: 1.60; color: var(--color-secondary-text); max-width: 480px; margin: 0 auto 32px;">Deploy your first AI coworker in under five minutes. No setup fees, no long-term commitments.</p>
  <a style="display: inline-block; background: var(--color-purple); color: #ffffff; font-family: var(--font-body); font-size: 15px; font-weight: 600; letter-spacing: 0.3px; text-decoration: none; padding: 14px 36px; border-radius: 12px;">Get Started</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap -- between icon and inline label.
- **8px**: Tight gap -- between stat number and label, between tag elements.
- **12px**: Small gap -- between heading and body text within a card.
- **16px**: Base gap -- between body paragraphs, between compact list items.
- **20px**: Card gap -- between cards in a grid, between icon container and text.
- **24px**: Medium gap -- standard list item vertical padding, between grouped elements.
- **32px**: Card padding -- internal padding for cards and containers.
- **40px**: Section internal -- padding inside feature cards and quote blocks.
- **48px**: Section divider -- vertical space between major content blocks.
- **60px**: Large section padding -- hero and CTA block top/bottom padding.
- **80px**: Maximum section padding -- cover slides and high-impact hero areas.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 48px all sides | 984px |
| Infographic (1080xN) | 48px left/right, 60px top/bottom | 984px |
| Slides (1920x1080) | 60px all sides | 1800px |
| Poster (1080x1350) | 48px left/right, 60px top/bottom | 984px |

### Alignment & Grid
- **Primary alignment**: Left-aligned text for body content. Center-aligned for hero titles, stats, and CTA blocks.
- **Grid**: Use 2-column or 3-column grids for feature cards with 20px gaps. Single-column for narrative content. 2-column for comparisons.
- **Card spacing**: 20px gap between all cards in a grid layout. Cards should feel like they are floating independently.
- **Rounded corners**: 16-20px for cards and containers. 12px for buttons and interactive elements. 24px for pill-shaped badges.
- **Content gravity**: On widescreen slides (1920x1080), center content with generous margins. The gradient background should be visible as a frame around the content.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, gradient background | Page canvas, base layer |
| Resting (Level 1) | `rgba(139,108,199,0.06) 0px 2px 12px` | Subtle lift for secondary elements |
| Card (Level 2) | `rgba(139,108,199,0.08) 0px 4px 20px, rgba(45,45,61,0.04) 0px 1px 4px` | Standard card elevation |
| Featured (Level 3) | `rgba(139,108,199,0.12) 0px 8px 32px, rgba(45,45,61,0.06) 0px 2px 8px` | Featured cards, hover states, CTA blocks |
| Overlay (Level 4) | `rgba(45,45,61,0.15) 0px 16px 48px` | Modals, overlays, floating panels |

### Border Treatments
- **Standard border**: `1px solid rgba(45,45,61,0.06)` -- barely visible line that defines card edges without adding visual weight.
- **Active border**: `2px solid rgba(139,108,199,0.3)` -- purple-tinted border for featured or active containers.
- **Divider line**: `1px solid rgba(45,45,61,0.06)` -- subtle separator for list items within cards.
- **No heavy borders**: This style avoids visible borders wherever possible. Shadows and background contrast handle the separation.

### Surface Hierarchy
On the gradient background, elevation is communicated through whiteness and shadow:
1. **Background** (gradient `#e8e0f0` to `#d8f0e8`) -- the coloured canvas, always visible as a frame.
2. **Surface** (`#ffffff`) -- white cards float above the gradient, the primary content layer.
3. **Tinted Surface** (`#f8f5fc`) -- lightly purple-tinted cards for featured or highlighted content.
4. **Inset** (`#f0eef4`) -- recessed areas within white cards for input fields or secondary panels.

Purple-tinted shadows (`rgba(139,108,199,0.06-0.12)`) maintain the colour palette in elevation effects and prevent cards from feeling disconnected from the gradient background.

## 7. Do's and Don'ts

### Do
- Use the lavender-to-mint gradient (`#e8e0f0` to `#d8f0e8`) as the page background -- it is the signature of this style.
- Float white cards above the gradient with soft purple-tinted shadows to create the "cloud" effect.
- Use Plus Jakarta Sans at weight 500-600 for all text -- friendly, medium-weight type is the voice of this style.
- Apply generous border-radius (16-20px) to all cards and containers -- softness is a core design decision.
- Use soft purple (`#8b6cc7`) as the primary accent for buttons, links, and focal metrics.
- Use mint (`#5cb8a5`) as a secondary accent for success states, tags, and variety in multi-element layouts.
- Use pill-shaped badges (border-radius: 24px) for labels and category markers above headlines.
- Maintain ample white space inside and between cards -- the layout should feel open and breathable.
- Keep shadows subtle and purple-tinted -- elevation should feel gentle, not dramatic.

### Don't
- Don't use pure black (`#000000`) for text -- always use dark charcoal (`#2d2d3d`) to keep the tone warm.
- Don't use sharp corners (border-radius: 0-4px) on any container -- this style is defined by its softness.
- Don't use heavy shadows or drop-shadow effects -- elevation should be gentle and barely perceptible.
- Don't use more than 2 accent colours per slide -- soft purple and mint only. No reds, oranges, or yellows.
- Don't use weight 700 for body text or small labels -- it breaks the friendly, approachable feel.
- Don't use dark backgrounds -- this is a light, airy style. Even dark sections should use tinted white (`#f8f5fc`), not dark surfaces.
- Don't use serif fonts -- Plus Jakarta Sans is the entire typographic identity. No mixing with serif faces.
- Don't crowd cards together -- minimum 20px gap between all card elements. Space is a feature.
- Don't use hard borders (2px+ solid dark lines) -- borders should be nearly invisible or accent-coloured.
- Don't use flat, unshadowed cards directly on the gradient -- every card needs at least Level 1 shadow to float.

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
- **Typography scale down**: Display Hero becomes 48px (from 64px). Section Heading becomes 32px. Sub-heading stays 28px. Body stays 16px.
- **Padding**: 48px on all sides. Content area is 984x984px.
- **Cover slide**: Title centered vertically and horizontally. Pill badge above the headline. Subtitle below in secondary text colour.
- **Content slides**: White card centered on the gradient background with 32px internal padding. One concept per slide.
- **Stat slides**: Single stat centered within a white card. Big number in purple, label below.
- **Swipe indicator**: Small purple dots at bottom center, 8px diameter, 12px gap. Active dot filled, others 30% opacity.

### Infographic (1080px wide, variable height)
- **Typography**: Uses full-scale type hierarchy. Display Hero at 64px for the title section.
- **Padding**: 48px left/right. 60px top/bottom margins.
- **Section spacing**: 48px vertical gap between major sections. White cards contain each section, floating on the gradient.
- **Vertical rhythm**: Alternate between feature cards (2-column grid) and full-width sections (stats, quotes, CTAs). Each major block is its own white card.
- **Footer**: Secondary text, 13px Plus Jakarta Sans, centered, with a subtle purple-tinted rule above.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero becomes 72px. Section Heading becomes 48px. Body Large becomes 22px.
- **Padding**: 60px on all sides. Content area is 1800x960px.
- **Layout**: Centered composition. White cards are the primary content containers, floated on the gradient.
- **Title slides**: Headline centered on frame. Pill badge above. Subtitle below.
- **Content slides**: 2-3 feature cards in a row for comparisons. Single large card for narrative content.
- **Stat slides**: Up to 3 stat cards in a row with 20px gaps, evenly spaced.

### Poster (1080x1350px)
- **Typography**: Display Hero at 56px. Section Heading at 36px. Body at 16px.
- **Padding**: 48px left/right, 60px top/bottom.
- **Composition**: Top third for hero headline in a white card. Middle third for feature cards (2-column grid) or stat displays. Bottom third for CTA card.
- **Vertical flow**: Content reads top-to-bottom with clear card separation. The gradient background acts as the connecting tissue between floating card sections.
- **CTA placement**: Always in its own white card at the bottom, with a prominent purple button centered.

### Story (1080x1920px)
- **Typography scale up**: Display Hero becomes 64px in Plus Jakarta Sans 600 (approximately 30% larger than Carousel 48px). Section Heading becomes 44px. Body Large becomes 22px in Plus Jakarta Sans 500. Big numbers for metrics become 72-80px in soft purple.
- **Padding**: 120px top/bottom + 60px left/right. Safe zones: 160px top and 160px bottom reserved for platform UI (profile avatar, progress bar, reply input). All critical text must sit inside y=160 to y=1760.
- **Layout**: Single centered column. Content max-width 920px. Vertical center of gravity -- cluster hero content in y=400 to y=1500 range. The signature lavender-to-mint pastel gradient (`linear-gradient(160deg, #e8e0f0 0%, #d8f0e8 100%)`) runs the full vertical -- now a dreamy sky from soft purple morning to mint afternoon.
- **Cover slide**: A single tall white card (`#ffffff`, 20px radius, soft purple-tinted shadow `0 16px 48px rgba(139,108,199,0.1)`) centered in the safe zone. Inside the card, Plus Jakarta Sans 600 headline at 64px in dark charcoal, weight-500 subtitle at 22px below. Generous internal padding (48px) preserves the airy feel.
- **Content slides**: One white cloud-card per slide floating mid-frame. Inside: a purple (`#8b6cc7`) or mint (`#5cb8a5`) big number at 72-80px as the hero element, a Plus Jakarta Sans 600 sub-heading at 36-40px, and body at 22px weight 500. Mint accents for success indicators, purple for focal stats. Shadows stay soft and purple-tinted throughout.
- **CTA slide**: Its own cloud-card at the middle of the safe zone. Plus Jakarta Sans 600 headline at 52px, short supporting body, and a prominent purple (`#8b6cc7`) pill button with generous 16px radius and white Plus Jakarta Sans 600 CTA text. Optional mint checkmark indicator nearby.
- **Progress indicator**: Soft pill-shaped segments at the top of the safe zone, 4px tall with full radius -- inactive in `rgba(45,45,61,0.15)`, active in soft purple (`#8b6cc7`). The rounded shape matches the cloud-card vocabulary -- nothing sharp survives in this style.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Lavender | `#e8e0f0` | Gradient start (background) |
| Mint Background | `#d8f0e8` | Gradient end (background) |
| White | `#ffffff` | Card and container surface |
| Dark Charcoal | `#2d2d3d` | Primary text |
| Soft Purple | `#8b6cc7` | Accent: buttons, links, stats, focal points |
| Mint | `#5cb8a5` | Secondary accent: success, tags, secondary CTA |
| Deep Purple | `#6b4fa7` | Hover/active state for purple elements |
| Light Purple | `#a78fd4` | Badge backgrounds, subtle highlights |
| Light Mint | `#d0f0e4` | Success message backgrounds |
| Charcoal | `#4a4a5a` | Secondary text, descriptions |
| Warm Gray | `#6b6b7a` | Tertiary text, metadata |
| Medium Gray | `#9a9aaa` | Placeholder, disabled text |
| Light Gray | `#c8c8d4` | Borders, dividers |
| Pale Gray | `#f0eef4` | Hover surface on white cards |
| Tinted Surface | `#f8f5fc` | Featured card backgrounds |

### Font Declarations

```css
font-family: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors -- Primary */
  --color-lavender: #e8e0f0;
  --color-mint-bg: #d8f0e8;
  --color-white: #ffffff;
  --color-charcoal: #2d2d3d;
  --color-purple: #8b6cc7;

  /* Colors -- Accent */
  --color-mint: #5cb8a5;
  --color-deep-purple: #6b4fa7;
  --color-light-purple: #a78fd4;
  --color-light-mint: #d0f0e4;

  /* Colors -- Neutral Scale */
  --color-secondary-text: #4a4a5a;
  --color-warm-gray: #6b6b7a;
  --color-medium-gray: #9a9aaa;
  --color-light-gray: #c8c8d4;
  --color-pale-gray: #f0eef4;

  /* Colors -- Surfaces */
  --color-surface-primary: #ffffff;
  --color-surface-tinted: #f8f5fc;
  --color-surface-gradient: linear-gradient(135deg, #e8e0f0, #d8f0e8);

  /* Colors -- Borders */
  --color-border-default: rgba(45, 45, 61, 0.06);
  --color-border-accent: rgba(139, 108, 199, 0.3);
  --color-border-light: rgba(45, 45, 61, 0.06);

  /* Colors -- Shadows */
  --shadow-purple: rgba(139, 108, 199, 0.08);
  --shadow-purple-medium: rgba(139, 108, 199, 0.12);
  --shadow-soft: rgba(45, 45, 61, 0.06);
  --shadow-deep: rgba(45, 45, 61, 0.15);

  /* Typography -- Families */
  --font-display: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography -- Sizes */
  --text-display-hero: 64px;
  --text-section-heading: 40px;
  --text-sub-heading: 28px;
  --text-body-large: 20px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number: 56px;
  --text-label: 13px;
  --text-cta: 15px;

  /* Typography -- Weights */
  --weight-display: 700;
  --weight-heading: 600;
  --weight-body-medium: 500;
  --weight-body: 400;
  --weight-label: 600;

  /* Typography -- Line Heights */
  --leading-display: 1.10;
  --leading-heading: 1.15;
  --leading-sub-heading: 1.20;
  --leading-body-large: 1.60;
  --leading-body: 1.65;
  --leading-small: 1.50;
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
  --space-max: 80px;

  /* Borders */
  --radius-card: 20px;
  --radius-button: 12px;
  --radius-pill: 24px;
  --radius-icon: 14px;

  /* Shadows -- Composed */
  --shadow-card: rgba(139,108,199,0.08) 0px 4px 20px, rgba(45,45,61,0.04) 0px 1px 4px;
  --shadow-featured: rgba(139,108,199,0.12) 0px 8px 32px, rgba(45,45,61,0.06) 0px 2px 8px;
}
```

### System Font Fallbacks
- **Sans-serif (if Plus Jakarta Sans fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
