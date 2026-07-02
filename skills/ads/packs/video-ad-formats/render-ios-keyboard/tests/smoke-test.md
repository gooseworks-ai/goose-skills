# Smoke test

This atom has no `examples/` and no `run-all.sh` — it exports two functions and ships a thin CLI. The smoke test drives `render.js` (which calls `generate.js`) for each keyboard state and confirms an HTML page is written without errors.

```bash
cd render-ios-keyboard

# Default lowercase QWERTY (suggestions default to I / The / I'm)
node render.js --out /tmp/kb-lower.html

# Custom suggestions, lowercase
node render.js --out /tmp/kb-suggestions.html --suggestions 'I,The,I'\''m'

# Uppercase (shift engaged) layout
node render.js --out /tmp/kb-upper.html --layout qwerty-upper

# Numbers / symbols layout (123 -> ABC switch, #+= modifier)
node render.js --out /tmp/kb-numbers.html --layout numbers
```

Each command should print `Wrote /tmp/kb-<name>.html` and exit `0`.

You can also smoke the library directly without the CLI:

```bash
node -e "const {renderKeyboardHTML, renderKeyboardCSS} = require('./generate'); \
  const h = renderKeyboardHTML({suggestions:['\"He\"','Hey','Heating'], layout:'qwerty-upper'}); \
  if (!h.startsWith('<div class=\"ios-keyboard\"')) { console.error('bad root'); process.exit(1); } \
  if (renderKeyboardCSS().length < 100) { console.error('empty css'); process.exit(1); } \
  console.log('ok', h.length, renderKeyboardCSS().length);"
```

Pass criteria:

- Each `render.js` invocation writes its `/tmp/kb-*.html` file and the process exits `0` (`echo $?` returns `0`).
- Opening any `/tmp/kb-*.html` in a browser shows a complete iOS keyboard pinned to the bottom of a 750px-wide white stage — three suggestion pills, three letter rows, the `123`/emoji/`space`/return row, and the globe + mic system strip.
- `kb-upper.html` shows uppercase letters; `kb-numbers.html` shows the digit/symbol rows with an `ABC` switch key and `#+=` modifier; `kb-lower.html` shows lowercase letters with the shift glyph.
- The direct `node -e` check prints `ok <htmlLen> <cssLen>` with both lengths non-trivial (HTML ~3000 chars, CSS ~2800 chars) and exits `0`.
- No exceptions thrown (no `ENOENT` for `templates/keyboard.css`, no usage error from a missing `--out`).
