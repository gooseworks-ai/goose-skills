# Expected Output

## Artifacts
```
<project>/
  assets/refs/        @Image1 composed arm-out selfie still (creator walking the
                      street); (+ @Image2 product cutout for a product build)
  working/            seedance_prompt.txt; gpt55 review; review frames + transcript;
                      any silent fix clip(s)
  finals/
    <name>.mp4        master Seedance render (15s default)
    <name>-v2.mp4     after any surgical window fix (delivered)
```

## The delivered video (demo reference)
- Worked example: `demo/finals/walk-and-talk-15s.mp4` — 15s / 720p, "screen-free
  morning walk" tips monologue, seed **1364067802**, ~**$4.50**. Provenance in
  `demo/finals/walk-and-talk-15s.mp4.meta.json`
  (`bytedance/seedance-2.0/reference-to-video`, `generate_audio: true`,
  `aspect_ratio: 9:16`).
- Vertical 9:16, requested duration (default 15s) ±0.2s, requested resolution.
- Native lip-synced dialogue; transcript matches the scripted lines
  near-verbatim. **No burned captions, no music** — live outdoor street ambience
  only.
- **Genuine locomotion + parallax** — she reads as walking forward with the
  sidewalk / trees / storefronts / blurred pedestrians drifting past; not walking
  on the spot, not floating on a static plate.
- Identity + wardrobe + hair hold across the whole take (rust henley, half-up
  curls, gold hoops + pendant); single continuous take, no second person, no
  morph, **no background melt**.
- Any drifted window repaired via a silent re-render + audio-preserving stitch;
  output re-reviewed and in sync.

## The review-loop report
A structured issue list with timestamps covering: locomotion + parallax (is she
really walking?), background integrity (any warp/melt or distorted pedestrians),
identity/wardrobe consistency, lip-sync + transcript match, and any morph/second
person — plus a clear clean/needs-fix verdict. (Demo verdict: passed — genuine
locomotion + parallax, identity/wardrobe locked, clean lip-sync, transcript
matched, no second person, no melting.)

## Process evidence
- GPT-image-2 and Seedance prompts were each presented and approved before firing.
- Probed at 720p first (with the busy-background watch-out applied if needed)
  before any 1080p upgrade.
- Stack used: GPT-image-2 + Seedance 2.0 only.
