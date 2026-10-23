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
- Headers stay on 0-duration and must not cover the product face; proof pills cascade one-per-beat down the diagonal (NOT four-corners) — the cascade is the format's signature.
- Requires `Pillow` + `ffmpeg`. No API keys.
- The overlay copy (`overlays.header.lines`, `overlays.subhead.lines`, `overlays.proof_points`) is per brand and must be the brand's own approved claims; `build_overlays.py` exits with a clear message if any of it is empty (the template recipe ships it empty, with `overlays._example_content` as the shape).

## Choices
This atom renders no people, setting or music. The template's creative choices (whose hand, the setting, the music style) are asked of the user by the recipe and go to the paid keyframe / i2v / music capabilities; this atom only composites the pills over whatever base clip and music bed it is given.

## Music coverage

Read the [music preparation instructions](references/music.md) for the composition options and listening checks.

The bed must cover the complete master, including its end card. Composition checks audio coverage before rendering and stops for missing, short or prematurely silent music. A silent preview requires the explicit no-music option.

Use a full-length approved bed first. For an approved instrumental that can repeat cleanly, the loop-music option trims silent edges and extends it locally with crossfades. It preserves the source and puts the final half-second fade at the master ending. Do not loop speech, lyrics or a musical ending that makes the join obvious. Do not regenerate paid music automatically.

Listen to every join and the final seconds before delivery. The automated check detects silence and insufficient duration; it does not judge musical phrasing, a gradual early fade or how the bed sounds under dialogue.

## Local layout checks

The renderer preserves the bold text font and falls back to an installed symbol font for missing glyphs such as ★. Trailing icons sit beyond the longest line of the pill. The composer reserves at least 120 px at the right edge for platform controls and stops if copy does not fit; wrap the text or reduce its font size before rendering.

Run the free regressions with `python -m unittest discover -s tests -p 'test_*.py' -v`.
