# Blueprint Sticky

Saturated cobalt-blue canvas with a blueprint grid overlay, tilted pink and yellow sticky notes pinned at various angles, massive Inter 900 white headline at bottom-left, and a stacked date label in a corner. Inter 900 for every headline. Scrapbook energy meets startup pitch deck.

> Full prose reference: `styles/_full/blueprint-sticky.md`

## Palette

| Hex | Role |
|-----|------|
| `#2450F5` | Cobalt blue — primary background |
| `#1F4AF0` | Cobalt deep — alternate for depth |
| `#4870F8` | Cobalt grid line — blueprint overlay (30% opacity) |
| `#FFFFFF` | Blueprint white — headlines, corner dates, URL |
| `#F4B8D4` | Sticky pink — pink sticky fill |
| `#F4E34A` | Sticky yellow — yellow sticky fill + curved underline |
| `#1A1A1A` | Sticky text — body copy on sticky notes |
| `#E89FBF` | Hover pink — pressed state |
| `#E5D23A` | Hover yellow — pressed state |
| `rgba(255,255,255,0.70)` | Muted white — URLs |
| `rgba(255,255,255,0.40)` | Faint white — metadata |
| `#EBDDD0` | Sticky edge warm — torn-edge highlight |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Inter | 96px | 900 | 0.95 | -3px |
| Section Heading | Inter | 64px | 900 | 1.00 | -2px |
| Sub-heading | Inter | 36px | 800 | 1.10 | -1px |
| Date Label Big | Inter | 48px | 600 | 1.00 | -1px |
| Date Label Small | Inter | 20px | 600 | 1.10 | 0.3px |
| Sticky Body Large | Inter | 22px | 500 | 1.45 | 0 |
| Sticky Body | Inter | 18px | 400 | 1.50 | 0 |
| Sticky Bold | Inter | 18px | 600 | 1.45 | 0 |
| URL Label | Inter | 16px | 500 | 1.20 | 0.5px |
| Caption | Inter | 13px | 500 | 1.45 | 0.4px |
| Big Number | Inter | 140px | 900 | 0.90 | -4px |
| CTA | Inter | 18px | 700 | 1.00 | 0.3px |

**Principles**

- Inter 900 for all display — the voice is massive.
- Sticky-note copy stays Inter 400-600 mixed case on near-black, reads like handwriting but crisp.
- White text on cobalt; near-black text on stickies.

## Layout

- Full-bleed cobalt `#2450F5` background.
- Blueprint grid overlay: CSS `linear-gradient` pair for vertical + horizontal 1px lines in `#4870F8` at 48-60px spacing, 30% opacity.
- Sticky notes: pink `#F4B8D4` or yellow `#F4E34A` rectangles, 240-320px wide, 2-4° random tilt, offset shadow `4px 8px 0 rgba(0,0,0,0.15)`.
- Corner date label: big number (48px) + month name (20px) stacked.
- Massive white headline anchored bottom-left (96px, 3-4 lines).
- Curved yellow underline (SVG) under emphasis words.

## Do / Don't

**Do**

- Overlay a blueprint grid on the cobalt canvas.
- Tilt every sticky note 2-4° randomly — axis-aligned stickies look dead.
- Use pink AND yellow sticky notes together — the pair is the identity.
- Anchor the display headline bottom-left with white Inter 900.
- Add a curved yellow SVG underline under emphasis words inside stickies.

**Don't**

- Don't use cobalt without the grid overlay.
- Don't use sticky-note colors other than the defined pink + yellow.
- Don't center-align display type — bottom-left is the rule.
- Don't use Inter weights below 800 for headlines.
- Don't use axis-aligned stickies.

## CSS snippets

### `:root` variables

```css
:root {
  --c-cobalt: #2450F5;
  --c-cobalt-deep: #1F4AF0;
  --c-grid: #4870F8;
  --c-white: #FFFFFF;
  --c-pink: #F4B8D4;
  --c-yellow: #F4E34A;
  --c-sticky-text: #1A1A1A;

  --font: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --grid-overlay:
    linear-gradient(to right, rgba(72,112,248,0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(72,112,248,0.3) 1px, transparent 1px);
}
```

### Full composition

```html
<div style="background:#2450F5; background-image:linear-gradient(to right,rgba(72,112,248,0.3) 1px,transparent 1px),linear-gradient(to bottom,rgba(72,112,248,0.3) 1px,transparent 1px); background-size:60px 60px; padding:60px; min-height:960px; position:relative;">

  <div style="position:absolute; top:60px; left:60px;">
    <p style="font-family:'Inter',sans-serif; font-size:48px; font-weight:600; line-height:1.00; letter-spacing:-1px; color:#fff; margin:0;">16</p>
    <p style="font-family:'Inter',sans-serif; font-size:20px; font-weight:600; line-height:1.10; letter-spacing:0.3px; color:#fff; margin:4px 0 0;">February</p>
  </div>

  <div style="position:absolute; top:180px; right:100px; transform:rotate(3deg); background:#F4B8D4; padding:24px; width:260px; box-shadow:4px 8px 0 rgba(0,0,0,0.15);">
    <p style="font-family:'Inter',sans-serif; font-size:22px; font-weight:500; line-height:1.45; color:#1A1A1A; margin:0;">Zen Time meditation — we shipped the first version in <b>48 hours</b>.</p>
  </div>

  <div style="position:absolute; top:420px; right:180px; transform:rotate(-4deg); background:#F4E34A; padding:20px; width:240px; box-shadow:4px 8px 0 rgba(0,0,0,0.15);">
    <p style="font-family:'Inter',sans-serif; font-size:18px; font-weight:400; line-height:1.50; color:#1A1A1A; margin:0;">Users stay for an average of <span style="background:none; position:relative;">11.2 minutes<svg width="120" height="8" style="position:absolute; left:0; bottom:-6px;"><path d="M0 4 Q30 0 60 4 T120 4" stroke="#1A1A1A" stroke-width="2" fill="none"/></svg></span>.</p>
  </div>

  <h1 style="position:absolute; bottom:80px; left:60px; font-family:'Inter',sans-serif; font-size:96px; font-weight:900; line-height:0.95; letter-spacing:-3px; color:#fff; margin:0; max-width:720px;">Build the habit. Ship the rest.</h1>

  <p style="position:absolute; bottom:40px; right:60px; font-family:'Inter',sans-serif; font-size:16px; font-weight:500; letter-spacing:0.5px; color:rgba(255,255,255,0.70); margin:0;">www.zentime.com</p>
</div>
```

### Sticky note helper

```css
.sticky {
  display: inline-block;
  padding: 20px 24px;
  max-width: 280px;
  transform: rotate(var(--tilt, -2deg));
  box-shadow: 4px 8px 0 rgba(0, 0, 0, 0.15);
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  color: #1A1A1A;
  line-height: 1.50;
}
.sticky.pink { background: #F4B8D4; }
.sticky.yellow { background: #F4E34A; }
```
