# Cinematic Romance

Streaming-service key-art. A portrait photograph color-graded into teal (shadows) and rose (highlights), with a massive hot-pink Allura script headline covering the frame. Inter uppercase metadata frames the composition. Think Netflix limited-series poster meets editorial romance cover.

> Full prose reference: `styles/_full/cinematic-romance.md`

## Palette

| Hex | Role |
|-----|------|
| `#3a5f6b` | Teal graded — primary canvas tone, photo grade target |
| `#E8449A` | Hot pink — all type, all elements |
| `#C1297A` | Pink deep — hover, gradient stop |
| `#FF5FAE` | Pink hot — highlight glow |
| `#1f3942` | Teal deep — gradient corners, dark base |
| `#4b7583` | Teal mid — content-slide bg |
| `#78a2ad` | Teal highlight — rim light |
| `#f2e6ec` | Off-white dim — CTA inversions |
| `#0d1a1f` | Ink — pause chrome, UI darks |
| `#b88e87` | Graded skin — skin-tone family under grade |
| `rgba(232,68,154,0.72)` | Caption pink dim |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Allura&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display Script:** `'Allura', 'Lucida Handwriting', cursive`
- **Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Script | Allura | 220px | 400 | 0.90 | 0 |
| Presents Line | Inter | 14px | 600 | 1.00 | 3.5px UPPER |
| Logline | Inter | 18px | 600 | 1.45 | 1.2px UPPER |
| Episode Label | Inter | 12px | 700 | 1.00 | 4px UPPER |
| Body Large | Inter | 22px | 500 | 1.55 | 0.3px |
| Body | Inter | 18px | 500 | 1.60 | 0.2px |
| Caption | Inter | 13px | 500 | 1.40 | 1px UPPER |
| Big Number | Allura | 180px | 400 | 0.90 | 0 |
| Stat Label | Inter | 13px | 600 | 1.00 | 3px UPPER |
| UI Element | Inter | 11px | 600 | 1.00 | 2px UPPER |

**Principles**

- Allura script at 180-220px is the entire hero — everything else supports it.
- All type is hot pink (`#E8449A`). No exceptions for metadata, CTAs, body.
- Uppercase tracked Inter for structural/metadata language.
- Script is mixed case; everything else is UPPER with wide tracking.

## Layout

- Background: full-bleed portrait photograph duotone-graded into the teal family with pink rim lights and graded skin tones.
- Apply `filter: contrast(1.1) saturate(0.6)` and composite with `background-blend-mode: multiply` onto teal base.
- The hot-pink script sits ACROSS the photo at 60-80% frame width, slightly off-center.
- Inter uppercase metadata pins the corners: "PRESENTS" top-left, "EPISODE ONE" top-right, scene caption bottom, pause-chrome UI elements.
- Rose gradient glow `radial-gradient(circle at center, rgba(232,68,154,0.25), transparent 70%)` behind script for luminance.

## Do / Don't

**Do**

- Color-grade the photo into the teal/rose family — never use ungraded RGB.
- Use Allura script at 180-220px as the visual anchor.
- Paint every typographic element in hot pink `#E8449A`.
- Pin uppercase tracked Inter metadata in corners for the "streaming UI" frame.
- Add scene-label UI chrome: `⏸ SCENE 03 · 02:47` bottom-left.

**Don't**

- Don't use any color outside the teal/pink family (no whites except `#f2e6ec` for CTA inversion, no true black).
- Don't use sans-serif for the script — Allura is mandatory for hero type.
- Don't split the script across the canvas; keep it as a single flowing phrase.
- Don't brighten the photo — keep it graded and slightly muted.
- Don't use emojis or icons other than pause/play UI chrome.

## CSS snippets

### `:root` variables

```css
:root {
  --color-teal: #3a5f6b;
  --color-teal-deep: #1f3942;
  --color-teal-mid: #4b7583;
  --color-teal-hi: #78a2ad;
  --color-pink: #E8449A;
  --color-pink-deep: #C1297A;
  --color-pink-hot: #FF5FAE;
  --color-ink: #0d1a1f;
  --color-off-white: #f2e6ec;

  --font-script: 'Allura', 'Lucida Handwriting', cursive;
  --font-body: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
}
```

### Cinematic hero with graded photo

```html
<div style="position:relative; min-height:100vh; background:#3a5f6b; overflow:hidden;">
  <div style="position:absolute; inset:0; background-image:url('portrait.jpg'); background-size:cover; background-position:center; filter:contrast(1.1) saturate(0.6); mix-blend-mode:multiply;"></div>
  <div style="position:absolute; inset:0; background:radial-gradient(circle at 50% 60%, rgba(232,68,154,0.25), transparent 70%);"></div>

  <div style="position:relative; z-index:2; padding:60px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <p style="font-family:'Inter',sans-serif; font-size:14px; font-weight:600; letter-spacing:3.5px; text-transform:uppercase; color:#E8449A; margin:0;">BORCELLE STUDIO PRESENTS</p>
      <p style="font-family:'Inter',sans-serif; font-size:12px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:#E8449A; margin:0;">EPISODE ONE</p>
    </div>
    <h1 style="font-family:'Allura',cursive; font-size:220px; font-weight:400; line-height:0.90; color:#E8449A; text-align:center; margin:80px 0 40px;">After the<br>Long Wait</h1>
    <p style="font-family:'Inter',sans-serif; font-size:18px; font-weight:600; letter-spacing:1.2px; text-transform:uppercase; color:#E8449A; text-align:center; max-width:640px; margin:0 auto;">A QUIET STORY ABOUT THE TEAM THAT SHIPPED IT ANYWAY.</p>
  </div>

  <div style="position:absolute; bottom:60px; left:60px; display:flex; gap:16px; align-items:center; z-index:2;">
    <span style="font-family:'Inter',sans-serif; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#E8449A;">⏸ SCENE 03 · 02:47</span>
  </div>
</div>
```

### Stat with script numeral

```html
<div style="text-align:center; padding:40px; background:#3a5f6b;">
  <p style="font-family:'Allura',cursive; font-size:180px; font-weight:400; line-height:0.90; color:#E8449A; margin:0;">47</p>
  <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:3px; text-transform:uppercase; color:#E8449A; margin:8px 0 0;">FASTER RESPONSE</p>
</div>
```

### CTA (pink-on-offwhite inversion)

```html
<a style="display:inline-block; background:#f2e6ec; color:#E8449A; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:3px; text-transform:uppercase; text-decoration:none; padding:14px 32px;">WATCH THE TRAILER</a>
```
