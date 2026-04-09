#!/usr/bin/env python3
"""
Crawl a website's sitemap and blog index to build a complete content inventory.
Lists every page with URL, title, publish date, content type, and topic cluster.

Usage:
  python3 catalog_content.py --domain "example.com"
  python3 catalog_content.py --domain "example.com" --deep-analyze 20
  python3 catalog_content.py --domain "example.com" --output inventory.json
"""

import json
import os
import re
import sys
import argparse
import time as time_mod
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from urllib.parse import urlparse, urljoin

try:
    import requests
except ImportError:
    print("Error: requests library required. Install with: pip install requests", file=sys.stderr)
    sys.exit(1)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ContentCatalogBot/1.0)"}
GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    APIFY_BASE = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    APIFY_BASE = "https://api.apify.com/v2"
SITEMAP_ACTOR = "onescales~sitemap-url-extractor"

# --- Content Type Classification ---

TYPE_PATTERNS = {
    "blog-post": ["/blog/", "/posts/", "/articles/", "/insights/", "/news/"],
    "case-study": ["/case-study", "/case-studies", "/customers/", "/success-stories", "/customer-stories"],
    "comparison": ["/vs/", "/vs-", "/compare/", "/alternative/", "/alternatives/"],
    "landing-page": ["/solutions/", "/use-cases/", "/for-", "/product/", "/features/", "/platform/"],
    "docs": ["/docs/", "/help/", "/documentation/", "/api/", "/developer/", "/reference/"],
    "changelog": ["/changelog", "/releases/", "/whats-new/", "/updates/"],
    "pricing": ["/pricing"],
    "about": ["/about", "/team/", "/careers/", "/jobs/", "/company/"],
    "legal": ["/privacy", "/terms", "/security/", "/compliance/", "/gdpr/", "/legal/"],
    "resource": ["/resources/", "/guides/", "/ebooks/", "/webinars/", "/whitepapers/", "/reports/"],
    "glossary": ["/glossary/", "/dictionary/", "/definitions/"],
    "integration": ["/integrations/", "/apps/", "/marketplace/", "/partners/"],
}


def classify_page_type(url):
    """Classify a URL into a content type based on path patterns."""
    path = urlparse(url).path.lower()
    for content_type, patterns in TYPE_PATTERNS.items():
        for pattern in patterns:
            if pattern in path:
                return content_type
    return "other"


def extract_topic_keywords(url, title=""):
    """Extract topic keywords from URL path and title."""
    path = urlparse(url).path
    # Remove common path prefixes
    for prefix in ["/blog/", "/posts/", "/articles/", "/insights/"]:
        if path.startswith(prefix):
            path = path[len(prefix):]
            break
    # Extract slug words
    slug = path.strip("/").split("/")[-1] if path.strip("/") else ""
    words = re.split(r"[-_/]", slug)
    words = [w.lower() for w in words if len(w) > 2 and not w.isdigit()]

    # Also extract from title
    if title:
        title_words = re.findall(r"\b[a-zA-Z]{3,}\b", title.lower())
        # Filter common stop words
        stop_words = {"the", "and", "for", "with", "how", "what", "why", "your", "that",
                      "this", "from", "are", "you", "can", "will", "about", "into", "more",
                      "best", "top", "new", "get", "use", "using", "guide", "ultimate"}
        title_words = [w for w in title_words if w not in stop_words]
        words.extend(title_words)

    return list(set(words))


def cluster_topics(pages):
    """Simple keyword co-occurrence clustering for topic assignment."""
    # Count keyword frequency across all pages
    keyword_counts = {}
    for page in pages:
        for kw in page.get("_keywords", []):
            keyword_counts[kw] = keyword_counts.get(kw, 0) + 1

    # Keep keywords that appear in 2+ pages (these are topic signals)
    topic_keywords = {k: v for k, v in keyword_counts.items() if v >= 2}

    # Sort by frequency
    sorted_topics = sorted(topic_keywords.items(), key=lambda x: -x[1])

    # Build simple clusters: group pages by their highest-frequency keyword
    for page in pages:
        page_kws = page.get("_keywords", [])
        best_topic = None
        best_count = 0
        for kw in page_kws:
            if kw in topic_keywords and topic_keywords[kw] > best_count:
                best_topic = kw
                best_count = topic_keywords[kw]
        # Title-case the topic
        page["topic_cluster"] = best_topic.replace("-", " ").title() if best_topic else "Uncategorized"

    return pages


# --- Sitemap Parsing ---

def fetch_sitemap(domain):
    """Fetch and parse sitemap.xml, including sitemap indexes."""
    base_url = f"https://{domain}"
    urls = []

    # Check robots.txt for sitemap location
    sitemap_urls_to_try = []
    try:
        resp = requests.get(f"{base_url}/robots.txt", headers=HEADERS, timeout=10)
        if resp.status_code == 200:
            for line in resp.text.split("\n"):
                if line.strip().lower().startswith("sitemap:"):
                    sitemap_url = line.split(":", 1)[1].strip()
                    sitemap_urls_to_try.append(sitemap_url)
                    print(f"  Found sitemap in robots.txt: {sitemap_url}", file=sys.stderr)
    except Exception:
        pass

    # Add common sitemap paths
    for path in ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml", "/wp-sitemap.xml"]:
        sitemap_urls_to_try.append(f"{base_url}{path}")

    # Deduplicate
    sitemap_urls_to_try = list(dict.fromkeys(sitemap_urls_to_try))

    for sitemap_url in sitemap_urls_to_try:
        try:
            resp = requests.get(sitemap_url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                continue
            if "<?xml" not in resp.text[:200] and "<urlset" not in resp.text[:500] and "<sitemapindex" not in resp.text[:500]:
                continue

            print(f"  Parsing sitemap: {sitemap_url}", file=sys.stderr)
            found = parse_sitemap_xml(resp.text, base_url)
            urls.extend(found)

            if urls:
                break  # Got pages from first working sitemap
        except Exception as e:
            print(f"  [WARN] Failed to fetch {sitemap_url}: {e}", file=sys.stderr)
            continue

    return urls


def parse_sitemap_xml(xml_content, base_url):
    """Parse a sitemap XML, handling both sitemap indexes and url sets."""
    urls = []
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError:
        return urls

    # Strip namespace for easier parsing
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"

    # Check if this is a sitemap index
    sitemaps = root.findall(f"{ns}sitemap")
    if sitemaps:
        print(f"  Found sitemap index with {len(sitemaps)} child sitemaps", file=sys.stderr)
        for sm in sitemaps:
            loc = sm.findtext(f"{ns}loc")
            if loc:
                try:
                    resp = requests.get(loc, headers=HEADERS, timeout=15)
                    if resp.status_code == 200:
                        child_urls = parse_sitemap_xml(resp.text, base_url)
                        urls.extend(child_urls)
                except Exception as e:
                    print(f"  [WARN] Failed to fetch child sitemap {loc}: {e}", file=sys.stderr)
        return urls

    # Parse URL entries
    for url_elem in root.findall(f"{ns}url"):
        loc = url_elem.findtext(f"{ns}loc")
        lastmod = url_elem.findtext(f"{ns}lastmod")
        if loc:
            entry = {"url": loc}
            if lastmod:
                entry["lastmod"] = lastmod
            urls.append(entry)

    print(f"  Found {len(urls)} URLs in sitemap", file=sys.stderr)
    return urls


# --- RSS Feed Discovery ---

FEED_PATHS = [
    "/feed", "/rss", "/atom.xml", "/feed.xml", "/rss.xml",
    "/blog/feed", "/index.xml", "/blog/rss", "/blog/atom.xml",
]


def discover_rss_posts(domain):
    """Try to discover and parse RSS feeds for blog posts."""
    base_url = f"https://{domain}"
    posts = []

    # Check HTML for feed link
    feed_url = None
    try:
        resp = requests.get(base_url, headers=HEADERS, timeout=10)
        if resp.status_code == 200:
            # Look for <link rel="alternate" type="application/rss+xml">
            for line in resp.text.split(">"):
                if 'rel="alternate"' in line and ("rss+xml" in line or "atom+xml" in line):
                    if 'href="' in line:
                        href = line.split('href="')[1].split('"')[0]
                        if href.startswith("/"):
                            href = base_url + href
                        feed_url = href
                        break
    except Exception:
        pass

    # Try common feed paths
    if not feed_url:
        for path in FEED_PATHS:
            try_url = base_url + path
            try:
                resp = requests.get(try_url, headers=HEADERS, timeout=5)
                if resp.status_code == 200 and ("<?xml" in resp.text[:100] or "<rss" in resp.text[:200] or "<feed" in resp.text[:200]):
                    feed_url = try_url
                    break
            except Exception:
                continue

    if not feed_url:
        return posts

    print(f"  Found RSS feed: {feed_url}", file=sys.stderr)

    try:
        resp = requests.get(feed_url, headers=HEADERS, timeout=10)
        root = ET.fromstring(resp.text)

        # RSS 2.0
        for item in root.iter("item"):
            post = {
                "url": (item.findtext("link") or "").strip(),
                "title": (item.findtext("title") or "").strip(),
                "date": item.findtext("pubDate") or "",
                "author": (item.findtext("author") or item.findtext("{http://purl.org/dc/elements/1.1/}creator") or "").strip(),
            }
            if post["url"]:
                posts.append(post)

        # Atom
        if not posts:
            ns = "http://www.w3.org/2005/Atom"
            for entry in root.iter(f"{{{ns}}}entry"):
                link_elem = entry.find(f"{{{ns}}}link[@rel='alternate']")
                if link_elem is None:
                    link_elem = entry.find(f"{{{ns}}}link")
                post = {
                    "url": (link_elem.get("href", "") if link_elem is not None else "").strip(),
                    "title": (entry.findtext(f"{{{ns}}}title") or "").strip(),
                    "date": entry.findtext(f"{{{ns}}}published") or entry.findtext(f"{{{ns}}}updated") or "",
                    "author": (entry.findtext(f"{{{ns}}}author/{{{ns}}}name") or "").strip(),
                }
                if post["url"]:
                    posts.append(post)

        print(f"  Found {len(posts)} posts from RSS", file=sys.stderr)
    except Exception as e:
        print(f"  [WARN] Failed to parse RSS: {e}", file=sys.stderr)

    return posts


# --- Blog Index Crawl ---

def crawl_blog_index(domain):
    """Crawl common blog index pages to find content links."""
    base_url = f"https://{domain}"
    found_urls = []

    blog_paths = ["/blog", "/resources", "/insights", "/news", "/articles"]

    for path in blog_paths:
        try:
            resp = requests.get(f"{base_url}{path}", headers=HEADERS, timeout=10)
            if resp.status_code != 200:
                continue

            print(f"  Crawling blog index: {base_url}{path}", file=sys.stderr)

            # Extract links that look like blog posts
            links = re.findall(r'href=["\']([^"\']+)["\']', resp.text)
            for link in links:
                # Resolve relative URLs
                if link.startswith("/"):
                    link = base_url + link
                elif not link.startswith("http"):
                    continue

                # Only keep links on same domain that look like content
                if domain in link and path in link and link != f"{base_url}{path}" and link != f"{base_url}{path}/":
                    found_urls.append(link)

            if found_urls:
                print(f"  Found {len(found_urls)} content links from blog index", file=sys.stderr)
                break

        except Exception as e:
            print(f"  [WARN] Failed to crawl {base_url}{path}: {e}", file=sys.stderr)

    return list(set(found_urls))


# --- Apify Fallback ---

def fetch_sitemap_apify(domain, token, timeout=120):
    """Use Apify sitemap extractor as fallback."""
    print(f"  Using Apify sitemap extractor for {domain}...", file=sys.stderr)

    run_input = {
        "urls": [f"https://{domain}"]
    }

    try:
        resp = requests.post(
            f"{APIFY_BASE}/acts/{SITEMAP_ACTOR}/runs",
            json=run_input,
            params={"token": token},
        )
        resp.raise_for_status()
        run_id = resp.json()["data"]["id"]

        deadline = time_mod.time() + timeout
        while time_mod.time() < deadline:
            status_resp = requests.get(
                f"{APIFY_BASE}/acts/{SITEMAP_ACTOR}/runs/{run_id}",
                params={"token": token},
            )
            status_data = status_resp.json()
            status = status_data["data"]["status"]

            if status == "SUCCEEDED":
                break
            elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
                print(f"  [WARN] Apify sitemap extraction {status}", file=sys.stderr)
                return []
            time_mod.sleep(3)
        else:
            print(f"  [WARN] Apify sitemap extraction timed out", file=sys.stderr)
            return []

        dataset_id = status_data["data"]["defaultDatasetId"]
        items_resp = requests.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            params={"token": token, "format": "json"},
        )
        items = items_resp.json()

        urls = []
        for item in items:
            url = item.get("url") or item.get("loc")
            if url:
                urls.append({"url": url})

        print(f"  Apify found {len(urls)} URLs", file=sys.stderr)
        return urls

    except Exception as e:
        print(f"  [WARN] Apify sitemap extraction failed: {e}", file=sys.stderr)
        return []


# --- Title Extraction ---

def extract_title_from_url(url):
    """Extract a readable title from a URL slug."""
    path = urlparse(url).path.strip("/")
    if not path:
        return urlparse(url).netloc
    slug = path.split("/")[-1]
    # Remove file extensions
    slug = re.sub(r"\.(html?|php|aspx?)$", "", slug)
    # Convert hyphens/underscores to spaces and title case
    title = re.sub(r"[-_]", " ", slug).strip()
    return title.title() if title else path


# --- Main Logic ---

def catalog_domain(domain, deep_analyze=0, include_non_blog=True, apify_token=None):
    """Main function: discover all pages, classify, and catalog."""
    print(f"Cataloging content for: {domain}", file=sys.stderr)

    all_pages = {}  # url -> page dict (dedup by URL)
    discovery_methods = []

    # Phase 1A: Sitemap
    print("\n--- Phase 1A: Sitemap Discovery ---", file=sys.stderr)
    sitemap_urls = fetch_sitemap(domain)
    if sitemap_urls:
        discovery_methods.append("sitemap.xml")
        for entry in sitemap_urls:
            url = entry["url"]
            if url not in all_pages:
                all_pages[url] = {
                    "url": url,
                    "title": extract_title_from_url(url),
                    "date": entry.get("lastmod", ""),
                    "source": "sitemap",
                }

    # Phase 1B: RSS feeds
    print("\n--- Phase 1B: RSS Discovery ---", file=sys.stderr)
    rss_posts = discover_rss_posts(domain)
    if rss_posts:
        discovery_methods.append("rss")
        for post in rss_posts:
            url = post["url"]
            if url in all_pages:
                # RSS has better titles and dates, merge
                if post.get("title"):
                    all_pages[url]["title"] = post["title"]
                if post.get("date"):
                    all_pages[url]["date"] = post["date"]
                if post.get("author"):
                    all_pages[url]["author"] = post["author"]
            else:
                all_pages[url] = {
                    "url": url,
                    "title": post.get("title", extract_title_from_url(url)),
                    "date": post.get("date", ""),
                    "author": post.get("author", ""),
                    "source": "rss",
                }

    # Phase 1C: Blog index crawl
    print("\n--- Phase 1C: Blog Index Crawl ---", file=sys.stderr)
    blog_urls = crawl_blog_index(domain)
    if blog_urls:
        discovery_methods.append("blog-index")
        for url in blog_urls:
            if url not in all_pages:
                all_pages[url] = {
                    "url": url,
                    "title": extract_title_from_url(url),
                    "date": "",
                    "source": "blog-index",
                }

    # Phase 1D: Apify fallback if we found very few pages
    if len(all_pages) < 10 and apify_token:
        print("\n--- Phase 1D: Apify Sitemap Fallback ---", file=sys.stderr)
        apify_urls = fetch_sitemap_apify(domain, apify_token)
        if apify_urls:
            discovery_methods.append("apify-sitemap")
            for entry in apify_urls:
                url = entry["url"]
                if url not in all_pages:
                    all_pages[url] = {
                        "url": url,
                        "title": extract_title_from_url(url),
                        "date": "",
                        "source": "apify",
                    }

    print(f"\nTotal unique pages discovered: {len(all_pages)}", file=sys.stderr)

    # Phase 2: Classify each page
    print("\n--- Phase 2: Classifying Pages ---", file=sys.stderr)
    pages = list(all_pages.values())
    for page in pages:
        page["type"] = classify_page_type(page["url"])
        page["_keywords"] = extract_topic_keywords(page["url"], page.get("title", ""))

    # Filter non-blog content if requested
    if not include_non_blog:
        pages = [p for p in pages if p["type"] == "blog-post"]

    # Phase 3: Topic clustering
    print("--- Phase 3: Topic Clustering ---", file=sys.stderr)
    pages = cluster_topics(pages)

    # Clean up internal fields
    for page in pages:
        page.pop("_keywords", None)
        page.pop("source", None)

    # Phase 4: Analyze publishing patterns
    print("--- Phase 4: Publishing Patterns ---", file=sys.stderr)
    summary = build_summary(pages)

    # Sort pages: blog posts by date (newest first), then others by type
    def sort_key(p):
        date = p.get("date", "")
        if isinstance(date, str) and date:
            return (0 if p["type"] == "blog-post" else 1, date)
        return (0 if p["type"] == "blog-post" else 1, "0000")

    pages.sort(key=sort_key, reverse=True)

    result = {
        "domain": domain,
        "crawl_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "total_pages": len(pages),
        "discovery_methods": discovery_methods,
        "summary": summary,
        "pages": pages,
    }

    return result


def build_summary(pages):
    """Build summary statistics from the page catalog."""
    # By type
    by_type = {}
    for p in pages:
        t = p["type"]
        by_type[t] = by_type.get(t, 0) + 1

    # By topic
    by_topic = {}
    for p in pages:
        topic = p.get("topic_cluster", "Uncategorized")
        by_topic[topic] = by_topic.get(topic, 0) + 1

    # Publishing cadence (blog posts only)
    blog_posts = [p for p in pages if p["type"] == "blog-post" and p.get("date")]
    posts_by_month = {}
    most_recent = ""
    for p in blog_posts:
        date_str = p["date"]
        if isinstance(date_str, str) and len(date_str) >= 7:
            month = date_str[:7]  # YYYY-MM
            posts_by_month[month] = posts_by_month.get(month, 0) + 1
            if date_str > most_recent:
                most_recent = date_str

    months = sorted(posts_by_month.keys())
    avg_per_month = sum(posts_by_month.values()) / max(len(months), 1)

    # Trend: compare first half vs second half of months
    trend = "unknown"
    if len(months) >= 4:
        mid = len(months) // 2
        first_half_avg = sum(posts_by_month[m] for m in months[:mid]) / mid
        second_half_avg = sum(posts_by_month[m] for m in months[mid:]) / (len(months) - mid)
        if second_half_avg > first_half_avg * 1.2:
            trend = "increasing"
        elif second_half_avg < first_half_avg * 0.8:
            trend = "decreasing"
        else:
            trend = "stable"

    # Authors
    authors = set()
    for p in pages:
        if p.get("author"):
            authors.add(p["author"])

    return {
        "by_type": dict(sorted(by_type.items(), key=lambda x: -x[1])),
        "by_topic": dict(sorted(by_topic.items(), key=lambda x: -x[1])),
        "publishing_cadence": {
            "posts_per_month_avg": round(avg_per_month, 1),
            "trend": trend,
            "most_recent": most_recent[:10] if most_recent else "unknown",
            "total_dated_posts": len(blog_posts),
            "months_tracked": len(months),
        },
        "unique_authors": len(authors),
        "author_names": sorted(authors) if len(authors) <= 20 else sorted(authors)[:20],
    }


def format_markdown(result):
    """Generate a Markdown summary from the catalog result."""
    lines = []
    d = result["domain"]
    lines.append(f"# Content Inventory: {d}")
    lines.append(f"**Crawled:** {result['crawl_date']} | **Total pages:** {result['total_pages']} | **Discovery:** {', '.join(result['discovery_methods'])}")
    lines.append("")

    # By type
    summary = result["summary"]
    lines.append("## Content by Type")
    lines.append("| Type | Count | % |")
    lines.append("|------|-------|---|")
    total = result["total_pages"] or 1
    for t, count in summary["by_type"].items():
        pct = round(count / total * 100, 1)
        lines.append(f"| {t} | {count} | {pct}% |")
    lines.append("")

    # By topic
    lines.append("## Content by Topic Cluster")
    lines.append("| Topic | Count |")
    lines.append("|-------|-------|")
    for topic, count in list(summary["by_topic"].items())[:20]:
        lines.append(f"| {topic} | {count} |")
    lines.append("")

    # Publishing cadence
    cad = summary["publishing_cadence"]
    lines.append("## Publishing Cadence")
    lines.append(f"- **Average:** {cad['posts_per_month_avg']} posts/month")
    lines.append(f"- **Trend:** {cad['trend']}")
    lines.append(f"- **Most recent:** {cad['most_recent']}")
    lines.append(f"- **Unique authors:** {summary['unique_authors']}")
    lines.append("")

    # Full catalog table
    lines.append("## Full Catalog")
    lines.append("| # | Date | Type | Topic | Title | URL |")
    lines.append("|---|------|------|-------|-------|-----|")
    for i, p in enumerate(result["pages"], 1):
        date = (p.get("date") or "")[:10]
        title = (p.get("title") or "")[:60]
        topic = (p.get("topic_cluster") or "")[:25]
        url = p["url"]
        lines.append(f"| {i} | {date} | {p['type']} | {topic} | {title} | {url} |")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Crawl a website to build a complete content inventory",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--domain", required=True, help="Domain to catalog (e.g., example.com)")
    parser.add_argument("--deep-analyze", type=int, default=0, help="Number of top pages to deep-analyze (default: 0)")
    parser.add_argument("--output", help="Path to save JSON output (default: stdout)")
    parser.add_argument("--markdown", help="Path to save Markdown summary")
    parser.add_argument("--no-non-blog", action="store_true", help="Only catalog blog posts")
    parser.add_argument("--apify-token", help="Apify API token for fallback (or set APIFY_API_TOKEN)")

    args = parser.parse_args()

    # Strip protocol if provided
    domain = args.domain.replace("https://", "").replace("http://", "").rstrip("/")

    apify_token = args.apify_token or GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")

    result = catalog_domain(
        domain=domain,
        deep_analyze=args.deep_analyze,
        include_non_blog=not args.no_non_blog,
        apify_token=apify_token,
    )

    # JSON output
    if args.output:
        os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)
        print(f"JSON saved to: {args.output}", file=sys.stderr)
    else:
        print(json.dumps(result, indent=2))

    # Markdown output
    if args.markdown:
        md = format_markdown(result)
        os.makedirs(os.path.dirname(args.markdown) or ".", exist_ok=True)
        with open(args.markdown, "w") as f:
            f.write(md)
        print(f"Markdown saved to: {args.markdown}", file=sys.stderr)

    print(f"\nDone. Cataloged {result['total_pages']} pages.", file=sys.stderr)


if __name__ == "__main__":
    main()
