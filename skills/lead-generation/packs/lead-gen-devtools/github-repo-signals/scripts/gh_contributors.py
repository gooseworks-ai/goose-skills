#!/usr/bin/env python3
"""Tool 3: Contributors Scanner — Active Practitioners Signal.

Fetches contributors from open-source repos in your category. Deduplicates
across repos and optionally enriches with full GitHub profiles.

Usage:
    python tools/gh_contributors.py --repos "livekit/agents" --min-contributions 3
    python tools/gh_contributors.py --config config.yaml
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.gh_common import (
    gh_api_paginate,
    batch_get_user_profiles,
    write_csv,
    parse_repos_arg,
    load_config,
    check_rate_limit,
    TMP_DIR,
)


def get_contributors(owner, repo):
    """Fetch all contributors for a repo (up to ~500, API limit)."""
    endpoint = f"repos/{owner}/{repo}/contributors"
    items = gh_api_paginate(endpoint, max_pages=5)

    contributors = []
    for item in items:
        login = item.get("login", "")
        if not login or item.get("type") == "Bot":
            continue
        contributors.append({
            "username": login,
            "contributions": item.get("contributions", 0),
        })

    print(f"[contributors] {owner}/{repo}: {len(contributors)} contributors", file=sys.stderr)
    return contributors


def merge_contributors(repo_data):
    """Merge contributors across repos, summing contributions."""
    merged = {}

    for repo_name, contributors in repo_data.items():
        for c in contributors:
            username = c["username"]
            if username not in merged:
                merged[username] = {
                    "username": username,
                    "total_contributions": 0,
                    "repos_contributed_to": [],
                    "contribution_details": [],
                }
            merged[username]["total_contributions"] += c["contributions"]
            merged[username]["repos_contributed_to"].append(repo_name)
            merged[username]["contribution_details"].append(f"{repo_name}:{c['contributions']}")

    # Convert lists to strings
    for entry in merged.values():
        entry["repos_contributed_to"] = "; ".join(entry["repos_contributed_to"])
        entry["contribution_details"] = "; ".join(entry["contribution_details"])

    return list(merged.values())


def run(repos, min_contributions=3, enrich=False, output=None):
    """Main logic for contributors scanning."""
    output = output or str(TMP_DIR / "contributors.csv")
    repo_data = {}

    check_rate_limit()

    for owner, repo in repos:
        repo_name = f"{owner}/{repo}"
        contributors = get_contributors(owner, repo)
        repo_data[repo_name] = contributors

    merged = merge_contributors(repo_data)

    # Filter by minimum contributions
    filtered = [c for c in merged if c["total_contributions"] >= min_contributions]
    filtered.sort(key=lambda x: x["total_contributions"], reverse=True)

    print(f"[contributors] {len(merged)} total, {len(filtered)} with >= {min_contributions} contributions", file=sys.stderr)

    if enrich and filtered:
        usernames = [c["username"] for c in filtered]
        print(f"[enrich] Enriching {len(usernames)} contributors...", file=sys.stderr)
        profiles = batch_get_user_profiles(usernames)
        profile_map = {p["login"]: p for p in profiles}

        for row in filtered:
            p = profile_map.get(row["username"], {})
            row["name"] = p.get("name", "")
            row["company"] = p.get("company", "")
            row["bio"] = p.get("bio", "")
            row["email"] = p.get("email", "")
            row["location"] = p.get("location", "")
    else:
        for row in filtered:
            row.update({"name": "", "company": "", "bio": "", "email": "", "location": ""})

    # Reorder columns
    ordered = []
    for row in filtered:
        ordered.append({
            "username": row["username"],
            "name": row.get("name", ""),
            "company": row.get("company", ""),
            "bio": row.get("bio", ""),
            "email": row.get("email", ""),
            "location": row.get("location", ""),
            "total_contributions": row["total_contributions"],
            "repos_contributed_to": row["repos_contributed_to"],
            "contribution_details": row["contribution_details"],
        })

    write_csv(ordered, output)
    return ordered


def main():
    parser = argparse.ArgumentParser(description="Contributors Scanner — Active Practitioners Signal")
    parser.add_argument("--repos", help="Comma-separated repos (owner/repo)")
    parser.add_argument("--config", help="YAML config file path")
    parser.add_argument("--min-contributions", type=int, default=3)
    parser.add_argument("--enrich", action="store_true")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    if args.config:
        cfg = load_config(args.config)
        repos = [tuple(r.split("/")) for r in cfg.get("repos", [])]
        min_contributions = cfg.get("min_contributions", args.min_contributions)
        enrich = cfg.get("enrich_profiles", args.enrich)
        output = cfg.get("output", args.output)
    elif args.repos:
        repos = parse_repos_arg(args.repos)
        min_contributions = args.min_contributions
        enrich = args.enrich
        output = args.output
    else:
        parser.error("Provide --repos or --config")
        return

    run(repos, min_contributions, enrich, output)


if __name__ == "__main__":
    main()
