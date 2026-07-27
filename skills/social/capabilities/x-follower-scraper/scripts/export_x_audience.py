#!/usr/bin/env python3
"""Export public X audiences with the Xquik X Follower Scraper Actor."""

import argparse
import json
import os
import re
import sys
import time
from urllib.parse import urlparse

import requests


ACTOR_ID = "xquik~x-follower-scraper"
APIFY_API_BASE = "https://api.apify.com/v2"
GOOSEWORKS_API_BASE = os.environ.get(
    "GOOSEWORKS_API_BASE",
    "https://api.gooseworks.ai",
)
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")
BASE_URL = (
    f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
    if GOOSEWORKS_API_KEY
    else APIFY_API_BASE
)
POLL_INTERVAL_SECONDS = 5
REQUEST_TIMEOUT_SECONDS = 30
TERMINAL_FAILURE_STATUSES = {"FAILED", "ABORTED", "TIMED-OUT"}
RELATIONS = (
    "followers",
    "following",
    "verified_followers",
    "list_members",
    "list_followers",
    "community_members",
)
SUPPORTED_X_HOSTS = {"x.com", "www.x.com", "twitter.com", "www.twitter.com"}


def positive_int(value):
    """Parse a positive integer for argparse."""
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("value must be at least 1")
    return parsed


def result_cap(value):
    """Parse the minimum result cap accepted by the Actor schema."""
    parsed = positive_int(value)
    if parsed < 20:
        raise argparse.ArgumentTypeError("result cap must be at least 20")
    return parsed


def nonnegative_int(value):
    """Parse a nonnegative integer for argparse."""
    parsed = int(value)
    if parsed < 0:
        raise argparse.ArgumentTypeError("value cannot be negative")
    return parsed


def x_handle(value):
    """Normalize and validate a public X handle."""
    handle = value.strip().lstrip("@")
    if not re.fullmatch(r"[A-Za-z0-9_]{1,15}", handle):
        raise argparse.ArgumentTypeError(
            "handle must contain 1 to 15 letters, digits, or underscores"
        )
    return handle


def numeric_id(value):
    """Validate a numeric X, list, or community ID."""
    identifier = value.strip()
    if not identifier.isdigit():
        raise argparse.ArgumentTypeError("ID must contain only digits")
    return identifier


def x_url(value):
    """Validate a supported public X target URL."""
    parsed = urlparse(value.strip())
    if parsed.scheme != "https" or parsed.hostname not in SUPPORTED_X_HOSTS:
        raise argparse.ArgumentTypeError("URL must be an HTTPS x.com or twitter.com URL")
    return value.strip()


def get_token():
    """Return a Gooseworks or Apify API token from the environment."""
    token = GOOSEWORKS_API_KEY or os.environ.get("APIFY_API_TOKEN")
    if not token:
        raise RuntimeError(
            "Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN before starting a run."
        )
    return token


def authorization_headers(token):
    """Build headers without placing credentials in a URL."""
    return {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}",
    }


def parse_response(response, label):
    """Raise useful HTTP and JSON errors for one API response."""
    response.raise_for_status()
    try:
        return response.json()
    except ValueError as error:
        raise RuntimeError(f"{label} returned invalid JSON.") from error


def unwrap_data(payload):
    """Return an Apify response's data value when present."""
    if isinstance(payload, dict) and "data" in payload:
        return payload["data"]
    return payload


def abort_run(session, run_id, headers):
    """Best-effort abort for a run that outlives the local wait budget."""
    try:
        response = session.post(
            f"{BASE_URL}/actor-runs/{run_id}/abort",
            headers=headers,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as error:
        print(f"Warning: could not abort Actor run {run_id}: {error}", file=sys.stderr)


def build_run_input(args):
    """Translate parsed arguments into the Actor's current input contract."""
    run_input = {
        "maxItems": args.max_items,
        "outputMode": args.output_mode,
        "dedupeMode": args.dedupe_mode,
        "includeTargetMetadata": True,
    }

    if args.handle:
        run_input["twitterHandles"] = args.handle
    if args.user_id:
        run_input["userIds"] = args.user_id
    if args.list_id:
        run_input["listIds"] = args.list_id
    if args.community_id:
        run_input["communityIds"] = args.community_id
    if args.url:
        run_input["startUrls"] = [{"url": url} for url in args.url]

    relations = args.relation or ["followers"]
    if len(relations) == 1:
        run_input["relation"] = relations[0]
    else:
        run_input["relations"] = relations

    optional_fields = {
        "maxItemsPerTarget": args.max_items_per_target,
        "minFollowers": args.min_followers,
        "bioContains": args.bio_contains,
        "locationContains": args.location_contains,
    }
    for field, value in optional_fields.items():
        if value is not None:
            run_input[field] = value
    if args.verified_only:
        run_input["verifiedOnly"] = True

    return run_input


def run_apify_actor(
    token,
    run_input,
    timeout=300,
    session=requests,
    sleep=time.sleep,
    clock=time.monotonic,
):
    """Run the Actor, wait for a terminal status, and return dataset rows."""
    headers = authorization_headers(token)
    start_headers = {**headers, "Content-Type": "application/json"}

    print(f"Starting paid Apify Actor run ({ACTOR_ID}).", file=sys.stderr)
    print(f"Run-wide item cap: {run_input['maxItems']}", file=sys.stderr)

    start_response = session.post(
        f"{BASE_URL}/acts/{ACTOR_ID}/runs",
        headers=start_headers,
        json=run_input,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    run_data = unwrap_data(parse_response(start_response, "Actor start"))
    if not isinstance(run_data, dict) or not run_data.get("id"):
        raise RuntimeError("Actor start response did not include a run ID.")

    run_id = run_data["id"]
    deadline = clock() + timeout

    while True:
        status = run_data.get("status")
        if status == "SUCCEEDED":
            break
        if status in TERMINAL_FAILURE_STATUSES:
            detail = run_data.get("statusMessage") or "No status message returned."
            raise RuntimeError(f"Actor run {status}: {detail}")
        if clock() >= deadline:
            abort_run(session, run_id, headers)
            raise TimeoutError(
                f"Actor run exceeded {timeout} seconds and an abort was requested."
            )

        sleep(POLL_INTERVAL_SECONDS)
        status_response = session.get(
            f"{BASE_URL}/actor-runs/{run_id}",
            headers=headers,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        run_data = unwrap_data(parse_response(status_response, "Actor status"))
        if not isinstance(run_data, dict):
            raise RuntimeError("Actor status response did not include run data.")

    dataset_id = run_data.get("defaultDatasetId")
    if not dataset_id:
        raise RuntimeError("Successful Actor run did not include a dataset ID.")

    dataset_response = session.get(
        f"{BASE_URL}/datasets/{dataset_id}/items",
        headers=headers,
        params={"clean": "true", "format": "json"},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    rows = unwrap_data(parse_response(dataset_response, "Actor dataset"))
    if not isinstance(rows, list):
        raise RuntimeError("Actor dataset response was not a JSON array.")
    return rows


def partition_actor_rows(rows):
    """Separate profile records from control rows."""
    profiles = []
    diagnostics = []
    reports = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        result_type = row.get("resultType")
        if result_type == "diagnostic":
            diagnostics.append(row)
        elif result_type == "run-report":
            reports.append(row)
        else:
            profiles.append(row)
    return profiles, diagnostics, reports


def integer_value(value):
    """Convert numeric output fields to sortable integers."""
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def first_value(row, *keys):
    """Read the first populated field from a profile row."""
    for key in keys:
        value = row.get(key)
        if value not in (None, ""):
            return value
    return ""


def profile_sort_key(profile):
    """Sort overlap first, then audience size."""
    overlap = integer_value(first_value(profile, "overlapCount", "overlap_count"))
    followers = integer_value(
        first_value(
            profile,
            "followersCount",
            "followers_count",
            "followers",
        )
    )
    return overlap, followers


def format_summary(profiles):
    """Format profile rows as a compact audience table."""
    lines = [
        f"{'#':<4} {'Followers':<11} {'Overlap':<9} {'Username':<18} "
        f"{'Relation':<20} Source"
    ]
    lines.append("-" * 108)
    for index, profile in enumerate(profiles, 1):
        followers = integer_value(
            first_value(
                profile,
                "followersCount",
                "followers_count",
                "followers",
            )
        )
        overlap = integer_value(
            first_value(profile, "overlapCount", "overlap_count")
        )
        username = first_value(
            profile,
            "userName",
            "username",
            "screenName",
            "screen_name",
        )
        relation = first_value(profile, "sourceRelation", "source_relation")
        source = first_value(profile, "sourceTarget", "source_target")
        lines.append(
            f"{index:<4} {followers:<11} {overlap:<9} "
            f"{str(username)[:16]:<18} {str(relation)[:18]:<20} "
            f"{str(source)[:30]}"
        )
    return "\n".join(lines)


def report_control_rows(diagnostics, reports):
    """Describe non-data rows without mixing them into profile output."""
    for diagnostic in diagnostics:
        status = diagnostic.get("status", "unknown")
        message = diagnostic.get("message", "No diagnostic message returned.")
        print(f"Actor diagnostic ({status}): {message}", file=sys.stderr)
    for report in reports:
        status = report.get("status", "completed")
        print(f"Actor run report: {status}", file=sys.stderr)


def build_parser():
    """Create the command-line parser."""
    parser = argparse.ArgumentParser(
        description="Export public X audiences with Xquik X Follower Scraper on Apify."
    )
    parser.add_argument(
        "--handle",
        action="append",
        type=x_handle,
        help="X handle. Repeat to add targets.",
    )
    parser.add_argument(
        "--user-id",
        action="append",
        type=numeric_id,
        help="Numeric X user ID. Repeat to add targets.",
    )
    parser.add_argument(
        "--list-id",
        action="append",
        type=numeric_id,
        help="Numeric X list ID. Repeat to add targets.",
    )
    parser.add_argument(
        "--community-id",
        action="append",
        type=numeric_id,
        help="Numeric X community ID. Repeat to add targets.",
    )
    parser.add_argument(
        "--url",
        action="append",
        type=x_url,
        help="Public X target URL. Repeat to add targets.",
    )
    parser.add_argument(
        "--relation",
        action="append",
        choices=RELATIONS,
        help="Relation to export. Repeat for a multi-relation run.",
    )
    parser.add_argument(
        "--max-items",
        type=result_cap,
        default=100,
        help="Run-wide result cap. Default: 100.",
    )
    parser.add_argument(
        "--max-items-per-target",
        type=positive_int,
        help="Optional result cap for each target.",
    )
    parser.add_argument(
        "--output-mode",
        choices=["compact", "full", "raw"],
        default="compact",
        help="Actor output depth. Default: compact.",
    )
    parser.add_argument(
        "--dedupe-mode",
        choices=["none", "first", "merge"],
        default="first",
        help="Duplicate handling. Use merge for overlap analysis. Default: first.",
    )
    parser.add_argument(
        "--min-followers",
        type=nonnegative_int,
        help="Only include profiles with at least this many followers.",
    )
    parser.add_argument(
        "--verified-only",
        action="store_true",
        help="Only include verified profiles.",
    )
    parser.add_argument(
        "--bio-contains",
        help="Only include profiles whose biography contains this text.",
    )
    parser.add_argument(
        "--location-contains",
        help="Only include profiles whose location contains this text.",
    )
    parser.add_argument(
        "--output",
        choices=["json", "summary"],
        default="json",
        help="Output format. Default: json.",
    )
    parser.add_argument(
        "--timeout",
        type=positive_int,
        default=300,
        help="Maximum seconds to wait before requesting an abort. Default: 300.",
    )
    return parser


def main():
    """Run the command-line workflow."""
    parser = build_parser()
    args = parser.parse_args()
    if not any(
        [args.handle, args.user_id, args.list_id, args.community_id, args.url]
    ):
        parser.error("add at least one handle, user ID, list ID, community ID, or URL")

    try:
        token = get_token()
        run_input = build_run_input(args)
        rows = run_apify_actor(token, run_input, timeout=args.timeout)
        profiles, diagnostics, reports = partition_actor_rows(rows)
        report_control_rows(diagnostics, reports)
        profiles.sort(key=profile_sort_key, reverse=True)

        print(f"Returned {len(profiles)} profile records.", file=sys.stderr)
        if args.output == "summary":
            print(format_summary(profiles))
        else:
            print(json.dumps(profiles, indent=2, ensure_ascii=False))
        return 0
    except (
        KeyError,
        RuntimeError,
        TimeoutError,
        TypeError,
        ValueError,
        requests.RequestException,
    ) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
