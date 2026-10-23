"""Strip product backgrounds via fal-ai/birefnet/v2.

Reads PNGs from ../source/scraped-product-images/, fires birefnet-v2 in parallel,
saves cutouts to ../assets/product-cutouts/, validates alpha quality, writes
manifest.json with per-file stats.

Products come from config.products (the brand's 1-3 SKUs).
Run: python3 strip_product_backgrounds.py [--config path/to/config.json]
"""
from __future__ import annotations

import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SHARED = PROJECT_ROOT.parent.parent.parent / "skills" / "atoms" / "_shared"
sys.path.insert(0, str(SHARED))

from fal_helpers import download, load_fal_key, subscribe, upload_file  # noqa: E402

SOURCE_DIR = PROJECT_ROOT / "source" / "scraped-product-images"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "product-cutouts"
MANIFEST = OUTPUT_DIR / "manifest.json"

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


def _product_file(entry) -> str:
    """products[] entry → PDP filename in source/scraped-product-images/ (handle.png or {"file": ...})."""
    if isinstance(entry, str):
        return f"{entry}.png"
    return entry.get("file") or f"{entry['handle']}.png"


PRODUCTS = [_product_file(p) for p in require(load_config(), "products")]


def strip_one(filename: str) -> dict:
    src = SOURCE_DIR / filename
    dst = OUTPUT_DIR / filename
    if not src.exists():
        return {"file": filename, "status": "ERROR_MISSING_SOURCE"}

    print(f"[{filename}] uploading {src.stat().st_size // 1024} KB…", flush=True)
    image_url = upload_file(src)

    print(f"[{filename}] running birefnet-v2…", flush=True)
    result = subscribe(
        "fal-ai/birefnet/v2",
        {"image_url": image_url},
        timeout_sec=300,
    )

    if not result or "image" not in result:
        return {"file": filename, "status": "ERROR_NO_IMAGE_IN_RESULT", "result": result}

    print(f"[{filename}] downloading cutout…", flush=True)
    download(result["image"]["url"], dst)

    # validate alpha
    from PIL import Image
    im = Image.open(dst)
    if im.mode != "RGBA":
        im = im.convert("RGBA")
        im.save(dst)
    alpha = im.split()[3]
    pixels = list(alpha.getdata())
    total = len(pixels)
    transparent = sum(1 for p in pixels if p == 0)
    opaque = sum(1 for p in pixels if p == 255)
    partial = total - transparent - opaque
    pct_transparent = 100 * transparent / total
    pct_partial = 100 * partial / total

    quality = "GOOD"
    warnings = []
    if pct_transparent < 20:
        quality = "BAD_NO_REMOVAL"
        warnings.append(f"only {pct_transparent:.1f}% transparent — BG not stripped")
    if pct_partial > 8:
        quality = "WARN_SOFT_EDGE"
        warnings.append(f"{pct_partial:.1f}% partial-alpha edge — may show halo")

    return {
        "file": filename,
        "status": "OK",
        "quality": quality,
        "warnings": warnings,
        "size_px": list(im.size),
        "pct_transparent": round(pct_transparent, 1),
        "pct_partial_alpha": round(pct_partial, 1),
        "output_path": str(dst.relative_to(PROJECT_ROOT)),
        "fal_url": result["image"]["url"],
    }


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    load_fal_key()
    print(f"running birefnet/v2 on {len(PRODUCTS)} PNGs in parallel…", flush=True)

    results = []
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = {ex.submit(strip_one, p): p for p in PRODUCTS}
        for fut in as_completed(futures):
            try:
                r = fut.result()
                results.append(r)
                print(f"\n>>> DONE [{r['file']}]: {r.get('status')} {r.get('quality', '')}")
                for w in r.get("warnings", []):
                    print(f"    WARN: {w}")
            except Exception as e:
                results.append({"file": futures[fut], "status": "EXCEPTION", "error": str(e)})
                print(f"\n>>> FAILED [{futures[fut]}]: {e}")

    MANIFEST.write_text(json.dumps({"results": results}, indent=2))
    print(f"\nmanifest: {MANIFEST}")

    bad = [r for r in results if r.get("status") != "OK" or r.get("quality") == "BAD_NO_REMOVAL"]
    if bad:
        print(f"\n{len(bad)} file(s) need attention:")
        for r in bad:
            print(f"  - {r['file']}: {r.get('status')} / {r.get('quality', 'n/a')}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
