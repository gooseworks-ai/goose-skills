# music-elevenlabs

## 1.1.0

- Orders `music_v2_5` and sends it explicitly as `model_id` (ElevenLabs Music API: `music_v1`, `music_v2`, `music_v2_5`; default `music_v1`). Same request fields, finish and price basis. A minor version: an intended change in sound, so styles move to it through their pins.

## 1.0.2

- The bed is saved at 48 kHz stereo: loudnorm resamples to 192 kHz, and 1.0.1 kept that rate, so its beds were 96 kHz AAC.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, from the create-music-elevenlabs atom.
