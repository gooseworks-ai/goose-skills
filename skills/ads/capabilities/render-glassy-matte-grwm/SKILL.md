---
name: render-glassy-matte-grwm
description: Assemble a multi-scene GRWM beauty-demo ad from a config — a locked-identity creator applies ~5 products step by step while a SEPARATE ElevenLabs voiceover narrates and every scene cut is snapped to the VO's product-name word-starts (Whisper word-level timestamps), then ~5 Playwright product overlay cards (real PDP-verified taglines) are composited onto the master each on its product-NAME word-start, the SEPARATE VO is mixed on top of a ducked music bed at loudnorm I=-14, clean-white 3-words/cue captions are burned, and the video closes on a flat-lay end card. This is the FREE deterministic assembly stage (re-cut to the VO word-starts, hard-concat, Playwright card render + card composite, VO plus music mix, caption burn, flat-lay end card); the VO, scene clips, product cutouts, and music come from create-music-elevenlabs / create-image-gpt-image-fal / create-video-fal. Use for the glassy-matte-grwm format.
status: active
---

# render-glassy-matte-grwm

Assemble a **multi-scene GRWM beauty-demo** ad from a config — a locked-identity creator applies
~5 makeup/skincare products step by step at a vanity, a **separate** ElevenLabs voiceover
narrates the routine, and every scene cut is snapped to the VO's product-name word-starts, with
~5 Playwright product overlay cards on the product-name beats, a ducked music bed, burned
captions, and a flat-lay end card. This capability is the **FREE, deterministic assembly** —
the Whisper-driven re-cut + hard-concat, the Playwright card render + card composite, the VO +
music mix, the caption burn, and the flat-lay end card.

This is the **multi-scene beauty demo**, distinct from the single-take apparel outfit-reveal
(`ugc-grwm`, one Seedance reference-to-video call with native lip-sync and minimal post). Here the
timeline is driven by a SEPARATE VO and the scenes are re-cut to its word-starts.

`scripts/config.example.json` is the worked example (DIBS Beauty "5-Step Glassy Matte Routine",
~32s 1080×1920 9:16, 12 VO-snapped cuts + 5 product cards); `scripts/PIPELINE.md` maps every
config block to its source step and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are
separate capabilities — the SEPARATE narration VO (`create-music-elevenlabs`, or a user-supplied
mp3; word-level Whisper timestamps set the timeline), ~7 Seedance scene clips one per product step
(`create-video-fal`), the ~5 white-bg product cutouts + the flat-lay end-card still
(`create-image-gpt-image-fal`), and the ducked music bed. Given the VO + `.words.json` + one clip
per step + the ~5 product cutouts + the music bed, `render-glassy-matte-grwm` re-cuts each clip to
its VO word-start window, hard-concats on the cut, renders + composites the product cards on the
product-name beats, mixes the VO over the ducked music, burns the captions, and appends the
flat-lay end card → the master. Re-cuts reuse the existing VO / clips / cutouts and cost **$0**.

## Contract (the free assembly)

- **The SEPARATE VO drives the timeline — Whisper it first.** The narration is a separate track
  (not a native take). Its word-level timestamps set every cut; the atempo'd VO ends shorter than
  the plan expects (a 1.15× VO landed ~27.5s), so time every window to the word-starts, never to a
  pre-planned grid.
- **Scene cuts snap to the "step N" word-start; cards snap to the product-NAME word-start.** Cut to
  the next product when its step is announced; the card animates in ~1s later when the NAME is
  spoken. Both happen. ~12 cuts over ~32s (cuts/10s ≈ 3.75).
- **Hard-concat with a re-encode.** Hard cuts on the VO word-starts, no dissolves; re-encode the
  concat `-c:v libx264 -crf 20` — `-c copy` corrupts the duration when zoompan/PNG clips are in the
  chain.
- **Product cards — Playwright, real cutout, PDP-verified tagline.** Playwright renders the card
  template at 2× scale (real white-bg cutout thumb + name + PDP tagline). The cutout must match the
  REAL product, not the Seedance scene's hallucinated barrel; the tagline is verified against the
  brand PDP (AI flat-lays hallucinate sublines). Composite each card onto the master snapped to its
  product-NAME word-start, 1s fade-in, held until the next product is named. **PNG overlay inputs
  need `-loop 1 -t <dur>`** — without it the PNG emits one frame at t=0 and the fade/enable filters
  silently no-op (cards go invisible).
- **VO leads the ducked music bed.** Mix the SEPARATE VO on top of the ducked music (the VO is the
  lead), `loudnorm I=-14`. If the host ffmpeg lacks a filter, apad/atrim to length before the mix.
- **Captions — clean-white, override the preset.** Clean-white captions from the VO's Whisper
  words, overridden to 3 words/cue, ~3.0% font, ~20% margin, NO pill, NO shadow (the default
  5-words/4.5%/18% reads too dense). Burn last. If the host ffmpeg lacks libass, render the cues as
  timed PIL PNG overlays composited with ffmpeg `overlay=…:enable='between(t,st,en)'` at the same
  placement.
- **Flat-lay end card.** Append the flat-lay still (ken-burns hold ~4s) — a gpt-image-2 flat-lay of
  the ~5 products; do NOT trust its AI-rendered sublines for the card taglines.
- **FFmpeg composite, deterministic, FREE.** Re-cut, hard-concat, render + composite the cards, mix
  the VO over the ducked music, burn the captions, append the end card → a 1080×1920 30fps h264+aac
  master (~32s). No paid calls, no keys.
