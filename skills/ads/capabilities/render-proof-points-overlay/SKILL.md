---
name: render-proof-points-overlay
description: Build the deterministic PIL pill overlays for a 'perfect-score + proof-points' UGC video ad (white 10/10 score header with a medal + orange sub with a finger-down + 3-4 green-check proof pills) and composite them onto a base clip in a diagonal L->R->L->R cascade, then mux the music bed into master-final.mp4. Config-driven (config.json), 1080x1920 9:16, FREE and deterministic (no paid calls, text stays pixel-crisp). Use for the overlay-proof-points format; the base clip + music come from separate paid capabilities.
status: active
---

# render-proof-points-overlay

Build the deterministic PIL/FFmpeg overlays for the "Instagram comparison-tool reviewer" UGC ad — a white "we got a perfect 10/10 score" headline pill (trailing medal), an orange "but here's also why you'll love us" sub pill (trailing finger-down, width-matched to the header), and 3-4 green-check proof pills — then composite them onto a base clip in the format's signature diagonal cascade and mux the music into the master. FREE and deterministic: the pills are PIL-rendered so the score, checks, and wordmark stay pixel-crisp (a video model would smear type). The base clip (create-image-fal keyframe -> create-video-fal i2v) and the music bed (create-music-elevenlabs) come from separate paid capabilities; this one only does the free rendering.

## Run
fetch_icons.py --run-dir <run> ; build_overlays.py --config config.json --out-dir <run>/generated/overlays ; compose_master.py --config config.json --run-dir <run> — reads <run>/generated/clip-handheld.mp4 + generated/music-bed.m4a, writes <run>/master-final.mp4. 1080x1920, deterministic, $0. (Add --no-music to compose for a silent design preview.)

## Scripts
- `fetch_icons.py` — downloads the three Twemoji PNGs (medal 1f3c5, finger-down 1f447, check 2705) to `<run>/assets/icons`. PIL cannot render Apple Color Emoji, so pills paste Twemoji PNGs. Free, local.
- `build_overlays.py` — PIL: renders the white score header (trailing medal), the orange subhead (trailing finger-down, width-matched to the header), and N green-check proof pills auto-sized to their copy. Bold weight and icon-centered-on-pill-middle are load-bearing.
- `compose_master.py` — FFmpeg: scale/crop the base clip to 1080x1920@30, composite the always-on headers, cascade the proof pills (each `enable='gte(t,T)'` on its own alternating LEFT/RIGHT row), mux the music, apply the anti-AI grain pass, re-encode crf23/maxrate12M -> master-final.mp4.

## Contract
- Deterministic + FREE (PIL + FFmpeg); no paid calls, no AI-rendered text — the score, checks, and wordmark are composited, never generated.
- Config-driven off one `config.json` (`overlays`, `layout`, `duration_sec`, optional `music`/`post_production`); the template recipe supplies the config from `recipe.config`.
- Always re-run `build_overlays.py` before `compose_master.py` — the compositor reads pre-rendered PNGs and silently reuses stale ones on a copy change.
- Headers stay on 0-duration and must not cover the bottle face; proof pills cascade one-per-beat down the diagonal (NOT four-corners) — the cascade is the format's signature.
- Requires `Pillow` + `ffmpeg`. No API keys.
