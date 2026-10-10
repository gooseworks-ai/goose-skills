# sound-layer

## 1.0.3

- Holds -1 dBTP on every bed: every chain fades the first 20 ms in (a cut starting at full level made the AAC encoder's first frame overshoot by up to 4 dB), corrections re-level the source instead of re-encoding their own AAC, their limiter ceiling starts at -2 dBFS and drops by any measured overshoot, the gain follows the measured loudness slope, and a last gain cut holds the ceiling within the check's +/-2 LU instead of failing.

## 1.0.2

- Sets a stereo channel layout after loudnorm and the limiter, so ffmpeg 6.0 can encode the levelled sound.
- A cut at or below -50 LUFS integrated counts as silent and passes through untouched, instead of being lifted and failing.

## 1.0.1

- Correction passes stay in scratch; only the chosen pass becomes the output.

## 1.0.0

- First version: mix-master's finish mode as the sound layer, -14 LUFS +/-1, true peak at or below -1 dBTP.
