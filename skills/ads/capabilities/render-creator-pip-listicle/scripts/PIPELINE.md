# Pipeline — creator-pip-listicle

How `config.example.json` maps to the real production steps. This capability ships a
**config + this map**, not a bundled runner: the worked example (DIBS Beauty "5 products that
replaced my whole makeup bag") was produced by the video-orchestrator's per-state steps plus a set
of per-project drivers (`broll_kenburns.py`, `render_product_cards.py`,
`composite_native_multicut.py`) and the shared native-Seedance driver (`gen_seedance_native.py`).

The steps run **in order** because each depends on the last: the beat script sets the shot count
and per-beat durations, the creator anchor + seed drive the native talking clips, the real product
photos drive the Ken-Burns cutaways + product cards, the multicut assembles the two-shot beats, and
the caption burn lands last on the stitched master.

## Field → source-script map

| Config field | Phase | Source step / script (in the run) | Paid? |
|---|---|---|---|
| `beats[]` (dialogue / duration / pip / card / badge / show_title), `listicle` | 1 Script | concept + conversational script lock → `native-beats.json` | free |
| `creator.anchor`, `creator.realism`, `creator.descriptor` | 2 Creator | gpt-image-2 iPhone-candid anchor, realism-gated | **PAID** |
| `clip_engine`, `beats[].dialogue` (native talking clip) | 3 Clips | Seedance 2.0 native-audio i2v, dialogue inline, `generate_audio=ON`, SAME seed → `creator-beat-<name>.mp4` | **PAID** (largest spend) |
| `broll` (Ken-Burns macros) | 4 Overlays | `broll_kenburns.py` (real product photo → push-in; PIL text-card fallback) → `broll-<slug>.mp4` | free |
| `product_cards` | 4 Overlays | `render_product_cards.py` (real product photo + brand type → bottom-pinned PNG) → `product-card-<slug>.png` | free |
| `pip`, `rank_badge`, `title_pill` | 5 Composite | overlay layers burned by `composite_native_multicut.py` (PiP top-right + hairline, product card bottom, title pill, rank badge) | free |
| `composite` (2-shot multicut), `beats[].duration` | 5 Composite | `composite_native_multicut.py` (per-beat 2 shots, native audio muxed continuous) → `composite-<name>.mp4` | free |
| `stitch` | 6 Stitch | ffmpeg concat demuxer @ 30fps / yuv420p → `master-multicut.mp4` | free |
| `captions` | 6 Captions | `burn-in-captions --style white-words --accent <brand-hex>` on the stitched master | ~$1 |

## 1. Script → beat metadata  (config: `beats`, `listicle`)  [paid stage owner — not this cap]

Lock a first-person countdown (a hook + N product beats + a CTA) and convert to `native-beats.json`:
per beat `{name, dialogue, duration, pip, card, badge, show_title}`. `duration = clamp(ceil(words /
2.3) + 1, 4, 11)` s (Seedance native pace ≈ 2.3 words/s). Hook + CTA carry no PiP/card/badge; each
product beat carries a PiP slug + a card slug + a rank badge. Keep each sentence whole on its beat (a
fragment on the b-roll cutaway hides the mouth).

## 2. Creator → gpt-image-2 iPhone-candid anchor  (config: `creator`)  [PAID — `create-image-gpt-image-fal`]

One gpt-image-2 candid iPhone-realism portrait — visible pores, natural matte skin, no
gloss/retouch, soft window light, unposed. Gate on realism → `anchor.png`. The approved anchor + the
**same seed** are threaded into every native talking clip so the creator holds beat to beat.

## 3. Native talking clips → Seedance 2.0 native-audio i2v  (config: `clip_engine`, `beats[].dialogue`)  [PAID — `create-video-fal`]

`gen_seedance_native.py` reads `native-beats.json`, puts each beat's `dialogue` **inline in the
prompt**, and generates one Seedance 2.0 reference-to-video clip per beat off the creator anchor with
`generate_audio=ON` and the **SAME seed across beats** → `creator-beat-<name>.mp4`. The voice + lips
are generated **together** — no separate VO, no lip-sync bolt-on. The largest spend — pre-flight the
hook + one product beat before firing all N.

## 4. Ken-Burns b-roll + product cards → PIL + ffmpeg  (config: `broll`, `product_cards`)  [FREE — this cap]

- **Ken-Burns macros** (`broll_kenburns.py`): each real product photo is centered on a soft
  brand-gradient 9:16 canvas (+ soft drop shadow) and gets a slow push-in (zoom → 1.16x) over ~2.6s
  → `broll-<slug>.mp4`. A product with **no clean photo** is handled as a branded PIL text card
  instead — **never an AI product render** (i2v mangles the label).
- **Product cards** (`render_product_cards.py`): a bottom-pinned rounded card PNG — accent stripe
  left, product thumbnail + name + subtitle in the brand type, brand palette — from the real product
  photo (or a brand-color tile with the wordmark if no photo) → `product-card-<slug>.png`.

## 5. Multicut composite → `composite_native_multicut.py`  (config: `composite`, `pip`, `rank_badge`, `title_pill`)  [FREE — this cap]

Each product beat is cut into **two shots** to raise cut density (targets ≥4 cuts/10s, ≤50%
direct-face share):
- **Shot (a) — creator + PiP + card (~60%):** the creator native clip with the real UGC PiP scaled
  to `pip.size_frac` and overlaid top-right (`pip.top_y`, hairline white border) — **PiP audio
  MUTED** — the product card pinned bottom, plus the title pill (if `show_title`) and the rank badge
  on the PiP.
- **Shot (b) — full-frame cutaway + card (~40%):** the Ken-Burns product macro (or the PIL text
  card) full-frame with the product card still pinned bottom.

The hook front-loads a ~1.6s swipe macro then the creator; the CTA is a single creator shot. The two
shots are concatenated per beat, and the **creator beat's native audio is muxed continuous under the
whole beat** (the b-roll shot is silent video; the PiP audio is stripped) → `composite-<name>.mp4`.

## 6. Stitch + captions → ffmpeg concat + `burn-in-captions`  (config: `stitch`, `captions`)

- **Stitch [FREE]:** concat the per-beat composites with the ffmpeg concat demuxer @ 30fps /
  yuv420p → `master-multicut.mp4`.
- **Captions [~$1]:** burn LAST — `burn-in-captions --style white-words --accent <brand-hex>`: white
  2-ish-word chunks in the lower third with a brand-color accent, from the native audio's word
  timings — the on-screen safety net for brand tokens Seedance may mis-voice → the caption'd master.
  If the host ffmpeg lacks libass, render the cues as timed PIL PNG overlays at the same lower-third
  placement.

Re-cuts (new beat durations, a re-timed shot split, a swapped card, a caption re-chunk, a toggled
title pill) reuse the existing native clips + overlays and cost **$0** — only the anchor, the N
native clips, and the caption burn spend.
