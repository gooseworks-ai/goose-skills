"""Build 6 master mp4 variants at 9:16 1080×1920.

v2.1 fixes:
  - Vertical-center cutouts (all 3 visual midpoints align)
  - Per-variant BG dim — alpha (chrome) gets heavier desaturate+darken,
    beta (ink-in-cream) keeps lighter dim

For each T2V BG:
  1. Convert to 9:16 (scale-to-fit-vertical + center-crop horizontal)
  2. Darken/desaturate per variant family
  3. Loop if needed
  4. Overlay cutouts vertically-centered
  5. Overlay cold-open card + annotated end card
"""
from __future__ import annotations

import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

COLD_OPEN = PROJECT_ROOT / "assets" / "text-overlays" / "cold-open-card-9x16.png"
END_CARD = PROJECT_ROOT / "assets" / "text-overlays" / "end-card-annotated-9x16.png"
HERO = PROJECT_ROOT / "assets" / "product-cutouts" / "molecular-hero-serum.png"
GENESIS = PROJECT_ROOT / "assets" / "product-cutouts" / "molecular-genesis.png"
RETINOL = PROJECT_ROOT / "assets" / "product-cutouts" / "retinol-synergist.png"

OUT = PROJECT_ROOT / "finals"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1920
DURATION = 10.5

HERO_W = int(W * 0.75)
GEN_W = int(W * 0.65)
RET_W = int(W * 0.75)

# Per-variant family BG processing
BG_PROCESS_ALPHA = (
    "scale=-2:1920:flags=lanczos,"
    "crop=1080:1920:(iw-1080)/2:0,"
    "eq=brightness=-0.30:saturation=0.50:contrast=1.15"  # heavier desaturate to kill chrome metallic
)
BG_PROCESS_BETA = (
    "scale=-2:1920:flags=lanczos,"
    "crop=1080:1920:(iw-1080)/2:0,"
    "eq=brightness=-0.18:saturation=0.85:contrast=1.10"  # lighter — ink-on-cream already has contrast
)

VARIANTS = [
    "alpha-VEO", "alpha-KLING", "alpha-SEED",
    "beta-VEO", "beta-KLING", "beta-SEED",
]


def composite_one(variant: str) -> dict:
    bg = PROJECT_ROOT / "source" / "t2v-outputs" / f"{variant}.mp4"
    if not bg.exists():
        return {"variant": variant, "status": "BG_MISSING"}

    bg_process = BG_PROCESS_ALPHA if variant.startswith("alpha-") else BG_PROCESS_BETA
    out = OUT / f"master-9x16-{variant}.mp4"

    # filter_complex: BG processed → cold-open overlay → 3 cutouts (vertically centered) → end card
    filter_complex = (
        f"[0:v]trim=duration={DURATION},setpts=PTS-STARTPTS,"
        f"{bg_process}[bg];"
        f"[bg][1:v]overlay=0:0:enable='between(t,1.5,3.0)'[v1];"
        # Hero Serum — vertical center
        f"[2:v]scale={HERO_W}:-1[hero];"
        f"[v1][hero]overlay=x=(W-w)/2:y=(H-h)/2:enable='between(t,3.0,4.6)'[v2];"
        # Genesis — vertical center
        f"[3:v]scale={GEN_W}:-1[gen];"
        f"[v2][gen]overlay=x=(W-w)/2:y=(H-h)/2:enable='between(t,4.6,6.2)'[v3];"
        # Retinol — vertical center
        f"[4:v]scale={RET_W}:-1[ret];"
        f"[v3][ret]overlay=x=(W-w)/2:y=(H-h)/2:enable='between(t,6.2,7.8)'[v4];"
        # End card
        f"[v4][5:v]overlay=0:0:enable='between(t,7.8,{DURATION})'[vout]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", "-1", "-t", str(DURATION), "-i", str(bg),
        "-loop", "1", "-t", str(DURATION), "-i", str(COLD_OPEN),
        "-loop", "1", "-t", str(DURATION), "-i", str(HERO),
        "-loop", "1", "-t", str(DURATION), "-i", str(GENESIS),
        "-loop", "1", "-t", str(DURATION), "-i", str(RETINOL),
        "-loop", "1", "-t", str(DURATION), "-i", str(END_CARD),
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-r", "30",
        "-t", str(DURATION),
        str(out),
    ]

    print(f"[{variant}] composing → {out.name}", flush=True)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        return {"variant": variant, "status": "FFMPEG_ERROR", "stderr": r.stderr[-2000:]}
    size_mb = out.stat().st_size / 1024 / 1024
    return {"variant": variant, "status": "OK", "path": str(out.relative_to(PROJECT_ROOT)), "size_mb": round(size_mb, 1)}


def main():
    print(f"compositing {len(VARIANTS)} variants in parallel (v2.1: vertical center + per-variant BG dim)…")
    results = []
    with ThreadPoolExecutor(max_workers=len(VARIANTS)) as ex:
        futures = {ex.submit(composite_one, v): v for v in VARIANTS}
        for fut in as_completed(futures):
            v = futures[fut]
            try:
                r = fut.result()
                results.append(r)
                if r["status"] == "OK":
                    print(f"✓ {r['variant']}: {r['path']} ({r['size_mb']} MB)")
                else:
                    print(f"✗ {r['variant']}: {r['status']}")
                    if "stderr" in r:
                        print(f"  {r['stderr'][-800:]}")
            except Exception as e:
                print(f"✗ {v}: EXCEPTION {e}")
                results.append({"variant": v, "status": "EXCEPTION", "error": str(e)})

    ok = sum(1 for r in results if r.get("status") == "OK")
    print(f"\n→ {ok}/{len(VARIANTS)} variants succeeded")
    return 0 if ok == len(VARIANTS) else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
