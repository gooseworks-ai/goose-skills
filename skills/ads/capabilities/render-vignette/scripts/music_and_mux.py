"""Generate one music bed via fal-ai/elevenlabs/music, then mux into all 6 variants.

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
MUSIC_RAW = MUSIC_DIR / "mother-science-bed-raw.mp3"
MUSIC_FINAL = MUSIC_DIR / "mother-science-bed-final.mp3"

DURATION = 10.5
TARGET_MUSIC_DUR = 12.0  # generate slightly longer than video

MUSIC_BRIEF = (
    "Clinical-luxury skincare science vignette ad music bed. Slow-tempo ambient "
    "minimal electronic with warm low pads and subtle high-end sparkle. "
    "Instrumental only, no vocals, no lyrics. 90 BPM, sophisticated and quiet. "
    "Begins with soft atmospheric pad and gentle resonant tones. Subtly builds "
    "with a single sparkling synth note in the last 2 seconds for the end-card "
    "brand reveal. Premium, restrained, Augustinus Bader / La Mer luxury "
    "skincare commercial mood. 12 seconds total."
)

VARIANTS = [
    "alpha-VEO", "alpha-KLING", "alpha-SEED",
    "beta-VEO", "beta-KLING", "beta-SEED",
]


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
