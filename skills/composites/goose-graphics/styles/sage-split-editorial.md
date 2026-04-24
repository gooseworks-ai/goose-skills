# Sage Split Editorial

Muted sage green background with a two-column split layout: left column holds large serif text with body copy and a CTA, right column features abstract generative art on a black panel. Tech-editorial hybrid — literary gravitas meets futuristic visual. Clean, spacious, intellectual.

> Full prose reference: `styles/_full/sage-split-editorial.md`

## Palette

| Hex | Role |
|-----|------|
| `#B8C9B8` | Sage green — primary background |
| `#F5F2ED` | Warm off-white — content card background |
| `#0A0A0A` | Black — art panel background |
| `#1A1A1A` | Near-black — primary text |
| `#444444` | Dark gray — body text |
| `#777777` | Medium gray — secondary text |
| `#F7A8C4` | Pink — generative art accent 1 |
| `#A8D8F0` | Light blue — generative art accent 2 (dotted orbits) |
| `#F5D78E` | Gold — generative art accent 3 |
| `#D4D4D4` | Light gray — borders, dividers |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Source+Serif+4:wght@400;500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
```

- **Display:** `'DM Serif Display', Georgia, 'Times New Roman', serif`
- **Body:** `'Source Serif 4', Georgia, serif`
- **UI / Metadata:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | DM Serif Display | 52px | 400 | 1.15 | -1px |
| Section Heading | DM Serif Display | 40px | 400 | 1.15 | -0.5px |
| Sub-heading | DM Serif Display Italic | 28px | 400 | 1.25 | 0 |
| Body Large | Source Serif 4 | 18px | 400 | 1.70 | 0.1px |
| Body | Source Serif 4 | 16px | 400 | 1.70 | 0.1px |
| Metadata | Inter | 11px | 500 | 1.30 | 1px UPPER |
| Caption | Inter | 10px | 400 | 1.30 | 0.5px |
| CTA | Inter | 14px | 500 | 1.00 | 0.3px |
| Big Number | DM Serif Display | 80px | 400 | 1.00 | -1.5px |

**Principles**

- DM Serif Display for headlines — literary, editorial weight.
- Source Serif 4 for body — warm, readable, book-like.
- Inter only for UI elements (CTAs, metadata, labels).

## Layout

- Sage green `#B8C9B8` full-bleed background.
- Content card: warm off-white `#F5F2ED`, occupies 80-90% of canvas, centered.
- Card split into two columns:
  - Left (55-60%): serif headline, body paragraphs, CTA button.
  - Right (40-45%): black `#0A0A0A` panel with abstract generative art (curved lines, dotted circles, flowing organic shapes in pink/blue/gold).
- CTA: outlined button with arrow (`Let's go ->`).
- Generous padding: 60-80px outer, 48-60px inner card.
- Art panel has no text — purely visual.

## Do / Don't

**Do**

- Split the card into text (left) + art (right) — this is the signature layout.
- Use serif fonts for all editorial text — literary, serious, intellectual.
- Fill the art panel with abstract generative elements: bezier curves, dotted orbital circles, organic blob shapes.
- Use pink, light blue, and gold for generative art accents on the black panel.
- Add a simple outlined CTA with an arrow.

**Don't**

- Don't use sans-serif for headlines — serif is mandatory for the editorial voice.
- Don't put text on the art panel — it's purely visual.
- Don't use bright or saturated background colors — sage is muted and calm.
- Don't use heavy borders on the content card — the card floats via background contrast.
- Don't make the art panel smaller than 35% of the card width.

## CSS snippets

### `:root` variables

```css
:root {
  --color-sage: #B8C9B8;
  --color-card: #F5F2ED;
  --color-art: #0A0A0A;
  --color-text: #1A1A1A;
  --color-body: #444444;
  --color-meta: #777777;
  --color-pink: #F7A8C4;
  --color-blue: #A8D8F0;
  --color-gold: #F5D78E;
  --color-border: #D4D4D4;

  --font-display: 'DM Serif Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Source Serif 4', Georgia, serif;
  --font-ui: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Split editorial card

```html
<div style="background:#B8C9B8; padding:60px; min-height:100vh; display:flex; align-items:center; justify-content:center;">
  <div style="background:#F5F2ED; display:flex; max-width:900px; width:100%; overflow:hidden;">
    <!-- Left: Text column -->
    <div style="flex:1; padding:60px;">
      <h1 style="font-family:'DM Serif Display',serif; font-size:52px; font-weight:400; line-height:1.15; letter-spacing:-1px; color:#1A1A1A; margin:0 0 32px;">The Future of<br>Brain-Computer<br>Interfaces is Non-Invasive</h1>
      <p style="font-family:'Source Serif 4',serif; font-size:16px; font-weight:400; line-height:1.70; color:#444; margin:0 0 16px;">Traditional deep learning paradigms have failed to bring non-invasive neurotechnology to the next level.</p>
      <p style="font-family:'Source Serif 4',serif; font-size:16px; font-weight:400; line-height:1.70; color:#444; margin:0 0 32px;">The potential to revolutionize the safe diagnosis and treatment of all neurological conditions is too great to ignore.</p>
      <a style="display:inline-block; border:1px solid #D4D4D4; color:#1A1A1A; font-family:'Inter',sans-serif; font-size:14px; font-weight:500; letter-spacing:0.3px; text-decoration:none; padding:12px 24px;">Let's go &rarr;</a>
    </div>
    <!-- Right: Art panel -->
    <div style="width:40%; background:#0A0A0A; position:relative; overflow:hidden; min-height:500px;">
      <svg width="100%" height="100%" viewBox="0 0 300 500" style="position:absolute; top:0; left:0;" fill="none">
        <!-- Dotted orbit circles -->
        <circle cx="150" cy="200" r="80" stroke="#A8D8F0" stroke-width="1" stroke-dasharray="3 4" fill="none"/>
        <circle cx="150" cy="300" r="60" stroke="#A8D8F0" stroke-width="1" stroke-dasharray="3 4" fill="none"/>
        <!-- Organic flowing shape -->
        <path d="M140 120 Q100 200 140 280 Q180 360 140 440" stroke="#777" stroke-width="1" fill="none"/>
        <path d="M160 120 Q200 200 160 280 Q120 360 160 440" stroke="#777" stroke-width="1" fill="none"/>
        <!-- Pink blob -->
        <ellipse cx="150" cy="250" rx="30" ry="50" fill="#F7A8C4" opacity="0.8"/>
        <ellipse cx="150" cy="350" rx="25" ry="40" fill="#F7A8C4" opacity="0.6"/>
      </svg>
    </div>
  </div>
</div>
```

### Stat block

```html
<div style="background:#F5F2ED; padding:60px; text-align:left;">
  <p style="font-family:'DM Serif Display',serif; font-size:80px; font-weight:400; line-height:1.00; letter-spacing:-1.5px; color:#1A1A1A; margin:0 0 12px;">47%</p>
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:500; letter-spacing:1px; text-transform:uppercase; color:#777; margin:0;">ACCURACY IMPROVEMENT</p>
</div>
```

### CTA

```html
<a style="display:inline-block; border:1px solid #D4D4D4; color:#1A1A1A; font-family:'Inter',sans-serif; font-size:14px; font-weight:500; letter-spacing:0.3px; text-decoration:none; padding:12px 24px;">Let's go &rarr;</a>
```
