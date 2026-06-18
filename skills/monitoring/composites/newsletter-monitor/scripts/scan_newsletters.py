#!/usr/bin/env python3
"""
Newsletter Monitor — Scan an AgentMail inbox for newsletter signals using
configurable keyword campaigns.

Usage:
    # Scan inbox with all campaigns
    python3 scan_newsletters.py

    # Specific campaign
    python3 scan_newsletters.py --campaign acquisitions

    # Last 7 days only
    python3 scan_newsletters.py --days 7

    # Custom keywords (override campaigns)
    python3 scan_newsletters.py --keywords "Sage Intacct,migration"

    # Output format
    python3 scan_newsletters.py --output json     # default
    python3 scan_newsletters.py --output summary

    # Override inbox
    python3 scan_newsletters.py --inbox "other@agentmail.to"

    # Limit messages to scan
    python3 scan_newsletters.py --limit 50

Environment:
    AGENTMAIL_API_KEY: Your AgentMail API key
    AGENTMAIL_INBOX:   Inbox address (default: supergoose@agentmail.to)
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv is optional; env vars can be set directly

try:
    from agentmail import AgentMail
except ImportError:
    print(
        "ERROR: 'agentmail' package required. Install with: pip3 install agentmail python-dotenv",
        file=sys.stderr,
    )
    sys.exit(1)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def strip_html(html_text):
    """Strip HTML tags and decode common entities."""
    if not html_text:
        return ""
    text = re.sub(r"<[^>]+>", " ", html_text)
    text = (
        text.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&#39;", "'")
        .replace("&quot;", '"')
    )
    text = re.sub(r"\s+", " ", text).strip()
    return text


def get_message_text(message):
    """Extract plain-text content from a message object."""
    text = getattr(message, "text", None) or ""
    if not text:
        html = getattr(message, "html", None) or ""
        text = strip_html(html)
    return text


def get_message_field(message, field, default=None):
    """Safely get a field from a message, supporting both dict and object."""
    if isinstance(message, dict):
        return message.get(field, default)
    return getattr(message, field, default)


def parse_timestamp(ts):
    """Parse an ISO-8601 timestamp string into a datetime (UTC)."""
    if not ts:
        return None
    try:
        if isinstance(ts, datetime):
            if ts.tzinfo is None:
                return ts.replace(tzinfo=timezone.utc)
            return ts
        ts_str = str(ts)
        ts_str = ts_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def format_date(ts):
    """Format a timestamp for display."""
    dt = parse_timestamp(ts)
    if dt:
        return dt.strftime("%Y-%m-%d")
    return str(ts) if ts else "unknown"


def format_datetime_iso(ts):
    """Format a timestamp as ISO-8601 string."""
    dt = parse_timestamp(ts)
    if dt:
        return dt.isoformat()
    return str(ts) if ts else ""


def extract_from_address(message):
    """Get the sender address from a message."""
    from_field = get_message_field(message, "from_") or get_message_field(message, "from") or ""
    if isinstance(from_field, list):
        if len(from_field) > 0:
            item = from_field[0]
            if isinstance(item, dict):
                return item.get("email", str(item))
            return getattr(item, "email", str(item))
        return ""
    if isinstance(from_field, str):
        return from_field
    return getattr(from_field, "email", str(from_field))


def extract_context_snippet(text, match_start, match_end, window=100):
    """Return a ~200-char window around a keyword match."""
    start = max(0, match_start - window)
    end = min(len(text), match_end + window)
    snippet = text[start:end].strip()
    prefix = "..." if start > 0 else ""
    suffix = "..." if end < len(text) else ""
    return f"{prefix}{snippet}{suffix}"


# Common words to skip in company-name extraction
_SKIP_WORDS = {
    "The", "In", "At", "On", "For", "And", "Of", "By", "To", "With", "From",
    "This", "That", "These", "Those", "Our", "Their", "Its", "Has", "Was",
    "Were", "Are", "Been", "Will", "Would", "Could", "Should", "May", "Can",
    "About", "Into", "Over", "After", "Before", "Between", "Under", "New",
    "All", "Each", "Every", "Both", "Many", "Most", "Some", "Any", "More",
    "Read", "Click", "View", "See", "Learn", "Get", "How", "Why", "What",
    "When", "Where", "Who", "Which",
}


def extract_companies(text, match_positions, window=150):
    """
    Heuristic: find capitalized multi-word phrases (2-4 words) near keyword
    matches. Skip common words.
    """
    companies = set()
    pattern = re.compile(r"\b([A-Z][a-z]+(?:\s+(?:&\s+)?[A-Z][a-z]+){1,3})\b")

    for pos_start, pos_end in match_positions:
        region_start = max(0, pos_start - window)
        region_end = min(len(text), pos_end + window)
        region = text[region_start:region_end]

        for m in pattern.finditer(region):
            candidate = m.group(1)
            words = candidate.split()
            if words[0] in _SKIP_WORDS:
                continue
            non_skip = [w for w in words if w not in _SKIP_WORDS and w != "&"]
            if len(non_skip) >= 1:
                companies.add(candidate)

    return sorted(companies)


# ---------------------------------------------------------------------------
# Core scanning logic
# ---------------------------------------------------------------------------

def load_campaigns(config_path, campaign_filter=None):
    """Load keyword campaigns from JSON config."""
    try:
        with open(config_path, "r") as f:
            all_campaigns = json.load(f)
    except FileNotFoundError:
        print(f"ERROR: Campaign config not found at {config_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in {config_path}: {e}", file=sys.stderr)
        sys.exit(1)

    if campaign_filter:
        if campaign_filter not in all_campaigns:
            available = ", ".join(all_campaigns.keys())
            print(
                f"ERROR: Unknown campaign '{campaign_filter}'. Available: {available}",
                file=sys.stderr,
            )
            sys.exit(1)
        return {campaign_filter: all_campaigns[campaign_filter]}

    return all_campaigns


def scan_message(message, campaigns, custom_keywords=None):
    """
    Scan a single message against campaigns (or custom keywords).
    Returns a result dict if any keywords match, else None.
    """
    subject = get_message_field(message, "subject") or ""
    body = get_message_text(message)
    full_text = f"{subject} {body}"
    full_text_lower = full_text.lower()

    matched_campaigns = []
    matched_keywords = []
    match_positions = []

    if custom_keywords:
        for kw in custom_keywords:
            kw_lower = kw.strip().lower()
            if not kw_lower:
                continue
            idx = 0
            while True:
                pos = full_text_lower.find(kw_lower, idx)
                if pos == -1:
                    break
                if kw.strip() not in matched_keywords:
                    matched_keywords.append(kw.strip())
                match_positions.append((pos, pos + len(kw_lower)))
                idx = pos + 1
    else:
        for campaign_name, campaign_data in campaigns.items():
            campaign_matched = False
            for kw in campaign_data.get("keywords", []):
                kw_lower = kw.lower()
                idx = 0
                while True:
                    pos = full_text_lower.find(kw_lower, idx)
                    if pos == -1:
                        break
                    if not campaign_matched:
                        matched_campaigns.append(campaign_name)
                        campaign_matched = True
                    if kw not in matched_keywords:
                        matched_keywords.append(kw)
                    match_positions.append((pos, pos + len(kw_lower)))
                    idx = pos + 1

    if not matched_keywords:
        return None

    # Extract context snippets (deduplicated)
    seen_snippets = set()
    context_snippets = []
    for start, end in match_positions:
        snippet = extract_context_snippet(full_text, start, end)
        if snippet not in seen_snippets:
            seen_snippets.add(snippet)
            context_snippets.append(snippet)

    # Extract company mentions near matches
    companies = extract_companies(full_text, match_positions)

    timestamp = get_message_field(message, "timestamp") or ""

    return {
        "message_id": get_message_field(message, "message_id") or "",
        "from": extract_from_address(message),
        "subject": subject,
        "date": format_datetime_iso(timestamp),
        "matched_campaigns": matched_campaigns if not custom_keywords else ["custom"],
        "matched_keywords": matched_keywords,
        "context_snippets": context_snippets,
        "companies_mentioned": companies,
    }


# ---------------------------------------------------------------------------
# Output formatters
# ---------------------------------------------------------------------------

def output_json(results):
    """Print results as JSON."""
    print(json.dumps(results, indent=2, ensure_ascii=False))


def output_summary(results, inbox, total_scanned, days=None):
    """Print a human-readable summary."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    print(f"Newsletter Monitor -- {today}")
    print("=" * 40)

    days_str = f" (last {days} days)" if days else ""
    print(f"Scanned {total_scanned} emails in {inbox}{days_str}")
    print(f"Found {len(results)} emails matching campaign keywords")

    if not results:
        print("\nNo matching emails found.")
        return

    print()
    for r in results:
        campaigns_str = ", ".join(r["matched_campaigns"])
        print(f"[{campaigns_str}] From: {r['from']}")
        print(f"  Subject: {r['subject']}")
        print(f"  Date: {format_date(r['date'])}")
        print(f"  Keywords: {', '.join(r['matched_keywords'])}")
        if r["context_snippets"]:
            snippet = r["context_snippets"][0]
            if len(snippet) > 120:
                snippet = snippet[:120] + "..."
            print(f'  Snippet: "{snippet}"')
        if r["companies_mentioned"]:
            print(f"  Companies: {', '.join(r['companies_mentioned'])}")
        print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Scan AgentMail inbox for newsletter signals using keyword campaigns."
    )
    parser.add_argument(
        "--campaign",
        help="Run only a specific campaign (e.g. acquisitions, sage_intacct, staffing, technology)",
    )
    parser.add_argument(
        "--days",
        type=int,
        help="Only process messages from the last N days",
    )
    parser.add_argument(
        "--keywords",
        help="Comma-separated custom keywords (overrides campaigns)",
    )
    parser.add_argument(
        "--output",
        choices=["json", "summary"],
        default="json",
        help="Output format (default: json)",
    )
    parser.add_argument(
        "--inbox",
        help="Override inbox address (default: AGENTMAIL_INBOX env or supergoose@agentmail.to)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Max messages to fetch (default: 100)",
    )

    args = parser.parse_args()

    # --- Resolve config ---
    script_dir = Path(__file__).resolve().parent
    config_path = script_dir.parent / "config" / "campaigns.json"

    # --- Resolve inbox ---
    inbox = args.inbox or os.getenv("AGENTMAIL_INBOX", "supergoose@agentmail.to")

    # --- API key ---
    api_key = os.getenv("AGENTMAIL_API_KEY")
    if not api_key:
        print(
            "ERROR: AGENTMAIL_API_KEY environment variable is not set.\n"
            "Set it with: export AGENTMAIL_API_KEY='your_key_here'\n"
            "Or add it to a .env file in the project root.",
            file=sys.stderr,
        )
        sys.exit(1)

    # --- Load campaigns ---
    custom_keywords = None
    campaigns = {}
    if args.keywords:
        custom_keywords = [k.strip() for k in args.keywords.split(",") if k.strip()]
        if not custom_keywords:
            print("ERROR: --keywords provided but no valid keywords found.", file=sys.stderr)
            sys.exit(1)
    else:
        campaigns = load_campaigns(config_path, args.campaign)

    # --- Init client ---
    client = AgentMail(api_key=api_key)

    # --- Fetch messages ---
    cutoff = None
    if args.days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=args.days)

    all_messages = []
    try:
        response = client.inboxes.messages.list(inbox_id=inbox, limit=args.limit)
        messages = response.messages if hasattr(response, "messages") else response
        if messages:
            all_messages.extend(messages)
    except Exception as e:
        error_str = str(e)
        if "not found" in error_str.lower() or "404" in error_str:
            print(f"ERROR: Inbox '{inbox}' not found. Check the address and try again.", file=sys.stderr)
        else:
            print(f"ERROR: Failed to fetch messages from '{inbox}': {e}", file=sys.stderr)
        sys.exit(1)

    if not all_messages:
        if args.output == "summary":
            print(f"No messages found in {inbox}.")
        else:
            print("[]")
        sys.exit(0)

    # --- Filter by date ---
    if cutoff:
        filtered = []
        for msg in all_messages:
            ts = parse_timestamp(get_message_field(msg, "timestamp"))
            if ts and ts >= cutoff:
                filtered.append(msg)
        all_messages = filtered

    total_scanned = len(all_messages)

    # --- Scan messages ---
    results = []
    for msg in all_messages:
        result = scan_message(msg, campaigns, custom_keywords)
        if result:
            results.append(result)

    # --- Output ---
    if args.output == "summary":
        output_summary(results, inbox, total_scanned, args.days)
    else:
        output_json(results)


if __name__ == "__main__":
    main()
