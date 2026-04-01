#!/usr/bin/env python3
"""Tool 4: Tech Stack Scanner — Technographic Signal.

Scans a GitHub org's public repos for dependency files (package.json,
requirements.txt, Dockerfile, etc.) to reveal their technology stack.

Usage:
    python tools/gh_techstack.py --orgs "livekit"
    python tools/gh_techstack.py --config config.yaml
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from tools.gh_common import (
    gh_api_paginate,
    get_file_content,
    write_csv,
    load_config,
    check_rate_limit,
    TMP_DIR,
)

DEPENDENCY_FILES = [
    "package.json",
    "requirements.txt",
    "Pipfile",
    "pyproject.toml",
    "go.mod",
    "Gemfile",
    "pom.xml",
    "build.gradle",
    "Cargo.toml",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
]


def get_org_repos(org, max_repos=50):
    """Fetch an org's public repos sorted by stars (client-side sort for reliability)."""
    endpoint = f"orgs/{org}/repos?type=public"
    # Fetch enough pages to get a good sample, then sort client-side
    items = gh_api_paginate(endpoint, max_pages=10)

    # Sort by stars descending (GitHub's server-side sort is unreliable)
    items.sort(key=lambda x: x.get("stargazers_count", 0), reverse=True)

    repos = []
    for item in items[:max_repos]:
        repos.append({
            "name": item.get("name", ""),
            "full_name": item.get("full_name", ""),
            "language": item.get("language", ""),
            "stars": item.get("stargazers_count", 0),
        })

    print(f"[techstack] {org}: {len(repos)} repos fetched (from {len(items)} total)", file=sys.stderr)
    return repos


def parse_package_json(content):
    """Extract dependency names from package.json."""
    try:
        data = json.loads(content)
        deps = set()
        for key in ("dependencies", "devDependencies", "peerDependencies"):
            deps.update(data.get(key, {}).keys())
        return sorted(deps)
    except (json.JSONDecodeError, KeyError):
        return []


def parse_requirements_txt(content):
    """Extract package names from requirements.txt."""
    deps = []
    for line in content.split("\n"):
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        # Strip version specifiers
        name = line.split("==")[0].split(">=")[0].split("<=")[0].split("~=")[0].split("!=")[0].split("[")[0].strip()
        if name:
            deps.append(name)
    return deps


def parse_go_mod(content):
    """Extract module dependencies from go.mod."""
    deps = []
    in_require = False
    for line in content.split("\n"):
        line = line.strip()
        if line.startswith("require ("):
            in_require = True
            continue
        if in_require and line == ")":
            in_require = False
            continue
        if in_require and line:
            parts = line.split()
            if parts:
                deps.append(parts[0])
        elif line.startswith("require ") and "(" not in line:
            parts = line.split()
            if len(parts) >= 2:
                deps.append(parts[1])
    return deps


def parse_dockerfile(content):
    """Extract FROM images from Dockerfile."""
    images = []
    for line in content.split("\n"):
        line = line.strip()
        if line.upper().startswith("FROM "):
            image = line.split()[1] if len(line.split()) > 1 else ""
            if image and image.lower() != "scratch":
                images.append(image.split(":")[0])  # Strip tag
    return images


def parse_pyproject_toml(content):
    """Extract dependency names from pyproject.toml (basic parsing)."""
    deps = []
    in_deps = False
    # Sections that contain dependency info
    deps_headers = [
        "dependencies = [",
        "[tool.poetry.dependencies]",
        "[project.optional-dependencies",
        "[tool.uv.sources]",
    ]
    for line in content.split("\n"):
        stripped = line.strip()
        # Start capturing when we hit a dependencies section
        if any(stripped.startswith(h) for h in deps_headers):
            in_deps = True
            # If it's an inline list start like `dependencies = [`
            if stripped.endswith("["):
                continue
            continue
        # Stop at next section or end of list
        if in_deps and ((stripped.startswith("[") and not any(stripped.startswith(h) for h in deps_headers)) or stripped == "]"):
            in_deps = False
            continue
        if in_deps and stripped:
            if stripped.startswith('"') or stripped.startswith("'"):
                # List format: "numpy>=1.0",
                dep = stripped.strip("\"',").split(">=")[0].split("==")[0].split("<=")[0].split("~=")[0].split("<")[0].split(">")[0].split("[")[0].split(";")[0].strip()
                if dep:
                    deps.append(dep)
            elif "=" in stripped and not stripped.startswith("#"):
                # Key-value format: numpy = "^1.0" or livekit-agents = { workspace = true }
                name = stripped.split("=")[0].strip()
                if name and name != "python":
                    deps.append(name)
    return deps


def parse_cargo_toml(content):
    """Extract dependency names from Cargo.toml."""
    deps = []
    in_deps = False
    for line in content.split("\n"):
        stripped = line.strip()
        if stripped in ("[dependencies]", "[dev-dependencies]", "[build-dependencies]"):
            in_deps = True
            continue
        if stripped.startswith("[") and in_deps:
            in_deps = False
            continue
        if in_deps and "=" in stripped and not stripped.startswith("#"):
            name = stripped.split("=")[0].strip()
            if name:
                deps.append(name)
    return deps


def parse_dependency_file(filename, content):
    """Dispatch to the appropriate parser based on filename."""
    if filename == "package.json":
        return parse_package_json(content)
    elif filename == "requirements.txt":
        return parse_requirements_txt(content)
    elif filename == "go.mod":
        return parse_go_mod(content)
    elif filename in ("Dockerfile",):
        return parse_dockerfile(content)
    elif filename == "pyproject.toml":
        return parse_pyproject_toml(content)
    elif filename == "Cargo.toml":
        return parse_cargo_toml(content)
    else:
        # For files we can detect but not parse in detail, just note their presence
        return [f"[uses {filename}]"]


def scan_repo(owner, repo_name, language=None):
    """Check a repo for dependency files and extract technologies."""
    found = []

    for dep_file in DEPENDENCY_FILES:
        content = get_file_content(owner, repo_name, dep_file)
        if content:
            technologies = parse_dependency_file(dep_file, content)
            found.append({
                "dependency_file": dep_file,
                "technologies": technologies,
            })

    return found


def run(orgs, max_repos_per_org=50, output=None):
    """Main logic for tech stack scanning."""
    output = output or str(TMP_DIR / "techstack.csv")
    all_rows = []

    check_rate_limit()

    for org in orgs:
        repos = get_org_repos(org, max_repos=max_repos_per_org)

        for repo in repos:
            repo_name = repo["name"]
            print(f"[techstack] Scanning {org}/{repo_name}...", file=sys.stderr)

            found = scan_repo(org, repo_name, language=repo.get("language"))

            if found:
                for f in found:
                    all_rows.append({
                        "org": org,
                        "repo": repo_name,
                        "primary_language": repo.get("language", ""),
                        "stars": repo.get("stars", 0),
                        "dependency_file": f["dependency_file"],
                        "detected_technologies": "; ".join(f["technologies"][:30]),  # Cap for CSV readability
                    })
            else:
                all_rows.append({
                    "org": org,
                    "repo": repo_name,
                    "primary_language": repo.get("language", ""),
                    "stars": repo.get("stars", 0),
                    "dependency_file": "",
                    "detected_technologies": "",
                })

            # Periodic rate check (each repo uses ~10 API calls)
            if len(all_rows) % 50 == 0:
                check_rate_limit()

    write_csv(all_rows, output)
    return all_rows


def main():
    parser = argparse.ArgumentParser(description="Tech Stack Scanner — Technographic Signal")
    parser.add_argument("--orgs", help="Comma-separated GitHub org names")
    parser.add_argument("--config", help="YAML config file path")
    parser.add_argument("--max-repos", type=int, default=50)
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    if args.config:
        cfg = load_config(args.config)
        orgs = cfg.get("orgs", [])
        max_repos = cfg.get("max_repos_per_org", args.max_repos)
        output = cfg.get("output", args.output)
    elif args.orgs:
        orgs = [o.strip() for o in args.orgs.split(",")]
        max_repos = args.max_repos
        output = args.output
    else:
        parser.error("Provide --orgs or --config")
        return

    run(orgs, max_repos, output)


if __name__ == "__main__":
    main()
