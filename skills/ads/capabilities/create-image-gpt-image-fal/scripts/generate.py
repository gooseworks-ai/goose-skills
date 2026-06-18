#!/usr/bin/env python3
"""Generate a single image with OpenAI gpt-image via fal.ai.

Supports two models:
  - gpt-image-1 (default): fal-ai/gpt-image-1 — fixed output sizes only.
  - gpt-image-2:           openai/gpt-image-2 — supports custom output sizes
                           (multiples of 16, up to 3840px).

Routes to text-to-image or the edit variant depending on whether a reference
image is supplied.

The gpt-image-1 default is preserved for backward compatibility: existing
callers (e.g. video-orchestrator/lock-character) keep the same behavior and the
same model unless they explicitly opt into gpt-image-2.

Usage:
    generate.py --prompt "..." --output PATH
                [--model gpt-image-1|gpt-image-2]
                [--aspect-ratio 9:16] [--image-size WxH] [--quality medium]
                [--ref-image PATH ...]   # repeatable; identity ref first, then style refs
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# fal_helpers is vendored next to this script so the skill is self-contained —
# it works when fetched/installed standalone (the DB/CLI path), not only in a
# full-tree sandbox checkout.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fal_helpers import (  # noqa: E402
    download,
    is_error_response,
    load_fal_key,
    subscribe,
    upload_file,
    write_meta,
)

# Per-model config. `custom_size` says whether the model accepts arbitrary
# width/height; gpt-image-1 only supports a fixed set of sizes.
MODELS = {
    "gpt-image-1": {
        "t2i": "fal-ai/gpt-image-1/text-to-image",
        "edit": "fal-ai/gpt-image-1/edit-image",
        "custom_size": False,
        # gpt-image-1 only supports these three output sizes.
        "size_by_ar": {
            "9:16": (1024, 1536), "16:9": (1536, 1024), "1:1": (1024, 1024),
            "2:3": (1024, 1536), "3:2": (1536, 1024),
        },
        "cost_by_quality": {"low": 0.04, "medium": 0.08, "high": 0.20},
    },
    "gpt-image-2": {
        "t2i": "openai/gpt-image-2",
        "edit": "openai/gpt-image-2/edit",
        "custom_size": True,
        "size_by_ar": {
            "9:16": (1024, 1536), "16:9": (1536, 1024), "1:1": (1024, 1024),
            "2:3": (1024, 1536), "3:2": (1536, 1024),
            "3:4": (1536, 2048), "4:3": (2048, 1536), "4:5": (1024, 1280),
        },
        # gpt-image-2 is token-priced; these are rough per-image estimates.
        "cost_by_quality": {"low": 0.02, "medium": 0.07, "high": 0.19},
    },
}


def _round16(n: int) -> int:
    """Round to the nearest positive multiple of 16 (fal custom-size rule)."""
    return max(16, int(round(n / 16)) * 16)


def _parse_size(spec: str) -> tuple[int, int]:
    """Parse a 'WxH' string into an (int, int) pair."""
    try:
        w, h = spec.lower().split("x")
        return int(w), int(h)
    except Exception:
        sys.exit(f"ERROR: --image-size must be WIDTHxHEIGHT (e.g. 1728x2304), got: {spec}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--model", default="gpt-image-1", choices=list(MODELS),
                    help="gpt-image-1 (default, fixed sizes) or gpt-image-2 (custom sizes).")
    ap.add_argument("--aspect-ratio", default="9:16",
                    help="Used when --image-size is not given.")
    ap.add_argument("--image-size", default=None,
                    help="Explicit WIDTHxHEIGHT. gpt-image-2 only; ignored with a warning on gpt-image-1.")
    ap.add_argument("--quality", default="medium", choices=["low", "medium", "high"])
    ap.add_argument("--ref-image", action="append", type=Path, default=[],
                    help="Reference image for the edit variant. Repeatable; "
                         "all refs are uploaded and passed as image_urls.")
    ap.add_argument("--with-logs", action="store_true")
    args = ap.parse_args()

    load_fal_key()

    cfg = MODELS[args.model]

    # Resolve the output size.
    if args.image_size:
        w, h = _parse_size(args.image_size)
        if not cfg["custom_size"]:
            allowed = sorted({f"{x}x{y}" for x, y in cfg["size_by_ar"].values()})
            print(f"[gpt-image-fal] WARNING: {args.model} ignores custom --image-size; "
                  f"falling back to aspect-ratio mapping. Allowed sizes: {allowed}", flush=True)
            w, h = cfg["size_by_ar"].get(args.aspect_ratio, (1024, 1536))
        else:
            w, h = _round16(w), _round16(h)
            if max(w, h) > 3840:
                sys.exit(f"ERROR: image size exceeds 3840px limit: {w}x{h}")
    else:
        wh = cfg["size_by_ar"].get(args.aspect_ratio)
        if not wh:
            sys.exit(f"ERROR: unsupported aspect ratio for {args.model}: {args.aspect_ratio}. "
                     f"Supported: {list(cfg['size_by_ar'])}")
        w, h = wh

    # gpt-image-1 wants an "WxH" string; gpt-image-2 accepts a {width,height} object.
    image_size: object = {"width": w, "height": h} if cfg["custom_size"] else f"{w}x{h}"

    payload: dict = {
        "prompt": args.prompt,
        "image_size": image_size,
        "quality": args.quality,
        "num_images": 1,
    }

    if args.ref_image:
        image_urls: list[str] = []
        for ref in args.ref_image:
            if not ref.exists():
                sys.exit(f"ERROR: ref-image not found: {ref}")
            print(f"[gpt-image-fal] uploading ref: {ref.name}", flush=True)
            image_urls.append(upload_file(ref))
        payload["image_urls"] = image_urls
        model = cfg["edit"]
    else:
        model = cfg["t2i"]

    print(f"[gpt-image-fal] submitting {model} ({w}x{h}, q={args.quality})...", flush=True)
    result = subscribe(model, payload, with_logs=args.with_logs,
                       on_log=lambda m: print(f"  [fal] {m}", flush=True) if args.with_logs else None)

    err, reason = is_error_response(result)
    if err:
        sys.exit(f"ERROR: fal returned error response: {reason}")

    images = result.get("images") or []
    if not images:
        sys.exit(f"ERROR: no images in result: {result}")
    image_url = images[0].get("url")
    if not image_url:
        sys.exit(f"ERROR: no url in first image: {images[0]}")

    print(f"[gpt-image-fal] downloading to {args.output}...", flush=True)
    nbytes = download(image_url, args.output)
    print(f"[gpt-image-fal] wrote {nbytes} bytes", flush=True)

    cost = cfg["cost_by_quality"][args.quality]
    write_meta(
        args.output,
        gateway="fal",
        model=model,
        model_family=args.model,
        prompt=args.prompt,
        aspect_ratio=args.aspect_ratio,
        image_size=f"{w}x{h}",
        quality=args.quality,
        ref_images=[str(r) for r in args.ref_image] if args.ref_image else None,
        image_url=image_url,
        request=payload,
        result_meta={k: v for k, v in (result or {}).items() if k != "images"},
        cost_estimate_usd=cost,
    )
    print(f"[gpt-image-fal] est cost: ${cost:.2f}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
