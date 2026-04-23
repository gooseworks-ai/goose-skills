"""
Creatify API - UGC Video Generator Helper

Handles API interactions with Creatify for generating UGC-style talking head videos.
Used by the ugc-video-generator skill.

Usage:
    # List avatars (filtered for UGC style)
    python scripts/creatify_api.py avatars --gender f --style selfie

    # List voices (filtered by gender and accent)
    python scripts/creatify_api.py voices --gender female --accent american

    # Generate a video
    python scripts/creatify_api.py generate \
        --text "Your script here" \
        --creator <persona-id> \
        --accent <voice-accent-id> \
        --model aurora_v1_fast \
        --output video.mp4

    # Check status of a generation
    python scripts/creatify_api.py status --id <task-id>

Requires CREATIFY_API_ID and CREATIFY_API_KEY in .env
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error
from pathlib import Path


def _find_and_load_env():
    """Walk up from script location to find and load .env file."""
    current = Path(__file__).resolve().parent
    while current != current.parent:
        env_file = current / ".env"
        if env_file.exists():
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        key, _, value = line.partition("=")
                        os.environ.setdefault(key.strip(), value.strip())
            return
        current = current.parent


_find_and_load_env()

BASE_URL = "https://api.creatify.ai"
API_ID = os.getenv("CREATIFY_API_ID")
API_KEY = os.getenv("CREATIFY_API_KEY")


def api_request(method, endpoint, data=None):
    """Make an authenticated request to the Creatify API."""
    if not API_ID or not API_KEY:
        print("Error: CREATIFY_API_ID and CREATIFY_API_KEY must be set in .env")
        sys.exit(1)

    url = f"{BASE_URL}{endpoint}"
    headers = {
        "X-API-ID": API_ID,
        "X-API-KEY": API_KEY,
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"API Error {e.code}: {error_body}", file=sys.stderr)
        sys.exit(1)


def list_avatars(gender=None, style=None, age_range=None, limit=20):
    """List available avatars, filtered for UGC suitability."""
    personas = api_request("GET", "/api/personas/")

    filtered = []
    for p in personas:
        if not p.get("is_active"):
            continue
        if style and p.get("style") != style:
            continue
        if gender and p.get("gender") != gender:
            continue
        if age_range and p.get("age_range") != age_range:
            continue
        filtered.append(p)

    # Sort by UGC suitability: selfie > ugc > presenter
    style_priority = {"selfie": 0, "ugc": 1, "presenter": 2}
    filtered.sort(key=lambda p: style_priority.get(p.get("style", ""), 99))

    for p in filtered[:limit]:
        industries = ", ".join((p.get("suitable_industries") or [])[:3])
        scene = p.get("video_scene") or "N/A"
        print(
            f"{p['id']}  |  {p.get('creator_name', 'Unknown'):15s}  |  "
            f"{p.get('gender', '?')}  |  {p.get('style', '?'):10s}  |  "
            f"{p.get('age_range', '?'):10s}  |  {scene[:30]:30s}  |  {industries}"
        )

    print(f"\nShowing {min(limit, len(filtered))} of {len(filtered)} matching avatars")
    return filtered[:limit]


def list_voices(gender=None, accent_filter=None, limit=20):
    """List available voices, filtered by gender and accent."""
    voices = api_request("GET", "/api/voices/")

    results = []
    for v in voices:
        v_gender = v.get("gender") or ""
        if gender and gender.lower() not in v_gender.lower():
            continue

        for a in v.get("accents") or []:
            accent_name = a.get("accent_name") or ""
            if accent_filter and accent_filter.lower() not in accent_name.lower():
                continue
            results.append({
                "name": v.get("name", "Unknown"),
                "gender": v_gender,
                "accent_name": accent_name,
                "accent_id": a.get("id", ""),
                "preview_url": a.get("preview_url", ""),
            })

    for r in results[:limit]:
        print(
            f"{r['accent_id']}  |  {r['name']:20s}  |  "
            f"{r['gender']:8s}  |  {r['accent_name']}"
        )

    print(f"\nShowing {min(limit, len(results))} of {len(results)} matching voices")
    return results[:limit]


def generate_video(text=None, audio=None, creator=None, accent=None,
                   model="aurora_v1_fast", aspect_ratio="9:16",
                   no_caption=False, no_music=True, output_path=None):
    """Submit a video generation request and poll until complete."""
    payload = {
        "aspect_ratio": aspect_ratio,
        "model_version": model,
        "no_caption": no_caption,
        "no_music": no_music,
    }

    if audio:
        payload["audio"] = audio
    elif text:
        payload["text"] = text
    else:
        print("Error: Either --text or --audio is required", file=sys.stderr)
        sys.exit(1)

    if creator:
        payload["creator"] = creator
    if accent:
        payload["accent"] = accent

    # Submit
    result = api_request("POST", "/api/lipsyncs/", payload)
    task_id = result["id"]
    print(f"Task submitted: {task_id}")
    print(f"Status: {result.get('status', 'unknown')}")

    # Poll
    while True:
        time.sleep(10)
        status = api_request("GET", f"/api/lipsyncs/{task_id}/")
        current = status.get("status", "unknown")
        progress = status.get("progress", 0)
        print(f"  Status: {current} | Progress: {progress:.0%}")

        if current == "done":
            output_url = status.get("output", "")
            credits = status.get("credits_used", 0)
            duration = status.get("duration", 0)
            print(f"\n  Video ready: {output_url}")
            print(f"  Duration: {duration}s")
            print(f"  Credits used: {credits}")

            # Download if output path specified
            if output_path and output_url:
                print(f"  Downloading to: {output_path}")
                urllib.request.urlretrieve(output_url, output_path)
                print(f"  Downloaded: {output_path}")

            return {
                "id": task_id,
                "status": "done",
                "url": output_url,
                "duration": duration,
                "credits_used": credits,
            }

        if current == "failed":
            reason = status.get("failed_reason", "Unknown error")
            print(f"\n  FAILED: {reason}", file=sys.stderr)
            return {
                "id": task_id,
                "status": "failed",
                "error": reason,
            }


def check_status(task_id):
    """Check the status of a generation task."""
    status = api_request("GET", f"/api/lipsyncs/{task_id}/")
    print(json.dumps(status, indent=2, default=str))
    return status


def main():
    parser = argparse.ArgumentParser(description="Creatify API helper for UGC video generation")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # avatars
    avatars_parser = subparsers.add_parser("avatars", help="List available avatars")
    avatars_parser.add_argument("--gender", choices=["f", "m"], help="Filter by gender")
    avatars_parser.add_argument("--style", default="selfie", help="Filter by style (default: selfie)")
    avatars_parser.add_argument("--age", default=None, help="Filter by age range")
    avatars_parser.add_argument("--limit", type=int, default=20, help="Max results")

    # voices
    voices_parser = subparsers.add_parser("voices", help="List available voices")
    voices_parser.add_argument("--gender", help="Filter by gender (female/male)")
    voices_parser.add_argument("--accent", default="american", help="Filter by accent (default: american)")
    voices_parser.add_argument("--limit", type=int, default=20, help="Max results")

    # generate
    gen_parser = subparsers.add_parser("generate", help="Generate a video")
    gen_parser.add_argument("--text", help="Script text for voiceover")
    gen_parser.add_argument("--audio", help="Audio file URL (overrides text)")
    gen_parser.add_argument("--creator", help="Persona UUID")
    gen_parser.add_argument("--accent", help="Voice accent UUID")
    gen_parser.add_argument("--model", default="aurora_v1_fast",
                           choices=["standard", "aurora_v1_fast", "aurora_v1"])
    gen_parser.add_argument("--ratio", default="9:16", help="Aspect ratio")
    gen_parser.add_argument("--captions", action="store_true", default=True,
                           help="Enable captions (default: on)")
    gen_parser.add_argument("--no-captions", action="store_true", help="Disable captions")
    gen_parser.add_argument("--music", action="store_true", help="Enable background music")
    gen_parser.add_argument("--output", help="Output file path")

    # status
    status_parser = subparsers.add_parser("status", help="Check generation status")
    status_parser.add_argument("--id", required=True, help="Task ID")

    args = parser.parse_args()

    if args.command == "avatars":
        list_avatars(gender=args.gender, style=args.style,
                    age_range=args.age, limit=args.limit)
    elif args.command == "voices":
        list_voices(gender=args.gender, accent_filter=args.accent,
                   limit=args.limit)
    elif args.command == "generate":
        generate_video(
            text=args.text,
            audio=args.audio,
            creator=args.creator,
            accent=args.accent,
            model=args.model,
            aspect_ratio=args.ratio,
            no_caption=args.no_captions,
            no_music=not args.music,
            output_path=args.output,
        )
    elif args.command == "status":
        check_status(args.id)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
