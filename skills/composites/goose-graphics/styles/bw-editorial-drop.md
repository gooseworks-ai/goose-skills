# BW Editorial Drop

Fashion-poster editorial. Top 55-60% of the frame holds a desaturated grayscale photograph; bottom 40-45% is a solid drop-black panel containing a massive Anton display headline in highlighter yellow. White uppercase tracked metadata pins the corners. Silent, cinematic, looks like Acne Studios season campaign meets Balenciaga lookbook.

> Full prose reference: `styles/_full/bw-editorial-drop.md`

## Palette

| Hex | Role |
|-----|------|
| `#0A0A0A` | Drop black — bottom panel fill, primary canvas |
| `#F4ED2B` | Highlighter yellow — display headline only |
| `#FFFFFF` | Signal white — corner metadata labels |
| `#F8F34A` | Yellow hover (rare) |
| `#D4CD1F` | Yellow shadow — optional 1-2px text shadow over bright photo |
| `#0F0F0F` | Sub panel — Story format recessed strip |
| `rgba(255,255,255,0.6)` | Metadata muted — slide counters |
| `rgba(255,255,255,0.12)` | Hairline border |
| `rgba(0,0,0,0.35)` | Photo vignette |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@500;600&display=swap" rel="stylesheet">
```

- **Display:** `'Anton', Impact, 'Arial Narrow', sans-serif`
- **Metadata:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Anton | 120px | 400 | 0.92 | -0.03em UPPER |
| Display Large | Anton | 108px | 400 | 0.92 | -0.03em UPPER |
| Display Medium | Anton | 92px | 400 | 0.94 | -0.025em UPPER |
| Display Small | Anton | 72px | 400 | 0.94 | -0.02em UPPER |
| Metadata Label | Inter | 12px | 600 | 1.30 | 0.12em UPPER |
| Metadata Small | Inter | 11px | 500 | 1.30 | 0.14em UPPER |
| Body Cap (rare) | Inter | 14px | 500 | 1.45 | 0.08em UPPER |
| Credit / Slug | Inter | 11px | 500 | 1.30 | 0.16em UPPER |
| CTA Label | Inter | 12px | 600 | 1.30 | 0.14em UPPER |

**Principles**

- Anton is one weight (400 native heavy) but reads as 900.
- Two-line yellow ALL-CAPS headline inside the drop panel.
- All metadata is uppercase tracked Inter 500-600 in white.

## Layout

- Top 55-60% of frame: grayscale photograph (desaturated + slight contrast lift). Apply `filter: grayscale(1) contrast(1.1)`.
- Optional bottom-edge vignette: `linear-gradient(180deg, transparent, rgba(0,0,0,0.35))`.
- Bottom 40-45%: solid `#0A0A0A` drop panel holding the two-line yellow Anton headline.
- Corner metadata: white uppercase Inter labels — brand/issue top-left, date top-right, page number bottom-right.
- CTA micro-copy bottom-right of drop panel ("SHOP NOW TO ELEVATE YOUR LOOK" or similar).

## Do / Don't

**Do**

- Desaturate the photograph fully (`filter: grayscale(1)`).
- Use Anton 400 for the headline — yellow on drop-black, 2 lines max.
- Use Inter uppercase tracked white for every metadata corner.
- Add a faint bottom-edge vignette to the photo.
- Keep the drop panel clean — headline + 1-2 micro-copy labels only.

**Don't**

- Don't color the photograph — grayscale is mandatory.
- Don't use colors in the drop panel besides yellow and white.
- Don't center-align the headline — always left-aligned inside the drop.
- Don't exceed 2 lines on the display headline.
- Don't use lowercase on metadata.

## CSS snippets

### `:root` variables

```css
:root {
  --c-drop: #0A0A0A;
  --c-yellow: #F4ED2B;
  --c-white: #FFFFFF;
  --c-sub-panel: #0F0F0F;
  --c-metadata-muted: rgba(255, 255, 255, 0.6);
  --c-border: rgba(255, 255, 255, 0.12);

  --font-display: 'Anton', Impact, 'Arial Narrow', sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Full composition

```html
<div style="min-height:1350px; background:#0A0A0A; position:relative;">
  <div style="height:60%; background-image:url('model.jpg'); background-size:cover; background-position:center; filter:grayscale(1) contrast(1.1); position:relative;">
    <div style="position:absolute; bottom:0; left:0; right:0; height:25%; background:linear-gradient(180deg,transparent,rgba(0,0,0,0.35));"></div>
    <p style="position:absolute; top:40px; left:40px; font-family:'Inter',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#FFFFFF; margin:0;">STUDIO WILSON · VOL 04</p>
    <p style="position:absolute; top:40px; right:40px; font-family:'Inter',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:#FFFFFF; margin:0;">AUTUMN 2026</p>
  </div>

  <div style="height:40%; background:#0A0A0A; padding:40px 40px 40px; display:flex; flex-direction:column; justify-content:space-between;">
    <h1 style="font-family:'Anton',sans-serif; font-size:120px; font-weight:400; line-height:0.92; letter-spacing:-0.03em; text-transform:uppercase; color:#F4ED2B; margin:0;">THE<br>DROP.</h1>
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:500; letter-spacing:0.16em; text-transform:uppercase; color:rgba(255,255,255,0.6); margin:0;">01 / 12</p>
      <p style="font-family:'Inter',sans-serif; font-size:12px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:#FFFFFF; margin:0;">SHOP NOW TO ELEVATE YOUR LOOK →</p>
    </div>
  </div>
</div>
```

### Story sub-panel variant

```html
<div style="background:#0F0F0F; padding:16px 40px; border-top:1px solid rgba(255,255,255,0.12);">
  <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; color:#FFFFFF; margin:0;">Look 03 · Camel Topcoat · From $1,240</p>
</div>
```
