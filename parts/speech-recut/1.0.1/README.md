# speech-recut 1.0.1

Re-cuts one take of on-camera speech into a tighter edit. Free and local: the street-interview recipe's
`recut.py` and `phone_look_video.py` as a part. Picture and sound are cut together, so lip sync survives.

- **Inputs**: the take (`video`, one generation or video-seedance-2's joined takes), its `timeline` (scenes =
  plan scene ids), its heard words (`speech`, from transcribe-whisper on that take) and the plan's `scenes`.
  `speech` is optional: left out, the timeline's own `speech` is used. A style can only bind one level
  (`step.<id>.<output>`), so a chain passes transcribe-whisper's `timeline` as `timeline` and leaves `speech`
  out. Either way the words must be timed, and the refusals below apply to whichever speech is used.
- **Dead air**: a silence longer than `max_gap_s` (default 0.25) is cut down to it. The join lands on one of
  the take's own picture cuts (ffmpeg scene detection) when one falls in the silence. The head keeps
  `max_gap_s` before the first word; the tail keeps twice it after the last.
- **Repeats and stutters** (`drop: repeats`, the default) are dropped **inside a line only**. A whole line is
  never dropped, so the check layer's script match over the whole plan still holds. Extra words that are not
  repeats are speech and are kept.
- **Minimum shot**: a shot under `min_shot_s` (default 0.4) that holds no speech is dropped whole (never a
  cross-fade). One that holds speech (new in 1.0.1) first takes back the dead air cut beside it, up to its
  shortfall: a little more pause, never past a picture cut inside that dead air. When that cannot reach
  `min_shot_s` (the take's own shot is that short), the shot's picture is covered by the shot before it, its
  last frame held (the first shot of the edit by the shot after it, its first frame), and its sound plays on,
  so no word is lost and no flash of picture is seen. 1.0.0 kept such a shot, so a 0.17 s jump could ship.
  Only an edit with no shot long enough to cover from keeps a short shot, with a warning.
- **Silent beats**: a scene with a null line that the timeline places keeps its whole span.
- **Room tone** (`room_tone: {source: quiet_window, gain_db?}`): the take's quietest speech-free window, 0.4 to
  1 s long, is measured on the **original** take (even if the cut drops it), looped forward then reversed (no
  seam) and laid under the whole edit at `gain_db` (default -6) against that window. It masks the step in the
  street's background at every join. Windows touching a heard word, a gap that holds heard speech with no timings (a repeated line
  the transcript gave to the next line) or digital silence are never used; with
  none left, the edit has no bed and a warning is logged. The key is `source`, not `from`: a style reads any
  object with a `from` key as a reference, so `{from: ...}` is refused.
- **Grade** `street-light`: a 0.03 black lift, highlights eased to 0.98 and a 0.12 unsharp halo, no grain (the
  recipe's phone look at its shipped defaults). `none` (default) leaves the picture as it is.
- **Output**: `fps` (default 30), the take's size, h264 with `-maxrate 16M -bufsize 32M`; a file over 180 MB
  is refused as `output_invalid`. `video`, `seconds`, `timeline` (scenes re-timed by id, speech re-timed with
  dropped repeats removed, safe zones passed on) and `cuts` (`at_s`, `removed_s`, `kind`).
- **Refuses** (`bad_input`): speech with no timed words, a scene line with no heard words (the take needs a
  re-roll; the cut cannot add a line), a take with no sound. The speech refusals come before any probe or
  ffmpeg work.

Source: `parts/speech-recut/src/part.mjs` and `src/recut.mjs`, with `src/manifest.mjs`.
