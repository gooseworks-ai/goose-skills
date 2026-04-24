# Orbit Purple

Violet/purple background with card-based layouts featuring orbital line illustrations — ellipses, curves, dots, and connection paths. Cards come in three variants: purple-on-purple, white, and dark/black. Data connection and network visualization aesthetic with a SaaS/startup feel.

> Full prose reference: `styles/_full/orbit-purple.md`

## Palette

| Hex | Role |
|-----|------|
| `#7C5CFC` | Violet — primary background |
| `#FFFFFF` | White — card background variant, text on dark |
| `#1A1A2E` | Dark navy — card background variant |
| `#6B4BD4` | Deep purple — card background variant (purple-on-purple) |
| `#A18AFF` | Light violet — orbital lines on dark cards |
| `#5A3EB8` | Mid purple — orbital lines on white cards |
| `#E0D8FF` | Pale violet — text on purple backgrounds |
| `#1A1A1A` | Near-black — text on white cards |
| `#555555` | Gray — secondary text on white cards |
| `rgba(255,255,255,0.60)` | White 60 — secondary text on dark |
| `rgba(161,138,255,0.40)` | Violet 40 — faint orbital strokes |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display / Body:** `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Card Title | DM Sans | 24px | 700 | 1.20 | -0.3px |
| Section Heading | DM Sans | 48px | 700 | 1.05 | -1px |
| Sub-heading | DM Sans | 20px | 600 | 1.25 | -0.2px |
| Body | DM Sans | 15px | 400 | 1.55 | 0.2px |
| Label | DM Sans | 11px | 600 | 1.20 | 1px UPPER |
| Caption | DM Sans | 10px | 500 | 1.30 | 0.5px |
| Big Number | DM Sans | 64px | 700 | 1.00 | -1px |
| Data Label | DM Sans | 12px | 500 | 1.00 | 0.3px |

**Principles**

- Single font family (DM Sans) — clean, modern, SaaS.
- Card titles are concise (2-4 words), bold, direct.
- Data labels sit near orbit dots — tiny, explanatory annotations.

## Layout

- Full-bleed violet `#7C5CFC` background.
- Cards arranged in a horizontal row (3 cards) or stacked, each with rounded corners (16px radius).
- Card variants:
  - Purple-on-purple (`#6B4BD4` bg) with light violet text.
  - White (`#FFFFFF` bg) with dark text and purple orbital lines.
  - Dark navy (`#1A1A2E` bg) with white text and light violet orbital lines.
- Orbital illustrations inside each card: SVG ellipses, curved paths, small dots at intersections.
- Cards are slightly overlapping or staggered for depth.
- Padding: 40-60px outer, 24-32px inner card padding.

## Do / Don't

**Do**

- Use all three card variants (purple, white, dark) in a single composition.
- Draw orbital paths as SVG `<ellipse>` or curved `<path>` elements with thin strokes (1-2px).
- Place small dots (6-8px) at orbital intersections as data points.
- Add data labels near orbital dots.
- Round card corners at 16px.

**Don't**

- Don't use warm colors — violet/purple/white/navy only.
- Don't use straight lines for orbits — always curved/elliptical.
- Don't make cards identical — vary the background, orbit pattern, and text.
- Don't use heavy borders on cards — rely on background color contrast.
- Don't use more than one font family.

## CSS snippets

### `:root` variables

```css
:root {
  --color-violet: #7C5CFC;
  --color-white: #FFFFFF;
  --color-navy: #1A1A2E;
  --color-purple-card: #6B4BD4;
  --color-orbit-light: #A18AFF;
  --color-orbit-dark: #5A3EB8;
  --color-pale: #E0D8FF;
  --color-text-dark: #1A1A1A;

  --font: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --radius-card: 16px;
}
```

### Three-card orbit layout

```html
<div style="background:#7C5CFC; padding:48px; min-height:100vh; display:flex; gap:24px; align-items:center; justify-content:center;">
  <!-- Card 1: Purple -->
  <div style="background:#6B4BD4; border-radius:16px; padding:32px; width:280px; height:340px; position:relative; overflow:hidden;">
    <h3 style="font-family:'DM Sans',sans-serif; font-size:24px; font-weight:700; line-height:1.20; letter-spacing:-0.3px; color:#E0D8FF; margin:0 0 8px;">Experts<br>Working Together</h3>
    <svg width="240" height="200" viewBox="0 0 240 200" style="position:absolute; bottom:20px; left:20px;" fill="none">
      <path d="M20 180 Q60 20 120 100 Q180 180 220 40" stroke="#A18AFF" stroke-width="1.5" fill="none"/>
      <circle cx="80" cy="120" r="4" fill="#A18AFF"/>
      <circle cx="140" cy="90" r="4" fill="#A18AFF"/>
      <text x="85" y="115" font-family="DM Sans" font-size="10" fill="#E0D8FF">OLIVIA</text>
      <text x="145" y="85" font-family="DM Sans" font-size="10" fill="#E0D8FF">ZOE</text>
    </svg>
  </div>

  <!-- Card 2: White -->
  <div style="background:#FFFFFF; border-radius:16px; padding:32px; width:280px; height:340px; position:relative; overflow:hidden;">
    <h3 style="font-family:'DM Sans',sans-serif; font-size:24px; font-weight:700; line-height:1.20; letter-spacing:-0.3px; color:#1A1A1A; margin:0 0 8px;">Creating<br>Connections</h3>
    <svg width="240" height="200" viewBox="0 0 240 200" style="position:absolute; bottom:20px; left:20px;" fill="none">
      <ellipse cx="80" cy="120" rx="60" ry="40" stroke="#5A3EB8" stroke-width="1.5" fill="none"/>
      <ellipse cx="160" cy="120" rx="60" ry="40" stroke="#5A3EB8" stroke-width="1.5" fill="none"/>
      <circle cx="120" cy="100" r="4" fill="#5A3EB8"/>
    </svg>
  </div>

  <!-- Card 3: Dark -->
  <div style="background:#1A1A2E; border-radius:16px; padding:32px; width:280px; height:340px; position:relative; overflow:hidden;">
    <h3 style="font-family:'DM Sans',sans-serif; font-size:24px; font-weight:700; line-height:1.20; letter-spacing:-0.3px; color:#fff; margin:0 0 8px;">Prevent Data Pipelines<br>From Breaking</h3>
    <svg width="240" height="200" viewBox="0 0 240 200" style="position:absolute; bottom:20px; left:20px;" fill="none">
      <path d="M20 100 Q120 20 220 100" stroke="#A18AFF" stroke-width="1.5" fill="none"/>
      <path d="M20 100 Q120 180 220 100" stroke="#A18AFF" stroke-width="1.5" fill="none"/>
      <circle cx="120" cy="100" r="8" stroke="#A18AFF" stroke-width="1.5" fill="none"/>
      <circle cx="120" cy="100" r="3" fill="#fff"/>
    </svg>
  </div>
</div>
```

### Stat block

```html
<div style="background:#6B4BD4; border-radius:16px; padding:40px; text-align:center;">
  <p style="font-family:'DM Sans',sans-serif; font-size:64px; font-weight:700; line-height:1.00; letter-spacing:-1px; color:#fff; margin:0 0 8px;">47%</p>
  <p style="font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#E0D8FF; margin:0;">PIPELINE UPTIME</p>
</div>
```

### CTA

```html
<a style="display:inline-block; background:#fff; color:#7C5CFC; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:14px 28px; border-radius:8px;">Get Started</a>
```
