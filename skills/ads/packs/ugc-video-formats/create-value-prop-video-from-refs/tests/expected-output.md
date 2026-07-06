# Expected Output

## Artifacts
- `finals/master-*-with-music.mp4` — 1080×1920, ~17s (10-20 range), **h264** + aac
  music. Hook + 3-5 prop beats (each ~2.0-2.5s) + a brand end card (~2.0s).
- `finals/master-*-clean.mp4` — the silent cut (re-usable for a fresh music mux).
- `working/beats/*.html` + per-beat clips — the rendered hyperframe beats.
- `working/audio/music-raw.mp3` — the instrumental bed (if not silent).
- A poster still (any prop beat with the claim + hero SKU visible).

## Visual shape (per prop beat)
- One short noun-phrase claim (≤4 words, navy `--ink`) with an eyebrow + a per-flavor
  4px accent rule, revealed via a deterministic `renderAt(t)` stagger.
- A per-SKU product visual under the claim — `row` (all SKUs in a strip) or `hero` (one
  SKU large + faded supporters). The hero SKU rotates beat to beat.
- Hard cut to the next claim. Uniform pacing, no acceleration curve.

## Open + close + audio
- Hook sticker beat (~3.0s): brand line + eyebrow over a hero sachet.
- Brand end card (~2.0s): real wordmark + tagline + CTA, no chromatic aberration.
- A calm instrumental bed at −14 dB, fade in/out. No VO, no captions, legible sound-off.

## Non-goals
- No talking head, no dialogue, no VO, no captions.
- No invented claims / customers / results — real, operator-approved copy only.
- No flat variety-pack image reused as every canvas — per-SKU swap, rotating hero.
- No flavor-color headline (low contrast) — color lives on the accent rule.
- No CSS keyframes / setTimeout — animation is a pure function of `t`.
