#!/usr/bin/env python3
"""(Optional) Generate a brand-anchored product or lifestyle still via FAL
nano-banana, grounded on a real reference photo so the SKU stays consistent,
then register it in the manifest.

Requires FAL_KEY in .env. Skip this script entirely for a research-only run.

Usage:
  python scripts/render_product_shot.py --brand-dir ./acme \
    --ref brand-assets/reference-photos/hero.jpg \
    --prompt "studio product shot on seamless white, soft key light, 9:16" \
    --kind product_photo --subdir generated-product-shots \
    --name "Hero on white" --description "Clean studio hero for end card."
"""
from __future__ import annotations

import argparse
import pathlib

import lib


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand-dir", required=True)
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--ref", default="", help="reference image path, relative to brand root")
    ap.add_argument("--kind", default="product_photo")
    ap.add_argument("--subdir", default="generated-product-shots")
    ap.add_argument("--name", required=True)
    ap.add_argument("--description", required=True)
    ap.add_argument("--filename", default="", help="output filename, e.g. 01-hero.png")
    args = ap.parse_args()

    lib.require_env("FAL_KEY")
    import fal_client  # imported late so research-only runs don't need the dep

    root = lib.brand_root(args.brand_dir)
    out_dir = root / "brand-assets" / args.subdir
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = args.filename or f"{len(list(out_dir.glob('*.png'))) + 1:02d}-still.png"
    dest = out_dir / fname

    arguments = {"prompt": args.prompt, "num_images": 1}
    if args.ref:
        ref_abs = (root / args.ref).resolve()
        if not ref_abs.is_file():
            lib.die(f"reference image not found: {ref_abs}")
        arguments["image_url"] = fal_client.upload_file(str(ref_abs))
        endpoint = "fal-ai/nano-banana/edit"
    else:
        endpoint = "fal-ai/nano-banana"

    lib.info(f"submitting to {endpoint} …")
    result = fal_client.subscribe(endpoint, arguments=arguments, with_logs=False)
    images = result.get("images") or []
    if not images:
        lib.die(f"no image returned: {result}")

    import urllib.request

    urllib.request.urlretrieve(images[0]["url"], dest)
    rel = dest.relative_to(root).as_posix()
    entry = lib.register_asset(args.brand_dir, rel, args.kind, args.name, args.description)
    lib.info(f"rendered + registered {rel} as {entry['id']}")


if __name__ == "__main__":
    main()
