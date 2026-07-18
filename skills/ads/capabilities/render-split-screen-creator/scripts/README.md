# render-split-screen-creator scripts — the FREE assembly

`render-split-screen-creator` is the **deterministic, $0 assembly + captions
stage** of the split-screen creator format. The paid stages (the VO, the
gpt-image creator anchor, and the VEED Fabric 1.0 whole-VO lip-sync) are separate,
upstream steps — `create-vo-elevenlabs`, `create-image-gpt-image-fal`, and a
paid **VEED Fabric lip-sync (a no-atom step)**. This capability spends nothing —
it takes the creator lip-sync take + the per-scene VO timing + one 16:9 top clip
per scene + the scene-1 hook graphic + the end-card clip and stitches the finished
master. Re-cuts (re-timed windows, a swapped blurred-fill, new caption chunking, a
restyle, a longer end-card hold) reuse the existing VO / lip-sync / clips and cost
**$0**.

`config.example.json` is the worked example (Perplexity concept-10 "Bloomberg
terminal", ~40s 1080×1920). `PIPELINE.md` maps every config block to its source
step. This README documents the FREE assembly pieces that
`render-split-screen-creator` owns.

## 1. Two-zone composite — top ~52% product clip, bottom ~48% creator

Per scene the assembler builds a 1080×1920 frame in two zones. The TOP zone
(`top_height` ~998, ~52%) runs the real 16:9 product/demo clip **contain-fit**
(uncropped) — its letterbox margins filled with a darkened **blurred cover-scale of
the same clip** (never charcoal/black bars — a flat bar reads cheap). The BOTTOM
zone (~48%) is the creator lip-sync slice **cover-fit**, cropped toward the top so
the face stays framed. A 3px brand-color divider separates the zones.

## 2. Windowing — one claim per scene, never loop a short clip

Each top clip is windowed (`top_start`/`top_end`) to the on-message segment that
proves its VO line. If a clip is shorter than its scene, **do NOT loop it** (that
replays into a sparse/black tail) — set the window and the assembler **speed-fits**
it to the scene length.

## 3. Hard-concat + end card — last sharp frame, no black tail

The scenes are **hard-concatenated** (no dissolves). The body audio is the
concatenated creator VO slices timed per `timing.json` — the sung/spoken creator VO
IS the bed, no separate music. The end card is appended holding the last **sharp**
frame ~3s; if the end-card clip fades to black, hold the last sharp second
(`endcard.clip_end`), not the black tail.

## 4. Captions — from the ASSEMBLED cut, never the raw VO

Captions come from transcribing the **assembled** cut (`master-precaption.mp4`) with
local Whisper — **never the raw `vo.mp3`**. Concat drops inter-scene silence, so the
ad timeline ≠ the VO timeline; only the final cut's audio yields correct caption
timing. Build word-level cues (sentence-aware chunking) and burn the ASS in the
chosen style (`serif-accent`, `kinetic-pop`, `neon-glow`, `clean-bubble`). Keep the
`-precaption` cut + the `.ass` sidecar so captions restyle without re-rendering the
composite. If the host ffmpeg lacks libass, render the cues as timed PIL PNG overlays
composited with ffmpeg `overlay=…:enable='between(t,st,en)'` instead.

## 5. FFmpeg composite

FFmpeg stitches the master — the two-zone composite per scene (contain-fit +
blurred-cover fill + 3px divider + creator slice), hard-concat, append the end card
holding ~3s, mux the creator VO, and `loudnorm I=-14`. Output is a 1080×1920 h264 +
aac master. Deterministic, no paid calls, no keys — the VEED Fabric lip-sync is a
supplied input, produced upstream.
