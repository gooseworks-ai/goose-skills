# Expected Output — create-image-gpt-image-fal

A correct run produces, per generation:

- A PNG at the requested `--output` path, > 1 KB, that opens as a valid image.
- A `<output>.meta.json` sidecar containing:
  - `gateway: "fal-proxy"` for the default provider or `gateway: "atlas-cloud"` when Atlas is selected
  - `model` — the resolved provider endpoint, including an edit variant when a reference image is used
  - `model_family` — `gpt-image-1` or `gpt-image-2`
  - `image_size`, `quality`, `prompt`, `cost_estimate_usd`

Atlas-specific output also includes the prediction id and unit price read from the live catalog. Omitting `--yes` must stop after preflight without submitting a generation.

Model-specific:
- **gpt-image-1** — output is one of its fixed sizes (1024×1024, 1024×1536, 1536×1024); a custom `--image-size` is ignored with a warning.
- **gpt-image-2** — output matches the requested custom `--image-size` (rounded to a multiple of 16, capped at 3840px).

Image content is non-deterministic — judged on "valid image that plausibly matches the prompt", not exact pixels.
