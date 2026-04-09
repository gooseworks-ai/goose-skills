#!/usr/bin/env python3
"""
KOL Engager ICP Pipeline — Find ICP Leads from KOL Audiences
--------------------------------------------------------------
Given a list of KOLs (LinkedIn profile URLs), scrapes their best recent
post (1 per KOL), extracts engagers, pre-filters by position, enriches
top profiles, and ICP-classifies. Cost-controlled: 1 post per KOL.

Six-step pipeline:
  1. Scrape KOL posts (profile-posts actor)
  2. Select best post per KOL (topic relevance + highest engagement)
  3. Scrape engagers from selected posts (company-posts actor)
  4. Pre-filter engagers by position score
  5. Enrich top profiles (profile scraper)
  6. ICP classify & export CSV

Usage:
    python3 skills/kol-engager-icp/scripts/kol_engager_icp.py \
      --config skills/kol-engager-icp/configs/{client}.json \
      [--test] [--probe] [--yes] [--kols "url1,url2"]
"""

import os
import sys
import json
import csv
import re
import time
import argparse
import urllib.request
from datetime import datetime, timedelta, timezone

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

PROFILE_POSTS_ACTOR_ID = "harvestapi~linkedin-profile-posts"
COMPANY_POSTS_ACTOR_ID = "WI0tj4Ieb5Kq458gB"   # harvestapi/linkedin-company-posts
PROFILE_ACTOR_ID = "supreme_coder~linkedin-profile-scraper"

# ── Mode Caps ────────────────────────────────────────────────────────────────

MODE_CAPS = {
    "test":     {"max_kols": 3,  "max_enrichment_profiles": 50},
    "standard": {"max_kols": 10, "max_enrichment_profiles": 200},
    "full":     {"max_kols": 20, "max_enrichment_profiles": 500},
}

OUTPUT_COLS = [
    "Name",
    "LinkedIn Profile URL",
    "Role",
    "Company Name",
    "Location",
    "KOL Source",
    "Post URL",
    "Engagement Type",
    "Comment Text",
    "ICP Tier",
    "Pre-Filter Score",
]


# ── Config Loading ───────────────────────────────────────────────────────────

def load_config(config_path):
    """Load client config from JSON file."""
    with open(config_path) as f:
        config = json.load(f)

    required = ["client_name", "kol_urls"]
    missing = [k for k in required if k not in config]
    if missing:
        print(f"ERROR: Config missing required fields: {missing}")
        sys.exit(1)

    config.setdefault("topic_keywords", [])
    config.setdefault("topic_patterns", [])
    config.setdefault("icp_keywords", [])
    config.setdefault("target_titles", [])
    config.setdefault("exclude_titles", [])
    config.setdefault("tech_vendor_keywords", [])
    config.setdefault("country_filter", "")
    config.setdefault("days_back", 30)
    config.setdefault("max_posts_per_kol", 20)
    config.setdefault("max_kols", 10)
    config.setdefault("max_enrichment_profiles", 200)
    config.setdefault("mode", "standard")
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


def clean_profile_url(url):
    """Strip query params from LinkedIn profile URLs."""
    if "?" in url:
        return url.split("?")[0]
    return url


def classify_icp(headline, company, config):
    """Returns ICP tier classification using config-driven keyword lists."""
    text = (headline + " " + company).lower()

    icp_keywords = config.get("icp_keywords", [])
    tech_vendor_keywords = config.get("tech_vendor_keywords", [])

    is_tech_vendor = any(sig in text for sig in tech_vendor_keywords)
    is_icp_match = any(sig in text for sig in icp_keywords)

    if is_tech_vendor and not is_icp_match:
        return "Tech Vendor – Skip"
    if is_icp_match:
        return "Likely ICP"

    target_titles = config.get("target_titles", [])
    if any(t.lower() in text for t in target_titles):
        return "Likely ICP"

    ops_roles = ["vp operations", "chief operating", "coo", "head of operations",
                 "operations manager", "founder", "ceo", "president", "director"]
    if any(r in text for r in ops_roles):
        return "Possible ICP"
    return "Unknown – Review"


def debug_save(data, filename):
    """Save data to .tmp/ for debugging."""
    debug_dir = os.path.join(os.getcwd(), ".tmp")
    os.makedirs(debug_dir, exist_ok=True)
    path = os.path.join(debug_dir, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"    Debug saved: {path}")
    return path


# ── Step 1: Scrape KOL Posts ────────────────────────────────────────────────

def scrape_kol_posts(kol_urls, token, config):
    """Scrape recent posts from each KOL profile."""
    days_back = config["days_back"]
    max_posts = config["max_posts_per_kol"]

    print(f"\n{'='*60}")
    print(f"Step 1: Scrape KOL Posts ({len(kol_urls)} KOLs)")
    print(f"{'='*60}")
    print(f"  Actor: harvestapi/linkedin-profile-posts")
    print(f"  Max posts per KOL: {max_posts}")
    print(f"  Days back: {days_back}")
    print(f"  Est. cost: ~${len(kol_urls) * max_posts * 0.002:.2f}")

    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    kol_posts = {}  # kol_url -> list of posts

    for i, kol_url in enumerate(kol_urls, 1):
        print(f"\n  [{i}/{len(kol_urls)}] Scraping: {kol_url}")
        try:
            run_id = guarded_apify_run(
                PROFILE_POSTS_ACTOR_ID,
                {
                    "profileUrls": [kol_url],
                    "maxPosts": max_posts,
                },
                token,
                wait_secs=300,
            )
            items = apify_dataset(run_id, token, limit=500)

            # Filter by date
            posts = []
            for item in items:
                date_str = item.get("postedAt") or item.get("postedDate") or item.get("postedDateTimestamp")
                if date_str is None:
                    posts.append(item)
                    continue
                if isinstance(date_str, (int, float)):
                    dt = datetime.fromtimestamp(
                        date_str / 1000 if date_str > 1e12 else date_str,
                        tz=timezone.utc
                    )
                elif isinstance(date_str, str):
                    try:
                        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    except ValueError:
                        posts.append(item)
                        continue
                else:
                    posts.append(item)
                    continue
                if dt >= cutoff:
                    posts.append(item)

            kol_posts[kol_url] = posts
            print(f"    Retrieved {len(items)} total, {len(posts)} within {days_back} days")

        except ApifyLimitReached:
            raise
        except Exception as e:
            print(f"    ERROR: {e}")
            kol_posts[kol_url] = []

        time.sleep(2)

    total = sum(len(p) for p in kol_posts.values())
    print(f"\n  Total posts across all KOLs: {total}")
    return kol_posts


# ── Step 2: Select Best Post per KOL ───────────────────────────────────────

def select_best_posts(kol_posts, config):
    """For each KOL, filter by topic relevance then pick highest engagement."""
    topic_keywords = [k.lower() for k in config.get("topic_keywords", [])]
    topic_patterns = config.get("topic_patterns", [])

    print(f"\n{'='*60}")
    print(f"Step 2: Select Best Post per KOL")
    print(f"{'='*60}")
    print(f"  Topic keywords: {topic_keywords}")

    selected = {}  # kol_url -> best_post

    for kol_url, posts in kol_posts.items():
        if not posts:
            print(f"  {kol_url}: No posts, skipping")
            continue

        # Filter by topic relevance
        relevant = []
        for post in posts:
            text = (
                str(post.get("text", "")) + " " +
                str(post.get("postText", "")) + " " +
                str(post.get("title", ""))
            ).lower()

            # Check keyword match
            kw_match = any(kw in text for kw in topic_keywords) if topic_keywords else True
            # Check pattern match
            pattern_match = any(re.search(p, text) for p in topic_patterns) if topic_patterns else False

            if kw_match or pattern_match:
                relevant.append(post)

        # If no relevant posts, use all posts (fall back to pure engagement)
        candidates = relevant if relevant else posts

        # Pick highest engagement
        best = max(
            candidates,
            key=lambda p: (p.get("totalReactionCount") or p.get("numLikes") or 0) +
                          (p.get("commentsCount") or p.get("numComments") or 0)
        )

        reactions = best.get("totalReactionCount") or best.get("numLikes") or 0
        comments = best.get("commentsCount") or best.get("numComments") or 0
        post_url = best.get("url") or best.get("postUrl") or best.get("linkedinUrl") or ""
        preview = (best.get("text") or best.get("postText") or "")[:80].replace("\n", " ")

        kol_name = best.get("authorName") or best.get("author", {}).get("name", "") if isinstance(best.get("author"), dict) else kol_url.split("/in/")[-1].rstrip("/")

        selected[kol_url] = {
            "post": best,
            "post_url": post_url,
            "reactions": reactions,
            "comments": comments,
            "engagement": reactions + comments,
            "kol_name": kol_name,
            "relevant_count": len(relevant),
            "total_count": len(posts),
        }

        tag = f"[{len(relevant)}/{len(posts)} relevant]" if relevant else "[fallback: no topic match]"
        print(f"  {kol_name}: {tag} → {reactions}R + {comments}C = {reactions + comments} eng")
        if preview:
            print(f"    \"{preview}...\"")

    print(f"\n  Posts selected: {len(selected)}/{len(kol_posts)} KOLs")
    return selected


# ── Step 3: Scrape Engagers ─────────────────────────────────────────────────

def scrape_engagers(selected_posts, token, config):
    """Scrape reactions + comments from selected posts using company-posts actor."""
    print(f"\n{'='*60}")
    print(f"Step 3: Scrape Engagers from {len(selected_posts)} Posts")
    print(f"{'='*60}")
    print(f"  Actor: harvestapi/linkedin-company-posts")
    print(f"  Est. cost: ~${len(selected_posts) * 0.10:.2f}")

    all_engagers = {}  # profile_url -> engager data

    for kol_url, post_info in selected_posts.items():
        post_url = post_info["post_url"]
        kol_name = post_info["kol_name"]

        if not post_url:
            print(f"\n  {kol_name}: No post URL, skipping")
            continue

        print(f"\n  [{kol_name}] Scraping engagers from: {post_url}")
        print(f"    Expected: ~{post_info['reactions']}R + {post_info['comments']}C")

        try:
            payload = {
                "targetUrls": [post_url],
                "maxPosts": 1,
                "scrapeReactions": True,
                "maxReactions": 0,
                "scrapeComments": True,
                "maxComments": 0,
            }

            run_id = guarded_apify_run(COMPANY_POSTS_ACTOR_ID, payload, token, wait_secs=600)
            items = apify_dataset(run_id, token)
            print(f"    Retrieved {len(items)} total items")

            reactions = [i for i in items if i.get("type") == "reaction"]
            comments = [i for i in items if i.get("type") == "comment"]
            print(f"    Reactions: {len(reactions)}, Comments: {len(comments)}")

            # Extract engagers from reactions
            for r in reactions:
                actor = r.get("actor", {})
                profile_url = actor.get("linkedinUrl", "")
                name = actor.get("name", "")
                position = actor.get("position", "")

                if not profile_url or not name:
                    continue

                if profile_url not in all_engagers:
                    all_engagers[profile_url] = {
                        "name": name,
                        "profile_url": profile_url,
                        "headline": position,
                        "location": "",
                        "kol_source": kol_name,
                        "kol_url": kol_url,
                        "post_url": post_url,
                        "engagement_type": "Reaction",
                        "comment_text": "",
                        "engage_count": 0,
                    }
                all_engagers[profile_url]["engage_count"] += 1

            # Extract engagers from comments
            for c in comments:
                actor = c.get("actor", {})
                profile_url = actor.get("linkedinUrl", "")
                name = actor.get("name", "")
                position = actor.get("position", "")
                comment_text = c.get("text", "") or c.get("content", "") or ""

                if not profile_url or not name:
                    continue

                if profile_url not in all_engagers:
                    all_engagers[profile_url] = {
                        "name": name,
                        "profile_url": profile_url,
                        "headline": position,
                        "location": "",
                        "kol_source": kol_name,
                        "kol_url": kol_url,
                        "post_url": post_url,
                        "engagement_type": "Comment",
                        "comment_text": comment_text[:500],
                        "engage_count": 0,
                    }
                else:
                    # Upgrade to commenter if they also reacted
                    if comment_text:
                        all_engagers[profile_url]["engagement_type"] = "Comment"
                        all_engagers[profile_url]["comment_text"] = comment_text[:500]
                all_engagers[profile_url]["engage_count"] += 1

            print(f"    Running total engagers: {len(all_engagers)}")

        except ApifyLimitReached:
            raise
        except Exception as e:
            print(f"    ERROR: {e}")

        time.sleep(2)

    print(f"\n  Total unique engagers: {len(all_engagers)}")
    return all_engagers


# ── Step 4: Pre-Filter ──────────────────────────────────────────────────────

def pre_filter_engagers(all_engagers, config, max_profiles):
    """Score engagers by position and filter before enrichment."""
    print(f"\n{'='*60}")
    print(f"Step 4: Pre-Filter Engagers ({len(all_engagers)} total)")
    print(f"{'='*60}")

    icp_keywords = [k.lower() for k in config.get("icp_keywords", [])]
    target_titles = [t.lower() for t in config.get("target_titles", [])]
    exclude_titles = [t.lower() for t in config.get("exclude_titles", [])]
    vendor_keywords = [v.lower() for v in config.get("tech_vendor_keywords", [])]

    scored = []

    for url, data in all_engagers.items():
        position = (data.get("headline", "") or "").lower()
        score = 0

        # Commenter bonus
        if data["engagement_type"] == "Comment":
            score += 3

        # ICP keyword match
        if any(kw in position for kw in icp_keywords):
            score += 2

        # Target title match
        if any(t in position for t in target_titles):
            score += 2

        # Exclude penalty
        if any(t in position for t in exclude_titles):
            score -= 5
        if any(v in position for v in vendor_keywords):
            score -= 5

        # Multi-post engagement bonus
        if data["engage_count"] > 1:
            score += 1

        data["pre_filter_score"] = score
        if score > 0:
            scored.append(data)

    # Sort by score descending
    scored.sort(key=lambda x: x["pre_filter_score"], reverse=True)

    # Cap at max_profiles
    if len(scored) > max_profiles:
        print(f"  Capping: {len(scored)} → {max_profiles}")
        scored = scored[:max_profiles]

    # Score distribution
    score_dist = {}
    for s in scored:
        sc = s["pre_filter_score"]
        score_dist[sc] = score_dist.get(sc, 0) + 1

    print(f"  Passed filter (score > 0): {len(scored)}")
    print(f"  Filtered out: {len(all_engagers) - len(scored)}")
    print(f"  Score distribution:")
    for sc in sorted(score_dist.keys(), reverse=True):
        print(f"    Score {sc}: {score_dist[sc]}")

    return {d["profile_url"]: d for d in scored}


# ── Step 5: Enrich Profiles ────────────────────────────────────────────────

def enrich_profiles(engagers, token, config):
    """Enrich profiles to get headline and location data."""
    needs_enrichment = [
        url for url, data in engagers.items()
        if not data.get("headline") or not data.get("location")
    ]

    has_both = len(engagers) - len(needs_enrichment)
    print(f"\n{'='*60}")
    print(f"Step 5: Profile Enrichment")
    print(f"{'='*60}")
    print(f"  {has_both}/{len(engagers)} already have headline + location")

    if not needs_enrichment:
        print(f"  All profiles complete. Skipping enrichment.")
        return engagers

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
        except ApifyLimitReached:
            raise
        except Exception as e:
            print(f"    ERROR enriching batch: {e}")

    # Apply country filter
    if country_filter:
        before = len(engagers)
        filtered = {}
        for url, data in engagers.items():
            loc = data.get("location", "").lower()
            if not loc or country_filter in loc:
                filtered[url] = data
        removed = before - len(filtered)
        if removed:
            print(f"  Country filter '{config['country_filter']}': removed {removed} profiles")
        engagers = filtered

    return engagers


# ── Step 6: ICP Classify & Export ───────────────────────────────────────────

def export_csv(engagers, config):
    """Classify ICP and write CSV."""
    print(f"\n{'='*60}")
    print(f"Step 6: ICP Classification & CSV Export")
    print(f"{'='*60}")

    rows = []
    icp_counts = {}

    for data in engagers.values():
        headline = data.get("headline", "")
        role, company = parse_headline(headline)
        icp_tier = classify_icp(headline, company, config)
        icp_counts[icp_tier] = icp_counts.get(icp_tier, 0) + 1

        rows.append({
            "Name": data["name"],
            "LinkedIn Profile URL": data["profile_url"],
            "Role": role,
            "Company Name": company,
            "Location": data.get("location", ""),
            "KOL Source": data.get("kol_source", ""),
            "Post URL": data.get("post_url", ""),
            "Engagement Type": data.get("engagement_type", "Reaction"),
            "Comment Text": data.get("comment_text", ""),
            "ICP Tier": icp_tier,
            "Pre-Filter Score": data.get("pre_filter_score", 0),
        })

    # Sort: Likely ICP first, then by pre-filter score
    sort_order = {"Likely ICP": 0, "Possible ICP": 1,
                  "Unknown – Review": 2, "Tech Vendor – Skip": 3}
    rows.sort(key=lambda r: (sort_order.get(r["ICP Tier"], 9), -r["Pre-Filter Score"]))

    # Write CSV
    client_name = config["client_name"]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(script_dir, "..", "output")
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, f"{client_name}-kol-engagers-{timestamp}.csv")

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n  ICP Breakdown:")
    for tier in ["Likely ICP", "Possible ICP", "Unknown – Review", "Tech Vendor – Skip"]:
        count = icp_counts.get(tier, 0)
        if count:
            print(f"    {tier}: {count}")

    print(f"\n  CSV exported: {csv_path}")
    print(f"  Total rows: {len(rows)}")

    return csv_path, rows


# ── Probe Mode ──────────────────────────────────────────────────────────────

def run_probe(kol_urls, token, config):
    """Test engager scraping with the first KOL and exit."""
    print(f"\n{'='*60}")
    print(f"PROBE MODE — Testing engager scraping")
    print(f"{'='*60}")

    kol_url = kol_urls[0]
    print(f"  KOL: {kol_url}")

    # Step 1: Scrape posts
    print(f"\n  Scraping posts...")
    kol_posts = scrape_kol_posts([kol_url], token, config)

    # Step 2: Select best post
    selected = select_best_posts(kol_posts, config)
    if not selected:
        print("\n  No posts found for this KOL. Try a different URL.")
        return

    post_info = list(selected.values())[0]
    post_url = post_info["post_url"]
    print(f"\n  Selected post: {post_url}")
    print(f"  Engagement: {post_info['reactions']}R + {post_info['comments']}C")

    if not post_url:
        print("\n  No post URL available. Cannot scrape engagers.")
        return

    # Step 3: Scrape engagers
    print(f"\n  Scraping engagers from post...")
    engagers = scrape_engagers(selected, token, config)

    # Print sample
    print(f"\n  {'='*60}")
    print(f"  PROBE RESULTS")
    print(f"  {'='*60}")
    print(f"  Total engagers: {len(engagers)}")

    if engagers:
        print(f"\n  Sample engagers (first 10):")
        print(f"  {'Name':<28} {'Position':<40} {'Type':<10}")
        print(f"  {'-'*78}")
        for i, (url, data) in enumerate(list(engagers.items())[:10]):
            print(f"  {data['name'][:27]:<28} {(data.get('headline', '') or '')[:39]:<40} {data['engagement_type']:<10}")

    print(f"\n  Probe complete. Engager scraping {'WORKS' if engagers else 'FAILED'}.")
    print(f"  Apify runs used: {get_run_count()}")


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
        description="KOL Engager ICP Pipeline — Find ICP Leads from KOL Audiences"
    )
    parser.add_argument("--config", required=True, help="Path to client config JSON")
    parser.add_argument("--test", action="store_true", help="Limit to 3 KOLs, 50 enrichment profiles")
    parser.add_argument("--probe", action="store_true", help="Test engager scraping and exit")
    parser.add_argument("--yes", "-y", action="store_true", help="Skip cost confirmation prompts")
    parser.add_argument("--kols", type=str, default="", help="Override KOL URLs (comma-separated)")
    parser.add_argument("--max-runs", type=int, default=None, help="Max Apify actor runs")
    args = parser.parse_args()

    config = load_config(args.config)

    # Determine mode and caps
    if args.test:
        mode = "test"
    else:
        mode = config.get("mode", "standard")

    caps = MODE_CAPS.get(mode, MODE_CAPS["standard"])
    max_kols = caps["max_kols"]
    max_enrichment = caps["max_enrichment_profiles"]

    # Config overrides caps
    if config.get("max_kols") and not args.test:
        max_kols = min(config["max_kols"], caps["max_kols"])
    if config.get("max_enrichment_profiles") and not args.test:
        max_enrichment = min(config["max_enrichment_profiles"], caps["max_enrichment_profiles"])

    run_limit = args.max_runs or config.get("max_apify_runs", 50)
    set_limit(run_limit)
    set_auto_confirm(args.yes)

    # KOL URLs from CLI or config
    if args.kols:
        kol_urls = [u.strip() for u in args.kols.split(",") if u.strip()]
    else:
        kol_urls = config.get("kol_urls", [])

    if not kol_urls:
        print("ERROR: No KOL URLs provided. Use --kols or set kol_urls in config.")
        sys.exit(1)

    # Cap KOLs
    if len(kol_urls) > max_kols:
        print(f"  Capping KOLs: {len(kol_urls)} → {max_kols}")
        kol_urls = kol_urls[:max_kols]

    env = load_env()
    token = GOOSEWORKS_API_KEY or env.get("APIFY_API_TOKEN", "")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)

    client_name = config["client_name"]

    print(f"\n{'='*60}")
    print(f"KOL Engager ICP Pipeline")
    print(f"{'='*60}")
    print(f"  Client: {client_name}")
    print(f"  Config: {args.config}")
    print(f"  Mode: {mode.upper()}")
    print(f"  KOLs: {len(kol_urls)}")
    print(f"  Max enrichment profiles: {max_enrichment}")
    print(f"  Days back: {config['days_back']}")
    print(f"  Topic keywords: {config.get('topic_keywords', [])}")
    print(f"  Apify run limit: {run_limit}")
    country = config.get("country_filter", "")
    if country:
        print(f"  Country filter: {country}")

    # Probe mode
    if args.probe:
        run_probe(kol_urls, token, config)
        return

    # Full pipeline
    engagers = {}

    try:
        # Step 1: Scrape KOL posts
        confirm_cost(
            "Step 1: Scrape KOL Posts",
            num_runs=len(kol_urls),
            est_cost=len(kol_urls) * config["max_posts_per_kol"] * 0.002,
        )
        kol_posts = scrape_kol_posts(kol_urls, token, config)

        # Step 2: Select best post per KOL
        selected = select_best_posts(kol_posts, config)

        if not selected:
            print("\nNo posts selected. Check KOL URLs and topic keywords.")
            sys.exit(1)

        # Step 3: Scrape engagers
        confirm_cost(
            "Step 3: Scrape Engagers",
            num_runs=len(selected),
            est_cost=len(selected) * 0.10,
        )
        engagers = scrape_engagers(selected, token, config)

        if not engagers:
            print("\nNo engagers found. Try different KOLs or topic keywords.")
            sys.exit(1)

        debug_save(
            {url: {**d, "engage_count": d["engage_count"]} for url, d in engagers.items()},
            f"kol-engagers-raw-{client_name}.json"
        )

        # Step 4: Pre-filter
        engagers = pre_filter_engagers(engagers, config, max_enrichment)

        if not engagers:
            print("\nAll engagers filtered out. Broaden ICP keywords or target titles.")
            sys.exit(1)

        # Step 5: Enrich
        enrich_count = len([
            url for url, data in engagers.items()
            if not data.get("headline") or not data.get("location")
        ])
        batch_count = (min(enrich_count, max_enrichment) + 24) // 25

        confirm_cost(
            "Step 5: Profile Enrichment",
            num_runs=batch_count,
            est_cost=min(enrich_count, max_enrichment) * 0.003,
        )
        engagers = enrich_profiles(engagers, token, config)

        # Step 6: ICP classify and export
        csv_path, rows = export_csv(engagers, config)

    except ApifyLimitReached as e:
        print(f"\n  ⚠  {e}")
        result = _save_partial_csv(engagers, config, "limit-reached")
        if result:
            csv_path, rows = result
            print(f"\n  Partial output: {csv_path}")
        return

    # Summary
    print(f"\n{'='*60}")
    print(f"Summary")
    print(f"{'='*60}")
    print(f"  Client: {client_name}")
    print(f"  KOLs processed: {len(kol_urls)}")
    print(f"  Posts selected: {len(selected)}")
    print(f"  Total engagers found: {sum(len(kol_posts.get(u, [])) for u in kol_urls)}")
    print(f"  After pre-filter: {len(engagers)}")
    print(f"  Final leads: {len(rows)}")
    print(f"  Apify runs used: {get_run_count()}/{get_run_limit()}")

    # Per-KOL breakdown
    kol_counts = {}
    for r in rows:
        src = r["KOL Source"]
        kol_counts[src] = kol_counts.get(src, 0) + 1

    if kol_counts:
        print(f"\n  Per-KOL lead breakdown:")
        for kol, count in sorted(kol_counts.items(), key=lambda x: -x[1]):
            print(f"    {kol}: {count}")

    # Top leads
    likely = [r for r in rows if r["ICP Tier"] == "Likely ICP"]
    if likely:
        print(f"\n  Top 10 Likely ICP leads:")
        print(f"  {'Name':<28} {'Role':<30} {'Company':<20} {'KOL':<15}")
        print(f"  {'-'*93}")
        for r in likely[:10]:
            print(f"  {r['Name'][:27]:<28} {r['Role'][:29]:<30} {r['Company Name'][:19]:<20} {r['KOL Source'][:14]:<15}")

    print(f"\n  Output: {csv_path}")
    return csv_path


if __name__ == "__main__":
    main()
