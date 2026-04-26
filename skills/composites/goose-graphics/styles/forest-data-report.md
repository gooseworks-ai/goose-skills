# Forest Data Report

Deep forest-green canvas. Bright lime-green numerals. White body type. Each data row is a left-aligned label with an arrow-bullet, paired with one massive lime stat on the right. Hairline horizontal rules separate rows. Reads like a fintech / SaaS annual-report cover or KPI section — calm, confident, one-color-scheme-with-a-pop.

> Full prose reference: `styles/_full/forest-data-report.md`

## Palette

| Hex | Role |
|-----|------|
| `#0E2417` | Forest green — primary background |
| `#B8FE00` | Lime — stat numerals + accent |
| `#FFFFFF` | White — primary text |
| `#A8C09B` | Sage — secondary text |
| `#3D5A48` | Forest mid — divider rules |
| `#1B3424` | Forest light — secondary panel fill |
| `#7E9E8C` | Sage muted — fine-print / footnotes |
| `#90D000` | Lime deep — small chart accents |
| `#062012` | Forest deep — extreme shadow |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=GT+Walsheim&display=swap" rel="stylesheet">
```

- **Display + Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Stat Mega | Inter | 96px | 500 | 1.00 | -2px |
| Stat Hero | Inter | 72px | 500 | 1.00 | -1.5px |
| Section Heading | Inter | 32px | 500 | 1.10 | -0.5px |
| Row Label | Inter | 16px | 500 | 1.45 | 0 |
| Row Footnote | Inter | 13px | 400 | 1.45 | 0 |
| Footer Body | Inter | 11px | 400 | 1.55 | 0 |
| Eyebrow | Inter | 12px | 600 | 1.40 | 0.4px UPPER |

**Principles**

- Stat numerals are mid-weight (500), not bold — the size carries the impact.
- Numerals use kerning at -1.5 to -2px for tight, modern numerals.
- Body is white-on-green at 16px max; footnotes drop to 11px, sage-muted color.

## Layout

- Forest-green fills the entire canvas. Edge padding generous (72–96px).
- Top: a section heading (e.g., "Key Numbers") with a small superscript footnote marker.
- Middle: a stack of 4–6 data rows. Each row has:
  - Left: arrow-bullet (`→`) + label + optional small superscript footnote
  - Right: one large lime stat (e.g., "18.0M", "$81B", ">50%")
  - Hairline horizontal rule below in forest-mid color
- Bottom: a small fine-print block in sage-muted, justified left, citing the data sources.

## Do / Don't

**Do**

- Use forest-green as the only background. Lime is the only accent.
- Set every stat in lime, mid-weight, at 72–96px.
- Use arrow bullets (`→`) for every data row.
- Add hairline rules (1px, forest-mid) between rows.
- Drop a fine-print block at the bottom in sage-muted, 11px.

**Don't**

- Don't introduce a third color. Stick to forest + lime + white + sage.
- Don't bold the stats — mid-weight at large sizes only.
- Don't use bullet dots (•) — only arrow bullets.
- Don't add gradient or vignette to the background.
- Don't use sentence-case eyebrows — eyebrows are uppercase tracked.

## CSS snippets

### `:root` variables

```css
:root {
  --c-forest: #0E2417;
  --c-forest-deep: #062012;
  --c-forest-mid: #3D5A48;
  --c-forest-light: #1B3424;
  --c-lime: #B8FE00;
  --c-lime-deep: #90D000;
  --c-white: #FFFFFF;
  --c-sage: #A8C09B;
  --c-sage-mute: #7E9E8C;

  --font: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Key Numbers stat list

```html
<div style="background:#0E2417; padding:80px 72px; min-height:1350px; color:#FFFFFF; font-family:'Inter',sans-serif;">
  <h2 style="font-size:32px; font-weight:500; line-height:1.10; letter-spacing:-0.5px; margin:0 0 56px;">Key Numbers<sup style="font-size:14px; font-weight:500; vertical-align:super;">1</sup></h2>

  <div style="border-top:1px solid #3D5A48;">
    <div style="display:flex; justify-content:space-between; align-items:center; padding:24px 0; border-bottom:1px solid #3D5A48;">
      <div style="max-width:60%;">
        <p style="font-size:16px; font-weight:500; line-height:1.45; margin:0;">→ Net Cumulative Funded Accounts<sup style="font-size:11px; vertical-align:super;">2</sup></p>
      </div>
      <p style="font-size:96px; font-weight:500; line-height:1.0; letter-spacing:-2px; color:#B8FE00; margin:0;">18.0M</p>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; padding:24px 0; border-bottom:1px solid #3D5A48;">
      <div style="max-width:60%;">
        <p style="font-size:16px; font-weight:500; line-height:1.45; margin:0;">→ Monthly Active Users (MAU)<sup style="font-size:11px; vertical-align:super;">3</sup></p>
      </div>
      <p style="font-size:96px; font-weight:500; line-height:1.0; letter-spacing:-2px; color:#B8FE00; margin:0;">17.7M</p>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; padding:24px 0; border-bottom:1px solid #3D5A48;">
      <div style="max-width:60%;">
        <p style="font-size:16px; font-weight:500; line-height:1.45; margin:0;">→ Assets Under Custody (AUC)<sup style="font-size:11px; vertical-align:super;">2</sup></p>
      </div>
      <p style="font-size:96px; font-weight:500; line-height:1.0; letter-spacing:-2px; color:#B8FE00; margin:0;">$81B</p>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; padding:24px 0; border-bottom:1px solid #3D5A48;">
      <div style="max-width:60%;">
        <p style="font-size:16px; font-weight:500; line-height:1.45; margin:0;">→ Robinhood customers who are first-time investors<sup style="font-size:11px; vertical-align:super;">4</sup></p>
      </div>
      <p style="font-size:96px; font-weight:500; line-height:1.0; letter-spacing:-2px; color:#B8FE00; margin:0;">&gt;50%</p>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; padding:24px 0; border-bottom:1px solid #3D5A48;">
      <div style="max-width:60%;">
        <p style="font-size:16px; font-weight:500; line-height:1.45; margin:0;">→ Organic or referred new customers<sup style="font-size:11px; vertical-align:super;">5</sup></p>
      </div>
      <p style="font-size:96px; font-weight:500; line-height:1.0; letter-spacing:-2px; color:#B8FE00; margin:0;">&gt;80%</p>
    </div>
  </div>

  <p style="font-size:11px; font-weight:400; line-height:1.55; color:#7E9E8C; margin:48px 0 0; max-width:90%;">1) See "Management's Discussions and Analysis of Financial Condition and Results of Operations—Key Performance Metrics" for the definitions and, if applicable, potential limitations.  2) Data as of March 31, 2021.  3) Data for the month ended March 31, 2021.</p>
</div>
```

### Single arrow stat row

```html
<div style="display:flex; justify-content:space-between; align-items:center; padding:20px 0; border-bottom:1px solid #3D5A48; background:#0E2417;">
  <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:500; color:#FFFFFF; margin:0;">→ Active accounts</p>
  <p style="font-family:'Inter',sans-serif; font-size:72px; font-weight:500; line-height:1.0; letter-spacing:-1.5px; color:#B8FE00; margin:0;">12.4M</p>
</div>
```
