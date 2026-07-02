# Expected Output

## Artifacts
```
<project>/
  assets/refs/        normalized stills: product cutout (label legible),
                      neutral-BG avatar — @Image1 (avatar), @Image2 (product)
  working/            seedance_prompt.txt; gpt55 review; any replacement-clip
                      prompt(s); fix clip(s) (silent); review frames + transcript
  finals/
    <name>.mp4        master Seedance render (15s default)
    <name>-v2.mp4     after any surgical beat fix (delivered)
```

## The delivered video
- Vertical 9:16, requested duration (default 15s) ±0.2s, requested resolution.
- Native lip-synced dialogue; transcript matches the scripted lines on the
  talking beats; the application beat is silent. **No burned captions.**
- 4–5 close-up beats in order with clean hard cuts; identity, bathroom
  continuity, and product geometry/label consistent across cuts.
- **NO phone / camera / hands-holding-a-phone / mirror-of-a-device in any frame.**
- Audio is her voice + bathroom room tone only — no music, no SFX.
- Any drifted beat (or stray device/mirror) repaired via a silent re-render +
  audio-preserving stitch; output re-reviewed and in sync.

## The review-loop report
A structured issue list with timestamps covering: beat order, **the
no-device/no-mirror scan (automatic-fail axis)**, consistency (identity /
bathroom / product geometry / label), lip-sync (incl. the silent application
beat), hands (extra/warped fingers), and audio (voice + room tone only) — plus a
clear clean/needs-fix verdict.

## Process evidence
- GPT-image-2 and Seedance prompts were each presented and approved before firing.
- The Seedance prompt was GPT-5.5-vetted before the render gate.
- Stack used: GPT-image-2 + Seedance 2.0 only.
