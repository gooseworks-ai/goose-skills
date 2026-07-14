#!/usr/bin/env python3
"""Re-attach to an already-submitted FAL job after a backend/proxy blip.

A FAL submit BILLS immediately; if the local backend (:5999) crashes mid-poll, the
render is still running on fal — you just lost the poller. media_proxy persists each
submit's request-id, so you can re-attach here instead of re-firing (which would
double-bill). This NEVER re-submits.

  resume.py --list                              # pending (submitted, not-yet-finished) jobs
  resume.py --request-id <id>                   # poll it to completion, print the result URL
  resume.py --request-id <id> --out final.mp4   # ...and download the result
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from media_proxy import resume_fal, list_pending, download  # noqa: E402


def _result_url(result):
    if not isinstance(result, dict):
        return None
    if result.get("images"):
        return result["images"][0].get("url")
    if result.get("video"):
        return (result["video"] or {}).get("url")
    if result.get("videos"):
        return result["videos"][0].get("url")
    if result.get("audio"):
        return (result["audio"] or {}).get("url")
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="show resumable pending jobs")
    ap.add_argument("--request-id", help="the FAL request-id to re-attach to")
    ap.add_argument("--out", help="download the result to this path")
    ap.add_argument("--timeout", type=int, default=900)
    a = ap.parse_args()

    if a.list:
        pend = list_pending()
        if not pend:
            print("no pending FAL jobs")
        for j in pend:
            print(f"{j['request_id']}  {j['model_path']}  (submitted ts={j.get('ts')})")
        return 0

    if not a.request_id:
        sys.exit("pass --request-id <id> (or --list to see resumable jobs)")

    result = resume_fal(a.request_id, timeout_s=a.timeout)
    url = _result_url(result)
    print(json.dumps({"request_id": a.request_id, "url": url}))
    if a.out and url:
        download(url, a.out)
        print(f"downloaded -> {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
