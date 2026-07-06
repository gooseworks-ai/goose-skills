# Human Test

## Free assembly (placeholder / Ken-Burns beats — $0)
```
cd one-shot-videos/create-cgi-app-sizzle-video-from-refs
RUN=/tmp/cgi-app-sizzle-run
mkdir -p "$RUN/clips" "$RUN/keyframes"
cp scripts/config.example.json "$RUN/config.json"
# Free path: with the REAL app screens present, build the Ken-Burns fallback beats
# (slow push-in on each screen) + a static end-card PNG, then concat + 1.15x finalize
# (mirror clients/masterclass/ad-runs/run-03-run-03/working/build_v2_clips.py).
# Or drop any 9:16 color clips at the beat windows + a 3s end-card.mp4 to prove the cut.
```
Probe `$RUN/master-final.mp4` (1080×1920, ~22.6s: 6 beats + end card, sped 1.15x) and
compare the CUT / rhythm / palette to `demo/finals/masterclass-cgi-app-sizzle.mp4`.

## Full paid path (gated — nano_banana_2 plate/beat + Kling clip/beat + VO + music)
Only with an approved `config.json`, the real App Store screens + wordmark, and FAL +
ElevenLabs keys:
```
# VO first (locks the timeline from measured audio):
bash render_eryn_vo.sh
# then plates → PIL composites → burst-climax → Kling clips (Ken-Burns fallback per garbled beat)
# → end card → captions → music + mix → concat → 1.15x + grain
```

## Acceptance
- [ ] Phone + studio read identical across all 6 beats (anchored plates); rim-light + bokeh consistent.
- [ ] Every on-screen UI + instructor face is the REAL screenshot — crisp, un-smeared, not AI-redrawn.
- [ ] Each burst-out pops + settles with the phone and screen locked; no phone distortion, no UI morph.
- [ ] Climax collapses everything back into the screen on the value line; wordmark end card lands.
- [ ] VO lands beat-for-beat; music kicks in with no dead intro and ducks under VO; captions restrained.
- [ ] Reads like a premium Apple-keynote product film — not an obvious AI ad.
