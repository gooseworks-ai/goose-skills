# Pipeline — cosmic-mythology-voiceover reel

How `config.example.json` maps to the real production steps. This capability ships a
**config + this map**, not a bundled runner: the worked example (WishAstro "Saturn isn't your
villain") was produced by a handful of per-project drivers that live in
`clients/wishastro/accounts/wishastro-ig/posts/saturn-myth/working/`
(`vo.py`, `gen_images2.py`, `build_video2.py`). Reference those directly, or drive the whole run
via `video-orchestrator-with-control-plane`.

The steps run **in order** because each depends on the last: the VO sets the timeline (its
delivered, atempo-stretched duration), the timeline + the weight array drive each cut's length,
the one look pack drives the stills, the stills seed the Ken-Burns clips, and assembly concats
them + composites the VO + fades the hook on + burns the captions.

## Field → source-script map

| Config field | Phase | Source step / script (in the run) | Paid? |
|---|---|---|---|
| `vo.script`, `vo.tone_tags`, `vo.model`, `vo.voice_id`, `vo.voice_settings` | 1 VO | ElevenLabs `eleven_v3` (tone-tagged) → mp3 | **PAID** |
| `vo.atempo_factor`, `vo.atempo_clamp_max`, `vo.target_duration_s` | 1 VO | atempo time-stretch to target, clamp ≤ 1.25 → `working/vo2/*_atempo1.25.mp3` | free |
| `vo.outputs.manifest` (rendered / final duration) | 1 VO | `working/vo2/saturn-vo2.manifest.json` | free |
| `look_pack.style_descriptor`, `look_pack.palette_anchors` | 2 Stills | threaded verbatim into every image prompt | (defines cost) |
| `shots[].prompt`, `image_engine` | 2 Stills | `working/gen_images2.py` → `fal-ai/flux-pro/v1.1`, `portrait_16_9`, `safety_tolerance 5` → `assets/img*.png` | **PAID** |
| `sequence.cuts[].still/zoom_out/weight`, `sequence.zoom_end` | 3 Assembly | `working/build_video2.py` weighted formula `cut_dur = VO_dur × weight / Σweights` | free |
| `sequence.fade_in_first_s`, `.fade_out_last_s`, Ken-Burns clips | 3 Assembly | `working/build_video2.py` calls the ken-burns-clip atom `render.py` (scale 2×, zoompan) → `working/kb_NN.mp4` | free |
| `hook.text`, `hook.fade_in_s`, `.hold_until_s`, `.fade_out_s` | 3 Assembly | `working/build_video2.py` ffmpeg `drawtext` alpha window | free |
| assembly (`fps`, `crf`, dims) | 3 Assembly | `working/build_video2.py` ffmpeg concat → composite BG + VO (libx264 crf18, aac 192k) → `working/draft2.mp4` | free |
| `captions` | 3 Assembly | VEED/Whisper subtitle burn on `working/draft2.mp4` → `finals/saturn-myth-v2.mp4` (free local Whisper + ffmpeg fallback) | ~$ (VEED) / free (local) |

## 1. VO → ElevenLabs `eleven_v3`  (config: `vo`)  [PAID]

**Lock the VO FIRST — it sets the timeline.** Feed the tone-tagged script (`[soft, casual]`
opener) to ElevenLabs `eleven_v3` (`eleven_multilingual_v2` is the plainer fallback) with a warm
female voice → `working/vo2/vo.mp3`. Measure the rendered duration, then **atempo time-stretch to
the target, CLAMPING the factor ≤ ~1.25** so the voice never chipmunks: the worked example rendered
39.24s, a 23s target needed factor 1.71, so it clamped at 1.25 → **31.4s final** and flagged the
overshoot rather than pushing the factor. **The delivered VO duration sets the timeline** —
distribute the cuts across it; never trim the VO to a pre-planned grid.

## 2. Stills → Flux Pro 1.1  (config: `shots`, `look_pack`, `image_engine`)  [PAID]

`working/gen_images2.py` builds each prompt as `look_pack.style_descriptor` + `shots[i].prompt`
and calls `fal-ai/flux-pro/v1.1` at `image_size: portrait_16_9`, `safety_tolerance: 5`, `png`.
**6 hero cosmic stills**; stills are **reusable** — the sequence repeats a few to reach the ~10–12
cuts. The "no text, no words" tail on the style descriptor is load-bearing — the reel's only text
is the hook + captions, added in post. Review all before step 3.

## 3. Assembly (weighted sequence + Ken-Burns + concat + VO + hook + captions)  (config: `sequence`, `hook`, `captions`)  [FREE]

`working/build_video2.py` owns the whole free assembly:

- **Weighted beat-sync:** the `SEQ` array is `(image, zoom_out, weight)` per cut. It measures the
  VO duration `D`, sums the weights, and gives each cut `seg = D × weight / Σweights` — heavier
  weights **hold longer** on the emotional beats (open 1.15, dawn close 1.2), lighter setup cuts
  shorter (0.8–0.95).
- **Ken-Burns render:** each cut renders through the **ken-burns-clip atom** (`render.py`: scale
  2×, center crop, `zoompan` to `--zoom-end 1.10`, `--zoom-out` on the flagged cuts), with
  `--fade-in 0.4` on the **first** cut and `--fade-out 0.6` on the **last** → `working/kb_NN.mp4`.
- **Concat:** ffmpeg-concat the N Ken-Burns clips (`-c copy`) → `working/bg2.mp4`.
- **VO composite + hook:** one ffmpeg pass takes `bg2.mp4` + the atempo VO, applies a `drawtext` of
  the ONE hook line with an **alpha-fade window** (fade in ~0.5s at `t=0.3`, hold, fade out ~0.6s
  ending `t=3.0`) over the open, maps `0:v` + `1:a`, encodes libx264 `-crf 18` + aac 192k
  `-shortest` → `working/draft2.mp4`.
- **Captions:** VEED/Whisper subtitle burn (`veed/subtitles`, `whisper` preset, bottom, white
  `#FFFFFF`) on `draft2.mp4` → `finals/saturn-myth-v2.mp4`. A local Whisper + ffmpeg `subtitles`
  burn (or timed PIL PNG overlays if libass is missing) is the **free** fallback to the VEED tier.

Re-cuts (re-weighted windows, new hook timing, caption chunking, zoom params) reuse the existing
VO + stills and cost **$0** — only steps 1–2 spend.
