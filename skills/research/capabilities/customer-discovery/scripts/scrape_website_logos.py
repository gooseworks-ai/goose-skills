#!/usr/bin/env python3
"""
Scrape customer logos from a company's website by checking common customer page paths.
Extracts company names from logo alt text, headings, and link text.

Usage:
    python3 scrape_website_logos.py --url "https://datadog.com" --output json
    python3 scrape_website_logos.py --url "https://notion.so" --output summary
"""

import argparse
import json
import re
import sys
from urllib.parse import urljoin, urlparse

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip3 install requests", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Common paths where companies list their customers
CUSTOMER_PATHS = [
    "/customers",
    "/case-studies",
    "/logos",
    "/partners",
    "/trust",
    "/wall-of-love",
    "/testimonials",
    "/clients",
    "/success-stories",
    "/who-uses-us",
]

# Words that indicate a logo is NOT a customer (filter these out)
NOISE_WORDS = {
    "logo", "icon", "arrow", "chevron", "close", "menu", "hamburger", "search",
    "facebook", "twitter", "linkedin", "instagram", "youtube", "github", "tiktok",
    "pinterest", "slack", "discord", "reddit", "x.com", "social",
    "cookie", "gdpr", "privacy", "terms", "footer", "header", "nav",
    "placeholder", "default", "avatar", "profile", "user", "loading", "spinner",
    "banner", "hero", "background", "pattern", "decoration", "divider",
}

# Minimum length for a company name to be considered valid
MIN_NAME_LENGTH = 2
MAX_NAME_LENGTH = 60


def fetch_page(url):
    """Fetch a page and return its HTML content, or None on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        if resp.status_code == 200 and "text/html" in resp.headers.get("content-type", ""):
            return resp.text
    except Exception as e:
        print(f"  Warning: Failed to fetch {url}: {e}", file=sys.stderr)
    return None


def clean_name(raw):
    """Clean and normalize a potential company name."""
    if not raw:
        return None

    # Strip whitespace and common suffixes
    name = raw.strip()

    # Remove file extensions
    name = re.sub(r"\.(png|jpg|jpeg|svg|gif|webp|ico)$", "", name, flags=re.IGNORECASE)

    # Remove common prefixes/suffixes
    name = re.sub(r"^(logo[_\-\s]*of[_\-\s]*|logo[_\-\s]*)", "", name, flags=re.IGNORECASE)
    name = re.sub(r"[_\-\s]*logo$", "", name, flags=re.IGNORECASE)

    # Replace underscores/hyphens with spaces for readability
    name = re.sub(r"[_\-]+", " ", name).strip()

    # Title case if all lower or all upper
    if name.islower() or name.isupper():
        name = name.title()

    # Filter out noise
    if not name or len(name) < MIN_NAME_LENGTH or len(name) > MAX_NAME_LENGTH:
        return None

    lower = name.lower()
    if any(noise in lower for noise in NOISE_WORDS):
        return None

    # Filter out strings that are mostly non-alpha (likely CSS classes or IDs)
    alpha_ratio = sum(1 for c in name if c.isalpha()) / max(len(name), 1)
    if alpha_ratio < 0.5:
        return None

    return name


def extract_logos_from_html(html, page_url):
    """
    Extract potential customer names from HTML by analyzing img tags,
    their alt text, and surrounding context.

    Returns list of dicts: [{name, img_alt, source_url, confidence}]
    """
    results = []
    seen_names = set()

    # Pattern 1: Extract img alt text from logo grids
    # Look for img tags with alt text
    img_pattern = re.compile(
        r'<img[^>]*?alt=["\']([^"\']+)["\'][^>]*?>',
        re.IGNORECASE | re.DOTALL
    )

    for match in img_pattern.finditer(html):
        alt_text = match.group(1)
        name = clean_name(alt_text)
        if name and name.lower() not in seen_names:
            seen_names.add(name.lower())
            results.append({
                "name": name,
                "img_alt": alt_text,
                "source_url": page_url,
                "confidence": "medium",
            })

    # Pattern 2: Look for title attributes on images/links
    title_pattern = re.compile(
        r'<(?:img|a)[^>]*?title=["\']([^"\']+)["\'][^>]*?>',
        re.IGNORECASE | re.DOTALL
    )

    for match in title_pattern.finditer(html):
        title_text = match.group(1)
        name = clean_name(title_text)
        if name and name.lower() not in seen_names:
            seen_names.add(name.lower())
            results.append({
                "name": name,
                "img_alt": title_text,
                "source_url": page_url,
                "confidence": "low",
            })

    # Pattern 3: Look for aria-label attributes
    aria_pattern = re.compile(
        r'aria-label=["\']([^"\']+)["\']',
        re.IGNORECASE
    )

    for match in aria_pattern.finditer(html):
        label = match.group(1)
        name = clean_name(label)
        if name and name.lower() not in seen_names:
            seen_names.add(name.lower())
            results.append({
                "name": name,
                "img_alt": label,
                "source_url": page_url,
                "confidence": "low",
            })

    return results


def extract_case_study_names(html, page_url):
    """
    Extract customer names from case study listings.
    Looks for headings and link text that contain company names.
    """
    results = []
    seen_names = set()

    # Look for patterns like "How [Company] uses..." or "[Company] case study"
    patterns = [
        re.compile(r'[Hh]ow\s+([A-Z][A-Za-z0-9\s&.]+?)\s+(?:uses?|leverages?|scales?|grows?|built|achieved|increased|reduced)', re.MULTILINE),
        re.compile(r'<h[1-4][^>]*>([^<]{3,50})</h[1-4]>', re.IGNORECASE),
    ]

    for pattern in patterns:
        for match in pattern.finditer(html):
            text = match.group(1).strip()
            name = clean_name(text)
            if name and name.lower() not in seen_names and len(name.split()) <= 5:
                seen_names.add(name.lower())
                results.append({
                    "name": name,
                    "img_alt": "",
                    "source_url": page_url,
                    "confidence": "medium",
                })

    return results


def scrape_website(base_url):
    """
    Scrape a company's website for customer logos and names.

    Args:
        base_url: Company website URL (e.g., "https://datadog.com")

    Returns:
        List of customer dicts
    """
    base_url = base_url.rstrip("/")
    parsed = urlparse(base_url)
    if not parsed.scheme:
        base_url = "https://" + base_url
        parsed = urlparse(base_url)

    all_results = []
    pages_checked = []

    # First check the homepage for logo walls
    print(f"Checking homepage: {base_url}", file=sys.stderr)
    homepage_html = fetch_page(base_url)
    if homepage_html:
        logos = extract_logos_from_html(homepage_html, base_url)
        if logos:
            print(f"  Found {len(logos)} potential logos on homepage", file=sys.stderr)
            all_results.extend(logos)
        pages_checked.append(base_url)

    # Check common customer pages
    for path in CUSTOMER_PATHS:
        url = base_url + path
        print(f"Checking: {url}", file=sys.stderr)
        html = fetch_page(url)
        if html:
            logos = extract_logos_from_html(html, url)
            case_studies = extract_case_study_names(html, url)

            # Logos found on dedicated customer pages get higher confidence
            for logo in logos:
                logo["confidence"] = "high"

            if logos:
                print(f"  Found {len(logos)} potential logos", file=sys.stderr)
                all_results.extend(logos)
            if case_studies:
                print(f"  Found {len(case_studies)} case study mentions", file=sys.stderr)
                all_results.extend(case_studies)

            pages_checked.append(url)

    # Deduplicate by name (case-insensitive)
    seen = {}
    deduped = []
    for r in all_results:
        key = r["name"].lower()
        if key not in seen:
            seen[key] = r
            deduped.append(r)
        else:
            # Keep the higher confidence version
            existing = seen[key]
            conf_order = {"high": 3, "medium": 2, "low": 1}
            if conf_order.get(r["confidence"], 0) > conf_order.get(existing["confidence"], 0):
                seen[key] = r
                deduped = [r if item["name"].lower() == key else item for item in deduped]

    return deduped, pages_checked


def output_json(results):
    print(json.dumps(results, indent=2, ensure_ascii=False))


def output_summary(results, pages_checked):
    print(f"\nWebsite Logo Scraper Results")
    print("=" * 50)
    print(f"Customers found: {len(results)}")
    print(f"Pages checked: {len(pages_checked)}")

    if not results:
        print("\nNo customer logos found.")
        return

    high = [r for r in results if r["confidence"] == "high"]
    medium = [r for r in results if r["confidence"] == "medium"]
    low = [r for r in results if r["confidence"] == "low"]

    if high:
        print(f"\nHigh confidence ({len(high)}):")
        for r in high:
            print(f"  - {r['name']}")
    if medium:
        print(f"\nMedium confidence ({len(medium)}):")
        for r in medium:
            print(f"  - {r['name']}")
    if low:
        print(f"\nLow confidence ({len(low)}):")
        for r in low:
            print(f"  - {r['name']}")

    print(f"\nPages checked:")
    for p in pages_checked:
        print(f"  - {p}")


def main():
    parser = argparse.ArgumentParser(
        description="Scrape customer logos and names from a company's website."
    )
    parser.add_argument("--url", required=True, help="Company website URL (e.g., https://datadog.com)")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")

    args = parser.parse_args()

    results, pages_checked = scrape_website(args.url)

    print(f"Found {len(results)} potential customers", file=sys.stderr)

    if args.output == "summary":
        output_summary(results, pages_checked)
    else:
        output_json(results)


if __name__ == "__main__":
    main()
