# voice-elevenlabs 1.1.0

Speaks each scene's `line` with an ElevenLabs voice and joins the lines into one voice track. One narrator,
or a cast where each member speaks with their own voice.

- **Paid piece per line**, ordered only through the private line: ElevenLabs
  `POST /v1/text-to-speech/<voice_id>/with-timestamps` with `{text, model_id, voice_settings?}`
  (today's create-vo-elevenlabs request). The line's result gives the MP3 (`/file_url`) and the character alignment.
  Pieces are named `line-<scene id>`.
- **Silent scenes**: a scene whose `line` is `null`, empty or only spaces is skipped. It is not paid for and
  gets no span in `scenes` or `speech`; holding the picture on a silent scene is the compose step's job.
- **Cast** (new): pass `plan.cast`. A scene's `speaker` names a member's `key`; that scene is spoken with the
  member's `voice_id` (else the default `voice_id`) and the member's `voice_settings` laid over the default
  `voice_settings`. A speaker the cast does not hold is refused, before anything is ordered. Without a `cast`,
  `speaker` is ignored and every line uses `voice_id`, as in 1.0.x. `voice_id` is optional when the cast gives
  every spoken scene a voice; a spoken scene left with no voice is refused.
- **Model** (new): `eleven_v3` (default) or `eleven_multilingual_v2`. Both are list-priced at USD 0.10 per
  1,000 characters.
- **Audio tags** (new): `[whispers]`-style tags (square brackets, up to 40 characters) in a line.
  `tags: keep` (the default on `eleven_v3`) sends them; `tags: strip` takes them out before sending (the default on
  `eleven_multilingual_v2`, which reads tags aloud, so `keep` with a tagged line on v2 is refused). Either way the
  written `text` and word timings, which captions and the script check read, never contain tags.
- **Length cap** (new): `max_seconds` refuses a joined read longer than this (`bad_input`), before the track is
  joined and before any later step is paid for.
- **Pronunciations**: each brand term is sent as its `say_as` spelling (one pass, whole words, longest term first).
  Captions keep the written term: word timings map the spoken characters back to the written words.
- **No guessed timings**: a reply without a usable character alignment fails the piece (`provider_failed`).
- **Track**: every line trimmed to its measured length, `gap_s` (default 0.25 s) of silence between lines, AAC.
- **Outputs**: `audio`, `seconds`, `speech` (text, spoken, start/end, words; the Timeline speech shape),
  `scenes` (each voiced scene's span), `lines` (each voiced scene's own MP3).
- **Cost**: ElevenLabs list price, USD 0.10 per 1,000 characters of `scenes[].line` for either model (the rate our
  server prices TTS at). A pronunciation swap can make the spoken text a little longer than the written one.

Source: `parts/voice-elevenlabs/src/part.mjs`, built with `node parts/_tools/bundle.mjs voice-elevenlabs 1.1.0`.
