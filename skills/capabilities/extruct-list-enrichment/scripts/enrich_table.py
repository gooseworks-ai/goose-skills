#!/usr/bin/env python3
"""
Extruct Table Enrichment — Add Research Columns Pipeline
---------------------------------------------------------
Add enrichment columns to an existing Extruct company table,
trigger enrichment runs, monitor progress, and export results.

Usage:
    # Add a single column and run enrichment
    python3 enrich_table.py --table-id <TABLE_ID> \
      --column-name "Latest Funding" \
      --prompt "What is the latest funding round for {input}?" \
      --format text

    # Add column with select labels
    python3 enrich_table.py --table-id <TABLE_ID> \
      --column-name "Primary Vertical" \
      --prompt "What vertical does {input} operate in?" \
      --format select \
      --labels "SaaS,FinTech,HealthTech,EdTech,Other"

    # Add columns from a config file
    python3 enrich_table.py --table-id <TABLE_ID> \
      --config columns.json

    # Dry run (show cost estimate only)
    python3 enrich_table.py --table-id <TABLE_ID> \
      --column-name "..." --prompt "..." --dry-run

    # Test batch (first 10 rows only)
    python3 enrich_table.py --table-id <TABLE_ID> \
      --column-name "..." --prompt "..." --test

Environment:
    EXTRUCT_API_TOKEN: Required. Get at https://app.extruct.ai/settings
"""

import argparse
import csv
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extruct_client import ExtructClient

# ── Pricing ───────────────────────────────────────────────────

PRO_PRICE = 149
PRO_CREDITS = 2000
COST_PER_RECORD = PRO_PRICE / PRO_CREDITS  # $0.075


def estimate_enrichment_cost(rows, columns):
    """Calculate enrichment cost.

    Returns:
        (records, dollars)
    """
    records = rows * columns
    dollars = round(records * COST_PER_RECORD, 2)
    return records, dollars


# ── Column Config ─────────────────────────────────────────────

def build_column_config(name, prompt, output_format="text", agent_type="research_pro",
                        labels=None, output_schema=None):
    """Build a single column config dict."""
    key = name.lower().replace(" ", "_").replace("-", "_")
    value = {
        "agent_type": agent_type,
        "prompt": prompt,
        "output_format": output_format,
    }
    if labels and output_format in ("select", "multiselect", "label"):
        value["labels"] = labels
    if output_schema and output_format == "json":
        value["output_schema"] = output_schema

    return {
        "kind": "agent",
        "name": name,
        "key": key,
        "value": value,
    }


def load_column_configs(config_path):
    """Load column configs from a JSON file."""
    with open(config_path) as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    return data.get("column_configs", [data])


# ── Progress Monitor ─────────────────────────────────────────

def monitor_enrichment(client, table_id, column_ids, poll_interval=5, max_wait=600):
    """Poll table until enrichment completes. Shows progress."""
    start = time.time()
    last_pct = -1

    while time.time() - start < max_wait:
        data = client.tables_data(table_id, limit=1000)
        rows = data if isinstance(data, list) else data.get("rows", [])

        if not rows:
            time.sleep(poll_interval)
            continue

        total_cells = len(rows) * len(column_ids)
        done_cells = 0
        failed_cells = 0

        for row in rows:
            cells = row.get("cells", row.get("data", {}))
            for col_id in column_ids:
                cell = cells.get(col_id, {})
                status = cell.get("status", "") if isinstance(cell, dict) else "done"
                if status == "done":
                    done_cells += 1
                elif status == "failed":
                    failed_cells += 1

        pct = int((done_cells + failed_cells) / total_cells * 100) if total_cells > 0 else 0

        if pct != last_pct:
            elapsed = int(time.time() - start)
            failed_str = f" ({failed_cells} failed)" if failed_cells else ""
            print(f"  Progress: {pct}% ({done_cells}/{total_cells} cells){failed_str} [{elapsed}s]")
            last_pct = pct

        if done_cells + failed_cells >= total_cells:
            return done_cells, failed_cells

        time.sleep(poll_interval)

    raise TimeoutError(f"Enrichment did not complete within {max_wait}s")


# ── Quality Check ─────────────────────────────────────────────

def spot_check(client, table_id, column_keys, sample_size=5):
    """Fetch and display a sample of enriched rows."""
    data = client.tables_data(table_id, limit=sample_size)
    rows = data if isinstance(data, list) else data.get("rows", [])

    print(f"\n  Quality spot-check ({len(rows)} rows):")
    print(f"  {'Company':<30} ", end="")
    for key in column_keys:
        print(f"{key:<25} ", end="")
    print()
    print("  " + "-" * (30 + 26 * len(column_keys)))

    for row in rows:
        cells = row.get("cells", row.get("data", {}))
        company = cells.get("company_name", cells.get("input", "?"))
        if isinstance(company, dict):
            company = company.get("value", "?")
        print(f"  {str(company):<30} ", end="")
        for key in column_keys:
            val = cells.get(key, "")
            if isinstance(val, dict):
                val = val.get("value", val.get("text", ""))
            print(f"{str(val)[:24]:<25} ", end="")
        print()


# ── CSV Export ────────────────────────────────────────────────

def export_enriched_csv(client, table_id, output_path):
    """Export full enriched table to CSV."""
    all_rows = []
    offset = 0
    while True:
        data = client.tables_data(table_id, limit=100, offset=offset)
        rows = data if isinstance(data, list) else data.get("rows", [])
        if not rows:
            break
        all_rows.extend(rows)
        offset += len(rows)
        if len(rows) < 100:
            break

    if not all_rows:
        print("  No rows to export.")
        return

    # Flatten cells into flat dicts
    flat_rows = []
    all_keys = []
    seen_keys = set()

    for row in all_rows:
        cells = row.get("cells", row.get("data", {}))
        flat = {}
        for k, v in cells.items():
            if isinstance(v, dict):
                flat[k] = v.get("value", v.get("text", str(v)))
            else:
                flat[k] = v
            if k not in seen_keys:
                all_keys.append(k)
                seen_keys.add(k)
        flat_rows.append(flat)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=all_keys, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(flat_rows)

    print(f"  Exported {len(flat_rows)} rows to {output_path}")


# ── Main ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Extruct Table Enrichment — add research columns",
    )
    parser.add_argument("--table-id", required=True, help="Extruct table ID or URL")
    parser.add_argument("--column-name", help="Column display name")
    parser.add_argument("--prompt", help="Enrichment prompt (use {input} for domain)")
    parser.add_argument("--format", default="text",
                        choices=["text", "number", "money", "select", "multiselect",
                                 "json", "grade", "label", "date", "url", "email", "phone"],
                        help="Output format (default: text)")
    parser.add_argument("--agent-type", default="research_pro",
                        choices=["research_pro", "llm"],
                        help="Agent type (default: research_pro)")
    parser.add_argument("--labels", help="Comma-separated labels for select/multiselect")
    parser.add_argument("--config", help="Path to column configs JSON file")
    parser.add_argument("--output", "-o", help="Output CSV path")
    parser.add_argument("--test", action="store_true", help="Test batch: first 10 rows only")
    parser.add_argument("--dry-run", action="store_true", help="Show cost estimate only")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation")
    parser.add_argument("--no-export", action="store_true", help="Skip CSV export")

    args = parser.parse_args()

    # Extract table ID from URL if needed
    table_id = args.table_id
    if "app.extruct.ai/tables/" in table_id:
        table_id = table_id.split("/tables/")[1].split("/")[0].split("?")[0]

    # Build column configs
    if args.config:
        column_configs = load_column_configs(args.config)
    elif args.column_name and args.prompt:
        labels = args.labels.split(",") if args.labels else None
        column_configs = [
            build_column_config(args.column_name, args.prompt, args.format,
                                args.agent_type, labels=labels)
        ]
    else:
        print("Error: provide --column-name + --prompt, or --config")
        sys.exit(1)

    num_columns = len(column_configs)

    # Initialize client
    api_token = os.getenv("EXTRUCT_API_TOKEN")
    if not api_token:
        print("Error: EXTRUCT_API_TOKEN not set")
        print("Get token: https://app.extruct.ai/settings")
        sys.exit(1)

    client = ExtructClient(api_token)

    # Inspect table
    print(f"\nExtruct Table Enrichment")
    table = client.tables_get(table_id)
    table_name = table.get("name", table_id)
    row_count = table.get("row_count", table.get("total_rows", 0))

    if args.test:
        row_count = min(row_count, 10)

    print(f"  Table: {table_name}")
    print(f"  Rows: {row_count}")
    print(f"  New columns: {num_columns}")
    for cc in column_configs:
        print(f"    - {cc['name']} ({cc['value']['output_format']}, {cc['value']['agent_type']})")

    # Cost estimate
    records, dollars = estimate_enrichment_cost(row_count, num_columns)
    print(f"\n  Cost: {row_count} rows × {num_columns} columns = {records} records")
    print(f"  Total: ${dollars:.2f} (at $0.075/record on Pro $149/mo)")
    print(f"  Budget impact: {records}/{PRO_CREDITS} monthly records ({int(records/PRO_CREDITS*100)}%)")
    print()

    if args.dry_run:
        print("Dry run — no API calls.")
        sys.exit(0)

    if not args.yes:
        confirm = input("Proceed? [y/N] ").strip().lower()
        if confirm != "y":
            print("Cancelled.")
            sys.exit(0)

    # Add columns
    print(f"  Adding {num_columns} column(s)...")
    result = client.columns_add(table_id, column_configs)
    column_ids = []
    column_keys = []
    if isinstance(result, list):
        for col in result:
            column_ids.append(col.get("id", col.get("column_id", "")))
            column_keys.append(col.get("key", ""))
    elif isinstance(result, dict):
        cols = result.get("columns", result.get("column_configs", [result]))
        for col in cols:
            column_ids.append(col.get("id", col.get("column_id", "")))
            column_keys.append(col.get("key", ""))

    print(f"  Column IDs: {column_ids}")

    # Run enrichment
    print(f"  Triggering enrichment on new columns...")
    client.tables_run(table_id, mode="new", columns=column_ids if column_ids else None)

    # Monitor progress
    done, failed = monitor_enrichment(client, table_id, column_ids)
    print(f"\n  Enrichment complete: {done} done, {failed} failed")

    # Spot check
    spot_check(client, table_id, column_keys or [cc["key"] for cc in column_configs])

    # Export CSV
    if not args.no_export:
        if args.output:
            output_path = args.output
        else:
            script_dir = Path(__file__).parent.parent
            output_dir = script_dir / "output"
            output_dir.mkdir(exist_ok=True)
            output_path = str(
                output_dir / f"{table_name.replace(' ', '-').lower()}-enriched-{datetime.now().strftime('%Y-%m-%d')}.csv"
            )
        export_enriched_csv(client, table_id, output_path)

    # Summary
    print(f"\n  Summary:")
    print(f"    Table: {table_name} ({table_id})")
    print(f"    Columns added: {num_columns}")
    print(f"    Records enriched: {done}")
    print(f"    Failed: {failed}")
    print(f"    Cost: ${dollars:.2f}")


if __name__ == "__main__":
    main()
