# image-gpt-image-2

## 1.4.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 1.4.0.

## 1.4.0

- `same_look` (scenes mode): a scene tagged Hold N is drawn after the first scene tagged Look N and sends its still as a
  reference, named in the prompt, so the outfit, hair and room match (GOOSE-4034: one montage drew Look 1 and two Hold 1 shots
  in three tops and two kitchens). Needs /edit; refused with `anchor: first_scene`. Off by default; nothing else changed.

## 1.3.0

- `quality_tier` (`standard`, the default, or `best`) sets the default quality: medium for Standard, high for Best. An explicit `quality` still wins for the whole step. 1.2.0 always defaulted to high.
- The manifest's cost basis stays the high rate, the most a picture can cost.
- The request body changed, so no `reuses_pieces_of`.

## 1.2.0

- The default cast anchor (a template with no `anchor` text) is the server's dialogue creator recipe: a candid vertical iPhone front-camera frame, chest-up, in a real lived-in, slightly cluttered room, everything sharp (deep focus, no bokeh), natural room light, real skin with small imperfections, no retouching, skin smoothing, beauty filter or cinematic grade. 1.1.x drew the person "in front of a plain light wall, soft even daylight". A minor version: an intended change in look, so styles move to it through their pins.

## 1.1.2

- Borders in scenes mode (`borders: fix` by default), as image-nano-banana 1.2.3: product photos trimmed before sending (not with `require_product_refs`, whose evidence names the exact photo), a still with a band or frame cropped to its own shape, else the step fails in plain words (never a second paid still). The product evidence binds the still handed on and the piece that drew it. Images, cast and shots mode are unchanged.

## 1.1.1

- Optional strict scene tags and product-reference request evidence prevent missing-colon fallback from generating product scenes without their real photos. Existing opted-out inputs are unchanged.

## 1.1.0

- `mode: shots`: locked-camera shots grouped by `scene.extra.group`. A shot's first scene is its plate; every later scene is an edit on `[plate, previous frame, named product photos]`, made in order. `scene.extra.repeat_of` reuses an earlier scene's finished frame, free. Template texts `templates.plate` and `templates.state` (each falls back to `scene`).
- `restore` (default `true` in shots mode): the plate's own pixels go back wherever a frame did not change. A JS port of the stop-motion recipe's `restore_plate.py` (`src/plate.mjs`), matching it pixel for pixel.
- `relight` (default `false`, shots mode): a shot made only of `repeat_of` scenes is the first place again in another light. One paid light picture per relit shot (`light-<scene id>`, an edit on the source shot's plate, `templates.light` else a default text with the first scene's words) is used only for its light; every relit scene is its source's finished frame times the light field. A JS port of the stop-motion recipe's `relight.py` (`src/plate.mjs`), matching it byte for byte.
- Carries the 1.0.0 prompt-length check: every prompt must be 2 to 32,000 characters, a strip note counted at its longest, checked before the first piece is ordered (shots prompts stop at 32,000, not 31,400).
- New output `plates [{group, image}]`. Older modes are unchanged; `restore` and `relight` are refused outside shots mode.

## 1.0.0

- First version: photoreal stills from OpenAI GPT Image 2 on fal (`openai/gpt-image-2`, `openai/gpt-image-2/edit`), for realistic people.
- Three modes: `images` (a hand-built list), `scenes` (one still per plan scene, on `parts/_lib/scene-stills.mjs`, as image-nano-banana 1.1.0) and `cast` (only the cast portraits; members with a picture pass through free).
- `size` (`1024x1024`, `1024x1792`, `1088x1920`, `2304x1296`; default `1088x1920`), `cast_size` and `quality` (`low`, `medium`, `high`; default `high`).
