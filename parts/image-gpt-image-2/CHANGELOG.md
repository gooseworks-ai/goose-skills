# image-gpt-image-2

## 1.0.0

- First version: photoreal stills from OpenAI GPT Image 2 on fal (`openai/gpt-image-2`, `openai/gpt-image-2/edit`), for realistic people.
- Three modes: `images` (a hand-built list), `scenes` (one still per plan scene, on `parts/_lib/scene-stills.mjs`, as image-nano-banana 1.1.0) and `cast` (only the cast portraits; members with a picture pass through free).
- `size` (`1024x1024`, `1024x1792`, `1088x1920`, `2304x1296`; default `1088x1920`), `cast_size` and `quality` (`low`, `medium`, `high`; default `high`).
