# image-nano-banana 1.0.0

Stills from Nano Banana on fal, one paid piece per image.

- **Paid piece** `image-<id>` per image, through the private line only: fal `fal-ai/nano-banana` (prompt alone) or
  `fal-ai/nano-banana/edit` (with `references`), body `{prompt, image_urls?, aspect_ratio?, num_images: 1,
  output_format: "png"}`. References are FileRefs; the core hosts them, so the piece hash follows the files' bytes,
  not their links. The line's `/json/images/0/url` is downloaded.
- **Model choice** is the style's `model` input, and the part refuses references without `/edit` or `/edit`
  without references, before anything is ordered.
- **PNG out**: a result whose bytes are not PNG is re-encoded to PNG (today's create-image-fal rule).
- **Outputs**: `images: [{id, image}]`.
- **Cost basis**: fal list price USD 0.039 per image for both paths, counted from `images`.

Source: `parts/image-nano-banana/src/part.mjs`, built with `node parts/_tools/bundle.mjs image-nano-banana 1.0.0`.
