# render-multiworld — FREE assembly

This capability ships the **recipe** (`config.example.json`) + a config→step map
(`PIPELINE.md`) for the multi-world product-tour format, plus this note documenting the
**FREE, deterministic assembly** — everything between the paid model calls. The paid
steps (the six per-world clips, the NB2 end-card background, the ElevenLabs music bed)
are separate capabilities; the recipe orchestrates and gates them. Everything below is
$0 (Playwright + PIL/HTML + FFmpeg), keeps the end-card text pixel-crisp, and never makes
an AI or paid call.

## The format in one line

A silent, music-led tour of three "third-place" worlds — one per product/scent. Each
world is a **two-shot pair**: a WIDE kinetic-calm ARRIVAL (environment dominates, bottle
stays small) hard-cutting to a top-down MACRO product MOMENT (the sealed bottle nested
with its botanical companion). The six clips land on a Pinterest-style brand end card.
720×1280, ≈27.0s = `3×(arrival 4.5 + macro 3.5) + end-card 3.0`.

## What's FREE here

### 1. Trim each clip to its grid duration (FFmpeg)
The paid per-world clips render long (arrivals ~5s, macros ~4s) so the cut has slack.
FREE step: trim each clip to its `scene_grid[].duration_sec` (arrival 4.5 / macro 3.5)
and re-encode to the master spec — `width`×`height` = 720×1280, `fps` = 24, yuv420p,
scale+pad, **audio stripped** (the scenes are silent; the music is muxed at the end).
Trimming the macro so the top-down portion dominates also hides any label misrender at
the clip's upright tilt extreme.

### 2. HTML/Playwright end card (never AI-rendered)
The paid NB2 step renders the **text-free flat-lay background only** (all three sealed
bottles + their botanicals, generous negative space at top). The message text is composited
FREE over it:

- **Headline** — `overlay.headline` "FIND YOUR DAILY." (Inter 900, "DAILY" outlined via
  `-webkit-text-stroke`, rise-in animation).
- **Scent labels + arrows** — one handwritten Caveat-font `scent_labels[].label` per bottle,
  each with a hand-drawn SVG arrow (staggered `drawArrow` animation) pointing at its bottle.
- **Wordmark + URL** — `overlay.wordmark` (Playfair Display, two rows) + `overlay.url`.

Playwright screenshots `end_card.html` over the NB2 background, then FFmpeg encodes it to
a `dwell_sec` (3.0s) static clip. **The end-card text is HTML, NEVER AI-rendered** — NB2
generates the background only, so no claim or copy can be invented and the type stays crisp.

### 3. Hard-cut concat (FFmpeg)
Concat the six trimmed per-world clips **in scene order** (S01 arrival → S02 macro → … →
S06 macro) + the end-card clip via the concat demuxer, re-encoded to the master spec. Hard
cuts everywhere (no dissolves) — the one optional exception is the S06→S07 whip-to-end-card
transition per the scene contract. Because every clip is normalized to one fps/codec first,
the concat is safe.

### 4. Music mux + web encode (FFmpeg)
Mux the single ElevenLabs instrumental bed onto the silent concat: `afade` in
`master.fade_in_sec` (0.3s) / out `master.fade_out_sec` (0.5s), `loudnorm master.loudnorm`
(I=-16:TP=-1.5:LRA=11), AAC `master.audio_bitrate` (192k), and clamp to
`duration_sec` (27.0s) with an explicit `-map 0:v:0 -map 1:a:1`-style single-audio map so
no silent scene-track leaks in. Output is the H.264 (+ AAC) web master at 720×1280.

The assembly is deterministic — iterate the cut for free by re-running it; only re-roll a
clip (paid) when a scene itself is wrong.

## Contract

- Deterministic + FREE (Playwright + PIL/HTML + FFmpeg); no paid calls, no AI-rendered
  end-card text.
- **Silent, music-led** — no VO, no captions during the scenes. On-screen text appears
  ONLY on the end card, and it's HTML-composited, never AI-rendered.
- **Sealed-bottle rule is upstream but enforced here at QC** — the trim/concat can't fix an
  open-cap clip; a sealed-bottle violation is a re-roll (paid), not an assembly fix.
- Per world = WIDE arrival → top-down macro; hard cuts between scenes; the end card is a
  static hold with legible HTML text; music starts at t=0 and fades the tail.
- The paid steps — the six per-world clips, the NB2 end-card background, the ElevenLabs
  music bed — are separate capabilities (see the GAP below for the clips); the recipe
  orchestrates them and gates the spend.

## GAP — the per-world clips need a Higgsfield-proxy capability that does not exist yet

The source molecule fires the six per-world clips through **Higgsfield Marketing Studio**
(`marketing_studio_video/product_showcase`), grounded on the brand's imported product
UUIDs, with the sealed-bottle safety block front-loaded on every prompt. Marketing Studio
owns credit reservation server-side.

There is **no generic proxy capability for this yet**. `create-video-fal` is a FAL
image-to-video proxy — a different provider and a different job shape; it does not do
Marketing Studio `product_showcase` off an imported product UUID. Wiring this format to
templates-as-data requires a **`create-video-higgsfield`** proxy capability (Higgsfield
Marketing Studio, `product_showcase`, imported-product grounding, per-prompt safety block)
that **does not exist**. Until it lands, the six clips are generated by the Higgsfield
Marketing Studio path directly (CLI/MCP) and this step is **not a fetchable capability**.

See `PIPELINE.md` for the full config-field → source-step map.
