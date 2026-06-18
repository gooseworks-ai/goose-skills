#!/usr/bin/env python3
"""
search_newsletters.py — Helper script for the newsletter-sponsorship-finder skill.

Searches the Substack directory for newsletters matching given keywords and
returns structured results. This is a supplementary tool; the main discovery
is done by the agent using WebSearch and WebFetch.

Usage:
    python3 search_newsletters.py --keywords "cloud,AWS,DevOps,infrastructure" --output json
    python3 search_newsletters.py --keywords "fintech,banking" --output table
"""

import argparse
import json
import sys

try:
    import requests
except ImportError:
    print(
        json.dumps(
            {
                "error": "requests library not installed. Run: pip3 install requests",
                "results": [],
            }
        )
    )
    sys.exit(1)


SUBSTACK_SEARCH_URL = "https://substack.com/api/v1/publication/search"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}


def search_substack(keyword: str, limit: int = 20) -> list[dict]:
    """Search Substack for newsletters matching a keyword."""
    try:
        resp = requests.get(
            SUBSTACK_SEARCH_URL,
            params={"query": keyword, "page": 0, "limit": limit},
            headers=HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        results = []
        publications = data if isinstance(data, list) else data.get("results", data.get("publications", []))

        for pub in publications:
            if isinstance(pub, dict):
                results.append(
                    {
                        "name": pub.get("name", "Unknown"),
                        "author": pub.get("author_name", pub.get("author", {}).get("name", "Unknown")),
                        "description": pub.get("description", pub.get("hero_text", "")),
                        "url": pub.get("custom_domain") or pub.get("custom_domain_optional") or f"https://{pub.get('subdomain', 'unknown')}.substack.com",
                        "subscribers": pub.get("subscriber_count", pub.get("rankingDetail", {}).get("subscribers", "N/A")),
                        "type": pub.get("type", "newsletter"),
                        "keyword": keyword,
                    }
                )
        return results

    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 403:
            return [{"note": f"Substack blocked the request for '{keyword}'. Try WebSearch instead.", "keyword": keyword, "results": []}]
        return [{"error": f"HTTP error searching for '{keyword}': {e}", "keyword": keyword, "results": []}]
    except requests.exceptions.RequestException as e:
        return [{"error": f"Request failed for '{keyword}': {e}", "keyword": keyword, "results": []}]
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        return [{"error": f"Failed to parse Substack response for '{keyword}': {e}", "keyword": keyword, "results": []}]


def format_table(results: list[dict]) -> str:
    """Format results as a readable table."""
    if not results:
        return "No results found."

    lines = [
        f"{'Name':<40} {'Author':<25} {'Subscribers':<15} {'URL'}",
        "-" * 120,
    ]
    for r in results:
        if "error" in r or "note" in r:
            lines.append(r.get("error", r.get("note", "")))
            continue
        name = (r.get("name", "Unknown"))[:38]
        author = (r.get("author", "Unknown"))[:23]
        subs = str(r.get("subscribers", "N/A"))[:13]
        url = r.get("url", "")
        lines.append(f"{name:<40} {author:<25} {subs:<15} {url}")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Search Substack for newsletters matching keywords."
    )
    parser.add_argument(
        "--keywords",
        required=True,
        help="Comma-separated keywords to search for (e.g., 'cloud,AWS,DevOps')",
    )
    parser.add_argument(
        "--output",
        choices=["json", "table"],
        default="json",
        help="Output format: json or table (default: json)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Max results per keyword (default: 20)",
    )
    args = parser.parse_args()

    keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]

    all_results = []
    seen_urls = set()

    for kw in keywords:
        results = search_substack(kw, limit=args.limit)
        for r in results:
            url = r.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_results.append(r)
            elif "error" in r or "note" in r:
                all_results.append(r)

    if args.output == "json":
        print(json.dumps({"keywords": keywords, "total": len(all_results), "results": all_results}, indent=2))
    else:
        print(f"\nSubstack Newsletter Search: {', '.join(keywords)}")
        print(f"Found {len(all_results)} results\n")
        print(format_table(all_results))


if __name__ == "__main__":
    main()
