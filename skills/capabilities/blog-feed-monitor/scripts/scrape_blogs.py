#!/usr/bin/env python3
"""
Scrape blog posts via RSS feeds (free) with Apify fallback.
Supports RSS 2.0 and Atom feeds. Tries common feed paths automatically.

Usage:
  python3 scrape_blogs.py --urls "https://example.com/blog" --days 30
  python3 scrape_blogs.py --urls "https://example.com/blog,https://other.com" --keywords "AI" --output summary
  python3 scrape_blogs.py --urls "https://example.com" --mode apify --token YOUR_TOKEN
"""

import json
import os
import sys
import argparse
import requests
import time as time_mod
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime


# Common RSS feed paths to try
FEED_PATHS = [
    "/feed",
    "/rss",
    "/atom.xml",
    "/feed.xml",
    "/rss.xml",
    "/blog/feed",
    "/index.xml",
    "/blog/rss",
    "/blog/atom.xml",
    "/blog/feed.xml",
]

APIFY_ACTOR = "jupri~rss-xml-scraper"
APIFY_BASE = "https://api.apify.com/v2"


def discover_feed_url(blog_url):
    """
    Try to discover the RSS/Atom feed URL for a blog.
    First checks HTML <link rel="alternate"> tags, then tries common paths.

    Args:
        blog_url: The blog's base URL

    Returns:
        Feed URL string or None
    """
    blog_url = blog_url.rstrip("/")

    # First, check HTML for <link rel="alternate"> feed declaration
    try:
        resp = requests.get(blog_url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        if resp.status_code == 200:
            content = resp.text
            # Simple regex-free parsing for link tags
            for line in content.split(">"):
                if 'rel="alternate"' in line or "rel='alternate'" in line:
                    if "application/rss+xml" in line or "application/atom+xml" in line:
                        # Extract href
                        for part in line.split('"'):
                            if part.startswith("http") and ("feed" in part or "rss" in part or "atom" in part):
                                print(f"  Found feed via HTML link tag: {part}", file=sys.stderr)
                                return part
                        for part in line.split("'"):
                            if part.startswith("http") and ("feed" in part or "rss" in part or "atom" in part):
                                print(f"  Found feed via HTML link tag: {part}", file=sys.stderr)
                                return part
                        # Try href= extraction
                        if 'href="' in line:
                            href = line.split('href="')[1].split('"')[0]
                            if href.startswith("/"):
                                href = blog_url + href
                            print(f"  Found feed via HTML link tag: {href}", file=sys.stderr)
                            return href
    except Exception:
        pass

    # Try common feed paths
    for path in FEED_PATHS:
        feed_url = blog_url + path
        try:
            resp = requests.get(feed_url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200 and ("<?xml" in resp.text[:100] or "<rss" in resp.text[:200] or "<feed" in resp.text[:200]):
                print(f"  Found feed at: {feed_url}", file=sys.stderr)
                return feed_url
        except Exception:
            continue

    return None


def parse_rss_date(date_str):
    """Parse RSS/Atom date strings into datetime objects."""
    if not date_str:
        return None

    # Try RFC 2822 (RSS 2.0 pubDate format)
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        pass

    # Try ISO 8601 (Atom published/updated format)
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        pass

    return None


def parse_feed(feed_content, source_url):
    """
    Parse RSS 2.0 or Atom feed XML into a list of post dicts.

    Args:
        feed_content: XML string
        source_url: Original blog URL (for source attribution)

    Returns:
        List of post dicts
    """
    posts = []

    try:
        root = ET.fromstring(feed_content)
    except ET.ParseError as e:
        print(f"  [WARN] Failed to parse XML: {e}", file=sys.stderr)
        return posts

    # Handle XML namespaces
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    # Try RSS 2.0 format (<channel>/<item>)
    for item in root.iter("item"):
        post = {
            "title": (item.findtext("title") or "").strip(),
            "url": (item.findtext("link") or "").strip(),
            "date": parse_rss_date(item.findtext("pubDate")),
            "description": (item.findtext("description") or "").strip(),
            "author": (item.findtext("author") or item.findtext("{http://purl.org/dc/elements/1.1/}creator") or "").strip(),
            "source": source_url,
        }
        posts.append(post)

    # Try Atom format (<entry>)
    if not posts:
        for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):
            link_elem = entry.find("{http://www.w3.org/2005/Atom}link[@rel='alternate']")
            if link_elem is None:
                link_elem = entry.find("{http://www.w3.org/2005/Atom}link")

            post = {
                "title": (entry.findtext("{http://www.w3.org/2005/Atom}title") or "").strip(),
                "url": (link_elem.get("href", "") if link_elem is not None else "").strip(),
                "date": parse_rss_date(entry.findtext("{http://www.w3.org/2005/Atom}published") or entry.findtext("{http://www.w3.org/2005/Atom}updated")),
                "description": (entry.findtext("{http://www.w3.org/2005/Atom}summary") or entry.findtext("{http://www.w3.org/2005/Atom}content") or "").strip(),
                "author": (entry.findtext("{http://www.w3.org/2005/Atom}author/{http://www.w3.org/2005/Atom}name") or "").strip(),
                "source": source_url,
            }
            posts.append(post)

    return posts


def scrape_rss(blog_urls, days=30, max_posts=50):
    """
    Scrape blog posts via RSS feeds.

    Args:
        blog_urls: List of blog URL strings
        days: Number of days back to include
        max_posts: Maximum posts to return

    Returns:
        Tuple of (posts list, failed_urls list)
    """
    all_posts = []
    failed_urls = []

    for url in blog_urls:
        print(f"Discovering feed for: {url}", file=sys.stderr)
        feed_url = discover_feed_url(url)

        if not feed_url:
            print(f"  [WARN] No feed found for {url}", file=sys.stderr)
            failed_urls.append(url)
            continue

        try:
            resp = requests.get(feed_url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            posts = parse_feed(resp.text, url)
            print(f"  Parsed {len(posts)} posts from feed.", file=sys.stderr)
            all_posts.extend(posts)
        except Exception as e:
            print(f"  [ERROR] Failed to fetch/parse feed: {e}", file=sys.stderr)
            failed_urls.append(url)

    return all_posts[:max_posts], failed_urls


def scrape_apify(token, blog_urls, max_posts=50, timeout=300):
    """
    Scrape blog posts via Apify RSS scraper (fallback for JS-heavy sites).

    Args:
        token: Apify API token
        blog_urls: List of feed or blog URLs
        max_posts: Maximum posts to return
        timeout: Max seconds to wait

    Returns:
        List of post dicts
    """
    run_input = {
        "urls": [{"url": u} for u in blog_urls],
        "maxItems": max_posts,
    }

    print(f"Starting Apify actor run ({APIFY_ACTOR})...", file=sys.stderr)
    resp = requests.post(
        f"{APIFY_BASE}/acts/{APIFY_ACTOR}/runs",
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
            f"{APIFY_BASE}/acts/{APIFY_ACTOR}/runs/{run_id}",
            params={"token": token},
        )
        status_resp.raise_for_status()
        status_data = status_resp.json()
        status = status_data["data"]["status"]

        if status == "SUCCEEDED":
            print("Scraping complete.", file=sys.stderr)
            break
        elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
            raise RuntimeError(f"Actor run {status}")

        print(f"Status: {status}...", file=sys.stderr)
        time_mod.sleep(5)
    else:
        raise TimeoutError(f"Actor run did not complete within {timeout}s")

    # Fetch dataset
    dataset_id = status_data["data"]["defaultDatasetId"]
    dataset_resp = requests.get(
        f"{APIFY_BASE}/datasets/{dataset_id}/items",
        params={"token": token, "format": "json"},
    )
    dataset_resp.raise_for_status()
    items = dataset_resp.json()

    # Normalize to our schema
    posts = []
    for item in items:
        posts.append({
            "title": item.get("title", ""),
            "url": item.get("link") or item.get("url", ""),
            "date": parse_rss_date(item.get("pubDate") or item.get("isoDate")),
            "description": item.get("contentSnippet") or item.get("description", ""),
            "author": item.get("creator") or item.get("author", ""),
            "source": item.get("feedUrl", ""),
        })

    print(f"Fetched {len(posts)} posts via Apify.", file=sys.stderr)
    return posts


def filter_posts(posts, keywords=None, days=None):
    """Client-side date and keyword filtering."""
    filtered = posts

    if days is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        date_filtered = []
        for p in filtered:
            dt = p.get("date")
            if dt is None:
                date_filtered.append(p)
                continue
            if not isinstance(dt, datetime):
                date_filtered.append(p)
                continue
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if dt >= cutoff:
                date_filtered.append(p)
        filtered = date_filtered

    if keywords:
        kw_lower = [k.lower() for k in keywords]
        kw_filtered = []
        for p in filtered:
            text = f"{p.get('title', '')} {p.get('description', '')}".lower()
            if any(kw in text for kw in kw_lower):
                kw_filtered.append(p)
        filtered = kw_filtered

    return filtered


def format_summary(posts):
    """Format posts as a human-readable summary table."""
    lines = []
    lines.append(f"{'#':<4} {'Date':<12} {'Source':<25} {'Title'}")
    lines.append("-" * 100)
    for i, p in enumerate(posts, 1):
        title = (p.get("title") or "")[:55]
        date = ""
        if p.get("date"):
            date = p["date"].strftime("%Y-%m-%d") if isinstance(p["date"], datetime) else str(p["date"])[:10]
        source = (p.get("source") or "")
        # Shorten source to domain
        if "://" in source:
            source = source.split("://")[1].split("/")[0]
        source = source[:23]
        lines.append(f"{i:<4} {date:<12} {source:<25} {title}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Scrape blog posts via RSS feeds (free) with Apify fallback",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape a blog's RSS feed
  %(prog)s --urls "https://example.com/blog" --days 30

  # Multiple blogs with keyword filter
  %(prog)s --urls "https://blog1.com,https://blog2.com" --keywords "AI,marketing" --output summary

  # Force Apify mode for JS-heavy sites
  %(prog)s --urls "https://example.com" --mode apify --token YOUR_TOKEN
""",
    )

    parser.add_argument("--urls", required=True,
                        help="Blog URL(s), comma-separated")
    parser.add_argument("--keywords", help="Keywords to filter (comma-separated, OR logic)")
    parser.add_argument("--days", type=int, default=30,
                        help="Only include posts from last N days (default: 30)")
    parser.add_argument("--max-posts", type=int, default=50,
                        help="Max posts to return (default: 50)")
    parser.add_argument("--mode", choices=["auto", "rss", "apify"], default="auto",
                        help="Scraping mode (default: auto — tries RSS first, falls back to Apify)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--token", help="Apify API token (for Apify mode)")
    parser.add_argument("--timeout", type=int, default=300,
                        help="Max seconds to wait for Apify run (default: 300)")

    args = parser.parse_args()

    blog_urls = [u.strip() for u in args.urls.split(",") if u.strip()]

    posts = []

    if args.mode == "rss":
        posts, failed = scrape_rss(blog_urls, days=args.days, max_posts=args.max_posts)
        if failed:
            print(f"[WARN] No feed found for: {', '.join(failed)}", file=sys.stderr)

    elif args.mode == "apify":
        token = args.token or os.environ.get("APIFY_API_TOKEN")
        if not token:
            print("Error: Apify token required for apify mode. Use --token or set APIFY_API_TOKEN.", file=sys.stderr)
            sys.exit(1)
        posts = scrape_apify(token, blog_urls, max_posts=args.max_posts, timeout=args.timeout)

    else:  # auto mode
        posts, failed = scrape_rss(blog_urls, days=args.days, max_posts=args.max_posts)
        if failed:
            token = args.token or os.environ.get("APIFY_API_TOKEN")
            if token:
                print(f"Falling back to Apify for: {', '.join(failed)}", file=sys.stderr)
                apify_posts = scrape_apify(token, failed, max_posts=args.max_posts, timeout=args.timeout)
                posts.extend(apify_posts)
            else:
                print(f"[WARN] No feed found for: {', '.join(failed)} (set APIFY_API_TOKEN for fallback)", file=sys.stderr)

    # Parse keywords
    keywords = None
    if args.keywords:
        keywords = [k.strip() for k in args.keywords.split(",")]

    # Filter
    posts = filter_posts(posts, keywords=keywords, days=args.days)

    # Sort by date descending
    def sort_key(p):
        dt = p.get("date")
        if isinstance(dt, datetime):
            return dt.timestamp()
        return 0
    posts.sort(key=sort_key, reverse=True)

    # Serialize dates for JSON output
    for p in posts:
        if isinstance(p.get("date"), datetime):
            p["date"] = p["date"].isoformat()

    print(f"Results: {len(posts)} posts after filtering.", file=sys.stderr)

    # Output
    if args.output == "summary":
        print(format_summary(posts))
    else:
        print(json.dumps(posts, indent=2))


if __name__ == "__main__":
    main()
