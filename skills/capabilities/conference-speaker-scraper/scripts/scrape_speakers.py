#!/usr/bin/env python3
"""
Conference Speaker Scraper — Extract speaker names, titles, companies, and bios
from conference website /speakers pages.

Usage:
    python3 scrape_speakers.py --url "https://example.com/speakers"
    python3 scrape_speakers.py --url URL --mode apify
    python3 scrape_speakers.py --url URL --output csv
    python3 scrape_speakers.py --url URL --output summary
    python3 scrape_speakers.py --url URL --conference "Sage Future 2026"
"""

import argparse
import csv
import json
import os
import re
import sys
import time
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "User-Agent": "ConferenceSpeakerScraper/1.0"
}

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    APIFY_BASE = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    APIFY_BASE = "https://api.apify.com/v2"

# Speaker-related CSS class patterns
SPEAKER_CLASS_PATTERNS = [
    r"speaker", r"presenter", r"faculty", r"panelist",
    r"team-member", r"person", r"author", r"keynote",
]

# ---------------------------------------------------------------------------
# Direct HTML Scraping Strategies
# ---------------------------------------------------------------------------


def extract_text(html_fragment):
    """Strip HTML tags from a fragment."""
    text = re.sub(r"<[^>]+>", " ", html_fragment)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_linkedin_url(html_fragment):
    """Find a LinkedIn URL in an HTML fragment."""
    match = re.search(r'href=["\']?(https?://(?:www\.)?linkedin\.com/in/[^"\'>\s]+)', html_fragment)
    return match.group(1) if match else ""


def extract_image_url(html_fragment, base_url=""):
    """Find an image URL in an HTML fragment."""
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html_fragment)
    if match:
        url = match.group(1)
        if url.startswith("/"):
            parsed = urlparse(base_url)
            url = f"{parsed.scheme}://{parsed.netloc}{url}"
        return url
    return ""


def strategy_css_classes(html, base_url):
    """Strategy A: Find speaker cards by CSS class patterns."""
    speakers = []
    pattern = "|".join(SPEAKER_CLASS_PATTERNS)

    # Find divs/sections with speaker-related classes
    card_pattern = re.compile(
        rf'<(?:div|section|article|li)[^>]+class=["\'][^"\']*(?:{pattern})[^"\']*["\'][^>]*>(.*?)</(?:div|section|article|li)>',
        re.IGNORECASE | re.DOTALL
    )

    for match in card_pattern.finditer(html):
        card_html = match.group(1)

        # Extract name from heading tags
        name_match = re.search(r'<h[2-4][^>]*>(.*?)</h[2-4]>', card_html, re.DOTALL)
        if not name_match:
            name_match = re.search(r'<(?:strong|b)[^>]*>(.*?)</(?:strong|b)>', card_html, re.DOTALL)
        name = extract_text(name_match.group(1)) if name_match else ""

        if not name or len(name) > 80:
            continue

        # Extract title/company from paragraphs
        paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', card_html, re.DOTALL)
        title = ""
        company = ""
        bio = ""

        for i, p in enumerate(paragraphs):
            p_text = extract_text(p)
            if i == 0 and len(p_text) < 100:
                # First short paragraph is likely title/company
                parts = re.split(r'\s*[,|@]\s*', p_text, maxsplit=1)
                title = parts[0] if parts else ""
                company = parts[1] if len(parts) > 1 else ""
            elif len(p_text) > 50:
                bio = p_text

        speakers.append({
            "name": name,
            "title": title,
            "company": company,
            "bio": bio[:500],
            "linkedin_url": extract_linkedin_url(card_html),
            "image_url": extract_image_url(card_html, base_url),
        })

    return speakers


def strategy_heading_paragraph(html, base_url):
    """Strategy B: Look for repeated heading + paragraph patterns."""
    speakers = []

    # Find h2/h3 followed by content
    pattern = re.compile(
        r'<h[23][^>]*>(.*?)</h[23]>\s*(?:<[^>]+>\s*)*<p[^>]*>(.*?)</p>',
        re.DOTALL | re.IGNORECASE
    )

    for match in pattern.finditer(html):
        name = extract_text(match.group(1))
        detail = extract_text(match.group(2))

        if not name or len(name) > 80 or len(name) < 3:
            continue

        # Skip obvious non-person headings
        if any(w in name.lower() for w in ["schedule", "agenda", "session", "track", "day ", "register"]):
            continue

        parts = re.split(r'\s*[,|@]\s*', detail, maxsplit=1)
        title = parts[0] if parts else ""
        company = parts[1] if len(parts) > 1 else ""

        # Get surrounding HTML for LinkedIn/image
        start = max(0, match.start() - 200)
        end = min(len(html), match.end() + 500)
        context = html[start:end]

        speakers.append({
            "name": name,
            "title": title[:100],
            "company": company[:100],
            "bio": "",
            "linkedin_url": extract_linkedin_url(context),
            "image_url": extract_image_url(context, base_url),
        })

    return speakers


def strategy_json_ld(html, base_url):
    """Strategy C: Look for JSON-LD structured data."""
    speakers = []

    json_ld_pattern = re.compile(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        re.DOTALL | re.IGNORECASE
    )

    for match in json_ld_pattern.finditer(html):
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue

        # Handle both single objects and arrays
        items = data if isinstance(data, list) else [data]

        for item in items:
            if isinstance(item, dict):
                item_type = item.get("@type", "")
                if item_type in ["Person", "Speaker"]:
                    speakers.append({
                        "name": item.get("name", ""),
                        "title": item.get("jobTitle", ""),
                        "company": item.get("worksFor", {}).get("name", "") if isinstance(item.get("worksFor"), dict) else str(item.get("worksFor", "")),
                        "bio": item.get("description", "")[:500],
                        "linkedin_url": "",
                        "image_url": item.get("image", ""),
                    })

                # Check for Event with performers/speakers
                if item_type == "Event":
                    for performer in item.get("performer", []) + item.get("speaker", []):
                        if isinstance(performer, dict):
                            speakers.append({
                                "name": performer.get("name", ""),
                                "title": performer.get("jobTitle", ""),
                                "company": performer.get("worksFor", {}).get("name", "") if isinstance(performer.get("worksFor"), dict) else "",
                                "bio": performer.get("description", "")[:500],
                                "linkedin_url": "",
                                "image_url": performer.get("image", ""),
                            })

    return speakers


def scrape_direct(url, conference_name):
    """Scrape speakers using direct HTML strategies."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
        resp.raise_for_status()
    except Exception as e:
        print(f"ERROR: Failed to fetch {url}: {e}", file=sys.stderr)
        return []

    html = resp.text
    parsed = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    # Try all strategies, pick the one with the most results
    results = {}
    results["css"] = strategy_css_classes(html, base_url)
    results["heading"] = strategy_heading_paragraph(html, base_url)
    results["jsonld"] = strategy_json_ld(html, base_url)

    best_strategy = max(results, key=lambda k: len(results[k]))
    speakers = results[best_strategy]

    if speakers:
        print(f"  Best strategy: {best_strategy} ({len(speakers)} speakers)", file=sys.stderr)
    else:
        print("  Warning: No speakers found with any strategy. Try --mode apify for JS-heavy sites.", file=sys.stderr)

    # Add conference metadata
    for s in speakers:
        s["conference"] = conference_name
        s["source_url"] = url

    # Deduplicate by name
    seen_names = set()
    unique = []
    for s in speakers:
        if s["name"] and s["name"] not in seen_names:
            seen_names.add(s["name"])
            unique.append(s)

    return unique


# ---------------------------------------------------------------------------
# Apify Mode
# ---------------------------------------------------------------------------

def get_apify_token(token_arg=None):
    """Get API token from arg, GOOSEWORKS_API_KEY, or APIFY_API_TOKEN env var."""
    token = token_arg or GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")
    if not token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)
    return token


def scrape_apify(url, conference_name, token, timeout=300):
    """Scrape speakers using Apify cheerio-scraper."""
    actor_id = "apify/cheerio-scraper"
    actor_input = {
        "startUrls": [{"url": url}],
        "pageFunction": """
async function pageFunction(context) {
    const { $, request } = context;
    const speakers = [];
    const selectors = [
        '.speaker', '.presenter', '.person', '.team-member',
        '[class*="speaker"]', '[class*="presenter"]',
        '.faculty', '.panelist', '[class*="keynote"]'
    ];
    for (const sel of selectors) {
        $(sel).each((i, el) => {
            const $el = $(el);
            const name = $el.find('h2, h3, h4, strong, .name').first().text().trim();
            const title = $el.find('.title, .role, .position, p').first().text().trim();
            const bio = $el.find('.bio, .description, .about').first().text().trim();
            const linkedin = $el.find('a[href*="linkedin.com"]').attr('href') || '';
            const img = $el.find('img').attr('src') || '';
            if (name && name.length < 80) {
                speakers.push({ name, title, bio, linkedin_url: linkedin, image_url: img });
            }
        });
    }
    return speakers;
}
""",
        "maxRequestsPerCrawl": 5,
    }

    # Start actor
    start_resp = requests.post(
        f"{APIFY_BASE}/acts/{actor_id}/runs",
        params={"token": token},
        json=actor_input,
    )
    start_resp.raise_for_status()
    run_data = start_resp.json()["data"]
    run_id = run_data["id"]
    print(f"  Apify run started: {run_id}", file=sys.stderr)

    # Poll for completion
    start_time = time.time()
    while time.time() - start_time < timeout:
        status_resp = requests.get(
            f"{APIFY_BASE}/actor-runs/{run_id}",
            params={"token": token},
        )
        status_data = status_resp.json()["data"]
        status = status_data["status"]
        if status in ("SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"):
            break
        time.sleep(5)

    if status != "SUCCEEDED":
        print(f"  Warning: Apify run ended with status: {status}", file=sys.stderr)
        return []

    # Fetch results
    dataset_id = status_data["defaultDatasetId"]
    dataset_resp = requests.get(
        f"{APIFY_BASE}/datasets/{dataset_id}/items",
        params={"token": token, "format": "json"},
    )
    dataset_resp.raise_for_status()
    raw_results = dataset_resp.json()

    speakers = []
    for item in raw_results:
        if isinstance(item, list):
            for s in item:
                if isinstance(s, dict) and s.get("name"):
                    s.setdefault("conference", conference_name)
                    s.setdefault("source_url", url)
                    s.setdefault("company", "")
                    s.setdefault("bio", "")
                    s.setdefault("linkedin_url", "")
                    s.setdefault("image_url", "")
                    speakers.append(s)
        elif isinstance(item, dict) and item.get("name"):
            item.setdefault("conference", conference_name)
            item.setdefault("source_url", url)
            item.setdefault("company", "")
            item.setdefault("bio", "")
            item.setdefault("linkedin_url", "")
            item.setdefault("image_url", "")
            speakers.append(item)

    print(f"  Apify found {len(speakers)} speakers", file=sys.stderr)
    return speakers


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

CSV_FIELDS = ["name", "title", "company", "bio", "linkedin_url", "image_url", "conference", "source_url"]


def output_json(speakers):
    print(json.dumps(speakers, indent=2, ensure_ascii=False))


def output_csv(speakers):
    writer = csv.DictWriter(sys.stdout, fieldnames=CSV_FIELDS, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(speakers)


def output_summary(speakers):
    print(f"\nConference Speaker Scraper Results")
    print("=" * 50)
    print(f"Found {len(speakers)} speakers\n")

    if not speakers:
        print("No speakers found. Try --mode apify for JS-heavy sites.")
        return

    print(f"{'#':<4} {'Name':<25} {'Title':<25} {'Company':<20} {'LinkedIn'}")
    print("-" * 100)
    for i, s in enumerate(speakers, 1):
        name = (s.get("name") or "")[:23]
        title = (s.get("title") or "")[:23]
        company = (s.get("company") or "")[:18]
        linkedin = "Yes" if s.get("linkedin_url") else ""
        print(f"{i:<4} {name:<25} {title:<25} {company:<20} {linkedin}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def infer_conference_name(url):
    """Infer a conference name from the URL domain."""
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "")
    # Remove TLD
    parts = domain.split(".")
    if len(parts) >= 2:
        return parts[0].replace("-", " ").title()
    return domain


def main():
    parser = argparse.ArgumentParser(
        description="Scrape speaker info from conference websites."
    )
    parser.add_argument("--url", required=True, help="Conference speakers page URL")
    parser.add_argument("--conference", help="Conference name (default: inferred from URL)")
    parser.add_argument("--mode", choices=["direct", "apify"], default="direct",
                        help="Scraping mode (default: direct)")
    parser.add_argument("--output", choices=["json", "csv", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--token", help="Apify API token (for apify mode)")
    parser.add_argument("--timeout", type=int, default=300,
                        help="Max seconds for Apify run (default: 300)")

    args = parser.parse_args()

    conference_name = args.conference or infer_conference_name(args.url)

    if args.mode == "apify":
        token = get_apify_token(args.token)
        speakers = scrape_apify(args.url, conference_name, token, args.timeout)
    else:
        speakers = scrape_direct(args.url, conference_name)

    print(f"\nResults: {len(speakers)} speakers found.", file=sys.stderr)

    if args.output == "csv":
        output_csv(speakers)
    elif args.output == "summary":
        output_summary(speakers)
    else:
        output_json(speakers)


if __name__ == "__main__":
    main()
