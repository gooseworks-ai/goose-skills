---
name: create-vignette-video-from-refs
description: >-
  Produce a single short-form "vignette" ad (≈9–12s, 9:16 or 1:1) from a brand's
  real product images — clean product cutouts laid as static layers over a
  real-time KINETIC background video, with a cold-open text card, a product
  carousel, and an annotated specimen-sheet end card, over an instrumental music
  bed with NO voiceover. The background is sourced Pexels-stock-FIRST (free, native
  vertical) and only falls back to text-to-video (Veo 3.1 / Kling v2.5 / Seedance
  2.0) when stock fails — the key cost lever, validated at $0.66 (Clinikally,
  Pexels BG) vs $8 (Mother Science, 6-variant T2V comparison). Cutouts are stripped
  with birefnet (no halo/shadow), height-anchored at vertical-center for mixed-shape
  SKUs, and the end card uses a WHITE logo variant on dark BGs. Use when the brand
  has clean PDP product photography and wants a feed-scroll-friendly atmospheric
  short that reads muted. NOT for a talking-head/UGC creator ad, NOT for a
  VO-driven explainer, NOT for a single static product hero, and NOT for anything
  over ~15s (the format breaks past 12s).
status: active
---

# create-vignette-video-from-refs

## Purpose

Recreate the **Vignette** format (Common Thread Co taxonomy): motion lives in a
**real-time kinetic background video**; the product rides on top as a clean **static
cutout layer**. Music-led, zero VO, sub-12s, loopable — it works muted because the
product label + on-screen copy carry the message. This molecule defaults to the
**V-CARD** sub-archetype: a cold-open text card → a product carousel under one shared
BG → an annotated brand end card.

The reusable IP is **the layer recipe + the Pexels-first cost lever**: (1) strip each
product PDP shot to clean hard-edge alpha (birefnet, no halo/shadow); (2) source ONE
kinetic BG — Pexels stock first, T2V only on failure; (3) composite in a single ffmpeg
`filter_complex` — palette-aware BG dim + vertically-centered width-anchored cutouts +
cold-open card + annotated end card; (4) mux an instrumental, loudness-normalized music
bed in a separate pass.

**Validated on two brands:**
- **Mother Science** (clinical-luxury skincare, 3 SKUs) — **T2V BG**, 6-variant
  comparison (2 concepts × 3 models), **~$8**. The demo master is its winning variant.
- **Clinikally** (Indian dermatology, 5 SKUs) — **Pexels BG**, **~$0.66** (a ~92% cost
  reduction). The Pexels substitution is the headline lever.

Use this when the brand has:
- **Clean product photography** (Shopify PDP shots on white are ideal — birefnet strips
  cleanly).
- A "here's the range / here's the lineup" story (1–3 SKUs in a carousel).
- A music-led *atmospheric* target — NOT UGC, NOT talking-head, NOT VO explainer.

## Inputs

Required (one `config.json` — copy `scripts/config.example.json`, the Mother Science example):
- **`brand_url`** — e.g. `https://motherscience.com`.
- **`products[]`** — 1–3 product handles/slugs. 1 = single-cutout focus; 2–3 = carousel.

Optional (autonomous defaults in `config.example.json`):
- **`aspect_ratio`** — `9:16` (default, mobile) or `1:1`.
- **`duration_s`** — default `10.5` (range 9–12).
- **`sub_archetype`** — `V-CARD` (default: cold-open card + carousel + annotated
  endcard), `V-PURE` (pure carousel, no text), `V-TILE` (persistent social-tile layout —
  heavier production).
- **`bg_source`** — `pexels` (try FIRST) or `t2v`. If Pexels fails after 2 weak passes,
  fall back to T2V.
- **`bg_concept`** — free-text concept brief, grounded in brand identity (NOT generic
  "abstract macro"). If omitted, derived from category (skincare → ingredient bloom /
  molecular; cleaning → foam; supplement → liquid swirl).
- **`bg_model_set`** — `["veo-3-1-preview","kling-v2.5-turbo-pro","seedance-2.0"]`
  (T2V comparison default) or a subset.
- **`bg_concepts_count`** — `2` (default) or `1` (cheaper).
- **`cold_open_text`** — up to 3 lines, ≤2 words each, e.g. `["100%","PROVEN","RESULTS"]`.
- **`end_card_lines`** — small-print specimen-sheet annotations (EST year, ingredient,
  positioning, claim). A `logo_variant` (`cream`/`white`) picks the on-dark logo.
- **`music_brief`** — free-text; default matched to category (skincare → ambient minimal
  electronic ~90 BPM, instrumental).

Assets are **git-LFS** in brand folders — fetch + checkout each first (pointers are
~131-byte stubs).

Prerequisites: `FAL_API_KEY` (birefnet, Kling, Seedance, ElevenLabs) + optional
`PEXELS_API_KEY`, both from `gtm-goose/.env`; Higgsfield CLI authed (for Veo 3.1);
`npx gooseworks credits` for IG scraping; Homebrew `ffmpeg` + `librsvg` (`rsvg-convert`).

## Engine (scripts/)

Order of execution: strip → source BG → overlays → composite → music+mux.

| Script | Does |
|---|---|
| `strip_product_backgrounds.py` | **PAID (~$0.02/SKU).** birefnet-v2 on raw PDP PNGs in parallel → clean-alpha cutouts. Auto-validates alpha (≥20% transparent, ≤8% partial-edge) + writes `manifest.json`. |
| `fire_t2v_variants.py` | **PAID (~$7–10 for 6).** T2V-BG *fallback* — fires 2 concepts × 3 models (Veo via Higgsfield CLI, Kling + Seedance via FAL) in parallel. Only when Pexels-first fails. PHASE markers (never "Shot N:"), "NOT slow motion", camera-locked, negatives ban text/product/people. |
| `render_overlays.py` | **Free.** PIL + `rsvg-convert` render the cold-open card (Boska Black, dead-center) + the annotated specimen-sheet end card (brand SVG logo + Space Grotesk annotations) as transparent 1080×1920 PNGs. |
| `composite_variants.py` | **Free.** One ffmpeg `filter_complex` per variant, in parallel: BG (palette-aware dim) → cold-open overlay → cutouts (width-anchored, vertically centered `y=(H-h)/2`) → end card. h264 crf20 yuv420p +faststart 30fps. |
| `music_and_mux.py` | **PAID (~$0.40).** One ElevenLabs instrumental bed → `acompressor + loudnorm I=-18:TP=-2:LRA=9` → muxed into every variant in a SEPARATE pass with explicit `-map 0:v:0 -map 1:a:0`. |

The scripts anchor paths via `Path(__file__).resolve().parent.parent` and assume the
canonical project layout (`source/`, `assets/`, `finals/`). They are the **validated
Mother Science reference versions** — product names, prompts, and brand copy are
hard-coded; parameterize per brand (see `PIPELINE.md`). `strip_product_backgrounds.py`,
`fire_t2v_variants.py`, and `music_and_mux.py` import `fal_helpers` from a shared atoms
dir — see PIPELINE.md for the shim note.

## Workflow

### Phase 0 — Brand asset gathering + brief
Scrape product PNGs from the brand Shopify (`/products/<handle>.json`), background-remove
via birefnet (`strip_product_backgrounds.py`), scrape brand palette + logo SVG, and
scrape the brand IG via gooseworks **as reference only** (never as the BG directly —
it reads as remix). Define 1–2 BG concepts grounded in brand identity. Write `brief.md`
with cutout previews + palette + concept rationale + estimated spend. **Preserve real
product art/labels — never invent copy.**

### 🚦 HUMAN GATE 1 — Brief approval
Show `brief.md` + sub-archetype recommendation + BG concept(s) + estimated spend. On a
T2V comparison this is the largest spend ($7–10); on a Pexels run it is ~$0.66. Approve
or edit.

### Phase 1 — Background sourcing [Pexels FIRST, then PAID T2V fallback — GATE]
**Try Pexels stock first** (free, native 9:16): targeted queries like `ink in water`,
`sheer fabric wind`, `liquid bloom`. **This is the key cost lever** — validated on
Clinikally, saving $7+ per run. Skip Pexels after 2 weak passes (skincare/luxury/abstract
coverage is thin) and **fall back to T2V** (`fire_t2v_variants.py`) — the default for
clinical/luxury. On a first-run new brand, fire the 2×3 comparison so the operator picks
from real outputs.

### Phase 2 — Overlays [free]
`render_overlays.py` — cold-open card (Boska Black cream, dead-center) + annotated
specimen-sheet end card (brand SVG via `rsvg-convert -w 2400` → autocrop → resize;
Space Grotesk annotations). Use the **WHITE logo variant on dark BGs**.

### Phase 3 — Composite + music + mux [free composite, PAID music]
`composite_variants.py` (palette-aware dim + vertically-centered cutouts + overlays) →
`music_and_mux.py` (ElevenLabs instrumental → loudnorm → separate-pass mux). Iterate the
composite for free.

### Phase 4 — Watch / QC (mandatory before ship)
`/watch:watch` each variant. Confirm: BG plays from t=0 (no black hold), motion is
real-time (not slow-mo), BG dim is right (visible, not competing); cutouts share one
visual mid-line across SKUs; cold-open + annotated end card are readable; music is
instrumental, audible, at ~-18 LUFS. Extract QC frames at beat midpoints
(`0.5 2.2 3.8 5.4 7.0 9.0`) to verify placement. Fix `config.json` / re-source / re-roll,
re-composite, re-watch.

## Decision Rules

- **Pexels-first is the cost lever.** Source the BG from free stock before any T2V spend
  — validated at $0.66 (Clinikally) vs $8 (Mother Science). Skip Pexels after 2 weak
  passes on skincare/luxury/abstract (coverage is ~1-in-12) and fall back to T2V.
- **T2V skips the grounding constraint.** Text-to-video has no image input, so the
  "every image must be grounded" rule does not apply — use T2V freely when stock fails.
  (I2V still needs a real/cropped keyframe.)
- **BG concept is brand-themed, kinetic, NOT slow-mo.** Derive the concept from the
  brand's ingredient/use-case (skincare → bloom/molecular; foam cleaner → foam), not a
  generic "abstract macro" search. Prompt "NOT slow motion" + add `slow motion` to the
  negative. Use PHASE markers, never "Shot N:" (which forces hard cuts). Lock the camera.
- **Palette-aware BG dim (per-variant).** High-contrast competing BG (chrome on cream) →
  push saturation DOWN hard (`saturation=0.50`, `brightness=-0.30`) to kill the metallic
  pop. Naturally-contrasty BG (dark ink on cream) → lighter dim (`saturation=0.85`,
  `brightness=-0.18`).
- **Cutouts: clean alpha, vertical-center, width-anchored for 9:16.** birefnet strip, no
  halo/shadow/outline. For mixed-shape carousels ALWAYS `y=(H-h)/2` (never bottom-anchor —
  squat jars jump). For 9:16 scale by WIDTH (~75% for tall bottles, ~65% for squat jars);
  for 1:1 scale by height (50–70%).
- **End card = annotated specimen-sheet, never a bare logo.** EST year + rule + brand
  wordmark + rule + ingredient + positioning + claim. Use the **WHITE logo variant on
  dark BGs**; cream (`#f9f7ef`) on light. Never AI-render the end-card text or invent copy.
- **Music-led, no VO, instrumental only.** Cold-open + end-card text would fight lyrics —
  force instrumental. Loudness-normalize (`loudnorm I=-18:TP=-2:LRA=9`, EBU R128) BEFORE
  the mux.
- **Mux is a SEPARATE ffmpeg pass with explicit `-map 0:v:0 -map 1:a:0`.** Single-pass
  composite+mux silently fails; default mapping produces 1 kbps garbage audio.
- **Cold-open → carousel → annotated endcard is the V-CARD structure.** BG-only ~1.5s →
  cold-open card ~1.5s → one cutout per ~1.5s beat → end card ~2.5s. Multi-variant
  comparison is the right first-run spend when going T2V.

## Output

```
<project>/
├── brief.md
├── source/
│   ├── scraped-product-images/   # raw PDP PNGs
│   ├── scraped-brand/            # logo SVG, palette
│   └── t2v-outputs/ (or pexels-bg/)   # N BG variants
├── assets/
│   ├── product-cutouts/          # birefnet-stripped PNGs
│   ├── fonts/                    # Boska + Space Grotesk TTFs
│   ├── text-overlays/            # cold-open + annotated end card PNGs
│   └── music/                    # raw + processed bed
└── finals/
    └── master-<aspect>-<concept>-<model>.mp4   # 1–N variants
```

Each master: 1080×1920 (or 1080×1080), 9–12s, 30fps, h264 yuv420p crf20 +faststart,
AAC 192k ~-18 LUFS. Pexels runs yield N = concepts; T2V comparison yields N = concepts ×
models.

## Quality Checks

- Canvas 1080×1920 (or 1080×1080); duration 9–12s at 30fps.
- BG visible but not competing (per-variant dim correct); motion real-time, not slow-mo.
- No people/hands/products/text/logos baked into the BG.
- All cutouts vertically centered (same visual mid-line, within ~5px), clean alpha (no
  white halo), scaled 50–75% frame width (9:16) or 50–70% height (1:1).
- Cold-open card readable, dwells ~1.0–1.5s; annotated end card readable, holds
  ~2.0–2.7s (specimen-sheet, not bare logo).
- Music instrumental (no lyrics), normalized ~-18 LUFS, audio bit_rate ≈ 192 kbps AAC
  (NOT 1 kbps — check `ffprobe`).
- `+faststart` MOOV atom near file start; plays cleanly in QuickTime + browser.

## Failure Modes

- **Pexels returns stock 3D abstract art repeatedly** → skip after 2 weak passes; go to
  T2V. (Skincare/luxury/abstract coverage is ~1-in-12.)
- **Cutout has a white halo despite birefnet** → BG color too close to product edges;
  re-run with finer matte or NB2-edit ($0.08) to clean; pre-clean messy source PNGs
  (accessories/badges) before birefnet.
- **T2V has hard cuts when continuous wanted** → strip "Shot N:" labels; use "PHASE N"
  markers; never `shot_type=customize`.
- **T2V is slow-motion when kinetic wanted** → "slow motion" read literally; add "NOT slow
  motion" + `real-time speed` + `slow motion` to the negative prompt.
- **Veo 3.1 aspect error** → used `1:1` or `--aspect-ratio` (hyphen); Veo takes only
  `9:16`/`16:9` with `--aspect_ratio` (underscore), duration ∈ {4,6,8}. Generate 16:9 →
  center-crop for 1:1.
- **Squat jar sits lower than the bottles** → bottom-anchor; switch to `y=(H-h)/2`.
- **Chrome BG still competes after standard dim** → push saturation to 0.50 (desaturating
  kills the metallic pop).
- **Music has lyrics / tapers in the 2nd half** → re-roll "instrumental only, no vocals";
  generate ~20% longer than target and trim.
- **Final mp4 audio is 1 kbps** → ffmpeg mux without explicit map; add
  `-map 0:v:0 -map 1:a:0` and run mux as a separate pass.

## Related

- The remix twin — `remix-vignette-from-sample` — is what the app's format tab calls; it swaps
  the brand into this builder's `config.json` and publishes back through the
  goose-video runtime. Format link: `recipe.format: "vignette"`.
