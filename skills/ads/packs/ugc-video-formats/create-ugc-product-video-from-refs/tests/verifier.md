# Verifier

Use these shared verifiers when applicable:

- `../../../coworkers/verifiers/video/verify-playable-video.md`
- `../../../coworkers/verifiers/package/verify-output-manifest.md`

Skill-specific pass criteria: `create-ugc-product-video-from-refs` must satisfy
the Output and Quality Checks in its `SKILL.md` — in particular:

- delivered mp4 is 9:16, within ±0.2s of the requested duration, **no burned
  captions**, native dialogue audio present;
- the review-loop produced a structured, timestamped issue report;
- any repaired beat was reviewed clean in isolation before stitching, and the
  stitched output stays in audio sync (the stitch script warns on >0.15s drift);
- the stack was GPT-image-2 + Seedance 2.0 only, and every paid call was gated.
