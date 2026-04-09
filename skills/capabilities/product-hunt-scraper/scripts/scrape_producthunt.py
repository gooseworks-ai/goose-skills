#!/usr/bin/env python3
"""
Scrape Product Hunt trending products using Apify.
Fetches top products by time period with optional keyword filtering.

Usage:
  python3 scrape_producthunt.py --time-period daily --max-products 10
  python3 scrape_producthunt.py --time-period weekly --keywords "AI,marketing" --output summary
"""

import json
import os
import sys
import argparse
import requests
import time as time_mod


ACTOR_ID = "maximedupre~product-hunt-scraper"
GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    BASE_URL = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    BASE_URL = "https://api.apify.com/v2"


def get_token(cli_token=None):
    """Get API token, preferring GooseWorks proxy key."""
    token = cli_token or GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def run_apify_actor(token, time_period="weekly", max_products=50, timeout=300):
    """
    Run the Apify Product Hunt Scraper actor and return results.

    Args:
        token: Apify API token
        time_period: "daily", "weekly", or "monthly"
        max_products: Maximum products to scrape
        timeout: Max seconds to wait for the run to complete

    Returns:
        List of product dicts from the actor's dataset
    """
    run_input = {
        "timePeriod": time_period,
        "maxProducts": max_products,
    }

    print(f"Starting Apify actor run ({ACTOR_ID})...", file=sys.stderr)
    print(f"Time period: {time_period}, max products: {max_products}", file=sys.stderr)

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
    products = dataset_resp.json()
    print(f"Fetched {len(products)} products.", file=sys.stderr)
    return products


def filter_by_keywords(products, keywords):
    """Client-side keyword filtering on product name + tagline + description."""
    if not keywords:
        return products

    kw_lower = [k.lower() for k in keywords]
    filtered = []
    for p in products:
        text = " ".join([
            str(p.get("name", "")),
            str(p.get("tagline", "")),
            str(p.get("description", "")),
        ]).lower()
        if any(kw in text for kw in kw_lower):
            filtered.append(p)
    return filtered


def format_summary(products):
    """Format products as a human-readable summary table."""
    lines = []
    lines.append(f"{'#':<4} {'Upvotes':<9} {'Comments':<10} {'Name':<25} {'Tagline'}")
    lines.append("-" * 100)
    for i, p in enumerate(products, 1):
        name = (p.get("name") or "")[:23]
        tagline = (p.get("tagline") or "")[:45]
        upvotes = p.get("votesCount") or p.get("upvotes") or 0
        comments = p.get("commentsCount") or p.get("comments") or 0
        lines.append(f"{i:<4} {upvotes:<9} {comments:<10} {name:<25} {tagline}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Scrape Product Hunt trending products using Apify",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Today's top products
  %(prog)s --time-period daily --max-products 10 --output summary

  # This week's products filtered by keyword
  %(prog)s --time-period weekly --keywords "AI,marketing" --output summary

  # Monthly top products as JSON
  %(prog)s --time-period monthly --max-products 50
""",
    )

    parser.add_argument("--time-period", choices=["daily", "weekly", "monthly"],
                        default="weekly",
                        help="Time period for trending products (default: weekly)")
    parser.add_argument("--max-products", type=int, default=50,
                        help="Max products to scrape (default: 50)")
    parser.add_argument("--keywords", help="Keywords to filter (comma-separated, OR logic)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--token", help="Apify API token (or set APIFY_API_TOKEN env var)")
    parser.add_argument("--timeout", type=int, default=300,
                        help="Max seconds to wait for Apify run (default: 300)")

    args = parser.parse_args()

    token = get_token(args.token)

    # Run actor
    products = run_apify_actor(token, time_period=args.time_period,
                                max_products=args.max_products, timeout=args.timeout)

    # Keyword filtering
    if args.keywords:
        keywords = [k.strip() for k in args.keywords.split(",")]
        products = filter_by_keywords(products, keywords)

    # Sort by upvotes descending
    products.sort(key=lambda p: p.get("votesCount") or p.get("upvotes") or 0, reverse=True)

    print(f"Results: {len(products)} products after filtering.", file=sys.stderr)

    # Output
    if args.output == "summary":
        print(format_summary(products))
    else:
        print(json.dumps(products, indent=2))


if __name__ == "__main__":
    main()
