---
name: create-multiworld-product-tour-video-from-refs
description: >-
  Produce a single vertical, music-led "multi-world product tour" ad (≈27s, 9:16)
  from a brand's real product images — a silent (no VO, no captions) tour of three
  distinct "third-place" worlds, one per product/scent, that lands on a Pinterest-style
  brand end card. Each world is a two-shot pair: a ~4.5s WIDE kinetic-calm ARRIVAL
  (the environment dominates, the bottle stays small) hard-cutting to a ~3.5s top-down
  MACRO product MOMENT (the sealed bottle nested with its botanical companion). The six
  clips are Higgsfield Marketing Studio product_showcase renders off imported product
  UUIDs; the end card is an nano_banana_2 flat-lay BACKGROUND + a deterministic
  HTML/Playwright text overlay; a single ElevenLabs music bed carries the whole thing.
  FFmpeg trims, hard-cut concats, and muxes + loudnorms the master. Use when a brand
  has 3 real scent/variant products and wants a calm, aspirational "here's the range,
  each in its own world" tour. NOT for a talking-head UGC video, NOT for a single-product
  handheld demo, and NOT for any format that needs spoken VO or on-screen captions
  during the scenes.
status: active
---

# create-multiworld-product-tour-video-from-refs

## Purpose

Recreate the **multi-world product tour**: a music-led, kinetic-but-grounded vertical
ad that tours three brand-coded "third places" — one per product/scent — and lands on
a brand end card. Each world is a **two-shot pair**: a WIDE **arrival** where the
environment dominates and the bottle stays small, hard-cutting to a top-down **macro
moment** of the sealed product nested with its botanical/prop companion. It reads as a
premium, aspirational DTC brand film — not as UGC. The canonical worked example is
Primally Pure's "Three-Place Tour" — Lavender (sunrise reformer pilates studio) / Blue
Tansy (spa anteroom) / Bergamot + Eucalyptus (Saturday farmers market), 27s, 720×1280
(`demo/`).

The reusable IP is **the world-grid + shot-grammar recipe**: (1) a locked 3×3 grid —
each product gets its own **world palette + botanical companion** so the scent identity
is carried by the *set*, not by bottle color; (2) per world, a WIDE arrival (slow drift
/ lateral track / soft push, never whip-pans) + a top-down macro moment; (3) six
**Higgsfield Marketing Studio `product_showcase`** clips grounded on the brand's real
imported product UUIDs; (4) an **nano_banana_2** flat-lay end-card *background* (no
text) that an HTML/Playwright layer overlays the headline, hand-drawn scent labels +
arrows, and wordmark onto; (5) a single **ElevenLabs** music bed — no VO, no captions —
and a deterministic FFmpeg trim → hard-cut concat → music mux + loudnorm.

**Why Higgsfield Marketing Studio (not raw i2v):** `product_showcase` grounds every clip
on the real imported product (label/geometry stays faithful across six clips) and
produces the calm ambient camera the format wants. Six clips at ~$0.5–0.6 each + one
NB2 keyframe (~$0.08) + one music bed (~$0.2).

Use this when the brand has:
- **3 real scent/variant products** (a "here's the range" story, one per world).
- A brand register that suits **calm aspiration** (wellness, clean-beauty, home,
  fragrance) — soft daylight, natural props — over frenetic GenZ-neon.
- Room for **three distinct environment worlds** to carry variant identity, so the
  bottles don't need to be color-coded.

## Inputs

Required (one `config.json` — copy `scripts/config.example.json`, the Primally Pure example):
- **Worlds** — 3 entries, each `{slug, product, product_uuid, world, palette, botanical,
  arrival_prompt, macro_prompt}`. `product_uuid` is the brand's Higgsfield **imported
  product** id (one-time URL fetch per product). `arrival_prompt` = the WIDE kinetic-calm
  shot; `macro_prompt` = the top-down product moment.
- **End card** — `end_card.nb2_prompt` (flat-lay BACKGROUND, text-free) + `end_card.html`
  (the brand's overlay: headline + per-product scent labels + arrows + wordmark).
- **Music** — `music.prompt` (mood bed) + `length_ms`.

Optional (defaults in `config.example.json`):
- **Higgsfield model** — `marketing_studio_video/product_showcase` (default).
- **Per-scene durations** — arrival 4.5s / macro 3.5s / end card 3.0s (the 6+1 → 27s grid).
- **dims** (720×1280) / **fps** (24) / loudnorm target.

Product references are the brand's real imported products (fetched once per product);
demo binary assets are git-LFS in the source brand folder — **fetch + checkout first**
(pointers are ~131-byte stubs).

## Engine (scripts/)

This molecule ships as a **config + documented pipeline**, not a rebuilt runnable
Higgsfield harness — the six clips are fired through Higgsfield Marketing Studio (CLI /
MCP), which owns credit reservation server-side. `scripts/config.example.json` captures
this ad's exact recipe; `scripts/PIPELINE.md` maps every config field to its source
generation step (the real render/assembly scripts live in the source project's
`working/`).

| Step (source script) | Does |
|---|---|
| `render_clips.py` | **PAID (Higgsfield MS × 6).** Fires the 3 arrival + 3 macro `product_showcase` clips in parallel off the imported product UUIDs; each prompt front-loads the SEALED-BOTTLE safety block. Arrivals render 5s, macros 4s (trimmed later). |
| `render_endcard.py` | **PAID (NB2) + free.** NB2 generates the text-free flat-lay background from the 3 product refs; Playwright screenshots `endcard.html` over it → a 3.0s end-card mp4. |
| `gen_music` (curl → ElevenLabs) | **PAID.** One instrumental bed; trimmed to 27s, loudnormed at mux. |
| `build_master.py` | **Free/deterministic.** Trims each clip to its grid duration, hard-cut concats (concat demuxer, re-encoded to master spec), muxes the music with `afade` + `loudnorm I=-16`, clamps to 27.0s. |

Requires the Higgsfield CLI/MCP (Marketing Studio), `ffmpeg`, Playwright chromium, and
`ELEVENLABS_API_KEY` from `gtm-goose/.env`.

## Workflow

### Phase 0 — Intake + world grid (real products first)
Run the brand's VIDEO_INTAKE gate for any owned-brand claim. Derive the checklist: 3
real products + their imported Higgsfield UUIDs, and the **locked 3×3 grid** — for each
product a *world* (third place), a *palette*, and a *botanical companion*. Products are
**not** color-coded; the world + companion carry identity. Pull the brand's real
products, fetch/import each once. Write `config.json`, confirm the brief + grid. **Never
invent efficacy claims or product copy; the label must match the real product.**

### Phase 1 — Six Marketing Studio clips [6 paid calls — GATE]
`render_clips.py`. **Wait for approval before firing** (the largest spend). Each world =
a WIDE kinetic-calm arrival (environment dominates, bottle small) + a top-down macro
moment (product + botanical, no hands). `/watch` every clip. **Hard-gate the
sealed-bottle rule**: if any clip shows the bottle open / cap-off / extruded / spraying,
REJECT and re-roll with "BOTTLE STAYS SEALED, CAP STAYS ON" front-loaded and restated
(this happened on the demo's Blue Tansy arrival, S03 → S03 v2).

### Phase 2 — End card [1 paid NB2 call + free overlay]
`render_endcard.py`: NB2 makes the flat-lay **background only** (all three sealed
bottles + their botanicals, generous negative space at top, **NO text/typography** in
the prompt). Then Playwright renders `endcard.html` — headline, one handwritten scent
label + hand-drawn arrow per bottle, wordmark + URL — over it. **The end-card text is
NEVER AI-rendered; it's HTML.**

### Phase 3 — Music + master
`gen_music` (one ElevenLabs bed, instrumental) → `build_master.py`: trim each clip to
its grid duration (arrival 4.5 / macro 3.5 / end card 3.0), hard-cut concat, mux music
with fade-in/out + `loudnorm I=-16`, clamp to 27.0s. Assembly is deterministic — iterate
the cut for free by re-running `build_master.py`.

### Phase 4 — Watch / QC (mandatory before ship)
`/watch` the whole master. Confirm: silent-but-music-led (no VO, no captions in scenes);
every bottle stays **sealed**; each world = WIDE arrival then top-down macro; hard cuts
between scenes; the end-card text lands crisp; music kicks in at t=0 and fades the tail;
labels are legible (watch for MS label misrenders at the upright extreme, e.g. the demo's
"Eucaiyptus" on S06). Fix `config.json` / re-roll the offending clip, re-assemble,
re-watch.

## Decision Rules

- **SEALED BOTTLE — hard safety gate.** The product is a sealed twist-stick /
  closed container. Never depict it open, cap-off, extruded, or spraying; no smoke /
  vapor / aerosol / scent-visualization. Front-load "BOTTLE STAYS SEALED, CAP STAYS ON"
  in every clip prompt and re-roll any violation (a P0, as on the demo's S03).
- **Shot grammar per world: WIDE arrival → top-down macro moment.** Arrival =
  environment dominates, bottle stays small, **never** a macro close-up; camera is
  KINETIC-CALM (slow drift / lateral track / soft push, ~3 ambient cuts), **NO whip-pans,
  NO shake**. Moment = top-down 90° macro, product + botanical companion, **NO hands in
  frame** (no "applying" beat).
- **Silent, music-led — no VO, no captions during scenes.** On-screen text appears ONLY
  on the end card. One ElevenLabs bed carries the whole tour.
- **Identity via world + botanical, not bottle color.** Each product gets a distinct
  world palette + botanical companion so the viewer links world → scent; bottles are
  intentionally not color-coded.
- **End-card text is HTML, never AI-rendered.** NB2 generates the flat-lay background
  only (prompt explicitly forbids text/typography); headline, scent labels, arrows, and
  wordmark are composited via HTML/Playwright/FFmpeg.
- **Ground every clip on the real imported product.** Marketing Studio `product_showcase`
  off the brand's product UUID keeps the label/geometry faithful across all six clips.
- **Brand guardrails.** No efficacy claims, no competitor jabs, register stays on-brand
  (the demo is sunlit-natural, not glossy/clinical/neon).

## Output

- `master-v2.mp4` — 720×1280, ≈27s, h264 (+ aac music bed). 6 clips (3 worlds × arrival
  + macro) + brand end card.
- A poster still (a macro-moment frame or the end card).
- `working/` — the six clips, the NB2 end-card background, `endcard.html` + render, the
  music bed (kept for re-cuts).

## Quality Checks

- Canvas 720×1280 (9:16); duration ≈ `3×(arrival+macro) + end_card` = `3×8 + 3 = 27.0s`
  (±0.3s). An `aac` music stream is present.
- Silent scenes: NO speech and NO burned captions in S01–S06 (Whisper the audio → music
  only). Text appears ONLY on the end card.
- Every bottle reads **sealed** (no open cap / extrusion / spray) across all six clips.
- Each world shows a WIDE arrival (bottle small, environment dominant) then a top-down
  macro moment (product + botanical, no hands).
- Hard cuts between scenes (no dissolves, except the optional whip-to-end-card); end card
  is static (frame-diff ≈ 0) with legible HTML text; music starts at t=0, fades the tail.

## Failure Modes

- **Bottle rendered open / cap-off / spraying** (P0) → REJECT + re-roll with "BOTTLE
  STAYS SEALED, CAP STAYS ON" front-loaded AND restated; no smoke/vapor/aerosol words in
  the prompt. (Demo: S03 v1 → S03 v2.)
- **Arrival goes macro / bottle too big** → the arrival must keep the environment
  dominant; re-state "bottle stays small; environment dominates, never macro".
- **Whip-pans / shake in the arrival** → this format is kinetic-CALM; add "NO whip pans,
  NO shake, NO wobble, NO earthquake" (it's in the demo's SAFETY block).
- **Label garbled at the macro's upright extreme** → MS can misrender the printed name at
  the tilt extreme (demo S06 "Eucalyptus" → "Eucaiyptus"); trim so the top-down portion
  dominates, or re-roll.
- **Hands appear in a macro moment** → the moment shots are product-only; re-state "NO
  hands in frame".
- **AI-rendered text on the end card** → NB2 must generate the background ONLY; add "No
  text overlays, no typography, no captions"; text is the HTML layer.
- **Music has speech / a sparse intro** → force instrumental; the bed is trimmed to start
  at t=0 and loudnormed at mux; raise the intro trim if it lags.
- **Higgsfield transient 502 / job failure** → retry the single clip (demo S06 v1 failed
  502 → S06 v2 succeeded); failed submissions don't debit.

## Related

- The remix twin — `remix-multiworld-product-tour-from-sample` — is what the app's format tab calls; it swaps
  the brand into this builder's `config.json` and publishes back through the
  goose-video runtime. Format link: `recipe.format: "multiworld-product-tour"`.
