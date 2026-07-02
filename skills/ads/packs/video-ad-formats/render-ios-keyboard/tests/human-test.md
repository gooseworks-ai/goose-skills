# Human acceptance test

1. From the atom folder, render all three keyboard states:

   ```bash
   cd render-ios-keyboard
   node render.js --out /tmp/kb-lower.html   --layout qwerty-lower --suggestions '"He",Hey,Heating'
   node render.js --out /tmp/kb-upper.html   --layout qwerty-upper
   node render.js --out /tmp/kb-numbers.html --layout numbers
   ```

2. Open each `/tmp/kb-*.html` and compare it side by side with a real iOS keyboard screenshot (or the messaging molecule's reference frame).
3. Confirm, for every state:
   - The keyboard is pinned flush to the bottom of the 750px white stage with no gap.
   - Letter casing matches the layout: lowercase for `qwerty-lower`, uppercase for `qwerty-upper`, digits/symbols for `numbers`.
   - The three suggestion pills sit above the keys with thin vertical dividers; `kb-lower.html` shows `"He" / Hey / Heating` (the quotes render literally, not as raw HTML).
   - Shift / backspace / `123` (or `#+=` / `ABC`) / emoji / return keys are the darker gray and noticeably wider than the white letter keys.
   - The `space` bar is one wide white pill; the globe sits bottom-left and the mic bottom-right in the system strip.
   - Row 2 is centered under row 1 (indented both sides); key radii, gray tray color, and drop-line shadow read as iOS.
4. If any state looks wrong, edit `templates/keyboard.css` (layout/sizing) or `generate.js` (row contents / key labels), re-run the commands above, and re-open the pages.

The atom passes human acceptance when all three rendered keyboards look indistinguishable from the real iOS keyboard at a glance, and the fragment can be slid up/down by an external `transform: translateY(...)` without re-rendering.
