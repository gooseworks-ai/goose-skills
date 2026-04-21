# Warm Earth

Organic, artisanal, craft-lifestyle aesthetic. Terracotta + sage + cream palette with Nunito's rounded geometric sans handling every role. The mood is a ceramic studio catalog or an indie roastery's packaging system — warm, hand-finished, quietly considered.

> Full prose reference: `styles/_full/warm-earth.md`

## Palette

| Hex | Role |
|-----|------|
| `#faf3eb` | Cream background |
| `#3d2b1f` | Dark brown — primary text |
| `#c67a4a` | Terracotta — accent (numbers, rules, CTAs) |
| `#7a9e7e` | Sage green — secondary accent (tags, icons) |
| `#5c8060` | Deep sage — hover |
| `#d4a574` | Warm tan — lighter terracotta variant |
| `#a85e30` | Deep terracotta — hover |
| `#f5ece0` | Linen — card surface |
| `#f0e6d8` | Surface inset |
| `#ebe0d0` | Sand — nested containers |
| `#d9cbb8` | Tan border |
| `#a89a8a` | Warm medium — disabled |
| `#8a7b6b` | Clay gray — tertiary text |
| `#6b5d4f` | Earth gray — secondary text |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Nunito | 72px | 800 | 1.10 | -1px |
| Section Heading | Nunito | 48px | 700 | 1.15 | -0.5px |
| Sub-heading | Nunito | 32px | 700 | 1.20 | -0.25px |
| Body Large | Nunito | 20px | 300 | 1.70 | 0 |
| Body | Nunito | 16px | 400 | 1.70 | 0.1px |
| Caption | Nunito | 13px | 400 | 1.50 | 0.3px |
| Big Number | Nunito | 64px | 800 | 1.00 | -0.5px |
| Numbered Label | Nunito | 14px | 600 | 1.00 | 1.5px UPPER |
| CTA | Nunito | 15px | 700 | 1.00 | 0.5px |

**Principles**

- Rounded geometric letterforms signal warmth — never switch to sharp or high-contrast type.
- Light body (300) creates airy reading against cream; display heavy (700-800).

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80.
- Cards: `#f5ece0` linen surface, 8-12px radius (rounded, organic), `#d9cbb8` border.
- Rules: 1-2px terracotta, often short (60-80px), sometimes with sage end caps.
- Organic shapes: occasional hand-drawn style circles (CSS border-radius: 50% on irregular sizes).
- Sage icons (small, 24-32px) for positive/natural markers; terracotta numbers for sequence.

## Do / Don't

**Do**

- Pair terracotta and sage as complementary accents — never solo.
- Use 8-12px radius on cards — rounded but not bubbly.
- Use sage (`#7a9e7e`) for positive states, success, "with Goose" columns.
- Use warm tan (`#d4a574`) for lighter decorative fills and border variants.
- Use earth gray (`#6b5d4f`) for body text, not pure black.

**Don't**

- Don't use cool grays or cool blues. Warm palette only.
- Don't use sharp borders or perfect geometry — the aesthetic is hand-finished.
- Don't use bright/saturated colors (neon, electric, fluorescent).
- Don't use serif fonts — Nunito's rounded terminals are the identity.
- Don't use more than 2 accents per section (terracotta + sage).

## CSS snippets

### `:root` variables

```css
:root {
  --color-cream: #faf3eb;
  --color-brown: #3d2b1f;
  --color-terracotta: #c67a4a;
  --color-sage: #7a9e7e;
  --color-deep-sage: #5c8060;
  --color-tan: #d4a574;
  --color-linen: #f5ece0;
  --color-tan-border: #d9cbb8;
  --color-earth-gray: #6b5d4f;
  --color-clay-gray: #8a7b6b;

  --font: 'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 12px;
}
```

### Title block

```html
<div style="background:#faf3eb; padding:80px 60px; text-align:center;">
  <div style="width:60px; height:3px; background:#c67a4a; margin:0 auto 32px; border-radius:2px;"></div>
  <h1 style="font-family:'Nunito',sans-serif; font-size:72px; font-weight:800; line-height:1.10; letter-spacing:-1px; color:#3d2b1f; margin:0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family:'Nunito',sans-serif; font-size:20px; font-weight:300; line-height:1.70; color:#6b5d4f; max-width:560px; margin:0 auto;">How AI coworkers are reshaping how teams operate.</p>
</div>
```

### Numbered step (terracotta numeral, sage icon)

```html
<div style="display:flex; gap:24px; align-items:flex-start; padding:32px 0; border-bottom:1px solid #d9cbb8;">
  <span style="font-family:'Nunito',sans-serif; font-size:48px; font-weight:800; line-height:1.00; color:#c67a4a; min-width:72px;">01</span>
  <div>
    <p style="font-family:'Nunito',sans-serif; font-size:14px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#7a9e7e; margin:0 0 8px;">HARVEST</p>
    <h3 style="font-family:'Nunito',sans-serif; font-size:32px; font-weight:700; line-height:1.20; letter-spacing:-0.25px; color:#3d2b1f; margin:0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family:'Nunito',sans-serif; font-size:16px; font-weight:400; line-height:1.70; color:#6b5d4f; margin:0;">Monitor hiring signals and funding events.</p>
  </div>
</div>
```

### Card (linen surface, tan border)

```html
<div style="background:#f5ece0; border:1px solid #d9cbb8; border-radius:12px; padding:28px 24px;">
  <h3 style="font-family:'Nunito',sans-serif; font-size:32px; font-weight:700; color:#3d2b1f; margin:0 0 12px;">Made for makers</h3>
  <p style="font-family:'Nunito',sans-serif; font-size:16px; font-weight:400; line-height:1.70; color:#6b5d4f; margin:0;">Tools that feel like the craft they serve.</p>
</div>
```

### CTA (terracotta pill)

```html
<a style="display:inline-block; background:#c67a4a; color:#faf3eb; font-family:'Nunito',sans-serif; font-size:15px; font-weight:700; letter-spacing:0.5px; text-decoration:none; padding:16px 40px; border-radius:8px;">Start your batch</a>
```
