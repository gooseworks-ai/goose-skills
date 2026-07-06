---
name: create-product-hypermotion-video-from-refs
description: >-
  Produce a single vertical "product hypermotion + specs" ad (≈20–30s, 9:16) from a
  brand's real product photo + logo — ONE 12–15s Seedance 2.0 i2v hypermotion clip of
  the hero product (crash-zoom → orbit → slow-mo → settle), diced into 5–6 segments and
  INTERCUT with 5–7 PIL-rendered kinetic-typography spec/CTA cards (italic skew, outline
  echo, 3D extrusion, slam-with-shake, inversion flash), capped by a brand-asset end card
  (the real logo PNG + slam motion blur + inversion flash), over a 124 BPM bass-led music
  bed. Music-led, no VO, no captions. One paid Seedance call + one paid music call; all
  text cards + assembly are free PIL/ffmpeg. Use when the brand has an industrial / sport
  / party / utility voice, a hero product that photographs well, and 4–6 hard spec
  callouts (dB, hours, IP rating, count). NOT for UGC / talking-head, VO-led explainers,
  or editorial / luxury / wellness voices (use a calmer vignette format).
status: active
---

# create-product-hypermotion-video-from-refs

> Hypermotion + kinetic typography intercut = one virtuoso AI-gen product clip, diced
> into segments and interleaved with PIL-rendered spec cards, ending on a brand-asset end
> card. Music-led, silent VO, 9:16 Reels-native. Validated on Soundboks (industrial/party
> voice) 2026-05-28 — V10 shipped, $17.43 total spend / $4.99 marginal.

## Purpose

Recreate the **product hypermotion + specs** format (Common Thread Co "Product Specs" ×
Higgsfield "Hyper Motion"): ONE spectacular AI-gen product clip carries the energy, and
punchy typographic spec cards carry the facts. It reads as a high-production sizzle, not
as UGC.

The reusable IP is the **one-call-many-cuts + intercut** recipe:
1. Generate **ONE 12–15s hypermotion i2v** off the real hero product PNG via Seedance 2.0,
   using a **5-block prompt** (style anchor → cinematography → subject+environment →
   multi-shot timecodes → **absolute constraints**). The 5th block is what stops the
   product geometry from drifting mid-clip.
2. Render **5–7 kinetic-typography spec/CTA cards** via a PIL frame-by-frame pipeline
   (italic skew, outline echo, 3D extrusion, slam-with-shake, color/inversion flash).
3. Render **one brand-asset end card** — the **real logo PNG** (not a typeset wordmark)
   with slam motion blur, settle, continuous micro-motion, and an inversion flash.
4. **Dice** the hypermotion into 5–6 segments (decreasing lengths, cut on beat
   boundaries) and **intercut** with the cards in a fixed beat structure; center-crop
   1:1 → 9:16; concat + mux a **124 BPM bass-led** music bed.

**Why Seedance (not Higgsfield Marketing Studio):** Seedance 2.0 Pro wins for
product-as-hero hypermotion — it holds a single-product identity across camera moves in
one call and does the crash-zoom/orbit/slow-mo grammar natively. One paid Seedance call
(~$4.54 for 15s) + one paid ElevenLabs Music call (~$0.45); all text cards + assembly are
free.

Use this when the brand has:
- An **industrial / sport / party / utility** voice (Soundboks-class).
- A **hero product that photographs well** (a real PDP shot, not AI-gen ex-nihilo).
- **4–6 hard spec callouts** — dB, hours, IP rating, count, etc.
- A **logo SVG/PNG** that can be extracted for the end card.

## Inputs

Required (one `config.json` — copy `config.example.json`, the Soundboks example):
- **Hero product image** — `product_image`: the real PDP hero PNG (scraped, not AI-gen).
  This is the Seedance start frame.
- **Brand logo PNG** — `logo_png`: the real wordmark for the end card. Most brand SVGs are
  base64-PNG wrappers — decode the PNG out (see `scripts/PIPELINE.md`, Phase 0).
- **Spec callouts** — `spec_callouts[]`: 4–6 short strings
  (e.g. `["126 dB SPL", "40-HOUR BATTERY", "IP65 RATED", "SWAPPABLE BATTERY", "PAIR 5 SPEAKERS"]`).
- **Brand voice** — one of `industrial | sport | party | utility` (they share the black +
  Space Grotesk Bold + utility-orange palette).

Optional (defaults in `config.example.json`):
- **Seedance 5-block prompt** — the hypermotion recipe (tuned Soundboks default; edit the
  subject/environment/timecode blocks per brand — keep all 5 blocks).
- **Text-card treatments** — per-spec technique (3D extrusion for the hero stat, italic +
  outline echo / sparkle / shadow-stack for the rest), intro card, CTA card.
- **Beat structure** — the intercut order + per-segment timecodes (25s / 20s / 30s variants).
- **End card** — logo PNG, subtitle (the spec dot-string), CTA, inversion-flash beat.
- **Music** — `124 BPM bass-driven` bed (100 BPM for sport/utility), sync-point brief.
- **duration_s** (25.0), **fps** (30), **dims** (1080×1920), **accent/bg hex**.

Assets are git-LFS in brand folders — **fetch + checkout each first** (pointers are
~131-byte stubs). Fonts must be **static** TTFs (`SpaceGrotesk-Bold.ttf`) — PIL renders
variable fonts as Regular.

## Engine (scripts/)

This molecule is **documentation-grade + config**: the source format has no runnable
driver — the pipeline is prose + referenced atoms + PIL/ffmpeg. `scripts/` carries the
worked config and a step-by-step pipeline doc, not a one-shot binary.

| File | Does |
|---|---|
| `config.example.json` | The Soundboks worked example — hero product, 5 spec callouts, the 5-block Seedance prompt, per-card treatments, beat structure, end-card spec, music brief, dims. Copy to `config.json` and edit. |
| `PIPELINE.md` | The full pipeline: Phase 0 asset gathering → Phase 1 **PAID** Seedance + music (parallel) → Phase 2 free PIL cards → Phase 3 free dice/intercut/concat/mux → Phase 4 watch/QC. Names the atom/tool each step uses. |

Referenced atoms/tools (composed, not vendored here):
- `create-video-seedance-2-fal` — `fal-ai/bytedance/seedance/v2/pro/image-to-video`
  (start_image + audio off; ~$0.30/s).
- `create-music-elevenlabs` — `fal-ai/elevenlabs/music` (20–30s bed).
- PIL kinetic-typography pipeline (11 techniques — see `scripts/PIPELINE.md`; the
  Soundboks reference impls are `gen_kinetic_v6.py` / `gen_endcard_v10.py`).
- `ffmpeg` — center-crop 1:1→9:16, dice via `-ss/-t`, concat demuxer, explicit-map mux.
- `/watch:watch` — end-to-end QC on the final mp4.

Requires `fal_client`, `Pillow`, `ffmpeg`/`ffprobe`; key `FAL_API_KEY` from `gtm-goose/.env`
(alias `FAL_KEY=$FAL_API_KEY`).

## Workflow

### Phase 0 — Intake + brand assets (autonomous, $0)
Gather the hero product PNG (real PDP shot), the brand logo PNG (base64-decode from the
SVG), the brand palette (accent hex), and a static Space Grotesk Bold TTF. Lock the 4–6
spec callouts + the hypermotion concept. Write `config.json` + a `brief.md`. Ask only the
true taste calls (which product, spec order, voice/BPM).

### 🚦 GATE 1 — Brief approval
Show the brief: hero photo, palette, the **5-block Seedance prompt**, the spec callouts,
the beat structure, estimated spend (~$5).

### Phase 1 — Hypermotion + music [PAID — GATE]
Fire **in parallel**, each behind a skip-if-exists guard (re-runs must never re-bill):
- **Seedance i2v** ($4.54/15s): the 5-block prompt, hero PNG as `image_url`, `duration:15`,
  `1080p`, `aspect_ratio:1:1` (crop to 9:16 in post), `generate_audio:false`.
- **ElevenLabs Music** ($0.45): `{BPM} BPM bass-driven {voice} banger`, generate at target
  length, with sync points baked into the brief (kick at the first cut, peak at the CTA,
  a lyric land at the end-card inversion flash).

### Phase 2 — Kinetic-typography cards (autonomous, $0)
Render each card 1080×1920 via PIL frame-by-frame → ffmpeg-encode. Cards: intro
("INTRODUCING"), one per spec (hero stat = 3D extrusion in accent; others = italic +
outline-echo / sparkle / shadow-stack), a CTA (color→black flash), and the **brand-asset
end card** (real logo PNG + slam motion blur + micro-motion + inversion flash at ~60% +
cascade reveal of the spec-dot subtitle + CTA).

### Phase 3 — Dice + intercut + mux (autonomous, $0)
Center-crop the hypermotion 1:1→9:16; **dice into 5–6 segments** at beat boundaries
(decreasing lengths, first beat high-energy, last beat a settle); build the `concat.txt`
in the fixed intercut order (intro → segA → spec1 → segB → spec2 → … → CTA → endcard);
concat-copy to a silent master; **mux music as a SEPARATE pass** with explicit
`-map 0:v -map 1:a` (default mapping yields 1 kbps garbage audio).

### Phase 4 — Watch / QC (mandatory before ship)
`/watch:watch` the master. Confirm duration ±0.5s, 1080×1920, every card readable (no
frame bleed), the product holds identity across every segment (no geometry drift), the
end-card real logo is sharp + micro-moving (not frozen), the inversion flash hits on beat,
and the music holds to the tail (no decay). Re-render cards / re-cut for $0; only re-fire
Seedance if the clip itself drifted.

## Decision Rules

- **One hypermotion call, diced — never many calls.** Generate ONE 12–15s clip and cut
  5–6 segments via ffmpeg. Cheaper ($4.54 vs ~$22) AND identity-consistent (same
  camera/grade/subject — what Seedance does well in one call).
- **The Seedance prompt MUST carry all 5 blocks — the ABSOLUTE CONSTRAINTS block is
  non-negotiable.** Without it the product geometry drifts mid-clip (Soundboks V2 morphed
  to a cowbell). Constraints: locked label geometry, no character contact, no
  multi-product, physics effects (dust/heat-shimmer) in the environment only NOT on the
  product, no in-clip text overlays, single identity across all moves. ONE camera move per
  timecode beat (Seedance fails on stacked moves); first beat high-energy, last beat a settle.
- **Center-crop 1:1→9:16, don't regen.** Generate Seedance square and center-crop; native
  9:16 is pricier and quality-equivalent (~25% horizontal loss is acceptable for a
  product-centric frame).
- **Real brand logo PNG > typeset wordmark on the end card.** Always the actual SVG/PNG —
  typeset text misses distinctive letterforms and reads as a substitute.
- **Brand voice drives the palette.** Industrial/sport/party/utility = black BG + Space
  Grotesk Bold + utility orange. Editorial/luxury/wellness belong in a calmer vignette
  format, not here.
- **Never freeze after settle.** Continuous ±1% scale pulse + ±3px drift on the end-card
  wordmark for the full hold — 3+ frozen seconds read as a JPEG.
- **Outline echo at 1.08× is the bleed-safe sweet spot.** Larger reads as accidental
  clipping; smaller defeats the ambient-shadow purpose.
- **Music-led, VO-silent — vocals OK.** No VO competes, so a single rallying lyric baked
  to the end-card beat is a feature, not noise.
- **Cut on beat boundaries, not uniform intervals.** Seedance has natural internal beats
  (crash-zoom → orbit → settle); dice on those (decreasing segment lengths build energy),
  not at even timecodes.
- **Static fonts + skip-if-exists on all paid calls.** Variable TTFs render as Regular in
  PIL; wrap every `fal_client.subscribe` so a re-run never re-bills.

## Output

- `master-final.mp4` — 1080×1920, ≈20–30s (25s default), h264 + 192 kbps aac music.
  14 segments: intro + 6 hypermotion cuts + 5 spec cards + CTA + end card.
- A poster still (a product-hero frame from any hypermotion segment).
- `working/` — hypermotion raw + cropped, kinetic frames + movs, segments, music (kept
  for free re-cuts).

## Quality Checks

- Canvas 1080×1920; duration within target ±0.5s.
- Every text card readable, no frame bleed (outline echoes ≤1.08×).
- Hypermotion segments hold subject identity (label/logo on the product stays consistent
  across cuts); no people/hands/text-overlays inside the clip.
- End-card **real logo** visible + sharp; continuous micro-motion (not frozen); inversion
  flash hits at ~60% of the card.
- Music holds throughout (no decay tail), aligned to cuts on the strongest beats; audio
  bit_rate ≈ 192 kbps aac (NOT 1 kbps).
- No VO, no captions.

## Failure Modes

- **Hypermotion geometry drifts / product morphs** → the prompt lacks the ABSOLUTE
  CONSTRAINTS block; add it and regen ($4.54).
- **Character/hand appears touching the product** → strip all human/hand references; add
  "no character contact".
- **Text cards bleed off frame** → outline echo > 1.08×; tighten and re-render (free).
- **Fonts render as Regular despite Bold** → a variable TTF was used; swap the static
  (`/static/`) TTF.
- **End-card wordmark looks generic/wrong** → typeset font instead of the real logo;
  base64-decode the real PNG and re-render.
- **End card feels frozen after 1s** → no micro-motion phase; add the ±1% scale + ±3px
  drift after settle.
- **Final mp4 audio is ~1 kbps** → ffmpeg mux without explicit map; add
  `-map 0:v -map 1:a` and mux as a SEPARATE pass from the concat.
- **Music tapers in the 2nd half** → known ElevenLabs behavior; generate 20% longer + trim,
  or loop-flatten with acrossfade + acompressor + loudnorm.
- **9:16 crop loses critical product detail** → hypermotion framed the product at
  horizontal edges; regen with "subject centered, vertical-safe composition".
- **FAL 403 / "exhausted balance" with funds** → stale ambient `FAL_KEY`; `export
  FAL_KEY="$FAL_API_KEY"` and re-run.

## Related

- The remix twin — `remix-product-hypermotion-from-sample` — is what the app's format tab calls; it swaps
  the brand into this builder's `config.json` and publishes back through the
  goose-video runtime. Format link: `recipe.format: "product-hypermotion"`.
