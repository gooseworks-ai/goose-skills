# video-seedance-2 1.2.0

Short Seedance 2.0 clips on fal, one paid piece per clip (D6: for short scenes with native audio; the default
talking creator for scripted lines is `creator-h3`). 1.1.0 adds **image-to-video**, **prompt templates** filled
from the plan, a **`seed`** input, **one clip per plan scene**, and a top-level **`video`** output. 1.2.0 adds the
**`take`** and **`takes`** modes: whole takes written from plan scenes as time-windowed beats, joined into one
**`video`** with a **`timeline`**.

## Models (`mode`)

- **`reference`** (default): fal `bytedance/seedance-2.0/reference-to-video`, body `{prompt, image_urls,
  resolution, duration (integer 4 to 15), aspect_ratio, generate_audio, seed}`, as in 1.0.1. A 1.0.1 clip list
  orders byte-identical pieces, so nothing is billed again.
- **`image_to_video`**: fal `bytedance/seedance-2.0/image-to-video`, body `{prompt, image_url, end_image_url?,
  resolution, duration ("4" to "15", a string as fal's schema and the shipped hypermotion call send it),
  aspect_ratio, generate_audio, seed}`.
  - `clips[].start_image`: `"product"` (the first photo of the product the clip names, else of the first
    product with a photo) or a FileRef. Without it, the template's refs pick the scene's picture, then a
    product photo, then a cast member's picture. No start frame refuses the step.
  - `clips[].end_image`: `"start"` (the clip lands back on its start frame) or a FileRef.
  - `references` are refused in this mode; `start_image`/`end_image` are refused in `reference` mode.
- References and frames are FileRefs the core hosts. `seed` is the kit's per-piece seed: fal's schemas do not
  list it, but the street-interview runs send it to Seedance and get it honoured.

## Clip lists

- **`clips`** (the 1.0.1 list): `[{id?, prompt?, references?, start_image?, end_image?, seconds, generate_audio?}]`,
  one piece `clip-<id>` each, at most 12. `prompt` is up to 12,000 characters and may use the template
  placeholders (`{answers.KEY}`, `{product.name}`, `{brand.name}`, `{look}`, ... see `parts/_lib/prompt.mjs`).
  Without a `prompt`, the template's `templates.<clip id>`, else its `motion`, else its `scene` text is used.
  A clip whose id is a plan scene id fills `{picture}`, `{line}` and `{on_screen}` from that scene.
- **`scenes`** without `clips`: one clip per picked scene (`pick`, `skip_first`, `skip_last`, at most 12),
  each `seconds` long (default 5), prompt from the template's `motion` (else `scene`), piece `clip-<scene id>`.
  Scene `line`, `on_screen` and `picture` may be null.

## Prompts

- Inputs for filling: `template` (a style's `frames/<name>.prompt.json`), `look`, `answers`, `brand`, `cast`,
  `products`, `scenes`. The template's `prefix` and `suffix` wrap every prompt and its `negative` is added as
  "Avoid: ..." (Seedance has no negative prompt). Filled text has its whitespace tidied.
- **Every prompt is filled before the first piece is ordered.** A missing `{answers.KEY}`, an unknown look, a
  banned phrase, an unknown placeholder or a prompt over 12,000 characters refuses the step with `bad_input`.
- A prompt with no template and no placeholder goes as written (the 1.0.1 behaviour).
- `{product.name}` is the product the scene's picture names, else the plan's only product; with several
  products and no scene naming one, a prompt that uses it is refused.
- In `reference` mode, a clip without `references` gets the template's refs from the plan: the named cast
  members' pictures, the named products' first photos, the scene's own picture (at most 9).

## Takes (`mode: take` and `mode: takes`, 1.2.0)

Both modes write each take's prompt themselves from `scenes`, call `reference-to-video` once per take (piece
`take-t1`, `take-t2`, ...) and refuse `clips`. Every prompt is written, and every limit checked, before the first
piece is ordered.

- **`take`**: one take of the picked scenes (`pick`, `skip_first`, `skip_last`), **at most 4 beats**. For one
  creator talking to camera with the product (ugc-product).
- **`takes`**: `takes: {count (1-4), first, later}`. Scenes split by `scene.extra.take` (1-based, in plan order;
  all picked scenes or none), else evenly in order. At most 8 beats a take. For a street interview.
- `seconds`: each take's length, 4 to 15 (default 15). `words_per_second` (default 2.5) and `max_words` (default
  `seconds x words_per_second`): a take with more spoken words is refused, and so is one whose beats need more
  time than it has.

### The prompt

```
<prefix> <the take's own text> Beat 1 (0-5.5s): <beat text> Maya says: "<line>" Beat 2 (5.5-7.5s): ... <suffix> Avoid: <negative>
```

- The take's own text: `templates.take` in mode `take`; `templates[takes.first]` (default `first`) for take 1 and
  `templates[takes.later]` (default `later`, else the first's) for later takes, so a question is asked once.
  A `takes.first` or `takes.later` the template lacks is refused.
- Beat text: `templates.beat`, else the scene's `by_tag` scene text, else `scene` (default `{picture}`).
- Beat windows: a spoken beat needs its words at `words_per_second` plus 0.5 s, a silent beat (a null line)
  1.5 s; the needs are stretched to fill the take and the edges put on half seconds.
- Dialogue: `<Name> says: "<line>"` is added after the beat text, unless that text places `{line}` itself.
  Name = the speaker's cast name, else `The <speaker key>` (an off-screen interviewer), else the only cast
  member's name. `pronunciations` (default `brand.pronunciations`) rewrite brand terms as they are said.
- **Mode `take` only:** a beat that keeps the face off screen (its tag is in `off_screen_tags`: rear,
  rear-camera, macro, hands, cutaway, ...; or its picture says "face off-screen", "rear camera", "no face") may not
  carry a line: Seedance would fake a talking mouth. `off_screen_lines: voiceover` writes it as
  `Voice-over from <Name>, lips not on screen: "<line>"` instead of refusing.
- References: the cast pictures, product photos and scene pictures every beat names, in the template's `refs`
  order, at most `max_refs` (9).
- The template's `banned` phrases, unknown placeholders and the 12,000-character cap are checked on every take.

### Chain

`chain: {crop: "bottom_45", at_s?}` (mode `takes`): after take 1, one frame at `at_s` (default 0.5 s) is cropped
to its bottom 45% (below every face) and added after the plan references of every later take, so with one
product photo it is `@Image2`. Later takes share take 1's street, props and microphone. Chained takes run in
order. There is no face check on the crop: keep faces in the top half of take 1.

### Outputs

- `takes: [{id, video, seconds}]` (id `t1`, ...), and `clips` the same list.
- `video`: one take as it came back, or every take joined in order with hard cuts at the first take's size and
  frame rate, native audio kept (bitrate capped at 16 Mb/s; a join over 180 MB fails).
- `timeline`: `scenes` are the plan scene ids at their beat windows, scaled to each take's real length and
  placed at the take's start in the joined video; `speech` is empty, so the video is transcribed once
  (critic #23).
- `seconds`: the video's length.

## Seed

`seed` (a style binds `plan.answers.take`) is mixed into every clip's seed by the kit, so a new seed is a new
piece: a fix that changes it re-rolls the clip, and nothing else is billed again.

## Outputs

- `clips: [{id, video, seconds}]` (id = the clip id, or the scene id), for `assemble` (keep their sound) and the
  check layer's speech check.
- `video`: the first clip's video, for one-clip styles (`step.<id>.video`).
- A clip that should have native audio and comes back without it fails (`provider_failed`). A policy refusal is
  final for that exact clip.

## Cost

Documentation only (critic #17); the style's own `cost` block is the quote. Both models are metered in tokens
(width x height x fps x seconds / 1024 at USD 0.014 per 1000): about USD 0.68 per second at 1080p 9:16, 0.30 at
720p, 0.18 at 480p; wider aspects cost more. The `cost` block sums `clips[].seconds`; in scenes mode one run is
`seconds` x the picked scenes; in modes `take` and `takes` it is `seconds` x the takes.

Source: `parts/video-seedance-2/src/part.mjs`, `src/takes.mjs` and `src/manifest.mjs`, built with
`node parts/_tools/bundle.mjs video-seedance-2 1.2.0`.
