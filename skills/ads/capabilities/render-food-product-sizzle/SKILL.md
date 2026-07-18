---
name: render-food-product-sizzle
description: Assemble a wordless macro-tabletop food-product sizzle ad from a config — normalize fps and SAR across ~4 photorealistic macro clips (hands tearing, flat lay, bite, box hero), concat them, apply a global anti-AI grain pass (eq plus hqdn3d plus noise), composite the audio (a non-diegetic acoustic music bed plus a couple of short diegetic SFX like a snap and a tear placed at measured cue points, loudnorm), composite a STATIC end card entirely in PIL (real logo PNG plus real product PNG plus a serif heritage headline plus a CTA — never AI-rendered text), and burn optional serif stat-callout pills at beats. This is the FREE deterministic assembly stage (normalized concat plus grain plus music and SFX mix plus PIL end card plus callouts); the macro keyframes, i2v clips, and music bed come from create-image-fal, create-video-fal, and create-music-elevenlabs. Use for the food-product-sizzle format.
status: active
---

# render-food-product-sizzle

Assemble a **food-product sizzle** ad from a config: a wordless macro-tabletop photorealistic sizzle
for a physical food / CPG product — tactile sunlit tabletop photography in a warm tungsten kitchen
register, ~4 dynamic macro scenes (hands tearing, a flat lay, a partial-face bite, a box / pack
hero) flowing into a static end card, carried by a non-diegetic acoustic music bed + a few diegetic
SFX with NO voiceover. This capability is the **FREE, deterministic assembly** — normalized concat,
the anti-AI grain pass, the audio (music bed + SFX) composite, the PIL end card, and the optional
serif stat-callout pills.

`scripts/config.example.json` is the worked example (Lineage Provisions "Beef Sticks Sizzle", ~14s
1080×1920 9:16, ~4 macro scenes + a static end card); `scripts/PIPELINE.md` maps every config block
to its source step and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are separate
capabilities: ~4 photographic macro keyframes (`create-image-fal`, Nano Banana; the box / pack hero
grounds on the real product PNG); one locked-off, anti-shake i2v clip per keyframe (`create-video-fal`,
Seedance); and a non-diegetic acoustic / bluegrass bed (`create-music-elevenlabs`). Given the ~4
clips + the music bed + the diegetic SFX + the real logo PNG + the real product PNG,
`render-food-product-sizzle` normalizes fps / SAR, concats the body clips, applies the anti-AI grain
pass, composites the audio (bed + SFX at their cue points), composites the static PIL end card, burns
the optional serif callout pills, and muxes → the master. Re-cuts reuse the existing keyframes /
clips / music and cost **$0**.

## Contract (the free assembly)

- **Wordless — the music bed is the audio, no VO.** A non-diegetic acoustic bed (no vocals) IS the
  bed; do not add a spoken voiceover. The brand name + claim land on the STATIC end card, never in
  the body.
- **~4 macro scenes, concat in order.** Normalize fps / SAR across the body clips and concat them in
  their scene order (tear → flat-lay → bite → box-hero by default); the box / pack hero shows the
  REAL label (grounded on the product PNG upstream — the assembly must not re-render it).
- **Anti-AI grain pass, applied globally.** Apply `eq=contrast=1.06:saturation=0.93,hqdn3d=1.5:1.5:3:3,noise=alls=8:allf=t+u`
  across the whole video — the noise on a food macro is load-bearing for the tactile / photographic
  read, otherwise the sizzle looks AI-smooth.
- **Diegetic SFX on the tactile beats.** Mix a crisp ~120ms snap on the fiber tear and a ~180ms tear
  on the box-open at their measured cue points — a couple of short hits, not a wall of sound. Time
  each to its beat, not a round number.
- **Music bed with no sparse intro.** The supplied / generated bed opens sparse — the upstream step
  trims the ~2.5s intro so it kicks in from frame 0; the assembly loudnorms + fades in / out to the
  master length.
- **Static end card via PIL from the real logo + product PNG — never AI-render brand text.** Solid /
  ivory bg + the real logo PNG (upper third) + the real product PNG (centered, soft shadow) + a serif
  heritage headline + a CTA, held ~3s WITH the music still playing under it (fade the tail — no silent
  tail). A diffusion model garbles a wordmark and the packaging. On macOS pick a serif with the
  middle-dot glyph (use ` · `).
- **Optional serif stat-callout pills at beats.** Ivory-or-brand-color pill + serif type at
  choreographed windows. Write any `%` string to a textfile and use ffmpeg `drawtext` `textfile=` +
  `expansion=none` — a raw `%` is read as a strftime spec and renders garbage.
- **FFmpeg composite, deterministic, FREE.** Concat the body clips, grain-pass, composite the audio
  (bed + SFX), append the PIL end card, burn the callouts, mux with a fade tail, `loudnorm` → a
  1080×1920 h264+aac master (~14s). No paid calls, no keys.
