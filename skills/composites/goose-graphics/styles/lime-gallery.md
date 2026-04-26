# Lime Gallery

Lime-yellow gallery poster. Italic serif headline ("Art Between Two Worlds"). A horizontal halftone landscape band sits in the upper third — dot rows that thicken into a silhouetted skyline and dissolve into clean horizontal stripes. Body copy is small monospace-flavored sans, set in tidy two-column blocks. Reads like a subway-format exhibition announcement.

> Full prose reference: `styles/_full/lime-gallery.md`

## Palette

| Hex | Role |
|-----|------|
| `#D9E83A` | Lime yellow — primary background |
| `#0E1014` | Ink black — primary text + halftone dots |
| `#F4FE6E` | Lime light — pale highlight tint |
| `#1F1F22` | Charcoal — body text |
| `#3F4042` | Mid gray — muted captions |
| `#8E9419` | Olive shadow — hover / pressed states |
| `#FFFFFF` | Paper white — small CTA backgrounds |
| `#0E1014` | Frame black — outer poster frame |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

- **Display:** `'Cormorant Garamond', 'Times New Roman', serif` (italic only)
- **Body / Mono-feel:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Cormorant Garamond Italic | 88px | 500 | 1.05 | -1.5px |
| Section Heading | Cormorant Garamond Italic | 40px | 500 | 1.10 | -0.5px |
| Body | Inter | 14px | 400 | 1.55 | 0.2px |
| Caption | Inter | 12px | 500 | 1.45 | 0.5px UPPER |
| Footer URL | Inter | 14px | 700 | 1.40 | 0.3px |
| Logo Mark | Cormorant Garamond Italic | 28px | 600 | 1.00 | -0.5px |

**Principles**

- The display is exclusively Cormorant Garamond italic — no roman cuts.
- Body copy is Inter at small sizes (12–14px) with slight tracking, mimicking a museum-card aesthetic.
- Two-column body blocks at 240–280px wide, never single-column.

## Layout

- Outer matte: 32px frame of ink black around a lime-yellow inner panel (subway-poster mockup vibe — frame optional).
- Upper third: a horizontal halftone band — black dots arranged in 3–6 rows whose fill thickens to suggest a low skyline / horizon, then dissolves into 4–8 thin horizontal black stripes spanning the width.
- Lower two-thirds: lime-yellow open canvas. Italic serif title bottom-left, two columns of small body copy bottom-right. Logo mark and tiny URL/address pinned to bottom edges.

## Do / Don't

**Do**

- Use lime-yellow as the only background. Black is the only mark color.
- Top-band halftone dots dissolve into horizontal stripes on the right side.
- Italic Cormorant Garamond is the only display face — short two-line title.
- Body copy in Inter, two columns, tight 12–14px.
- Add a small italic serif logo mark and a 14px URL footer.

**Don't**

- Don't pair the italic display with another script or display face.
- Don't use any color outside the lime / black / white palette.
- Don't fill more than the upper third with the halftone — the negative space below carries the title.
- Don't increase body copy past 16px — it must read like a museum card.
- Don't center the title.

## CSS snippets

### `:root` variables

```css
:root {
  --c-lime: #D9E83A;
  --c-lime-light: #F4FE6E;
  --c-ink: #0E1014;
  --c-charcoal: #1F1F22;
  --c-gray: #3F4042;
  --c-olive: #8E9419;
  --c-paper: #FFFFFF;

  --font-display: 'Cormorant Garamond', 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Gallery poster hero (subway-style frame)

```html
<div style="background:#0E1014; padding:32px;">
  <div style="background:#D9E83A; padding:48px 56px 56px; min-height:1280px; position:relative;">
    <!-- Halftone landscape band -->
    <svg viewBox="0 0 980 220" width="100%" height="160" style="display:block;">
      <g fill="#0E1014">
        <!-- silhouette row -->
        <circle cx="40" cy="80" r="6"/><circle cx="80" cy="60" r="5"/><circle cx="120" cy="40" r="4"/>
        <circle cx="160" cy="50" r="5"/><circle cx="200" cy="70" r="6"/><circle cx="240" cy="80" r="6"/>
        <!-- horizontal stripes right side -->
      </g>
      <line x1="500" y1="100" x2="980" y2="100" stroke="#0E1014" stroke-width="2"/>
      <line x1="500" y1="120" x2="980" y2="120" stroke="#0E1014" stroke-width="2"/>
      <line x1="500" y1="140" x2="980" y2="140" stroke="#0E1014" stroke-width="2"/>
      <line x1="500" y1="160" x2="980" y2="160" stroke="#0E1014" stroke-width="2"/>
    </svg>

    <div style="position:absolute; bottom:56px; left:56px; right:56px; display:flex; align-items:flex-end; justify-content:space-between; gap:48px;">
      <div>
        <h1 style="font-family:'Cormorant Garamond',serif; font-style:italic; font-size:88px; font-weight:500; line-height:1.05; letter-spacing:-1.5px; color:#0E1014; margin:0 0 24px;">Art Between<br>Two Worlds</h1>
        <p style="font-family:'Cormorant Garamond',serif; font-style:italic; font-size:28px; font-weight:600; color:#0E1014; margin:0;">goca</p>
      </div>
      <div style="font-family:'Inter',sans-serif; font-size:12px; font-weight:400; line-height:1.55; color:#1F1F22; max-width:260px;">
        <p style="margin:0 0 12px;">GoCA is dedicated to connecting American, Japanese, and Greater Asian sensibilities by introducing young Asian artists to an international audience.</p>
        <p style="margin:0; font-weight:700; letter-spacing:0.3px;">5150 23rd Street, NY &nbsp;·&nbsp; www.goca.gallery</p>
      </div>
    </div>
  </div>
</div>
```

### Tiny museum-card body block

```html
<div style="font-family:'Inter',sans-serif; font-size:12px; font-weight:400; line-height:1.55; letter-spacing:0.5px; text-transform:uppercase; color:#1F1F22; max-width:240px;">
  Curated by the editors · Open daily 11–6
</div>
```
