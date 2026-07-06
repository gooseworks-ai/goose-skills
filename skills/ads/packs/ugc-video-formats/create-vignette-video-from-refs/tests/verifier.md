# Verifier

Deterministic checks on a produced render + the skill folder.

## Render checks (per `master-*.mp4` variant)
- `ffprobe`: `width,height` ∈ {`1080,1920`, `1080,1080`, `1080,1350`}; `codec_name=h264`;
  `pix_fmt=yuv420p`; `duration` in the 9–12s window.
- Audio: `codec_name=aac` and `bit_rate > 128000` (NOT ~1000 — the silent-map bug from
  ffmpeg default mapping; fix with `-map 0:v:0 -map 1:a:0` + a separate mux pass).
- `+faststart`: MOOV atom near the start (`ffprobe -v trace -show_format | head | grep moov`).
- Music is instrumental (no lyrics) and normalized near -18 LUFS.
- Sample QC frames at beat midpoints and verify non-empty:
  ```
  for t in 0.5 2.2 3.8 5.4 7.0 9.0; do
    ffmpeg -y -ss $t -i "$VARIANT" -vf scale=480:-1 -frames:v 1 qc/t${t}s.jpg
  done
  ```
  t=0.5 BG only; t=2.2 cold-open readable; t=3.8/5.4/7.0 cutouts vertically centered on the
  SAME mid-line; t=9.0 annotated end card readable.
- **Cutout vertical-center consistency:** the cutout visual centers at t=3.8/5.4/7.0 are
  within ~5px of each other AND within ~10px of the frame mid-line (`y=(H-h)/2`, never
  bottom-anchor).
- No people/hands/products/text/logos baked into the BG.

## Cutout alpha checks (per `assets/product-cutouts/*.png`)
- `pct_transparent >= 20` (BG was stripped) and `pct_partial <= 8` (clean edge, no halo)
  via PIL alpha histogram.

## Folder checks
- `SKILL.md` frontmatter has `name`, `description`, `status`.
- `scripts/{strip_product_backgrounds,fire_t2v_variants,render_overlays,composite_variants,music_and_mux}.py`
  exist and parse (`python3 -c "import ast; ast.parse(open(f).read())"`).
- `scripts/config.example.json` parses and has `products` (1–3), `bg_source`,
  `bg_concepts`, `bg_dim`, `cold_open_text`, `end_card`, `beat_timing`, `music`.
- `scripts/PIPELINE.md` exists (field→script map + the `fal_helpers` dependency note).
- `demo/finals/` has the reference mp4; `demo/README.md` documents source assets (cutouts /
  BG / overlays may be documented git-LFS pointers).
- `tests/` has sample-input, smoke-test, expected-output, human-test, verifier.

## Format-contract checks
- Composite is a single ffmpeg `filter_complex`: palette-aware BG dim → cold-open overlay
  → width-anchored cutouts at `y=(H-h)/2` → annotated end-card overlay. NO dissolve filter.
- BG dim is palette-aware (heavy `saturation=0.50` for competing BGs, light `saturation=0.85`
  otherwise).
- Music mux is a SEPARATE pass with explicit `-map 0:v:0 -map 1:a:0`.
- The BG carries no baked product/text; the ONLY text/logos are the overlay layers.
- Pexels-first: `bg_source_order` lists `pexels` before `t2v` (the cost lever).
