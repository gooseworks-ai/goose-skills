# Sample input

See `examples/full-note.example.json` — canonical "screen recording of me typing on Apple Notes" with 1 pre-typed paragraph + 3 typed paragraphs landing mid-word on `I'm not sure how th|`, then a FREEDEMO end card.

Schema highlights:

- `title` — string. Bold note headline.
- `pre_typed_body[]` — paragraphs visible at t=0.
- `typed_body[]` — each `{text, type_seconds, pre_pause_seconds, autocorrect_underline?}`. Typing rhythm is jittered ±35% around the average implied by `type_seconds / text.length`.
- `post_hold_seconds` — silent hold after the last keystroke before crossfade to end card.
- `status_bar`, `keyboard_state` — passed through to the atom.
- `end_card.{wordmark, code, tagline, background_color, ink_color}` — drives `render-end-card.js`.
- `music_bed_path` — optional; if the file exists, it's mixed into the audio track at -11dB with a 60Hz highpass.
