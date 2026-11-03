#!/usr/bin/env python3
"""
Search Hacker News using the free Algolia API.
No Apify token needed — uses the public HN Search API.

Usage:
  python3 search_hn.py --query "AI content marketing" --days 7
  python3 search_hn.py --query "LangChain" --days 30 --tags story --output summary
  python3 search_hn.py --query "Show HN" --days 7 --tags show_hn --max-results 20
"""

import json
import sys
import argparse
import requests
import time as time_mod
from datetime import datetime, timedelta, timezone


HN_API_BASE = "https://hn.algolia.com/api/v1"


def search_hn(query, days=7, tags="story", max_results=50):
    """
    Search Hacker News via Algolia API with server-side date filtering.

    Args:
        query: Search query string
        days: Number of days back to search
        tags: HN item type filter (story, comment, ask_hn, show_hn)
        max_results: Maximum results to return

    Returns:
        List of HN item dicts
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_unix = int(cutoff.timestamp())

    all_hits = []
    page = 0
    hits_per_page = min(max_results, 100)

    print(f"Searching HN for '{query}' (last {days} days, type: {tags})...", file=sys.stderr)

    while len(all_hits) < max_results:
        params = {
            "query": query,
            "tags": tags,
            "numericFilters": f"created_at_i>{cutoff_unix}",
            "hitsPerPage": hits_per_page,
            "page": page,
        }

        resp = requests.get(f"{HN_API_BASE}/search_by_date", params=params)
        resp.raise_for_status()
        data = resp.json()

        hits = data.get("hits", [])
        if not hits:
            break

        all_hits.extend(hits)
        page += 1

        # Check if we've exhausted results
        if page >= data.get("nbPages", 0):
            break

        # Rate limiting
        time_mod.sleep(0.2)

    # Trim to max_results
    all_hits = all_hits[:max_results]
    print(f"Found {len(all_hits)} results.", file=sys.stderr)
    return all_hits


def normalize_hit(hit):
    """Normalize an Algolia HN hit to a consistent schema."""
    return {
        "id": hit.get("objectID"),
        "title": hit.get("title") or hit.get("story_title") or "",
        "url": hit.get("url") or "",
        "author": hit.get("author", ""),
        "points": hit.get("points") or 0,
        "num_comments": hit.get("num_comments") or 0,
        "created_at": hit.get("created_at", ""),
        "hn_url": f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}",
        "text": hit.get("story_text") or hit.get("comment_text") or "",
    }


def filter_by_keywords(items, keywords):
    """Client-side keyword filtering (OR logic, case-insensitive)."""
    if not keywords:
        return items

    kw_lower = [k.lower() for k in keywords]
    filtered = []
    for item in items:
        text = f"{item.get('title', '')} {item.get('text', '')}".lower()
        if any(kw in text for kw in kw_lower):
            filtered.append(item)
    return filtered


def format_summary(items):
    """Format items as a human-readable summary table."""
    lines = []
    lines.append(f"{'#':<4} {'Points':<8} {'Comments':<10} {'Author':<18} {'Title'}")
    lines.append("-" * 100)
    for i, item in enumerate(items, 1):
        title = item.get("title", "")[:55]
        points = item.get("points", 0)
        comments = item.get("num_comments", 0)
        author = item.get("author", "")[:16]
        lines.append(f"{i:<4} {points:<8} {comments:<10} {author:<18} {title}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Search Hacker News using the free Algolia API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Stories about AI content marketing in last week
  %(prog)s --query "AI content marketing" --days 7

  # Show HN posts in last month
  %(prog)s --query "" --tags show_hn --days 30 --output summary

  # Comments mentioning a specific tool
  %(prog)s --query "LangChain" --tags comment --days 14 --max-results 20
""",
    )

    parser.add_argument("--query", required=True,
                        help="Search query")
    parser.add_argument("--days", type=int, default=7,
                        help="How many days back to search (default: 7)")
    parser.add_argument("--tags", default="story",
                        choices=["story", "comment", "ask_hn", "show_hn"],
                        help="HN item type to search (default: story)")
    parser.add_argument("--max-results", type=int, default=50,
                        help="Max results to return (default: 50)")
    parser.add_argument("--keywords", help="Additional keywords to filter (comma-separated, OR logic)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")

    args = parser.parse_args()

    # Search
    hits = search_hn(args.query, days=args.days, tags=args.tags, max_results=args.max_results)

    # Normalize
    items = [normalize_hit(h) for h in hits]

    # Optional keyword filtering
    if args.keywords:
        keywords = [k.strip() for k in args.keywords.split(",")]
        items = filter_by_keywords(items, keywords)

    # Sort by points descending
    items.sort(key=lambda x: x.get("points", 0), reverse=True)

    # Output
    if args.output == "summary":
        print(format_summary(items))
    else:
        print(json.dumps(items, indent=2))


if __name__ == "__main__":
    main()
