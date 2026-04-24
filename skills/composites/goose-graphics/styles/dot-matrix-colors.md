# Dot Matrix Colors

White canvas with multi-color dot matrix grids — each grid uses a single hue (purple, blue, or orange) fading from saturated to gray. Large stat numbers below each grid. Clean, bright data visualization infographic style — like a modern annual report or pitch deck.

> Full prose reference: `styles/_full/dot-matrix-colors.md`

## Palette

| Hex | Role |
|-----|------|
| `#FFFFFF` | White — primary background |
| `#2D2D2D` | Near-black — stat numbers, primary text |
| `#555555` | Dark gray — body text |
| `#888888` | Medium gray — secondary/descriptive text |
| `#D1D1D1` | Light gray — faded/empty dots |
| `#9B59B6` | Purple — dot set 1 (saturated) |
| `#C39BD3` | Light purple — dot set 1 (mid fade) |
| `#E8D5F0` | Pale purple — dot set 1 (near-empty) |
| `#4A6CF7` | Blue — dot set 2 (saturated) |
| `#8FA8FA` | Light blue — dot set 2 (mid fade) |
| `#D4DFFE` | Pale blue — dot set 2 (near-empty) |
| `#E8541E` | Orange — dot set 3 (saturated) |
| `#F0956A` | Light orange — dot set 3 (mid fade) |
| `#FADDD0` | Pale orange — dot set 3 (near-empty) |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display / Body:** `'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Stat Number | DM Sans | 64px | 700 | 1.00 | -1.5px |
| Section Heading | DM Sans | 48px | 700 | 1.05 | -1px |
| Sub-heading | DM Sans | 28px | 600 | 1.15 | -0.3px |
| Body Large | DM Sans | 16px | 400 | 1.60 | 0.2px |
| Body | DM Sans | 14px | 400 | 1.60 | 0.2px |
| Descriptive | DM Sans | 13px | 400 | 1.55 | 0.1px |
| Metadata | DM Sans | 11px | 600 | 1.30 | 1px UPPER |
| Caption | DM Sans | 10px | 500 | 1.30 | 0.5px |

**Principles**

- Single font family (DM Sans) — hierarchy through size and weight only.
- Stat numbers are bold and large but not massive — they share attention with the dot grids.
- Body text is quiet, factual, small — infographic density.

## Layout

- White `#FFFFFF` background, clean and bright.
- Content arranged in 2-3 columns, each column containing one dot grid + stat + description.
- Dot grids: 8-10 columns x 5-8 rows of small circles (10-14px diameter, 4-6px gap).
- Each grid uses one color family: dots fade from saturated → mid → pale → gray from top to bottom or left to right.
- Stat number sits directly below each grid, left-aligned.
- Short descriptive paragraph below the stat.
- Generous column gaps (40-60px).
- Padding: 60-80px.

## Do / Don't

**Do**

- Use exactly 3 color families (purple, blue, orange) — one per data column.
- Fade dots from saturated to gray within each grid to show proportion.
- Keep dot grids uniform in size (same rows/columns across all three).
- Place stat numbers directly below their corresponding grid.
- Use DM Sans for everything — no font mixing.

**Don't**

- Don't use dark backgrounds — this is a bright, white-canvas style.
- Don't mix colors within a single dot grid — each grid is monochromatic.
- Don't use borders or dividers between columns — whitespace separates.
- Don't make dots larger than 16px — small, dense, data-like.
- Don't use decorative elements or icons.

## CSS snippets

### `:root` variables

```css
:root {
  --color-bg: #FFFFFF;
  --color-text: #2D2D2D;
  --color-body: #555555;
  --color-meta: #888888;
  --color-dot-empty: #D1D1D1;

  --purple: #9B59B6;
  --purple-mid: #C39BD3;
  --purple-pale: #E8D5F0;
  --blue: #4A6CF7;
  --blue-mid: #8FA8FA;
  --blue-pale: #D4DFFE;
  --orange: #E8541E;
  --orange-mid: #F0956A;
  --orange-pale: #FADDD0;

  --font: 'DM Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Three-column stat grid

```html
<div style="background:#fff; padding:60px; display:flex; gap:48px; align-items:flex-start;">
  <!-- Column 1: Purple -->
  <div style="flex:1;">
    <div style="display:grid; grid-template-columns:repeat(8,12px); gap:5px; margin-bottom:24px;">
      <!-- Row 1: saturated -->
      <div style="width:12px; height:12px; border-radius:50%; background:#9B59B6;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#9B59B6;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#9B59B6;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#C39BD3;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#C39BD3;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#E8D5F0;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#E8D5F0;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
      <!-- Additional rows follow same pattern -->
    </div>
    <p style="font-family:'DM Sans',sans-serif; font-size:64px; font-weight:700; line-height:1.00; letter-spacing:-1.5px; color:#2D2D2D; margin:0 0 12px;">95%</p>
    <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:400; line-height:1.55; color:#555; margin:0;">people depend on personal or home services every month but struggle to find trusted providers quickly.</p>
  </div>

  <!-- Column 2: Blue -->
  <div style="flex:1;">
    <div style="display:grid; grid-template-columns:repeat(8,12px); gap:5px; margin-bottom:24px;">
      <div style="width:12px; height:12px; border-radius:50%; background:#4A6CF7;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#4A6CF7;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#8FA8FA;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D4DFFE;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
    </div>
    <p style="font-family:'DM Sans',sans-serif; font-size:64px; font-weight:700; line-height:1.00; letter-spacing:-1.5px; color:#2D2D2D; margin:0 0 12px;">72%</p>
    <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:400; line-height:1.55; color:#555; margin:0;">say they waste time comparing options across multiple apps before booking a simple service.</p>
  </div>

  <!-- Column 3: Orange -->
  <div style="flex:1;">
    <div style="display:grid; grid-template-columns:repeat(8,12px); gap:5px; margin-bottom:24px;">
      <div style="width:12px; height:12px; border-radius:50%; background:#E8541E;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#F0956A;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#FADDD0;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
      <div style="width:12px; height:12px; border-radius:50%; background:#D1D1D1;"></div>
    </div>
    <p style="font-family:'DM Sans',sans-serif; font-size:64px; font-weight:700; line-height:1.00; letter-spacing:-1.5px; color:#2D2D2D; margin:0 0 12px;">41%</p>
    <p style="font-family:'DM Sans',sans-serif; font-size:13px; font-weight:400; line-height:1.55; color:#555; margin:0;">face last-minute cancellations, unclear pricing, or unreliable service experiences.</p>
  </div>
</div>
```

### CTA

```html
<a style="display:inline-block; background:#2D2D2D; color:#fff; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:14px 28px; border-radius:6px;">See Full Report</a>
```
