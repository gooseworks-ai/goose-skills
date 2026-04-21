# Heatwave Orange

Three-variant carousel system — orange, black, and near-white slides interleaved. Inter 900 stacked headlines 3-4 lines tall. Signature: hand-drawn peach/gold line-wave decorations + small lavender round arrow button. Pinterest-style corner metadata strip. The rhythm of alternating backgrounds is the identity.

> Full prose reference: `styles/_full/heatwave-orange.md`

## Palette

| Hex | Role |
|-----|------|
| `#E06A2C` | Heat orange — orange variant bg, primary accent |
| `#E37230` | Heat orange light — hover |
| `#F0EFEA` | Near-white — white variant bg (cream) |
| `#0D0D0D` | Near-black — black variant bg, primary text on white |
| `#FFFFFF` | Pure white — primary text on orange + black |
| `#F2A36A` | Peach highlight — signature block on white slides |
| `#E0896B` | Peach deep — line-wave on white slides |
| `#D0C8E8` | Lavender button — round arrow fill |
| `#C8BFE0` | Lavender deep — arrow hover |
| `#C9A46B` | Gold tan — line-wave on black slides |
| `#2B2B2B` | Charcoal — secondary text on white |
| `#6A6A6A` | Tertiary gray — muted metadata on white |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;800;900&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Inter | 88px | 900 | 1.05 | -2px |
| Display Stack | Inter | 76px | 900 | 1.05 | -1.5px |
| Section Heading | Inter | 56px | 900 | 1.08 | -1px |
| Sub-heading | Inter | 32px | 800 | 1.15 | -0.5px |
| Body Large | Inter | 22px | 600 | 1.45 | 0 |
| Body | Inter | 18px | 600 | 1.50 | 0 |
| Caption | Inter | 14px | 500 | 1.45 | 0.2px |
| Big Number | Inter | 120px | 900 | 1.00 | -3px |
| Tag Label | Inter | 16px | 800 | 1.00 | 0.3px |
| CTA | Inter | 18px | 800 | 1.00 | 0.3px |

**Principles**

- Inter 900 black for stacked headlines (3-4 lines).
- Heavy weights only (800-900) — this style doesn't do light.
- Body is rare; when used, 600 weight minimum.

## Layout

- Three-variant carousel: slides alternate orange → white → black → orange → white → black...
- Each variant has its own line-wave accent color (peach on white, gold tan on black, none on orange).
- Line-wave decoration: hand-drawn sine wave SVG, 2-3px stroke, 40-60px tall, placed behind or above headline.
- Small lavender round arrow button in one corner (swipe-to-next affordance).
- Stack headlines 3-4 lines — each line stands alone, left-aligned, bold block-like.
- Metadata strip (category · author · handle) in uppercase Inter 500 14px top or bottom.

## Do / Don't

**Do**

- Alternate orange / white / black variants slide-to-slide.
- Stack each headline on 3-4 lines, left-aligned, Inter 900.
- Use peach line-wave on white slides, gold-tan on black slides, no wave on orange.
- Add the small lavender round arrow button as the "swipe" affordance.
- Include a metadata strip with category · author · handle.

**Don't**

- Don't use the same background for consecutive slides.
- Don't use body text longer than 2 lines — stacked headlines are the identity.
- Don't use color accents outside the defined palette.
- Don't smooth the line-wave into a mathematical sine — keep it hand-drawn.
- Don't use light font weights.

## CSS snippets

### `:root` variables

```css
:root {
  --c-orange: #E06A2C;
  --c-orange-light: #E37230;
  --c-white: #F0EFEA;
  --c-black: #0D0D0D;
  --c-peach: #F2A36A;
  --c-peach-deep: #E0896B;
  --c-lavender: #D0C8E8;
  --c-gold-tan: #C9A46B;
  --c-charcoal: #2B2B2B;
  --c-gray: #6A6A6A;

  --font: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Orange variant hero

```html
<div style="background:#E06A2C; padding:60px 40px; min-height:960px; position:relative;">
  <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:500; letter-spacing:0.2px; text-transform:uppercase; color:#FFFFFF; margin:0 0 48px;">ESSAY · OLIVIA WILSON · @oliviaw</p>
  <h1 style="font-family:'Inter',sans-serif; font-size:88px; font-weight:900; line-height:1.05; letter-spacing:-2px; color:#FFFFFF; margin:0;">
    Heat<br>rearranges<br>everything<br>in August.
  </h1>
</div>
```

### White variant with peach line-wave

```html
<div style="background:#F0EFEA; padding:60px 40px; min-height:960px; position:relative;">
  <svg viewBox="0 0 400 60" width="300" height="45" style="position:absolute; top:80px; right:40px;">
    <path d="M0 30 Q50 0 100 30 T200 30 T300 30 T400 30" stroke="#E0896B" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>
  <h2 style="font-family:'Inter',sans-serif; font-size:76px; font-weight:900; line-height:1.05; letter-spacing:-1.5px; color:#0D0D0D; margin:120px 0 0;">
    But it also<br>slows every<br>conversation<br>down.
  </h2>
  <div style="position:absolute; bottom:40px; right:40px; width:64px; height:64px; border-radius:50%; background:#D0C8E8; display:flex; align-items:center; justify-content:center;">
    <span style="font-size:24px; color:#0D0D0D;">→</span>
  </div>
</div>
```

### Black variant with gold-tan wave + stat

```html
<div style="background:#0D0D0D; padding:60px 40px; min-height:960px; position:relative;">
  <svg viewBox="0 0 400 60" width="300" height="45" style="margin-bottom:32px;">
    <path d="M0 30 Q50 0 100 30 T200 30 T300 30 T400 30" stroke="#C9A46B" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>
  <p style="font-family:'Inter',sans-serif; font-size:120px; font-weight:900; line-height:1.00; letter-spacing:-3px; color:#E06A2C; margin:0;">47%</p>
  <p style="font-family:'Inter',sans-serif; font-size:32px; font-weight:800; letter-spacing:-0.5px; color:#FFFFFF; margin:16px 0 0; max-width:640px;">of decisions I made at 97°F I rewrote two weeks later in a cool kitchen.</p>
</div>
```

### Peach tag label

```html
<span style="display:inline-block; background:#F2A36A; color:#0D0D0D; font-family:'Inter',sans-serif; font-size:16px; font-weight:800; letter-spacing:0.3px; padding:6px 14px; border-radius:4px;">Example</span>
```
