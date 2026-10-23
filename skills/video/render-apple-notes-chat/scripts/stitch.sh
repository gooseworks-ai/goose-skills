#!/usr/bin/env bash
# stitch.sh — crossfade the typed note into the end card and lay the music bed
# under both (faded in and out, normalised). FREE ffmpeg.
#
# usage: bash stitch.sh --notes notes.mp4 --end endcard.mp4 --out master.mp4
#                       [--music bed.mp3] [--xfade 0.3] [--lufs -14]
# Without --music the master is silent (Notes has no native sound).
set -euo pipefail

NOTES="" END="" OUT="" MUSIC="" XFADE="0.3" LUFS="-14"
while [ $# -gt 0 ]; do
  case "$1" in
    --notes) NOTES="$2"; shift 2 ;;
    --end) END="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --music) MUSIC="$2"; shift 2 ;;
    --xfade) XFADE="$2"; shift 2 ;;
    --lufs) LUFS="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done
[ -n "$NOTES" ] && [ -n "$END" ] && [ -n "$OUT" ] || {
  echo "usage: bash stitch.sh --notes notes.mp4 --end endcard.mp4 --out master.mp4 [--music bed.mp3]" >&2; exit 2; }
for f in "$NOTES" "$END" ${MUSIC:+"$MUSIC"}; do [ -s "$f" ] || { echo "missing or empty: $f" >&2; exit 1; }; done

dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
ND=$(dur "$NOTES"); ED=$(dur "$END")
OFFSET=$(awk -v n="$ND" -v x="$XFADE" 'BEGIN{printf "%.3f", n - x}')
TOTAL=$(awk -v n="$ND" -v e="$ED" -v x="$XFADE" 'BEGIN{printf "%.3f", n + e - x}')
FADE_OUT_AT=$(awk -v t="$TOTAL" 'BEGIN{printf "%.3f", t - 1.2}')

VIDEO="[0:v]fps=30,format=yuv420p,setsar=1[a];[1:v]fps=30,format=yuv420p,setsar=1[b];[a][b]xfade=transition=fade:duration=${XFADE}:offset=${OFFSET}[v]"

if [ -n "$MUSIC" ]; then
  MD=$(dur "$MUSIC")
  if awk -v m="$MD" -v t="$TOTAL" 'BEGIN{exit !(m < t)}'; then
    echo "warning: music ($MD s) is shorter than the video ($TOTAL s); it will be looped" >&2
    MIN=(-stream_loop -1)
  else
    MIN=()
  fi
  ffmpeg -v error -y -i "$NOTES" -i "$END" ${MIN[@]+"${MIN[@]}"} -i "$MUSIC" -filter_complex \
    "${VIDEO};[2:a]atrim=0:${TOTAL},asetpts=N/SR/TB,afade=t=in:d=0.4,afade=t=out:st=${FADE_OUT_AT}:d=1.2,loudnorm=I=${LUFS}:TP=-1.5:LRA=11[m]" \
    -map "[v]" -map "[m]" -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ar 48000 -t "$TOTAL" -movflags +faststart "$OUT"
else
  ffmpeg -v error -y -i "$NOTES" -i "$END" -filter_complex "$VIDEO" -map "[v]" \
    -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -t "$TOTAL" -movflags +faststart "$OUT"
fi
echo "{\"out\": \"$OUT\", \"seconds\": $TOTAL}"
