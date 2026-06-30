---
name: render-ios-keyboard
description: Render a static iOS QWERTY keyboard as inline HTML+CSS sized for the 750-wide 9:16 stage. Includes the 3-suggestion bar, alpha keys, shift/backspace, 123/emoji/space/return row, and the bottom globe+mic strip. No animation logic — slide up/down is the molecule's job (CSS transform on the .keyboard root).
---

# render-ios-keyboard

## Purpose

Provide a drop-in iOS QWERTY keyboard fragment that pairs with messaging atoms (create-chatgpt-mockup, create-imessage-mockup) when a video needs to show someone typing. Static only: the keyboard sits at the bottom of the screen, the molecule's recorder slides it up/down with `transform: translateY(...)`.

## Inputs

```js
const { renderKeyboardHTML, renderKeyboardCSS } = require('./generate');
const html = renderKeyboardHTML({
  suggestions: ['"He"', 'Hey', 'Heating'],   // optional, default ['I', 'The', "I'm"]
  layout: 'qwerty-lower',                    // 'qwerty-lower' | 'qwerty-upper' | 'numbers'
});
```

The atom returns an HTML fragment (one `<div class="ios-keyboard">…</div>`) plus the matching CSS. The CSS uses scoped class names so it won't collide with the rest of the page.

## Workflow

1. **Require the module.** `const { renderKeyboardHTML, renderKeyboardCSS } = require('./generate');` — no build step, no dependencies beyond Node's `fs`/`path`.
2. **Pick a layout.** `renderKeyboardHTML` reads `opts.layout` and looks it up in `ROWS`: `qwerty-lower` (default), `qwerty-upper`, or `numbers`. An unknown layout silently falls back to `qwerty-lower`. The molecule decides which state to show; this atom never switches on its own.
3. **Pass suggestions.** `opts.suggestions` is an array of up to three strings rendered into the suggestion bar; each value is run through `escapeHTML` so quotes/angle brackets are safe. Omit it to get the default `['I', 'The', "I'm"]`.
4. **Receive the fragment.** The function returns a single root `<div class="ios-keyboard" data-layout="…">` containing, in order: the `.kb-suggestions` bar, three letter rows (`row-1` 10 keys, `row-2` 9 keys padded with two 18px spacers, `row-3` = shift/`#+=` modifier + 7 keys + backspace), the `row-bottom` (`123`/`ABC` switch, emoji, wide `space`, return), and the `.kb-system-row` globe + mic strip.
5. **Inject the CSS once.** Call `renderKeyboardCSS()` (which reads `templates/keyboard.css` from disk) and place it in a `<style>` block on the page. The molecule mounts the fragment at the bottom of the stage next to `.composer-wrap`.
6. **Animate externally.** The atom emits no JS and never sets a `transform`. The owning molecule slides the keyboard in/out via `transform: translateY(...)` on the `.ios-keyboard` root (the CSS sets `will-change: transform` for this).
7. **(Optional) Preview standalone.** `render.js` wraps the fragment + CSS in a 750×1334 white `.stage` HTML page and writes it to `--out` for eyeballing padding/colors.

## CLI (for local visual testing)

```bash
node render.js --out /tmp/kb.html --suggestions 'I,The,I'\''m'
```

Produces a standalone HTML page with just the keyboard, useful for tweaking padding/colors.

## Output

| Output | Shape |
|---|---|
| `renderKeyboardHTML(opts)` | HTML string (one root `<div class="ios-keyboard">`) |
| `renderKeyboardCSS()` | CSS string (scoped to `.ios-keyboard *`) |

The molecule injects these into the chatgpt-mockup page next to `.composer-wrap`.

## Files

| File | Purpose |
|---|---|
| `generate.js` | Returns `{renderKeyboardHTML, renderKeyboardCSS}` |
| `render.js` | Standalone CLI for visual review |
| `templates/keyboard.css` | All keyboard styling |

## Quality checks

- [ ] Keyboard fits in **518px** vertical space on the 750-wide stage (matches iOS QWERTY on a Pro-class iPhone)
- [ ] Three suggestion pills are visible above the keys with vertical dividers between them
- [ ] Shift, backspace are sized correctly (~10% wider than letter keys)
- [ ] Space bar reads as a single wide white pill
- [ ] Globe and mic at the very bottom edge of the keyboard, in the system tray strip
- [ ] No JS — pure HTML/CSS so the recorder can slide it without re-render

## Known limitations

- **No key-pop animation.** When a key is pressed in the real keyboard, the letter renders larger above the row briefly. v1 skips this.
- **Lowercase QWERTY default.** Uppercase/numbers variants supported via `layout` but are visual-only — the molecule decides which to show.
- **No emoji panel.** The emoji button is rendered but doesn't expand.

## Quality Checks

- `renderKeyboardHTML()` returns a single root element starting with `<div class="ios-keyboard"` and carrying the matching `data-layout` attribute (`qwerty-lower` | `qwerty-upper` | `numbers`).
- The fragment contains exactly one `.kb-suggestions` bar, three letter rows (`.row-1`, `.row-2`, `.row-3`), one `.row-bottom`, and one `.kb-system-row` — in that DOM order.
- Suggestion count and text match the `suggestions` array (default `['I', 'The', "I'm"]`); the bar renders one `.kb-suggestion` span per entry with vertical dividers between adjacent pills.
- `qwerty-lower` renders lowercase letters and a shift glyph; `qwerty-upper` renders uppercase letters; `numbers` renders the digit/symbol rows with the `#+=` modifier and an `ABC` switch key instead of `123`.
- User-supplied strings are HTML-escaped — passing `'<b>'` or `'"He"'` yields `&lt;b&gt;` / `&quot;He&quot;`, never raw markup.
- `renderKeyboardCSS()` returns the full contents of `templates/keyboard.css`, scoped under `.ios-keyboard`, and the fragment carries no inline `style` except the two 18px `row-2` spacer divs.
- Rendered at 750px stage width, the keyboard occupies roughly **518px** of vertical space; shift/backspace/`123`/emoji/return modifier keys are visibly wider than letter keys; `space` is one wide white pill; the globe sits bottom-left and mic bottom-right in the system strip.
- The output is pure HTML/CSS — no `<script>` and no JS event handlers — so a recorder can slide it with a CSS transform without re-rendering.

## Failure Modes

- **Unknown `layout` value** → `ROWS[layout]` is `undefined`, so the renderer silently falls back to `qwerty-lower`. Symptom: you asked for uppercase or numbers and got lowercase letters. Fix: pass exactly `'qwerty-lower'`, `'qwerty-upper'`, or `'numbers'`.
- **More than three suggestions** → every entry still renders as a `.kb-suggestion` (they `flex: 1 1 0`), so a long array squashes the pills and breaks the iOS-accurate 3-up layout. Keep `suggestions` to three or fewer; long strings are clipped with `text-overflow: ellipsis`.
- **CSS not injected** → calling `renderKeyboardHTML()` without also emitting `renderKeyboardCSS()` produces an unstyled stack of divs (no rounded keys, no gray tray). Always include both on the page.
- **`templates/keyboard.css` missing or unreadable** → `renderKeyboardCSS()` calls `fs.readFileSync` and will throw `ENOENT`. Run from a checkout where `templates/keyboard.css` sits next to `generate.js`.
- **`render.js` run without `--out`** → the CLI prints the usage line and exits with code `1`; nothing is written. Always pass `--out <path>`.
- **Expecting animation or interactivity** → there is none. No key-pop, no emoji panel, no caps-lock toggle. The molecule owns slide-up/down and which layout to show; this atom is static by design.
