# creator-h3 1.0.1

An AI creator saying the approved lines to camera, as one continuous track (D6: the default talking creator
for scripted lines; `video-seedance-2` is for short scenes with native audio). From create-creator-takes-h3.

- **Character** (`character`): the approved still and its words (`identity` with age and gender, `environment`,
  optional `delivery`). An identity that is a placeholder or states no age or gender is refused: there is no
  default person.
- **Takes**: the lines split between lines, never inside one, under H3's 15 s cap; each take runs 0.6 s past
  its last word, rounded up to whole seconds (5 to 15). Plan scenes carry no timings, so line lengths are
  estimated at `words_per_second` (default 2.6). Square brackets in a line are refused (H3 speaks them).
- **Paid pieces**, one per take, through the private line only: fal `minimax/h3-max/reference-to-video` with
  the atom's payload: `{prompt, duration, resolution, aspect_ratio, seed, prompt_expansion_mode: "disabled",
  reference_image_urls: [still], reference_video_urls?: [mannerism], reference_audio_urls?: [t1 voice]}`. The
  prompt is the atom's template word for word. Seeds come from the kit's per-piece seed.
- **Voice chain**: t1 is ordered first; its first 12 s of voice (mono, 24 kHz) is the reference audio of
  every later take, so the takes sound like one recording.
- **Join**: join_takes's estimated schedule (each take at its planned start, speech onset measured), 0.10 s
  dissolves, one filter graph (never the concat demuxer). Line spans in the timeline are estimates: the
  captions layer and the check layer transcribe the real speech (the one quality path, check-layer).
- **Price before anything runs**: `max_seconds` (a plain number in the style); lines needing more takes are
  refused. Cost basis: USD 0.40 per second, the measured H3 Max reference-to-video rate (upper bound).
- **Outputs**: `video`, `seconds`, `timeline` (scenes and estimated speech), `takes`.

Source: `parts/creator-h3/src/part.mjs`, `src/prompt.mjs` (the atom's prompt) and `src/manifest.mjs`.
