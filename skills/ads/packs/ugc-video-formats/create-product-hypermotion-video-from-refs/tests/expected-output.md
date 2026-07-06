# Expected Output

## Artifacts
- `master-final.mp4` — 1080×1920, ≈20–30s (25s default), **h264** + 192 kbps aac music.
  14 segments: intro card + 6 hypermotion cuts + 5 spec cards + CTA card + end card.
- `working/hypermotion-raw.mp4` — the ONE 12–15s Seedance i2v (1:1).
- `working/hypermotion-9x16.mp4` — center-cropped to vertical; diced to `working/segments/*.mp4`.
- `working/kinetic-movs/*.mp4` — the PIL kinetic-typography cards (intro / specs / CTA / endcard).
- `working/music.mp3` — the 124 BPM bass bed.
- A poster still (a product-hero frame from any hypermotion segment).

## Visual shape
- **Hypermotion (the diced clip):** one product, on-environment; crash-zoom → orbit →
  slow-mo dust → settle. No people, no hands, no in-clip text. Product identity holds
  across every cut (label sharp, no morph).
- **Spec cards:** full-frame kinetic typography on the dark industrial grain BG. Hero stat
  = 3D extrusion in accent color; the rest cycle italic + outline-echo / white-slam /
  sparkle / shadow-stack. Slam-with-shake entry, no frame bleed (echoes ≤1.08×).
- **Intercut rhythm:** open on the intro card (not hypermotion); alternate segment → spec →
  segment; decreasing hypermotion segment lengths build energy toward the CTA.
- **End card (3.5s):** the **real brand logo PNG** (not typeset) — slam motion blur entry,
  settle, continuous micro-motion (±1% scale + ±3px drift, never frozen), inversion flash
  at ~60%, cascade reveal of the spec-dot subtitle + CTA.

## Audio
- A 124 BPM bass-driven bed, holding to the tail (no decay), aligned to cuts on the
  strongest beats. A single rallying lyric may land on the CTA / end-card flash. No VO, no
  captions.

## Non-goals
- No talking head, no dialogue, no captions.
- No typeset wordmark on the end card — the real logo PNG.
- Many separate Seedance calls — ONE call, diced. No dissolves — hard cuts only.
