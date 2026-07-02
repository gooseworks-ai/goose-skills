# Smoke Test

Goal: prove `create-ugc-walk-and-talk-video-from-refs` can perform its core
workflow, or — without spending beyond the cheap 720p probe — produce a clear
gated dry-run plan plus a locomotion-checked probe.

Input: `tests/sample-input.md`.

Steps:
1. Read `SKILL.md` (and the car reference it specializes).
2. Parse the brief + Phase 0 choices from `sample-input.md`; lock `@Image1`
   (default demo arm-out still).
3. Author the five-paragraph prose Seedance prompt with the walk-and-talk deltas
   (arm-extended, wider frame, continuous locomotion + parallax, ~40–45 word
   brisk monologue, outdoor golden daylight, live street ambience, no music).
4. Present the GPT-image-2 still prompt and the Seedance prompt as **gated**
   steps (do not fire without approval in a dry run).
5. **Generate a 720p probe** (~$4.50) and `/watch` it (frames @≥2fps + Whisper),
   checking specifically for: **genuine locomotion + parallax** (background
   really moves past her), **no background warp/melt**, believable lip-sync +
   transcript match, and identity/wardrobe hold. If the busy background smears,
   apply the 720p watch-out (simplify: thin the crowd, slow the implied walk) and
   re-probe before any 1080p spend.
6. Exercise the stitch core without extra paid calls:
   `scripts/stitch_replacement.py --dry-run --window-start ... --window-end ...`
   against local mp4s, confirming scene-cut detection + window math print.
7. Save artifacts to
   `coworkers/test-runs/<timestamp>/create-ugc-walk-and-talk-video-from-refs/`.
8. Run the verifier references in `tests/verifier.md`.

Expected output shape: see `tests/expected-output.md`.

Pass/fail: pass when the authored prompt honors the walk-and-talk deltas
(arm-extended wider frame, asserted continuous locomotion + parallax, ~40–45
word brisk budget, outdoor daylight, no music), the 720p probe shows genuine
locomotion + parallax with no background melt and clean lip-sync, every paid
call was gated, and the stitch dry-run resolves a valid window. Missing details
must be marked blocked, not silently skipped.
