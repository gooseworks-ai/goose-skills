# Iridescent Y2K

Stone beige canvas with a single chromatic iridescent blob (cyan → lavender → pink) as the hero visual. Brutalist editorial grid: `01`, `02`, `03` index columns, `|` rule separators, metadata tables. Archivo Black stacked-headline display type at 140px. Space Mono 500 for all metadata. Y2K club-flyer meets rigid editorial.

> Full prose reference: `styles/_full/iridescent-y2k.md`

## Palette

| Hex | Role |
|-----|------|
| `#ECE8DD` | Stone beige — primary background |
| `#111111` | Near-black ink — primary text, rules, borders |
| `#2B2B2B` | Ink secondary — softened small metadata |
| `#555555` | Ink tertiary — quieter metadata |
| `#D8D2C3` | Stone darker — rare recessed surface |
| `#F2EEE4` | Stone lighter — rare lifted surface |
| `#FF6EC7` | Hot pink — iridescent peak (warm) |
| `#8DEBFF` | Cyan shimmer — iridescent peak (cool) |
| `#C79DFF` | Lavender midtone — iridescent bridge |
| `#FFE8F0` | Pearl pink — highlight rim |
| `#F6F3FA` | Pearl lilac — soft blend |
| `rgba(255,110,199,0.25)` | Blob glow (pink halo) |
| `rgba(199,157,255,0.20)` | Blob glow deep (lavender halo) |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

- **Display:** `'Archivo Black', Impact, 'Arial Black', sans-serif`
- **Body / Monospace:** `'Space Mono', 'Courier New', Courier, monospace`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Archivo Black | 140px | 400 | 0.88 | -2px |
| Display Medium | Archivo Black | 104px | 400 | 0.90 | -1.5px |
| Display Small | Archivo Black | 72px | 400 | 0.92 | -1px |
| Subtitle | Space Mono | 18px | 500 | 1.45 | 0.4px |
| Body | Space Mono | 14px | 500 | 1.55 | 0.3px |
| Body Bold | Space Mono | 14px | 700 | 1.55 | 0.3px |
| Metadata Label | Space Mono | 13px | 500 | 1.35 | 0.6px |
| Metadata Value | Space Mono | 16px | 700 | 1.30 | 0.2px |
| Big Number | Archivo Black | 96px | 400 | 0.90 | -1.5px |
| Footer Text | Space Mono | 12px | 500 | 1.40 | 1.5px UPPER |
| CTA | Space Mono | 14px | 700 | 1.00 | 1.2px UPPER |

**Principles**

- Archivo Black stacked 1-3 words per line, left-aligned.
- Every metadata cell uses Space Mono — the brutalist grid is monospaced.
- Subtitles in sentence case; everything structural is UPPER with tracking.

## Layout

- Full-bleed stone beige `#ECE8DD` background.
- Central iridescent blob: CSS conic or radial gradient cycling pink → lavender → cyan → pearl.
- 12-column grid with visible `|` rules between columns (`border-right: 1px solid #111`).
- Metadata tables: rows of Space Mono label (uppercase tracked) + value pairs separated by `|`.
- Numerical indices `01 / 02 / 03` in top-left corner, Space Mono 700.

## Do / Don't

**Do**

- Render the iridescent blob as a large central focal, 40-60% frame size.
- Use the blob gradient: `conic-gradient(from 180deg, #FF6EC7, #C79DFF, #8DEBFF, #FFE8F0, #FF6EC7)` with 40-60px blur.
- Structure the layout as a rigid 12-column grid with vertical rules.
- Use Space Mono for every metadata role.
- Stack Archivo Black headlines left-aligned, 1-3 words per line.

**Don't**

- Don't use more than one blob per composition — it is the visual anchor.
- Don't use sans-serif body — Space Mono is mandatory.
- Don't use gradient backgrounds (other than the blob itself).
- Don't use color outside stone beige + iridescent palette.
- Don't soften the grid — visible rules are the editorial identity.

## CSS snippets

### `:root` variables

```css
:root {
  --color-stone: #ECE8DD;
  --color-ink: #111111;
  --color-ink-2: #2B2B2B;
  --color-ink-3: #555555;
  --color-pink: #FF6EC7;
  --color-cyan: #8DEBFF;
  --color-lavender: #C79DFF;
  --color-pearl: #FFE8F0;
  --color-pearl-lilac: #F6F3FA;

  --font-display: 'Archivo Black', Impact, 'Arial Black', sans-serif;
  --font-mono: 'Space Mono', 'Courier New', Courier, monospace;
}
```

### Iridescent blob

```html
<div style="position:relative; width:480px; height:480px; margin:0 auto;">
  <div style="position:absolute; inset:-40px; background:conic-gradient(from 180deg at 50% 50%, #FF6EC7, #C79DFF, #8DEBFF, #FFE8F0, #FF6EC7); border-radius:50%; filter:blur(40px); opacity:0.9;"></div>
  <div style="position:absolute; inset:0; background:conic-gradient(from 180deg at 50% 50%, #FF6EC7, #C79DFF, #8DEBFF, #FFE8F0, #FF6EC7); border-radius:50%;"></div>
</div>
```

### Hero layout (grid + blob + stacked display)

```html
<div style="background:#ECE8DD; padding:40px; min-height:100vh;">
  <div style="display:grid; grid-template-columns:repeat(12, 1fr); gap:16px; padding-bottom:16px; border-bottom:1px solid #111;">
    <p style="grid-column:span 2; font-family:'Space Mono',monospace; font-size:13px; font-weight:700; letter-spacing:0.6px; color:#111; margin:0;">01 / 03</p>
    <p style="grid-column:span 4; font-family:'Space Mono',monospace; font-size:13px; font-weight:500; letter-spacing:0.6px; color:#2B2B2B; margin:0;">VOL. IV · SUMMER ISSUE</p>
    <p style="grid-column:span 6; text-align:right; font-family:'Space Mono',monospace; font-size:13px; font-weight:500; letter-spacing:0.6px; color:#555; margin:0;">12.04.2026</p>
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:40px; padding-top:60px;">
    <div>
      <h1 style="font-family:'Archivo Black',sans-serif; font-size:140px; font-weight:400; line-height:0.88; letter-spacing:-2px; color:#111; margin:0;">FUTURE<br>LIVES<br>HERE.</h1>
      <p style="font-family:'Space Mono',monospace; font-size:18px; font-weight:500; line-height:1.45; color:#2B2B2B; margin:32px 0 0;">A brutalist-iridescent issue on the teams quietly building what's next.</p>
    </div>
    <div style="position:relative; width:100%; aspect-ratio:1;">
      <div style="position:absolute; inset:-20px; background:conic-gradient(from 180deg, #FF6EC7, #C79DFF, #8DEBFF, #FFE8F0, #FF6EC7); border-radius:50%; filter:blur(40px); opacity:0.85;"></div>
      <div style="position:absolute; inset:0; background:conic-gradient(from 180deg, #FF6EC7, #C79DFF, #8DEBFF, #FFE8F0, #FF6EC7); border-radius:50%;"></div>
    </div>
  </div>
</div>
```

### Metadata table

```html
<div style="display:grid; grid-template-columns:repeat(4, 1fr); border-top:1px solid #111; border-bottom:1px solid #111;">
  <div style="padding:16px; border-right:1px solid #111;">
    <p style="font-family:'Space Mono',monospace; font-size:13px; font-weight:500; letter-spacing:0.6px; text-transform:uppercase; color:#555; margin:0 0 4px;">VENUE</p>
    <p style="font-family:'Space Mono',monospace; font-size:16px; font-weight:700; color:#111; margin:0;">Palace Hall</p>
  </div>
  <div style="padding:16px; border-right:1px solid #111;">
    <p style="font-family:'Space Mono',monospace; font-size:13px; font-weight:500; letter-spacing:0.6px; text-transform:uppercase; color:#555; margin:0 0 4px;">DATE</p>
    <p style="font-family:'Space Mono',monospace; font-size:16px; font-weight:700; color:#111; margin:0;">20.10.2026</p>
  </div>
  <div style="padding:16px; border-right:1px solid #111;">
    <p style="font-family:'Space Mono',monospace; font-size:13px; font-weight:500; letter-spacing:0.6px; text-transform:uppercase; color:#555; margin:0 0 4px;">TIME</p>
    <p style="font-family:'Space Mono',monospace; font-size:16px; font-weight:700; color:#111; margin:0;">20:00 — 02:00</p>
  </div>
  <div style="padding:16px;">
    <p style="font-family:'Space Mono',monospace; font-size:13px; font-weight:500; letter-spacing:0.6px; text-transform:uppercase; color:#555; margin:0 0 4px;">ADMISSION</p>
    <p style="font-family:'Space Mono',monospace; font-size:16px; font-weight:700; color:#111; margin:0;">$12 / DOOR</p>
  </div>
</div>
```

### CTA

```html
<a style="display:inline-block; background:#111; color:#ECE8DD; font-family:'Space Mono',monospace; font-size:14px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; text-decoration:none; padding:14px 24px;">RSVP →</a>
```
