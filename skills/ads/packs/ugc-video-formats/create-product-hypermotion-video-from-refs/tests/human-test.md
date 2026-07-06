# Human Test

## Free assembly (placeholder hypermotion — $0)
```
cd one-shot-videos/create-product-hypermotion-video-from-refs
RUN=/tmp/hypermotion-run
mkdir -p "$RUN/working/kinetic-movs" "$RUN/working/segments"
cp scripts/config.example.json "$RUN/config.json"
# drop a 15s 1:1 placeholder clip at $RUN/working/hypermotion-raw.mp4,
# and a 1080x1920 placeholder clip per card label (intro, spec_1..spec_5, cta, endcard)
# at $RUN/working/kinetic-movs/<label>.mp4 at each card's duration_s, then follow
# scripts/PIPELINE.md Phase 3: crop 1:1->9:16, dice into the 6 segments, concat in order.
```
Probe `$RUN/master-final.mp4` (1080×1920, ~25s, 14 hard-cut segments) and compare the
intercut rhythm to `demo/finals/soundboks-hypermotion.mp4`.

## Full paid path (gated — 1 Seedance call + 1 music call)
Only with an approved `config.json`, a real hero product PNG + logo PNG, and `FAL_API_KEY`:
follow PIPELINE Phase 1 (fire Seedance 5-block prompt + ElevenLabs Music, both skip-if-
exists) → Phase 2 (PIL cards) → Phase 3 (dice/intercut/mux) → Phase 4 (/watch).

## Acceptance
- [ ] The hypermotion product identity holds across every segment (label sharp, no morph);
      no people/hands/text inside the clip.
- [ ] Every spec card reads crisp, no frame bleed; hero stat pops (3D extrusion in accent).
- [ ] Opens on the intro card, alternates segment↔spec, segment lengths decrease into the CTA.
- [ ] End card uses the **real logo PNG**, micro-moves (not frozen), inversion flash on beat.
- [ ] Hard cuts throughout (no dissolves); duration within target ±0.5s.
- [ ] Music kicks in immediately, holds to the tail (no decay); audio ≈192 kbps aac; no VO.
- [ ] Reads like a high-production sizzle — not an obvious AI ad, not UGC.
