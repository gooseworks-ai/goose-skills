# ugc-fixloop smoke test

## Purpose
Confirm the fix-loop toolkit fetches and both scripts are runnable on a fresh machine.

## Steps

1. **Fetch the capability.** From a one-shot UGC recipe's fix-loop step, run:
   ```
   gooseworks fetch ugc-fixloop
   ```
   Expect the scripts under `/tmp/gooseworks-scripts/ugc-fixloop/scripts/`.

2. **stitch_replacement.py present + arg-parses.**
   ```
   python3 /tmp/gooseworks-scripts/ugc-fixloop/scripts/stitch_replacement.py --help
   ```
   Expect the usage block listing `--master`, `--replacement`, `--output`, `--window-start`, `--window-end`, `--replace-beat`, `--scene-threshold`, `--fit`, `--dry-run`. Requires `ffmpeg` + `ffprobe` on PATH (no API key).

3. **stitch dry-run** (with any two short mp4s):
   ```
   python3 /tmp/gooseworks-scripts/ugc-fixloop/scripts/stitch_replacement.py \
     --master M.mp4 --replacement R.mp4 --output O.mp4 --replace-beat 1 --dry-run
   ```
   Expect a printed ffmpeg command and exit 0; no file written.

4. **vet_seedance_prompt.py present.**
   ```
   python3 /tmp/gooseworks-scripts/ugc-fixloop/scripts/vet_seedance_prompt.py
   ```
   Without GooseWorks credentials (no `GW_MEDIA_PROXY_TOKEN` and no `~/.gooseworks/credentials.json`), expect exit code 3 and no output: the recipe then falls back to an inline self-review. With credentials, expect the review printed to stdout.

## Pass criteria
- Both scripts resolve under `/tmp/gooseworks-scripts/ugc-fixloop/scripts/` after fetch.
- `stitch_replacement.py --help` and `--dry-run` succeed with no network/API dependency.
- `vet_seedance_prompt.py` either produces a review (key present) or exits FATAL cleanly (key/env absent) — it never blocks the fix loop.
