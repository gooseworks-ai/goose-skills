# music-elevenlabs 1.1.1

**Model: `music_v2_5`, always sent by name.** ElevenLabs Music takes the model in the request body as `model_id` (`music_v1`, `music_v2` or `music_v2_5`; the API default is `music_v1`, so leaving it out would quietly order the old model). 1.0.x sent `music_v1`; move styles to 1.1.0.

One instrumental music bed.

- **Prompt**: the style's fixed `brief` plus the plan's `mood` (`plan.music`). A plan with no mood gets no bed:
  nothing is ordered and the step returns no `audio`.
- **Paid piece** `bed`, through the private line only: ElevenLabs `POST /v1/music` with
  `{prompt, music_length_ms, force_instrumental: true, model_id: "music_v2_5"}` (the model id the line checks against the lock). It orders exactly `seconds`.
- **Finish** (today's atom): skip `trim_intro_s`, `loudnorm` to -16 LUFS integrated, -1.5 dBTP, LRA 11, a 0.5 s
  fade at the tail, AAC at 48 kHz stereo (1.0.1 kept loudnorm's 192 kHz rate, so the bed was saved at 96 kHz). audio-mix cuts the bed to the picture; the sound layer sets the final level.
- **Price before anything runs**: `seconds` is a plain number in the style (its longest video). Cost basis:
  USD 0.0025 per second (ElevenLabs list price, USD 0.15 a minute, checked 2026-10-15; the pricing page lists one Music price, not one per model) times `seconds`.
- **Outputs**: `audio`, `seconds` (both absent when there is no mood).

Source: `parts/music-elevenlabs/src/part.mjs`, built with `node parts/_tools/bundle.mjs music-elevenlabs 1.1.1`.
