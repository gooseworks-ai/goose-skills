# Sample input

This atom takes a plain options object passed to `renderKeyboardHTML(opts)` (or the equivalent `--suggestions` / `--layout` flags on `render.js`). There is no JSON schema and no `examples/` folder — the inputs are the two fields `generate.js` reads: `suggestions` and `layout`.

The canonical "someone is typing a reply" state used to track parity with the messaging molecules (create-chatgpt-mockup / create-imessage-mockup):

```js
renderKeyboardHTML({
  suggestions: ['"He"', 'Hey', 'Heating'],   // up to 3 pills; HTML-escaped
  layout: 'qwerty-lower',                     // lowercase QWERTY with shift glyph
});
```

Equivalent CLI:

```bash
node render.js --out /tmp/kb.html --suggestions '"He",Hey,Heating' --layout qwerty-lower
```

The keyboard states the code actually supports (the keys of `ROWS` in `generate.js`):

| `layout` | Covers | Switch / modifier keys |
|---|---|---|
| `qwerty-lower` (default) | Lowercase QWERTY — the resting/typing state | shift glyph + backspace; `123` switch |
| `qwerty-upper` | Uppercase QWERTY — shift/caps engaged | shift glyph + backspace; `123` switch |
| `numbers` | Digits row + symbol row (`- / : ; ( ) $ & @ "`, `. , ? ! '`) | `#+=` modifier + backspace; `ABC` switch |

`suggestions` field:

| Input | Result |
|---|---|
| omitted | Defaults to `['I', 'The', "I'm"]` |
| `['And', 'For', 'On']` | Three pills with vertical dividers between them |
| `['"He"', 'Hey', 'Heating']` | First pill renders the literal quoted text `"He"` (escaped to `&quot;He&quot;`) |
| `['<b>', 'a&b']` | Escaped to `&lt;b&gt;` and `a&amp;b` — never raw markup |
