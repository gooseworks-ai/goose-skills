# captions-layer 1.5.0

**New in 1.5.0: the linked edit.** The layer declares `assembly_timeline` on its timeline, so the kit passes a custom video's source-linked edit to it, and returns it unchanged: captions add no picture or sound cue. Everything else is as in 1.4.0, request for request.

**1.4.0 keeps captions off the product.** Boxes to keep clear come from `timeline.keep_clear` (a step that knows
where it drew the product: `[{scene_id?, start_s, end_s, use: "product", box: {x, y, w, h}}]` in pixels, shown
for that span) and from the look's `keep_clear` (where the style's shots hold the product: up to 8 boxes
`{x, y, w, h}` as shares of the frame, for the whole cut; a bad value is dropped with a warning). Each box is
grown by 0.02 of the height. Each timeline scene's captions take **one height**, so they never jump between
captions of a scene: the look's `y`, else 0.80, else 0.30 of the height (each kept inside the caption band, so
0.80 sits just above the platform controls), the first at which every caption of the scene, as measured in
the browser, clears every box shown with it. When none does, the height with the least overlap is used and a
warning is logged. `words.json` then gives each cue its `y` and `overlap` (square pixels) and lists the boxes
kept clear (`keep_clear`, margin included, with `from`: `timeline` or `look`) for the final check. The
timeline handed on has no `keep_clear` (the later layers do not take it). **With no box, the cut, the WebVTT,
`words.json` and the timeline are exactly 1.3.1's.**

**1.3.1 fixes captions held across final cuts.** When `expect.qc_flags` includes `captions_cross_cuts`, words are grouped within actual final timeline shots and every caption hold stops at the next scene start. Boundary punctuation stays attached to its neighbouring lexical word; an earlier opening mark does not move that word into the previous shot, and a later closing mark does not extend display past the cut. Without that flag, timings, grouping and rendering keep the 1.3.0 behavior.

The captions layer (slot 2 of 4): burns word-timed captions onto the cut and returns a WebVTT of exactly
what it drew (the core sends it as the upload's `captions_vtt`). New in 1.3.0: the `pill`, `serif-word` and
`sentence` looks, and the `serif` and `rounded` fonts, bundled. (1.2.0 brought the caption look and the
end-card stop.)

- **Timings**: the timeline's `speech[].words` (voice-elevenlabs writes them, with the written brand names).
  Only when a line has no word timings is the cut's own audio transcribed: one paid piece, fal
  `fal-ai/whisper` with `{audio_url, task: "transcribe", language: "en", chunk_level: "word"}`, the audio
  passed as a file the core hosts. Heard words are placed on the written line; a word the transcript writes
  differently ("200" for "two hundred") sits between its neighbours; a line it cannot place is timed by
  syllables and logged.
- **End card**: when the timeline has `end_card {start_s, end_s}`, the caption track stops for good at
  its start: no word that starts at or after it is captioned, and no caption runs into it. The last caption
  before it holds to its start. With no end card
  the last caption holds to the final frame (it is the call to action), unless `captions_cross_cuts` requires it to stop at the next final cut.
- **Caption look** (`expect.caption_look`, from the style's `traits.caption_look`; the kit copies it):
  - `preset`:
    - `plate` (the default): one or two words, white bold type on a dark grey rounded plate, by the line's
      pace (caption-burn's rule); a lone last word joins the one before.
    - `stroke`: white bold type with a black outline, no plate, up to 5 words a caption. A caption ends at
      punctuation or a pause over 0.6 s and is split into near-equal groups. It may wrap to two balanced
      lines, then shrinks to fit.
    - `karaoke`: grouped like `stroke`, and the word being spoken takes the highlight colour.
    - `pill` (new): about 3 words (grouped like `stroke`, at most 5) on one line on a cream rounded pill with
      a soft shadow, in the bundled rounded face (Titan One). Lower case by default, and then the brand name keeps
      its written case (`case: "upper"` upper-cases it too). The words said so far are near-black and the ones still to come grey; a highlighted word,
      once said, takes the highlight colour. Default centre 0.70 of the height.
    - `serif-word` (new): one word at a time, on one line, in the bundled heavy serif (PT Serif Bold), white
      with a black outline 0.0047 of the height, cap height about 0.037 of the height. The words of the brand
      name always stay in one caption (never half a brand name). A highlighted brand name (`highlight:
      ["brand"]`) is quoted and drawn in the highlight colour; a highlighted call to action stays one word
      at a time, in the highlight colour, unquoted. Default centre 0.75 of the
      height, which puts the baseline near 0.77.
    - In `pill`, `serif-word` and `sentence`, a word with no letter or digit (a lone dash, quote or full
      stop) joins the word before it (an opening quote or bracket, the word after), so no caption is only
      punctuation; lines that overlap in time are read one after the other, never interleaved.
    - `sentence` (new): one sentence per caption, in the bundled serif, near-white with a dark outline, 62 px
      at 1920 high. A sentence is read across lines: it ends at `.`, `!` or `?`, so a sentence sung over
      several scenes is one caption; one longer than `max_words` (default 12) is split into near-equal parts.
      Each word appears as it is said and stays (the sentence is laid out in full first, so nothing moves).
      `y` is the centre of the **last** line (default 0.77); a longer sentence wraps to up to three balanced
      lines and grows upward, never below the band. A sentence stays up until the next one starts (or the
      end card).
  - `max_words` (1 to 8; `stroke`, `karaoke` and `pill` use at most 5; `serif-word` always 1), `y` (caption
    centre, 0.40 to 0.82 of the height; default 0.62 for `plate`, `stroke` and `karaoke`),
    `case` (`as_written`, `lower`, `upper`; the WebVTT shows the same case), `skip_first_scene` (no captions
    on the timeline's first scene: lines tagged with its id and words mostly inside its span; no caption starts before it ends).
  - `highlight` (`brand`, `cta`): words that spell the brand name or the call to action are drawn in
    `highlight_color` (`#RRGGBB`; default the brand's primary colour, else `#FFD400`). Karaoke uses the same
    colour for the spoken word.
  - `font`: `sans_bold` (the bundled Montserrat Bold), `serif` (the bundled PT Serif Bold), `rounded` (the
    bundled Titan One) or `brand` (the brand's body, else heading font; else the preset's bundled face).
    With no font named, `pill`, `serif-word` and `sentence` use their own bundled face; the other presets use
    the brand's font, else Montserrat, as in 1.1.0.
  - **A look is never refused.** An unknown preset is drawn as `plate` with a warning in the log. Any other
    value it cannot use (an unknown font, a bad colour, an out-of-range number) is dropped with a warning
    and the rest of the look is drawn. `y` outside its range is clamped.
- **Placement**: every caption stays inside the 4:5 feed crop, the TikTok/Reels bands (top 220, bottom 400,
  right 140 px at 1080x1920, kept symmetric so captions stay centred) and the timeline's caption safe zone.
  `stroke` and `karaoke` are set 15 % larger than the plate. The face is loaded before anything is measured, so the
  drawn box is exactly the measured box. Drawn in the kit's Chromium; never a system font; no libass.
- **Size**: the final encode is the kit's `h264-master` with `-maxrate 16M -bufsize 32M`. A result over
  180 MB fails with `output_invalid` before it is uploaded.
- **Outputs**: `video`, `timeline` (with the caption safe zone it used), `captions` (WebVTT), `words` (JSON:
  the look it drew, the word timings, and every drawn cue with its box, which the check layer reads).
- **Cost basis**: fal Whisper, USD 0.02 per call (an upper bound); charged only when a transcription is
  ordered. A cut whose timeline carries word timings orders nothing here.

Source: `parts/captions-layer/src/part.mjs` and `src/manifest.mjs`. The bundled fonts are all under the SIL
Open Font License 1.1 and ship unmodified, each with its license text:

| File | Font | Used by | License text |
|---|---|---|---|
| `assets/fonts/Montserrat-Bold.ttf` | Montserrat Bold | `sans_bold`; plate, stroke, karaoke when the brand has no font | `Montserrat-OFL.txt` |
| `assets/fonts/PTSerif-Bold.ttf` | PT Serif Bold (ParaType) | `serif`; serif-word, sentence | `PTSerif-OFL.txt` |
| `assets/fonts/TitanOne-Regular.ttf` | Titan One (Rodrigo Fuenzalida) | `rounded`; pill | `TitanOne-OFL.txt` |
