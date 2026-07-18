# render-glassy-matte-grwm scripts — the FREE assembly

`render-glassy-matte-grwm` is the **deterministic, $0 assembly stage** of the multi-scene GRWM
beauty-demo format. The paid stages (the SEPARATE narration VO, the ~7 Seedance scene clips, the
~5 gpt-image-2 product cutouts + the flat-lay end-card still, the music bed) are separate
capabilities — `create-music-elevenlabs`, `create-video-fal`, `create-image-gpt-image-fal`. This
capability spends nothing — it takes the VO + `<vo>.words.json` + one clip per product step + the
~5 product cutouts + the music bed and stitches the finished master. Re-cuts (new cut windows,
re-timed cards, a swapped end card, caption chunking) reuse the existing VO / clips / cutouts and
cost **$0**.

`config.example.json` is the worked example (DIBS Beauty "5-Step Glassy Matte Routine", ~32s
1080×1920). `PIPELINE.md` maps every config block to its source step. This README documents the
FREE assembly pieces that `render-glassy-matte-grwm` owns.

## 1. Re-cut to the VO word-starts + hard-concat on the cut

The SEPARATE VO drives the timeline. Groq `whisper-large-v3` word-level gives the word-start of
each "step N" and each product name; **scene cuts land on the "step N" word-starts** (cut to the
next product when its step is announced), and a scene may sub-cut for pacing. Re-cut each clip to
its VO window and **hard-concat on the cut** — no dissolves. **Re-encode `-c:v libx264 -crf 20`**
— `-c copy` corrupts the duration when zoompan/PNG clips are in the chain. ~12 cuts over ~32s.

## 2. Product cards — Playwright render + composite on the product-name beats

Playwright renders the card template (`product-card.html.tmpl`) at **2× scale** → one PNG per
product — a warm cream card, a pink accent bar, the real white-bg cutout thumb, the product name,
and the PDP-verified tagline. The cutout must match the REAL product (not the Seedance scene's
hallucinated barrel), and the tagline is verified against the brand PDP (AI flat-lays hallucinate
sublines). Each card is composited onto the master **snapped to its product-NAME word-start** (~1s
after the scene cut), fading in over ~1s, held until the next product is named. **PNG overlay
inputs NEED `-loop 1 -t <dur>`** — without it the PNG emits one frame at t=0 and the fade/enable
filters silently no-op (the card is invisible).

## 3. Captions — clean-white, override the preset

Clean-white captions from the VO's Whisper words, **overridden to 3 words/cue, ~3.0% font, ~20%
margin, NO pill, NO shadow** (the default 5-words/4.5%/18% preset reads too dense for this format).
Burned last. If the host ffmpeg lacks libass (no `subtitles`/`ass` filter), render the cues as
timed PIL PNG overlays composited with ffmpeg `overlay=…:enable='between(t,st,en)'` at the same
placement.

## 4. FFmpeg mix + end card

Mix the SEPARATE VO on top of the ducked ElevenLabs Music bed (the VO is the lead — the music sits
well under it), `loudnorm I=-14`. Append the gpt-image-2 flat-lay still (ken-burns hold ~4s) — do
NOT trust its AI-rendered sublines for the card taglines. Output is a 1080×1920 30fps h264+aac
master (~32s). Deterministic, no paid calls, no keys.
