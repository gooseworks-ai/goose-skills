# image-gpt-image-2

## 1.1.0

- `mode: shots`: locked-camera shots grouped by `scene.extra.group`. A shot's first scene is its plate; every later scene is an edit on `[plate, previous frame, named product photos]`, made in order. `scene.extra.repeat_of` reuses an earlier scene's finished frame, free. Template texts `templates.plate` and `templates.state` (each falls back to `scene`).
- `restore` (default `true` in shots mode): the plate's own pixels go back wherever a frame did not change. A JS port of the stop-motion recipe's `restore_plate.py` (`src/plate.mjs`), matching it pixel for pixel.
- New output `plates [{group, image}]`. Older modes are unchanged; `restore` is refused outside shots mode.

## 1.0.0

- First version: photoreal stills from OpenAI GPT Image 2 on fal (`openai/gpt-image-2`, `openai/gpt-image-2/edit`), for realistic people.
- Three modes: `images` (a hand-built list), `scenes` (one still per plan scene, on `parts/_lib/scene-stills.mjs`, as image-nano-banana 1.1.0) and `cast` (only the cast portraits; members with a picture pass through free).
- `size` (`1024x1024`, `1024x1792`, `1088x1920`, `2304x1296`; default `1088x1920`), `cast_size` and `quality` (`low`, `medium`, `high`; default `high`).
