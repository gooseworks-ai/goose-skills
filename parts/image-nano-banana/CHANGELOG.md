# image-nano-banana

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
