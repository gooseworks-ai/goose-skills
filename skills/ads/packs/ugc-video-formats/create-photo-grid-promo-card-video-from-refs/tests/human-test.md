# Human Test

Render the Hume worked example and eyeball it against the reference.

## Free half (design + silent render — $0)
```
cd one-shot-videos/create-photo-grid-promo-card-video-from-refs
RUN=/tmp/pgc-run
mkdir -p "$RUN/assets"
# LFS-fetch the product image first, then:
cp demo/assets/hume-logo.svg demo/assets/band-product-clean.webp "$RUN/assets/"
cp scripts/config.example.json "$RUN/config.json"
python3 scripts/one_shot.py --config "$RUN/config.json" --run-dir "$RUN" --no-music
```
Watch `$RUN/master-final.mp4` and compare the layout + motion to
`demo/finals/hume-fathers-day-promo-card.mp4`. (Provide real lifestyle photos in
`$RUN/assets/lifestyle-0{1,2,3}.jpg` to fill the photo tiles.)

## Full paid path (gated — 1 ElevenLabs music call, ~$0.30)
```
python3 scripts/one_shot.py --config "$RUN/config.json" --run-dir "$RUN"
```

## Acceptance
- [ ] Wordmark, headline, "25% OFF", "CODE DAD25" (DAD in accent), and chips are crisp.
- [ ] 2×3 grid: product tile contained on its band; photo tiles cover-cropped.
- [ ] Tiles slide in from the right on a staggered beat in the first ~2s, then hold.
- [ ] Music kicks in immediately (no dead intro), fades the tail; silent variant is silent.
- [ ] Reads like a premium DTC brand's own promo card — not an obvious AI ad.
