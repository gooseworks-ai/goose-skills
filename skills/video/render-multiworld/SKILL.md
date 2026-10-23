---
name: render-multiworld
description: Assemble a silent, music-led 3-world product-tour ad — trim and hard-cut-concat the per-world WIDE-arrival + top-down-macro clips, composite the HTML/Playwright brand end card (approved headline + handwritten product labels + arrows) over an AI flat-lay background, and mux one music bed into a 720x1280 web master. FREE, deterministic assembly (Playwright + PIL/HTML + FFmpeg); the recipe supplies the config and gates the paid clip/background/music calls. Use for the multiworld-product-tour format.
status: active
---

# render-multiworld

Assemble a silent, music-led "multi-world product tour" ad (≈27s, 9:16) — a tour of three
distinct "third-place" worlds (chosen per video), one per product/variant, that lands on a Pinterest-style brand
end card. Each world is a **two-shot pair**: a ~4.5s WIDE kinetic-calm ARRIVAL (the
environment dominates, the product stays small) hard-cutting to a ~3.5s top-down MACRO
product MOMENT (the sealed product nested with its companion prop). Variant identity is
carried by the **world + companion prop**, not by product color. No VO, no captions in
the scenes — one music bed carries the whole thing.

This capability is the **FREE, deterministic assembler**. The paid steps — the six
per-world clips, the AI flat-lay end-card background, the ElevenLabs music bed — are
separate capabilities (see the gap below for the clips); the recipe orchestrates and gates
them.

## Choices

The calling recipe asks the user these before any paid step; this capability only assembles
what they produced. The worked example (Primally Pure) values are examples, never defaults.

- **worlds** — the three places toured → `config.worlds`, `config.scene_grid` (demo: pilates
  studio / spa anteroom / farmers market).
- **visual_style** — the worlds' look → `config.visual_style`, `worlds[*].palette`,
  `end_card.nb2_prompt` (demo: sunlit-natural / handmade).
- **music** — the bed's genre/mood → `config.music.prompt` (demo: warm acoustic-pop).

Nothing in the assembly keys on world slugs or names: clips are ordered by
`scene_grid[].scene`, and the end-card copy is whatever `end_card.overlay` holds.

## Run
1. **Trim clips (FFmpeg, FREE)** — trim each per-world clip to its `scene_grid[].duration_sec`
   (arrival 4.5 / macro 3.5), re-encode to the master spec (720×1280, 24fps, yuv420p,
   scale+pad, audio stripped). Trimming the macro so the top-down portion dominates also
   hides any label misrender at the clip's upright tilt extreme.
2. **End card (Playwright/HTML, FREE)** — screenshot `end_card.html` over the AI flat-lay
   BACKGROUND, then FFmpeg-encode to a `dwell_sec` (3.0s) static clip. Headline
   (`overlay.headline`, approved brand copy — the demo's was "FIND YOUR DAILY."; Inter 900),
   one handwritten Caveat product label + hand-drawn SVG arrow per product, Playfair
   wordmark + URL. **End-card text is HTML, NEVER AI-rendered** —
   the AI step produces the background only.
3. **Hard-cut concat (FFmpeg, FREE)** — concat the six trimmed clips in scene order
   (S01 arrival → S02 macro → … → S06 macro) + the end-card clip. Hard cuts (no dissolves),
   normalized to one fps/codec first so concat-copy is safe.
4. **Music mux + web encode (FFmpeg, FREE)** — mux the single instrumental bed onto the
   silent concat with `afade` in/out + `loudnorm I=-16:TP=-1.5:LRA=11`, AAC 192k, clamped to
   27.0s, explicit single-audio map so no silent scene-track leaks in → the H.264 (+ AAC)
   720×1280 master.

## Contract
- Deterministic + FREE (Playwright + PIL/HTML + FFmpeg); no paid calls, no AI-rendered
  end-card text. Iterate the cut for free by re-running the assembly.
- **Silent, music-led** — no VO, no captions during the scenes; on-screen text appears
  ONLY on the end card, HTML-composited.
- Per world = WIDE arrival (bottle small, environment dominant) → top-down macro (product +
  botanical, no hands). Hard cuts between scenes; end card is a static hold with legible
  HTML text; music starts at t=0 and fades the tail.
- **Sealed-bottle rule** is enforced at QC — trim/concat can't fix an open-cap or spraying
  clip; that's a re-roll (paid), not an assembly fix. Identity via world + botanical, never
  bottle color.
- The template recipe (DB) supplies the per-video config (worlds, palettes, companion props
  and music mood from the user's choices; prompts; end-card copy from the brand kit); this
  capability is the generic assembler.

## Gaps / routing notes
- **Update:** the current recipe makes the six clips with `create-image-fal` (nano_banana_2
  keyframe edit grounded on the real `product_image`) → `create-video-fal` (Kling 3.0 i2v),
  so the gap below only applies to reproducing the demo's Higgsfield build exactly.
- **The demo's clips used a Higgsfield-proxy capability that does not exist.** The
  source molecule fires them through **Higgsfield Marketing Studio**
  (`marketing_studio_video/product_showcase`) grounded on imported product UUIDs, with the
  sealed-bottle safety block front-loaded on every prompt. `create-video-fal` is a FAL i2v
  proxy — a different provider and job shape — so it cannot serve this step. Wiring the clip
  step to templates-as-data requires a **`create-video-higgsfield`** proxy (Marketing Studio
  `product_showcase`, imported-product grounding, per-prompt safety block) that **does not
  exist yet**. Until it lands, the clips are generated via the Higgsfield Marketing Studio
  path directly (CLI/MCP) and that step is **not a fetchable capability**.
- **The end-card background** is an AI flat-lay render (text-free, all three sealed bottles +
  botanicals) that in prod routes through **create-image-fal** (NB2); only the HTML text
  overlay + encode run locally as FREE assembly.
- **The music** is a paid ElevenLabs call that in prod routes through
  **create-music-elevenlabs**; only the loudnorm + fade + mux run locally as FREE assembly.

See `scripts/PIPELINE.md` for the full config-field → source-step map and `scripts/README.md`
for the FREE-assembly detail.
