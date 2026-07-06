# Smoke Test

Goal: prove `remix-flatlay-product-reveal-from-sample` orchestrates a remix (dry).

Steps:
1. Read `SKILL.md`.
2. Phase 0: given a `source_sample_id` with `recipe.format == "flatlay-product-reveal"`,
   confirm the recipe carries a `config.json` shape (beats, tabletop_bg, flat_cover,
   beat_i2v, end_card, music).
3. Phase 1: map a test brand's products/tabletop/end-card into a working `config.json`
   — assert every cover preserves real art/text and no source-brand leakage.
4. Assert gates: flat covers/start frames approved BEFORE the paid Veo beats; no
   `submit_render` before in-session approval; assembly is free.
5. Hand-off check: rendering calls `create-flatlay-product-reveal-video-from-refs`
   (`gen_beats` → assembly), not a re-implementation.

Pass/fail: pass when the recipe resolves, the brand config assembles with no leakage,
and the gate/hand-off invariants hold. No paid calls in the smoke test.
