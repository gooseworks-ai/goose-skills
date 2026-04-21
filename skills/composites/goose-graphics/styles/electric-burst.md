# Electric Burst

Maximum-impact neon. Near-black canvas with fluorescent neon yellow and hot pink, Archivo Black displays at 80-200px that hit like a stadium floodlight. Layered text-shadow + box-shadow glows create actual luminous energy. This is concert-poster loud — unapologetic, confrontational, designed to stop the scroll.

> Full prose reference: `styles/_full/electric-burst.md`

## Palette

| Hex | Role |
|-----|------|
| `#0a0a0a` | Void — primary background |
| `#ffffff` | Pure white — primary text |
| `#e6ff00` | Neon yellow — primary accent (numbers, CTAs, glows) |
| `#ff2d6f` | Hot pink — secondary accent (tags, secondary highlights) |
| `#b8cc00` | Dark yellow hover |
| `#cc2459` | Dark pink hover |
| `#141414` | Dark surface (cards) |
| `#111111` | Surface inset |
| `#1e1e1e` | Charcoal — nested containers |
| `#2a2a2a` | Graphite |
| `#555555` | Steel — disabled |
| `#888888` | Ash — tertiary text |
| `#aaaaaa` | Silver — secondary text |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

- **Display:** `'Archivo Black', Impact, 'Arial Black', sans-serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Archivo Black | 80px | 400 | 1.00 | -1px |
| Section Heading | Archivo Black | 56px | 400 | 1.05 | -0.5px |
| Sub-heading | Archivo Black | 36px | 400 | 1.10 | 0 |
| Body Large | Inter | 20px | 400 | 1.60 | 0 |
| Body | Inter | 16px | 400 | 1.65 | 0 |
| Caption | Inter | 13px | 500 | 1.50 | 0.5px |
| Big Number | Archivo Black | 200px | 400 | 0.85 | -4px |
| Numbered Label | Inter | 14px | 700 | 1.00 | 3px UPPER |
| CTA | Inter | 16px | 700 | 1.00 | 1.5px UPPER |

**Principles**

- Archivo Black ships one weight only — size = impact.
- "Spectacle numbers" at 200px with negative tracking are the signature.
- Hot pink + neon yellow are hostile-bright; use on black only.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80.
- Glow effects: `text-shadow: 0 0 30px rgba(230,255,0,0.6), 0 0 60px rgba(230,255,0,0.3)`.
- Box glow on accent containers: `box-shadow: 0 0 40px rgba(230,255,0,0.25)`.
- Cards: `#141414` bg, 4-6px radius, optional neon border `2px solid #e6ff00`.
- One spectacle number per slide maximum.

## Do / Don't

**Do**

- Use Archivo Black at 80-200px to create "felt" impact before words are read.
- Layer text-shadow + box-shadow glows using neon yellow or hot pink.
- Use hot pink for tags and contrast highlights; neon yellow for primary focal.
- Fill CTA buttons with neon yellow on black text for maximum pop.
- Let big numbers bleed off the container edge.

**Don't**

- Don't use subtle colors — everything is loud or nothing is.
- Don't use dark mode grays for text — pure `#ffffff` primary.
- Don't use serif fonts anywhere.
- Don't use more than 2 glow colors per section.
- Don't use radius above 8px — hard edges amplify the energy.
- Don't use pale or pastel accents — fluorescent only.

## CSS snippets

### `:root` variables

```css
:root {
  --color-void: #0a0a0a;
  --color-white: #ffffff;
  --color-neon: #e6ff00;
  --color-pink: #ff2d6f;
  --color-pink-dark: #cc2459;
  --color-surface: #141414;
  --color-surface-inset: #111111;
  --color-silver: #aaaaaa;

  --font-display: 'Archivo Black', Impact, 'Arial Black', sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --glow-neon: 0 0 30px rgba(230, 255, 0, 0.6), 0 0 60px rgba(230, 255, 0, 0.3);
  --glow-pink: 0 0 30px rgba(255, 45, 111, 0.6), 0 0 60px rgba(255, 45, 111, 0.3);
}
```

### Spectacle number

```html
<div style="background:#0a0a0a; padding:80px 60px; text-align:center;">
  <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#ff2d6f; margin:0 0 16px;">01 · THE CLAIM</p>
  <p style="font-family:'Archivo Black',sans-serif; font-size:200px; font-weight:400; line-height:0.85; letter-spacing:-4px; color:#e6ff00; margin:0; text-shadow:0 0 30px rgba(230,255,0,0.6), 0 0 60px rgba(230,255,0,0.3);">10X</p>
  <h2 style="font-family:'Archivo Black',sans-serif; font-size:56px; font-weight:400; line-height:1.05; letter-spacing:-0.5px; text-transform:uppercase; color:#fff; margin:16px 0 0;">FASTER THAN THE COMPETITION</h2>
</div>
```

### Card with neon border

```html
<div style="background:#141414; border:2px solid #e6ff00; padding:24px; border-radius:6px; box-shadow:0 0 40px rgba(230,255,0,0.25);">
  <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#e6ff00; margin:0 0 12px;">01 — ATTACK</p>
  <h3 style="font-family:'Archivo Black',sans-serif; font-size:36px; font-weight:400; color:#fff; margin:0 0 12px;">Own the scroll</h3>
  <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:400; line-height:1.65; color:#aaaaaa; margin:0;">Visual volume wins attention. Anything else is furniture.</p>
</div>
```

### Pink tag pill

```html
<span style="display:inline-block; background:#ff2d6f; color:#0a0a0a; font-family:'Inter',sans-serif; font-size:14px; font-weight:700; letter-spacing:3px; text-transform:uppercase; padding:6px 14px; border-radius:4px;">NEW</span>
```

### Neon CTA

```html
<a style="display:inline-block; background:#e6ff00; color:#0a0a0a; font-family:'Inter',sans-serif; font-size:16px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; text-decoration:none; padding:18px 44px; border-radius:4px; box-shadow:0 0 40px rgba(230,255,0,0.35);">GET STARTED →</a>
```
