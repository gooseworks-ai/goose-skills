# Human acceptance test

1. Run `bash tests/run-all.sh` to render all six examples into `tests/output/`.
2. Open each `tests/output/<case>/<date>-<slug>/screenshot.png` and compare it to a real iMessage screenshot from an iPhone.
3. Confirm for every case:
   - **Bubble color and side** — sent (self) bubbles are blue and hug the right edge; received bubbles are gray and hug the left edge.
   - **Tails** — exactly one curved tear-drop tail per consecutive sender run, on the *last* bubble of that run. No tail on the middle or first bubbles, and never a chunky rectangle with one rounded corner.
   - **Delivered / Read** — the "Delivered" (or "Read") caption sits under the final sent bubble of a run and nowhere else.
4. For the group cases (`group-with-frame`, `group-minimal`) additionally confirm:
   - The sender's name appears once, above the first bubble of each received run.
   - Each received run shows a colored avatar circle beside its last bubble, painted on top of the bubble's tail (no clipping).
   - The group header shows the title and up to four avatar tiles.
5. For the framed cases (`dm-with-frame`, `group-with-frame`) additionally confirm:
   - The Dynamic Island is centered at the top of the screen.
   - The status bar reads `9:41` with signal, wifi, and battery icons.
   - The phone sits on the soft gradient backdrop, and the PNG is `1575×2940`.
6. For `dm-with-typing` confirm the three-dot typing bubble renders, the 😎 emoji message is enlarged, and the keyboard's left icon is the camera (not the plus).
7. If any case fails, edit `templates/chat.css` (or the relevant render logic in `generate.js`) and re-run `bash tests/run-all.sh`, then re-open the PNGs.

The skill passes human acceptance when all six PNGs look indistinguishable from real iOS captures at a glance.
