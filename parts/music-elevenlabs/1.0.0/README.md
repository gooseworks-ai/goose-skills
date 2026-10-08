# music-elevenlabs 1.0.0

One instrumental music bed, cut to `seconds`.

- **Paid piece** `bed`, through the private line only: ElevenLabs `POST /v1/music` with
  `{prompt, music_length_ms, force_instrumental: true, model_id: "music_v1"}` (today's create-music-elevenlabs
  request, plus the model id the line checks against the lock). It orders `seconds + trim_intro_s + 0.5` s.
- **Finish** (today's atom): skip `trim_intro_s`, `loudnorm` to -16 LUFS integrated, -1.5 dBTP, LRA 11, a 0.5 s
  fade-out at the tail, AAC. The sound layer sets the final level of the whole cut.
- **Price before anything runs**: `max_seconds` is a plain value in the style (its longest video plus a second);
  the part refuses a bed that would need more. Cost basis: USD 0.0025 per second (ElevenLabs list price,
  USD 0.15 a minute) times `max_seconds`.
- **Outputs**: `audio`, `seconds`.

Source: `parts/music-elevenlabs/src/part.mjs`, built with `node parts/_tools/bundle.mjs music-elevenlabs 1.0.0`.
