# sound-layer 1.0.3

The sound layer (slot 3 of 4): levels every finished cut to **-14 LUFS integrated, true peak at or below
-1 dBTP** (D16; mix-master's finish mode, one target for every video). Free.

- Pass 1 measures the cut with `loudnorm` (print_format=json); pass 2 applies it in linear mode (a pure gain;
  the target loudness range is widened to the input's so loudnorm stays linear). The picture is copied.
- loudnorm aims at -1.5 dBTP, leaving room for the AAC encode after it. Every chain fades the first 20 ms in:
  a cut that starts at full level made the AAC encoder's first frame overshoot by up to 4 dB. The encoded
  result is measured with ffmpeg's EBU R128 meter (`ebur128=peak=true`).
- Outside -14 +/-1 LUFS or above -1 dBTP (no slack), up to eight corrections re-level the source cut (never a
  pass's own AAC, so encodes never stack) through a limiter run at 192 kHz so it holds inter-sample peaks.
  Loudness rises with gain but not in step (the limiter eats more of a peaky cut the harder it is driven), so
  the gain is searched inside a bracket: the highest gain that came out too quiet and the lowest that came out
  too loud, by interpolation, else halving; with one side only, the next step is twice the shortfall. The
  limiter's ceiling starts at -2 dBFS (the encode adds up to about 1 dB); a pass whose encoded peak goes over
  lowers it by the overshoot plus 0.3 dB and restarts the bracket.
- Only a pass inside both targets is used; with none after eight corrections the step fails (`output_invalid`).
  Every pass is written in scratch and only the chosen one becomes the output.
- Every chain sets a stereo channel layout (`aformat=channel_layouts=stereo`) after `loudnorm` and after
  `alimiter`, before the last resample; ffmpeg 6.0 otherwise cannot pick a layout for the AAC encode.
- A cut with no sound track, or near silence at or below -50 LUFS integrated (a style whose music is optional,
  with none chosen, and only faint UI sounds), has nothing to level and passes through untouched.
- Layer inputs and outputs are the fixed ones (`video`, `timeline`, `brand`, `expect`, `words` in; `video`,
  `timeline` out); the timeline passes through unchanged.

Source: `parts/sound-layer/src/part.mjs` and `src/manifest.mjs`.
