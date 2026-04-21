# Venn Infographic

HBR-style explainer. Paper off-white background with three translucent Venn-diagram circles (sage, coral, soft-blue at 0.7 opacity) intersecting to show overlapping concepts. Numbered white info cards sit in a grid alongside the Venn, each with an `01`/`02`/`03` label. Inter only; no decoration besides the circles and cards.

> Full prose reference: `styles/_full/venn-infographic.md`

## Palette

| Hex | Role |
|-----|------|
| `#F6F5F2` | Paper — primary background (warm off-white) |
| `#1A1A1A` | Near-black — primary text, headlines, icon strokes |
| `#B8D4A8` | Sage green — Venn circle 1 (at 0.7 opacity) |
| `#E8A89E` | Coral — Venn circle 2 (at 0.7 opacity) |
| `#A8C4D8` | Soft blue — Venn circle 3 (at 0.7 opacity) |
| `#FFFFFF` | Card white — info card backgrounds |
| `#6B6B6B` | Secondary text — subtitles, body |
| `#9A9A9A` | Tertiary text — metadata, small labels |
| `#F0EEE8` | Surface inset — recessed panels |
| `#E8E6E0` | Divider — hairlines |
| `rgba(0,0,0,0.06)` | Card shadow |

## Typography

**Google Fonts**

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- **Display / Body:** `'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`

| Role | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|----------|
| Display Hero | Inter | 44px | 700 | 1.15 | -0.3px |
| Section Heading | Inter | 36px | 700 | 1.20 | -0.3px |
| Sub-heading | Inter | 22px | 700 | 1.25 | -0.2px |
| Body Large | Inter | 18px | 400 | 1.55 | 0 |
| Body | Inter | 16px | 400 | 1.55 | 0 |
| Body Bold | Inter | 16px | 600 | 1.55 | 0 |
| Caption | Inter | 13px | 500 | 1.50 | 0.1px |
| Big Number (Card) | Inter | 20px | 700 | 1.00 | 0 |
| Big Number (Venn) | Inter | 24px | 700 | 1.00 | -0.2px |
| Numbered Label Small | Inter | 13px | 600 | 1.00 | 0.5px UPPER |
| CTA | Inter | 15px | 600 | 1.00 | 0.2px |

**Principles**

- Single family, weight-driven hierarchy (400, 600, 700).
- Restrained headline size (44-36px) — this is an explainer, not a poster.
- Secondary text uses `#6B6B6B`, never black — keeps hierarchy readable.

## Layout

- Full-bleed paper `#F6F5F2`.
- Three Venn circles in sage, coral, and soft blue at 0.7 opacity, overlapping at center. 240-320px diameter, `mix-blend-mode: multiply` optional for richer overlap.
- Each circle labeled with a number (24px Inter 700) at center or just inside.
- Info cards: `#FFFFFF` surface, 12-16px radius, 1px border `#E8E6E0`, soft shadow `0 2px 8px rgba(0,0,0,0.06)`.
- Each card header: `01 / RESEARCH` in Inter tracked uppercase.
- Content grid: Venn on one side (60%), info cards stacked on the other (40%).

## Do / Don't

**Do**

- Use three Venn circles at 0.7 opacity so overlaps create visible blended colors.
- Number each circle and each card (01, 02, 03) — sequence is the communication.
- Use soft-shadow white cards with generous 16-20px padding.
- Use Inter 400 body text at `#6B6B6B` for all card descriptions.
- Left-align content inside cards.

**Don't**

- Don't use opaque Venn circles — the overlap is the point.
- Don't use more than 3 Venn circles — stick to three.
- Don't use serif fonts or display faces.
- Don't use saturated pure colors — the palette is muted.
- Don't over-decorate — this style is intentionally clean and data-forward.

## CSS snippets

### `:root` variables

```css
:root {
  --c-paper: #F6F5F2;
  --c-ink: #1A1A1A;
  --c-sage: #B8D4A8;
  --c-coral: #E8A89E;
  --c-blue: #A8C4D8;
  --c-card: #FFFFFF;
  --c-text-2: #6B6B6B;
  --c-text-3: #9A9A9A;
  --c-divider: #E8E6E0;

  --font: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;

  --radius-card: 16px;
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

### Venn diagram SVG

```html
<svg viewBox="0 0 400 300" width="100%">
  <g style="mix-blend-mode:multiply;">
    <circle cx="140" cy="150" r="100" fill="#B8D4A8" opacity="0.7"/>
    <circle cx="260" cy="150" r="100" fill="#E8A89E" opacity="0.7"/>
    <circle cx="200" cy="220" r="100" fill="#A8C4D8" opacity="0.7"/>
  </g>
  <text x="100" y="120" font-family="Inter" font-size="24" font-weight="700" fill="#1A1A1A">01</text>
  <text x="280" y="120" font-family="Inter" font-size="24" font-weight="700" fill="#1A1A1A">02</text>
  <text x="200" y="260" font-family="Inter" font-size="24" font-weight="700" fill="#1A1A1A" text-anchor="middle">03</text>
</svg>
```

### Explainer card

```html
<div style="background:#FFFFFF; border:1px solid #E8E6E0; border-radius:16px; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#9A9A9A; margin:0 0 8px;">01 / RESEARCH</p>
  <h3 style="font-family:'Inter',sans-serif; font-size:22px; font-weight:700; line-height:1.25; letter-spacing:-0.2px; color:#1A1A1A; margin:0 0 12px;">Find the signal</h3>
  <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:400; line-height:1.55; color:#6B6B6B; margin:0;">Scan hiring pages, funding rounds, and recent tech-stack changes to surface companies in motion.</p>
</div>
```

### Full infographic layout

```html
<div style="background:#F6F5F2; padding:60px; min-height:1080px;">
  <h1 style="font-family:'Inter',sans-serif; font-size:44px; font-weight:700; line-height:1.15; letter-spacing:-0.3px; color:#1A1A1A; margin:0 0 16px; max-width:720px;">Three practices that distinguish the teams shipping weekly from the teams shipping quarterly.</h1>
  <p style="font-family:'Inter',sans-serif; font-size:18px; font-weight:400; line-height:1.55; color:#6B6B6B; margin:0 0 48px; max-width:560px;">A pattern analysis of 120 product teams, 2023 — 2026.</p>

  <div style="display:grid; grid-template-columns:60% 40%; gap:40px;">
    <div>
      <svg viewBox="0 0 400 300" width="100%">
        <g style="mix-blend-mode:multiply;">
          <circle cx="140" cy="150" r="100" fill="#B8D4A8" opacity="0.7"/>
          <circle cx="260" cy="150" r="100" fill="#E8A89E" opacity="0.7"/>
          <circle cx="200" cy="220" r="100" fill="#A8C4D8" opacity="0.7"/>
        </g>
      </svg>
    </div>
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:#fff; border:1px solid #E8E6E0; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#9A9A9A; margin:0 0 4px;">01 · RESEARCH</p>
        <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:400; line-height:1.55; color:#6B6B6B; margin:0;">Weekly customer conversations, logged.</p>
      </div>
      <div style="background:#fff; border:1px solid #E8E6E0; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#9A9A9A; margin:0 0 4px;">02 · DEFAULT</p>
        <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:400; line-height:1.55; color:#6B6B6B; margin:0;">A visible, simple next-step for every meeting.</p>
      </div>
      <div style="background:#fff; border:1px solid #E8E6E0; border-radius:16px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <p style="font-family:'Inter',sans-serif; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#9A9A9A; margin:0 0 4px;">03 · REVIEW</p>
        <p style="font-family:'Inter',sans-serif; font-size:16px; font-weight:400; line-height:1.55; color:#6B6B6B; margin:0;">Retrospective every Friday — what shipped, what stalled.</p>
      </div>
    </div>
  </div>
</div>
```
