# Verifier — create-image-gpt-image-fal

Use these shared verifiers:

- `../../../verifiers/image/verify-product-image.md` — image exists, opens, dimensions match the request, vision model confirms prompt match.
- `../../../verifiers/package/verify-output-manifest.md` — the `.meta.json` sidecar exists with required fields.

## Skill-specific pass criteria

- The output PNG exists and is > 1 KB.
- `<output>.meta.json` includes `gateway: "fal"`, a resolved `model` id, `model_family`, `image_size`, `quality`, and `cost_estimate_usd`.
- For `--model gpt-image-2` with `--image-size`: the output dimensions match the requested size (rounded to a multiple of 16).
- For `--model gpt-image-1`: the output is one of the fixed allowed sizes.
- When `--ref-image` is passed, `model` is the `/edit` variant.
- Missing `FAL_API_KEY` results in a clear `blocked` exit, not a silent failure.
