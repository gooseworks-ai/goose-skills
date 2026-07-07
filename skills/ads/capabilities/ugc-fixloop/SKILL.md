---
name: ugc-fixloop
description: the UGC fix-loop toolkit — surgically re-render a bad window/beat of a single-take UGC master (stitch_replacement.py, pure FFmpeg) and GPT cross-model review a Seedance prompt before render (vet_seedance_prompt.py, routed through the openai-proxy). Fetch it into a one-shot UGC recipe so both scripts resolve on any machine and the vet call bills the Ads agent.
status: active
---

# ugc-fixloop

The UGC fix-loop toolkit. The one-shot UGC video recipes (`create-ugc-*-video-from-refs`)
render a single continuous Seedance 2.0 reference-to-video master with native lip-synced
audio. This capability ships the two scripts those recipes run, so they exist on the remote
machine (fetched into `/tmp/gooseworks-scripts/ugc-fixloop/`).

> Any re-render of a replacement clip goes through the same proxy path the recipe uses for
> the take (`create-video-fal` / fal-proxy), NEVER a direct `fal.run` call.

## Env / deps
- **`stitch_replacement.py`** — no API key, no network. Needs **`ffmpeg` + `ffprobe` on PATH** (all local FFmpeg).
- **`vet_seedance_prompt.py`** — routes through the GooseWorks **openai-proxy** (`<api_base>/api/internal/openai-proxy/v1/chat/completions`), reading creds from `~/.gooseworks/credentials.json` — **no direct OpenAI call, no local key**; the call **bills the Ads agent**. Exits 3 if the proxy/creds are unavailable so the recipe can fall back to an inline self-review (the vet is advisory, not a gate).

## Run — vet_seedance_prompt.py (GPT cross-model prompt review)
A deliberately NON-Claude second opinion on the Seedance prompt before you spend the render
(Claude reviewing its own prompt is a weaker signal). Takes the prompt as an argument:
```
vet_seedance_prompt.py --prompt-file working/seedance-prompt.txt \
    [--brief "one-line intent"] [--refs "@Image1=avatar; @Image2=product; @Image3=env"] \
    [--words 28] [--out working/seedance-review.md]
```
Prints + saves the structured review (verdict, line edits, word budget, consistency risk).

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
