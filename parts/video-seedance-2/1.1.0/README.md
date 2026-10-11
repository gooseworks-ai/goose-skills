# video-seedance-2 1.1.0

Short Seedance 2.0 clips on fal, one paid piece per clip (D6: for short scenes with native audio; the default
talking creator for scripted lines is `creator-h3`). 1.1.0 adds **image-to-video**, **prompt templates** filled
from the plan, a **`seed`** input, **one clip per plan scene**, and a top-level **`video`** output.

## Models (`mode`)

- **`reference`** (default): fal `bytedance/seedance-2.0/reference-to-video`, body `{prompt, image_urls,
  resolution, duration (integer 4 to 15), aspect_ratio, generate_audio, seed}`, as in 1.0.1. A 1.0.1 clip list
  orders byte-identical pieces, so nothing is billed again.
- **`image_to_video`**: fal `bytedance/seedance-2.0/image-to-video`, body `{prompt, image_url, end_image_url?,
  resolution, duration ("4" to "15", a string as fal's schema and the shipped hypermotion call send it),
  aspect_ratio, generate_audio, seed}`.
  - `clips[].start_image`: `"product"` (the first photo of the product the clip names, else of the first
    product with a photo) or a FileRef. Without it, the template's refs pick the scene's picture, then a
    product photo, then a cast member's picture. No start frame refuses the step.
  - `clips[].end_image`: `"start"` (the clip lands back on its start frame) or a FileRef.
  - `references` are refused in this mode; `start_image`/`end_image` are refused in `reference` mode.
- References and frames are FileRefs the core hosts. `seed` is the kit's per-piece seed: fal's schemas do not
  list it, but the street-interview runs send it to Seedance and get it honoured.

## Clip lists

- **`clips`** (the 1.0.1 list): `[{id?, prompt?, references?, start_image?, end_image?, seconds, generate_audio?}]`,
  one piece `clip-<id>` each, at most 12. `prompt` is up to 12,000 characters and may use the template
  placeholders (`{answers.KEY}`, `{product.name}`, `{brand.name}`, `{look}`, ... see `parts/_lib/prompt.mjs`).
  Without a `prompt`, the template's `templates.<clip id>`, else its `motion`, else its `scene` text is used.
  A clip whose id is a plan scene id fills `{picture}`, `{line}` and `{on_screen}` from that scene.
- **`scenes`** without `clips`: one clip per picked scene (`pick`, `skip_first`, `skip_last`, at most 12),
  each `seconds` long (default 5), prompt from the template's `motion` (else `scene`), piece `clip-<scene id>`.
  Scene `line`, `on_screen` and `picture` may be null.

## Prompts

- Inputs for filling: `template` (a style's `frames/<name>.prompt.json`), `look`, `answers`, `brand`, `cast`,
  `products`, `scenes`. The template's `prefix` and `suffix` wrap every prompt and its `negative` is added as
  "Avoid: ..." (Seedance has no negative prompt). Filled text has its whitespace tidied.
- **Every prompt is filled before the first piece is ordered.** A missing `{answers.KEY}`, an unknown look, a
  banned phrase, an unknown placeholder or a prompt over 12,000 characters refuses the step with `bad_input`.
- A 1.0.1 call (no `template` and none of `look`, `answers`, `brand`, `cast`, `products`, `scenes`) sends
  every prompt as written, braces included (the 1.0.1 behaviour). With a fill input, placeholders are filled.
- `{product.name}` is the product the scene's picture names, else the plan's only product; with several
  products and no scene naming one, a prompt that uses it is refused.
- In `reference` mode, a clip without `references` gets the template's refs from the plan: the named cast
  members' pictures, the named products' first photos, the scene's own picture (at most 9).

## Seed

`seed` (a style binds `plan.answers.take`) is mixed into every clip's seed by the kit, so a new seed is a new
piece: a fix that changes it re-rolls the clip, and nothing else is billed again.

## Outputs

- `clips: [{id, video, seconds}]` (id = the clip id, or the scene id), for `assemble` (keep their sound) and the
  check layer's speech check.
- `video`: the first clip's video, for one-clip styles (`step.<id>.video`).
- A clip that should have native audio and comes back without it fails (`provider_failed`). A policy refusal is
  final for that exact clip.

## Cost

Documentation only (critic #17); the style's own `cost` block is the quote. Both models are metered in tokens
(width x height x fps x seconds / 1024 at USD 0.014 per 1000): about USD 0.68 per second at 1080p 9:16, 0.30 at
720p, 0.18 at 480p; wider aspects cost more. The `cost` block sums `clips[].seconds`; in scenes mode one run is
`seconds` x the picked scenes.

Source: `parts/video-seedance-2/src/part.mjs` and `src/manifest.mjs`, built with
`node parts/_tools/bundle.mjs video-seedance-2 1.1.0`.
