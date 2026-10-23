# phone-chat

## 1.3.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Nothing else changed from 1.3.0.

## 1.3.0

- The notification cascade fits the plan instead of refusing it. Each banner is as tall as its own body (up to four lines, iOS's limit), not the tallest one's; when the pile would reach the top band, the oldest banners fold into an iOS-style stack behind the newer ones as the next arrives (up to two slivers peek above, the pill rides above them), so 3 to 5 notifications of up to two lines and a success message always fit. Five two-line notifications were refused before. Every message still arrives open at the bottom with its pop.
- A word wider than a cascade banner breaks between its characters, and a sender or brand name too long for its line is cut with an ellipsis, as iOS does; both were refused before. Emoji, keycaps (1️⃣) and flags are measured at the emoji font's width, so a body of them wraps where it is drawn. A cascade is refused only when even the folded stack cannot fit, or a body needs more than four lines, and the message says what to shorten and by how much.
- ChatGPT: a question longer than the composer shows scrolls inside it as it is typed (it was refused), and a word too long for the composer breaks onto the next line instead of running past its edge.
- `measure_only` returns `warnings` when a skin fitted something, in plain words naming the scene.

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
