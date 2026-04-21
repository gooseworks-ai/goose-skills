# Grid Quote Editorial

Royal-purple widescreen quote card with a pink 4-column grid overlay and a massive mint-green Figtree 800 pull quote at center. A large pink opening-quote glyph anchors the top-left grid cell. Attribution in uppercase pink sits bottom-left. Built for the 1920×1080 widescreen slide that delivers a single knockout quote.

> Full prose reference: `styles/_full/grid-quote-editorial.md`

## Palette

| Hex | Role |
|-----|------|
| `#2D1A5E` | Royal purple — primary background, entire canvas |
| `#C9E8B5` | Mint green — pull quote display |
| `#F2C9C4` | Peach pink — grid lines, opening-quote glyph, attribution |
| `#1F0F47` | Deep purple — inset/depth |
| `#D4ECB8` | Soft mint — secondary accents |
| `#E5B8B3` | Dusty pink — hover/secondary |
| `rgba(242,201,196,0.55)` | Pink dim — inactive |
| `rgba(242,201,196,0.25)` | Pink faint — tertiary dividers |
| `#F2C9C4` | Grid line (1px) |
| `#251353` | Purple inset — subtle depth stepping |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800;900&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Figtree', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Pull Quote Hero (Slides) | Figtree | 120px | 800 | 1.10 | -1px |
| Pull Quote Hero (Carousel) | Figtree | 88px | 800 | 1.10 | -0.5px |
| Pull Quote Hero (Story) | Figtree | 116px | 800 | 1.08 | -0.5px |
| Pull Quote Hero (Poster) | Figtree | 96px | 800 | 1.10 | -0.5px |
| Section Heading | Figtree | 56px | 800 | 1.15 | -0.5px |
| Sub-heading | Figtree | 36px | 700 | 1.20 | 0 |
| Body Large | Figtree | 22px | 500 | 1.55 | 0 |
| Body | Figtree | 18px | 500 | 1.55 | 0 |
| Caption | Figtree | 14px | 600 | 1.50 | 0.3px |
| Attribution Caps | Figtree | 16px | 600 | 1.00 | 2px UPPER |
| Opening Quote Glyph | Figtree | 120px | 900 | 1.00 | 0 |
| Slide Number | Figtree | 14px | 500 | 1.00 | 1.5px |

**Principles**

- Figtree 800 in mint green is the pull quote voice — large, confident, single quote per slide.
- Pink opening `"` glyph sits in the top-left cell of the 4-column grid.
- Pink attribution uppercase tracked 2px in bottom-left.

## Layout

- Full-bleed royal purple `#2D1A5E`.
- 4-column grid overlay using 1px peach-pink (`#F2C9C4`) vertical lines at 25%, 50%, 75% — always visible.
- Pull quote lives at center spanning columns 2-3 (middle two of four), left-aligned within its cell.
- Opening pink quote glyph `"` at top-left cell.
- Slide number pink top-right.
- Attribution bottom-left in uppercase pink.

## Do / Don't

**Do**

- Keep the 4-column pink grid visible on every slide — it's the editorial structure.
- Use mint green `#C9E8B5` for the pull quote only.
- Use peach pink for grid lines, opening-quote glyph, and attribution.
- Set the opening `"` glyph at 120px Figtree 900 in the top-left grid cell.
- Left-align the quote within its grid span.

**Don't**

- Don't center the pull quote horizontally — left-aligned inside grid cell.
- Don't hide the grid lines — they're the identity.
- Don't use more than one quote per slide.
- Don't add images or decorative objects beyond the grid + glyph + quote.
- Don't use colors outside the purple + mint + pink system.

## CSS snippets

### `:root` variables

```css
:root {
  --c-purple: #2D1A5E;
  --c-purple-deep: #1F0F47;
  --c-purple-inset: #251353;
  --c-mint: #C9E8B5;
  --c-mint-soft: #D4ECB8;
  --c-pink: #F2C9C4;
  --c-pink-dim: rgba(242, 201, 196, 0.55);
  --c-pink-faint: rgba(242, 201, 196, 0.25);

  --font: 'Figtree', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Grid + quote composition

```html
<div style="background:#2D1A5E; min-height:1080px; position:relative; padding:60px; background-image:linear-gradient(to right,transparent 24.5%,#F2C9C4 24.5%,#F2C9C4 25%,transparent 25%,transparent 49.5%,#F2C9C4 49.5%,#F2C9C4 50%,transparent 50%,transparent 74.5%,#F2C9C4 74.5%,#F2C9C4 75%,transparent 75%); background-size:100% 100%;">

  <p style="position:absolute; top:40px; left:40px; font-family:'Figtree',sans-serif; font-size:120px; font-weight:900; line-height:1.00; color:#F2C9C4; margin:0;">"</p>

  <p style="position:absolute; top:60px; right:60px; font-family:'Figtree',sans-serif; font-size:14px; font-weight:500; letter-spacing:1.5px; color:#F2C9C4; margin:0;">03 / 12</p>

  <div style="position:absolute; top:50%; left:25%; width:50%; transform:translateY(-50%);">
    <p style="font-family:'Figtree',sans-serif; font-size:120px; font-weight:800; line-height:1.10; letter-spacing:-1px; color:#C9E8B5; margin:0;">The best teams write less, ship more, and argue louder about what matters.</p>
  </div>

  <p style="position:absolute; bottom:60px; left:60px; font-family:'Figtree',sans-serif; font-size:16px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#F2C9C4; margin:0;">— MAYA KIM, HEAD OF PRODUCT @ DRIFT</p>
</div>
```

### Poster variant

```html
<div style="background:#2D1A5E; padding:60px; min-height:1350px; position:relative; background-image:linear-gradient(to right,transparent calc(33.3% - 0.5px),#F2C9C4 33.3%,#F2C9C4 calc(33.3% + 0.5px),transparent calc(33.3% + 0.5px),transparent calc(66.6% - 0.5px),#F2C9C4 66.6%,#F2C9C4 calc(66.6% + 0.5px),transparent calc(66.6% + 0.5px));">
  <p style="font-family:'Figtree',sans-serif; font-size:120px; font-weight:900; line-height:1.00; color:#F2C9C4; margin:0;">"</p>
  <h1 style="font-family:'Figtree',sans-serif; font-size:96px; font-weight:800; line-height:1.10; letter-spacing:-0.5px; color:#C9E8B5; margin:120px 0 0; max-width:720px;">The first version is a question. The second version is the answer.</h1>
  <p style="position:absolute; bottom:60px; left:60px; font-family:'Figtree',sans-serif; font-size:16px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#F2C9C4; margin:0;">— OLIVIA WILSON, FOUNDER</p>
</div>
```
