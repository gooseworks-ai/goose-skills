---
name: ugc-fixloop
description: the UGC fix-loop toolkit — surgically re-render a bad window/beat of a single-take UGC master (stitch_replacement.py) and swap it onto the VIDEO track only, leaving the master's continuous native audio untouched. Fetch it into a one-shot UGC recipe's fix-loop so the script resolves on any machine. Pure local FFmpeg, no API keys, no network.
status: active
---

# ugc-fixloop

The UGC fix-loop toolkit. The one-shot UGC video recipes (`create-ugc-*-video-from-refs`)
render a single continuous Seedance 2.0 reference-to-video master with native lip-synced
audio. When one internal beat drifts, they run a **fix loop** — re-render just that beat as
a short silent clip and swap it onto the video track only, leaving the master's continuous
audio untouched. This capability ships the script that fix loop runs, so it exists on the
remote machine (fetched into `/tmp/gooseworks-scripts/ugc-fixloop/`).

> Prompt-vetting is done **inline by the agent** (it's an LLM) — there is no vet script here.
> Any re-render of a replacement clip goes through the same proxy path the recipe uses for
> the take (`create-video-fal` / fal-proxy), NEVER a direct `fal.run` call.

## Env / deps
- **`stitch_replacement.py`** — no API key, no network. Needs **`ffmpeg` + `ffprobe` on PATH** (all local FFmpeg).

## Run — stitch_replacement.py (surgical beat/window swap, deterministic)
Replaces one segment of the master on the VIDEO track only; the master's audio (VO + ambience)
plays straight through, so lip-sync on talking beats is never touched. Output is re-encoded
H.264 / yuv420p at the master's fps + resolution.

Required: `--master M.mp4 --replacement R.mp4 --output O.mp4`. Pick the window ONE of two ways:
```
# By beat (1-indexed segment between auto-detected scene cuts):
stitch_replacement.py --master M.mp4 --replacement R.mp4 --output O.mp4 --replace-beat 2

# By explicit window (seconds):
stitch_replacement.py --master M.mp4 --replacement R.mp4 --output O.mp4 \
    --window-start 4.21 --window-end 8.75 --fit stretch
```
All args:
- `--master` (required) — the single-take master mp4.
- `--replacement` (required) — the re-rendered silent replacement clip (generated via `create-video-fal`).
- `--output` (required) — output mp4 path.
- `--window-start` / `--window-end` (float seconds) — explicit hole to replace.
- `--replace-beat` (int, 1-indexed) — pick the segment between detected scene cuts.
- `--scene-threshold` (float, default `0.3`) — scene-cut sensitivity for `--replace-beat`.
- `--fit {stretch,trim,freeze}` (default `stretch`) — reconcile replacement length to the hole.
- `--dry-run` — print the ffmpeg command without running.

Warns if output duration drifts >0.15s from the master (audio-sync check).
