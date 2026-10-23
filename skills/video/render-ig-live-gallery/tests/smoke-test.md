# Smoke test — render-ig-live-gallery

Free, $0 check that the renderer runs and produces a valid vertical master. No paid calls.

## Setup

Point `--assets` at any dir with 5 product stills + a wordmark, and use the bundled example
config (or your own). For a self-contained check, use the Glossier demo stills.

```bash
DIR=skills/ads/capabilities/render-ig-live-gallery
ASSETS=<dir with 5 product stills + wordmark>   # e.g. the Glossier demo brand stills
```

## 1. Stills (fastest)

```bash
python3 $DIR/scripts/build.py --config $DIR/scripts/config.example.json --assets "$ASSETS" --stills /tmp/iglive-stills
```

**Pass:** writes `slide0..slide4.jpg` + `endcard.jpg`. Each product is CENTERED (equal left/right),
the IG-Live chrome renders (avatar + LIVE + viewer count + X, comment feed + empty "Add a comment…"
bar, reaction hearts), and the endcard is the logo card (no model face).

## 2. Full silent master

```bash
python3 $DIR/scripts/build.py --config $DIR/scripts/config.example.json --assets "$ASSETS" --out /tmp/iglive.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name -of default=noprint_wrappers=1 /tmp/iglive.mp4
```

**Pass:** prints `wrote NNN frames (~19-20s)` and `silent master -> …`; the mp4 is H.264, 1080x1920.

## 3. Claims guard (manual)

Comments are claim-free brand-descriptor vibe (no efficacy/result/medical claims, no
numbers-as-proof, no named real customers); the comment INPUT bar is empty; no product/wordmark
is AI-generated.

## Cleanup

```bash
rm -rf /tmp/iglive-stills /tmp/iglive.mp4
```
