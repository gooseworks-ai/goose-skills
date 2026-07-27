#!/usr/bin/env python3
"""Search public X posts with an explicitly selected Apify Actor."""

import argparse
from datetime import date
import json
import os
import sys
import time

import requests


ACTOR_IDS = {
    "apidojo": "apidojo~tweet-scraper",
    "xquik": "xquik~x-tweet-scraper",
}
DEFAULT_ACTOR = "apidojo"
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
QUERY_TYPES = {
    "latest": "Latest",
    "top": "Top",
    "latest+top": "Latest + Top",
}


def positive_int(value):
    """Parse a positive integer for argparse."""
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("value must be at least 1")
    return parsed


def result_cap(value):
    """Parse the minimum result cap accepted by both Actor schemas."""
    parsed = positive_int(value)
    if parsed < 20:
        raise argparse.ArgumentTypeError("result cap must be at least 20")
    return parsed


def iso_date(value):
    """Parse and normalize an ISO date for argparse."""
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError as error:
        raise argparse.ArgumentTypeError("date must use YYYY-MM-DD") from error


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


def build_search_term(query, since=None, until=None):
    """Preserve an X query and append optional native date operators."""
    term = query.strip()
    if not term:
        raise ValueError("Search query cannot be empty.")
    if since:
        term = f"{term} since:{since}"
    if until:
        term = f"{term} until:{until}"
    return term


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


def build_run_input(actor, search_terms, max_tweets, query_type):
    """Build one Actor's input without mixing provider-specific fields."""
    if actor == "apidojo":
        if query_type != "latest":
            raise ValueError("--query-type is only supported with --actor xquik.")
        return {
            "searchTerms": search_terms,
            "maxTweets": max_tweets,
            "searchMode": "live",
        }

    return {
        "searchTerms": search_terms,
        "maxItems": max_tweets,
        "queryType": QUERY_TYPES[query_type],
        "outputVariant": "rich",
        "fieldStyle": "camelCase",
        "includeSearchTerms": True,
    }


def run_apify_actor(
    token,
    search_terms,
    max_tweets=50,
    timeout=300,
    query_type="latest",
    actor=DEFAULT_ACTOR,
    session=requests,
    sleep=time.sleep,
    clock=time.monotonic,
):
    """Run the Actor, wait for a terminal status, and return dataset rows."""
    if actor not in ACTOR_IDS:
        raise ValueError(f"Unsupported Actor route: {actor}")
    actor_id = ACTOR_IDS[actor]
    run_input = build_run_input(actor, search_terms, max_tweets, query_type)
    headers = authorization_headers(token)
    start_headers = {**headers, "Content-Type": "application/json"}

    print(f"Starting paid Apify Actor run ({actor_id}).", file=sys.stderr)
    print(f"Run-wide item cap: {max_tweets}", file=sys.stderr)

    start_response = session.post(
        f"{BASE_URL}/acts/{actor_id}/runs",
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
    """Separate tweet records from control rows."""
    tweets = []
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
            tweets.append(row)
    return tweets, diagnostics, reports


def dedup_tweets(tweets):
    """Deduplicate tweets by stable identifiers or content."""
    seen = set()
    deduped = []
    for tweet in tweets:
        key = (
            tweet.get("id")
            or tweet.get("restId")
            or tweet.get("tweetUrl")
            or tweet.get("twitterUrl")
            or tweet.get("url")
            or json.dumps(tweet, sort_keys=True, default=str)
        )
        if key not in seen:
            seen.add(key)
            deduped.append(tweet)
    return deduped


def filter_tweets(tweets, keywords=None):
    """Apply an optional case-insensitive OR keyword filter."""
    if not keywords:
        return tweets

    normalized_keywords = [keyword.casefold() for keyword in keywords if keyword]
    return [
        tweet
        for tweet in tweets
        if any(
            keyword
            in " ".join(
                [
                    str(tweet.get("text", "")),
                    str(tweet.get("fullText", "")),
                    str(tweet.get("full_text", "")),
                ]
            ).casefold()
            for keyword in normalized_keywords
        )
    ]


def integer_value(value):
    """Convert numeric output fields to sortable integers."""
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def like_count(tweet):
    """Read a like count from supported field styles."""
    return integer_value(tweet.get("likeCount", tweet.get("like_count", 0)))


def format_summary(tweets):
    """Format tweet rows as a compact table."""
    lines = [f"{'#':<4} {'Likes':<7} {'Reposts':<9} {'Author':<20} Text"]
    lines.append("-" * 104)
    for index, tweet in enumerate(tweets, 1):
        text = (
            tweet.get("text")
            or tweet.get("fullText")
            or tweet.get("full_text")
            or ""
        )
        text = str(text)[:60].replace("\n", " ")
        author = tweet.get("author") if isinstance(tweet.get("author"), dict) else {}
        username = (
            author.get("userName")
            or author.get("username")
            or tweet.get("authorUsername")
            or tweet.get("author_username")
            or ""
        )
        reposts = integer_value(
            tweet.get("retweetCount", tweet.get("retweet_count", 0))
        )
        lines.append(
            f"{index:<4} {like_count(tweet):<7} {reposts:<9} "
            f"{str(username)[:18]:<20} {text}"
        )
    return "\n".join(lines)


def report_control_rows(diagnostics, reports):
    """Describe non-data rows without mixing them into tweet output."""
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
        description="Search public X posts with a selected Apify Actor."
    )
    parser.add_argument(
        "--query",
        required=True,
        help="X search query. Existing operators are preserved.",
    )
    parser.add_argument(
        "--since",
        type=iso_date,
        help="Inclusive start date in YYYY-MM-DD format.",
    )
    parser.add_argument(
        "--until",
        type=iso_date,
        help="Exclusive end date in YYYY-MM-DD format.",
    )
    parser.add_argument(
        "--max-tweets",
        type=result_cap,
        default=50,
        help="Run-wide result cap. Default: 50.",
    )
    parser.add_argument(
        "--query-type",
        choices=sorted(QUERY_TYPES),
        default="latest",
        help="Xquik search ranking mode. Default: latest.",
    )
    parser.add_argument(
        "--actor",
        choices=tuple(ACTOR_IDS),
        default=DEFAULT_ACTOR,
        help="Tweet Actor route. Default: apidojo.",
    )
    parser.add_argument(
        "--keywords",
        help="Optional comma-separated client-side filter with OR logic.",
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
    if args.since and args.until and args.since >= args.until:
        parser.error("--since must be earlier than --until")

    try:
        token = get_token()
        search_term = build_search_term(args.query, args.since, args.until)
        rows = run_apify_actor(
            token,
            [search_term],
            max_tweets=args.max_tweets,
            timeout=args.timeout,
            query_type=args.query_type,
            actor=args.actor,
        )
        tweets, diagnostics, reports = partition_actor_rows(rows)
        report_control_rows(diagnostics, reports)
        tweets = dedup_tweets(tweets)

        if args.keywords:
            keywords = [
                keyword.strip()
                for keyword in args.keywords.split(",")
                if keyword.strip()
            ]
            tweets = filter_tweets(tweets, keywords)

        tweets.sort(key=like_count, reverse=True)
        print(f"Returned {len(tweets)} tweet records.", file=sys.stderr)
        if args.output == "summary":
            print(format_summary(tweets))
        else:
            print(json.dumps(tweets, indent=2, ensure_ascii=False))
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
