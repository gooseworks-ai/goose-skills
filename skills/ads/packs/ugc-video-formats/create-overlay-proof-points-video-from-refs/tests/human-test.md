# Human Test

Run the SpoiledChild worked example and eyeball it against the reference.

## Free half (design preview — $0)
```
cd one-shot-videos/create-overlay-proof-points-video-from-refs
RUN=/tmp/opp-run
mkdir -p "$RUN/generated"
python3 scripts/fetch_icons.py --run-dir "$RUN"
cp demo/finals/spoiled-child-e27-perfect-10.mp4 "$RUN/generated/clip-handheld.mp4"
python3 scripts/build_overlays.py --config scripts/config.example.json \
  --icons-dir "$RUN/assets/icons" --out-dir "$RUN/generated/overlays"
python3 scripts/compose_master.py --config scripts/config.example.json \
  --run-dir "$RUN" --no-music
```
Watch `$RUN/master-final.mp4` and compare the overlay layout + cascade to
`demo/finals/spoiled-child-e27-perfect-10.mp4`.

## Full paid path (gated — 2 model calls, ~$0.35 + music)
Only with an approved `config.json` and FAL + ElevenLabs keys loaded:
```
python3 scripts/one_shot.py --config scripts/config.example.json --run-dir "$RUN"
```

## Acceptance
- [ ] White score header (🏅) + orange subhead (👇) sit top-left, aligned, persist
      the whole clip, and don't cover the bottle face.
- [ ] Exactly 3–4 ✅ proof pills, each fully on-frame, bold and crisp, two short
      lines each.
- [ ] Pills reveal one at a time in the diagonal L→R→L→R cascade, on the music beat.
- [ ] The product label + wordmark are intact and unmorphed across the handheld
      motion (no zoom/scale/smear).
- [ ] Music kicks in immediately (no dead intro), fades the tail; no dialogue.
- [ ] Reads like a real comparison-tool reviewer reel a person would screenshot —
      not an obvious ad mockup.
