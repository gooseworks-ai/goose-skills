# Deep Ocean

Bioluminescent calm. Deep blue-black canvas with cyan-teal glow accents that emit light rather than just show color. Single-family Satoshi throughout. The mood is underwater immersion — quiet authority lit by scattered points of luminous data.

> Full prose reference: `styles/_full/deep-ocean.md`

## Palette

| Hex | Role |
|-----|------|
| `#0a1628` | Deep ocean background |
| `#c8d6e5` | Luminous gray — primary text |
| `#00d4aa` | Cyan glow — accent (numbers, rules, CTAs) |
| `#3d6b99` | Muted blue — secondary accent, structural |
| `#33e8c0` | Bright cyan — hover/high-emphasis |
| `#009b7d` | Deep teal hover/active |
| `#0e1f3a` | Navy surface (cards) |
| `#091320` | Surface inset (recessed panels) |
| `#132847` | Navy mid — nested containers |
| `#5a7a9e` | Ocean gray — tertiary text |
| `#8aa0b8` | Silver sea — captions |
| `rgba(61,107,153,0.25)` | Default border |
| `rgba(0,212,170,0.3)` | Accent border + glow shadow |

## Typography

**Fontshare**

```html
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Satoshi', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Satoshi | 72px | 700 | 1.05 | -1px |
| Section Heading | Satoshi | 48px | 700 | 1.10 | -0.5px |
| Sub-heading | Satoshi | 32px | 700 | 1.15 | -0.3px |
| Body Large | Satoshi | 20px | 400 | 1.65 | 0 |
| Body | Satoshi | 16px | 400 | 1.70 | 0.1px |
| Caption | Satoshi | 13px | 400 | 1.50 | 0.3px |
| Big Number | Satoshi | 64px | 700 | 1.00 | -1px |
| Label | Satoshi | 14px | 500 | 1.00 | 2px UPPER |
| CTA | Satoshi | 15px | 700 | 1.00 | 1px UPPER |

**Principles**

- Single-family immersion — never switch fonts. Hierarchy via weight (700 vs 400) and size.
- Generous body line-height (1.65-1.70) for dark-surface legibility.
- Negative tracking on display, positive tracking (2px) on uppercase labels.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80.
- Gradient backgrounds: `linear-gradient(180deg, #0a1628 0%, #0e1f3a 100%)` for depth.
- Cyan rules: 2px tall × 60px wide, with `box-shadow: 0 0 12px rgba(0,212,170,0.3)`.
- Cards: `#0e1f3a` bg, 8px radius, muted-blue border.
- Big serif numerals (`01`, `02`) in cyan at 48px with `text-shadow: 0 0 20px rgba(0,212,170,0.3)`.
- Limit glow effects to 1-2 elements per section.

## Do / Don't

**Do**

- Apply glow effects via `box-shadow` / `text-shadow` on cyan accent elements.
- Use muted blue (`#3d6b99`) for secondary labels, metadata, structural borders.
- Use subtle gradient backgrounds to create depth between sections.
- Use horizontal cyan rules (2px × 60px, with glow) as section dividers.
- Center-align hero titles, stats, and CTAs. Left-align body.

**Don't**

- Don't use pure white for text — always `#c8d6e5` to keep the underwater tone.
- Don't use pure black for backgrounds — always `#0a1628`.
- Don't use warm accent colors (orange, red, yellow). Cyan + muted blue only.
- Don't use border-radius above 8px — technical, not bubbly.
- Don't over-glow — more than 2 glowing elements per section breaks the calm.

## CSS snippets

### `:root` variables

```css
:root {
  --color-deep-ocean: #0a1628;
  --color-luminous-gray: #c8d6e5;
  --color-cyan-glow: #00d4aa;
  --color-muted-blue: #3d6b99;
  --color-bright-cyan: #33e8c0;
  --color-navy-surface: #0e1f3a;
  --color-navy-mid: #132847;
  --color-surface-inset: #091320;
  --color-ocean-gray: #5a7a9e;
  --color-silver-sea: #8aa0b8;

  --color-border-default: rgba(61, 107, 153, 0.25);
  --color-border-accent: rgba(0, 212, 170, 0.3);

  --shadow-glow: 0 0 20px rgba(0, 212, 170, 0.3);
  --shadow-glow-soft: 0 0 12px rgba(0, 212, 170, 0.3);

  --font: 'Satoshi', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 8px;
}
```

### Title block (gradient + glowing rules)

```html
<div style="background:linear-gradient(180deg,#0a1628 0%,#0e1f3a 100%); padding:80px 60px; text-align:center;">
  <div style="width:60px; height:2px; background:#00d4aa; margin:0 auto 32px; box-shadow:0 0 12px rgba(0,212,170,0.3);"></div>
  <h1 style="font-family:'Satoshi',sans-serif; font-size:72px; font-weight:700; line-height:1.05; letter-spacing:-1px; color:#c8d6e5; margin:0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family:'Satoshi',sans-serif; font-size:20px; font-weight:400; line-height:1.65; color:#5a7a9e; max-width:600px; margin:0 auto;">How AI coworkers are reshaping the way teams operate.</p>
  <div style="width:60px; height:2px; background:#00d4aa; margin:40px auto 0; box-shadow:0 0 12px rgba(0,212,170,0.3);"></div>
</div>
```

### Numbered item with glowing numeral

```html
<div style="display:flex; gap:24px; align-items:flex-start; padding:32px 0; border-bottom:1px solid rgba(61,107,153,0.25);">
  <span style="font-family:'Satoshi',sans-serif; font-size:48px; font-weight:700; line-height:1.00; color:#00d4aa; min-width:72px; text-shadow:0 0 20px rgba(0,212,170,0.3);">01</span>
  <div>
    <p style="font-family:'Satoshi',sans-serif; font-size:14px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:#3d6b99; margin:0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family:'Satoshi',sans-serif; font-size:32px; font-weight:700; line-height:1.15; letter-spacing:-0.3px; color:#c8d6e5; margin:0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family:'Satoshi',sans-serif; font-size:16px; font-weight:400; line-height:1.70; color:#5a7a9e; margin:0;">Monitor hiring signals, funding events, and tech-stack changes to identify high-intent prospects.</p>
  </div>
</div>
```

### Glowing stat

```html
<div style="text-align:center; padding:40px 24px; background:#0e1f3a; border:1px solid rgba(61,107,153,0.25); border-radius:8px;">
  <p style="font-family:'Satoshi',sans-serif; font-size:64px; font-weight:700; line-height:1.00; letter-spacing:-1px; color:#00d4aa; margin:0 0 8px; text-shadow:0 0 24px rgba(0,212,170,0.3);">47%</p>
  <p style="font-family:'Satoshi',sans-serif; font-size:14px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:#c8d6e5; margin:0;">FASTER RESPONSE</p>
</div>
```

### CTA (glowing pill button)

```html
<a style="display:inline-block; background:#00d4aa; color:#0a1628; font-family:'Satoshi',sans-serif; font-size:15px; font-weight:700; letter-spacing:1px; text-transform:uppercase; text-decoration:none; padding:16px 40px; border-radius:8px; box-shadow:0 0 24px rgba(0,212,170,0.3);">Get Started</a>
```
