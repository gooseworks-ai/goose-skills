# Masked Object Editorial

Royal-navy canvas with a pale-cream italic Playfair Display hero headline over a photograph that's been CSS-clipped into an object silhouette (bottle, lamp, sculpture, plant). Pure white Inter body sits beneath in stacked 3-line declaratives. A powder-blue footer band runs full width holding a navy CTA label.

> Full prose reference: `styles/_full/masked-object-editorial.md`

## Palette

| Hex | Role |
|-----|------|
| `#112A70` | Royal navy — primary background, every slide |
| `#F5F0E6` | Pale cream — italic serif display headlines |
| `#FFFFFF` | Pure white — sans body copy |
| `#B8D4E8` | Powder blue — full-width footer band |
| `#112A70` | Navy on powder — footer CTA label text |
| `#0A1F55` | Deep navy shadow — optional inset |
| `rgba(245,240,230,0.75)` | Cream soft — attributions |
| `rgba(245,240,230,0.40)` | Cream muted — slide numbers |
| `rgba(245,240,230,0.18)` | Hairline cream — rare divider |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600;1,700;1,800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

- **Display:** `'Playfair Display', Georgia, 'Times New Roman', serif` (always italic)
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Style | Line-height | Tracking |
|------|------|------|--------|-------|-------------|----------|
| Display Hero | Playfair Display | 72px | 700 | italic | 1.05 | -0.5px |
| Display Large | Playfair Display | 60px | 700 | italic | 1.08 | -0.5px |
| Section Heading | Playfair Display | 48px | 700 | italic | 1.10 | -0.25px |
| Sub-heading | Playfair Display | 36px | 600 | italic | 1.15 | 0 |
| Body Large | Inter | 28px | 500 | normal | 1.30 | 0 |
| Body | Inter | 22px | 500 | normal | 1.40 | 0 |
| Body Small | Inter | 18px | 400 | normal | 1.50 | 0 |
| Big Number | Playfair Display | 96px | 800 | italic | 1.00 | -1px |
| Footer CTA | Inter | 22px | 600 | normal | 1.00 | 0.2px |
| Small Caps Label | Inter | 13px | 600 | normal | 1.00 | 1.5px UPPER |

**Principles**

- Every Playfair Display use is italic — never upright.
- Body is ALWAYS stacked 3 short declarative lines in white Inter 500.
- One serif italic headline + one sans body stack + one object mask per slide.

## Layout

- Full-bleed royal navy `#112A70`.
- Hero object: a photograph masked into an object silhouette using `clip-path`. Shapes: wine bottle, table lamp, perfume, plant, sculpture.
- Italic cream headline centered or lower-left.
- Body: 3 short stacked declarative lines in white Inter.
- Full-width powder-blue footer band (32-48px tall) at bottom holding navy CTA label.

## Do / Don't

**Do**

- CSS `clip-path` the photograph into a single object silhouette (bottle, lamp, plant).
- Use italic Playfair Display for every display role.
- Stack body copy on exactly 3 short declarative lines.
- Use the powder-blue footer band as the signature closing element.
- Use Inter uppercase tracked labels only for small metadata.

**Don't**

- Don't use upright Playfair — italic is mandatory.
- Don't use colors outside the navy + cream + powder palette.
- Don't center the masked object in every slide — offset it for visual rhythm.
- Don't write body copy in more than 3 lines.
- Don't replace the footer band with a button.

## CSS snippets

### `:root` variables

```css
:root {
  --c-navy: #112A70;
  --c-cream: #F5F0E6;
  --c-white: #FFFFFF;
  --c-powder: #B8D4E8;
  --c-cream-soft: rgba(245, 240, 230, 0.75);
  --c-cream-muted: rgba(245, 240, 230, 0.40);

  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Bottle clip-path

```css
.mask-bottle {
  clip-path: polygon(
    40% 0%, 60% 0%,
    60% 15%, 65% 20%, 65% 30%,
    70% 35%, 70% 95%, 65% 100%,
    35% 100%, 30% 95%, 30% 35%,
    35% 30%, 35% 20%, 40% 15%
  );
}
```

### Full composition

```html
<div style="background:#112A70; min-height:960px; position:relative; display:flex; flex-direction:column;">

  <div style="flex:1; display:grid; grid-template-columns:1fr 1fr; gap:40px; padding:80px 60px;">
    <div>
      <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(245,240,230,0.75); margin:0 0 24px;">NO. 04 · AUTUMN</p>
      <h1 style="font-family:'Playfair Display',serif; font-style:italic; font-size:72px; font-weight:700; line-height:1.05; letter-spacing:-0.5px; color:#F5F0E6; margin:0 0 40px;">A quieter shape<br>for a louder<br>hour.</h1>
      <p style="font-family:'Inter',sans-serif; font-size:28px; font-weight:500; line-height:1.30; color:#FFFFFF; margin:0;">One bottle.<br>One evening.<br>Half the noise.</p>
    </div>

    <div style="display:flex; align-items:center; justify-content:center;">
      <div style="width:240px; height:440px; background-image:url('bottle-photo.jpg'); background-size:cover; clip-path:polygon(40% 0%, 60% 0%, 60% 15%, 65% 20%, 65% 30%, 70% 35%, 70% 95%, 65% 100%, 35% 100%, 30% 95%, 30% 35%, 35% 30%, 35% 20%, 40% 15%);"></div>
    </div>
  </div>

  <div style="background:#B8D4E8; padding:16px 60px;">
    <p style="font-family:'Inter',sans-serif; font-size:22px; font-weight:600; line-height:1.00; letter-spacing:0.2px; color:#112A70; margin:0; text-align:center;">Shop the autumn edit →</p>
  </div>
</div>
```

### Italic stat

```html
<div style="background:#112A70; padding:60px; text-align:center;">
  <p style="font-family:'Playfair Display',serif; font-style:italic; font-size:96px; font-weight:800; line-height:1.00; letter-spacing:-1px; color:#F5F0E6; margin:0;">47%</p>
  <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(245,240,230,0.75); margin:8px 0 0;">REORDER WITHIN THE FIRST MONTH</p>
</div>
```
