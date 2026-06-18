#!/usr/bin/env python3
"""Contact cache — track contacts and prevent duplicate outreach.

CSV-backed contact database with dedup by LinkedIn URL or email.
"""

import argparse
import csv
import hashlib
import json
import os
import sys
import tempfile
from datetime import date
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, os.pardir, "data")
CSV_PATH = os.path.join(DATA_DIR, "contacts.csv")

FIELDNAMES = [
    "contact_id",
    "name",
    "email",
    "linkedin_url",
    "company",
    "title",
    "first_seen_date",
    "first_seen_strategy",
    "outreach_status",
    "last_outreach_date",
    "notes",
]

VALID_STATUSES = [
    "new",
    "qualified",
    "contacted",
    "replied",
    "meeting_booked",
    "converted",
    "not_interested",
]

# Flexible column name mappings for CSV import
COLUMN_MAP = {
    "linkedin_url": ["LinkedIn URL", "linkedin_url", "LinkedIn", "linkedin", "Profile URL"],
    "name": ["Name", "name", "Full Name", "full_name"],
    "email": ["Email", "email", "Email Address"],
    "company": ["Company", "company", "Company Name"],
    "title": ["Title", "title", "Job Title", "Position"],
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _normalize_linkedin(url):
    """Lowercase, strip trailing slash, remove query params."""
    url = url.strip().lower()
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def _normalize_email(email):
    return email.strip().lower()


def _make_id(linkedin_url, email):
    """SHA256 hash (first 16 chars) of normalized linkedin URL or email."""
    if linkedin_url:
        key = _normalize_linkedin(linkedin_url)
    elif email:
        key = _normalize_email(email)
    else:
        return None
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def _read_csv():
    """Read the contacts CSV. Returns empty list if file doesn't exist."""
    if not os.path.exists(CSV_PATH):
        return []
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def _write_csv(rows):
    """Atomic write: write to temp file then rename."""
    os.makedirs(DATA_DIR, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=DATA_DIR, suffix=".csv")
    try:
        with os.fdopen(fd, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
            writer.writeheader()
            writer.writerows(rows)
        os.rename(tmp_path, CSV_PATH)
    except Exception:
        # Clean up temp file on failure
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


def _build_index(rows):
    """Map contact_id -> row index for fast lookup."""
    return {row["contact_id"]: i for i, row in enumerate(rows)}


def _resolve_columns(header):
    """Map our internal field names to actual CSV column names."""
    mapping = {}
    for field, aliases in COLUMN_MAP.items():
        mapping[field] = None
        for alias in aliases:
            if alias in header:
                mapping[field] = alias
                break
    return mapping


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------


def cmd_check(args):
    rows = _read_csv()
    index = _build_index(rows)
    result = {}

    if args.linkedin_urls:
        for url in args.linkedin_urls.split(","):
            url = url.strip()
            if not url:
                continue
            cid = _make_id(url, None)
            result[url] = "known" if cid in index else "new"

    if args.emails:
        for email in args.emails.split(","):
            email = email.strip()
            if not email:
                continue
            cid = _make_id(None, email)
            result[email] = "known" if cid in index else "new"

    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")


def cmd_add(args):
    rows = _read_csv()
    index = _build_index(rows)
    today = date.today().isoformat()

    if args.csv:
        _add_from_csv(args, rows, index, today)
    else:
        _add_single(args, rows, index, today)


def _add_single(args, rows, index, today):
    cid = _make_id(args.linkedin_url, args.email)
    if cid is None:
        print("Error: must provide --linkedin-url or --email", file=sys.stderr)
        sys.exit(1)
    if cid in index:
        print(f"Skipping duplicate: {args.name or args.linkedin_url or args.email}", file=sys.stderr)
        return
    row = {
        "contact_id": cid,
        "name": args.name or "",
        "email": args.email or "",
        "linkedin_url": args.linkedin_url or "",
        "company": args.company or "",
        "title": args.title or "",
        "first_seen_date": today,
        "first_seen_strategy": args.strategy or "",
        "outreach_status": "new",
        "last_outreach_date": "",
        "notes": "",
    }
    rows.append(row)
    _write_csv(rows)
    print(f"Added: {args.name or cid}", file=sys.stderr)


def _add_from_csv(args, rows, index, today):
    with open(args.csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        col_map = _resolve_columns(reader.fieldnames or [])

    added = 0
    skipped = 0

    with open(args.csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for src_row in reader:
            linkedin_url = src_row.get(col_map["linkedin_url"] or "", "").strip()
            email = src_row.get(col_map["email"] or "", "").strip()
            name = src_row.get(col_map["name"] or "", "").strip()
            company = src_row.get(col_map["company"] or "", "").strip()
            title_val = src_row.get(col_map["title"] or "", "").strip()

            cid = _make_id(linkedin_url or None, email or None)
            if cid is None:
                skipped += 1
                continue
            if cid in index:
                skipped += 1
                continue

            row = {
                "contact_id": cid,
                "name": name,
                "email": email,
                "linkedin_url": linkedin_url,
                "company": company,
                "title": title_val,
                "first_seen_date": today,
                "first_seen_strategy": args.strategy or "",
                "outreach_status": "new",
                "last_outreach_date": "",
                "notes": "",
            }
            rows.append(row)
            index[cid] = len(rows) - 1
            added += 1

    _write_csv(rows)
    print(f"Added {added} new contacts, skipped {skipped} duplicates", file=sys.stderr)


def cmd_update(args):
    rows = _read_csv()
    index = _build_index(rows)

    cid = _make_id(args.linkedin_url, args.email)
    if cid is None:
        print("Error: must provide --linkedin-url or --email", file=sys.stderr)
        sys.exit(1)

    if cid not in index:
        print("Error: contact not found", file=sys.stderr)
        sys.exit(1)

    row = rows[index[cid]]
    if args.status:
        if args.status not in VALID_STATUSES:
            print(f"Error: invalid status '{args.status}'. Valid: {', '.join(VALID_STATUSES)}", file=sys.stderr)
            sys.exit(1)
        row["outreach_status"] = args.status
        row["last_outreach_date"] = date.today().isoformat()
    if args.notes:
        row["notes"] = args.notes

    _write_csv(rows)
    print(f"Updated: {row['name'] or cid}", file=sys.stderr)


def cmd_export(args):
    rows = _read_csv()

    # Apply filters
    if args.status:
        rows = [r for r in rows if r["outreach_status"] == args.status]
    if args.strategy:
        rows = [r for r in rows if r["first_seen_strategy"] == args.strategy]

    fmt = args.format or "csv"
    if fmt == "json":
        json.dump(rows, sys.stdout, indent=2)
        sys.stdout.write("\n")
    else:
        writer = csv.DictWriter(sys.stdout, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)


def cmd_stats(args):
    rows = _read_csv()

    if not rows:
        print("Contact Cache Statistics")
        print("========================")
        print("Total contacts: 0")
        return

    status_counts = {}
    strategy_counts = {}
    dates = []

    for row in rows:
        s = row.get("outreach_status", "new")
        status_counts[s] = status_counts.get(s, 0) + 1
        strat = row.get("first_seen_strategy", "")
        if strat:
            strategy_counts[strat] = strategy_counts.get(strat, 0) + 1
        d = row.get("first_seen_date", "")
        if d:
            dates.append(d)

    print("Contact Cache Statistics")
    print("========================")
    print(f"Total contacts: {len(rows)}")

    print("By status:")
    for s in VALID_STATUSES:
        count = status_counts.get(s, 0)
        if count:
            print(f"  {s}: {count}")

    if strategy_counts:
        print("By strategy:")
        for strat, count in sorted(strategy_counts.items()):
            print(f"  {strat}: {count}")

    if dates:
        print(f"Date range: {min(dates)} to {max(dates)}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(
        prog="cache.py",
        description="Contact cache — track contacts and prevent duplicate outreach.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
examples:
  # Check if contacts exist
  python3 cache.py check --linkedin-urls "https://linkedin.com/in/person1,https://linkedin.com/in/person2"
  python3 cache.py check --emails "john@example.com,jane@example.com"

  # Add a contact
  python3 cache.py add --name "John Smith" --linkedin-url "https://linkedin.com/in/johnsmith" --strategy "2A-hiring-signal"

  # Bulk import
  python3 cache.py add --csv leads.csv --strategy "2A-hiring-signal"

  # Update status
  python3 cache.py update --linkedin-url "https://linkedin.com/in/johnsmith" --status contacted --notes "Sent email"

  # Export
  python3 cache.py export --format json --status contacted

  # Stats
  python3 cache.py stats
""",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # -- check --
    p_check = subparsers.add_parser("check", help="Check if contacts are already cached")
    p_check.add_argument("--linkedin-urls", help="Comma-separated LinkedIn URLs")
    p_check.add_argument("--emails", help="Comma-separated email addresses")

    # -- add --
    p_add = subparsers.add_parser("add", help="Add contacts to the cache")
    p_add.add_argument("--name", help="Contact full name")
    p_add.add_argument("--linkedin-url", help="LinkedIn profile URL")
    p_add.add_argument("--email", help="Email address")
    p_add.add_argument("--company", help="Company name")
    p_add.add_argument("--title", help="Job title")
    p_add.add_argument("--strategy", help="Strategy that sourced this contact")
    p_add.add_argument("--csv", help="Path to CSV file for bulk import")

    # -- update --
    p_update = subparsers.add_parser("update", help="Update a contact's status")
    p_update.add_argument("--linkedin-url", help="LinkedIn profile URL")
    p_update.add_argument("--email", help="Email address")
    p_update.add_argument("--status", help=f"New status ({', '.join(VALID_STATUSES)})")
    p_update.add_argument("--notes", help="Notes to attach")

    # -- export --
    p_export = subparsers.add_parser("export", help="Export the contact cache")
    p_export.add_argument("--format", choices=["csv", "json"], default="csv", help="Output format")
    p_export.add_argument("--status", help="Filter by outreach status")
    p_export.add_argument("--strategy", help="Filter by strategy")

    # -- stats --
    subparsers.add_parser("stats", help="Print summary statistics")

    args = parser.parse_args()

    commands = {
        "check": cmd_check,
        "add": cmd_add,
        "update": cmd_update,
        "export": cmd_export,
        "stats": cmd_stats,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
