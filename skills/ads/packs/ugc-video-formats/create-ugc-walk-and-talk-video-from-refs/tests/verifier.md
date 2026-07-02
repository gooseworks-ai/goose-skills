# Verifier

Use these shared verifiers when applicable:

- `../../../coworkers/verifiers/video/verify-playable-video.md`
- `../../../coworkers/verifiers/package/verify-output-manifest.md`

Skill-specific pass criteria: `create-ugc-walk-and-talk-video-from-refs` must
satisfy the Output and Quality Checks in its `SKILL.md` (and the inherited checks
from `create-ugc-car-confessional-video-from-refs`) — in particular:

- delivered mp4 is 9:16, within ±0.2s of the requested duration, **no burned
  captions**, **no music**, native dialogue audio + live outdoor street ambience
  present;
- **one single continuous take** — no internal cuts, no second person, no morph
  transitions;
- **genuine locomotion + parallax** — the creator reads as walking forward with
  the background drifting past, not walking on the spot and not floating on a
  static plate;
- **no background warp/melt** — busy moving scenery and any pedestrians hold
  shape (checked especially on the 720p probe);
- framed a little wider than the car so the moving street reads; identity +
  wardrobe + hair hold start to finish;
- the review-loop produced a structured, timestamped issue report; any surgical
  window fix was reviewed clean in isolation before stitching and stays in audio
  sync (the stitch script warns on >0.15s drift);
- the stack was GPT-image-2 + Seedance 2.0 only, and every paid call was gated.
