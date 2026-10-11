# captions-layer 1.2.0

The captions layer (slot 2 of 4): burns word-timed captions onto the cut and returns a WebVTT of exactly
what it drew (the core sends it as the upload's `captions_vtt`). New in 1.2.0: the style's caption look,
and no caption ever drawn on the end card.

- **Timings**: the timeline's `speech[].words` (voice-elevenlabs writes them, with the written brand names).
  Only when a line has no word timings is the cut's own audio transcribed: one paid piece, fal
  `fal-ai/whisper` with `{audio_url, task: "transcribe", language: "en", chunk_level: "word"}`, the audio
  passed as a file the core hosts. Heard words are placed on the written line; a word the transcript writes
  differently ("200" for "two hundred") sits between its neighbours; a line it cannot place is timed by
  syllables and logged.
- **End card**: when the timeline has `end_card {start_s, end_s}`, the caption track stops for good at
  its start: no word that starts at or after it is captioned, and no caption runs into it. The last caption
  before it holds to its start. With no end card
  the last caption holds to the final frame (it is the call to action).
- **Caption look** (`expect.caption_look`, from the style's `traits.caption_look`; the kit copies it):
  - `preset`:
    - `plate` (the default): one or two words, white bold type on a dark grey rounded plate, by the line's
      pace (caption-burn's rule); a lone last word joins the one before.
    - `stroke`: white bold type with a black outline, no plate, up to 5 words a caption. A caption ends at
      punctuation or a pause over 0.6 s and is split into near-equal groups. It may wrap to two balanced
      lines, then shrinks to fit.
    - `karaoke`: grouped like `stroke`, and the word being spoken takes the highlight colour.
  - `max_words` (1 to 8; `stroke` and `karaoke` use at most 5), `y` (caption centre, 0.40 to 0.82 of the height; default 0.62),
    `case` (`as_written`, `lower`, `upper`; the WebVTT shows the same case), `skip_first_scene` (no captions
    on the timeline's first scene: lines tagged with its id and words mostly inside its span; no caption starts before it ends).
  - `highlight` (`brand`, `cta`): words that spell the brand name or the call to action are drawn in
    `highlight_color` (`#RRGGBB`; default the brand's primary colour, else `#FFD400`). Karaoke uses the same
    colour for the spoken word.
  - `font`: `sans_bold` (the bundled Montserrat Bold) or `brand` (the brand's body, else heading font).
    With no font named, the brand's font is used, else the bundled one, as in 1.1.0.
  - **A look is never refused.** A preset this version does not draw (`pill`, `serif-word` and `sentence`
    come in 1.3.0, or any unknown name) is drawn as `plate` with a warning in the log. Any other value it
    cannot use (`serif` and `rounded` fonts, a bad colour, an out-of-range number) is dropped with a warning
    and the rest of the look is drawn. `y` outside its range is clamped.
- **Placement**: every caption stays inside the 4:5 feed crop, the TikTok/Reels bands (top 220, bottom 400,
  right 140 px at 1080x1920, kept symmetric so captions stay centred) and the timeline's caption safe zone.
  Outlined presets are set 15 % larger than the plate. The face is loaded before anything is measured, so the
  drawn box is exactly the measured box. Drawn in the kit's Chromium; never a system font; no libass.
- **Size**: the final encode is the kit's `h264-master` with `-maxrate 16M -bufsize 32M`. A result over
  180 MB fails with `output_invalid` before it is uploaded.
- **Outputs**: `video`, `timeline` (with the caption safe zone it used), `captions` (WebVTT), `words` (JSON:
  the look it drew, the word timings, and every drawn cue with its box, which the check layer reads).
- **Cost basis**: fal Whisper, USD 0.02 per call (an upper bound); charged only when a transcription is
  ordered. A cut whose timeline carries word timings orders nothing here.

Source: `parts/captions-layer/src/part.mjs` and `src/manifest.mjs`. The bundled font is Montserrat Bold
(SIL Open Font License; the license text ships as `assets/fonts/Montserrat-OFL.txt`).
