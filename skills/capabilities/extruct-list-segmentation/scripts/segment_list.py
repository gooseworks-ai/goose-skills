#!/usr/bin/env python3
"""
Extruct List Segmentation — Tier and Segment Pipeline
------------------------------------------------------
Read an enriched Extruct table, match companies to hypotheses,
assign tiers based on data richness and signal strength,
and export a segmented CSV ready for email generation.

Usage:
    # Segment from Extruct table + hypothesis file
    python3 segment_list.py --table-id <TABLE_ID> \
      --hypotheses hypotheses.md

    # Segment from CSV instead of Extruct table
    python3 segment_list.py --input leads-enriched.csv \
      --hypotheses hypotheses.md

    # Custom output path
    python3 segment_list.py --table-id <TABLE_ID> \
      --hypotheses hypotheses.md \
      --output output/campaign-segmented.csv

Environment:
    EXTRUCT_API_TOKEN: Required when using --table-id.
"""

import argparse
import csv
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extruct_client import ExtructClient

# ── Hypothesis Parser ─────────────────────────────────────────

def parse_hypotheses(filepath):
    """Parse a hypothesis set markdown file.

    Expected format per hypothesis:
        ## Hypothesis N: Short Name
        Description with data points...
        **Best fit:** description of best-fit company type

    Returns:
        List of dicts: [{number, name, description, best_fit}, ...]
    """
    with open(filepath, encoding="utf-8") as f:
        content = f.read()

    hypotheses = []
    # Split on ## Hypothesis headers
    sections = re.split(r"##\s+Hypothesis\s+(\d+)[:\s]+(.+)", content)

    # sections[0] is preamble, then groups of (number, name, body)
    i = 1
    while i < len(sections) - 2:
        number = int(sections[i])
        name = sections[i + 1].strip()
        body = sections[i + 2].strip()

        # Extract best fit if present
        best_fit = ""
        fit_match = re.search(r"\*\*Best fit[:\s]*\*\*\s*(.+)", body)
        if fit_match:
            best_fit = fit_match.group(1).strip()

        hypotheses.append({
            "number": number,
            "name": name,
            "description": body,
            "best_fit": best_fit,
        })
        i += 3

    return hypotheses


# ── Data Loading ──────────────────────────────────────────────

def load_from_extruct(client, table_id):
    """Fetch all rows from an Extruct table."""
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

    # Flatten cells
    flat = []
    for row in all_rows:
        cells = row.get("cells", row.get("data", {}))
        record = {}
        for k, v in cells.items():
            if isinstance(v, dict):
                record[k] = v.get("value", v.get("text", str(v)))
            else:
                record[k] = v
        flat.append(record)
    return flat


def load_from_csv(filepath):
    """Load companies from a CSV file."""
    with open(filepath, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ── Tiering Logic ────────────────────────────────────────────

def count_populated_fields(company, skip_keys=None):
    """Count how many fields have non-empty, non-N/A values."""
    skip = skip_keys or {"input", "company_name", "company_website", "domain"}
    count = 0
    for k, v in company.items():
        if k in skip:
            continue
        val = str(v).strip().lower()
        if val and val not in ("n/a", "na", "none", "", "unknown"):
            count += 1
    return count


def assign_tier(company, hypothesis_match):
    """Assign a tier based on data richness and hypothesis fit.

    Returns:
        (tier, rationale)
    """
    populated = count_populated_fields(company)
    has_hypothesis = hypothesis_match is not None

    # Check for strong hook signals
    hook_fields = ["latest_funding", "recent_news", "hiring_signals",
                   "leadership_quotes", "tech_stack"]
    hook_signal = None
    for field in hook_fields:
        val = str(company.get(field, "")).strip()
        if val and val.lower() not in ("n/a", "na", "none", ""):
            hook_signal = f"{field}: {val[:80]}"
            break

    # Tier 1: strong fit + data-rich + hook
    if has_hypothesis and populated >= 3 and hook_signal:
        return 1, f"Strong hypothesis fit, {populated} enriched fields, hook signal found"

    # Tier 2: medium fit or data-rich without hook
    if has_hypothesis and populated >= 2:
        return 2, f"Hypothesis match, {populated} enriched fields"
    if populated >= 3 and not has_hypothesis:
        return 2, f"Data-rich ({populated} fields) but no clear hypothesis match"

    # Tier 3: weak fit or sparse data
    reason = []
    if not has_hypothesis:
        reason.append("no hypothesis match")
    if populated < 2:
        reason.append(f"sparse data ({populated} fields)")
    return 3, "; ".join(reason) if reason else "weak fit"


def match_hypothesis(company, hypotheses):
    """Match a company to the best-fitting hypothesis.

    Returns:
        Best matching hypothesis dict, or None.
    """
    if not hypotheses:
        return None

    best = None
    best_score = 0

    company_text = " ".join(
        str(v) for v in company.values()
        if str(v).strip().lower() not in ("n/a", "na", "none", "")
    ).lower()

    for hyp in hypotheses:
        score = 0
        # Use deduplicated word tokens with word boundary matching
        keywords = set(re.findall(r'\b\w{4,}\b', hyp["description"].lower()))
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', company_text):
                score += 1

        if hyp["best_fit"]:
            fit_words = set(re.findall(r'\b\w{4,}\b', hyp["best_fit"].lower()))
            fit_words -= keywords  # Don't double-count words already scored
            for fw in fit_words:
                if re.search(r'\b' + re.escape(fw) + r'\b', company_text):
                    score += 2  # Best-fit matches count double

        if score > best_score:
            best_score = score
            best = hyp

    # Only match if there's meaningful overlap
    if best_score >= 3:
        return best
    return None


# ── Main ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Extruct List Segmentation — tier and segment companies",
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--table-id", help="Extruct table ID or URL")
    source.add_argument("--input", help="Input CSV file path")
    parser.add_argument("--hypotheses", required=True, help="Path to hypothesis set markdown file")
    parser.add_argument("--output", "-o", help="Output CSV path")
    parser.add_argument("--dry-run", action="store_true", help="Show summary without writing output")
    parser.add_argument("--test", action="store_true", help="Process first 10 companies only")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation")

    args = parser.parse_args()

    # Load hypotheses
    hypotheses = parse_hypotheses(args.hypotheses)
    print(f"\nExtruct List Segmentation")
    print(f"  Hypotheses loaded: {len(hypotheses)}")
    for h in hypotheses:
        print(f"    #{h['number']}: {h['name']}")

    # Load companies
    if args.table_id:
        table_id = args.table_id
        if "app.extruct.ai/tables/" in table_id:
            table_id = table_id.split("/tables/")[1].split("/")[0].split("?")[0]

        api_token = os.getenv("EXTRUCT_API_TOKEN")
        if not api_token:
            print("Error: EXTRUCT_API_TOKEN not set")
            sys.exit(1)

        client = ExtructClient(api_token)
        print(f"  Loading from Extruct table: {table_id}")
        companies = load_from_extruct(client, table_id)
    else:
        print(f"  Loading from CSV: {args.input}")
        companies = load_from_csv(args.input)

    print(f"  Companies loaded: {len(companies)}")

    if args.test:
        companies = companies[:10]
        print(f"  Test mode: processing first {len(companies)} companies only")

    if args.dry_run:
        print(f"\n  Dry run — {len(companies)} companies would be segmented against {len(hypotheses)} hypotheses.")
        print(f"  Cost: $0 (no Extruct API credits consumed)")
        sys.exit(0)

    # Segment
    segmented = []
    tier_counts = {1: 0, 2: 0, 3: 0}

    for company in companies:
        hyp = match_hypothesis(company, hypotheses)
        tier, rationale = assign_tier(company, hyp)
        tier_counts[tier] += 1

        # Extract hook signal for Tier 1
        hook_signal = ""
        if tier == 1:
            for field in ["latest_funding", "recent_news", "hiring_signals",
                          "leadership_quotes", "tech_stack"]:
                val = str(company.get(field, "")).strip()
                if val and val.lower() not in ("n/a", "na", "none", ""):
                    hook_signal = f"{field}: {val[:100]}"
                    break

        segmented.append({
            "company_name": company.get("company_name", company.get("input", "")),
            "domain": company.get("company_website", company.get("domain", company.get("input", ""))),
            "tier": tier,
            "hypothesis_number": hyp["number"] if hyp else "",
            "hypothesis_name": hyp["name"] if hyp else "Unmatched",
            "tier_rationale": rationale,
            "hook_signal": hook_signal,
        })

    # Sort by tier
    segmented.sort(key=lambda x: x["tier"])

    # Summary
    total = len(segmented)
    unmatched = sum(1 for s in segmented if s["hypothesis_name"] == "Unmatched")
    print(f"\n  Segmentation results:")
    print(f"    Total: {total}")
    print(f"    Tier 1: {tier_counts[1]} ({int(tier_counts[1]/total*100) if total else 0}%) — personalized outreach")
    print(f"    Tier 2: {tier_counts[2]} ({int(tier_counts[2]/total*100) if total else 0}%) — templated outreach")
    print(f"    Tier 3: {tier_counts[3]} ({int(tier_counts[3]/total*100) if total else 0}%) — hold/re-enrich")
    print(f"    Unmatched: {unmatched}")

    # Export CSV
    if args.output:
        output_path = args.output
    else:
        script_dir = Path(__file__).parent.parent
        output_dir = script_dir / "output"
        output_dir.mkdir(exist_ok=True)
        output_path = str(output_dir / f"segmented-{datetime.now().strftime('%Y-%m-%d')}.csv")

    fieldnames = ["company_name", "domain", "tier", "hypothesis_number",
                  "hypothesis_name", "tier_rationale", "hook_signal"]

    # Escape spreadsheet formula injection in string cells
    def sanitize_cell(val):
        if isinstance(val, str) and val and val[0] in ("=", "+", "-", "@", "\t", "\r"):
            return "'" + val
        return val

    safe_rows = [
        {k: sanitize_cell(v) for k, v in row.items()}
        for row in segmented
    ]

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(safe_rows)

    print(f"  Output: {output_path}")
    print(f"\n  Cost: $0 (no Extruct API credits consumed)")


if __name__ == "__main__":
    main()
