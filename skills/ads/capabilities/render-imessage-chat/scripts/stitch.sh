#!/usr/bin/env bash
# stitch.sh — assemble the final iMessage chat ad:
#   chat clip ─(300ms crossfade)→ end card,  with a deterministic iMessage SFX
#   layer (send/receive pops from master-chat.sfx.json) + an OPTIONAL ducked
#   music bed, then an OPTIONAL 1:1 variant. FREE assembly (ffmpeg only).
#
# The music bed is optional (pass --music); with no bed you still get the SFX.
# The send/receive SFX ship with this capability twice: as mp3s in assets/sfx
# (full checkouts) and as base64 text in scripts/sfx-embedded.json, because a
# catalog fetch ships text files only and drops assets/sfx (GOOSE-3767). Generate
# a bed via the create-music-elevenlabs capability (paid, gated) and pass it in.
#
# Usage:
#   stitch.sh --chat <master-chat.mp4> --end <scene-end-endcard.mp4> \
#             --sfx <master-chat.sfx.json> --out <master-final.mp4> \
#             [--music <music-bed.mp3>] [--sfx-dir <dir>] [--also-1x1]
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SFX_DIR=""   # --sfx-dir wins; else assets/sfx; else the embedded base64 copy
MUSIC=""
ALSO_1X1=0
SFX_LEAD=0.04   # seconds each sound leads its bubble; a hair early reads as "on it"
CHAT="" END="" SFX_JSON="" OUT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --chat) CHAT="$2"; shift 2;;
    --end) END="$2"; shift 2;;
    --sfx) SFX_JSON="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;
    --music) MUSIC="$2"; shift 2;;
    --sfx-dir) SFX_DIR="$2"; shift 2;;
    --sfx-lead) SFX_LEAD="$2"; shift 2;;
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

# One scratch dir for every temp file, removed on any exit. (mktemp -d with an
# explicit XXXXXX template works on both macOS and GNU/Linux.)
WORK=$(mktemp -d "${TMPDIR:-/tmp}/imsg-stitch.XXXXXX")
trap 'rm -rf "$WORK"' EXIT

# ffmpeg with its log kept back, and shown when it fails.
ff() {
  if ! ffmpeg "$@" >"$WORK/ffmpeg.log" 2>&1; then
    echo "ffmpeg failed:" >&2; tail -n 25 "$WORK/ffmpeg.log" >&2; exit 1
  fi
}

# 0) Resolve the send/receive SFX. A git-LFS pointer stub is not audio.
is_real_mp3() { [ -s "$1" ] && ! grep -q 'version https://git-lfs' "$1"; }
if [ -z "$SFX_DIR" ]; then
  BUNDLED="$HERE/../assets/sfx"
  EMBEDDED="$HERE/sfx-embedded.json"
  if is_real_mp3 "$BUNDLED/imessage-send.mp3" && is_real_mp3 "$BUNDLED/imessage-receive.mp3"; then
    SFX_DIR="$BUNDLED"
  elif [ -f "$EMBEDDED" ]; then
    SFX_DIR="$WORK/sfx"; mkdir -p "$SFX_DIR"
    python3 - "$EMBEDDED" "$SFX_DIR" <<'PY'
import base64, hashlib, json, sys
src, out = sys.argv[1], sys.argv[2]
def damaged(why):
    sys.exit(f"stitch.sh: {src} is damaged: {why}. "
             "Re-fetch render-imessage-chat (the file must be saved byte for byte).")
try:
    files = json.load(open(src))["files"]
    items = [(name, base64.b64decode(f["base64"]), f["sha256"]) for name, f in files.items()]
except (ValueError, KeyError, TypeError, AttributeError) as e:
    damaged(f"not the expected JSON ({type(e).__name__})")
for name, data, sha in items:
    if hashlib.sha256(data).hexdigest() != sha:
        damaged(f"{name} does not match its sha256")
    open(f"{out}/{name}", "wb").write(data)
PY
  else
    echo "stitch.sh: no iMessage SFX. Looked for $BUNDLED/imessage-send.mp3 and" \
         "imessage-receive.mp3, and for $EMBEDDED. Re-fetch render-imessage-chat," \
         "or pass --sfx-dir <dir with imessage-send.mp3 and imessage-receive.mp3>." >&2
    exit 1
  fi
fi
for n in imessage-send.mp3 imessage-receive.mp3; do
  is_real_mp3 "$SFX_DIR/$n" || {
    echo "stitch.sh: missing SFX file $SFX_DIR/$n (absent, empty, or a git-LFS pointer)." >&2; exit 1; }
done

# 1) Crossfade chat → end card (300ms).
CHAT_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CHAT")
END_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$END")
XFADE=0.30
TOTAL=$(python3 -c "print($CHAT_DUR + $END_DUR - $XFADE)")
XSTART=$(python3 -c "print($CHAT_DUR - $XFADE)")
TMP_VIDEO="$WORK/video.mp4"
ff -y -i "$CHAT" -i "$END" \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=${XFADE}:offset=${XSTART}[v]" \
  -map "[v]" -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$TMP_VIDEO"
echo "  video stitched, ${TOTAL}s"

# 2) Build the audio mix (deterministic SFX cues [+ optional ducked music bed]).
TMP_AUDIO="$WORK/audio.m4a"
MUSIC_ARG="${MUSIC:-NONE}"
python3 - "$SFX_JSON" "$SFX_DIR" "$MUSIC_ARG" "$TOTAL" "$TMP_AUDIO" "$SFX_LEAD" <<'PY'
import json, sys, subprocess, array
sfx_json, sfx_dir, music, total, out = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), sys.argv[5]
lead = float(sys.argv[6])
cues = json.load(open(sfx_json))

def onset(path):
    # Seconds of lead-in before the sound is audible (mp3 encoder delay + any padding).
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "48000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    a = array.array("h"); a.frombytes(raw[: len(raw) // 2 * 2])
    peak = max((abs(x) for x in a), default=0)
    thr = peak * 0.05
    for i, x in enumerate(a):
        if abs(x) > thr:
            return i / 48000
    return 0.0
ONSET = {}
has_music = music != "NONE"
# Per-cue gain: the levels approved in the GOOSE-3741 audit renders (0.95 / 0.55 into a
# 0.85 master, bed 0.30 into the same). The -2 dBFS limiter below still holds stacked
# cues down. +4 dB over this read as too loud next to the approved takes.
CUE_GAIN = 0.81
SOFT_GAIN = 0.47
MUSIC_GAIN = 0.26
# Base: a silent stereo bed of the full length so amix always has an anchor.
inputs = ["-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo"]
filter_parts = []
mix_labels = ["[0:a]"]
idx = 1
if has_music:
    inputs += ["-i", music]
    # Music: loop to length, drop sub-60Hz rumble, sit at -6dB, 1.5s fade-out so
    # the brand CTA lands in (relative) quiet.
    filter_parts.append(
        f"[{idx}:a]aloop=loop=-1:size=2147483647,atrim=duration={total},"
        f"highpass=f=60,volume={MUSIC_GAIN},afade=t=out:st={max(0,total-1.5)}:d=1.5[mus]")
    mix_labels.append("[mus]")
    idx += 1
def start_ms(c):
    f = f"{sfx_dir}/imessage-{c['name']}.mp3"
    if c['name'] not in ONSET:
        ONSET[c['name']] = onset(f)
    return max(0, int(round((c['t'] - ONSET[c['name']] - lead) * 1000)))
starts = [start_ms(c) for c in cues]
for n, c in enumerate(cues):
    sfx_file = f"{sfx_dir}/imessage-{c['name']}.mp3"
    inputs += ["-i", sfx_file]
    # The audible start of the sound lands `lead` seconds before the bubble appears.
    delay = starts[n]
    vol = SOFT_GAIN if c.get('soft') else CUE_GAIN
    # A phone restarts the alert for each message: cut this sound (40 ms fade) where the
    # next one starts, or a long receive tone masks the next bubble's sound entirely.
    cut = ""
    if n + 1 < len(cues):
        room = (starts[n + 1] - delay) / 1000
        room -= 0.005  # silent by 5 ms before the next sound starts
        # The receive chime's loud second note lands ~0.3 s in. If another message arrives
        # before the chime ends, that note would ring just BEFORE the next bubble, so stop
        # this chime after its first note (0.20 s). Isolated messages keep the full tone.
        if c['name'] == 'receive' and room < 1.3:
            room = min(room, 0.20)
        if room > 0.05:
            cut = f"atrim=0:{room:.3f},afade=t=out:st={max(0, room - 0.06):.3f}:d=0.06,"
    filter_parts.append(f"[{idx}:a]{cut}adelay={delay}|{delay},volume={vol}[s{idx}]")
    mix_labels.append(f"[s{idx}]")
    idx += 1
n = len(mix_labels)
# normalize=0 so amix doesn't divide each input by N (preserves SFX peaks).
# No fixed boost after the mix: the old volume=2.5 into an auto-levelling
# limiter flat-topped stacked chimes at 0 dBFS (QA-13). The gain sits on each
# cue instead, and a peak limiter at -2 dBFS (auto-level off), run at 4x the
# sample rate so it also catches inter-sample peaks, keeps the AAC master below
# -1 dBTP. A lone cue loses little; overlapping cues are held down.
# Use only alimiter options FFmpeg 4.x knows (`latency` is 5.1+, and an unknown
# option is fatal): Ubuntu 22.04 apt ships 4.4.
filter_parts.append(
    "".join(mix_labels) +
    f"amix=inputs={n}:duration=first:dropout_transition=0:normalize=0,"
    "aresample=176400,alimiter=limit=0.794:level=0,aresample=44100[aout]")
fc = ";".join(filter_parts)
cmd = ["ffmpeg", "-y"] + inputs + ["-filter_complex", fc, "-map", "[aout]", "-c:a", "aac", "-b:a", "192k", out]
r = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
if r.returncode != 0:
    sys.stderr.write(r.stderr[-3000:])
    sys.exit(f"stitch.sh: ffmpeg audio mix failed (exit {r.returncode})")
print(f"  audio: {'1 music bed + ' if has_music else ''}{len(cues)} sfx cues, lead {lead:.3f}s, onsets " +
      ", ".join(f"{k} {v*1000:.0f}ms" for k, v in ONSET.items()))
PY

# 3) Mux video + audio → 9:16 master.
ff -y -i "$TMP_VIDEO" -i "$TMP_AUDIO" -map 0:v -map 1:a -c:v copy -c:a copy -shortest -movflags +faststart "$OUT"
echo "  9:16 master → $OUT"

# 4) Optional 1:1 IG variant — center-crop 1080×1920 → 1080×1080.
if [ "$ALSO_1X1" = "1" ]; then
  OUT_1X1="${OUT%.mp4}-1x1.mp4"
  ff -y -i "$OUT" -vf "crop=1080:1080:0:420" \
    -c:v libx264 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUT_1X1"
  echo "  1:1 IG      → $OUT_1X1"
fi
