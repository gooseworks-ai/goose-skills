# Woodblock Folk

Royal-blue-and-chartreuse grid poster. The canvas is a 4×6 block grid where each cell is either solid royal blue or solid chartreuse, alternating like a quilt. Inside selected cells live blocky woodblock-style botanical illustrations (leaves, birds, seeds, waves, branches) — drawn with thick brush-cut strokes that swap colors panel-to-panel (blue on green, green on blue). The headline reverses across panels too, sometimes blue text on green, sometimes green on blue. Reads like a folk-festival or seed-network poster — community-printed, print-shop honest.

> Full prose reference: `styles/_full/woodblock-folk.md`

## Palette

| Hex | Role |
|-----|------|
| `#1F2DB0` | Royal blue — primary panel color |
| `#A4C71F` | Chartreuse — secondary panel color |
| `#8AAB13` | Chartreuse deep — illustration shadow on green |
| `#0F1A8A` | Indigo — illustration shadow on blue |
| `#FFFFFF` | White — accent text only |
| `#F4FF9A` | Lemon highlight — small CTA bursts |
| `#10186B` | Deep navy — body text on chartreuse |
| `#19258F` | Royal mid — secondary headlines |
| `#FAFFE0` | Cream tint — subtle date strip |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display:** `'Bricolage Grotesque', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Bricolage Grotesque | 56px | 800 | 1.05 | -1px |
| Sub-display | Bricolage Grotesque | 32px | 700 | 1.15 | -0.5px |
| Body | Inter | 16px | 500 | 1.50 | 0 |
| Date Strip | Bricolage Grotesque | 28px | 700 | 1.10 | -0.5px |
| Caption | Inter | 12px | 600 | 1.40 | 0.5px UPPER |

**Principles**

- Bricolage Grotesque is chosen for its variable, slightly-eccentric letterforms — it carries the woodblock energy.
- Headlines wrap inside 2-cell panel widths — never single-line.
- Body is Inter at 16px, narrow column inside a single grid cell.

## Layout

- 4-column × 6-row grid spanning the full canvas (no gutters between cells, just the alternating fill).
- Each cell is one of two states: **solid royal blue** or **solid chartreuse**. Pattern alternates roughly checkerboard but irregular — keep some 2-cell rectangles of the same color.
- ~50% of cells contain a woodblock illustration in the opposite color (blue stroke on green cell, green stroke on blue cell). Illustrations are simple flat silhouettes — leaves, birds, seed pods, vines, waves, hatch patterns.
- Headlines occupy 2-cell horizontal blocks, reversed (blue text on green or green text on blue).
- A single date or location strip overlays one row in flat-color block.

## Do / Don't

**Do**

- Restrict the palette to royal blue and chartreuse — only.
- Build the canvas from a hard grid of alternating solid panels.
- Draw woodblock illustrations as flat silhouettes with thick (4–6px) brush-stroke edges.
- Reverse headlines panel-to-panel (color flip).
- Embed a date / location strip as one full-width row.

**Don't**

- Don't introduce a third color (no white background, no neutrals).
- Don't render illustrations photorealistically — keep them flat woodblock silhouettes.
- Don't gradient or fade between panels — hard color edges only.
- Don't run text across panel boundaries except where reversal is intentional.
- Don't soften corners — the grid is sharp.

## CSS snippets

### `:root` variables

```css
:root {
  --c-blue: #1F2DB0;
  --c-blue-deep: #10186B;
  --c-blue-mid: #19258F;
  --c-blue-shadow: #0F1A8A;
  --c-chartreuse: #A4C71F;
  --c-chartreuse-deep: #8AAB13;
  --c-cream: #FAFFE0;
  --c-lemon: #F4FF9A;
  --c-white: #FFFFFF;

  --font-display: 'Bricolage Grotesque', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Folk grid hero

```html
<div style="background:#1F2DB0; padding:32px;">
  <div style="display:grid; grid-template-columns:repeat(4,1fr); grid-auto-rows:200px; gap:0;">

    <!-- Row 1: Title block over 3 blue cells + 1 green cell with leaf -->
    <div style="grid-column:1/4; background:#1F2DB0; padding:32px; display:flex; flex-direction:column; justify-content:center;">
      <p style="font-family:'Inter',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#FAFFE0; margin:0 0 8px;">I Seminário Regional</p>
      <p style="font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:600; color:#A4C71F; margin:0 0 4px;">da semente à floresta</p>
      <h1 style="font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; line-height:1.05; letter-spacing:-1px; color:#FFFFFF; margin:0;">Caminhos da Rede de<br>Sementes do Xingu</h1>
    </div>

    <!-- Single chartreuse cell with woodblock leaf -->
    <div style="background:#A4C71F; position:relative;">
      <svg viewBox="0 0 200 200" style="width:100%; height:100%;">
        <path d="M40 100 Q100 20 160 100 Q100 180 40 100 Z" fill="#1F2DB0"/>
        <line x1="100" y1="40" x2="100" y2="160" stroke="#A4C71F" stroke-width="4"/>
      </svg>
    </div>

    <!-- Row 2: a chartreuse cell with bird, blue cell, blue cell with text, green cell with vine -->
    <div style="background:#A4C71F; padding:24px;">
      <svg viewBox="0 0 200 200" style="width:100%; height:auto;">
        <path d="M40 120 Q90 60 160 80 L150 110 Q120 130 100 130 L60 160 Z" fill="#1F2DB0"/>
      </svg>
    </div>
    <div style="background:#1F2DB0;"></div>
    <div style="background:#A4C71F; padding:24px; display:flex; flex-direction:column; justify-content:center;">
      <h3 style="font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:700; line-height:1.10; color:#1F2DB0; margin:0;">desafios e perspectivas para a restauração florestal no Mato Grosso</h3>
    </div>
    <div style="background:#1F2DB0; padding:24px;">
      <svg viewBox="0 0 200 200" style="width:100%; height:auto;">
        <path d="M30 30 Q100 60 170 30 L170 60 Q100 90 30 60 Z" fill="#A4C71F"/>
      </svg>
    </div>

  </div>
</div>
```

### Reversed headline strip

```html
<div style="background:#A4C71F; padding:16px 24px;">
  <p style="font-family:'Bricolage Grotesque',sans-serif; font-size:28px; font-weight:700; line-height:1.10; letter-spacing:-0.5px; color:#1F2DB0; margin:0;">16 e 17 de junho</p>
</div>
```
