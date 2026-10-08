# audio-mix 1.0.0

Lays voice, a ducked music bed and timed sound effects under the picture, in one ffmpeg pass. Free.

- **Levels** (mix-master's and the montage mix's protocol): voice to -16 LUFS and the bed to -24 LUFS by static
  gains from a measured EBU R128 pass; the bed ducks under the voice (sidechain, threshold 0.02, ratio 20,
  attack 20 ms, release 400 ms); a 1 s fade at the bed's tail (`music_fade_out_s`); a bed shorter than the
  picture loops.
- **Effects**: each `sfx` cue at `at_s` with a linear `gain`; `max_s` cuts a cue (with a 60 ms fade) so it
  cannot mask the next one.
- **Sum**: no amix normalising (so one input never dims the others), then an oversampled peak limiter at
  -1 dBFS. The final level of the whole video is the sound layer's (-14 LUFS); this step only balances tracks.
- **Picture** is copied, never re-encoded. `keep_video_audio` mixes the picture's own sound in too.
- **Outputs**: `video` (the mixed cut), `seconds`.

Source: `parts/audio-mix/src/part.mjs` and `src/manifest.mjs`; build with
`node parts/_tools/manifest.mjs audio-mix 1.0.0 && node parts/_tools/bundle.mjs audio-mix 1.0.0`.
