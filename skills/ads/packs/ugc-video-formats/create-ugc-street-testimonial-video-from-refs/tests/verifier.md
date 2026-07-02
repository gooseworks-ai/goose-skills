# Verifier

Use these shared verifiers when applicable:

- `../../../coworkers/verifiers/video/verify-playable-video.md`
- `../../../coworkers/verifiers/package/verify-output-manifest.md`

Skill-specific pass criteria: `create-ugc-street-testimonial-video-from-refs`
must satisfy the Output and Quality Checks in its `SKILL.md` — in particular:

- delivered mp4 is 9:16, within ±0.2s of the requested duration, **no burned
  captions**, native dialogue audio + live sidewalk ambience present, no music;
- **exactly ONE person the whole take** — no second person anywhere, no
  interviewer, no one else speaking, and no background passerby resolving into a
  foreground subject;
- the creator is **stopped/planted** (not walking, not tripod-locked) with real
  micro-motion (not a mannequin);
- background signage stays blank/illegible — no readable logos or brand text;
- lip-sync reads and the Whisper transcript matches the scripted hot-take;
  identity + wardrobe hold start to finish;
- any repaired window (e.g. an audio dysfluency) was reviewed clean in isolation
  before stitching, and the stitched output stays in audio sync (the stitch
  script warns on >0.15s drift);
- the stack was GPT-image-2 + Seedance 2.0 only, and every paid call was gated.
