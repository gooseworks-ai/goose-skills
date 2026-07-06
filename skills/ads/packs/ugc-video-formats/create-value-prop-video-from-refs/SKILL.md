---
name: create-value-prop-video-from-refs
description: >-
  Produce a single vertical "value prop" ad (~17s, range 10-20s, 9:16) from a
  brand's real product images — the simplest format in the catalog (Tier 1/5). Beat
  by beat, 3-5 short noun-phrase benefit claims (≤4 words each — "Drug-Free",
  "Zero Sugar", "NSF Certified") are revealed sequentially over per-SKU product
  visuals, one crisp editorial frame per claim. Text + product carry the spot; it
  is built to be legible sound-off. The visuals are all deterministic (PIL start
  frames + Playwright-rendered hyperframes + ffmpeg) — the ONLY paid model call is
  an instrumental music bed mixed at −14 dB (pass null to ship silent). Default
  archetype VP-SWAP: a per-SKU visual swap under each claim (needs ≥3 SKU variants
  with clean cutout PNGs). Closes on a deterministic HTML brand end card. Use when a
  brand has ≥3 SKUs (flavors/scents/styles) and 3-5 stackable benefit claims and
  wants a fast benefits-enumeration ad for Reels/Stories/TikTok/Meta. NOT for
  storytelling, a product demo, a talking-head UGC video, or any VO-led ad.
status: active
---

# create-value-prop-video-from-refs

## Purpose

Produce a 9:16 vertical **Value Prop** ad where 3-5 short noun-phrase claims are
revealed sequentially over per-SKU product visuals. The text + product carry the
spot — no narration, no talking head — and it must be **legible sound-off**. This is
the **simplest format in the catalog (Tier 1/5)**: every visual is deterministic
(PIL + Playwright hyperframes + ffmpeg); the single paid step is an instrumental
music bed. The canonical worked example is **Som Sleep** (VP-SWAP, validated
2026-05-27) — four flavor sachets, five stacked claims, `demo/`.

The reusable IP is **the claim-over-SKU beat loop**: a hook sticker → one beat per
noun-phrase claim, each pairing a ≤4-word headline with a per-SKU product visual (the
hero sachet rotates beat to beat so the eye anchor shifts) → a brand end card, over a
warm instrumental bed. Format DNA is silent; **default here is a music bed at −14 dB**
per operator preference (pass `music_brief: null` for a truly silent cut).

Use this when the brand has:
- **≥3 SKU variants** (flavors / scents / styles) with clean product cutout PNGs.
- **3-5 stackable noun-phrase claims**, each compressible to ≤4 words.
- A "here's why it's good" benefits story for Reels / Stories / TikTok / Meta vertical.

## Inputs

Required (one `config.json` — copy `scripts/config.example.json`, the Som example):
- **SKUs** — **≥3** variants, each `{slug, png}`. `png` is a clean, background-removed
  product cutout (the format leans on per-SKU swap; a single flat variety-pack image
  reused as every canvas reads as "same image shifting" — don't).
- **Value props** — **3-5** claims, each `{label (≤4 words), eyebrow, benefit_sentence
  (≤12 words, optional), accent, layout, hero_sku?}`. `layout` is `row` (all SKUs in a
  strip) or `hero` (one SKU large + faded supporters).
- **Hook + end card** — `hook_line`, `tagline`, `cta`, `logo` (brand wordmark PNG,
  fetched from CDN without a `?width=N` param so it's ≥1200×600).

Optional (defaults in `config.example.json`):
- **Palette** — `ink` (navy headline color), `bg`, `sku_accents{}` (per-flavor accent).
- **Pacing** — `hook_s` 3.0 / `prop_s` 2.4 / `endcard_s` 2.0 (uniform props → ~17s).
- **Aspect / duration** — `9:16` default (also `1:1`, `4:5`); `duration_s` 17 (10-20).
- **Music** — `music_brief` (ElevenLabs Music prompt) + `music.mix_db` (−14). `null` = silent.

Assets are git-LFS in brand folders — **fetch + checkout each first** (pointers are
~131-byte stubs). Verify each product face is the FRONT, not the back.

## Engine (scripts/)

| Script | Does |
|---|---|
| `render_master.py` | **Free/deterministic.** Writes each beat HTML (hook + N prop beats + end card) from the `BEATS` spec, renders every beat via the `create-motion-graphics-hyperframes` atom's `render_hyperframe.py` (pure `renderAt(t)` — no CSS keyframes / setTimeout), concats + muxes a silent stereo track → `finals/master-*-clean.mp4`. |
| `build_storyboard_preview.py` | **Free.** Reads `shot-list.yml` → per-beat HTML + Playwright preview PNGs → `storyboard.html` gallery for the storyboard gate. |
| `build_text_overlays.py` | **Free.** Optional — emits transparent text-zone PNGs (top opaque, rest alpha) for compositing claims OVER a motion/i2v clip (VP-LIVE); not needed for the static VP-SWAP path. |
| `fire_music.py` | **PAID (~$0.04).** ElevenLabs Music (`fal-ai/elevenlabs/music`, `force_instrumental: true`) → `working/audio/music-raw.mp3`. Skip entirely for a silent cut. |

Shared render kit lives in `shared/`: `_shared.css` (design tokens — General Sans
display + Switzer body, ink navy, per-flavor accents), `_shared.js` (`initRenderer`,
`tw`, `tw_lin`, `easeOut`, `springScale`, `revealWords`), `beat-templates/` (hook /
prop-row / prop-hero / endcard reference HTML), and `animations/registry.yml` (the
brand-register preset map). See `scripts/PIPELINE.md` for the full config→script map.

Requires `Pillow`, Playwright chromium, `ffmpeg`, `pyyaml`, `fal_client`; key
`FAL_API_KEY` (music only) from `gtm-goose/.env` (`export FAL_KEY="$FAL_API_KEY"`).

## Workflow

### Phase 0 — Intake (real assets first)
Derive the checklist: ≥3 SKU cutout PNGs, 3-5 claims (compress each to ≤4 words), the
hook line, the brand wordmark + tagline for the end card, music mood. Pull the brand's
real sachets + logo from the brand kit; LFS-fetch each. Ask only the true taste calls
(which claims, their order, hero-SKU rotation, silent vs music). Write `config.json`
and confirm the brief. **Never invent a claim or a customer/result** — use only real,
operator-approved copy.

### Phase 1 — Storyboard preview [free — GATE]
Author `shot-list.yml` from the config, run `build_storyboard_preview.py` → review
`storyboard.html`. Confirm every claim is ≤4 words, reads sound-off, and the hero-SKU
rotation shifts the eye anchor beat to beat. Fix copy/layout/accents before rendering.

### Phase 2 — Render master (silent) [free]
`render_master.py` → `finals/master-*-clean.mp4`. `/watch` it: claims legible, accent
rule (not the headline) carries the per-flavor color, per-SKU PNG under each claim, no
face is the focus, ~17s.

### Phase 3 — Music bed + mux [1 paid call]
`fire_music.py` (instrumental) → mux at **−14 dB** with a 0.4s fade-in / 0.6s fade-out,
`-map 0:v -map 1:a`, `normalize=0` → `finals/master-*-with-music.mp4`. Pass
`music_brief: null` to skip and ship the clean cut (still needs the silent `anullsrc`
track — some platforms reject audio-less video).

### Phase 4 — Watch / QC (mandatory before ship)
`/watch` the master end to end. Confirm the checks below. Fix `config.json`, re-render
(free) or re-mux, re-watch.

## Decision Rules

- **VP-SWAP is the default archetype** — a per-SKU visual swap under each claim. Needs
  ≥3 SKUs with clean cutout PNGs. Two other archetypes are hooks, not yet built here:
  **VP-ACCUM** (1 SKU + an anatomy diagram with accumulating callout labels) and
  **VP-LIVE** (labels composited over live/i2v product-in-use footage via
  `build_text_overlays.py`). Pick VP-SWAP unless the SKU/asset situation forces the others.
- **Per-SKU visual swap per claim.** One product visual per beat; rotate which SKU is
  the hero (Berry → Cherry → Mango → Tangerine). Never reuse one flat variety-pack image
  as every canvas — it reads as "same image shifting".
- **Claims are noun phrases, ≤4 words.** Compress aggressively ("Independently Tested by
  Pro Athletes" → "Pro-Team Tested"); reject a compression that loses meaning and surface
  it at the gate. Never <3 claims, never >5.
- **Optional benefit sentence ≤12 words** (VP-SWAP only); skip if it reads awkward.
- **Sound-off legibility is the bar.** Headline stays in `--ink` navy on white; the
  per-flavor color is the 4px accent RULE under the eyebrow, not the headline (light
  headlines on white = low contrast). Display cap ~100-120px for 9:16.
- **Uniform pacing.** Hook 3.0s, props 2.0-2.5s each (uniform within a run), endcard 2.0s.
  No acceleration curve. Total lands in the 10-20s window (default ~17s).
- **No human face is the focus.** If a hero image has a model's face, crop to torso-down
  or product-only.
- **Music at −14 dB, instrumental, or silent.** Default is a bed at −14 dB with
  `normalize=0` and explicit `-map 0:v -map 1:a`; verify final audio `bit_rate ≥100kbps`
  and mean volume −25 to −34 dB. `music_brief: null` ships silent (still mux a mono
  `anullsrc` track). Reject VO unless explicitly provided.
- **Deterministic animation only.** Every beat is a pure function of beat-local time `t`
  via `initRenderer(dur, renderFn)` — never CSS keyframes, never setTimeout.
- **End card is the brand's real wordmark** (CDN, no `?width=N`, ≥1200×600), no
  chromatic-aberration / RGB-shift effects (they read as pixelated noise).

## Output

- `finals/master-*-with-music.mp4` — 1080×1920, ~17s (10-20 range), h264 + aac. Hook +
  3-5 prop beats + brand end card.
- `finals/master-*-clean.mp4` — the silent cut (re-usable for a fresh music mux).
- A poster still (any prop beat with the claim + hero SKU visible).
- `working/` — beat HTMLs, per-beat clips, `audio/music-raw.mp3` (kept for re-cuts).

## Quality Checks

- Canvas 1080×1920 (or configured aspect); duration within 10-20s (default ~17s).
- Prop count 3-5; every prop `label` ≤4 words; optional benefit sentence ≤12 words.
- Every claim displayed ≥2.0s and legible with sound off.
- Per-SKU PNG under each claim (≥3 SKUs) — no flat composite reused as canvas; hero rotates.
- Headline color = `--ink` navy; per-flavor color only on the accent rule.
- No human face is the focus.
- Audio stream present, `bit_rate ≥100kbps`; music mean volume −25 to −34 dB (or silent).
- End card wordmark ≥1200×600, no chromatic aberration.
- No CSS keyframes / setTimeout in any beat HTML (animation only via `renderAt(t)`).

## Failure Modes

- **Claims all >4 words after compression** → brand uses sentence-form marketing;
  best-effort compress with the strict ≤4-word rule, surface at the gate if meaning is lost.
- **<3 SKUs / no clean cutouts** → VP-SWAP doesn't apply; pivot to VP-ACCUM (anatomy
  diagram) or VP-LIVE (labels over footage), or decline the format.
- **Reads as "same image shifting"** → a flat variety-pack was reused as every canvas;
  crop per-SKU PNGs and rotate the hero.
- **Yellow/light headline unreadable on white** → move the flavor color to the accent
  rule; keep the headline `--ink`.
- **Audio bit_rate ~1kbps after mux** → missing `-map 0:v -map 1:a`; re-mux with explicit maps.
- **Music too loud / overpowers visuals** → default `normalize=1` in `amix` ate the
  volume filter; set `normalize=0`.
- **ElevenLabs music tapers in the 2nd half** → known API decay; for >15s generate 10s +
  loop/flatten via `acrossfade` + `acompressor` + `loudnorm`.
- **End-card wordmark pixelated** → Shopify served a thumbnail; re-fetch without `?width=N`,
  verify ≥1200×600 via PIL.
- **FAL 403 / "exhausted balance"** with funds → stale ambient `FAL_KEY`; `export
  FAL_KEY="$FAL_API_KEY"` and re-run.

## Related

- The remix twin — `remix-value-prop-from-sample` — is what the app's format tab calls; it swaps
  the brand into this builder's `config.json` and publishes back through the
  goose-video runtime. Format link: `recipe.format: "value-prop"`.
