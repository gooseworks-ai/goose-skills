# speech-recut 1.0.0

Re-cuts one take of on-camera speech into a tighter edit. Free and local: the street-interview recipe's
`recut.py` and `phone_look_video.py` as a part. Picture and sound are cut together, so lip sync survives.

- **Inputs**: the take (`video`, one generation or video-seedance-2's joined takes), its `timeline` (scenes =
  plan scene ids), its heard words (`speech`, from transcribe-whisper on that take) and the plan's `scenes`.
- **Dead air**: a silence longer than `max_gap_s` (default 0.25) is cut down to it. The join lands on one of
  the take's own picture cuts (ffmpeg scene detection) when one falls in the silence. The head keeps
  `max_gap_s` before the first word; the tail keeps twice it after the last.
- **Repeats and stutters** (`drop: repeats`, the default) are dropped **inside a line only**. A whole line is
  never dropped, so the check layer's script match over the whole plan still holds. Extra words that are not
  repeats are speech and are kept.
- **Minimum shot**: a shot under `min_shot_s` (default 0.4) that holds no speech is dropped whole (never a
  cross-fade). One that holds speech is kept and logged.
- **Silent beats**: a scene with a null line that the timeline places keeps its whole span.
- **Room tone** (`room_tone: {from: quiet_window, gain_db?}`): the take's quietest speech-free window, 0.4 to
  1 s long, is measured on the **original** take (even if the cut drops it), looped forward then reversed (no
  seam) and laid under the whole edit at `gain_db` (default -6) against that window. It masks the step in the
  street's background at every join. Windows touching a heard word or digital silence are never used; with
  none left, the edit has no bed and a warning is logged.
- **Grade** `street-light`: a 0.03 black lift, highlights eased to 0.98 and a 0.12 unsharp halo, no grain (the
  recipe's phone look at its shipped defaults). `none` (default) leaves the picture as it is.
- **Output**: `fps` (default 30), the take's size, h264 with `-maxrate 16M -bufsize 32M`; a file over 180 MB
  is refused as `output_invalid`. `video`, `seconds`, `timeline` (scenes re-timed by id, speech re-timed with
  dropped repeats removed, safe zones passed on) and `cuts` (`at_s`, `removed_s`, `kind`).
- **Refuses** (`bad_input`): speech with no timed words, a scene line with no heard words (the take needs a
  re-roll; the cut cannot add a line), a take with no sound.

Source: `parts/speech-recut/src/part.mjs` and `src/recut.mjs`, with `src/manifest.mjs`.
