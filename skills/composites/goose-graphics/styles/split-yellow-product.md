# Split Yellow Product

Two-thirds vivid-yellow headline slab on top, one-third warm-pale-gray body panel on bottom, with a yellow-gradient product photo panel on the side. Inter 900 at 92px stacked headlines; Inter 500 body for product descriptions. A stacked 2-line tracked wordmark anchors bottom-left. Premium packaging-brand poster.

> Full prose reference: `styles/_full/split-yellow-product.md`

## Palette

| Hex | Role |
|-----|------|
| `#f4d624` | Vivid yellow — primary surface, top block |
| `#141414` | Near-black — all text, wordmark, CTA fill |
| `#e8e5dd` | Warm pale gray — body copy panel (replaces white) |
| `#e5c51a` | Dark mustard — top of product photo gradient |
| `#b59a00` | Olive — bottom of product photo gradient |
| `#e8c91a` | Yellow hover |
| `#d9d6ce` | Gray deep — secondary surface |
| `#3a3a38` | Secondary gray — metadata |
| `rgba(20,20,20,0.12)` | Hairline border |
| `rgba(20,20,20,0.55)` | Muted text |
| `rgba(120,100,0,0.35)` | Product cast shadow |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Inter | 92px | 900 | 0.95 | -2px |
| Display Small | Inter | 72px | 900 | 0.98 | -1.5px |
| Section Heading | Inter | 48px | 900 | 1.00 | -1px |
| Sub-heading | Inter | 28px | 700 | 1.15 | -0.3px |
| Body Large | Inter | 22px | 500 | 1.45 | 0 |
| Body | Inter | 20px | 500 | 1.50 | 0 |
| Body Bold | Inter | 20px | 700 | 1.50 | 0 |
| Caption | Inter | 14px | 500 | 1.45 | 0.2px |
| Big Number | Inter | 96px | 900 | 0.95 | -2.5px |
| Wordmark | Inter | 14px | 700 | 1.10 | 2.5px UPPER |
| CTA | Inter | 16px | 700 | 1.00 | 0.4px |

**Principles**

- 2/3 yellow + 1/3 pale gray layout ratio — the split is the identity.
- Inter 900 headlines tightly tracked and crowding the yellow block.
- Inter 500 default body weight for product copy.

## Layout

- Grid: top 2/3 of canvas = yellow `#f4d624` block holding display headline; bottom 1/3 = warm pale gray `#e8e5dd` holding body copy.
- Side product panel (25-35% frame width on right) = yellow gradient `linear-gradient(180deg, #e5c51a, #b59a00)` with centered product photo and heavy cast shadow.
- Wordmark stacked 2 lines, bottom-left, tracked UPPER.
- Hairline dividers `1px rgba(20,20,20,0.12)` between split zones.

## Do / Don't

**Do**

- Enforce the 2/3 yellow + 1/3 gray vertical split — the proportion matters.
- Use a yellow-gradient product photo panel as the dedicated side column.
- Stack the wordmark 2 lines with 2.5px tracking in the bottom-left.
- Use Inter 500 for body (not 400) — keeps the voice confident.
- Apply a product-cast shadow (`rgba(120,100,0,0.35)`) for depth under the product.

**Don't**

- Don't use white — warm pale gray `#e8e5dd` replaces white.
- Don't use alternative accent colors — yellow is the only chromatic voice.
- Don't let headlines spill into the gray body zone.
- Don't use Inter weights between 500 and 900 for headlines.
- Don't curve the product photo frame — straight edges only.

## CSS snippets

### `:root` variables

```css
:root {
  --c-yellow: #f4d624;
  --c-yellow-dark: #e5c51a;
  --c-olive: #b59a00;
  --c-ink: #141414;
  --c-gray: #e8e5dd;
  --c-gray-deep: #d9d6ce;
  --c-gray-text-2: #3a3a38;

  --font: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --shadow-product: 0 24px 48px rgba(120, 100, 0, 0.35);
}
```

### Full split composition

```html
<div style="display:grid; grid-template-columns:1fr 420px; grid-template-rows:640px 320px; min-height:960px;">

  <div style="background:#f4d624; padding:60px; display:flex; flex-direction:column; justify-content:space-between;">
    <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#141414; margin:0;">THE PRESS KIT · 2026</p>
    <h1 style="font-family:'Inter',sans-serif; font-size:92px; font-weight:900; line-height:0.95; letter-spacing:-2px; color:#141414; margin:0;">
      Built<br>for the<br>everyday.
    </h1>
  </div>

  <div style="background:linear-gradient(180deg,#e5c51a,#b59a00); grid-row:1 / 3; display:flex; align-items:center; justify-content:center; padding:60px;">
    <img src="product.png" style="max-width:100%; height:auto; filter:drop-shadow(0 24px 48px rgba(120,100,0,0.35));" alt="Product">
  </div>

  <div style="background:#e8e5dd; padding:40px 60px; border-top:1px solid rgba(20,20,20,0.12);">
    <p style="font-family:'Inter',sans-serif; font-size:20px; font-weight:500; line-height:1.50; color:#141414; margin:0 0 16px; max-width:560px;">A product catalog for the objects that belong in every room — quietly useful, honestly made, priced like you'd expect a well-made object to be priced.</p>
    <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#141414; margin:0;">STUDIO<br>WILSON</p>
  </div>
</div>
```

### Big number variant

```html
<div style="background:#f4d624; padding:60px;">
  <p style="font-family:'Inter',sans-serif; font-size:96px; font-weight:900; line-height:0.95; letter-spacing:-2.5px; color:#141414; margin:0;">$42</p>
  <p style="font-family:'Inter',sans-serif; font-size:22px; font-weight:500; line-height:1.45; color:#141414; margin:12px 0 0;">flat shipping on every order, every day of the year.</p>
</div>
```

### CTA

```html
<a style="display:inline-block; background:#141414; color:#f4d624; font-family:'Inter',sans-serif; font-size:16px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase; text-decoration:none; padding:14px 28px;">SHOP THE KIT →</a>
```
