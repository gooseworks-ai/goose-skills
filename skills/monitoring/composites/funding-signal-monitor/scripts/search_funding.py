#!/usr/bin/env python3
"""
Search Hacker News for funding announcements using the free Algolia API.
Filters by funding stage, recency, and engagement. Outputs qualified signals.

Usage:
  python3 search_funding.py --stages "Series A,Series B" --days 7 --output json
  python3 search_funding.py --stages "Series A,Series B,Series C" --days 14 --min-points 10 --output text
  python3 search_funding.py --stages "Series A" --days 7 --keywords "AI,fintech" --output json
"""

import json
import sys
import argparse
import re
import requests
import time as time_mod
from datetime import datetime, timedelta, timezone


HN_API_BASE = "https://hn.algolia.com/api/v1"

# Common funding stage patterns
STAGE_PATTERNS = {
    "pre-seed": re.compile(r"pre[\-\s]?seed", re.IGNORECASE),
    "seed": re.compile(r"\bseed\b(?!\s*stage)", re.IGNORECASE),
    "Series A": re.compile(r"series\s*a\b", re.IGNORECASE),
    "Series B": re.compile(r"series\s*b\b", re.IGNORECASE),
    "Series C": re.compile(r"series\s*c\b", re.IGNORECASE),
    "Series D": re.compile(r"series\s*d\b", re.IGNORECASE),
    "Series E+": re.compile(r"series\s*[e-z]\b", re.IGNORECASE),
}

# Regex for dollar amounts
AMOUNT_RE = re.compile(
    r"\$\s?(\d[\d,]*\.?\d*)\s*([mMbBkK](?:illion|illion)?)?",
    re.IGNORECASE,
)


def search_hn_funding(stages, days=7, max_results=100):
    """Search HN for funding announcements matching specified stages."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_unix = int(cutoff.timestamp())

    # Build queries from stages
    queries = []
    for stage in stages:
        stage = stage.strip()
        queries.append(f'"{stage}" raised')
        queries.append(f'"{stage}" funding')
        queries.append(f'"{stage}" announces')

    # Also add generic funding queries
    queries.append("startup raised funding")
    queries.append("announces funding round")

    all_hits = {}
    for query in queries:
        print(f"  Searching HN: '{query}'...", file=sys.stderr)
        try:
            params = {
                "query": query,
                "tags": "story",
                "numericFilters": f"created_at_i>{cutoff_unix}",
                "hitsPerPage": 50,
                "page": 0,
            }
            resp = requests.get(f"{HN_API_BASE}/search_by_date", params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()

            for hit in data.get("hits", []):
                obj_id = hit.get("objectID")
                if obj_id and obj_id not in all_hits:
                    all_hits[obj_id] = hit

            time_mod.sleep(0.2)
        except Exception as e:
            print(f"  Warning: Query '{query}' failed: {e}", file=sys.stderr)

    return list(all_hits.values())[:max_results]


def detect_stage(text):
    """Detect funding stage from text."""
    for stage_name, pattern in STAGE_PATTERNS.items():
        if pattern.search(text):
            return stage_name
    return None


def extract_amount(text):
    """Extract funding amount from text."""
    matches = AMOUNT_RE.findall(text)
    for num_str, suffix in matches:
        try:
            num = float(num_str.replace(",", ""))
            suffix_lower = suffix.lower() if suffix else ""
            if suffix_lower.startswith("b"):
                num *= 1_000_000_000
            elif suffix_lower.startswith("m"):
                num *= 1_000_000
            elif suffix_lower.startswith("k"):
                num *= 1_000
            # Only return amounts that look like funding (>$100K)
            if num >= 100_000:
                return num
        except ValueError:
            continue
    return None


def format_amount(amount):
    """Format a dollar amount nicely."""
    if amount is None:
        return "N/A"
    if amount >= 1_000_000_000:
        return f"${amount / 1_000_000_000:.1f}B"
    if amount >= 1_000_000:
        return f"${amount / 1_000_000:.1f}M"
    if amount >= 1_000:
        return f"${amount / 1_000:.0f}K"
    return f"${amount:.0f}"


def qualify_hit(hit, target_stages):
    """Qualify and enrich a single HN hit as a funding signal."""
    title = hit.get("title") or ""
    text = hit.get("story_text") or ""
    combined = f"{title} {text}".strip()

    stage = detect_stage(combined)
    amount = extract_amount(combined)

    # Check if stage matches targets (if specified)
    target_lower = [s.strip().lower() for s in target_stages]
    stage_match = (
        stage is not None and stage.lower() in target_lower
    ) if target_lower else stage is not None

    # Basic funding signal detection
    funding_keywords = ["raised", "funding", "investment", "round", "capital", "backed", "announces"]
    has_funding_signal = any(kw in combined.lower() for kw in funding_keywords)

    if not has_funding_signal:
        return None

    return {
        "id": hit.get("objectID"),
        "title": title,
        "url": hit.get("url") or "",
        "hn_url": f"https://news.ycombinator.com/item?id={hit.get('objectID', '')}",
        "author": hit.get("author", ""),
        "points": hit.get("points") or 0,
        "num_comments": hit.get("num_comments") or 0,
        "created_at": hit.get("created_at", ""),
        "detected_stage": stage,
        "detected_amount": format_amount(amount),
        "raw_amount": amount,
        "stage_matches_target": stage_match,
        "text_snippet": combined[:300],
    }


def format_text_output(items):
    """Format items as a human-readable table."""
    lines = []
    lines.append(f"{'#':<4} {'Pts':<6} {'Stage':<12} {'Amount':<12} {'Title'}")
    lines.append("-" * 100)
    for i, item in enumerate(items, 1):
        title = item.get("title", "")[:55]
        points = item.get("points", 0)
        stage = item.get("detected_stage") or "?"
        amount = item.get("detected_amount", "N/A")
        lines.append(f"{i:<4} {points:<6} {stage:<12} {amount:<12} {title}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Search Hacker News for funding announcements",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Series A and B in last week
  %(prog)s --stages "Series A,Series B" --days 7

  # All stages with high engagement
  %(prog)s --stages "Series A,Series B,Series C" --days 14 --min-points 10

  # Filter by industry keyword
  %(prog)s --stages "Series A" --days 7 --keywords "AI,fintech"
""",
    )

    parser.add_argument("--stages", required=True,
                        help="Comma-separated funding stages: 'Series A,Series B'")
    parser.add_argument("--days", type=int, default=7,
                        help="How many days back to search (default: 7)")
    parser.add_argument("--min-points", type=int, default=0,
                        help="Minimum HN points to include (default: 0)")
    parser.add_argument("--keywords", help="Additional keywords to filter (comma-separated, AND logic)")
    parser.add_argument("--output", choices=["json", "text"], default="json",
                        help="Output format (default: json)")

    args = parser.parse_args()

    stages = [s.strip() for s in args.stages.split(",")]
    print(f"Searching HN for funding signals: stages={stages}, days={args.days}", file=sys.stderr)

    # Search
    hits = search_hn_funding(stages, days=args.days)
    print(f"Found {len(hits)} raw hits.", file=sys.stderr)

    # Qualify
    qualified = []
    for hit in hits:
        result = qualify_hit(hit, stages)
        if result:
            qualified.append(result)

    # Filter by min points
    if args.min_points > 0:
        qualified = [q for q in qualified if q.get("points", 0) >= args.min_points]

    # Filter by keywords
    if args.keywords:
        keywords = [k.strip().lower() for k in args.keywords.split(",")]
        qualified = [
            q for q in qualified
            if any(kw in q.get("text_snippet", "").lower() for kw in keywords)
        ]

    # Sort: stage matches first, then by points
    qualified.sort(key=lambda x: (
        -int(x.get("stage_matches_target", False)),
        -(x.get("points") or 0),
    ))

    print(f"Qualified {len(qualified)} funding signals.", file=sys.stderr)

    # Output
    if args.output == "text":
        print(format_text_output(qualified))
    else:
        print(json.dumps(qualified, indent=2, default=str))


if __name__ == "__main__":
    main()
