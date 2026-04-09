#!/usr/bin/env python3
"""
Pull real SEO metrics for any domain using Apify scrapers for Semrush/Ahrefs data.
Gets domain authority, traffic estimates, keyword rankings, backlinks, and competitor discovery.

Usage:
  python3 analyze_domain.py --domain "example.com"
  python3 analyze_domain.py --domain "example.com" --competitors "comp1.com,comp2.com"
  python3 analyze_domain.py --domain "example.com" --keywords "keyword1,keyword2"
"""

import json
import os
import sys
import argparse
import time as time_mod
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    print("Error: requests library required. Install with: pip install requests", file=sys.stderr)
    sys.exit(1)

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    APIFY_BASE = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    APIFY_BASE = "https://api.apify.com/v2"

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; SEOAnalyzerBot/1.0)"}

# Apify actor IDs
SEMRUSH_ACTOR = "devnaz~semrush-scraper"
AHREFS_ACTOR = "radeance~ahrefs-scraper"
GOOGLE_SEARCH_ACTOR = "apify~google-search-scraper"


def run_apify_actor(actor_id, input_data, token, timeout=120):
    """Run an Apify actor and return the results."""
    print(f"  Running Apify actor: {actor_id}...", file=sys.stderr)

    try:
        resp = requests.post(
            f"{APIFY_BASE}/acts/{actor_id}/runs",
            json=input_data,
            params={"token": token},
            timeout=30,
        )
        resp.raise_for_status()
        run_id = resp.json()["data"]["id"]
        print(f"  Run started (ID: {run_id})", file=sys.stderr)

        # Poll for completion
        deadline = time_mod.time() + timeout
        status_data = None
        while time_mod.time() < deadline:
            status_resp = requests.get(
                f"{APIFY_BASE}/acts/{actor_id}/runs/{run_id}",
                params={"token": token},
                timeout=15,
            )
            status_resp.raise_for_status()
            status_data = status_resp.json()
            status = status_data["data"]["status"]

            if status == "SUCCEEDED":
                print(f"  Actor completed successfully.", file=sys.stderr)
                break
            elif status in ("FAILED", "ABORTED", "TIMED-OUT"):
                print(f"  [WARN] Actor run {status}", file=sys.stderr)
                return None
            time_mod.sleep(3)
        else:
            print(f"  [WARN] Actor timed out after {timeout}s", file=sys.stderr)
            return None

        # Fetch dataset
        dataset_id = status_data["data"]["defaultDatasetId"]
        items_resp = requests.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            params={"token": token, "format": "json"},
            timeout=30,
        )
        items_resp.raise_for_status()
        return items_resp.json()

    except Exception as e:
        print(f"  [ERROR] Apify actor {actor_id} failed: {e}", file=sys.stderr)
        return None


# --- Phase 1: Semrush Domain Overview ---

def fetch_semrush_data(domain, token):
    """Get domain overview from Semrush via Apify scraper."""
    print("\n--- Fetching Semrush Data ---", file=sys.stderr)

    # Try current actor input format (domains field)
    input_data = {
        "domains": [domain]
    }

    results = run_apify_actor(SEMRUSH_ACTOR, input_data, token, timeout=120)

    if not results:
        print("  [WARN] No Semrush data returned, trying alternate input format...", file=sys.stderr)
        # Try legacy input format (urls field)
        input_data = {"urls": [f"https://www.semrush.com/analytics/overview/?q={domain}&searchType=domain"]}
        results = run_apify_actor(SEMRUSH_ACTOR, input_data, token, timeout=120)

    if not results or len(results) == 0:
        return None

    # Extract metrics from the first result
    data = results[0] if isinstance(results, list) else results

    return {
        "authority_score": data.get("authorityScore") or data.get("authority_score"),
        "organic_traffic": data.get("organicTraffic") or data.get("organic_traffic") or data.get("monthlyVisits"),
        "organic_keywords": data.get("organicKeywords") or data.get("organic_keywords"),
        "paid_traffic": data.get("paidTraffic") or data.get("paid_traffic"),
        "backlinks": data.get("backlinks") or data.get("totalBacklinks"),
        "referring_domains": data.get("referringDomains") or data.get("referring_domains"),
        "bounce_rate": data.get("bounceRate") or data.get("bounce_rate"),
        "top_keywords": data.get("topKeywords") or data.get("top_keywords") or [],
        "top_competitors": data.get("topCompetitors") or data.get("competitors") or [],
        "raw": data,
    }


# --- Phase 2: Ahrefs Backlink Profile ---

def fetch_ahrefs_data(domain, token):
    """Get backlink profile from Ahrefs via Apify scraper."""
    print("\n--- Fetching Ahrefs Data ---", file=sys.stderr)

    input_data = {
        "urls": [f"https://ahrefs.com/website-authority-checker/?input={domain}"]
    }

    results = run_apify_actor(AHREFS_ACTOR, input_data, token, timeout=120)

    if not results:
        print("  [WARN] No Ahrefs data returned, trying alternate format...", file=sys.stderr)
        input_data = {"urls": [f"https://{domain}"]}
        results = run_apify_actor(AHREFS_ACTOR, input_data, token, timeout=120)

    if not results or len(results) == 0:
        return None

    data = results[0] if isinstance(results, list) else results

    return {
        "domain_rating": data.get("domainRating") or data.get("domain_rating") or data.get("DR"),
        "url_rating": data.get("urlRating") or data.get("url_rating"),
        "backlinks": data.get("backlinks") or data.get("totalBacklinks"),
        "referring_domains": data.get("referringDomains") or data.get("referring_domains"),
        "dofollow_backlinks": data.get("dofollowBacklinks"),
        "top_referring_domains": data.get("topReferringDomains") or [],
        "raw": data,
    }


# --- Phase 3: Google SERP Rank Checks ---

def check_keyword_rankings(domain, keywords, token):
    """Check where the domain ranks for specific keywords via Google search."""
    print(f"\n--- Checking Rankings for {len(keywords)} Keywords ---", file=sys.stderr)

    rankings = []

    for keyword in keywords:
        print(f"  Checking: '{keyword}'", file=sys.stderr)

        input_data = {
            "queries": keyword,
            "maxPagesPerQuery": 1,
            "resultsPerPage": 10,
            "countryCode": "us",
            "languageCode": "en",
        }

        results = run_apify_actor(GOOGLE_SEARCH_ACTOR, input_data, token, timeout=60)

        ranking = {
            "keyword": keyword,
            "position": None,
            "url": None,
            "serp_competitors": [],
        }

        if results:
            for item in results:
                # Handle different response formats
                organic_results = item.get("organicResults") or item.get("results") or []
                if isinstance(item, dict) and "position" in item:
                    # Flat format: each result is a separate item
                    organic_results = results
                    pos = item.get("position", 0)
                    url = item.get("url") or item.get("link", "")
                    title = item.get("title", "")

                    if domain in url:
                        if ranking["position"] is None or pos < ranking["position"]:
                            ranking["position"] = pos
                            ranking["url"] = url
                    else:
                        from urllib.parse import urlparse
                        comp_domain = urlparse(url).netloc.replace("www.", "")
                        if comp_domain and comp_domain != domain:
                            ranking["serp_competitors"].append(comp_domain)
                    continue

                for idx, result in enumerate(organic_results):
                    url = result.get("url") or result.get("link", "")
                    if domain in url:
                        ranking["position"] = idx + 1
                        ranking["url"] = url
                    else:
                        from urllib.parse import urlparse
                        comp_domain = urlparse(url).netloc.replace("www.", "")
                        if comp_domain and comp_domain != domain:
                            ranking["serp_competitors"].append(comp_domain)
                break  # Only process first result set

        # Deduplicate SERP competitors
        ranking["serp_competitors"] = list(dict.fromkeys(ranking["serp_competitors"]))[:10]
        rankings.append(ranking)

        # Small delay between searches
        time_mod.sleep(1)

    return rankings


# --- Free Fallback: Web Search Probes ---

def free_seo_probes(domain):
    """Fallback: use WebSearch-style probes without Apify (limited data)."""
    print("\n--- Running Free SEO Probes (no Apify) ---", file=sys.stderr)

    probes = {}

    # Check site indexation
    try:
        resp = requests.get(
            f"https://www.google.com/search?q=site:{domain}",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10,
        )
        # Rough estimate from result count
        probes["indexed_pages_estimate"] = "Check manually: site:" + domain
    except Exception:
        pass

    # Check SimilarWeb (free)
    try:
        resp = requests.get(
            f"https://www.similarweb.com/website/{domain}/",
            headers=HEADERS,
            timeout=10,
        )
        if resp.status_code == 200:
            probes["similarweb_accessible"] = True
        else:
            probes["similarweb_accessible"] = False
    except Exception:
        probes["similarweb_accessible"] = False

    return probes


# --- Main Analysis ---

def analyze_domain(domain, competitors=None, keywords=None, token=None, skip_backlinks=False):
    """Run full SEO domain analysis."""
    print(f"Analyzing SEO for: {domain}", file=sys.stderr)

    result = {
        "domain": domain,
        "analysis_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "domain_metrics": {},
        "backlink_profile": {},
        "keyword_rankings": [],
        "top_pages": [],
        "competitors": [],
        "data_sources": [],
    }

    if token:
        # Phase 1: Semrush data
        semrush = fetch_semrush_data(domain, token)
        if semrush:
            result["data_sources"].append("semrush-apify")
            result["domain_metrics"] = {
                "semrush_authority_score": semrush.get("authority_score"),
                "organic_monthly_traffic": semrush.get("organic_traffic"),
                "organic_keywords": semrush.get("organic_keywords"),
                "paid_traffic": semrush.get("paid_traffic"),
                "backlinks_semrush": semrush.get("backlinks"),
                "referring_domains_semrush": semrush.get("referring_domains"),
                "bounce_rate": semrush.get("bounce_rate"),
            }
            # Extract top keywords from Semrush for rank checking
            semrush_keywords = semrush.get("top_keywords", [])
            if isinstance(semrush_keywords, list):
                for kw in semrush_keywords[:10]:
                    if isinstance(kw, dict):
                        kw_text = kw.get("keyword") or kw.get("text")
                        if kw_text and (not keywords or kw_text not in keywords):
                            if keywords is None:
                                keywords = []
                            keywords.append(kw_text)
                    elif isinstance(kw, str):
                        if keywords is None:
                            keywords = []
                        keywords.append(kw)

            # Extract auto-discovered competitors
            semrush_competitors = semrush.get("top_competitors", [])
            if isinstance(semrush_competitors, list):
                for comp in semrush_competitors:
                    comp_domain = comp.get("domain") or comp if isinstance(comp, str) else None
                    if comp_domain:
                        if competitors is None:
                            competitors = []
                        if comp_domain not in competitors:
                            competitors.append(comp_domain)

        # Phase 2: Ahrefs backlink data
        if not skip_backlinks:
            ahrefs = fetch_ahrefs_data(domain, token)
            if ahrefs:
                result["data_sources"].append("ahrefs-apify")
                result["backlink_profile"] = {
                    "domain_rating": ahrefs.get("domain_rating"),
                    "url_rating": ahrefs.get("url_rating"),
                    "total_backlinks": ahrefs.get("backlinks"),
                    "referring_domains": ahrefs.get("referring_domains"),
                    "dofollow_backlinks": ahrefs.get("dofollow_backlinks"),
                    "top_referring_domains": ahrefs.get("top_referring_domains", [])[:20],
                }
                # Merge DR into domain_metrics
                if ahrefs.get("domain_rating"):
                    result["domain_metrics"]["ahrefs_domain_rating"] = ahrefs["domain_rating"]

        # Phase 3: Keyword rank checks
        if keywords:
            # Limit to 30 keywords to control cost
            keywords_to_check = keywords[:30]
            result["keyword_rankings"] = check_keyword_rankings(domain, keywords_to_check, token)
            result["data_sources"].append("google-serp-apify")

            # Discover competitors from SERP results
            serp_competitors = {}
            for kr in result["keyword_rankings"]:
                for comp in kr.get("serp_competitors", []):
                    serp_competitors[comp] = serp_competitors.get(comp, 0) + 1
            # Sort by frequency
            top_serp_competitors = sorted(serp_competitors.items(), key=lambda x: -x[1])
            for comp_domain, count in top_serp_competitors[:5]:
                if competitors is None:
                    competitors = []
                if comp_domain not in competitors and comp_domain != domain:
                    competitors.append(comp_domain)

        # Phase 4: Competitor overview (lighter analysis)
        if competitors:
            print(f"\n--- Analyzing {len(competitors[:5])} Competitors ---", file=sys.stderr)
            for comp_domain in competitors[:5]:
                print(f"\n  Competitor: {comp_domain}", file=sys.stderr)
                comp_semrush = fetch_semrush_data(comp_domain, token)
                comp_data = {
                    "domain": comp_domain,
                    "authority_score": None,
                    "organic_traffic": None,
                    "organic_keywords": None,
                }
                if comp_semrush:
                    comp_data["authority_score"] = comp_semrush.get("authority_score")
                    comp_data["organic_traffic"] = comp_semrush.get("organic_traffic")
                    comp_data["organic_keywords"] = comp_semrush.get("organic_keywords")
                result["competitors"].append(comp_data)

    else:
        # Free fallback
        print("\n[INFO] No APIFY_API_TOKEN found. Running in free probe mode.", file=sys.stderr)
        result["data_sources"].append("free-probes")
        probes = free_seo_probes(domain)
        result["domain_metrics"]["free_probes"] = probes
        result["domain_metrics"]["note"] = "Limited data without Apify. Set APIFY_API_TOKEN for full analysis."

    return result


def format_markdown(result):
    """Generate Markdown report from analysis results."""
    lines = []
    d = result["domain"]
    lines.append(f"# SEO Domain Profile: {d}")
    lines.append(f"**Date:** {result['analysis_date']} | **Data sources:** {', '.join(result['data_sources'])}")
    lines.append("")

    # Domain metrics
    dm = result["domain_metrics"]
    lines.append("## Domain Metrics")
    lines.append("| Metric | Value |")
    lines.append("|--------|-------|")
    if dm.get("semrush_authority_score") is not None:
        lines.append(f"| Semrush Authority Score | {dm['semrush_authority_score']}/100 |")
    if dm.get("ahrefs_domain_rating") is not None:
        lines.append(f"| Ahrefs Domain Rating | {dm['ahrefs_domain_rating']}/100 |")
    if dm.get("organic_monthly_traffic") is not None:
        lines.append(f"| Monthly Organic Traffic | ~{dm['organic_monthly_traffic']:,} |")
    if dm.get("organic_keywords") is not None:
        lines.append(f"| Organic Keywords | {dm['organic_keywords']:,} |")
    if dm.get("backlinks_semrush") is not None:
        lines.append(f"| Backlinks (Semrush) | {dm['backlinks_semrush']:,} |")
    if dm.get("referring_domains_semrush") is not None:
        lines.append(f"| Referring Domains | {dm['referring_domains_semrush']:,} |")
    if dm.get("paid_traffic") is not None:
        lines.append(f"| Paid Traffic | ~{dm['paid_traffic']:,} |")
    lines.append("")

    # Backlink profile
    bp = result.get("backlink_profile", {})
    if bp:
        lines.append("## Backlink Profile")
        lines.append("| Metric | Value |")
        lines.append("|--------|-------|")
        if bp.get("domain_rating") is not None:
            lines.append(f"| Domain Rating | {bp['domain_rating']}/100 |")
        if bp.get("total_backlinks") is not None:
            lines.append(f"| Total Backlinks | {bp['total_backlinks']:,} |")
        if bp.get("referring_domains") is not None:
            lines.append(f"| Referring Domains | {bp['referring_domains']:,} |")
        if bp.get("top_referring_domains"):
            top_refs = ", ".join(str(r) for r in bp["top_referring_domains"][:10])
            lines.append(f"| Top Referring Domains | {top_refs} |")
        lines.append("")

    # Keyword rankings
    kr = result.get("keyword_rankings", [])
    if kr:
        lines.append("## Keyword Rankings")
        lines.append("| Keyword | Position | URL | SERP Competitors |")
        lines.append("|---------|----------|-----|-----------------|")
        for k in kr:
            pos = f"#{k['position']}" if k["position"] else "Not in top 10"
            url = k.get("url") or "—"
            comps = ", ".join(k.get("serp_competitors", [])[:5])
            lines.append(f"| {k['keyword']} | {pos} | {url} | {comps} |")
        lines.append("")

    # Competitors
    comps = result.get("competitors", [])
    if comps:
        lines.append("## Competitor Comparison")
        lines.append("| Domain | Authority | Traffic | Keywords |")
        lines.append("|--------|-----------|---------|----------|")
        # Add target first
        lines.append(f"| **{d}** | {dm.get('semrush_authority_score', '—')} | {dm.get('organic_monthly_traffic', '—')} | {dm.get('organic_keywords', '—')} |")
        for c in comps:
            lines.append(f"| {c['domain']} | {c.get('authority_score', '—')} | {c.get('organic_traffic', '—')} | {c.get('organic_keywords', '—')} |")
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Analyze a domain's SEO metrics using Apify Semrush/Ahrefs scrapers",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--domain", required=True, help="Domain to analyze (e.g., example.com)")
    parser.add_argument("--competitors", help="Comma-separated competitor domains")
    parser.add_argument("--keywords", help="Comma-separated keywords to check rankings for")
    parser.add_argument("--output", help="Path to save JSON output (default: stdout)")
    parser.add_argument("--markdown", help="Path to save Markdown report")
    parser.add_argument("--skip-backlinks", action="store_true", help="Skip Ahrefs backlink analysis")
    parser.add_argument("--apify-token", help="Apify API token (or set APIFY_API_TOKEN)")

    args = parser.parse_args()

    domain = args.domain.replace("https://", "").replace("http://", "").rstrip("/")
    competitors = [c.strip() for c in args.competitors.split(",") if c.strip()] if args.competitors else None
    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()] if args.keywords else None
    token = args.apify_token or GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")

    result = analyze_domain(
        domain=domain,
        competitors=competitors,
        keywords=keywords,
        token=token,
        skip_backlinks=args.skip_backlinks,
    )

    # JSON output
    if args.output:
        os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
        with open(args.output, "w") as f:
            json.dump(result, f, indent=2, default=str)
        print(f"JSON saved to: {args.output}", file=sys.stderr)
    else:
        print(json.dumps(result, indent=2, default=str))

    # Markdown output
    if args.markdown:
        md = format_markdown(result)
        os.makedirs(os.path.dirname(args.markdown) or ".", exist_ok=True)
        with open(args.markdown, "w") as f:
            f.write(md)
        print(f"Markdown saved to: {args.markdown}", file=sys.stderr)


if __name__ == "__main__":
    main()
