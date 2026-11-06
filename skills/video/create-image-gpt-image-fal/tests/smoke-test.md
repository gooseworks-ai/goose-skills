# Smoke Test — create-image-gpt-image-fal

## Goal

Prove the atom can generate an image through the default FAL route or the opt-in Atlas route without changing provider defaults.

## Input

The prompt in `sample-input.md`.

## Steps

1. Confirm GooseWorks credentials exist for FAL, or set `ATLASCLOUD_API_KEY` for Atlas. If neither is available, mark the run `blocked` and stop.
2. Create `RUN=skills/test-runs/$(date +%Y%m%dT%H%M%SZ)/create-image-gpt-image-fal && mkdir -p "$RUN"`.
3. Default model (gpt-image-1), cheapest tier:
   ```bash
   python3 skills/atoms/image-generation/create-image-gpt-image-fal/scripts/generate.py \
     --prompt "$(cat sample-input.md prompt)" --output "$RUN/g1.png" \
     --aspect-ratio 1:1 --quality low
   ```
4. gpt-image-2 with a custom size:
   ```bash
   python3 .../generate.py --prompt "..." --output "$RUN/g2.png" \
     --model gpt-image-2 --image-size 1024x1536 --quality low
   ```
5. To smoke-test Atlas instead of spending through FAL, add `--provider atlas --yes` to one command. Run a single billable generation; do not retry its POST.

## Expected output shape

- `$RUN/g1.png` exists, > 1 KB; `g1.png.meta.json` has `model_family: "gpt-image-1"`.
- `$RUN/g2.png` exists, > 1 KB, dimensions 1024×1536; `g2.png.meta.json` has `model_family: "gpt-image-2"`.
- An Atlas run reports `gateway: "atlas-cloud"`, the resolved Atlas model, and a prediction id.

## Pass / fail

- **Pass:** both PNGs exist and open; meta files report the correct `model_family`.
- **Fail:** a generation errors, or gpt-image-2 ignores the custom size.
- **Blocked:** no credentials for the selected provider.

## Notes

API integration test — spends a few cents on fal at `low` quality. Run only when integration tests are enabled.
