#!/usr/bin/env python3
"""
Fetch YouTube transcripts via APIFY API with local caching.

Usage:
    python3 fetch_transcript.py "https://youtube.com/watch?v=VIDEO_ID"
    python3 fetch_transcript.py "https://youtu.be/VIDEO_ID" --json
    python3 fetch_transcript.py "URL" --output transcript.txt
    python3 fetch_transcript.py --batch urls.txt
    python3 fetch_transcript.py --cache-stats
    python3 fetch_transcript.py --clear-cache

Requires:
    - APIFY_API_TOKEN environment variable
    - requests library
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, urlparse

try:
    import requests
except ImportError:
    print("Error: 'requests' library not installed.", file=sys.stderr)
    sys.exit(1)


APIFY_ACTOR_ID = "pintostudio~youtube-transcript-scraper"
GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    APIFY_API_BASE = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    APIFY_API_BASE = "https://api.apify.com/v2"
CACHE_DIR = Path(os.environ.get("YT_TRANSCRIPT_CACHE_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".cache")))


def get_api_token():
    """Get API token, preferring GooseWorks proxy key."""
    token = GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def extract_video_id(url):
    """Extract YouTube video ID from various URL formats."""
    # Handle youtu.be short links
    if "youtu.be" in url:
        path = urlparse(url).path
        return path.lstrip("/").split("?")[0]

    # Handle youtube.com URLs
    parsed = urlparse(url)

    # /watch?v=VIDEO_ID
    if "v" in parse_qs(parsed.query):
        return parse_qs(parsed.query)["v"][0]

    # /embed/VIDEO_ID or /v/VIDEO_ID
    match = re.search(r"/(embed|v)/([a-zA-Z0-9_-]{11})", parsed.path)
    if match:
        return match.group(2)

    # /shorts/VIDEO_ID
    match = re.search(r"/shorts/([a-zA-Z0-9_-]{11})", parsed.path)
    if match:
        return match.group(1)

    # Maybe it's just the video ID
    if re.match(r"^[a-zA-Z0-9_-]{11}$", url):
        return url

    return None


# ============== CACHING FUNCTIONS ==============

def ensure_cache_dir():
    """Create cache directory if it doesn't exist."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def get_cache_path(video_id):
    """Get the cache file path for a video ID."""
    return CACHE_DIR / f"{video_id}.json"


def load_from_cache(video_id):
    """Load transcript from cache. Returns None if not cached."""
    cache_path = get_cache_path(video_id)
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None
    return None


def save_to_cache(video_id, result, language=None):
    """Save transcript to cache with metadata."""
    ensure_cache_dir()
    cache_path = get_cache_path(video_id)

    cache_data = {
        "video_id": video_id,
        "title": result.get("title", "Unknown"),
        "language": language or result.get("language", "unknown"),
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "segments": result.get("segments", []),
        "_raw_result": result  # Keep original for full fidelity
    }

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)


def clear_cache():
    """Delete all cached transcripts."""
    if not CACHE_DIR.exists():
        print("Cache directory does not exist.")
        return 0

    count = 0
    for cache_file in CACHE_DIR.glob("*.json"):
        cache_file.unlink()
        count += 1

    print(f"Cleared {count} cached transcript(s).")
    return count


def get_cache_stats():
    """Get cache statistics."""
    if not CACHE_DIR.exists():
        return {"count": 0, "total_size": 0, "videos": []}

    videos = []
    total_size = 0

    for cache_file in CACHE_DIR.glob("*.json"):
        size = cache_file.stat().st_size
        total_size += size

        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                videos.append({
                    "video_id": data.get("video_id", cache_file.stem),
                    "title": data.get("title", "Unknown")[:50],
                    "fetched_at": data.get("fetched_at", "Unknown"),
                    "size": size
                })
        except (json.JSONDecodeError, IOError):
            videos.append({
                "video_id": cache_file.stem,
                "title": "(corrupt)",
                "fetched_at": "Unknown",
                "size": size
            })

    return {
        "count": len(videos),
        "total_size": total_size,
        "videos": sorted(videos, key=lambda x: x.get("fetched_at", ""), reverse=True)
    }


def print_cache_stats():
    """Print cache statistics to stderr."""
    stats = get_cache_stats()

    print(f"\nTranscript Cache Stats", file=sys.stderr)
    print(f"   Location: {CACHE_DIR}", file=sys.stderr)
    print(f"   Cached videos: {stats['count']}", file=sys.stderr)
    print(f"   Total size: {stats['total_size']:,} bytes ({stats['total_size'] / 1024:.1f} KB)", file=sys.stderr)

    if stats['videos']:
        print(f"\n   Recent cached videos:", file=sys.stderr)
        for v in stats['videos'][:10]:
            print(f"   - {v['video_id']} - {v['title']}", file=sys.stderr)
        if len(stats['videos']) > 10:
            print(f"   ... and {len(stats['videos']) - 10} more", file=sys.stderr)


# ============== APIFY FUNCTIONS ==============

def run_apify_actor(video_url, api_token, language=None):
    """Run the APIFY actor and return results."""

    # Start the actor run
    run_url = f"{APIFY_API_BASE}/acts/{APIFY_ACTOR_ID}/runs"

    input_data = {
        "videoUrl": video_url
    }

    if language:
        input_data["preferredLanguage"] = language

    headers = {
        "Content-Type": "application/json"
    }

    params = {
        "token": api_token
    }

    try:
        # Start the run
        response = requests.post(
            run_url,
            headers=headers,
            params=params,
            json=input_data,
            timeout=30
        )

        if response.status_code == 401:
            print("Error: Invalid API token.", file=sys.stderr)
            sys.exit(1)

        if response.status_code == 402:
            print("Error: APIFY quota exceeded. Check your billing:", file=sys.stderr)
            print("https://console.apify.com/billing", file=sys.stderr)
            sys.exit(1)

        response.raise_for_status()
        run_data = response.json()["data"]
        run_id = run_data["id"]

    except requests.exceptions.RequestException as e:
        print(f"Error starting APIFY actor: {e}", file=sys.stderr)
        sys.exit(1)

    # Wait for completion
    status_url = f"{APIFY_API_BASE}/actor-runs/{run_id}"
    max_wait = 120  # seconds
    start_time = time.time()

    while time.time() - start_time < max_wait:
        try:
            response = requests.get(status_url, params=params, timeout=10)
            response.raise_for_status()
            status_data = response.json()["data"]
            status = status_data["status"]

            if status == "SUCCEEDED":
                break
            elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
                print(f"Error: APIFY actor {status.lower()}.", file=sys.stderr)
                sys.exit(1)

            time.sleep(2)

        except requests.exceptions.RequestException as e:
            print(f"Error checking status: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print("Error: Timeout waiting for APIFY actor.", file=sys.stderr)
        sys.exit(1)

    # Get results from dataset
    dataset_id = status_data["defaultDatasetId"]
    dataset_url = f"{APIFY_API_BASE}/datasets/{dataset_id}/items"

    try:
        response = requests.get(dataset_url, params=params, timeout=30)
        response.raise_for_status()
        results = response.json()

        if not results:
            print("Error: No transcript found for this video.", file=sys.stderr)
            print("The video might not have captions available.", file=sys.stderr)
            sys.exit(1)

        result = results[0]

        # Normalize output: extract segments from the `data` field
        segments = result.get("data", [])
        return {
            "title": result.get("title", "Unknown"),
            "language": result.get("language", "unknown"),
            "segments": segments
        }

    except requests.exceptions.RequestException as e:
        print(f"Error fetching results: {e}", file=sys.stderr)
        sys.exit(1)


# ============== FORMATTING FUNCTIONS ==============

def format_transcript_text(result):
    """Format transcript as plain text."""
    # Handle cached format vs raw format
    if "_raw_result" in result:
        result = result["_raw_result"]

    segments = result.get("segments", [])
    if not segments:
        # Fallback: check legacy captions field
        segments = result.get("captions", [])
    if not segments:
        if "text" in result:
            return result["text"]
        return "No transcript content found."

    lines = []
    for segment in segments:
        if isinstance(segment, str):
            text = segment.strip()
        else:
            text = segment.get("text", "").strip()

        if text:
            lines.append(text)

    return "\n".join(lines)


def format_transcript_json(result, video_id):
    """Format transcript as JSON with metadata."""
    raw_result = result.get("_raw_result", result)
    segments = raw_result.get("segments", [])
    if not segments:
        segments = raw_result.get("captions", [])

    output = {
        "video_id": video_id,
        "title": result.get("title", raw_result.get("title", "Unknown")),
        "transcript": [],
        "full_text": ""
    }

    # Include cache info if available
    if "fetched_at" in result:
        output["fetched_at"] = result["fetched_at"]
        output["language"] = result.get("language", "unknown")

    texts = []
    for segment in segments:
        if isinstance(segment, str):
            text = segment.strip()
            if text:
                texts.append(text)
                output["transcript"].append({
                    "text": text
                })
        else:
            text = segment.get("text", "").strip()
            if text:
                texts.append(text)
                output["transcript"].append({
                    "start": segment.get("start", 0),
                    "dur": segment.get("dur", 0),
                    "text": text
                })

    output["full_text"] = " ".join(texts)

    return output


# ============== BATCH PROCESSING ==============

def process_batch(batch_file, api_token, use_cache, language, output_json):
    """Process a batch of URLs from a file."""
    if not os.path.exists(batch_file):
        print(f"Error: Batch file not found: {batch_file}", file=sys.stderr)
        sys.exit(1)

    with open(batch_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    urls = [line.strip() for line in lines if line.strip() and not line.strip().startswith("#")]

    if not urls:
        print("Error: No URLs found in batch file.", file=sys.stderr)
        sys.exit(1)

    print(f"Processing {len(urls)} URL(s)...\n", file=sys.stderr)

    fetched = 0
    cached = 0
    failed = 0
    results = []

    for i, url in enumerate(urls, 1):
        video_id = extract_video_id(url)
        if not video_id:
            print(f"[{i}/{len(urls)}] Invalid URL: {url}", file=sys.stderr)
            failed += 1
            continue

        # Check cache
        if use_cache:
            cache_data = load_from_cache(video_id)
            if cache_data:
                print(f"[{i}/{len(urls)}] [cached] {video_id}", file=sys.stderr)
                cached += 1
                results.append(cache_data)
                continue

        # Fetch from APIFY
        try:
            print(f"[{i}/{len(urls)}] Fetching {video_id}...", file=sys.stderr)
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            result = run_apify_actor(video_url, api_token, language)

            # Save to cache
            if use_cache:
                save_to_cache(video_id, result, language)

            fetched += 1
            results.append(result)

        except SystemExit:
            # run_apify_actor calls sys.exit on error, catch it for batch mode
            failed += 1
            continue

    # Print summary
    print(f"\n{'='*40}", file=sys.stderr)
    print(f"Batch complete: {fetched} fetched, {cached} cached, {failed} failed", file=sys.stderr)
    if fetched > 0:
        print(f"[Cost: ~${fetched * 0.007:.3f} for {fetched} API call(s)]", file=sys.stderr)

    return results


# ============== SINGLE VIDEO PROCESSING ==============

def process_single(url, api_token, use_cache, language):
    """Process a single video URL. Returns (result, from_cache)."""
    video_id = extract_video_id(url)
    if not video_id:
        print(f"Error: Could not extract video ID from: {url}", file=sys.stderr)
        sys.exit(1)

    # Check cache first
    if use_cache:
        cache_data = load_from_cache(video_id)
        if cache_data:
            print(f"[cached] Transcript for: {video_id}", file=sys.stderr)
            return cache_data, True

    # Fetch from APIFY
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    print(f"Fetching transcript for: {video_id}", file=sys.stderr)
    result = run_apify_actor(video_url, api_token, language)

    # Save to cache
    if use_cache:
        save_to_cache(video_id, result, language)

    return result, False


def main():
    parser = argparse.ArgumentParser(
        description="Fetch YouTube transcripts via APIFY API with local caching"
    )
    parser.add_argument(
        "url",
        nargs="?",
        help="YouTube video URL or video ID"
    )
    parser.add_argument(
        "--output", "-o",
        help="Output file path (default: stdout)"
    )
    parser.add_argument(
        "--json", "-j",
        action="store_true",
        help="Output as JSON with timestamps"
    )
    parser.add_argument(
        "--lang", "-l",
        help="Preferred transcript language (e.g., 'en', 'de')"
    )

    # Cache options
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Bypass cache (always fetch from APIFY)"
    )
    parser.add_argument(
        "--clear-cache",
        action="store_true",
        help="Clear all cached transcripts and exit"
    )
    parser.add_argument(
        "--cache-stats",
        action="store_true",
        help="Show cache statistics and exit"
    )

    # Batch mode
    parser.add_argument(
        "--batch", "-b",
        metavar="FILE",
        help="Process URLs from a text file (one per line)"
    )

    args = parser.parse_args()

    # Handle cache management commands (no API token needed)
    if args.clear_cache:
        clear_cache()
        return

    if args.cache_stats:
        print_cache_stats()
        return

    # Need either URL or batch file
    if not args.url and not args.batch:
        parser.print_help()
        print("\nError: Provide a URL or use --batch <file>", file=sys.stderr)
        sys.exit(1)

    # Get API token
    api_token = get_api_token()
    use_cache = not args.no_cache

    # Batch mode
    if args.batch:
        results = process_batch(args.batch, api_token, use_cache, args.lang, args.json)

        if args.json and results:
            # Output all results as JSON array
            formatted = [format_transcript_json(r, r.get("video_id", "unknown")) for r in results]
            output = json.dumps(formatted, indent=2, ensure_ascii=False)

            if args.output:
                with open(args.output, "w", encoding="utf-8") as f:
                    f.write(output)
                print(f"Results saved to: {args.output}", file=sys.stderr)
            else:
                print(output)

        return

    # Single URL mode
    result, from_cache = process_single(args.url, api_token, use_cache, args.lang)
    video_id = extract_video_id(args.url)

    # Format output
    if args.json:
        output = json.dumps(format_transcript_json(result, video_id), indent=2, ensure_ascii=False)
    else:
        output = format_transcript_text(result)

    # Write output
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"Transcript saved to: {args.output}", file=sys.stderr)
    else:
        print(output)

    if not from_cache:
        print("\n[Cost: ~$0.007 per video]", file=sys.stderr)


if __name__ == "__main__":
    main()
