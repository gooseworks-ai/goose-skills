#!/usr/bin/env python3
"""
LinkedIn Post Research — Search LinkedIn posts by keyword via Apify.

Usage:
    python3 search_posts.py --keyword "AI agents"
    python3 search_posts.py --keyword "AI sourcing" --keyword "recruiting automation"
    python3 search_posts.py --keyword "AI agents" --sort-by date_posted --output csv
    python3 search_posts.py --keyword "AI agents" --max-items 100 --output-file results.json

Environment:
    APIFY_API_TOKEN  — Required. Your Apify API token.
"""

import argparse
import csv
import json
import os
import sys
import time

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests", file=sys.stderr)
    sys.exit(1)

APIFY_BASE = "https://api.apify.com/v2"
ACTOR_ID = "apimaestro~linkedin-posts-search-scraper-no-cookies"


# ---------------------------------------------------------------------------
# Apify Integration
# ---------------------------------------------------------------------------

def get_apify_token(token_arg=None):
    """Get Apify API token from arg or environment."""
    token = token_arg or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("ERROR: APIFY_API_TOKEN required. Set env var or use --token.", file=sys.stderr)
        sys.exit(1)
    return token


def search_posts(token, keyword, max_items=50, sort_by="relevance", timeout=120):
    """Run Apify actor to search LinkedIn posts by keyword."""
    actor_input = {
        "keyword": keyword,
        "maxItems": max_items,
    }
    if sort_by and sort_by != "relevance":
        actor_input["sortBy"] = sort_by

    # Start actor run
    try:
        start_resp = requests.post(
            f"{APIFY_BASE}/acts/{ACTOR_ID}/runs",
            params={"token": token},
            json=actor_input,
            timeout=30,
        )
        start_resp.raise_for_status()
    except Exception as e:
        print(f"  ERROR: Failed to start Apify actor: {e}", file=sys.stderr)
        return []

    run_data = start_resp.json().get("data", {})
    run_id = run_data.get("id")
    if not run_id:
        print("  ERROR: No run ID returned from Apify", file=sys.stderr)
        return []

    print(f"  Apify run started: {run_id}", file=sys.stderr)

    # Poll for completion
    start_time = time.time()
    status = "RUNNING"
    status_data = {}
    while time.time() - start_time < timeout:
        try:
            status_resp = requests.get(
                f"{APIFY_BASE}/actor-runs/{run_id}",
                params={"token": token},
                timeout=15,
            )
            status_data = status_resp.json().get("data", {})
            status = status_data.get("status", "UNKNOWN")
            if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
                break
        except Exception:
            pass
        time.sleep(5)

    if status != "SUCCEEDED":
        print(f"  Warning: Apify run ended with status: {status}", file=sys.stderr)
        return []

    # Fetch results
    dataset_id = status_data.get("defaultDatasetId")
    if not dataset_id:
        print("  ERROR: No dataset ID in Apify response", file=sys.stderr)
        return []

    try:
        dataset_resp = requests.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            params={"token": token, "format": "json"},
            timeout=30,
        )
        dataset_resp.raise_for_status()
        items = dataset_resp.json()
    except Exception as e:
        print(f"  ERROR: Failed to fetch dataset: {e}", file=sys.stderr)
        return []

    return items


# ---------------------------------------------------------------------------
# Parse Post Data
# ---------------------------------------------------------------------------

def normalize_post(raw_post, keyword):
    """Normalize an Apify post result into a clean record."""
    author = raw_post.get("author", {})
    if isinstance(author, dict):
        author_name = author.get("name", "")
        author_headline = author.get("headline", "")
        author_profile_url = author.get("profile_url", "")
    else:
        author_name = str(author)
        author_headline = ""
        author_profile_url = ""

    stats = raw_post.get("stats", {})
    if isinstance(stats, dict):
        reactions = stats.get("total_reactions", 0) or 0
        comments = stats.get("comments", 0) or 0
        shares = stats.get("shares", 0) or 0
        reactions_by_type = {}
        for r in stats.get("reactions", []):
            if isinstance(r, dict):
                reactions_by_type[r.get("type", "")] = r.get("count", 0)
    else:
        reactions = 0
        comments = 0
        shares = 0
        reactions_by_type = {}

    posted_at = raw_post.get("posted_at", {})
    if isinstance(posted_at, dict):
        date = (posted_at.get("date", "") or "")[:10]
    else:
        date = ""

    full_text = raw_post.get("text", "") or ""
    post_preview = full_text[:200].replace("\n", " ").strip()

    content = raw_post.get("content", {})
    if isinstance(content, dict):
        content_type = content.get("type", "text")
    else:
        content_type = "text"

    hashtags = raw_post.get("hashtags", [])
    if isinstance(hashtags, list):
        hashtags_str = ", ".join(str(h) for h in hashtags)
    else:
        hashtags_str = ""

    return {
        "author": author_name,
        "author_headline": author_headline,
        "author_profile_url": author_profile_url,
        "keyword": keyword,
        "reactions": reactions,
        "comments": comments,
        "shares": shares,
        "reactions_by_type": json.dumps(reactions_by_type),
        "date": date,
        "post_preview": post_preview,
        "full_text": full_text,
        "url": raw_post.get("post_url", "") or "",
        "activity_id": str(raw_post.get("activity_id", "") or ""),
        "hashtags": hashtags_str,
        "is_repost": raw_post.get("is_reshare", False),
        "content_type": content_type,
    }


def dedup_posts(posts):
    """Deduplicate posts by activity_id."""
    seen = set()
    unique = []
    for p in posts:
        aid = p.get("activity_id", "")
        if not aid:
            unique.append(p)
            continue
        if aid not in seen:
            seen.add(aid)
            unique.append(p)
    return unique


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

CSV_FIELDS = [
    "author", "author_headline", "author_profile_url", "keyword",
    "reactions", "comments", "shares", "date", "post_preview",
    "url", "activity_id", "hashtags",
]


def output_json(posts, output_file):
    data = json.dumps(posts, indent=2, ensure_ascii=False)
    if output_file:
        with open(output_file, "w") as f:
            f.write(data)
        print(f"Wrote {len(posts)} posts to {output_file}", file=sys.stderr)
    else:
        print(data)


def output_csv(posts, output_file):
    f = open(output_file, "w", newline="") if output_file else sys.stdout
    writer = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(posts)
    if output_file:
        f.close()
        print(f"Wrote {len(posts)} posts to {output_file}", file=sys.stderr)


def output_summary(posts):
    print(f"\n{'='*80}", file=sys.stderr)
    print(f"  RESULTS: {len(posts)} unique posts found", file=sys.stderr)
    print(f"{'='*80}\n", file=sys.stderr)

    if not posts:
        print("  No posts found.", file=sys.stderr)
        return

    top = posts[:20]
    print(f"  {'Author':<25} {'Keyword':<20} {'React':>6} {'Cmts':>6} {'Date':<12} Preview", file=sys.stderr)
    print(f"  {'-'*25} {'-'*20} {'-'*6} {'-'*6} {'-'*12} {'-'*40}", file=sys.stderr)
    for p in top:
        author = (p["author"] or "Unknown")[:24]
        keyword = (p["keyword"] or "")[:19]
        preview = (p["post_preview"] or "")[:40]
        print(f"  {author:<25} {keyword:<20} {p['reactions']:>6} {p['comments']:>6} {p['date']:<12} {preview}", file=sys.stderr)

    # Keyword breakdown
    keyword_counts = {}
    for p in posts:
        kw = p["keyword"]
        keyword_counts[kw] = keyword_counts.get(kw, 0) + 1
    print(f"\n  Posts per keyword:", file=sys.stderr)
    for kw, count in sorted(keyword_counts.items(), key=lambda x: -x[1]):
        print(f"    {kw}: {count}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Search LinkedIn posts by keyword via Apify."
    )
    parser.add_argument("--keyword", "-k", action="append", default=[],
                        help="Keyword to search (can repeat for multiple keywords)")
    parser.add_argument("--max-items", type=int, default=50,
                        help="Max posts per keyword (default: 50)")
    parser.add_argument("--sort-by", default="relevance",
                        choices=["relevance", "date_posted"],
                        help="Sort order (default: relevance)")
    parser.add_argument("--output", "-o", default="json",
                        choices=["json", "csv", "summary"],
                        help="Output format (default: json)")
    parser.add_argument("--output-file", help="Write output to file instead of stdout")
    parser.add_argument("--token", help="Apify API token (overrides env var)")
    parser.add_argument("--timeout", type=int, default=120,
                        help="Max seconds for Apify run (default: 120)")

    args = parser.parse_args()

    if not args.keyword:
        print("ERROR: Provide at least one keyword via --keyword", file=sys.stderr)
        sys.exit(1)

    token = get_apify_token(args.token)
    all_posts = []

    for keyword in args.keyword:
        print(f"Searching for: '{keyword}'", file=sys.stderr)
        raw_posts = search_posts(token, keyword, args.max_items, args.sort_by, args.timeout)
        print(f"  Got {len(raw_posts)} posts", file=sys.stderr)

        for raw_post in raw_posts:
            all_posts.append(normalize_post(raw_post, keyword))

    # Dedup across keywords
    if len(args.keyword) > 1:
        before = len(all_posts)
        all_posts = dedup_posts(all_posts)
        print(f"Dedup: {before} -> {len(all_posts)} unique posts", file=sys.stderr)

    # Sort by reactions descending (unless user asked for date sort)
    if args.sort_by == "relevance":
        all_posts.sort(key=lambda x: x["reactions"], reverse=True)

    print(f"\nTotal: {len(all_posts)} posts", file=sys.stderr)

    # Output
    if args.output == "json":
        output_json(all_posts, args.output_file)
    elif args.output == "csv":
        output_csv(all_posts, args.output_file)

    # Always print summary to stderr
    output_summary(all_posts)


if __name__ == "__main__":
    main()
