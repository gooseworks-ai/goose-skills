#!/usr/bin/env python3
"""For each beat, transform the product/cover reference into a TRUE TOP-DOWN flat
square via an image-edit model (nano-banana/edit or gpt-image-2), preserving all
art/text/names/logo. PAID (~$0.19/cover). Prompt from config.flat_cover.

Usage:  gen_flat_covers.py --config config.json --run-dir <run>
Outputs: <run>/generated/flat/<slug>.png  (one per beat)
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
    args = ap.parse_args()
    cfg = json.loads(pathlib.Path(args.config).read_text())
    run = pathlib.Path(args.run_dir)
    out = run / "generated" / "flat"
    out.mkdir(parents=True, exist_ok=True)
    fc = cfg["flat_cover"]

    for b in cfg["beats"]:
        ref = run / b["cover_ref"]
        print(f"[flat] {b['slug']}: uploading {ref}", flush=True)
        ref_url = fal_client.upload_file(str(ref))
        r = fal_client.subscribe(
            fc.get("model", "fal-ai/nano-banana/edit"),
            arguments={"prompt": fc["prompt"], "image_urls": [ref_url],
                       "num_images": 1, "output_format": "png", "aspect_ratio": "1:1"},
            with_logs=True, on_queue_update=on_q,
        )
        dst = out / f"{b['slug']}.png"
        urllib.request.urlretrieve(r["images"][0]["url"], dst)
        print(f"[flat] saved {dst} ({dst.stat().st_size // 1024} KB)", flush=True)


if __name__ == "__main__":
    main()
