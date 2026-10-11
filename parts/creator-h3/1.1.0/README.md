# creator-h3 1.1.0

An AI creator saying the approved lines to camera, as one continuous track (D6: the default talking creator
for scripted lines; `video-seedance-2` is for short scenes with native audio). From create-creator-takes-h3.
1.1.0 reads the creator from the plan cast, takes a `delivery` and brand pronunciations, and can keep every
take join under a cutaway. Every 1.0.2 input still works the same way.

- **Creator from the cast** (`cast`, new): `plan.cast`, or an anchor step's `cast` with pictures filled. The
  creator is the member the spoken scenes name as `speaker`, else the first member with a picture. The
  identity is written from the member: "a 34-year-old woman, <look>"; `environment` and `delivery` come
  from the member too. Refused: a speaker not in the cast, two different speakers (one creator says every
  line), a member with no picture, and cast and `character` given together.
- **Character** (`character`, now optional): the approved still and its words (`identity` with age and
  gender, `environment`, optional `delivery`), used when there is no cast. Either way, an identity that is a
  placeholder or states no age or gender is refused: there is no default person.
- **Delivery** (`delivery`, new): how they speak, usually `plan.answers.delivery`. It wins over the member's
  or the character's own delivery; the atom's default is used when none is given.
- **Pronunciations** (`pronunciations`, new): `brand.pronunciations`. Each term is said as its `say_as` (one
  pass, whole words, any case, longest term first; the same swap as voice-elevenlabs). The swap is in the
  take dialogue only: `timeline.speech[].text` keeps the written words and `spoken` holds the said form.
- **Takes**: the lines split between lines, never inside one, under H3's 15 s cap; each take runs 0.6 s past
  its last word, rounded up to whole seconds (5 to 15). Plan scenes carry no timings, so line lengths are
  estimated from the spoken words at `words_per_second` (default 2.6). Scenes with no line are skipped.
  Square brackets in a line are refused (H3 speaks them).
- **Joins under cutaways** (`split_before: cutaways`, new; default `none`): a take may start only at a
  cutaway, so the join can hide under it. A scene is a cutaway when its `extra.shot` is set and is not
  `creator`, when a `footage` entry (`plan.footage`) names it by `scene_id`, or when it has a scene `image`.
  A silent cutaway counts for the next spoken line. The lines from one cutaway to the next are an on-camera
  run that must fit one take; a longer run is refused before anything is ordered ("add a cutaway scene
  between them or cut words"). In this mode the timeline starts the scene a later take begins on 0.15 s
  before its join, so an insert on that scene covers the dissolve.
- **Paid pieces**, one per take, through the private line only: fal `minimax/h3-max/reference-to-video` with
  the atom's payload: `{prompt, duration, resolution, aspect_ratio, seed, prompt_expansion_mode: "disabled",
  reference_image_urls: [still], reference_video_urls?: [mannerism], reference_audio_urls?: [t1 voice]}`. The
  prompt is the atom's template word for word. Seeds come from the kit's per-piece seed. Pieces are named
  `take-t<n>`, not by scene: a take covers several scenes, so a fix never reuses it as one scene's piece.
- **Voice chain**: t1 is ordered first; its first 12 s of voice (mono, 24 kHz) is the reference audio of
  every later take, so the takes sound like one recording.
- **Join**: join_takes's estimated schedule (each take at its planned start, speech onset measured), 0.10 s
  dissolves, one filter graph (never the concat demuxer). Line spans in the timeline are estimates: the
  captions layer and the check layer transcribe the real speech (the one quality path, check-layer).
  Measured joins come in 1.2.0.
- **Price before anything runs**: `max_seconds` (a plain number in the style); lines needing more takes are
  refused. `cost.rates_usd` (USD 0.40 per second, an upper bound) is documentation only: the quote is the
  style's own `cost` block, and the line prices H3 from fal's live list.
- **Outputs**: `video`, `seconds`, `timeline` (scenes and estimated speech), `takes` (each later take adds
  `joins_s`: the reel second its 0.10 s dissolve from the previous take starts).

Source: `parts/creator-h3/src/part.mjs`, `src/prompt.mjs` (the atom's prompt) and `src/manifest.mjs`.
