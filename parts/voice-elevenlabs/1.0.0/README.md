# voice-elevenlabs 1.0.0

Speaks each scene's `line` with one ElevenLabs voice and joins the lines into one voice track.

- **Paid piece per line**, ordered only through the private line: ElevenLabs
  `POST /v1/text-to-speech/<voice_id>/with-timestamps` with `{text, model_id: "eleven_v3", voice_settings?}`
  (today's create-vo-elevenlabs request). The line's result gives the MP3 (`/file_url`) and the character alignment.
- **Pronunciations**: each brand term is sent as its `say_as` spelling (one pass, whole words, longest term first).
  Captions keep the written term: word timings map the spoken characters back to the written words.
- **No guessed timings**: a reply without a usable character alignment fails the piece (`provider_failed`).
- **Track**: every line trimmed to its measured length, `gap_s` (default 0.25 s) of silence between lines, AAC.
- **Outputs**: `audio`, `seconds`, `speech` (text, spoken, start/end, words; the Timeline speech shape),
  `scenes` (each voiced scene's span), `lines` (each scene's own MP3).
- **Cost**: ElevenLabs list price, USD 0.10 per 1,000 characters of `scenes[].line` (the rate our server prices
  TTS at). A pronunciation swap can make the spoken text a little longer than the written one.

Source: `parts/voice-elevenlabs/src/part.mjs`, built with `node parts/_tools/bundle.mjs voice-elevenlabs 1.0.0`.
