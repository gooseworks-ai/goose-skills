# Human Test

## Free composite (placeholder BG + cutouts — $0)
```
cd one-shot-videos/create-vignette-video-from-refs
# drop a 9:16 placeholder BG at source/t2v-outputs/beta-SEED.mp4 (a Pexels clip is fine),
# placeholder cutout PNGs in assets/product-cutouts/ named per config.products,
# and cold-open + end-card overlays in assets/text-overlays/ (or run render_overlays.py), then:
python3 scripts/composite_variants.py
```
Probe `finals/master-9x16-beta-SEED.mp4` (1080×1920, ~10.5s) and compare the layer read +
rhythm to `demo/finals/mother-science-vignette.mp4`.

## Full paid path (gated — cutouts + BG + music)
Only with an approved `config.json`, real PDP shots + fonts + logo SVG, and FAL +
ElevenLabs keys. Run the ordered pipeline in `scripts/PIPELINE.md`
(strip → BG (Pexels first, else `fire_t2v_variants.py`) → `render_overlays.py` →
`composite_variants.py` → `music_and_mux.py`).

## Acceptance (open each variant in QuickTime / browser)
### Visual
- [ ] BG plays from t=0 — no black hold, no first-frame freeze.
- [ ] BG motion is REAL-TIME kinetic, NOT slow-mo (energy feels alive).
- [ ] BG is dimmed appropriately — visible but does NOT compete with the cutouts (look for
      5s: does your eye go to the BG or the product?).
- [ ] Cold-open card appears at t≈1.5s, holds ~1.5s, hard-cuts to the first cutout.
- [ ] Each cutout has clean alpha (NO white halo, NO green edge, NO baked drop shadow / outline).
- [ ] All cutouts sit on the SAME visual mid-line (no vertical jump between tall + squat SKUs).
- [ ] End card holds ~2.5s and is an annotated specimen-sheet (top annotation + rule +
      brand logo + rule + ingredient + sub-line + claim) — NOT a bare logo.
- [ ] Logo + annotations are READABLE on the continuing dim BG (WHITE logo on dark BG).

### Audio
- [ ] Music audible from t=0; INSTRUMENTAL — no vocals, no lyrics.
- [ ] Loudness sits ~-18 LUFS (comfortable at default volume); no clipping/peaks; not
      abrupt at the tail.

### Format / brand
- [ ] Aspect + duration match request (9:16 or 1:1; 9–12s).
- [ ] No people/hands/products/text/logos baked into the BG.
- [ ] Typography matches brand archetype (Boska Black for clinical-luxury); palette matches
      brand; end-card copy is brand-specific (real ingredient + claim, not placeholder).

## When NOT to ship
Any of: cutouts vertically inconsistent; BG competes with the cutout; cutout has a
green/halo edge; music has lyrics or wrong mood; audio silent/distorted; text unreadable
against BG luminance; brand-IP concern (BG too close to existing brand IP).

## Per-variant rating (multi-variant runs)
Rate each 1–5 on visual quality, brand fit, cutout pop, music match, overall polish. Pick
the winner; document in `brief.md` why it beat the others.
