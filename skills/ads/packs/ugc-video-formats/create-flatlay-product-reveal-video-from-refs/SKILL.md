---
name: create-flatlay-product-reveal-video-from-refs
description: >-
  Produce a single vertical "flat-lay product reveal" ad (≈14–16s, 9:16) from a
  brand's real product images — a top-down tabletop listicle where, beat by beat,
  a product lies flat on a dressed linen surface and two hands enter from the
  bottom corners, cup it, hold it centered ~1.5s (cover/label fully readable),
  then lift and carry it off frame; hard-cut to the next product. Each beat is a
  Veo 3.1 image-to-video render off a PIL start-frame (real product composited
  onto the tabletop plate); the covers are first transformed to a true top-down
  flat square by an image-edit model so the art/text/logo stay identical. Closes
  with an optional greeting-card insert + a deterministic HTML brand end card,
  over a music bed. Two paid model calls PER beat (flat cover + Veo i2v). Use when
  the brand has a set of flat, cover-forward products (books, boxes, cards,
  packaging) and wants a premium tabletop "here's the range" reveal. NOT for a
  talking-head UGC video and NOT for a single-product handheld demo.
status: active
---

# create-flatlay-product-reveal-video-from-refs

## Purpose

Recreate the **top-down tabletop product-reveal listicle**: a sequence of products
(books, boxes, cards, packaging) each shown flat on a dressed linen surface while two
hands cup it, hold it readable, and carry it away — hard-cutting between beats, over a
warm music bed, closing on a brand end card. It reads as a premium DTC flat-lay
shoot, not as UGC. The canonical worked example is Wonderbly's "Father's Day book
swap" — four personalized books revealed one per beat (`demo/`).

The reusable IP is **the two-step per-beat recipe**: (1) transform each product's
cover to a **true top-down flat square** with an image-edit model — preserving art,
text, names, and logo exactly — then (2) composite it onto the tabletop plate and
drive a **Veo 3.1 image-to-video** "hands cup + hold + lift" beat that keeps the cover
crisp and readable throughout. Plus the deterministic assembly: speed each 4s beat to
~2.67s, hard-cut concat, optional greeting-card insert, brand end card, music.

**Why Veo (not Seedance):** Veo preserves the start-frame geometry and holds the
square top-down framing; Seedance defaulted to a portrait crop and smeared the cover
typography. Two paid model calls per beat (flat cover ~$0.19 + Veo ~$0.80).

Use this when the brand has:
- A set of **flat, cover-forward** products (books, boxes, greeting cards, packaging).
- A "here's the range / here's the lineup" story (one product per beat).
- Real cover/label art whose text must stay readable (the format's whole point).

## Inputs

Required (one `config.json` — copy `config.example.json`, the Wonderbly example):
- **Beats** — 3–5 products, each `{slug, cover_ref, label}`. `cover_ref` is the real
  product/cover image (any angle — it's transformed to flat top-down).
- **Tabletop plate** — `tabletop_bg`: the dressed linen surface (branches, props). One
  plate is reused across beats.
- **End card** — `end_card.html`: the brand's own end-card template (wordmark + trust
  icons + CTA), rendered deterministically.

Optional (defaults in `config.example.json`):
- **Flat-cover / beat-i2v prompts + models** — the top-down transform and the
  hands-cup-and-lift Veo prompt (tuned defaults provided; edit per brand).
- **Insert card** — an optional greeting-card beat (generated illustration + a
  handwritten line, fade in/hold/out). Disable with `insert_card.enabled: false`.
- **Music** — ElevenLabs bed (default lively warm, energetic from t=0).
- **beat_speed** (1.5), **fps** (30), **dims** (1080×1920).

Assets are git-LFS in brand folders — **fetch + checkout each first** (pointers are
~131-byte stubs).

## Engine (scripts/)

| Script | Does |
|---|---|
| `one_shot.py` | Driver: flat covers → start frames → beats → [insert card] → end card → music → master. `--assemble-only` re-cuts the master from existing beats for **$0**. |
| `gen_flat_covers.py` | **PAID.** Image-edit each `cover_ref` → true top-down flat square, art/text/logo preserved. |
| `build_start_frames.py` | PIL: composite each flat cover centered on the tabletop plate → the Veo start frame. Free. |
| `gen_beats.py` | **PAID (Veo 3.1 i2v).** Each start frame → a ~4s "hands cup + hold + lift" beat, camera locked top-down. |
| `gen_fd_card.py` | **PAID (optional).** Greeting-card illustration + a handwritten line → a fade-in/hold/out insert clip. Skips if `insert_card.enabled` is false. |
| `render_endcard.py` | Playwright screenshots `end_card.html` → a static-dwell end-card mp4. Free/deterministic. |
| `gen_music.py` | **PAID.** ElevenLabs bed (energetic from t=0), loudnorm, fade tail. |
| `build_master.py` | Speed each beat by `beat_speed`, hard-cut concat, [insert card], append end card, mux music. Free/deterministic. |

Requires `fal_client`, `Pillow`, Playwright chromium, `ffmpeg`, `requests`; keys
`FAL_API_KEY` + `ELEVENLABS_API_KEY` from `gtm-goose/.env`.

## Workflow

### Phase 0 — Intake (real assets first)
Derive the checklist: 3–5 flat products + their real cover art, a tabletop plate
(dressing), the brand end-card HTML, optional greeting-card theme, music mood. Pull
the brand's real covers + wordmark from the brand kit; LFS-fetch each. Ask only the
true taste calls (which products, order, whether to include the insert card). Write
`config.json` and confirm the brief. **Preserve every cover's real art/text/names —
never redesign or invent product copy.**

### Phase 1 — Flat covers + start frames [1 paid call/beat — GATE]
`gen_flat_covers.py` (top-down transform, paid) → `build_start_frames.py` (free
composite). **Review the flat covers before the Veo step** — confirm each cover's
art/text/logo survived the transform. Re-roll any that garbled.

### Phase 2 — Veo beats [1 paid Veo call/beat — GATE]
`gen_beats.py`. **Wait for approval before firing** (the largest spend). Each beat:
hands enter bottom corners, cup, hold ~1.5s readable, lift + carry off. `/watch` each
— the cover must stay crisp and identical from frame 0 to exit (no smear/redesign).

### Phase 3 — Insert + end card + music + master
`gen_fd_card.py` (optional) → `render_endcard.py` → `gen_music.py` → `build_master.py`
(the full `one_shot.py` runs all). Assembly is deterministic: 1.5× speed, hard-cut
concat, insert card, end card, music. Iterate the cut for free with `--assemble-only`.

### Phase 4 — Watch / QC (mandatory before ship)
`/watch` the master. Confirm: every cover reads crisp through its beat (no morph);
hands cup + lift naturally, camera locked top-down; hard cuts (no dissolves); the
insert + end card land; music kicks in at t=0. Fix `config.json` / re-roll the
offending beat, re-assemble, re-watch.

## Decision Rules

- **Preserve the cover exactly.** The flat-cover transform and the Veo prompt both
  hard-constrain art/text/names/logo — this is the format's whole credibility. Verify
  the product face is the front, not the back.
- **Veo, not Seedance, for the beat.** Veo holds the top-down square + readable cover;
  Seedance crops portrait and smears type.
- **Top-down locked camera; hands from the bottom corners.** No camera move, no tilt.
  Hold the product centered + readable ~1.5s before the lift.
- **Hard cuts, on rhythm.** Speed each 4s beat to ~2.67s and hard-concat — the listicle
  snap. No dissolves.
- **Never AI-render the end card text or invent copy.** The end card is the brand's own
  HTML template; product covers are the brand's real art.
- **One tabletop plate, consistent dressing** across beats so the sequence reads as one shoot.

## Post-production

Post-production layers, explicit per the one-shot-videos family convention (default **ON** where the layer applies; **N/A** formats say why). Toggle via `post_production` in `config.json`:

- **Music** — default ON: ElevenLabs bed, default on.
- **Captions** — N/A: no spoken dialogue.
- **End card** — default ON: HTML brand end card (core to the format).

## Output

- `master-final.mp4` — 1080×1920, ≈14–16s, h264 (+ aac music). N beats + optional
  insert + end card.
- A poster still (a held-product frame from any beat).
- `generated/` — flat covers, start frames, beat clips, end card, music (kept for re-cuts).

## Quality Checks

- Canvas 1080×1920; duration ≈ `N × (beat_i2v.duration/beat_speed) + insert + end_card`.
- Every product cover reads crisp and identical through its beat (no smear/redesign).
- Hands enter from the bottom corners, cup + hold ~1.5s, then lift off; camera locked top-down.
- Hard cuts between beats (no dissolves); end card lands; music starts at t=0.

## Failure Modes

- **Cover garbled by the flat transform** → re-roll `gen_flat_covers` for that beat;
  tighten the "do NOT alter art/text/names/logo" clause; verify front vs back face.
- **Veo smears/redesigns the cover mid-beat** → re-roll the seed; keep the "PRESERVED
  EXACTLY from the start frame" ABSOLUTE clause; confirm you passed the flat start
  frame (not the 3D ref).
- **Veo crops portrait / moves the camera** → that's the Seedance failure mode; use Veo
  (`fal-ai/veo3/image-to-video`) and state "camera does NOT move, top-down 90°".
- **Concat audio/duration drift** → beats are normalized to one fps/codec before
  concat-copy; keep `fps` consistent across all clips (build_master does this).
- **FAL 403 / "exhausted balance"** with funds → stale ambient `FAL_KEY`; `export
  FAL_KEY="$FAL_API_KEY"` and re-run.
- **Sparse music intro** on a ~15s cut → the prompt says "energetic from t=0"; raise
  `music.trim_intro_sec` to hard-trim any lead-in.

## Related

- The remix twin — `remix-flatlay-product-reveal-from-sample` — is what the app's format tab calls; it swaps
  the brand into this builder's `config.json` and publishes back through the
  goose-video runtime. Format link: `recipe.format: "flatlay-product-reveal"`.
