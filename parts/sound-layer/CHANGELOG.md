# sound-layer

## 1.0.2

- Sets a stereo channel layout after loudnorm and the limiter, so ffmpeg 6.0 can encode the levelled sound.
- A cut at or below -50 LUFS integrated counts as silent and passes through untouched, instead of being lifted and failing.

## 1.0.1

- Correction passes stay in scratch; only the chosen pass becomes the output.

## 1.0.0

- First version: mix-master's finish mode as the sound layer, -14 LUFS +/-1, true peak at or below -1 dBTP.
