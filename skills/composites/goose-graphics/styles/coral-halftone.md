# Coral Halftone

Coral-red ground with an oversized halftone-dot field forming a soft silhouette behind the type. Compact dark-brown sans for headlines, with one massive numeral anchoring the bottom-right. The dot field is the artwork — not background texture, but a full-poster image rendered as a regular grid of dots that vary in size to imply form. Reads like a lab annual / archive cover.

> Full prose reference: `styles/_full/coral-halftone.md`

## Palette

| Hex | Role |
|-----|------|
| `#F36B5B` | Coral red — primary background |
| `#3D1A14` | Espresso brown — primary text + halftone dots |
| `#FFFFFF` | White — never a background, only used in tiny accents |
| `#E45C4D` | Coral deep — bottom band / hover |
| `#5C2A20` | Bark — soft eyebrow text |
| `#FFD9CF` | Coral mist — subtle subtitle text |
| `#2A0E08` | Near black — extreme accent only |
| `#F89A8B` | Coral light — dot grid lighter dots |
| `#A23A2D` | Brick — caption muted text |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Archivo', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Numeral Mark | Archivo | 360px | 800 | 0.85 | -10px |
| Display Hero | Archivo | 56px | 800 | 1.00 | -1px |
| Section Heading | Archivo | 32px | 700 | 1.10 | -0.5px |
| Body | Archivo | 16px | 500 | 1.50 | 0 |
| Eyebrow / Footer | Archivo | 13px | 600 | 1.40 | 0.4px |

**Principles**

- One huge numeral (issue number, edition, year) anchors the lower-right of the canvas — sized at least 4× the headline.
- Headlines are short, often three stacked words, lowercase, in espresso brown.
- The halftone dot field is generated from a regular grid (typically 36×52 cells) where the dot radius encodes a soft silhouette or gradient.

## Layout

- Coral-red full-bleed background. No edge frame.
- A halftone dot grid covers the upper 60–70% of the canvas. Dots are espresso-brown circles arranged on a regular grid; radii vary from 2px (near-empty) to 10px (full) to imply a portrait or abstract shape.
- Headline sits on the lower band, left side, in 3 short lines.
- Massive numeral (issue / year / edition mark) sits lower-right, espresso brown, weight 800.
- Tiny brand line / caption pinned to bottom-left in 13px.

## Do / Don't

**Do**

- Use coral red as the only background — the halftone dots are the only "image."
- Build the dot field as a real grid of SVG circles, not a CSS pattern.
- Anchor one massive numeral lower-right, sized many times the headline.
- Stack headlines lowercase, 3 short lines, espresso brown.
- Keep edge padding tight — the dot field nearly touches the edges.

**Don't**

- Don't introduce a second background color. Coral is the brand.
- Don't use a noise filter or bitmap halftone — it must be a real circle grid.
- Don't uppercase the headline. Lowercase keeps it editorial.
- Don't put images or photography into the layout — the dots replace photography.
- Don't add drop shadows or rounded panels.

## CSS snippets

### `:root` variables

```css
:root {
  --c-coral: #F36B5B;
  --c-coral-deep: #E45C4D;
  --c-coral-light: #F89A8B;
  --c-coral-mist: #FFD9CF;
  --c-espresso: #3D1A14;
  --c-bark: #5C2A20;
  --c-brick: #A23A2D;
  --c-near-black: #2A0E08;

  --font: 'Archivo', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Hero with halftone field + numeral mark

```html
<div style="background:#F36B5B; padding:48px 40px 40px; min-height:1350px; position:relative;">
  <p style="font-family:'Archivo',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.4px; color:#3D1A14; margin:0 0 24px;">Camara&trade; Laboratory Inc.</p>
  <!-- Halftone dot grid: 36 cols × 30 rows -->
  <svg viewBox="0 0 1000 850" width="100%" height="auto" style="display:block;">
    <g fill="#3D1A14">
      <!-- Generate cells; radii imply a soft circle in center -->
      <!-- Replace with full grid in production -->
      <circle cx="40" cy="40" r="3"/>
      <circle cx="80" cy="40" r="3"/>
      <circle cx="500" cy="400" r="9"/>
      <circle cx="540" cy="400" r="9"/>
      <circle cx="460" cy="400" r="9"/>
      <!-- ...complete grid in real export -->
    </g>
  </svg>
  <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:48px;">
    <h2 style="font-family:'Archivo',sans-serif; font-size:56px; font-weight:800; line-height:1.00; letter-spacing:-1px; color:#3D1A14; margin:0;">
      Selected<br>Lockdown<br>works
    </h2>
    <p style="font-family:'Archivo',sans-serif; font-size:360px; font-weight:800; line-height:0.85; letter-spacing:-10px; color:#3D1A14; margin:0;">19</p>
  </div>
</div>
```

### Halftone helper (programmatic dot grid)

```html
<!-- For a 36×30 grid, emit cells in a loop:
  for (y=0; y<30; y++) for (x=0; x<36; x++)
    radius = clamp( silhouette(x,y) , 1 , 10 )
    <circle cx={x*28+14} cy={y*28+14} r={radius} fill="#3D1A14"/>
-->
```
