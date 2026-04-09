#!/usr/bin/env python3
"""
Competitor Post Engagers Pipeline — Find Leads from Competitor Audiences
------------------------------------------------------------------------
Given one or more LinkedIn company page URLs, scrapes their recent posts,
ranks by engagement, selects top N, extracts all engagers (reactors +
commenters), ICP-classifies, and exports CSV.

Four-step pipeline:
  1. Scrape company posts + engagers (single Apify call per company)
  2. Rank & select top N posts by engagement within time window
  3. Company enrichment via Apollo (industry, size, description)
  4. ICP classify & export CSV

Usage:
    python3 skills/competitor-post-engagers/scripts/competitor_post_engagers.py \
      --config skills/competitor-post-engagers/configs/{name}.json \
      [--test] [--yes] [--skip-company-enrich] [--top-n 3] [--max-runs 30]
"""

import os
import sys
import json
import csv
import time
import argparse
import urllib.request
from datetime import datetime, timedelta, timezone

# ── Apify Guard (shared cost protection) ────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", ".."))
from tools.apify_guard import (
    guarded_apify_run, confirm_cost, set_limit, set_auto_confirm,
    ApifyLimitReached, get_run_count, get_run_limit,
)

# ── Apollo Client (company enrichment) ──────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "apollo-lead-finder", "scripts"))
from apollo_client import ApolloClient

# ── GooseWorks Proxy ─────────────────────────────────────────────────────────
GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

# ── Apify Actor IDs ──────────────────────────────────────────────────────────

COMPANY_POSTS_ACTOR_ID = "WI0tj4Ieb5Kq458gB"   # harvestapi/linkedin-company-posts

# ── Test Mode Caps ──────────────────────────────────────────────────────────

TEST_CAPS = {
    "max_posts": 20,
    "max_reactions": 50,
    "max_comments": 50,
    "top_n_posts": 1,
}

OUTPUT_COLS = [
    "Name",
    "LinkedIn URL",
    "Role",
    "Company",
    "Company Industry",
    "Company Size",
    "Company Description",
    "Company Location",
    "Source Page",
    "Post URL",
    "Post Preview",
    "Engagement Type",
    "Comment Text",
    "ICP Tier",
    "Pre-Filter Score",
]


# ── Config Loading ───────────────────────────────────────────────────────────

def load_config(config_path):
    """Load config from JSON file."""
    with open(config_path) as f:
        config = json.load(f)

    required = ["name", "company_urls"]
    missing = [k for k in required if k not in config]
    if missing:
        print(f"ERROR: Config missing required fields: {missing}")
        sys.exit(1)

    config.setdefault("days_back", 30)
    config.setdefault("max_posts", 50)
    config.setdefault("max_reactions", 500)
    config.setdefault("max_comments", 200)
    config.setdefault("top_n_posts", 1)
    config.setdefault("icp_keywords", [])
    config.setdefault("exclude_keywords", [])
    config.setdefault("max_apify_runs", 50)
    config.setdefault("output_dir", "output")
    config.setdefault("enrich_companies", True)
    config.setdefault("competitor_company_names", [])
    config.setdefault("industry_keywords", [
        "freight", "logistics", "trucking", "transportation", "3pl",
        "supply chain", "carrier", "brokerage", "shipping", "warehousing",
    ])

    # Store config file directory for resolving relative paths
    config["_config_dir"] = os.path.dirname(os.path.abspath(config_path))

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


def classify_icp(headline, company, config, company_industry=""):
    """Returns ICP tier classification using config-driven keyword lists and company industry."""
    text = (headline + " " + company).lower()

    icp_keywords = [k.lower() for k in config.get("icp_keywords", [])]
    exclude_keywords = [k.lower() for k in config.get("exclude_keywords", [])]
    industry_keywords = [k.lower() for k in config.get("industry_keywords", [])]

    is_excluded = any(kw in text for kw in exclude_keywords)
    is_icp_match = any(kw in text for kw in icp_keywords)

    # Industry match from company enrichment (strongest signal)
    industry_text = (company_industry or "").lower()
    is_industry_match = any(kw in industry_text for kw in industry_keywords) if industry_keywords else False

    if is_excluded and not is_icp_match and not is_industry_match:
        return "Tech Vendor - Skip"
    if is_icp_match or is_industry_match:
        return "Likely ICP"

    ops_roles = ["vp operations", "chief operating", "coo", "head of operations",
                 "operations manager", "founder", "ceo", "president", "director",
                 "vp sales", "head of sales", "chief revenue", "cro"]
    if any(r in text for r in ops_roles):
        return "Possible ICP"
    return "Unknown - Review"


def debug_save(data, filename):
    """Save data to .tmp/ for debugging."""
    debug_dir = os.path.join(os.getcwd(), ".tmp")
    os.makedirs(debug_dir, exist_ok=True)
    path = os.path.join(debug_dir, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    print(f"    Debug saved: {path}")
    return path


# ── Step 1: Scrape Company Posts + Engagers ─────────────────────────────────

def scrape_company_posts(company_urls, token, config):
    """Scrape posts, reactions, and comments from each company page."""
    max_posts = config["max_posts"]
    max_reactions = config["max_reactions"]
    max_comments = config["max_comments"]

    print(f"\n{'='*60}")
    print(f"Step 1: Scrape Company Posts + Engagers ({len(company_urls)} companies)")
    print(f"{'='*60}")
    print(f"  Actor: harvestapi/linkedin-company-posts")
    print(f"  Max posts per company: {max_posts}")
    print(f"  Max reactions per post: {max_reactions}")
    print(f"  Max comments per post: {max_comments}")
    print(f"  Est. cost: ~${len(company_urls) * max_posts * 0.002:.2f}")

    company_data = {}  # company_url -> {"posts": [], "reactions": [], "comments": []}

    for i, company_url in enumerate(company_urls, 1):
        print(f"\n  [{i}/{len(company_urls)}] Scraping: {company_url}")

        try:
            payload = {
                "targetUrls": [company_url],
                "maxPosts": max_posts,
                "scrapeReactions": True,
                "maxReactions": max_reactions,
                "scrapeComments": True,
                "maxComments": max_comments,
            }

            run_id = guarded_apify_run(COMPANY_POSTS_ACTOR_ID, payload, token, wait_secs=600)
            items = apify_dataset(run_id, token)
            print(f"    Retrieved {len(items)} total items")

            posts = [i for i in items if i.get("type") == "post"]
            reactions = [i for i in items if i.get("type") == "reaction"]
            comments = [i for i in items if i.get("type") == "comment"]
            print(f"    Posts: {len(posts)}, Reactions: {len(reactions)}, Comments: {len(comments)}")

            company_data[company_url] = {
                "posts": posts,
                "reactions": reactions,
                "comments": comments,
            }

        except ApifyLimitReached:
            raise
        except Exception as e:
            print(f"    ERROR: {e}")
            company_data[company_url] = {"posts": [], "reactions": [], "comments": []}

        time.sleep(2)

    total_posts = sum(len(d["posts"]) for d in company_data.values())
    total_reactions = sum(len(d["reactions"]) for d in company_data.values())
    total_comments = sum(len(d["comments"]) for d in company_data.values())
    print(f"\n  Totals: {total_posts} posts, {total_reactions} reactions, {total_comments} comments")

    return company_data


# ── Step 2: Rank & Select Top Posts ─────────────────────────────────────────

def rank_and_select_posts(company_data, config):
    """Filter by time window, rank by engagement, select top N posts per company."""
    days_back = config["days_back"]
    top_n = config["top_n_posts"]
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)

    print(f"\n{'='*60}")
    print(f"Step 2: Rank & Select Top Posts")
    print(f"{'='*60}")
    print(f"  Days back: {days_back}")
    print(f"  Top N posts per company: {top_n}")

    selected = {}  # company_url -> list of selected post dicts

    for company_url, data in company_data.items():
        posts = data["posts"]
        reactions = data["reactions"]
        comments = data["comments"]

        if not posts:
            print(f"\n  {company_url}: No posts, skipping")
            continue

        # Build reaction/comment counts per post
        reaction_counts = {}
        comment_counts = {}

        for r in reactions:
            post_id = str(r.get("postId", ""))
            if post_id:
                reaction_counts[post_id] = reaction_counts.get(post_id, 0) + 1

        for c in comments:
            post_id = str(c.get("postId", ""))
            if post_id:
                comment_counts[post_id] = comment_counts.get(post_id, 0) + 1

        # Filter by date and rank
        candidates = []
        for post in posts:
            post_id = str(post.get("id", ""))

            # Date filtering
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
                    in_range = True  # benefit of the doubt
            else:
                in_range = True  # no date info, include

            if not in_range:
                continue

            # Get engagement counts from scraped reactions/comments
            r_count = reaction_counts.get(post_id, 0)
            c_count = comment_counts.get(post_id, 0)

            # Also check inline counts from the post itself
            inline_reactions = post.get("totalReactionCount") or post.get("numLikes") or 0
            inline_comments = post.get("commentsCount") or post.get("numComments") or 0

            # Use the higher of scraped vs inline counts for ranking
            effective_reactions = max(r_count, inline_reactions)
            effective_comments = max(c_count, inline_comments)
            engagement = effective_reactions + effective_comments

            post_url = post.get("linkedinUrl") or post.get("url") or ""
            content = post.get("content") or post.get("text") or post.get("postText") or ""
            preview = content[:120].replace("\n", " ")

            candidates.append({
                "post": post,
                "post_id": post_id,
                "post_url": post_url,
                "preview": preview,
                "reactions": effective_reactions,
                "comments": effective_comments,
                "engagement": engagement,
            })

        # Sort by engagement descending, select top N
        candidates.sort(key=lambda x: x["engagement"], reverse=True)
        top_posts = candidates[:top_n]

        company_name = company_url.rstrip("/").split("/")[-1]
        selected[company_url] = top_posts

        print(f"\n  {company_name}: {len(candidates)} posts in range, selected top {len(top_posts)}")
        for j, tp in enumerate(top_posts, 1):
            print(f"    #{j}: {tp['reactions']}R + {tp['comments']}C = {tp['engagement']} eng")
            if tp["preview"]:
                print(f"        \"{tp['preview'][:80]}...\"")
            if tp["post_url"]:
                print(f"        {tp['post_url']}")

    total_selected = sum(len(v) for v in selected.values())
    print(f"\n  Total posts selected: {total_selected}")

    return selected


# ── Step 2b: Extract Engagers from Selected Posts ───────────────────────────

def extract_engagers(company_data, selected, config):
    """Extract engagers (reactors + commenters) from the selected posts only."""
    print(f"\n{'='*60}")
    print(f"Step 2b: Extract Engagers from Selected Posts")
    print(f"{'='*60}")

    all_engagers = {}  # name -> engager data (dedup by name)

    for company_url, top_posts in selected.items():
        data = company_data[company_url]
        reactions = data["reactions"]
        comments = data["comments"]
        company_name = company_url.rstrip("/").split("/")[-1]

        # Build set of selected post IDs for this company
        selected_post_ids = set()
        post_url_map = {}
        post_preview_map = {}
        for tp in top_posts:
            pid = tp["post_id"]
            selected_post_ids.add(pid)
            post_url_map[pid] = tp["post_url"]
            post_preview_map[pid] = tp["preview"]

        # Extract from reactions
        for r in reactions:
            post_id = str(r.get("postId", ""))
            if post_id not in selected_post_ids:
                continue

            actor = r.get("actor", {})
            profile_url = actor.get("linkedinUrl", "")
            name = actor.get("name", "")
            position = actor.get("position", "")

            if not name:
                continue

            # Dedup by name (handles LinkedIn URL variants)
            if name not in all_engagers:
                all_engagers[name] = {
                    "name": name,
                    "profile_url": profile_url,
                    "headline": position,
                    "source_page": company_name,
                    "post_url": post_url_map.get(post_id, ""),
                    "post_preview": post_preview_map.get(post_id, ""),
                    "engagement_type": "Reaction",
                    "comment_text": "",
                    "pre_filter_score": 0,
                }
            else:
                # Prefer non-ACoAA URLs
                existing_url = all_engagers[name]["profile_url"]
                if "/ACoAA" in existing_url and profile_url and "/ACoAA" not in profile_url:
                    all_engagers[name]["profile_url"] = profile_url
                if not all_engagers[name]["headline"] and position:
                    all_engagers[name]["headline"] = position

        # Extract from comments
        for c in comments:
            post_id = str(c.get("postId", ""))
            if post_id not in selected_post_ids:
                continue

            actor = c.get("actor", {})
            profile_url = actor.get("linkedinUrl", "")
            name = actor.get("name", "")
            position = actor.get("position", "")
            comment_text = c.get("text", "") or c.get("content", "") or ""

            if not name:
                continue

            if name not in all_engagers:
                all_engagers[name] = {
                    "name": name,
                    "profile_url": profile_url,
                    "headline": position,
                    "source_page": company_name,
                    "post_url": post_url_map.get(post_id, ""),
                    "post_preview": post_preview_map.get(post_id, ""),
                    "engagement_type": "Comment",
                    "comment_text": comment_text[:500],
                    "pre_filter_score": 0,
                }
            else:
                # Upgrade to commenter if they also reacted
                if comment_text:
                    all_engagers[name]["engagement_type"] = "Comment"
                    all_engagers[name]["comment_text"] = comment_text[:500]
                existing_url = all_engagers[name]["profile_url"]
                if "/ACoAA" in existing_url and profile_url and "/ACoAA" not in profile_url:
                    all_engagers[name]["profile_url"] = profile_url
                if not all_engagers[name]["headline"] and position:
                    all_engagers[name]["headline"] = position

        print(f"  {company_name}: extracted engagers, running total: {len(all_engagers)}")

    print(f"\n  Total unique engagers (by name): {len(all_engagers)}")
    return all_engagers


# ── Step 3: Company Enrichment (Apollo) ─────────────────────────────────────

def enrich_companies(engagers, config, env):
    """Enrich unique companies via Apollo org enrichment.

    Two-phase approach to handle Apollo's domain-required enrichment:
      Phase 1: Search Apollo for each company name to discover its domain (free search)
      Phase 2: Enrich by domain (1 credit per company)

    This avoids 422 errors from Apollo's /organizations/enrich endpoint which
    requires the 'domain' parameter.
    """
    print(f"\n{'='*60}")
    print(f"Step 3: Company Enrichment (Apollo)")
    print(f"{'='*60}")

    apollo_key = env.get("APOLLO_API_KEY", "")
    if not apollo_key:
        print("  WARNING: APOLLO_API_KEY not found in .env — skipping enrichment")
        return engagers

    apollo = ApolloClient(apollo_key)
    competitor_names = [n.lower().strip() for n in config.get("competitor_company_names", [])]

    # Extract unique company names
    company_names = set()
    for data in engagers.values():
        headline = data.get("headline", "") or ""
        _, company = parse_headline(headline)
        if company:
            company_names.add(company)

    # Filter out junk and competitor companies
    filtered = []
    skipped = 0
    for name in company_names:
        name_lower = name.lower().strip()
        if not name_lower or len(name_lower) < 2:
            skipped += 1
            continue
        if any(comp in name_lower or name_lower in comp for comp in competitor_names):
            skipped += 1
            continue
        filtered.append(name)

    print(f"  Unique companies: {len(company_names)}")
    print(f"  After filtering: {len(filtered)} (skipped {skipped})")

    # Phase 1: Resolve domains from company names via Apollo search
    print(f"\n  Phase 1: Resolving domains for {len(filtered)} companies...")
    domain_map = {}  # company_name -> domain
    domain_resolved = 0
    domain_failed = 0

    for i, company_name in enumerate(filtered, 1):
        if i % 20 == 0 or i == len(filtered):
            print(f"    Searching... {i}/{len(filtered)} ({domain_resolved} domains found)")

        try:
            domain = apollo._resolve_domain_from_name(company_name)
            if domain:
                domain_map[company_name] = domain
                domain_resolved += 1
            else:
                domain_failed += 1
        except Exception as e:
            print(f"    Error searching '{company_name}': {e}")
            domain_failed += 1

        # Light rate limiting for search calls
        time.sleep(0.2)

    print(f"  Domain resolution: {domain_resolved} found, {domain_failed} not found")

    # Phase 2: Enrich companies that have domains
    companies_to_enrich = {name: domain for name, domain in domain_map.items() if domain}
    print(f"\n  Phase 2: Enriching {len(companies_to_enrich)} companies by domain...")
    print(f"  Est. Apollo credits: {len(companies_to_enrich)}")

    cache = {}  # company_name -> {industry, size, description, location}
    found = 0
    not_found = 0

    for i, (company_name, domain) in enumerate(companies_to_enrich.items(), 1):
        if i % 10 == 0 or i == len(companies_to_enrich):
            print(f"    Enriching... {i}/{len(companies_to_enrich)}")

        try:
            resp = apollo.enrich_organization(domain=domain)
            org = (resp or {}).get("organization")
            if org:
                cache[company_name] = {
                    "industry": org.get("industry") or "",
                    "size": org.get("estimated_num_employees") or "",
                    "description": (org.get("short_description") or "")[:200],
                    "location": ", ".join(filter(None, [
                        org.get("city"),
                        org.get("state"),
                        org.get("country"),
                    ])),
                }
                found += 1
            else:
                not_found += 1
        except Exception as e:
            print(f"    Error enriching '{company_name}' (domain: {domain}): {e}")
            not_found += 1

        # Light rate limiting
        time.sleep(0.3)

    print(f"\n  Enrichment results: {found} found, {not_found} not found")

    # Merge back into engagers
    enriched_count = 0
    for data in engagers.values():
        headline = data.get("headline", "") or ""
        _, company = parse_headline(headline)
        if company and company in cache:
            info = cache[company]
            data["company_industry"] = info["industry"]
            data["company_size"] = info["size"]
            data["company_description"] = info["description"]
            data["company_location"] = info["location"]
            enriched_count += 1

    print(f"  Engagers enriched with company data: {enriched_count}/{len(engagers)}")

    return engagers


# ── Pre-Filter Engagers ─────────────────────────────────────────────────────

def pre_filter_engagers(all_engagers, config, max_profiles):
    """Score engagers by position for ICP prioritization."""
    print(f"\n{'='*60}")
    print(f"Pre-Filter Engagers ({len(all_engagers)} total)")
    print(f"{'='*60}")

    icp_keywords = [k.lower() for k in config.get("icp_keywords", [])]
    exclude_keywords = [k.lower() for k in config.get("exclude_keywords", [])]

    scored = []

    for name, data in all_engagers.items():
        position = (data.get("headline", "") or "").lower()
        score = 0

        # Commenter bonus
        if data["engagement_type"] == "Comment":
            score += 3

        # ICP keyword match
        if any(kw in position for kw in icp_keywords):
            score += 2

        # Exclude penalty
        if any(kw in position for kw in exclude_keywords):
            score -= 5

        data["pre_filter_score"] = score
        scored.append(data)

    # Sort by score descending
    scored.sort(key=lambda x: x["pre_filter_score"], reverse=True)

    # Cap at max_profiles
    if len(scored) > max_profiles:
        print(f"  Capping: {len(scored)} -> {max_profiles}")
        scored = scored[:max_profiles]

    # Score distribution
    score_dist = {}
    for s in scored:
        sc = s["pre_filter_score"]
        score_dist[sc] = score_dist.get(sc, 0) + 1

    print(f"  Total engagers: {len(scored)}")
    print(f"  Score distribution:")
    for sc in sorted(score_dist.keys(), reverse=True):
        print(f"    Score {sc}: {score_dist[sc]}")

    return {d["name"]: d for d in scored}


# ── Step 4: ICP Classify & Export ───────────────────────────────────────────

def export_csv(engagers, config):
    """Classify ICP and write CSV."""
    print(f"\n{'='*60}")
    print(f"Step 4: ICP Classification & CSV Export")
    print(f"{'='*60}")

    rows = []
    icp_counts = {}

    for data in engagers.values():
        headline = data.get("headline", "")
        role, company = parse_headline(headline)
        company_industry = data.get("company_industry", "")
        icp_tier = classify_icp(headline, company, config, company_industry=company_industry)
        icp_counts[icp_tier] = icp_counts.get(icp_tier, 0) + 1

        rows.append({
            "Name": data["name"],
            "LinkedIn URL": data.get("profile_url", ""),
            "Role": role,
            "Company": company,
            "Company Industry": company_industry,
            "Company Size": data.get("company_size", ""),
            "Company Description": data.get("company_description", ""),
            "Company Location": data.get("company_location", ""),
            "Source Page": data.get("source_page", ""),
            "Post URL": data.get("post_url", ""),
            "Post Preview": data.get("post_preview", ""),
            "Engagement Type": data.get("engagement_type", "Reaction"),
            "Comment Text": data.get("comment_text", ""),
            "ICP Tier": icp_tier,
            "Pre-Filter Score": data.get("pre_filter_score", 0),
        })

    # Sort: Likely ICP first, then by pre-filter score
    sort_order = {"Likely ICP": 0, "Possible ICP": 1,
                  "Unknown - Review": 2, "Tech Vendor - Skip": 3}
    rows.sort(key=lambda r: (sort_order.get(r["ICP Tier"], 9), -r["Pre-Filter Score"]))

    # Write CSV
    run_name = config["name"]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")

    out_dir = config.get("output_dir", "output")
    if not os.path.isabs(out_dir):
        # Resolve relative to config file location
        config_dir = config.get("_config_dir", os.getcwd())
        out_dir = os.path.join(config_dir, out_dir)
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, f"{run_name}-engagers-{timestamp}.csv")

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n  ICP Breakdown:")
    for tier in ["Likely ICP", "Possible ICP", "Unknown - Review", "Tech Vendor - Skip"]:
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
        description="Competitor Post Engagers Pipeline - Find Leads from Competitor Audiences"
    )
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--test", action="store_true", help="Small limits (20 posts, 50 profiles)")
    parser.add_argument("--yes", "-y", action="store_true", help="Skip cost confirmation prompts")
    parser.add_argument("--max-runs", type=int, default=None, help="Max Apify actor runs")
    parser.add_argument("--top-n", type=int, default=None, help="Override top_n_posts from config")
    parser.add_argument("--skip-company-enrich", action="store_true", help="Skip Apollo company enrichment step")
    args = parser.parse_args()

    config = load_config(args.config)

    # Apply test caps
    if args.test:
        for key, val in TEST_CAPS.items():
            config[key] = val

    # CLI overrides
    if args.top_n:
        config["top_n_posts"] = args.top_n
    if args.skip_company_enrich:
        config["enrich_companies"] = False

    run_limit = args.max_runs or config.get("max_apify_runs", 50)
    set_limit(run_limit)
    set_auto_confirm(args.yes)

    company_urls = config["company_urls"]
    if not company_urls:
        print("ERROR: No company URLs provided in config.")
        sys.exit(1)

    env = load_env()
    token = GOOSEWORKS_API_KEY or env.get("APIFY_API_TOKEN", "")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)

    run_name = config["name"]

    print(f"\n{'='*60}")
    print(f"Competitor Post Engagers Pipeline")
    print(f"{'='*60}")
    print(f"  Name: {run_name}")
    print(f"  Config: {args.config}")
    print(f"  Mode: {'TEST (limited)' if args.test else 'STANDARD'}")
    print(f"  Companies: {len(company_urls)}")
    for url in company_urls:
        print(f"    - {url}")
    print(f"  Days back: {config['days_back']}")
    print(f"  Max posts per company: {config['max_posts']}")
    print(f"  Top N posts per company: {config['top_n_posts']}")
    print(f"  ICP keywords: {config['icp_keywords']}")
    print(f"  Exclude keywords: {config['exclude_keywords']}")
    print(f"  Company enrichment: {'ON' if config['enrich_companies'] else 'OFF (skipped)'}")
    if config['enrich_companies']:
        print(f"  Industry keywords: {config['industry_keywords']}")
    print(f"  Apify run limit: {run_limit}")

    # Track partial results for graceful save on limit
    engagers = {}

    try:
        # Step 1: Scrape company posts + engagers
        confirm_cost(
            "Step 1: Scrape Company Posts + Engagers",
            num_runs=len(company_urls),
            est_cost=len(company_urls) * config["max_posts"] * 0.002,
        )
        company_data = scrape_company_posts(company_urls, token, config)

        # Step 2: Rank & select top posts
        selected = rank_and_select_posts(company_data, config)

        total_selected = sum(len(v) for v in selected.values())
        if total_selected == 0:
            print("\nNo posts found in the time window. Try increasing days_back.")
            sys.exit(1)

        # Step 2b: Extract engagers from selected posts
        engagers = extract_engagers(company_data, selected, config)

        if not engagers:
            print("\nNo engagers found. Check if posts have reactions/comments enabled.")
            sys.exit(1)

        debug_save(
            {name: {**d} for name, d in engagers.items()},
            f"competitor-engagers-raw-{run_name}.json"
        )

        # Pre-filter (score and sort, no cap)
        engagers = pre_filter_engagers(engagers, config, len(engagers))

        if not engagers:
            print("\nAll engagers filtered out. Broaden ICP keywords.")
            sys.exit(1)

        # Step 3: Company enrichment (Apollo)
        if config["enrich_companies"]:
            engagers = enrich_companies(engagers, config, env)

        # Step 4: ICP classify and export
        csv_path, rows = export_csv(engagers, config)

    except ApifyLimitReached as e:
        print(f"\n  WARNING: {e}")
        result = _save_partial_csv(engagers, config, "limit-reached")
        if result:
            csv_path, rows = result
            print(f"\n  Partial output: {csv_path}")
        return

    # Summary
    print(f"\n{'='*60}")
    print(f"Summary")
    print(f"{'='*60}")
    print(f"  Name: {run_name}")
    print(f"  Companies scraped: {len(company_urls)}")
    total_posts = sum(len(d["posts"]) for d in company_data.values())
    print(f"  Total posts scraped: {total_posts}")
    print(f"  Posts selected: {total_selected}")
    print(f"  Total engagers extracted: {len(engagers)}")
    print(f"  Final leads: {len(rows)}")
    print(f"  Apify runs used: {get_run_count()}/{get_run_limit()}")

    # Per-company breakdown
    company_counts = {}
    for r in rows:
        src = r["Source Page"]
        company_counts[src] = company_counts.get(src, 0) + 1

    if company_counts:
        print(f"\n  Per-company lead breakdown:")
        for co, count in sorted(company_counts.items(), key=lambda x: -x[1]):
            print(f"    {co}: {count}")

    # Top leads
    likely = [r for r in rows if r["ICP Tier"] == "Likely ICP"]
    if likely:
        print(f"\n  Top 10 Likely ICP leads:")
        print(f"  {'Name':<28} {'Role':<30} {'Company':<20} {'Source':<15}")
        print(f"  {'-'*93}")
        for r in likely[:10]:
            print(f"  {r['Name'][:27]:<28} {r['Role'][:29]:<30} {r['Company'][:19]:<20} {r['Source Page'][:14]:<15}")

    print(f"\n  Output: {csv_path}")
    return csv_path


if __name__ == "__main__":
    main()
