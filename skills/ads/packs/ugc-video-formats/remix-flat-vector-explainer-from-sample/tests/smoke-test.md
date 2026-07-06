# Smoke Test

Goal: prove `remix-flat-vector-explainer-from-sample` orchestrates a remix (dry, no render).

Steps:
1. Read `SKILL.md`.
2. Phase 0: given a `source_sample_id` with `recipe.format == "flat-vector-explainer"`, confirm the
   recipe carries the full multi-scene `config.json` plan.
3. Phase 1: map a test brand into a working `config.json` — assert every scene swaps to
   the brand with zero source-brand leakage and the format's craft rules hold.
4. Assert gates: cheap previews approved BEFORE the expensive per-scene generation; no
   `submit_render` before in-session approval.
5. Hand-off check: rendering calls `create-flat-vector-explainer-video-from-refs`, not a re-implementation.

Pass/fail: pass when the recipe resolves, the brand config assembles with no leakage,
and the gate/hand-off invariants hold. No paid calls in the smoke test.
