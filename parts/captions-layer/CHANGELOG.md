# captions-layer

## 1.5.0

- Declares `timeline.assembly_timeline` (input and output) and passes it through unchanged. Captions, transcription requests and looks are as in 1.4.0. A minor version: it reaches new quotes through layers.json.

## 1.4.0

- Captions keep clear of the product: boxes from `timeline.keep_clear` (pixels, per time span; the input timeline now takes it) and the look's `keep_clear` (shares of the frame, for the whole cut). Each scene's captions take one height, the look's `y`, else 0.80, else 0.30, the first that clears every box shown with them by 0.02 of the height, else the least overlap with a warning. `words.json` records each cue's `y` and `overlap` and the boxes kept clear. `keep_clear` is dropped from the output timeline. Without boxes the output is 1.3.1's, byte for byte.

## 1.3.1

- Captions held across final cuts stop at the next scene start when the style flags `captions_cross_cuts`; boundary punctuation stays with its word.

## 1.3.0

- Three new caption looks: `pill` (about 3 lower-case words on a cream rounded pill, said words dark and upcoming words grey, the brand name keeps its case), `serif-word` (one word at a time in a heavy serif with a black outline; a brand name is never split, and a highlighted one is quoted) and `sentence` (one sentence per caption across lines, each word appearing as it is said and staying, bottom-anchored and growing upward).
- The `serif` (PT Serif Bold) and `rounded` (Titan One) fonts are bundled, each with its SIL Open Font License text. `plate`, `stroke` and `karaoke` draw exactly as in 1.2.0 unless the look names one of the new fonts (1.2.0 dropped them with a warning).

## 1.2.0

- Reads the style's caption look (`expect.caption_look`): presets `plate`, `stroke` and `karaoke`, with words per caption, height, case, brand and call-to-action highlights and skipping the first scene. An unknown preset is drawn as `plate` with a warning; the look is never refused.
- Never captions inside the timeline's end card or after it; the last caption holds to the end card's start. `stroke` and `karaoke` show at most five words. A `max_words` the look sets is a hard limit, brand and call-to-action highlights match any length, and a cut whose every word falls on the end card or the skipped scene comes back uncaptioned instead of refused. The Montserrat license text ships with the font.
- The final encode is capped at 16 Mbit/s, and a result over 180 MB is refused before upload.

## 1.1.0

- The caption font is loaded before captions are measured and wide captions are resized, never overflowing the band; the price is per call.

## 1.0.0

- First version: caption-burn's plate captions as the captions layer, with a WebVTT of what it drew.
