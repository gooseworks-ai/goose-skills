---
name: render-editorial-motion-podcast
description: Assemble an editorial-motion podcast-clip ad from a config — a real clipped podcast MP3 carries the narrative while N flat 2-tone editorial-illustration keyframes are animated NOT by generative i2v but by DETERMINISTIC ffmpeg ken-burns (zoompan) + hard cuts (no crossfades, which expose geometric drift), each beat snapped to its spoken line, the real audio muxed, Whisper-driven captions burned only mid-sentence, and closed on a PIL brand end card — never AI-rendered text. This is the FREE deterministic assembly stage (ffmpeg ken-burns + hard concat + audio mux + captions + end card); the real audio is clipped from source and the keyframes come from create-image-fal. Use for the editorial-motion-podcast format.
status: active
---

# render-editorial-motion-podcast

Assemble an **editorial-motion podcast-clip** ad from a config: a real clipped podcast audio
line carries the whole narrative and every visual beat is timed to the sentence it describes,
in a bold flat 2-tone editorial-illustration look ("a New Yorker spot-illustration that
moves"). The motion is **not generative video** but deterministic ffmpeg ken-burns on static
keyframes, so it reads as a printed page that moves. This capability is that **FREE,
deterministic assembly** — the ffmpeg motion, hard-concat, audio mux, caption burn, and PIL
end card.

`scripts/config.example.json` is the worked example (Klarify "Rat Park", ~40.8s 1080×1920
9:16, 6 beats); `scripts/PIPELINE.md` maps every config block to its source step and
`scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing on the motion layer.
The paid inputs are separate: the real podcast MP3 is clipped from source (free ffmpeg) with
its Whisper word timings, and one editorial-illustration keyframe per beat (chained ref images
so cage/character geometry holds) comes from `create-image-fal` (Nano Banana). Given the
clipped audio + `words.json` + the per-beat keyframes + the real brand wordmark PNG,
`render-editorial-motion-podcast` renders each keyframe as a ken-burns segment, hard-concats
on the beat, muxes the real audio, burns the mid-sentence captions, and composites the PIL end
card → the master. Re-cuts reuse the existing audio / keyframes and cost **$0**.

## Contract (the free assembly)

- **The real podcast audio carries the narrative — no song, no VO.** Mux the clipped source
  MP3 (`-map 0:v:0 -map 1:a:0`); do not generate a sung track or a spoken voiceover — the
  payoff hinges on the host's real recorded cadence.
- **NO generative i2v — deterministic ffmpeg ken-burns only.** Animate each static keyframe
  with `zoompan` (push-in / pull-back, 1.0→~1.06×, 24fps); Seedance/Kling are photoreal-trained
  and invent naturalistic middle states that collapse the 2-tone look. Never `-loop 1` with
  `zoompan d=N` (it balloons the duration); feed a single image and clamp with `-t` + `trim`.
- **Hard cuts on the beat — no crossfades.** Crossfades ghost two drifting cages through each
  other; hard-concat each beat's segments and split long beats into micro-cuts (target 8–10
  distinct visual moments). Each beat's visual STARTS within ~0.5s of its spoken line.
- **Captions from Whisper, ON only mid-sentence.** Burn `frosted-subtle` ASS from Whisper on
  the master while the speaker is talking; leave silent/reflective beats and the end card
  uncaptioned. (This is real spoken VO, so Whisper works.)
- **End card via PIL from the real wordmark PNG — never AI-render brand text.** The lockup is
  composited deterministically (stretched-gradient bg + feathered mascot crop + wordmark +
  tagline with a system font); a diffusion model garbles a wordmark ("therapits"). The video
  runs a ~1.5s silent hold past the audio on the end card (fade first/last 0.3s).
- **FFmpeg composite, deterministic, FREE.** Ken-burns each keyframe, hard-concat, mux the real
  audio, burn the captions, hold on the end card → a 1080×1920 h264+aac master. No paid calls.
