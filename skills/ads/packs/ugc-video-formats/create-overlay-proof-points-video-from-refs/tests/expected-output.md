# Expected Output

## Artifacts
- `master-final.mp4` — 1080×1920, ≈10s, **h264 + aac** (music bed). Grain-passed,
  re-encoded crf23/maxrate12M.
- `generated/keyframe-hand-product.png` — the nano-banana keyframe (hand holds the
  real product, label preserved).
- `generated/clip-handheld.mp4` — the Kling i2v base clip (subtle handheld breath).
- `generated/overlays/*.png` — 2 header pills + 3–4 proof pills.
- A poster still (a late frame where all pills show).

## Visual shape (per frame, once landed)
- One handheld UGC shot: a creator's hand holds the product; natural daylight,
  real-iPhone aesthetic, label sharp and unmorphed.
- Top: white **score header** pill ("…perfect 10/10 score…" + 🏅) and, under it,
  an orange **subhead** pill ("But here's also why you'll love us:" + 👇), left
  edges aligned, persisting the whole clip.
- 3–4 white **proof pills**, each with a leading ✅ and two short lines, arranged
  down a diagonal alternating LEFT / RIGHT around the bottle.

## Motion + reveal + audio
- Base motion is a gentle handheld breath — no zoom, no scale change, no label morph.
- Proof pills reveal one at a time on the beat (`reveal_times`), eye following
  L→R→L→R; headers are on from t=0.
- Audio: an upbeat instrumental UGC bed that kicks in immediately (sparse 2.5s intro
  trimmed) and fades the last 0.5s. No dialogue, no VO.

## Non-goals
- No talking-head dialogue, no lip-sync, no captions.
- No AI-rendered pill/score text (PIL/DOM composited — always crisp).
- No invented proof: the score and every ✅ claim is the brand's own, approved figure.
- Nothing floats inside/around the bottle (no contact physics).
