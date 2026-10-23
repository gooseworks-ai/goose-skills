# Human acceptance test

1. Run `bash tests/run-all.sh` to render all six examples into `tests/output/`.
2. Open `build-review.html` (next to the `SKILL.md` in this folder) to view the rendered frames, and keep the `references/*.png` ChatGPT captures alongside for comparison.
3. For each example, compare the generated PNG to a real ChatGPT iOS screen and confirm:
   - **Header** matches the JSON `style`: `model-tag` shows `ChatGPT 5.1 ▾`, `title-only` shows the title + right chevron, `plain-title` shows the upsell title with no chevron. The center cluster does not wrap and the right icons do not overlap it.
   - **Status bar** has the time top-left and the signal / wifi / battery cluster top-right, unclipped; the DND moon appears only when `statusBar.dnd: true`.
   - **User turns** are right-aligned gray bubbles with `28px` corners; image attachments sit right-aligned above the text bubble with the same corner radius.
   - **Assistant turns** are left-aligned plain prose with no bubble; bold/italic, headings, bullet and ordered lists, the `---` rule, the `[[cite:…]]` pill, and the `[[icon:💡]]` prefix all render as styled elements (not literal markup). `feedback: false` hides the thumbs chips.
   - **Empty state** (`04-empty-typing.json`) shows the centered OpenAI spiral hero instead of a conversation.
   - **Composer** matches state: default placeholder pill; solid-black send button + caret when `composer.text` is set; black stop square when `streaming: true`; the GPT chip inside the composer when `composer.chip` is set.
   - **Light mode** throughout — white background, near-black text.
4. If any frame fails, edit the JSON or `templates/chat.css` (or the relevant icon in `templates/icons.js`), re-run `bash tests/run-all.sh`, and re-open `build-review.html`.

The atom passes human acceptance when each frame looks indistinguishable from a real ChatGPT iOS screen at a glance, and the visual checks in `expected-output.md` all hold.
