#!/usr/bin/env python3
"""Tool 2: Issues Scanner — Dissatisfaction Signal.

Searches competitor repo issues for keywords that indicate limitations,
feature requests, or users looking for alternatives.

Usage:
    python tools/gh_issues_scanner.py --repos "livekit/agents" --keywords "feature request,limitation"
    python tools/gh_issues_scanner.py --config config.yaml
"""

import argparse
import sys
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from tools.gh_common import (
    gh_search,
    batch_get_user_profiles,
    write_csv,
    parse_repos_arg,
    load_config,
    check_rate_limit,
    TMP_DIR,
)

DEFAULT_KEYWORDS = [
    "feature request",
    "missing",
    "doesn't support",
    "switching",
    "alternative",
    "limitation",
    "migrate",
    "replacement",
]


def search_issues(owner, repo, keyword, state="all", max_results=200):
    """Search issues in a repo for a specific keyword."""
    # Build search query
    q_parts = [f"repo:{owner}/{repo}", "is:issue"]
    if state in ("open", "closed"):
        q_parts.append(f"state:{state}")
    q_parts.append(f'"{keyword}"')

    query = urllib.parse.quote(" ".join(q_parts))
    items = gh_search(query, max_results=max_results)

    results = []
    for item in items:
        labels = [l.get("name", "") for l in item.get("labels", [])]
        body = item.get("body", "") or ""
        results.append({
            "issue_url": item.get("html_url", ""),
            "title": item.get("title", ""),
            "author_username": item.get("user", {}).get("login", ""),
            "labels": "; ".join(labels),
            "created_date": item.get("created_at", ""),
            "body_snippet": body[:300].replace("\n", " ").replace("\r", ""),
            "matched_keywords": keyword,
        })

    print(f"[issues] {owner}/{repo} keyword='{keyword}': {len(results)} results", file=sys.stderr)
    return results


def deduplicate_issues(all_issues):
    """Deduplicate issues by URL, merging matched_keywords."""
    seen = {}
    for issue in all_issues:
        url = issue["issue_url"]
        if url in seen:
            existing_keywords = seen[url]["matched_keywords"].split("; ")
            new_keyword = issue["matched_keywords"]
            if new_keyword not in existing_keywords:
                existing_keywords.append(new_keyword)
                seen[url]["matched_keywords"] = "; ".join(existing_keywords)
        else:
            seen[url] = issue.copy()

    return list(seen.values())


def run(repos, keywords=None, state="all", max_results_per_query=200, enrich=False, output=None):
    """Main logic for issue scanning."""
    keywords = keywords or DEFAULT_KEYWORDS
    output = output or str(TMP_DIR / "issues_dissatisfaction.csv")
    all_issues = []

    check_rate_limit()

    for owner, repo in repos:
        for keyword in keywords:
            results = search_issues(owner, repo, keyword, state, max_results_per_query)
            for r in results:
                r["source_repo"] = f"{owner}/{repo}"
            all_issues.extend(results)

    deduped = deduplicate_issues(all_issues)
    print(f"[issues] Total: {len(all_issues)} raw, {len(deduped)} after dedup", file=sys.stderr)

    if enrich and deduped:
        usernames = list({r["author_username"] for r in deduped if r["author_username"]})
        print(f"[enrich] Enriching {len(usernames)} issue authors...", file=sys.stderr)
        profiles = batch_get_user_profiles(usernames)
        profile_map = {p["login"]: p for p in profiles}

        for row in deduped:
            p = profile_map.get(row["author_username"], {})
            row["author_company"] = p.get("company", "")
            row["author_email"] = p.get("email", "")
            row["author_bio"] = p.get("bio", "")
    else:
        for row in deduped:
            row.update({"author_company": "", "author_email": "", "author_bio": ""})

    # Reorder columns
    ordered = []
    for row in deduped:
        ordered.append({
            "source_repo": row["source_repo"],
            "issue_url": row["issue_url"],
            "title": row["title"],
            "author_username": row["author_username"],
            "author_company": row.get("author_company", ""),
            "author_email": row.get("author_email", ""),
            "labels": row["labels"],
            "created_date": row["created_date"],
            "matched_keywords": row["matched_keywords"],
            "body_snippet": row["body_snippet"],
        })

    write_csv(ordered, output)
    return ordered


def main():
    parser = argparse.ArgumentParser(description="Issues Scanner — Dissatisfaction Signal")
    parser.add_argument("--repos", help="Comma-separated repos (owner/repo)")
    parser.add_argument("--keywords", help="Comma-separated keywords to search for")
    parser.add_argument("--config", help="YAML config file path")
    parser.add_argument("--state", default="all", choices=["all", "open", "closed"])
    parser.add_argument("--max-results", type=int, default=200)
    parser.add_argument("--enrich", action="store_true")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    if args.config:
        cfg = load_config(args.config)
        repos = [tuple(r.split("/")) for r in cfg.get("repos", [])]
        keywords = cfg.get("keywords", DEFAULT_KEYWORDS)
        state = cfg.get("state", args.state)
        max_results = cfg.get("max_results_per_query", args.max_results)
        enrich = cfg.get("enrich_profiles", args.enrich)
        output = cfg.get("output", args.output)
    elif args.repos:
        repos = parse_repos_arg(args.repos)
        keywords = args.keywords.split(",") if args.keywords else DEFAULT_KEYWORDS
        state = args.state
        max_results = args.max_results
        enrich = args.enrich
        output = args.output
    else:
        parser.error("Provide --repos or --config")
        return

    run(repos, keywords, state, max_results, enrich, output)


if __name__ == "__main__":
    main()
