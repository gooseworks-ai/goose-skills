#!/usr/bin/env python3
"""
Pain-Language Engagers Pipeline — Reusable LinkedIn Lead Discovery
------------------------------------------------------------------
Searches LinkedIn for posts using pain-language that your ICP actually uses
(not solution-language that attracts VCs/builders), then scrapes individual
engagers from the company pages that published those posts, ICP-filters,
and exports a deduplicated CSV.

All dynamic values (keywords, ICP lists, company pages) are read from a
JSON config file, making this reusable across any industry/client.

Three-step pipeline:
  1. Pain-keyword search → discover posts & source company pages
  2. Scrape engagers from those company pages (reactions + comments)
  3. Profile enrichment + ICP classification + dedup + CSV export

Usage:
    python3 skills/pain-language-engagers/scripts/pain_language_engagers.py \\
      --config skills/pain-language-engagers/configs/happy-robot.json \\
      [--test] [--skip-discovery] [--companies "url1,url2"]

Flags:
    --config           Path to client config JSON (required)
    --test             Limit to 3 keywords, 5 posts per company
    --skip-discovery   Skip keyword search, only scrape hardcoded companies
    --companies        Add extra company URLs to scrape (comma-separated)
"""

import os
import sys
import json
import csv
import time
import re
import argparse
import urllib.request
from datetime import datetime, timedelta, timezone

# ── Apify Guard (shared cost protection) ────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
from tools.apify_guard import (
    guarded_apify_run, confirm_cost, set_limit, set_auto_confirm,
    ApifyLimitReached, get_run_count, get_run_limit,
)

# ── Apify Actor IDs ──────────────────────────────────────────────────────────

POST_SEARCH_ACTOR_ID = "apimaestro~linkedin-posts-search-scraper-no-cookies"  # no cookies needed
COMPANY_POSTS_ACTOR_ID = "WI0tj4Ieb5Kq458gB"   # harvestapi/linkedin-company-posts
PROFILE_ACTOR_ID = "supreme_coder~linkedin-profile-scraper"

POSTED_LIMIT = "3months"

OUTPUT_COLS = [
    "Name",
    "LinkedIn Profile URL",
    "Role",
    "Company Name",
    "Location",
    "Source Page",
    "Post URL(s)",
    "Engagement Type",
    "Comment Text",
    "ICP Tier",
    "Niche Keyword",
]


# ── Config Loading ───────────────────────────────────────────────────────────

def load_config(config_path):
    """Load client config from JSON file."""
    with open(config_path) as f:
        config = json.load(f)

    # Validate required fields
    required = ["client_name", "pain_keywords", "pain_patterns",
                 "icp_keywords", "tech_vendor_keywords"]
    missing = [k for k in required if k not in config]
    if missing:
        print(f"ERROR: Config missing required fields: {missing}")
        sys.exit(1)

    # Defaults for optional fields
    config.setdefault("hardcoded_companies", [])
    config.setdefault("industry_pages", [])
    config.setdefault("broad_topic_patterns", [])
    config.setdefault("country_filter", "")
    config.setdefault("days_back", 60)
    config.setdefault("max_posts_per_keyword", 50)
    config.setdefault("max_posts_per_company", 100)
    config.setdefault("max_apify_runs", 50)
    config.setdefault("max_discovered_companies", 15)
    config.setdefault("max_enrichment_profiles", 100)

    return config


# ── Helpers ──────────────────────────────────────────────────────────────────

def load_env():
    """Walk up from script dir looking for .env, then check cwd."""
    candidates = []
    # From script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    d = script_dir
    for _ in range(5):
        candidates.append(os.path.join(d, ".env"))
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent
    # From cwd
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
    url = f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items?token={token}&limit={limit}"
    return json.load(urllib.request.urlopen(url, timeout=120))


def parse_headline(headline):
    """Parse role and company from a LinkedIn headline like 'VP Ops at Acme Freight'."""
    if not headline:
        return "", ""
    for sep in [" at ", " @ ", " | ", " · "]:
        if sep in headline:
            parts = headline.split(sep, 1)
            role = parts[0].strip()
            company = parts[1].split("|")[0].split("·")[0].strip()
            return role, company
    return headline, ""


def classify_icp(headline, company, config):
    """Returns ICP tier classification using config-driven keyword lists."""
    text = (headline + " " + company).lower()

    icp_keywords = config["icp_keywords"]
    tech_vendor_keywords = config["tech_vendor_keywords"]

    is_tech_vendor = any(sig in text for sig in tech_vendor_keywords)
    is_icp_match = any(sig in text for sig in icp_keywords)

    if is_tech_vendor and not is_icp_match:
        return "Tech Vendor – Skip"
    if is_icp_match:
        return "Likely ICP"
    ops_roles = ["vp operations", "chief operating", "coo", "head of operations",
                 "operations manager", "founder", "ceo", "president", "director"]
    if any(r in text for r in ops_roles):
        return "Possible ICP"
    return "Unknown – Review"


def post_matches_pain(text, config):
    """Check if a post's text contains pain-language patterns from config."""
    if not text:
        return False
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in config["pain_patterns"])


def post_matches_broad_topic(text, config):
    """Broader check: does this post discuss industry topics at all?
    Used for known industry pages where any relevant content attracts ICP."""
    if not text:
        return False
    text_lower = text.lower()
    patterns = config.get("broad_topic_patterns", [])
    if not patterns:
        return post_matches_pain(text, config)
    return any(re.search(p, text_lower) for p in patterns)


def extract_company_url(author_url):
    """Extract company page URL from an author's profile if it's a company page."""
    if not author_url:
        return None
    if "/company/" in author_url:
        match = re.search(r"linkedin\.com/company/([^/?]+)", author_url)
        if match:
            return f"https://www.linkedin.com/company/{match.group(1)}/"
    return None


def extract_location(profile):
    """Extract location string from a profile scraper result."""
    location = (
        profile.get("locationName")
        or profile.get("location")
        or profile.get("geoLocationName")
        or profile.get("geoLocation", {}).get("city", "")
    )
    if isinstance(location, dict):
        parts = [location.get("city", ""), location.get("state", ""),
                 location.get("country", "")]
        return ", ".join(p for p in parts if p)
    return str(location) if location else ""


def debug_save(data, filename, config):
    """Save data to .tmp/ for debugging."""
    debug_dir = os.path.join(os.getcwd(), ".tmp")
    os.makedirs(debug_dir, exist_ok=True)
    path = os.path.join(debug_dir, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"    Debug saved: {path}")
    return path


# ── Step 1: Pain-Language Keyword Search ─────────────────────────────────────

def discover_posts_and_companies(token, config, test_mode=False):
    """Search LinkedIn for pain-language posts, collect source company pages."""
    all_keywords = config["pain_keywords"]
    keywords = all_keywords[:3] if test_mode else all_keywords

    print(f"\n{'='*60}")
    print(f"Step 1: Pain-Language Keyword Search ({len(keywords)} keywords)")
    print(f"{'='*60}")
    print(f"  Actor: harvestapi/linkedin-post-search")
    print(f"  Est. cost: ~${len(keywords) * 0.10:.2f}")

    max_posts = config["max_posts_per_keyword"]
    all_posts = {}
    discovered_companies = set()

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
                if item.get("type") != "post":
                    continue
                post_id = item.get("id", "")
                if post_id and post_id not in all_posts:
                    all_posts[post_id] = {**item, "_keyword": kw}
                    new_posts += 1

                    author = item.get("author", {})
                    author_url = author.get("linkedinUrl", "")
                    company_url = extract_company_url(author_url)
                    if company_url:
                        discovered_companies.add(company_url)

            print(f"    {len(items)} items returned, {new_posts} new unique posts")
        except Exception as e:
            print(f"    ERROR: {e}")
        time.sleep(2)

    debug_save(list(all_posts.values()), f"pain-keyword-posts-raw-{config['client_name']}.json", config)

    print(f"\n  Total unique posts: {len(all_posts)}")
    print(f"  Company pages discovered: {len(discovered_companies)}")
    for url in sorted(discovered_companies):
        print(f"    - {url}")

    return all_posts, discovered_companies


# ── Step 1b: Extract Post Authors as Direct Leads ────────────────────────────

def extract_post_authors(all_posts):
    """People who WROTE pain-language posts are direct leads — they're expressing
    the pain themselves. Extract them as engagers with 'Post Author' type."""
    authors = {}

    for post_id, post in all_posts.items():
        author = post.get("author", {})
        profile_url = author.get("linkedinUrl", "")
        name = author.get("name", "")
        headline = author.get("info", "") or ""
        post_url = post.get("linkedinUrl", "") or post.get("socialContent", {}).get("shareUrl", "")
        keyword = post.get("_keyword", "")

        if not profile_url or not name or "/company/" in profile_url:
            continue

        if profile_url not in authors:
            authors[profile_url] = {
                "name": name,
                "profile_url": profile_url,
                "post_urls": set(),
                "headline": headline,
                "location": "",
                "source_pages": {"keyword-search"},
                "engagement_type": "Post Author",
                "comment_text": "",
                "niche_keywords": set(),
            }
        authors[profile_url]["post_urls"].add(post_url)
        if keyword:
            authors[profile_url]["niche_keywords"].add(keyword)

    print(f"\n{'='*60}")
    print(f"Step 1b: Post Authors as Direct Leads")
    print(f"{'='*60}")
    print(f"  Individual post authors extracted: {len(authors)}")

    return authors


# ── Step 2: Scrape Engagers from Company Pages ──────────────────────────────

def scrape_company_engagers(company_urls, token, config, test_mode=False):
    """Scrape posts + engagers from company pages, filter by pain-language."""
    max_posts = 5 if test_mode else config["max_posts_per_company"]
    days_back = config["days_back"]
    industry_pages = set(config.get("industry_pages", []))

    print(f"\n{'='*60}")
    print(f"Step 2: Scrape Engagers from {len(company_urls)} Company Pages")
    print(f"{'='*60}")
    print(f"  Actor: harvestapi/linkedin-company-posts")
    print(f"  Max posts per company: {max_posts}")
    print(f"  Est. cost: ~${len(company_urls) * max_posts * 0.002:.2f}")

    all_engagers = {}
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)

    for ci, company_url in enumerate(sorted(company_urls), 1):
        is_industry_page = company_url in industry_pages
        filter_label = "broad-topic (industry page)" if is_industry_page else "pain-language (strict)"
        print(f"\n  [{ci}/{len(company_urls)}] Scraping: {company_url}")
        print(f"    Filter: {filter_label}")
        try:
            payload = {
                "targetUrls": [company_url],
                "maxPosts": max_posts,
                "scrapeReactions": True,
                "maxReactions": 0,
                "scrapeComments": True,
                "maxComments": 0,
            }

            run_id = guarded_apify_run(COMPANY_POSTS_ACTOR_ID, payload, token, wait_secs=600)
            items = apify_dataset(run_id, token)
            print(f"    Retrieved {len(items)} total items")

            posts = [i for i in items if i.get("type") == "post"]
            reactions = [i for i in items if i.get("type") == "reaction"]
            comments = [i for i in items if i.get("type") == "comment"]
            print(f"    Posts: {len(posts)}, Reactions: {len(reactions)}, Comments: {len(comments)}")

            # Filter posts: within date range AND matching content filter
            valid_post_ids = set()
            valid_post_urls = {}
            post_keywords = {}
            post_texts = {}

            for post in posts:
                posted_at = post.get("postedAt", {})
                if isinstance(posted_at, dict):
                    date_str = posted_at.get("date", "")
                    ts = posted_at.get("timestamp")
                else:
                    date_str = str(posted_at) if posted_at else ""
                    ts = None

                in_range = False
                if ts:
                    dt = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
                    in_range = dt >= cutoff
                elif date_str:
                    try:
                        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                        in_range = dt >= cutoff
                    except ValueError:
                        in_range = True

                if not in_range:
                    continue

                content = post.get("content", "") or post.get("text", "") or ""
                if is_industry_page:
                    if not post_matches_broad_topic(content, config):
                        continue
                else:
                    if not post_matches_pain(content, config):
                        continue

                post_id = str(post.get("id", ""))
                post_url = post.get("linkedinUrl") or ""
                valid_post_ids.add(post_id)
                valid_post_urls[post_id] = post_url
                post_texts[post_id] = content[:200]

                for pattern in config["pain_patterns"]:
                    if re.search(pattern, content.lower()):
                        post_keywords[post_id] = pattern.replace(r".*", " ").replace("\\", "")
                        break

            print(f"    Pain-matching posts (last {days_back} days): {len(valid_post_ids)}")

            if not valid_post_ids:
                print(f"    No pain-matching posts found, skipping company.")
                time.sleep(2)
                continue

            # Extract engagers from reactions
            for r in reactions:
                post_id = str(r.get("postId", ""))
                if post_id not in valid_post_ids:
                    continue

                actor = r.get("actor", {})
                profile_url = actor.get("linkedinUrl", "")
                name = actor.get("name", "")
                position = actor.get("position", "")
                post_url = r.get("query", {}).get("post", "") or valid_post_urls.get(post_id, "")

                if profile_url and name:
                    if profile_url not in all_engagers:
                        all_engagers[profile_url] = {
                            "name": name,
                            "profile_url": profile_url,
                            "post_urls": set(),
                            "headline": position,
                            "location": "",
                            "source_pages": set(),
                            "engagement_type": "Reaction",
                            "comment_text": "",
                            "niche_keywords": set(),
                        }
                    all_engagers[profile_url]["post_urls"].add(post_url)
                    all_engagers[profile_url]["source_pages"].add(company_url)
                    kw = post_keywords.get(post_id, "")
                    if kw:
                        all_engagers[profile_url]["niche_keywords"].add(kw)

            # Extract engagers from comments
            for c in comments:
                post_id = str(c.get("postId", ""))
                query_post = c.get("query", {}).get("post", "")

                if post_id and post_id not in valid_post_ids:
                    matched = False
                    for pid, purl in valid_post_urls.items():
                        if pid in query_post or purl in query_post:
                            matched = True
                            post_id = pid
                            break
                    if not matched:
                        continue

                actor = c.get("actor", {})
                profile_url = actor.get("linkedinUrl", "")
                name = actor.get("name", "")
                position = actor.get("position", "")
                post_url = query_post or valid_post_urls.get(post_id, "")
                comment_text = c.get("text", "") or c.get("content", "") or ""

                if profile_url and name:
                    if profile_url not in all_engagers:
                        all_engagers[profile_url] = {
                            "name": name,
                            "profile_url": profile_url,
                            "post_urls": set(),
                            "headline": position,
                            "location": "",
                            "source_pages": set(),
                            "engagement_type": "Comment",
                            "comment_text": comment_text[:500],
                            "niche_keywords": set(),
                        }
                    else:
                        if comment_text:
                            all_engagers[profile_url]["engagement_type"] = "Comment"
                            all_engagers[profile_url]["comment_text"] = comment_text[:500]
                    all_engagers[profile_url]["post_urls"].add(post_url)
                    all_engagers[profile_url]["source_pages"].add(company_url)
                    kw = post_keywords.get(post_id, "")
                    if kw:
                        all_engagers[profile_url]["niche_keywords"].add(kw)

            print(f"    Running total engagers: {len(all_engagers)}")

        except Exception as e:
            print(f"    ERROR scraping {company_url}: {e}")

        time.sleep(2)

    # Name-based deduplication
    by_name = {}
    for url, data in all_engagers.items():
        name = data["name"]
        if name in by_name:
            existing = by_name[name]
            existing["post_urls"].update(data["post_urls"])
            existing["source_pages"].update(data["source_pages"])
            existing["niche_keywords"].update(data["niche_keywords"])
            if "/ACoAA" in existing["profile_url"] and "/ACoAA" not in url:
                existing["profile_url"] = url
            if not existing["headline"] and data["headline"]:
                existing["headline"] = data["headline"]
            if not existing["location"] and data.get("location"):
                existing["location"] = data["location"]
            if not existing["comment_text"] and data["comment_text"]:
                existing["comment_text"] = data["comment_text"]
                existing["engagement_type"] = "Comment"
        else:
            by_name[name] = data
    all_engagers = {d["profile_url"]: d for d in by_name.values()}

    print(f"\n  Deduplicated engagers: {len(all_engagers)}")
    return all_engagers


# ── Step 3: Profile Enrichment ───────────────────────────────────────────────

def clean_profile_url(url):
    """Strip query params from LinkedIn profile URLs (e.g. ?miniProfileUrn=...)."""
    if "?" in url:
        return url.split("?")[0]
    return url


def enrich_profiles(engagers, token, config, test_mode=False):
    """Enrich all engager profiles to get headline and location data."""
    # Enrich profiles missing headline OR location
    needs_enrichment = [
        url for url, data in engagers.items()
        if not data.get("headline") or not data.get("location")
    ]

    has_both = len(engagers) - len(needs_enrichment)
    print(f"\n{'='*60}")
    print(f"Step 3: Profile Enrichment")
    print(f"{'='*60}")
    print(f"  {has_both}/{len(engagers)} already have headline + location")

    if not needs_enrichment:
        print(f"  All profiles complete. Skipping enrichment.")
        return engagers

    # Apply caps
    max_enrich = config.get("max_enrichment_profiles", 100)
    if test_mode:
        needs_enrichment = needs_enrichment[:5]
    elif len(needs_enrichment) > max_enrich:
        print(f"  Capping enrichment: {len(needs_enrichment)} → {max_enrich}")
        needs_enrichment = needs_enrichment[:max_enrich]

    print(f"  Enriching {len(needs_enrichment)} profiles")
    print(f"  Est. cost: ~${len(needs_enrichment) * 0.003:.2f}")

    country_filter = config.get("country_filter", "").lower()
    batch_size = 25

    for batch_start in range(0, len(needs_enrichment), batch_size):
        batch = needs_enrichment[batch_start:batch_start + batch_size]
        print(f"  Batch {batch_start // batch_size + 1} ({len(batch)} profiles)...")

        try:
            cleaned_batch = [clean_profile_url(u) for u in batch]
            payload = {"profileUrls": cleaned_batch}
            run_id = guarded_apify_run(PROFILE_ACTOR_ID, payload, token, wait_secs=180)
            profiles = apify_dataset(run_id, token)

            for profile in profiles:
                url = profile.get("linkedinUrl") or profile.get("url") or profile.get("profileUrl") or ""
                matched_url = None
                for eng_url in batch:
                    if eng_url in url or url in eng_url:
                        matched_url = eng_url
                        break

                if matched_url and matched_url in engagers:
                    # Extract headline
                    experiences = profile.get("experiences") or profile.get("positions") or []
                    headline = profile.get("headline") or ""
                    if experiences:
                        current = experiences[0]
                        title = current.get("title") or current.get("position") or ""
                        company = current.get("companyName") or current.get("company") or ""
                        engagers[matched_url]["headline"] = (
                            f"{title} at {company}" if title and company else title or headline
                        )
                    elif headline:
                        engagers[matched_url]["headline"] = headline

                    # Extract location
                    location = extract_location(profile)
                    if location:
                        engagers[matched_url]["location"] = location

            time.sleep(2)
        except Exception as e:
            print(f"    ERROR enriching batch: {e}")

    # Apply country filter if configured
    if country_filter:
        before = len(engagers)
        filtered = {}
        for url, data in engagers.items():
            loc = data.get("location", "").lower()
            # Keep if location matches filter, is empty (benefit of doubt), or is unknown
            if not loc or country_filter in loc:
                filtered[url] = data
        removed = before - len(filtered)
        if removed:
            print(f"  Country filter '{config['country_filter']}': removed {removed} profiles")
        engagers = filtered

    return engagers


# ── Step 4: ICP Classification & CSV Export ──────────────────────────────────

def export_csv(engagers, config):
    """Classify ICP, deduplicate, and write CSV."""
    print(f"\n{'='*60}")
    print(f"Step 4: ICP Classification & CSV Export")
    print(f"{'='*60}")

    rows = []
    icp_counts = {}

    for data in engagers.values():
        headline = data.get("headline", "")
        role, company = parse_headline(headline)
        icp_tier = classify_icp(headline, company, config)
        icp_counts[icp_tier] = icp_counts.get(icp_tier, 0) + 1

        post_urls = ", ".join(sorted(data["post_urls"] - {""}))
        source_pages = ", ".join(sorted(data["source_pages"]))
        niche_keywords = ", ".join(sorted(data["niche_keywords"]))

        rows.append({
            "Name": data["name"],
            "LinkedIn Profile URL": data["profile_url"],
            "Role": role,
            "Company Name": company,
            "Location": data.get("location", ""),
            "Source Page": source_pages,
            "Post URL(s)": post_urls,
            "Engagement Type": data.get("engagement_type", "Reaction"),
            "Comment Text": data.get("comment_text", ""),
            "ICP Tier": icp_tier,
            "Niche Keyword": niche_keywords,
        })

    # Sort: Likely ICP first, then Possible, then Unknown, then Tech Vendor
    sort_order = {"Likely ICP": 0, "Possible ICP": 1,
                  "Unknown – Review": 2, "Tech Vendor – Skip": 3}
    rows.sort(key=lambda r: (sort_order.get(r["ICP Tier"], 9), r["Name"].lower()))

    # Write CSV
    client_name = config["client_name"]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")

    # Output to skill output directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(script_dir, "..", "output")
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, f"{client_name}-{timestamp}.csv")

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS)
        writer.writeheader()
        writer.writerows(rows)

    # Print ICP breakdown
    print(f"\n  ICP Breakdown:")
    for tier in ["Likely ICP", "Possible ICP", "Unknown – Review", "Tech Vendor – Skip"]:
        count = icp_counts.get(tier, 0)
        if count:
            print(f"    {tier}: {count}")

    print(f"\n  CSV exported: {csv_path}")
    print(f"  Total rows: {len(rows)}")

    return csv_path, rows


# ── Main ─────────────────────────────────────────────────────────────────────

def _save_partial_csv(engagers, config, label="partial"):
    """Save whatever we have so far when hitting a limit."""
    if not engagers:
        print(f"\n  No engagers to save ({label}).")
        return None
    print(f"\n  Saving {len(engagers)} engagers ({label})...")
    return export_csv(engagers, config)


def main():
    parser = argparse.ArgumentParser(
        description="Pain-Language Engagers Pipeline — LinkedIn Lead Discovery"
    )
    parser.add_argument("--config", required=True, help="Path to client config JSON")
    parser.add_argument("--test", action="store_true", help="Limit to 3 keywords, 5 posts per company")
    parser.add_argument("--skip-discovery", action="store_true", help="Skip keyword search")
    parser.add_argument("--companies", type=str, default="", help="Extra company URLs (comma-separated)")
    parser.add_argument("--yes", "-y", action="store_true", help="Skip cost confirmation prompts")
    parser.add_argument("--max-runs", type=int, default=None, help="Max Apify actor runs (default: from config or 50)")
    args = parser.parse_args()

    config = load_config(args.config)
    test_mode = args.test

    # Configure apify guard
    run_limit = args.max_runs or config.get("max_apify_runs", 50)
    set_limit(run_limit)
    set_auto_confirm(args.yes)

    extra_companies = [u.strip() for u in args.companies.split(",") if u.strip()] if args.companies else []

    env = load_env()
    token = env.get("APIFY_API_TOKEN", "")
    if not token:
        print("ERROR: APIFY_API_TOKEN not found in .env")
        sys.exit(1)

    client_name = config["client_name"]
    days_back = config["days_back"]

    print(f"\n{'='*60}")
    print(f"Pain-Language LinkedIn Engagers Pipeline")
    print(f"{'='*60}")
    print(f"  Client: {client_name}")
    print(f"  Config: {args.config}")
    print(f"  Mode: {'TEST (limited)' if test_mode else 'FULL'}")
    print(f"  Skip discovery: {args.skip_discovery}")
    print(f"  Extra companies: {len(extra_companies)}")
    print(f"  Date range: last {days_back} days")
    print(f"  Pain keywords: {len(config['pain_keywords'])}")
    print(f"  ICP keywords: {len(config['icp_keywords'])}")
    print(f"  Apify run limit: {run_limit}")
    print(f"  Max discovered companies: {config['max_discovered_companies']}")
    print(f"  Max enrichment profiles: {config['max_enrichment_profiles']}")
    country = config.get("country_filter", "")
    if country:
        print(f"  Country filter: {country}")

    # Track partial results for graceful save on limit
    all_posts = {}
    discovered_companies = set()
    post_authors = {}
    engagers = {}

    try:
        # Step 1: Discover posts and company pages via pain-language search
        if not args.skip_discovery:
            keywords = config["pain_keywords"][:3] if test_mode else config["pain_keywords"]
            confirm_cost(
                "Phase 1: Pain-Keyword Search",
                num_runs=len(keywords),
                est_cost=len(keywords) * 0.10,
            )
            all_posts, discovered_companies = discover_posts_and_companies(token, config, test_mode)
            post_authors = extract_post_authors(all_posts)

            # Cap discovered companies
            max_discovered = config["max_discovered_companies"]
            if len(discovered_companies) > max_discovered:
                print(f"\n  Capping discovered companies: {len(discovered_companies)} → {max_discovered}")
                discovered_companies = set(sorted(discovered_companies)[:max_discovered])

        # Build final company list: hardcoded + discovered + extra
        company_urls = set(config["hardcoded_companies"])
        company_urls.update(discovered_companies)
        company_urls.update(extra_companies)

        print(f"\n  Final company list ({len(company_urls)} pages):")
        hardcoded = set(config["hardcoded_companies"])
        for url in sorted(company_urls):
            source = []
            if url in hardcoded:
                source.append("hardcoded")
            if url in discovered_companies:
                source.append("discovered")
            if url in extra_companies:
                source.append("CLI arg")
            print(f"    - {url}  [{', '.join(source)}]")

        # Step 2: Scrape engagers from company pages
        max_posts = 5 if test_mode else config["max_posts_per_company"]
        confirm_cost(
            "Phase 2: Company Page Scraping",
            num_runs=len(company_urls),
            est_cost=len(company_urls) * max_posts * 0.002,
        )
        engagers = scrape_company_engagers(company_urls, token, config, test_mode)

        # Merge post authors into engagers (authors take priority)
        for url, author_data in post_authors.items():
            if url in engagers:
                engagers[url]["post_urls"].update(author_data["post_urls"])
                engagers[url]["niche_keywords"].update(author_data["niche_keywords"])
                engagers[url]["source_pages"].add("keyword-search")
                engagers[url]["engagement_type"] = "Post Author"
            else:
                engagers[url] = author_data

        if not engagers:
            print("\nNo engagers found. Exiting.")
            sys.exit(1)

        # Step 3: Enrich profiles — cap the number to enrich
        max_enrich = config["max_enrichment_profiles"]
        needs_enrichment = [
            url for url, data in engagers.items()
            if not data.get("headline") or not data.get("location")
        ]
        enrich_count = min(len(needs_enrichment), max_enrich)
        if test_mode:
            enrich_count = min(enrich_count, 5)
        batch_count = (enrich_count + 24) // 25  # ceil division

        if enrich_count < len(needs_enrichment):
            print(f"\n  Capping enrichment profiles: {len(needs_enrichment)} → {enrich_count}")

        confirm_cost(
            "Phase 3: Profile Enrichment",
            num_runs=batch_count,
            est_cost=enrich_count * 0.003,
        )
        engagers = enrich_profiles(engagers, token, config, test_mode)

        # Step 4: ICP classify and export
        csv_path, rows = export_csv(engagers, config)

    except ApifyLimitReached as e:
        print(f"\n  ⚠  {e}")
        result = _save_partial_csv(engagers, config, "limit-reached")
        if result:
            csv_path, rows = result
            print(f"\n  Partial output: {csv_path}")
        return getattr(locals(), 'csv_path', None)

    # Summary
    print(f"\n{'='*60}")
    print(f"Summary")
    print(f"{'='*60}")
    print(f"  Client: {client_name}")
    print(f"  Posts from keyword search: {len(all_posts)}")
    print(f"  Post authors (direct leads): {len(post_authors)}")
    print(f"  Company pages scraped: {len(company_urls)}")
    print(f"  Total engagers: {len(rows)}")
    print(f"  Apify runs used: {get_run_count()}/{get_run_limit()}")
    roles_filled = sum(1 for r in rows if r["Role"])
    companies_filled = sum(1 for r in rows if r["Company Name"])
    locations_filled = sum(1 for r in rows if r["Location"])
    post_author_count = sum(1 for r in rows if r["Engagement Type"] == "Post Author")
    commenters = sum(1 for r in rows if r["Engagement Type"] == "Comment")
    print(f"  Roles filled: {roles_filled}/{len(rows)}")
    print(f"  Companies filled: {companies_filled}/{len(rows)}")
    print(f"  Locations filled: {locations_filled}/{len(rows)}")
    print(f"  Post authors: {post_author_count}")
    print(f"  Commenters (personalization gold): {commenters}")

    likely = [r for r in rows if r["ICP Tier"] == "Likely ICP"]
    if likely:
        print(f"\n  Top 10 Likely ICP leads:")
        print(f"  {'Name':<28} {'Role':<30} {'Company':<20} {'Location':<15}")
        print(f"  {'-'*93}")
        for r in likely[:10]:
            print(f"  {r['Name']:<28} {r['Role'][:29]:<30} {r['Company Name'][:19]:<20} {r['Location'][:14]:<15}")

    print(f"\n  Output: {csv_path}")
    return csv_path


if __name__ == "__main__":
    main()
