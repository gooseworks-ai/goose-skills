#!/usr/bin/env bash
# Normalize a clip to 1080x1920, 25fps, target duration via setpts retime.
# Usage: normalize_clip.sh <in> <out> <target_duration_seconds>
set -euo pipefail

IN="$1"; OUT="$2"; DUR="$3"

INPUT_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$IN")
PTS_RATIO=$(echo "scale=4; $DUR / $INPUT_DUR" | bc)

ffmpeg -y -loglevel error -i "$IN" \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,setpts=${PTS_RATIO}*PTS,fps=25" \
  -t "$DUR" -an -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p "$OUT"

echo "Normalized $IN ($INPUT_DUR s) → $OUT ($DUR s, ratio=$PTS_RATIO)"
