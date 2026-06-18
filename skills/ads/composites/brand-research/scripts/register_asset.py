#!/usr/bin/env python3
"""Register an already-on-disk asset into brand-assets/manifest.json.

Use this for files you placed in brand-assets/ by other means (generated
stills, a logo you dropped in by hand, an extracted audio bed).

Usage:
  python scripts/register_asset.py --brand-dir ./acme \
    --path brand-assets/generated-product-shots/01-hero.png \
    --kind product_photo \
    --name "Hero — front 3/4" \
    --description "Primary product reference for any hero/end-card scene."
"""
from __future__ import annotations

import argparse

import lib


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand-dir", required=True)
    ap.add_argument("--path", required=True, help="path relative to the brand root")
    ap.add_argument("--kind", required=True, help=f"one of {sorted(lib.ASSET_KINDS)}")
    ap.add_argument("--name", required=True)
    ap.add_argument("--description", required=True)
    args = ap.parse_args()

    entry = lib.register_asset(
        args.brand_dir, args.path, args.kind, args.name, args.description
    )
    lib.info(f"registered {entry['path']} as {entry['id']}")


if __name__ == "__main__":
    main()
