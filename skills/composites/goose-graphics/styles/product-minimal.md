# Product Minimal

Apple-style product presentation. Pure white canvas, product photograph occupies the top ~60% of the frame with a subtle drop shadow, modest centered Inter headline + body beneath, and an underlined gray URL instead of a button CTA. The photograph is the hero; type is caption. No decoration, no color, no framing.

> Full prose reference: `styles/_full/product-minimal.md`

## Palette

| Hex | Role |
|-----|------|
| `#FFFFFF` | Pure white — primary background |
| `#1A1A1A` | Near-black — primary headline, URL hover |
| `#555555` | Body gray — paragraph color |
| `#777777` | URL gray — underlined URL CTA |
| `#999999` | Metadata gray — footer text |
| `#CCCCCC` | Disabled gray |
| `#FAFAFA` | Photo frame — barely-there photo container tint |
| `rgba(0,0,0,0.08)` | Photo shadow, footer rule |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Inter | 48px | 700 | 1.15 | -0.75px |
| Headline | Inter | 36px | 700 | 1.20 | -0.5px |
| Sub-heading | Inter | 24px | 700 | 1.25 | -0.25px |
| Body Large | Inter | 20px | 400 | 1.55 | 0 |
| Body | Inter | 18px | 400 | 1.55 | 0 |
| Caption | Inter | 14px | 400 | 1.50 | 0.1px |
| URL CTA | Inter | 16px | 500 | 1.00 | 0 |
| Footer | Inter | 12px | 400 | 1.50 | 0.3px |
| Big Number | Inter | 56px | 700 | 1.00 | -1px |

**Principles**

- Inter at 400, 500, 700 — three weights, one family.
- Headlines are captions to the product photo, not competing statements — keep modest (36px).
- Body at `#555555` (not near-black) so headline has visual primacy.

## Layout

- Pure white `#FFFFFF` background, no color.
- Product photo: top 60% of frame, 60-80px padding on all sides, `object-fit: contain` (never crop).
- Photo drop shadow: `filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08))`.
- Type block: centered beneath photo. Headline, 8-12px gap, body paragraph, 20px gap, underlined URL.
- Underlined URL CTA: `#777777`, Inter 500, `text-decoration: underline; text-underline-offset: 4px`.
- No buttons, no cards, no borders, no decoration anywhere.
- Optional footer: 1px rule `rgba(0,0,0,0.08)` above footer text.

## Do / Don't

**Do**

- Use pure white `#FFFFFF` as the background — genuinely pure, because the photo sets the temperature.
- Apply `filter: drop-shadow(0 24px 48px rgba(0,0,0,0.08))` to every product photo.
- Use underlined URLs as the CTA pattern — no filled buttons, ever.
- Center-align the text block below the photo.
- Keep headlines modest (36px) — they are captions, not heroes.
- Use `#555555` for body (never near-black) so the headline stays primary.

**Don't**

- Don't use colored backgrounds — not warm white, not tinted anything.
- Don't use filled button CTAs — underlined URL only.
- Don't use more than 3 text colors (`#1A1A1A`, `#555555`, `#777777`).
- Don't add any colored accents — no brand colors anywhere.
- Don't add borders to content elements — no cards, no frames.
- Don't use rounded corners — not on the photo, not on anything.
- Don't decorate — no icons, emoji, illustrations, patterns.
- Don't left-align — always centered below the photo.
- Don't scale headlines above 48px — they are not hero type.

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #FFFFFF;
  --color-headline: #1A1A1A;
  --color-body: #555555;
  --color-url: #777777;
  --color-metadata: #999999;

  --font: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --shadow-photo: 0 24px 48px rgba(0, 0, 0, 0.08);
}
```

### Product composition

```html
<div style="background:#fff; padding:60px 40px; min-height:960px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
  <div style="max-width:720px; width:100%; margin-bottom:60px;">
    <img src="product.png" style="width:100%; height:auto; object-fit:contain; filter:drop-shadow(0 24px 48px rgba(0,0,0,0.08));" alt="Product">
  </div>
  <div style="text-align:center; max-width:560px;">
    <h1 style="font-family:'Inter',sans-serif; font-size:36px; font-weight:700; line-height:1.20; letter-spacing:-0.5px; color:#1A1A1A; margin:0 0 16px;">The everyday carry, remade.</h1>
    <p style="font-family:'Inter',sans-serif; font-size:18px; font-weight:400; line-height:1.55; color:#555555; margin:0 0 28px;">A single object that replaces the five things you never quite liked about the rest of them.</p>
    <a style="font-family:'Inter',sans-serif; font-size:16px; font-weight:500; color:#777777; text-decoration:underline; text-underline-offset:4px;">buy at acme.com/carry</a>
  </div>
</div>
```

### Footer with hairline rule

```html
<div style="padding:24px 40px; border-top:1px solid rgba(0,0,0,0.08); text-align:center;">
  <p style="font-family:'Inter',sans-serif; font-size:12px; font-weight:400; letter-spacing:0.3px; color:#999999; margin:0;">Photographed by Olivia Wilson · December 2026</p>
</div>
```

### Stat variant (replaces product photo)

```html
<div style="background:#fff; padding:120px 40px; text-align:center;">
  <p style="font-family:'Inter',sans-serif; font-size:56px; font-weight:700; line-height:1.00; letter-spacing:-1px; color:#1A1A1A; margin:0 0 16px;">47%</p>
  <p style="font-family:'Inter',sans-serif; font-size:18px; font-weight:400; line-height:1.55; color:#555555; margin:0;">of customers reorder within the first month.</p>
</div>
```
