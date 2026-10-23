#!/usr/bin/env bash
# Final two-pass composite — wrapper around composite_final.py.
# Usage: composite_final.sh <edit_plan.json> <vo.mp3> <subtitles.ass> <music.wav> <out.mp4> [target_duration]
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
exec python3 "$DIR/composite_final.py" "$@"
