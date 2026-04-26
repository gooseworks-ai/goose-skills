# Mid-Century Ad Grid

A 1950s commercial-print ad grid: square panels in mustard yellow, sky blue, cream, and pure white, each holding a black-and-white product photograph or graphic mark. The design language is mid-century Swiss / European print — slab-serif logotype, tight grid alignment, B&W photography of hands and objects, and small slab caption blocks. Reads like a typewriter ad from a vintage magazine.

> Full prose reference: `styles/_full/midcentury-ad-grid.md`

## Palette

| Hex | Role |
|-----|------|
| `#E2A93B` | Mustard yellow — primary panel color |
| `#7FB6CF` | Sky blue — secondary panel color |
| `#F2EBD8` | Cream — neutral panel color |
| `#FFFFFF` | Paper white — bright panel color |
| `#1A1A1A` | Print black — primary text + logotype |
| `#5C5752` | Warm gray — body / secondary text |
| `#A88828` | Mustard deep — caption text on yellow |
| `#3D5C70` | Slate blue — caption text on sky |
| `#B5A98A` | Aged paper — soft frame line |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display:** `'Roboto Slab', 'Rockwell', Georgia, serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Logotype | Roboto Slab | 56px | 700 | 1.00 | 1px UPPER |
| Display Hero | Roboto Slab | 36px | 600 | 1.10 | 0px |
| Section Heading | Roboto Slab | 22px | 600 | 1.15 | 0px |
| Body | Inter | 13px | 400 | 1.55 | 0.2px |
| Caption | Inter | 11px | 600 | 1.40 | 0.5px UPPER |
| Catalog Number | Roboto Slab | 14px | 500 | 1.20 | 0.4px UPPER |

**Principles**

- The slab serif (Roboto Slab) is the brand voice — used for logotype and headlines.
- Body type stays small (11–13px). The grid carries hierarchy, not type size.
- Logotype is uppercase, slightly tracked.

## Layout

- 4-column × 5-row grid filling the canvas. Cells are square (square aspect at the column width).
- Cell colors alternate: mustard / sky-blue / cream / white in a balanced (not strictly checker) pattern.
- 50–60% of cells contain a B&W product photograph (typewriter, hands, machine parts) — silhouette-clean, white background or full-bleed.
- 1–2 cells hold the slab logotype; 1 cell holds the headline; 1–2 cells hold a small slab caption.
- Each photograph cell may carry a small catalog-number tag in slab serif (e.g., "No. 04") in a corner.

## Do / Don't

**Do**

- Hold to mustard / sky-blue / cream / white panel colors only.
- Use B&W product photography (or B&W mid-century illustrations) inside cells.
- Set the logotype in slab serif, uppercase, slightly tracked.
- Add small catalog-number tags in slab serif inside photo cells.
- Keep the grid hard — no gutters or rounded corners between cells.

**Don't**

- Don't introduce saturated modern colors (no neon, no purples).
- Don't render photographs in color — B&W only, slight warmth allowed.
- Don't pair the slab serif with a script or display sans for the logotype.
- Don't gutter the cells — they butt edge-to-edge.
- Don't add drop shadows or rounded corners.

## CSS snippets

### `:root` variables

```css
:root {
  --c-mustard: #E2A93B;
  --c-mustard-deep: #A88828;
  --c-sky: #7FB6CF;
  --c-slate: #3D5C70;
  --c-cream: #F2EBD8;
  --c-paper: #FFFFFF;
  --c-aged: #B5A98A;
  --c-print-black: #1A1A1A;
  --c-warm-gray: #5C5752;

  --font-display: 'Roboto Slab', 'Rockwell', Georgia, serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Mid-century grid hero

```html
<div style="background:#F2EBD8; padding:0; min-height:1350px;">
  <div style="display:grid; grid-template-columns:repeat(4,1fr); grid-auto-rows:270px; gap:0;">

    <!-- Row 1 -->
    <div style="background:#FFFFFF; padding:32px; display:flex; align-items:center; justify-content:center;">
      <svg viewBox="0 0 200 160" width="100%"><rect x="20" y="40" width="160" height="80" fill="#1A1A1A"/><rect x="40" y="60" width="120" height="40" fill="#FFFFFF"/></svg>
    </div>
    <div style="background:#E2A93B; padding:24px; display:flex; align-items:flex-end;">
      <p style="font-family:'Roboto Slab',serif; font-size:14px; font-weight:500; letter-spacing:0.4px; text-transform:uppercase; color:#1A1A1A; margin:0;">No. 02</p>
    </div>
    <div style="background:#7FB6CF; padding:32px; display:flex; align-items:center; justify-content:center;">
      <svg viewBox="0 0 200 200" width="80%"><circle cx="100" cy="100" r="60" fill="#1A1A1A"/></svg>
    </div>
    <div style="background:#FFFFFF; padding:24px; display:flex; align-items:center; justify-content:center;">
      <svg viewBox="0 0 200 200" width="80%"><path d="M40 160 Q60 80 120 80 Q160 80 160 120 L160 160 Z" fill="#1A1A1A"/></svg>
    </div>

    <!-- Row 2: logotype -->
    <div style="grid-column:1/3; background:#F2EBD8; padding:48px; display:flex; flex-direction:column; justify-content:center;">
      <p style="font-family:'Roboto Slab',serif; font-size:56px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#1A1A1A; margin:0; line-height:1.0;">HERMES</p>
      <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:400; letter-spacing:0.4px; color:#5C5752; margin:8px 0 0;">precision typewriters since 1923</p>
    </div>
    <div style="background:#E2A93B; padding:24px; display:flex; align-items:center; justify-content:center;">
      <svg viewBox="0 0 200 200" width="80%"><rect x="40" y="60" width="120" height="80" fill="#1A1A1A"/></svg>
    </div>
    <div style="background:#7FB6CF; padding:32px; display:flex; align-items:flex-end;">
      <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#3D5C70; margin:0;">CATALOG · 1956</p>
    </div>

    <!-- Row 3 -->
    <div style="background:#7FB6CF; padding:32px; display:flex; align-items:center; justify-content:center;">
      <svg viewBox="0 0 200 200" width="80%"><path d="M30 100 Q100 60 170 100 L170 140 Q100 180 30 140 Z" fill="#1A1A1A"/></svg>
    </div>
    <div style="background:#FFFFFF; padding:24px; display:flex; align-items:center; justify-content:center;">
      <svg viewBox="0 0 200 200" width="80%"><circle cx="100" cy="100" r="50" fill="none" stroke="#1A1A1A" stroke-width="6"/></svg>
    </div>
    <div style="background:#E2A93B; padding:24px;"></div>
    <div style="background:#F2EBD8; padding:24px; display:flex; flex-direction:column; justify-content:center;">
      <p style="font-family:'Roboto Slab',serif; font-size:22px; font-weight:600; line-height:1.15; color:#1A1A1A; margin:0;">Built for the working desk.</p>
    </div>

  </div>
</div>
```

### Catalog tag (corner mark)

```html
<p style="font-family:'Roboto Slab',serif; font-size:14px; font-weight:500; letter-spacing:0.4px; text-transform:uppercase; color:#1A1A1A; margin:0;">No. 04</p>
```
