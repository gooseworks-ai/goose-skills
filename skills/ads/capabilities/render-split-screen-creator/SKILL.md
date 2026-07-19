---
name: render-split-screen-creator
description: Assemble a split-screen creator ad from a config — a two-zone vertical composite where a supplied AI-creator lip-sync take fills the BOTTOM ~48% while real 16:9 product/demo clips run uncropped in the TOP ~52%, each top clip contain-fit with a darkened blurred cover-scale fill of the same clip (never black bars), a 3px brand-color divider between the zones, the creator slice cover-fit per the per-scene VO timing, scenes hard-concatenated with the body audio being the concatenated creator VO slices, an end card held on the last sharp frame ~3s, then the ASSEMBLED cut transcribed with local Whisper (not the raw VO — concat drops inter-scene silence) and word-level captions burned in the chosen style. This is the FREE deterministic assembly + caption stage (two-zone composite + blurred fill + divider + hard-concat + end card + captions); the VO comes from create-vo-elevenlabs, the anchor from create-image-gpt-image-fal, and the whole-VO lip-sync from a paid VEED Fabric 1.0 take (a no-atom upstream input). Use for the split-screen-creator format.
status: active
---

# render-split-screen-creator

Assemble a **split-screen creator** ad from a config: a two-zone vertical
(1080×1920, 9:16, ~40s) format where an **AI creator talking-head** anchors the
BOTTOM ~48% of the frame and **real 16:9 product/demo clips** run uncropped in
the TOP ~52%, a 3px brand-color divider between the zones. The creator delivers
the whole VO cold-to-camera and each top clip proves the claim its VO line makes.
This capability is the **FREE, deterministic assembly + captions** — the two-zone
composite (contain-fit + blurred-cover fill + divider + creator slice), the
hard-concat, the end card, and the word-level caption burn from the assembled cut.

`scripts/config.example.json` is the worked example (Perplexity concept-10
"Bloomberg terminal", ~40s 1080×1920 9:16, 6 scenes + an end card);
`scripts/PIPELINE.md` maps every config block to its source step and
`scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly + captions stage — it spends
nothing. The paid inputs are separate steps — the VO (`create-vo-elevenlabs`,
ElevenLabs `eleven_v3` with-timestamps, sliced into per-scene windows), the
**photoreal MEDIUM chest-up** AI-creator anchor (`create-image-gpt-image-fal`,
`gpt-image-2`) — shot at a natural webcam distance (headroom + shoulders, real
room), **not** a plain-background close-up headshot (see the anchor note below), and
the whole-VO lip-sync (a **paid VEED Fabric 1.0 @ 720p take — a no-atom step**,
`image_url` = the anchor, `audio_url` = the vo mp3, ~$0.15/sec, ~$5.90 for a 39s
VO; run its calls sequentially, `veed/fabric-1.0` storage-auths 403 under
parallel load). Given the creator lip-sync take + the per-scene VO timing + one
16:9 top clip per scene + the scene-1 hook graphic + the end-card clip,
`render-split-screen-creator` composites the two zones, hard-concats the scenes,
appends the end card, transcribes the assembled cut, and burns the captions → the
master. Re-cuts reuse the existing VO / lip-sync / clips and cost **$0**.

## Contract (the free assembly)

- **Two-zone split, top ~52% / creator ~48%.** The TOP zone runs the real 16:9
  product/demo clip **contain-fit** (uncropped), the BOTTOM zone is the creator
  lip-sync framed **head-to-shoulders**: scale-to-width × a small **ZOOM** (~1.15–1.2)
  then crop the zone with a **downward offset** so the face sits upper-middle and the
  shoulders enter the bottom. (A plain cover + crop-toward-top shows only the head and
  cuts the shoulders — and it can't rescue an anchor that was shot too close; fix the
  anchor distance first.) Tune zoom/offset visually against the source video's creator
  framing — it's a FREE re-assemble, no VEED re-run. A 3px brand-color divider separates
  the zones. Canvas 1080×1920, `top_height` ~998. **Keep every stacked height EVEN**
  (998 + 4 divider + 918 = 1920) — libx264 rejects odd dimensions.
- **Anchor = photoreal MEDIUM shot, not a studio headshot.** The lip-sync only looks as
  good as the anchor. It must be photoreal/candid (real lived-in room, natural skin
  cues), framed chest-up at a natural webcam distance (headroom + shoulders), **not** a
  plain-background close-up and **not** a phone-selfie pose copied from another format
  (e.g. `ugc-walk-and-talk`). VEED Fabric handles photoreal fine (unlike Seedance).
- **Blurred-cover fill, never black bars.** The top clip's letterbox margins are
  filled with a darkened **blurred cover-scale of the same clip** — a flat
  charcoal/black bar reads cheap.
- **One claim per scene, shown as it's said.** Each top clip is windowed
  (`top_start`/`top_end`) to the on-message segment that proves its VO line.
  **Never loop a short clip** — set the window and the assembler speed-fits it to
  the scene (looping replays into a sparse/black tail).
- **The creator VO is the entire audio bed — no separate music.** Body audio =
  the concatenated creator VO slices, timed per the per-scene `timing.json`; the
  lip-sync drives the mouth.
- **Hard-concat the scenes; end card on the last SHARP frame.** Hard-cut concat
  (no dissolves); append the end card holding the last sharp frame ~3s. If the
  end-card clip fades to black, hold the last sharp second (`endcard.clip_end`),
  not the black tail.
- **Caption the ASSEMBLED cut, not the raw VO.** Concat drops inter-scene
  silence, so the ad timeline ≠ the VO timeline; only the final cut's audio
  yields correct caption timing. Transcribe the assembled cut with local Whisper,
  build word-level cues (sentence-aware chunking), burn the ASS in the chosen
  style (`serif-accent`, `kinetic-pop`, …). Keep the `-precaption` cut + the
  `.ass` sidecar so captions restyle without re-rendering the composite. If the
  host ffmpeg lacks libass, render the cues as timed PIL PNG overlays (ffmpeg
  `overlay=…:enable='between(t,st,en)'`) at the same placement.
- **FFmpeg composite, deterministic, FREE.** Two-zone composite per scene,
  hard-concat, append the end card, mux the creator VO, `loudnorm I=-14` → a
  1080×1920 h264+aac master. No paid calls, no keys — the VEED Fabric lip-sync is
  a supplied input, produced upstream.
