# Ink Doodle Event

Skate-zine event flyer. Kraft paper wheat canvas, loose hand-drawn ink character or illustration at center, a massive single-word Yellowtail calligraphic headline that sings, and italic Fraunces words flanking the illustration. Top corners hold DM Mono metadata. Everything in black ink on warm wheat paper.

> Full prose reference: `styles/_full/ink-doodle-event.md`

## Palette

| Hex | Role |
|-----|------|
| `#EAD9AE` | Wheat paper — primary background, edge-to-edge |
| `#0E0E0E` | Ink black — all type, illustration strokes, halftone dots |
| `#F0E1BA` | Wheat highlight — rare paper-grain highlight |
| `#DCCA9C` | Wheat shadow — rare paper-edge vignette |
| `rgba(14,14,14,0.80)` | Ink 80 — rare secondary |
| `rgba(14,14,14,0.60)` | Ink 60 — rare tertiary |
| `rgba(14,14,14,0.40)` | Ink 40 — whisper accents |
| `rgba(14,14,14,0.20)` | Ink 20 — halftone zones |
| `rgba(14,14,14,0.35)` | Hairline ink |
| `rgba(14,14,14,0.06)` | Paper grain texture overlay |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Yellowtail&family=Fraunces:ital,wght@0,400;0,500;1,400;1,500&family=DM+Mono:wght@400&display=swap" rel="stylesheet">
```

- **Script:** `'Yellowtail', 'Lucida Handwriting', cursive`
- **Body Italic / Serif:** `'Fraunces', Georgia, 'Times New Roman', serif`
- **Monospace:** `'DM Mono', 'Courier New', Courier, monospace`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Script Hero | Yellowtail | 160px | 400 | 0.95 | -2px |
| Script Secondary | Yellowtail | 96px | 400 | 1.00 | -1px |
| Flanking Italic | Fraunces Italic | 24px | 400 | 1.20 | 0.2px |
| Body Italic | Fraunces Italic | 20px | 400 | 1.50 | 0.2px |
| Body Roman | Fraunces | 18px | 400 | 1.55 | 0.2px |
| Top Metadata | DM Mono | 22px | 400 | 1.20 | 0.5px |
| Address Footer | Fraunces | 20px | 400 | 1.40 | 0.2px |
| Small Caption | DM Mono | 14px | 400 | 1.30 | 0.5px |
| Framework Tag | Fraunces Italic | 16px | 500 | 1.20 | 0.5px |

**Principles**

- Yellowtail for the ONE calligraphic word; Fraunces italic for the flanking secondary words.
- DM Mono exclusively for metadata corners (time, date, slide numbers).
- Script requires extra vertical padding (40px top, 60px bottom) for ascenders and descenders.

## Layout

- Wheat paper background edge-to-edge; optional subtle paper-grain overlay.
- Central hand-drawn illustration (cocktail glass, skater, sun, etc.) in black ink, 2-3px stroke weight.
- Script word positioned ABOVE the illustration, angled slightly.
- Two italic Fraunces "flanking words" LEFT + RIGHT of illustration, mixed case.
- DM Mono metadata in top-left and top-right corners (date + time).
- Two-line Fraunces address footer at the very bottom.
- Halftone dot zones for decorative shading.

## Do / Don't

**Do**

- Use one Yellowtail script word as the hero — it's the whole mood.
- Hand-draw the central illustration with consistent 2-3px ink strokes — no flat vectors.
- Add italic Fraunces flanking words for "club" / "skate" / "after hours" callouts.
- Use DM Mono 0.5px tracked for corner metadata.
- Include halftone dot zones (scattered `rgba(14,14,14,0.2)` dots) for tonal variation.

**Don't**

- Don't use Yellowtail for more than one word per composition.
- Don't uppercase flanking italic words — mixed case only.
- Don't add color — ink black on wheat paper is the identity.
- Don't smooth the illustration — keep it loose and hand-drawn.
- Don't use sans-serif for body — Fraunces or DM Mono only.

## CSS snippets

### `:root` variables

```css
:root {
  --c-wheat: #EAD9AE;
  --c-ink: #0E0E0E;
  --c-wheat-hi: #F0E1BA;
  --c-wheat-shadow: #DCCA9C;
  --c-ink-60: rgba(14, 14, 14, 0.60);
  --c-ink-20: rgba(14, 14, 14, 0.20);

  --font-script: 'Yellowtail', 'Lucida Handwriting', cursive;
  --font-body: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-mono: 'DM Mono', 'Courier New', Courier, monospace;
}
```

### Paper-grain texture

```css
.paper {
  background-color: #EAD9AE;
  background-image:
    radial-gradient(circle, rgba(14,14,14,0.06) 1px, transparent 1px),
    radial-gradient(circle, rgba(14,14,14,0.04) 1px, transparent 1px);
  background-size: 4px 4px, 7px 7px;
  background-position: 0 0, 2px 3px;
}
```

### Event flyer hero

```html
<div style="background:#EAD9AE; padding:60px; min-height:960px; position:relative;">
  <div style="display:flex; justify-content:space-between;">
    <p style="font-family:'DM Mono',monospace; font-size:22px; font-weight:400; letter-spacing:0.5px; color:#0E0E0E; margin:0;">Sun 10/20</p>
    <p style="font-family:'DM Mono',monospace; font-size:22px; font-weight:400; letter-spacing:0.5px; color:#0E0E0E; margin:0;">8:00 PM — late</p>
  </div>

  <div style="text-align:center; margin-top:80px; padding-top:40px; padding-bottom:60px;">
    <h1 style="font-family:'Yellowtail',cursive; font-size:160px; font-weight:400; line-height:0.95; letter-spacing:-2px; color:#0E0E0E; margin:0; transform:rotate(-2deg);">Sunday</h1>
  </div>

  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:40px;">
    <p style="font-family:'Fraunces',serif; font-style:italic; font-size:24px; font-weight:400; letter-spacing:0.2px; color:#0E0E0E; margin:0;">skate</p>
    <svg width="200" height="200" viewBox="0 0 200 200">
      <path d="M60 140 Q100 40 140 140 Q120 160 100 160 Q80 160 60 140 Z" stroke="#0E0E0E" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="100" cy="90" r="4" fill="#0E0E0E"/>
    </svg>
    <p style="font-family:'Fraunces',serif; font-style:italic; font-size:24px; font-weight:400; letter-spacing:0.2px; color:#0E0E0E; margin:0;">club</p>
  </div>

  <div style="text-align:center; margin-top:80px;">
    <p style="font-family:'Fraunces',serif; font-size:20px; font-weight:400; line-height:1.40; letter-spacing:0.2px; color:#0E0E0E; margin:0;">The Old Warehouse · 108 Ruin Street<br>Free entry before 9 · $8 after</p>
  </div>
</div>
```

### Halftone dot zone

```css
.halftone {
  background-image: radial-gradient(circle, rgba(14,14,14,0.2) 1.5px, transparent 1.5px);
  background-size: 8px 8px;
}
```
