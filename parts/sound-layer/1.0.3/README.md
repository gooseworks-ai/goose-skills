# sound-layer 1.0.3

The sound layer (slot 3 of 4): levels every finished cut to **-14 LUFS integrated, true peak at or below
-1 dBTP** (D16; mix-master's finish mode, one target for every video). Free.

- Pass 1 measures the cut with `loudnorm` (print_format=json); pass 2 applies it in linear mode (a pure gain;
  the target loudness range is widened to the input's so loudnorm stays linear). The picture is copied.
- loudnorm aims at -1.5 dBTP, leaving room for the AAC encode after it. Every chain fades the first 20 ms in:
  a cut that starts at full level made the AAC encoder's first frame overshoot by up to 4 dB. The encoded
  result is measured with ffmpeg's EBU R128 meter (`ebur128=peak=true`).
- Outside -14 +/-1 LUFS or above -1 dBTP (no slack), up to three corrections re-level the source cut (never a
  pass's own AAC, so encodes never stack) with the gain still missing, through a limiter run at 192 kHz so it
  holds inter-sample peaks. Its ceiling starts at -2 dBFS (the encode adds up to about 1 dB) and drops by
  however far a pass's encoded peak went over, plus 0.3 dB. The limiter eats loudness from peaky content, so
  each gain follows the measured slope of loudness over gain, at most twice the shortfall.
- Still over the ceiling, up to two last passes cut the gain after the same chain by the overshoot plus 0.3 dB.
  The output is the first try on target, else the closest to -14 LUFS that holds -1 dBTP and stays within the
  check layer's +/-2 LU; with none, the step fails (`output_invalid`). Every try is written in scratch and only
  the chosen one becomes the output.
- Every chain sets a stereo channel layout (`aformat=channel_layouts=stereo`) after `loudnorm` and after
  `alimiter`, before the last resample; ffmpeg 6.0 otherwise cannot pick a layout for the AAC encode.
- A cut with no sound track, or near silence at or below -50 LUFS integrated (a style whose music is optional,
  with none chosen, and only faint UI sounds), has nothing to level and passes through untouched.
- Layer inputs and outputs are the fixed ones (`video`, `timeline`, `brand`, `expect`, `words` in; `video`,
  `timeline` out); the timeline passes through unchanged.

Source: `parts/sound-layer/src/part.mjs` and `src/manifest.mjs`.
