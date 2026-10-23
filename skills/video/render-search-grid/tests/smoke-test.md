# Smoke test — render-search-grid

```bash
cd scripts
npm i playwright-core          # once (or have a cached Playwright chromium)
python3 build_html.py --config config.example.json --out /tmp/sg.html   # -> "wrote ... KB"
node capture.js --html /tmp/sg.html --out /tmp/sg-frames --fps 30 --duration 18000
```
Expect: `wrote ... KB`, `captured 540 frames`, no `PAGEERROR`. A frame at t≈7600ms shows the
top card grown to full-screen (the box-grow, not a crossfade). `render.py --config
config.example.json --out /tmp/sg.mp4` (no `--music`) yields a silent MP4 for a $0 pass.

Passes when the deterministic render produces frames with no console errors and the four
beats are present (search grid + typing → card stack → grow → swipe ×2 → end card).
