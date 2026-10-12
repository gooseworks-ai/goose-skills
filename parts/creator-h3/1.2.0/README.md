# creator-h3 1.2.0

An AI creator saying the approved lines to camera, as one continuous track (D6: the default talking creator
for scripted lines; `video-seedance-2` is for short scenes with native audio). From create-creator-takes-h3.
1.1.0 reads the creator from the plan cast, takes a `delivery` and brand pronunciations, and can keep every
take join under a cutaway. 1.2.0 joins takes on their measured speech and adds a silent `clips` mode. Every
1.1.0 input still works; set `join: planned` for 1.1.0's join schedule.

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
  Only a spoken cutaway counts: a silent scene has no span on the timeline, so it cannot cover a join. The
  lines from one cutaway to the next are an on-camera run that must fit one take; a longer run is refused
  before anything is ordered ("make a spoken scene between them a cutaway or cut words"). In this mode the
  timeline starts the scene a later take begins on 0.15 s before its join (earlier scenes give way, each
  keeping at least 0.05 s), so an insert on that scene covers the dissolve.
- **Paid pieces**, one per take, through the private line only: fal `minimax/h3-max/reference-to-video` with
  the atom's payload: `{prompt, duration, resolution, aspect_ratio, seed, prompt_expansion_mode: "disabled",
  reference_image_urls: [still], reference_video_urls?: [mannerism], reference_audio_urls?: [t1 voice]}`. The
  prompt is the atom's template word for word. Seeds come from the kit's per-piece seed. Pieces are named
  `take-t<n>`, not by scene: a take covers several scenes, so a fix never reuses it as one scene's piece.
- **Voice chain**: t1 is ordered first; its first 12 s of voice (mono, 24 kHz) is the reference audio of
  every later take, so the takes sound like one recording.
- **Join** (`join`, new; default `measured`): each take's speech is measured with ffmpeg's silence detector
  (`silencedetect=noise=-35dB:d=0.03` over the whole take): the onset is the end of a silence that opens
  the take, and the last word ends where the silence that runs to the end of the take begins. Each later
  take is placed so its first word comes 0.25 s after the previous take's last word (the dissolve never
  starts before 0.03 s after that word), and the reel ends 0.6 s after the last word (never past the last
  take). A take whose voice runs to its very end holds its last frame up to 0.5 s to reach its join. A take
  with no speech heard fails as `provider_failed`. `planned` keeps 1.1.0's schedule exactly: each take at its
  estimated start, speech onset read from the take's first 3 s, and the join never sooner than the previous
  take's estimated last word minus the dissolve. Either way every join is floored: at least two dissolves
  after the previous take's start, and at least 0.05 s per earlier line plus 0.15 s from the reel start (so
  each earlier scene keeps a span and the cutaway scene can start before the join). Either way: 0.10 s
  dissolves, one filter graph (never the concat
  demuxer). Line spans in the timeline are estimates (measured: spread over each take's measured speech,
  first word to last word): the captions layer and the check layer transcribe the real speech (the one
  quality path, check-layer).
- **Clips mode** (`mode: clips`, new; default `talk`): one silent clip per picked scene (`pick`, `skip_first`,
  `skip_last`, as in the shared scene picker), for silent action moments such as day in the life. Each clip
  opens on its scene's keyframe from `images` (`step.<keyframes>.images`, by scene id; `image_url`, and the
  first of `reference_image_urls`). The prompt is the style template's `motion` text (or the text `use`
  names), filled per scene (`look`, `answers`, `brand`, `cast`, `products`); the template's `refs` add the
  named cast and product pictures after the keyframe (12 at most). With no template, a plain silent-motion
  text from the scene's `picture` is used. A tag the step picks by (`pick: {tags: [Moment]}`) is dropped
  from `{picture}`. Every clip is `seconds` long (default 5): the provider's sound is dropped and the clip is
  cut to that length. Pieces are `clip-<scene id>`, ordered three at a time. Refused before anything is
  ordered: a picked scene with no keyframe, a template gap, no scene picked, clips past `max_seconds`, and
  a talk-only input (`character`, `delivery`, `pronunciations`, `split_before`, `footage`, `mannerism`,
  `words_per_second`, `join`); clips-only inputs are refused in talk mode.
- **Price before anything runs**: `max_seconds` (a plain number in the style); lines needing more takes, or
  more clip seconds, are refused. `cost.rates_usd` (USD 0.40 per second, an upper bound) is documentation only: the quote is the
  style's own `cost` block, and the line prices H3 from fal's live list.
- **Outputs**: talk: `video`, `seconds`, `timeline` (scenes and estimated speech), `takes` (each later take
  adds `joins_s`: the reel second its 0.10 s dissolve from the previous take starts). clips: `clips`
  (`[{id, video, seconds}]`, id = the scene id), `video` (the first clip) and `seconds` (the clips added up).

Source: `parts/creator-h3/src/part.mjs`, `src/prompt.mjs` (the atom's prompt) and `src/manifest.mjs`.
