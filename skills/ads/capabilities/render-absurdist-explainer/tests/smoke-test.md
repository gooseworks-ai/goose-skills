# Smoke test — render-absurdist-explainer

Verifies the free PIL + ffmpeg assembly end-to-end. No paid calls. Needs: Python 3 with
Pillow, ffmpeg/ffprobe, and a sans-serif TrueType font (DejaVu ships with Pillow on most
Linux; macOS uses Arial). You supply per-scene clips + VO mp3s + a music bed + a real
product photo (any 1080×1920 mp4s and a ≥1000px product jpg work for a smoke run).

## Setup

```bash
cd scripts
python3 -m pip install pillow            # if not present
mkdir -p /tmp/absurdist-smoke
# Copy config.example.json -> config.json and point every path at real files:
#   - scenes[].clip  : your per-scene i2v mp4s (1080x1920)
#   - scenes[].vo    : the per-scene VO mp3s (target_sec = ffprobe of each)
#   - end_card.product_image : a real retail product photo (>=1000px)
#   - music_bed      : an instrumental bed (or set to null to run VO-only)
cp config.example.json /tmp/absurdist-smoke/config.json
```

## Run

```bash
# 1) real-product end card (PIL) — must run BEFORE compose
python3 build_endcard.py --config /tmp/absurdist-smoke/config.json \
                         --out /tmp/absurdist-smoke/endcard.png
# (then set end_card.image in config.json to /tmp/absurdist-smoke/endcard.png)

# 2) per-scene captions (libass) — must run BEFORE compose
python3 make_captions.py --config /tmp/absurdist-smoke/config.json \
                         --out /tmp/absurdist-smoke/captions.ass
# (then set captions_ass in config.json to /tmp/absurdist-smoke/captions.ass)

# 3) assemble the master
python3 compose.py --config /tmp/absurdist-smoke/config.json \
                   --work-dir /tmp/absurdist-smoke \
                   --out /tmp/absurdist-smoke/master.mp4
```

## Expect

- `build_endcard.py` writes `endcard.png` (1080×1920): the REAL product photo centred over
  the brand palette, with a typeset wordmark + claim rows + accent CTA pill. NOT an AI
  bottle; NO smeared/AI-rendered text.
- `make_captions.py` writes `captions.ass` — one cue per scene with a caption, the end card
  suppressed, `start = scene_start + 0.08s`.
- `compose.py` prints per-scene retime lines, the total runtime, and a final
  `WROTE ... (expected ~Xs, delta ±...)`. `master.mp4` is 1080×1920, 30fps; its duration is
  within ±0.1s of `sum(scenes[].target_sec) + end_card.dwell_sec`.
- Run the `watch` skill on `master.mp4`: the villain silhouette holds across scenes, the
  single villain voice carries the whole spot, the motif word lands ≥3×, no AI brand text
  leaked into a cartoon background, captions don't collide with on-screen text, and the end
  card is the real product with legible copy.

## Fail signals

- Concat drops frames / audio desyncs → a segment wasn't re-encoded to 30fps (all segments
  MUST be `libx264 -r 30` before the concat demuxer). compose.py always re-encodes, so this
  means a source clip fed the wrong stream — check the ffprobe output.
- Master loudness is off (not ~-14 LUFS) → the mix busses were bypassed; confirm both
  `loudnorm` filters ran and `amix normalize=0`.
- End card shows a cartoon/AI bottle or smeared text → `end_card.product_image` points at
  an AI render, or a font failed to load (build_endcard falls back to DejaVu → Arial →
  Pillow default; a Pillow-default fallback looks bitmapped — install DejaVu/Arial).
- Caption flashes a frame before a cut → the +0.08s offset was removed from make_captions.
- Duration far off the summed windows → a `target_sec` wasn't the measured VO duration
  (ffprobe each VO mp3; don't use planned word counts).
```
