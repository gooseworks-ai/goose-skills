# Clean Slate

Ultra-minimal pure white with aggressive negative tracking on a single-family Space Grotesk. One blue accent (`#0066ff`) for every interactive surface. Everything else is grayscale discipline — no decoration, no ornament, no emoji.

> Full prose reference: `styles/_full/clean-slate.md`

## Palette

| Hex | Role |
|-----|------|
| `#ffffff` | White background (primary canvas) |
| `#171717` | Near-black — primary text |
| `#0066ff` | Blue — single accent (CTAs, numbers, focal) |
| `#e6f0ff` | Light blue — tag fills, subtle emphasis |
| `#0052cc` | Dark blue — hover/active |
| `#f5f5f5` | Snow — card surface |
| `#fafafa` | Surface inset |
| `#ebebeb` | Light border |
| `#d4d4d4` | Mid gray — disabled |
| `#9ca3af` | Cool gray — tertiary text |
| `#6b7280` | Warm gray — secondary text |
| `#4b5563` | Slate — secondary headings |
| `#374151` | Charcoal — high-emphasis body |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Space Grotesk | 72px | 700 | 1.05 | -2px |
| Section Heading | Space Grotesk | 48px | 700 | 1.10 | -1.5px |
| Sub-heading | Space Grotesk | 32px | 600 | 1.15 | -0.75px |
| Body Large | Space Grotesk | 20px | 300 | 1.65 | 0 |
| Body | Space Grotesk | 16px | 400 | 1.65 | 0 |
| Caption | Space Grotesk | 13px | 400 | 1.50 | 0.2px |
| Big Number | Space Grotesk | 64px | 700 | 1.00 | -1.5px |
| Numbered Label | Space Grotesk | 14px | 500 | 1.00 | 1.5px UPPER |
| CTA | Space Grotesk | 15px | 600 | 1.00 | 0.5px |

**Principles**

- One family, total discipline. Hierarchy only through size/weight/tracking.
- Aggressive negative tracking at display sizes (-2px at 72px) for precise engineered feel.
- Light body weight (300-400) for airy reading on white.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80.
- Hairline `1px solid #ebebeb` borders.
- Rules: 1px `#171717` or `#0066ff`, typically 48-60px wide.
- Cards: `#f5f5f5` bg, 2-4px radius. Precise, not rounded.
- Whitespace is the material. Content respects margins; nothing fills to edges.
- Left-align body; center-align hero titles, big numbers, CTAs.

## Do / Don't

**Do**

- Use `#0066ff` as the single accent — every CTA, every number, every focal point is this blue.
- Use aggressive negative tracking on display type for a precise, engineered headline feel.
- Keep hairline borders (1px) for all structural definition.
- Use `#e6f0ff` as tag/pill fill paired with `#0066ff` text.
- Treat whitespace as a first-class layout element.

**Don't**

- Don't use more than one accent color — blue only, grayscale otherwise.
- Don't use decorative elements (icons, emojis, illustrations, gradients).
- Don't use radius above 4px — Swiss-modernist precision, not friendly.
- Don't use heavy shadow — elevation through border + whitespace only.
- Don't use warm grays. Cool grays only (`#9ca3af`, `#6b7280`, `#374151`).

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #ffffff;
  --color-text: #171717;
  --color-blue: #0066ff;
  --color-blue-bg: #e6f0ff;
  --color-blue-dark: #0052cc;
  --color-snow: #f5f5f5;
  --color-border: #ebebeb;
  --color-cool-gray: #9ca3af;
  --color-warm-gray: #6b7280;
  --color-charcoal: #374151;

  --font: 'Space Grotesk', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 4px;
}
```

### Hero title

```html
<div style="background:#fff; padding:80px 60px; text-align:center;">
  <div style="width:60px; height:1px; background:#171717; margin:0 auto 40px;"></div>
  <h1 style="font-family:'Space Grotesk',sans-serif; font-size:72px; font-weight:700; line-height:1.05; letter-spacing:-2px; color:#171717; margin:0 0 24px;">The Future of<br>Autonomous Work</h1>
  <p style="font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:300; line-height:1.65; color:#6b7280; max-width:560px; margin:0 auto;">How AI coworkers are reshaping how teams operate.</p>
</div>
```

### Numbered item (blue numeral)

```html
<div style="display:flex; gap:24px; align-items:flex-start; padding:32px 0; border-bottom:1px solid #ebebeb;">
  <span style="font-family:'Space Grotesk',sans-serif; font-size:48px; font-weight:700; line-height:1.00; letter-spacing:-1.5px; color:#0066ff; min-width:72px;">01</span>
  <div>
    <p style="font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#6b7280; margin:0 0 8px;">SIGNAL-BASED OUTBOUND</p>
    <h3 style="font-family:'Space Grotesk',sans-serif; font-size:32px; font-weight:600; line-height:1.15; letter-spacing:-0.75px; color:#171717; margin:0 0 12px;">Find buyers before they find you</h3>
    <p style="font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:400; line-height:1.65; color:#6b7280; margin:0;">Monitor hiring signals, funding events, tech-stack changes.</p>
  </div>
</div>
```

### Tag pill (light-blue fill)

```html
<span style="display:inline-block; background:#e6f0ff; color:#0066ff; font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:500; letter-spacing:0.5px; padding:6px 14px; border-radius:4px;">New</span>
```

### CTA (solid blue pill)

```html
<a style="display:inline-block; background:#0066ff; color:#fff; font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:16px 40px; border-radius:4px;">Get Started</a>
```

### Stat

```html
<div style="text-align:center; padding:40px 24px; background:#f5f5f5; border:1px solid #ebebeb; border-radius:4px;">
  <p style="font-family:'Space Grotesk',sans-serif; font-size:64px; font-weight:700; line-height:1.00; letter-spacing:-1.5px; color:#0066ff; margin:0 0 8px;">47%</p>
  <p style="font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#6b7280; margin:0;">FASTER RESPONSE</p>
</div>
```
