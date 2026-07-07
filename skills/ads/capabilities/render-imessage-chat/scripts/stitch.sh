#!/usr/bin/env bash
# stitch.sh — assemble the final iMessage chat ad:
#   chat clip ─(300ms crossfade)→ end card,  with a deterministic iMessage SFX
#   layer (send/receive pops from master-chat.sfx.json) + an OPTIONAL ducked
#   music bed, then an OPTIONAL 1:1 variant. FREE assembly (ffmpeg only).
#
# The music bed is optional (pass --music); with no bed you still get the SFX.
# The send/receive SFX ship with this capability (assets/sfx). Generate a bed
# via the create-music-elevenlabs capability (paid, gated) and pass it in.
#
# Usage:
#   stitch.sh --chat <master-chat.mp4> --end <scene-end-endcard.mp4> \
#             --sfx <master-chat.sfx.json> --out <master-final.mp4> \
#             [--music <music-bed.mp3>] [--sfx-dir <dir>] [--also-1x1]
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SFX_DIR="$HERE/../assets/sfx"
MUSIC=""
ALSO_1X1=0
CHAT="" END="" SFX_JSON="" OUT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --chat) CHAT="$2"; shift 2;;
    --end) END="$2"; shift 2;;
    --sfx) SFX_JSON="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;
    --music) MUSIC="$2"; shift 2;;
    --sfx-dir) SFX_DIR="$2"; shift 2;;
    --also-1x1) ALSO_1X1=1; shift;;
    *) echo "unknown arg: $1" >&2; exit 1;;
  esac
done

for v in CHAT END SFX_JSON OUT; do
  [ -n "${!v}" ] || { echo "missing --${v,,}" >&2; exit 1; }
done
for f in "$CHAT" "$END" "$SFX_JSON"; do
  [ -f "$f" ] || { echo "MISSING: $f" >&2; exit 1; }
done

# 1) Crossfade chat → end card (300ms).
CHAT_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CHAT")
END_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$END")
XFADE=0.30
TOTAL=$(python3 -c "print($CHAT_DUR + $END_DUR - $XFADE)")
XSTART=$(python3 -c "print($CHAT_DUR - $XFADE)")
TMP_VIDEO=$(mktemp -t imsg-stitch).mp4
ffmpeg -y -i "$CHAT" -i "$END" \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=${XFADE}:offset=${XSTART}[v]" \
  -map "[v]" -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$TMP_VIDEO" >/dev/null 2>&1
echo "  video stitched, ${TOTAL}s"

# 2) Build the audio mix (deterministic SFX cues [+ optional ducked music bed]).
TMP_AUDIO=$(mktemp -t imsg-audio).m4a
MUSIC_ARG="${MUSIC:-NONE}"
python3 - "$SFX_JSON" "$SFX_DIR" "$MUSIC_ARG" "$TOTAL" "$TMP_AUDIO" <<'PY'
import json, sys, subprocess
sfx_json, sfx_dir, music, total, out = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), sys.argv[5]
cues = json.load(open(sfx_json))
has_music = music != "NONE"
# Base: a silent stereo bed of the full length so amix always has an anchor.
inputs = ["-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo"]
filter_parts = []
mix_labels = ["[0:a]"]
idx = 1
if has_music:
    inputs += ["-i", music]
    # Music: loop to length, drop sub-60Hz rumble, sit at -10dB, 1.5s fade-out so
    # the brand CTA lands in (relative) quiet.
    filter_parts.append(
        f"[{idx}:a]aloop=loop=-1:size=2147483647,atrim=duration={total},"
        f"highpass=f=60,volume=0.30,afade=t=out:st={max(0,total-1.5)}:d=1.5[mus]")
    mix_labels.append("[mus]")
    idx += 1
for c in cues:
    sfx_file = f"{sfx_dir}/imessage-{c['name']}.mp3"
    inputs += ["-i", sfx_file]
    delay = int(c['t'] * 1000)
    vol = 0.55 if c.get('soft') else 0.95
    filter_parts.append(f"[{idx}:a]adelay={delay}|{delay},volume={vol}[s{idx}]")
    mix_labels.append(f"[s{idx}]")
    idx += 1
n = len(mix_labels)
# normalize=0 so amix doesn't divide each input by N (preserves SFX peaks).
filter_parts.append(
    "".join(mix_labels) +
    f"amix=inputs={n}:duration=first:dropout_transition=0:normalize=0,volume=2.5,alimiter=limit=0.95[aout]")
fc = ";".join(filter_parts)
cmd = ["ffmpeg", "-y"] + inputs + ["-filter_complex", fc, "-map", "[aout]", "-c:a", "aac", "-b:a", "192k", out]
subprocess.run(cmd, check=True, stderr=subprocess.DEVNULL)
print(f"  audio: {'1 music bed + ' if has_music else ''}{len(cues)} sfx cues")
PY

# 3) Mux video + audio → 9:16 master.
ffmpeg -y -i "$TMP_VIDEO" -i "$TMP_AUDIO" -map 0:v -map 1:a -c:v copy -c:a aac -shortest -movflags +faststart "$OUT" >/dev/null 2>&1
rm -f "$TMP_VIDEO" "$TMP_AUDIO"
echo "  9:16 master → $OUT"

# 4) Optional 1:1 IG variant — center-crop 1080×1920 → 1080×1080.
if [ "$ALSO_1X1" = "1" ]; then
  OUT_1X1="${OUT%.mp4}-1x1.mp4"
  ffmpeg -y -i "$OUT" -vf "crop=1080:1080:0:420" \
    -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT_1X1" >/dev/null 2>&1
  echo "  1:1 IG      → $OUT_1X1"
fi
