# end-card

## 1.1.2

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 1.1.1.

## 1.1.1

- The logo is fitted to the card in every layout that draws it: a flat white, grey or black background the file carries is made transparent (edge-connected only, never the mark), empty margins are trimmed, and the mark is scaled up or down into the layout's box by its shape (classic: a wide mark min(640 px, 0.58 W) wide, any other min(320 px, 0.17 H) tall). 1.1.0 drew a small logo at its file size, so a 130 px wordmark showed 130 px wide.
- A logo that still reads under 3:1 changes the whole card's colour (the logo's own background, else the brand colour with the most contrast, else #111111 or #F5F3EE), its text, accent and CTA colours following. The 1.1.0 plate is gone: a white-backed JPEG logo no longer sits in a box.
- The timeline gets `safe_zones` use `logo` with the box the logo file covers, so the final check looks for it there. The box is declared only when the whole file (its trimmed margins too) sits on the card and the card's other text barely touches it; a file with wider margins declares none (logged), and the final check searches the whole frame for it.
- Background the file left inside the mark (the counters of o, e, a) is cleared too when the card ends up another colour, so no white shows inside the letters; a large enclosed patch, or any in a solid mark (a badge, white letters on a coloured box), is the mark's own and kept.
- An SVG logo is drawn from its vector, so it stays sharp at any size.

## 1.1.0

- `layout`: `classic` (the 1.0.1 card, default), `brandkit`, `editorial`, `stack`, `statement` and `none`.
  `none` returns no outputs, so a style can offer "no card" as an answer.
- `cta_text` is optional for `editorial` and `statement`; `rows` (up to 3, a list or a `' | '`-joined answer)
  and `accent` are new. Copy a layout cannot draw is refused instead of dropped.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version: the data-driven end card from render-imessage-chat, with the logo kept as-is.
