# Smoke test — render-myth-vs-fact

Verifies the free deterministic assembly end-to-end. No paid calls. Needs: Python 3,
**Playwright chromium** (for the hyperframe render), and `ffmpeg`/`ffprobe`. If
Playwright/browsers aren't installed, skip Phase A (the render) and validate the
concat/mix/caption path (Phase B) with synthetic beat mp4s + a synthetic VO.

## Setup

```bash
cd scripts
python3 -m pip install playwright && playwright install chromium   # if not present
mkdir -p /tmp/mvf-smoke
# Copy the example config and REPLACE the paths / copy for a real run:
#   - "vo"           : the RENDERED VO mp3 (measured; the timeline hangs off it)
#   - "music"        : an instrumental bed (or delete the key for VO-only)
#   - "end_card_png" : the pre-built brand end-card PNG (9:16)
#   - "palette"      : the five CSS-var tokens (bg / myth_strike / fact_accent /
#                      headline_ink / accent)
#   - "beats[]"      : the myth/fact pairs + hook / turn / punch copy + cue times
cp config.example.json /tmp/mvf-smoke/config.json
```

## Phase A — one myth→fact beat (Playwright present)

Renders a single flip card to confirm the frame-exact render + the per-line strike.

```bash
# render ONLY the myth-fact beat (id 02 in the example config)
python3 render_beats.py --config /tmp/mvf-smoke/config.json \
                        --work-dir /tmp/mvf-smoke --only 02
ffprobe -v error -select_streams v:0 \
  -show_entries stream=r_frame_rate,width,height,nb_frames \
  -show_entries format=duration -of default=nw=1 /tmp/mvf-smoke/frames/beat-02.mp4
# eyeball a mid-beat frame (FACT resolved + strike done)
ffmpeg -y -loglevel error -ss 2.4 -i /tmp/mvf-smoke/frames/beat-02.mp4 \
       -frames:v 1 /tmp/mvf-smoke/frame_check.png
```

## Phase B — beat-snap + captions + compose

VO-first: snap beats to the VO, build captions, assemble. Use `--no-whisper` (no FAL) to
run fully offline off the config durations.

```bash
# 1) beat-snap (writes beat-manifest.json + whisper/words-flat.json)
python3 beat_snap.py --config /tmp/mvf-smoke/config.json \
                     --work-dir /tmp/mvf-smoke --no-whisper     # or drop --no-whisper (needs FAL_KEY)

# 2) captions (from the manifest + words)
python3 make_captions.py --manifest /tmp/mvf-smoke/beat-manifest.json \
                         --words /tmp/mvf-smoke/whisper/words-flat.json \
                         --out /tmp/mvf-smoke/captions.ass \
                         --config /tmp/mvf-smoke/config.json

# 3) assemble the master (concat beats -> mix VO/music -> burn captions)
python3 compose.py --config /tmp/mvf-smoke/config.json \
                   --work-dir /tmp/mvf-smoke \
                   --out /tmp/mvf-smoke/master.mp4
```

For a Playwright-free assembly check, synthesize the beat mp4s + VO first:

```bash
# a 1080x1920 solid-color beat + a matching-length VO tone, per beat n in the manifest
ffmpeg -y -f lavfi -i color=c=0xF4F1F7:s=1080x1920:d=3.44 -r 25 \
  -f lavfi -t 3.44 -i anullsrc=cl=stereo:r=44100 \
  -c:v libx264 -pix_fmt yuv420p -shortest /tmp/mvf-smoke/frames/beat-02.mp4
ffmpeg -y -f lavfi -i "sine=frequency=220:duration=3.44" -ar 44100 -ac 2 /tmp/mvf-smoke/vo.mp3
# then run steps 1-3 above (a single-beat manifest)
```

## Expect

- `render_beats.py` writes `frames/beat-02.mp4`: **1080×1920, `r_frame_rate=25/1`**,
  `nb_frames == round(duration × 25)`, duration within ±0.04s. The mid-beat frame shows a
  red MYTH pill, the myth line struck through with a red bar crossing the vertical MIDDLE of
  **every** wrapped line, and the teal FACT check + payload with the `[bracketed]` phrase
  accented — NOT an underline on line 1 only, NO AI-rendered text.
- `beat_snap.py` writes `beat-manifest.json` (beats with `start`/`end`/`duration`) +
  `whisper/words-flat.json`.
- `make_captions.py` writes `captions.ass` — reports `N chunks from M words` and the
  suppressed beats. The `Events Format:` line carries the `Name` field (no leading-comma
  artifact); the proof + end-card beats are suppressed.
- `compose.py` prints the concat packet count, the mix line (`VO + music@-20dB` or
  `VO only`), and `WROTE … (expected ~Xs, delta ±…)`. `master.mp4` is 1080×1920, 25fps,
  h264+aac; duration within ±0.1s of the summed beat durations; `volumedetect` mean is well
  above silence (VO present).
- Run the `watch` skill on `master.mp4`: the red strike crosses every wrapped myth line, the
  VO is intelligible, captions are legible with no card collision, suppression is correct on
  the proof + end-card beats, framerate is uniform 25/1, no clipping, every claim is legible
  sound-off.

## Fail signals

- **Strike reads as an underline on line 1 / floats above line 2** → a single fixed-Y rule
  was used instead of `buildLineStrikes` + `strikeLines`; the per-line measure is
  load-bearing on any wrapped myth.
- **Concat drops frames / audio desyncs** → a beat mp4 isn't the configured fps.
  `render_beats.py` warns on any `r_frame_rate != <fps>/1`; re-render the offending beat.
- **Every caption has a leading comma** → the ASS `Events Format:` line is missing the
  `Name` field.
- **Captions collide with the proof footnote or the end-card text** → those beats weren't
  suppressed; add them to `suppress_beats` or set `captions:false` on the beat.
- **Music pumps under the VO** → `amix normalize=0` got flipped to `normalize=1`.
- **Master is silent** (`volumedetect` mean ≈ −90 dB) → the beat mp4s' silent placeholder
  AAC won the picker; `compose.py` maps the mixed audio explicitly — confirm `--vo` resolved.
- **End card shows AI-rendered art / smeared text** → `end_card_png` points at a generated
  image; the end card is ALWAYS the pre-built brand PNG, never generated per run.
```
