---
name: render-creator-pip-listicle
description: Assemble a creator picture-in-picture product-listicle ad from a config — per-beat native talking-head clips (voice plus lips generated together, no separate VO) are each cut into TWO shots (creator plus a real-brand UGC clip picture-in-picture top-right plus a bottom product card for ~60%, then a hard switch to a full-frame Ken-Burns product cutaway or a branded PIL text card for ~40%), the creator beat's native audio muxed continuous under both shots while the PiP audio is muted, a persistent title pill (opt-in) plus a counting rank badge burned on the creator shots, all beats hard-concatenated at 30fps, and white 2-ish-word captions in the lower third with a brand-color accent burned last over the stitched master. This is the FREE deterministic assembly stage (Ken-Burns macros plus product cards plus 2-shot PiP composite plus stitch plus captions); the creator anchor and the N native talking clips come from create-image-gpt-image-fal and create-video-fal. Use for the creator-pip-listicle format.
status: active
---

# render-creator-pip-listicle

Assemble a **creator picture-in-picture product listicle** ad from a config: an AI creator counts
down N products in the brand's own voice, and every product beat is a two-shot micro-cut — the
creator on camera with a real-brand UGC clip picture-in-picture top-right + a product card pinned
bottom, then a hard switch to a full-frame product cutaway (a Ken-Burns macro of the real product
photo, or a branded PIL text card). The creator's voice + lips are generated **together, natively**
per beat — there is no separate voiceover. This capability is the **FREE, deterministic assembly** —
the Ken-Burns macros, the product cards, the two-shot PiP composite, the stitch, and the caption
burn.

`scripts/config.example.json` is the worked example (DIBS Beauty "5 products that replaced my whole
makeup bag", ~46s 1080×1920 9:16, a hook + 5 product beats + a CTA); `scripts/PIPELINE.md` maps
every config block to its source step and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing beyond the optional caption
burn. The paid inputs are separate capabilities — the creator anchor (`create-image-gpt-image-fal`,
gpt-image-2 iPhone-candid) and one native Seedance talking clip per beat (`create-video-fal`,
`generate_audio=ON`, the SAME seed across beats so the face holds). Given those native clips + the
brand's real UGC PiP clips + the real product photos + the brand palette,
`render-creator-pip-listicle` builds the Ken-Burns product macros + the product cards, cuts each
product beat into its two shots (creator + PiP + card, then full-frame cutaway), muxes the creator
beat's native audio continuous under both shots, hard-concats all the beats, and burns the captions
last → the master. Re-cuts reuse the existing native clips + overlays and cost **$0**.

## Contract (the free assembly)

- **Native creator audio carries the reel — no separate VO.** Each beat's voice + lips come from
  ONE Seedance take (`generate_audio=ON`); this stage never adds a VO or a lip-sync pass. The
  creator beat's native audio plays **continuous under both shots** of the beat; the b-roll shot is
  silent video and the **PiP audio is muted** (else the voice doubles).
- **Two shots per product beat.** Cut each product beat into (a) creator + PiP top-right + product
  card bottom for ~60% and (b) a full-frame Ken-Burns product cutaway (or PIL text card) + card for
  ~40%, then hard-concat on the cut (targets ≥4 cuts/10s, ≤50% direct-face share). The hook
  front-loads a ~1.6s swipe macro; the CTA is a single creator shot.
- **PiP is the brand's REAL UGC, muted, top-right.** Scale the real UGC clip to ~0.42×0.32 of the
  frame, overlay top-right with a hairline white border, and **strip its audio**. Never
  AI-regenerate the PiP clip.
- **Products are REAL photos — never AI-render the product.** Ken-Burns macros (push-in on the real
  product photo on a soft brand-gradient canvas) + bottom-pinned product cards come from the brand's
  real product photos; a product with no clean photo falls back to a branded PIL text card, never an
  AI product render (i2v mangles the label).
- **Title pill opt-in, rank badge on product beats.** The persistent title pill is opt-in per beat
  (`show_title`, default off); a counting rank badge rides the PiP on product beats.
- **Captions burned LAST, brand-accent.** White 2-ish-word chunks in the lower third with a
  brand-color accent, from the native audio's word timings — the on-screen safety net for brand
  tokens the model may mis-voice. This is the only stage that may spend (~$1). If the host ffmpeg
  lacks libass, render the cues as timed PIL PNG overlays at the same lower-third placement.
- **FFmpeg composite, deterministic, FREE.** Build the Ken-Burns macros + product cards (PIL +
  ffmpeg), overlay the PiP + card + title pill + rank badge, cut each beat into two shots, mux the
  native audio continuous, hard-concat all beats with the concat demuxer @ 30fps / yuv420p → a
  1080×1920 h264+aac master. No paid calls in the composite/stitch, no keys.
