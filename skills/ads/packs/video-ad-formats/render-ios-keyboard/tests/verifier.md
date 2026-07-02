# Verifier

This atom outputs an HTML fragment + CSS (and an HTML preview page via `render.js`), not a PNG, so there is no dimension/manifest verifier to run against it directly. The shared verifiers under `skills/verifiers/` are image/package oriented:

- `../../../../verifiers/image/verify-product-image.md` — only applies if you screenshot a rendered keyboard to a PNG and want to confirm it opens and shows the expected subject.
- `../../../../verifiers/package/verify-output-manifest.md` — only applies if a downstream molecule wraps this fragment into a manifested output dir.

There is no shared verifier for "iOS keyboard fragment structure" (e.g. `verify-screenshot-dimensions.md` / `verify-no-fallback-font-rendering.md` do not exist). Until one is added, **`human-test.md` is authoritative for v1**: the keyboard is accepted by eyeballing the rendered `render.js` page against a real iOS keyboard across the `qwerty-lower`, `qwerty-upper`, and `numbers` states.

Quick automated sanity check (structure only, no human needed):

```bash
cd render-ios-keyboard
node -e "const {renderKeyboardHTML} = require('./generate'); \
  const h = renderKeyboardHTML({layout:'numbers'}); \
  const ok = h.startsWith('<div class=\"ios-keyboard\"') \
    && h.includes('data-layout=\"numbers\"') \
    && h.includes('#+=') && h.includes('ABC') \
    && h.includes('kb-suggestions') && h.includes('kb-system-row'); \
  process.exit(ok ? 0 : 1);" && echo "structure ok"
```
