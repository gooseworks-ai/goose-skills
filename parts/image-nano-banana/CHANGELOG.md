# image-nano-banana

## 2.0.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 2.0.0.

## 2.0.0

- Cartoons only (fix-forward contract section 5). Requires `subject: cartoon`; products mode is withdrawn; a scene whose references would include a real product photo is refused before anything is ordered. Real people and real products use `image-gpt-image-2` edit, and packaging comes from the real photo through `overlay`.

## 1.2.3

- Borders (scenes and products mode, `borders: fix` by default): each product photo's flat or transparent margins are trimmed before it is sent, and a still that comes back letterboxed, padded or framed is cropped to the still's own shape (scaled back to its size) when that keeps 75 %, else the step fails in plain words; a lone white or black strip that cannot be cropped is kept with a warning. A still is never drawn a second time (no unquoted paid piece). `borders: keep` keeps the 1.2.2 behaviour. Images mode is unchanged and refuses `borders`. Built on 1.2.2.

## 1.2.2

- Scenes mode: a scene with `image_locked: true` keeps its `image` as its final still, as is, with nothing ordered and no prompt filled (a preview approved before the yes); a picture other than PNG, JPEG or WebP becomes a PNG. A member named only by locked scenes gets no anchor drawn. `image_locked` without an `image` is refused. Without `image_locked` nothing changes. Built on 1.2.1, so a refused still is logged as in 1.2.1.

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
