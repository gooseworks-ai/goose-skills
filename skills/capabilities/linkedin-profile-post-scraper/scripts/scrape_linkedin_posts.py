#!/usr/bin/env python3
"""
Scrape LinkedIn profile posts using Apify.
Fetches recent posts from specified LinkedIn profiles.

Usage:
  python3 scrape_linkedin_posts.py --profiles "https://www.linkedin.com/in/marcelsantilli" --max-posts 10
  python3 scrape_linkedin_posts.py --profiles "url1,url2" --keywords "AI,growth" --days 30 --output summary
"""

import json
import os
import sys
import argparse
import requests
import time as time_mod
from datetime import datetime, timedelta, timezone


ACTOR_ID = "harvestapi~linkedin-profile-posts"

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


def run_apify_actor(token, profile_urls, max_posts=20, timeout=300):
    """
    Run the Apify LinkedIn Profile Posts actor and return results.

    Args:
        token: Apify API token
        profile_urls: List of LinkedIn profile URL strings
        max_posts: Maximum posts to scrape per profile
        timeout: Max seconds to wait for the run to complete

    Returns:
        List of post dicts from the actor's dataset
    """
    run_input = {
        "profileUrls": profile_urls,
        "maxPosts": max_posts,
    }

    # Cost estimate
    est_cost = len(profile_urls) * max_posts * 0.002
    print(f"Estimated cost: ~${est_cost:.2f} ({len(profile_urls)} profiles x {max_posts} posts @ ~$2/1k)", file=sys.stderr)
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

    # Poll for completion
    deadline = time_mod.time() + timeout
    status_data = None
    while time_mod.time() < deadline:
        status_resp = requests.get(
            f"{BASE_URL}/acts/{ACTOR_ID}/runs/{run_id}",
            params={"token": token},
        )
        status_resp.raise_for_status()
        status_data = status_resp.json()
        status = status_data["data"]["status"]

        if status == "SUCCEEDED":
            print("Scraping complete.", file=sys.stderr)
            break
        elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
            print(f"Actor run {status}.", file=sys.stderr)
            raise RuntimeError(f"Actor run {status}: {json.dumps(status_data['data'], indent=2)}")

        print(f"Status: {status}...", file=sys.stderr)
        time_mod.sleep(5)
    else:
        raise TimeoutError(f"Actor run did not complete within {timeout}s")

    # Fetch dataset items
    dataset_id = status_data["data"]["defaultDatasetId"]
    dataset_resp = requests.get(
        f"{BASE_URL}/datasets/{dataset_id}/items",
        params={"token": token, "format": "json"},
    )
    dataset_resp.raise_for_status()
    posts = dataset_resp.json()
    print(f"Fetched {len(posts)} posts.", file=sys.stderr)
    return posts


def filter_posts(posts, keywords=None, days_back=None):
    """
    Client-side filtering by keywords and date.

    The LinkedIn profile posts actor has no native date filtering,
    so we filter client-side on the postedAt/postedDate field.

    Args:
        posts: List of post dicts from Apify
        keywords: Optional list of keywords (OR logic, case-insensitive)
        days_back: Optional number of days; posts older than this are dropped

    Returns:
        Filtered list of posts
    """
    filtered = posts

    # Date filter
    if days_back is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
        date_filtered = []
        for p in filtered:
            raw_date = p.get("postedAt") or p.get("postedDate") or p.get("postedDateTimestamp")
            if raw_date is None:
                date_filtered.append(p)
                continue
            # Handle dict format from harvestapi actor: {"timestamp": ..., "date": "..."}
            if isinstance(raw_date, dict):
                date_str = raw_date.get("timestamp") or raw_date.get("date")
                if date_str is None:
                    date_filtered.append(p)
                    continue
            else:
                date_str = raw_date
            if isinstance(date_str, (int, float)):
                dt = datetime.fromtimestamp(date_str / 1000 if date_str > 1e12 else date_str, tz=timezone.utc)
            elif isinstance(date_str, str):
                try:
                    dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                except ValueError:
                    date_filtered.append(p)
                    continue
            else:
                date_filtered.append(p)
                continue
            if dt >= cutoff:
                date_filtered.append(p)
        filtered = date_filtered

    # Keyword filter
    if keywords:
        kw_lower = [k.lower() for k in keywords]
        kw_filtered = []
        for p in filtered:
            text = " ".join([
                str(p.get("content", "")),
                str(p.get("text", "")),
                str(p.get("postText", "")),
                str(p.get("title", "")),
            ]).lower()
            if any(kw in text for kw in kw_lower):
                kw_filtered.append(p)
        filtered = kw_filtered

    return filtered


def format_summary(posts):
    """Format posts as a human-readable summary table."""
    lines = []
    lines.append(f"{'#':<4} {'Reactions':<10} {'Comments':<10} {'Date':<12} {'Author':<18} {'Text'}")
    lines.append("-" * 110)
    for i, p in enumerate(posts, 1):
        text = (p.get("content") or p.get("text") or p.get("postText") or "")[:50].replace("\n", " ")
        eng = p.get("engagement", {})
        reactions = eng.get("likes", 0) if isinstance(eng, dict) else (p.get("totalReactionCount") or p.get("numLikes") or 0)
        comments_count = eng.get("comments", 0) if isinstance(eng, dict) else (p.get("commentsCount") or p.get("numComments") or 0)
        raw_date = p.get("postedAt") or p.get("postedDate") or ""
        if isinstance(raw_date, dict):
            date = (raw_date.get("date", "") or "")[:10]
        elif isinstance(raw_date, str):
            date = raw_date[:10]
        else:
            date = ""
        author_field = p.get("author", {})
        author = author_field.get("name", "") if isinstance(author_field, dict) else str(author_field)
        author = author[:16]
        lines.append(f"{i:<4} {reactions:<10} {comments_count:<10} {date:<12} {author:<18} {text}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Scrape LinkedIn profile posts using Apify",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape recent posts from a profile
  %(prog)s --profiles "https://www.linkedin.com/in/marcelsantilli" --max-posts 10

  # Multiple profiles with keyword filtering
  %(prog)s --profiles "url1,url2" --keywords "AI,growth" --days 30

  # Summary table
  %(prog)s --profiles "https://www.linkedin.com/in/marcelsantilli" --output summary
""",
    )

    parser.add_argument("--profiles", required=True,
                        help="LinkedIn profile URL(s), comma-separated")
    parser.add_argument("--max-posts", type=int, default=20,
                        help="Max posts to scrape per profile (default: 20)")
    parser.add_argument("--keywords", help="Keywords to filter (comma-separated, OR logic)")
    parser.add_argument("--days", type=int, default=30,
                        help="Only include posts from last N days (default: 30)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--token", help="Apify API token (or set APIFY_API_TOKEN env var)")
    parser.add_argument("--timeout", type=int, default=300,
                        help="Max seconds to wait for Apify run (default: 300)")

    args = parser.parse_args()

    token = get_token(args.token)

    # Parse profile URLs
    profile_urls = [u.strip() for u in args.profiles.split(",") if u.strip()]

    # Run actor
    posts = run_apify_actor(token, profile_urls, max_posts=args.max_posts, timeout=args.timeout)

    # Parse keywords
    keywords = None
    if args.keywords:
        keywords = [k.strip() for k in args.keywords.split(",")]

    # Filter
    posts = filter_posts(posts, keywords=keywords, days_back=args.days)

    # Sort by reactions descending
    posts.sort(key=lambda p: (p.get("engagement", {}) or {}).get("likes", 0) if isinstance(p.get("engagement"), dict) else (p.get("totalReactionCount") or p.get("numLikes") or 0), reverse=True)

    print(f"Results: {len(posts)} posts after filtering.", file=sys.stderr)

    # Output
    if args.output == "summary":
        print(format_summary(posts))
    else:
        print(json.dumps(posts, indent=2))


if __name__ == "__main__":
    main()
