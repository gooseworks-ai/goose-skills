# Verifier

Use:

- `../../../verifiers/image/verify-screenshot-dimensions.md` — confirm each PNG matches its mode: `minimal` / `with-keyboard` are 2250px wide (750 × DPR 3) with content-fit height; `with-iphone-frame` is exactly 1575×2940 (525×980 × DPR 3).
- `../../../verifiers/package/verify-output-manifest.md` — confirm each output dir contains `index.html`, `screenshot.png`, and a copied `thread.json`.

If those shared verifiers don't exist yet, the human acceptance check in `human-test.md` is authoritative for v1.
