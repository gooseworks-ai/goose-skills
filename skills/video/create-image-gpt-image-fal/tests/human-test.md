# Human Test — create-image-gpt-image-fal

## Goal

Confirm the atom generates prompt-faithful images on both model families and honors custom sizes on gpt-image-2.

## Test input

Any descriptive prompt. Optionally a reference image to exercise the `/edit` path.

## Steps to run

1. Create `skills/test-runs/<timestamp>/create-image-gpt-image-fal/`.
2. Run the script for: (a) default `gpt-image-1`, (b) `--model gpt-image-2 --image-size 1728x2304`, (c) optionally `--ref-image` to test the edit variant.
3. Open each PNG and read each `.meta.json`.

## Output directory

`skills/test-runs/<timestamp>/create-image-gpt-image-fal/`

## Artifacts to return

- The generated PNGs
- The `.meta.json` sidecars
- A short `verification.md`

## Human acceptance criteria

- Each image opens and plausibly matches its prompt.
- gpt-image-2 output dimensions match the requested custom size.
- `meta.json` reports the correct `model_family` and `model` endpoint.
- The `--ref-image` run visibly reflects the reference.

## Human rejection criteria

- An image is corrupt, empty, or unrelated to the prompt.
- gpt-image-2 ignores the requested custom size.
- `meta.json` is missing or reports the wrong model.
