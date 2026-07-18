# render-narrated-ugc-wardrobe-stitch scripts — the FREE assembly

`render-narrated-ugc-wardrobe-stitch` is the **deterministic, $0 assembly stage** of the
narrated-UGC "stitch reply" format. The paid stages (the spoken VO, the creator lock, the ~5
wardrobe edits + 3 world wides, the ~30 per-cut start-frames, the ~30 Veo/Seedance i2v clips) are
separate capabilities — `create-vo-elevenlabs`, `create-image-gpt-image-fal`, `create-image-fal`,
`create-video-fal`. This capability spends nothing — it takes the VO + `vo-final.words.json` +
`edl.json` + one clip per cut + a Playwright landing-page PNG + the brand end-card PNG and stitches
the finished master. Re-cuts (new caption timing, re-timed windows, an end-card swap) reuse the
existing VO / start-frames / clips and cost **$0**.

`config.example.json` is the worked example (Bioma "Do NOT buy Bioma Probiotics", ~37s 1080×1920).
`PIPELINE.md` maps every config block to its source step. This README documents the FREE assembly
pieces that `render-narrated-ugc-wardrobe-stitch` owns.

## 1. Build the EDL from the VO's word boundaries

The VO is Whisper word-aligned (`vo-final.words.json`), and `build_edl.py` builds ~30 role-tagged
cuts from those word boundaries → `edl.json`. Roles — `hook`, `feature`, `reaction-insert`,
`payoff-hold`, `b-roll-insert`, `landing-page`. The payoff line gets a HELD `payoff-hold` beat
(~3× mean shot length). One shot per cut; snap every cut window to the word boundaries so every
hard cut lands on the narration cadence.

## 2. Trim-to-EDL + hard-concat via `filter_complex concat`

Assembly trims each body clip to its EDL window and hard-concats **on the VO cadence** with
`filter_complex concat` — **never the `-f concat` demuxer**, which drops the audio when a
drawtext/scale step shaves a clip a few ms below its window. No dissolves. The payoff clip is timed
so the payoff line lands on the held reveal beat.

## 3. Product B-roll — landing-page scroll is zoompan, not i2v

Capsule macro, unboxing, and a landing-page scroll break up the talking-head cuts the way a real
stitch reply does. The landing-page scroll is FFmpeg **zoompan** over a Playwright-rendered PNG (the
Bioma run rendered `landing-page.png` at 2160×3840 and zoomed wide → best-value card → order button)
— it is **not** an i2v clip, because i2v hallucinates the UI. The capsule/unboxing composites come
from the paid start-frame stage grounded on the real product hero.

## 4. Karaoke-pop captions — from the VO word timings, re-spelled against the locked script

Captions come from the VO's `vo-final.words.json` (VEED Whisper preset, bold yellow), on every word,
throughout. Re-spell brand tokens Whisper mishears against the locked script ("synbiotic" over
"symbiotic"; keep "I'ma" verbatim) — never edit the script to match Whisper. Captions are suppressed
over the end card. If the host ffmpeg lacks libass (no `subtitles`/`ass` filter), render the cues as
timed PIL PNG overlays composited with ffmpeg `overlay=…:enable='between(t,st,en)'` instead — same
placement, no libass dependency.

## 5. VO + music mix + end card + composite

- **Audio:** the VO IS the narration bed (the whole ad is cut to it). Mix the VO over an optional
  instrumental bed sidechain-ducked UNDER the VO (−20dB, 20:1) so the VO stays clearly on top; the
  bed can drop in on the payoff beat.
- **End card:** append the brand's real end-card PNG (~2s) on the tail, captions suppressed. The
  brand text is **never** AI-rendered — a diffusion model garbles a wordmark.
- **Composite:** FFmpeg trims each cut to its window, builds the landing-page zoompan cuts,
  `filter_complex concat`s all ~30 cuts, mixes the VO + bed, burns the caption ASS, appends the end
  card, and `loudnorm I=-14` → a 1080×1920 h264 + aac master (~37s). Deterministic, no paid calls,
  no keys.
