#!/usr/bin/env python3
"""
LinkedIn Commenter Extractor — Extract commenters from LinkedIn posts via Apify.

Usage:
    python3 extract_commenters.py --post-url "https://linkedin.com/posts/..."
    python3 extract_commenters.py --post-url URL1 --post-url URL2 --dedup
    python3 extract_commenters.py --post-url URL --output csv
    python3 extract_commenters.py --post-url URL --max-comments 50
"""

import argparse
import csv
import json
import os
import re
import sys
import time

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests", file=sys.stderr)
    sys.exit(1)

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    APIFY_BASE = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    APIFY_BASE = "https://api.apify.com/v2"

ACTOR_ID = "harvestapi~linkedin-post-comments"

HEADERS = {
    "Content-Type": "application/json",
}


# ---------------------------------------------------------------------------
# Apify Integration
# ---------------------------------------------------------------------------

def get_apify_token(token_arg=None):
    """Get API token from arg, GOOSEWORKS_API_KEY, or APIFY_API_TOKEN env var."""
    token = token_arg or GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def extract_comments_from_post(post_url, token, max_comments=100, timeout=120):
    """Run Apify actor to extract comments from a LinkedIn post."""
    actor_input = {
        "posts": [post_url],
        "maxItems": max_comments,
    }

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
        time.sleep(3)

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
            params={"token": token, "format": "json", "limit": max_comments},
            timeout=30,
        )
        dataset_resp.raise_for_status()
        items = dataset_resp.json()
    except Exception as e:
        print(f"  ERROR: Failed to fetch dataset: {e}", file=sys.stderr)
        return []

    return items


# ---------------------------------------------------------------------------
# Parse Commenter Data
# ---------------------------------------------------------------------------

def parse_headline(headline):
    """Parse a LinkedIn headline into title and company.

    Common formats:
    - "VP of Finance at Acme Corp"
    - "VP of Finance | Acme Corp"
    - "VP of Finance, Acme Corp"
    - "Acme Corp"  (just company)
    """
    if not headline:
        return "", ""

    # Try "at" separator
    match = re.match(r"^(.+?)\s+at\s+(.+)$", headline, re.IGNORECASE)
    if match:
        return match.group(1).strip(), match.group(2).strip()

    # Try "|" separator
    if "|" in headline:
        parts = headline.split("|", 1)
        return parts[0].strip(), parts[1].strip()

    # Try " - " separator (but not single dash in titles like "Co-Founder")
    if " - " in headline:
        parts = headline.split(" - ", 1)
        return parts[0].strip(), parts[1].strip()

    # Try comma separator (only if first part looks like a title)
    if "," in headline:
        parts = headline.split(",", 1)
        first = parts[0].strip()
        # Check if first part looks like a job title
        title_keywords = ["ceo", "cfo", "cto", "coo", "vp", "director", "manager",
                          "partner", "founder", "head", "chief", "president",
                          "controller", "accountant", "analyst", "consultant",
                          "senior", "lead", "principal", "associate", "staff"]
        if any(kw in first.lower() for kw in title_keywords):
            return first, parts[1].strip()

    # Can't split — return whole thing as title
    return headline, ""


def normalize_commenters(raw_items, post_url):
    """Normalize Apify response into clean commenter records."""
    commenters = []

    for item in raw_items:
        # harvestapi format: actor object with name, position, linkedinUrl
        actor = item.get("actor", {})
        if not actor:
            # Try flat format
            actor = item

        name = actor.get("name", "")
        if not name:
            continue

        headline = actor.get("position", "") or actor.get("headline", "")
        linkedin_url = actor.get("linkedinUrl", "") or actor.get("linkedin_url", "") or actor.get("commenter_url", "")
        comment_text = item.get("commentary", "") or item.get("comment_text", "") or item.get("text", "")
        profile_image = actor.get("pictureUrl", "") or actor.get("picture_url", "")

        title, company = parse_headline(headline)

        commenters.append({
            "name": name,
            "headline": headline,
            "title": title,
            "company": company,
            "linkedin_url": linkedin_url,
            "comment_text": comment_text[:500],
            "post_url": post_url,
            "profile_image_url": profile_image,
        })

    return commenters


def dedup_commenters(commenters):
    """Deduplicate commenters by LinkedIn URL."""
    seen_urls = set()
    unique = []
    for c in commenters:
        key = c.get("linkedin_url", "").rstrip("/").lower()
        if not key:
            unique.append(c)
            continue
        if key not in seen_urls:
            seen_urls.add(key)
            unique.append(c)
    return unique


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

CSV_FIELDS = ["name", "headline", "title", "company", "linkedin_url",
              "comment_text", "post_url"]


def output_json(commenters):
    print(json.dumps(commenters, indent=2, ensure_ascii=False))


def output_csv(commenters):
    writer = csv.DictWriter(sys.stdout, fieldnames=CSV_FIELDS, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(commenters)


def output_summary(commenters):
    print(f"\nLinkedIn Commenter Extraction Results")
    print("=" * 50)
    print(f"Total commenters: {len(commenters)}")

    if not commenters:
        print("\nNo commenters found.")
        return

    # Count unique companies
    companies = set(c["company"] for c in commenters if c["company"])
    print(f"Unique companies: {len(companies)}")

    posts = set(c["post_url"] for c in commenters)
    print(f"Posts processed: {len(posts)}")

    print(f"\n{'#':<4} {'Name':<22} {'Title':<22} {'Company':<18} {'LinkedIn'}")
    print("-" * 90)
    for i, c in enumerate(commenters, 1):
        name = (c.get("name") or "")[:20]
        title = (c.get("title") or "")[:20]
        company = (c.get("company") or "")[:16]
        has_linkedin = "Yes" if c.get("linkedin_url") else ""
        print(f"{i:<4} {name:<22} {title:<22} {company:<18} {has_linkedin}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Extract commenters from LinkedIn posts via Apify."
    )
    parser.add_argument("--post-url", action="append", required=True,
                        help="LinkedIn post URL (can repeat for multiple posts)")
    parser.add_argument("--max-comments", type=int, default=100,
                        help="Max comments per post (default: 100)")
    parser.add_argument("--output", choices=["json", "csv", "summary"],
                        default="json", help="Output format (default: json)")
    parser.add_argument("--dedup", action="store_true",
                        help="Deduplicate commenters across posts")
    parser.add_argument("--token", help="Apify API token (overrides env var)")
    parser.add_argument("--timeout", type=int, default=120,
                        help="Max seconds for Apify run (default: 120)")

    args = parser.parse_args()
    token = get_apify_token(args.token)

    all_commenters = []

    for post_url in args.post_url:
        print(f"Extracting comments from: {post_url}", file=sys.stderr)
        raw_items = extract_comments_from_post(
            post_url, token, args.max_comments, args.timeout
        )
        print(f"  Got {len(raw_items)} raw comments", file=sys.stderr)

        commenters = normalize_commenters(raw_items, post_url)
        print(f"  Parsed {len(commenters)} commenters", file=sys.stderr)
        all_commenters.extend(commenters)

    if args.dedup and len(args.post_url) > 1:
        before = len(all_commenters)
        all_commenters = dedup_commenters(all_commenters)
        print(f"Dedup: {before} -> {len(all_commenters)} unique commenters", file=sys.stderr)

    print(f"\nTotal: {len(all_commenters)} commenters extracted", file=sys.stderr)

    if args.output == "csv":
        output_csv(all_commenters)
    elif args.output == "summary":
        output_summary(all_commenters)
    else:
        output_json(all_commenters)


if __name__ == "__main__":
    main()
