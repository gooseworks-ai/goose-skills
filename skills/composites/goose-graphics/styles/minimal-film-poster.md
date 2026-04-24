# Minimal Film Poster

Ultra-minimal off-white canvas with one massive black serif title, a small grayscale photograph, and a tiny multi-color accent bar. Extreme whitespace, cinematic restraint. Typography does all the work — the title is the poster. Inspired by A24 and Criterion Collection minimalism.

> Full prose reference: `styles/_full/minimal-film-poster.md`

## Palette

| Hex | Role |
|-----|------|
| `#F5F2ED` | Warm off-white — primary background |
| `#1A1A1A` | Near-black — primary title text |
| `#333333` | Dark gray — body text |
| `#666666` | Medium gray — secondary text, metadata |
| `#999999` | Light gray — tertiary, captions |
| `#E8E4DF` | Warm gray — subtle borders, dividers |
| `#D4A853` | Gold — accent bar segment 1 |
| `#4A7C59` | Forest green — accent bar segment 2 |
| `#C25B3F` | Burnt orange — accent bar segment 3 |
| `#3B6B8C` | Steel blue — accent bar segment 4 |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

- **Display:** `'DM Serif Display', Georgia, 'Times New Roman', serif`
- **Body / Metadata:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | DM Serif Display | 120px | 400 | 0.95 | -3px |
| Section Heading | DM Serif Display | 72px | 400 | 1.00 | -2px |
| Sub-heading | DM Serif Display Italic | 36px | 400 | 1.15 | -0.5px |
| Body Large | Inter | 18px | 300 | 1.70 | 0.2px |
| Body | Inter | 15px | 400 | 1.70 | 0.2px |
| Metadata | Inter | 11px | 500 | 1.40 | 1.5px UPPER |
| Big Number | DM Serif Display | 96px | 400 | 1.00 | -2px |
| Caption | Inter | 10px | 400 | 1.40 | 1px UPPER |
| CTA | Inter | 13px | 500 | 1.00 | 1px UPPER |

**Principles**

- Display title is the entire composition — massive, unhurried, no competition.
- Inter at light weight (300) for body — delicate, cinematic credits feel.
- Extreme size contrast: 120px title vs 11px metadata.

## Layout

- Off-white `#F5F2ED` full-bleed background.
- Title sits in the upper half, left-aligned or centered.
- Small B&W photo (if present): max 30% of canvas area, placed below or beside title.
- Multi-color accent bar: 4 thin horizontal color segments stacked (4px each), positioned near the top or alongside the title.
- Generous padding: 80-120px on all sides.
- Content occupies < 50% of the canvas — the rest is intentional void.

## Do / Don't

**Do**

- Let the title dominate — it should feel like it's the only thing on the page.
- Use the 4-color accent bar (gold, green, orange, blue) as a tiny 16px-tall mark.
- Use extreme whitespace — 60%+ of the canvas should be empty.
- Use grayscale photography only (if used at all).
- Use Inter 300 for body text — whisper-quiet supporting copy.

**Don't**

- Don't fill the canvas — emptiness is the design.
- Don't use bold body text — everything below the title is light/quiet.
- Don't use the accent colors for text — accent bar only.
- Don't use borders heavier than 1px.
- Don't add decorative elements — zero ornamentation.
- Don't use uppercase for the title — sentence or title case only.

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #F5F2ED;
  --color-title: #1A1A1A;
  --color-body: #333333;
  --color-meta: #666666;
  --color-faint: #999999;
  --color-border: #E8E4DF;

  --accent-gold: #D4A853;
  --accent-green: #4A7C59;
  --accent-orange: #C25B3F;
  --accent-blue: #3B6B8C;

  --font-display: 'DM Serif Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Poster hero

```html
<div style="background:#F5F2ED; padding:100px 80px; min-height:100vh; position:relative;">
  <!-- Accent bar -->
  <div style="position:absolute; top:80px; left:80px; width:16px;">
    <div style="height:4px; background:#D4A853;"></div>
    <div style="height:4px; background:#4A7C59;"></div>
    <div style="height:4px; background:#C25B3F;"></div>
    <div style="height:4px; background:#3B6B8C;"></div>
  </div>

  <!-- Metadata -->
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#666; margin:0 0 60px; padding-left:32px;">A Modern Classic — 2026</p>

  <!-- Title -->
  <h1 style="font-family:'DM Serif Display',serif; font-size:120px; font-weight:400; line-height:0.95; letter-spacing:-3px; color:#1A1A1A; margin:0 0 48px;">The<br>Office</h1>

  <!-- Body -->
  <p style="font-family:'Inter',sans-serif; font-size:15px; font-weight:300; line-height:1.70; color:#666; max-width:360px; margin:0;">A documentary-style look into the humorous and sometimes poignant lives of office employees.</p>
</div>
```

### Stat block

```html
<div style="background:#F5F2ED; padding:80px; text-align:left;">
  <p style="font-family:'DM Serif Display',serif; font-size:96px; font-weight:400; line-height:1.00; letter-spacing:-2px; color:#1A1A1A; margin:0 0 16px;">47%</p>
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#999; margin:0;">AUDIENCE GROWTH</p>
</div>
```

### CTA

```html
<a style="display:inline-block; border:1px solid #E8E4DF; color:#333; font-family:'Inter',sans-serif; font-size:13px; font-weight:500; letter-spacing:1px; text-transform:uppercase; text-decoration:none; padding:14px 32px;">Watch Now</a>
```
