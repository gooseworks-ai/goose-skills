# Human Test

## Free assembly (placeholder beats — $0)
```
cd one-shot-videos/create-flatlay-product-reveal-video-from-refs
RUN=/tmp/flatlay-run
mkdir -p "$RUN/generated/beats"
cp scripts/config.example.json "$RUN/config.json"
# drop any 4s 9:16 color clips named per config.beats slugs into $RUN/generated/beats/,
# and a 3s $RUN/generated/end-card.mp4, then:
python3 scripts/build_master.py --config "$RUN/config.json" --run-dir "$RUN" --no-music --no-insert
```
Probe `$RUN/master-final.mp4` (1080×1920, ~13.7s for 4 beats + endcard) and compare
the CUT/rhythm to `demo/finals/wonderbly-fathers-day-reveal.mp4`.

## Full paid path (gated — 2 model calls/beat + optional insert + music)
Only with an approved `config.json`, real covers + tabletop plate, and FAL +
ElevenLabs keys:
```
python3 scripts/one_shot.py --config "$RUN/config.json" --run-dir "$RUN"
```

## Acceptance
- [ ] Each product cover reads crisp and identical through its beat (no smear/redesign).
- [ ] Hands enter from the bottom corners, cup + hold ~1.5s, then lift off; camera locked top-down.
- [ ] Hard cuts between beats (no dissolves); greeting-card insert + end card land.
- [ ] Music kicks in immediately (no dead intro), fades the tail.
- [ ] Reads like a premium DTC flat-lay shoot — not an obvious AI ad.
