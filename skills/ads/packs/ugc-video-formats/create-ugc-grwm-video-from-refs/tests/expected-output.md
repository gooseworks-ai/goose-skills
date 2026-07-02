# Expected Output

## Artifacts
```
<project>/
  assets/refs/        normalized stills: full-length neutral-BG avatar, garment
                      product shot(s), (optional) empty bedroom plate — @Image1..N
  working/            seedance_prompt.txt; gpt55 review (optional); any
                      replacement-clip prompt(s); fix clip(s) (silent); review
                      frames + montage + transcript
  finals/
    <name>.mp4        master Seedance render (15s default)
    <name>-v2.mp4     after any surgical beat fix (delivered)
```

## The delivered video
- Vertical 9:16, requested duration (default 15s) ±0.2s, requested resolution.
- Native lip-synced dialogue; transcript matches the scripted lines on the
  front-cam beats. **No burned captions.**
- 3–4 beats in order with clean hard cuts.
- **Single person throughout** — no second body, partial body, stray hand, or
  extra reflection, including the off-camera reaction beat and the mirror.
- **The full outfit is revealed** head-to-toe in at least one mirror/full-body
  beat.
- Garment color/pattern/scale consistent across selfie + mirror cuts; identity
  and room consistent; no invented text/logos.
- Any drifted beat repaired via a silent re-render + audio-preserving stitch;
  output re-reviewed and in sync.

## The review-loop report
A structured issue list with timestamps covering: beat order, single-person
integrity (incl. mirror), full-body reveal, garment fidelity, identity/room
consistency, lip-sync, and limbs/morphs/stray objects — plus a clear
clean/needs-fix verdict.

## Process evidence
- GPT-image-2 and Seedance prompts were each presented and approved before firing.
- Stack used: GPT-image-2 + Seedance 2.0 only.
