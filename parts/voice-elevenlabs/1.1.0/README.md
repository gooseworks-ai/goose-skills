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
  `voice_settings`. A speaker the cast does not hold is refused, before anything is ordered, unless it is listed
  in `off_screen` (bind the style's `scenes.speaker.off_screen` keys, such as `interviewer`): such a scene reads
  with the default `voice_id` and `voice_settings`. A key in both the cast and `off_screen` is refused. Without a `cast`,
  `speaker` is ignored and every line uses `voice_id`, as in 1.0.x. `voice_id` is optional when the cast gives
  every spoken scene a voice; a spoken scene left with no voice is refused.
- **Model** (new): `eleven_v3` (default) or `eleven_multilingual_v2`. Both are list-priced at USD 0.10 per
  1,000 characters.
- **Audio tags** (new): `[whispers]`-style tags (square brackets, up to 40 characters) in a line.
  `tags: keep` (the default on `eleven_v3`) sends them; `tags: strip` takes them out before sending (the default on
  `eleven_multilingual_v2`, which reads tags aloud, so `keep` with a tagged line on v2 is refused; `keep` with untagged lines sends nothing v2 would misread and is allowed). Either way the
  written `text` and word timings, which captions and the script check read, never contain tags.
- **Join** (new): `join: line` (default) sends one request per spoken line, as in 1.0.x. `join: sentence` sends
  consecutive lines as one request until a line's written text ends in `.`, `!` or `?`, so one sentence can run
  over several shots with no pause in the middle. `join: one` sends the whole read as one request (every line
  must have the same voice, and the text must fit the model's per-request limit: 3,000 characters for
  `eleven_v3`, 10,000 for `eleven_multilingual_v2`; otherwise it is refused before anything is ordered). A request
  also ends where the voice changes (voice settings are compared by value, not key order). A single line that,
  after pronunciations, passes the per-request limit is refused before anything is ordered, in every join mode.
  A joined request is named after its first scene (`line-<scene id>`).
- **Splitting a joined read**: the reply's character timings must match the sent text character for character
  (else `provider_failed`). Each scene's span runs from the start of its first word to the start of the next
  scene's first word; the last scene in a request runs to the end of the request. Cuts therefore always fall
  between words, and `gap_s` goes only between requests.
- **Pace** (new): `pace` plays the joined read faster or slower with ffmpeg `atempo` and scales every timing
  (speech, words, scene spans, `seconds`) by the same factor. `eleven_v3` ignores `voice_settings.speed`, so this
  is its only speed control. `pace.tempo` (0.8 to 1.3) fixes the factor. Otherwise a read slower than `min_wps`
  is sped up just to `min_wps`, no faster than `max_tempo` (default 1.25, at most 1.3), and one faster than
  `max_wps` is slowed just to `max_wps`, no slower than 0.8. A read still outside `min_wps..max_wps` is refused
  (`bad_input`) before any later step is paid for. A `tempo` above `max_tempo`, or `min_wps` above `max_wps`, is
  refused before anything is ordered.
- **Read rate**: words per second = each scene's written words over its spoken span (`speech[].end_s -
  start_s`), the same measure as check-layer's `read_rate`.
- **Length cap** (new): `max_seconds` refuses a read, after pace, longer than this (`bad_input`), before the track
  is joined and before any later step is paid for.
- **Pronunciations**: each brand term is sent as its `say_as` spelling (one pass, whole words, longest term first).
  Captions keep the written term: word timings map the spoken characters back to the written words.
- **No guessed timings**: a reply without a usable character alignment fails the piece (`provider_failed`).
- **Track**: every request trimmed to its measured length, `gap_s` (default 0.25 s) of silence between requests,
  then `atempo` when paced, AAC.
- **Outputs**: `audio`, `seconds`, `speech` (text, spoken, start/end, words; the Timeline speech shape),
  `scenes` (each voiced scene's span), `lines` (`[{scene_id, audio}]`, each voiced scene's own audio: the
  provider's MP3 for a line read alone at tempo 1, else a 48 kHz WAV cut from the finished track over the scene's
  speech span, so a lip-sync step can still take one line), `words_per_second` (after pace) and `tempo` (1 when
  not paced).
- **Cost**: ElevenLabs list price, USD 0.10 per 1,000 characters of `scenes[].line` for either model (the rate our
  server prices TTS at). A pronunciation swap can make the spoken text a little longer than the written one.

Source: `parts/voice-elevenlabs/src/part.mjs`, built with `node parts/_tools/bundle.mjs voice-elevenlabs 1.1.0`.
