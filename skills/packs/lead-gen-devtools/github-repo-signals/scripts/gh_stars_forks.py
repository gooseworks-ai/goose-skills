#!/usr/bin/env python3
"""Tool 1: Stars & Forks Scanner — Direct Evaluation Signal.

Fetches stargazers and fork owners from competitor repos. Optionally enriches
with full GitHub profiles (name, company, bio, email, location).

Usage:
    python tools/gh_stars_forks.py --repos "livekit/agents" --max-stars 100
    python tools/gh_stars_forks.py --config config.yaml
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.gh_common import (
    gh_api_paginate,
    gh_api_paginate_backward,
    batch_get_user_profiles,
    write_csv,
    parse_repos_arg,
    load_config,
    check_rate_limit,
    TMP_DIR,
)


def get_stargazers(owner, repo, max_items=500):
    """Fetch most recent stargazers with timestamps (newest first via backward pagination)."""
    endpoint = f"repos/{owner}/{repo}/stargazers"
    accept = "application/vnd.github.star+json"

    items = gh_api_paginate_backward(endpoint, max_items=max_items, accept=accept)

    stargazers = []
    for item in items:
        user = item.get("user", {})
        stargazers.append({
            "username": user.get("login", ""),
            "starred_at": item.get("starred_at", ""),
        })

    print(f"[stars] {owner}/{repo}: fetched {len(stargazers)} stargazers", file=sys.stderr)
    return stargazers


def get_fork_owners(owner, repo, max_pages=5):
    """Fetch fork owners (most recent forks first via sort=newest)."""
    endpoint = f"repos/{owner}/{repo}/forks?sort=newest"
    items = gh_api_paginate(endpoint, max_pages=max_pages)

    forks = []
    for item in items:
        forks.append({
            "username": item.get("owner", {}).get("login", ""),
            "forked_at": item.get("created_at", ""),
        })

    print(f"[forks] {owner}/{repo}: fetched {len(forks)} forks", file=sys.stderr)
    return forks


def run(repos, max_stars=500, max_forks=200, enrich=False, output=None):
    """Main logic for stars & forks scanning."""
    output = output or str(TMP_DIR / "stars_forks.csv")
    all_rows = []

    check_rate_limit()

    for owner, repo in repos:
        repo_name = f"{owner}/{repo}"

        # Stargazers
        stargazers = get_stargazers(owner, repo, max_items=max_stars)
        for s in stargazers:
            all_rows.append({
                "source_repo": repo_name,
                "signal_type": "star",
                "username": s["username"],
                "timestamp": s["starred_at"],
            })

        # Fork owners
        max_fork_pages = (max_forks + 99) // 100
        fork_owners = get_fork_owners(owner, repo, max_pages=max_fork_pages)
        for f in fork_owners[:max_forks]:
            all_rows.append({
                "source_repo": repo_name,
                "signal_type": "fork",
                "username": f["username"],
                "timestamp": f["forked_at"],
            })

    if enrich and all_rows:
        usernames = list({r["username"] for r in all_rows if r["username"]})
        print(f"[enrich] Enriching {len(usernames)} unique users...", file=sys.stderr)
        profiles = batch_get_user_profiles(usernames)
        profile_map = {p["login"]: p for p in profiles}

        for row in all_rows:
            p = profile_map.get(row["username"], {})
            row["name"] = p.get("name", "")
            row["company"] = p.get("company", "")
            row["bio"] = p.get("bio", "")
            row["email"] = p.get("email", "")
            row["location"] = p.get("location", "")
    elif not enrich:
        for row in all_rows:
            row.update({"name": "", "company": "", "bio": "", "email": "", "location": ""})

    write_csv(all_rows, output)
    return all_rows


def main():
    parser = argparse.ArgumentParser(description="Stars & Forks Scanner")
    parser.add_argument("--repos", help="Comma-separated repos (owner/repo)")
    parser.add_argument("--config", help="YAML config file path")
    parser.add_argument("--max-stars", type=int, default=500)
    parser.add_argument("--max-forks", type=int, default=200)
    parser.add_argument("--enrich", action="store_true", help="Fetch full user profiles")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    if args.config:
        cfg = load_config(args.config)
        repos = [tuple(r.split("/")) for r in cfg.get("repos", [])]
        max_stars = cfg.get("max_stars_per_repo", args.max_stars)
        max_forks = cfg.get("max_forks_per_repo", args.max_forks)
        enrich = cfg.get("enrich_profiles", args.enrich)
        output = cfg.get("output", args.output)
    elif args.repos:
        repos = parse_repos_arg(args.repos)
        max_stars = args.max_stars
        max_forks = args.max_forks
        enrich = args.enrich
        output = args.output
    else:
        parser.error("Provide --repos or --config")
        return

    run(repos, max_stars, max_forks, enrich, output)


if __name__ == "__main__":
    main()
