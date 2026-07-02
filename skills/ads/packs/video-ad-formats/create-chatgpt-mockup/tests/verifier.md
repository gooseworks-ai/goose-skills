# Verifier

Use:

- `../../../../verifiers/package/verify-output-manifest.md` — confirm each output dir contains the expected triplet: `index.html`, `screenshot.png`, and a copied `thread.json`.

Atom-specific automated check (no shared verifier yet):

- **Screenshot dimensions** — confirm each `screenshot.png` is **2250×4872** (the `750×1624` stage at DPR 3). Run `sips -g pixelWidth -g pixelHeight tests/output/*/screenshot.png` and confirm every frame reports those values.

There is no shared verifier for the ChatGPT visual chrome (header style, bubble alignment, composer state, markdown rendering, light-mode palette). Until one exists, the human acceptance check in `human-test.md` is authoritative for v1 — it is the source of truth for whether a frame reads as a real ChatGPT iOS screen.
