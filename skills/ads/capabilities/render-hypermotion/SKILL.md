---
name: render-hypermotion
description: Assemble the FREE steps of the product-hypermotion + kinetic-typography video format — dice ONE Seedance 2.0 hypermotion clip into 5-6 segments and intercut them with PIL kinetic-typography spec/CTA cards (italic skew, 1.08x outline echo, 3D extrusion, slam-with-shake, inversion flash) plus a real-logo PIL end card (base64-decoded from the brand SVG), center-crop 1:1 to 9:16, and explicit-map mux a music bed. Deterministic, FREE (PIL + FFmpeg), no paid calls, the real logo and spec typography stay pixel-crisp. The paid steps (the ONE Seedance i2v, the music) are separate capabilities; the recipe orchestrates them. Use for the product-hypermotion format.
status: active
---

# render-hypermotion

Assembles a product-hypermotion + kinetic-typography ad: a vertical 9:16 sizzle (~20–30s)
where ONE spectacular AI-gen hypermotion clip of the hero product carries the energy and
punchy PIL-rendered spec cards carry the facts. Music-led, no VO — it reads as a
high-production sizzle, not UGC.

The reusable IP is **one-call-many-cuts + intercut**: dice ONE 12–15s Seedance 2.0
hypermotion i2v into 5–6 segments (never a paid call per segment) and interleave PIL
kinetic-typography spec cards between the cuts, capped by a real-logo end card, over a
124 BPM bass bed.

This capability ships the FREE, deterministic assembly — everything between the two paid
model calls. It is **documentation-grade + config**: the format has no runnable driver.
`scripts/` carries the worked config + the step-by-step pipeline doc; the Soundboks
reference PIL impls (`gen_kinetic_v6.py`, `gen_endcard_v10.py`, `assemble_v10.py`) are
copied + adapted per run, not vendored.

- **config.example.json** — the Soundboks worked example: hero product, 5 spec callouts,
  the 5-block Seedance prompt, per-card treatments, beat structure, end-card spec, music
  brief, dims. Copy to `config.json` and edit.
- **PIPELINE.md** — the full config-field → step map: Phase 0 assets → Phase 1 PAID
  Seedance + music (parallel, gated) → Phase 2 FREE PIL cards → Phase 3 FREE
  dice/intercut/concat/mux → Phase 4 watch/QC. Names the atom/tool each step uses, plus
  20s/25s/30s beat-structure variants.
- **README.md** — documents the FREE assembly (below).

## The FREE assembly

- **PIL kinetic-typography spec/CTA cards** — full-frame 1080×1920 clips rendered
  frame-by-frame on a dark grain BG with the static Space Grotesk Bold TTF: italic skew
  (~6°), outline echo at 1.08× (bleed-safe), 3D extrusion (hero stat + CTA, side = brand
  accent), slam-with-shake, and color/inversion flash. No VO — the cards carry every fact.
- **Real-logo PIL end card** — the brand's **actual logo PNG** (base64-decoded out of the
  SVG, never typeset) with a slam-motion-blur entry, settle, continuous micro-motion (±1%
  scale + ±3px drift for the full hold — never freeze), an inversion flash at ~60%, and a
  cascade reveal of the spec-dot subtitle + CTA.
- **FFmpeg dice + intercut** — center-crop the ONE hypermotion clip 1:1 → 9:16, dice into
  5–6 decreasing-length segments at Seedance's natural beats (crash-zoom → orbit → settle),
  then concat in the fixed intercut order: open on the intro card, alternate segment ↔ spec
  card, end on the CTA + brand end card.
- **Explicit-map mux** — mux the music bed as a SEPARATE pass with `-map 0:v -map 1:a`
  (the default mapping silently ships ~1 kbps garbage audio; verify `ffprobe` ≈ 192 kbps).

## Run

```
# Phase 2 — FREE PIL cards (per config.text_cards + config.end_card)
#   render each spec/CTA card + the real-logo end card, 1080x1920, frame-by-frame → mov
# Phase 3 — FREE dice + intercut + mux
#   center-crop 1:1→9:16, dice into 5-6 segments, concat in beat_structure order,
#   then explicit-map mux the music bed → master-final.mp4
```

Output: `master-final.mp4`, 1080×1920, ≈20–30s (25s default) h264 (+ 192 kbps aac music) —
14 segments: intro + 6 hypermotion cuts + 5 spec cards + CTA + real-logo end card. All
FREE, $0.

## Contract

- Deterministic + FREE (PIL + FFmpeg); no paid calls, no AI-rendered logo or spec text.
- ONE hypermotion clip, diced into 5–6 segments — never a paid call per segment (cheaper
  AND identity-consistent: same camera/grade/subject in one call).
- The end card is the brand's **real logo PNG**, base64-decoded from the SVG — never
  typeset; it must micro-move for the full hold (never freeze).
- Spec cards carry every fact (no VO); outline echoes stay ≤1.08× so nothing bleeds off
  frame; use the static Space Grotesk Bold TTF (variable renders as Regular in PIL).
- The paid steps — the ONE Seedance 2.0 hypermotion i2v (5-block prompt with the mandatory
  ABSOLUTE CONSTRAINTS block, or the geometry drifts) + the ElevenLabs 124 BPM bass bed —
  are separate capabilities (create-video-fal, create-music-elevenlabs); the recipe
  orchestrates them and gates the spend.
