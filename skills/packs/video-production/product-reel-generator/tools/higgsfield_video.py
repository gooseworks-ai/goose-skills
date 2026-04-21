"""
Higgsfield AI - Image to Video Generator
Generates product videos from still images using Higgsfield's API.

Usage:
    python tools/higgsfield_video.py --image-url <URL> --prompt <text> [--model <model>] [--duration <seconds>]

Requires API_Key_ID and API_Key_Secret in .env (project root or parent directories)
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.error
from pathlib import Path

# Load .env from the skill directory or any parent directory
def _find_and_load_env():
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    # Search upward from this script's location
    current = Path(__file__).resolve().parent
    while current != current.parent:
        env_file = current / ".env"
        if env_file.exists():
            load_dotenv(env_file)
            return
        current = current.parent

_find_and_load_env()

BASE_URL = "https://platform.higgsfield.ai"

MODELS = {
    "seedance": "bytedance/seedance/v1/pro/image-to-video",
    "kling": "kling-video/v2.1/pro/image-to-video",
    "dop": "higgsfield-ai/dop/standard",
}


def get_auth_header():
    api_key = os.getenv("API_Key_ID")
    api_secret = os.getenv("API_Key_Secret")
    if not api_key or not api_secret:
        print("Error: Set API_Key_ID and API_Key_Secret in your .env file")
        sys.exit(1)
    return f"Key {api_key}:{api_secret}"


def submit_request(image_url: str, prompt: str, model: str = "seedance", duration: int = 5):
    model_path = MODELS.get(model, model)
    url = f"{BASE_URL}/{model_path}"

    payload = {
        "prompt": prompt,
        "image_url": image_url,
    }
    if model == "dop":
        payload["duration"] = duration

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": get_auth_header(),
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            print(f"Submitted! Request ID: {result.get('request_id')}")
            print(f"Status URL: {result.get('status_url')}")
            return result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"Error {e.code}: {error_body}")
        sys.exit(1)


def check_status(request_id: str):
    url = f"{BASE_URL}/requests/{request_id}/status"
    req = urllib.request.Request(
        url,
        headers={"Authorization": get_auth_header()},
        method="GET",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def poll_until_done(request_id: str, max_wait: int = 300):
    print(f"Polling for request {request_id}...")
    start = time.time()
    while time.time() - start < max_wait:
        status = check_status(request_id)
        state = status.get("status", "unknown")
        print(f"  Status: {state}")

        if state == "completed":
            video = status.get("video", {})
            video_url = video.get("url", "")
            if video_url:
                print(f"\nVideo ready: {video_url}")
                return status
            images = status.get("images", [])
            if images:
                print(f"\nImages ready: {[img.get('url') for img in images]}")
                return status
            print(f"\nCompleted but no media found. Full response:")
            print(json.dumps(status, indent=2))
            return status

        if state in ("failed", "nsfw"):
            print(f"\nRequest {state}. Credits refunded.")
            print(json.dumps(status, indent=2))
            return status

        time.sleep(10)

    print(f"\nTimed out after {max_wait}s. Check manually with request ID: {request_id}")
    return None


def download_video(url: str, output_path: str):
    print(f"Downloading to {output_path}...")
    urllib.request.urlretrieve(url, output_path)
    print(f"Saved: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate video from image using Higgsfield API")
    parser.add_argument("--image-url", required=True, help="URL of the source image")
    parser.add_argument("--prompt", required=True, help="Motion/animation description")
    parser.add_argument("--model", default="seedance", choices=list(MODELS.keys()), help="Model to use")
    parser.add_argument("--duration", type=int, default=5, help="Duration in seconds (dop model only)")
    parser.add_argument("--output", default=None, help="Output file path")
    parser.add_argument("--no-poll", action="store_true", help="Submit and exit without polling")
    parser.add_argument("--check", default=None, help="Check status of existing request ID")
    args = parser.parse_args()

    if args.check:
        status = check_status(args.check)
        print(json.dumps(status, indent=2))
        return

    result = submit_request(args.image_url, args.prompt, args.model, args.duration)

    if args.no_poll:
        return

    request_id = result.get("request_id")
    if not request_id:
        print("No request_id returned. Full response:")
        print(json.dumps(result, indent=2))
        return

    final = poll_until_done(request_id)

    if final and final.get("status") == "completed":
        video_url = final.get("video", {}).get("url")
        if video_url:
            output = args.output or f"higgsfield_{request_id[:8]}.mp4"
            os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
            download_video(video_url, output)


if __name__ == "__main__":
    main()
