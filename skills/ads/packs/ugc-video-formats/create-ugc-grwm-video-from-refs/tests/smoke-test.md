# Smoke Test

Goal: prove `create-ugc-grwm-video-from-refs` can perform its core workflow, or —
without spending on paid calls — produce a clear gated dry-run plan.

Input: `tests/sample-input.md`.

Steps:
1. Read `SKILL.md` (and the parent `create-ugc-product-video-from-refs/SKILL.md`).
2. Parse the brief + references from `sample-input.md`; lock the `@ImageN` order
   (avatar = `@Image1`, garment(s) next, bedroom plate last).
3. Author the four-block Seedance prompt (look directive → ref binding →
   consistency anchors → 3–4 beat shot list) for a 15s default render. It MUST
   include: a single-person **off-camera reaction** beat (no second-person-magnet
   words) and an explicit **full-length mirror reveal** beat.
4. Present the GPT-image-2 normalization prompt(s) and the Seedance prompt as
   **gated** steps (do not fire without approval in a dry run).
5. Exercise the stitch core without paid calls:
   `scripts/stitch_replacement.py --dry-run --replace-beat 2 ...` against any two
   local mp4s, confirming scene-cut detection + window math print correctly.
6. Save artifacts to `skills/test-runs/<timestamp>/create-ugc-grwm-video-from-refs/`.
7. Run the verifier references in `tests/verifier.md`.

Expected output shape: see `tests/expected-output.md`.

Pass/fail: pass when the authored prompt honors the recipe rules (word budget,
single-person off-camera reaction with banned second-person words, mandatory
full-body mirror reveal, per-ref job binding, restated garment invariants, no
contact physics), every paid call is presented as a gate rather than fired, and
the stitch dry-run resolves a valid window. Missing details must be marked
blocked, not silently skipped.
