# image-nano-banana

## 1.2.1

- Scenes mode: a scene with `image_locked: true` keeps its `image` as its final still, as is, with nothing ordered and no prompt filled (a preview approved before the yes); a picture other than PNG, JPEG or WebP becomes a PNG. A member named only by locked scenes gets no anchor drawn. `image_locked` without an `image` is refused. Without `image_locked` nothing changes.

## 1.2.0

- Products mode: one edit of each product's first photo per kind, `kinds` `snap` (a plain textured surface) and `angled` (a three-quarter view over warm white). Outputs `images` keyed `<product id>-<kind>`. Needs `/edit`; the template's `Snap` and `Angled` rules replace the built-in texts.
- `kinds` is refused in images and scenes mode. Images and scenes mode are unchanged.

## 1.1.0

- Scenes mode: one still per picked plan scene, the prompt filled from the style's template (`parts/_lib/prompt.mjs`), references picked from the plan (`parts/_lib/scene-stills.mjs`).
- `anchor: cast` draws a portrait for each named cast member without an image; `anchor: first_scene` makes the first still a reference for the rest.
- `multi_ref: strip` (the default) tiles several cast anchors into one reference picture; `list` sends them separately.
- `style_refs`, `cast_aspect_ratio`, `pick`, `skip_first`, `skip_last`, `seed`. Scene lines may be null.
- `images` is no longer required (scenes mode); images mode is unchanged.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, the Nano Banana family of the create-image-fal atom.
