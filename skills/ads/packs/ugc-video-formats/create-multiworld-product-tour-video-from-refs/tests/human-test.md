# Human Test

## Free assembly (placeholder clips — $0)
```
cd one-shot-videos/create-multiworld-product-tour-video-from-refs
RUN=/tmp/multiworld-run
mkdir -p "$RUN/working/clips" "$RUN/working/endcard" "$RUN/working/music"
cp scripts/config.example.json "$RUN/config.json"
# drop 6 color clips (arrivals ≥4.5s, macros ≥3.5s) named S01..S06 into $RUN/working/clips/,
# a 3s $RUN/working/endcard/endcard_3s.mp4, and a 27s $RUN/working/music/music_trimmed.mp3,
# then run the source build_master.py pattern (trim → hard-cut concat → music mux).
```
Probe `$RUN/finals/master-v2.mp4` (720×1280, ~27.0s, 7 segments) and compare the CUT /
rhythm to `demo/finals/primally-pure-three-place-tour.mp4`.

## Full paid path (gated — 6 MS clips + NB2 end card + music)
Only with an approved `config.json`, real imported product UUIDs, and Higgsfield +
ElevenLabs keys. Fire the 6 Marketing Studio `product_showcase` clips, the NB2 end-card
background, and the music bed. **Enforce the sealed-bottle rule on every clip.**

## Acceptance
- [ ] Each world = a WIDE kinetic-calm arrival (bottle small, environment dominant) then a top-down macro moment (product + botanical, no hands).
- [ ] Every bottle reads **sealed** — no open cap, no extrusion, no spray, no smoke/vapor.
- [ ] Silent scenes: no VO, no captions in S01–S06 (Whisper the audio → music only). Text ONLY on the end card.
- [ ] Distinct world per scent (palette + botanical); bottles are NOT color-coded.
- [ ] Hard cuts between scenes (no dissolves, except the whip into the end card); end-card HTML text lands crisp + legible.
- [ ] Music kicks in immediately (no dead intro), fades the tail.
- [ ] Reads like a premium, aspirational brand film — sunlit-natural, not an obvious AI ad.
