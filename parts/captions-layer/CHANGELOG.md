# captions-layer

## 1.2.0

- Reads the style's caption look (`expect.caption_look`): presets `plate`, `stroke` and `karaoke`, with words per caption, height, case, brand and call-to-action highlights and skipping the first scene. An unknown preset is drawn as `plate` with a warning; the look is never refused.
- Never captions inside the timeline's end card or after it; the last caption holds to the end card's start. `stroke` and `karaoke` show at most five words. A `max_words` the look sets is a hard limit, brand and call-to-action highlights match any length, and a cut whose every word falls on the end card or the skipped scene comes back uncaptioned instead of refused. The Montserrat license text ships with the font.
- The final encode is capped at 16 Mbit/s, and a result over 180 MB is refused before upload.

## 1.1.0

- The caption font is loaded before captions are measured and wide captions are resized, never overflowing the band; the price is per call.

## 1.0.0

- First version: caption-burn's plate captions as the captions layer, with a WebVTT of what it drew.
