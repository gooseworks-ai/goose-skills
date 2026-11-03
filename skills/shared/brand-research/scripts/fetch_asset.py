#!/usr/bin/env python3
"""Download one asset (logo, reference photo, …) into the brand-assets folder
and register it in brand-assets/manifest.json.

Usage:
  python scripts/fetch_asset.py --brand-dir ./acme \
    --url https://acme.com/press/logo.svg \
    --kind wordmark --subdir logos \
    --name "Wordmark (black)" \
    --description "Composite in end cards via PIL/ffmpeg; never AI-render. Min height 36px."
"""
from __future__ import annotations

import argparse
import pathlib
import time
import urllib.request

import lib

EXT_BY_CTYPE = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "audio/mpeg": ".mp3",
}


def download(url: str, dest: pathlib.Path, tries: int = 3) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "gooseworks-ads/brand-research"})
    last = None
    for attempt in range(1, tries + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
                ctype = r.headers.get("Content-Type", "").split(";")[0].strip()
            if dest.suffix == "" and ctype in EXT_BY_CTYPE:
                dest = dest.with_suffix(EXT_BY_CTYPE[ctype])
            dest.write_bytes(data)
            return dest
        except Exception as e:  # noqa: BLE001
            last = e
            lib.info(f"download attempt {attempt} failed: {e}")
            time.sleep(2 * attempt)
    lib.die(f"could not download {url}: {last}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand-dir", required=True)
    ap.add_argument("--url", required=True)
    ap.add_argument("--kind", required=True, help=f"one of {sorted(lib.ASSET_KINDS)}")
    ap.add_argument("--subdir", default="reference-photos", help="folder under brand-assets/")
    ap.add_argument("--name", required=True)
    ap.add_argument("--description", required=True)
    ap.add_argument("--filename", default="", help="override the saved filename")
    args = ap.parse_args()

    root = lib.brand_root(args.brand_dir)
    out_dir = root / "brand-assets" / args.subdir
    out_dir.mkdir(parents=True, exist_ok=True)

    fname = args.filename or args.url.split("?")[0].rstrip("/").split("/")[-1] or "asset"
    dest = download(args.url, out_dir / fname)

    rel = dest.relative_to(root).as_posix()
    entry = lib.register_asset(args.brand_dir, rel, args.kind, args.name, args.description)
    lib.info(f"saved + registered {rel} as {entry['id']}")


if __name__ == "__main__":
    main()
