#!/usr/bin/env bash
# stitch.sh — assemble the final ChatGPT chat ad:
#   chat clip ─(300ms crossfade)→ end card, with a deterministic SUBLIMINAL
#   ChatGPT SFX layer (key-tap / send-tap / stream-tick / response-done from
#   master-chat.sfx.json) + an OPTIONAL ducked music bed, then an OPTIONAL 1:1
#   variant. FREE assembly (ffmpeg only). Sibling of render-imessage-chat/stitch.sh.
#
# The chat records at the ChatGPT-native ~9:19.5 (default 750×1624). The generic
# end card renders at 1080×1920 (9:16). To crossfade cleanly WITHOUT ever
# stretching the chat (hard rule), the end card is scaled-to-fit the chat's
# dimensions and PADDED (its own bg color) — the card content is centered so the
# pad is seamless. Pass --pad-color <#hex> = the end_card.bg (default #ffffff,
# ChatGPT light mode).
#
# ChatGPT SFX are subliminal by design (ChatGPT has no native chime). Per-name
# levels: key-tap -28dB, send-tap -20dB, stream-tick -32dB, response-done -22dB.
# NOTE: the bundled wavs are freshly SYNTHESIZED stand-ins — the originals were
# lost from Git LFS (404). Swap in real wavs in assets/sfx/ for tuned SFX.
#
# Usage:
#   stitch.sh --chat <master-chat.mp4> --end <scene-end-endcard.mp4> \
#             --sfx <master-chat.sfx.json> --out <master-final.mp4> \
#             [--music <music-bed.mp3>] [--sfx-dir <dir>] \
#             [--pad-color <#hex>] [--also-1x1]
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SFX_DIR="$HERE/../assets/sfx"
MUSIC=""
PAD_COLOR="#ffffff"
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
    --pad-color) PAD_COLOR="$2"; shift 2;;
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

# The 4 SFX wavs are subliminal stand-ins. If a catalog fetch didn't materialize
# the binary assets, synthesize them here so a missing wav never breaks the render
# (the cue loop adds each as an ffmpeg input unconditionally). Swap real wavs anytime.
mkdir -p "$SFX_DIR"
_synth() { [ -f "$SFX_DIR/$1.wav" ] || ffmpeg -y -f lavfi -i "$2" -ar 44100 -ac 2 "$SFX_DIR/$1.wav" >/dev/null 2>&1; }
_synth key-tap       "sine=frequency=1800:duration=0.05"
_synth send-tap      "sine=frequency=900:duration=0.08"
_synth stream-tick   "sine=frequency=2400:duration=0.03"
_synth response-done "sine=frequency=600:duration=0.12"

# Chat is the master canvas — never scale/stretch it. Normalize the end card to
# the chat's exact dimensions (scale-to-fit + pad with the card's bg color).
CW=$(ffprobe -v error -select_streams v:0 -show_entries stream=width  -of csv=p=0 "$CHAT")
CH=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$CHAT")

# 1) Crossfade chat → (normalized) end card (300ms).
CHAT_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CHAT")
END_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$END")
XFADE=0.30
TOTAL=$(python3 -c "print($CHAT_DUR + $END_DUR - $XFADE)")
XSTART=$(python3 -c "print($CHAT_DUR - $XFADE)")
TMP_VIDEO=$(mktemp -t gpt-stitch).mp4
ffmpeg -y -i "$CHAT" -i "$END" \
  -filter_complex "[1:v]scale=${CW}:${CH}:force_original_aspect_ratio=decrease,pad=${CW}:${CH}:-1:-1:color=${PAD_COLOR},setsar=1[end];[0:v][end]xfade=transition=fade:duration=${XFADE}:offset=${XSTART}[v]" \
  -map "[v]" -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$TMP_VIDEO" >/dev/null 2>&1
echo "  video stitched, ${TOTAL}s (${CW}x${CH})"

# 2) Build the audio mix (subliminal ChatGPT SFX cues [+ optional ducked bed]).
TMP_AUDIO=$(mktemp -t gpt-audio).m4a
MUSIC_ARG="${MUSIC:-NONE}"
python3 - "$SFX_JSON" "$SFX_DIR" "$MUSIC_ARG" "$TOTAL" "$TMP_AUDIO" <<'PY'
import json, sys, subprocess
sfx_json, sfx_dir, music, total, out = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), sys.argv[5]
doc = json.load(open(sfx_json))
cues = doc["cues"] if isinstance(doc, dict) else doc
has_music = music != "NONE"

# Subliminal per-name gains (linear ≈ dBFS): ChatGPT has no native chime so the
# SFX are felt, not heard.
GAIN = {"key-tap": 0.040, "send-tap": 0.100, "stream-tick": 0.025, "response-done": 0.079}

# Base: a silent stereo bed of full length so amix always has an anchor.
inputs = ["-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo"]
filter_parts = []
mix_labels = ["[0:a]"]
idx = 1
if has_music:
    inputs += ["-i", music]
    # Ducked bed: loop to length, drop rumble, sit low so the streamed answer
    # reads, 1.5s fade-out so the end-card CTA lands in (relative) quiet.
    filter_parts.append(
        f"[{idx}:a]aloop=loop=-1:size=2147483647,atrim=duration={total},"
        f"highpass=f=60,volume=0.22,afade=t=out:st={max(0,total-1.5)}:d=1.5[mus]")
    mix_labels.append("[mus]")
    idx += 1
for c in cues:
    name = c["name"]
    sfx_file = f"{sfx_dir}/{name}.wav"
    inputs += ["-i", sfx_file]
    delay = int(round(c["t"] * 1000))
    vol = GAIN.get(name, 0.05)
    filter_parts.append(f"[{idx}:a]adelay={delay}|{delay},volume={vol}[s{idx}]")
    mix_labels.append(f"[s{idx}]")
    idx += 1
n = len(mix_labels)
# normalize=0 so amix doesn't divide each input by N. No global volume boost
# (unlike iMessage) — these cues are meant to stay subliminal; just limit peaks.
filter_parts.append(
    "".join(mix_labels) +
    f"amix=inputs={n}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[aout]")
fc = ";".join(filter_parts)
cmd = ["ffmpeg", "-y"] + inputs + ["-filter_complex", fc, "-map", "[aout]", "-c:a", "aac", "-b:a", "192k", out]
subprocess.run(cmd, check=True, stderr=subprocess.DEVNULL)
print(f"  audio: {'1 music bed + ' if has_music else ''}{len(cues)} subliminal sfx cues")
PY

# 3) Mux video + audio → master.
ffmpeg -y -i "$TMP_VIDEO" -i "$TMP_AUDIO" -map 0:v -map 1:a -c:v copy -c:a aac -shortest -movflags +faststart "$OUT" >/dev/null 2>&1
rm -f "$TMP_VIDEO" "$TMP_AUDIO"
echo "  master → $OUT"

# 4) Optional 1:1 variant — center-CROP a square from the chat zone (never scale
#    to a different ratio; cropping is the only legitimate shape change).
if [ "$ALSO_1X1" = "1" ]; then
  OUT_1X1="${OUT%.mp4}-1x1.mp4"
  CY=$(python3 -c "print(max(0, int(($CH - $CW) / 2)))")
  ffmpeg -y -i "$OUT" -vf "crop=${CW}:${CW}:0:${CY}" \
    -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT_1X1" >/dev/null 2>&1
  echo "  1:1    → $OUT_1X1"
fi
