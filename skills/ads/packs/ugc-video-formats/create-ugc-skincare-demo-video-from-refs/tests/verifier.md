# Verifier

Use these shared verifiers when applicable:

- `../../../skills/verifiers/video/verify-playable-video.md`
- `../../../skills/verifiers/package/verify-output-manifest.md`

Skill-specific pass criteria: `create-ugc-skincare-demo-video-from-refs` must
satisfy the Output and Quality Checks in its `SKILL.md` — in particular:

- delivered mp4 is 9:16, within ±0.2s of the requested duration, **no burned
  captions**, native dialogue + bathroom room tone (no music/SFX) present;
- **the review-loop scanned every sampled frame and confirmed NO phone / camera /
  hands-holding-a-phone / mirror-of-a-device appears** — this is an
  automatic-fail axis;
- the review-loop produced a structured, timestamped issue report; the talking
  beats match the script and the application beat is silent;
- the product label is legible in the hero close-up and the application beat has
  no extra/warped fingers;
- any repaired beat was reviewed clean in isolation before stitching, and the
  stitched output stays in audio sync (the stitch script warns on >0.15s drift);
- the stack was GPT-image-2 + Seedance 2.0 only, and every paid call was gated.
