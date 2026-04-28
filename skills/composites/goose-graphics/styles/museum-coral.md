# Museum Coral

Coral-pink poster face used as a museum exhibition wall — the kind you'd see for a natural-history show. Salmon-coral background, condensed-sans uppercase typography in deep plum or cream, a single solid plum-dark date plate, and a small institutional logo lockup tucked into the corner. Generous negative space carries the design — no figurative illustrations. Reads as a gallery wall card blown up to poster scale.

## Palette

| Hex | Role |
|-----|------|
| `#F0978B` | Coral pink — primary background |
| `#F8DDD6` | Off-white cream — text on plum plates |
| `#3F0E18` | Plum dark — primary text, date plate fill |
| `#5C1626` | Plum mid — secondary plate fill |
| `#B85A4D` | Coral deep — small text on light plates |
| `#FFEFE9` | Pale cream — small caption text |
| `#1A0508` | Near-black — institutional logo |
| `#E37869` | Coral mid — frame line, thin rules |
| `#8B2D3C` | Wine — secondary text accent |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display:** `'Oswald', 'Helvetica Condensed', Helvetica, Arial, sans-serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Oswald | 80-120px | 700 | 0.95 | 0.5px UPPER |
| Date Plate | Oswald | 44px | 600 | 1.00 | 0.5px UPPER |
| Section Heading | Oswald | 28px | 600 | 1.10 | 0.5px UPPER |
| Body | Inter | 14-16px | 500 | 1.55 | 0.3px |
| Caption | Inter | 11px | 600 | 1.30 | 1px UPPER |
| Logo Lockup | Inter | 13px | 700 | 1.20 | 0.5px UPPER |

**Principles**

- Display is exclusively Oswald (or another condensed sans) in uppercase, stacked tightly.
- Title stacks 3–4 lines, each line sized to fit the column edge-to-edge.
- All body type is Inter at small sizes.
- Negative space is intentional — coral and Oswald carry the design alone.

## Layout

- Coral-pink fills the canvas with a thin coral-mid frame line ~32-36px from each edge.
- Title and date plate anchor the top half of the canvas (title left/center, plate beside or below).
- Body content (tips list, exhibit description, caption) anchors the bottom half.
- The middle is intentional negative space — the coral field is the visual.
- Bottom-left or bottom-right: small institutional logo lockup in dark plum.

## Do / Don't

**Do**

- Use coral-pink as the only background color.
- Use Oswald uppercase for all display type, stacked 3–4 lines.
- Add one solid plum-dark date plate with cream uppercase type.
- Pin a small institutional logo lockup to a corner.
- Let the coral field breathe — generous space between title and body.

**Don't**

- Don't apply gradients to the background — solid coral only.
- Don't use multiple display faces — Oswald is the only display.
- Don't add figurative illustrations (no skeletons, anatomy, mascots, characters). Coral and Oswald typography carry the design alone.
- Don't lowercase the headline. Always uppercase.
- Don't add drop shadows. Flat type, flat plates.

## CSS snippets

### `:root` variables

```css
:root {
  --c-coral: #F0978B;
  --c-coral-mid: #E37869;
  --c-coral-deep: #B85A4D;
  --c-cream: #F8DDD6;
  --c-cream-pale: #FFEFE9;
  --c-plum: #3F0E18;
  --c-plum-mid: #5C1626;
  --c-wine: #8B2D3C;
  --c-near-black: #1A0508;

  --font-display: 'Oswald', 'Helvetica Condensed', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Museum poster hero

```html
<div style="background:#F0978B; padding:64px; min-height:1350px; position:relative; box-sizing:border-box;">
  <!-- Frame line -->
  <div style="position:absolute; inset:32px; border:2px solid #E37869; pointer-events:none;"></div>

  <!-- Headline + date plate -->
  <div style="position:relative; z-index:2; display:flex; align-items:flex-start; justify-content:space-between; gap:24px;">
    <h1 style="font-family:'Oswald',sans-serif; font-size:96px; font-weight:700; line-height:0.95; letter-spacing:0.5px; text-transform:uppercase; color:#3F0E18; margin:0; max-width:60%;">FIVE TIPS<br>FOR FOUNDERS<br>BUILDING IN<br>2026</h1>
    <div style="background:#3F0E18; color:#F8DDD6; padding:18px 22px;">
      <p style="font-family:'Oswald',sans-serif; font-size:18px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#F8DDD6; margin:0 0 4px;">EDITION</p>
      <p style="font-family:'Oswald',sans-serif; font-size:44px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#F8DDD6; line-height:0.95; margin:0;">2026</p>
    </div>
  </div>

  <!-- Body content slot — sits in the bottom half. The middle is intentional negative space. -->
  <div style="position:absolute; left:64px; right:64px; bottom:140px;">
    <ol style="list-style:none; counter-reset:tip; padding:0; margin:0; columns:1;">
      <li style="counter-increment:tip; font-family:'Inter',sans-serif; font-size:16px; font-weight:500; color:#3F0E18; padding:14px 0; border-top:1px solid #E37869;">
        <span style="display:inline-block; width:36px; font-family:'Oswald',sans-serif; font-weight:700; color:#5C1626;">01</span>
        Start before you're ready.
      </li>
      <!-- repeat for tips 02–05 -->
    </ol>
  </div>

  <!-- Bottom logo lockup -->
  <div style="position:absolute; bottom:64px; left:64px; right:64px; display:flex; justify-content:space-between; align-items:flex-end;">
    <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#3F0E18; margin:0;">Sala de Fundadores<br>Contemporáneos</p>
    <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#3F0E18; margin:0; text-align:right;">MUSEO DE<br>FUNDADORES MODERNOS</p>
  </div>
</div>
```

### Date plate (standalone)

```html
<div style="display:inline-block; background:#3F0E18; color:#F8DDD6; padding:16px 20px;">
  <p style="font-family:'Oswald',sans-serif; font-size:32px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; line-height:1.0; margin:0;">EDITION 2026</p>
</div>
```
