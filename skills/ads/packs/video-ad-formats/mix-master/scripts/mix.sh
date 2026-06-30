#!/usr/bin/env bash
# Canonical short-form ad mix protocol. See ../SKILL.md.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: mix.sh --video <path> --vo <csv> --vo-starts <csv> --music <path> \
              --output <path> --total-duration <seconds> [options]

Required:
  --video <path>           Input video (audio stream will be dropped)
  --vo <csv>               Comma-separated VO mp3 paths in scene order
  --vo-starts <csv>        Comma-separated VO start times in milliseconds
  --music <path>           Music bed path
  --output <path>          Output mp4 path
  --total-duration <s>     Target total duration in seconds

Optional:
  --sfx <csv>              Comma-separated SFX paths
  --sfx-starts <csv>       Comma-separated SFX start times in milliseconds
  --vo-boost-line <N>      1-indexed VO clip to boost +20% (climax)
  --vo-volume <f>          Per-clip VO volume multiplier (default 3.0)
  --vo-mix-volume <f>      Extra VO mix-bus volume (default 2.0)
  --music-volume <f>       Base music volume (default 0.13)
  --sidechain-ratio <f>    Sidechain ratio (FFmpeg caps at 20) (default 20)
  --sidechain-threshold <f>  Sidechain threshold (default 0.01)
  --target-i <lufs>        VO loudnorm integrated target (default -16)
  --target-tp <dbtp>       VO loudnorm true-peak (default -1.5)
  --target-lra <lu>        VO loudnorm LRA (default 11)
  -h, --help               Show this help
EOF
}

VIDEO=""
VO_CSV=""
VO_STARTS=""
MUSIC=""
OUTPUT=""
TOTAL=""
SFX_CSV=""
SFX_STARTS=""
VO_BOOST_LINE=""
VO_VOLUME="3.0"
VO_MIX_VOLUME="2.0"
MUSIC_VOLUME="0.13"
SIDECHAIN_RATIO="20"
SIDECHAIN_THRESHOLD="0.01"
TARGET_I="-16"
TARGET_TP="-1.5"
TARGET_LRA="11"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --video) VIDEO="$2"; shift 2 ;;
    --vo) VO_CSV="$2"; shift 2 ;;
    --vo-starts) VO_STARTS="$2"; shift 2 ;;
    --music) MUSIC="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --total-duration) TOTAL="$2"; shift 2 ;;
    --sfx) SFX_CSV="$2"; shift 2 ;;
    --sfx-starts) SFX_STARTS="$2"; shift 2 ;;
    --vo-boost-line) VO_BOOST_LINE="$2"; shift 2 ;;
    --vo-volume) VO_VOLUME="$2"; shift 2 ;;
    --vo-mix-volume) VO_MIX_VOLUME="$2"; shift 2 ;;
    --music-volume) MUSIC_VOLUME="$2"; shift 2 ;;
    --sidechain-ratio) SIDECHAIN_RATIO="$2"; shift 2 ;;
    --sidechain-threshold) SIDECHAIN_THRESHOLD="$2"; shift 2 ;;
    --target-i) TARGET_I="$2"; shift 2 ;;
    --target-tp) TARGET_TP="$2"; shift 2 ;;
    --target-lra) TARGET_LRA="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

for v in VIDEO VO_CSV VO_STARTS MUSIC OUTPUT TOTAL; do
  if [[ -z "${!v}" ]]; then
    echo "Error: --$(echo $v | tr 'A-Z_' 'a-z-') is required" >&2
    usage; exit 2
  fi
done

command -v ffmpeg  >/dev/null || { echo "ffmpeg not on PATH" >&2; exit 3; }
command -v ffprobe >/dev/null || { echo "ffprobe not on PATH" >&2; exit 3; }

# Sidechain ratio cap
if (( $(printf '%.0f' "$SIDECHAIN_RATIO") > 20 )); then
  echo "warn: sidechain ratio > 20 not supported by FFmpeg; capping to 20" >&2
  SIDECHAIN_RATIO="20"
fi

# Split CSVs
IFS=',' read -r -a VOS <<< "$VO_CSV"
IFS=',' read -r -a VO_START_ARR <<< "$VO_STARTS"
SFX_ARR=()
SFX_START_ARR=()
if [[ -n "$SFX_CSV" ]]; then
  IFS=',' read -r -a SFX_ARR <<< "$SFX_CSV"
  IFS=',' read -r -a SFX_START_ARR <<< "$SFX_STARTS"
fi

if [[ "${#VOS[@]}" -ne "${#VO_START_ARR[@]}" ]]; then
  echo "Error: --vo count (${#VOS[@]}) != --vo-starts count (${#VO_START_ARR[@]})" >&2
  exit 2
fi
if [[ "${#SFX_ARR[@]}" -ne "${#SFX_START_ARR[@]}" ]]; then
  echo "Error: --sfx count != --sfx-starts count" >&2
  exit 2
fi

OUT_DIR="$(dirname "$OUTPUT")"
mkdir -p "$OUT_DIR"

# Build the filter chain
CHAIN_FILE="$(mktemp -t mixmaster.XXXXXX)"
trap 'rm -f "$CHAIN_FILE"' EXIT

# Input order: 0 = video, 1..K = VOs, K+1 = music, K+2.. = SFX
N_VO=${#VOS[@]}
N_SFX=${#SFX_ARR[@]}
MUSIC_IDX=$((1 + N_VO))
FIRST_SFX_IDX=$((MUSIC_IDX + 1))

CHAIN=""

# Per-VO loudnorm + delay + volume
for i in $(seq 0 $((N_VO - 1))); do
  IN_IDX=$((i + 1))
  START="${VO_START_ARR[$i]}"
  VOL="$VO_VOLUME"
  # Climax boost: VO_BOOST_LINE is 1-indexed
  if [[ -n "$VO_BOOST_LINE" && "$VO_BOOST_LINE" -eq $((i + 1)) ]]; then
    VOL="$(python3 -c "print(round($VO_VOLUME * 1.2, 4))")"
  fi
  CHAIN+="[${IN_IDX}:a]loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA},adelay=${START}|${START},volume=${VOL}[vo${i}];"$'\n'
done

# Mix all VO clips
VO_LABELS=""
for i in $(seq 0 $((N_VO - 1))); do
  VO_LABELS+="[vo${i}]"
done
CHAIN+="${VO_LABELS}amix=inputs=${N_VO}:duration=longest,volume=${VO_MIX_VOLUME}[vo_pre];"$'\n'
CHAIN+="[vo_pre]asplit=2[vo_final][vo_sc];"$'\n'

# Music: pad, trim, fade out
FADE_START="$(python3 -c "print(round($TOTAL - 1.5, 3))")"
CHAIN+="[${MUSIC_IDX}:a]apad=pad_dur=2.0,atrim=0:${TOTAL},afade=t=out:st=${FADE_START}:d=1.5,volume=${MUSIC_VOLUME}[music_base];"$'\n'

# Sidechain compress music vs VO
CHAIN+="[music_base][vo_sc]sidechaincompress=threshold=${SIDECHAIN_THRESHOLD}:ratio=${SIDECHAIN_RATIO}:attack=20:release=600[music_ducked];"$'\n'

# SFX (if any)
SFX_LABELS=""
if (( N_SFX > 0 )); then
  for i in $(seq 0 $((N_SFX - 1))); do
    IN_IDX=$((FIRST_SFX_IDX + i))
    START="${SFX_START_ARR[$i]}"
    CHAIN+="[${IN_IDX}:a]adelay=${START}|${START}[sfx${i}];"$'\n'
    SFX_LABELS+="[sfx${i}]"
  done
  CHAIN+="${SFX_LABELS}amix=inputs=${N_SFX}:duration=longest[sfx_bus];"$'\n'
  CHAIN+="[vo_final][music_ducked][sfx_bus]amix=inputs=3:duration=longest[a_out]"$'\n'
else
  CHAIN+="[vo_final][music_ducked]amix=inputs=2:duration=longest[a_out]"$'\n'
fi

printf '%s' "$CHAIN" > "$CHAIN_FILE"

# Build the ffmpeg input list
FFMPEG_ARGS=(-y -hide_banner -nostdin)
FFMPEG_ARGS+=(-i "$VIDEO")
for v in "${VOS[@]}"; do
  FFMPEG_ARGS+=(-i "$v")
done
FFMPEG_ARGS+=(-i "$MUSIC")
for s in "${SFX_ARR[@]}"; do
  FFMPEG_ARGS+=(-i "$s")
done

FFMPEG_ARGS+=(
  -filter_complex_script "$CHAIN_FILE"
  -map "0:v"
  -map "[a_out]"
  -c:v libx264 -pix_fmt yuv420p -crf 18
  -t "$TOTAL"
  -shortest
  "$OUTPUT"
)

echo "Running mix-master..."
echo "  VO clips:    $N_VO"
echo "  SFX clips:   $N_SFX"
echo "  Climax line: ${VO_BOOST_LINE:-none}"
echo "  Total dur:   ${TOTAL}s"

ffmpeg "${FFMPEG_ARGS[@]}"

# Verification probe
echo "Probing output loudness..."
PROBE_STDERR="$(ffmpeg -hide_banner -nostdin -i "$OUTPUT" \
  -af "loudnorm=I=-14:TP=-1:LRA=11:print_format=json" \
  -f null - 2>&1 >/dev/null || true)"

PROBE_JSON="$(printf '%s\n' "$PROBE_STDERR" \
  | awk '/^\{/{flag=1} flag{print} /^\}/{flag=0; exit}')"

python3 - "$OUT_DIR" "$OUTPUT" "$TOTAL" "$VO_BOOST_LINE" "$VO_VOLUME" "$MUSIC_VOLUME" "$SIDECHAIN_RATIO" "$PROBE_JSON" <<'PY'
import json, sys, pathlib

out_dir, out, total, boost, vo_vol, music_vol, sc_ratio, probe = sys.argv[1:]
try:
  pj = json.loads(probe) if probe else {}
except json.JSONDecodeError:
  pj = {}

manifest = {
  "output": out,
  "total_duration": float(total),
  "vo_boost_line": int(boost) if boost else None,
  "vo_volume": float(vo_vol),
  "music_volume": float(music_vol),
  "sidechain_ratio": float(sc_ratio),
  "loudness_after": {
    "I": pj.get("output_i"),
    "TP": pj.get("output_tp"),
    "LRA": pj.get("output_lra"),
  },
  "status": "ok",
}
pathlib.Path(out_dir, "manifest.json").write_text(json.dumps(manifest, indent=2))

verif = [
  "# mix-master verification\n",
  f"- Output: `{out}`",
  f"- Total duration: {total}s",
  f"- Climax line: {boost or 'none'}",
  f"- VO volume: {vo_vol} (climax: +20%)" if boost else f"- VO volume: {vo_vol}",
  f"- Music volume: {music_vol}",
  f"- Sidechain ratio: {sc_ratio}:1",
  "",
  "## Measured loudness (post-mix)",
  f"- Integrated I: {manifest['loudness_after']['I']}",
  f"- True peak: {manifest['loudness_after']['TP']}",
  f"- LRA: {manifest['loudness_after']['LRA']}",
]
try:
  i = float(manifest["loudness_after"]["I"])
  status = "PASS" if -14.5 <= i <= -13.5 else "WARN"
  verif.append(f"\n**Integrated LUFS within social target (-14 ± 0.5):** {status} (measured {i})")
except (TypeError, ValueError):
  verif.append("\n**Integrated LUFS:** unmeasurable (probe parse failed)")
pathlib.Path(out_dir, "verification.md").write_text("\n".join(verif) + "\n")
print(f"Wrote manifest.json and verification.md in {out_dir}")
PY

echo "Done: $OUTPUT"
