# render-creator-pip-listicle scripts — the FREE assembly

`render-creator-pip-listicle` is the **deterministic, $0 assembly stage** of the creator-pip-listicle
format (the only stage that may spend is the optional caption burn). The paid stages (the creator
anchor, the N per-beat native Seedance talking clips) are separate capabilities —
`create-image-gpt-image-fal`, `create-video-fal`. This capability takes those native clips + the
brand's real UGC PiP clips + the real product photos + the brand palette and stitches the finished
master. Re-cuts (new beat durations, a re-timed shot split, a swapped card, a caption re-chunk, a
toggled title pill) reuse the existing native clips + overlays and cost **$0**.

`config.example.json` is the worked example (DIBS Beauty "5 products that replaced my whole makeup
bag", ~46s 1080×1920). `PIPELINE.md` maps every config block to its source step. This README
documents the FREE assembly pieces that `render-creator-pip-listicle` owns.

## 1. Ken-Burns b-roll macros + product cards — from the REAL product photos, no AI product

- **Ken-Burns macros** (`broll_kenburns.py`): each real product photo is centered on a soft
  brand-gradient 9:16 canvas (+ a soft drop shadow) and gets a slow push-in (zoom → 1.16x) over
  ~2.6s → the full-frame product cutaway for shot (b) of each product beat. A product with **no
  clean photo** falls back to a branded PIL text card — the product is **never** AI-regenerated
  (i2v mangles the label into gibberish).
- **Product cards** (`render_product_cards.py`): a bottom-pinned rounded card PNG — accent stripe
  left, product thumbnail + name + subtitle in the brand type, brand palette — from the real product
  photo (or a brand-color tile with the wordmark if no photo). Pinned bottom on **both** shots of a
  product beat.

## 2. Two-shot multicut + PiP + rank badge — the format's cut density

Each product beat is cut into **two shots** (`composite_native_multicut.py`): (a) creator + real UGC
PiP top-right (scaled ~0.42×0.32, hairline white border, **audio MUTED**) + product card bottom (+
title pill if `show_title` + rank badge on the PiP) for ~60%, then a hard switch to (b) the
full-frame Ken-Burns product cutaway (or PIL text card) + card for ~40%. The hook front-loads a
~1.6s swipe macro; the CTA is a single creator shot. Targets ≥4 cuts/10s and ≤50% direct-face share.

## 3. Native audio — continuous under both shots, no separate VO

The creator beat's native Seedance audio (voice + lips generated together in the take) plays
**continuous under the whole beat** — the b-roll shot is silent video, and the PiP clip's own audio
is stripped so the voice never doubles. There is **no separate VO** and **no lip-sync bolt-on**.

## 4. Captions — burned LAST, brand-accent

Captions come from the native audio's word timings, rendered as white 2-ish-word chunks in the lower
third with a brand-color accent (`burn-in-captions --style white-words --accent <brand-hex>`) — the
on-screen safety net for brand tokens Seedance may mis-voice. Burned **last**, over the stitched
master. This is the only stage that may spend (~$1). If the host ffmpeg lacks libass (no
`subtitles`/`ass` filter), render the cues as timed PIL PNG overlays composited with ffmpeg
`overlay=…:enable='between(t,st,en)'` at the same lower-third placement.

## 5. FFmpeg composite

FFmpeg stitches the master: build the Ken-Burns macros + product cards, overlay the PiP + card +
title pill + rank badge, cut each beat into its two shots, mux the creator beat's native audio
continuous under both, hard-concat all beats with the concat demuxer @ 30fps / yuv420p → a
1080×1920 h264 + aac master. The native creator audio IS the bed — no separate VO. Deterministic, no
paid calls in the composite/stitch, no keys.
