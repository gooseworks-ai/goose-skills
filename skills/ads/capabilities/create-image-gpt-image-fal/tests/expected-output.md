# Expected Output — create-image-gpt-image-fal

A correct run produces, per generation:

- A PNG at the requested `--output` path, > 1 KB, that opens as a valid image.
- A `<output>.meta.json` sidecar containing:
  - `gateway: "fal"`
  - `model` — the resolved fal endpoint (`fal-ai/gpt-image-1/text-to-image` or `openai/gpt-image-2`, plus `/edit` variants when a ref image is used)
  - `model_family` — `gpt-image-1` or `gpt-image-2`
  - `image_size`, `quality`, `prompt`, `cost_estimate_usd`

Model-specific:
- **gpt-image-1** — output is one of its fixed sizes (1024×1024, 1024×1536, 1536×1024); a custom `--image-size` is ignored with a warning.
- **gpt-image-2** — output matches the requested custom `--image-size` (rounded to a multiple of 16, capped at 3840px).

Image content is non-deterministic — judged on "valid image that plausibly matches the prompt", not exact pixels.
