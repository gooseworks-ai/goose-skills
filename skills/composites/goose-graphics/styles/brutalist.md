# Brutalist

Raw, structural, unapologetic. Massive uppercase Arial Black headlines that crowd container edges, hard 2-4px black borders, visible grid lines, no decoration, no shadows, no rounded corners. System fonts only — Arial + Courier New. Red (`#ff0000`) is the only color outside grayscale.

> Full prose reference: `styles/_full/brutalist.md`

## Palette

| Hex | Role |
|-----|------|
| `#ffffff` | Pure white background |
| `#000000` | Pure black — primary text, all borders |
| `#ff0000` | Pure red — accent (numbers, active borders, CTAs) |
| `#f0f0f0` | Light gray — alternate surface, inset |
| `#cccccc` | Medium gray — exposed grid lines |
| `#333333` | Dark gray — secondary body text |

## Typography

System fonts — no webfont load.

- **Display:** `Arial, Helvetica, sans-serif`
- **Monospace:** `'Courier New', Courier, monospace`

| Role | Font | Size | Weight | Line-height | Tracking | Transform |
|------|------|------|--------|-------------|----------|-----------|
| Display Hero | Arial | 120px | 900 | 0.90 | -2px | UPPERCASE |
| Section Heading | Arial | 80px | 900 | 0.95 | -1px | UPPERCASE |
| Sub-heading | Arial | 48px | 800 | 1.00 | -0.5px | UPPERCASE |
| Body Large | Arial | 20px | 400 | 1.55 | 0 | none |
| Body | Arial | 16px | 400 | 1.60 | 0 | none |
| Caption | Courier New | 12px | 400 | 1.40 | 1px | UPPERCASE |
| Big Number | Arial | 100px | 900 | 1.00 | -2px | none |
| Structural Label | Courier New | 14px | 400 | 1.00 | 3px | UPPERCASE |
| CTA | Arial | 18px | 800 | 1.00 | 2px | UPPERCASE |

**Principles**

- Display type is massive (80-120px) and crowds the container — deliberate overflow is fine.
- Arial Black 900 for display, Arial 400 for body, Courier New for all labels/captions.
- UPPERCASE everything that's structural; body stays mixed case for reading.

## Layout

- Format padding: carousel 40-60px · infographic 40/60 · slides 60-80px · poster 40/60.
- Thick black borders: 2px, 3px, or 4px solid `#000`.
- Exposed grid lines: 1px `#cccccc` as background CSS grid.
- Zero border-radius anywhere. Sharp corners only.
- Red (`#ff0000`) used for: active/current state borders, big stat numbers, CTA fills.
- No shadows. No gradients. No decoration. Content fills the frame.

## Do / Don't

**Do**

- Let display type crowd the frame (leading < 1.0, negative tracking, 120px+).
- Use 2-4px solid black borders as the primary structural device.
- Use Courier New UPPERCASE with 1-3px tracking for every label and caption.
- Use `#ff0000` sparingly — 1-2 red elements per section.
- Expose grid lines as part of the composition, not as mistakes.

**Don't**

- Don't use rounded corners, ever.
- Don't use drop shadows or gradients.
- Don't use decorative icons, emojis, or illustrations.
- Don't use colors outside the palette — only black/white/red/gray.
- Don't soften contrast — pure `#000` on pure `#fff` is the mandate.
- Don't use thin borders (< 2px) — brutalism is heavy.

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #ffffff;
  --color-ink: #000000;
  --color-red: #ff0000;
  --color-alt: #f0f0f0;
  --color-grid: #cccccc;
  --color-dark-gray: #333333;

  --font-display: Arial, Helvetica, sans-serif;
  --font-mono: 'Courier New', Courier, monospace;

  --border-thick: 3px solid #000;
  --border-red: 3px solid #ff0000;
}
```

### Title block (display type crowds the frame)

```html
<div style="background:#fff; padding:60px 40px; border:3px solid #000;">
  <p style="font-family:'Courier New',monospace; font-size:14px; font-weight:400; letter-spacing:3px; text-transform:uppercase; color:#000; margin:0 0 24px;">01 — STRATEGY</p>
  <h1 style="font-family:Arial,sans-serif; font-size:120px; font-weight:900; line-height:0.90; letter-spacing:-2px; text-transform:uppercase; color:#000; margin:0;">THE FUTURE<br>OF WORK.</h1>
  <div style="width:100%; height:3px; background:#000; margin:32px 0;"></div>
  <p style="font-family:Arial,sans-serif; font-size:20px; font-weight:400; line-height:1.55; color:#000; margin:0; max-width:640px;">How AI coworkers are reshaping how teams operate, collaborate, and deliver results.</p>
</div>
```

### Numbered item (big red stat on black border)

```html
<div style="display:flex; gap:0; border:3px solid #000;">
  <div style="min-width:180px; padding:24px; background:#ff0000; display:flex; align-items:center; justify-content:center;">
    <span style="font-family:Arial,sans-serif; font-size:100px; font-weight:900; line-height:1.00; letter-spacing:-2px; color:#000;">47</span>
  </div>
  <div style="padding:24px; border-left:3px solid #000;">
    <p style="font-family:'Courier New',monospace; font-size:14px; font-weight:400; letter-spacing:3px; text-transform:uppercase; color:#000; margin:0 0 8px;">FASTER RESPONSE</p>
    <p style="font-family:Arial,sans-serif; font-size:16px; font-weight:400; line-height:1.60; color:#333; margin:0;">Teams respond to leads nearly twice as fast with AI-powered workflows.</p>
  </div>
</div>
```

### CTA (black fill, red hover)

```html
<a style="display:inline-block; background:#000; color:#fff; font-family:Arial,sans-serif; font-size:18px; font-weight:800; letter-spacing:2px; text-transform:uppercase; text-decoration:none; padding:16px 32px; border:3px solid #000;">GET STARTED →</a>
```

### Exposed grid background

```css
.brutalist-grid {
  background-image:
    linear-gradient(to right, #cccccc 1px, transparent 1px),
    linear-gradient(to bottom, #cccccc 1px, transparent 1px);
  background-size: 40px 40px;
}
```
