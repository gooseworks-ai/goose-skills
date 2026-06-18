#!/usr/bin/env python3
"""
Search Google Ads by domain using Apify.
Scrapes ad creatives, formats, and campaign details via the burbn/google-ads-search actor.

Usage:
  python3 search_google_ads.py --domain "hubspot.com"
  python3 search_google_ads.py --company "Nike"
  python3 search_google_ads.py --domain "nike.com" --max-ads 30
"""

import json
import os
import sys
import argparse
import requests
import time as time_mod
import re
from urllib.parse import quote


ACTOR_ID = "burbn~google-ads-search"

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    BASE_URL = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    BASE_URL = "https://api.apify.com/v2"

# Google Ads Transparency Center base URL (used for advertiser ID resolution)
GADS_BASE = "https://adstransparency.google.com"


def get_token(cli_token=None):
    """Get API token from CLI arg, GOOSEWORKS_API_KEY, or APIFY_API_TOKEN env var."""
    token = cli_token or GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def resolve_advertiser_id(company=None, domain=None, token=None, timeout=120):
    """
    Resolve a company name to a domain via Google Ads Transparency Center.

    This is an optional helper for when only a company name is provided.
    It uses Apify's web-scraper to search the transparency center and extract
    advertiser info including the domain.

    Args:
        company: Company name to search
        domain: Company domain (e.g. "nike.com") — if provided, returns immediately
        token: Apify API token
        timeout: Max seconds to wait

    Returns:
        dict with advertiser_id, advertiser_name, and domain, or None
    """
    if domain:
        return {"domain": domain}

    search_term = company
    if not search_term:
        return None

    print(f"Searching Google Ads Transparency Center for: {search_term}", file=sys.stderr)

    scraper_actor = "apify~web-scraper"
    search_url = f"{GADS_BASE}/?region=anywhere&text={quote(search_term)}"

    print(f"Attempting to resolve company name to advertiser info...", file=sys.stderr)

    run_input = {
        "startUrls": [{"url": search_url}],
        "pageFunction": """async function pageFunction(context) {
            const { page, request } = context;
            // Wait for advertiser results to load
            await page.waitForSelector('advertiser-row, .advertiser-name, [data-advertiser-id], a[href*="/advertiser/"]', { timeout: 15000 }).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));

            // Extract advertiser links and info
            const advertisers = await page.evaluate(() => {
                const results = [];
                const links = document.querySelectorAll('a[href*="/advertiser/"]');
                links.forEach(link => {
                    const href = link.getAttribute('href') || '';
                    const match = href.match(/\\/advertiser\\/(AR\\d+)/);
                    if (match) {
                        const name = link.textContent.trim() || '';
                        results.push({
                            advertiser_id: match[1],
                            advertiser_name: name,
                            url: 'https://adstransparency.google.com' + href,
                        });
                    }
                });
                const seen = new Set();
                return results.filter(r => {
                    if (seen.has(r.advertiser_id)) return false;
                    seen.add(r.advertiser_id);
                    return true;
                });
            });

            return advertisers;
        }""",
        "proxyConfiguration": {"useApifyProxy": True},
        "maxRequestsPerCrawl": 1,
    }

    resp = requests.post(
        f"{BASE_URL}/acts/{scraper_actor}/runs",
        json=run_input,
        params={"token": token},
    )
    resp.raise_for_status()
    run_data = resp.json()
    run_id = run_data["data"]["id"]
    print(f"Advertiser lookup run started (ID: {run_id})", file=sys.stderr)

    # Poll for completion
    deadline = time_mod.time() + timeout
    while time_mod.time() < deadline:
        status_resp = requests.get(
            f"{BASE_URL}/acts/{scraper_actor}/runs/{run_id}",
            params={"token": token},
        )
        status_resp.raise_for_status()
        status_data = status_resp.json()
        status = status_data["data"]["status"]

        if status == "SUCCEEDED":
            break
        elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
            print(f"Advertiser lookup {status}. Try providing --domain directly.", file=sys.stderr)
            return None

        time_mod.sleep(3)
    else:
        print("Advertiser lookup timed out. Try providing --domain directly.", file=sys.stderr)
        return None

    # Fetch results
    dataset_id = status_data["data"]["defaultDatasetId"]
    dataset_resp = requests.get(
        f"{BASE_URL}/datasets/{dataset_id}/items",
        params={"token": token, "format": "json"},
    )
    dataset_resp.raise_for_status()
    results = dataset_resp.json()

    advertisers = []
    for item in results:
        if isinstance(item, list):
            advertisers.extend(item)
        elif isinstance(item, dict):
            if "advertiser_id" in item:
                advertisers.append(item)
            elif isinstance(item.get("result"), list):
                advertisers.extend(item["result"])

    if advertisers:
        print(f"Found {len(advertisers)} advertiser(s):", file=sys.stderr)
        for adv in advertisers[:5]:
            print(f"  - {adv.get('advertiser_name', 'Unknown')}: {adv.get('advertiser_id', 'N/A')}", file=sys.stderr)
        return advertisers[0]
    else:
        print("No advertisers found. Try providing --domain directly.", file=sys.stderr)
        return None


def run_ad_scraper(token, domain, max_ads=50, timeout=300):
    """
    Run the burbn/google-ads-search actor.

    Args:
        token: Apify API token
        domain: Domain to search ads for (e.g. "hubspot.com")
        max_ads: Maximum ads to return
        timeout: Max seconds to wait

    Returns:
        List of ad dicts from the actor's dataset
    """
    run_input = {
        "domain": domain,
        "maxItems": max_ads,
    }

    print(f"Starting Google Ads scraper for domain: {domain}...", file=sys.stderr)
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
    lines.append(f"{'#':<4} {'Advertiser':<25} {'Format':<12} {'Start Date':<12} {'Creative URL (preview)'}")
    lines.append("-" * 110)
    for i, ad in enumerate(ads, 1):
        advertiser = str(ad.get("advertiserName") or ad.get("advertiserId") or "Unknown")[:24]
        fmt = str(ad.get("variantFormat") or "")[:11]
        start_date = str(ad.get("startDate") or "")[:11]

        url = ad.get("originalUrl") or ad.get("imageUrl") or ""
        url_preview = str(url)[:45] if url else ""

        lines.append(f"{i:<4} {advertiser:<25} {fmt:<12} {start_date:<12} {url_preview}")

    lines.append(f"\nTotal: {len(ads)} ads")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Search Google Ads by domain using Apify burbn/google-ads-search actor",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search by domain (recommended)
  %(prog)s --domain "hubspot.com"

  # Search by company name (resolves to domain via transparency center)
  %(prog)s --company "Nike"

  # Limit results
  %(prog)s --domain "hubspot.com" --max-ads 30

  # Human-readable summary
  %(prog)s --domain "stripe.com" --output summary
""",
    )

    parser.add_argument("--company", help="Company name to search for (resolved to domain via transparency center)")
    parser.add_argument("--domain", help="Company domain (e.g. hubspot.com) — recommended, most direct")
    parser.add_argument("--max-ads", type=int, default=50,
                        help="Max number of ads to return (default: 50)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--token", help="Apify API token (or set APIFY_API_TOKEN env var)")
    parser.add_argument("--timeout", type=int, default=300,
                        help="Max seconds to wait for Apify run (default: 300)")

    args = parser.parse_args()

    if not args.company and not args.domain:
        parser.error("At least one of --company or --domain is required")

    token = get_token(args.token)

    # Resolve domain
    domain = args.domain
    if not domain:
        # Try to resolve company name to domain
        result = resolve_advertiser_id(
            company=args.company,
            token=token,
        )
        if result and result.get("domain"):
            domain = result["domain"]
            print(f"Resolved to domain: {domain}", file=sys.stderr)
        else:
            print("Could not resolve company name to domain.", file=sys.stderr)
            print("Tips:", file=sys.stderr)
            print("  1. Use --domain directly (e.g. --domain nike.com)", file=sys.stderr)
            print("  2. The domain is what appears in the company's ad URLs", file=sys.stderr)
            sys.exit(1)

    # Run the ad scraper
    ads = run_ad_scraper(
        token=token,
        domain=domain,
        max_ads=args.max_ads,
        timeout=args.timeout,
    )

    # Output
    if args.output == "summary":
        print(format_summary(ads))
    else:
        print(json.dumps(ads, indent=2))


if __name__ == "__main__":
    main()
