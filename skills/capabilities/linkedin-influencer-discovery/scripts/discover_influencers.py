#!/usr/bin/env python3
"""
Discover top LinkedIn influencers by niche, follower count, and topic.

Uses the powerai/influencer-filter-api-scraper Apify actor which queries a database
of 3.6M+ influencer profiles, filtered to those with LinkedIn presence.

Usage:
  python3 discover_influencers.py --topic "artificial intelligence" --max-results 50
  python3 discover_influencers.py --topic "saas" --country "United States of America" --output summary
"""

import json
import os
import sys
import argparse
import time as time_mod

try:
    import requests
except ImportError:
    print("Error: 'requests' package required. Install with: pip install requests", file=sys.stderr)
    sys.exit(1)


ACTOR_ID = "powerai~influencer-filter-api-scraper"

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    BASE_URL = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    BASE_URL = "https://api.apify.com/v2"


def get_token(cli_token=None):
    """Get API token from CLI arg, GOOSEWORKS_API_KEY, or APIFY_API_TOKEN env var."""
    token = cli_token or GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def run_discovery(token, run_input, timeout=600):
    max_items = run_input.get("maxItems", 100)
    est_cost = max_items * 0.0099
    print(f"Estimated cost: ~${est_cost:.2f} ({max_items} results @ ~$0.01/each)", file=sys.stderr)
    print(f"Starting Apify actor run ({ACTOR_ID})...", file=sys.stderr)

    resp = requests.post(
        f"{BASE_URL}/acts/{ACTOR_ID}/runs",
        json=run_input,
        params={"token": token},
    )
    resp.raise_for_status()
    run_data = resp.json()
    run_id = run_data["data"]["id"]
    print(f"Run started (ID: {run_id})", file=sys.stderr)

    deadline = time_mod.time() + timeout
    status_data = None
    while time_mod.time() < deadline:
        status_resp = requests.get(
            f"{BASE_URL}/actor-runs/{run_id}",
            params={"token": token},
        )
        status_resp.raise_for_status()
        status_data = status_resp.json()
        status = status_data["data"]["status"]

        if status == "SUCCEEDED":
            print("Discovery complete.", file=sys.stderr)
            break
        elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
            print(f"Actor run {status}.", file=sys.stderr)
            raise RuntimeError(f"Actor run {status}")

        print(f"Status: {status}...", file=sys.stderr)
        time_mod.sleep(10)
    else:
        raise TimeoutError(f"Actor run did not complete within {timeout}s")

    dataset_id = status_data["data"]["defaultDatasetId"]
    dataset_resp = requests.get(
        f"{BASE_URL}/datasets/{dataset_id}/items",
        params={"token": token, "format": "json"},
    )
    dataset_resp.raise_for_status()
    results = dataset_resp.json()
    print(f"Discovered {len(results)} influencers.", file=sys.stderr)
    return results


def filter_results(results, min_followers=0, max_followers=None):
    """Client-side filtering by follower count range."""
    filtered = []
    for r in results:
        fc = r.get("follower_count", 0) or 0
        if fc < min_followers:
            continue
        if max_followers and fc > max_followers:
            continue
        filtered.append(r)
    return filtered


def format_summary(results):
    lines = []
    lines.append(f"{'#':<4} {'Name':<30} {'Followers':<12} {'Topic':<25} {'LinkedIn URL'}")
    lines.append("-" * 120)
    for i, r in enumerate(results, 1):
        name = (r.get("full_name") or r.get("username") or "?")[:28]
        followers = r.get("follower_count") or 0
        topic = (r.get("main_topic") or "")[:23]
        linkedin_url = r.get("linkedin_url") or ""
        lines.append(f"{i:<4} {name:<30} {followers:<12,} {topic:<25} {linkedin_url}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Discover top LinkedIn influencers by topic and follower count",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Find top AI influencers with LinkedIn profiles
  %(prog)s --topic "artificial intelligence" --max-results 50

  # Find SaaS influencers in the US
  %(prog)s --topic "saas" --country "United States of America" --output summary

  # Find marketing influencers with email available
  %(prog)s --topic "marketing" --has-email --max-results 100

  # Filter by follower count range
  %(prog)s --topic "fintech" --min-followers 10000 --max-followers 500000
""",
    )

    parser.add_argument("--topic", required=True,
                        help="Topic to search (e.g. 'artificial intelligence', 'saas', 'marketing')")
    parser.add_argument("--category",
                        help="Category filter (e.g. 'technology', 'business', 'lifestyle')")
    parser.add_argument("--country",
                        help="Country filter (e.g. 'United States of America', 'United Kingdom')")
    parser.add_argument("--language", default="English",
                        help="Language filter (default: English)")
    parser.add_argument("--min-followers", type=int, default=0,
                        help="Minimum follower count (client-side filter, default: 0)")
    parser.add_argument("--max-followers", type=int, default=0,
                        help="Maximum follower count (client-side filter, 0=unlimited)")
    parser.add_argument("--has-email", action="store_true",
                        help="Only return influencers with an email address")
    parser.add_argument("--max-results", type=int, default=100,
                        help="Max influencers to discover (default: 100)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--token",
                        help="Apify API token (or set APIFY_API_TOKEN env var)")
    parser.add_argument("--timeout", type=int, default=600,
                        help="Max seconds to wait for Apify run (default: 600)")

    args = parser.parse_args()

    token = get_token(args.token)

    run_input = {
        "topics": args.topic,
        "platforms": ["linkedin"],
        "accountTypes": ["person"],
        "languages": [args.language],
        "maxItems": min(args.max_results, 1000),
    }

    if args.category:
        run_input["categories"] = args.category

    if args.country:
        run_input["countries"] = [args.country]

    if args.has_email:
        run_input["hasEmail"] = True

    results = run_discovery(token, run_input, timeout=args.timeout)

    # Client-side follower filtering
    max_f = args.max_followers if args.max_followers > 0 else None
    if args.min_followers > 0 or max_f:
        before = len(results)
        results = filter_results(results, min_followers=args.min_followers, max_followers=max_f)
        print(f"Filtered {before} -> {len(results)} by follower range [{args.min_followers}, {max_f or 'unlimited'}]", file=sys.stderr)

    # Sort by follower count descending
    results.sort(key=lambda r: r.get("follower_count") or 0, reverse=True)

    print(f"Results: {len(results)} influencers with LinkedIn profiles.", file=sys.stderr)

    if args.output == "summary":
        print(format_summary(results))
    else:
        print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
