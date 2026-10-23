# Smoke test

Render every example fixture and confirm the PNGs are created without errors.

```bash
cd skills/ads/capabilities/create-imessage-mockup
bash tests/run-all.sh
```

`run-all.sh` renders all six cases (`dm-minimal`, `dm-with-keyboard`, `dm-with-typing`, `dm-with-frame`, `group-with-frame`, `group-minimal`) into `tests/output/<case>/<date>-<slug>/`.

Pass criteria:

- One PNG per case exists at `tests/output/<case>/<date>-<slug>/screenshot.png` (and an `index.html` + copied `thread.json` beside it). `find tests/output -name screenshot.png | wc -l` should report `6`.
- The `minimal` and `with-keyboard` cases are **2250px wide** (750px viewport × DPR 3) with height that fits the content; the `--with-iphone-frame` cases are exactly **1575×2940** (525×980 × DPR 3). Check with `sips -g pixelWidth -g pixelHeight tests/output/*/*/screenshot.png` on macOS.
- No errors thrown by the renderer — `run-all.sh` runs under `set -e`, so a non-zero exit means a render failed (`echo $?` should be `0`).

If `screenshot.js` reports `playwright not installed`, run the one-time setup first:

```bash
npm install
npx playwright install chromium
```
