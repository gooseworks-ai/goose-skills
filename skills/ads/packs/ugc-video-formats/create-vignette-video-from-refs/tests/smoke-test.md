# Smoke Test

Goal: prove `create-vignette-video-from-refs` composites a master. The generative steps
(birefnet cutouts, T2V BG, music) are PAID; the composite + overlay assembly is free. The
smoke test validates the free composite on a placeholder BG + placeholder cutouts → $0.

Steps:
1. Read `SKILL.md`.
2. Put a placeholder BG clip (any 9:16 color/motion clip ≥ `duration_s`) at
   `source/t2v-outputs/beta-SEED.mp4` (a Pexels clip works identically — the composite is
   source-agnostic).
3. Put N placeholder cutout PNGs (any RGBA products) in `assets/product-cutouts/` named per
   `config.products`, and run `render_overlays.py` (or drop placeholder
   `assets/text-overlays/{cold-open-card-9x16,end-card-annotated-9x16}.png`).
4. `python3 scripts/composite_variants.py` → `finals/master-9x16-beta-SEED.mp4`.
5. Probe: 1080×1920, 30fps, `duration ≈ duration_s` (10.5s), the BG dimmed, cutouts
   vertically centered, cold-open + end-card overlay windows present.
6. For the FULL paid path, run the ordered pipeline in `scripts/PIPELINE.md`
   (strip → BG → overlays → composite → music+mux) with FAL + ElevenLabs keys — but only
   with an approved config + spend gate.

Pass/fail: pass when the composited MP4 is 1080×1920 at ~`duration_s` with the cold-open
card, N cutout beats (vertically centered), and the end card in their `beat_timing`
windows. Gate any paid gen behind explicit approval.
