# Botanical Illustration

Olive-green duotone magazine cover with dense hand-drawn botanical illustrations. Serif masthead in classic magazine layout, warm parchment undertones, vintage New Yorker cover energy. Everything rendered in two tones — deep olive and warm sage — with cream text overlaid.

> Full prose reference: `styles/_full/botanical-illustration.md`

## Palette

| Hex | Role |
|-----|------|
| `#4A5A2B` | Olive green — primary background canvas |
| `#6B7D3E` | Sage green — illustration midtones, foliage |
| `#3A4A1F` | Deep olive — illustration shadows, dense areas |
| `#F5F0E0` | Cream — masthead text, headlines, overlays |
| `#8B9E5A` | Light sage — illustration highlights |
| `#2E3A18` | Dark olive — darkest shadow tone |
| `rgba(245,240,224,0.85)` | Cream 85 — subtitle text |
| `rgba(245,240,224,0.60)` | Cream 60 — metadata, secondary text |
| `rgba(245,240,224,0.35)` | Cream 35 — faint rules |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

- **Masthead Display:** `'Playfair Display', Georgia, 'Times New Roman', serif`
- **Body / Subtitle:** `'EB Garamond', Garamond, Georgia, serif`
- **Metadata:** `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Masthead | Playfair Display | 96px | 900 | 0.90 | -2px UPPER |
| Subtitle | EB Garamond | 28px | 500 | 1.30 | 0.5px |
| Section Heading | Playfair Display | 64px | 700 | 1.00 | -1px |
| Sub-heading | EB Garamond Italic | 36px | 500 | 1.20 | 0 |
| Body Large | EB Garamond | 22px | 400 | 1.60 | 0.2px |
| Body | EB Garamond | 18px | 400 | 1.65 | 0.2px |
| Metadata | DM Sans | 12px | 600 | 1.30 | 2px UPPER |
| Big Number | Playfair Display | 120px | 900 | 1.00 | -2px |
| Caption | DM Sans | 11px | 500 | 1.30 | 1.5px UPPER |
| CTA | DM Sans | 14px | 600 | 1.00 | 1.5px UPPER |

**Principles**

- Playfair Display masthead dominates top third — classic magazine cover hierarchy.
- EB Garamond for all body and subtitles — warm, literary, old-world serif.
- DM Sans for structural metadata only (date, price, volume labels).

## Layout

- Full-bleed olive green `#4A5A2B` background.
- Dense botanical illustration fills 60-80% of the frame — rendered as CSS shapes, SVG paths, or border/shadow compositions in olive tones.
- Masthead sits in the top third, centered or left-aligned, with magazine metadata (date, price, volume) flanking it.
- Illustration elements wrap around and behind text — layered composition.
- Cream text overlaid on illustration with subtle text-shadow for readability.
- No photography — pure illustration aesthetic.

## Do / Don't

**Do**

- Fill the canvas with dense botanical/plant illustration elements in olive tones.
- Use Playfair Display 900 for the masthead, sized to span most of the width.
- Layer text over illustration with slight `text-shadow: 0 1px 4px rgba(0,0,0,0.3)`.
- Use cream for all text — no other text colors.
- Add magazine metadata (date, price, issue number) in DM Sans tracked uppercase.

**Don't**

- Don't use photography — illustration only.
- Don't use colors outside the olive/sage/cream palette.
- Don't leave large empty areas — density is the point.
- Don't use modern sans-serif for display text — serif only.
- Don't use flat colored fills for illustration — use gradients and overlapping shapes.

## CSS snippets

### `:root` variables

```css
:root {
  --color-olive: #4A5A2B;
  --color-sage: #6B7D3E;
  --color-deep: #3A4A1F;
  --color-cream: #F5F0E0;
  --color-light-sage: #8B9E5A;
  --color-dark: #2E3A18;

  --font-masthead: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'EB Garamond', Garamond, Georgia, serif;
  --font-meta: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Magazine cover hero

```html
<div style="background:#4A5A2B; padding:40px; min-height:100vh; position:relative; overflow:hidden;">
  <!-- Metadata row -->
  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:16px;">
    <p style="font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:rgba(245,240,224,0.60); margin:0;">PRICE $OMUCH</p>
    <p style="font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:rgba(245,240,224,0.60); margin:0;">ALL OF 2026</p>
  </div>

  <!-- Masthead -->
  <div style="text-align:center; margin-bottom:40px;">
    <p style="font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:rgba(245,240,224,0.60); margin:0 0 8px;">THE</p>
    <h1 style="font-family:'Playfair Display',serif; font-size:96px; font-weight:900; line-height:0.90; letter-spacing:-2px; text-transform:uppercase; color:#F5F0E0; margin:0; text-shadow:0 2px 8px rgba(0,0,0,0.25);">HOME<br>STAYER</h1>
  </div>

  <!-- Botanical shapes (simplified) -->
  <div style="position:absolute; bottom:0; left:0; right:0; height:65%; background:linear-gradient(180deg, transparent 0%, #3A4A1F 100%); opacity:0.4;"></div>
</div>
```

### Stat block

```html
<div style="background:#4A5A2B; padding:48px; text-align:center;">
  <p style="font-family:'Playfair Display',serif; font-size:120px; font-weight:900; line-height:1.00; letter-spacing:-2px; color:#F5F0E0; margin:0; text-shadow:0 2px 6px rgba(0,0,0,0.2);">47%</p>
  <p style="font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:rgba(245,240,224,0.60); margin:12px 0 0;">GROWTH IN READERSHIP</p>
</div>
```

### CTA

```html
<a style="display:inline-block; border:1px solid rgba(245,240,224,0.35); color:#F5F0E0; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:14px 28px;">SUBSCRIBE NOW</a>
```
