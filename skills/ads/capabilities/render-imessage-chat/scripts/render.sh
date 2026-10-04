#!/usr/bin/env bash
# One free, checked render. Keep all outputs beside the requested final.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
CONFIG="" OUT="" MUSIC=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --config) CONFIG="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;
    --music) MUSIC="$2"; shift 2;;
    *) echo "Unknown argument $1" >&2; exit 1;;
  esac
done
[ -n "$CONFIG" ] && [ -n "$OUT" ] || { echo 'Use --config config.json --out final.mp4' >&2; exit 1; }
WORK="$(dirname "$OUT")/work-$(basename "${OUT%.mp4}")"
mkdir -p "$WORK"
node "$HERE/record-chat.js" --config "$CONFIG" --out-dir "$WORK"
node "$HERE/render-end-card.js" --config "$CONFIG" --out-dir "$WORK"
ARGS=(--chat "$WORK/master-chat.mp4" --end "$WORK/scene-end-endcard.mp4" --sfx "$WORK/master-chat.sfx.json" --out "$OUT")
[ -z "$MUSIC" ] || ARGS+=(--music "$MUSIC")
bash "$HERE/stitch.sh" "${ARGS[@]}"
python3 "$HERE/check-render.py" "$OUT" "$WORK/master-chat.timeline.json" "$WORK/scene-end-endcard.mp4"
