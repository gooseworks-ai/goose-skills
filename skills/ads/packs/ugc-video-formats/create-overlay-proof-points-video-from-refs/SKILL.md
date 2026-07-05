---
name: create-overlay-proof-points-video-from-refs
description: >-
  Produce a single vertical "perfect-score + proof-points" UGC product ad
  (≈10s, 9:16) from a brand's real product photo — the Instagram
  comparison-tool reviewer format: ONE handheld AI shot of a creator holding the
  product, two persistent header pills (a white "we got a perfect 10/10 score"
  headline with a 🏅 + an orange "but here's also why you'll love us 👇" sub),
  and 3–4 green-✅ proof-point pills that reveal staggered in a diagonal L→R→L→R
  cascade around the bottle. The base clip is generative (nano-banana keyframe →
  Kling i2v, subtle handheld breathing, NO dialogue), and the pills are
  DETERMINISTIC PIL/FFmpeg overlays so the score + claims stay pixel-crisp. Use
  when the user references the "10/10 score" / comparison-tool-reviewer trend, a
  Pinterest/TikTok reel in that layout, or a brand with a clean one-hand bottle
  and 3–4 flexes worth stacking (purity, dose, clinical, taste). NOT for a
  talking-head monologue (use create-ugc-*-video-from-refs) and NOT for a
  carousel product reveal.
status: active
---

# create-overlay-proof-points-video-from-refs

## Purpose

Recreate the **"Instagram comparison-tool reviewer"** UGC ad: a creator films
themselves holding a product, and the frame is overlaid with a **"perfect 10/10
score"** headline at top plus **3–4 quick green-check proof points** that fan in
around the bottle. The score reads as third-party validation (a comparison-tool
screenshot lends credibility) layered on a UGC-feeling product shot.

The canonical source is the Origins Nutra Sea Buckthorn Oil reel
(`youtube.com/shorts/CEx5v8KplFI`); the canonical worked example is SpoiledChild
E27 Liquid Collagen, "We got a perfect 10/10 score"
(`one-shot-videos/create-overlay-proof-points-video-from-refs/demo/`).

This is a **hybrid** molecule: the base clip IS generative (one nano-banana
keyframe → one Kling i2v of subtle handheld motion, no dialogue), but the pills
are **deterministic PIL/FFmpeg overlays** — the whole point of the format is that
the score number, the ✅ claims, and the wordmark stay pixel-crisp, which a video
model would smear. No lip-sync, no captions, no Seedance. Two paid model calls
total (~$0.35): the keyframe and the i2v.

Use this when the brand has:
- A clean labeled bottle/box that fits in one hand.
- 3–4 short proof points worth flexing (purity, dose, ingredient quality,
  clinical backing, taste).
- An "external score" worth leading with (rating site, comparison tool,
  dermatologist panel, etc.).

## Inputs

Required:
- **Product image** — one clean product hero shot (on-white / PDP). Used as the
  image-ref for the keyframe so the real label + wordmark are preserved.
- **Brand name** — for the headline copy.
- **Score claim** — the top headline, e.g. "We got a perfect 10/10 score / for
  ingredient quality & purity" (two short lines).
- **Subhead copy** — the orange pill, e.g. "But here's also why you'll love us:".
- **Proof points** — 3–4 objects `{line_a, line_b}` (two short lines each), e.g.
  `{"line_a": "10g collagen", "line_b": "per serving"}`.

Optional (all have defaults in `config.example.json`):
- **Setting** — the backdrop the keyframe places the product in (default
  "outdoor home garden, leafy plants, daytime").
- **Creator descriptor** — what's visible besides the bottle (default "a woman's
  left hand, delicate gold heart-charm bracelet").
- **Music prompt** — ElevenLabs Music bed (default upbeat clean UGC).
- **Duration** — default 10s.

Environment: `FAL_KEY` (alias from `FAL_API_KEY` if needed) for the keyframe + i2v;
`ELEVENLABS_API_KEY` for the music bed. `ffmpeg` + Python `Pillow`, `fal_client`,
`requests` on PATH.

## Engine (scripts/)

Everything is config-driven off one `config.json` (copy `config.example.json`,
which IS the SpoiledChild worked example, and edit it). Canvas is always
1080×1920, 30fps.

| Script | Does |
|---|---|
| `one_shot.py` | Driver: `fetch_icons → gen_base_clip (PAID) → build_overlays → gen_music (PAID) → compose_master`. `--no-paid` renders overlays + a **silent** composite off an existing base clip so you can preview the design for free before approving the paid calls. |
| `fetch_icons.py` | Downloads the three Twemoji PNGs (🏅 `1f3c5`, 👇 `1f447`, ✅ `2705`) to `assets/icons`. PIL can't render Apple Color Emoji — we paste Twemoji PNGs. Free, local. |
| `gen_base_clip.py` | **PAID.** nano-banana `edit` keyframe (hand holds the product, real label preserved) → Kling v2.1 i2v (subtle handheld breathing, no scale change). Prompts + negative from config. |
| `build_overlays.py` | PIL: the white score header (trailing 🏅), the orange subhead (trailing 👇, width-matched to the header), and N green-✅ proof pills (auto-sized to copy). Bold weight + icon-centered-on-pill-middle are load-bearing. |
| `gen_music.py` | **PAID.** ElevenLabs Music bed; trims the sparse 2.5s intro, loudnorm −18 LUFS, fades the tail. |
| `compose_master.py` | FFmpeg: composite the always-on headers + the cascade proof pills (`enable='gte(t,T)'`), mux the music, apply the anti-AI grain pass, encode the master. Handles any 3–4 pill count. |

## Workflow

### Phase 0 — Intake (real assets first)
Derive the checklist: product image, brand name, score claim, subhead, 3–4 proof
points, setting/creator taste calls. Pull the brand's real product photo + label
and a proof point or two before asking; then ask only the true taste calls (the
score, which flexes, the backdrop). Write `config.json` and confirm the brief.
**Never invent proof — a "10/10 score" or a clinical claim must be the brand's own,
approved figure**, not an assumption.

### Phase 1 — Preview the design for free [no paid calls]
Run `one_shot.py --config config.json --run-dir <run> --no-paid` (needs an existing
`generated/clip-handheld.mp4` — for a design pass, drop any placeholder 9:16 clip).
This builds the pills and a silent composite so you can check copy, sizing, and the
cascade before spending. Watch it; fix `config.json`; repeat.

### Phase 2 — Keyframe + handheld i2v [PAID — GATE]
`gen_base_clip.py` fires the two paid calls: the nano-banana keyframe (why edit,
not t2i: it preserves the actual label/font/brand mark) then the Kling i2v (subtle
handheld breathing, no zoom/scale). **Wait for explicit approval before running —
these are the only paid calls.**

### Phase 3 — Overlays + composite + master
`build_overlays.py` → `gen_music.py` → `compose_master.py` (the full `one_shot.py`
without `--no-paid` runs all of these). Layout is fixed by the format:
- **Headers, always on 0–duration:** white at `(header_x, header_y)`, orange at
  `(header_x, subhead_y)` — same X so left edges align; the orange is width-matched
  to the white so they stack cleanly.
- **Proof pills, diagonal cascade (NOT four-corners):** each pill sits at its own
  row `pill_rows_y[i]`, alternating LEFT (`pill_left_x`) / RIGHT (`W-w-margin`),
  revealed at `reveal_times[i]` on the beat. The cascade is the format's signature.

### Phase 4 — Watch / QC (mandatory before ship)
Watch the master (frames + audio). Confirm: the label is intact and unmorphed
through the handheld motion, every pill is fully on-frame and readable, the cascade
reads L→R→L→R on the music beats, headers never overlap the bottle's face, no AI
smear on the hand/label. Fix `config.json` (copy/timing) or re-roll the i2v seed if
the label drifts, then re-compose + re-watch.

## Decision Rules

- **Real label, preserved.** Keyframe via nano-banana `edit` with the real product
  as the image-ref — brand recognition depends on the wordmark/label surviving.
- **Never AI-render the pill text.** Score, ✅ claims, and wordmark are PIL/DOM
  composited so they stay crisp — a video model smears type.
- **Bold weight + centered icons are load-bearing.** Regular weight reads as a
  generic UI card, not a sticker. Center icons on the pill's geometric middle
  (`icon_y = (box_h - icon_size)//2`), not a text line, or they overflow the corner
  on short pills. Vertical-center glyphs with `anchor="lm"`.
- **Cascade, don't four-corner.** Pills arrive one per beat down a diagonal; the eye
  follows L→R→L→R. Don't park all four at once.
- **Subtle handheld only.** The i2v is breathing motion — no zoom, no walk, no scale
  change (those morph the label). Explicit negatives: `shake, whip, dolly, orbit,
  zoom, scale change, label morph`.
- **No dialogue, no captions, no contact physics** (nothing floats in the bottle;
  feed a utensil-free product ref).

## Output

- `master-final.mp4` — 1080×1920, ≈10s, h264 + aac (music bed). Grain-passed,
  re-encoded crf23/maxrate12M (grain inflates bitrate).
- A poster still (extract a late frame where all pills show).

## Failure Modes

- **Label morph mid-i2v** → tighten the negative prompt, lower `cfg_scale`, or
  re-roll the seed off the clean keyframe. Keep one wardrobe / one take.
- **PIL emoji bars** → you loaded Apple Color Emoji; use the Twemoji PNGs from
  `fetch_icons.py`.
- **Icon overflows the pill corner** on a short pill → it's anchored to a text line,
  not the pill middle; use the engine's `icon_y = (box_h - icon_size)//2`.
- **Stale overlays after a copy change** → `compose_master.py` reads pre-rendered
  PNGs; always re-run `build_overlays.py` first.
- **FAL 403 / "exhausted balance"** with funds on the dashboard → a stale ambient
  `FAL_KEY` shadows the repo key; `export FAL_KEY="$FAL_API_KEY"` and re-run.
- **Grain pass inflates bitrate** → the engine already re-encodes crf23/maxrate12M;
  archive any high-bitrate original separately.
