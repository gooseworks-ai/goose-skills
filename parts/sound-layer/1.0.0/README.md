# sound-layer 1.0.0

The sound layer (slot 3 of 4): levels every finished cut to **-14 LUFS integrated, true peak at or below
-1 dBTP** (D16; mix-master's finish mode, one target for every video). Free.

- Pass 1 measures the cut with `loudnorm` (print_format=json); pass 2 applies it in linear mode (a pure gain;
  the target loudness range is widened to the input's so loudnorm stays linear). The picture is copied.
- loudnorm aims at -1.5 dBTP, leaving room for the AAC encode after it. The result is measured with ffmpeg's
  EBU R128 meter (`ebur128=peak=true`): outside -14 +/-1 LUFS or above -1 dBTP (no slack), up to three
  correction passes apply the missing gain through an oversampled limiter at -2 dBFS (content with sharp peaks,
  like a chat's pops, loses a little loudness to the limiter each pass); still outside, the step fails
  (`output_invalid`) instead of handing on a cut over the ceiling.
- A cut with no sound track, or only silence (a style whose music is optional, with none chosen), has nothing
  to level and passes through untouched.
- Layer inputs and outputs are the fixed ones (`video`, `timeline`, `brand`, `expect`, `words` in; `video`,
  `timeline` out); the timeline passes through unchanged.

Source: `parts/sound-layer/src/part.mjs` and `src/manifest.mjs`.
