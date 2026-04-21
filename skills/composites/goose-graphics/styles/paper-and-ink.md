# Paper & Ink

Classic editorial print aesthetic. Cormorant Garamond display with Lora body on warm cream paper, deep red (`#c41e3a`) as the singular accent — drop caps, hairline rules, pull quotes, pagination. Reads like a Penguin paperback or an old-world newspaper spread.

> Full prose reference: `styles/_full/paper-and-ink.md`

## Palette

| Hex | Role |
|-----|------|
| `#faf8f5` | Paper background |
| `#000000` | Ink — primary text |
| `#c41e3a` | Deep red — accent (drop caps, rules, CTAs) |
| `#9e1830` | Dark red — hover/active |
| `#1a1a18` | Near-black — secondary headlines |
| `#6b6560` | Warm gray — secondary text, captions |
| `#9a9590` | Medium gray — placeholder |
| `#c8c4c0` | Light gray — hairline rules |
| `#e8e5e0` | Pale gray — faint dividers |
| `#f4f1ec` | Off-white — alternate surface |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet">
```

- **Display:** `'Cormorant Garamond', Garamond, 'Times New Roman', serif`
- **Body:** `'Lora', Georgia, 'Times New Roman', serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Cormorant Garamond | 72px | 700 | 1.05 | -1px |
| Section Heading | Cormorant Garamond | 48px | 700 | 1.10 | -0.5px |
| Sub-heading | Cormorant Garamond | 32px | 600 | 1.20 | 0 |
| Body Large | Lora | 20px | 400 | 1.70 | 0 |
| Body | Lora | 16px | 400 | 1.75 | 0.1px |
| Caption | Lora | 13px | 400 | 1.50 | 0.3px |
| Big Number | Cormorant Garamond | 72px | 700 | 1.00 | -1px |
| Pull Quote | Cormorant Garamond | 36px | 400 italic | 1.35 | 0 |
| Drop Cap | Cormorant Garamond | 80px | 700 | 0.85 | 0 |
| Byline Label | Lora | 12px | 600 | 1.00 | 1.5px UPPER |
| CTA | Lora | 15px | 600 | 1.00 | 0.5px |

**Principles**

- Serif display + serif body — the entire reading experience is serifed.
- Italic Cormorant for pull quotes at weight 400.
- Drop caps in deep red on opening paragraphs.
- Generous body line-height (1.70-1.75) for unhurried print rhythm.

## Layout

- Format padding: carousel 60px · infographic 60/80 · slides 80px · poster 60/80.
- Hairline rules: `1px solid #c8c4c0` for column dividers; 2px `#c41e3a` for hero section divider.
- Cards: `#f4f1ec` alt surface, 2px radius. Classic, not modern.
- Two-column body text where space allows (widescreen + infographic).
- Pagination mark (small red circle + number) top-right of each major slide.

## Do / Don't

**Do**

- Use deep red (`#c41e3a`) sparingly: drop caps, pagination marks, hairline rules, pull-quote marks.
- Apply CSS `::first-letter` drop caps on opening body paragraphs in red.
- Set pull quotes in italic Cormorant Garamond at 36px with big red quote marks.
- Use byline labels (`BY SARAH CHEN`) in uppercase tracked Lora 600.
- Use hairline light-gray rules (`#c8c4c0`) as column dividers.

**Don't**

- Don't use sans-serif anywhere.
- Don't use bright or saturated accents — deep red only.
- Don't use modern radii (> 4px). Print is squared.
- Don't use drop shadows. Elevation is through rule and margin only.
- Don't use decorative illustrations. Typography and rules are the entire ornament.

## CSS snippets

### `:root` variables

```css
:root {
  --color-paper: #faf8f5;
  --color-ink: #000000;
  --color-red: #c41e3a;
  --color-red-dark: #9e1830;
  --color-near-black: #1a1a18;
  --color-warm-gray: #6b6560;
  --color-hairline: #c8c4c0;
  --color-alt-surface: #f4f1ec;

  --font-display: 'Cormorant Garamond', Garamond, 'Times New Roman', serif;
  --font-body: 'Lora', Georgia, 'Times New Roman', serif;

  --radius-card: 2px;
}
```

### Title block (with hairline rules)

```html
<div style="background:#faf8f5; padding:80px 60px; text-align:center;">
  <p style="font-family:'Lora',serif; font-size:12px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#c41e3a; margin:0 0 24px;">FEATURE · VOL. IV</p>
  <h1 style="font-family:'Cormorant Garamond',serif; font-size:72px; font-weight:700; line-height:1.05; letter-spacing:-1px; color:#000; margin:0 0 24px;">The Future of<br>Autonomous Work</h1>
  <div style="width:60px; height:2px; background:#c41e3a; margin:32px auto;"></div>
  <p style="font-family:'Lora',serif; font-size:20px; font-weight:400; font-style:italic; line-height:1.70; color:#6b6560; max-width:560px; margin:0 auto;">How AI coworkers are reshaping how teams operate, collaborate, and deliver results.</p>
</div>
```

### Body paragraph with drop cap

```html
<p style="font-family:'Lora',serif; font-size:16px; font-weight:400; line-height:1.75; color:#000; margin:0 0 20px;">
  <span style="float:left; font-family:'Cormorant Garamond',serif; font-size:80px; font-weight:700; line-height:0.85; color:#c41e3a; padding-right:8px; padding-top:6px;">I</span>
  n a world where every team is measured by the speed of its feedback loop, the question is no longer whether to adopt AI — it is how quickly you can wire it into the workflow.
</p>
```

### Pull quote (italic serif, red left rule)

```html
<div style="padding:32px 40px; border-left:3px solid #c41e3a;">
  <p style="font-family:'Cormorant Garamond',serif; font-size:36px; font-weight:400; font-style:italic; line-height:1.35; color:#000; margin:0 0 20px;">"It felt less like configuring software and more like onboarding a new team member."</p>
  <p style="font-family:'Lora',serif; font-size:12px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#6b6560; margin:0;">— SARAH CHEN, VP OPERATIONS</p>
</div>
```

### CTA (solid red pill)

```html
<a style="display:inline-block; background:#c41e3a; color:#faf8f5; font-family:'Lora',serif; font-size:15px; font-weight:600; letter-spacing:0.5px; text-decoration:none; padding:14px 36px; border-radius:2px;">Read the essay</a>
```
