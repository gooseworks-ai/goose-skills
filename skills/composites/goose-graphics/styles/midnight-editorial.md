# Midnight Editorial

Luxury magazine aesthetic rendered in darkness. Near-black canvas with warm cream text and copper accents — reads like a foil-stamped spine or an invitation-only programme. Playfair Display headlines carry the authority of letterpress; Inter body text at light weights defers to the serif display.

> Full prose reference: `styles/_full/midnight-editorial.md`

## Palette

| Hex | Role |
|-----|------|
| `#0d0d0d` | Midnight background (primary canvas) |
| `#f5f0e8` | Cream — primary text |
| `#c17f59` | Copper — accent (numbering, rules, CTA) |
| `#a89067` | Muted gold — secondary accent, captions |
| `#9a6347` | Deep copper hover/active |
| `#ede7db` | Warm white — high-emphasis text |
| `#1a1a1a` | Charcoal — card/container surface |
| `#141414` | Surface inset |
| `#2a2a2a` | Dark gray — nested containers |
| `#6b6b6b` | Soft gray — tertiary text |
| `rgba(245,240,232,0.1)` | Whisper-thin border |
| `rgba(193,127,89,0.3)` | Copper-tinted border (featured) |
| `rgba(197,127,89,0.08)` | Warm shadow |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
```

- **Display:** `'Playfair Display', Georgia, 'Times New Roman', serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Playfair Display | 72px | 700 | 1.05 | -1.5px |
| Section Heading | Playfair Display | 48px | 700 | 1.10 | -1px |
| Sub-heading | Playfair Display | 32px | 700 | 1.15 | -0.5px |
| Body Large | Inter | 20px | 300 | 1.60 | 0 |
| Body | Inter | 16px | 400 | 1.65 | 0 |
| Caption | Inter | 13px | 400 | 1.50 | 0.3px |
| Big Number | Playfair Display | 64px | 900 | 1.00 | -1px |
| Numbered Label | Inter | 14px | 600 | 1.00 | 2px UPPER |
| CTA | Inter | 15px | 600 | 1.00 | 0.8px UPPER |

**Principles**

- Light body (300-400), heavy display (700-900) — the weight contrast carries hierarchy.
- Negative tracking on display (-1.5 to -0.5px); positive tracking on labels/CTAs (0.3-2px).
- Body line-height 1.60-1.65 — generous reading rhythm on dark.
- Uppercase only for numbered labels and CTA buttons.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80.
- Left-align body content; center-align hero titles, stats, and CTAs.
- Copper rules: 2px tall × 60px wide, centered, used as section dividers.
- Cards: `#1a1a1a` bg, 4px radius, whisper-thin border, copper-tinted border for featured.
- 48px gaps between top-level sections; 24px between items within a section.
- Big serif numerals (`01`, `02`) in copper at 48px drive numbered lists.

## Do / Don't

**Do**

- Let the darkness do the work — treat `#0d0d0d` as a stage, not a void.
- Use copper (`#c17f59`) sparingly for focal points: CTA fill, numbers, rules, left-borders on quotes.
- Pair a 60×2px copper bar above and below title-slide headlines as the signature ornament.
- Use warm-tinted shadows (`rgba(197,127,89,0.08)`) to keep elevation on-palette.
- Italic Playfair at 400 for pull quotes.

**Don't**

- Don't use pure black (`#000`) or pure white — both break the warm palette.
- Don't use heavy Inter weights (600+) for body text — hierarchy depends on airy body against heavy serif.
- Don't use cool-tinted shadows or blue accents.
- Don't use decoration beyond the copper rules and accent borders.
- Don't uppercase headlines.

## CSS snippets

### `:root` variables

```css
:root {
  --color-midnight: #0d0d0d;
  --color-cream: #f5f0e8;
  --color-copper: #c17f59;
  --color-muted-gold: #a89067;
  --color-deep-copper: #9a6347;
  --color-charcoal: #1a1a1a;
  --color-surface-inset: #141414;
  --color-soft-gray: #6b6b6b;
  --color-border-default: rgba(245, 240, 232, 0.1);
  --color-border-accent: rgba(193, 127, 89, 0.3);
  --color-border-strong: rgba(245, 240, 232, 0.2);
  --shadow-warm: 0 8px 24px rgba(197, 127, 89, 0.08);

  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 4px;
}
```

### Title block (with copper rules)

```html
<div style="background:var(--color-midnight); padding:80px 60px; text-align:center;">
  <div style="width:60px; height:2px; background:var(--color-copper); margin:0 auto 32px;"></div>
  <h1 style="font-family:var(--font-display); font-size:72px; font-weight:700; line-height:1.05; letter-spacing:-1.5px; color:var(--color-cream); margin:0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family:var(--font-body); font-size:20px; font-weight:300; line-height:1.60; color:var(--color-muted-gold); max-width:600px; margin:0 auto;">How AI coworkers are reshaping how teams operate, collaborate, and deliver results.</p>
  <div style="width:60px; height:2px; background:var(--color-copper); margin:40px auto 0;"></div>
</div>
```

### Numbered item (big copper numeral)

```html
<div style="display:flex; gap:24px; align-items:flex-start; padding:32px 0; border-bottom:1px solid var(--color-border-default);">
  <span style="font-family:var(--font-display); font-size:48px; font-weight:700; line-height:1.00; color:var(--color-copper); min-width:72px;">01</span>
  <div>
    <p style="font-family:var(--font-body); font-size:14px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--color-muted-gold); margin:0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family:var(--font-display); font-size:32px; font-weight:700; line-height:1.15; letter-spacing:-0.5px; color:var(--color-cream); margin:0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family:var(--font-body); font-size:16px; font-weight:400; line-height:1.65; color:var(--color-soft-gray); margin:0;">Monitor hiring signals, funding events, and tech-stack changes to identify high-intent prospects.</p>
  </div>
</div>
```

### Pull quote (copper left bar, italic serif)

```html
<div style="padding:48px 40px; border-left:2px solid var(--color-copper); background:var(--color-surface-inset);">
  <p style="font-family:var(--font-display); font-size:32px; font-weight:400; font-style:italic; line-height:1.35; letter-spacing:-0.5px; color:var(--color-cream); margin:0 0 24px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <div style="display:flex; align-items:center; gap:12px;">
    <div style="width:32px; height:2px; background:var(--color-copper);"></div>
    <p style="font-family:var(--font-body); font-size:14px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--color-muted-gold); margin:0;">SARAH CHEN, VP OPERATIONS</p>
  </div>
</div>
```

### CTA block

```html
<div style="text-align:center; padding:60px 40px; background:var(--color-charcoal); border:1px solid var(--color-border-accent); border-radius:var(--radius-card);">
  <h2 style="font-family:var(--font-display); font-size:40px; font-weight:700; line-height:1.10; letter-spacing:-0.75px; color:var(--color-cream); margin:0 0 16px;">Ready to meet your team?</h2>
  <p style="font-family:var(--font-body); font-size:18px; font-weight:300; line-height:1.60; color:var(--color-soft-gray); max-width:480px; margin:0 auto 32px;">Deploy your first AI coworker in under five minutes.</p>
  <a style="display:inline-block; background:var(--color-copper); color:var(--color-midnight); font-family:var(--font-body); font-size:15px; font-weight:600; letter-spacing:0.8px; text-transform:uppercase; text-decoration:none; padding:16px 40px; border-radius:var(--radius-card);">Get Started</a>
</div>
```

### Stat display

```html
<div style="text-align:center; padding:40px 24px; background:var(--color-charcoal); border:1px solid var(--color-border-default); border-radius:var(--radius-card);">
  <p style="font-family:var(--font-display); font-size:64px; font-weight:900; line-height:1.00; letter-spacing:-1px; color:var(--color-copper); margin:0 0 8px;">47%</p>
  <p style="font-family:var(--font-body); font-size:14px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--color-cream); margin:0;">FASTER RESPONSE</p>
</div>
```
