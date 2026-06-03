#!/usr/bin/env python3
"""Audit a website for llms.txt and AI crawler readiness."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Any


USER_AGENT = "goose-skills-llms-txt-auditor/1.0"
MAX_BODY_BYTES = 1_500_000


@dataclass
class FetchResult:
    url: str
    status: int | None
    content_type: str
    text: str
    error: str | None = None


def normalize_site(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("target is required")
    if not re.match(r"^https?://", value, re.I):
        value = "https://" + value
    parsed = urllib.parse.urlparse(value)
    if not parsed.netloc:
        raise ValueError(f"invalid target: {value}")
    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")


def fetch(url: str, timeout: int) -> FetchResult:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read(MAX_BODY_BYTES)
            content_type = response.headers.get("content-type", "")
            charset = response.headers.get_content_charset() or "utf-8"
            try:
                text = raw.decode(charset, errors="replace")
            except LookupError:
                text = raw.decode("utf-8", errors="replace")
            return FetchResult(
                url=response.geturl(),
                status=response.status,
                content_type=content_type,
                text=text,
            )
    except urllib.error.HTTPError as exc:
        raw = exc.read(min(MAX_BODY_BYTES, 100_000))
        text = raw.decode("utf-8", errors="replace")
        return FetchResult(
            url=exc.geturl(),
            status=exc.code,
            content_type=exc.headers.get("content-type", ""),
            text=text,
            error=str(exc),
        )
    except Exception as exc:
        return FetchResult(url=url, status=None, content_type="", text="", error=str(exc))


def extract_title(page: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", page, re.I | re.S)
    if not match:
        return ""
    return re.sub(r"\s+", " ", html.unescape(match.group(1))).strip()


def extract_meta(page: str) -> dict[str, str]:
    meta: dict[str, str] = {}
    for match in re.finditer(r"<meta\b([^>]+)>", page, re.I):
        attrs = parse_attrs(match.group(1))
        key = attrs.get("name") or attrs.get("property")
        content = attrs.get("content")
        if key and content:
            meta[key.lower()] = content.strip()
    return meta


def parse_attrs(fragment: str) -> dict[str, str]:
    attrs: dict[str, str] = {}
    for match in re.finditer(r'([\w:-]+)\s*=\s*([\'"])(.*?)\2', fragment, re.S):
        attrs[match.group(1).lower()] = html.unescape(match.group(3))
    return attrs


def extract_links(page: str, base_url: str) -> list[str]:
    links: list[str] = []
    base_host = urllib.parse.urlparse(base_url).netloc
    for match in re.finditer(r"<a\b[^>]*href\s*=\s*([\"'])(.*?)\1", page, re.I | re.S):
        href = html.unescape(match.group(2)).strip()
        if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        absolute = urllib.parse.urljoin(base_url + "/", href)
        parsed = urllib.parse.urlparse(absolute)
        if parsed.scheme in {"http", "https"}:
            netloc = parsed.netloc.split("&", 1)[0].split("?", 1)[0]
            query = parsed.query if netloc == base_host else ""
            clean = urllib.parse.urlunparse((parsed.scheme, netloc, parsed.path, "", query, ""))
            links.append(clean.rstrip("/") or clean)
    return sorted(set(links))


def extract_json_ld_types(page: str) -> list[str]:
    types: set[str] = set()
    for match in re.finditer(
        r"<script\b[^>]*type\s*=\s*([\"'])application/ld\+json\1[^>]*>(.*?)</script>",
        page,
        re.I | re.S,
    ):
        raw = html.unescape(match.group(2)).strip()
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        collect_json_ld_types(data, types)
    return sorted(types)


def collect_json_ld_types(value: Any, types: set[str]) -> None:
    if isinstance(value, dict):
        item_type = value.get("@type")
        if isinstance(item_type, str):
            types.add(item_type)
        elif isinstance(item_type, list):
            types.update(str(item) for item in item_type)
        for child in value.values():
            collect_json_ld_types(child, types)
    elif isinstance(value, list):
        for child in value:
            collect_json_ld_types(child, types)


def parse_robots(text: str) -> dict[str, Any]:
    sitemap_urls: list[str] = []
    ai_rules: list[str] = []
    current_agents: list[str] = []
    ai_agents = ("gptbot", "chatgpt-user", "claudebot", "perplexitybot", "google-extended")
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line or ":" not in line:
            continue
        key, value = [part.strip() for part in line.split(":", 1)]
        low_key = key.lower()
        low_value = value.lower()
        if low_key == "sitemap":
            sitemap_urls.append(value)
        elif low_key == "user-agent":
            current_agents = [low_value]
        elif low_key in {"allow", "disallow"} and any(agent in current_agents for agent in ai_agents):
            ai_rules.append(f"{current_agents[0]} {key}: {value}")
    return {"sitemap_urls": sitemap_urls, "ai_rules": ai_rules}


def parse_sitemap(text: str) -> list[str]:
    urls: list[str] = []
    try:
        root = ET.fromstring(text.encode("utf-8"))
    except ET.ParseError:
        return urls
    for element in root.iter():
        if element.tag.endswith("loc") and element.text:
            loc = element.text.strip()
            if loc.startswith(("http://", "https://")):
                urls.append(loc)
    return sorted(set(urls))[:250]


def score_audit(audit: dict[str, Any]) -> tuple[int, list[str], list[str]]:
    score = 100
    issues: list[str] = []
    recommendations: list[str] = []

    llms = audit["llms_txt"]
    if not llms["present"]:
        score -= 25
        issues.append("Missing llms.txt")
        recommendations.append("Publish an llms.txt file that links to docs, pricing, product, API, and case-study pages.")
    elif llms["line_count"] < 5:
        score -= 12
        issues.append("llms.txt is present but thin")
        recommendations.append("Expand llms.txt with clear sections for product docs, examples, support, pricing, and API references.")
    if not audit["robots_txt"]["present"]:
        score -= 8
        issues.append("Missing robots.txt")
        recommendations.append("Publish robots.txt with sitemap discovery and explicit crawler policy.")
    elif audit["robots_txt"]["ai_rules"]:
        score -= 10
        issues.append("robots.txt contains AI crawler-specific directives")
        recommendations.append("Review AI crawler rules and confirm they do not block pages intended for AI citations.")
    if not audit["sitemaps"]["urls"]:
        score -= 15
        issues.append("No sitemap URLs discovered")
        recommendations.append("Expose sitemap URLs in robots.txt and keep them current.")
    if not audit["homepage"]["title"]:
        score -= 8
        issues.append("Homepage title missing")
        recommendations.append("Add a concise homepage title that states the product category and brand.")
    if not audit["homepage"]["description"]:
        score -= 8
        issues.append("Homepage meta description missing")
        recommendations.append("Add a specific meta description that explains who the product helps and what it does.")
    if not audit["homepage"]["json_ld_types"]:
        score -= 8
        issues.append("Structured data not detected on homepage")
        recommendations.append("Add Organization, SoftwareApplication, Product, or WebSite structured data where appropriate.")
    if len(audit["discovered_priority_pages"]) < 3:
        score -= 8
        issues.append("Few priority pages discovered from homepage or sitemap")
        recommendations.append("Make docs, pricing, blog, integrations, and API pages discoverable through internal links and sitemap entries.")

    return max(score, 0), issues[:8], recommendations[:8]


def audit_site(target: str, timeout: int) -> dict[str, Any]:
    site = normalize_site(target)
    homepage = fetch(site + "/", timeout)
    robots = fetch(site + "/robots.txt", timeout)
    llms = fetch(site + "/llms.txt", timeout)

    robots_data = parse_robots(robots.text) if robots.status == 200 else {"sitemap_urls": [], "ai_rules": []}
    sitemap_candidates = robots_data["sitemap_urls"] or [site + "/sitemap.xml"]
    sitemap_urls: list[str] = []
    for sitemap_url in sitemap_candidates[:5]:
        result = fetch(sitemap_url, timeout)
        if result.status == 200:
            sitemap_urls.extend(parse_sitemap(result.text))

    page_links = extract_links(homepage.text, site) if homepage.status == 200 else []
    priority_keywords = (
        "docs",
        "documentation",
        "pricing",
        "api",
        "customers",
        "case-studies",
        "blog",
        "integrations",
        "features",
        "learn",
    )
    priority_pages = [
        url for url in sorted(set(page_links + sitemap_urls))
        if any(keyword in url.lower() for keyword in priority_keywords)
    ][:30]

    meta = extract_meta(homepage.text) if homepage.status == 200 else {}
    audit: dict[str, Any] = {
        "target": target,
        "site": site,
        "homepage": {
            "status": homepage.status,
            "final_url": homepage.url,
            "title": extract_title(homepage.text) if homepage.status == 200 else "",
            "description": meta.get("description", ""),
            "og_title": meta.get("og:title", ""),
            "og_description": meta.get("og:description", ""),
            "json_ld_types": extract_json_ld_types(homepage.text) if homepage.status == 200 else [],
            "internal_link_count": len([url for url in page_links if urllib.parse.urlparse(url).netloc == urllib.parse.urlparse(site).netloc]),
        },
        "llms_txt": {
            "present": llms.status == 200,
            "status": llms.status,
            "final_url": llms.url,
            "line_count": len([line for line in llms.text.splitlines() if line.strip()]) if llms.status == 200 else 0,
            "contains_markdown_links": bool(re.search(r"\[[^\]]+\]\([^)]+\)", llms.text)) if llms.status == 200 else False,
            "sample": "\n".join(llms.text.splitlines()[:12]) if llms.status == 200 else "",
        },
        "robots_txt": {
            "present": robots.status == 200,
            "status": robots.status,
            "sitemap_urls": robots_data["sitemap_urls"],
            "ai_rules": robots_data["ai_rules"],
        },
        "sitemaps": {
            "checked": sitemap_candidates[:5],
            "urls": sitemap_urls[:50],
            "url_count_sampled": len(sitemap_urls),
        },
        "discovered_priority_pages": priority_pages,
    }
    score, issues, recommendations = score_audit(audit)
    audit["score"] = score
    audit["grade"] = "A" if score >= 85 else "B" if score >= 70 else "C" if score >= 55 else "D"
    audit["issues"] = issues
    audit["recommendations"] = recommendations
    return audit


def as_markdown(audit: dict[str, Any]) -> str:
    lines = [
        f"# llms.txt Audit: {audit['site']}",
        "",
        f"Score: {audit['score']}/100 ({audit['grade']})",
        "",
        "## Top Issues",
    ]
    if audit["issues"]:
        lines.extend(f"- {issue}" for issue in audit["issues"])
    else:
        lines.append("- No major issues detected")
    lines.extend(["", "## Recommendations"])
    lines.extend(f"- {item}" for item in audit["recommendations"])
    lines.extend(["", "## Priority Pages Discovered"])
    for url in audit["discovered_priority_pages"][:12]:
        lines.append(f"- {url}")
    if not audit["discovered_priority_pages"]:
        lines.append("- None")
    lines.extend(["", "## Technical Signals"])
    lines.append(f"- llms.txt present: {audit['llms_txt']['present']}")
    lines.append(f"- robots.txt present: {audit['robots_txt']['present']}")
    lines.append(f"- sitemap URLs sampled: {audit['sitemaps']['url_count_sampled']}")
    lines.append(f"- homepage title: {audit['homepage']['title'] or 'missing'}")
    lines.append(f"- homepage meta description: {'present' if audit['homepage']['description'] else 'missing'}")
    lines.append(f"- structured data types: {', '.join(audit['homepage']['json_ld_types']) or 'none detected'}")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit llms.txt and AI crawler readiness.")
    parser.add_argument("target", help="Domain or URL to audit")
    parser.add_argument("--timeout", type=int, default=12, help="HTTP timeout in seconds")
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    args = parser.parse_args()

    try:
        audit = audit_site(args.target, args.timeout)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    if args.format == "markdown":
        print(as_markdown(audit))
    else:
        print(json.dumps(audit, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
