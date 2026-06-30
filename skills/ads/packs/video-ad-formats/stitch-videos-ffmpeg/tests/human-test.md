# Human Test

Goal: run `stitch-videos-ffmpeg` on the sample input and produce reviewable artifacts.

Steps:
1. Create `skills/test-runs/<timestamp>/stitch-videos-ffmpeg/`.
2. Copy `tests/sample-input.md` into the run folder as `input.md`.
3. Execute the skill workflow or dry-run plan.
4. Save `manifest.json` and `verification.md`.
5. If media is produced, inspect it using the relevant audio, image, or video verifier.

Human acceptance criteria:
- The output is understandable and reviewable.
- Any blocked provider or missing implementation is clearly documented.
- The output follows brand, format, and quality constraints from the sample input.

Human rejection criteria:
- Missing manifest or verification notes.
- Silent failure, hidden skipped work, or unclear output ownership.
- Media output is unreadable, unplayable, or visibly off brief.
