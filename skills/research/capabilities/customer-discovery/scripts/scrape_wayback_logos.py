#!/usr/bin/env python3
"""
Scrape historical customer logos from the Wayback Machine.
Finds snapshots of customer/logo pages, extracts company names from images,
and flags logos that have been removed from the current site.

Usage:
    python3 scrape_wayback_logos.py --url "https://datadog.com" --output json
    python3 scrape_wayback_logos.py --url "https://notion.so" --paths "/customers,/logos" --output summary
"""

import argparse
import json
import re
import sys
import time
from datetime import datetime

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests", file=sys.stderr)
    sys.exit(1)

CDX_API = "https://web.archive.org/cdx/search/cdx"
WAYBACK_BASE = "https://web.archive.org/web"

HEADERS = {
    "User-Agent": "CustomerDiscovery/1.0 (research tool)"
}

# Rate limiting for Wayback Machine
REQUEST_DELAY = 4.0

DEFAULT_PATHS = ["/customers", "/logos", "/case-studies", "/partners", "/trust"]

# Noise filter for logo alt text
NOISE_WORDS = {
    "logo", "icon", "arrow", "chevron", "close", "menu", "hamburger", "search",
    "facebook", "twitter", "linkedin", "instagram", "youtube", "github", "tiktok",
    "pinterest", "slack", "discord", "reddit", "social",
    "cookie", "gdpr", "privacy", "terms", "footer", "header", "nav",
    "placeholder", "default", "avatar", "loading", "spinner",
    "banner", "hero", "background", "pattern", "decoration", "divider",
}


def search_snapshots(url, limit=10):
    """Search the Wayback Machine CDX API for snapshots of a URL."""
    params = {
        "url": url,
        "output": "json",
        "fl": "timestamp,original,statuscode",
        "limit": limit,
        "filter": "statuscode:200",
        "collapse": "timestamp:6",  # One per month
    }

    try:
        resp = requests.get(CDX_API, params=params, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"  Warning: CDX API request failed for {url}: {e}", file=sys.stderr)
        return []

    try:
        data = resp.json()
    except json.JSONDecodeError:
        return []

    if not data or len(data) < 2:
        return []

    headers_row = data[0]
    snapshots = []
    for row in data[1:]:
        record = dict(zip(headers_row, row))
        ts = record.get("timestamp", "")
        original = record.get("original", url)

        dt_str = ""
        if len(ts) >= 14:
            try:
                dt = datetime.strptime(ts[:14], "%Y%m%d%H%M%S")
                dt_str = dt.strftime("%Y-%m-%d")
            except ValueError:
                dt_str = ts[:8]

        snapshots.append({
            "timestamp": ts,
            "date": dt_str,
            "url": original,
            "raw_url": f"{WAYBACK_BASE}/{ts}id_/{original}",
        })

    return snapshots


def fetch_snapshot(raw_url):
    """Fetch archived page content."""
    try:
        resp = requests.get(raw_url, headers=HEADERS, timeout=30, allow_redirects=True)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"  Warning: Failed to fetch {raw_url}: {e}", file=sys.stderr)
        return None


def clean_name(raw):
    """Clean a potential company name from alt text."""
    if not raw:
        return None

    name = raw.strip()
    name = re.sub(r"\.(png|jpg|jpeg|svg|gif|webp|ico)$", "", name, flags=re.IGNORECASE)
    name = re.sub(r"^(logo[_\-\s]*of[_\-\s]*|logo[_\-\s]*)", "", name, flags=re.IGNORECASE)
    name = re.sub(r"[_\-\s]*logo$", "", name, flags=re.IGNORECASE)
    name = re.sub(r"[_\-]+", " ", name).strip()

    if name.islower() or name.isupper():
        name = name.title()

    if not name or len(name) < 2 or len(name) > 60:
        return None

    lower = name.lower()
    if any(noise in lower for noise in NOISE_WORDS):
        return None

    alpha_ratio = sum(1 for c in name if c.isalpha()) / max(len(name), 1)
    if alpha_ratio < 0.5:
        return None

    return name


def extract_logos_from_html(html):
    """Extract company names from img alt text in HTML."""
    names = set()

    img_pattern = re.compile(
        r'<img[^>]*?alt=["\']([^"\']+)["\'][^>]*?>',
        re.IGNORECASE | re.DOTALL
    )

    for match in img_pattern.finditer(html):
        alt_text = match.group(1)
        name = clean_name(alt_text)
        if name:
            names.add(name)

    # Also check title attributes
    title_pattern = re.compile(
        r'<(?:img|a)[^>]*?title=["\']([^"\']+)["\'][^>]*?>',
        re.IGNORECASE | re.DOTALL
    )

    for match in title_pattern.finditer(html):
        title_text = match.group(1)
        name = clean_name(title_text)
        if name:
            names.add(name)

    return names


def scrape_wayback_logos(base_url, paths, max_snapshots=5):
    """
    Scrape historical customer logos from the Wayback Machine.

    Args:
        base_url: Company website URL
        paths: List of paths to check (e.g., ["/customers", "/logos"])
        max_snapshots: Max snapshots to fetch per path

    Returns:
        List of customer dicts with historical data
    """
    base_url = base_url.rstrip("/")

    # Track when each company was first/last seen
    company_history = {}  # name -> {first_seen, last_seen, snapshot_urls}

    # Also get current logos for comparison
    current_logos = set()

    fetch_count = 0

    for path in paths:
        full_url = base_url + path
        print(f"Searching Wayback Machine for: {full_url}", file=sys.stderr)

        snapshots = search_snapshots(full_url, limit=max_snapshots)
        if not snapshots:
            print(f"  No snapshots found", file=sys.stderr)
            continue

        print(f"  Found {len(snapshots)} snapshots", file=sys.stderr)

        # Fetch current version first
        print(f"  Fetching current page...", file=sys.stderr)
        try:
            current_resp = requests.get(full_url, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
            }, timeout=15, allow_redirects=True)
            if current_resp.status_code == 200:
                current_names = extract_logos_from_html(current_resp.text)
                current_logos.update(current_names)
                print(f"  Current page has {len(current_names)} logos", file=sys.stderr)
        except Exception:
            pass

        # Fetch archived snapshots (most recent + oldest for range)
        snapshots_to_fetch = []
        if len(snapshots) >= 2:
            snapshots_to_fetch = [snapshots[0], snapshots[-1]]  # oldest + most recent
            if len(snapshots) > 2:
                mid = len(snapshots) // 2
                snapshots_to_fetch.insert(1, snapshots[mid])  # + middle
        else:
            snapshots_to_fetch = snapshots

        for snap in snapshots_to_fetch:
            if fetch_count > 0:
                time.sleep(REQUEST_DELAY)

            print(f"  Fetching snapshot from {snap['date']}...", file=sys.stderr)
            html = fetch_snapshot(snap["raw_url"])
            fetch_count += 1

            if not html:
                continue

            names = extract_logos_from_html(html)
            print(f"    Found {len(names)} logos in snapshot", file=sys.stderr)

            for name in names:
                key = name.lower()
                if key not in company_history:
                    company_history[key] = {
                        "name": name,
                        "first_seen": snap["date"],
                        "last_seen": snap["date"],
                        "snapshot_urls": [snap["raw_url"]],
                    }
                else:
                    entry = company_history[key]
                    if snap["date"] < entry["first_seen"]:
                        entry["first_seen"] = snap["date"]
                    if snap["date"] > entry["last_seen"]:
                        entry["last_seen"] = snap["date"]
                    if snap["raw_url"] not in entry["snapshot_urls"]:
                        entry["snapshot_urls"].append(snap["raw_url"])

    # Build results with still_present flag
    results = []
    current_lower = {n.lower() for n in current_logos}

    for key, entry in company_history.items():
        still_present = key in current_lower
        results.append({
            "name": entry["name"],
            "first_seen": entry["first_seen"],
            "last_seen": entry["last_seen"],
            "still_present": still_present,
            "snapshot_url": entry["snapshot_urls"][0],
        })

    # Sort: removed logos first (more interesting), then by name
    results.sort(key=lambda r: (r["still_present"], r["name"].lower()))

    return results


def output_json(results):
    print(json.dumps(results, indent=2, ensure_ascii=False))


def output_summary(results):
    print(f"\nWayback Machine Logo Scraper Results")
    print("=" * 50)
    print(f"Total companies found: {len(results)}")

    removed = [r for r in results if not r["still_present"]]
    current = [r for r in results if r["still_present"]]

    if removed:
        print(f"\nRemoved from current site ({len(removed)}):")
        for r in removed:
            print(f"  - {r['name']} (seen {r['first_seen']} to {r['last_seen']})")

    if current:
        print(f"\nStill present ({len(current)}):")
        for r in current:
            print(f"  - {r['name']} (since {r['first_seen']})")


def main():
    parser = argparse.ArgumentParser(
        description="Scrape historical customer logos from the Wayback Machine."
    )
    parser.add_argument("--url", required=True, help="Company website URL (e.g., https://datadog.com)")
    parser.add_argument("--paths", default=",".join(DEFAULT_PATHS),
                        help=f"Comma-separated paths to check (default: {','.join(DEFAULT_PATHS)})")
    parser.add_argument("--max-snapshots", type=int, default=5,
                        help="Max snapshots per path (default: 5)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")

    args = parser.parse_args()

    paths = [p.strip() for p in args.paths.split(",") if p.strip()]

    results = scrape_wayback_logos(args.url, paths, max_snapshots=args.max_snapshots)

    print(f"Found {len(results)} companies across all snapshots", file=sys.stderr)

    if args.output == "summary":
        output_summary(results)
    else:
        output_json(results)


if __name__ == "__main__":
    main()
