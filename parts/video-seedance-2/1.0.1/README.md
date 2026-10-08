# video-seedance-2 1.0.1

Short clips with native lip-synced voice and room sound (D6: for short scenes with native audio; the default
talking creator for scripted lines is `creator-h3`). From create-video-seedance-2-fal.

- **Paid piece** `clip-<id>` per clip, through the private line only: fal
  `bytedance/seedance-2.0/reference-to-video` with the atom's payload `{prompt, image_urls, resolution,
  duration (integer, 4 to 15), aspect_ratio, generate_audio, seed}`. References are FileRefs the core hosts (the
  first is @Image1); seeds come from the kit's per-piece seed.
- The atom's craft rules stay with the prompt the style writes: fewer, longer clips with internal scene
  structure; full wardrobe; a branded product always with its real photo; never AI-generated video as a
  reference (a content-policy refusal).
- A clip that should have native audio and comes back without it fails (`provider_failed`). A policy refusal
  is final for that exact clip.
- **Outputs**: `clips: [{id, video, seconds}]`, for `assemble` (keep their sound) and the check layer's speech
  check (on-camera speech is transcribed and compared with the script).
- **Cost basis**: USD 0.68 per second (the 1080p list rate, an upper bound; 720p is 0.30, 480p 0.18), summed
  over `clips[].seconds`.

Source: `parts/video-seedance-2/src/part.mjs` and `src/manifest.mjs`.
