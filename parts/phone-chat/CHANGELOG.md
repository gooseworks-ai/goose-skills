# phone-chat

## 1.2.0

- The end card step's logo box comes through: with `ending_timeline` (the card step's timeline) the logo box it declared is placed on the chat's timeline as the card is joined, so the final check looks for the logo where the card draws it.
- A scene's picture text is a photo only when it names a chosen product (its id or name, or two of its name's words, short names included) or asks for a photo and points at nothing else ("Show its photo") with one chosen product; any other text describes the shot and draws nothing (it put a photo on every message before).
- iMessage: a chat that opens on the owner typing starts typing at once and sends the first message by 1.2 s (`first_send_by`, ahead of `min_type`), so the opening is never still for the final check's 1.5 s.
- `min_seconds`: a chat shorter than it holds its last screen until it is that long, so a plan the slower 1.1 opening made long enough for its style still is.
- The notification cascade's pop is heard over a music bed: it is driven into a -7 dBFS limit, which turns the click (its peak 16 dB over its first quarter second) into a dense pop that survives the sound layer, and the swoosh peaks near -8 dBFS. The picture and the other skins are unchanged.

## 1.1.5

- ChatGPT's sounds are heard over a music bed: keys and the finish now peak near -20 dBFS (they sat near -50), and the send near -7 dBFS. A new sound plays when the answer appears, so every message comes with a sound and the bed's ducking under the chat's sounds triggers. Stream ticks peak near -32 dBFS, under the duck threshold, so the bed does not pump while the answer streams.

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
