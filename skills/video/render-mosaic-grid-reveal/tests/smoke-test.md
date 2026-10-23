# Smoke test — render-mosaic-grid-reveal

Deterministic, no paid calls. Needs a `config.json` + its referenced assets (a wordmark SVG
and `cols*rows` product stills). The runnable worked example (with real assets) lives in the
content-goose molecule `one-shot-videos/create-mosaic-grid-reveal-video-from-refs/demo/`;
`scripts/config.example.json` here documents the same schema.

```bash
# from a dir holding config.json + assets/ + _shared.js:
python3 scripts/build_html.py --config config.json --out hyperframe.html
python3 scripts/render.py --config config.json --html hyperframe.html --out master-silent.mp4
```

**Pass:**
- `build_html.py` prints `wrote hyperframe.html (duration_sec=…, N tiles, RxC)`.
- `render.py` writes `master-silent.mp4` at the config `width`×`height` and `fps`, duration
  within ±0.2 s of the written-back `duration_sec`.
- A frame mid-build shows the full-bleed mosaic filling the frame with some tiles popped and
  others not yet; the final second shows the wordmark + sub + tagline + CTA end card.

**Fail signatures:**
- Tiles floating small/centered with empty margins → grid not full-bleed (`#grid{position:absolute;inset:20px}`, `repeat(N,1fr)`).
- Blank wordmark → `wordmark` path wrong or the SVG doesn't use `fill="currentColor"`.
- All tiles appear at once → `pop_order` / per-tile `renderAt` timing not wired.
