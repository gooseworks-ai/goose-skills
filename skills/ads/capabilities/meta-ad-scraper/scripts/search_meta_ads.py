#!/usr/bin/env python3
"""
Search Meta Ad Library for competitor ads using Apify.
Searches by company name, keyword, or Facebook Page URL.

Usage:
  python3 search_meta_ads.py --company "Nike"
  python3 search_meta_ads.py --company "Shopify" --country US --max-ads 20
  python3 search_meta_ads.py --page-url "https://www.facebook.com/nike"
"""

import json
import os
import sys
import argparse
import requests
import time as time_mod
from urllib.parse import quote, urlencode


ACTOR_ID = "apify~facebook-ads-scraper"

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


def build_ad_library_url(company=None, page_url=None, country="ALL", ad_status="active"):
    """
    Build a Meta Ad Library URL for searching.

    Args:
        company: Company name or keyword to search
        page_url: Direct Facebook Page URL (overrides company search)
        country: 2-letter country code or ALL
        ad_status: 'active' or 'all'

    Returns:
        URL string for the Meta Ad Library
    """
    if page_url:
        # If a direct page URL is given, construct an ad library URL from it
        # Strip trailing slashes and extract page identifier
        page_url = page_url.rstrip("/")
        # Convert facebook.com/pagename to an ad library search
        if "facebook.com/ads/library" in page_url:
            # Already an ad library URL, use as-is
            return page_url
        else:
            # It's a regular page URL — extract the page name/ID
            # and build an ad library URL
            page_id = page_url.split("/")[-1]
            params = {
                "active_status": ad_status,
                "ad_type": "all",
                "country": country,
                "view_all_page_id": page_id,
            }
            return f"https://www.facebook.com/ads/library/?{urlencode(params)}"

    # Search by company name / keyword
    status_map = {"active": "active", "all": "all"}
    params = {
        "active_status": status_map.get(ad_status, "active"),
        "ad_type": "all",
        "country": country,
        "q": company,
        "search_type": "keyword_unordered",
    }
    return f"https://www.facebook.com/ads/library/?{urlencode(params)}"


def run_apify_actor(token, start_urls, max_ads=50, timeout=300):
    """
    Run the Apify Facebook Ads Scraper actor and return results.

    Args:
        token: Apify API token
        start_urls: List of {"url": "..."} dicts
        max_ads: Maximum ads to scrape
        timeout: Max seconds to wait

    Returns:
        List of ad dicts from the actor's dataset
    """
    run_input = {
        "startUrls": start_urls,
        "resultsLimit": max_ads,
    }

    # Start the actor run
    print(f"Starting Apify actor run for Meta Ad Library...", file=sys.stderr)
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
    ads = dataset_resp.json()
    print(f"Fetched {len(ads)} ads.", file=sys.stderr)
    return ads


def format_summary(ads):
    """Format ads as a human-readable summary."""
    lines = []
    lines.append(f"{'#':<4} {'Page':<25} {'Status':<10} {'Platforms':<25} {'Start Date':<12} {'Ad Text (preview)'}")
    lines.append("-" * 120)
    for i, ad in enumerate(ads, 1):
        page = str(ad.get("page_name") or ad.get("pageName") or "Unknown")[:24]
        status = str(ad.get("status") or ad.get("isActive", ""))[:9]
        platforms = ", ".join(ad.get("platforms") or ad.get("publisherPlatform") or [])[:24]
        start = str(ad.get("ad_delivery_start_time") or ad.get("startDate") or "")[:11]

        # Try multiple possible field names for ad text
        text = (
            ad.get("ad_text")
            or ad.get("adText")
            or ad.get("ad_creative_body")
            or ad.get("body")
            or ad.get("title")
            or ""
        )
        text_preview = text[:50].replace("\n", " ") if text else ""

        lines.append(f"{i:<4} {page:<25} {status:<10} {platforms:<25} {start:<12} {text_preview}")

    lines.append(f"\nTotal: {len(ads)} ads")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Search Meta Ad Library for competitor ads using Apify",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search by company name
  %(prog)s --company "Nike"

  # With country filter
  %(prog)s --company "Shopify" --country US

  # By Facebook Page URL
  %(prog)s --page-url "https://www.facebook.com/nike"

  # Include inactive ads
  %(prog)s --company "HubSpot" --ad-status all

  # Human-readable summary
  %(prog)s --company "Stripe" --output summary
""",
    )

    parser.add_argument("--company", help="Company name or keyword to search")
    parser.add_argument("--page-url", help="Facebook Page URL for exact advertiser match")
    parser.add_argument("--country", default="ALL",
                        help="2-letter country code (US, GB, DE) or ALL (default: ALL)")
    parser.add_argument("--ad-status", choices=["active", "all"], default="active",
                        help="Ad status filter (default: active)")
    parser.add_argument("--max-ads", type=int, default=50,
                        help="Max number of ads to return (default: 50)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--token", help="Apify API token (or set APIFY_API_TOKEN env var)")
    parser.add_argument("--timeout", type=int, default=300,
                        help="Max seconds to wait for Apify run (default: 300)")

    args = parser.parse_args()

    if not args.company and not args.page_url:
        parser.error("Either --company or --page-url is required")

    token = get_token(args.token)

    # Build the Ad Library URL
    ad_library_url = build_ad_library_url(
        company=args.company,
        page_url=args.page_url,
        country=args.country,
        ad_status=args.ad_status,
    )
    print(f"Ad Library URL: {ad_library_url}", file=sys.stderr)

    start_urls = [{"url": ad_library_url}]

    # Run actor
    ads = run_apify_actor(token, start_urls, max_ads=args.max_ads, timeout=args.timeout)

    # Output
    if args.output == "summary":
        print(format_summary(ads))
    else:
        print(json.dumps(ads, indent=2))


if __name__ == "__main__":
    main()
