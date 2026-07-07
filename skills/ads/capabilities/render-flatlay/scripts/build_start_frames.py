#!/usr/bin/env python3
"""Composite each flat cover onto the dressed tabletop plate → the Veo start frame
(PIL, free). The tabletop_bg already carries the linen + dressing (branches, props);
this just centers the flat product on it at a natural size.

Usage:  build_start_frames.py --config config.json --run-dir <run>
Outputs: <run>/generated/start/<slug>.png  (one per beat, canvas size)
"""
import argparse
import json
import pathlib

from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--cover-scale", type=float, default=0.52,
                    help="flat cover width as a fraction of canvas width")
    args = ap.parse_args()
    cfg = json.loads(pathlib.Path(args.config).read_text())
    run = pathlib.Path(args.run_dir)
    W, H = cfg.get("width", 1080), cfg.get("height", 1920)
    flat = run / "generated" / "flat"
    out = run / "generated" / "start"
    out.mkdir(parents=True, exist_ok=True)

    bg = Image.open(run / cfg["tabletop_bg"]).convert("RGB").resize((W, H), Image.LANCZOS)

    for b in cfg["beats"]:
        cover = Image.open(flat / f"{b['slug']}.png").convert("RGBA")
        tw = int(W * args.cover_scale)
        th = int(tw * cover.height / cover.width)
        cover = cover.resize((tw, th), Image.LANCZOS)
        frame = bg.copy().convert("RGBA")
        frame.alpha_composite(cover, ((W - tw) // 2, (H - th) // 2))
        dst = out / f"{b['slug']}.png"
        frame.convert("RGB").save(dst)
        print(f"[start] {dst}  cover {tw}x{th} centered on {W}x{H}")


if __name__ == "__main__":
    main()
