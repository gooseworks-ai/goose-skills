# Soft Cloud

Airy, approachable SaaS. Pastel lavender-to-mint gradient background, white cards with generous rounded corners, purple + mint dual-accent system. Plus Jakarta Sans carries all type. The mood is a modern wellness app landing page or a friendly-but-serious B2B product.

> Full prose reference: `styles/_full/soft-cloud.md`

## Palette

| Hex | Role |
|-----|------|
| `#e8e0f0` | Lavender — gradient start |
| `#d8f0e8` | Mint — gradient end |
| `#ffffff` | White — card surface |
| `#2d2d3d` | Dark charcoal — primary text |
| `#8b6cc7` | Soft purple — accent (buttons, stats, focal) |
| `#5cb8a5` | Mint — secondary accent (success, tags) |
| `#6b4fa7` | Deep purple — hover |
| `#a78fd4` | Light purple — badge backgrounds |
| `#d0f0e4` | Light mint — success bg |
| `#4a4a5a` | Charcoal — secondary text |
| `#6b6b7a` | Warm gray — tertiary text |
| `#9a9aaa` | Medium gray — placeholder |
| `#c8c8d4` | Light gray — borders |
| `#f0eef4` | Pale gray — hover surface |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Plus Jakarta Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Plus Jakarta Sans | 64px | 700 | 1.10 | -1px |
| Section Heading | Plus Jakarta Sans | 40px | 700 | 1.15 | -0.5px |
| Sub-heading | Plus Jakarta Sans | 28px | 600 | 1.20 | -0.25px |
| Body Large | Plus Jakarta Sans | 20px | 500 | 1.60 | 0 |
| Body | Plus Jakarta Sans | 16px | 400 | 1.65 | 0 |
| Caption | Plus Jakarta Sans | 13px | 500 | 1.50 | 0.2px |
| Big Number | Plus Jakarta Sans | 56px | 700 | 1.00 | -0.5px |
| Label | Plus Jakarta Sans | 13px | 600 | 1.00 | 0.5px UPPER |
| CTA | Plus Jakarta Sans | 15px | 600 | 1.00 | 0.3px |

**Principles**

- Medium body weights (400-500) — avoid 300, feels too thin for the friendly voice.
- Hierarchy via size + weight; never switch families.
- Warm, approachable — open counters, friendly curves.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80.
- Background: `linear-gradient(135deg, #e8e0f0 0%, #d8f0e8 100%)` — never flat.
- Cards: white `#ffffff`, 16-20px radius, soft shadow `0 8px 24px rgba(45,45,61,0.06)`.
- Generous internal padding (32-40px) and whitespace.
- Purple for primary CTAs and stats; mint for tags, success states, tertiary buttons.

## Do / Don't

**Do**

- Use gradient background edge-to-edge.
- Use large rounded corners (16-20px) on cards for a soft, bubbly feel.
- Use purple (`#8b6cc7`) and mint (`#5cb8a5`) as the dual accent system.
- Use soft diffuse shadows `0 8px 24px rgba(45,45,61,0.06)` for card elevation.
- Use badge pills with `#a78fd4` light-purple backgrounds.

**Don't**

- Don't use dark backgrounds — the gradient is the identity.
- Don't use sharp corners (radius < 8px).
- Don't use heavy or harsh shadows — only soft diffuse elevation.
- Don't use pure black for text — always `#2d2d3d` warm charcoal.
- Don't use red, orange, or high-saturation accents.

## CSS snippets

### `:root` variables

```css
:root {
  --color-grad-start: #e8e0f0;
  --color-grad-end: #d8f0e8;
  --color-card: #ffffff;
  --color-text: #2d2d3d;
  --color-purple: #8b6cc7;
  --color-purple-deep: #6b4fa7;
  --color-purple-light: #a78fd4;
  --color-mint: #5cb8a5;
  --color-mint-light: #d0f0e4;
  --color-gray-2: #4a4a5a;
  --color-gray-3: #6b6b7a;
  --color-border: #c8c8d4;

  --font: 'Plus Jakarta Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 20px;
  --shadow-soft: 0 8px 24px rgba(45, 45, 61, 0.06);
}
```

### Gradient title block

```html
<div style="background:linear-gradient(135deg,#e8e0f0 0%,#d8f0e8 100%); padding:80px 60px; text-align:center;">
  <span style="display:inline-block; background:#a78fd4; color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; padding:6px 16px; border-radius:20px; margin-bottom:24px;">NEW</span>
  <h1 style="font-family:'Plus Jakarta Sans',sans-serif; font-size:64px; font-weight:700; line-height:1.10; letter-spacing:-1px; color:#2d2d3d; margin:0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family:'Plus Jakarta Sans',sans-serif; font-size:20px; font-weight:500; line-height:1.60; color:#4a4a5a; max-width:560px; margin:0 auto;">How AI coworkers are reshaping how teams operate.</p>
</div>
```

### White card

```html
<div style="background:#fff; border-radius:20px; padding:32px; box-shadow:0 8px 24px rgba(45,45,61,0.06);">
  <span style="display:inline-block; background:#d0f0e4; color:#5cb8a5; font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; padding:4px 12px; border-radius:12px; margin-bottom:16px;">LIVE</span>
  <h3 style="font-family:'Plus Jakarta Sans',sans-serif; font-size:28px; font-weight:600; color:#2d2d3d; margin:0 0 12px;">Find buyers before they find you</h3>
  <p style="font-family:'Plus Jakarta Sans',sans-serif; font-size:16px; font-weight:400; line-height:1.65; color:#6b6b7a; margin:0;">Monitor hiring signals, funding events, tech-stack changes.</p>
</div>
```

### Purple CTA pill

```html
<a style="display:inline-block; background:#8b6cc7; color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:600; letter-spacing:0.3px; text-decoration:none; padding:16px 40px; border-radius:28px;">Start free</a>
```

### Stat (big purple number)

```html
<div style="text-align:center; padding:40px 24px; background:#fff; border-radius:20px; box-shadow:0 8px 24px rgba(45,45,61,0.06);">
  <p style="font-family:'Plus Jakarta Sans',sans-serif; font-size:56px; font-weight:700; line-height:1.00; letter-spacing:-0.5px; color:#8b6cc7; margin:0 0 8px;">47%</p>
  <p style="font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#6b6b7a; margin:0;">FASTER RESPONSE</p>
</div>
```
