"""Generate one music bed via fal-ai/elevenlabs/music, then mux it into every composited variant.

The brief comes from config.music.prompt (the recipe's `music` choice).

Per memory:
  feedback_ffmpeg_map_directive: when ffmpeg has two -i inputs, always pass -map 0:v -map 1:a
  feedback_ffmpeg_lcut_endcard_recipe: build video + audio in SEPARATE ffmpeg passes, not one
  feedback_elevenlabs_music_decay: if music tapers in 2nd half, loop-and-flatten instead of regen
"""
from __future__ import annotations

import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SHARED = PROJECT_ROOT.parent.parent.parent / "skills" / "atoms" / "_shared"
sys.path.insert(0, str(SHARED))

from fal_helpers import download, load_fal_key, subscribe  # noqa: E402

FINALS = PROJECT_ROOT / "finals"
MUSIC_DIR = PROJECT_ROOT / "assets" / "music"
MUSIC_DIR.mkdir(parents=True, exist_ok=True)
MUSIC_RAW = MUSIC_DIR / "music-bed-raw.mp3"
MUSIC_FINAL = MUSIC_DIR / "music-bed-final.mp3"

# ── CONFIG ──────────────────────────────────────────────────────────────
# Creative values come from config.json (copy scripts/config.example.json and fill it from the
# recipe's `choices` + the brand kit). Lookup order: --config <path>, $VIGNETTE_CONFIG,
# <project>/config.json, scripts/config.json.


def load_config() -> dict:
    import json
    import os
    candidates = []
    if "--config" in sys.argv:
        i = sys.argv.index("--config")
        if i + 1 < len(sys.argv):
            candidates.append(Path(sys.argv[i + 1]))
    if os.environ.get("VIGNETTE_CONFIG"):
        candidates.append(Path(os.environ["VIGNETTE_CONFIG"]))
    candidates += [PROJECT_ROOT / "config.json", Path(__file__).resolve().parent / "config.json"]
    for c in candidates:
        if c.exists():
            return json.loads(c.read_text())
    sys.exit(
        "No config.json found. Copy scripts/config.example.json to <project>/config.json and fill the "
        "creative fields from the recipe's choices + the brand kit (or pass --config <path>)."
    )


def require(cfg: dict, dotted: str):
    cur = cfg
    for part in dotted.split("."):
        if not isinstance(cur, dict) or cur.get(part) in (None, "", []):
            sys.exit(f"config.{dotted} is missing — it comes from the recipe's choices / brand kit; set it in config.json.")
        cur = cur[part]
    return cur


CFG = load_config()
DURATION = float(CFG.get("duration_s", 10.5))
# generate slightly longer than the video, then trim
TARGET_MUSIC_DUR = float(CFG.get("music", {}).get("length_ms", 0)) / 1000 or round(DURATION * 1.2, 1)

# The music brief is the user's `music` choice (recipe choices.music -> config.music.prompt).
# Never hardcode a mood here, and never name brands in it (ElevenLabs rejects prompts that do).
MUSIC_BRIEF = require(CFG, "music.prompt")

# Every composited master in finals/ gets the same bed (one per BG concept x model).
VARIANTS = sorted(p.stem.replace("master-9x16-", "") for p in FINALS.glob("master-9x16-*.mp4")
                  if not p.stem.startswith("_tmp_"))


def generate_music():
    """Fire fal-ai/elevenlabs/music."""
    print("generating music bed via fal-ai/elevenlabs/music…")
    print(f"  brief: {MUSIC_BRIEF[:120]}…")
    result = subscribe(
        "fal-ai/elevenlabs/music",
        {
            "prompt": MUSIC_BRIEF,
            "music_length_ms": int(TARGET_MUSIC_DUR * 1000),
            "output_format": "mp3_44100_192",
        },
        timeout_sec=600,
    )
    if not result or "audio" not in result:
        raise RuntimeError(f"music gen failed: {result}")
    url = result["audio"]["url"]
    download(url, MUSIC_RAW)
    print(f"  ✓ raw music: {MUSIC_RAW.relative_to(PROJECT_ROOT)} ({MUSIC_RAW.stat().st_size // 1024} KB)")
    return MUSIC_RAW


def trim_and_normalize(src: Path):
    """Trim music to DURATION + apply gentle compressor + loudnorm so it sits under no-VO video."""
    print(f"trimming + normalizing music to {DURATION}s…")
    cmd = [
        "ffmpeg", "-y", "-i", str(src),
        "-t", str(DURATION),
        "-af", "acompressor=threshold=-12dB:ratio=2:attack=20:release=200,loudnorm=I=-18:TP=-2:LRA=9",
        "-c:a", "mp3", "-b:a", "192k",
        "-loglevel", "error",
        str(MUSIC_FINAL),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"FAIL: {r.stderr}")
        return False
    print(f"  ✓ final music: {MUSIC_FINAL.relative_to(PROJECT_ROOT)} ({MUSIC_FINAL.stat().st_size // 1024} KB)")
    return True


def mux_one(variant: str) -> dict:
    """Mux music into one variant. Use -map 0:v -map 1:a per memory rule."""
    src_video = FINALS / f"master-9x16-{variant}.mp4"
    if not src_video.exists():
        return {"variant": variant, "status": "VIDEO_MISSING"}

    # Write to temp then rename, so we don't corrupt the source
    tmp_out = FINALS / f"_tmp_{variant}.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-i", str(src_video),
        "-i", str(MUSIC_FINAL),
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
        "-map", "0:v:0", "-map", "1:a:0",
        "-shortest",
        "-movflags", "+faststart",
        "-loglevel", "error",
        str(tmp_out),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        return {"variant": variant, "status": "MUX_ERROR", "stderr": r.stderr[-1000:]}
    # Move tmp over original
    tmp_out.replace(src_video)
    # Verify audio is actually there + not 1kbps
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0",
         "-show_entries", "stream=codec_name,bit_rate,duration", "-of", "default=noprint_wrappers=1",
         str(src_video)],
        capture_output=True, text=True,
    )
    return {"variant": variant, "status": "OK", "audio_probe": probe.stdout.strip()}


def main():
    load_fal_key()

    # 1. Generate music (skip if cached)
    if not MUSIC_RAW.exists():
        generate_music()
    else:
        print(f"using cached music: {MUSIC_RAW.relative_to(PROJECT_ROOT)}")

    # 2. Trim + normalize
    if not trim_and_normalize(MUSIC_RAW):
        return 1

    # 3. Mux into 6 variants in parallel
    if not VARIANTS:
        print("no finals/master-9x16-*.mp4 to mux into — run composite_variants.py first")
        return 1
    print(f"\nmuxing music into {len(VARIANTS)} variants in parallel…")
    results = []
    with ThreadPoolExecutor(max_workers=len(VARIANTS)) as ex:
        futures = {ex.submit(mux_one, v): v for v in VARIANTS}
        for fut in as_completed(futures):
            v = futures[fut]
            try:
                r = fut.result()
                results.append(r)
                if r["status"] == "OK":
                    print(f"✓ {r['variant']}: muxed")
                    for line in r["audio_probe"].splitlines():
                        print(f"    {line}")
                else:
                    print(f"✗ {r['variant']}: {r['status']}")
            except Exception as e:
                results.append({"variant": v, "status": "EXC", "error": str(e)})
                print(f"✗ {v}: EXC {e}")

    ok = sum(1 for r in results if r.get("status") == "OK")
    print(f"\n→ {ok}/{len(VARIANTS)} variants muxed with music")
    return 0 if ok == len(VARIANTS) else 1


if __name__ == "__main__":
    sys.exit(main())
