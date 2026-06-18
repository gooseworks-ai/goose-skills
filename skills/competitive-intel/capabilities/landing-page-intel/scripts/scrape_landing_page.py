#!/usr/bin/env python3
"""
Extract competitor & customer intelligence from a company's landing page HTML.
No API keys required — just fetches public HTML and parses it.

Usage:
  python3 scrape_landing_page.py --url "https://example.com"
  python3 scrape_landing_page.py --url "https://example.com" --pages "/,/pricing,/about"
  python3 scrape_landing_page.py --url "https://example.com" --output summary
"""

import json
import re
import sys
import argparse
import requests
from urllib.parse import urljoin, urlparse


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# ---------------------------------------------------------------------------
# Tech stack detection patterns
# Each entry: (tool_name, category, pattern_to_search_in_html)
# ---------------------------------------------------------------------------
TECH_PATTERNS = [
    # Analytics
    ("Google Analytics (GA4)", "analytics", r"gtag\(|googletagmanager\.com|G-[A-Z0-9]+|UA-\d+"),
    ("Google Tag Manager", "analytics", r"googletagmanager\.com/gtm\.js"),
    ("Mixpanel", "analytics", r"mixpanel\.com|mixpanel\.init|cdn\.mxpnl\.com"),
    ("Amplitude", "analytics", r"amplitude\.com|amplitude\.getInstance"),
    ("PostHog", "analytics", r"posthog\.com|posthog\.init|us\.i\.posthog\.com"),
    ("Heap", "analytics", r"heap\.io|heap\.load|heapanalytics\.com"),
    ("Plausible", "analytics", r"plausible\.io"),
    ("Fathom", "analytics", r"usefathom\.com"),
    ("Segment", "analytics", r"segment\.com|segment\.io|analytics\.load"),
    ("Rudderstack", "analytics", r"rudderstack\.com|rudderanalytics"),
    ("Koala", "analytics", r"getkoala\.com|koala\.init"),

    # Marketing automation
    ("HubSpot", "marketing_automation", r"hubspot\.com|hs-scripts\.com|hbspt\.forms|hs-analytics"),
    ("Marketo", "marketing_automation", r"marketo\.com|munchkin\.js|mktoForms"),
    ("Pardot", "marketing_automation", r"pardot\.com|pi\.pardot\.com"),
    ("ActiveCampaign", "marketing_automation", r"activecampaign\.com"),
    ("Mailchimp", "marketing_automation", r"mailchimp\.com|mc\.us\d+\.list-manage\.com"),
    ("Customer.io", "marketing_automation", r"customer\.io|customerioforms"),
    ("Brevo", "marketing_automation", r"brevo\.com|sendinblue\.com"),
    ("Apollo", "marketing_automation", r"apollo\.io|apollocdn\.com"),
    ("Outreach", "marketing_automation", r"outreach\.io"),
    ("Salesloft", "marketing_automation", r"salesloft\.com"),

    # Chat & support
    ("Intercom", "chat", r"intercom\.com|intercomcdn\.com|intercom\.io"),
    ("Drift", "chat", r"drift\.com|js\.driftt\.com"),
    ("Crisp", "chat", r"crisp\.chat|client\.crisp\.chat"),
    ("Zendesk", "chat", r"zendesk\.com|zdassets\.com"),
    ("Freshdesk", "chat", r"freshdesk\.com|freshchat\.com"),
    ("LiveChat", "chat", r"livechat\.com|livechatinc\.com"),
    ("Chatwoot", "chat", r"chatwoot\.com"),
    ("HelpScout", "chat", r"helpscout\.net|beacon-v2\.helpscout\.net"),

    # A/B testing & feature flags
    ("Optimizely", "ab_testing", r"optimizely\.com|cdn-pci\.optimizely\.com"),
    ("VWO", "ab_testing", r"visualwebsiteoptimizer\.com|vwo_code"),
    ("LaunchDarkly", "ab_testing", r"launchdarkly\.com|ld\.js"),
    ("Google Optimize", "ab_testing", r"optimize\.google\.com|OPT-[A-Z0-9]+"),
    ("Statsig", "ab_testing", r"statsig\.com"),
    ("Flagsmith", "ab_testing", r"flagsmith\.com"),

    # Session recording & heatmaps
    ("Hotjar", "session_recording", r"hotjar\.com|static\.hotjar\.com"),
    ("FullStory", "session_recording", r"fullstory\.com|fullstory\.org"),
    ("LogRocket", "session_recording", r"logrocket\.com|cdn\.lr-in\.com"),
    ("Microsoft Clarity", "session_recording", r"clarity\.ms"),
    ("Mouseflow", "session_recording", r"mouseflow\.com"),
    ("Smartlook", "session_recording", r"smartlook\.com"),

    # Enrichment & intent
    ("Clearbit", "enrichment", r"clearbit\.com|clearbit\.js"),
    ("6sense", "enrichment", r"6sense\.com|6sc\.co"),
    ("ZoomInfo", "enrichment", r"zoominfo\.com|ws\.zoominfo\.com"),
    ("Demandbase", "enrichment", r"demandbase\.com|tag\.demandbase\.com"),
    ("Bombora", "enrichment", r"bombora\.com"),
    ("RB2B", "enrichment", r"rb2b\.com"),

    # Ad pixels
    ("Meta Pixel", "ad_pixel", r"connect\.facebook\.net|fbq\(|facebook\.com/tr"),
    ("Google Ads", "ad_pixel", r"googleads\.g\.doubleclick\.net|AW-\d+|google_conversion"),
    ("LinkedIn Insight", "ad_pixel", r"snap\.licdn\.com|linkedin\.com/px|_linkedin_partner_id"),
    ("TikTok Pixel", "ad_pixel", r"analytics\.tiktok\.com|ttq\."),
    ("Twitter/X Pixel", "ad_pixel", r"static\.ads-twitter\.com|twq\("),
    ("Pinterest Tag", "ad_pixel", r"pintrk\(|ct\.pinterest\.com"),
    ("Reddit Pixel", "ad_pixel", r"rdt\(|alb\.reddit\.com"),
    ("Quora Pixel", "ad_pixel", r"qp\(|quora\.com/_/ad"),

    # CMS / framework
    ("Webflow", "platform", r"webflow\.com|website-files\.com|w-webflow"),
    ("WordPress", "platform", r"wp-content|wp-includes|wordpress"),
    ("Next.js", "platform", r"_next/static|__NEXT_DATA__|nextjs"),
    ("Gatsby", "platform", r"gatsby-"),
    ("Framer", "platform", r"framer\.com|framerusercontent\.com"),
    ("Squarespace", "platform", r"squarespace\.com|sqsp\.net"),
    ("Wix", "platform", r"wix\.com|wixstatic\.com|parastorage\.com"),
    ("Contentful", "platform", r"contentful\.com|ctfassets\.net"),
    ("Sanity", "platform", r"sanity\.io|cdn\.sanity\.io"),
    ("Ghost", "platform", r"ghost\.org|ghost\.io"),

    # Payments
    ("Stripe", "payments", r"stripe\.com|js\.stripe\.com"),
    ("Paddle", "payments", r"paddle\.com|cdn\.paddle\.com"),
    ("Chargebee", "payments", r"chargebee\.com|js\.chargebee\.com"),

    # Other GTM tools
    ("Typeform", "forms", r"typeform\.com"),
    ("Calendly", "scheduling", r"calendly\.com|assets\.calendly\.com"),
    ("Chilipiper", "scheduling", r"chilipiper\.com"),
    ("Qualified", "chat", r"qualified\.com"),
    ("Mutiny", "personalization", r"mutinyhq\.com|mutinycdn\.com"),
    ("RollWorks", "abm", r"rollworks\.com"),
]


def fetch_html(url, timeout=15):
    """Fetch HTML content from a URL."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()
        return resp.text, resp.url
    except requests.RequestException as e:
        print(f"  [ERROR] Failed to fetch {url}: {e}", file=sys.stderr)
        return None, url


def detect_tech_stack(html):
    """Scan HTML for known tool signatures."""
    found = {}
    for tool_name, category, pattern in TECH_PATTERNS:
        if re.search(pattern, html, re.IGNORECASE):
            if category not in found:
                found[category] = []
            found[category].append(tool_name)
    return found


def extract_ga_ids(html):
    """Extract Google Analytics measurement IDs."""
    ga4_ids = re.findall(r"G-[A-Z0-9]{6,12}", html)
    ua_ids = re.findall(r"UA-\d+-\d+", html)
    gtm_ids = re.findall(r"GTM-[A-Z0-9]+", html)
    ids = {}
    if ga4_ids:
        ids["ga4"] = list(set(ga4_ids))
    if ua_ids:
        ids["universal_analytics"] = list(set(ua_ids))
    if gtm_ids:
        ids["gtm"] = list(set(gtm_ids))
    return ids


def extract_images(html, base_url):
    """Extract all image URLs from img tags, background-image, srcset, og:image."""
    images = set()

    # <img src="...">
    for match in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE):
        images.add(match.group(1))

    # <img srcset="...">
    for match in re.finditer(r'srcset=["\']([^"\']+)["\']', html, re.IGNORECASE):
        for part in match.group(1).split(","):
            url = part.strip().split()[0]
            if url:
                images.add(url)

    # background-image: url(...)
    for match in re.finditer(r'background-image:\s*url\(["\']?([^"\'()]+)["\']?\)', html, re.IGNORECASE):
        images.add(match.group(1))

    # og:image, twitter:image
    for match in re.finditer(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:og:image|twitter:image)', html, re.IGNORECASE):
        images.add(match.group(1))
    for match in re.finditer(r'<meta[^>]+(?:og:image|twitter:image)[^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE):
        images.add(match.group(1))

    # Resolve relative URLs
    resolved = set()
    for img in images:
        if img.startswith("data:"):
            continue
        resolved.add(urljoin(base_url, img))

    return sorted(resolved)


def classify_images(images):
    """Attempt to classify images as logos vs other based on path/filename heuristics."""
    logos = []
    other = []
    for img in images:
        lower = img.lower()
        if any(kw in lower for kw in ["logo", "customer", "client", "partner", "trusted", "brand", "company"]):
            logos.append(img)
        elif lower.endswith(".svg") and not any(kw in lower for kw in ["icon", "arrow", "check", "close", "menu", "chevron"]):
            logos.append(img)
        else:
            other.append(img)
    return {"likely_logos": logos, "other_images": other}


def extract_seo_metadata(html, final_url):
    """Extract SEO-relevant metadata from HTML."""
    meta = {}

    # Title
    title_match = re.search(r"<title[^>]*>([^<]+)</title>", html, re.IGNORECASE)
    if title_match:
        meta["title"] = title_match.group(1).strip()

    # Meta description
    desc_match = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if not desc_match:
        desc_match = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']', html, re.IGNORECASE)
    if desc_match:
        meta["description"] = desc_match.group(1).strip()

    # Open Graph
    og = {}
    for match in re.finditer(r'<meta[^>]+property=["\']og:(\w+)["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE):
        og[match.group(1)] = match.group(2).strip()
    for match in re.finditer(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:(\w+)["\']', html, re.IGNORECASE):
        og[match.group(2)] = match.group(1).strip()
    if og:
        meta["open_graph"] = og

    # Twitter Card
    tw = {}
    for match in re.finditer(r'<meta[^>]+name=["\']twitter:(\w+)["\'][^>]+content=["\']([^"\']+)["\']', html, re.IGNORECASE):
        tw[match.group(1)] = match.group(2).strip()
    for match in re.finditer(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:(\w+)["\']', html, re.IGNORECASE):
        tw[match.group(2)] = match.group(1).strip()
    if tw:
        meta["twitter_card"] = tw

    # Canonical
    canonical = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if canonical:
        meta["canonical"] = canonical.group(1).strip()

    # Hreflang (international presence)
    hreflangs = re.findall(r'<link[^>]+hreflang=["\']([^"\']+)["\'][^>]+href=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if hreflangs:
        meta["hreflang"] = [{"lang": lang, "url": url} for lang, url in hreflangs]

    # JSON-LD structured data
    jsonld = []
    for match in re.finditer(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE):
        try:
            data = json.loads(match.group(1).strip())
            jsonld.append(data)
        except json.JSONDecodeError:
            pass
    if jsonld:
        meta["structured_data"] = jsonld

    # Heading hierarchy (H1-H3)
    headings = {}
    for level in range(1, 4):
        matches = re.findall(rf"<h{level}[^>]*>(.*?)</h{level}>", html, re.DOTALL | re.IGNORECASE)
        if matches:
            # Strip HTML tags from heading content
            cleaned = [re.sub(r"<[^>]+>", "", h).strip() for h in matches]
            cleaned = [h for h in cleaned if h]
            if cleaned:
                headings[f"h{level}"] = cleaned
    if headings:
        meta["headings"] = headings

    return meta


def extract_ctas(html):
    """Extract CTAs — button text and linked hrefs."""
    ctas = []

    # <a> tags with button-like classes or CTA keywords
    for match in re.finditer(
        r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>',
        html, re.DOTALL | re.IGNORECASE
    ):
        href = match.group(1)
        text = re.sub(r"<[^>]+>", "", match.group(2)).strip()
        if not text or len(text) > 80:
            continue
        text_lower = text.lower()
        if any(kw in text_lower for kw in [
            "start", "sign up", "signup", "get started", "try", "demo",
            "book", "schedule", "contact", "free", "pricing", "buy",
            "subscribe", "register", "join", "request", "talk to",
            "learn more", "watch", "download", "apply"
        ]):
            ctas.append({"text": text, "href": href})

    # <button> tags
    for match in re.finditer(r"<button[^>]*>(.*?)</button>", html, re.DOTALL | re.IGNORECASE):
        text = re.sub(r"<[^>]+>", "", match.group(1)).strip()
        if text and len(text) < 80:
            text_lower = text.lower()
            if any(kw in text_lower for kw in [
                "start", "sign up", "signup", "get started", "try", "demo",
                "book", "schedule", "contact", "free", "buy", "subscribe"
            ]):
                ctas.append({"text": text, "href": None})

    # Deduplicate by text
    seen = set()
    unique = []
    for cta in ctas:
        if cta["text"] not in seen:
            seen.add(cta["text"])
            unique.append(cta)
    return unique


def infer_sales_motion(ctas):
    """Infer PLG vs sales-led from CTA patterns."""
    texts = " ".join([c["text"].lower() for c in ctas])
    signals = {
        "plg": [],
        "sales_led": [],
    }
    if any(kw in texts for kw in ["start free", "try free", "free trial", "get started free", "sign up free"]):
        signals["plg"].append("free trial / signup CTAs")
    if any(kw in texts for kw in ["book a demo", "schedule a demo", "request a demo", "talk to sales", "contact sales"]):
        signals["sales_led"].append("demo / sales CTAs")
    if any(kw in texts for kw in ["pricing", "see pricing", "view pricing"]):
        signals["plg"].append("self-serve pricing page")

    if signals["plg"] and not signals["sales_led"]:
        return {"motion": "product-led (PLG)", "signals": signals["plg"]}
    elif signals["sales_led"] and not signals["plg"]:
        return {"motion": "sales-led", "signals": signals["sales_led"]}
    elif signals["plg"] and signals["sales_led"]:
        return {"motion": "hybrid (PLG + sales)", "signals": signals["plg"] + signals["sales_led"]}
    return {"motion": "unclear", "signals": []}


def extract_social_proof(html):
    """Extract testimonials, customer counts, and social proof signals."""
    proof = {}

    # Customer counts like "500+ companies", "10,000+ teams"
    counts = re.findall(r"([\d,]+\+?\s*(?:companies|teams|customers|users|businesses|organizations|brands))", html, re.IGNORECASE)
    if counts:
        proof["customer_counts"] = [c.strip() for c in counts]

    # Case study links
    case_studies = re.findall(r'href=["\']([^"\']*(?:case-stud|customer-stor|success-stor)[^"\']*)["\']', html, re.IGNORECASE)
    if case_studies:
        proof["case_study_links"] = list(set(case_studies))

    return proof


def extract_hidden_elements(html):
    """Find potentially interesting hidden content and HTML comments."""
    hidden = {}

    # HTML comments (filter out trivial ones)
    comments = re.findall(r"<!--(.*?)-->", html, re.DOTALL)
    interesting_comments = []
    for c in comments:
        c = c.strip()
        if len(c) > 10 and len(c) < 500:
            # Filter out common build/framework comments
            if not any(skip in c.lower() for skip in [
                "google tag", "end google", "begin", "endif",
                "[if ", "<!-", "webpack", "chunk", "module"
            ]):
                interesting_comments.append(c)
    if interesting_comments:
        hidden["html_comments"] = interesting_comments[:20]

    # Data attributes that might reveal feature flags or experiments
    experiments = re.findall(r'data-(?:experiment|variant|feature|flag|test)[=\-]["\']?([^"\'>\s]+)', html, re.IGNORECASE)
    if experiments:
        hidden["experiments_or_flags"] = list(set(experiments))

    return hidden


def extract_integration_links(html, base_url):
    """Find links to integration/partner pages."""
    links = set()
    for match in re.finditer(r'href=["\']([^"\']*(?:integrat|partner|ecosystem|marketplace|app-store|connect)[^"\']*)["\']', html, re.IGNORECASE):
        url = urljoin(base_url, match.group(1))
        links.add(url)
    return sorted(links) if links else []


def scrape_page(url, pages, timeout=15):
    """Scrape one or more pages of a site and aggregate results."""
    parsed = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    domain = parsed.netloc

    all_html = ""
    pages_fetched = []

    for page_path in pages:
        page_url = base_url + page_path if page_path != "/" else url
        print(f"Fetching: {page_url}", file=sys.stderr)
        html, final_url = fetch_html(page_url, timeout=timeout)
        if html:
            all_html += "\n" + html
            pages_fetched.append(final_url)
        else:
            print(f"  [SKIP] Could not fetch {page_url}", file=sys.stderr)

    if not all_html:
        print("[ERROR] No pages could be fetched.", file=sys.stderr)
        sys.exit(1)

    print(f"Analyzing {len(pages_fetched)} page(s)...", file=sys.stderr)

    # Extract everything
    tech_stack = detect_tech_stack(all_html)
    ga_ids = extract_ga_ids(all_html)
    images = extract_images(all_html, base_url)
    classified = classify_images(images)
    seo = extract_seo_metadata(all_html, url)
    ctas = extract_ctas(all_html)
    sales_motion = infer_sales_motion(ctas)
    social_proof = extract_social_proof(all_html)
    hidden = extract_hidden_elements(all_html)
    integrations = extract_integration_links(all_html, base_url)

    report = {
        "url": url,
        "domain": domain,
        "pages_scanned": pages_fetched,
        "tech_stack": tech_stack,
        "seo_metadata": seo,
        "ctas": ctas,
        "sales_motion": sales_motion,
        "social_proof": social_proof,
        "images": {
            "likely_logos": classified["likely_logos"],
            "total_images_found": len(images),
        },
        "integration_links": integrations,
        "hidden_elements": hidden,
    }

    if ga_ids:
        report["google_ids"] = ga_ids

    return report


def format_summary(report):
    """Format report as a human-readable summary."""
    lines = []
    lines.append(f"{'='*70}")
    lines.append(f"LANDING PAGE INTEL: {report['domain']}")
    lines.append(f"{'='*70}")
    lines.append(f"Pages scanned: {', '.join(report['pages_scanned'])}")
    lines.append("")

    # Tech stack
    if report.get("tech_stack"):
        lines.append("TECH STACK")
        lines.append("-" * 40)
        for category, tools in report["tech_stack"].items():
            label = category.replace("_", " ").title()
            lines.append(f"  {label}: {', '.join(tools)}")
        lines.append("")

    # Google IDs
    if report.get("google_ids"):
        lines.append("GOOGLE IDs")
        lines.append("-" * 40)
        for id_type, ids in report["google_ids"].items():
            lines.append(f"  {id_type}: {', '.join(ids)}")
        lines.append("")

    # SEO
    if report.get("seo_metadata"):
        lines.append("SEO METADATA")
        lines.append("-" * 40)
        seo = report["seo_metadata"]
        if seo.get("title"):
            lines.append(f"  Title: {seo['title']}")
        if seo.get("description"):
            lines.append(f"  Description: {seo['description'][:120]}...")
        if seo.get("canonical"):
            lines.append(f"  Canonical: {seo['canonical']}")
        if seo.get("headings", {}).get("h1"):
            lines.append(f"  H1: {seo['headings']['h1'][0]}")
        if seo.get("hreflang"):
            langs = [h["lang"] for h in seo["hreflang"]]
            lines.append(f"  Languages: {', '.join(langs)}")
        lines.append("")

    # Sales motion
    if report.get("sales_motion"):
        lines.append("SALES MOTION")
        lines.append("-" * 40)
        sm = report["sales_motion"]
        lines.append(f"  Inferred: {sm['motion']}")
        if sm.get("signals"):
            lines.append(f"  Signals: {', '.join(sm['signals'])}")
        lines.append("")

    # CTAs
    if report.get("ctas"):
        lines.append("CTAs FOUND")
        lines.append("-" * 40)
        for cta in report["ctas"][:10]:
            href = f" -> {cta['href']}" if cta.get("href") else ""
            lines.append(f"  [{cta['text']}]{href}")
        lines.append("")

    # Social proof
    if report.get("social_proof"):
        lines.append("SOCIAL PROOF")
        lines.append("-" * 40)
        sp = report["social_proof"]
        if sp.get("customer_counts"):
            lines.append(f"  Counts: {', '.join(sp['customer_counts'])}")
        if sp.get("case_study_links"):
            for link in sp["case_study_links"][:5]:
                lines.append(f"  Case study: {link}")
        lines.append("")

    # Logos
    if report.get("images", {}).get("likely_logos"):
        lines.append(f"LIKELY LOGOS ({len(report['images']['likely_logos'])} found)")
        lines.append("-" * 40)
        for logo in report["images"]["likely_logos"][:15]:
            lines.append(f"  {logo}")
        lines.append("")

    # Integrations
    if report.get("integration_links"):
        lines.append(f"INTEGRATION LINKS ({len(report['integration_links'])} found)")
        lines.append("-" * 40)
        for link in report["integration_links"][:10]:
            lines.append(f"  {link}")
        lines.append("")

    # Hidden
    if report.get("hidden_elements"):
        h = report["hidden_elements"]
        if h.get("html_comments"):
            lines.append(f"INTERESTING HTML COMMENTS ({len(h['html_comments'])})")
            lines.append("-" * 40)
            for comment in h["html_comments"][:5]:
                lines.append(f"  <!-- {comment[:100]} -->")
            lines.append("")
        if h.get("experiments_or_flags"):
            lines.append("EXPERIMENTS / FEATURE FLAGS")
            lines.append("-" * 40)
            for flag in h["experiments_or_flags"][:10]:
                lines.append(f"  {flag}")
            lines.append("")

    lines.append(f"Total images found: {report.get('images', {}).get('total_images_found', 0)}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Extract competitor & customer intelligence from a landing page",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --url "https://example.com"
  %(prog)s --url "https://example.com" --pages "/,/pricing,/about"
  %(prog)s --url "https://example.com" --output summary
""",
    )

    parser.add_argument("--url", required=True, help="Target website URL")
    parser.add_argument("--pages", default="/",
                        help='Comma-separated paths to scan (default: "/")')
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--timeout", type=int, default=15,
                        help="Request timeout in seconds (default: 15)")

    args = parser.parse_args()

    url = args.url.rstrip("/")
    if not url.startswith("http"):
        url = "https://" + url

    pages = [p.strip() for p in args.pages.split(",") if p.strip()]

    report = scrape_page(url, pages, timeout=args.timeout)

    if args.output == "summary":
        print(format_summary(report))
    else:
        print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
