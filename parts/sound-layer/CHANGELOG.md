# sound-layer

## 1.0.4

- loudnorm is never let go dynamic: when the first pass shows linear mode is not possible (the gain to -14 LUFS would push the true peak past -1.5 dBTP), or the second pass reports anything but linear, the cut is levelled by a plain gain into the oversampled limiter instead. Dynamic loudnorm rode the gain down around each loud sound and flattened a chat's message sounds into the bed: on a ChatGPT cut over a synthetic bed the send rose 3.1 dB after 1.0.3 and 4.8 dB after 1.0.4 (the final check needs 4). The limiter still pulls down any peak over its ceiling, so a sound with a very sharp click needs to be dense at its source.

## 1.0.3

- Holds -1 dBTP on every bed: every chain fades the first 20 ms in (a cut starting at full level made the AAC encoder's first frame overshoot by up to 4 dB), corrections re-level the source instead of re-encoding their own AAC, and the limiter's ceiling starts at -2 dBFS and drops by any overshoot measured after the encode.
- The correction gain is searched inside a bracket of too-quiet and too-loud tries (up to eight), so a peaky cut where the limiter eats most of each step no longer swings under and over until the passes run out. The output must hold -14 +/-1 LUFS and -1 dBTP.

## 1.0.2

- Sets a stereo channel layout after loudnorm and the limiter, so ffmpeg 6.0 can encode the levelled sound.
- A cut at or below -50 LUFS integrated counts as silent and passes through untouched, instead of being lifted and failing.

## 1.0.1

- Correction passes stay in scratch; only the chosen pass becomes the output.

## 1.0.0

- First version: mix-master's finish mode as the sound layer, -14 LUFS +/-1, true peak at or below -1 dBTP.
