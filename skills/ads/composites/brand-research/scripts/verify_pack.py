#!/usr/bin/env python3
"""Verify a finished brand-context pack against the output contract.

Exits non-zero and prints every problem found. Run this as the final gate
before declaring the brand researched.

Usage:
  python scripts/verify_pack.py --brand-dir ./acme
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

import lib

REQUIRED_HEADERS = {
    "brand-summary.md": [
        "What the company sells",
        "Who they sell to",
        "Why people buy (jobs-to-be-done)",
        "Brand voice in three words",
        "What to never say",
    ],
    "visual-identity.md": [
        "Primary colors (hex)",
        "Typography",
        "Logo usage rules",
        "Photography style",
        "Off-limits styles",
    ],
    "competitors.md": ["Direct", "Reference creative"],
    "audience.md": [
        "Primary persona",
        "Where they spend time online",
        "Objections they raise",
        "Proof points that land",
    ],
}

PLACEHOLDER = re.compile(r"\b(?:TBD|TODO|FIXME)\b|FILL THIS IN", re.I)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand-dir", required=True)
    args = ap.parse_args()
    root = lib.brand_root(args.brand_dir)
    research = root / "brand-research"
    errors: list[str] = []

    for fname, headers in REQUIRED_HEADERS.items():
        f = research / fname
        if not f.is_file():
            errors.append(f"missing brand-research/{fname}")
            continue
        text = f.read_text()
        for h in headers:
            if f"## {h}" not in text:
                errors.append(f"brand-research/{fname}: missing header '## {h}'")
        if PLACEHOLDER.search(text):
            errors.append(f"brand-research/{fname}: still has TBD/TODO placeholder")

    urls = research / "asset-urls.md"
    if not urls.is_file():
        errors.append("missing brand-research/asset-urls.md")
    elif len(re.findall(r"https?://", urls.read_text())) < 3:
        errors.append("brand-research/asset-urls.md: fewer than 3 source URLs")

    # Manifest contract
    mp = root / "brand-assets" / "manifest.json"
    if not mp.is_file():
        errors.append("missing brand-assets/manifest.json")
    else:
        try:
            m = json.loads(mp.read_text())
        except json.JSONDecodeError as e:
            errors.append(f"brand-assets/manifest.json invalid JSON: {e}")
            m = None
        if m is not None:
            for key in ("schemaVersion", "updatedAt", "projectId", "assets"):
                if key not in m:
                    errors.append(f"manifest.json missing top-level '{key}'")
            listed = set()
            for a in m.get("assets", []):
                for k in ("id", "path", "kind", "name", "description", "addedAt"):
                    if not str(a.get(k, "")).strip():
                        errors.append(f"manifest asset {a.get('path','?')}: empty '{k}'")
                if a.get("kind") not in lib.ASSET_KINDS:
                    errors.append(f"manifest asset {a.get('path','?')}: bad kind '{a.get('kind')}'")
                ap_ = (root / a.get("path", "")).resolve()
                if not ap_.is_file():
                    errors.append(f"manifest asset path does not resolve: {a.get('path')}")
                listed.add(a.get("path"))
            # Orphan files: anything under brand-assets/ (except manifest) not listed
            for p in (root / "brand-assets").rglob("*"):
                if p.is_file() and p.name != "manifest.json" and ".meta.json" not in p.name:
                    rel = p.relative_to(root).as_posix()
                    if rel not in listed:
                        errors.append(f"brand-assets file not in manifest: {rel}")

    # Deprecated artifacts must be absent
    for dead in ("background_research.md", "brand-assets/README.md", "manifest.json"):
        if (root / dead).exists():
            errors.append(f"deprecated artifact present, remove it: {dead}")

    if errors:
        print(f"FAIL — {len(errors)} problem(s):", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)
    print("PASS — brand-context pack is complete and consistent.")


if __name__ == "__main__":
    main()
