# Expected output

This atom emits an **HTML fragment + CSS string**, not a PNG. `render.js` wraps them into a standalone page for review. There is no `screenshot.png` / `spec.json` manifest — the contract is the DOM structure and the rendered visual.

## Structural output (`renderKeyboardHTML(opts)`)

A single root element, in this exact child order:

```html
<div class="ios-keyboard" data-layout="qwerty-lower">
  <div class="kb-suggestions">…3× <span class="kb-suggestion">…</div>
  <div class="kb-row row-1">…10 keys…</div>
  <div class="kb-row row-2"><div style="flex:0 0 18px"></div>…9 keys…<div style="flex:0 0 18px"></div></div>
  <div class="kb-row row-3"><div class="kb-key modifier">…shift…</div>…7 keys…<div class="kb-key modifier">…backspace…</div></div>
  <div class="kb-row row-bottom">
    <div class="kb-key special-123">123</div>
    <div class="kb-key special-emoji">…</div>
    <div class="kb-key special-space">space</div>
    <div class="kb-key special-return">…</div>
  </div>
  <div class="kb-system-row">…globe…  …mic…</div>
</div>
```

- `data-layout` echoes the requested layout.
- `qwerty-lower` / `qwerty-upper`: shift glyph SVG in the row-3 modifier and `123` in the switch key.
- `numbers`: the modifier reads `#+=` and the switch key reads `ABC`; rows render digits and symbols.
- One `.kb-suggestion` per `suggestions` entry; default produces `I`, `The`, `I'm`.
- `renderKeyboardCSS()` returns the full `templates/keyboard.css` verbatim, every rule scoped under `.ios-keyboard`.

## Page output (`render.js --out`)

`render.js` writes a `<!DOCTYPE html>` page whose `.stage` is `width: 750px`, `min-height: 1334px`, white, with `justify-content: flex-end` so the keyboard sits flush at the bottom. It prints `Wrote <path>`.

## Visual identity checks (eyeball the rendered page)

| Layout | What should match |
|---|---|
| `qwerty-lower` | Lowercase `q…p / a…l / z…m`; gray shift glyph + backspace flanking row 3; suggestion pills with thin vertical dividers |
| `qwerty-upper` | Same geometry, uppercase `Q…P / A…L / Z…M` |
| `numbers` | `1…0` top row, `- / : ; ( ) $ & @ "` middle, `. , ? ! '` bottom; `#+=` modifier; `ABC` switch key |

Pixel/style details to confirm:

- Keyboard tray is the iOS gray `#D1D3D9`; letter keys are white `#FFFFFF` with an `8px` radius and a 1px bottom drop line.
- Shift / backspace / `123` / emoji / return keys are the darker gray `#ADB2BC` and visibly wider than letter keys (`flex: 0 0 84px` / `0 0 92px`).
- `space` is one wide white pill with a faint `A` watermark at its right edge.
- Row 2 is indented on both sides (the two 18px spacer divs) so the 9 keys sit centered under row 1's 10.
- The `.kb-system-row` shows the globe at the left edge and the mic at the right edge, full-width with `space-between`.
- The whole keyboard occupies roughly **518px** of vertical height on the 750px stage (iOS QWERTY on a Pro-class iPhone).
- No `<script>` tags anywhere in the fragment or page.
