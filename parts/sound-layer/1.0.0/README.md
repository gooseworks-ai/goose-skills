# sound-layer 1.0.0

The sound layer (slot 3 of 4): levels every finished cut to **-14 LUFS integrated, true peak at or below
-1 dBTP** (D16; mix-master's finish mode, one target for every video). Free.

- Pass 1 measures the cut with `loudnorm` (print_format=json); pass 2 applies it in linear mode (a pure gain;
  the target loudness range is widened to the input's so loudnorm stays linear). The picture is copied.
- The result is measured with ffmpeg's EBU R128 meter (`ebur128=peak=true`). Outside -14 +/-1 LUFS or above
  -0.8 dBTP, one correction pass applies the missing gain through an oversampled limiter; still outside, the
  step fails (`output_invalid`) instead of handing on a cut the server's check (-14 +/-2) would refuse.
- A cut with no sound, or only silence, is refused (`bad_input`): a style with the sound layer on must make sound.
- Layer inputs and outputs are the fixed ones (`video`, `timeline`, `brand`, `expect`, `words` in; `video`,
  `timeline` out); the timeline passes through unchanged.

Source: `parts/sound-layer/src/part.mjs` and `src/manifest.mjs`.
