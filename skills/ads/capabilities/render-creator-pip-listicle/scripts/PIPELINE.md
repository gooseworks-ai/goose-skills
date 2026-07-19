# Pipeline — creator-pip-listicle

How `config.example.json` maps to the real production steps. This capability ships a
**config + this map**, not a bundled runner: the worked example (DIBS Beauty "5 products that
replaced my whole makeup bag") was produced by the video-orchestrator's per-state steps plus a set
of per-project drivers (`render_product_cards.py`, `composite_pip.py`) and the shared
native-Seedance driver (`gen_seedance_native.py`).

The steps run **in order** because each depends on the last: the beat script sets the per-beat
durations, the creator anchor + seed drive the native talking clips, the real demo + product photos
drive the PiP + product cards, the composite overlays them on the full-frame creator, and the
caption burn lands last on the stitched master.

## Field → source-script map

| Config field | Phase | Source step / script (in the run) | Paid? |
|---|---|---|---|
| `beats[]` (dialogue / duration / pip / card / badge / show_title), `listicle` | 1 Script | concept + conversational script lock → `native-beats.json` | free |
| `creator.anchor`, `creator.image_model`, `creator.realism`, `creator.descriptor` | 2 Creator | **Seedream v5 Pro** candid portrait (`bytedance/seedream/v5/pro/text-to-image`, no `fal-ai/` prefix), realism-gated | **PAID** |
| `clip_engine`, `beats[].dialogue` (native talking clip) | 3 Clips | Seedance 2.0 reference-to-video (`bytedance/seedance-2.0/reference-to-video`), dialogue inline, `generate_audio=ON`, SAME seed, 720p → `creator-beat-<name>.mp4` | **PAID** (largest spend) |
| `pip` (autocropped demo) | 4 Overlays | demo prep: brand's real UGC clip → `pip-<slug>.mp4`, OR autocrop a product-UI still → `demo-<slug>.png` (fill the window) | free |
| `product_cards` | 4 Overlays | `render_product_cards.py` (real product photo/UI thumbnail + brand type → bottom-pinned PNG) → `product-card-<slug>.png` | free |
| `title_pill`, `rank_badge`, `composite.overlay` | 5 Composite | ONE full-1080×1920 transparent overlay PNG per beat (title pill; + PiP + card + rank number on product beats) | free |
| `composite` (single-shot full-frame + overlay), `beats[].duration` | 5 Composite | `composite_pip.py` (cover-scale the creator clip to 1080×1920, overlay the beat's PNG, keep native audio) → `composite-<name>.mp4` | free |
| `stitch` | 6 Stitch | ffmpeg concat demuxer @ 30fps / yuv420p → `master-pip.mp4` | free |
| `captions` | 6 Captions | PIL PNG caption overlays, timed deterministically from the known script, burned last (`overlay=…:enable='between(t,s,e)'`) | free |

## 1. Script → beat metadata  (config: `beats`, `listicle`)  [paid stage owner — not this cap]

Lock a first-person countdown (a hook + N product beats + a CTA) and convert to `native-beats.json`:
per beat `{name, dialogue, duration, pip, card, badge, show_title}`. `duration = clamp(ceil(words /
2.3) + 1, 4, 11)` s (Seedance native pace ≈ 2.3 words/s). Hook + CTA carry no PiP/card/badge (title
pill only); each product beat carries a PiP slug + a card slug + a rank number. Keep each sentence
whole on its beat.

## 2. Creator → Seedream v5 Pro candid anchor  (config: `creator`)  [PAID — `create-image-fal`]

One **Seedream v5 Pro** candid portrait — `create-image-fal`, model
`bytedance/seedream/v5/pro/text-to-image` (**no `fal-ai/` prefix**). A plain, calm, candid
head-and-shoulders portrait on a neutral wall — un-retouched (pores, freckles, fine lines, no perfect
teeth), soft even indoor daylight. AVOID "beautiful/perfect/8k/hyperreal/studio". Gate on realism →
`anchor.png`. **CRITICAL:** Seedance 2.0's partner-validation gate REJECTS photoreal faces from
**gpt-image-2 AND Seedream v4** ("may contain likenesses of real people") — Seedream v5 Pro **passes**.
Use a **FRESHLY generated** image (reusing an existing photoreal face also trips the gate). The
approved anchor + the **same seed** are threaded into every native talking clip so the creator holds
beat to beat.

## 3. Native talking clips → Seedance 2.0 reference-to-video  (config: `clip_engine`, `beats[].dialogue`)  [PAID — `create-video-fal`]

`gen_seedance_native.py` reads `native-beats.json`, puts each beat's `dialogue` **inline in the
prompt**, and generates one Seedance 2.0 reference-to-video clip per beat off the creator anchor —
model `bytedance/seedance-2.0/reference-to-video`, `generate_audio=ON`, the **SAME seed across beats**,
720p default → `creator-beat-<name>.mp4`. The voice + lips are generated **together** — no separate
VO, no lip-sync bolt-on. The largest spend, so **GATE it**: a **REJECTED submit STILL bills** via the
fal-proxy → **pre-flight the HOOK clip alone** and confirm it renders before firing the rest.
Presigned anchor URLs expire ~1h → **re-host** the anchor if a batch runs long (else "Failed to
download the file" mid-batch). The intermittent fal "User is locked: Exhausted balance" is the
proxy's upstream fal account (not your GooseWorks credits) → retry with backoff.

## 4. Demo PiP prep + product cards → autocrop + PIL  (config: `pip`, `product_cards`)  [FREE — this cap]

- **Demo (PiP):** per product beat, provide the demo shown in the top-right PiP: (a) the brand's
  **REAL UGC** ad → `pip-<slug>.mp4` (MUTED, never AI-regenerated); OR (b) for a brand with **NO UGC**
  (B2B/SaaS), the product's **own** demo — a real screen-recording, or an **AUTOCROPPED** high-res
  product-UI/dashboard still → `demo-<slug>.png`. Autocrop each still (trim transparent/near-white
  margins) and size the PiP window to the cropped content's aspect ratio so it **FILLS the window** —
  no letterbox whitespace (a **WIDE screenshot → a SHORT + WIDE window**). Disclose in the review when
  the demo is a still/mockup rather than a real UGC clip.
- **Product cards** (`render_product_cards.py`): a bottom-pinned rounded card PNG — rounded product/UI
  thumbnail left, then "N · CATEGORY" (rank + short category, brand-accent, small caps) and the product
  NAME in a serif face (Georgia/Times) below, brand palette — from the real product photo (or a
  brand-color tile with the wordmark if no photo) → `product-card-<slug>.png`. Pinned bottom on the
  whole product beat.

## 5. Single-shot full-frame composite → `composite_pip.py`  (config: `composite`, `pip`, `rank_badge`, `title_pill`)  [FREE — this cap]

Each beat is **ONE continuous full-frame creator shot** with persistent overlays — **there is NO cut
to a full-frame product shot** (`per_beat_shots = 1`). Per beat:

1. **Build the overlay PNG.** Compose ONE full-1080×1920 transparent PNG: the **title pill**
   top-center (all beats); + on product beats the **demo PiP** top-right (autocropped, the window sized
   to the demo's aspect so it fills — no whitespace), the **bottom product card** (thumbnail + "N ·
   CATEGORY" + serif name), and the **rank number** on the card.
2. **Composite.** Scale the creator clip to 1080×1920 (**cover**), overlay the beat's overlay PNG for
   the **WHOLE beat**, and keep the creator clip's **native audio** (the demo PiP's audio is muted so
   the voice never doubles) → `composite-<name>.mp4`.

Hook + CTA are the full-frame creator with the title pill only (no PiP/card).

## 6. Stitch + captions → ffmpeg concat + PIL PNG overlays  (config: `stitch`, `captions`)

- **Stitch [FREE]:** concat the per-beat composites with the ffmpeg concat demuxer @ 30fps / yuv420p
  → `master-pip.mp4`. Probe durations with `ffprobe -of csv=p=0` (NOT `-of default=nk=1:np=1`, which
  errors on some builds).
- **Captions [FREE]:** burn **LAST** as **timed PIL PNG overlays** — this ffmpeg has **no libass** (no
  `subtitles`/`ass` filter). Render each ~2-word cue as a PIL PNG (white words + brand-accent
  underline, black stroke) and composite with `overlay=…:enable='between(t,s,e)'`, positioned **CLEAR
  of the top-right PiP and the bottom card** (mid-to-lower band). Time them **DETERMINISTICALLY** from
  the known per-beat script — the fal-ai/whisper proxy is unreliable (900s timeouts); do NOT depend on
  it. The known script is the brand-correct source, so brand tokens are always spelled right.

Re-cuts (new beat durations, a swapped card, a re-cropped demo, a caption re-chunk, toggled overlays)
reuse the existing native clips + overlays and cost **$0** — only the anchor and the N native clips
spend.
