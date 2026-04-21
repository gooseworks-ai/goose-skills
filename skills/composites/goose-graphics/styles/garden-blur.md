# Garden Blur

Blurred natural greenery backdrop with white cards floating above. Heavy Gaussian blur (30-50px) on a warm olive / sage photograph turns a specific image into a universal mood: warmth, growth, presence. Inside the cards: clean Inter, restrained palette, dusty rose for interactive accents. Kinfolk meets iOS notifications.

> Full prose reference: `styles/_full/garden-blur.md`

## Palette

| Hex | Role |
|-----|------|
| `#ffffff` | White — card surface |
| `#1c1c1e` | Near-black charcoal — primary text |
| `#a3867a` | Dusty rose — interactive accent (heart, active) |
| `#b89e8e` | Warm taupe — hover/light accent |
| `#8a6e62` | Deep rose — pressed/active |
| `#d4dcc8` | Sage tint — tag backgrounds |
| `#3a3a3c` | Dark gray — secondary text |
| `#636366` | Medium gray — tertiary |
| `#8e8e93` | Warm gray — handles, icons, metadata |
| `#c7c7cc` | Light gray — borders |
| `#f2f2f7` | Pale gray — hover/inset |
| `#faf8f6` | Tinted surface — featured card bg |
| `#6b7a52` | Backdrop olive (solid fallback) |
| `#8a9668` | Backdrop sage |
| `#7a6b52` | Backdrop warm brown |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Inter | 56px | 700 | 1.12 | -0.8px |
| Section Heading | Inter | 36px | 700 | 1.18 | -0.4px |
| Sub-heading | Inter | 24px | 600 | 1.25 | -0.2px |
| Body Large | Inter | 20px | 400 | 1.55 | -0.1px |
| Body | Inter | 16px | 400 | 1.60 | 0 |
| Display Name | Inter | 17px | 700 | 1.25 | 0 |
| Caption | Inter | 14px | 400 | 1.45 | 0 |
| Big Number | Inter | 52px | 700 | 1.00 | -0.5px |
| Label | Inter | 12px | 500 | 1.00 | 0.3px UPPER |
| CTA | Inter | 15px | 600 | 1.00 | 0.2px |

**Principles**

- One family, weight-driven hierarchy.
- Regular (400) for body keeps cards clean and iOS-like.
- Bold (700) for display names and hero — the only strong anchors.

## Layout

- Background: 30-50px Gaussian-blurred photograph of greenery. Use `backdrop-filter: blur(40px)` or pre-rendered JPG with `filter: blur(40px); transform: scale(1.1)` to prevent edge artifacts.
- Cards: white `#ffffff`, 24px radius, no visible border, minimal shadow (`0 4px 16px rgba(0,0,0,0.08)`).
- Card internal padding: 20-28px. Stack compactly like iOS notifications.
- Dusty rose `#a3867a` for heart icons, interactive accents, active states.
- Sage tint `#d4dcc8` for small tag pill backgrounds.

## Do / Don't

**Do**

- Use an actual photograph of greenery (olive/sage/warm-brown tones) as background, heavily blurred.
- Keep cards white and clean — the blurred backdrop does all the atmospheric work.
- Use large 24px card radius — the soft shape reads as a modern iOS component.
- Use dusty rose (`#a3867a`) as the single interactive accent (heart, like, save).
- Use warm medium gray (`#8e8e93`) for handles, icons, metadata.

**Don't**

- Don't use flat color backgrounds — the blur is the identity.
- Don't add heavy shadows — the depth of field does the elevation.
- Don't use colored card backgrounds — white only.
- Don't use serif fonts.
- Don't use more than 2 colors inside cards (charcoal + rose + 1-2 grays).

## CSS snippets

### `:root` variables

```css
:root {
  --color-card: #ffffff;
  --color-text: #1c1c1e;
  --color-rose: #a3867a;
  --color-rose-deep: #8a6e62;
  --color-sage-tint: #d4dcc8;
  --color-dark-gray: #3a3a3c;
  --color-medium-gray: #636366;
  --color-warm-gray: #8e8e93;
  --color-light-gray: #c7c7cc;
  --color-pale-gray: #f2f2f7;
  --color-backdrop-olive: #6b7a52;
  --color-backdrop-sage: #8a9668;

  --font: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 24px;
  --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.08);
}
```

### Blurred backdrop + card stack

```html
<div style="position:relative; min-height:100vh; overflow:hidden;">
  <div style="position:absolute; inset:-40px; background-image:url('greenery.jpg'); background-size:cover; filter:blur(40px); transform:scale(1.1); z-index:0;"></div>
  <div style="position:relative; z-index:1; padding:60px 40px; display:flex; flex-direction:column; gap:16px; max-width:520px; margin:0 auto;">
    <div style="background:#fff; border-radius:24px; padding:24px; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
        <div>
          <p style="font-family:'Inter',sans-serif; font-size:17px; font-weight:700; color:#1c1c1e; margin:0;">Sarah Chen</p>
          <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:400; color:#8e8e93; margin:0;">@sarahchen · 2h</p>
        </div>
        <span style="color:#a3867a; font-size:18px;">&#9825;</span>
      </div>
      <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:400; line-height:1.60; color:#1c1c1e; margin:0;">Spent the morning rewiring our onboarding. Three customers, three completely different paths — finally something that feels like a walk instead of a funnel.</p>
    </div>
  </div>
</div>
```

### Sage-tint tag

```html
<span style="display:inline-block; background:#d4dcc8; color:#3a3a3c; font-family:'Inter',sans-serif; font-size:12px; font-weight:500; letter-spacing:0.3px; text-transform:uppercase; padding:4px 10px; border-radius:12px;">INSIGHT</span>
```

### Featured card (tinted surface)

```html
<div style="background:#faf8f6; border-radius:24px; padding:28px; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
  <h3 style="font-family:'Inter',sans-serif; font-size:24px; font-weight:600; line-height:1.25; letter-spacing:-0.2px; color:#1c1c1e; margin:0 0 12px;">The quiet path forward</h3>
  <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:400; line-height:1.60; color:#3a3a3c; margin:0;">Some weeks you ship features. Other weeks you rearrange the furniture.</p>
</div>
```
