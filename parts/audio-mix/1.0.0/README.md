# audio-mix 1.0.0

Lays voice, a ducked music bed and timed sound effects under the picture, in one ffmpeg pass. Free.

- **Levels** (mix-master's and the montage mix's protocol): voice to -16 LUFS and the bed to -24 LUFS by static
  gains from a measured EBU R128 pass; the bed ducks under the voice (sidechain, threshold 0.02, ratio 20,
  attack 20 ms, release 400 ms; `duck: true` or settings); with no voice and `duck: true` the bed ducks under
  the picture's own sound (a phone chat's message sounds); a fade at the bed's tail (`fade_out_seconds`,
  default 1 s); a bed shorter than the picture loops, a longer one is cut to it.
- **Effects**: each `sfx` cue at `at_s` with a linear `gain`; `max_s` cuts a cue (with a 60 ms fade) so it
  cannot mask the next one. `effects` lays a whole effects track from 0 (phone-chat's `sfx`) at `effects_gain`.
- **Sum**: no amix normalising (so one input never dims the others), then an oversampled peak limiter at
  -1 dBFS. The final level of the whole video is the sound layer's (-14 LUFS); this step only balances tracks.
- **Picture** is copied, never re-encoded. Its own sound is kept (not ducked) unless `keep_video_audio` is false.
- **Outputs**: `video` (the mixed cut), `seconds`.

Source: `parts/audio-mix/src/part.mjs` and `src/manifest.mjs`; build with
`node parts/_tools/manifest.mjs audio-mix 1.0.0 && node parts/_tools/bundle.mjs audio-mix 1.0.0`.
