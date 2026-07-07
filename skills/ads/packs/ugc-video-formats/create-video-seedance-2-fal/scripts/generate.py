#!/usr/bin/env python3
"""Generate a single Seedance 2.0 reference-to-video clip via FAL.

Endpoint: bytedance/seedance-2.0/reference-to-video

Native lip-synced VO + ambient audio (generate_audio=true). Multi-image reference
input (avatar + product, up to 4-9 image refs). Internal multi-cut handling
within a single render — prompt can define WIDE HOOK / PRODUCT HERO / SIDESTEP /
REACTION sub-scenes inside one 15s call.

Hard rules:
- NEVER pass AI-generated video as video_urls (content_policy_violation)
- NSFW reject → surface and exit; do NOT auto-retry
- duration must be a STRING per FAL schema

Usage:
    generate.py --prompt "..." --output PATH --image-ref PATH [--image-ref PATH ...]
                [--resolution 1080p] [--duration 15] [--aspect-ratio 9:16]
                [--generate-audio | --no-generate-audio] [--seed N] [--with-logs]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

SHARED = Path(__file__).resolve().parents[3] / "_shared"
sys.path.insert(0, str(SHARED))

from fal_helpers import (  # noqa: E402
    download,
    is_error_response,
    load_fal_key,
    subscribe,
    upload_file,
    write_meta,
)

MODEL = "bytedance/seedance-2.0/reference-to-video"

# Pricing per second (USD), 2026-05
PRICE_PER_SEC = {
    "480p": 0.18,
    "720p": 0.30,
    "1080p": 0.68,
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--image-ref", action="append", type=Path, default=[],
                    help="Reference image (repeatable). Order matters — first ref = @Image1.")
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
    ap.add_argument("--with-logs", action="store_true")
    args = ap.parse_args()

    if not args.image_ref:
        sys.exit("ERROR: at least one --image-ref is required for reference-to-video.")
    if len(args.image_ref) > 9:
        sys.exit(f"ERROR: max 9 image references per call (got {len(args.image_ref)}).")

    load_fal_key()

    image_urls: list[str] = []
    for ref in args.image_ref:
        if not ref.exists():
            sys.exit(f"ERROR: image-ref not found: {ref}")
        print(f"[seedance-2-fal] uploading ref: {ref.name}", flush=True)
        image_urls.append(upload_file(ref))

    payload: dict = {
        "prompt": args.prompt,
        "image_urls": image_urls,
        "resolution": args.resolution,
        "duration": str(args.duration),  # FAL schema requires string
        "aspect_ratio": args.aspect_ratio,
        "generate_audio": args.generate_audio,
    }
    if args.seed is not None:
        payload["seed"] = args.seed

    print(f"[seedance-2-fal] submitting {MODEL} ({args.aspect_ratio}, "
          f"{args.duration}s, {args.resolution}, "
          f"audio={'on' if args.generate_audio else 'off'}, "
          f"{len(image_urls)} ref{'s' if len(image_urls) > 1 else ''})...", flush=True)

    try:
        result = subscribe(
            MODEL, payload, with_logs=args.with_logs,
            on_log=lambda m: print(f"  [fal] {m}", flush=True) if args.with_logs else None,
        )
    except RuntimeError as e:
        msg = str(e)
        if "content_policy_violation" in msg.lower() or "partner_validation_failed" in msg.lower():
            print(f"ERROR: FAL content-policy reject. Surface to user — do NOT auto-retry.\n{msg}",
                  file=sys.stderr)
            sys.exit(3)
        if "nsfw" in msg.lower():
            print(f"ERROR: FAL NSFW classifier reject. Surface to user — do NOT auto-retry.\n{msg}",
                  file=sys.stderr)
            sys.exit(4)
        raise

    err, reason = is_error_response(result)
    if err:
        if "nsfw" in reason.lower() or "policy" in reason.lower():
            print(f"ERROR: FAL moderation reject — surface, do NOT auto-retry: {reason}",
                  file=sys.stderr)
            sys.exit(4)
        sys.exit(f"ERROR: fal returned error response: {reason}")

    video = result.get("video") or {}
    video_url = video.get("url") if isinstance(video, dict) else None
    if not video_url:
        sys.exit(f"ERROR: no video URL in result: {result}")

    seed_returned = result.get("seed")
    cost = PRICE_PER_SEC.get(args.resolution, 0.0) * args.duration

    print(f"[seedance-2-fal] downloading → {args.output.name}", flush=True)
    size = download(video_url, args.output, min_bytes=10_000)
    print(f"[seedance-2-fal] wrote {size} bytes  seed={seed_returned}", flush=True)

    write_meta(
        args.output,
        gateway="fal",
        model=MODEL,
        prompt=args.prompt,
        image_refs=[str(p) for p in args.image_ref],
        resolution=args.resolution,
        duration=args.duration,
        aspect_ratio=args.aspect_ratio,
        generate_audio=args.generate_audio,
        seed=seed_returned,
        video_url=video_url,
        result_meta={k: v for k, v in (result or {}).items() if k != "video"},
        cost_estimate_usd=round(cost, 2),
    )
    print(f"[seedance-2-fal] est cost: ${cost:.2f}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
