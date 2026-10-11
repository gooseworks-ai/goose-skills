# music-elevenlabs

## 1.0.2

- The bed is saved at 48 kHz stereo: loudnorm resamples to 192 kHz, and 1.0.1 kept that rate, so its beds were 96 kHz AAC.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, from the create-music-elevenlabs atom.
