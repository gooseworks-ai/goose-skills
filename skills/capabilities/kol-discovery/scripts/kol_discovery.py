#!/usr/bin/env python3
"""
KOL Discovery Pipeline — Find Key Opinion Leaders via LinkedIn Post Search
---------------------------------------------------------------------------
Searches LinkedIn for posts using domain/authority keywords, aggregates by
author, scores for KOL potential, and merges with optional web-researched
KOL lists. Exports a ranked CSV of KOLs.

All dynamic values are read from a JSON config file.

Usage:
    python3 skills/kol-discovery/scripts/kol_discovery.py \
      --config skills/kol-discovery/configs/{client}.json \
      [--test] [--web-kols {client}-web-kols.json] [--yes]
"""

import os
import sys
import json
import csv
import math
import re
import time
import argparse
import urllib.request
from datetime import datetime

# ── Apify Guard (shared cost protection) ────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
from tools.apify_guard import (
    guarded_apify_run, confirm_cost, set_limit, set_auto_confirm,
    ApifyLimitReached, get_run_count, get_run_limit,
)

# ── GooseWorks Proxy ─────────────────────────────────────────────────────────
GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

# ── Apify Actor IDs ──────────────────────────────────────────────────────────

POST_SEARCH_ACTOR_ID = "apimaestro~linkedin-posts-search-scraper-no-cookies"

OUTPUT_COLS = [
    "Rank",
    "Name",
    "LinkedIn URL",
    "Headline",
    "KOL Score",
    "Total Posts",
    "Total Reactions",
    "Total Comments",
    "Avg Engagement",
    "Top Post URL",
    "Top Post Preview",
    "Source",
]


# ── Config Loading ───────────────────────────────────────────────────────────

def load_config(config_path):
    """Load client config from JSON file."""
    with open(config_path) as f:
        config = json.load(f)

    required = ["client_name", "domain_keywords"]
    missing = [k for k in required if k not in config]
    if missing:
        print(f"ERROR: Config missing required fields: {missing}")
        sys.exit(1)

    config.setdefault("exclusion_patterns", [])
    config.setdefault("kol_title_keywords", [
        "vp", "founder", "analyst", "editor", "host", "director",
        "chief", "head of", "partner", "managing", "principal",
    ])
    config.setdefault("vendor_exclude_keywords", [
        "software engineer", "saas", "recruiter", "data scientist",
    ])
    config.setdefault("domain_relevance_keywords", [])
    config.setdefault("country_filter", "")
    config.setdefault("max_posts_per_keyword", 50)
    config.setdefault("min_posts", 2)
    config.setdefault("min_total_engagement", 50)
    config.setdefault("top_n_kols", 50)
    config.setdefault("max_apify_runs", 50)

    return config


# ── Helpers ──────────────────────────────────────────────────────────────────

def load_env():
    """Walk up from script dir looking for .env, then check cwd."""
    candidates = []
    script_dir = os.path.dirname(os.path.abspath(__file__))
    d = script_dir
    for _ in range(5):
        candidates.append(os.path.join(d, ".env"))
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent
    candidates.append(os.path.join(os.getcwd(), ".env"))

    env = {}
    for env_path in candidates:
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        env[k.strip()] = v.strip().strip('"').strip("'")
            break
    return env


def apify_dataset(run_id, token, limit=50000):
    """Fetch dataset items from a completed run."""
    if GOOSEWORKS_API_KEY:
        url = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify/actor-runs/{run_id}/dataset/items?token={token}&limit={limit}"
    else:
        url = f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items?token={token}&limit={limit}"
    return json.load(urllib.request.urlopen(url, timeout=120))


def parse_headline(headline):
    """Parse role and company from a LinkedIn headline."""
    if not headline:
        return "", ""
    for sep in [" at ", " @ ", " | ", " · "]:
        if sep in headline:
            parts = headline.split(sep, 1)
            role = parts[0].strip()
            company = parts[1].split("|")[0].split("·")[0].strip()
            return role, company
    return headline, ""


def should_exclude_post(text, config):
    """Check if a post matches exclusion patterns (hiring posts, etc.)."""
    if not text:
        return False
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in config["exclusion_patterns"])


def debug_save(data, filename):
    """Save data to .tmp/ for debugging."""
    debug_dir = os.path.join(os.getcwd(), ".tmp")
    os.makedirs(debug_dir, exist_ok=True)
    path = os.path.join(debug_dir, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"    Debug saved: {path}")
    return path


# ── Step 1: Keyword Search ──────────────────────────────────────────────────

def search_posts(token, config, test_mode=False):
    """Search LinkedIn for posts by domain keywords, return all posts."""
    all_keywords = config["domain_keywords"]
    keywords = all_keywords[:5] if test_mode else all_keywords

    print(f"\n{'='*60}")
    print(f"Step 1: Domain Keyword Search ({len(keywords)} keywords)")
    print(f"{'='*60}")
    print(f"  Actor: {POST_SEARCH_ACTOR_ID}")
    print(f"  Est. cost: ~${len(keywords) * 0.10:.2f}")

    max_posts = config["max_posts_per_keyword"]
    all_posts = {}

    for i, kw in enumerate(keywords, 1):
        print(f"\n  [{i}/{len(keywords)}] Searching: {kw}")
        try:
            run_id = guarded_apify_run(
                POST_SEARCH_ACTOR_ID,
                {
                    "keyword": kw,
                    "maxItems": max_posts,
                },
                token,
            )
            items = apify_dataset(run_id, token, limit=500)
            new_posts = 0
            for item in items:
                # Skip non-post items (old actor had type field, new actor returns only posts)
                if item.get("type") and item.get("type") != "post":
                    continue

                content = item.get("text", "") or item.get("content", "") or ""
                if isinstance(content, dict):
                    content = content.get("text", "") or ""
                if should_exclude_post(content, config):
                    continue

                post_id = item.get("activity_id", "") or item.get("id", "")
                if post_id and post_id not in all_posts:
                    all_posts[post_id] = {**item, "_keyword": kw}
                    new_posts += 1

            print(f"    {len(items)} items returned, {new_posts} new unique posts")
        except ApifyLimitReached:
            raise
        except Exception as e:
            print(f"    ERROR: {e}")
        time.sleep(2)

    debug_save(list(all_posts.values()), f"kol-discovery-posts-{config['client_name']}.json")

    print(f"\n  Total unique posts: {len(all_posts)}")
    return all_posts


# ── Step 2: Aggregate by Author ─────────────────────────────────────────────

def aggregate_authors(all_posts, config):
    """Group posts by author, compute engagement metrics."""
    print(f"\n{'='*60}")
    print(f"Step 2: Aggregate by Author")
    print(f"{'='*60}")

    authors = {}

    for post_id, post in all_posts.items():
        author = post.get("author", {})
        if not isinstance(author, dict):
            continue

        author_url = author.get("profile_url", "") or author.get("linkedinUrl", "")
        # Strip query params from author URL for consistent dedup
        if "?" in author_url:
            author_url = author_url.split("?")[0]
        name = author.get("name", "")
        headline = author.get("headline", "") or author.get("info", "") or ""

        # Skip company pages
        author_type = author.get("type", "")
        if not author_url or not name or "/company/" in author_url or author_type == "company":
            continue

        # Extract engagement — handle both apimaestro (stats) and harvestapi (engagement) formats
        stats = post.get("stats", {}) or {}
        eng = post.get("engagement", {}) or {}
        if isinstance(stats, dict) and ("total_reactions" in stats or "comments" in stats):
            # apimaestro format
            reactions = stats.get("total_reactions", 0) or 0
            comments_count = stats.get("comments", 0) or 0
        elif isinstance(eng, dict) and ("likes" in eng or "comments" in eng):
            # harvestapi format
            reactions = eng.get("likes", 0) or 0
            comments_count = eng.get("comments", 0) or 0
        else:
            reactions = post.get("totalReactionCount", 0) or 0
            comments_count = post.get("commentsCount", 0) or 0
        engagement = reactions + comments_count
        post_url = post.get("post_url", "") or post.get("linkedinUrl", "") or ""
        text_content = post.get("text", "") or ""
        if isinstance(text_content, dict):
            text_content = text_content.get("text", "") or ""
        content = (text_content or post.get("content", "") or "")[:200]
        keyword = post.get("_keyword", "")

        if author_url not in authors:
            authors[author_url] = {
                "name": name,
                "linkedin_url": author_url,
                "headline": headline,
                "posts": [],
                "keywords": set(),
                "total_reactions": 0,
                "total_comments": 0,
            }

        authors[author_url]["posts"].append({
            "url": post_url,
            "reactions": reactions,
            "comments": comments_count,
            "engagement": engagement,
            "preview": content,
        })
        authors[author_url]["total_reactions"] += reactions
        authors[author_url]["total_comments"] += comments_count
        if keyword:
            authors[author_url]["keywords"].add(keyword)
        # Update headline if we get a better one
        if headline and not authors[author_url]["headline"]:
            authors[author_url]["headline"] = headline

    print(f"  Unique authors found: {len(authors)}")
    return authors


# ── Step 3: Score & Rank ────────────────────────────────────────────────────

def score_kols(authors, config, web_kol_urls=None):
    """Score each author as a KOL candidate."""
    print(f"\n{'='*60}")
    print(f"Step 3: Score & Rank KOLs")
    print(f"{'='*60}")

    web_kol_urls = web_kol_urls or set()
    min_posts = config["min_posts"]
    min_engagement = config["min_total_engagement"]
    title_keywords = [k.lower() for k in config["kol_title_keywords"]]
    vendor_keywords = [k.lower() for k in config["vendor_exclude_keywords"]]
    relevance_keywords = [k.lower() for k in config["domain_relevance_keywords"]]

    scored = []

    for url, data in authors.items():
        post_count = len(data["posts"])
        total_reactions = data["total_reactions"]
        total_comments = data["total_comments"]
        total_engagement = total_reactions + total_comments
        headline_lower = data["headline"].lower()

        # Apply minimum thresholds
        if post_count < min_posts:
            continue
        if total_engagement < min_engagement:
            continue

        # Check vendor exclusion
        is_vendor = any(vk in headline_lower for vk in vendor_keywords)
        if is_vendor:
            continue

        # Compute score components
        avg_engagement = total_engagement / post_count if post_count else 0

        # Engagement volume (log-scaled to prevent outlier dominance)
        volume_score = math.log1p(total_engagement) * 2

        # Consistency (post count, capped)
        consistency_score = min(post_count, 10) * 1.5

        # Quality (avg engagement per post)
        quality_score = math.log1p(avg_engagement) * 1.5

        # Relevance (how many different keywords matched)
        keyword_breadth = len(data["keywords"])
        relevance_score = min(keyword_breadth, 8) * 2

        # Domain relevance bonus (headline matches domain keywords)
        domain_bonus = sum(1 for rk in relevance_keywords if rk in headline_lower) * 2

        # Title bonus (thought-leader titles)
        title_bonus = sum(1 for tk in title_keywords if tk in headline_lower) * 1.5

        # Web research bonus
        web_bonus = 5 if url in web_kol_urls else 0

        kol_score = (
            volume_score + consistency_score + quality_score +
            relevance_score + domain_bonus + title_bonus + web_bonus
        )

        # Find top post
        top_post = max(data["posts"], key=lambda p: p["engagement"])

        source = "both" if url in web_kol_urls else "post-data"

        scored.append({
            "name": data["name"],
            "linkedin_url": url,
            "headline": data["headline"],
            "kol_score": round(kol_score, 1),
            "total_posts": post_count,
            "total_reactions": total_reactions,
            "total_comments": total_comments,
            "avg_engagement": round(avg_engagement, 1),
            "top_post_url": top_post["url"],
            "top_post_preview": top_post["preview"],
            "source": source,
            "keywords": data["keywords"],
        })

    # Sort by score descending
    scored.sort(key=lambda x: x["kol_score"], reverse=True)

    print(f"  KOLs passing thresholds: {len(scored)}")
    print(f"  Min posts threshold: {min_posts}")
    print(f"  Min engagement threshold: {min_engagement}")

    return scored


# ── Step 4: Merge with Web KOLs ────────────────────────────────────────────

def load_web_kols(web_kols_path):
    """Load web-researched KOL list from JSON."""
    if not web_kols_path or not os.path.exists(web_kols_path):
        return []
    with open(web_kols_path) as f:
        return json.load(f)


def merge_web_kols(scored_kols, web_kols):
    """Add web-researched KOLs that weren't found in post data."""
    if not web_kols:
        return scored_kols

    print(f"\n{'='*60}")
    print(f"Step 4: Merge Web-Researched KOLs")
    print(f"{'='*60}")

    existing_urls = {k["linkedin_url"] for k in scored_kols}
    added = 0

    for wk in web_kols:
        url = wk.get("linkedin_url", "").rstrip("/") + "/"
        if url in existing_urls:
            continue

        scored_kols.append({
            "name": wk.get("name", "Unknown"),
            "linkedin_url": url,
            "headline": wk.get("notes", ""),
            "kol_score": 3.0,  # Base score for web-only KOLs
            "total_posts": 0,
            "total_reactions": 0,
            "total_comments": 0,
            "avg_engagement": 0,
            "top_post_url": "",
            "top_post_preview": f"Web source: {wk.get('source', '')}",
            "source": "web-research",
            "keywords": set(),
        })
        added += 1

    print(f"  Web KOLs loaded: {len(web_kols)}")
    print(f"  Already found in post data: {len(web_kols) - added}")
    print(f"  New web-only KOLs added: {added}")

    return scored_kols


# ── Step 5: Export CSV ──────────────────────────────────────────────────────

def export_csv(scored_kols, config, output_dir=None):
    """Export ranked KOL list to CSV."""
    print(f"\n{'='*60}")
    print(f"Step 5: Export CSV")
    print(f"{'='*60}")

    top_n = config["top_n_kols"]
    kols = scored_kols[:top_n]

    out_dir = output_dir or os.getcwd()
    os.makedirs(out_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    csv_path = os.path.join(out_dir, f"{config['client_name']}-kols-{timestamp}.csv")

    rows = []
    for rank, kol in enumerate(kols, 1):
        rows.append({
            "Rank": rank,
            "Name": kol["name"],
            "LinkedIn URL": kol["linkedin_url"],
            "Headline": kol["headline"],
            "KOL Score": kol["kol_score"],
            "Total Posts": kol["total_posts"],
            "Total Reactions": kol["total_reactions"],
            "Total Comments": kol["total_comments"],
            "Avg Engagement": kol["avg_engagement"],
            "Top Post URL": kol["top_post_url"],
            "Top Post Preview": kol["top_post_preview"][:100],
            "Source": kol["source"],
        })

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS)
        writer.writeheader()
        writer.writerows(rows)

    # Source breakdown
    sources = {}
    for kol in kols:
        src = kol["source"]
        sources[src] = sources.get(src, 0) + 1

    print(f"\n  Source breakdown:")
    for src, count in sorted(sources.items()):
        print(f"    {src}: {count}")

    print(f"\n  CSV exported: {csv_path}")
    print(f"  Total KOLs: {len(rows)}")

    return csv_path, rows


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="KOL Discovery Pipeline — Find Key Opinion Leaders"
    )
    parser.add_argument("--config", required=True, help="Path to client config JSON")
    parser.add_argument("--test", action="store_true", help="Limit to 5 keywords")
    parser.add_argument("--web-kols", type=str, default="", help="Path to web-researched KOL JSON")
    parser.add_argument("--yes", "-y", action="store_true", help="Skip cost confirmation prompts")
    parser.add_argument("--max-runs", type=int, default=None, help="Max Apify actor runs")
    parser.add_argument("--output-dir", type=str, default="", help="Directory for output CSV (default: current dir)")
    args = parser.parse_args()

    config = load_config(args.config)
    test_mode = args.test

    run_limit = args.max_runs or config.get("max_apify_runs", 50)
    set_limit(run_limit)
    set_auto_confirm(args.yes)

    env = load_env()
    token = GOOSEWORKS_API_KEY or env.get("APIFY_API_TOKEN", "")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)

    client_name = config["client_name"]
    keywords = config["domain_keywords"][:5] if test_mode else config["domain_keywords"]

    print(f"\n{'='*60}")
    print(f"KOL Discovery Pipeline")
    print(f"{'='*60}")
    print(f"  Client: {client_name}")
    print(f"  Config: {args.config}")
    print(f"  Mode: {'TEST (5 keywords)' if test_mode else 'FULL'}")
    print(f"  Domain keywords: {len(keywords)}")
    print(f"  Min posts: {config['min_posts']}")
    print(f"  Min engagement: {config['min_total_engagement']}")
    print(f"  Top N KOLs: {config['top_n_kols']}")
    print(f"  Apify run limit: {run_limit}")
    if args.web_kols:
        print(f"  Web KOLs file: {args.web_kols}")

    # Load web KOLs if provided
    web_kols = load_web_kols(args.web_kols) if args.web_kols else []
    web_kol_urls = set()
    for wk in web_kols:
        url = wk.get("linkedin_url", "")
        if url:
            web_kol_urls.add(url.rstrip("/") + "/")

    try:
        # Step 1: Search posts
        confirm_cost(
            "Phase 1: Domain Keyword Search",
            num_runs=len(keywords),
            est_cost=len(keywords) * 0.10,
        )
        all_posts = search_posts(token, config, test_mode)

        if not all_posts:
            print("\nNo posts found. Check your keywords and try again.")
            sys.exit(1)

        # Step 2: Aggregate by author
        authors = aggregate_authors(all_posts, config)

        if not authors:
            print("\nNo individual authors found. All posts may be from company pages.")
            sys.exit(1)

        # Step 3: Score and rank
        scored_kols = score_kols(authors, config, web_kol_urls)

        # Step 4: Merge web KOLs
        scored_kols = merge_web_kols(scored_kols, web_kols)

        # Re-sort after merge
        scored_kols.sort(key=lambda x: x["kol_score"], reverse=True)

        # Step 5: Export
        csv_path, rows = export_csv(scored_kols, config, args.output_dir or None)

    except ApifyLimitReached as e:
        print(f"\n  ⚠  {e}")
        # Try to save what we have
        if 'scored_kols' in dir() and scored_kols:
            csv_path, rows = export_csv(scored_kols, config, args.output_dir or None)
            print(f"\n  Partial output: {csv_path}")
        return

    # Summary
    print(f"\n{'='*60}")
    print(f"Summary")
    print(f"{'='*60}")
    print(f"  Client: {client_name}")
    print(f"  Posts found: {len(all_posts)}")
    print(f"  Unique authors: {len(authors)}")
    print(f"  KOLs after scoring: {len(rows)}")
    print(f"  Apify runs used: {get_run_count()}/{get_run_limit()}")

    if rows:
        print(f"\n  Top 10 KOLs:")
        print(f"  {'Rank':<6} {'Score':<8} {'Name':<28} {'Posts':<7} {'Engage':<10} {'Source':<12}")
        print(f"  {'-'*71}")
        for r in rows[:10]:
            print(f"  {r['Rank']:<6} {r['KOL Score']:<8} {r['Name'][:27]:<28} {r['Total Posts']:<7} {r['Total Reactions'] + r['Total Comments']:<10} {r['Source']:<12}")

    print(f"\n  Output: {csv_path}")
    return csv_path


if __name__ == "__main__":
    main()
