# Card Toss

Scattered tilted cards on a pure-black void. Sunshine yellow, cornflower blue, and coral orange cards rotated at random small angles (-8° to +8°) like polaroids tossed on a table. Each card carries a testimonial, award, or rating. DM Serif Display for oversized headline type; DM Sans for body. The mood is "press kit wall meets editorial pinboard."

> Full prose reference: `styles/_full/card-toss.md`

## Palette

| Hex | Role |
|-----|------|
| `#000000` | Void black — primary background |
| `#1A1A1A` | Card text (on colored cards) |
| `#FFD60A` | Sunshine yellow — testimonial cards, stars |
| `#4A9FE5` | Cornflower blue — award/accolade cards, CTAs |
| `#F47B5E` | Coral orange — brand logos, quote cards |
| `#F5F0E0` | Off-white — decorative circles, soft accents |
| `#D4B000` | Dark yellow hover |
| `#3A7FBF` | Dark blue hover |
| `#D4664D` | Dark coral hover |
| `#E8E8E8` | Light gray — rare secondary text on dark |
| `#999999` | Medium gray — metadata |
| `#2A2A2A` | Charcoal — subtle dark surface |
| `#111111` | Near black — elevated dark surface |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display:** `'DM Serif Display', Georgia, 'Times New Roman', serif`
- **Body:** `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | DM Serif Display | 64px | 400 | 1.05 | -0.5px |
| Section Heading | DM Serif Display | 44px | 400 | 1.10 | -0.3px |
| Sub-heading | DM Serif Display | 32px | 400 | 1.15 | 0 |
| Body Large | DM Sans | 20px | 400 | 1.55 | 0 |
| Body | DM Sans | 16px | 400 | 1.60 | 0 |
| Caption | DM Sans | 13px | 500 | 1.45 | 0.3px |
| Big Number | DM Serif Display | 120px | 400 | 0.90 | -2px |
| Reviewer Name | DM Sans | 16px | 600 | 1.20 | 0 |
| CTA | DM Sans | 16px | 700 | 1.00 | 1px UPPER |
| Star Rating | System | 20px | 400 | 1.00 | 2px |

**Principles**

- DM Serif Display is used at one weight (400) — size drives impact.
- Oversized serif (120px big numbers) is the signature.
- Body is DM Sans — clean, small, supportive.

## Layout

- Background: pure `#000000` void. No texture, no gradient.
- Cards: 16-24px radius, colored fills, no borders, soft shadow `0 12px 32px rgba(0,0,0,0.4)`.
- Each card rotated with random angle `transform: rotate(-6deg)` through `rotate(6deg)`.
- Cards overlap slightly at edges. Stacking order matters — featured content on top.
- Decorative off-white `#F5F0E0` circles (80-160px) scattered behind cards as visual punctuation.

## Do / Don't

**Do**

- Rotate each card a small random amount (-8° to +8°).
- Use yellow for testimonials + star ratings, blue for awards + CTAs, coral for logos + quote cards.
- Overlap cards at edges to create a "tossed" stack.
- Use black star characters on yellow cards for ratings.
- Add decorative off-white circles behind cards as compositional anchors.

**Don't**

- Don't keep cards axis-aligned — flatness kills the style.
- Don't use more than 3 card colors (yellow + blue + coral).
- Don't use anything other than pure black for background.
- Don't use sans-serif for display type — DM Serif Display is mandatory.
- Don't use heavy text shadows — cards only.

## CSS snippets

### `:root` variables

```css
:root {
  --color-void: #000000;
  --color-card-text: #1A1A1A;
  --color-yellow: #FFD60A;
  --color-blue: #4A9FE5;
  --color-coral: #F47B5E;
  --color-off-white: #F5F0E0;

  --font-display: 'DM Serif Display', Georgia, 'Times New Roman', serif;
  --font-body: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --shadow-card: 0 12px 32px rgba(0, 0, 0, 0.4);
}
```

### Tossed-card composition

```html
<div style="position:relative; background:#000; min-height:100vh; padding:80px 60px; overflow:hidden;">
  <div style="position:absolute; top:120px; right:80px; width:140px; height:140px; border-radius:50%; background:#F5F0E0; opacity:0.2;"></div>
  <div style="position:absolute; bottom:100px; left:100px; width:100px; height:100px; border-radius:50%; background:#F5F0E0; opacity:0.15;"></div>

  <div style="position:absolute; top:140px; left:180px; transform:rotate(-4deg); background:#FFD60A; border-radius:20px; padding:32px; width:360px; box-shadow:0 12px 32px rgba(0,0,0,0.4);">
    <p style="letter-spacing:2px; font-size:20px; color:#1A1A1A; margin:0 0 12px;">★★★★★</p>
    <p style="font-family:'DM Serif Display',serif; font-size:28px; font-weight:400; line-height:1.25; color:#1A1A1A; margin:0 0 16px;">"Goose saved our team six hours a week — week one."</p>
    <p style="font-family:'DM Sans',sans-serif; font-size:16px; font-weight:600; color:#1A1A1A; margin:0;">Sarah Chen, VP Ops</p>
  </div>

  <div style="position:absolute; top:340px; left:380px; transform:rotate(3deg); background:#4A9FE5; border-radius:20px; padding:32px; width:320px; box-shadow:0 12px 32px rgba(0,0,0,0.4);">
    <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:#1A1A1A; margin:0 0 12px;">BEST IN CLASS 2025</p>
    <p style="font-family:'DM Serif Display',serif; font-size:120px; font-weight:400; line-height:0.90; letter-spacing:-2px; color:#1A1A1A; margin:0;">#1</p>
  </div>

  <div style="position:absolute; top:520px; left:140px; transform:rotate(-6deg); background:#F47B5E; border-radius:20px; padding:32px; width:280px; box-shadow:0 12px 32px rgba(0,0,0,0.4);">
    <p style="font-family:'DM Serif Display',serif; font-size:44px; font-weight:400; line-height:1.10; letter-spacing:-0.3px; color:#1A1A1A; margin:0;">"A category-defining product."</p>
    <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; letter-spacing:0.3px; color:#1A1A1A; margin:16px 0 0;">— TechCrunch</p>
  </div>
</div>
```

### Blue CTA card (tilted)

```html
<a style="display:inline-block; transform:rotate(-2deg); background:#4A9FE5; color:#1A1A1A; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; letter-spacing:1px; text-transform:uppercase; text-decoration:none; padding:18px 36px; border-radius:16px; box-shadow:0 12px 32px rgba(0,0,0,0.4);">READ THE REVIEWS</a>
```
