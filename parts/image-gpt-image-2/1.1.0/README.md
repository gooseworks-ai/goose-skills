# image-gpt-image-2 1.1.0

Photoreal stills from OpenAI GPT Image 2 on fal, one paid piece per image. Use it for **realistic people**: an AI
creator, a spokesperson, a keyframe of a person holding the real product. It shares its scenes mode with
image-nano-banana 1.1.0 (`parts/_lib/scene-stills.mjs`). Its shots mode (1.1.0) makes locked-camera stop-motion
frames: one plate per shot, every later frame an edit on it, the plate's own pixels put back, and a closing shot
re-lit from one light picture.

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
- **`restore`** and **`relight`** work only in shots mode; scenes, images and cast modes refuse them.
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

## shots mode (1.1.0)

`mode: "shots"` (only when asked for): locked-camera shots, for a film where the same place changes one thing per
cut. Inputs: `scenes` (plan.scenes), `template`, `look`, `answers`, `brand`, `products`, `pick`, `skip_first`,
`skip_last`, `style_refs`, `restore`, `relight`, plus `size` and `quality`.

- **Shots come from `scene.extra.group`.** Scenes with the same group share one locked camera, whether or not they
  sit next to each other in the plan. A scene with no group is a shot of its own, named by its scene id.
- **A shot's first scene is its plate**, drawn from its words (`templates.plate`, else `scene`). It sends a product
  photo only when its own words name the product, so an empty place stays empty. With no reference it goes to the
  prompt-only model.
- **Every later scene is an edit** (`templates.state`, else `scene`) on, in order: the plate, the frame just before
  it (as drawn), the first photo of each product it names (by the template's `refs`, as in scenes mode), its own
  picture file, then `style_refs`; at most 10, and the plate and the frame before always fit. The prompt says which
  reference is which. The frames of one shot are made in order; up to 4 shots run at once. After a failure no new
  frame starts.
- **`extra.repeat_of`** names an earlier picked scene. That scene's finished frame is reused, free (a callback, the
  first place again). A repeat of a repeat resolves to the first. It is drawn by no shot.
- **`restore`** (default `true`): after a shot is drawn, its plate's own pixels go back wherever a frame did not
  change. A port of the stop-motion recipe's `restore_plate.py` (`src/plate.mjs`, free): Pillow's Gaussian blur
  (sigma 6) on both, the best of three exposure gains, changed = colour distance over 26, a 7x7 opening, regions
  under 0.15 % of the frame dropped, holes filled, grown 36 px, feathered (sigma 18), blended. The surface is then
  the same pixels in every frame of the shot. A full-size run matched the Python script on every pixel. A frame
  whose size is not the plate's is left as drawn, with a warning. Only for a locked camera and an empty plate.
- **`relight`** (default `false`): a shot made only of repeats is the first place again in another light (the
  stop-motion film's closing night shot). A port of the recipe's `relight.py` (`src/plate.mjs`):
  - **Which shots.** Repeat scenes sharing an `extra.group` that no drawn scene has (or one repeat with no group,
    alone) make a relit shot. A repeat inside a drawn shot (a callback) stays a plain repeat. A relit shot whose
    first scene has no picture words also stays plain, with a log line.
  - **The light picture** (one paid piece per relit shot, `light-<first scene id>`): an edit on the source shot's
    plate, from `templates.light` (with the template's prefix, suffix and negative) or a default text, where
    `{picture}` is the first scene's words ("the same hob at night, one warm lamp from the left"). It is never shown.
  - **The multiply** (free): the light picture over the source plate, both blurred very wide (Pillow sigma 90),
    split into a brightness (clamped 0.05 to 2) and a colour tint (clamped 0.8 to 1.3). Each relit scene is its
    source's finished frame (restored) times that field, so the geometry cannot drift and the product is the same
    pixels. It dims and tints; it cannot add a lamp that casts new shadows. A light picture of another size is
    scaled first. The arithmetic follows numpy's float32 step by step; full-size runs matched `relight.py` on
    every byte.
  - Every scene of a relit shot must repeat frames of **one** drawn shot (the plate the light is measured against).
- **Refused before anything is ordered**: `model: openai/gpt-image-2` (every later frame is an edit), `images`,
  `cast`, `cast_size`, `anchor`, `multi_ref`, a `repeat_of` that is not an earlier picked scene, a group that is
  not text, a scene id that equals another shot's group name, a frame or light picture the template cannot fill,
  and a relit shot that repeats frames of more than one shot.
- **Pieces**: `image-<scene id>` for every drawn scene (plate or frame) and `light-<scene id>` for each relit
  shot's light picture, so a fix can reuse what it did not change.
- **Outputs**: `images [{id: scene id, image}]` in plan order (restored frames; a repeat carries its source's
  frame, re-lit when its shot is), `plates [{group, image}]` (drawn shots only) and `scenes` (every input scene, `image` = its frame).

## Cost

fal meters GPT Image 2 in token "units" (1 USD per unit), so the price depends on size, quality and the reference
pictures. A high-quality 1088x1920 still is about USD 0.19. In shots mode a film costs one still per drawn scene
plus one light picture per relit shot; repeats, restore and the multiply are free. The `cost` block is documentation only; the style's own
`cost` block is the quote.

Source: `parts/image-gpt-image-2/src/part.mjs` and `parts/_lib/scene-stills.mjs`, built with
`node parts/_tools/bundle.mjs image-gpt-image-2 1.1.0` (shots mode adds `src/plate.mjs`).
