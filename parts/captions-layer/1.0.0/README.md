# captions-layer 1.0.0

The captions layer (slot 2 of 4): burns word-timed captions onto the cut and returns a WebVTT of exactly
what it drew (the core sends it as the upload's `captions_vtt`). caption-burn's one caption rule.

- **Timings**: the timeline's `speech[].words` (voice-elevenlabs writes them, with the written brand names).
  Only when a line has no word timings is the cut's own audio transcribed: one paid piece, fal
  `fal-ai/whisper` with `{audio_url, task: "transcribe", language: "en", chunk_level: "word"}` (today's
  caption-burn transcription), the audio passed as a file the core hosts. Heard words are placed on the
  written line; a word the transcript writes differently ("200" for "two hundred") sits between its
  neighbours; a line it cannot place is timed by syllables and logged.
- **Grouping**: one or two words per caption, by the line's pace (caption-burn's rule); a lone last word joins
  the one before; small gaps close (up to 0.5 s) so captions do not flicker; **the last caption holds to the
  final frame** (it is the call to action).
- **Look**: white bold type on a dark grey rounded plate, cap height 1.9 % of the frame, plate centred at
  0.62 of the height, never outside the 4:5 feed crop (y 0.148 to 0.852) or the timeline's caption safe zone;
  a caption too wide for the band shrinks to fit. Drawn in the kit's Chromium with the brand's body (else
  heading) font, else the bundled Montserrat Bold (SIL Open Font License); never a system font; no libass.
- **Outputs**: `video`, `timeline` (with the caption safe zone it used), `captions` (WebVTT), `words` (JSON:
  the word timings and every drawn cue with its box, which the check layer reads).
- **Cost basis**: fal Whisper, an upper bound of USD 0.001 per second of the cut; charged only when a
  transcription is ordered.

Source: `parts/captions-layer/src/part.mjs` and `src/manifest.mjs`.
