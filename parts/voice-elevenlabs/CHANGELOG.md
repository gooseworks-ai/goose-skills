# voice-elevenlabs

## 1.3.0

- Default model `eleven_v4` (1.2.x defaulted to `eleven_v3`). A plan that locked v3 must name it.
- Every line returns `words_per_second` and `measured_words_per_second` from the timestamps, counting real words as goose-studio's `reference_rate.py` does (punctuation alone is not a word); the whole read returns `measured_words_per_second` and a `pace_report`.
- New `pace.target_wps`: a read more than 10 % below it is sped up to the target, at most 1.25x, on the new narration before any lip-sync step (`tempo_applied_before_lipsync: true`). A lip-synced or native talking clip never enters this part. Not with `pace.tempo`.
- Found in a test video: the reference spoke 3.20 words a second (270 words in 84.45 s), the eleven_v3 narration 2.62, with no tempo change.

## 1.2.1

- Every request's `model_id` is a listed constant. A tagged read with no reviewed alignment returns the whole read as one pending track, not its first request. Eleven v4 and v4 Turbo need no `model_support` evidence. 1.2.0 is withdrawn.

## 1.2.0

- Add selectable V4/V4 Turbo with managed timestamp-endpoint and quote evidence, model-specific settings and delivery tags.
- Default to connected sentence reads and short request gaps; remove automatic tempo fitting to a rate target.
- Hold tagged audio for independent reviewed alignment rather than publish guessed word boundaries. Preserve raw source FileRefs and label provider timing separately from content review.
- Package a new immutable version. No tests or validation runs were performed at the user's request.

## 1.1.0

- A scene whose line is null or empty is skipped: no piece, no span (critic #9). `line` is no longer required.
- `cast` and `scenes[].speaker`: each member speaks with their own `voice_id` and `voice_settings`; a speaker the
  cast does not hold is refused, unless listed in `off_screen` (the style's off-screen speaker keys, read with the
  default `voice_id`). `voice_id` is optional when the cast covers every spoken scene.
- A line longer than the model's per-request limit after pronunciations (v3 3,000, v2 10,000 characters) is refused
  before anything is ordered.
- `model`: `eleven_v3` (default) or `eleven_multilingual_v2`.
- `tags: keep | strip` for `[tag]` audio tags; captions never show tags; tags are never sent to v2.
- `join: line | sentence | one`: send a sentence, or the whole read, as one request; the character timings are
  split back per scene at word boundaries, and `gap_s` goes only between requests.
- `pace {tempo, min_wps, max_wps, max_tempo}`: atempo on the joined read (0.8 to 1.3), with every timing scaled; a
  read still outside the band is refused.
- New outputs `words_per_second` and `tempo`. `lines` keeps its shape; a line cut from a joined or paced read is a
  WAV.
- `max_seconds` refuses a read that runs too long, measured after pace.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, from the create-vo-elevenlabs atom: timestamped ElevenLabs speech per scene line, pronunciation
  swaps, word timings for captions, one joined voice track.
