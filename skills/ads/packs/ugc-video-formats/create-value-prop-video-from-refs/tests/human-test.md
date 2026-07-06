# Human Test

## Free render (silent — $0)
```
cd one-shot-videos/create-value-prop-video-from-refs
RUN=/tmp/value-prop-run
mkdir -p "$RUN/source/sachets" "$RUN/finals"
cp scripts/config.example.json "$RUN/config.json"
# drop the ≥3 SKU cutout PNGs into $RUN/source/sachets/<slug>.png (slugs from config.skus)
# + the brand wordmark at $RUN/source/logo-som-blue.png, author $RUN/shot-list.yml, then:
python3 scripts/render_master.py     # writes $RUN/finals/master-*-clean.mp4 (silent)
```
Probe `master-*-clean.mp4` (1080×1920, ~17s for hook + 5 props + endcard) and compare
the rhythm + legibility to `demo/finals/som-sleep-value-prop.mp4`.

## Music path (gated — 1 paid ElevenLabs Music call)
Only with an approved `config.json` and a FAL key:
```
export FAL_KEY="$FAL_API_KEY"
python3 scripts/fire_music.py        # PAID ~$0.04 → working/audio/music-raw.mp3
# then mux at −14 dB (see scripts/PIPELINE.md) → master-*-with-music.mp4
```

## Acceptance
- [ ] Every claim is ≤4 words and reads crisp with sound OFF.
- [ ] A per-SKU product visual sits under each claim; the hero SKU rotates beat to beat.
- [ ] Headline is navy `--ink`; the per-flavor color is only on the accent rule.
- [ ] Uniform pacing, hard cuts, ~17s total; no human face is the focus.
- [ ] End card lands (real wordmark, no chromatic aberration); music (if any) is a quiet
      bed at −14 dB that never overpowers the visuals — or the cut is cleanly silent.
- [ ] Reads like a premium DTC benefits ad — not an obvious AI ad.
