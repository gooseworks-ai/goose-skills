# assemble 1.2.1

**1.2.1:** a still clip may carry `keep_clear`, where the product is as shares of the picture (up to 8 boxes). Each box is moved onto the cut the way `fit` places the still, grown to cover the Ken Burns push, and returned in `timeline.keep_clear` for that clip's span, so captions-layer 1.4.0 and later keep the captions off the product. Use it only when the style's captions layer is on (the later layers refuse the field). Without it the cut and timeline are 1.2.0's.

Joins scene clips and stills, in order, into one cut. Free. The assembler from stitch-videos-ffmpeg's montage.
Everything 1.1.0 does is unchanged; the new inputs are all optional. `clips` is no longer required: give `clips`,
or `shots` with `sources` and `scenes`.

## What 1.1.0 already does

- Every cut is scaled to `width` x `height` (`cover` crops to fill, `contain` pads with `background`), one `fps`
  (default 30), square pixels, yuv420p, an exact frame count, hard cuts through the concat filter.
- `spans` (a voice or song step's `scenes`) time each picture to its line; `silent` handles scenes with no line;
  `tail_s` holds the last picture. `speech` or a whole `timeline` passes through, so captions skip transcription.
- `ending`, `ending_timeline` and `ending_fills` (`after` or `last_span`) join the end card and mark
  `timeline.end_card`. `motion: {stills: ken_burns}`, `grade: phone-grain | phonecam`.
- Size rule: the final encode is capped at 16 Mbps (8 Mbps with grain); a cut over 180 MB is refused.

## New in 1.2.0

- **Shot recipes per scene tag.** `shots` maps a tag to the shots that fill a scene's span, in order. A scene's tag
  is `extra.shot`, else a leading `Tag:` in its picture (compared without case or spacing). `*` catches every
  other tag; a scene with no recipe is refused before anything is encoded. Shots need `scenes` (plan.scenes) and
  `spans`; a scene with a null line shares the span before it, as `silent` says.
- **Sources.** `sources` names what shots draw from, each bound whole from a step: a list of pictures or clips by
  id (`step.<id>.images`, `step.<id>.clips`) or one video or picture (`step.<id>.video`).
- **Shot kinds.**
  - `still`: a picture. `of: scene` (the default without `variant`) takes the item with the scene's id; `of: named_product` takes the
    product the scene's picture names (the default with `variant`; else its line, else the product at the scene's place among scenes with its
    tag) and the item `<product id>-<variant>`; `of: first` takes the first item.
  - `clip`: the scene's clip from a list. `speed` fixes the speed; else `min_speed` and `max_speed` (default 1;
    one given alone past 1 sets both) bound the speed that makes the clip fill its time; min above max is refused. Short clips hold their last frame. `in_s` sets the start.
  - `video`: one video source (a card), from `in_s`; without `seconds` or `fill` it runs its own length.
  - `montage`: one frame of each clip used so far from the source (else every clip in it; a picture in a clip list
    counts as a clip), `seconds` each, at
    `at` (default 0.5) of each clip's used part, joined by `transition` (`cut`, `fade` or `hlslice`,
    `transition_s` default 0.1). `max` caps the frames.
  - `freeze`: one frame of a clip held: `pick: last` (default) or `first` clip used so far (the
    source's own last or first clip when none is used yet), or the scene's own.
  - `zoom: [from, to]` pushes or pulls a still, a freeze or montage frames, centred. Without it,
    `motion: {stills: ken_burns}` still pushes `still` shots.
  - **Timing.** Shots with `seconds` run that long; the one with `fill` (else the last) takes the rest. When the
    others leave it under 0.5 s (or `snap.min_shot_s`), they are squeezed by the same factor. `skip_first` leaves a
    shot out of the first scene with its tag (its snap was the hook).
- **Marks.** A shot with `mark: <kind>` adds `{kind, at_s}` to the `marks` output at its start, for
  audio-mix's `marks` and `mark_sounds` (a click on every snap still). `marks` is always present, empty when no
  shot has one.
- **Cuts between words.** `snap: {max_shift_s: 0.4, min_shot_s: 0.55}` moves a cut that lands inside a word of
  `speech` to the frame before the word starts or after it ends, whichever is nearer, when that is within
  `max_shift_s` and both shots keep `min_shot_s` (or what they had). Speech without word timings moves nothing. Needs `spans` or `shots`: with a `timeline` passed through and no
  `spans`, snap is refused, since those scenes are kept as they are.
- **card_from.** `{tag: 'Grid'}` (the first scene with that tag; needs `scenes`) or `{scene_id}` starts
  `timeline.end_card` at that scene, so a grid + offer card and the end card form one card span with no captions.
  The card span is never graded. A tag no scene has leaves the card span as it was; an unknown scene id is refused.
  Works with `clips` and `spans` too (clip ids are scene ids).
- **Outputs**: `video`, `seconds`, `timeline` (scenes by scene id, speech, `end_card`, `safe_zones`), `marks`.
- Captions and loudness are the layers' jobs.

Source: `parts/assemble/src/part.mjs`, `src/shots.mjs`, `src/cuts.mjs` and `src/manifest.mjs`.
