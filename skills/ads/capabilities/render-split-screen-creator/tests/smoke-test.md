# Smoke Test

Given the creator lip-sync take (a supplied VEED Fabric mp4) + the per-scene VO
timing, one 16:9 top clip per scene with the scene-1 hook graphic, and the
end-card clip, `render-split-screen-creator` assembles the master — the two-zone
composite (top ~52% product clip contain-fit + blurred-cover fill, bottom ~48%
creator slice, 3px divider), hard-concat on the scene, an end card held on the
last sharp frame ~3s, the creator VO muxed, then word-level captions burned from
the ASSEMBLED cut → 1080×1920 h264+aac (~40s).

Pass when the assembly runs to a valid MP4 and:
- one two-zone scene per VO scene, hard-cut on the scene (no crossfades); the top
  clip is contain-fit with a darkened blurred-cover fill (no black bars); the 3px
  brand-color divider is present;
- each top clip is windowed (never looped into a sparse/black tail); the bottom
  zone is the creator lip-sync slice per the per-scene timing;
- captions are word-level, transcribed from the ASSEMBLED cut (not the raw VO —
  concat drops inter-scene silence), burned in the chosen style;
- the end card is on the last sharp frame (no fade-to-black tail); the creator VO
  is the entire audio bed — no separate music;
- **no paid call is made** — the VO, the anchor, and the VEED Fabric lip-sync take
  come from the paid upstream steps (create-vo-elevenlabs / create-image-gpt-image-fal
  / the no-atom VEED Fabric lip-sync); this assembly is $0 and a re-cut reuses the
  existing assets.
