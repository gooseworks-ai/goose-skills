---
name: render-flat-vector-explainer
description: Assemble the FREE steps of the flat-vector-explainer video format — a flat-illustration creator-character walks a countable N-step product routine, one step per beat, and Remotion composites every chip/numeral/tagline/slate/CTA as an animated DOM overlay ON TOP of the Kling i2v character clips (text is NEVER baked into a keyframe — i2v warps type), the closing 'N products' grid is a PIL composite of the REAL product photos (not AI), full-sentence VO drives word-by-word burned captions over a VO-forward music bed, and the ~50s animated silent master is re-cut to a 30s deliverable FROM the animated master (never a static intermediate). Documentation-grade — ships config.example.json + PIPELINE.md + a README of the free assembly; the paid gen steps (keyframes, Kling i2v, VO, music) are separate capabilities the recipe orchestrates. Use for the flat-vector-explainer format.
status: active
---

# render-flat-vector-explainer

Assembles a flat-vector product-routine explainer: one illustrated creator-character walks through a countable N-step routine (e.g. collagen -> serum -> eye cream -> hair), one step per beat, each beat carrying a large corner numeral, a labelled chip + one-line tagline, and the step's real product photo, closing on an "N products" grid + brand CTA. It reads as a premium DTC explainer (Spotify/Anchor flat-vector lineage), not UGC.

This capability is **documentation-grade**. The content-goose molecule is a documented recipe, not a runnable end-to-end app, so this capability ships the **config schema** (`scripts/config.example.json`), the **field-to-script map** (`scripts/PIPELINE.md`), and a **README** (`scripts/README.md`) describing the FREE assembly steps the agent runs by hand with ffmpeg + Remotion + PIL. The paid generative steps are separate capabilities the recipe orchestrates and gates.

## The two non-negotiable separations

1. **Motion layer != text layer.** Animate a **text-stripped clean plate** with Kling i2v (subtle motion, style-preserving negative, cfg 0.5), then composite every chip / numeral / tagline / slate / CTA as an **animated Remotion DOM overlay** on top. Baking text into the keyframe before i2v warps the type and forfeits the ability to retime/restyle it — this separation is the format's whole credibility.
2. **Real assets != AI assets.** The per-step product photo and the closing "N products" grid are **real product webps composited with PIL** (AI duplicates SKUs in a grid). Only the character vignettes and stylized backgrounds are generative.

## Free assembly steps (this capability)

The agent runs these deterministic, $0 steps by hand — see `scripts/README.md` for the ffmpeg/Remotion/PIL detail:

- **Remotion overlay** — import each Kling clip as the moving base; composite chips / numerals / taglines / slate / grid / CTA as animated DOM on top -> the animated silent master. Slate/grid/CTA beats are Remotion text with no i2v.
- **PIL product grid** — composite the N real product webps on the brand ground for the closing lockup; preserve each aspect (never stretch, never AI-dupe).
- **Captions** — word-by-word burned from the eleven_v3 with-timestamps char timings (libass); suppress on slate/grid/CTA scenes so two text layers don't collide.
- **Audio mix + master** — place each VO line at its scene start, duck the music under VO (sidechaincompress), `loudnorm I=-15` VO-forward, mux, burn captions LAST -> `finals/master-final.mp4` (~50s).
- **30s cut** — slice each beat's region OUT of the **animated silent master** (never a static intermediate); trim short beats, gently slow long beats (setpts <=1.6x), re-burn scaled captions -> `finals/master-final-30s-v1.mp4`.

## Paid gen steps (separate capabilities)

The recipe orchestrates and gates these; they are not part of this capability:

- Flat-vector character anchor + per-scene keyframes + clean plates -> `create-image-fal` (nano-banana; re-render a FRESH flat-vector anchor, never chain a photoreal ref).
- Kling i2v on the character scenes -> `create-video-fal` (Kling 2.5-turbo/pro, cfg 0.5, style-preserving negative, low motion; TEST one scene before batching).
- Full-sentence VO -> `create-vo-elevenlabs` (eleven_v3, with-timestamps).
- Lo-fi music bed -> `create-music-elevenlabs`.

## Contract

- Documentation-grade + FREE assembly (Remotion + PIL + FFmpeg); no paid calls in this capability, no AI-rendered text.
- Text is an overlay, never baked. Strip to a clean plate -> i2v -> composite text as Remotion DOM.
- Any multi-SKU grid is PIL of the real product webps; preserve each aspect ratio.
- Kling holds the 2D flat-vector look only at LOW motion (cfg 0.5 + style-preserving negative). Aggressive motion drifts to photoreal.
- Cut down from the ANIMATED master, never a static intermediate; frame-diff to prove localized motion.
- The paid steps — keyframes/clean plates, Kling i2v, VO, music — are separate capabilities (create-image-fal, create-video-fal, create-vo-elevenlabs, create-music-elevenlabs); the recipe orchestrates them and gates the spend.
