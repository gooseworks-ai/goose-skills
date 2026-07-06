# Smoke Test

Goal: prove `remix-photo-grid-promo-card-from-sample` orchestrates a remix without
rendering (dry orchestration).

Steps:
1. Read `SKILL.md`.
2. Simulate Phase 0: given a `source_sample_id` with `recipe.format ==
   "photo-grid-promo-card"`, confirm the recipe carries a `config.json` shape
   (wordmark, headline, 6 tiles, chips, palette, music).
3. Simulate Phase 1: map a test brand's wordmark/product/offer/photos/palette into a
   working `config.json` — assert zero source-brand leakage and that the offer (% +
   code) comes from the brand, not the source.
4. Assert the paid gate: no `submit_render` before an in-session approval; the card +
   frame-step render are free, only the ElevenLabs music bed spends.
5. Hand-off check: the render step calls `create-photo-grid-promo-card-video-from-refs`
   `one_shot.py`, not a re-implementation.

Pass/fail: pass when the recipe resolves, the brand config is assembled with no
leakage, and the gate/hand-off invariants hold. No paid calls in the smoke test.
