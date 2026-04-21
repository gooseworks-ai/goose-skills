# Vintage Duotone Poster

1950s letterpress poster. Forest green canvas with dusty pink as the entire type and duotone photo system. Oversized Oswald 900 impact word at 240px (ALL CAPS, nearly edge-to-edge) paired with a smaller tilted Alfa Slab One "emotional word" that overlaps it. Halftone dot patterns optional. Feels like a vintage concert poster or mid-century book jacket.

> Full prose reference: `styles/_full/vintage-duotone-poster.md`

## Palette

| Hex | Role |
|-----|------|
| `#2D4D3A` | Forest green — primary background (only canvas color) |
| `#EDB5A7` | Dusty pink — primary text, all accents, photo tint |
| `#1F3528` | Deep green — photo shadows, duotone deep |
| `#F5CFC6` | Pink highlight — photo highlights |
| `#D9948A` | Pink shadow — deep pink, rare emphasis |
| `rgba(237,181,167,0.65)` | Pink text muted — metadata |
| `rgba(237,181,167,0.35)` | Pink text faint — borders, divider rules |
| `#264030` | Green inset — rare recessed panel |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

- **Display Script:** `'Alfa Slab One', Georgia, 'Times New Roman', serif`
- **Display Impact:** `'Oswald', Impact, 'Arial Narrow', sans-serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Script | Alfa Slab One | 140px | 400 | 0.95 | -2px |
| Display Impact | Oswald | 240px | 700 | 0.85 | -4px UPPER |
| Section Heading | Oswald | 72px | 700 | 0.95 | -1px UPPER |
| Sub-heading | Oswald | 48px | 600 | 1.05 | 0 UPPER |
| Body Large | Inter | 22px | 500 | 1.55 | 0.3px |
| Body | Inter | 18px | 500 | 1.55 | 0.3px |
| Metadata Large | Oswald | 32px | 600 | 1.10 | 2px UPPER |
| Metadata | Oswald | 18px | 600 | 1.20 | 2px UPPER |
| Metadata Small | Oswald | 14px | 600 | 1.20 | 2.5px UPPER |
| Big Number | Oswald | 180px | 700 | 0.90 | -3px UPPER |
| CTA Label | Oswald | 24px | 700 | 1.00 | 3px UPPER |

**Principles**

- Alfa Slab One "emotional word" tilted `transform: rotate(-3deg)`, overlapping the Oswald impact word slightly.
- Oswald 700 impact word is the entire hero — edge to edge.
- Everything else (metadata, body) is Oswald tracked uppercase.

## Layout

- Full-bleed forest green `#2D4D3A` background.
- Photography: duotone-mapped into deep green → dusty pink.
- Apply halftone dot overlay via SVG or CSS radial-gradient pattern at 6-12px spacing for print feel (optional).
- Impact word fills 90-100% of frame width, bottom-aligned.
- "Emotional word" in script tucks into the top-left or right of the impact word, rotated -3°.

## Do / Don't

**Do**

- Duotone-map any photograph into deep-green and dusty-pink.
- Set the impact word at 240px Oswald 700 ALL CAPS, edge-to-edge.
- Tilt the Alfa Slab One emotional word -3° and overlap it with the impact word.
- Use Oswald 2px-tracked UPPER for all metadata and body substitute.
- Add optional halftone dot overlay for 1950s letterpress feel.

**Don't**

- Don't use any color outside forest green + dusty pink (plus their deeper shades).
- Don't use sentence-case display type — impact word is always UPPER.
- Don't use sans-serif webfonts for display — Oswald + Alfa Slab One only.
- Don't use photography in original colors — always duotone.
- Don't use borders above 1-2px — this is poster ink, not UI.

## CSS snippets

### `:root` variables

```css
:root {
  --color-forest: #2D4D3A;
  --color-pink: #EDB5A7;
  --color-green-deep: #1F3528;
  --color-pink-hi: #F5CFC6;
  --color-pink-deep: #D9948A;
  --color-pink-muted: rgba(237, 181, 167, 0.65);
  --color-pink-faint: rgba(237, 181, 167, 0.35);

  --font-script: 'Alfa Slab One', Georgia, 'Times New Roman', serif;
  --font-impact: 'Oswald', Impact, 'Arial Narrow', sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Duotone photo filter

```css
.duotone {
  filter: grayscale(1) contrast(1.1);
  background: linear-gradient(180deg, #1F3528, #EDB5A7);
  background-blend-mode: multiply;
}
```

### Poster hero

```html
<div style="background:#2D4D3A; padding:60px; min-height:100vh; position:relative; overflow:hidden;">
  <p style="font-family:'Oswald',sans-serif; font-size:14px; font-weight:600; letter-spacing:2.5px; text-transform:uppercase; color:#EDB5A7; margin:0 0 80px;">VOL. IV — SUMMER 1957</p>

  <div style="position:relative;">
    <span style="position:absolute; top:-40px; left:40px; transform:rotate(-3deg); font-family:'Alfa Slab One',serif; font-size:140px; line-height:0.95; letter-spacing:-2px; color:#EDB5A7; z-index:2;">After the</span>
    <h1 style="font-family:'Oswald',sans-serif; font-size:240px; font-weight:700; line-height:0.85; letter-spacing:-4px; text-transform:uppercase; color:#EDB5A7; margin:0;">LONG<br>WAIT.</h1>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:60px;">
    <p style="font-family:'Oswald',sans-serif; font-size:32px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#EDB5A7; margin:0;">08 / 09 · 10 PM</p>
    <p style="font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:rgba(237,181,167,0.65); margin:0;">THE OLD PALACE · 45¢</p>
  </div>
</div>
```

### Big stat number (Oswald 180px)

```html
<div style="background:#2D4D3A; padding:60px; text-align:center;">
  <p style="font-family:'Oswald',sans-serif; font-size:180px; font-weight:700; line-height:0.90; letter-spacing:-3px; color:#EDB5A7; margin:0;">47%</p>
  <p style="font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#EDB5A7; margin:8px 0 0;">FASTER RESPONSE</p>
</div>
```

### CTA (pink on green, tracked)

```html
<a style="display:inline-block; border:2px solid #EDB5A7; color:#EDB5A7; font-family:'Oswald',sans-serif; font-size:24px; font-weight:700; letter-spacing:3px; text-transform:uppercase; text-decoration:none; padding:16px 32px;">SEE THE SHOW →</a>
```
