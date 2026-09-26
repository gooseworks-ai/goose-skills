#!/usr/bin/env python3
"""
Extruct List Builder — Company Discovery Pipeline
---------------------------------------------------
Build targeted company lists using Extruct semantic search,
lookalike search, and Deep Search. Deduplicates by domain,
uploads results to an Extruct table, and exports CSV.

Usage:
    # Semantic search
    python3 list_builder.py --mode search \
      --query "AI procurement startups" --limit 50

    # Lookalike search
    python3 list_builder.py --mode lookalike \
      --seed stripe.com --limit 50

    # Deep Search
    python3 list_builder.py --mode deep \
      --query "vertical SaaS for freight forwarding" \
      --num-results 25

    # Upload results to table
    python3 list_builder.py --mode search \
      --query "..." --limit 50 --upload --table-name "Target Accounts"

    # Dry run (no API calls)
    python3 list_builder.py --mode search --query "..." --dry-run

    # With filters
    python3 list_builder.py --mode search \
      --query "enterprise sales AI" --limit 50 \
      --filters '{"include":{"country":["United States"],"size":["51-200"]}}'

Environment:
    EXTRUCT_API_TOKEN: Required. Get at https://app.extruct.ai/settings
"""

import argparse
import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extruct_client import ExtructClient

# ── Pricing ───────────────────────────────────────────────────

PLANS = {
    "free":    {"price": 0,   "credits": 10,   "features": ["instant"]},
    "starter": {"price": 49,  "credits": 600,  "features": ["instant", "lookalike"]},
    "pro":     {"price": 149, "credits": 2000, "features": ["instant", "lookalike", "deep", "enrichment"]},
}

CREDIT_WEIGHTS = {
    "instant": 1,
    "lookalike": 1,
    "deep": 2,
}


def effective_cost(plan, operation, num_results):
    """Calculate dollar cost for an operation on a given plan."""
    plan_info = PLANS[plan]
    cost_per_credit = plan_info["price"] / plan_info["credits"] if plan_info["credits"] > 0 else 0
    credits_used = num_results * CREDIT_WEIGHTS[operation]
    return credits_used, round(credits_used * cost_per_credit, 2)


def estimate_cost(plan, operations):
    """Estimate total cost across multiple operations.

    Args:
        plan: "free", "starter", or "pro"
        operations: list of (operation_type, num_results) tuples

    Returns:
        (total_credits, total_dollars, breakdown_lines)
    """
    total_credits = 0
    total_dollars = 0
    lines = []
    for op, count in operations:
        credits, dollars = effective_cost(plan, op, count)
        total_credits += credits
        total_dollars += dollars
        lines.append(f"  {count} {op} results × {CREDIT_WEIGHTS[op]} credit(s) = {credits} credits (${dollars:.2f})")
    return total_credits, total_dollars, lines


# ── Deduplication ─────────────────────────────────────────────

def deduplicate_by_domain(companies):
    """Deduplicate company list by domain. Returns (unique, dupe_count)."""
    seen = set()
    unique = []
    for c in companies:
        domain = (c.get("domain") or c.get("website") or "").strip().lower()
        if domain and domain not in seen:
            seen.add(domain)
            unique.append(c)
    return unique, len(companies) - len(unique)


def remove_dnc(companies, dnc_domains):
    """Remove companies whose domain is in the DNC list."""
    dnc_set = {d.strip().lower() for d in dnc_domains}
    filtered = [
        c for c in companies
        if (c.get("domain") or c.get("website") or "").strip().lower() not in dnc_set
    ]
    return filtered, len(companies) - len(filtered)


# ── Search Operations ─────────────────────────────────────────

def run_search(client, query, limit, filters=None):
    """Run paginated semantic search."""
    all_results = []
    offset = 0
    page_size = min(limit, 50)

    while len(all_results) < limit:
        remaining = limit - len(all_results)
        batch_size = min(page_size, remaining)
        resp = client.search(query, limit=batch_size, offset=offset, filters=filters)
        results = resp if isinstance(resp, list) else resp.get("results", resp.get("companies", []))
        if not results:
            break
        all_results.extend(results)
        offset += len(results)
        if len(results) < batch_size:
            break

    return all_results[:limit]


def run_lookalike(client, seed, limit, filters=None):
    """Run paginated lookalike search."""
    all_results = []
    offset = 0
    page_size = min(limit, 50)

    while len(all_results) < limit:
        remaining = limit - len(all_results)
        batch_size = min(page_size, remaining)
        resp = client.lookalike(seed, limit=batch_size, offset=offset, filters=filters)
        results = resp if isinstance(resp, list) else resp.get("results", resp.get("companies", []))
        if not results:
            break
        all_results.extend(results)
        offset += len(results)
        if len(results) < batch_size:
            break

    return all_results[:limit]


def run_deep_search(client, query, num_results, criteria=None):
    """Create and poll a Deep Search task."""
    print(f"  Creating Deep Search task ({num_results} results)...")
    task = client.deep_search_create(query, num_results=num_results, criteria=criteria)
    task_id = task.get("id") or task.get("task_id")
    if not task_id:
        print(f"Error: Deep Search create returned no task ID: {task}")
        sys.exit(1)
    print(f"  Task ID: {task_id}")
    print(f"  Polling until complete...")

    final = client.deep_search_poll(task_id)
    print(f"  Task status: {final.get('status')}")

    results_resp = client.deep_search_results(task_id, limit=num_results)
    results = results_resp if isinstance(results_resp, list) else results_resp.get("results", [])
    return results


# ── Table Upload ──────────────────────────────────────────────

def upload_to_table(client, companies, table_name):
    """Create a company table and upload domains."""
    print(f"\n  Creating table: {table_name}")
    table = client.tables_create(table_name, kind="company")
    table_id = table.get("id") or table.get("table_id")
    print(f"  Table ID: {table_id}")

    rows = []
    for c in companies:
        domain = c.get("domain") or c.get("website") or ""
        if domain:
            rows.append({"data": {"input": domain}})

    # Upload in batches of 100
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        client.rows_create(table_id, batch, run=False)
        print(f"  Uploaded rows {i + 1}-{i + len(batch)} of {len(rows)}")

    print(f"  Table URL: https://app.extruct.ai/tables/{table_id}")
    return table_id


# ── CSV Export ────────────────────────────────────────────────

def export_csv(companies, output_path):
    """Export companies to CSV."""
    if not companies:
        print("  No companies to export.")
        return

    # Collect all keys across all companies
    all_keys = []
    seen_keys = set()
    for c in companies:
        for k in c.keys():
            if k not in seen_keys:
                all_keys.append(k)
                seen_keys.add(k)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=all_keys, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(companies)

    print(f"  Exported {len(companies)} companies to {output_path}")


# ── Main ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Extruct List Builder — company discovery pipeline",
    )
    parser.add_argument("--mode", required=True, choices=["search", "lookalike", "deep"],
                        help="Search method: search, lookalike, or deep")
    parser.add_argument("--query", help="Search query (for search and deep modes)")
    parser.add_argument("--seed", help="Seed company domain (for lookalike mode)")
    parser.add_argument("--limit", type=int, default=50, help="Max results (default: 50)")
    parser.add_argument("--num-results", type=int, default=25,
                        help="Desired results for Deep Search (default: 25)")
    parser.add_argument("--filters", help="JSON filters string")
    parser.add_argument("--criteria-file", help="JSON file with Deep Search criteria")
    parser.add_argument("--dnc", help="Path to DNC list (one domain per line)")
    parser.add_argument("--upload", action="store_true", help="Upload results to Extruct table")
    parser.add_argument("--table-name", default="List Build", help="Table name for upload")
    parser.add_argument("--output", "-o", help="Output CSV path")
    parser.add_argument("--plan", default="pro", choices=["free", "starter", "pro"],
                        help="Your Extruct plan (for cost estimation)")
    parser.add_argument("--dry-run", action="store_true", help="Show cost estimate only")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation")

    args = parser.parse_args()

    # Validate args
    if args.mode in ("search", "deep") and not args.query:
        print("Error: --query required for search and deep modes")
        sys.exit(1)
    if args.mode == "lookalike" and not args.seed:
        print("Error: --seed required for lookalike mode")
        sys.exit(1)

    # Check feature access
    plan_info = PLANS[args.plan]
    mode_map = {"search": "instant", "lookalike": "lookalike", "deep": "deep"}
    op_type = mode_map[args.mode]
    if op_type not in plan_info["features"]:
        print(f"Error: {args.mode} requires a plan with '{op_type}' access.")
        print(f"  Your plan: {args.plan} ({', '.join(plan_info['features'])})")
        print(f"  Upgrade at https://app.extruct.ai/settings")
        sys.exit(1)

    # Cost estimate
    num = args.num_results if args.mode == "deep" else args.limit
    total_credits, total_dollars, breakdown = estimate_cost(args.plan, [(op_type, num)])

    print(f"\nExtruct List Builder")
    print(f"  Mode: {args.mode}")
    print(f"  Plan: {args.plan} (${plan_info['price']}/mo, {plan_info['credits']} credits)")
    print(f"  Estimated cost:")
    for line in breakdown:
        print(line)
    print(f"  Total: {total_credits} credits (${total_dollars:.2f})")
    print()

    if args.dry_run:
        print("Dry run — no API calls.")
        sys.exit(0)

    if not args.yes:
        confirm = input("Proceed? [y/N] ").strip().lower()
        if confirm != "y":
            print("Cancelled.")
            sys.exit(0)

    # Initialize client
    api_token = os.getenv("EXTRUCT_API_TOKEN")
    if not api_token:
        print("Error: EXTRUCT_API_TOKEN not set")
        print("Get token: https://app.extruct.ai/settings")
        sys.exit(1)

    client = ExtructClient(api_token)

    # Verify auth
    try:
        client.auth_user()
        print("  Auth verified.")
    except Exception as e:
        print(f"  Auth failed: {e}")
        sys.exit(1)

    # Parse filters
    filters = None
    if args.filters:
        try:
            filters = json.loads(args.filters)
        except json.JSONDecodeError as e:
            print(f"Error: invalid --filters JSON: {e}")
            sys.exit(1)

    # Run search
    print(f"\n  Running {args.mode}...")
    if args.mode == "search":
        companies = run_search(client, args.query, args.limit, filters=filters)
    elif args.mode == "lookalike":
        companies = run_lookalike(client, args.seed, args.limit, filters=filters)
    elif args.mode == "deep":
        criteria = None
        if args.criteria_file:
            with open(args.criteria_file) as f:
                criteria = json.load(f).get("criteria")
        companies = run_deep_search(client, args.query, args.num_results, criteria=criteria)

    print(f"  Raw results: {len(companies)}")

    # Deduplicate
    companies, dupe_count = deduplicate_by_domain(companies)
    if dupe_count:
        print(f"  Removed {dupe_count} duplicates")

    # DNC filter
    if args.dnc:
        with open(args.dnc) as f:
            dnc_domains = [line.strip() for line in f if line.strip()]
        companies, dnc_count = remove_dnc(companies, dnc_domains)
        if dnc_count:
            print(f"  Removed {dnc_count} DNC domains")

    print(f"  Final list: {len(companies)} companies")

    # Upload to table
    if args.upload:
        table_name = args.table_name or f"List Build - {datetime.now().strftime('%Y-%m-%d')}"
        upload_to_table(client, companies, table_name)

    # Export CSV
    if args.output:
        output_path = args.output
    else:
        script_dir = Path(__file__).parent.parent
        output_dir = script_dir / "output"
        output_dir.mkdir(exist_ok=True)
        slug = args.query[:30].replace(" ", "-").lower() if args.query else args.seed
        output_path = str(output_dir / f"{slug}-{datetime.now().strftime('%Y-%m-%d')}.csv")

    export_csv(companies, output_path)

    # Summary
    print(f"\n  Summary:")
    print(f"    Method: {args.mode}")
    print(f"    Results: {len(companies)} companies")
    print(f"    Cost: {total_credits} credits (${total_dollars:.2f})")
    print(f"    Output: {output_path}")
    if args.upload:
        print(f"    Table: uploaded")


if __name__ == "__main__":
    main()
