#!/usr/bin/env python3
"""
Scrape product reviews from G2, Capterra, or Trustpilot using Apify.
Single script with --platform dispatch to handle all three review sources.

Usage:
  python3 scrape_reviews.py --platform trustpilot --url "https://www.trustpilot.com/review/example.com" --max-reviews 10
  python3 scrape_reviews.py --platform g2 --url "https://www.g2.com/products/example/reviews" --output summary
  python3 scrape_reviews.py --platform capterra --company-name "HubSpot CRM" --max-reviews 20
"""

import json
import os
import sys
import argparse
import urllib.request
import urllib.error
import urllib.parse
import time as time_mod
from datetime import datetime, timedelta, timezone


BASE_URL = "https://api.apify.com/v2"

# Platform-specific actor IDs
ACTORS = {
    "g2": "focused_vanguard~g2-reviews-scraper",
    "capterra": "getdataforme~capterra-reviews-scraper-bulk",
    "trustpilot": "agents~trustpilot-reviews",
}


def get_token(cli_token=None):
    """Get Apify API token from CLI arg or APIFY_API_TOKEN env var."""
    token = cli_token or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("Error: Apify token required. Use --token or set APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def build_input(platform, url, company_name, max_reviews):
    """
    Build platform-specific Apify actor input.

    Args:
        platform: "g2", "capterra", or "trustpilot"
        url: Product page URL (used for g2 and trustpilot)
        company_name: Company name (used for capterra)
        max_reviews: Maximum reviews to scrape

    Returns:
        Dict of actor input parameters
    """
    if platform == "g2":
        if not url:
            print("Error: --url is required for G2.", file=sys.stderr)
            sys.exit(1)
        return {
            "url": url,
            "maxItems": max_reviews,
        }
    elif platform == "capterra":
        if company_name:
            return {
                "company_name": company_name,
                "maxReviews": max_reviews,
            }
        else:
            print("Error: --company-name is required for Capterra (e.g. --company-name 'HubSpot CRM').", file=sys.stderr)
            sys.exit(1)
    elif platform == "trustpilot":
        if not url:
            print("Error: --url is required for Trustpilot.", file=sys.stderr)
            sys.exit(1)
        return {
            "startUrls": [{"url": url}],
            "maxReviews": max_reviews,
        }
    else:
        raise ValueError(f"Unknown platform: {platform}")


def _api_request(url, token, method="GET", data=None):
    """Make an API request using urllib (no external dependencies)."""
    separator = "&" if "?" in url else "?"
    full_url = f"{url}{separator}token={token}"

    req = urllib.request.Request(full_url, method=method)
    if data is not None:
        req.data = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")

    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def run_apify_actor(token, platform, actor_input, timeout=300):
    """
    Run the platform-specific Apify actor and return results.

    Args:
        token: Apify API token
        platform: Platform name (for actor lookup)
        actor_input: Actor input dict
        timeout: Max seconds to wait

    Returns:
        List of review dicts from the actor's dataset
    """
    actor_id = ACTORS[platform]

    print(f"Starting Apify actor run ({actor_id})...", file=sys.stderr)
    print(f"Platform: {platform}", file=sys.stderr)

    run_data = _api_request(
        f"{BASE_URL}/acts/{actor_id}/runs",
        token,
        method="POST",
        data=actor_input,
    )
    run_id = run_data["data"]["id"]
    print(f"Run started (ID: {run_id})", file=sys.stderr)

    # Poll for completion
    deadline = time_mod.time() + timeout
    status_data = None
    while time_mod.time() < deadline:
        status_data = _api_request(
            f"{BASE_URL}/acts/{actor_id}/runs/{run_id}",
            token,
        )
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
    reviews = _api_request(
        f"{BASE_URL}/datasets/{dataset_id}/items?format=json",
        token,
    )
    print(f"Fetched {len(reviews)} reviews.", file=sys.stderr)
    return reviews


def normalize_review(review, platform):
    """
    Normalize a review from any platform to a common schema.

    Args:
        review: Raw review dict from Apify
        platform: Platform name

    Returns:
        Normalized review dict
    """
    if platform == "g2":
        return {
            "platform": "g2",
            "id": review.get("id", ""),
            "product_name": review.get("product_name", ""),
            "title": None,
            "text": review.get("text") or review.get("reviewText", ""),
            "rating": review.get("rating"),
            "author": review.get("author", ""),
            "author_title": review.get("author_title", ""),
            "author_company": review.get("author_company", ""),
            "author_company_size": review.get("author_company_size", ""),
            "author_industry": review.get("author_industry", ""),
            "date": review.get("date") or review.get("publishedAt", ""),
            "source": review.get("source", ""),
            "url": review.get("url", ""),
        }
    elif platform == "capterra":
        return {
            "platform": "capterra",
            "title": review.get("review_title", ""),
            "text": review.get("text") or review.get("reviewText", ""),
            "overall_rating": review.get("overall_rating"),
            "ease_of_use": review.get("ease_of_use"),
            "customer_service": review.get("customer_service"),
            "features": review.get("features"),
            "author": review.get("reviewer_name", ""),
            "job_title": review.get("job_title", ""),
            "industry": review.get("industry", ""),
            "usage_duration": review.get("usage_duration", ""),
            "date": review.get("review_date", ""),
            "url": review.get("url", ""),
        }
    elif platform == "trustpilot":
        user = review.get("user") or {}
        if isinstance(user, str):
            author = user
        else:
            author = user.get("displayName") or user.get("name", "")
        return {
            "platform": "trustpilot",
            "id": review.get("id", ""),
            "title": review.get("title", ""),
            "text": review.get("body") or review.get("text", ""),
            "rating": review.get("rating"),
            "author": author,
            "date": review.get("publishedDate") or review.get("experiencedDate", ""),
            "experienced_date": review.get("experiencedDate", ""),
            "likes": review.get("likes"),
            "input_source": review.get("inputSource", ""),
            "url": review.get("url", ""),
        }
    return review


def filter_reviews(reviews, keywords=None, days=None):
    """Client-side date and keyword filtering."""
    filtered = reviews

    if days is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        date_filtered = []
        for r in filtered:
            date_str = r.get("date", "")
            if not date_str:
                date_filtered.append(r)
                continue
            try:
                dt = datetime.fromisoformat(str(date_str).replace("Z", "+00:00"))
                if dt >= cutoff:
                    date_filtered.append(r)
            except ValueError:
                date_filtered.append(r)
        filtered = date_filtered

    if keywords:
        kw_lower = [k.lower() for k in keywords]
        kw_filtered = []
        for r in filtered:
            text = " ".join([
                str(r.get("title", "")),
                str(r.get("text", "")),
            ]).lower()
            if any(kw in text for kw in kw_lower):
                kw_filtered.append(r)
        filtered = kw_filtered

    return filtered


def format_summary(reviews):
    """Format reviews as a human-readable summary table."""
    lines = []
    lines.append(f"{'#':<4} {'Rating':<8} {'Date':<12} {'Author':<18} {'Title'}")
    lines.append("-" * 100)
    for i, r in enumerate(reviews, 1):
        title = (str(r.get("title") or ""))[:50]
        rating = r.get("rating") or r.get("overall_rating", "")
        if rating:
            rating = f"{rating}/5"
        date = str(r.get("date", ""))[:10]
        author = str(r.get("author", ""))[:16]
        lines.append(f"{i:<4} {str(rating):<8} {date:<12} {author:<18} {title}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Scrape product reviews from G2, Capterra, or Trustpilot",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Trustpilot reviews
  %(prog)s --platform trustpilot --url "https://www.trustpilot.com/review/example.com" --max-reviews 10

  # G2 reviews with keyword filter
  %(prog)s --platform g2 --url "https://www.g2.com/products/example/reviews" --keywords "pricing,support"

  # Capterra reviews by company name
  %(prog)s --platform capterra --company-name "HubSpot CRM" --max-reviews 20 --output summary
""",
    )

    parser.add_argument("--platform", required=True,
                        choices=["g2", "capterra", "trustpilot"],
                        help="Review platform to scrape")
    parser.add_argument("--url",
                        help="Product review page URL (required for G2 and Trustpilot)")
    parser.add_argument("--company-name",
                        help="Company name to search (Capterra only)")
    parser.add_argument("--max-reviews", type=int, default=50,
                        help="Max reviews to scrape (default: 50)")
    parser.add_argument("--keywords", help="Keywords to filter (comma-separated, OR logic)")
    parser.add_argument("--days", type=int, help="Only include reviews from last N days")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--token", help="Apify API token (or set APIFY_API_TOKEN env var)")
    parser.add_argument("--timeout", type=int, default=300,
                        help="Max seconds to wait for Apify run (default: 300)")

    args = parser.parse_args()

    token = get_token(args.token)

    # Build platform-specific input
    actor_input = build_input(args.platform, args.url, args.company_name, args.max_reviews)

    # Run actor
    raw_reviews = run_apify_actor(token, args.platform, actor_input, timeout=args.timeout)

    # Normalize to common schema
    reviews = [normalize_review(r, args.platform) for r in raw_reviews]

    # Filter
    keywords = None
    if args.keywords:
        keywords = [k.strip() for k in args.keywords.split(",")]
    reviews = filter_reviews(reviews, keywords=keywords, days=args.days)

    # Sort by date descending
    reviews.sort(key=lambda r: str(r.get("date", "")), reverse=True)

    print(f"Results: {len(reviews)} reviews after filtering.", file=sys.stderr)

    # Output
    if args.output == "summary":
        print(format_summary(reviews))
    else:
        print(json.dumps(reviews, indent=2))


if __name__ == "__main__":
    main()
