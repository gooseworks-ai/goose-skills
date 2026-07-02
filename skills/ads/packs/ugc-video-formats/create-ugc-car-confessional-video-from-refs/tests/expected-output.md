# Expected Output

## Artifacts
```
<project>/
  assets/refs/        @Image1 composed selfie still (creator seated in the parked
                      car); (product build) @Image2 product cutout
  working/            seedance_prompt.txt; gpt55 review; review frames + transcript;
                      any silent fix clip(s)
  finals/
    <name>.mp4        master Seedance render (15s default)
    <name>-v2.mp4     after any surgical window fix (delivered)
```

## The delivered video
- Vertical 9:16, requested duration (default 15s) ±0.2s, requested resolution.
- ONE continuous take — no internal cuts, no second person, no morph/warp.
- Native lip-synced dialogue; Whisper transcript matches the scripted monologue.
  **No burned captions, no music** — voice + quiet parked-car room tone only.
- Car stays parked; creator reads as alive (real micro-motion), not a mannequin.
- Identity + wardrobe + car interior consistent start to finish.
- (Product build) product geometry + label hold; label legible when shown; no
  contact physics; no extra/warped hands.

## The review-loop report
A structured, timestamped issue list covering: parked-vs-drifting, static-body vs
micro-motion, lip-sync + transcript match, identity/wardrobe consistency,
(product build) product/label + hands, and single-take integrity — plus a
clean/needs-fix verdict.

## Reference render (validated default)
`demo/finals/car-confessional-15s.mp4` — 15s / 720p, early-30s man, parked-car
confessional, seed 515084080, ~$4.50. Transcript matched the script verbatim;
stayed parked; natural micro-motion; passed QC with no fixes.

## Process evidence
- Phase 0 offered avatar / location / product; defaults used only on "no preference".
- GPT-image-2 and Seedance prompts were each presented and approved before firing;
  probed at 720p before any 1080p hero.
- Stack used: GPT-image-2 + Seedance 2.0 only.
