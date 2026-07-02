# Smoke Test

Goal: prove `stitch-videos-ffmpeg` can perform its core workflow or, for scaffolds, can produce a clear dry-run plan.

Input: `tests/sample-input.md`.

Steps:
1. Read `SKILL.md`.
2. Run the smallest safe workflow described by the skill.
3. Save outputs to `skills/test-runs/<timestamp>/stitch-videos-ffmpeg/`.
4. Run the verifier references in `tests/verifier.md`.

Expected output shape: see `tests/expected-output.md`.

Pass/fail criteria: pass when required artifacts exist and missing implementation details are explicitly marked as blocked rather than silently skipped.
