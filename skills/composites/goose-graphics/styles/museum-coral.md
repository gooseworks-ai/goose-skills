# Museum Coral

Coral-pink poster face used as a museum exhibition wall — the kind you'd see for a natural-history show. Salmon-coral background, vintage scientific engraving illustrations (skeletons, fossils, animal anatomy) in off-white, with one heavy block-stack title in deep plum or cream condensed sans. A small dark-bordered date plate and a small institutional logo lockup sit at the corners. Reads like a gallery wall card blown up into poster scale.

> Full prose reference: `styles/_full/museum-coral.md`

## Palette

| Hex | Role |
|-----|------|
| `#F0978B` | Coral pink — primary background |
| `#F8DDD6` | Off-white cream — engraving illustrations |
| `#3F0E18` | Plum dark — primary text |
| `#5C1626` | Plum mid — date plate fill |
| `#B85A4D` | Coral deep — small text on light plates |
| `#FFEFE9` | Pale cream — small caption text |
| `#1A0508` | Near-black — institutional logo |
| `#E37869` | Coral mid — frame line |
| `#8B2D3C` | Wine — secondary text accent |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display:** `'Oswald', 'Helvetica Condensed', Helvetica, Arial, sans-serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Oswald | 80px | 700 | 0.95 | 0.5px UPPER |
| Date Plate | Oswald | 44px | 600 | 1.00 | 0.5px UPPER |
| Section Heading | Oswald | 28px | 600 | 1.10 | 0.5px UPPER |
| Body | Inter | 14px | 500 | 1.55 | 0.3px |
| Caption | Inter | 11px | 600 | 1.30 | 1px UPPER |
| Logo Lockup | Inter | 13px | 700 | 1.20 | 0.5px UPPER |

**Principles**

- Display is exclusively Oswald (or another condensed sans) in uppercase, stacked tightly.
- Title stacks 3–4 lines, each line sized to fit the column edge-to-edge.
- All body type is Inter at small sizes; type does not compete with the engraving illustration.

## Layout

- Coral-pink fills the canvas with 36px coral-deep frame line near the edge (a thin border ring, not a thick mat).
- One large engraving illustration (off-white) sits center-canvas, occupying ~50–60% of the area — skeleton, fossil, mammal anatomy, etc.
- Top-left or top-right: 3–4 line condensed-sans headline in cream or plum.
- A "date plate" — a small plum-dark rectangle with cream uppercase Oswald text announcing the exhibit run — sits over or beside the title.
- Bottom-left or bottom-right: small institutional logo lockup in dark plum.

## Do / Don't

**Do**

- Use coral-pink as the only background color.
- Render the central illustration as a single off-white engraving (line art only).
- Use Oswald uppercase for all display type, stacked 3–4 lines.
- Add one solid plum-dark date plate with cream uppercase type.
- Pin a small institutional logo lockup to a corner.

**Don't**

- Don't apply gradients to the background — solid coral only.
- Don't use multiple display faces — Oswald is the only display.
- Don't add modern photographic imagery; the central image must be vintage engraving / line art.
- Don't lowercase the headline. Always uppercase.
- Don't add drop shadows to the illustration — flat off-white silhouette only.

## CSS snippets

### `:root` variables

```css
:root {
  --c-coral: #F0978B;
  --c-coral-mid: #E37869;
  --c-coral-deep: #B85A4D;
  --c-cream: #F8DDD6;
  --c-cream-pale: #FFEFE9;
  --c-plum: #3F0E18;
  --c-plum-mid: #5C1626;
  --c-wine: #8B2D3C;
  --c-near-black: #1A0508;

  --font-display: 'Oswald', 'Helvetica Condensed', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Museum poster hero

```html
<div style="background:#F0978B; padding:48px; min-height:1350px; position:relative;">
  <!-- Frame line -->
  <div style="position:absolute; inset:32px; border:2px solid #E37869; pointer-events:none;"></div>

  <!-- Headline + date plate -->
  <div style="position:relative; z-index:2; display:flex; align-items:flex-start; justify-content:space-between; gap:24px;">
    <h1 style="font-family:'Oswald',sans-serif; font-size:80px; font-weight:700; line-height:0.95; letter-spacing:0.5px; text-transform:uppercase; color:#3F0E18; margin:0; max-width:60%;">MAMÍFEROS<br>DEL PASADO</h1>
    <div style="background:#3F0E18; color:#F8DDD6; padding:18px 22px; max-width:160px;">
      <p style="font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#F8DDD6; margin:0 0 4px;">DEL</p>
      <p style="font-family:'Oswald',sans-serif; font-size:44px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#F8DDD6; line-height:0.95; margin:0;">10 AL<br>30 DE</p>
      <p style="font-family:'Oswald',sans-serif; font-size:34px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#F8DDD6; line-height:0.95; margin:8px 0 0;">NO-<br>VIEM-<br>BRE</p>
    </div>
  </div>

  <!-- Central engraving (placeholder) -->
  <div style="position:relative; z-index:1; margin-top:48px; display:flex; justify-content:center; align-items:center; min-height:780px;">
    <svg viewBox="0 0 600 600" width="80%" style="display:block;">
      <g fill="#F8DDD6" stroke="#F8DDD6" stroke-width="1">
        <!-- Stylized skeleton silhouette: ribcage + spine -->
        <ellipse cx="300" cy="200" rx="80" ry="40"/>
        <path d="M260 220 Q300 320 340 220 L340 380 Q300 420 260 380 Z" fill="#F8DDD6"/>
        <line x1="300" y1="220" x2="300" y2="380" stroke="#F0978B" stroke-width="3"/>
        <path d="M260 240 Q220 260 200 320" stroke="#F8DDD6" stroke-width="6" fill="none"/>
        <path d="M340 240 Q380 260 400 320" stroke="#F8DDD6" stroke-width="6" fill="none"/>
      </g>
    </svg>
  </div>

  <!-- Bottom plate -->
  <div style="position:absolute; bottom:64px; left:64px; right:64px; display:flex; justify-content:space-between; align-items:flex-end;">
    <div>
      <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#3F0E18; margin:0;">Sala de Arte<br>Contemporáneo</p>
    </div>
    <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#3F0E18; margin:0;">MUSEO ARGENTINO<br>DE CIENCIAS NATURALES</p>
  </div>
</div>
```

### Date plate (standalone)

```html
<div style="display:inline-block; background:#3F0E18; color:#F8DDD6; padding:16px 20px;">
  <p style="font-family:'Oswald',sans-serif; font-size:32px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; line-height:1.0; margin:0;">DEL 10 AL 30 DE NOVIEMBRE</p>
</div>
```
