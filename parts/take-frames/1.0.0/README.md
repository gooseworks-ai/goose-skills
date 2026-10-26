# take-frames 1.0.0

The first and last frame of a creator take, drawn with GPT Image 2 (edit) on fal from the cast picture and the
real product photo. Two paid pieces, about $0.38 a run.

- **first_frame**: the creator holds the product up high beside the face, its front label to the lens, its bottom
  edge no lower than the chin, so the bottom third of the frame (the caption band) shows only their top. The use
  scene's `extra.before` ("the cap is closed") is added when the plan has one.
- **last_frame**: an edit of the first frame (with the product photo again): the same photo with one change, the
  use scene's `extra.after` ("the lime green flip cap is flipped open").
- **The use** is the last plan scene tagged with one of `use_tags` (default `["use"]`, matched on `extra.shot` or
  a leading "Tag:"). A plan with no use scene, a use scene with no `extra.after`, no product photo or no cast
  picture is refused before anything is ordered.
- `template`: a JSON file with `first` and `last` texts to replace the defaults (placeholders `{look}`, `{name}`,
  `{product.name}`, `{before}`, `{after}`; any other placeholder is refused).

Why: a generated creator take (H3 Max) ignores framing words. In GOOSE-4034 a tall bottle drifted into the caption
band, 5 of 5 takes came out mirrored, and the cap vanished under her fingers in 2 of 2 takes. Started on
`first_frame` and ended on `last_frame` (video-h3max 1.5.0), a Graza take was not mirrored, held the bottle clear of
the captions while she spoke and kept the cap visible as it opened. Split into a line take and a use take joined
on `first_frame` (video-h3max 1.5.0 mode takes), the bottle stayed high throughout.
