# phone-chat

## 1.1.5

- ChatGPT's sounds are heard over a music bed: keys, stream ticks and the finish now peak near -20 dBFS (they sat near -50), and the send near -7 dBFS. A new sound plays when the answer appears, so every message comes with a sound and the bed's ducking under the chat's sounds triggers.

## 1.1.4

- Inter's SIL Open Font License now ships beside it (`assets/fonts/InterVariable-OFL.txt`). Same code as 1.1.3.

## 1.1.3

- A crossfade asked for under one frame is a straight cut instead of rounding up to a frame.

## 1.1.2

- Emoji draw by default with the bundled Noto Color Emoji 2.047 (SIL Open Font License); `fonts.emoji` still overrides it.

## 1.1.1

- Crossfades in whole frames (under one frame is a straight cut, so the end card is never dropped); a typing rate of zero and any endless chat are refused; scenes start at their first reveal; the Notes emoji key is drawn as an SVG.

## 1.1.0

- `measure_only`: the chat's length and its message, word and photo counts from the render's own code, with nothing drawn.

## 1.0.0

- First version: iMessage, ChatGPT, Apple Notes and notification-cascade skins drawn from the plan's scenes, with their sounds and the end card.
