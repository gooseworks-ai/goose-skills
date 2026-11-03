# assemble 1.1.0

Joins scene clips and stills, in order, into one cut. Free. The assembler from stitch-videos-ffmpeg's montage.
Everything 1.0.2 does is unchanged; the new inputs are all optional.

- Every cut is scaled to `width` x `height` (`cover` crops to fill, `contain` pads with `background`), one
  `fps` (default 30), square pixels, yuv420p.
- A clip's cut is `in_s` plus `seconds` (default: the rest of the clip). A clip up to 0.1 s short holds its last
  frame; more than that is refused. A still needs `seconds`. A streaming WebM or Matroska clip with no container length
  is measured from its streams or packets. One ffprobe reports as cut off or damaged is refused.
- Each cut gets an exact frame count; hard cuts go through the concat filter, never the concat demuxer.
- `clip_audio: keep` keeps each clip's own sound, with silence under stills, silent clips and the end card.

## New in 1.1.0

- **Pictures timed to a voice or song.** `spans` (a voice or song step's `scenes`) are matched to clips by id.
  Each clip starts on the frame at or before its span's start, so a cut never lands inside the line's first word,
  and runs to the next one. The first starts at 0; the last holds `tail_s` (default 0.25) past its span's end.
  A clip shorter than its cut holds its last frame. A clip's own `seconds` is not used. Every span needs a clip
  (except the end card's, below), and the clips must be in the spans' order.
- **Scenes with no line.** A clip with no span is silent. `silent: {mode: share_previous}` (default) splits the
  voiced clip before it evenly; `{mode: fixed, seconds}` gives it `seconds` (default 1) of that clip, which must
  keep at least 0.4 s. Silent clips before the first voiced one share with it.
- **Speech passed through.** `speech` (or, failing that, `timeline.speech`) is copied into the output timeline,
  so the captions layer needs no transcription.
- **A finished timeline passed through.** `timeline` without `spans`: the clips are already cut, so its scenes,
  speech and safe zones are kept (moved onto the cut when the size differs). Street interview binds its overlay's
  timeline here.
- **The end card.** `ending` (a video) is joined with a hard cut and marked as `timeline.end_card`; its
  `ending_timeline` logo box is moved onto the cut and kept. `ending_fills: after` (default) appends it.
  `last_span` (needs `spans`) puts it in the last span's place, from that span's start to its end plus `tail_s`,
  never shorter than the card; that scene's id covers the card. With no `ending` (an end-card step that drew
  nothing), a last span with no clip is held over by the cut before it.
- **Ken Burns.** `motion: {stills: ken_burns, to: 1.05}` pushes every still slowly in, centred, over its cut,
  fitted at twice the size so the edges never resample. Clips and the end card never move.
- **Grades.** `grade: phone-grain` (slight contrast, less colour, light denoise, fine moving grain) or `phonecam`
  (down to a 720 short side, moving grain, back up). Body cuts only, never the end card.
- **Size rule.** The final encode is capped at 16 Mbps (8 Mbps with a grain grade), and a cut over 180 MB is
  refused (`output_invalid`) before it is handed on.
- **Outputs**: `video`, `seconds`, `timeline` (scenes by cut and scene id, speech, `end_card` with an ending,
  `safe_zones`).
- Captions and loudness are the layers' jobs.

Source: `parts/assemble/src/part.mjs`, `src/cuts.mjs` and `src/manifest.mjs`.
