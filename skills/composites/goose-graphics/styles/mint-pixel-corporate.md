# Mint Pixel Corporate

Friendly corporate template with a forest-green cover and mint-cream content slides. Signature move: pixel-staircase corner decorations (4-6 lime-green blocks ascending diagonally) and a lime slab running behind the content headline. Inter-replacement Nunito handles every role. Canva-business-template energy, warmed up.

> Full prose reference: `styles/_full/mint-pixel-corporate.md`

## Palette

| Hex | Role |
|-----|------|
| `#207A3E` | Forest green — cover slide background |
| `#EAF4C3` | Mint cream — content slide background |
| `#1E6B3A` | Dark forest — primary text on mint, pixel accent |
| `#A4D23C` | Lime green — headline slabs, pixel accent, accent squares |
| `#B4DC48` | Lime light — secondary pixel squares, hover |
| `#F5F8E6` | Cream — text on forest green cover |
| `#3E8A4E` | Text secondary — metadata, captions |
| `#6BA36B` | Text muted — tertiary |
| `rgba(30,107,58,0.2)` | Border soft — header strip dividers |
| `rgba(30,107,58,0.4)` | Border strong — prominent dividers |
| `rgba(30,107,58,0.08)` | Shadow ambient |
| `rgba(30,107,58,0.15)` | Shadow deep |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Cover Hero | Nunito | 52px | 700 | 1.15 | -0.3px |
| Section Heading | Nunito | 40px | 700 | 1.18 | -0.2px |
| Sub-heading | Nunito | 28px | 700 | 1.25 | 0 |
| Body Large | Nunito | 18px | 400 | 1.60 | 0 |
| Body | Nunito | 16px | 400 | 1.65 | 0 |
| Body Bold | Nunito | 16px | 700 | 1.65 | 0 |
| Metadata | Nunito | 12px | 600 | 1.40 | 0.3px |
| Footer Label | Nunito | 13px | 600 | 1.40 | 0.2px |
| Caption | Nunito | 12px | 500 | 1.50 | 0 |
| Big Number | Nunito | 64px | 800 | 1.00 | -0.5px |
| CTA | Nunito | 14px | 700 | 1.00 | 0.3px |

**Principles**

- Rounded geometric Nunito carries the friendly-corporate identity.
- Body always justified (`text-align: justify`) on content slides.
- Cover uses forest green; content uses mint cream.

## Layout

- Cover slide: forest-green `#207A3E` background, cream text, pixel-staircase decoration in lime.
- Content slide: mint-cream `#EAF4C3` background, dark-forest text, lime slab behind headline.
- Pixel-staircase: 4-6 flat lime squares (48-64px each) ascending diagonally from a corner, offset by their side length.
- Lime slab: horizontal rectangle `#A4D23C` running full width or 2/3, 80-120px tall, with the section heading set on top.
- Header strip: metadata row (brand name · category · date) with soft dividers.
- Footer: author name + handle.

## Do / Don't

**Do**

- Use forest green for cover and mint cream for content — alternating creates the rhythm.
- Add pixel-staircase decorations in lime at one corner of each slide (cover or content).
- Run a lime slab behind the content headline for the template look.
- Justify body copy on content slides.
- Use Nunito 800 for big numbers — the rounded heavy face reads as friendly-authoritative.

**Don't**

- Don't use both pixel-staircase corners simultaneously on one slide — pick one.
- Don't replace Nunito with another sans-serif — the roundness is the identity.
- Don't use colors outside the green/mint/lime family.
- Don't center-align body — justified or left-aligned only.
- Don't skip the metadata header strip — it's part of the template.

## CSS snippets

### `:root` variables

```css
:root {
  --c-forest: #207A3E;
  --c-forest-dark: #1E6B3A;
  --c-mint: #EAF4C3;
  --c-lime: #A4D23C;
  --c-lime-light: #B4DC48;
  --c-cream: #F5F8E6;
  --c-text-2: #3E8A4E;
  --c-text-3: #6BA36B;

  --font: 'Nunito', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Pixel-staircase corner

```html
<div style="position:absolute; bottom:0; left:0; display:grid; grid-template-columns:repeat(6, 48px); grid-template-rows:repeat(6, 48px);">
  <div style="grid-column:1; grid-row:6; background:#A4D23C;"></div>
  <div style="grid-column:2; grid-row:6; background:#A4D23C;"></div>
  <div style="grid-column:2; grid-row:5; background:#B4DC48;"></div>
  <div style="grid-column:3; grid-row:5; background:#A4D23C;"></div>
  <div style="grid-column:3; grid-row:4; background:#B4DC48;"></div>
  <div style="grid-column:4; grid-row:4; background:#A4D23C;"></div>
</div>
```

### Cover slide

```html
<div style="background:#207A3E; padding:60px; min-height:960px; position:relative;">
  <p style="font-family:'Nunito',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.3px; color:#F5F8E6; margin:0 0 60px;">Arowwai Industries · Business Tips · December, 2028</p>
  <h1 style="font-family:'Nunito',sans-serif; font-size:52px; font-weight:700; line-height:1.15; letter-spacing:-0.3px; color:#F5F8E6; margin:0 0 24px; max-width:720px;">Small business marketing playbook for a quiet quarter.</h1>
  <p style="font-family:'Nunito',sans-serif; font-size:18px; font-weight:400; line-height:1.60; color:#F5F8E6; max-width:520px; margin:0;">A 12-slide deck for founders, owner-operators, and solo marketers who want momentum without a bigger budget.</p>

  <div style="position:absolute; bottom:0; left:0; display:grid; grid-template-columns:repeat(5, 56px); grid-template-rows:repeat(5, 56px);">
    <div style="grid-column:1; grid-row:5; background:#A4D23C;"></div>
    <div style="grid-column:2; grid-row:5; background:#A4D23C;"></div>
    <div style="grid-column:2; grid-row:4; background:#B4DC48;"></div>
    <div style="grid-column:3; grid-row:4; background:#A4D23C;"></div>
    <div style="grid-column:3; grid-row:3; background:#B4DC48;"></div>
  </div>
</div>
```

### Content slide with lime slab

```html
<div style="background:#EAF4C3; padding:60px; min-height:960px; position:relative;">
  <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(30,107,58,0.2); padding-bottom:12px; margin-bottom:40px;">
    <p style="font-family:'Nunito',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.3px; color:#3E8A4E; margin:0;">Arowwai Industries</p>
    <p style="font-family:'Nunito',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.3px; color:#3E8A4E; margin:0;">Business Tips · 03/12</p>
  </div>

  <div style="background:#A4D23C; padding:20px 24px; display:inline-block; margin-bottom:32px;">
    <h2 style="font-family:'Nunito',sans-serif; font-size:40px; font-weight:700; line-height:1.18; letter-spacing:-0.2px; color:#1E6B3A; margin:0;">Start with one customer conversation a week.</h2>
  </div>

  <p style="font-family:'Nunito',sans-serif; font-size:16px; font-weight:400; line-height:1.65; color:#1E6B3A; text-align:justify; max-width:720px; margin:0 0 40px;">Most small-business marketing fails not from bad ideas but from untested ones. A weekly fifteen-minute customer call compounds faster than any ad spend — you'll know what people actually want by the end of the quarter, and half your campaign copy will write itself.</p>

  <p style="font-family:'Nunito',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.2px; color:#3E8A4E; margin:0;">Olivia Wilson · @oliviaw</p>
</div>
```

### Big number card

```html
<div style="background:#EAF4C3; border:1px solid rgba(30,107,58,0.2); padding:24px;">
  <p style="font-family:'Nunito',sans-serif; font-size:64px; font-weight:800; line-height:1.00; letter-spacing:-0.5px; color:#1E6B3A; margin:0;">47%</p>
  <p style="font-family:'Nunito',sans-serif; font-size:14px; font-weight:700; letter-spacing:0.3px; color:#3E8A4E; margin:4px 0 0;">FASTER RESPONSE</p>
</div>
```
