# Smoke test

Render every example and confirm the PNGs are created without errors.

```bash
cd create-apple-notes-mockup
bash tests/run-all.sh
```

Pass criteria:

- One PNG per example exists under `tests/output/<date>-<slug>/screenshot.png`.
- Every PNG is exactly 2360×5112 (1180×2556 at DPR 2) — `sips -g pixelWidth -g pixelHeight tests/output/*/screenshot.png` should report those values.
- No errors thrown by the renderer (`echo $?` after the script returns 0).
