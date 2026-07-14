#!/usr/bin/env python3
"""Generate a single Seedance 2.0 reference-to-video clip via the GooseWorks FAL proxy.

Endpoint: bytedance/seedance-2.0/reference-to-video  (a ByteDance third-party model —
note NO `fal-ai/` prefix, same as bytedance/seedream/... and openai/gpt-image-2).

Routed through media_proxy (bills the Ads agent). Your agent/`cal_` token is NOT a FAL
key, so the old direct `load_fal_key()`/`subscribe()` path 401'd — this capability now
uses the same proxy every other media capability does.

Native lip-synced VO + ambient audio (generate_audio=true). Multi-image reference input
(avatar + product, up to 9 refs). Internal multi-cut handling inside one 15s call.

Hard rules:
- NEVER pass AI-generated video as video refs (content_policy_violation)
- NSFW / partner-validation reject → surface and exit; do NOT auto-retry
- duration must be a STRING per FAL schema
- image refs must be PUBLIC URLs — the proxy does not upload local files. The
  orchestrator hosts local refs via MCP get_upload_url -> get_download_url and passes
  the URL here (identical to create-video-fal).

Usage:
    generate.py --prompt "..." --output PATH --image-url URL [--image-url URL ...]
                [--resolution 1080p] [--duration 15] [--aspect-ratio 9:16]
                [--generate-audio | --no-generate-audio] [--seed N]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from media_proxy import _fal_run, download  # bundled; routes+bills through the proxy

MODEL = "bytedance/seedance-2.0/reference-to-video"

# Pricing per second (USD), 2026-05
PRICE_PER_SEC = {"480p": 0.18, "720p": 0.30, "1080p": 0.68}


def _looks_like_url(s: str) -> bool:
    return s.startswith("http://") or s.startswith("https://")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--image-url", "--image-ref", action="append", dest="image_urls", default=[],
                    help="PUBLIC reference image URL (repeatable). Order matters — first = @Image1.")
    ap.add_argument("--resolution", default="1080p", choices=["480p", "720p", "1080p"])
    ap.add_argument("--duration", type=int, default=15, choices=list(range(4, 16)))
    ap.add_argument("--aspect-ratio", default="9:16",
                    choices=["9:16", "16:9", "1:1", "4:3", "3:4", "21:9"])
    grp = ap.add_mutually_exclusive_group()
    grp.add_argument("--generate-audio", dest="generate_audio", action="store_true",
                     help="Generate native lip-synced VO + ambient audio (default).")
    grp.add_argument("--no-generate-audio", dest="generate_audio", action="store_false",
                     help="Silent clip (VO added in post).")
    ap.set_defaults(generate_audio=True)
    ap.add_argument("--seed", type=int, default=None)
    args = ap.parse_args()

    if not args.image_urls:
        sys.exit("ERROR: at least one --image-url is required for reference-to-video.")
    if len(args.image_urls) > 9:
        sys.exit(f"ERROR: max 9 image references per call (got {len(args.image_urls)}).")
    local = [u for u in args.image_urls if not _looks_like_url(u)]
    if local:
        sys.exit("ERROR: image refs must be PUBLIC URLs (the proxy does not upload local files). "
                 "Host each local ref via MCP get_upload_url -> get_download_url and pass the URL. "
                 f"Got local path(s): {local}")

    payload: dict = {
        "prompt": args.prompt,
        "image_urls": args.image_urls,
        "resolution": args.resolution,
        "duration": str(args.duration),  # FAL schema requires string
        "aspect_ratio": args.aspect_ratio,
        "generate_audio": args.generate_audio,
    }
    if args.seed is not None:
        payload["seed"] = args.seed

    print(f"[seedance-2-fal] submitting {MODEL} via proxy ({args.aspect_ratio}, "
          f"{args.duration}s, {args.resolution}, "
          f"audio={'on' if args.generate_audio else 'off'}, "
          f"{len(args.image_urls)} ref{'s' if len(args.image_urls) > 1 else ''})...", flush=True)

    try:
        result = _fal_run(MODEL, payload, timeout_s=900)
    except RuntimeError as e:
        msg = str(e).lower()
        if "content_policy_violation" in msg or "partner_validation" in msg:
            print(f"ERROR: FAL content-policy / partner-validation reject. Surface to user — "
                  f"do NOT auto-retry.\n{e}", file=sys.stderr)
            return 3
        if "nsfw" in msg:
            print(f"ERROR: FAL NSFW classifier reject. Surface to user — do NOT auto-retry.\n{e}",
                  file=sys.stderr)
            return 4
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    video = result.get("video") if isinstance(result, dict) else None
    video_url = video.get("url") if isinstance(video, dict) else None
    if not video_url:
        sys.exit(f"ERROR: no video URL in result: {result}")

    seed_returned = result.get("seed")
    cost = PRICE_PER_SEC.get(args.resolution, 0.0) * args.duration

    print(f"[seedance-2-fal] downloading -> {args.output.name}", flush=True)
    download(video_url, str(args.output))
    size = args.output.stat().st_size if args.output.exists() else 0
    print(f"[seedance-2-fal] wrote {size} bytes  seed={seed_returned}", flush=True)

    meta = {
        "gateway": "fal-proxy",
        "model": MODEL,
        "prompt": args.prompt,
        "image_urls": args.image_urls,
        "resolution": args.resolution,
        "duration": args.duration,
        "aspect_ratio": args.aspect_ratio,
        "generate_audio": args.generate_audio,
        "seed": seed_returned,
        "video_url": video_url,
        "cost_estimate_usd": round(cost, 2),
    }
    Path(str(args.output) + ".meta.json").write_text(json.dumps(meta, indent=2))
    print(f"[seedance-2-fal] est cost: ${cost:.2f}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
