#!/usr/bin/env python3
"""
Search BuiltWith for websites using a specific technology.
Uses the free BuiltWith lookup via web scraping (no API key needed for basic results).

Usage:
    python3 search_builtwith.py --technology "datadog" --output json
    python3 search_builtwith.py --technology "segment" --max-results 50 --output summary
"""

import argparse
import json
import re
import sys

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

BUILTWITH_FREE_URL = "https://trends.builtwith.com/websitelist"


def search_builtwith_free(technology, max_results=50):
    """
    Search BuiltWith free trends for websites using a technology.
    Scrapes the public trends page for domain listings.

    Args:
        technology: Technology/product name to search for
        max_results: Maximum number of results to return

    Returns:
        List of dicts: [{domain, technology_detected, source_url}]
    """
    # Try the free BuiltWith trends/technology page
    search_url = f"https://trends.builtwith.com/{technology}"

    print(f"Searching BuiltWith for: {technology}", file=sys.stderr)
    print(f"URL: {search_url}", file=sys.stderr)

    results = []

    try:
        resp = requests.get(search_url, headers=HEADERS, timeout=20, allow_redirects=True)
        if resp.status_code != 200:
            print(f"  BuiltWith returned status {resp.status_code}", file=sys.stderr)
            # Try alternative URL format
            search_url = f"https://trends.builtwith.com/analytics/{technology}"
            print(f"  Trying: {search_url}", file=sys.stderr)
            resp = requests.get(search_url, headers=HEADERS, timeout=20, allow_redirects=True)

        if resp.status_code == 200:
            html = resp.text
            results = extract_domains_from_html(html, technology, search_url)
    except Exception as e:
        print(f"  Warning: BuiltWith request failed: {e}", file=sys.stderr)

    # Also try the websitelist endpoint
    if len(results) < max_results:
        try:
            list_url = f"{BUILTWITH_FREE_URL}/{technology}"
            print(f"  Also checking: {list_url}", file=sys.stderr)
            resp = requests.get(list_url, headers=HEADERS, timeout=20, allow_redirects=True)
            if resp.status_code == 200:
                more = extract_domains_from_html(resp.text, technology, list_url)
                # Deduplicate
                seen = {r["domain"] for r in results}
                for r in more:
                    if r["domain"] not in seen:
                        results.append(r)
                        seen.add(r["domain"])
        except Exception as e:
            print(f"  Warning: websitelist request failed: {e}", file=sys.stderr)

    return results[:max_results]


def extract_domains_from_html(html, technology, source_url):
    """Extract domain names from BuiltWith HTML pages."""
    results = []
    seen = set()

    # Pattern 1: Look for domain links in the typical BuiltWith format
    # BuiltWith lists domains as links like <a href="/websites/domain.com">domain.com</a>
    domain_patterns = [
        # Direct domain links
        re.compile(r'href="[^"]*?/(?:websites?|site)/([a-zA-Z0-9][a-zA-Z0-9\-]*\.[a-zA-Z]{2,})"', re.IGNORECASE),
        # Domain text in table cells or list items
        re.compile(r'>([a-zA-Z0-9][a-zA-Z0-9\-]*\.(?:com|org|net|io|co|ai|app|dev|tech|cloud))</', re.IGNORECASE),
        # BuiltWith specific patterns
        re.compile(r'class="[^"]*?domain[^"]*?"[^>]*>([a-zA-Z0-9][a-zA-Z0-9\-]*\.[a-zA-Z]{2,})<', re.IGNORECASE),
    ]

    for pattern in domain_patterns:
        for match in pattern.finditer(html):
            domain = match.group(1).lower().strip()
            if domain not in seen and is_valid_domain(domain):
                seen.add(domain)
                results.append({
                    "domain": domain,
                    "technology_detected": technology,
                    "source_url": source_url,
                })

    return results


def is_valid_domain(domain):
    """Check if a domain looks valid and not a BuiltWith/internal domain."""
    if not domain or len(domain) < 4:
        return False

    skip_domains = {
        "builtwith.com", "trends.builtwith.com", "example.com",
        "w3.org", "schema.org", "googleapis.com", "gstatic.com",
        "cloudflare.com", "jquery.com", "bootstrapcdn.com",
    }

    if domain in skip_domains:
        return False

    # Must have at least one dot
    if "." not in domain:
        return False

    return True


def search_builtwith_api(technology, api_key, max_results=50):
    """
    Search BuiltWith using the paid API (more comprehensive results).

    Args:
        technology: Technology name
        api_key: BuiltWith API key
        max_results: Max results

    Returns:
        List of dicts
    """
    url = "https://api.builtwith.com/lists8/api.json"
    params = {
        "KEY": api_key,
        "TECH": technology,
        "AMOUNT": min(max_results, 1000),
    }

    print(f"Querying BuiltWith API for: {technology}", file=sys.stderr)

    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  BuiltWith API error: {e}", file=sys.stderr)
        return []

    results = []
    for item in data.get("Results", []):
        domain = item.get("D", "")
        if domain:
            first_detected = ""
            techs = item.get("T", [])
            for t in techs:
                if technology.lower() in t.get("N", "").lower():
                    fd = t.get("FD", "")
                    if fd:
                        first_detected = fd
                    break

            results.append({
                "domain": domain,
                "technology_detected": technology,
                "first_detected": first_detected,
                "source_url": "BuiltWith API",
            })

    return results[:max_results]


def output_json(results):
    print(json.dumps(results, indent=2, ensure_ascii=False))


def output_summary(results, technology):
    print(f"\nBuiltWith Search Results")
    print("=" * 50)
    print(f"Technology: {technology}")
    print(f"Websites found: {len(results)}")

    if not results:
        print("\nNo websites found using this technology.")
        return

    print(f"\n{'#':<4} {'Domain':<40} {'Source'}")
    print("-" * 70)
    for i, r in enumerate(results, 1):
        domain = r["domain"][:38]
        source = r.get("source_url", "")[:25]
        print(f"{i:<4} {domain:<40} {source}")


def main():
    parser = argparse.ArgumentParser(
        description="Search BuiltWith for websites using a specific technology."
    )
    parser.add_argument("--technology", required=True,
                        help="Technology or product name to search for")
    parser.add_argument("--max-results", type=int, default=50,
                        help="Max results to return (default: 50)")
    parser.add_argument("--api-key", help="BuiltWith API key (optional, for paid API access)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")

    args = parser.parse_args()

    if args.api_key:
        results = search_builtwith_api(args.technology, args.api_key, args.max_results)
    else:
        results = search_builtwith_free(args.technology, args.max_results)

    print(f"Found {len(results)} websites", file=sys.stderr)

    if args.output == "summary":
        output_summary(results, args.technology)
    else:
        output_json(results)


if __name__ == "__main__":
    main()
