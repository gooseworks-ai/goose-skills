---
name: render-vignette
description: Assemble a short-form 'vignette' ad from clean product cutouts composited over a kinetic background video — birefnet cutout, then a cold-open text card + product carousel + annotated specimen-sheet end card, plus loudnorm + separate-pass music mux. FREE assembly (PIL + rsvg + FFmpeg); the recipe supplies the config and gates the paid BG/cutout/music calls to their own capabilities. Use for the vignette format.
status: active
---

# render-vignette

Assemble a short-form 'vignette' ad from clean product cutouts composited over a kinetic background video. Motion lives in the BG video; the product rides on top as a static cutout layer. Music-led, zero VO, sub-12s, loopable — it reads muted because the product label + on-screen copy carry the message. Defaults to the V-CARD structure: a cold-open text card → a product carousel under one shared BG → an annotated specimen-sheet end card.

## Run
1. `strip_product_backgrounds.py` — birefnet cutout of each PDP shot to clean hard-edge alpha (no halo/shadow).
2. `render_overlays.py` — PIL + `rsvg-convert` render the cold-open card (Boska Black, dead-center) + the annotated specimen-sheet end card (brand SVG logo + Space Grotesk annotations) as transparent 1080x1920 PNGs. FREE.
3. `composite_variants.py` — one FFmpeg `filter_complex` per BG variant: BG (palette-aware dim) → cold-open overlay → cutouts (width-anchored, vertically centered `y=(H-h)/2`) → end card. h264 crf20 yuv420p +faststart 30fps. FREE.
4. `music_and_mux.py` — instrumental music bed → `acompressor + loudnorm I=-18:TP=-2:LRA=9` → muxed into every variant in a SEPARATE pass with explicit `-map 0:v:0 -map 1:a:0`. The mux is FREE; the music generation is a paid call that in prod routes through create-music-elevenlabs.

## Contract
- FREE assembly: birefnet cutout (see gap below) + PIL/rsvg overlays + FFmpeg composite + mux. No AI-rendered text; the product art/labels and on-screen copy are real, never invented.
- The template recipe (DB) supplies the per-brand config (products, cold-open text, end-card lines, BG concept, beat timing). This capability is the generic assembler.
- Craft rules preserved from the source molecule:
  - Cutouts stripped clean (no halo/shadow), height-anchored at vertical-center (`y=(H-h)/2`) so mixed-shape SKUs share one visual mid-line — never bottom-anchor (squat jars jump). For 9:16 scale by WIDTH (~75% tall bottles, ~65% squat jars).
  - Palette-aware BG dim: high-contrast/chrome BG → push saturation DOWN hard (`saturation=0.50`); naturally-contrasty BG → lighter dim (`saturation=0.85`).
  - End card = annotated specimen-sheet (EST year + rule + wordmark + rule + ingredient + positioning + claim), never a bare logo. Use the WHITE logo variant on dark BGs, cream on light.
  - Music-led, NO VO — instrumental only (VO/lyrics would fight the cold-open + end-card text). Loudnorm before the mux.
  - Mux is a SEPARATE FFmpeg pass with explicit `-map 0:v:0 -map 1:a:0` (single-pass composite+mux silently ships 1 kbps garbage audio).

## Gaps / routing notes
- **birefnet is a paid FAL model, not free.** `strip_product_backgrounds.py` calls `fal-ai/birefnet/v2` directly via a `fal_helpers` shim (`sys.path.insert` into a shared atoms dir + `from fal_helpers import ...`). It is bundled here because the cutout is an intrinsic assembly step, but in prod the birefnet cutout should route through **create-image-fal** (the fal-proxy capability that bills the Ads agent) rather than hitting `fal.run` directly. Treat the direct-fal path as a gap to close; the recipe gates the cutout to `gooseworks fetch create-image-fal`.
- **Background sourcing is not in this capability.** The kinetic BG is sourced upstream — PEXELS-FIRST (free stock, the key cost lever), falling back to T2V (create-video-fal) only when stock coverage fails — and dropped into `source/t2v-outputs/<slug>.mp4` so the composite is source-agnostic. There is no Pexels fetcher bundled here; that lives in the recipe's playbook.
- `music_and_mux.py` also uses the `fal_helpers` shim for the ElevenLabs music generation; in prod that generation routes through **create-music-elevenlabs**, and only the loudnorm + separate-pass mux run locally as FREE assembly.
