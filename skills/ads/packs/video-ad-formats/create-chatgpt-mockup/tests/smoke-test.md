# Smoke test

Render every example and confirm the PNGs are created without errors.

```bash
cd create-chatgpt-mockup
bash tests/run-all.sh
```

`run-all.sh` renders all six `examples/*.json` into `tests/output/<date>-<slug>/`.

Pass criteria:

- One PNG per example exists at `tests/output/<date>-<slug>/screenshot.png` (six total, one each for `01-sunscreen-image`, `02-sleep-apnea-long`, `03-poem-iphone-mac`, `04-empty-typing`, `05-seatgeek-gpt-chip`, `06-short-howto`).
- Alongside each PNG there is an `index.html` and a copied `thread.json`.
- Every PNG is exactly **2250×4872** (the `750×1624` stage at DPR 3) — `sips -g pixelWidth -g pixelHeight tests/output/*/screenshot.png` should report those values.
- No errors thrown by the renderer (`echo $?` after the script returns `0`).
