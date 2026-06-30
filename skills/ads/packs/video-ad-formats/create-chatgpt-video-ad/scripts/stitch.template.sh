#!/usr/bin/env bash
# stitch.sh — overlay the deterministic SFX cue list onto the silent master video.
# Reads:  clips/master-chat.mp4 + clips/master-chat.sfx.json + assets/sfx/*.wav
# Writes: edits/master-final.mp4

set -euo pipefail
cd "$(dirname "$0")/.."   # project dir

VIDEO=clips/master-chat.mp4
CUES=clips/master-chat.sfx.json
# Walk up to find skills/molecules/create-chatgpt-video-ad/assets/sfx
SFX_DIR=""
DIR="$(pwd)"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  CAND="$DIR/skills/molecules/create-chatgpt-video-ad/assets/sfx"
  if [ -d "$CAND" ]; then SFX_DIR="$CAND"; break; fi
  PARENT="$(dirname "$DIR")"
  [ "$PARENT" = "$DIR" ] && break
  DIR="$PARENT"
done
[ -z "$SFX_DIR" ] && [ -d assets/sfx ] && SFX_DIR=assets/sfx
OUT=edits/master-final.mp4
mkdir -p edits

if [ ! -f "$VIDEO" ]; then echo "missing $VIDEO"; exit 1; fi
if [ ! -f "$CUES" ]; then echo "missing $CUES"; exit 1; fi
if [ ! -d "$SFX_DIR" ]; then echo "missing SFX dir $SFX_DIR"; exit 1; fi

echo "Video: $VIDEO"
echo "Cues:  $CUES"
echo "SFX:   $SFX_DIR"
echo "Out:   $OUT"

python3 - "$VIDEO" "$CUES" "$SFX_DIR" "$OUT" <<'PYEOF'
import json, os, sys, subprocess

video, cues_path, sfx_dir, out_path = sys.argv[1:5]
cues = json.load(open(cues_path))['cues']
n = len(cues)
if n == 0:
    # No SFX to overlay; just copy the silent video out.
    subprocess.run(['ffmpeg', '-y', '-i', video, '-c', 'copy', out_path], check=True)
    sys.exit(0)

# Probe video duration so amix has a guaranteed length.
dur = float(subprocess.check_output(
    ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
     '-of', 'default=nw=1:nk=1', video]).strip())

cmd = ['ffmpeg', '-y', '-i', video]
filters = []
labels = []
for i, c in enumerate(cues):
    p = os.path.join(sfx_dir, c['sfx'] + '.wav')
    if not os.path.exists(p):
        sys.exit(f"missing SFX file: {p}")
    cmd += ['-i', p]
    delay_ms = int(round(c['t'] * 1000))
    # adelay uses '|' between per-channel delays (mono = single value also ok)
    filters.append(f"[{i+1}:a]adelay={delay_ms}|{delay_ms},apad=pad_dur={dur}[s{i}]")
    labels.append(f"[s{i}]")

mix = ''.join(labels) + f"amix=inputs={n}:duration=longest:dropout_transition=0:normalize=0[mix]"
filters.append(mix)
# Final loudness pass: bump and limit
filters.append("[mix]volume=2.5,alimiter=limit=0.95[aout]")

filter_complex = ';'.join(filters)
cmd += [
    '-filter_complex', filter_complex,
    '-map', '0:v', '-map', '[aout]',
    '-t', f"{dur}",
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
    out_path,
]
print(f"running ffmpeg with {len(cues)} SFX inputs, {len(filters)} filters")
subprocess.run(cmd, check=True)
PYEOF

echo "✓ $OUT"
