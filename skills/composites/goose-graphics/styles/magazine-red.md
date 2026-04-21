# Magazine Red

Startup pitch-deck energy in magazine clothing. Massive tomato-red Anton condensed headlines at 180-240px on warm cream paper, with espresso-black Inter body handling all secondary roles. Bracketed red pagination `[1]` `(05)` and hairline rules carry the editorial grammar. Think early-2000s Wired cover meets a Series A announcement.

> Full prose reference: `styles/_full/magazine-red.md`

## Palette

| Hex | Role |
|-----|------|
| `#F2EEE2` | Cream paper — primary background |
| `#C33A1F` | Tomato red — display headlines, bracketed numbers |
| `#2B2119` | Espresso black — primary body text |
| `#4A3E33` | Ink medium — secondary text |
| `#7A6B5C` | Ink light — tertiary, photo credits |
| `#A82E17` | Brick red — hover/active |
| `#B83327` | Rust red — alternative display red |
| `#ECE6D6` | Cream deep — subtle inset |
| `#E4DCC8` | Paper fold — photo frame bg |
| `rgba(43,33,25,0.15)` | Border hairline |
| `rgba(43,33,25,0.45)` | Ink mute — page numbers, watermarks |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display:** `'Anton', Impact, 'Arial Narrow', sans-serif`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Massive Hero | Anton | 240px | 400 | 0.88 | -2px UPPER |
| Display Hero | Anton | 180px | 400 | 0.90 | -1.5px UPPER |
| Display Large | Anton | 120px | 400 | 0.92 | -1px UPPER |
| Display Medium | Anton | 88px | 400 | 0.94 | -0.5px UPPER |
| Big Number | Anton | 140px | 400 | 0.90 | -1px |
| Bracket Number | Anton | 56px | 400 | 1.0 | 0 |
| Heading 1 | Inter | 28px | 700 | 1.25 | -0.2px |
| Heading 2 | Inter | 20px | 700 | 1.30 | 0 |
| Label Caps | Inter | 13px | 600 | 1.20 | 2px UPPER |
| Label Caps Small | Inter | 11px | 700 | 1.20 | 1.8px UPPER |
| Body Large | Inter | 18px | 500 | 1.55 | 0 |
| Body | Inter | 15px | 500 | 1.60 | 0 |
| Body Small | Inter | 13px | 500 | 1.55 | 0 |
| Subtitle Red | Inter | 16px | 700 | 1.30 | 0.5px UPPER |

**Principles**

- Anton is one weight (400 native heavy) — size = impact. Nearly fills frame width.
- Red display headlines ALL CAPS. Body stays espresso-black mixed case.
- Red is reserved for display, bracketed numbers, and subtitle tags.

## Layout

- Full-bleed cream paper `#F2EEE2`.
- Two-column or three-column editorial grid where space allows.
- Bracket numbers `[1]` `[2]` for list markers; parenthetical `(05)` for page/slide numbers.
- Hairline rules `1px solid rgba(43,33,25,0.15)` between body items.
- Photography framed in `#E4DCC8` paper-fold inset.

## Do / Don't

**Do**

- Use Anton at 180-240px in tomato red for cover and section headlines.
- Use bracket markers (`[1]`, `(05)`) in red Anton for list and page numbers.
- Use Inter espresso-black mixed case for all body text.
- Use uppercase tracked Inter labels (13px, 2px tracking) for corner metadata like "PRESENTED BY / OLIVIA WILSON".
- Use hairline rules to separate list items and columns.

**Don't**

- Don't use red for body text — only display, bracket numbers, and subtitle tags.
- Don't mix case on display headlines — UPPERCASE.
- Don't use serif fonts anywhere.
- Don't use saturated accents besides the tomato red.
- Don't use heavy shadows — this is print; elevation is through scale and rule.

## CSS snippets

### `:root` variables

```css
:root {
  --color-cream: #F2EEE2;
  --color-red: #C33A1F;
  --color-espresso: #2B2119;
  --color-ink-med: #4A3E33;
  --color-ink-light: #7A6B5C;
  --color-brick: #A82E17;
  --color-cream-deep: #ECE6D6;
  --color-paper-fold: #E4DCC8;
  --color-hairline: rgba(43, 33, 25, 0.15);

  --font-display: 'Anton', Impact, 'Arial Narrow', sans-serif;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Cover hero (massive red display)

```html
<div style="background:#F2EEE2; padding:60px; min-height:100vh; position:relative;">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid rgba(43,33,25,0.15); padding-bottom:16px; margin-bottom:60px;">
    <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#2B2119; margin:0;">PRESENTED BY / OLIVIA WILSON</p>
    <p style="font-family:'Anton',sans-serif; font-size:56px; line-height:1.0; color:#C33A1F; margin:0;">(05)</p>
  </div>

  <h1 style="font-family:'Anton',sans-serif; font-size:240px; font-weight:400; line-height:0.88; letter-spacing:-2px; text-transform:uppercase; color:#C33A1F; margin:0;">PITCH<br>DECK.</h1>

  <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#C33A1F; margin:40px 0 0;">MARKETING EXPERTS AT YOUR SERVICE</p>
  <p style="font-family:'Inter',sans-serif; font-size:18px; font-weight:500; line-height:1.55; color:#2B2119; max-width:640px; margin:16px 0 0;">A four-part framework for teams that want to ship their first campaign before the quarter ends.</p>
</div>
```

### Bracketed list

```html
<div style="background:#F2EEE2; padding:48px 60px;">
  <div style="display:flex; gap:32px; padding:24px 0; border-bottom:1px solid rgba(43,33,25,0.15);">
    <span style="font-family:'Anton',sans-serif; font-size:56px; line-height:1.0; color:#C33A1F; flex-shrink:0;">[1]</span>
    <div>
      <h3 style="font-family:'Inter',sans-serif; font-size:28px; font-weight:700; letter-spacing:-0.2px; color:#2B2119; margin:0 0 8px;">Find the sharpest question</h3>
      <p style="font-family:'Inter',sans-serif; font-size:15px; font-weight:500; line-height:1.60; color:#4A3E33; margin:0;">Every deck has one slide that earns the meeting. Work backward from that slide.</p>
    </div>
  </div>
</div>
```

### Photo caption card

```html
<div style="background:#E4DCC8; padding:16px;">
  <div style="background:#7A6B5C; height:280px;"></div>
  <p style="font-family:'Inter',sans-serif; font-size:11px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase; color:#2B2119; margin:12px 0 0;">OLIVIA WILSON · FOUNDER</p>
</div>
```

### CTA (red block)

```html
<a style="display:inline-block; background:#C33A1F; color:#F2EEE2; font-family:'Inter',sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase; text-decoration:none; padding:14px 28px;">READ THE ESSAY →</a>
```
