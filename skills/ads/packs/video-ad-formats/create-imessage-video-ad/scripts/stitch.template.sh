#!/bin/bash
# Master stitch — continuous chat clip + end card with crossfade,
# layered SFX (deterministic cues), and a music bed.
set -euo pipefail

cd "$(dirname "$0")"
AD=$(cd .. && pwd)
CLIPS="$AD/clips"
SFX="$AD/audio/sfx"
MUSIC="$AD/audio/music-bed.mp3"
OUT="$AD/edits/master-final.mp4"

CHAT="$CLIPS/master-chat.mp4"
END="$CLIPS/scene-09-endcard.mp4"
SFX_JSON="$CLIPS/master-chat.sfx.json"

# 1) Crossfade chat → end card.
CHAT_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CHAT")
END_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$END")
XFADE=0.30
TOTAL=$(python3 -c "print($CHAT_DUR + $END_DUR - $XFADE)")
XSTART=$(python3 -c "print($CHAT_DUR - $XFADE)")
TMP_VIDEO=$(mktemp -t catchback-stitch).mp4
ffmpeg -y -i "$CHAT" -i "$END" \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=${XFADE}:offset=${XSTART}[v]" \
  -map "[v]" -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$TMP_VIDEO" >/dev/null 2>&1
echo "  video stitched, ${TOTAL}s"

# 2) Build the audio mix.
TMP_AUDIO=$(mktemp -t catchback-audio).m4a
python3 - "$SFX_JSON" "$SFX" "$MUSIC" "$TOTAL" "$TMP_AUDIO" <<'PY'
import json, sys, subprocess
sfx_json, sfx_dir, music, total, out = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), sys.argv[5]
cues = json.load(open(sfx_json))
inputs = ["-f","lavfi","-t",str(total),"-i","anullsrc=r=44100:cl=stereo"]
inputs += ["-i", music]
filter_parts = [
  # Music: trim/loop to total length, drop bass below 60Hz, sit at -14dB,
  # gentle fade-out at the very end so the brand sting can land.
  f"[1:a]aloop=loop=-1:size=2147483647,atrim=duration={total},highpass=f=60,volume=0.30,afade=t=out:st={total-1.5}:d=1.5[mus]"
]
for i, c in enumerate(cues):
    sfx_file = f"{sfx_dir}/imessage-{c['name']}.mp3"
    inputs += ["-i", sfx_file]
    delay = int(c['t'] * 1000)
    # Soft cues (typing-pop) get -3dB so they don't dominate.
    vol = 0.55 if c.get('soft') else 0.95
    filter_parts.append(f"[{i+2}:a]adelay={delay}|{delay},volume={vol}[s{i}]")
mix_inputs = "[0:a][mus]" + "".join(f"[s{i}]" for i in range(len(cues)))
filter_parts.append(f"{mix_inputs}amix=inputs={2+len(cues)}:duration=first:dropout_transition=0:normalize=0,volume=2.5,alimiter=limit=0.95[aout]")
fc = ";".join(filter_parts)
cmd = ["ffmpeg","-y"] + inputs + ["-filter_complex", fc, "-map","[aout]","-c:a","aac","-b:a","192k", out]
subprocess.run(cmd, check=True, stderr=subprocess.DEVNULL)
print(f"  audio: 1 music + {len(cues)} sfx cues")
PY

# 3) Mux.
ffmpeg -y -i "$TMP_VIDEO" -i "$TMP_AUDIO" -c:v copy -c:a aac -shortest -movflags +faststart "$OUT" >/dev/null 2>&1
rm -f "$TMP_VIDEO" "$TMP_AUDIO"

ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 "$OUT"
echo
echo "Master → $OUT"
