# Expected Output

## Artifacts
```
<project>/
  assets/refs/        @Image1 composed sidewalk still (creator already stopped to
                      talk); (+ @Image2 product cutout only for a product build)
  working/            seedance_prompt.txt; gpt55 review; review frames + transcript;
                      any silent fix clip(s)
  finals/
    <name>.mp4        master Seedance render (15s default)
    <name>-v2.mp4     after any surgical window fix (delivered)
```

## The delivered video
- Vertical 9:16, requested duration (default 15s) ±0.2s, requested resolution.
- **One single continuous take, exactly one person** — no cuts, no second person,
  no interviewer, no one else speaking; passersby blurred and distant.
- Creator **stopped/planted** (not walking, not tripod-locked) with real
  micro-motion; identity + wardrobe consistent start to finish.
- Native lip-synced dialogue; transcript matches the scripted hot-take. Live
  sidewalk ambience only. **No burned captions, no music.**
- Background signage stays blank/illegible; no readable logos or brand text.

## Worked-example facts (`demo/`)
- Brand-free "cancel forgotten subscriptions" money hot-take, 15s / 720p, seed
  **285626872**, ~$4.50. Provenance in
  `demo/finals/street-testimonial-15s.mp4.meta.json`.
- Validated QC: genuine single-person stopped-to-talk energy, gestural,
  identity/wardrobe locked (grey tee, open olive overshirt, cord necklace,
  fade + beard), background pedestrians stayed blurred (no second speaker),
  signage illegible, lip-sync clean.
- **One known nit:** the native audio repeated "ninety" ("$90 a month, $90 just
  gone" instead of "…just gone") — a ~1s dysfluency. Canonical fix-loop: a
  surgical `stitch_replacement.py` window fix over that ~1s (silent SAME-ref
  replacement, `--no-generate-audio`, `--fit stretch`), or a seed re-roll.
  Everything else passed, so the window is fixed, not re-rolled.

## The review-loop report
A structured issue list with timestamps covering: **single-person integrity** (no
second person / interviewer / passerby-as-subject), stopped-vs-walking, tripod-vs-
handheld-drift, identity/wardrobe, illegible signage, lip-sync/transcript match,
and micro-motion cleanliness — plus a clear clean/needs-fix verdict.

## Process evidence
- GPT-image-2 and Seedance prompts were each presented and approved before firing.
- Stack used: GPT-image-2 + Seedance 2.0 only; no captions, no music.
