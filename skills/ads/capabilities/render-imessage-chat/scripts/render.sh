#!/usr/bin/env bash
# render.sh — one command from config.json to a checked iMessage ad.
#   render.sh --config <config.json> --out <final.mp4> [--music <bed.mp3>] [--also-1x1]
# Runs record-chat -> render-end-card -> stitch, then verifies the render and exits
# non-zero on any failure (no silent bad output). All FREE.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
CONFIG="" OUT="" EXTRA=()
while [ $# -gt 0 ]; do
  case "$1" in
    --config) CONFIG="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;
    --music) EXTRA+=(--music "$2"); shift 2;;
    --also-1x1) EXTRA+=(--also-1x1); shift;;
    *) echo "unknown arg $1" >&2; exit 1;;
  esac
done
[ -n "$CONFIG" ] && [ -n "$OUT" ] || { echo "usage: render.sh --config c.json --out final.mp4" >&2; exit 1; }
WORK="$(dirname "$OUT")/work-$(basename "${OUT%.mp4}")"
mkdir -p "$WORK"
# The capture is real-time; if the sync marker is missed or the capture stalled (exit 4),
# record again, up to 3 tries.
for try in 1 2 3; do
  set +e; node "$HERE/record-chat.js" --config "$CONFIG" --out-dir "$WORK"; rc=$?; set -e
  [ $rc -eq 0 ] && break
  [ $rc -eq 4 ] && [ $try -lt 3 ] && { echo "capture not usable (sync marker or stall); recording again ($((try+1))/3)"; continue; }
  exit $rc
done
node "$HERE/render-end-card.js" --config "$CONFIG" --out-dir "$WORK"
bash "$HERE/stitch.sh" --chat "$WORK/master-chat.mp4" --end "$WORK/scene-end-endcard.mp4" \
  --sfx "$WORK/master-chat.sfx.json" --out "$OUT" ${EXTRA[@]+"${EXTRA[@]}"}
python3 "$HERE/check-render.py" "$OUT" "$WORK/master-chat.sfx.json"
