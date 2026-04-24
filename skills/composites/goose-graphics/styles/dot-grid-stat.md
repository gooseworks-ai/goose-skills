# Dot Grid Stat

Dark charcoal canvas with oversized white stat numbers and a grid of circles in varying teal/green opacities. Data visualization meets dark mode — the dot grid acts as a visual meter, filling proportionally to represent the stat. Minimal, bold, corporate data storytelling.

> Full prose reference: `styles/_full/dot-grid-stat.md`

## Palette

| Hex | Role |
|-----|------|
| `#2A2D32` | Charcoal — primary background |
| `#FFFFFF` | White — primary stat numbers, headlines |
| `#00B894` | Teal — filled dots (primary accent) |
| `#00A381` | Deep teal — filled dots (darker variant) |
| `#007D63` | Dark teal — filled dots (darkest variant) |
| `#3A3D42` | Light charcoal — empty/unfilled dot slots |
| `#E0E0E0` | Light gray — secondary body text |
| `rgba(255,255,255,0.70)` | White 70 — descriptive text |
| `rgba(255,255,255,0.45)` | White 45 — tertiary text |
| `#1E2024` | Deep charcoal — inset panels |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display / Numbers:** `'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body / Metadata:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Stat Number | Space Grotesk | 160px | 700 | 0.90 | -4px |
| Section Heading | Space Grotesk | 56px | 700 | 1.00 | -1.5px |
| Sub-heading | Space Grotesk | 32px | 600 | 1.15 | -0.5px |
| Body Large | Inter | 18px | 400 | 1.60 | 0.2px |
| Body | Inter | 15px | 400 | 1.60 | 0.3px |
| Label | Inter | 13px | 600 | 1.30 | 0.5px |
| Metadata | Inter | 11px | 700 | 1.20 | 1.5px UPPER |
| Caption | Inter | 10px | 500 | 1.30 | 1px UPPER |
| Brand | Space Grotesk | 24px | 700 | 1.00 | -0.5px |

**Principles**

- Stat numbers dominate at 160px — they are the hero element.
- Dot grid is the secondary visual — fills proportionally to the stat value.
- White text on dark charcoal for maximum punch; descriptive text in 70% white.

## Layout

- Full-bleed charcoal `#2A2D32` background.
- Stat number sits top-left, oversized (160px).
- Descriptive text sits below or beside the stat — small, quiet, explanatory.
- Dot grid: 4-6 columns x 4-6 rows of circles (24-32px diameter, 8px gap), positioned bottom-right or right half.
- Filled dots use teal at varying opacities (100%, 85%, 70%) to create depth.
- Unfilled/empty dots use `#3A3D42` (barely visible on background).
- Brand mark bottom-left in Space Grotesk 700.

## Do / Don't

**Do**

- Make the stat number the largest element (160px+).
- Build dot grids with CSS grid — circles via `border-radius:50%`.
- Vary teal opacity across dots for visual depth (lighter = more filled).
- Keep descriptive text small and quiet — stat does the talking.
- Place brand/logo mark bottom-left.

**Don't**

- Don't use colors outside charcoal/white/teal.
- Don't make the dot grid larger than 40% of canvas — it supports, not dominates.
- Don't use borders — this style relies on color contrast only.
- Don't use light backgrounds — dark mode is mandatory.
- Don't use decorative elements — data clarity is everything.

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #2A2D32;
  --color-white: #FFFFFF;
  --color-teal: #00B894;
  --color-teal-deep: #00A381;
  --color-teal-dark: #007D63;
  --color-dot-empty: #3A3D42;
  --color-inset: #1E2024;

  --font-display: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Stat hero with dot grid

```html
<div style="background:#2A2D32; padding:60px; min-height:100vh; display:flex; flex-direction:column; justify-content:space-between;">
  <!-- Stat -->
  <div>
    <h1 style="font-family:'Space Grotesk',sans-serif; font-size:160px; font-weight:700; line-height:0.90; letter-spacing:-4px; color:#fff; margin:0;">29%</h1>
    <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.5px; color:rgba(255,255,255,0.70); margin:16px 0 0; max-width:200px;">of buyers in 2023 were<br><strong style="font-weight:700; color:#fff;">FIRST TIME BUYERS</strong></p>
  </div>

  <!-- Dot grid -->
  <div style="display:grid; grid-template-columns:repeat(5,32px); gap:8px; justify-self:end; align-self:end;">
    <div style="width:32px; height:32px; border-radius:50%; background:#00B894;"></div>
    <div style="width:32px; height:32px; border-radius:50%; background:#00B894;"></div>
    <div style="width:32px; height:32px; border-radius:50%; background:#00A381;"></div>
    <div style="width:32px; height:32px; border-radius:50%; background:#00A381;"></div>
    <div style="width:32px; height:32px; border-radius:50%; background:#007D63;"></div>
    <!-- Row 2+ with mix of teal and empty dots -->
    <div style="width:32px; height:32px; border-radius:50%; background:#007D63;"></div>
    <div style="width:32px; height:32px; border-radius:50%; background:#3A3D42;"></div>
    <div style="width:32px; height:32px; border-radius:50%; background:#3A3D42;"></div>
    <div style="width:32px; height:32px; border-radius:50%; background:#3A3D42;"></div>
    <div style="width:32px; height:32px; border-radius:50%; background:#3A3D42;"></div>
  </div>

  <!-- Brand -->
  <p style="font-family:'Space Grotesk',sans-serif; font-size:24px; font-weight:700; letter-spacing:-0.5px; color:#fff; margin:0;">nbrs.</p>
</div>
```

### CTA

```html
<a style="display:inline-block; background:#00B894; color:#1E2024; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:14px 28px; border-radius:6px;">View Report</a>
```
