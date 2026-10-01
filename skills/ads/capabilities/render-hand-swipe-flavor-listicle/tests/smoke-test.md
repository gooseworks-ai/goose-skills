# Smoke test — render-hand-swipe-flavor-listicle

Free, $0 check that the renderer runs end to end and writes a valid vertical master. No
paid calls, no keys. `tests/make_smoke_inputs.py` makes synthetic stand-ins for every input:
a muddy, uneven green-screen "hand" clip (with a band of realistic green spill on the skin:
greener than the skin but still red-dominant, so it must stay opaque), 5 transparent can
cutouts, an end card, a sine music bed, and a wired `config.json`.

## Setup

```bash
DIR=skills/ads/capabilities/render-hand-swipe-flavor-listicle   # or /tmp/gooseworks-scripts/render-hand-swipe-flavor-listicle
python3 $DIR/tests/make_smoke_inputs.py /tmp/hs-smoke
```

## 1. Card stills (fastest)

```bash
python3 $DIR/scripts/build_hand_swipe_listicle.py /tmp/hs-smoke/config.json --stills /tmp/hs-smoke/stills
```

**Pass:** writes `card0..card4.png` + `endcard.png`. Each card is a flat color + title + a
centered can with a soft shadow.

## 2. Full master

```bash
python3 $DIR/scripts/build_hand_swipe_listicle.py /tmp/hs-smoke/config.json
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of compact /tmp/hs-smoke/smoke-out.mp4
```

**Pass:** prints `WROTE …/smoke-out.mp4  (7.40s, target 7.5s, 5 flavors, music)`; ffprobe
shows h264 1080×1920 + aac, duration 7.4s.

## 3. Look check

```bash
ffmpeg -y -loglevel error -i /tmp/hs-smoke/smoke-out.mp4 -vf "select='not(mod(n\,18))',scale=270:480,tile=7x2" -frames:v 1 /tmp/hs-smoke/sheet.png
```

**Pass:** no green anywhere around the hand (the uneven green is fully keyed), the hand is
opaque and bottom-anchored with the finger pointing at the can base, the cards change by
sliding right-to-left, and the end card slides in clean (no hand) at the end.

## 4. Hand opacity (spill band)

The spill band crosses the hand at y≈1734 in frame 0, over the green first card. If the key
eats it, the card's green shows through the hand.

```bash
ffmpeg -y -loglevel error -i /tmp/hs-smoke/smoke-out.mp4 -vf "select=eq(n\,0)" -frames:v 1 /tmp/hs-smoke/f0.png
python3 -c "
from PIL import Image
im = Image.open('/tmp/hs-smoke/f0.png').convert('RGB')
px = [im.getpixel((x, 1734)) for x in range(600, 721, 10)]
print('OPAQUE' if all(r > g for r, g, b in px) else 'HOLE', px)"
```

**Pass:** prints `OPAQUE` (skin-coloured pixels, red > green). `HOLE` means the key made the
skin see-through (the card's `#2FA84F` shows): raise `green_margin` or fix the key.

## 5. Guardrails

Each edit below goes in a copy of `config.json`; re-run and check the result.

| Edit | Pass |
|---|---|
| `hand_clip` = `"<input:hand_clip>"` | exit 1, `ERROR: config 'hand_clip' is missing or still a placeholder` |
| `music` = `{"trim_intro_sec": 2.5, "volume": 1.0}` (no `path`) | exit 1, `ERROR: config 'music' is an object but music.path is empty…` |
| `music` = `null` | exit 0, output line ends `silent` |
| `music.trim_intro_sec` = `2.5` (8s bed, 7.4s cut) | `WARNING: … Trimming 0.60s instead`; music audible to the end (about -33 dB in the last fade at 7.0s, never -91 dB) |
| `music.volume` = `0.1` | about 20 dB quieter than `1.0` |
| `hand.trim_start` = `5`, `hand.trim_end` = `6` | exit 1, `ERROR: hand.trim_start (5.0s) is at or past the end of hand_clip (2.00s)` |
| `title` = `"5 Flavors of Liquid Death Mountain Water"`, then `--stills` | `WARNING: … shrunk to 64 to fit the frame`; the title and underline sit inside the frame |
| a can saved as an opaque `.jpg` | `WARNING: … has no transparent pixels` |

Measure the music level at a time `T` with:
`ffmpeg -ss T -t 0.3 -i out.mp4 -af volumedetect -f null - 2>&1 | grep mean_volume`.

## Cleanup

```bash
rm -rf /tmp/hs-smoke
```
