# Highlighter Yellow

Saturated yellow canvas, heavy Inter 900 black type, and a white-rectangle italic emphasis word as the signature move. A URL pill search-bar lives at the bottom. The mood is "Google search result made into a poster" — loud, punchy, extremely legible at thumbnail size.

> Full prose reference: `styles/_full/highlighter-yellow.md`

## Palette

| Hex | Role |
|-----|------|
| `#F4DC2E` | Highlighter yellow — primary background (every slide) |
| `#F6E038` | Bright yellow — alternate variation |
| `#F4D41E` | Deep yellow — darker variant |
| `#1A1A1A` | Near-black — all primary text, dividers, dots, icons |
| `#FFFFFF` | Pure white — white-rect emphasis, URL pill |
| `#3A3A3A` | Secondary text — rare secondary copy |
| `rgba(26,26,26,0.6)` | Tertiary text — URL domain |
| `rgba(26,26,26,0.12)` | Dot grid — background texture |
| `rgba(26,26,26,0.4)` | Muted — slide numbers, watermarks |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,500;0,700;0,900;1,500;1,900&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Inter | 72px | 900 | 1.08 | -1.5px |
| Headline Large | Inter | 64px | 900 | 1.08 | -1px |
| Headline | Inter | 56px | 900 | 1.08 | -1px |
| Emphasis Italic | Inter | matches headline | 900 italic | matches | -1px |
| Sub-heading | Inter | 32px | 900 | 1.15 | -0.5px |
| Body Large | Inter | 22px | 500 | 1.55 | 0 |
| Body | Inter | 18px | 500 | 1.55 | 0 |
| Caption | Inter | 14px | 500 | 1.50 | 0.2px |
| URL Pill Text | Inter | 16px | 500 | 1.00 | 0 |
| Icon Label | Inter | 12px | 700 | 1.00 | 1px UPPER |

**Principles**

- Inter 900 black weight for all headlines. No 700. No 500 in headline role.
- The "white rectangle with italic word inside" is THE move — appears on every slide.
- Body is rare. This style is headline-driven.

## Layout

- Full-bleed `#F4DC2E`.
- White rectangle emphasis: inline `<span>` with `background: #fff; padding: 4px 12px; font-style: italic`. Sits on one word inside a larger black headline.
- URL pill at bottom: white rounded-rectangle holding a search-bar lookalike with a small icon and the domain text.
- Optional dot-grid background texture: `radial-gradient(circle, rgba(26,26,26,0.12) 1px, transparent 1px)` at 24px spacing.
- Left-align headline; anchor URL pill bottom-left or bottom-center.

## Do / Don't

**Do**

- Use Inter 900 black for every headline — hierarchy through size, not weight.
- Apply the white-rect italic emphasis to one word per headline.
- Build a bottom URL pill as the signature "search bar" CTA.
- Use dot-grid background texture on hero slides for subtle depth.
- Keep text all near-black `#1A1A1A`, not pure black.

**Don't**

- Don't use Inter weights below 900 for headlines.
- Don't use more than one white-rect emphasis per slide.
- Don't use colors beyond yellow, near-black, white.
- Don't use curved or serif type.
- Don't fill the canvas with body — this is a headline format.

## CSS snippets

### `:root` variables

```css
:root {
  --color-yellow: #F4DC2E;
  --color-yellow-deep: #F4D41E;
  --color-ink: #1A1A1A;
  --color-white: #FFFFFF;
  --color-url-domain: rgba(26, 26, 26, 0.6);
  --color-dot: rgba(26, 26, 26, 0.12);

  --font: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --dot-grid: radial-gradient(circle, rgba(26,26,26,0.12) 1px, transparent 1px);
}
```

### Hero with white-rect emphasis

```html
<div style="background:#F4DC2E; padding:60px 40px; min-height:960px; position:relative; background-image:radial-gradient(circle,rgba(26,26,26,0.12) 1px,transparent 1px); background-size:24px 24px;">
  <h1 style="font-family:'Inter',sans-serif; font-size:72px; font-weight:900; line-height:1.08; letter-spacing:-1.5px; color:#1A1A1A; margin:0; max-width:720px;">
    How do I <span style="background:#fff; font-style:italic; padding:4px 14px; box-shadow:2px 2px 0 rgba(26,26,26,0.1);">actually</span> get my first 100 customers?
  </h1>

  <div style="position:absolute; bottom:60px; left:40px; display:flex; align-items:center; gap:12px; background:#fff; padding:12px 20px; border-radius:40px; box-shadow:0 4px 12px rgba(26,26,26,0.1);">
    <span style="font-size:16px;">🔍</span>
    <span style="font-family:'Inter',sans-serif; font-size:16px; font-weight:500; color:rgba(26,26,26,0.6);">— growth.guide/first-100</span>
  </div>
</div>
```

### Content slide (sub-headline + divider)

```html
<div style="background:#F4DC2E; padding:60px 40px; min-height:960px;">
  <h2 style="font-family:'Inter',sans-serif; font-size:56px; font-weight:900; line-height:1.08; letter-spacing:-1px; color:#1A1A1A; margin:0 0 40px; max-width:800px;">The answer isn't a funnel — it's <span style="background:#fff; font-style:italic; padding:4px 12px;">ten conversations</span>.</h2>
  <div style="width:60px; height:3px; background:#1A1A1A; margin-bottom:32px;"></div>
  <p style="font-family:'Inter',sans-serif; font-size:32px; font-weight:900; line-height:1.15; letter-spacing:-0.5px; color:#1A1A1A; margin:0; max-width:720px;">Talk to ten humans this week. Write down what they said. Ship the next version.</p>
</div>
```

### Slide number / watermark

```html
<p style="position:absolute; bottom:20px; right:20px; font-family:'Inter',sans-serif; font-size:14px; font-weight:500; color:rgba(26,26,26,0.4); margin:0;">03 / 07</p>
```
