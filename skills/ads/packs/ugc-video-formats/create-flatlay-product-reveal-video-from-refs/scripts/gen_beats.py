#!/usr/bin/env python3
"""Animate each start frame into a hands-cup-and-lift beat via Veo 3.1 i2v.
PAID (~$0.80/beat). Prompt from config.beat_i2v. Veo preserves start-frame geometry
and holds the cover art readable (why Veo, not Seedance — Seedance defaulted to
portrait crop + smeared the cover).

Usage:  gen_beats.py --config config.json --run-dir <run>
Outputs: <run>/generated/beats/<slug>.mp4  (one per beat, ~4s native)
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
    start = run / "generated" / "start"
    out = run / "generated" / "beats"
    out.mkdir(parents=True, exist_ok=True)
    b2v = cfg["beat_i2v"]

    for b in cfg["beats"]:
        sf = start / f"{b['slug']}.png"
        print(f"[beat] {b['slug']}: uploading start frame {sf}", flush=True)
        img_url = fal_client.upload_file(str(sf))
        r = fal_client.subscribe(
            b2v.get("model", "fal-ai/veo3/image-to-video"),
            arguments={"prompt": b2v["prompt"], "image_url": img_url,
                       "duration": str(b2v.get("duration_sec", 4)), "aspect_ratio": "9:16"},
            with_logs=True, on_queue_update=on_q,
        )
        dst = out / f"{b['slug']}.mp4"
        urllib.request.urlretrieve(r["video"]["url"], dst)
        print(f"[beat] saved {dst} ({dst.stat().st_size // 1024} KB)", flush=True)


if __name__ == "__main__":
    main()
