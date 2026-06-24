#!/usr/bin/env python3
"""Verify a finished brand-context pack against the contract.

The deterministic ship gate. Exits non-zero and prints every problem found.
Run this as the final step before declaring a brand researched — it is what
catches silent drift (e.g. an existing-ads pull that produced an INDEX.md but
no existing-ads.md / brand-grammar.md / manifest.json).

  python scripts/verify_pack.py --brand-dir ./acme

The CORE checks (brand-summary / visual-identity / competitors / audience /
asset-urls / manifest) are the generic contract shared with the public
goose-skills skill. The VIDEO checks (existing-ads / brand-grammar / grammar
profiles) are this Lab skill's deep-research extension — pass --no-video to
verify only the generic core (e.g. for a research-only / static run).
"""
from __future__ import annotations

import argparse
import json
import re
import sys

import lib

CORE_HEADERS = {
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

VIDEO_HEADERS = {
    "existing-ads.md": [
        "Ads watched",
        "How the product actually shows up on screen",
        "Recurring hooks and angles",
        "Claims and proof the brand consistently leans on",
        "Who's shown using it",
        "Objections the ads pre-empt",
        "Voice & caption treatment",
        "Implications for new ads",
    ],
    "brand-grammar.md": [
        "Dominant archetype",
        "Pacing curve",
        "Audio mode",
        "Caption family",
        "Hook construction",
        "Defaults for new ads",
    ],
}

PLACEHOLDER = re.compile(r"\b(?:TBD|TODO|FIXME)\b|FILL THIS IN", re.I)
# A "no live ads" stub legitimately skips the per-ad / grammar-profile checks.
NO_ADS_STUB = re.compile(r"no live meta ads found", re.I)


def check_headers(research, fname, headers, errors):
    f = research / fname
    if not f.is_file():
        errors.append(f"missing brand-research/{fname}")
        return None
    text = f.read_text()
    for h in headers:
        if f"## {h}" not in text:
            errors.append(f"brand-research/{fname}: missing header '## {h}'")
    if PLACEHOLDER.search(text):
        errors.append(f"brand-research/{fname}: still has TBD/TODO placeholder")
    return text


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand-dir", required=True)
    ap.add_argument(
        "--no-video",
        action="store_true",
        help="Verify only the generic core (skip existing-ads / brand-grammar checks).",
    )
    args = ap.parse_args()
    root = lib.brand_root(args.brand_dir)
    research = root / "brand-research"
    errors: list[str] = []

    # --- core docs (generic contract) ---
    for fname, headers in CORE_HEADERS.items():
        check_headers(research, fname, headers, errors)

    urls = research / "asset-urls.md"
    if not urls.is_file():
        errors.append("missing brand-research/asset-urls.md")
    elif len(re.findall(r"https?://", urls.read_text())) < 3:
        errors.append("brand-research/asset-urls.md: fewer than 3 source URLs")

    # --- video docs (deep-research extension) ---
    if not args.no_video:
        ea = check_headers(research, "existing-ads.md", VIDEO_HEADERS["existing-ads.md"], errors)
        bg = check_headers(research, "brand-grammar.md", VIDEO_HEADERS["brand-grammar.md"], errors)
        stubbed = bool((ea and NO_ADS_STUB.search(ea)) or (bg and NO_ADS_STUB.search(bg)))
        if not stubbed:
            # Real ads were analyzed: require the per-ad index + grammar profiles.
            idx = root / "existing-ads" / "INDEX.md"
            if not idx.is_file():
                errors.append("existing-ads/INDEX.md missing (and no 'No live Meta ads found' stub)")
            grammar = root / "existing-ads" / "grammar"
            profiles = list(grammar.rglob("*grammar-profile.json")) if grammar.is_dir() else []
            if not profiles:
                errors.append(
                    "existing-ads/grammar/<slug>/grammar-profile.json missing — "
                    "brand-grammar.md must be synthesized from per-ad profiles "
                    "(or carry the 'No live Meta ads found' stub)"
                )
        # brand-grammar.md must give a numeric cuts_per_10s, not prose like "fast"
        if bg and not stubbed and not re.search(r"cuts[_ ]per[_ ]10s|cuts/10s|\d+\s*cuts", bg, re.I):
            errors.append("brand-grammar.md: no numeric cuts_per_10s default (prose like 'fast' is not enough)")

    # --- manifest contract ---
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
                if not (root / a.get("path", "")).resolve().is_file():
                    errors.append(f"manifest asset path does not resolve: {a.get('path')}")
                listed.add(a.get("path"))
            for p in (root / "brand-assets").rglob("*"):
                if p.is_file() and p.name != "manifest.json" and ".meta.json" not in p.name:
                    rel = p.relative_to(root).as_posix()
                    if rel not in listed:
                        errors.append(f"brand-assets file not in manifest: {rel}")

    # --- deprecated artifacts must be absent ---
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
