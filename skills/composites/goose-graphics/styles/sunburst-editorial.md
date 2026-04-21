# Sunburst Editorial

Mid-century book cover feel. Cream canvas with DM Serif Display stacked two-line headlines, Lora serif body, and a signature sunburst collage block (mustard yellow + forest green hard-cornered shapes with radiating ink lines). The sunburst appears on alternating slides — rhythm of collage slide, no-collage slide. Editorial, restrained, long-form.

> Full prose reference: `styles/_full/sunburst-editorial.md`

## Palette

| Hex | Role |
|-----|------|
| `#FBFAF4` | Cream — primary background (every slide) |
| `#1A1A1A` | Near-black — primary text, sunburst lines, markers |
| `#C85A1F` | Rust orange — footer brand, URL, page numbers, stat accents |
| `#D8AD38` | Mustard yellow — sunburst collage block only |
| `#1E4A30` | Forest green — sunburst collage block only |
| `#A54617` | Rust deep — hover/active |
| `#F4F1E8` | Cream deep — inset panels |
| `#3D3A36` | Secondary text |
| `#6B6660` | Tertiary text — metadata |
| `rgba(26,26,26,0.65)` | Pencil gray — thin outline of numbered marker |
| `rgba(26,26,26,0.12)` | Hairline section divider |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
```

- **Display:** `'DM Serif Display', Georgia, 'Times New Roman', serif`
- **Body:** `'Lora', Georgia, 'Times New Roman', serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | DM Serif Display | 84px | 400 | 1.05 | -1.5px |
| Section Heading | DM Serif Display | 72px | 400 | 1.05 | -1px |
| Sub-heading | DM Serif Display | 44px | 400 | 1.15 | -0.5px |
| Body Large | Lora | 20px | 400 | 1.65 | 0 |
| Body | Lora | 18px | 400 | 1.65 | 0 |
| Body Italic | Lora Italic | 18px | 400 | 1.65 | 0 |
| Caption | Lora | 13px | 500 | 1.50 | 0.2px |
| Big Number | DM Serif Display | 72px | 400 | 1.00 | -1px |
| Numbered Marker | DM Serif Display | 32px | 400 | 1.00 | 0 |
| Footer Brand | Lora | 14px | 500 | 1.40 | 0.3px |
| Footer URL | Lora | 14px | 500 | 1.40 | 0.3px |

**Principles**

- DM Serif Display only has one weight (400) — never apply `font-weight: 700`, renders as faux-bold.
- Break every headline into 2 lines manually with `<br>`.
- Italic Lora for gentle emphasis — never bold for body.
- Left-align everything.

## Layout

- Cream `#FBFAF4` everywhere — no alternate page color.
- Sunburst collage: inline SVG with radiating 1-2px ink lines + mustard + forest-green hard-cornered rectangles. Appears on alternating slides.
- Numbered marker: thin-outlined circle (≈48px) with a small gap at the top and the number in DM Serif 32px centered.
- Footer on every carousel slide: rust orange brand mark + URL left, page number right, Lora 14px.
- Left-align headlines, body, numbered items, pull-quotes.

## Do / Don't

**Do**

- Use DM Serif Display at weight 400 for all headlines — stack on 2 lines.
- Use the sunburst collage on alternating slides (1, 3, 5…), not every slide.
- Use rust orange only for footer marks, page numbers, stat accents, pull-quote rules.
- Use italic Lora for gentle emphasis in body prose.
- Keep geometric collage shapes hard-cornered — no `border-radius`.
- Include footer (brand + URL) on every carousel slide.

**Don't**

- Don't use sans-serif for headlines — the style is serif-only.
- Don't use pure white or pure black — cream and `#1A1A1A` are non-negotiable.
- Don't center-align anything.
- Don't use mustard or forest green for text — collage blocks only.
- Don't use rust orange for headlines or body — small editorial marks only.
- Don't use yellow pill tags or modern framework UI — this is editorial, not creator-carousel.

## CSS snippets

### `:root` variables

```css
:root {
  --color-cream: #FBFAF4;
  --color-ink: #1A1A1A;
  --color-rust: #C85A1F;
  --color-mustard: #D8AD38;
  --color-forest: #1E4A30;
  --color-text-2: #3D3A36;
  --color-text-3: #6B6660;
  --color-hairline: rgba(26, 26, 26, 0.12);

  --font-display: 'DM Serif Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Lora', Georgia, 'Times New Roman', serif;
}
```

### Sunburst collage SVG

```html
<svg viewBox="0 0 200 200" width="200" height="200">
  <rect x="80" y="60" width="60" height="80" fill="#D8AD38"/>
  <rect x="100" y="100" width="70" height="40" fill="#1E4A30"/>
  <g stroke="#1A1A1A" stroke-width="1.5" stroke-linecap="round">
    <line x1="100" y1="10" x2="100" y2="30"/>
    <line x1="140" y1="20" x2="130" y2="40"/>
    <line x1="170" y1="60" x2="150" y2="70"/>
    <line x1="180" y1="100" x2="160" y2="100"/>
    <line x1="170" y1="140" x2="150" y2="130"/>
    <line x1="60" y1="20" x2="70" y2="40"/>
    <line x1="30" y1="60" x2="50" y2="70"/>
    <line x1="20" y1="100" x2="40" y2="100"/>
    <line x1="30" y1="140" x2="50" y2="130"/>
  </g>
</svg>
```

### Content slide with numbered marker

```html
<div style="background:#FBFAF4; padding:60px; min-height:960px; position:relative;">
  <div style="position:absolute; top:60px; left:60px; width:48px; height:48px; border:1px solid rgba(26,26,26,0.65); border-radius:50%; display:flex; align-items:center; justify-content:center;">
    <span style="font-family:'DM Serif Display',serif; font-size:32px; color:#1A1A1A;">2</span>
  </div>

  <div style="margin-top:120px;">
    <h2 style="font-family:'DM Serif Display',serif; font-size:72px; font-weight:400; line-height:1.05; letter-spacing:-1px; color:#1A1A1A; margin:0 0 32px;">Write the<br>first chapter.</h2>
    <p style="font-family:'Lora',serif; font-size:18px; font-weight:400; line-height:1.65; color:#3D3A36; margin:0 0 20px; max-width:560px;">The first chapter is the thing most founders skip. It's the one where you write down what you actually believe — before the market, the team, and the investors talk you out of it.</p>
    <p style="font-family:'Lora',serif; font-style:italic; font-size:18px; font-weight:400; line-height:1.65; color:#3D3A36; margin:0; max-width:560px;">Start there.</p>
  </div>

  <div style="position:absolute; bottom:40px; left:60px; right:60px; display:flex; justify-content:space-between; font-family:'Lora',serif; font-size:14px; font-weight:500; letter-spacing:0.3px;">
    <span style="color:#C85A1F;">THE FOUNDER DIARIES · founderdiaries.co</span>
    <span style="color:#C85A1F;">02</span>
  </div>
</div>
```

### Pull quote (rust rule)

```html
<div style="padding:32px 0; border-left:3px solid #C85A1F; padding-left:24px;">
  <p style="font-family:'DM Serif Display',serif; font-size:44px; font-weight:400; line-height:1.15; letter-spacing:-0.5px; color:#1A1A1A; margin:0 0 16px;">"Write the thing nobody asked for."</p>
  <p style="font-family:'Lora',serif; font-size:13px; font-weight:500; letter-spacing:0.2px; color:#6B6660; margin:0;">— CHAPTER TWO</p>
</div>
```
