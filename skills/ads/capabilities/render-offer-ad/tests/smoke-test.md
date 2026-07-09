# Smoke test — render-offer-ad

Verifies the free, deterministic Remotion assembly end-to-end. No paid calls. Needs:
**Node.js ≥18** and the bundled Remotion project's deps (`cd project && npm install` —
`render.py` auto-runs this if `node_modules` is absent), plus **ffmpeg** on PATH for the
1:1 crop. If node/Remotion aren't available, do the validation-only Phase B (config
binding + render-command wiring) and NOTE that a full render needs node/Remotion installed.

## Setup

```bash
cd skills/ads/capabilities/render-offer-ad
mkdir -p /tmp/offer-ad-smoke
# Copy the example config and REPLACE the placeholder paths:
#  - product_hero_image : a REAL product photo (clean/transparent bg, any png/webp)
#  - music.bed          : an instrumental bed (or delete the "music" block to render silent)
cp scripts/config.example.json /tmp/offer-ad-smoke/config.json
# For a fast 2-second synthetic render, edit the copied config:
#  - beat_split_sec : [0.5, 0.5, 0.5, 0.5]   (→ 60 frames total ≈ 2s)
#  - product_hero_image : any small png with a transparent bg
#  - delete the "music" block (silent) so no audio asset is needed
```

## Phase A — full render (node + Remotion present)

```bash
python3 scripts/render.py \
  --config /tmp/offer-ad-smoke/config.json \
  --work-dir /tmp/offer-ad-smoke \
  --out /tmp/offer-ad-smoke/master
```

Runs the two gating checks, stages the product photo into `project/public/`, writes the
input props to `/tmp/offer-ad-smoke/props.json`, renders `offer-ad --props …` to
`master-9x16.mp4`, then ffmpeg center-crops to `master-1x1.mp4`.

## Phase B — validation only (no node / Remotion not installed)

```bash
# 1) Gating checks + config→props binding, WITHOUT rendering. Point product_hero_image
#    at any existing file (a placeholder is fine for the bind check). This exercises the
#    gates and writes props.json; the render step will then fail only at `npx remotion`.
python3 scripts/render.py \
  --config /tmp/offer-ad-smoke/config.json \
  --work-dir /tmp/offer-ad-smoke \
  --out /tmp/offer-ad-smoke/master   ; echo "exit=$?"
# Inspect the bound input props:
cat /tmp/offer-ad-smoke/props.json
# 2) Confirm the render-command wiring is correct (no hardcoded /Users or clients paths):
grep -n "remotion render offer-ad" scripts/render.py
grep -n "crop=1080:1080" scripts/render.py
```

`props.json` must contain the config's copy slots / palette / bpm / beat_split mapped onto
the `OfferAdProps` keys (`palette`, `copy`, `product_image`, `mechanism_prop`, `bpm`,
`beat_split_sec`, `fonts`, `music`). NOTE in the run log that a full render needs
node/Remotion installed.

## Expect

- The two GATING CHECKS pass for the example config (`product_format: liquid` with
  `spoon / 0 mess` claim vocab; `mechanism_prop: spoon`). Flip a claim line to a
  powder verb (e.g. `scoop`) → `render.py` exits non-zero with a CLAIM-MATCHES-FORMAT
  failure. Set `mechanism_prop` to something unsupported → a CLAIM-BEAT MECHANISM PROP
  failure.
- `render.py` writes `/tmp/offer-ad-smoke/props.json` (the bound Remotion input props).
- Phase A writes `master-9x16.mp4` (1080×1920, 30fps) and, when `1:1` is in `aspects`,
  `master-1x1.mp4` (1080×1080). Duration = `sum(beat_split_sec) × 30` frames (the 2s
  synthetic config → 60 frames).
- Run the `watch` skill on `master-9x16.mp4`: the headline slams WORD-BY-WORD on the beat;
  the real product photo drops in + idle-bobs and is NOT stretched (aspect preserved); the
  mechanism prop enters from a frame edge on the claim beat; the claim lines drop in
  staggered; the CTA label + URL are readable; the hard cuts land on the beat downbeats;
  music (if supplied) is present and ramps out.

## Fail signals

- **`CLAIM-MATCHES-FORMAT gate failed`** → the claim/motif copy uses foreign-format verbs
  for the declared `product_format` (a liquid using powder grammar). Rewrite the claim to
  the product's real format. Use `--skip-gates` only if the mismatch is intentional.
- **`CLAIM-BEAT MECHANISM PROP gate failed`** → `mechanism_prop` isn't `spoon` or
  `accent`. A text-only claim beat is too static — supply an edge-entry prop.
- **Product photo looks stretched / wrong aspect** → the source image was pre-distorted;
  the engine uses `objectFit:contain` and never stretches. Supply a clean product photo.
- **Text looks smeared/warped** → something AI-rendered a letter; this engine typesets ALL
  text in Remotion (springs + DOM), never a video model. Never route copy through image-gen.
- **Duration is wrong / cuts don't land on the beat** → `beat_split_sec` doesn't sum to
  the intended length or doesn't match the `bpm`; the cut frames are DERIVED from
  `beat_split_sec` (`Math.round(sec × 30)`), so re-time the split, don't trim the video.
- **`npx remotion` not found** → node/Remotion isn't installed; run `cd project && npm
  install` (this capability legitimately requires a node runtime — the renderer is a
  Remotion project).
```
