"""Shared GitHub API utilities for the lead generation toolkit.

All tools import from this module for API calls, pagination, rate limiting,
user profile enrichment, and CSV output.
"""

import csv
import json
import os
import re
import subprocess
import sys
import time
import base64
from pathlib import Path

import yaml

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
TMP_DIR = PROJECT_ROOT / ".tmp"
PROFILE_CACHE_PATH = TMP_DIR / "profile_cache.json"

# Rate limit thresholds
CORE_RATE_LIMIT_FLOOR = 200
SEARCH_DELAY_SECONDS = 2.1


def ensure_tmp_dir():
    TMP_DIR.mkdir(exist_ok=True)


def gh_api(endpoint, method="GET", params=None, headers=None, accept=None):
    """Call the GitHub API via `gh api`. Returns parsed JSON."""
    cmd = ["gh", "api", endpoint]

    if method != "GET":
        cmd.extend(["--method", method])

    if accept:
        cmd.extend(["-H", f"Accept: {accept}"])

    if headers:
        for k, v in headers.items():
            cmd.extend(["-H", f"{k}: {v}"])

    if params:
        for k, v in params.items():
            cmd.extend(["-f", f"{k}={v}"])

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        stderr = result.stderr.strip()
        if "404" in stderr or "Not Found" in stderr:
            return None
        raise RuntimeError(f"gh api error: {stderr}")

    if not result.stdout.strip():
        return None

    return json.loads(result.stdout)


def gh_api_paginate(endpoint, max_pages=None, per_page=100, accept=None):
    """Paginate through a GitHub API endpoint manually. Returns combined list."""
    all_items = []
    page = 1

    while True:
        if max_pages and page > max_pages:
            break

        sep = "&" if "?" in endpoint else "?"
        url = f"{endpoint}{sep}per_page={per_page}&page={page}"

        data = gh_api(url, accept=accept)

        if data is None or (isinstance(data, list) and len(data) == 0):
            break

        if isinstance(data, list):
            all_items.extend(data)
        else:
            # Some endpoints return objects with an "items" key
            items = data.get("items", [])
            all_items.extend(items)
            if len(items) < per_page:
                break

        if isinstance(data, list) and len(data) < per_page:
            break

        page += 1

    return all_items


def gh_api_paginate_backward(endpoint, max_items=500, per_page=100, accept=None):
    """Paginate backward from the last page to get the most recent items.

    Useful for stargazers endpoint which returns oldest-first with no sort param.
    """
    # First, make a HEAD-like request to discover the last page
    sep = "&" if "?" in endpoint else "?"
    first_url = f"{endpoint}{sep}per_page={per_page}&page=1"

    # Use gh api with -i to get headers
    cmd = ["gh", "api", "-i", first_url]
    if accept:
        cmd.extend(["-H", f"Accept: {accept}"])

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return []

    # Parse last page from Link header
    last_page = 1
    for line in result.stdout.split("\n"):
        if line.lower().startswith("link:"):
            match = re.search(r'page=(\d+)>;\s*rel="last"', line)
            if match:
                last_page = int(match.group(1))
            break

    # Calculate how many pages we need from the end
    pages_needed = min((max_items + per_page - 1) // per_page, last_page)

    all_items = []
    for page in range(last_page, max(last_page - pages_needed, 0), -1):
        url = f"{endpoint}{sep}per_page={per_page}&page={page}"
        data = gh_api(url, accept=accept)
        if data and isinstance(data, list):
            all_items = data + all_items  # Prepend to maintain chronological order
        if len(all_items) >= max_items:
            break

    return all_items[-max_items:] if len(all_items) > max_items else all_items


def gh_search(query, max_results=200):
    """Search GitHub issues/code via the search API. Enforces 2.1s delay between calls."""
    all_items = []
    per_page = 30  # Search API max per page
    max_pages = min((max_results + per_page - 1) // per_page, 34)  # 1000 results cap

    for page in range(1, max_pages + 1):
        if len(all_items) >= max_results:
            break

        url = f"search/issues?q={query}&per_page={per_page}&page={page}"
        data = gh_api(url)

        if data is None:
            break

        items = data.get("items", [])
        all_items.extend(items)

        if len(items) < per_page:
            break

        # Respect search API rate limit
        if page < max_pages:
            time.sleep(SEARCH_DELAY_SECONDS)

    return all_items[:max_results]


def check_rate_limit():
    """Check GitHub API rate limit. Sleep if remaining is below threshold."""
    data = gh_api("rate_limit")
    if not data:
        return

    core = data.get("resources", {}).get("core", {})
    remaining = core.get("remaining", 5000)
    reset_at = core.get("reset", 0)

    if remaining < CORE_RATE_LIMIT_FLOOR:
        wait = max(reset_at - time.time(), 0) + 5
        print(f"[rate-limit] Only {remaining} requests remaining. Sleeping {wait:.0f}s until reset.", file=sys.stderr)
        time.sleep(wait)
    else:
        print(f"[rate-limit] {remaining} requests remaining.", file=sys.stderr)

    return remaining


def load_profile_cache():
    """Load the profile cache from disk."""
    if PROFILE_CACHE_PATH.exists():
        with open(PROFILE_CACHE_PATH) as f:
            return json.load(f)
    return {}


def save_profile_cache(cache):
    """Save the profile cache to disk."""
    ensure_tmp_dir()
    with open(PROFILE_CACHE_PATH, "w") as f:
        json.dump(cache, f, indent=2)


def get_user_profile(username, cache=None):
    """Fetch a GitHub user's full profile."""
    if cache is not None and username in cache:
        return cache[username]

    data = gh_api(f"users/{username}")
    if data is None:
        profile = {"login": username}
    else:
        profile = {
            "login": data.get("login", username),
            "name": data.get("name", ""),
            "company": data.get("company", ""),
            "bio": data.get("bio", ""),
            "email": data.get("email", ""),
            "location": data.get("location", ""),
            "blog": data.get("blog", ""),
            "twitter": data.get("twitter_username", ""),
            "followers": data.get("followers", 0),
            "public_repos": data.get("public_repos", 0),
        }

    if cache is not None:
        cache[username] = profile

    return profile


def batch_get_user_profiles(usernames, use_disk_cache=True):
    """Enrich a list of usernames with full profile data. Uses caching."""
    cache = load_profile_cache() if use_disk_cache else {}
    profiles = []
    api_calls = 0

    for i, username in enumerate(usernames):
        if username in cache:
            profiles.append(cache[username])
            continue

        # Periodic rate limit check
        if api_calls > 0 and api_calls % 100 == 0:
            check_rate_limit()

        profile = get_user_profile(username, cache)
        profiles.append(profile)
        api_calls += 1

        if (i + 1) % 50 == 0:
            print(f"[enrich] {i + 1}/{len(usernames)} profiles fetched ({api_calls} API calls)", file=sys.stderr)

    if use_disk_cache:
        save_profile_cache(cache)

    print(f"[enrich] Done. {len(profiles)} profiles, {api_calls} API calls made.", file=sys.stderr)
    return profiles


def get_file_content(owner, repo, path):
    """Fetch and decode a file's content from a GitHub repo. Returns None if not found."""
    data = gh_api(f"repos/{owner}/{repo}/contents/{path}")
    if data is None:
        return None

    content = data.get("content", "")
    encoding = data.get("encoding", "")

    if encoding == "base64":
        return base64.b64decode(content).decode("utf-8", errors="replace")

    return content


def write_csv(rows, filepath):
    """Write a list of dicts to a CSV file."""
    if not rows:
        print(f"[csv] No data to write to {filepath}", file=sys.stderr)
        return

    ensure_tmp_dir()
    filepath = Path(filepath)
    filepath.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = list(rows[0].keys())
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"[csv] Wrote {len(rows)} rows to {filepath}", file=sys.stderr)


def parse_repo_input(input_str):
    """Parse 'owner/repo' or 'https://github.com/owner/repo' into (owner, repo)."""
    input_str = input_str.strip().rstrip("/")
    if input_str.startswith("https://github.com/"):
        input_str = input_str.replace("https://github.com/", "")
    parts = input_str.split("/")
    if len(parts) >= 2:
        return parts[0], parts[1]
    raise ValueError(f"Invalid repo format: {input_str}. Expected 'owner/repo' or GitHub URL.")


def load_config(path):
    """Load a YAML config file."""
    with open(path) as f:
        return yaml.safe_load(f)


def parse_repos_arg(repos_str):
    """Parse comma-separated repos string into list of (owner, repo) tuples."""
    return [parse_repo_input(r) for r in repos_str.split(",")]
