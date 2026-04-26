# Green Grid Editorial

A green-and-photography editorial system inspired by contemporary Japanese magazine design. Photographic blocks (rice fields, gardens, botanicals) sit beside chartreuse text panels, all overlaid with a fine asymmetric grid of small dots and short tick lines. Headlines mix italic serif and clean sans, with kanji or large numeric accents. The signature is the geometric overlay — small black dots and stripes — that ties photography and type into one editorial sheet.

> Full prose reference: `styles/_full/green-grid-editorial.md`

## Palette

| Hex | Role |
|-----|------|
| `#C9DD2E` | Chartreuse — primary panel background |
| `#0F1A0E` | Deep moss — primary text + grid marks |
| `#F2EFE3` | Bone — secondary panel background |
| `#2F4A2A` | Forest green — accent text on chartreuse |
| `#1B3414` | Pine shadow — frame / heavy panel |
| `#A4B73B` | Olive medium — secondary tint |
| `#6E7C20` | Olive dark — small caption text |
| `#FFFFFF` | Paper white — narrow card / inset text |
| `#9DA0A2` | Photo-mute gray — photo overlay tint |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display:** `'Cormorant Garamond', 'Times New Roman', serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Cormorant Garamond | 96px | 500 | 1.05 | -1px |
| Display Italic | Cormorant Garamond Italic | 64px | 500 | 1.10 | -0.5px |
| Year Mark | Cormorant Garamond | 80px | 600 | 1.00 | -1px |
| Section Heading | Inter | 32px | 700 | 1.15 | -0.5px |
| Caption | Inter | 13px | 500 | 1.50 | 0.4px UPPER |
| Body | Inter | 15px | 400 | 1.60 | 0.2px |
| Tag | Inter | 11px | 600 | 1.30 | 1px UPPER |

**Principles**

- Pair Cormorant Garamond display with Inter body — never two display faces.
- Use italic for the secondary headline, roman for the primary.
- Captions are tracked uppercase; body is tight, narrow-column.

## Layout

- 12-column underlying grid; panels span 4–8 columns each.
- One photographic panel + one chartreuse text panel sit side-by-side; a smaller bone-paper inset stacks below.
- An **overlay grid** sits across the layout: small 3px black dots on a 24px grid in three quadrants, plus 3–5 short black tick lines (40–80px wide) acting as register marks. The overlay never covers more than 20% of any panel.
- A small year mark (e.g. "2024") in serif anchors a corner of one panel.
- Photography is treated with a slight green-mute color cast.

## Do / Don't

**Do**

- Build the layout from chartreuse + bone + photography panels.
- Add a decorative dot grid + tick marks across multiple panels for editorial cohesion.
- Use a large serif year mark as a graphic anchor.
- Treat photography with a subtle green color-cast / desaturation.
- Keep captions uppercase, tracked, in olive-dark.

**Don't**

- Don't use bright primary colors — palette is greens / chartreuse / bone only.
- Don't replace the dot grid with a noise texture or solid fill — discrete marks only.
- Don't enlarge the dot grid; it should read as fine ornament, not pattern.
- Don't pair the serif display with a script or slab display.
- Don't run body copy below 13px.

## CSS snippets

### `:root` variables

```css
:root {
  --c-chartreuse: #C9DD2E;
  --c-olive-mid: #A4B73B;
  --c-olive-dark: #6E7C20;
  --c-bone: #F2EFE3;
  --c-moss: #0F1A0E;
  --c-forest: #2F4A2A;
  --c-pine: #1B3414;
  --c-paper: #FFFFFF;

  --font-display: 'Cormorant Garamond', 'Times New Roman', serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Side-by-side photo + chartreuse text panel

```html
<div style="background:#0F1A0E; padding:32px; min-height:1350px;">
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
    <!-- Photo panel with overlay grid -->
    <div style="background:#2F4A2A url('https://images.unsplash.com/photo-rice-field') center/cover; min-height:560px; position:relative;">
      <svg viewBox="0 0 480 560" style="position:absolute; inset:0; width:100%; height:100%;">
        <g fill="#0F1A0E">
          <circle cx="40" cy="40" r="3"/><circle cx="64" cy="40" r="3"/><circle cx="88" cy="40" r="3"/>
          <circle cx="40" cy="64" r="3"/><circle cx="64" cy="64" r="3"/><circle cx="88" cy="64" r="3"/>
        </g>
        <line x1="40" y1="200" x2="120" y2="200" stroke="#0F1A0E" stroke-width="2"/>
        <line x1="40" y1="220" x2="80" y2="220" stroke="#0F1A0E" stroke-width="2"/>
      </svg>
      <p style="position:absolute; top:24px; left:24px; font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#F2EFE3; margin:0;">REPORT 02</p>
      <h2 style="position:absolute; bottom:32px; left:24px; right:24px; font-family:'Cormorant Garamond',serif; font-size:64px; font-weight:500; line-height:1.05; letter-spacing:-1px; color:#F2EFE3; margin:0;">Reverting <em style="font-style:italic;">/Satoyama/</em> under-use</h2>
    </div>
    <!-- Chartreuse text panel -->
    <div style="background:#C9DD2E; padding:48px 40px; position:relative; display:flex; flex-direction:column; justify-content:space-between;">
      <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#0F1A0E; margin:0;">Issue 24 · August, 11<sup>th</sup></p>
      <h2 style="font-family:'Cormorant Garamond',serif; font-size:96px; font-weight:500; line-height:1.05; letter-spacing:-1px; color:#0F1A0E; margin:24px 0 0;">Kaga<br>Veggies <em style="font-style:italic;">@</em> harvest<br><span style="font-weight:600;">2024</span></h2>
      <div style="margin-top:24px;">
        <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:500; letter-spacing:0.4px; text-transform:uppercase; color:#0F1A0E; margin:0;">Tea, soup, sweet potato</p>
      </div>
    </div>
  </div>
</div>
```

### Overlay dot-grid block

```html
<svg viewBox="0 0 240 80" width="240" height="80">
  <g fill="#0F1A0E">
    <!-- 8 cols × 3 rows -->
    <circle cx="12" cy="12" r="2.5"/><circle cx="36" cy="12" r="2.5"/><circle cx="60" cy="12" r="2.5"/>
    <circle cx="84" cy="12" r="2.5"/><circle cx="108" cy="12" r="2.5"/><circle cx="132" cy="12" r="2.5"/>
    <circle cx="12" cy="36" r="2.5"/><circle cx="36" cy="36" r="2.5"/><circle cx="60" cy="36" r="2.5"/>
  </g>
</svg>
```
