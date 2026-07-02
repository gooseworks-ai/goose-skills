# Verifier

Use these shared verifiers when applicable:

- `../../../coworkers/verifiers/video/verify-playable-video.md`
- `../../../coworkers/verifiers/package/verify-output-manifest.md`

Skill-specific pass criteria: `create-ugc-car-confessional-video-from-refs` must
satisfy the Output and Quality Checks in its `SKILL.md` — in particular:

- delivered mp4 is 9:16, within ±0.2s of the requested duration, **no burned
  captions, no music** (native voice + car room tone only);
- it is ONE continuous take — no internal cuts, no second person, no morph/warp;
- the car stays parked (no scenery moving past the windows) and the creator reads
  as alive (real micro-motion), not a static mannequin;
- the Whisper transcript matches the scripted monologue and lip-sync reads;
- Phase 0 offered avatar / location / product choices (defaulted only when the
  user had no preference);
- (product build only) product geometry + label hold, label legible when shown,
  no contact physics, no extra/warped hands;
- the stack was GPT-image-2 + Seedance 2.0 only, and every paid call was gated
  (720p probe before any 1080p hero).
