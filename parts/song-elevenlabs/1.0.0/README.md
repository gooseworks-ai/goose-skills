# song-elevenlabs 1.0.0

Sings the plan's scene lines as one song with ElevenLabs Music, then times every scene's picture and caption to
the sung words. The song is the script and sets the timeline: no voiceover, no separate music bed.

- **Lyric**: each scene's `line`, in scene order. A scene whose `line` is null, missing or blank is a silent
  picture. `pronunciations` (brand `say_as`) are sung as spelled and captioned as written.
- **Song form** (give one):
  - `sections`: `[{name, seconds, scenes: [from, to], styles, avoid}]`, in order; scene numbers from 1. A section's
    lines are its scenes' lines, split after each sentence. A section with no `scenes` is instrumental.
  - `form`: `{intro_s, outro_s, groups, ms_per_word, min_section_s}` (defaults 3, 3, 3, 330, 3): an instrumental
    intro and outro around `groups` sections of whole sentences, each `words x ms_per_word + 0.5 s` long.
- **Global styles**: `mood` (`plan.music`), `singer` and `brief`; `avoid` is the negative list. A song with none
  of the first three is refused.
- **Refused before anything is ordered** (`bad_input`): nothing to sing; sections and form both or neither; a sung
  scene no section sings; overlapping sections; a section outside 3 to 120 s or over 30 lines; a hook scene that is
  silent, does not start with `hook`, or does not open its section; bad `ending_scenes`; a song over `max_seconds`.
- **Paid piece** `song`, through the private line only: ElevenLabs `POST /v1/music/detailed` (no query) with
  `{composition_plan, model_id: "music_v1", with_timestamps: true, respect_sections_durations: true}`, plus
  `seed` when the style gives one. Never `music_length_ms` or other prompt-only fields. The line answers
  `{json, file_url}`: the reply's JSON part verbatim, and the audio (pointer `/file_url`). Words are read from
  `json.words_timestamps` (`[{word, start_ms, end_ms}]`, milliseconds).
- **The piece fails** (`provider_failed`, which the core retries once) when the reply has no word timings, a word
  without numeric `start_ms`/`end_ms`, a sung-word count that differs from the lyric, or a word that starts after
  the track ends. A word that reads differently ("jacket," for "jacket") is matched
  without case or punctuation; a real difference is logged, not failed.
- **Hook gate**: with `hook_scene`, its first sung word must land within 0.35 s of its section's start. A miss
  orders one more song, piece `song-reroll`, with a new seed (the style's `seed` + 1, else one from the step). A
  second miss fails the step (`output_invalid`, not retried). So a song costs at most two songs.
- **Timing** (`windows`, optional): sung scenes start on their first word; silent scenes share the time between
  their neighbours, snap to a word within `snap_s`, hold at least `min_hold_s`; a group's first picture
  (`scene.extra.group`) shows `shot_lead_s` before the group's first word; `first_word_s: [a, b]` trims or pads
  the head of the track so the first word lands at `a` s (singing by the second scene) or `b` s; with no
  `ending_scenes`, the end card comes in `card_after_s` after the last word. `max_ending_s` (for a card step of
  fixed length) caps the card: one that would start earlier starts at the song's end minus `max_ending_s`, and
  the picture before it holds longer.
- **Outputs**: `audio` (AAC, 48 kHz stereo, trimmed or padded to match), `seconds`, `words` (every written word),
  `scenes` (every scene, back to back from 0), `speech` (captions for the sung scenes before the ending scenes),
  `ending_seconds` (from the end card's start to the end of the song), `hook_s` (with `hook_scene`).
- **Cost**: USD 0.0025 per second of the composition plan (ElevenLabs list price, USD 0.15 a minute); measure =
  the sum of `sections[].seconds` (a `form` song's length depends on its words). A hook re-roll orders a second
  song. Documentation only: the line prices each piece from its plan.

Source: `parts/song-elevenlabs/src/part.mjs`, `src/lyric.mjs`, `src/plan.mjs`, `src/snap.mjs` and `src/manifest.mjs`.
