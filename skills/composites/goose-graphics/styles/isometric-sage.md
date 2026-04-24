# Isometric Sage

Sage green background with isometric 3D office/workspace illustrations built from CSS. Bold split-word typography that wraps around the illustration — one part top-left, one part bottom-right. Clean corporate-meets-editorial aesthetic with a cool muted palette.

> Full prose reference: `styles/_full/isometric-sage.md`

## Palette

| Hex | Role |
|-----|------|
| `#7BA88E` | Sage green — primary background |
| `#FFFFFF` | White — primary display text |
| `#1A1A1A` | Near-black — body text, illustration outlines |
| `#2C3E35` | Dark green — illustration surfaces (desk tops, floors) |
| `#5A8A6E` | Mid sage — illustration depth surfaces |
| `#A3C4B0` | Light sage — illustration highlight faces |
| `#E8F0EC` | Pale sage — card surfaces, metadata panels |
| `#3D5C4A` | Forest — illustration shadows |
| `rgba(255,255,255,0.70)` | White 70 — secondary text |
| `rgba(255,255,255,0.40)` | White 40 — tertiary text, captions |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

- **Display:** `'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body / Metadata:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Space Grotesk | 140px | 700 | 0.90 | -4px |
| Section Heading | Space Grotesk | 72px | 700 | 0.95 | -2px |
| Sub-heading | Space Grotesk | 36px | 600 | 1.10 | -0.5px |
| Body Large | Inter | 18px | 400 | 1.65 | 0.2px |
| Body | Inter | 15px | 400 | 1.65 | 0.2px |
| Metadata | Inter | 11px | 600 | 1.30 | 1.5px UPPER |
| Big Number | Space Grotesk | 96px | 700 | 1.00 | -2px |
| Caption | Inter | 10px | 500 | 1.30 | 1.2px UPPER |
| Tag | Inter | 12px | 600 | 1.00 | 0.5px |
| CTA | Space Grotesk | 14px | 600 | 1.00 | 1px UPPER |

**Principles**

- Split-word display: break one word across two positions (top-left + bottom-right) with the illustration between.
- Space Grotesk 700 for headlines — geometric, modern, technical.
- Inter for supporting text — clean and unobtrusive.

## Layout

- Full-bleed sage green `#7BA88E` background.
- Isometric illustration centered in the frame — office cubicles, desks, screens built with CSS transforms (`transform: rotateX(60deg) rotateZ(-45deg)` or manual skew).
- Display word split: first syllable/part top-left, second part bottom-right.
- Small metadata panel: white pill or card with dark text for tags/labels.
- Padding: 48-60px all sides.

## Do / Don't

**Do**

- Split the display word into two parts positioned diagonally around the illustration.
- Build isometric illustrations using CSS `transform: skew()` and colored parallelogram divs.
- Use white text on sage — high contrast, clean.
- Add small white metadata pills/tags for context labels.
- Keep the illustration geometric and clean — no hand-drawn elements.

**Don't**

- Don't use the full display word in one place — splitting is the signature.
- Don't use warm colors — sage/green/white palette only.
- Don't use rounded illustrations — isometric means sharp geometric faces.
- Don't crowd the canvas — illustration should breathe.
- Don't use borders heavier than 1px on metadata elements.

## CSS snippets

### `:root` variables

```css
:root {
  --color-sage: #7BA88E;
  --color-white: #FFFFFF;
  --color-dark: #1A1A1A;
  --color-desk: #2C3E35;
  --color-mid: #5A8A6E;
  --color-light: #A3C4B0;
  --color-pale: #E8F0EC;
  --color-shadow: #3D5C4A;

  --font-display: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Split-word hero

```html
<div style="background:#7BA88E; padding:48px; min-height:100vh; position:relative; overflow:hidden;">
  <!-- Top-left word fragment -->
  <h1 style="font-family:'Space Grotesk',sans-serif; font-size:140px; font-weight:700; line-height:0.90; letter-spacing:-4px; color:#fff; margin:0; position:relative; z-index:2;">Seve</h1>

  <!-- Isometric illustration placeholder -->
  <div style="margin:40px auto; width:300px; height:200px; position:relative;">
    <div style="width:120px; height:80px; background:#2C3E35; transform:skewX(-30deg) skewY(15deg); position:absolute; top:40px; left:40px;"></div>
    <div style="width:120px; height:80px; background:#5A8A6E; transform:skewX(-30deg) skewY(15deg); position:absolute; top:40px; left:160px;"></div>
  </div>

  <!-- Bottom-right word fragment -->
  <p style="font-family:'Space Grotesk',sans-serif; font-size:140px; font-weight:700; line-height:0.90; letter-spacing:-4px; color:#fff; margin:0; text-align:right; position:relative; z-index:2;">rance</p>

  <!-- Metadata tag -->
  <div style="position:absolute; top:220px; left:48px;">
    <span style="display:inline-block; background:#fff; color:#1A1A1A; font-family:'Inter',sans-serif; font-size:12px; font-weight:600; padding:6px 14px; border-radius:4px;">Drama Series</span>
  </div>
</div>
```

### Stat block

```html
<div style="background:#7BA88E; padding:60px; text-align:center;">
  <p style="font-family:'Space Grotesk',sans-serif; font-size:96px; font-weight:700; line-height:1.00; letter-spacing:-2px; color:#fff; margin:0 0 12px;">47%</p>
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.70); margin:0;">PRODUCTIVITY INCREASE</p>
</div>
```

### CTA

```html
<a style="display:inline-block; background:#fff; color:#1A1A1A; font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:600; letter-spacing:1px; text-transform:uppercase; text-decoration:none; padding:14px 32px; border-radius:4px;">Learn More</a>
```
