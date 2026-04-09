#!/usr/bin/env python3
"""
Search Twitter/X posts using Apify Tweet Scraper.
Uses Twitter native search syntax (since:/until:) for date filtering
since the actor's date params are unreliable.

Usage:
  python3 search_twitter.py --query "YourCompany" --since 2026-02-15 --until 2026-02-23 --max-tweets 10
  python3 search_twitter.py --query "@yourhandle" --max-tweets 20 --output summary
"""

import json
import os
import sys
import argparse
import requests
import time as time_mod
from datetime import datetime, timezone


ACTOR_ID = "apidojo~tweet-scraper"
BASE_URL = "https://api.apify.com/v2"


def get_token(cli_token=None):
    """Get Apify API token from CLI arg or APIFY_API_TOKEN env var."""
    token = cli_token or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("Error: Apify token required. Use --token or set APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def build_search_term(query, since=None, until=None):
    """
    Build Twitter search term with native date operators.

    The apidojo/tweet-scraper actor ignores its own date params,
    so we embed since:/until: directly into the search query.
    Twitter's advanced search syntax handles date filtering server-side.

    Args:
        query: Search query string
        since: Start date as YYYY-MM-DD string (inclusive)
        until: End date as YYYY-MM-DD string (exclusive)

    Returns:
        Search term string with date operators embedded
    """
    term = f'"{query}"'
    if since:
        term += f" since:{since}"
    if until:
        term += f" until:{until}"
    return term


def run_apify_actor(token, search_terms, max_tweets=50, timeout=300):
    """
    Run the Apify Tweet Scraper actor and return results.

    Args:
        token: Apify API token
        search_terms: List of search term strings
        max_tweets: Maximum tweets to scrape
        timeout: Max seconds to wait for the run to complete

    Returns:
        List of tweet dicts from the actor's dataset
    """
    run_input = {
        "searchTerms": search_terms,
        "maxTweets": max_tweets,
        "searchMode": "live",
    }

    print(f"Starting Apify actor run ({ACTOR_ID})...", file=sys.stderr)
    print(f"Search terms: {search_terms}", file=sys.stderr)

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
    tweets = dataset_resp.json()
    print(f"Fetched {len(tweets)} tweets.", file=sys.stderr)
    return tweets


def dedup_tweets(tweets):
    """Deduplicate tweets by ID or URL."""
    seen = set()
    deduped = []
    for t in tweets:
        tid = t.get("id") or t.get("twitterUrl") or t.get("url", str(id(t)))
        if tid not in seen:
            seen.add(tid)
            deduped.append(t)
    return deduped


def filter_tweets(tweets, keywords=None):
    """
    Client-side keyword filtering (OR logic, case-insensitive).

    Args:
        tweets: List of tweet dicts
        keywords: Optional list of keywords to filter by

    Returns:
        Filtered list of tweets
    """
    if not keywords:
        return tweets

    kw_lower = [k.lower() for k in keywords]
    filtered = []
    for t in tweets:
        text = " ".join([
            str(t.get("text", "")),
            str(t.get("fullText", "")),
        ]).lower()
        if any(kw in text for kw in kw_lower):
            filtered.append(t)
    return filtered


def format_summary(tweets):
    """Format tweets as a human-readable summary table."""
    lines = []
    lines.append(f"{'#':<4} {'Likes':<7} {'RTs':<6} {'Author':<20} {'Text'}")
    lines.append("-" * 100)
    for i, t in enumerate(tweets, 1):
        text = (t.get("text") or t.get("fullText") or "")[:60].replace("\n", " ")
        likes = t.get("likeCount", 0)
        rts = t.get("retweetCount", 0)
        author = ""
        if isinstance(t.get("author"), dict):
            author = t["author"].get("userName", "")
        elif t.get("author"):
            author = str(t["author"])
        author = author[:18]
        lines.append(f"{i:<4} {likes:<7} {rts:<6} {author:<20} {text}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Search Twitter/X posts using Apify",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search for a company with date range
  %(prog)s --query "YourCompany" --since 2026-02-15 --until 2026-02-23

  # Quick summary of recent mentions
  %(prog)s --query "@yourhandle" --max-tweets 20 --output summary

  # Search without date filtering
  %(prog)s --query "AI content marketing" --max-tweets 50
""",
    )

    parser.add_argument("--query", required=True,
                        help="Search query (will be quoted in Twitter search)")
    parser.add_argument("--since", help="Start date YYYY-MM-DD (inclusive, uses Twitter since: operator)")
    parser.add_argument("--until", help="End date YYYY-MM-DD (exclusive, uses Twitter until: operator)")
    parser.add_argument("--max-tweets", type=int, default=50,
                        help="Max tweets to scrape (default: 50)")
    parser.add_argument("--keywords", help="Additional keywords to filter results (comma-separated, OR logic)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--token", help="Apify API token (or set APIFY_API_TOKEN env var)")
    parser.add_argument("--timeout", type=int, default=300,
                        help="Max seconds to wait for Apify run (default: 300)")

    args = parser.parse_args()

    token = get_token(args.token)

    # Build search term with date operators embedded
    search_term = build_search_term(args.query, since=args.since, until=args.until)

    # Run actor
    tweets = run_apify_actor(token, [search_term], max_tweets=args.max_tweets, timeout=args.timeout)

    # Dedup
    tweets = dedup_tweets(tweets)

    # Optional keyword filtering
    if args.keywords:
        keywords = [k.strip() for k in args.keywords.split(",")]
        tweets = filter_tweets(tweets, keywords=keywords)

    # Sort by likes descending
    tweets.sort(key=lambda t: t.get("likeCount", 0), reverse=True)

    print(f"Results: {len(tweets)} tweets after filtering.", file=sys.stderr)

    # Output
    if args.output == "summary":
        print(format_summary(tweets))
    else:
        print(json.dumps(tweets, indent=2))


if __name__ == "__main__":
    main()
