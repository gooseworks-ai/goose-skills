#!/usr/bin/env python3
"""
Web Archive Scraper — Search the Wayback Machine for archived website snapshots.

Usage:
    python3 search_archive.py --url "https://example.com"
    python3 search_archive.py --url URL --from 2025-01-01 --to 2026-01-01
    python3 search_archive.py --url URL --match prefix --limit 50
    python3 search_archive.py --url URL --fetch
    python3 search_archive.py --url URL --output summary
"""

import argparse
import csv
import json
import re
import sys
import time
from datetime import datetime
from io import StringIO

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests", file=sys.stderr)
    sys.exit(1)

CDX_API = "https://web.archive.org/cdx/search/cdx"
WAYBACK_BASE = "https://web.archive.org/web"

HEADERS = {
    "User-Agent": "WebArchiveScraper/1.0 (research tool)"
}

# Rate limiting: ~15 req/min max
REQUEST_DELAY = 4.0  # seconds between content fetches


# ---------------------------------------------------------------------------
# CDX API Search
# ---------------------------------------------------------------------------

def search_snapshots(url, match_type="exact", from_date=None, to_date=None,
                     limit=25, status_filter="200", collapse="day"):
    """Search the Wayback Machine CDX API for snapshots of a URL."""
    params = {
        "url": url,
        "output": "json",
        "fl": "timestamp,original,statuscode,mimetype,digest",
        "limit": limit,
    }

    if match_type != "exact":
        params["matchType"] = match_type

    if from_date:
        params["from"] = from_date.replace("-", "")

    if to_date:
        params["to"] = to_date.replace("-", "")

    if status_filter and status_filter != "any":
        params["filter"] = f"statuscode:{status_filter}"

    # Collapse to reduce duplicates
    if collapse == "day":
        params["collapse"] = "timestamp:8"
    elif collapse == "month":
        params["collapse"] = "timestamp:6"
    elif collapse == "year":
        params["collapse"] = "timestamp:4"

    try:
        resp = requests.get(CDX_API, params=params, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"ERROR: CDX API request failed: {e}", file=sys.stderr)
        return []

    try:
        data = resp.json()
    except json.JSONDecodeError:
        print("ERROR: Failed to parse CDX API response as JSON", file=sys.stderr)
        return []

    if not data or len(data) < 2:
        return []

    # First row is header
    headers_row = data[0]
    snapshots = []

    for row in data[1:]:
        record = dict(zip(headers_row, row))
        ts = record.get("timestamp", "")

        # Parse timestamp to readable datetime
        dt_str = ""
        if len(ts) >= 14:
            try:
                dt = datetime.strptime(ts[:14], "%Y%m%d%H%M%S")
                dt_str = dt.strftime("%Y-%m-%dT%H:%M:%S")
            except ValueError:
                dt_str = ts

        original_url = record.get("original", url)
        snapshots.append({
            "url": original_url,
            "timestamp": ts,
            "datetime": dt_str,
            "status_code": record.get("statuscode", ""),
            "mime_type": record.get("mimetype", ""),
            "digest": record.get("digest", ""),
            "archive_url": f"{WAYBACK_BASE}/{ts}/{original_url}",
            "raw_url": f"{WAYBACK_BASE}/{ts}id_/{original_url}",
            "content": None,
        })

    return snapshots


# ---------------------------------------------------------------------------
# Content Fetching
# ---------------------------------------------------------------------------

def fetch_archived_content(raw_url):
    """Fetch the raw archived page content (without Wayback toolbar)."""
    try:
        resp = requests.get(raw_url, headers=HEADERS, timeout=30, allow_redirects=True)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"  Warning: Failed to fetch {raw_url}: {e}", file=sys.stderr)
        return None


def extract_text(html):
    """Strip HTML tags and extract readable text."""
    if not html:
        return ""
    # Remove script and style blocks
    text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    # Remove tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Clean whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

CSV_FIELDS = ["url", "timestamp", "datetime", "status_code", "mime_type", "archive_url"]


def output_json(snapshots):
    # Remove None content fields if not fetched
    clean = []
    for s in snapshots:
        s_copy = dict(s)
        if s_copy["content"] is None:
            del s_copy["content"]
        clean.append(s_copy)
    print(json.dumps(clean, indent=2, ensure_ascii=False))


def output_csv(snapshots):
    writer = csv.DictWriter(sys.stdout, fieldnames=CSV_FIELDS, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(snapshots)


def output_summary(snapshots, url):
    print(f"\nWeb Archive Search Results")
    print("=" * 50)
    print(f"URL: {url}")
    print(f"Snapshots found: {len(snapshots)}")

    if not snapshots:
        print("\nNo archived snapshots found.")
        return

    dates = [s["datetime"] for s in snapshots if s["datetime"]]
    if dates:
        print(f"Date range: {dates[0][:10]} to {dates[-1][:10]}")

    print(f"\n{'#':<4} {'Date':<12} {'Status':<8} {'URL'}")
    print("-" * 80)
    for i, s in enumerate(snapshots, 1):
        date = s["datetime"][:10] if s["datetime"] else "unknown"
        status = s["status_code"]
        url_display = s["url"][:55] if len(s["url"]) > 55 else s["url"]
        print(f"{i:<4} {date:<12} {status:<8} {url_display}")

    if any(s["content"] for s in snapshots):
        print(f"\n--- Fetched Content ---")
        for s in snapshots:
            if s["content"]:
                text = extract_text(s["content"])
                print(f"\n[{s['datetime'][:10]}] {s['url']}")
                preview = text[:2000]
                if len(text) > 2000:
                    preview += "..."
                print(preview)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Search the Wayback Machine for archived website snapshots."
    )
    parser.add_argument("--url", required=True, help="Target URL to search")
    parser.add_argument("--match", choices=["exact", "prefix", "host", "domain"],
                        default="exact", help="URL match type (default: exact)")
    parser.add_argument("--from", dest="from_date", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--to", dest="to_date", help="End date (YYYY-MM-DD)")
    parser.add_argument("--limit", type=int, default=25, help="Max snapshots (default: 25)")
    parser.add_argument("--fetch", action="store_true",
                        help="Fetch content of the most recent snapshot")
    parser.add_argument("--fetch-all", action="store_true",
                        help="Fetch content of ALL matched snapshots")
    parser.add_argument("--status", default="200",
                        help="HTTP status filter (default: 200, use 'any' for all)")
    parser.add_argument("--output", choices=["json", "csv", "summary"],
                        default="json", help="Output format (default: json)")
    parser.add_argument("--collapse", choices=["none", "day", "month", "year"],
                        default="day", help="Dedup level (default: day)")

    args = parser.parse_args()

    print(f"Searching Wayback Machine for: {args.url}", file=sys.stderr)

    snapshots = search_snapshots(
        url=args.url,
        match_type=args.match,
        from_date=args.from_date,
        to_date=args.to_date,
        limit=args.limit,
        status_filter=args.status,
        collapse=args.collapse,
    )

    print(f"Found {len(snapshots)} snapshots", file=sys.stderr)

    # Fetch content if requested
    if args.fetch and snapshots:
        # Fetch most recent only
        target = snapshots[-1]
        print(f"Fetching content from {target['datetime'][:10]}...", file=sys.stderr)
        target["content"] = fetch_archived_content(target["raw_url"])
        if target["content"]:
            print(f"  Fetched {len(target['content'])} bytes", file=sys.stderr)

    elif args.fetch_all and snapshots:
        for i, s in enumerate(snapshots):
            print(f"Fetching {i+1}/{len(snapshots)}: {s['datetime'][:10]}...", file=sys.stderr)
            s["content"] = fetch_archived_content(s["raw_url"])
            if s["content"]:
                print(f"  Fetched {len(s['content'])} bytes", file=sys.stderr)
            if i < len(snapshots) - 1:
                time.sleep(REQUEST_DELAY)

    # Output
    if args.output == "csv":
        output_csv(snapshots)
    elif args.output == "summary":
        output_summary(snapshots, args.url)
    else:
        output_json(snapshots)


if __name__ == "__main__":
    main()
