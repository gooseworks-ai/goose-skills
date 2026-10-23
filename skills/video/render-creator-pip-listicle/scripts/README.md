# render-creator-pip-listicle scripts — the FREE assembly

`render-creator-pip-listicle` is the **deterministic, $0 assembly stage** of the creator-pip-listicle
format. The paid stages (the creator anchor, the N per-beat native Seedance talking clips) are
separate capabilities — `create-image-fal` (**Seedream v5 Pro**) and `create-video-fal` (**Seedance
2.0**). This capability takes those native clips + the brand's real UGC demo clips (or the product's
own autocropped UI stills / screen recordings) + the real product photos + the brand palette + the
title copy and stitches the finished master. Re-cuts (new beat durations, a swapped card, a re-cropped
demo, a caption re-chunk, toggled overlays) reuse the existing native clips + overlays and cost **$0**.

`config.example.json` is the worked example (DIBS Beauty "5 products that replaced my whole makeup
bag", ~46s 1080×1920). `PIPELINE.md` maps every config block to its source step. This README
documents the FREE assembly pieces that `render-creator-pip-listicle` owns.

**The one thing to get right:** the creator stays **FULL-FRAME the whole beat** — there is **NO cut
to a full-frame product shot, ever**. The product content lives entirely in overlays that ride on top
of the full-frame creator.

## 0. The paid inputs (separate caps) — Seedream v5 Pro anchor + Seedance 2.0 clips

- **Anchor** (`create-image-fal`): ONE **Seedream v5 Pro** candid portrait — model
  `bytedance/seedream/v5/pro/text-to-image` (**no `fal-ai/` prefix**). Seedance 2.0's
  partner-validation gate REJECTS photoreal faces from **gpt-image-2 AND Seedream v4** ("may contain
  likenesses of real people"); a **Seedream v5 Pro** face passes. Use a **FRESH** image.
- **Clips** (`create-video-fal`): ONE Seedance 2.0 reference-to-video call per beat — model
  `bytedance/seedance-2.0/reference-to-video`, `generate_audio=ON`, SAME seed across beats, 720p
  default. A **REJECTED submit STILL bills** via the fal-proxy → **pre-flight ONE test clip (the
  hook)** first. Presigned anchor URLs expire ~1h → re-host if a batch runs long. The intermittent fal
  "User is locked: Exhausted balance" is the proxy's upstream account → retry with backoff.

## 1. Demo PiP prep (autocrop) + product cards — REAL demo + REAL product photos, no AI product

- **Demo (PiP):** the demo shown in the top-right PiP is the brand's **REAL UGC clip** (MUTED, never
  AI-regenerated) → `pip-<slug>.mp4`; OR, for a brand with **NO UGC** (B2B/SaaS), the product's own
  demo — a real screen-recording, or an **AUTOCROPPED** high-res product-UI/dashboard still →
  `demo-<slug>.png`. Autocrop each still (trim transparent/near-white margins) and size the PiP window
  to the cropped content's aspect ratio so it **FILLS the window — no letterbox whitespace** (a
  **WIDE screenshot → a SHORT + WIDE window**). Disclose in the review when the demo is a still/mockup
  rather than a real UGC clip.
- **Product cards** (`render_product_cards.py`): a bottom-pinned rounded card PNG — rounded product/UI
  thumbnail left, then "N · CATEGORY" (rank + short category, brand-accent, small caps) and the product
  NAME in a serif face (Georgia/Times) below, brand palette — from the real product photo (or a
  brand-color tile with the wordmark if no photo). Pinned bottom on the whole product beat. The product
  is **never** AI-regenerated (i2v mangles the label into gibberish).

## 2. Single-shot full-frame composite + persistent overlays

Each beat is **ONE continuous full-frame creator shot** with persistent overlays (`composite_pip.py`)
— **there is NO cut to a full-frame product shot** (`per_beat_shots = 1`). On each **product** beat,
three overlays ride on top of the full-frame creator for the **whole beat**: (a) the **title pill**
top-center, (b) the **demo PiP** top-right (autocropped, window sized to the demo's aspect so it
fills), (c) the **product card** pinned bottom with a rank number. Hook + CTA are the full-frame
creator with the **title pill only** (no PiP/card).

Per beat: build ONE full-1080×1920 transparent overlay PNG (title pill; + PiP + card + rank number on
product beats), scale the creator clip to 1080×1920 (**cover**), overlay the PNG for the whole beat.

## 3. Native audio — continuous across the beat, no separate VO

The creator beat's native Seedance audio (voice + lips generated together in the take) plays
**continuous across the whole beat**, and the demo PiP clip's own audio is **muted** so the voice
never doubles. There is **no separate VO** and **no lip-sync bolt-on**.

## 4. Captions — burned LAST as PIL PNG overlays, brand-accent, deterministic

This ffmpeg has **no libass** (no `subtitles`/`ass` filter), so captions are rendered as **timed PIL
PNG overlays**: each ~2-word cue is a PIL PNG (white words + a brand-accent underline, black stroke)
composited with ffmpeg `overlay=…:enable='between(t,s,e)'`, positioned **CLEAR of the top-right PiP
and the bottom card** (mid-to-lower band). Time them **DETERMINISTICALLY** from the known per-beat
script — the fal-ai/whisper proxy is unreliable (900s timeouts); do **not** depend on it. The known
script is the brand-correct source, so brand tokens are always spelled right. Burned **last**, over
the stitched master.

## 5. FFmpeg composite

FFmpeg stitches the master: build the per-beat overlay PNG (title pill + demo PiP + product card +
rank number), cover-scale the creator clip to 1080×1920, overlay the PNG for the whole beat while
keeping the native audio, hard-concat all beats with the concat demuxer @ 30fps / yuv420p → a
1080×1920 h264 + aac master, then burn the PIL-PNG captions last. Probe durations with `ffprobe -of
csv=p=0` (NOT `-of default=nk=1:np=1`, which errors on some builds). The native creator audio IS the
bed — no separate VO. Deterministic, no paid calls in the composite/stitch, no keys.
