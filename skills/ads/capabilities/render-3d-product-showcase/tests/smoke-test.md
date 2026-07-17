# Smoke Test

Given the generated beat clips (create-video-fal i2v hero rotation + macro push-in, Veo3
physics reveal), the Playwright hyperframe end card, and one instrumental bed,
`render-3d-product-showcase` assembles the master via `build_masters.py`: trim each beat to its
window, order the beats, hard-cut on the beat, mux the music → 720×1280 h264+aac (~15s).

Pass when the assembly runs to a valid MP4 and:
- the 4 beats land in order (hero rotation → macro push-in → physics reveal → typographic
  brand close);
- the real product is carried through from the source clips (geometry never AI-invented on this
  free stage — the beats are seeded on the create-image-fal styled hero upstream);
- the end card is the deterministic Playwright hyperframe (real wordmark, no AI-rendered text);
- the instrumental bed carries with no VO, loudnormed to −16 LUFS;
- **no paid call is made** — the hero/macro/reveal clips and the music come from the paid
  capabilities (create-image-fal / create-video-fal / create-music-elevenlabs); this assembly is
  $0 and a re-cut reuses the existing assets.
