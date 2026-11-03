# Human acceptance test

1. Run `bash tests/run-all.sh` to render every example into `tests/output/`.
2. Open each `tests/output/<date>-<slug>/screenshot.png` next to a real iPhone Apple Notes screenshot (light mode) in the same state.
3. Confirm:
   - Title weight, size, and color match.
   - Body text wrap point matches (the line break should happen at the same word).
   - Yellow cursor sits in the same position relative to the text.
   - Autocorrect underlines match (same words flagged, no extras).
   - Battery / status bar / toolbar pills layout is the same.
   - Keyboard chrome (when present) has the same QWERTY casing and suggestion text.
4. If any frame fails, edit `templates/note.css` and re-run `bash tests/run-all.sh`.

The skill passes human acceptance when every frame looks indistinguishable from the real screen at a glance.
