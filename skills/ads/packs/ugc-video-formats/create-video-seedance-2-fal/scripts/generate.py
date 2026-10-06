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
- Policy rejection (likeness of a real person, content_policy_violation,
  partner_validation_failed) → exit 3; NSFW / safety checker → exit 4. Both mean
  "surface, do not retry": one submit, never an automatic retry. The reason, request id
  and charge state are printed and written to <output>.rejection.json, and media_proxy
  records the exact request so an identical re-run is refused (exit 3/4 again) without
  any network call. Change the inputs (image, prompt, model) to try again.
- duration must be an INT for bytedance/seedance-2.0/reference-to-video (enum {auto,4..15}); a string 400s (invalid_request)
- image refs must be PUBLIC URLs — the proxy does not upload local files. The
  orchestrator hosts local refs via MCP get_upload_url -> get_download_url and passes
  the URL here (identical to create-video-fal).

Usage:
    generate.py --prompt "..." --output PATH --image-url URL [--image-url URL ...]
                [--resolution 1080p] [--duration 15] [--aspect-ratio 9:16]
                [--generate-audio | --no-generate-audio] [--seed N] [--input-digest D]

Exit codes: 0 done; 1 other error; 3 policy rejection (or an identical request that was
already rejected); 4 NSFW / safety-checker rejection. (The MCP relay also exits 3 when it
needs the agent to make a call; it prints "[mcp-relay]" instead of "surface, do not retry".)
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from media_proxy import FalPolicyRejection, POLICY_EXIT, _fal_run, download  # bundled; routes+bills through the proxy

MODEL = "bytedance/seedance-2.0/reference-to-video"

# Pricing per second (USD), 2026-05
PRICE_PER_SEC = {"480p": 0.18, "720p": 0.30, "1080p": 0.68}
NSFW_EXIT = 4


def _report_rejection(e: FalPolicyRejection, output: Path) -> int:
    """Print the rejection for the user and keep it next to the output. One submit only:
    never retried here, and the ledger refuses the identical request on a re-run."""
    code = NSFW_EXIT if e.kind == "nsfw" else POLICY_EXIT
    what = ("already rejected: nothing was sent" if e.from_ledger
            else "rejected by the provider")
    print(f"ERROR: surface, do not retry. {MODEL} {what}.\n"
          f"  reason:     {e.reason}\n"
          f"  type:       {e.error_type or e.kind}\n"
          f"  request id: {e.request_id or 'none returned'}\n"
          f"  charge:     {e.charge_note}\n"
          f"Tell the user, keep this reason, and offer a permitted alternative with its cost "
          f"(an original character, a user-cleared reference, or a non-likeness route). "
          f"Change the inputs (image, prompt, model) to try again.\n{e}", file=sys.stderr)
    try:
        Path(str(output) + ".rejection.json").write_text(json.dumps(
            {**e.as_dict(), "exit_code": code}, indent=2))
    except OSError:
        pass
    return code


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
    ap.add_argument("--input-digest", default=None,
                    help="Stable id of the inputs (media_proxy.input_digest over the refs' "
                         "ingredient keys / file hashes, not their URLs). Optional: lets a "
                         "re-hosted identical ref still match a recorded rejection, and the "
                         "proxy re-attach to a running job instead of paying twice.")
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
        "duration": args.duration,  # INT — bytedance/seedance-2.0/reference-to-video enum {auto,4..15}; a STRING 400s (invalid_request), validated 2026-07-18
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
        # Default poll timeout for video (1800s). A timeout raises FalPollTimeout with the
        # request_id — resume it (media-proxy resume.py), never resubmit (GOOSE-3729).
        # A request the provider already refused raises FalPolicyRejection before any
        # network call (media_proxy's rejected-request ledger).
        result = _fal_run(MODEL, payload, input_digest=args.input_digest)
    except FalPolicyRejection as e:
        return _report_rejection(e, args.output)
    except RuntimeError as e:
        msg = str(e).lower()
        if "content_policy_violation" in msg or "partner_validation" in msg:
            print(f"ERROR: surface, do not retry. FAL content-policy / partner-validation "
                  f"reject.\n{e}", file=sys.stderr)
            return POLICY_EXIT
        if "nsfw" in msg:
            print(f"ERROR: surface, do not retry. FAL NSFW classifier reject.\n{e}",
                  file=sys.stderr)
            return NSFW_EXIT
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
    Path(str(args.output) + ".rejection.json").unlink(missing_ok=True)  # stale from older inputs
    print(f"[seedance-2-fal] est cost: ${cost:.2f}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
