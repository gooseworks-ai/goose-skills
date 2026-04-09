#!/usr/bin/env python3
"""Competitor Signals — Competitor Launch & Product Activity Lead Extraction.

Monitors competitor activity across Product Hunt, Hacker News, tech press,
and competitor websites to find people engaging with competitor products.

Sources:
  - Product Hunt (API or Apify) — launch commenters, upvoters
  - Hacker News (Algolia API) — competitor front page posts + commenters
  - Competitor case studies / testimonials (agent-scraped, manual signals)
  - Tech press (agent-scraped, manual signals)

Usage:
    python tools/competitor_signals.py \
        --config .tmp/competitor_signals_config.json \
        --output .tmp/competitor_signals.csv
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    import requests as req
except ImportError:
    print("[error] requests is required. Install with: pip install requests", file=sys.stderr)
    sys.exit(1)

import csv


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).parent.parent
TMP_DIR = PROJECT_ROOT / ".tmp"

HN_ALGOLIA_BASE = "https://hn.algolia.com/api/v1"
PH_API_BASE = "https://api.producthunt.com/v2/api/graphql"
GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    APIFY_BASE = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    APIFY_BASE = "https://api.apify.com/v2"
APIFY_PH_ACTOR = "maximedupre~product-hunt-scraper"

APIFY_POLL_INTERVAL = 10
APIFY_MAX_WAIT = 300

# Signal types
SIGNAL_TYPES = {
    "ph_commenter": {"label": "PH Launch Commenter", "weight": 8},
    "ph_upvoter": {"label": "PH Launch Upvoter", "weight": 6},
    "ph_maker": {"label": "PH Product Maker", "weight": 5},
    "hn_commenter": {"label": "HN Post Commenter", "weight": 7},
    "hn_poster": {"label": "HN Post Author", "weight": 6},
    "switching_signal": {"label": "Switching From/To Competitor", "weight": 9},
    "case_study_company": {"label": "Competitor Case Study", "weight": 9},
    "testimonial_author": {"label": "Competitor Testimonial", "weight": 8},
    "press_mention": {"label": "Tech Press Mention", "weight": 6},
    "changelog_engager": {"label": "Changelog Engager", "weight": 5},
}


def load_env_key(key_name):
    if load_dotenv:
        for env_path in [
            PROJECT_ROOT / ".env",
            PROJECT_ROOT.parent / ".env",
        ]:
            if env_path.exists():
                load_dotenv(env_path)
                break
    if key_name == "APIFY_API_TOKEN":
        return GOOSEWORKS_API_KEY or os.environ.get(key_name, "")
    return os.environ.get(key_name, "")


def ensure_tmp():
    TMP_DIR.mkdir(exist_ok=True)


def clean_html(text):
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-z]+;", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# ---------------------------------------------------------------------------
# Source: Product Hunt (GraphQL API)
# ---------------------------------------------------------------------------

def ph_api_fetch_launch(slug, ph_token):
    """Fetch a PH launch's comments and votes via GraphQL API."""
    signals = []

    # Fetch comments
    comments_query = """
    query ($slug: String!, $after: String) {
        post(slug: $slug) {
            id
            name
            tagline
            votesCount
            commentsCount
            url
            createdAt
            comments(first: 50, after: $after, order: NEWEST) {
                edges {
                    node {
                        id
                        body
                        createdAt
                        url
                        votesCount
                        user {
                            username
                            name
                            headline
                            url
                            profileImage
                        }
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
    }
    """

    headers = {
        "Authorization": f"Bearer {ph_token}",
        "Content-Type": "application/json",
    }

    # Paginate through comments
    cursor = None
    post_name = ""
    post_url = ""
    comment_count = 0

    for page in range(10):  # Max 10 pages = 500 comments
        variables = {"slug": slug}
        if cursor:
            variables["after"] = cursor

        try:
            resp = req.post(
                PH_API_BASE,
                json={"query": comments_query, "variables": variables},
                headers=headers,
                timeout=30,
            )
            if resp.status_code == 401:
                print(f"[ph-api] Auth failed — token may be invalid", file=sys.stderr)
                return [], False
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"[ph-api-error] {slug}: {e}", file=sys.stderr)
            return [], False

        post = data.get("data", {}).get("post")
        if not post:
            print(f"[ph-api] Post '{slug}' not found", file=sys.stderr)
            return [], False

        if not post_name:
            post_name = post.get("name", "")
            post_url = post.get("url", "")

        comments = post.get("comments", {}).get("edges", [])
        for edge in comments:
            node = edge.get("node", {})
            user = node.get("user", {})
            username = user.get("username", "")
            name = user.get("name", "")

            # Check if names are redacted
            if not username and not name:
                continue

            body = clean_html(node.get("body", ""))

            # Detect switching signals
            signal_type = "ph_commenter"
            body_lower = body.lower()
            if any(phrase in body_lower for phrase in [
                "switching from", "moved from", "migrated from",
                "switching to", "moved to", "replaced",
                "looking for alternative", "better alternative",
            ]):
                signal_type = "switching_signal"

            signals.append({
                "person_name": name or username,
                "username": username,
                "company": user.get("headline", ""),
                "signal_type": signal_type,
                "signal_label": SIGNAL_TYPES.get(signal_type, {}).get("label", signal_type),
                "competitor": post_name,
                "context": body[:300],
                "url": node.get("url", ""),
                "profile_url": user.get("url", ""),
                "date": (node.get("createdAt") or "")[:10],
                "source": "Product Hunt API",
                "engagement": node.get("votesCount", 0),
            })
            comment_count += 1

        page_info = post.get("comments", {}).get("pageInfo", {})
        if not page_info.get("hasNextPage"):
            break
        cursor = page_info.get("endCursor")
        time.sleep(0.5)

    # Fetch votes (upvoters)
    votes_query = """
    query ($slug: String!, $after: String) {
        post(slug: $slug) {
            votes(first: 50, after: $after) {
                edges {
                    node {
                        createdAt
                        user {
                            username
                            name
                            headline
                            url
                        }
                    }
                }
                pageInfo {
                    hasNextPage
                    endCursor
                }
            }
        }
    }
    """

    cursor = None
    vote_count = 0
    names_available = True

    for page in range(5):  # Max 5 pages = 250 upvoters
        variables = {"slug": slug}
        if cursor:
            variables["after"] = cursor

        try:
            resp = req.post(
                PH_API_BASE,
                json={"query": votes_query, "variables": variables},
                headers=headers,
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"[ph-api-error] votes for {slug}: {e}", file=sys.stderr)
            break

        post = data.get("data", {}).get("post")
        if not post:
            break

        votes = post.get("votes", {}).get("edges", [])
        for edge in votes:
            node = edge.get("node", {})
            user = node.get("user", {})
            username = user.get("username", "")
            name = user.get("name", "")

            if not username and not name:
                names_available = False
                continue

            signals.append({
                "person_name": name or username,
                "username": username,
                "company": user.get("headline", ""),
                "signal_type": "ph_upvoter",
                "signal_label": SIGNAL_TYPES["ph_upvoter"]["label"],
                "competitor": post_name,
                "context": f"Upvoted {post_name} on Product Hunt",
                "url": post_url,
                "profile_url": user.get("url", ""),
                "date": (node.get("createdAt") or "")[:10],
                "source": "Product Hunt API",
                "engagement": 0,
            })
            vote_count += 1

        page_info = post.get("votes", {}).get("pageInfo", {})
        if not page_info.get("hasNextPage"):
            break
        cursor = page_info.get("endCursor")
        time.sleep(0.5)

    print(f"[ph-api] {slug}: {comment_count} comments, {vote_count} voters extracted", file=sys.stderr)
    if not names_available:
        print(f"[ph-api] WARNING: Voter names appear redacted for {slug}", file=sys.stderr)

    return signals, names_available


def ph_apify_fetch_launch(slugs_or_urls, apify_key):
    """Fetch PH launch data via Apify scraper (fallback if API names are redacted)."""
    if not apify_key:
        print("[ph-apify] Skipping — no Apify API token", file=sys.stderr)
        return []

    signals = []

    # Build start URLs
    start_urls = []
    for item in slugs_or_urls:
        if item.startswith("http"):
            start_urls.append({"url": item})
        else:
            start_urls.append({"url": f"https://www.producthunt.com/posts/{item}"})

    actor_input = {
        "startUrls": start_urls,
        "getDetails": True,
        "maxCommentPages": 5,
    }

    print(f"[ph-apify] Starting Apify actor for {len(start_urls)} products...", file=sys.stderr)

    try:
        resp = req.post(
            f"{APIFY_BASE}/acts/{APIFY_PH_ACTOR}/runs",
            params={"token": apify_key},
            json=actor_input,
            timeout=30,
        )
        resp.raise_for_status()
        run_id = resp.json().get("data", {}).get("id")
    except Exception as e:
        print(f"[ph-apify-error] Failed to start: {e}", file=sys.stderr)
        return []

    # Poll
    elapsed = 0
    status_data = {}
    while elapsed < APIFY_MAX_WAIT:
        time.sleep(APIFY_POLL_INTERVAL)
        elapsed += APIFY_POLL_INTERVAL
        try:
            sr = req.get(f"{APIFY_BASE}/actor-runs/{run_id}", params={"token": apify_key}, timeout=15)
            status_data = sr.json().get("data", {})
            if status_data.get("status") == "SUCCEEDED":
                break
            elif status_data.get("status") in ("FAILED", "ABORTED", "TIMED-OUT"):
                print(f"[ph-apify-error] Run {status_data.get('status')}", file=sys.stderr)
                return []
            if elapsed % 30 == 0:
                print(f"[ph-apify] Waiting... ({elapsed}s)", file=sys.stderr)
        except Exception:
            pass

    if not status_data.get("defaultDatasetId"):
        return []

    try:
        dataset_id = status_data["defaultDatasetId"]
        dr = req.get(f"{APIFY_BASE}/datasets/{dataset_id}/items", params={"token": apify_key, "format": "json"}, timeout=60)
        results = dr.json()
    except Exception as e:
        print(f"[ph-apify-error] Fetch failed: {e}", file=sys.stderr)
        return []

    for item in results:
        product_name = item.get("name", "")

        # Process comments
        for comment in item.get("comments", []):
            user = comment.get("user", {}) if isinstance(comment.get("user"), dict) else {}
            username = user.get("username", comment.get("username", ""))
            name = user.get("name", comment.get("name", ""))
            body = clean_html(comment.get("body", ""))

            if not username and not name:
                continue

            signal_type = "ph_commenter"
            body_lower = body.lower()
            if any(p in body_lower for p in ["switching", "moved from", "migrated", "alternative", "replaced"]):
                signal_type = "switching_signal"

            signals.append({
                "person_name": name or username,
                "username": username,
                "company": user.get("headline", ""),
                "signal_type": signal_type,
                "signal_label": SIGNAL_TYPES.get(signal_type, {}).get("label", signal_type),
                "competitor": product_name,
                "context": body[:300],
                "url": comment.get("url", ""),
                "profile_url": user.get("url", ""),
                "date": (comment.get("createdAt") or "")[:10],
                "source": "Product Hunt (Apify)",
                "engagement": comment.get("votesCount", 0),
            })

        # Process makers
        for maker in item.get("makers", []):
            if isinstance(maker, dict):
                signals.append({
                    "person_name": maker.get("name", maker.get("username", "")),
                    "username": maker.get("username", ""),
                    "company": maker.get("headline", ""),
                    "signal_type": "ph_maker",
                    "signal_label": SIGNAL_TYPES["ph_maker"]["label"],
                    "competitor": product_name,
                    "context": f"Maker of {product_name}",
                    "url": item.get("url", ""),
                    "profile_url": maker.get("url", ""),
                    "date": (item.get("createdAt") or "")[:10],
                    "source": "Product Hunt (Apify)",
                    "engagement": 0,
                })

    print(f"[ph-apify] Total: {len(signals)} signals", file=sys.stderr)
    return signals


# ---------------------------------------------------------------------------
# Source: Hacker News (Competitor Posts)
# ---------------------------------------------------------------------------

def fetch_hn_competitor_signals(competitors, days=90):
    """Search HN for competitor-related posts and extract commenters."""
    signals = []
    cutoff = int((datetime.now(timezone.utc) - timedelta(days=days)).timestamp())
    seen_ids = set()

    for competitor in competitors:
        print(f"[hn] Searching for '{competitor}'...", file=sys.stderr)

        # Search stories mentioning competitor
        try:
            resp = req.get(
                f"{HN_ALGOLIA_BASE}/search_by_date",
                params={
                    "query": f'"{competitor}"',
                    "tags": "story",
                    "hitsPerPage": 50,
                    "numericFilters": f"created_at_i>{cutoff}",
                },
                timeout=30,
            )
            stories = resp.json().get("hits", [])
        except Exception as e:
            print(f"[hn-error] {competitor}: {e}", file=sys.stderr)
            continue

        # For each story, get the poster
        for story in stories:
            story_id = story.get("objectID", "")
            if story_id in seen_ids:
                continue
            seen_ids.add(story_id)

            author = story.get("author", "")
            if author and author != "[deleted]":
                signals.append({
                    "person_name": author,
                    "username": author,
                    "company": "",
                    "signal_type": "hn_poster",
                    "signal_label": SIGNAL_TYPES["hn_poster"]["label"],
                    "competitor": competitor,
                    "context": story.get("title", "")[:300],
                    "url": f"https://news.ycombinator.com/item?id={story_id}",
                    "profile_url": f"https://news.ycombinator.com/user?id={author}",
                    "date": (story.get("created_at") or "")[:10],
                    "source": "Hacker News",
                    "engagement": story.get("points", 0) or 0,
                })

        # Search comments mentioning competitor
        try:
            resp = req.get(
                f"{HN_ALGOLIA_BASE}/search_by_date",
                params={
                    "query": f'"{competitor}"',
                    "tags": "comment",
                    "hitsPerPage": 200,
                    "numericFilters": f"created_at_i>{cutoff}",
                },
                timeout=30,
            )
            comments = resp.json().get("hits", [])
        except Exception as e:
            print(f"[hn-error] comments for {competitor}: {e}", file=sys.stderr)
            continue

        for comment in comments:
            cid = comment.get("objectID", "")
            if cid in seen_ids:
                continue
            seen_ids.add(cid)

            author = comment.get("author", "")
            if not author or author == "[deleted]":
                continue

            text = clean_html(comment.get("comment_text", ""))

            # Detect switching signals
            signal_type = "hn_commenter"
            text_lower = text.lower()
            if any(p in text_lower for p in [
                "switched from", "moved from", "migrated from",
                "switched to", "moved to", "replacing",
                "looking for alternative", "dropped",
            ]):
                signal_type = "switching_signal"

            signals.append({
                "person_name": author,
                "username": author,
                "company": "",
                "signal_type": signal_type,
                "signal_label": SIGNAL_TYPES.get(signal_type, {}).get("label", signal_type),
                "competitor": competitor,
                "context": text[:300],
                "url": f"https://news.ycombinator.com/item?id={cid}",
                "profile_url": f"https://news.ycombinator.com/user?id={author}",
                "date": (comment.get("created_at") or "")[:10],
                "source": "Hacker News",
                "engagement": 0,
            })

        print(f"[hn] '{competitor}': {len(stories)} stories, {len(comments)} comments", file=sys.stderr)
        time.sleep(0.2)

    print(f"[hn] Total: {len(signals)} competitor signals", file=sys.stderr)
    return signals


# ---------------------------------------------------------------------------
# Manual Signals (agent-scraped)
# ---------------------------------------------------------------------------

def load_manual_signals(manual_file):
    """Load agent-scraped signals (case studies, testimonials, press, changelogs)."""
    if not manual_file or not Path(manual_file).exists():
        return []
    try:
        with open(manual_file) as f:
            data = json.load(f)
        print(f"[manual] Loaded {len(data)} manual signals", file=sys.stderr)
        return data
    except Exception as e:
        print(f"[manual-error] {e}", file=sys.stderr)
        return []


# ---------------------------------------------------------------------------
# CSV Output
# ---------------------------------------------------------------------------

def build_csv(signals, output_path):
    """Build single CSV file."""
    headers = [
        "person_name", "company", "signal_type", "signal_label",
        "competitor", "context", "url", "profile_url",
        "date", "signal_score", "source", "engagement",
    ]

    # Add scores
    for s in signals:
        s["signal_score"] = SIGNAL_TYPES.get(s.get("signal_type", ""), {}).get("weight", 5)

    # Sort: switching signals first, then by score, then date
    signals.sort(key=lambda s: (
        1 if s.get("signal_type") == "switching_signal" else 0,
        s.get("signal_score", 0),
        s.get("date", ""),
    ), reverse=True)

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for signal in signals:
            writer.writerow([signal.get(h, "") for h in headers])

    print(f"\n[output] Saved {len(signals)} signals to {output_path}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(config_path, output=None):
    output = output or str(TMP_DIR / "competitor_signals.csv")
    ensure_tmp()

    with open(config_path) as f:
        config = json.load(f)

    competitors = config.get("competitors", [])
    ph_slugs = config.get("product_hunt_slugs", [])
    days = config.get("days", 90)
    manual_file = config.get("manual_signals_file", "")
    skip = set(config.get("skip", []))

    print(f"[start] Competitors: {', '.join(competitors)}", file=sys.stderr)
    print(f"[start] PH slugs: {', '.join(ph_slugs)}", file=sys.stderr)
    print(f"[start] Lookback: {days} days", file=sys.stderr)

    all_signals = []

    # --- Product Hunt ---
    if "producthunt" not in skip and ph_slugs:
        print(f"\n{'='*60}", file=sys.stderr)
        print("[ph] Fetching Product Hunt launches...", file=sys.stderr)

        ph_token = load_env_key("PRODUCTHUNT_TOKEN")
        apify_key = load_env_key("APIFY_API_TOKEN")

        if ph_token:
            # Try API first
            api_works = True
            for slug in ph_slugs:
                ph_signals, names_ok = ph_api_fetch_launch(slug, ph_token)
                if ph_signals:
                    all_signals.extend(ph_signals)
                if not names_ok:
                    api_works = False
                    print(f"[ph] API names redacted — falling back to Apify", file=sys.stderr)
                    break

            if not api_works and apify_key:
                apify_signals = ph_apify_fetch_launch(ph_slugs, apify_key)
                all_signals.extend(apify_signals)
        elif apify_key:
            apify_signals = ph_apify_fetch_launch(ph_slugs, apify_key)
            all_signals.extend(apify_signals)
        else:
            print("[ph] Skipping — no PH token or Apify key", file=sys.stderr)

    # --- Hacker News ---
    if "hn" not in skip and competitors:
        print(f"\n{'='*60}", file=sys.stderr)
        print("[hn] Fetching HN competitor signals...", file=sys.stderr)
        all_signals.extend(fetch_hn_competitor_signals(competitors, days=days))

    # --- Manual signals ---
    if manual_file:
        all_signals.extend(load_manual_signals(manual_file))

    if not all_signals:
        print("\n[warning] No signals found", file=sys.stderr)
        return

    # --- Deduplicate ---
    seen = set()
    deduped = []
    for s in all_signals:
        key = f"{s.get('person_name', '').lower()}|{s.get('competitor', '').lower()}|{s.get('signal_type', '')}"
        if key not in seen:
            seen.add(key)
            deduped.append(s)

    if len(deduped) < len(all_signals):
        print(f"[dedup] {len(all_signals)} → {len(deduped)}", file=sys.stderr)
    all_signals = deduped

    # --- Build CSV ---
    build_csv(all_signals, output)

    # --- Summary ---
    type_counts = {}
    source_counts = {}
    competitor_counts = {}
    switching_count = 0

    for s in all_signals:
        type_counts[s.get("signal_label", "")] = type_counts.get(s.get("signal_label", ""), 0) + 1
        source_counts[s.get("source", "")] = source_counts.get(s.get("source", ""), 0) + 1
        competitor_counts[s.get("competitor", "")] = competitor_counts.get(s.get("competitor", ""), 0) + 1
        if s.get("signal_type") == "switching_signal":
            switching_count += 1

    print(f"\n{'='*60}", file=sys.stderr)
    print(f"[summary] Total signals: {len(all_signals)}", file=sys.stderr)
    print(f"  Switching signals: {switching_count} (HIGHEST PRIORITY)", file=sys.stderr)
    print(f"\n  By type:", file=sys.stderr)
    for t, c in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    {t}: {c}", file=sys.stderr)
    print(f"\n  By source:", file=sys.stderr)
    for s, c in sorted(source_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    {s}: {c}", file=sys.stderr)
    print(f"\n  By competitor:", file=sys.stderr)
    for comp, c in sorted(competitor_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"    {comp}: {c}", file=sys.stderr)
    print(f"{'='*60}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Competitor Signals — Launch & Activity Lead Extraction")
    parser.add_argument("--config", required=True, help="Path to config JSON file")
    parser.add_argument("--output", default=None, help="Output .csv path")
    args = parser.parse_args()
    run(config_path=args.config, output=args.output)


if __name__ == "__main__":
    main()
