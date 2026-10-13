# image-nano-banana 1.3.0

Stills from Nano Banana on fal, one paid piece per image. 1.1.0 added **scenes mode**: one still per plan scene,
with the prompt filled from the style's template and the references picked from the plan. 1.2.0 adds **products
mode**: edits of each product's own photo (a snap still, a three-quarter angled still) for range and grid cards.
1.2.1 names a refused still in the log: which piece, what it was for (a cast member's picture, a scene's still,
a product still), the model, the reference count, the reason (the provider's words when the server passes them on)
and the start of the prompt, with links cut to their origin and path and secret-looking values blanked. The step
still fails as before. 1.2.2 adds **locked scene images** in scenes mode: a picture already approved is the
final still, not redrawn. 1.2.3 adds **borders**: product photos are trimmed before they are sent, and a still
that comes back letterboxed, padded or framed is cropped, or fails the step (never drawn a second time).
1.3.0 adds **cast mode**: only the cast portraits, with no scene stills, for a style whose video step wants
one reference picture per person.

- **Paid piece** per still, through the private line only: fal `fal-ai/nano-banana` (prompt alone) or
  `fal-ai/nano-banana/edit` (with references), body `{prompt, image_urls?, aspect_ratio?, seed?, num_images: 1,
  output_format: "png"}`. References are FileRefs; the core hosts them, so the piece hash follows the model, the
  prompt and the references' bytes, not their links.
- **PNG out**: a result whose bytes are not PNG is re-encoded to PNG (today's create-image-fal rule).

## images mode (the 1.0.1 behaviour)

- `images: [{id, prompt, references}]`, one piece `image-<id>` each.
- The part refuses references without `/edit` or `/edit` without references, before anything is ordered.
- Scenes-mode inputs are refused in this mode.
- `mode` is `images` when `images` is given without `scenes`. With neither, `cast` alone now picks cast mode.

## scenes mode

Inputs: `scenes` (plan.scenes, max 40), `template` (a style's `frames/<name>.prompt.json`, see
`parts/_lib/prompt.mjs`), `look`, `answers`, `brand`, `cast`, `products`, `pick`, `skip_first`, `skip_last`,
`anchor`, `cast_aspect_ratio`, `style_refs`, `multi_ref`, `seed`.

- **Which scenes**: `skip_first`/`skip_last` drop scenes at the plan's ends, then `pick` chooses `all` (default),
  `first`, `with_picture` or `{tags: [...]}`.
- **Prompts**: filled from the template before anything is ordered. A scene the template cannot fill (a missing
  `{answers.KEY}`, a member with no look, a banned phrase) refuses the step with `bad_input`. Without a template a
  scene's prompt is its picture text. The template's negative is added as "Avoid: ...".
- **A scene's line may be null** (an end card, a silent beat); `line`, `on_screen` and `picture` are all optional.
- **References per scene**, at most 10, in this order: the named members' anchors, the first photo of each named
  product, the scene's own picture, the first scene's still (`anchor: first_scene`), then `style_refs`. The
  template's `refs` (and `by_tag`) choose the first three and its `max_refs` caps those three only; the first
  scene's still and `style_refs` are step inputs and always fit. With `/edit`, a scene with no reference is drawn by
  the prompt-only model.
- **multi_ref** (`strip` by default): a scene that names more than one member gets one strip of all their
  anchors side by side (up to 10), and the prompt says which reference it is and asks for one seamless scene
  with no panels. Several separate character references make nano-banana/edit average the silhouettes (measured
  2026-10-01). `list` sends up to 3 separate pictures instead.
- **anchor**: `none` (default; members with an image are still sent), `cast` (draw a portrait for each named
  member without an image, before the scenes, from the template's `anchor` text at `cast_aspect_ratio`,
  default 1:1), or `first_scene` (the first still is a reference for every later one). Both need `/edit`.
- **Pieces**: `anchor-<member key>` and `image-<scene id>`, so a fix can reuse the scenes it did not change.
  Up to 4 pieces run at once; after a failure no new piece starts.
- **Outputs**: `images [{id: scene id, image}]`, `scenes` (every input scene, `image` = its still), `cast`
  (every member, `image` filled; members with an image pass through free) and `anchors [{id: key, image}]`.
  Scenes mode always returns all four; `cast` and `anchors` are empty lists without a cast.

### Locked scene images (1.2.2)

- A scene with `image_locked: true` and an `image` file keeps that image as its still, as is: nothing is ordered
  for it and its prompt is never filled, so it cannot refuse the step. A PNG, JPEG or WebP is passed through
  untouched; any other picture (AVIF, HEIC, GIF) becomes a PNG of its first frame, free. It is used to reuse a preview the customer saw before
  the yes (the key scene of a style), so the server sets both fields; the AI never does.
- It must be a scene the step picks (`pick`, `skip_first`, `skip_last`); a locked scene the step does not pick is
  only logged. `image_locked` without an `image` refuses the step before anything is ordered.
- With `anchor: first_scene`, a locked first scene is the reference for every later still.
- With `anchor: cast`, a member named only by locked scenes gets no anchor drawn. Members other scenes name are
  drawn as before unless they have an image; to keep the people in later scenes the same as in the locked
  picture, give those members the portrait the picture was drawn from as their `image`.
- The image should already be at the step's `aspect_ratio`; it is not cropped or scaled.
- Outputs are unchanged: the locked scene's entry in `images` and `scenes` is its own image.

## products mode (1.2.0)

Inputs: `mode: "products"` (never inferred), `model: "fal-ai/nano-banana/edit"` (required: a product still is
always an edit of the real photo, never drawn from text), `products` (plan.products, max 12), `kinds` (default
`["snap"]`), `template`, `look`, `answers`, `brand`, `aspect_ratio`, `seed`.

- **One piece per product per kind**, products in order and kinds in order within each. The only reference is the
  product's first photo.
- **Kinds**:
  - `snap`: one complete product on a neutral textured surface, soft key light from the upper left, slightly above
    centre (the snap macro and the grid cell).
  - `angled`: the product turned 15-20 degrees to a three-quarter view, floating over warm white, a soft shadow to
    the lower right (the range card).
  A style that drops the range card passes `kinds: ["snap"]` and buys no angled stills.
- **Prompts**: the template's `by_tag` rule named like the kind (`Snap`, `Angled`) gives the text (`scene`) and may
  override `prefix`, `suffix` and `negative`; the top-level `prefix`, `suffix` and `negative` apply to every kind; the
  top-level `scene` text is for scenes mode and is not used. `{picture}` and `{product.name}` are the product's name,
  so a rule like `"The {product.name} exactly as in the photo, on {answers.snap_surface}"` works. A kind with no rule
  (or no template) gets the built-in text above, and with no template a built-in negative ("text, captions, hands,
  extra products, a changed label ...").
- **Refused before anything is ordered**: the prompt-only model, a product with no photo or no name, two products
  with one id, a placeholder the answers cannot fill ("the snap still of product mist needs
  {answers.snap_surface}"), and the scenes-mode inputs `images`, `scenes`, `cast`, `pick`, `skip_first`,
  `skip_last`, `anchor`, `cast_aspect_ratio`, `style_refs`, `multi_ref`. `kinds` is refused in the other modes.
- **Pieces**: `<kind>-<product id>` (`snap-mist`, `angled-mist`), so a fix reuses the products it did not change.
  Up to 4 run at once; after a failure no new piece starts.
- **Output**: `images [{id: "<product id>-<kind>", image}]` only (`mist-snap`, `mist-angled`).

## cast mode (1.3.0)

Only the cast portraits ("anchors"), one per member, and no scene still. It is for a style that hands each
person's picture to a video step as a reference and does not want to pay for a still per scene.

Inputs: `mode: "cast"` (or leave `mode` out and give `cast` with no `scenes` and no `images`), `model`
(required, as in every mode), `cast` (plan.cast, 1 to 10 members), `template`, `look`, `answers`, `brand`,
`cast_aspect_ratio` (default `1:1`), `style_refs`, `seed`.

```json
{"id": "anchor", "part": {"id": "image-nano-banana", "version": "1.3.0"},
 "inputs": {"mode": "cast", "model": "fal-ai/nano-banana", "cast": {"from": "plan.cast"},
            "template": {"asset": "frames/cast.prompt.json"}, "answers": {"from": "plan.answers"},
            "cast_aspect_ratio": "9:16"}}
```

- **Who is drawn**: every member without an `image`, in cast order. A member with an `image` passes through
  free and is never drawn again. When every member has one, nothing is ordered.
- **Prompt**: the template's `anchor` text filled with the member's `name` and `look`, with the template's
  `prefix`, `suffix` and negative ("Avoid: ...") as in scenes mode. Without a template, or with a template
  that has no `anchor` text, the kit's plain anchor text is used ("{look}. One character alone, chest up,
  facing the camera, on a plain light grey background ..."). It is the same prompt scenes mode builds with
  `anchor: cast`.
- **Model**: a portrait has no reference, so it is drawn by the prompt-only `fal-ai/nano-banana`, whichever
  `model` the step gives. This is how scenes mode draws its anchors. Only when `style_refs` are given does a
  portrait go to `fal-ai/nano-banana/edit` with those pictures, and that needs `model` set to `/edit`.
- **Shape**: `cast_aspect_ratio`, default `1:1`. A vertical video wants `9:16`. `aspect_ratio` is the scene
  stills' shape and is refused here, so a portrait is never square by mistake.
- **Refused before anything is ordered**: an empty or missing `cast`, two members with one key, a member to
  draw with no `look`, a placeholder the answers cannot fill, `style_refs` with the prompt-only model, and the
  inputs of the other modes: `images`, `scenes`, `products`, `pick`, `skip_first`, `skip_last`, `anchor`,
  `multi_ref`, `aspect_ratio`, `kinds`, `borders`.
- **Pieces**: `anchor-<member key>`, the same names scenes mode uses. Up to 4 run at once; after a failure no
  new piece starts. A portrait is not measured for borders.
- **Outputs**: `images` (always an empty list), `cast` (every member in order, `image` filled, other fields
  untouched) and `anchors [{id: key, image}]` (every member with a picture). A style binds
  `step.<id>.cast` into its video step. There is no `scenes` output in this mode.

### Borders (1.2.3, scenes and products mode)

An edit model fed a padded product photo often copies the padding, letterboxes the still or draws the product
as a framed card. With `borders: "fix"` (the default):

- **Before sending**: each product photo's flat margins (one colour, or transparent, at least 99.5 % of a line)
  are trimmed, nothing padded back, once per photo, free. A photo with nothing to trim is sent as it is.
- **After each still**: it is measured. A **band** is a flat strip (spread under 3, mean within 6 of the edge)
  of at least 2.5 % of a side that ends on a straight edge (the next line differs from it across 90 % of its
  length), matched by the same colour on the opposite side (a letterbox or pillarbox), or alone in pure white
  or black. A **frame** is such a ring of at least 1.5 % on all four sides around a picture that is not flat.
  A product on a seamless backdrop, a tall product on a plain studio colour and a wall above a table edge are
  none of these.
- A still with a band or frame is **cropped** to the largest box of the still's own shape inside the picture,
  scaled back to the still's size (so a video step gets the frame shape it expects), when that keeps at least
  75 % of it. Otherwise a letterbox or a frame fails the step (`output_invalid`): "The picture for scene N came
  back with a border; change the scene picture and try again." A lone white or black strip that cannot be
  cropped is kept as drawn, with a warning (it may be a plain wall or sky).
- A still is **never drawn a second time** here: that would be a paid piece the quote does not hold. Remaking
  a still for a defect our check found is the line's job, free to the customer, once the line can record a
  free piece.
- `borders: "keep"` turns both off (a style that wants a framed picture). Images mode is unchanged and refuses
  `borders`. Locked scenes and cast anchors are never measured.

## Cost

fal list price USD 0.039 per image for both paths (0.0398 recorded on 2026-10-12). The `cost` block counts `images` (images mode); in scenes mode
one run is one image per picked scene plus one per drawn anchor; in products mode it is products x kinds (3 to 5
products with `[snap, angled]` is 6 to 10 images, about USD 0.24 to 0.40 at the recorded 0.0398 per image); in cast mode it is one image per member without a
picture, which the part's own `cost` block does not count (it counts the `images` input), as in scenes and
products mode. The style's own `cost` block is the quote.

Source: `parts/image-nano-banana/src/part.mjs` and `parts/_lib/scene-stills.mjs`, built with
`node parts/_tools/bundle.mjs image-nano-banana 1.3.0`.

