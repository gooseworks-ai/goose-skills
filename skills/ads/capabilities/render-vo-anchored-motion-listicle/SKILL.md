---
name: render-vo-anchored-motion-listicle
description: Assemble an expert/educator motion-graphic LISTICLE video ad from a config — a spoken authoritative voiceover carries a numbered listicle while N web-animated hyperframe beats (HTML plus the Web Animations API, one branded design system of alternating tiles, big hero numerals, and glass-pill callouts) are rendered frame-by-frame via Playwright and anchored to the VO's word-level timestamps, periodic color-graded B-roll windows give visual breath, and captions burn ONLY inside those B-roll windows (2-word chunks, ASS Format header carrying a Name field so none drop) with the VO mixed under a low music bed. This is the FREE deterministic assembly stage (Playwright beat render plus ffmpeg concat plus window-masked caption burn plus VO-and-music mix plus final composite) — the VO, the music bed, and the stock B-roll come from create-vo-elevenlabs, create-music-elevenlabs, and media-proxy. Use for the vo-anchored-motion-listicle format.
status: active
---

# render-vo-anchored-motion-listicle

Assemble an **expert/educator motion-graphic listicle** ad from a config: an authoritative spoken
voiceover carries a numbered listicle (hook + N points + CTA) and every visual beat is anchored to
the VO's word-level timestamps. Each beat is a **web-animated hyperframe** (an HTML page + the Web
Animations API driven by `window.renderAt(t)`) rendered to video frame-by-frame with Playwright, all
in ONE branded design system (alternating background tiles, big hero numerals, body type, decorative
SVG accents, glass-pill callouts). Periodic color-graded **B-roll windows** give visual breath, and
captions burn **only on the B-roll windows**. The shipped master is pure motion-graphic + VO — there
is NO lipsync (the still expert headshot is kept only for a future lipsync variant). This capability
is the **FREE, deterministic assembly** — the Playwright beat render, the ffmpeg concat, the
window-masked caption burn, the VO+music mix, and the final composite.

`scripts/config.example.json` is the worked example (Everself "doctor-educator" listicle, ~66s
1080×1920 9:16 at 25fps); `scripts/PIPELINE.md` maps every config block to its source step and
`scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are separate
capabilities — the spoken VO (`create-vo-elevenlabs`, a cloned or cast expert voice, `eleven_v3` +
`atempo`) whose word-level timestamps (Groq `whisper-large-v3` word-level) set the timeline; the low
music bed (`create-music-elevenlabs`); and the stock B-roll (`media-proxy`, trimmed + color-graded).
Given the VO + `words-flat.json` + the N authored hyperframe beats + the color-graded B-roll windows +
the brand wordmark SVG, `render-vo-anchored-motion-listicle` renders each beat frame-by-frame via
Playwright (all beats at fps 25), concats the beats + B-roll, burns the window-masked captions, mixes
the VO under the low music bed, and composites → the master. Re-cuts reuse the existing VO / beats /
B-roll and cost **$0**.

## Contract (the free assembly)

- **The spoken VO carries the listicle — it sets the timeline.** The cloned/cast expert VO is the
  spine; Whisper-transcribe it to word-level timestamps and anchor every beat reveal to those word
  times. There is no on-camera human and NO lipsync in the shipped master.
- **Beats are web-animated hyperframes, rendered deterministically.** Each beat is an HTML page + the
  Web Animations API driven by `window.renderAt(t)`; Playwright screenshots it frame-by-frame and
  ffmpeg encodes it. This is NOT i2v — it is deterministic web motion graphics.
- **ALL beats share the same fps (25).** A mismatched-fps beat stutters at the concat seam. Render
  every beat and every B-roll window at fps 25.
- **ONE design system across every beat.** A single `_shared.css` (palette + type + alternating
  tiles + accents + glass-pill) so N beats read as one designed reel; alternate only the background
  tile, keep numerals / body / accents / pills consistent.
- **Periodic color-graded B-roll windows for breath.** Trim + color-grade each stock/brand clip to
  the palette (fps 25). These windows are the ONLY captioned windows.
- **Captions ONLY on the B-roll windows.** On the motion-graphic beats the on-screen type IS the
  caption — burning Whisper captions there double-stacks text. Build the caption ASS from the VO word
  timings, kept only inside the B-roll windows, 2-word chunks, closing a cue on any >0.4s word gap.
  The ASS `Format:` header MUST carry a `Name` field — without it the leading-comma bug eats the
  first field and captions silently drop. If the host ffmpeg lacks libass, render the cues as timed
  PIL PNG overlays (ffmpeg `overlay=…:enable='between(t,st,en)'`) at the same placement.
- **Low music bed under the VO.** The VO is the spine; the ElevenLabs Music bed sits ~0.18 vol under
  it. No ducking needed at that level.
- **Never AI-render the brand lockup.** The CTA / end beat composites the brand's real wordmark,
  never text-in-diffusion.
- **FFmpeg composite, deterministic, FREE.** Render each beat via Playwright, concat the beats +
  B-roll (ffmpeg demuxer), burn the window-masked caption ASS, mix the VO under the music bed,
  loudnorm `I=-14` → a 1080×1920 25fps h264 crf18 + aac 192k master. No paid calls, no keys.
