#!/usr/bin/env python3
"""Scaffold the brand-context pack layout at a brand root.

Creates the folders + the four brand-research markdown files (with the canonical
section headers, as empty stubs the research phase fills) + an empty
brand-assets/manifest.json. Idempotent: never overwrites a file that already
has real content.

Usage:
  python scripts/scaffold_brand.py --brand-dir ./acme --brand "Acme"
"""
from __future__ import annotations

import argparse

import lib

STUBS = {
    "brand-summary.md": (
        "# Brand summary\n\n"
        "## What the company sells\n\n_TBD_\n\n"
        "## Who they sell to\n\n_TBD_\n\n"
        "## Why people buy (jobs-to-be-done)\n\n_TBD_\n\n"
        "## Brand voice in three words\n\n_TBD_\n\n"
        "## What to never say\n\n_TBD_\n"
    ),
    "visual-identity.md": (
        "# Visual identity\n\n"
        "## Primary colors (hex)\n\n_TBD_\n\n"
        "## Typography\n\n_TBD_\n\n"
        "## Logo usage rules\n\n_TBD_\n\n"
        "## Photography style\n\n_TBD_\n\n"
        "## Off-limits styles\n\n_TBD_\n"
    ),
    "competitors.md": (
        "# Competitors\n\n"
        "## Direct\n\n_TBD — one line each: positioning, pricing tier, how we win/lose vs them._\n\n"
        "## Reference creative\n\n_TBD — links / vibes to emulate or avoid._\n"
    ),
    "audience.md": (
        "# Audience\n\n"
        "## Primary persona\n\n_TBD_\n\n"
        "## Where they spend time online\n\n_TBD_\n\n"
        "## Objections they raise\n\n_TBD_\n\n"
        "## Proof points that land\n\n_TBD_\n"
    ),
    "asset-urls.md": (
        "# Asset & source URLs\n\n"
        "_One line per source: URL · what it is · access date (ISO)._\n"
    ),
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand-dir", required=True)
    ap.add_argument("--brand", required=True, help="human brand name, used as projectId")
    args = ap.parse_args()

    root = lib.brand_root(args.brand_dir)
    for sub in ("brand-research", "brand-assets/logos", "brand-assets/reference-photos", "ad-runs"):
        (root / sub).mkdir(parents=True, exist_ok=True)

    research = root / "brand-research"
    for name, body in STUBS.items():
        f = research / name
        if not f.exists():
            f.write_text(body)
            lib.info(f"scaffolded brand-research/{name}")
        else:
            lib.info(f"kept existing brand-research/{name}")

    # Empty manifest if none exists.
    if not lib.manifest_path(args.brand_dir).exists():
        m = lib.load_manifest(args.brand_dir)
        m["projectId"] = args.brand
        lib.save_manifest(args.brand_dir, m)
        lib.info("scaffolded brand-assets/manifest.json (empty)")

    lib.info(f"brand root ready: {root}")


if __name__ == "__main__":
    main()
