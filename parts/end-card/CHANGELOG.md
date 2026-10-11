# end-card

## 1.1.0

- `layout`: `classic` (the 1.0.1 card, default), `brandkit`, `editorial`, `stack`, `statement` and `none`.
  `none` returns no outputs, so a style can offer "no card" as an answer.
- `cta_text` is optional for `editorial` and `statement`; `rows` (up to 3, a list or a `' | '`-joined answer)
  and `accent` are new. Copy a layout cannot draw is refused instead of dropped.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version: the data-driven end card from render-imessage-chat, with the logo kept as-is.
