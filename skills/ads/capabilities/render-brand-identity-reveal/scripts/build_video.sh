#!/usr/bin/env bash
# Free assembly step: sequence the composited poster frames + a music bed into the master.
# Inputs: a concat list (frames + per-beat durations) and a music file. No paid calls.
#
#   ./build_video.sh <concat.txt> <music.mp3> <out.mp4> <total_seconds> [music_start]
#
# concat.txt is an ffmpeg concat-demuxer list of the composited frames (frames_v2/frame_NN.png)
# with `duration <s>` lines (variable, non-uniform rhythm); repeat the last frame line once so
# its duration is honored. See config.example.json -> beats[].seconds for the pacing.
set -euo pipefail
CONCAT="${1:?concat list}"; MUSIC="${2:?music}"; OUT="${3:?out.mp4}"
DUR="${4:?total seconds}"; MSTART="${5:-1.0}"
FADE=$(python3 -c "print(max(0, ${DUR} - 0.35))")

ffmpeg -y -hide_banner -loglevel error \
  -f concat -safe 0 -i "$CONCAT" \
  -ss "$MSTART" -i "$MUSIC" \
  -filter_complex "[0:v]fps=30,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,format=yuv420p[v];\
[1:a]atrim=0:${DUR},asetpts=PTS-STARTPTS,afade=t=out:st=${FADE}:d=0.35,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map "[v]" -map "[a]" -t "$DUR" \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart \
  "$OUT"
echo "wrote $OUT (${DUR}s)"
