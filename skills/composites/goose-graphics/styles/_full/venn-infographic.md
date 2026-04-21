# Design Style: Venn Infographic

## 1. Visual Theme & Atmosphere

Venn Infographic is the design language of the friendly modern business explainer — the visual vocabulary shared by Harvard Business Review explainers, Notion blog post hero illustrations, and McKinsey-style productivity carousels. It is clean but never cold, editorial but never stiff. The entire composition sits on a warm off-white canvas (`#F6F5F2`) that reads as premium paper stock under soft studio light. Against this canvas, a single Inter typeface does all the work — a near-black (`#1A1A1A`) 700-weight headline at the top left, a quiet mid-gray subtitle underneath, and the rest of the composition falls to a signature illustrative device: a three-circle Venn diagram rendered in pastel sage, coral, and soft blue at ~70% opacity so the overlaps mix into muted tertiary zones.

The Venn diagram is the identity. Three big translucent circles (~260px each, overlapping by a third) create a classical framework diagram that feels both academic and approachable. The colors — sage green `#B8D4A8`, coral `#E8A89E`, and soft blue `#A8C4D8` — are deliberately desaturated. They are the colors of a grade-school science textbook reimagined for a 2026 productivity blog: playful enough to invite, muted enough to stay credible in a C-suite context. Floating white info cards with barely-there drop shadows (`0 4px 16px rgba(0,0,0,0.06)`) anchor to each circle, each containing an outlined circular icon, a small number label (`01`, `02`, `03` in near-black), a bold short heading, and two lines of gray body text. The cards feel like they were plucked from a Notion document and pinned to the diagram — which is precisely the mood.

The result is a style that solves a specific problem: explaining a 3-part framework without looking like a PowerPoint deck. It shines brightest when the content has a natural trinity (three skills, three pillars, three overlapping forces), but the system is flexible enough to carry single-topic infographics, stat displays, and quote blocks through the same visual grammar. Think of it as the design equivalent of an HBR 1-minute explainer — clear, warm, and unmistakably editorial.

**Key Characteristics:**
- Warm off-white background (`#F6F5F2`) — not pure white, not gray, a slightly beige paper tone
- Near-black (`#1A1A1A`) Inter 700 headlines at 36–44px with tight `-0.3px` tracking, left-aligned
- Mid-gray (`#6B6B6B`) Inter 400 subtitles at 16–18px, generous 1.55 line height
- Signature Venn diagram: three 260px circles in sage `#B8D4A8`, coral `#E8A89E`, blue `#A8C4D8` at 70% opacity
- Circle overlap creates visible tertiary mix zones — never use `mix-blend-mode: normal`
- Floating white cards with 12px border-radius and subtle shadow `0 4px 16px rgba(0,0,0,0.06)`
- Outlined circular icons (1.5px stroke, 44px diameter, near-black stroke on white fill)
- Numbered labels (`01`, `02`, `03`) in Inter 700 at 20–24px placed inside each colored circle
- Card internal layout: icon top, number, bold heading, 2-line gray body — strict rhythm
- Single Inter font family across display and body, weights 400/600/700 only
- Never any hard borders on cards — elevation comes from shadow, not line
- Friendly-editorial mood — warm, clean, modern corporate, never cold or techy

## 2. Color Palette & Roles

### Primary
- **Paper** (`#F6F5F2`): Primary background. A warm off-white that reads as premium matte paper stock. Never swap for pure white.
- **Near-Black** (`#1A1A1A`): Primary text, headlines, numbered labels, icon strokes. Deep enough to command, soft enough to avoid harshness.
- **Sage Green** (`#B8D4A8`): First Venn circle fill. A dusty, desaturated green — never saturated, never bright.

### Accent (Venn Trio)
- **Coral** (`#E8A89E`): Second Venn circle fill. Warm salmon-pink, medium saturation.
- **Soft Blue** (`#A8C4D8`): Third Venn circle fill. Dusty powder blue with a hint of gray.
- **All three are always rendered at `opacity: 0.7`** so overlapping regions produce muted tertiary mixes (sage+coral → warm olive; sage+blue → teal-gray; coral+blue → mauve).

### Neutral Scale
- **Card White** (`#FFFFFF`): Floating info card background — this is the one place pure white is allowed, because the warm paper canvas behind it creates visible contrast.
- **Secondary Text** (`#6B6B6B`): Subtitles, card body text, descriptions, captions.
- **Tertiary Text** (`#9A9A9A`): Metadata, small labels, low-priority supporting copy.
- **Muted Divider** (`#E8E6E0`): Subtle dividers, hairlines, input borders when needed.
- **Icon Stroke Soft** (`#2A2A2A`): Outlined icon strokes — slightly softer than headline near-black for visual weight balance.

### Surface & Borders
- **Surface Primary** (`#FFFFFF`): Card and container backgrounds. Cards rely on shadow, not borders, for definition.
- **Surface Inset** (`#F0EEE8`): Slightly darker paper tone for recessed panels, code blocks, or subtle section differentiation.
- **Border Hairline** (`rgba(0,0,0,0.06)`): Only used when a card needs a whisper of edge definition in light-on-light scenarios.
- **Divider Rule** (`#E8E6E0`): Horizontal rules between sections.
- **No accent borders.** Elevation is communicated exclusively through shadow.

### Shadow Colors
- **Shadow Card** (`rgba(0, 0, 0, 0.06)`): Standard floating card shadow. Soft and barely perceptible.
- **Shadow Elevated** (`rgba(0, 0, 0, 0.10)`): Featured card or modal shadow.
- **Shadow Deep** (`rgba(0, 0, 0, 0.14)`): Overlay and dropdown shadows.
- **Shadow Ambient** (`rgba(0, 0, 0, 0.03)`): Sublimnal depth for the page canvas on infographics.

### Palette Temperature
Overall **warm-neutral**. The paper background carries the warmth; the Venn trio supplies just enough color variety to read as illustrated without breaking the editorial calm. Never introduce cool grays or pure whites outside of the card surface.

## 3. Typography Rules

### Font Families

**Google Fonts CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body**: `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

This is a **single-family** style. Inter handles every text role through weight and size differentiation. No serif, no display face, no decorative type. The restraint is the point.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Inter | 44px | 700 | 1.15 | -0.3px | Top-level headline. Always left-aligned. Often 2 lines. |
| Section Heading | Inter | 36px | 700 | 1.20 | -0.3px | Section titles on infographics. |
| Sub-heading | Inter | 22px | 700 | 1.25 | -0.2px | Card headings, category titles. |
| Body Large | Inter | 18px | 400 | 1.55 | 0px | Subtitles, lead paragraphs — `#6B6B6B`. |
| Body | Inter | 16px | 400 | 1.55 | 0px | Card body text, descriptions — `#6B6B6B`. |
| Body Bold | Inter | 16px | 600 | 1.55 | 0px | Emphasis within body copy. |
| Small / Caption | Inter | 13px | 500 | 1.50 | 0.1px | Metadata, footer attributions. |
| Big Number (Card) | Inter | 20px | 700 | 1.00 | 0px | The `01` / `02` / `03` label on cards. |
| Big Number (Venn) | Inter | 24px | 700 | 1.00 | -0.2px | The number placed inside each Venn circle. |
| Numbered Label Small | Inter | 13px | 600 | 1.00 | 0.5px | Uppercase "STEP 01" or similar tags. |
| CTA Text | Inter | 15px | 600 | 1.00 | 0.2px | Button text. |

### Principles
- **Single family, weight differentiation.** Hierarchy is driven entirely by Inter at 400, 600, and 700. Never mix in a serif or display face — the restraint is the identity.
- **Tight tracking on headlines.** Display and section headings always use `-0.3px` letter-spacing. This makes 700-weight Inter read as confident rather than chunky.
- **Left-aligned is default.** Headlines, subtitles, and card content all align left. Centered text is reserved for the numbered labels inside Venn circles.
- **Generous body line-height.** Body copy uses 1.55 leading to breathe — this is a friendly-editorial style, not a dense technical one.
- **Secondary text never below 13px.** Keep all supporting copy legible; this style favors clarity over density.
- **Mixed case always.** Only small framework labels (e.g., "STEP 01", "FRAMEWORK") use uppercase, with `0.5px` positive tracking.

## 4. Component Patterns

### Title Block (Hero / Header Section)

```html
<div style="background-color: var(--color-paper); padding: 80px 80px 40px; text-align: left;">
  <h1 style="font-family: var(--font-body); font-size: 44px; font-weight: 700; line-height: 1.15; letter-spacing: -0.3px; color: var(--color-near-black); margin: 0 0 20px; max-width: 720px;">Decision-Making Skills<br>Under Intense Pressure</h1>
  <p style="font-family: var(--font-body); font-size: 18px; font-weight: 400; line-height: 1.55; color: var(--color-secondary); margin: 0; max-width: 520px;">Stay calm, assess clearly, and act decisively when it matters most.</p>
</div>
```

### Venn Diagram — Signature Component

The Venn diagram is the identity of this style. Use it whenever the content naturally groups into three overlapping concepts. It is built from three absolutely-positioned div circles with `opacity: 0.7` so overlaps mix visibly.

```html
<div style="position: relative; width: 560px; height: 520px; margin: 0 auto;">
  <!-- Circle 1: Sage Green (top) -->
  <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 280px; height: 280px; border-radius: 50%; background-color: #B8D4A8; opacity: 0.7;"></div>

  <!-- Circle 2: Coral (bottom-left) -->
  <div style="position: absolute; bottom: 40px; left: 60px; width: 280px; height: 280px; border-radius: 50%; background-color: #E8A89E; opacity: 0.7;"></div>

  <!-- Circle 3: Soft Blue (bottom-right) -->
  <div style="position: absolute; bottom: 40px; right: 60px; width: 280px; height: 280px; border-radius: 50%; background-color: #A8C4D8; opacity: 0.7;"></div>

  <!-- Number label inside Sage circle -->
  <div style="position: absolute; top: 120px; left: 50%; transform: translateX(-50%); font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.2px;">01</div>

  <!-- Number label inside Coral circle -->
  <div style="position: absolute; bottom: 160px; left: 140px; font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.2px;">03</div>

  <!-- Number label inside Blue circle -->
  <div style="position: absolute; bottom: 160px; right: 140px; font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.2px;">02</div>
</div>
```

**Notes on the Venn:**
- Each circle is `280px × 280px` with `border-radius: 50%`. On Story format, scale up to `360px × 360px`.
- Overlap math: the top circle is centered horizontally; the two bottom circles are inset by `60px` from each side. This creates the classical 1/3 overlap geometry.
- `opacity: 0.7` is non-negotiable. The tertiary mix zones where circles overlap are a key visual signal.
- Alternative: use `mix-blend-mode: multiply` if you want slightly richer overlap colors against the warm paper background. Both work; `opacity` is more predictable across renderers.
- Place the numbered label (`01`, `02`, `03`) inside each circle's unique non-overlapping region, centered, using Inter 700 at 24px.

### Info Card — Main Content Unit

The floating info card is the second critical component. It pairs with the Venn diagram (one card per circle) but also works standalone in infographic vertical layouts.

```html
<div style="background-color: #FFFFFF; border-radius: 12px; padding: 24px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); width: 220px; font-family: 'Inter', sans-serif;">
  <!-- Outlined circular icon -->
  <div style="width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #1A1A1A; display: flex; align-items: center; justify-content: center; margin: 0 0 14px;">
    <!-- Inline SVG icon goes here, stroke: #1A1A1A, stroke-width: 1.5 -->
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  </div>
  <!-- Bold short heading -->
  <h3 style="font-size: 17px; font-weight: 700; line-height: 1.25; letter-spacing: -0.2px; color: #1A1A1A; margin: 0 0 8px;">Pause and Breathe</h3>
  <!-- 2-line gray body -->
  <p style="font-size: 14px; font-weight: 400; line-height: 1.55; color: #6B6B6B; margin: 0;">Take a deep breath and respond with calm clarity.</p>
</div>
```

**Card rules:**
- Background always pure white `#FFFFFF` (only place in the style where pure white is allowed).
- Border-radius always `12px` — no exceptions.
- Shadow always `0 4px 16px rgba(0,0,0,0.06)`. Subtle. Never heavy.
- Internal padding `24px 22px`.
- Icon diameter `44px`, stroke width `1.5px`, color near-black.
- Fixed vertical rhythm: icon → 14px gap → heading → 8px gap → body.
- Cards never have visible borders. Shadow alone defines them.
- Card width on carousels/slides: ~220–240px. On Story format: 260–280px.

### Venn + Cards Composite Layout

When combining the Venn diagram with its info cards, position the cards around the diagram anchored to each circle. This is the signature hero composition.

```html
<div style="position: relative; padding: 60px; max-width: 960px; margin: 0 auto;">
  <!-- Venn diagram goes here (see above) -->

  <!-- Card anchored to top-right of sage circle -->
  <div style="position: absolute; top: 40px; right: 80px; /* info card styles from above */">…</div>

  <!-- Card anchored to bottom-left of coral circle -->
  <div style="position: absolute; bottom: 60px; left: 40px;">…</div>

  <!-- Card anchored to bottom-right of blue circle -->
  <div style="position: absolute; bottom: 60px; right: 40px;">…</div>
</div>
```

### Stat Display

```html
<div style="background-color: #FFFFFF; border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); text-align: left; max-width: 280px;">
  <p style="font-family: 'Inter', sans-serif; font-size: 48px; font-weight: 700; line-height: 1.0; letter-spacing: -1px; color: #1A1A1A; margin: 0 0 8px;">73%</p>
  <p style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.55; color: #6B6B6B; margin: 0;">of leaders say calm decision-making is the most valuable skill under pressure.</p>
</div>
```

### Comparison Grid (2-column)

```html
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
  <div style="background-color: #FFFFFF; border-radius: 12px; padding: 28px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
    <p style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9A9A9A; margin: 0 0 12px;">BEFORE</p>
    <h3 style="font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 700; line-height: 1.25; letter-spacing: -0.2px; color: #1A1A1A; margin: 0 0 10px;">Reactive Decisions</h3>
    <p style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.55; color: #6B6B6B; margin: 0;">Stress drives impulsive choices and costly mistakes.</p>
  </div>
  <div style="background-color: #FFFFFF; border-radius: 12px; padding: 28px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
    <p style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9A9A9A; margin: 0 0 12px;">AFTER</p>
    <h3 style="font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 700; line-height: 1.25; letter-spacing: -0.2px; color: #1A1A1A; margin: 0 0 10px;">Calm Clarity</h3>
    <p style="font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 400; line-height: 1.55; color: #6B6B6B; margin: 0;">Grounded leaders respond with intention and purpose.</p>
  </div>
</div>
```

### List Item

```html
<div style="display: flex; align-items: flex-start; gap: 16px; padding: 16px 0;">
  <div style="flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background-color: #B8D4A8; opacity: 0.85; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: #1A1A1A;">1</div>
  <div>
    <h4 style="font-family: 'Inter', sans-serif; font-size: 17px; font-weight: 700; line-height: 1.3; letter-spacing: -0.2px; color: #1A1A1A; margin: 0 0 4px;">Pause before reacting</h4>
    <p style="font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 400; line-height: 1.55; color: #6B6B6B; margin: 0;">Take a deep breath and let the first impulse pass.</p>
  </div>
</div>
```

### Quote Block

```html
<div style="background-color: #FFFFFF; border-radius: 12px; padding: 36px 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); max-width: 560px;">
  <p style="font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 600; line-height: 1.4; letter-spacing: -0.2px; color: #1A1A1A; margin: 0 0 20px;">"The best decisions are the ones made with a quiet mind, not a loud one."</p>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #A8C4D8; opacity: 0.7;"></div>
    <p style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #6B6B6B; margin: 0;">Ana Rivera<span style="color: #9A9A9A; font-weight: 400;"> · VP Operations</span></p>
  </div>
</div>
```

### CTA Block

```html
<div style="text-align: center; padding: 60px 40px;">
  <h2 style="font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 700; line-height: 1.20; letter-spacing: -0.3px; color: #1A1A1A; margin: 0 0 16px;">Ready to lead with calm clarity?</h2>
  <p style="font-family: 'Inter', sans-serif; font-size: 17px; font-weight: 400; line-height: 1.55; color: #6B6B6B; max-width: 480px; margin: 0 auto 32px;">Start practicing the three-part framework that grounds high-stakes decisions.</p>
  <a style="display: inline-block; background-color: #1A1A1A; color: #FFFFFF; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; text-decoration: none; padding: 16px 36px; border-radius: 999px;">Get the Framework</a>
</div>
```

## 5. Layout Principles

### Spacing Scale
- **4px**: Micro gap — between icon and its inner content.
- **8px**: Tight gap — between card heading and body text.
- **12px**: Small gap — between number label and adjacent heading.
- **14px**: Card rhythm gap — between icon and heading inside info cards.
- **16px**: Base gap — between body paragraphs.
- **20px**: Medium gap — between cards in a grid.
- **24px**: Card internal padding — standard inside info cards.
- **32px**: Component gap — between major components within a section.
- **48px**: Section gap — between sections on an infographic.
- **60px**: Outer padding — default canvas padding on carousels, slides, posters.
- **80px**: Hero padding — top/bottom of hero sections on infographics.
- **120px**: Story padding — vertical padding on Story format.

### Format Padding
| Format | Outer Padding | Content Max-Width |
|--------|---------------|-------------------|
| Carousel (1080x1080) | 60px all sides | 960px |
| Infographic (1080xN) | 60px left/right, 80px top/bottom | 960px |
| Slides (1920x1080) | 80px all sides | 1760px |
| Poster (1080x1350) | 60px left/right, 80px top/bottom | 960px |
| **Story (1080x1920)** | **60px left/right, 120px top/bottom** | **960px** |

### Alignment & Grid
- **Primary alignment**: Left-aligned for headlines, subtitles, card content. Center-aligned only for the Venn diagram itself and CTA blocks.
- **Hero composition**: Title and subtitle top-left, Venn + cards composite filling the center and lower portion of the canvas.
- **Card grid**: Info cards can also stack in vertical 3-column grids (no Venn) or be arranged asymmetrically around the Venn diagram.
- **Vertical rhythm**: 48px between infographic sections, 32px between components within a section, 20px between cards in a row.
- **Visual gravity**: The Venn diagram is the heaviest element. Position it in the visual center-lower third. The headline anchors the top-left.
- **No hard rules or dividers**. Sections separate via whitespace only.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, background `#F6F5F2` | Page canvas, hero backgrounds |
| Ambient (Level 1) | `0 1px 3px rgba(0,0,0,0.03)` | Subtle hover states, quiet surfaces |
| Card (Level 2) | `0 4px 16px rgba(0,0,0,0.06)` | **Standard info card shadow — the signature** |
| Elevated (Level 3) | `0 8px 24px rgba(0,0,0,0.10)` | Featured cards, hover states on standard cards |
| Overlay (Level 4) | `0 20px 40px rgba(0,0,0,0.14)` | Modals, dropdowns, tooltips |

### Border Treatments
- **Cards**: No border. Ever. Elevation from `0 4px 16px rgba(0,0,0,0.06)` shadow only.
- **Icon circles**: `1.5px solid #1A1A1A` with `border-radius: 50%`. Stroke is the defining feature.
- **Divider rules**: `1px solid #E8E6E0` — only used when absolutely necessary between sections in long infographics. Prefer whitespace.
- **Venn circles**: No border. Fill only, at `opacity: 0.7`.

### Surface Hierarchy
On the warm paper canvas, elevation is communicated almost entirely through shadow intensity:
1. **Background** (`#F6F5F2`) — the warm canvas.
2. **Venn circles** (sage/coral/blue at 0.7 opacity) — sit directly on the canvas with no shadow, creating a painted-on effect.
3. **Cards** (`#FFFFFF` + subtle shadow) — float above the canvas, defined by shadow alone.
4. **CTA buttons** (`#1A1A1A`) — the strongest visual anchor, dark against light for maximum contrast.

## 7. Do's and Don'ts

### Do
- **Use the pastel Venn trio exactly as specified.** `#B8D4A8` sage, `#E8A89E` coral, `#A8C4D8` blue at `opacity: 0.7`. This muted palette is the identity — substituting bright saturated versions destroys the warm editorial feel.
- Keep Venn circles translucent. Always `opacity: 0.7` (or `mix-blend-mode: multiply`). The visible overlap mixing is the whole point.
- Use Inter at weights 400, 600, and 700 only. Never introduce a serif or second family.
- Apply `-0.3px` letter-spacing to all headlines at 36px+. This tightens 700-weight Inter to a confident, editorial feel.
- Use `0 4px 16px rgba(0,0,0,0.06)` for the standard card shadow. Subtle is non-negotiable.
- Round all cards to exactly `12px`. Round the Venn circles to `50%` (full circle). Round CTA buttons to `999px` (pill).
- Place numbered labels (`01`, `02`, `03`) inside each colored Venn circle using Inter 700 at 24px, centered in the circle's unique region.
- Use outlined circular icons at `44px` diameter with `1.5px` near-black stroke on white fill — never solid filled icons.
- Left-align headlines and subtitles. Reserve centering for the Venn diagram and CTA blocks.
- Use `#F6F5F2` as the background. The warm off-white is half the mood — never swap for pure white.
- Keep info cards sparse: icon, heading, 2-line body. Three elements max. Never overflow.
- Pair every card with its number label matching the Venn circle it anchors to — this creates the legend without needing one.

### Don't
- Don't use saturated or bright versions of the Venn colors. Sage is not kelly green. Coral is not red. Blue is not royal. If the pastel looks too quiet, you're doing it right.
- Don't add borders to info cards. Shadow alone — always.
- Don't use pure white (`#FFFFFF`) for the background. That pure-white look is cold and wrong for this style. Paper tone only.
- Don't introduce a second typeface. No Playfair, no Georgia, no serif accents. Single family only.
- Don't use heavy shadows. Maximum is `rgba(0,0,0,0.14)` for overlays. Card shadow stays at `0.06` alpha.
- Don't make Venn circles opaque. Without translucent overlap, the diagram reads as stacked shapes instead of a Venn.
- Don't use dot grids, gradients, or background textures. The warm paper canvas must stay clean.
- Don't use emoji or illustrated icons. Outlined line icons only, 1.5px stroke, monochrome near-black.
- Don't center-align body paragraphs. Only headlines in CTA blocks and numbered labels inside Venn circles are centered.
- Don't use more than one Venn diagram per composition. It's the signature element — repeating it dilutes the hero.
- Don't crowd the Venn with more than three info cards. One card per circle. If you have more than three concepts, use a vertical card list elsewhere on the page.
- Don't use uppercase for headlines. Only small 13px labels ("STEP 01", "FRAMEWORK") get uppercase + `0.5px` tracking.

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
- **Typography scale**: Display Hero at 40px (from 44px). Section Heading at 32px. Body Large at 17px. Body at 15px.
- **Padding**: 60px on all sides. Content area 960x960px.
- **Cover slide**: Headline top-left, subtitle below, Venn + 3 cards composite filling bottom two-thirds.
- **Content slides**: Left-aligned headline at top, one of: (a) single Venn + cards, (b) vertical list of 3 info cards, (c) stat display + supporting cards.
- **Card slides**: 3 info cards in a vertical stack with 20px gaps, or single featured card centered.
- **Swipe indicator**: Small gray dots at bottom center (6px diameter, `#9A9A9A`, active dot in `#1A1A1A`).

### Infographic (1080px wide, variable height) — **Primary Format**
- **This style shines brightest as infographics.** The Venn + card pattern can repeat vertically with different 3-concept groupings, creating a long-scroll editorial flow.
- **Typography**: Full-scale hierarchy. Display Hero at 44px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Section rhythm**: 48px vertical gap between sections. Each section is a self-contained "chapter" with a section heading (36px Inter 700), optional supporting text, and its signature component (Venn + cards, stat grid, comparison, or quote block).
- **Vertical composition pattern**: Hero (headline + Venn) → Section 1 (3 info cards vertical) → Section 2 (stat display) → Section 3 (second Venn, different trio of concepts) → Section 4 (comparison grid) → CTA footer.
- **Footer**: Small metadata in Inter 500 at 13px, `#9A9A9A`. Optional mini logo or URL.

### Slides (1920x1080px)
- **Typography scale up**: Display Hero at 56px. Section Heading at 44px. Body Large at 20px. Card headings at 22px.
- **Padding**: 80px all sides. Content area 1760x920px.
- **Layout**: Title slides use a left-half/right-half split — headline + subtitle left, Venn + cards right. Content slides left-align headline with ~60% width, Venn + cards composite right.
- **Title slides**: Headline top-left, subtitle below (`#6B6B6B`, 20px), Venn diagram positioned in the right half with info cards anchored asymmetrically.
- **Content slides**: Section heading (44px Inter 700), optional intro line, then either a Venn + cards composite or a 3-column card grid.
- **CTA slides**: Centered layout. Headline, subtitle, dark pill button.

### Poster (1080x1350px)
- **Typography**: Display Hero at 48px. Section Heading at 36px. Body at 16px.
- **Padding**: 60px left/right, 80px top/bottom.
- **Composition**: Top third for headline + subtitle (left-aligned). Middle half for the Venn diagram + cards composite (the hero element). Bottom zone for a closing statement and CTA.
- **Vertical flow**: Headline → Venn hero → closing bold statement → CTA pill.
- **Card placement**: Cards sit asymmetrically around the Venn — one top-right, two at bottom corners — to create visual balance.

### Story (1080x1920px) — **NEW**
- **Typography scale**: Display Hero at 52px. Section Heading at 40px. Body Large at 19px. Card headings at 19px.
- **Padding**: **60px left/right, 120px top/bottom** — the extra vertical padding frames the tall canvas.
- **Venn scales up ~30% bigger**: Circles at `360px × 360px` (instead of 280px). Overall Venn container ~720x680px. The larger diagram dominates the vertical format.
- **Composition**: Top third — headline + subtitle, left-aligned. Middle half — oversized Venn + cards composite, center-aligned. Bottom zone — CTA pill or closing line, centered.
- **Card sizing**: Info cards scale to 260–280px width, with slightly larger padding (`28px 26px`) to match the enlarged diagram.
- **Asymmetric card anchoring**: On Story format, arrange cards vertically along the sides — one top-right adjacent to the sage circle, one bottom-left adjacent to coral, one bottom-right adjacent to blue. This creates a flowing visual rhythm suited to the tall canvas.
- **Safe zones**: Keep critical content inside the inner 1080x1680 zone to account for Story UI overlays on Instagram/TikTok.

## 10. Agent Prompt Guide

### Quick Color Reference

| Name | Hex | Usage |
|------|-----|-------|
| Paper | `#F6F5F2` | Primary background (warm off-white) |
| Near-Black | `#1A1A1A` | Primary text, headlines, icon strokes |
| Sage Green | `#B8D4A8` | Venn circle 1 (at 0.7 opacity) |
| Coral | `#E8A89E` | Venn circle 2 (at 0.7 opacity) |
| Soft Blue | `#A8C4D8` | Venn circle 3 (at 0.7 opacity) |
| Card White | `#FFFFFF` | Info card backgrounds (only place pure white is used) |
| Secondary Text | `#6B6B6B` | Subtitles, body text, descriptions |
| Tertiary Text | `#9A9A9A` | Metadata, small labels |
| Surface Inset | `#F0EEE8` | Recessed panels, subtle backgrounds |
| Divider | `#E8E6E0` | Hairlines, section dividers |
| Shadow Card | `rgba(0,0,0,0.06)` | Standard card shadow alpha |

### Font Declarations

```css
/* Single family — Inter handles everything */
font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
```

### Google Fonts Link

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Root Variables

```css
:root {
  /* Colors — Primary */
  --color-paper: #F6F5F2;
  --color-near-black: #1A1A1A;
  --color-sage: #B8D4A8;

  /* Colors — Venn Accent Trio */
  --color-coral: #E8A89E;
  --color-soft-blue: #A8C4D8;
  --venn-opacity: 0.7;

  /* Colors — Neutral Scale */
  --color-card-white: #FFFFFF;
  --color-secondary: #6B6B6B;
  --color-tertiary: #9A9A9A;
  --color-muted-divider: #E8E6E0;
  --color-icon-stroke: #2A2A2A;

  /* Colors — Surfaces */
  --color-surface-primary: #FFFFFF;
  --color-surface-inset: #F0EEE8;
  --color-divider: #E8E6E0;
  --color-border-hairline: rgba(0, 0, 0, 0.06);

  /* Colors — Shadows */
  --shadow-ambient: 0 1px 3px rgba(0, 0, 0, 0.03);
  --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.06);
  --shadow-elevated: 0 8px 24px rgba(0, 0, 0, 0.10);
  --shadow-overlay: 0 20px 40px rgba(0, 0, 0, 0.14);

  /* Typography — Families */
  --font-display: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  /* Typography — Sizes */
  --text-display-hero: 44px;
  --text-section-heading: 36px;
  --text-sub-heading: 22px;
  --text-body-large: 18px;
  --text-body: 16px;
  --text-small: 13px;
  --text-big-number-card: 20px;
  --text-big-number-venn: 24px;
  --text-cta: 15px;

  /* Typography — Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* Typography — Line Heights */
  --leading-display: 1.15;
  --leading-heading: 1.20;
  --leading-sub-heading: 1.25;
  --leading-body: 1.55;
  --leading-small: 1.50;
  --leading-number: 1.00;

  /* Typography — Letter Spacing */
  --tracking-display: -0.3px;
  --tracking-heading: -0.3px;
  --tracking-sub: -0.2px;
  --tracking-body: 0px;
  --tracking-label: 0.5px;

  /* Spacing */
  --space-micro: 4px;
  --space-tight: 8px;
  --space-small: 12px;
  --space-card-rhythm: 14px;
  --space-base: 16px;
  --space-medium: 20px;
  --space-card-padding: 24px;
  --space-component: 32px;
  --space-section: 48px;
  --space-outer: 60px;
  --space-hero: 80px;
  --space-story: 120px;

  /* Borders */
  --radius-card: 12px;
  --radius-circle: 50%;
  --radius-pill: 999px;
  --stroke-icon: 1.5px;

  /* Venn Diagram Dimensions */
  --venn-circle-standard: 280px;
  --venn-circle-story: 360px;
  --venn-container-standard: 560px;
  --venn-container-story: 720px;
}
```

### System Font Fallbacks
- **Sans-serif (if Inter fails to load):** `-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

Inter is the only typeface. No fallback serif. If Inter unavailable, the system sans stack carries the full hierarchy through weight differentiation.
