# PIPELINE — config → scripts

How the declarative `config.example.json` brief maps onto the four engine scripts.
The visuals are 100% deterministic (PIL / Playwright / ffmpeg); the **only paid call**
is the music bed (`fire_music.py`, ~$0.04 ElevenLabs Music via FAL).

## Data flow

```
config.json  ──(author)──►  shot-list.yml  ──►  build_storyboard_preview.py  ──►  storyboard.html   [GATE]
   │                             │                                                   (preview gallery)
   │                             ├──►  render_master.py         ──►  finals/master-*-clean.mp4  (silent)
   │                             └──►  build_text_overlays.py   ──►  overlay PNGs   (only if compositing
   │                                                                                 text over motion clips)
   └──(music_brief)──►  fire_music.py  ──►  working/audio/music-raw.mp3
                                                    │
              master-*-clean.mp4  +  music-raw.mp3  ──(ffmpeg mux, -14dB)──►  finals/master-*-with-music.mp4  ← ship
```

## Field mapping

| `config.json` field | Consumed by | Effect |
|---|---|---|
| `width` / `height` / `fps` | `render_master.py` (`W`, `H`, `FPS`), `build_storyboard_preview.py` (`project`) | canvas + framerate (1080×1920 @ 30) |
| `hook_line` / `hook_eyebrow` | `render_master.py` `hook_html()` | the 3.0s opening sticker beat |
| `value_props[]` (`label`, `eyebrow`, `benefit_sentence`, `accent`, `layout`, `hero_sku`) | `render_master.py` `BEATS` + `prop_beat_html()` | one prop beat each — headline = `label`, eyebrow, accent rule color, `row` vs `hero` layout, which SKU is hero |
| `skus[]` (`slug`, `png`) | `render_master.py` sachet `<img>` src (`source/sachets/<slug>.png`) | per-SKU PNG placed per beat; hero rotates |
| `palette.sku_accents` | `render_master.py` `COLORS`, `shared/_shared.css` `--berry/--cherry/…` | per-flavor accent rule under the eyebrow (never the headline) |
| `palette.ink` | `_shared.css` `--ink` | headline + body color (navy) |
| `tagline` / `cta` / `logo` | `render_master.py` `endcard_html()` | the 2.0s brand end card |
| `pacing.*` | `render_master.py` `BEATS[].dur` | hook 3.0 / prop 2.4 / endcard 2.0 → ~17s total |
| `music_brief` / `music.*` | `fire_music.py` `PROMPT`, `music_length_ms`, `force_instrumental`; ffmpeg mux `mix_db` | instrumental bed, mixed at −14 dB with fade in/out |

## Scripts

| Script | Paid? | Does |
|---|---|---|
| `build_storyboard_preview.py` | free | reads `shot-list.yml` → writes per-beat HTML + Playwright preview PNGs → assembles `storyboard.html` (the Gate-2 review gallery). |
| `render_master.py` | free | writes each beat HTML (hook + N props + endcard) from the `BEATS` spec, renders via the `create-motion-graphics-hyperframes` atom's `render_hyperframe.py` (deterministic `renderAt(t)`), concats + muxes a silent stereo track → `finals/master-*-clean.mp4`. |
| `build_text_overlays.py` | free | optional — emits transparent text-zone PNGs (top 380px opaque, rest alpha) for compositing the claims OVER a motion/i2v clip instead of a static canvas. Not needed for the static VP-SWAP path. |
| `fire_music.py` | **PAID** | ElevenLabs Music (FAL `fal-ai/elevenlabs/music`, `force_instrumental: true`) → `working/audio/music-raw.mp3`. Pass `music_brief: null` to ship silent. |

## Final mux (deterministic)

```
ffmpeg -i master-clean.mp4 -i music-raw.mp3 \
  -filter_complex "[1:a]afade=t=in:st=0:d=0.4,afade=t=out:st=16.4:d=0.6,volume=-14dB[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest master-with-music.mp4
```

Verify: `ffprobe` audio `bit_rate ≥ 100000`; `volumedetect` mean between −25 and −34 dB
(background level). The Som demo lands at mean −31 dB / 191 kbps aac / 17.0s.
