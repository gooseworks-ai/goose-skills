# video-seedance-2

## 1.1.0

- `mode: image_to_video` (fal `bytedance/seedance-2.0/image-to-video`): `clips[].start_image` (`"product"` or a picture) and `clips[].end_image` (`"start"` or a picture).
- Prompt templates (`parts/_lib/prompt.mjs`): `template`, `look`, `answers`, `brand`, `cast`, `products`, `scenes`; placeholders filled in `clips[].prompt`, or the prompt taken from the template. Everything refuses before the first piece.
- One clip per picked plan scene when no `clips` are given (`pick`, `skip_first`, `skip_last`, `seconds`). Scene lines may be null.
- `seed` input: a new seed is a new piece. A top-level `video` output (the first clip). Prompts up to 12,000 characters.
- `clips[].prompt` and `clips[].references` are no longer required; a 1.0.1 clip list orders the same pieces.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, from create-video-seedance-2-fal.
