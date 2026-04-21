# Golden Dusk

Warm luxury on deep navy. Gold acts as the spice (accent only, never surface), DM Sans carries all type with open tracking for a premium, considered feel. Hairline borders and fading-light gradient rules are the signature ornaments. Think boutique hotel brand book meets annual-report polish.

> Full prose reference: `styles/_full/golden-dusk.md`

## Palette

| Hex | Role |
|-----|------|
| `#0f1629` | Deep navy background |
| `#f5f2ed` | Warm white — primary text |
| `#d4a853` | Gold — accent (numbers, rules, CTAs) |
| `#b87333` | Copper — secondary accent, labels |
| `#e8c877` | Light gold — hover/high-emphasis |
| `#b8923d` | Deep gold — hover/active |
| `#162040` | Navy surface (cards) |
| `#111b33` | Surface inset |
| `#1c2a50` | Navy light — nested containers |
| `#3d4a6b` | Slate — subtle dividers |
| `#6b7a9e` | Muted blue — tertiary text |
| `#8a96b5` | Silver blue — captions |
| `rgba(212,168,83,0.15)` | Hairline border |
| `rgba(212,168,83,0.3)` | Accent border |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&display=swap" rel="stylesheet">
```

- **Display / Body:** `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | DM Sans | 72px | 600 | 1.05 | +0.5px |
| Section Heading | DM Sans | 48px | 600 | 1.10 | +0.5px |
| Sub-heading | DM Sans | 32px | 500 | 1.20 | 0 |
| Body Large | DM Sans | 20px | 300 | 1.65 | 0 |
| Body | DM Sans | 16px | 400 | 1.70 | 0.1px |
| Caption | DM Sans | 13px | 400 | 1.50 | 0.5px |
| Big Number | DM Sans | 64px | 700 | 1.00 | -0.5px |
| Label | DM Sans | 13px | 500 | 1.00 | 2.5px UPPER |
| CTA | DM Sans | 15px | 600 | 1.00 | 1.5px UPPER |

**Principles**

- Light body (300) creates airy luxury; display at 500-600 — never 700+.
- Positive tracking on display (+0.5px) for open, premium feel.
- Hierarchy via tracking and subtle weight differences, not heavy contrast.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80.
- Hairline `1px solid rgba(212,168,83,0.15)` borders — never 2px+.
- Signature divider: `linear-gradient(90deg, transparent, #d4a853, transparent)` 80px × 1px.
- Cards: `#162040` bg, 4px radius only. Precise and architectural.
- One focal stat or headline per section — restraint is the hallmark.
- Left-align body; center-align titles, stats, CTAs.

## Do / Don't

**Do**

- Use gold sparingly — single focal points, numbers, CTA fills, thin accent bars.
- Use DM Sans 300 for body — the lightness signals confidence.
- Use gradient rules as the signature section divider (fading in and out).
- Use copper (`#b87333`) for secondary labels and metadata — gold's quieter companion.
- Keep CTA buttons understated — subtle gradient, moderate padding.

**Don't**

- Don't fill large surfaces with gold — it's an accent, not a background.
- Don't use display weights above 600 — heavy type breaks the refined feel.
- Don't use pure white/black; always warm white + deep navy.
- Don't use saturated competing colors (blue, green, orange).
- Don't use radius above 4px.
- Don't use borders thicker than 1px — hairline is the rule.

## CSS snippets

### `:root` variables

```css
:root {
  --color-navy: #0f1629;
  --color-warm-white: #f5f2ed;
  --color-gold: #d4a853;
  --color-copper: #b87333;
  --color-light-gold: #e8c877;
  --color-navy-surface: #162040;
  --color-surface-inset: #111b33;
  --color-muted-blue: #6b7a9e;
  --color-border-default: rgba(212, 168, 83, 0.15);
  --color-border-accent: rgba(212, 168, 83, 0.3);

  --font: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --gold-rule: linear-gradient(90deg, transparent, #d4a853, transparent);
  --radius-card: 4px;
}
```

### Title block (with fading gold rules)

```html
<div style="background:#0f1629; padding:80px 60px; text-align:center;">
  <div style="width:80px; height:1px; background:linear-gradient(90deg,transparent,#d4a853,transparent); margin:0 auto 40px;"></div>
  <h1 style="font-family:'DM Sans',sans-serif; font-size:72px; font-weight:600; line-height:1.05; letter-spacing:0.5px; color:#f5f2ed; margin:0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family:'DM Sans',sans-serif; font-size:20px; font-weight:300; line-height:1.65; color:#b87333; max-width:560px; margin:0 auto;">How AI coworkers are reshaping how teams operate.</p>
  <div style="width:80px; height:1px; background:linear-gradient(90deg,transparent,#d4a853,transparent); margin:40px auto 0;"></div>
</div>
```

### Numbered item (big gold numeral)

```html
<div style="display:flex; gap:24px; align-items:flex-start; padding:32px 0; border-bottom:1px solid rgba(212,168,83,0.15);">
  <span style="font-family:'DM Sans',sans-serif; font-size:48px; font-weight:700; line-height:1.00; color:#d4a853; min-width:72px;">01</span>
  <div>
    <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; letter-spacing:2.5px; text-transform:uppercase; color:#b87333; margin:0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family:'DM Sans',sans-serif; font-size:32px; font-weight:500; line-height:1.20; color:#f5f2ed; margin:0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family:'DM Sans',sans-serif; font-size:16px; font-weight:400; line-height:1.70; color:#6b7a9e; margin:0;">Monitor hiring signals, funding events, and tech-stack changes.</p>
  </div>
</div>
```

### Stat

```html
<div style="text-align:center; padding:40px 24px; background:#162040; border:1px solid rgba(212,168,83,0.15); border-radius:4px;">
  <p style="font-family:'DM Sans',sans-serif; font-size:64px; font-weight:700; line-height:1.00; letter-spacing:-0.5px; color:#d4a853; margin:0 0 8px;">47%</p>
  <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; letter-spacing:2.5px; text-transform:uppercase; color:#f5f2ed; margin:0;">FASTER RESPONSE</p>
</div>
```

### CTA

```html
<a style="display:inline-block; background:linear-gradient(180deg,#d4a853,#b8923d); color:#0f1629; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:16px 40px; border-radius:4px;">Get Started</a>
```
