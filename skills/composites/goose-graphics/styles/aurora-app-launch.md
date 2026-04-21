# Aurora App Launch

Wellness-app launch reveal. Soft rainbow mesh gradient (sky blue → peach coral → dusty pink → lavender) as a full-bleed background, a centered phone mockup at the hero, and a frosted-glass footer card holding the launch headline. Navy Fraunces brand mark lives inside the phone; everything else is Inter. The mood is an App Store splash for a meditation or mood-tracking app.

> Full prose reference: `styles/_full/aurora-app-launch.md`

## Palette

| Hex | Role |
|-----|------|
| `#A8C4E8` | Sky blue — gradient origin (top-left) |
| `#F2A87C` | Peach coral — gradient center (warm bloom) |
| `#D4A8C4` | Dusty pink — gradient terminus (right) |
| `#C8B8E0` | Soft lavender — fourth blob (bottom-right) |
| `#F5E6D8` | Warm cream — highlight bloom accent |
| `#2A3551` | Deep navy — Fraunces brand mark inside phone |
| `rgba(255,255,255,0.95)` | Near-white — primary text on gradient |
| `rgba(255,255,255,0.80)` | Soft white — secondary text |
| `rgba(255,255,255,0.60)` | Muted white — captions |
| `rgba(255,255,255,0.20)` | Frosted surface — footer glass card |
| `rgba(255,255,255,0.12)` | Frosted inset — nested glass |
| `rgba(255,255,255,0.30)` | Glass border |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

- **App Brand:** `'Fraunces', Georgia, 'Times New Roman', serif` (inside phone only)
- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| App Brand Mark | Fraunces | 64px | 600 | 1.00 | -1px |
| Display Headline | Inter | 60px | 700 | 1.05 | -1.5px |
| Display Hero XL | Inter | 72px | 700 | 1.05 | -2px |
| Section Heading | Inter | 40px | 700 | 1.15 | -0.8px |
| Small Caps Label | Inter | 16px | 500 | 1.00 | 0.3px (mixed case) |
| Body Large | Inter | 22px | 500 | 1.55 | 0 |
| Body | Inter | 18px | 500 | 1.55 | 0 |
| App UI Title | Inter | 22px | 700 | 1.20 | -0.3px |
| App UI Subtitle | Inter | 16px | 500 | 1.30 | 0 |
| App UI Time | Inter | 12px | 500 | 1.00 | 0.2px |
| Caption | Inter | 14px | 400 | 1.50 | 0.2px |
| CTA | Inter | 16px | 700 | 1.00 | 0.3px |

**Principles**

- Fraunces only inside the phone (as the app brand mark).
- Inter handles the outer composition (launch headline, label, CTAs).
- Labels use mixed case with small positive tracking — never all-caps.

## Layout

- Mesh gradient background: 4-blob radial-gradient composition covering the full canvas.
- Phone mockup centered or slightly offset — primary hero element.
- Frosted-glass footer card at bottom: `backdrop-filter: blur(20px)`, `background: rgba(255,255,255,0.20)`, 24-32px radius.
- Footer card holds: small-caps label ("Download the app"), 60px Inter 700 headline, CTA buttons.
- Navy Fraunces brand mark appears only on the phone screen.

## Do / Don't

**Do**

- Build the background as a 4-blob mesh gradient (sky blue + peach coral + dusty pink + soft lavender).
- Use frosted-glass `backdrop-filter: blur(20px)` for the footer card.
- Keep text colors white with varying opacity (95/80/60) — never hex.
- Use Fraunces only for the app brand mark inside the phone.
- Use the phone mockup as the primary visual anchor, centered.

**Don't**

- Don't use flat color backgrounds — the mesh is the identity.
- Don't use saturated primary colors (pure blue, pure red) — everything is soft pastel.
- Don't use Fraunces outside the phone.
- Don't use dark text on the gradient — only white with opacity.
- Don't over-decorate the phone — keep the app UI calm and typographic.

## CSS snippets

### `:root` variables

```css
:root {
  --c-sky: #A8C4E8;
  --c-peach: #F2A87C;
  --c-pink: #D4A8C4;
  --c-lavender: #C8B8E0;
  --c-cream: #F5E6D8;
  --c-navy: #2A3551;
  --c-white-95: rgba(255, 255, 255, 0.95);
  --c-white-80: rgba(255, 255, 255, 0.80);
  --c-white-60: rgba(255, 255, 255, 0.60);
  --c-glass: rgba(255, 255, 255, 0.20);
  --c-glass-inset: rgba(255, 255, 255, 0.12);
  --c-glass-border: rgba(255, 255, 255, 0.30);

  --font-app-brand: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Mesh gradient background

```css
.aurora-bg {
  background:
    radial-gradient(ellipse 60% 60% at 15% 20%, rgba(168,196,232,1), transparent 70%),
    radial-gradient(ellipse 70% 60% at 70% 40%, rgba(242,168,124,0.9), transparent 65%),
    radial-gradient(ellipse 60% 70% at 85% 75%, rgba(212,168,196,0.9), transparent 70%),
    radial-gradient(ellipse 60% 60% at 30% 85%, rgba(200,184,224,0.9), transparent 70%),
    #B8C4E0;
}
```

### Full composition

```html
<div style="position:relative; min-height:1920px; background:radial-gradient(ellipse 60% 60% at 15% 20%,#A8C4E8,transparent 70%),radial-gradient(ellipse 70% 60% at 70% 40%,rgba(242,168,124,0.9),transparent 65%),radial-gradient(ellipse 60% 70% at 85% 75%,rgba(212,168,196,0.9),transparent 70%),radial-gradient(ellipse 60% 60% at 30% 85%,rgba(200,184,224,0.9),transparent 70%),#B8C4E0; overflow:hidden;">

  <div style="position:absolute; top:240px; left:50%; transform:translateX(-50%); width:320px; height:640px; background:#F5E6D8; border-radius:48px; box-shadow:0 24px 80px rgba(0,0,0,0.2); padding:40px 32px;">
    <p style="font-family:'Fraunces',serif; font-size:64px; font-weight:600; line-height:1.00; letter-spacing:-1px; color:#2A3551; margin:0 0 40px;">still</p>
    <p style="font-family:'Inter',sans-serif; font-size:22px; font-weight:700; letter-spacing:-0.3px; color:#2A3551; margin:0 0 4px;">Evening Meditation</p>
    <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:500; color:rgba(42,53,81,0.7); margin:0;">Stress relief · 12 min</p>
  </div>

  <div style="position:absolute; bottom:60px; left:60px; right:60px; background:rgba(255,255,255,0.20); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.30); border-radius:32px; padding:40px;">
    <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:500; letter-spacing:0.3px; color:rgba(255,255,255,0.80); margin:0 0 16px;">Download the app</p>
    <h1 style="font-family:'Inter',sans-serif; font-size:60px; font-weight:700; line-height:1.05; letter-spacing:-1.5px; color:rgba(255,255,255,0.95); margin:0 0 32px;">Still minds ship better work.</h1>
    <a style="display:inline-block; background:rgba(255,255,255,0.95); color:#2A3551; font-family:'Inter',sans-serif; font-size:16px; font-weight:700; letter-spacing:0.3px; text-decoration:none; padding:16px 32px; border-radius:24px;">Get it on the App Store</a>
  </div>
</div>
```
