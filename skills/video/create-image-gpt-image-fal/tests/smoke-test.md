# Smoke Test — create-image-gpt-image-fal

## Goal

Prove the atom can generate an image via fal.ai for both model families — `gpt-image-1` (default) and `gpt-image-2` (custom size).

## Input

The prompt in `sample-input.md`.

## Steps

1. Confirm `FAL_API_KEY` (or `FAL_KEY`) is in `.env`. If absent, mark the run `blocked` and stop.
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

## Expected output shape

- `$RUN/g1.png` exists, > 1 KB; `g1.png.meta.json` has `model_family: "gpt-image-1"`.
- `$RUN/g2.png` exists, > 1 KB, dimensions 1024×1536; `g2.png.meta.json` has `model_family: "gpt-image-2"`.

## Pass / fail

- **Pass:** both PNGs exist and open; meta files report the correct `model_family`.
- **Fail:** a generation errors, or gpt-image-2 ignores the custom size.
- **Blocked:** no `FAL_API_KEY`.

## Notes

API integration test — spends a few cents on fal at `low` quality. Run only when integration tests are enabled.
