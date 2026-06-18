#!/usr/bin/env python3
"""
TikTok Influencer Finder — Discover TikTok creators via Apify's Influencer Discovery Agent.

Usage:
    python3 find_influencers.py --description "fitness coaches for women over 40"
    python3 find_influencers.py --description "AI/tech reviewers" --min-followers 10000 --max-followers 500000
    python3 find_influencers.py --description "vegan cooking" --keywords 5 --profiles-per-keyword 10 --output csv
"""

import argparse
import json
import os
import sys
import time

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests", file=sys.stderr)
    sys.exit(1)

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    APIFY_BASE = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    APIFY_BASE = "https://api.apify.com/v2"

ACTOR_ID = "apify~influencer-discovery-agent"


def get_apify_token(token_arg=None):
    """Get API token from arg, GOOSEWORKS_API_KEY, or APIFY_API_TOKEN env var."""
    token = token_arg or GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def run_influencer_search(description, token, keywords=5, profiles_per_keyword=10, timeout=300):
    """Run Apify influencer discovery agent and return results."""
    actor_input = {
        "influencerDescription": description,
        "generatedKeywords": min(keywords, 5),
        "profilesPerKeyword": min(profiles_per_keyword, 10),
    }

    # Start actor run
    try:
        print(f"  Starting Apify actor: {ACTOR_ID}", file=sys.stderr)
        start_resp = requests.post(
            f"{APIFY_BASE}/acts/{ACTOR_ID}/runs",
            params={"token": token},
            json=actor_input,
            timeout=30,
        )
        start_resp.raise_for_status()
    except Exception as e:
        print(f"  ERROR: Failed to start Apify actor: {e}", file=sys.stderr)
        return []

    run_data = start_resp.json().get("data", {})
    run_id = run_data.get("id")
    if not run_id:
        print("  ERROR: No run ID returned from Apify", file=sys.stderr)
        return []

    print(f"  Apify run started: {run_id}", file=sys.stderr)

    # Poll for completion
    start_time = time.time()
    status = "RUNNING"
    status_data = {}
    while time.time() - start_time < timeout:
        try:
            status_resp = requests.get(
                f"{APIFY_BASE}/actor-runs/{run_id}",
                params={"token": token},
                timeout=15,
            )
            status_data = status_resp.json().get("data", {})
            status = status_data.get("status", "UNKNOWN")
            elapsed = int(time.time() - start_time)
            print(f"  [{elapsed}s] Status: {status}", file=sys.stderr)
            if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
                break
        except Exception:
            pass
        time.sleep(5)

    if status != "SUCCEEDED":
        print(f"  Warning: Apify run ended with status: {status}", file=sys.stderr)
        return []

    # Fetch results
    dataset_id = status_data.get("defaultDatasetId")
    if not dataset_id:
        print("  ERROR: No dataset ID in Apify response", file=sys.stderr)
        return []

    try:
        dataset_resp = requests.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            params={"token": token, "format": "json"},
            timeout=30,
        )
        dataset_resp.raise_for_status()
        items = dataset_resp.json()
    except Exception as e:
        print(f"  ERROR: Failed to fetch dataset: {e}", file=sys.stderr)
        return []

    print(f"  Got {len(items)} profiles from Apify", file=sys.stderr)
    return items


def filter_results(items, min_followers=None, max_followers=None, min_fit=0.0):
    """Filter influencer results by follower count and fit score."""
    filtered = []
    for item in items:
        followers = item.get("followersCount") or item.get("followers") or 0
        fit = item.get("fit") or item.get("fitScore") or 0.0

        if min_followers and followers < min_followers:
            continue
        if max_followers and followers > max_followers:
            continue
        if fit < min_fit:
            continue

        filtered.append(item)

    # Sort by fit score desc, then followers desc
    filtered.sort(key=lambda x: (
        -(x.get("fit") or x.get("fitScore") or 0),
        -(x.get("followersCount") or x.get("followers") or 0),
    ))
    return filtered


def format_followers(count):
    """Format follower count readably."""
    if not count:
        return "0"
    if count >= 1_000_000:
        return f"{count / 1_000_000:.1f}M"
    if count >= 1_000:
        return f"{count / 1_000:.1f}K"
    return str(count)


def output_json(items):
    print(json.dumps(items, indent=2, ensure_ascii=False))


def output_summary(items):
    print(f"\nTikTok Influencer Search Results")
    print("=" * 80)
    print(f"Total profiles: {len(items)}")

    if not items:
        print("\nNo influencers found matching criteria.")
        return

    print(f"\n{'#':<4} {'Handle':<22} {'Followers':<12} {'Engagement':<12} {'Fit':<6} {'Focus'}")
    print("-" * 90)
    for i, item in enumerate(items, 1):
        handle = (item.get("username") or item.get("handle") or "")[:20]
        followers = format_followers(item.get("followersCount") or item.get("followers") or 0)
        engagement = item.get("engagementRate") or item.get("engagement_rate") or 0
        eng_str = f"{engagement:.1f}%" if isinstance(engagement, (int, float)) else str(engagement)
        fit = item.get("fit") or item.get("fitScore") or 0
        fit_str = f"{fit:.2f}" if isinstance(fit, (int, float)) else str(fit)
        focus = (item.get("fitDescription") or item.get("bio") or "")[:30]
        print(f"{i:<4} @{handle:<21} {followers:<12} {eng_str:<12} {fit_str:<6} {focus}")


def output_csv(items):
    import csv
    fields = ["username", "followersCount", "engagementRate", "fit", "fitDescription",
              "profileUrl", "bio", "location"]
    writer = csv.DictWriter(sys.stdout, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(items)


def main():
    parser = argparse.ArgumentParser(
        description="Find TikTok influencers via Apify Influencer Discovery Agent."
    )
    parser.add_argument("--description", required=True,
                        help="Describe the type of influencer to find")
    parser.add_argument("--keywords", type=int, default=5,
                        help="Number of keywords to generate (max 5, default: 5)")
    parser.add_argument("--profiles-per-keyword", type=int, default=10,
                        help="Profiles per keyword (max 10, default: 10)")
    parser.add_argument("--min-followers", type=int, default=None,
                        help="Minimum follower count filter")
    parser.add_argument("--max-followers", type=int, default=None,
                        help="Maximum follower count filter")
    parser.add_argument("--min-fit", type=float, default=0.0,
                        help="Minimum fit score filter (0.0-1.0, default: 0.0)")
    parser.add_argument("--output", choices=["json", "csv", "summary"],
                        default="json", help="Output format (default: json)")
    parser.add_argument("--token", help="Apify API token (overrides env var)")
    parser.add_argument("--timeout", type=int, default=300,
                        help="Max seconds for Apify run (default: 300)")

    args = parser.parse_args()
    token = get_apify_token(args.token)

    print(f"Searching for TikTok influencers: {args.description}", file=sys.stderr)
    raw_items = run_influencer_search(
        args.description, token, args.keywords, args.profiles_per_keyword, args.timeout
    )

    filtered = filter_results(raw_items, args.min_followers, args.max_followers, args.min_fit)
    print(f"Filtered: {len(filtered)} of {len(raw_items)} profiles match criteria", file=sys.stderr)

    if args.output == "csv":
        output_csv(filtered)
    elif args.output == "summary":
        output_summary(filtered)
    else:
        output_json(filtered)


if __name__ == "__main__":
    main()
