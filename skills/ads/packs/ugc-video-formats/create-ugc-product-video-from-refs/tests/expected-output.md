# Expected Output

## Artifacts
```
<project>/
  assets/refs/        normalized stills: product cutout, neutral-BG avatar,
                      (optional) empty environment plate — @Image1..N order
  working/            seedance_prompt.txt; any replacement-clip prompt(s);
                      fix clip(s) (silent); review frames + transcript
  finals/
    <name>.mp4        master Seedance render (15s default)
    <name>-v2.mp4     after any surgical beat fix (delivered)
```

## The delivered video
- Vertical 9:16, requested duration (default 15s) ±0.2s, requested resolution.
- Native lip-synced dialogue; transcript matches the scripted lines on the
  front-cam beats. **No burned captions.**
- 3–4 beats in order with clean hard cuts; identity, two-color separation, and
  product geometry consistent across cuts.
- Any drifted beat repaired via a silent re-render + audio-preserving stitch;
  output re-reviewed and in sync.

## The review-loop report
A structured issue list with timestamps covering: beat order, consistency
(identity / colors / product geometry / hero features / small text), lip-sync,
physics/limbs/stray objects, and motion-beat cleanliness — plus a clear
clean/needs-fix verdict.

## Process evidence
- GPT-image-2 and Seedance prompts were each presented and approved before firing.
- Stack used: GPT-image-2 + Seedance 2.0 only.
