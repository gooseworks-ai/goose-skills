---
name: mix-master
description: Canonical short-form-ad audio mix in one FFmpeg pass. VO loudnorm + 3.0× per-clip + 2.0× mix, music 0.13 base + apad+afade, sidechain compress 20:1 @ 0.01, climax line +20%, optional video-to-music duration sync. Replaces the reactive multi-round tuning that cost v03 6+ passes.
---

# mix-master

## Purpose

The v03 Ironman LEARNINGS describe 6+ tuning rounds because no default mix protocol existed: round 1 music too loud, round 2 VO too quiet, round 3 Whisper mis-transcribed, round 4 sidechain ratio finally right, round 5 music ended too early, round 6 climax sat at the same loudness as the rest.

This atom encodes the protocol that landed and ships it as the default. Operators tune by flag; they don't redesign the chain.

## Inputs

- `--video <path>` — video file with no audio (or whose audio gets dropped) (required)
- `--vo <path,path,...>` — comma-separated list of per-scene VO mp3s in scene order (required)
- `--vo-starts <ms,ms,...>` — start time in milliseconds for each VO clip on the timeline (required, same length as `--vo`)
- `--music <path>` — music bed file (required)
- `--sfx <path,path,...>` — optional comma-separated SFX list
- `--sfx-starts <ms,ms,...>` — optional SFX start times
- `--output <path>` — output mp4 (required)
- `--total-duration <s>` — target total duration in seconds (required — video AND music are sync-fit to this)
- `--vo-boost-line <N>` — 1-indexed VO clip that is the climax; gets +20% additional volume (default unset)
- `--vo-volume <float>` — per-clip VO volume multiplier (default `3.0`)
- `--vo-mix-volume <float>` — extra mix-bus volume on VO (default `2.0`)
- `--music-volume <float>` — base music volume (default `0.13`)
- `--music-swell-volume <float>` — peak music volume during apad/swell (default `0.21`)
- `--sidechain-ratio <float>` — sidechain ratio, capped at 20 by FFmpeg (default `20`)
- `--sidechain-threshold <float>` — sidechain threshold (default `0.01`)
- `--target-i <lufs>` — VO loudnorm integrated target (default `-16`)
- `--target-tp <dbtp>` — VO loudnorm true-peak (default `-1.5`)
- `--target-lra <lu>` — VO loudnorm LRA (default `11`)

## Workflow

1. Validate inputs — `--vo` and `--vo-starts` must be same length; `--sfx` and `--sfx-starts` must be same length; ffmpeg + ffprobe must be on PATH.
2. Probe music duration (`ffprobe`). If music shorter than `--total-duration`, append `apad=pad_dur=2.0` then trim back to target. If music longer, trim with `afade=out` over last 1.5s.
3. Build a `filter_complex_script` file (long chains exceed shell arg limits):
   - Per-VO: `[N:a]loudnorm=I=...:TP=...:LRA=...,adelay=<start>|<start>,volume=<vo_volume>[voN];`
   - Climax VO (if `--vo-boost-line N`): volume becomes `vo_volume * 1.2`.
   - Mix all VO: `amix=inputs=K:duration=longest,volume=<vo_mix_volume>[vo_pre];`
   - Split VO for sidechain key: `[vo_pre]asplit=2[vo_final][vo_sc];`
   - Music base: `apad=pad_dur=2.0,atrim=0:<TOTAL>,afade=t=out:st=<TOTAL-1.5>:d=1.5,volume=<music_volume>[music_base];`
   - Sidechain: `[music_base][vo_sc]sidechaincompress=threshold=<thresh>:ratio=<ratio>:attack=20:release=600[music_ducked];`
   - SFX (optional): per-SFX `adelay` + `volume` then mix into `[sfx_bus]`.
   - Final: `amix=inputs=<2 or 3>:duration=longest[a_out]`.
4. Run a single ffmpeg invocation that consumes video, all VO, music, all SFX, applies the filter chain, and outputs the mixed mp4 (video re-encoded only if duration trim needed; otherwise `-c:v copy`).
5. Run a verification probe: ffprobe loudness summary on `[a_out]`, write `manifest.json` and `verification.md`.

## Output

- `<output>` — mixed mp4 with VO + music + SFX.
- `manifest.json` — chain parameters, vo timing, climax line, integrated LUFS after.
- `verification.md` — pass/fail report (integrated LUFS within ±0.5 of expected target, no clipping).

## Quality Checks

- Output integrated LUFS within ±0.5 of `<target-i>` (post-protocol; should be approximately -14 social-ready after the boosts).
- True-peak strictly below `<target-tp>` (no clipping).
- Output duration equals `<total-duration>` ± 100ms.
- Music tail has `afade=out` — last 100ms RMS < -30 dB.
- If `--vo-boost-line` was set, the corresponding clip's `volume=` value is `vo_volume * 1.2`.

## Failure Modes

- **Sidechain ratio > 20** — FFmpeg errors "Result too large." Cap at 20 (the protocol default).
- **VO and starts arrays mismatched** — fail fast at validation.
- **Music too short and `apad` insufficient** — emit a warning; video may end before music. Operator should re-source music or shorten `--total-duration`.
- **VO clip > 5KB but actually error JSON** — out of scope here; `create-clips` Phase 4 catches it.
- **Re-encoding video unnecessarily** — if total duration matches input video duration, use `-c:v copy` to preserve quality.

## Example

```bash
scripts/mix.sh \
  --video peloton/ads/video-04-new-job/edits/master-no-audio.mp4 \
  --vo "peloton/ads/video-04-new-job/audio/vo-scene-01.mp3,...,peloton/ads/video-04-new-job/audio/vo-scene-14.mp3" \
  --vo-starts "0,2000,3500,...,28000" \
  --music peloton/ads/video-04-new-job/audio/music-cue-01.wav \
  --output peloton/ads/video-04-new-job/edits/master-final.mp4 \
  --total-duration 30.0 \
  --vo-boost-line 14
```

Consumed by: `video-orchestrator/edit-video` Phase 3–5, `auto-fix-from-review-notes` dispatcher (when `vo-intelligibility` or `music-vo-balance` polish-notes items reference `mix-master`).
