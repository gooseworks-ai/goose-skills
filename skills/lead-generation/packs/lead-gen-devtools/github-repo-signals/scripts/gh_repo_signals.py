#!/usr/bin/env python3
"""GitHub Repository Signals — Multi-Repo Lead Extraction Tool.

Extracts all user interactions (stars, forks, contributors, issues, PRs,
comments, watchers, commits) across multiple GitHub repositories. Deduplicates
users, scores them by interaction depth, filters out org members/bots, fetches
GitHub profiles for the top N users, and outputs two CSV files:
  - _users.csv: deduplicated master list with profile data and cross-repo score
  - _interactions.csv: one row per user × repo with YES/NO interaction flags

Usage:
    python tools/gh_repo_signals.py \
        --repos "livekit/agents,vercel/ai" \
        --limit 500 \
        --output .tmp/repo_signals.csv
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.gh_common import (
    gh_api,
    gh_api_paginate,
    gh_api_paginate_backward,
    batch_get_user_profiles,
    parse_repos_arg,
    check_rate_limit,
    ensure_tmp_dir,
    TMP_DIR,
)

import csv


# ---------------------------------------------------------------------------
# Scoring weights
# ---------------------------------------------------------------------------
SCORE_WEIGHTS = {
    "is_issue_opener": 5,
    "is_pr_author": 5,
    "is_contributor": 4,
    "is_issue_commenter": 3,
    "is_forker": 3,
    "is_watcher": 2,
    "is_stargazer": 1,
}

BOT_SUFFIXES = ("[bot]",)
BOT_EXACT = {"dependabot", "github-actions", "CLAassistant", "codecov", "renovate"}


# ---------------------------------------------------------------------------
# Data extraction helpers
# ---------------------------------------------------------------------------

def is_bot(username):
    """Check if a username belongs to a bot."""
    lower = username.lower()
    if any(lower.endswith(s) for s in BOT_SUFFIXES):
        return True
    if lower in {b.lower() for b in BOT_EXACT}:
        return True
    return False


def get_org_members(org):
    """Fetch public members of a GitHub org."""
    members = set()
    try:
        items = gh_api_paginate(f"orgs/{org}/members", max_pages=10)
        for item in items:
            login = item.get("login", "")
            if login:
                members.add(login.lower())
        print(f"[org-filter] {org}: {len(members)} public members detected", file=sys.stderr)
    except Exception as e:
        print(f"[org-filter] Could not fetch members for {org}: {e}", file=sys.stderr)
    return members


def get_org_email_domain(org):
    """Guess the org's email domain from its GitHub profile."""
    data = gh_api(f"orgs/{org}")
    if data:
        blog = data.get("blog", "") or ""
        email = data.get("email", "") or ""
        # Extract domain from email
        if "@" in email:
            return email.split("@")[1].lower()
        # Extract domain from blog/website
        if blog:
            blog = blog.replace("https://", "").replace("http://", "").split("/")[0]
            if "." in blog:
                return blog.lower()
    return None


def extract_stargazers(owner, repo):
    """Extract all stargazers with timestamps."""
    endpoint = f"repos/{owner}/{repo}/stargazers"
    accept = "application/vnd.github.star+json"
    items = gh_api_paginate(endpoint, accept=accept)
    users = {}
    for item in items:
        user = item.get("user", {})
        login = user.get("login", "")
        if login:
            users[login] = {"starred_at": item.get("starred_at", "")}
    print(f"[stars] {owner}/{repo}: {len(users)} stargazers", file=sys.stderr)
    return users


def extract_forkers(owner, repo):
    """Extract all fork owners."""
    items = gh_api_paginate(f"repos/{owner}/{repo}/forks?sort=newest", max_pages=50)
    users = {}
    for item in items:
        login = item.get("owner", {}).get("login", "")
        if login:
            users[login] = {"forked_at": item.get("created_at", "")}
    print(f"[forks] {owner}/{repo}: {len(users)} forkers", file=sys.stderr)
    return users


def extract_contributors(owner, repo):
    """Extract contributors with contribution counts."""
    items = gh_api_paginate(f"repos/{owner}/{repo}/contributors", max_pages=10)
    users = {}
    for item in items:
        login = item.get("login", "")
        if login and item.get("type") != "Bot":
            users[login] = {"contributions": item.get("contributions", 0)}
    print(f"[contributors] {owner}/{repo}: {len(users)} contributors", file=sys.stderr)
    return users


def extract_commit_emails(owner, repo):
    """Extract author emails from commits."""
    items = gh_api_paginate(f"repos/{owner}/{repo}/commits", max_pages=10)
    user_emails = {}
    for item in items:
        login = (item.get("author") or {}).get("login", "")
        email = (item.get("commit", {}).get("author", {}) or {}).get("email", "")
        if login and email and "noreply" not in email.lower():
            if login not in user_emails:
                user_emails[login] = email
    print(f"[commits] {owner}/{repo}: {len(user_emails)} unique commit emails", file=sys.stderr)
    return user_emails


def extract_issues(owner, repo):
    """Extract issue openers (all states)."""
    items = gh_api_paginate(f"repos/{owner}/{repo}/issues?state=all&filter=all", max_pages=50)
    users = set()
    for item in items:
        if item.get("pull_request"):
            continue  # skip PRs returned by issues endpoint
        login = item.get("user", {}).get("login", "")
        if login:
            users.add(login)
    print(f"[issues] {owner}/{repo}: {len(users)} unique issue openers", file=sys.stderr)
    return users


def extract_pr_authors(owner, repo):
    """Extract pull request authors (all states)."""
    items = gh_api_paginate(f"repos/{owner}/{repo}/pulls?state=all", max_pages=50)
    users = set()
    for item in items:
        login = item.get("user", {}).get("login", "")
        if login:
            users.add(login)
    print(f"[prs] {owner}/{repo}: {len(users)} unique PR authors", file=sys.stderr)
    return users


def extract_issue_commenters(owner, repo):
    """Extract users who commented on issues/PRs."""
    items = gh_api_paginate(f"repos/{owner}/{repo}/issues/comments", max_pages=50)
    users = set()
    for item in items:
        login = item.get("user", {}).get("login", "")
        if login:
            users.add(login)
    print(f"[comments] {owner}/{repo}: {len(users)} unique commenters", file=sys.stderr)
    return users


def extract_watchers(owner, repo):
    """Extract repository watchers/subscribers."""
    items = gh_api_paginate(f"repos/{owner}/{repo}/subscribers", max_pages=10)
    users = set()
    for item in items:
        login = item.get("login", "")
        if login:
            users.add(login)
    print(f"[watchers] {owner}/{repo}: {len(users)} watchers", file=sys.stderr)
    return users


# ---------------------------------------------------------------------------
# Core pipeline
# ---------------------------------------------------------------------------

def extract_all_signals(repos):
    """Extract all interaction signals from multiple repos.

    Returns:
        interactions: dict[username] -> dict[repo_name] -> {flags}
        commit_emails: dict[username] -> email
    """
    interactions = {}  # username -> repo_name -> interaction flags
    commit_emails = {}

    for owner, repo in repos:
        repo_name = f"{owner}/{repo}"
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"[extract] Processing {repo_name}...", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)

        check_rate_limit()

        # Extract all signal types
        stargazers = extract_stargazers(owner, repo)
        forkers = extract_forkers(owner, repo)
        contributors = extract_contributors(owner, repo)
        emails = extract_commit_emails(owner, repo)
        issue_openers = extract_issues(owner, repo)
        pr_authors = extract_pr_authors(owner, repo)
        commenters = extract_issue_commenters(owner, repo)
        watchers = extract_watchers(owner, repo)

        # Merge commit emails
        for login, email in emails.items():
            if login not in commit_emails:
                commit_emails[login] = email

        # Collect all usernames for this repo
        all_users = set()
        all_users.update(stargazers.keys())
        all_users.update(forkers.keys())
        all_users.update(contributors.keys())
        all_users.update(issue_openers)
        all_users.update(pr_authors)
        all_users.update(commenters)
        all_users.update(watchers)

        for username in all_users:
            if username not in interactions:
                interactions[username] = {}

            interactions[username][repo_name] = {
                "is_stargazer": username in stargazers,
                "is_forker": username in forkers,
                "is_contributor": username in contributors,
                "is_issue_opener": username in issue_openers,
                "is_pr_author": username in pr_authors,
                "is_issue_commenter": username in commenters,
                "is_watcher": username in watchers,
                "contribution_count": contributors.get(username, {}).get("contributions", 0),
                "starred_at": stargazers.get(username, {}).get("starred_at", ""),
                "forked_at": forkers.get(username, {}).get("forked_at", ""),
            }

        print(f"[extract] {repo_name}: {len(all_users)} unique users found", file=sys.stderr)

    return interactions, commit_emails


def filter_org_members_and_bots(interactions, commit_emails, repos):
    """Remove bots and org members from the interaction data."""
    # Collect org members and email domains
    org_members = set()
    org_domains = set()
    seen_orgs = set()

    for owner, repo in repos:
        if owner.lower() not in seen_orgs:
            seen_orgs.add(owner.lower())
            members = get_org_members(owner)
            org_members.update(members)
            domain = get_org_email_domain(owner)
            if domain:
                org_domains.add(domain)
                print(f"[org-filter] {owner}: detected email domain '{domain}'", file=sys.stderr)

    # Filter
    removed_bots = 0
    removed_org = 0
    to_remove = set()

    for username in interactions:
        if is_bot(username):
            to_remove.add(username)
            removed_bots += 1
            continue
        if username.lower() in org_members:
            to_remove.add(username)
            removed_org += 1
            continue
        # Check commit email against org domains
        email = commit_emails.get(username, "")
        if email and org_domains:
            email_domain = email.split("@")[1].lower() if "@" in email else ""
            if email_domain in org_domains:
                to_remove.add(username)
                removed_org += 1
                continue

    for username in to_remove:
        del interactions[username]

    print(f"\n[filter] Removed {removed_bots} bots, {removed_org} org members", file=sys.stderr)
    print(f"[filter] {len(interactions)} users remaining", file=sys.stderr)

    return interactions


def score_and_rank(interactions, repos):
    """Score each user based on interaction signals across all repos.

    Returns sorted list of (username, total_score, repos_interacted_count).
    """
    scored = []
    repo_names = [f"{o}/{r}" for o, r in repos]

    for username, repo_data in interactions.items():
        total_score = 0
        repos_interacted = 0

        for repo_name in repo_names:
            if repo_name not in repo_data:
                continue
            flags = repo_data[repo_name]
            repos_interacted += 1
            for flag, weight in SCORE_WEIGHTS.items():
                if flags.get(flag, False):
                    total_score += weight

        scored.append((username, total_score, repos_interacted))

    # Sort by repos_interacted desc, then total_score desc
    scored.sort(key=lambda x: (x[2], x[1]), reverse=True)
    return scored


def build_csv(scored_users, interactions, commit_emails, profiles, repos, output_path):
    """Build two CSV files: _users.csv and _interactions.csv."""
    repo_names = [f"{o}/{r}" for o, r in repos]

    # Derive base path (strip .csv extension if present)
    output_path = Path(output_path)
    output_base = str(output_path).removesuffix(".csv") if str(output_path).endswith(".csv") else str(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    profile_map = {p["login"]: p for p in profiles}

    # ===== FILE 1: USERS =====
    users_path = f"{output_base}_users.csv"
    user_headers = [
        "username", "name", "email", "commit_email", "company", "location",
        "blog", "twitter", "bio", "followers", "public_repos",
        "total_repos_interacted", "interaction_score",
    ]

    with open(users_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(user_headers)

        for username, score, repo_count in scored_users:
            p = profile_map.get(username, {})
            commit_email = commit_emails.get(username, "")
            public_email = p.get("email", "") or ""

            row_data = [
                username,
                p.get("name", ""),
                public_email,
                commit_email if commit_email != public_email else "",
                p.get("company", ""),
                p.get("location", ""),
                p.get("blog", ""),
                p.get("twitter", ""),
                p.get("bio", ""),
                p.get("followers", 0),
                p.get("public_repos", 0),
                repo_count,
                score,
            ]
            writer.writerow(row_data)

    # ===== FILE 2: INTERACTIONS =====
    interactions_path = f"{output_base}_interactions.csv"
    interaction_headers = [
        "username", "repository",
        "is_contributor", "is_stargazer", "is_forker", "is_watcher",
        "is_issue_opener", "is_pr_author", "is_issue_commenter",
        "contribution_count", "starred_at", "forked_at", "repo_score",
    ]

    interaction_row_count = 0
    with open(interactions_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(interaction_headers)

        for username, score, repo_count in scored_users:
            for repo_name in repo_names:
                repo_data = interactions.get(username, {}).get(repo_name)
                if not repo_data:
                    continue

                repo_score = sum(
                    weight for flag, weight in SCORE_WEIGHTS.items()
                    if repo_data.get(flag, False)
                )

                flags = [
                    "is_contributor", "is_stargazer", "is_forker", "is_watcher",
                    "is_issue_opener", "is_pr_author", "is_issue_commenter",
                ]

                row_data = [
                    username,
                    repo_name,
                ]
                for flag in flags:
                    row_data.append("YES" if repo_data.get(flag, False) else "NO")

                row_data.extend([
                    repo_data.get("contribution_count", 0),
                    repo_data.get("starred_at", ""),
                    repo_data.get("forked_at", ""),
                    repo_score,
                ])

                writer.writerow(row_data)
                interaction_row_count += 1

    print(f"\n[output] Saved {len(scored_users)} users to CSV files", file=sys.stderr)
    print(f"[output] Users CSV: {users_path} ({len(scored_users)} rows)", file=sys.stderr)
    print(f"[output] Interactions CSV: {interactions_path} ({interaction_row_count} rows)", file=sys.stderr)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(repos, limit=500, output=None):
    """Main pipeline: extract → filter → score → enrich → export."""
    output = output or str(TMP_DIR / "repo_signals.csv")

    print(f"[start] Processing {len(repos)} repos, limit={limit}", file=sys.stderr)
    print(f"[start] Repos: {', '.join(f'{o}/{r}' for o, r in repos)}", file=sys.stderr)

    # Step 1: Extract all signals
    interactions, commit_emails = extract_all_signals(repos)
    print(f"\n[total] {len(interactions)} unique users across all repos", file=sys.stderr)

    # Step 2: Filter bots and org members
    interactions = filter_org_members_and_bots(interactions, commit_emails, repos)

    # Step 3: Score and rank
    scored = score_and_rank(interactions, repos)

    # Step 4: Take top N
    top_users = scored[:limit]
    print(f"\n[top] Selected top {len(top_users)} users (score range: {top_users[-1][1]}–{top_users[0][1]})", file=sys.stderr)

    # Step 5: Fetch GitHub profiles
    usernames = [u[0] for u in top_users]
    print(f"\n[enrich] Fetching GitHub profiles for {len(usernames)} users...", file=sys.stderr)
    profiles = batch_get_user_profiles(usernames)

    # Step 6: Build CSV files
    build_csv(top_users, interactions, commit_emails, profiles, repos, output)

    # Print summary
    profile_map = {p["login"]: p for p in profiles}
    has_email = sum(1 for u, _, _ in top_users if profile_map.get(u, {}).get("email") or commit_emails.get(u))
    has_company = sum(1 for u, _, _ in top_users if profile_map.get(u, {}).get("company"))
    multi_repo = sum(1 for _, _, rc in top_users if rc > 1)

    print(f"\n{'='*60}", file=sys.stderr)
    print(f"[summary] Top {len(top_users)} leads exported to {output}", file=sys.stderr)
    print(f"[summary] With any email: {has_email} ({100*has_email/len(top_users):.1f}%)", file=sys.stderr)
    print(f"[summary] With company: {has_company} ({100*has_company/len(top_users):.1f}%)", file=sys.stderr)
    print(f"[summary] Multi-repo users: {multi_repo}", file=sys.stderr)
    print(f"{'='*60}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description="GitHub Repository Signals — Multi-Repo Lead Extraction"
    )
    parser.add_argument(
        "--repos", required=True,
        help="Comma-separated repos (owner/repo or full GitHub URLs)"
    )
    parser.add_argument(
        "--limit", type=int, default=500,
        help="Max number of users to include in output (default: 500)"
    )
    parser.add_argument(
        "--output", default=None,
        help="Output .csv file path (default: .tmp/repo_signals.csv)"
    )
    args = parser.parse_args()

    repos = parse_repos_arg(args.repos)
    run(repos, limit=args.limit, output=args.output)


if __name__ == "__main__":
    main()
