"""Strip product backgrounds via fal-ai/birefnet/v2.

Reads PNGs from ../source/scraped-product-images/, fires birefnet-v2 in parallel,
saves cutouts to ../assets/product-cutouts/, validates alpha quality, writes
manifest.json with per-file stats.

Run from this directory: python3 01_strip_product_backgrounds.py
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

PRODUCTS = [
    "molecular-hero-serum.png",
    "molecular-genesis.png",
    "retinol-synergist.png",
]


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
