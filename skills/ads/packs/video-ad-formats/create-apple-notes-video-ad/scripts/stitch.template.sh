#!/bin/bash
# stitch.sh — combine typing video + end card with crossfade, layered
# per-keystroke SFX cues (kb-tick / kb-space / kb-return), and a music bed.
#
# Adapted from create-imessage-video-ad/scripts/stitch.template.sh.
#
# Usage:
#   bash edits/stitch.sh                  # → edits/master-final.mp4  (1180×2556)
#   bash edits/stitch.sh --export-9x16    # ALSO writes meta-upload/master-9x16-1080.mp4

set -euo pipefail
cd "$(dirname "$0")"
AD=$(cd .. && pwd)
CLIPS="$AD/clips"
SFX="$AD/audio/sfx"
MUSIC="$AD/audio/music-bed.mp3"
OUT="$AD/edits/master-final.mp4"

TYPING="$CLIPS/master-typing.mp4"
END="$CLIPS/end-card.mp4"
SFX_JSON="$CLIPS/master-typing.sfx.json"

# Flags. Any combination supported:
#   --no-sfx        — skip keyboard SFX layering (only music + silence)
#   --export-9x16   — also write meta-upload/master-9x16-1080.mp4
NO_SFX=0
EXPORT_9X16=0
for arg in "$@"; do
  case "$arg" in
    --no-sfx)      NO_SFX=1 ;;
    --export-9x16) EXPORT_9X16=1 ;;
  esac
done

mkdir -p "$AD/edits" "$AD/meta-upload"

# If --no-sfx, swap in an empty cue list so the audio mix is music-only.
EFFECTIVE_SFX_JSON="$SFX_JSON"
if [[ "$NO_SFX" == "1" ]]; then
  EFFECTIVE_SFX_JSON="$(mktemp -t apple-notes-empty-sfx).json"
  echo "[]" > "$EFFECTIVE_SFX_JSON"
fi

# ---------------------------------------------------------------------------
# 1) Crossfade typing → end card.
# ---------------------------------------------------------------------------
TYP_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TYPING")
END_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$END")
XFADE=0.30
TOTAL=$(python3 -c "print($TYP_DUR + $END_DUR - $XFADE)")
XSTART=$(python3 -c "print($TYP_DUR - $XFADE)")
TMP_VIDEO=$(mktemp -t apple-notes-stitch).mp4
ffmpeg -y -i "$TYPING" -i "$END" \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=${XFADE}:offset=${XSTART}[v]" \
  -map "[v]" -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$TMP_VIDEO" >/dev/null 2>&1
echo "  video stitched, ${TOTAL}s"

# ---------------------------------------------------------------------------
# 2) Build the audio mix.
#    - music bed: highpass 60Hz, vol 0.28, fade-out last 1.5s
#    - SFX cues: each line in the cue JSON gets adelay-positioned + mixed
#    - amix MUST pass normalize=0 or the audio sounds quiet (imessage learning #6)
# ---------------------------------------------------------------------------
TMP_AUDIO=$(mktemp -t apple-notes-audio).m4a
python3 - "$EFFECTIVE_SFX_JSON" "$SFX" "$MUSIC" "$TOTAL" "$TMP_AUDIO" <<'PY'
import json, sys, subprocess, os
sfx_json, sfx_dir, music, total, out = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), sys.argv[5]
cues = json.load(open(sfx_json))
inputs = ["-f","lavfi","-t",str(total),"-i","anullsrc=r=44100:cl=stereo"]
has_music = os.path.exists(music)
if has_music:
    inputs += ["-i", music]
filter_parts = []
if has_music:
    filter_parts.append(
      f"[1:a]aloop=loop=-1:size=2147483647,atrim=duration={total},"
      f"highpass=f=60,volume=0.28,afade=t=out:st={total-1.5}:d=1.5[mus]"
    )
base_input_count = 2 if has_music else 1
for i, c in enumerate(cues):
    sfx_file = f"{sfx_dir}/{c['name']}.mp3"
    if not os.path.exists(sfx_file):
        # Skip cues whose SFX asset is missing; print a single warning per
        # filename. Useful when running against a fresh ad with placeholder cues.
        if not getattr(_emit_warn := lambda n: None, "_seen", None):
            _emit_warn._seen = set()
        if c['name'] not in _emit_warn._seen:
            print(f"WARN missing sfx: {sfx_file}", file=sys.stderr)
            _emit_warn._seen.add(c['name'])
        continue
    inputs += ["-i", sfx_file]
    idx = base_input_count + len([p for p in filter_parts if p.startswith("[") and "[s" in p])
    delay = int(c['t'] * 1000)
    # Keyboard ticks are quick + dry; volume 0.85 is loud enough without masking VO.
    vol = 0.85 if c['name'] == 'kb-tick' else (0.95 if c['name'] == 'kb-space' else 1.05)
    filter_parts.append(f"[{idx}:a]adelay={delay}|{delay},volume={vol}[s{idx}]")
n_sfx = sum(1 for p in filter_parts if p.endswith("[s%d]" % (base_input_count + 0)) == False and p.startswith("[") and ":a]adelay" in p)
# Build final amix.
mix_inputs = "[0:a]" + ("[mus]" if has_music else "")
for p in filter_parts:
    if ":a]adelay" in p:
        # Extract the [sN] label from the end of the part.
        label = p[p.rfind("["):]
        mix_inputs += label
n_inputs = mix_inputs.count("[")
filter_parts.append(
  f"{mix_inputs}amix=inputs={n_inputs}:duration=first:dropout_transition=0:normalize=0,"
  f"volume=2.2,alimiter=limit=0.95[aout]"
)
fc = ";".join(filter_parts)
cmd = ["ffmpeg","-y"] + inputs + ["-filter_complex", fc, "-map","[aout]","-c:a","aac","-b:a","192k", out]
subprocess.run(cmd, check=True, stderr=subprocess.DEVNULL)
print(f"  audio: {'1 music' if has_music else 'no music'} + {len(cues)} sfx cues")
PY

# ---------------------------------------------------------------------------
# 3) Mux video + audio.
# ---------------------------------------------------------------------------
ffmpeg -y -i "$TMP_VIDEO" -i "$TMP_AUDIO" -c:v copy -c:a aac -shortest -movflags +faststart "$OUT" >/dev/null 2>&1
rm -f "$TMP_VIDEO" "$TMP_AUDIO"

ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 "$OUT"
echo
echo "Master → $OUT"

# ---------------------------------------------------------------------------
# 4) Optional 9:16 export for social delivery (1080×1920).
#    The recorder writes the master at 1180×2100 (already 9:16-ish), so this
#    is now a clean linear scale to 1080×1920 — no crop, full keyboard +
#    status bar + body all preserved.
# ---------------------------------------------------------------------------
if [[ "$EXPORT_9X16" == "1" ]]; then
  ffmpeg -y -i "$OUT" \
    -vf "scale=1080:1920:flags=lanczos,format=yuv420p" \
    -c:v libx264 -pix_fmt yuv420p -c:a copy -movflags +faststart \
    "$AD/meta-upload/master-9x16-1080.mp4" >/dev/null 2>&1
  echo "9:16  → $AD/meta-upload/master-9x16-1080.mp4"
fi

# Tidy any temp empty SFX cue file we created.
if [[ "$NO_SFX" == "1" && -f "$EFFECTIVE_SFX_JSON" ]]; then
  rm -f "$EFFECTIVE_SFX_JSON"
fi
