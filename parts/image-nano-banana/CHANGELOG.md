# image-nano-banana

## 1.2.1

- A still the provider refuses is logged as a warning before the step fails: `the image maker refused <what it was for>` (the character picture of a cast member, the still for a scene, an image id or a product still), with the piece name, the model, the number of references, the reason and the first 600 characters of the prompt. The reason is the line's own words, which are the provider's when the server passes them on; without them it is the error's own detail or message, else null, and any `details` the line sends are logged too. Every logged value is cleaned first: links keep only their origin and path (no credentials, query or fragment), secret-named fields (key, token, secret, signature, authorization, password, cookie) and auth headers, bearer tokens and name=secret pairs in text are blanked, and texts are cut to 600 characters after cleaning. The step's failure and its words are unchanged. 1.1.0 and 1.2.0 failed with the line's words alone, which never said which of a video's stills it was.

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
