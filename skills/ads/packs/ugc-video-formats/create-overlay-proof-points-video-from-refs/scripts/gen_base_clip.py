#!/usr/bin/env python3
"""Generate the handheld base clip: nano-banana keyframe (hand holds product) ->
kling i2v (subtle handheld breathing). Both prompts come from config.json.

PAID. Gate before running (see SKILL.md Phase 1/2). ~$0.05 keyframe + ~$0.30 i2v.

Usage:  gen_base_clip.py --config config.json --run-dir <run>
Outputs: <run>/generated/keyframe-hand-product.png, <run>/generated/clip-handheld.mp4
"""
import argparse
import json
import os
import pathlib
import urllib.request

os.environ["FAL_KEY"] = os.environ.get("FAL_KEY") or os.environ["FAL_API_KEY"]
import fal_client  # noqa: E402


def on_q(u):
    for m in getattr(u, "logs", None) or []:
        print(f"  {m.get('message', '')}", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--skip-keyframe", action="store_true",
                    help="reuse an existing keyframe-hand-product.png")
    args = ap.parse_args()

    cfg = json.loads(pathlib.Path(args.config).read_text())
    run = pathlib.Path(args.run_dir)
    gen = run / "generated"
    gen.mkdir(parents=True, exist_ok=True)
    keyframe = gen / "keyframe-hand-product.png"
    clip = gen / "clip-handheld.mp4"
    dur = str(cfg.get("duration_sec", 10))

    if not args.skip_keyframe:
        product = run / cfg["product_ref"]
        print(f"[gen] uploading product ref: {product}", flush=True)
        product_url = fal_client.upload_file(str(product))
        print("[gen] submitting nano-banana edit (keyframe)...", flush=True)
        r = fal_client.subscribe(
            cfg["keyframe"].get("model", "fal-ai/nano-banana/edit"),
            arguments={
                "prompt": cfg["keyframe"]["prompt"],
                "image_urls": [product_url],
                "num_images": 1,
                "output_format": "png",
                "aspect_ratio": "9:16",
            },
            with_logs=True, on_queue_update=on_q,
        )
        urllib.request.urlretrieve(r["images"][0]["url"], keyframe)
        print(f"[gen] saved keyframe: {keyframe} ({keyframe.stat().st_size // 1024} KB)", flush=True)

    print("[i2v] uploading keyframe...", flush=True)
    img_url = fal_client.upload_file(str(keyframe))
    print(f"[i2v] submitting kling i2v ({dur}s)...", flush=True)
    r = fal_client.subscribe(
        cfg["i2v"].get("model", "fal-ai/kling-video/v2.1/standard/image-to-video"),
        arguments={
            "prompt": cfg["i2v"]["prompt"],
            "image_url": img_url,
            "duration": dur,
            "negative_prompt": cfg["i2v"].get("negative_prompt", ""),
            "cfg_scale": cfg["i2v"].get("cfg_scale", 0.5),
        },
        with_logs=True, on_queue_update=on_q,
    )
    urllib.request.urlretrieve(r["video"]["url"], clip)
    print(f"[i2v] saved clip: {clip} ({clip.stat().st_size // 1024} KB)", flush=True)


if __name__ == "__main__":
    main()
