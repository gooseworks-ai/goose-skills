# voice-elevenlabs

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
