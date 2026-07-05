#!/usr/bin/env python3
"""Download the three Twemoji PNGs the pills need into <run>/assets/icons.

PIL cannot render Apple Color Emoji (horizontal-bar artifacts) — we paste 72x72
Twemoji PNGs instead (see memory feedback_pil_emoji_use_twemoji_png). Free, local.

Usage:  fetch_icons.py --run-dir <run>
"""
import argparse
import pathlib
import urllib.request

CDN = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72"
ICONS = {
    "medal.png": "1f3c5",       # 🏅 score header
    "finger-down.png": "1f447",  # 👇 subhead
    "check.png": "2705",         # ✅ proof pills
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-dir", required=True)
    args = ap.parse_args()
    out = pathlib.Path(args.run_dir) / "assets" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    for name, cp in ICONS.items():
        dst = out / name
        if dst.exists():
            print(f"[icons] have {name}")
            continue
        urllib.request.urlretrieve(f"{CDN}/{cp}.png", dst)
        print(f"[icons] {name} <- {cp}.png")


if __name__ == "__main__":
    main()
