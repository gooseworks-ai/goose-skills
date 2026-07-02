# Smoke Test

Goal: prove `create-ugc-car-confessional-video-from-refs` can perform its core
workflow, or — without spending on paid calls — produce a clear gated dry-run plan.

Input: `tests/sample-input.md`.

Steps:
1. Read `SKILL.md` (and the car reference is this skill; also skim the parent
   `create-ugc-product-video-from-refs`).
2. Run **Phase 0 intake**: confirm the three choices (avatar / location / product)
   are offered; for this sample, take the defaults.
3. Author the **single-continuous-take** prose Seedance prompt (look → reference
   binding → camera + micro-motion → inline monologue → audio + closer). No
   bracketed labels; dialogue inline in quotes; ~32–37 words.
4. Present the GPT-image-2 still prompt (if generating the avatar) and the Seedance
   prompt as **gated** steps (do not fire without approval in a dry run).
5. Exercise the stitch core without paid calls:
   `scripts/stitch_replacement.py --dry-run --window-start 6 --window-end 9 ...`
   against any local mp4, confirming the window math prints correctly.
6. Save artifacts to `coworkers/test-runs/<timestamp>/create-ugc-car-confessional-video-from-refs/`.
7. Run the verifier references in `tests/verifier.md`.

Expected output shape: see `tests/expected-output.md`.

Pass/fail: pass when the authored prompt honors the monologue rules (single take,
no cuts, prose + inline dialogue, energy→word budget, static-body micro-motion,
car stays parked, no captions/music), every paid call is presented as a gate
rather than fired, and the stitch dry-run resolves a valid window. A real run
probes at 720p and `/watch`-QCs before any 1080p hero.
