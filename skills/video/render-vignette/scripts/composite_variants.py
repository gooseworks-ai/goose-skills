"""Build one 9:16 master mp4 per background variant.

Everything creative comes from config.json:
  - products[]            → cutouts in assets/product-cutouts/, one per carousel beat
  - cutouts.widths_pct    → width-anchored scale per product shape (9:16 scales by WIDTH)
  - bg_concepts[].dim     → which bg_dim filter (heavy / light) each BG concept gets
  - beat_timing           → half-open overlay windows per beat
Background variants are every clip in source/t2v-outputs/*.mp4 (T2V or Pexels), named
<concept-slug>-<MODEL>.mp4 or just <concept-slug>.mp4.

For each BG:
  1. Convert to 9:16 (scale-to-fit-vertical + center-crop horizontal)
  2. Palette-aware dim per concept (heavy for bright/metallic, light for naturally contrasty)
  3. Loop if needed
  4. Overlay cutouts vertically-centered (never bottom-anchored)
  5. Overlay cold-open card + annotated end card
"""
from __future__ import annotations

import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

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

COLD_OPEN = PROJECT_ROOT / "assets" / "text-overlays" / "cold-open-card-9x16.png"
END_CARD = PROJECT_ROOT / "assets" / "text-overlays" / "end-card-annotated-9x16.png"
CUTOUTS = PROJECT_ROOT / "assets" / "product-cutouts"
BG_DIR = PROJECT_ROOT / "source" / "t2v-outputs"

OUT = PROJECT_ROOT / "finals"
OUT.mkdir(parents=True, exist_ok=True)

W, H = int(CFG.get("width", 1080)), int(CFG.get("height", 1920))
DURATION = float(CFG.get("duration_s", 10.5))
FPS = int(CFG.get("fps", 30))

WIDTHS_PCT = CFG.get("cutouts", {}).get("widths_pct", {})


def _product(entry) -> tuple[Path, int]:
    """products[] entry → (cutout path, scaled width px). Accepts a handle string or
    {"file": ..., "shape": ...} / {"handle": ..., "width_pct": ...}."""
    if isinstance(entry, str):
        entry = {"handle": entry}
    fname = entry.get("file") or f"{entry['handle']}.png"
    pct = entry.get("width_pct") or WIDTHS_PCT.get(entry.get("shape", ""), 0.75)
    return CUTOUTS / fname, int(W * float(pct))


PRODUCTS = [_product(p) for p in require(CFG, "products")]

BEATS = require(CFG, "beat_timing")
COLD_OPEN_WIN = BEATS["cold_open"]
CAROUSEL_WINS = BEATS["carousel"]
END_START = BEATS["end_card"][0]
if len(CAROUSEL_WINS) < len(PRODUCTS):
    sys.exit(f"beat_timing.carousel has {len(CAROUSEL_WINS)} windows for {len(PRODUCTS)} products — add one per product")

_CROP = f"scale=-2:{H}:flags=lanczos,crop={W}:{H}:(iw-{W})/2:0,"
_DIM = CFG.get("bg_dim", {})
_CONCEPT_DIM = {c["slug"]: c.get("dim", "light") for c in CFG.get("bg_concepts", []) if c.get("slug")}


def bg_process_for(variant: str) -> str:
    """Palette-aware dim: the concept slug is the variant's prefix (<slug>-<MODEL>)."""
    slug = max((s for s in _CONCEPT_DIM if variant == s or variant.startswith(s + "-")), key=len, default=None)
    level = _CONCEPT_DIM.get(slug, "light")
    eq = _DIM.get(level) or {"heavy": "eq=brightness=-0.30:saturation=0.50:contrast=1.15",
                             "light": "eq=brightness=-0.18:saturation=0.85:contrast=1.10"}[level]
    return _CROP + eq


VARIANTS = sorted(p.stem for p in BG_DIR.glob("*.mp4"))


def composite_one(variant: str) -> dict:
    bg = BG_DIR / f"{variant}.mp4"
    if not bg.exists():
        return {"variant": variant, "status": "BG_MISSING"}

    bg_process = bg_process_for(variant)
    out = OUT / f"master-9x16-{variant}.mp4"

    # filter_complex: BG processed → cold-open overlay → N cutouts (vertically centered) → end card
    # Beat windows are HALF-OPEN [start, next_start): ffmpeg's between(t,a,b) is inclusive on
    # BOTH ends, so consecutive beats that share a boundary both draw on the single frame at the
    # boundary — a ~1-frame flash of the old beat under the new one (most visible as the cold-open
    # card ghosting behind product 1). gte(t,a)*lt(t,b) makes each beat own [a, b) exactly.
    a, b = COLD_OPEN_WIN
    parts = [
        f"[0:v]trim=duration={DURATION},setpts=PTS-STARTPTS,{bg_process}[bg]",
        f"[bg][1:v]overlay=0:0:enable='gte(t,{a})*lt(t,{b})'[v1]",
    ]
    last = "v1"
    for i, ((_, width), (pa, pb)) in enumerate(zip(PRODUCTS, CAROUSEL_WINS)):
        idx = i + 2
        parts.append(f"[{idx}:v]scale={width}:-1[p{i}]")
        parts.append(f"[{last}][p{i}]overlay=x=(W-w)/2:y=(H-h)/2:enable='gte(t,{pa})*lt(t,{pb})'[c{i}]")
        last = f"c{i}"
    end_idx = len(PRODUCTS) + 2
    # End card — runs to the end (no upper bound so a rounded duration can't drop the tail)
    parts.append(f"[{last}][{end_idx}:v]overlay=0:0:enable='gte(t,{END_START})'[vout]")
    filter_complex = ";".join(parts)

    still_inputs = []
    for path in [COLD_OPEN, *[p for p, _ in PRODUCTS], END_CARD]:
        if not path.exists():
            return {"variant": variant, "status": f"MISSING {path.relative_to(PROJECT_ROOT)}"}
        still_inputs += ["-loop", "1", "-t", str(DURATION), "-i", str(path)]

    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", "-1", "-t", str(DURATION), "-i", str(bg),
        *still_inputs,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-r", str(FPS),
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
    if not VARIANTS:
        print("no background clips in source/t2v-outputs/*.mp4 — source the BG (Pexels first, T2V fallback)")
        return 1
    print(f"compositing {len(VARIANTS)} variants in parallel (vertical-center cutouts + per-concept BG dim)…")
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
    sys.exit(main())
