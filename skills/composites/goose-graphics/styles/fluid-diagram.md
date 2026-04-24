# Fluid Diagram

Coral red border framing a dark maroon panel with fluid connection diagrams — flowing curved lines, pill-shaped nodes, and circular junction points in pink and coral. Tech-meets-art aesthetic for connection/flow concepts. Large sans-serif text anchored to corners.

> Full prose reference: `styles/_full/fluid-diagram.md`

## Palette

| Hex | Role |
|-----|------|
| `#E8453C` | Coral red — outer frame / border background |
| `#2D1B2E` | Dark maroon — inner panel background |
| `#F2A0A0` | Soft pink — node fills, pill shapes |
| `#E8665C` | Coral — flowing lines, curves |
| `#F5C4B8` | Light coral — secondary line accents |
| `#FFFFFF` | White — primary text |
| `rgba(255,255,255,0.70)` | White 70 — secondary text |
| `rgba(255,255,255,0.40)` | White 40 — tertiary text |
| `#3D2540` | Deep maroon — junction circle strokes |
| `#C44035` | Dark coral — hover/active accents |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

- **Display:** `'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body / Metadata:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Space Grotesk | 56px | 400 | 1.15 | -1px |
| Section Heading | Space Grotesk | 40px | 500 | 1.10 | -0.5px |
| Sub-heading | Space Grotesk | 28px | 500 | 1.20 | 0 |
| Body Large | Inter | 18px | 300 | 1.65 | 0.2px |
| Body | Inter | 15px | 400 | 1.60 | 0.2px |
| Metadata | Inter | 11px | 500 | 1.30 | 1px UPPER |
| Caption | Inter | 10px | 400 | 1.30 | 0.8px |
| Big Number | Space Grotesk | 72px | 700 | 1.00 | -1.5px |

**Principles**

- Display text is light-weight (400), lowercase/sentence-case — conversational, human.
- Two text anchors: one top-left, one bottom-right — framing the diagram.
- Inter 300 for body — quiet, subordinate to the visual diagram.

## Layout

- Outer frame: `#E8453C` coral red, acts as a visible border (24-40px).
- Inner panel: `#2D1B2E` dark maroon, contains the diagram.
- Fluid diagram elements: curved SVG paths (coral lines), pill-shaped divs (pink fills with dark maroon "eye" cutouts), circular junctions (dashed/dotted circles).
- Text anchored to corners of the inner panel — top-left and bottom-right.
- Diagram flows horizontally through the center.
- Small annotation labels (Inter 10px) near junction points.

## Do / Don't

**Do**

- Use the coral frame + maroon panel as the signature two-layer layout.
- Draw fluid curved lines using SVG `<path>` with bezier curves in coral.
- Build pill-shaped nodes with `border-radius: 999px` in soft pink.
- Add circular junction points with dashed borders.
- Anchor display text to opposite corners (top-left, bottom-right).

**Don't**

- Don't use straight lines — everything flows with curves.
- Don't skip the outer coral frame — it defines the style.
- Don't use serif fonts — this is geometric/technical.
- Don't use bright white backgrounds — dark maroon panel is essential.
- Don't crowd the diagram — let connection paths breathe.

## CSS snippets

### `:root` variables

```css
:root {
  --color-coral: #E8453C;
  --color-maroon: #2D1B2E;
  --color-pink: #F2A0A0;
  --color-coral-line: #E8665C;
  --color-light-coral: #F5C4B8;
  --color-white: #FFFFFF;
  --color-deep: #3D2540;

  --font-display: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Framed diagram hero

```html
<div style="background:#E8453C; padding:32px; min-height:100vh;">
  <div style="background:#2D1B2E; padding:48px; min-height:calc(100vh - 64px); position:relative; overflow:hidden;">
    <!-- Top-left text -->
    <h1 style="font-family:'Space Grotesk',sans-serif; font-size:56px; font-weight:400; line-height:1.15; letter-spacing:-1px; color:#fff; margin:0;">we help people</h1>

    <!-- Fluid diagram (SVG) -->
    <svg width="100%" height="200" viewBox="0 0 800 200" style="margin:40px 0;" fill="none">
      <!-- Curved flow line -->
      <path d="M0 100 Q200 40 400 100 Q600 160 800 100" stroke="#E8665C" stroke-width="2" fill="none"/>
      <!-- Pill node -->
      <rect x="100" y="80" width="120" height="40" rx="20" fill="#F2A0A0"/>
      <circle cx="160" cy="100" r="8" fill="#2D1B2E"/>
      <!-- Junction circle -->
      <circle cx="400" cy="100" r="24" stroke="#3D2540" stroke-width="1" stroke-dasharray="4 3" fill="none"/>
      <circle cx="400" cy="100" r="6" fill="#E8665C"/>
      <!-- Pill node 2 -->
      <rect x="580" y="80" width="120" height="40" rx="20" fill="#F2A0A0"/>
      <circle cx="640" cy="100" r="8" fill="#2D1B2E"/>
    </svg>

    <!-- Bottom-right text -->
    <p style="font-family:'Space Grotesk',sans-serif; font-size:56px; font-weight:400; line-height:1.15; letter-spacing:-1px; color:#fff; margin:0; text-align:right; position:absolute; bottom:48px; right:48px;">stay connected</p>

    <!-- Caption -->
    <p style="font-family:'Inter',sans-serif; font-size:10px; font-weight:400; letter-spacing:0.8px; color:rgba(255,255,255,0.40); margin:0; position:absolute; bottom:48px; left:48px;">Illustrations  Fluid Diagrams</p>
  </div>
</div>
```

### Stat block

```html
<div style="background:#E8453C; padding:24px;">
  <div style="background:#2D1B2E; padding:48px; text-align:center;">
    <p style="font-family:'Space Grotesk',sans-serif; font-size:72px; font-weight:700; line-height:1.00; letter-spacing:-1.5px; color:#fff; margin:0 0 12px;">47%</p>
    <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:500; letter-spacing:1px; text-transform:uppercase; color:rgba(255,255,255,0.70); margin:0;">CONNECTION RATE</p>
  </div>
</div>
```

### CTA

```html
<a style="display:inline-block; background:#E8453C; color:#fff; font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:14px 28px; border-radius:6px;">Get Connected</a>
```
