---
name: render-mosaic-grid-reveal
description: Render a 'mosaic-grid-reveal' video from a config — a real-DOM FULL-BLEED N×N mosaic of real product tiles that pops in one tile at a time (scatter order, ease-out-back overshoot), the grid clears, then the brand wordmark builds line-by-line followed by a sub-label, tagline, and CTA; frame-stepped via Playwright and encoded with FFmpeg — deterministic assembly, FREE (the music bed comes from create-music-elevenlabs), so the wordmark, tile captions, and CTA stay pixel-crisp. Use for the mosaic-grid-reveal format.
status: active
---

# render-mosaic-grid-reveal

Render the `mosaic-grid-reveal` format from a config. The signature of this format is a
**full-bleed N×N mosaic** (default 3×3) of the brand's real product stills that **pops in
one tile at a time** (scatter order, ease-out-back "pop"), building the whole grid; the grid
then **clears** (scale-up + fade) and a clean end card **builds line-by-line** — the brand's
real wordmark, then a small sub-label, then the tagline, then a CTA. Silent by design (a
light music bed is muxed separately via `create-music-elevenlabs`). The hook is RANGE — nine
maximally-distinct variants show how much choice the brand offers.

Everything is a real-DOM HTML scene **frame-stepped** to PNG via Playwright and encoded with
FFmpeg, so the wordmark, tile captions, and CTA stay **pixel-crisp** (a video model would
smear them). No generative video, no i2v, no AI-rendered text. This capability is **FREE and
deterministic** — the only paid step of the format (the music bed) is a separate media cap.

## Inputs (`config.json`)

- `width`, `height`, `fps` — canvas + frame rate (default 1080×1920, 30).
- `wordmark` — brand logo SVG (full `<svg>` or bare `<path>` markup) or PNG path. Real DOM,
  recolored via `palette.ink`. Never AI-render it. `wordmark_viewbox`, `wordmark_width` tune it.
- `palette` — `bg` (warm off-white), `accent` + `accent_deep` (brand color), `ink`, `cap`.
- `grid` — `cols`/`rows` (default 3×3), `inset` (outer margin), `gap`.
- `tiles` — one per cell (length must equal `cols*rows`): `image` (real variant still),
  `name` (caption), `bg` (soft pastel echoing the variant), `ink` (deep caption color).
- `pop_order` — scatter order across cells (default corners → center → edges).
- `timing` — `grid_in0`, `cadence`, `pop`, `hold`, `clear` (seconds).
- `end_card` — `sub`, `tagline_top`, `tagline_bottom` (bold), `cta`, `url`. Brand's own approved copy only.
- `eyebrow` — optional top kicker held during the grid.

`scripts/config.example.json` is a filled example (the Pair Eyewear "RANGE" worked example);
the tile `image`/`wordmark` paths are brand inputs bound by the orchestrator at remix time.

## Run

```bash
python3 scripts/build_html.py --config config.json --out hyperframe.html   # emits scene, writes duration_sec back
python3 scripts/render.py --config config.json --html hyperframe.html --out master-silent.mp4
```

`build_html.py` computes the full timeline and writes `duration_sec` back into the config so
`render.py` (which reads dims/fps/duration from the config) frame-steps `window.renderAt(t)`
at `fps` and FFmpeg-encodes the silent master. Then mux the `create-music-elevenlabs` bed:
`ffmpeg -i master-silent.mp4 -i bed.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest out.mp4`.

## Rules

- FILL the frame — tiles are full-bleed and edge-to-edge, NOT small cards floating in an
  empty margin. Tiles pop in one at a time (scatter order), never all-at-once or static.
- Real wordmark + real product stills only. Never AI-render the logo or text.
- Copy slots are the brand's own approved lines — never invent claims, customers, results,
  prices, or shipping speed.
- Pick the 9 most DISTINCT variants (color-wheel spread) — that IS the RANGE hook.
