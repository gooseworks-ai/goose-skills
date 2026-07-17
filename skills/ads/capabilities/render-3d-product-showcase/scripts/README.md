# render-3d-product-showcase scripts — the FREE assembly

`render-3d-product-showcase` is the **deterministic, $0 assembly stage** of the 3D
product-showcase format. The paid stages are separate capabilities:

- **the styled hero** (identity lock) — `create-image-fal` (nano-banana edit) restyles the
  brand's REAL product photo onto the seamless brand-color studio set. This is the seed for
  Beats 1 & 2 and the fallback end-card background. The product geometry is the real product,
  never AI-invented.
- **Beats 1 & 2** (hero rotation + macro push-in) — `create-video-fal` image-to-video seeded on
  that styled hero.
- **Beat 3** (physics reveal) — `create-video-fal` Veo3 i2v seeded on Beat 1's last frame.
- **the bed** — `create-music-elevenlabs` (`force_instrumental` true).

There is **no Higgsfield / Marketing Studio** in this format; every paid call routes through the
fal-proxy / elevenlabs-proxy so it bills the Ads agent. This capability spends nothing: given the
four delivered beats + the brand wordmark it stitches the finished master. Re-cuts (a swapped end
card, a re-timed beat, a re-mixed bed) reuse the existing beats and cost **$0**.

`config.example.json` is the worked example (DIBS Beauty "Desert Island Duo", ~15s 720×1280).
`build_endcard.py` and `build_masters.py` are the runnable free assembly (below). `PIPELINE.md`
maps every config block to its source step.

## 1. Beat 1 last-frame extract — the shared anchor

Extract Beat 1's last frame once (`ffmpeg -sseof -0.1 -i beat1.mp4 -frames:v 1
beat1_last_frame.png`). It is the shared anchor: it seeds the Veo3 Beat 3 (paid, upstream) AND
backs the Beat 4 end-card hyperframe. Extracting it once keeps the product + lighting identical
across the reveal and the close, so the geometry never AI-drifts.

## 2. End card — `build_endcard.py` (Playwright hyperframe, no AI text)

```
build_endcard.py --bg beat1_last_frame.png --headline "YOUR SANCTUARY AT HOME" \
    --wordmark brand-logo.svg --out endcard.png [--headline-size 86] [--headline-color auto]
```

Beat 1's stilled last frame + a scrim + a Playfair headline + the brand's **REAL** wordmark
(SVG inlined and recolored, or a PNG). It renders at 1080×1920 via `scripts/shoot.js` (Playwright)
then ffmpeg-scales to 720×1280 (matching the viewport to the output dims clips the right edge).
The brand text is **never** AI-rendered — a diffusion model garbles a wordmark. `--headline-color
auto` picks warm-white on a dark/saturated bg and dark ink on a light/pastel bg. Playfair loads
from Google Fonts (bundle the .ttf for offline determinism). If the resolvable Playwright wants an
uninstalled browser build, `export PW_CHROME=<installed Chromium binary>`.

## 3. Assemble + mix — `build_masters.py` (per-beat normalize + hard-concat + music)

```
build_masters.py --config config.json --clips working/clips --endcard endcard.png \
    --music working/music.mp3 --out working/master.mp4
```

Reads the config, then for each beat: **trims to its window** (`beats[].duration_sec`, with
`beats[].trim_start` — defaults to 1.0s for the Veo3 reveal so its 8s take lands on rise → peak →
early settle), normalizes to the brand canvas (strip the i2v model's auto-audio with `-an`, scale
+ pad to 720×1280 with the brand `bg` pad color, 24fps, yuv420p, crf 18), and — for the end card —
holds the still for its duration. The normalized segments are hard-concatenated (concat demuxer)
in beat order — no dissolves. `reveal_variant == rotation_only` skips Beat 3 automatically.

Then it mixes one ElevenLabs instrumental bed under the concat: `afade` in 0.3s / out 0.6s +
`loudnorm I=-16 TP=-1.5 LRA=11`, `apad` + atrimmed to the master duration. Music-only — no VO, no
second bed. Output is a 720×1280 h264 + aac master (~15s). Deterministic, no paid calls, no keys.
