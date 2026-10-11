# image-nano-banana 1.1.0

Stills from Nano Banana on fal, one paid piece per image. 1.1.0 adds **scenes mode**: one still per plan scene,
with the prompt filled from the style's template and the references picked from the plan.

- **Paid piece** per still, through the private line only: fal `fal-ai/nano-banana` (prompt alone) or
  `fal-ai/nano-banana/edit` (with references), body `{prompt, image_urls?, aspect_ratio?, seed?, num_images: 1,
  output_format: "png"}`. References are FileRefs; the core hosts them, so the piece hash follows the model, the
  prompt and the references' bytes, not their links.
- **PNG out**: a result whose bytes are not PNG is re-encoded to PNG (today's create-image-fal rule).

## images mode (the 1.0.1 behaviour)

- `images: [{id, prompt, references}]`, one piece `image-<id>` each.
- The part refuses references without `/edit` or `/edit` without references, before anything is ordered.
- Scenes-mode inputs are refused in this mode.

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
  template's `refs` (and `by_tag`) choose the first three. With `/edit`, a scene with no reference is drawn by
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
- **Outputs**: `images [{id: scene id, image}]`, `scenes` (every input scene, `image` = its still), and with a
  cast: `cast` (every member, `image` filled; members with an image pass through free) and
  `anchors [{id: key, image}]`.

## Cost

fal list price USD 0.039 per image for both paths. The `cost` block counts `images` (images mode); in scenes mode
one run is one image per picked scene plus one per drawn anchor. The style's own `cost` block is the quote.

Source: `parts/image-nano-banana/src/part.mjs` and `parts/_lib/scene-stills.mjs`, built with
`node parts/_tools/bundle.mjs image-nano-banana 1.1.0`.
