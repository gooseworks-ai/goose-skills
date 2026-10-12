# video-veo-3

## 1.0.1

- Optional strict scene tags and product-reference request evidence prevent missing-colon fallback from generating product scenes without their real photos. Existing opted-out inputs are unchanged.

## 1.0.0

- First version: Google Veo 3 / 3.1 image-to-video (veo3.1, veo3.1 fast, veo3, veo3 fast) on fal, in scenes mode (one clip per plan scene, timed to the voice or song spans) and images mode (one clip per still). Always silent (`generate_audio: false`), 4, 6 or 8 s clips, a per-scene seed, a still-shot word check, a total-length price guard, a keep window and a still fallback. Built on `_lib/scene-clips.mjs` (from video-kling 1.0.0). Carries video-kling 1.0.0's review fixes: a stop is never masked by a still, a reply with no picture can fall back to its still on the last attempt, each clip runs only to the next span (made here or not), the first clip after a span made elsewhere (skip_first) starts at its own span, and spanned scenes out of the spans' order or two scenes with one id are refused before anything is bought.
