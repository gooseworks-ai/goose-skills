#!/usr/bin/env python3
"""Optional greeting-card insert: generate a brand-style illustration (PAID image
edit, ~$0.19), overlay the handwritten greeting in PIL, chroma-composite onto the
tabletop, and render a fade-in/hold/fade-out mp4 that drops into the sequence.

Usage:  gen_fd_card.py --config config.json --run-dir <run>
Output: <run>/generated/insert-card.mp4
Skips cleanly if config.insert_card.enabled is false.
"""
import argparse
import json
import os
import pathlib
import subprocess
import urllib.request

from PIL import Image, ImageDraw, ImageFont

os.environ["FAL_KEY"] = os.environ.get("FAL_KEY") or os.environ.get("FAL_API_KEY", "")

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Brush Script.ttf",
    "/System/Library/Fonts/Supplemental/SnellRoundhand.ttc",
    "/System/Library/Fonts/Supplemental/Apple Chancery.ttf",
]


def load_script_font(size):
    for p in FONT_CANDIDATES:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    args = ap.parse_args()
    cfg = json.loads(pathlib.Path(args.config).read_text())
    ic = cfg.get("insert_card", {})
    if not ic.get("enabled"):
        print("[insert] disabled — skipping")
        return
    run = pathlib.Path(args.run_dir)
    W, H = cfg.get("width", 1080), cfg.get("height", 1920)
    fps = cfg.get("fps", 30)
    gen = run / "generated"
    gen.mkdir(parents=True, exist_ok=True)

    illo = gen / "insert-illustration.png"
    if not illo.exists():
        import fal_client
        r = fal_client.subscribe(
            ic.get("model", "fal-ai/nano-banana/edit").replace("/edit", ""),
            arguments={"prompt": ic["illustration_prompt"], "num_images": 1,
                       "output_format": "png", "aspect_ratio": "9:16"},
            with_logs=False,
        )
        urllib.request.urlretrieve(r["images"][0]["url"], illo)
        print(f"[insert] illustration -> {illo}")

    card = Image.open(illo).convert("RGB").resize((W, H), Image.LANCZOS)
    d = ImageDraw.Draw(card)
    font = load_script_font(int(W * 0.11))
    txt = ic.get("overlay_text", "happy Father's Day")
    b = d.textbbox((0, 0), txt, font=font)
    d.text(((W - (b[2] - b[0])) // 2, int(H * 0.72)), txt, font=font, fill=(60, 40, 30))
    still = gen / "insert-card-frame.png"
    card.save(still)

    fi, hold, fo = ic.get("fade_in_sec", 0.5), ic.get("hold_sec", 1.0), ic.get("fade_out_sec", 0.5)
    total = fi + hold + fo
    out = gen / "insert-card.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(still), "-t", f"{total}", "-r", str(fps),
        "-vf", f"fade=t=in:st=0:d={fi},fade=t=out:st={fi + hold}:d={fo}",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", str(out),
    ], check=True)
    print(f"[insert] {out}  ({total}s)")


if __name__ == "__main__":
    main()
