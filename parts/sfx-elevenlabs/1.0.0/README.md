# sfx-elevenlabs 1.0.0

Short sound effects, one paid piece per effect.

- **Paid piece** `sfx-<id>` per effect, through the private line only: ElevenLabs `POST /v1/sound-generation`
  with `{text, duration_seconds, model_id: "eleven_text_to_sound_v2", prompt_influence?}`. The length is always
  set, so the price is known from the style before anything runs.
- **Finish**: each effect cut to its `seconds` with a 50 ms tail fade, AAC.
- **Outputs**: `effects: [{id, audio, seconds}]`, for `audio-mix`'s `sfx` cues.
- **Cost basis**: USD 0.01 per second of effect, an upper bound on ElevenLabs' per-second sound-effect price.
- **Server**: the private line must allow `POST /v1/sound-generation` for this part (today it allows speech and
  music only) and price it by `duration_seconds`.

Source: `parts/sfx-elevenlabs/src/part.mjs`, built with `node parts/_tools/bundle.mjs sfx-elevenlabs 1.0.0`.
