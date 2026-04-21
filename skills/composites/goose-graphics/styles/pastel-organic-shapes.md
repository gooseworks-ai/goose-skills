# Pastel Organic Shapes

Quiet wellness feel. Warm cream canvas with a large pistachio-green circle half off-frame as the signature decorative anchor, and a lighter cream oval at center holding ALL-CAPS Playfair Display headlines at tight tracking. Inter in tracked uppercase for metadata. Minimal, airy, yoga-studio-brochure calm.

> Full prose reference: `styles/_full/pastel-organic-shapes.md`

## Palette

| Hex | Role |
|-----|------|
| `#F5F1E6` | Warm cream — primary background |
| `#FAF7EC` | Lighter cream — inner cream oval container |
| `#DCEAB4` | Pale pistachio — signature off-frame circle |
| `#C9DDA0` | Deeper pistachio — hover/active |
| `#BFD390` | Pistachio outline — optional thin frame |
| `#1A1A1A` | Near-black — primary text, arrow icon |
| `#4A4A4A` | Secondary text — body copy |
| `#5C5C5C` | Metadata — tracked labels |
| `rgba(26,26,26,0.5)` | Muted text — slide numbers |
| `rgba(26,26,26,0.4)` | Thin border — arrow container outline |
| `rgba(26,26,26,0.35)` | Outline thin — optional frame outline |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@400;500&display=swap" rel="stylesheet">
```

- **Display:** `'Playfair Display', Georgia, 'Times New Roman', serif`
- **Body / Metadata:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking | Case |
|------|------|------|--------|-------------|----------|------|
| Display Hero | Playfair Display | 56px | 400 | 1.18 | 2px | UPPER |
| Section Heading | Playfair Display | 40px | 400 | 1.20 | 1.5px | UPPER |
| Sub-heading | Playfair Display | 28px | 400 | 1.25 | 1px | UPPER |
| Inner Headline | Playfair Display | 20px | 500 | 1.30 | 0.5px | UPPER |
| Body Large | Inter | 16px | 400 | 1.65 | 0.3px | normal |
| Body | Inter | 13px | 400 | 1.65 | 0.5px | UPPER |
| Metadata | Inter | 12px | 500 | 1.40 | 1.5px | UPPER |
| Caption | Inter | 11px | 500 | 1.40 | 1px | UPPER |
| Big Number | Playfair Display | 72px | 400 | 1.00 | 1px | — |

**Principles**

- Playfair Display in ALL CAPS with positive tracking (1-2px) — signature move.
- Sparse body copy; composition is the communication.
- Inter 1-1.5px tracked UPPER for all metadata (`@handle`, "STUDIO NAME").

## Layout

- Full-bleed warm cream `#F5F1E6` background.
- One large pistachio circle (600-900px) positioned half off-frame (bottom-left, right edge, etc.) — crops dramatically.
- Inner cream oval container (`#FAF7EC`) at center of composition, 60-70% frame width.
- Arrow icon in thin-bordered circle for navigation markers.
- Metadata row at bottom: `@handle · STUDIO NAME · 01/05`.

## Do / Don't

**Do**

- Position one pistachio circle half off-frame as the compositional anchor.
- Use Playfair Display ALL CAPS with 1-2px tracking for every heading.
- Use a cream oval `#FAF7EC` as the inner content container.
- Keep body copy sparse — 1-2 lines maximum inside the oval.
- Use Inter 1.5px tracked UPPER for handles and metadata.

**Don't**

- Don't use heavy Playfair weights — 400-500 only.
- Don't center the pistachio circle — it must be partially off-frame.
- Don't use sentence case on display headings — UPPERCASE mandatory.
- Don't use multiple accent colors — pistachio green only.
- Don't fill the canvas with text — whitespace is the mood.

## CSS snippets

### `:root` variables

```css
:root {
  --color-cream: #F5F1E6;
  --color-cream-inner: #FAF7EC;
  --color-pistachio: #DCEAB4;
  --color-pistachio-deep: #C9DDA0;
  --color-ink: #1A1A1A;
  --color-text-2: #4A4A4A;
  --color-text-meta: #5C5C5C;

  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Composition with off-frame circle

```html
<div style="background:#F5F1E6; padding:60px; min-height:960px; position:relative; overflow:hidden;">
  <div style="position:absolute; bottom:-280px; left:-200px; width:720px; height:720px; border-radius:50%; background:#DCEAB4;"></div>

  <div style="position:relative; z-index:1; max-width:720px; margin:120px auto 0; background:#FAF7EC; border-radius:280px; padding:80px 60px; text-align:center;">
    <h1 style="font-family:'Playfair Display',serif; font-size:56px; font-weight:400; line-height:1.18; letter-spacing:2px; text-transform:uppercase; color:#1A1A1A; margin:0 0 24px;">Soft Mornings.<br>Quiet Practice.</h1>
    <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:400; line-height:1.65; letter-spacing:0.5px; text-transform:uppercase; color:#4A4A4A; max-width:420px; margin:0 auto;">A five-week sequence for teams that want to slow down before they scale up.</p>
  </div>

  <div style="position:absolute; bottom:40px; left:0; right:0; display:flex; justify-content:space-between; padding:0 60px; font-family:'Inter',sans-serif; font-size:12px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:#5C5C5C;">
    <span>@soft.practice</span>
    <span>STUDIO ELM · 01/05</span>
  </div>
</div>
```

### Arrow button (thin circle)

```html
<div style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:50%; border:1px solid rgba(26,26,26,0.4);">
  <span style="font-size:20px; color:#1A1A1A;">→</span>
</div>
```

### Inner small-circle variant

```html
<div style="background:#FAF7EC; width:320px; height:320px; border-radius:50%; border:1px solid rgba(26,26,26,0.35); display:flex; align-items:center; justify-content:center; text-align:center; padding:32px;">
  <div>
    <p style="font-family:'Playfair Display',serif; font-size:20px; font-weight:500; line-height:1.30; letter-spacing:0.5px; text-transform:uppercase; color:#1A1A1A; margin:0 0 12px;">Breathe First.</p>
    <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:400; line-height:1.65; letter-spacing:0.5px; text-transform:uppercase; color:#4A4A4A; margin:0;">The work waits.</p>
  </div>
</div>
```
