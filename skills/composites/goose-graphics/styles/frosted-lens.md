# Frosted Lens

Vibrant motion-blur chromatic backdrop with a large floating white card. The card is the "lens" — calm, data-forward, Swiss-precise. Outside: pink/teal/blue/amber streaks in motion. Inside: DM Sans, near-black text, sage-mint data bars, dusty-rose comparison data. Stripe-demo meets Figma-conference meets Series-B-announcement energy.

> Full prose reference: `styles/_full/frosted-lens.md`

## Palette

| Hex | Role |
|-----|------|
| `#ffffff` | White — primary card surface |
| `#1A1A1A` | Near-black — primary text |
| `#7CB68E` | Sage mint — primary data, CTAs, growth |
| `#5A9A6E` | Dark sage — hover |
| `#D4A0A0` | Dusty rose — secondary data |
| `#F5F5F5` | Snow — nested card surfaces |
| `#F8F8F8` | Surface inset |
| `#E8E8E8` | Light border |
| `#D1D5DB` | Mid gray — disabled |
| `#9CA3AF` | Cool gray — tertiary, axis labels |
| `#6B7280` | Warm gray — secondary text |
| `#4B5563` | Slate — secondary headings |
| `#374151` | Charcoal — high-emphasis body |
| `#E8457A` | BG Pink streak |
| `#3CBCB4` | BG Teal streak |
| `#2E5C9A` | BG Blue streak |
| `#D4943C` | BG Amber streak |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display / Body:** `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | DM Sans | 64px | 700 | 1.08 | -1.5px |
| Section Heading | DM Sans | 42px | 700 | 1.12 | -1px |
| Sub-heading | DM Sans | 28px | 600 | 1.20 | -0.5px |
| Body Large | DM Sans | 20px | 400 | 1.60 | 0 |
| Body | DM Sans | 16px | 400 | 1.60 | 0 |
| Caption | DM Sans | 13px | 400 | 1.45 | 0.15px |
| Big Number | DM Sans | 56px | 700 | 1.00 | -1px |
| Brand Label | DM Sans | 12px | 500 | 1.00 | 2.5px UPPER |
| Data Label | DM Sans | 18px | 600 | 1.00 | -0.25px |
| CTA | DM Sans | 15px | 600 | 1.00 | 0.3px |

**Principles**

- Negative tracking on display (-1 to -1.5px) for modern confidence.
- Wide tracking (2.5px) on uppercase brand labels for the "INFRENCECORE" spaced feel.
- Inside the card, restrained palette — all energy is in the backdrop.

## Layout

- Backdrop: motion-blur chromatic streaks using radial + linear gradients or a pre-rendered image. Colors: pink, teal, blue, amber.
- Card: `#ffffff`, 20-24px radius, medium shadow `0 16px 48px rgba(0,0,0,0.12)`.
- Card internal padding: 40-48px. Generous breathing room.
- Data bars: sage-mint primary at full opacity, dusty-rose secondary at reduced scale.
- One card per composition — the card is the lens.

## Do / Don't

**Do**

- Use motion-blur streaks for the backdrop, not flat color.
- Center a single white card with 20-24px radius — the card is the entire hero.
- Use sage-mint (`#7CB68E`) for hero/primary metrics; dusty rose (`#D4A0A0`) for comparisons.
- Use spaced uppercase brand labels (2.5px tracking, 12px).
- Use medium-depth warm-tinted shadow for card elevation.

**Don't**

- Don't use flat color backgrounds — the chromatic blur is mandatory.
- Don't use bright saturated data colors — sage/rose restraint is the rule.
- Don't crowd the card — one chart, one headline, one statement per card.
- Don't use heavy black text — always `#1A1A1A` warm near-black.
- Don't use more than 2 data colors (sage + rose).

## CSS snippets

### `:root` variables

```css
:root {
  --color-card: #ffffff;
  --color-text: #1A1A1A;
  --color-sage: #7CB68E;
  --color-sage-dark: #5A9A6E;
  --color-rose: #D4A0A0;
  --color-snow: #F5F5F5;
  --color-border: #E8E8E8;
  --color-warm-gray: #6B7280;
  --color-slate: #4B5563;

  --bg-pink: #E8457A;
  --bg-teal: #3CBCB4;
  --bg-blue: #2E5C9A;
  --bg-amber: #D4943C;

  --font: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 24px;
  --shadow-card: 0 16px 48px rgba(0, 0, 0, 0.12);
}
```

### Chromatic streak backdrop

```css
.backdrop {
  background:
    radial-gradient(ellipse 80% 60% at 10% 20%, rgba(232,69,122,0.8), transparent 60%),
    radial-gradient(ellipse 60% 80% at 90% 40%, rgba(60,188,180,0.7), transparent 60%),
    radial-gradient(ellipse 70% 50% at 50% 90%, rgba(46,92,154,0.6), transparent 60%),
    radial-gradient(ellipse 50% 50% at 80% 10%, rgba(212,148,60,0.5), transparent 60%),
    #2a2a40;
  filter: blur(40px);
}
```

### Hero card with data chart

```html
<div style="position:relative; min-height:100vh; display:flex; align-items:center; justify-content:center; overflow:hidden;">
  <div style="position:absolute; inset:-40px; background:radial-gradient(ellipse 80% 60% at 10% 20%,rgba(232,69,122,0.8),transparent 60%),radial-gradient(ellipse 60% 80% at 90% 40%,rgba(60,188,180,0.7),transparent 60%),radial-gradient(ellipse 70% 50% at 50% 90%,rgba(46,92,154,0.6),transparent 60%),#2a2a40; filter:blur(40px); z-index:0;"></div>
  <div style="position:relative; z-index:1; background:#fff; border-radius:24px; padding:48px; max-width:680px; box-shadow:0 16px 48px rgba(0,0,0,0.12);">
    <p style="font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:2.5px; text-transform:uppercase; color:#6B7280; margin:0 0 24px;">INFRENCECORE</p>
    <h2 style="font-family:'DM Sans',sans-serif; font-size:42px; font-weight:700; line-height:1.12; letter-spacing:-1px; color:#1A1A1A; margin:0 0 32px;">Workflows that keep growing.</h2>
    <div style="display:flex; align-items:flex-end; gap:24px; margin-bottom:24px;">
      <div style="flex:1; height:120px; background:#7CB68E; border-radius:8px;"></div>
      <div style="flex:1; height:180px; background:#7CB68E; border-radius:8px;"></div>
      <div style="flex:1; height:240px; background:#7CB68E; border-radius:8px;"></div>
    </div>
    <p style="font-family:'DM Sans',sans-serif; font-size:20px; font-weight:400; line-height:1.60; color:#4B5563; margin:0;">Teams 2.3× their output in the first 90 days.</p>
  </div>
</div>
```

### Sage CTA

```html
<a style="display:inline-block; background:#7CB68E; color:#fff; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600; letter-spacing:0.3px; text-decoration:none; padding:14px 32px; border-radius:12px;">See the report</a>
```
