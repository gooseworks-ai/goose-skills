# Retro Line Art

Powder-blue canvas with cream hand-drawn cocktail-poster line art. Oversized Playfair 900 "PARTY" display word in cream, with an italic Cormorant Garamond "Cocktail" script overlapping slightly above. One letter of the display word gets a blue-shadow offset echo. Hand-drawn sparkles, cocktail glasses, and flourishes float as decorative accents.

> Full prose reference: `styles/_full/retro-line-art.md`

## Palette

| Hex | Role |
|-----|------|
| `#7BA3C6` | Powder blue — primary background canvas |
| `#F5F0E6` | Cream — primary ink, all type, all line art |
| `#5A84AA` | Blue shadow — offset echo on one display letter |
| `#FAF5EB` | Cream glow — micro-highlights on sparkles |
| `#6E9BC0` | Blue mid — alternate canvas for Story format |
| `#3D5A75` | Ink dark — dense decorative grit only |
| `rgba(245,240,230,0.80)` | Cream 80 — secondary metadata |
| `rgba(245,240,230,0.60)` | Cream 60 — tertiary |
| `rgba(245,240,230,0.40)` | Cream 40 — hairline dividers |
| `rgba(245,240,230,0.35)` | Hairline cream border |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Playfair+Display:wght@900&family=DM+Sans:wght@500;600;700&display=swap" rel="stylesheet">
```

- **Script Display:** `'Cormorant Garamond', Garamond, serif` (italic, weight 500)
- **Upright Display:** `'Playfair Display', Georgia, serif` (weight 900)
- **Body / Metadata:** `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Script Display | Cormorant Garamond Italic | 160px | 500 | 1.00 | -2px |
| Upright Display | Playfair Display | 240px | 900 | 0.95 | -6px UPPER |
| Section Heading | Playfair Display | 88px | 900 | 1.00 | -2px UPPER |
| Sub-heading | Cormorant Garamond Italic | 56px | 500 | 1.10 | -0.5px |
| Metadata Strip | DM Sans | 14px | 600 | 1.25 | 1.8px UPPER |
| Metadata Bold | DM Sans | 16px | 700 | 1.20 | 1.5px UPPER |
| Body | DM Sans | 18px | 500 | 1.55 | 0.3px |
| Big Number | Playfair Display | 120px | 900 | 1.00 | -3px |
| Caption | DM Sans | 12px | 500 | 1.30 | 1.5px UPPER |
| CTA | DM Sans | 14px | 700 | 1.20 | 2px UPPER |

**Principles**

- Italic Cormorant Garamond script overlaps with upright Playfair display — the composed pair is the hero.
- One letter of the Playfair display word gets a `#5A84AA` shadow offset to the bottom-right for the "echo" effect.
- DM Sans 1.8px tracked UPPER is the only structural metadata voice.

## Layout

- Full-bleed powder blue `#7BA3C6` canvas.
- Hand-drawn line art: cream SVG strokes at 2-3px weight — cocktail glasses, sparkles, flourishes, dashed borders.
- Sparkles: 4-point star shapes, 8-24px, scattered around the composition.
- Dashed borders for frames: `border: 2px dashed rgba(245,240,230,0.35)`.
- Script sits above the display word, lower-right-overlapping the first letter.

## Do / Don't

**Do**

- Pair italic Cormorant script + upright Playfair display as the signature composition.
- Add hand-drawn SVG line-art elements (sparkles, glasses, dashed frames) in cream.
- Use blue-shadow offset echo on one display letter.
- Use DM Sans UPPER with 1.8-2.5px tracking for every metadata role.
- Keep every ink in the cream family (no other colors for type).

**Don't**

- Don't use flat vector shapes — line art only, 2-3px stroke weight.
- Don't use colors beyond powder blue, cream, and their shades.
- Don't use sans-serif for display — Playfair 900 + Cormorant italic are mandatory.
- Don't use mixed case on the display word — UPPERCASE.
- Don't use heavy fills — everything is outlined.

## CSS snippets

### `:root` variables

```css
:root {
  --color-blue: #7BA3C6;
  --color-cream: #F5F0E6;
  --color-blue-shadow: #5A84AA;
  --color-cream-80: rgba(245, 240, 230, 0.80);
  --color-cream-60: rgba(245, 240, 230, 0.60);
  --color-hairline: rgba(245, 240, 230, 0.35);

  --font-script: 'Cormorant Garamond', Garamond, serif;
  --font-upright: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Hero composition

```html
<div style="background:#7BA3C6; padding:60px; min-height:100vh; position:relative;">
  <p style="font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; letter-spacing:1.8px; text-transform:uppercase; color:#F5F0E6; margin:0 0 40px;">— VOL. IV · SUMMER SERIES —</p>

  <div style="position:relative;">
    <span style="position:absolute; top:20px; right:120px; font-family:'Cormorant Garamond',serif; font-style:italic; font-size:160px; font-weight:500; line-height:1.00; letter-spacing:-2px; color:#F5F0E6; z-index:2;">Cocktail</span>
    <h1 style="font-family:'Playfair Display',serif; font-size:240px; font-weight:900; line-height:0.95; letter-spacing:-6px; text-transform:uppercase; color:#F5F0E6; margin:0;">
      P<span style="color:#5A84AA; position:relative; left:4px; top:4px;">A</span>RTY
    </h1>
  </div>

  <svg width="48" height="48" viewBox="0 0 48 48" style="position:absolute; top:200px; right:120px;">
    <path d="M24 4 L28 20 L44 24 L28 28 L24 44 L20 28 L4 24 L20 20 Z" stroke="#F5F0E6" stroke-width="2" fill="none"/>
  </svg>

  <div style="display:flex; justify-content:space-between; margin-top:80px; border-top:2px dashed rgba(245,240,230,0.35); padding-top:24px;">
    <p style="font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#F5F0E6; margin:0;">STARTING AT 08:00 PM</p>
    <p style="font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#F5F0E6; margin:0;">20 OCT · PALACE HALL</p>
  </div>
</div>
```

### Dashed frame card

```html
<div style="border:2px dashed rgba(245,240,230,0.35); padding:32px; background:transparent;">
  <p style="font-family:'Cormorant Garamond',serif; font-style:italic; font-size:56px; font-weight:500; line-height:1.10; color:#F5F0E6; margin:0 0 16px;">the house rules</p>
  <p style="font-family:'DM Sans',sans-serif; font-size:18px; font-weight:500; line-height:1.55; color:#F5F0E6; margin:0;">Leave your phone at the door. Trade stories. Dance badly. Laugh loud.</p>
</div>
```

### CTA (underlined uppercase)

```html
<a style="display:inline-block; color:#F5F0E6; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700; letter-spacing:2px; text-transform:uppercase; text-decoration:underline; text-decoration-thickness:2px; text-underline-offset:6px;">— RSVP NOW —</a>
```
