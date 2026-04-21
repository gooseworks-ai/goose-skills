# Matt Gray

Founder-creator Instagram-carousel aesthetic: Playfair Display headlines on a light gray canvas, with key phrases set in *italic forest green* as the signature "hook word" treatment, and yellow-lime pill tags labeling steps and frameworks. Inter handles all body copy in bold 600-700 for a confident, direct voice. Light gray (`#ececec`) reads as premium paper, not clinical white.

> Full prose reference: `styles/_full/matt-gray.md`

## Palette

| Hex | Role |
|-----|------|
| `#ececec` | Background (primary canvas) |
| `#1a1a1a` | Near-black primary text, dark pill CTA fill |
| `#2d5a1e` | Forest green — italic headline emphasis, decorative dots |
| `#1e4015` | Dark green hover/active state |
| `#d4e8d0` | Light green subtle tint |
| `#e5f59e` | Yellow-lime pill tags (steps, frameworks, categories) |
| `rgba(255,255,255,0.3)` | Card surface |
| `rgba(0,0,0,0.12)` | Card border |
| `#4a4a4a` | Secondary text (subtitles, descriptions) |
| `#777777` | Tertiary text (metadata, attributions) |
| `rgba(0,0,0,0.25)` | Muted (slide numbers) |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display:** `'Playfair Display', Georgia, 'Times New Roman', serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Playfair Display | 72px | 700 | 1.10 | -1px |
| Section Heading | Playfair Display | 48px | 700 | 1.15 | -0.5px |
| Sub-heading | Playfair Display | 32px | 600 | 1.20 | 0 |
| Body Large | Inter | 22px | 500 | 1.55 | 0 |
| Body | Inter | 18px | 600 | 1.55 | 0 |
| Big Number | Playfair Display | 64px | 800 | 1.00 | -0.5px |
| Tag Label | Inter | 14px | 600 | 1.00 | 0 |
| Framework Label | Inter | 14px | 500 | 1.00 | 2px UPPER |
| CTA | Inter | 16px | 700 | 1.00 | 0.3px |

**Principles**

- The "italic green hook": in every headline, set the key 2-3 words in `font-style: italic; color: #2d5a1e`. This is the style's identity.
- Inter at 600-700 for body, never under 500 — voice is direct, not airy.
- Uppercase is reserved for small framework labels only.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80 · story 120/60 (safe zones 160px top/bottom).
- Left-align content slides; center-align title and CTA slides.
- Cards: 12px radius, 1px border `rgba(0,0,0,0.12)`, 28px internal padding, semi-transparent white bg.
- Focus grid: one full-width card on top, two half-width cards below, sharing borders.
- Dot-grid texture (`radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px)` @ 32px) only on title + CTA slides.
- Vertical rhythm: 40-48px between top-level sections; 12px between tag and body inside cards.
- Never more than 3 cards per slide.

## Do / Don't

**Do**

- Use italic forest green for the headline hook phrase — the single most important visual element.
- Use yellow-lime pill tags for step numbers, category labels, framework markers.
- Use dark pill CTA buttons (`#1a1a1a` bg, white text, 40px radius).
- Include a bold one-line closing statement on content slides.
- Apply the dot-grid texture sparingly (title + CTA only).

**Don't**

- Don't use green for anything except italic emphasis and small decorative dots.
- Don't use body weights under 500 — this style speaks boldly.
- Don't use serif for body text (Playfair is headlines only).
- Don't use other accent colors (blue, red, orange) — only green + yellow-lime.
- Don't center-align body on content slides.
- Don't use sharp corners; 12px radius is mandatory on cards.

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #ececec;
  --color-near-black: #1a1a1a;
  --color-green: #2d5a1e;
  --color-yellow-tag: #e5f59e;
  --color-card-white: rgba(255, 255, 255, 0.3);
  --color-card-border: rgba(0, 0, 0, 0.12);
  --color-secondary: #4a4a4a;
  --color-tertiary: #777777;

  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 12px;
  --radius-tag: 20px;
  --radius-cta: 40px;

  --dot-grid: radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px);
  --dot-grid-size: 32px 32px;
}
```

### Title block (with dot grid + italic green hook)

```html
<div style="background:var(--color-bg); padding:80px 60px; text-align:center; position:relative;">
  <div style="position:absolute; inset:0; background-image:var(--dot-grid); background-size:var(--dot-grid-size); pointer-events:none;"></div>
  <div style="position:relative; z-index:1;">
    <div style="display:inline-block; font-family:var(--font-body); font-size:14px; font-weight:500; letter-spacing:2px; text-transform:uppercase; border:1px solid rgba(0,0,0,0.12); padding:8px 24px; background:rgba(255,255,255,0.5); margin-bottom:48px;">FRAMEWORK</div>
    <h1 style="font-family:var(--font-display); font-size:72px; font-weight:700; line-height:1.10; letter-spacing:-1px; color:var(--color-near-black); margin:0 0 32px;">
      How to build<br>
      <em style="color:var(--color-green);">a personal brand</em><br>
      (in just 7 days)
    </h1>
    <p style="font-family:var(--font-body); font-size:22px; font-weight:500; line-height:1.55; color:var(--color-secondary); max-width:650px; margin:0 auto;">A step-by-step framework for founders who want to build in public.</p>
  </div>
</div>
```

### Numbered step with yellow pill tag

```html
<div style="padding:32px 0;">
  <span style="display:inline-block; background:var(--color-yellow-tag); font-family:var(--font-body); font-size:14px; font-weight:600; padding:6px 16px; border-radius:var(--radius-tag); margin-bottom:12px;">Step 1</span>
  <p style="font-family:var(--font-body); font-size:18px; font-weight:700; line-height:1.55; color:var(--color-near-black); margin:0;">
    Build your personal brand.<br>
    Attention is the new oil.<br>
    Your personal brand is the pipeline.
  </p>
</div>
```

### Bordered card with tag

```html
<div style="border:1px solid var(--color-card-border); border-radius:var(--radius-card); padding:28px 24px; background:var(--color-card-white);">
  <span style="display:inline-block; background:var(--color-yellow-tag); font-family:var(--font-body); font-size:14px; font-weight:600; padding:6px 16px; border-radius:var(--radius-tag); margin-bottom:12px;">1. Writing</span>
  <p style="font-family:var(--font-body); font-size:18px; font-weight:600; line-height:1.55; margin:0;">It's your superpower. SEO is writing. Sales is writing. Hiring is writing.</p>
</div>
```

### CTA block (dark pill button)

```html
<a style="display:inline-block; background:var(--color-near-black); color:#fff; font-family:var(--font-body); font-size:16px; font-weight:700; letter-spacing:0.3px; text-decoration:none; padding:20px 52px; border-radius:var(--radius-cta);">Get Started Free</a>
```

### Stat block (big number + yellow tag)

```html
<div style="text-align:center; padding:40px 24px; border:1px solid var(--color-card-border); border-radius:var(--radius-card); background:var(--color-card-white);">
  <p style="font-family:var(--font-display); font-size:64px; font-weight:800; letter-spacing:-0.5px; color:var(--color-green); margin:0 0 8px;">47%</p>
  <span style="display:inline-block; background:var(--color-yellow-tag); font-family:var(--font-body); font-size:14px; font-weight:600; padding:6px 16px; border-radius:var(--radius-tag);">FASTER RESPONSE</span>
</div>
```
