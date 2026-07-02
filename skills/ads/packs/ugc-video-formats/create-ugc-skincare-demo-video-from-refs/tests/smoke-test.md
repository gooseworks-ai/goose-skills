# Smoke Test

Goal: prove `create-ugc-skincare-demo-video-from-refs` can perform its core
workflow, or — without spending on paid calls — produce a clear gated dry-run
plan.

Input: `tests/sample-input.md`.

Steps:
1. Read `SKILL.md`.
2. Parse the brief + references from `sample-input.md`; lock the `@ImageN` order
   (avatar = `@Image1`, product = `@Image2`).
3. Author the four-block Seedance prompt (look + **invisible-camera / no-mirror**
   directive → ref binding → consistency anchors → 4–5 close-up beat shot list)
   for a 15s default render.
4. Present the GPT-image-2 normalization prompt(s) and the Seedance prompt as
   **gated** steps (do not fire without approval in a dry run). Confirm the
   prompt contains NO "selfie / front-facing phone POV" language and bans mirrors
   unconditionally.
5. Exercise the stitch core without paid calls:
   `scripts/stitch_replacement.py --dry-run --replace-beat 3 ...` against any two
   local mp4s, confirming scene-cut detection + window math print correctly.
6. Save artifacts to
   `skills/test-runs/<timestamp>/create-ugc-skincare-demo-video-from-refs/`.
7. Run the verifier references in `tests/verifier.md`.

Expected output shape: see `tests/expected-output.md`.

Pass/fail: pass when the authored prompt honors the recipe rules (word budget,
no contact physics, per-ref job binding, **invisible-camera language with no
selfie/phone POV and an unconditional mirror ban**, voice + room-tone-only
audio), every paid call is presented as a gate rather than fired, and the stitch
dry-run resolves a valid window. Missing details must be marked blocked, not
silently skipped.
