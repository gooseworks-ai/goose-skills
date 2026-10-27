# audio-mix 1.1.1

Lays voice, a ducked music bed, timed sound effects, sounds at the cut's marks and a room tone under the
picture, in one ffmpeg pass. Free. Every 1.0.1 input behaves as before.

- **Levels** (mix-master's and the montage mix's protocol): voice to -16 LUFS and the bed to -24 LUFS by static
  gains from a measured EBU R128 pass; the bed ducks under the voice (sidechain, threshold 0.02, ratio 20,
  attack 20 ms, release 400 ms; `duck: true` or settings); with no voice and `duck: true` the bed ducks under
  the picture's own sound (a phone chat's message sounds); a fade at the bed's tail (`fade_out_seconds`,
  default 1 s); a bed shorter than the picture loops, a longer one is cut to it.
- **Effects**: each `sfx` cue at `at_s` with a linear `gain`; `max_s` cuts a cue (with a 60 ms fade) so it
  cannot mask the next one. `effects` lays a whole effects track from 0 (phone-chat's `sfx`) at `effects_gain`.
- **Sounds at marks** (new): bind an edit step's `marks` (`[{kind, at_s}]`) and a sound step's effects as
  `mark_sounds` (`[{id, audio}]`, e.g. `step.sfx.effects`). Each mark whose `kind` equals a sound's `id` plays
  that sound at `at_s + mark_offset_s` (default 0) at `mark_gain` (linear, default 1), cut to `mark_max_s` when
  set. Other kinds are ignored and a mark past the end is dropped. Refused: marks with no `mark_sounds`, a
  sound id listed twice, or marks whose kinds match no sound at all (a wiring mistake, not a quiet mix).
- **Room tone** (new): `room_tone {color: brown|pink, gain_db, highpass_hz, lowpass_hz}` lays seeded,
  band-limited noise (`anoisesrc`) under the whole video, end card included, at an absolute level after the
  voice is levelled. Podcast skit's setting, brown 90-2600 Hz at -27 dB, sits near -46 LUFS. No audio asset.
- **Outdoor** (new): `outdoor: true` treats the speech (the voice, or with no voice the picture's own sound)
  like a phone mic outside: a 110 Hz-7.4 kHz band, +2.5 dB at 2.6 kHz, -1.5 dB at 300 Hz and a 3:1
  compressor, then lays a slowly swelling street ambience (brown noise below 1500 Hz at -27 dB, or
  `room_tone`'s settings over those). Refused when there is no speech to treat.
- **Sum**: no amix normalising (so one input never dims the others), then an oversampled peak limiter at
  -1 dBFS. The final level of the whole video is the sound layer's (-14 LUFS); this step only balances tracks.
- **Picture** is copied, never re-encoded. Its own sound is kept (not ducked) unless `keep_video_audio` is false.
- **Nothing to mix** (a style whose music is optional, with none chosen, over a silent picture): the cut gets a
  silent stereo track of its length, so the layers always read a cut with sound.
- **Outputs**: `video` (the mixed cut), `seconds`.

Source: `parts/audio-mix/src/part.mjs` and `src/manifest.mjs`; build with
`node parts/_tools/manifest.mjs audio-mix 1.1.0 && node parts/_tools/bundle.mjs audio-mix 1.1.1`.
