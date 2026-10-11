# image-gpt-image-2 1.0.0

Photoreal stills from OpenAI GPT Image 2 on fal, one paid piece per image. Use it for **realistic people**: an AI
creator, a spokesperson, a keyframe of a person holding the real product. It shares its scenes mode with
image-nano-banana 1.1.0 (`parts/_lib/scene-stills.mjs`).

- **Paid piece** per still, through the private line only: fal `openai/gpt-image-2` (prompt alone) or
  `openai/gpt-image-2/edit` (with references), body `{prompt, image_urls?, image_size: {width, height}, quality,
  num_images: 1, output_format: "png"}`. References are FileRefs; the core hosts them, so the piece hash follows the
  model, the prompt and the references' bytes, not their links.
- **`model`** is the most the step may use. `openai/gpt-image-2/edit` (the default) sends a piece with references
  to `/edit` and draws a piece with none from the prompt alone. `openai/gpt-image-2` never sends references.
- **`size`**: `1024x1024`, `1024x1792`, `1088x1920` (default, vertical 9:16) or `2304x1296`. Sent as fal's
  `image_size` on every piece, because the text model's own default is landscape and the edit model's is `auto`.
  `cast_size` sets the anchors' size (default: `size`).
- **`quality`**: `low`, `medium` or `high` (default). It changes fal's price; see Cost.
- **No `seed`**: GPT Image 2 takes none, so the part refuses one.
- **PNG out**: a result whose bytes are not PNG is re-encoded to PNG.

## images mode

- `images: [{id, prompt, references}]`, one piece `image-<id>` each.
- With `model: openai/gpt-image-2`, an entry with references is refused before anything is ordered.
- Scenes- and cast-mode inputs are refused in this mode.

## scenes mode

The same rules as image-nano-banana 1.1.0. Inputs: `scenes` (plan.scenes, max 40), `template`, `look`, `answers`,
`brand`, `cast`, `products`, `pick`, `skip_first`, `skip_last`, `anchor`, `style_refs`, `multi_ref`, plus `size`,
`cast_size` and `quality`.

- **Which scenes**: `skip_first`/`skip_last`, then `pick` (`all`, `first`, `with_picture` or `{tags: [...]}`).
- **Prompts** are filled from the template before anything is ordered. A scene the template cannot fill refuses the
  step with `bad_input`. Without a template a scene's prompt is its picture text.
- **A scene's line may be null**; `line`, `on_screen` and `picture` are all optional.
- **References per scene**, at most 10: the named members' anchors (up to 3, or one strip with `multi_ref: strip`,
  the default, when the scene names more than one), the first photo of each named product, the scene's own picture,
  the first scene's still (`anchor: first_scene`), then `style_refs`.
- **anchor**: `none` (default), `cast` (draw a portrait for each named member without an image, first) or
  `first_scene`. Both need `/edit`.
- **Pieces**: `anchor-<member key>` and `image-<scene id>`, so a fix can reuse the scenes it did not change. Up to 4
  pieces run at once; after a failure no new piece starts.
- **Outputs**: `images [{id: scene id, image}]`, `scenes` (every input scene, `image` = its still), `cast` and
  `anchors [{id: key, image}]`, always all four.

## cast mode

`{cast}` alone (or `mode: "cast"`): only the cast portraits, for a later step that animates the creator.

- A member with an `image` passes through free. A member without one is drawn from its `look`, at `cast_size`, as
  piece `anchor-<key>`. A member with neither is refused before anything is ordered.
- Without a template the portrait text is a plain phone photo of one real person, chest up, looking into the lens,
  on a plain wall, hands empty. A template's `anchor` text (with its `prefix`, `suffix` and `negative`) replaces it.
- Optional: `template`, `look`, `answers`, `brand`, `style_refs` (needs `/edit`), `size`, `cast_size`, `quality`.
- **Outputs**: `images: []`, `cast` (every member, `image` filled) and `anchors` (every member, `{id: key, image}`).

## Cost

fal meters GPT Image 2 in token "units" (1 USD per unit), so the price depends on size, quality and the reference
pictures. A high-quality 1088x1920 still is about USD 0.19. The `cost` block is documentation only; the style's own
`cost` block is the quote.

Source: `parts/image-gpt-image-2/src/part.mjs` and `parts/_lib/scene-stills.mjs`, built with
`node parts/_tools/bundle.mjs image-gpt-image-2 1.0.0`.
