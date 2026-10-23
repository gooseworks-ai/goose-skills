# Human acceptance test

1. Open `apple-notes-skill-build.html` (next to the `SKILL.md` in this folder).
2. For each row, compare the **reference** frame on the left to the **generated** PNG on the right.
3. Confirm:
   - Title weight, size, and color match.
   - Body text wrap point matches (the line break should happen at the same word).
   - Yellow cursor sits in the same position relative to the text.
   - Autocorrect underlines match (same words flagged, no extras).
   - Battery / status bar / toolbar pills layout is the same.
   - Keyboard chrome (when present) has the same QWERTY casing and suggestion text.
4. If any row fails, edit `templates/note.css` and re-run `bash tests/run-all.sh`, then re-open the review HTML.

The skill passes human acceptance when all rows look indistinguishable from the reference at a glance.
