# Text Safety Rules

Run this checklist before writing any SVG or HTML visual.

---

## SVG mandatory setup

Every SVG must start with:

```svg
<svg width="100%" viewBox="0 0 680 [H]" role="img">
  <title>[descriptive title]</title>
  <desc>[1-sentence description for screen readers]</desc>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>
  <!-- Explicit background rect — REQUIRED as first element after defs -->
  <rect x="0" y="0" width="680" height="[H]" fill="[ACTIVE BG]"/>
  ...
</svg>
```

**ViewBox height [H]** = bottom edge of lowest element + 40px. Never guess — compute it.

---

## T1 — Box sizing

Box width ≥ (longest_label_chars × 8.5) + 32px

| Lines | Height |
|---|---|
| 1 line | 44–48px |
| 2 lines | 58–62px |
| 3 lines | 74–78px |

---

## T2 — Padding

- 16px horizontal padding inside every box
- 10px vertical padding inside every box

---

## T3 — Text vertical placement

Every `<text>` inside a box:
- `dominant-baseline="central"` required
- `y` = centre of the slot it sits in (not the full box if multi-line)
- Formula: `y = rect_y + slot_top + slot_height / 2`

---

## T4 — Font sizes

- Minimum 13px inside enclosed shapes
- Node/box titles: 13–14px, weight 600
- Subtitles / descriptions inside boxes: 11–12px
- Arrow labels: 11px (avoid where possible)
- Visual titles above diagram: 16–18px, weight 600
- Section label chips: 11px, weight 600, uppercase

---

## T5 — Contrast (light mode)

| Box fill | Text color | Weight |
|---|---|---|
| ACCENT1 full (#4F63D2) | #FFFFFF | 600 |
| ACCENT2 full (#0D9488) | #FFFFFF | 600 |
| ACCENT3 full (#D97706) | #FFFFFF | 600 |
| SUCCESS full (#059669) | #FFFFFF | 600 |
| NEUTRAL full (#475569) | #FFFFFF | 600 |
| ACCENT1 tint (#EEF2FF) | #3730A3 | 600 |
| ACCENT2 tint (#F0FDFA) | #0F766E | 600 |
| ACCENT3 tint (#FEF3C7) | #92400E | 600 |
| White (#FFFFFF) | #0F172A | 400–600 |
| Surface (#F8FAFC) | #0F172A | 400–600 |

For dark mode, flip: use the 100-stop text on 800-stop fills.

---

## T6 — HTML visual rules

Every HTML visual root element must have:
```css
background: [ACTIVE BG];
font-family: Inter, -apple-system, sans-serif;
padding: 28px 24px;
box-sizing: border-box;
```

- All text colors explicitly set with hex — never rely on inherited color
- Value labels above/outside bars — never clipped inside bar fill
- Stat numbers: font-size 28–36px, font-weight 700, color ACCENT1
- Stat labels: font-size 11–12px, font-weight 500, color MUTED
- Cards: background #FFFFFF, border 1px solid #E2E8F0, border-radius 10px, padding 20px 24px
- Grid: display grid, gap 14–16px — never use absolute positioning for grid items

---

## Pre-generation checklist

```
□ Explicit background rect as first SVG element?
□ Every box width calculated from label character count?
□ 16px horizontal padding + 10px vertical padding inside every box?
□ All text y-coordinates verified against box boundaries?
□ All primary node labels font-weight 600?
□ Text color on each fill checked against T5 table?
□ No arrows crossing through unrelated boxes (L-bend routing used)?
□ viewBox height = lowest element bottom + 40px?
□ All connector <path> elements have fill="none"?
□ Max 10 nodes per SVG?
□ role="img" with <title> and <desc> on root <svg>?
```

---

## Common failures to avoid

- **Arrow through box**: if direct path crosses another node, route with L-bend
- **Text overflow**: box width not sized from label length — always compute width first
- **Text clipping**: y-coordinate outside box bounds — compute from box centre
- **Invisible connectors**: `<path>` without `fill="none"` renders as black fill
- **Dark text on dark fill**: always check T5 table before placing text on a colored rect
- **viewBox too small**: content clipped because height not recomputed after layout
- **Text on arrows**: arrow labels float and collide — prefer box subtitles or prose
