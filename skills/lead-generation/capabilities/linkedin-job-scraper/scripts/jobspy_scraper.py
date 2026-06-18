#!/usr/bin/env python3
"""
LinkedIn job scraper using python-jobspy.
Usage: python jobspy_scraper.py --search "software engineer" --location "SF, CA" --results 25
Install: pip install -U python-jobspy
"""

import argparse
import os
import sys


def parse_args():
    parser = argparse.ArgumentParser(
        description="Scrape LinkedIn jobs using python-jobspy"
    )
    parser.add_argument("--search", required=True, help="Job title or keywords")
    parser.add_argument("--location", default=None, help="City, state, or country")
    parser.add_argument("--results", type=int, default=25, help="Number of results (default: 25)")
    parser.add_argument("--hours-old", type=int, default=None, help="Only jobs posted within N hours")
    parser.add_argument("--fetch-descriptions", action="store_true", help="Fetch full job descriptions (slower)")
    parser.add_argument("--company-ids", default=None, help="Comma-separated LinkedIn company IDs")
    parser.add_argument("--job-type", default=None,
                        choices=["fulltime", "parttime", "contract", "internship"],
                        help="Filter by employment type")
    parser.add_argument("--remote", action="store_true", help="Filter for remote jobs only")
    parser.add_argument("--output", default=".tmp/jobs.csv", help="Output CSV path (default: .tmp/jobs.csv)")
    return parser.parse_args()


def main():
    args = parse_args()

    try:
        from jobspy import scrape_jobs
    except ImportError:
        print("ERROR: python-jobspy is not installed.")
        print("Run: pip install -U python-jobspy")
        sys.exit(1)

    # Parse optional company IDs
    company_ids = None
    if args.company_ids:
        try:
            company_ids = [int(cid.strip()) for cid in args.company_ids.split(",")]
        except ValueError:
            print("ERROR: --company-ids must be comma-separated integers, e.g. 1234,5678")
            sys.exit(1)

    print(f"Searching LinkedIn for: '{args.search}'"
          + (f" in {args.location}" if args.location else "")
          + f" ({args.results} results)")

    kwargs = dict(
        site_name=["linkedin"],
        search_term=args.search,
        location=args.location,
        results_wanted=args.results,
        hours_old=args.hours_old,
        linkedin_fetch_description=args.fetch_descriptions,
        linkedin_company_ids=company_ids,
        job_type=args.job_type,
        description_format="markdown",
    )
    if args.remote:
        kwargs["is_remote"] = True

    jobs = scrape_jobs(**kwargs)

    if jobs is None or len(jobs) == 0:
        print("No jobs found. Try broadening your search term or removing the location filter.")
        sys.exit(0)

    print(f"Found {len(jobs)} jobs.")

    # Ensure output directory exists
    out_dir = os.path.dirname(args.output)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    # Save to CSV
    jobs.to_csv(args.output, index=False)
    print(f"Saved to: {args.output}")

    # Print summary table
    display_cols = ["TITLE", "COMPANY", "LOCATION", "JOB_TYPE", "DATE_POSTED", "JOB_URL"]
    available = [c for c in display_cols if c in jobs.columns]

    # Normalize column names (jobspy may return lowercase)
    col_map = {c.lower(): c for c in display_cols}
    jobs.columns = [col_map.get(c.lower(), c) for c in jobs.columns]
    available = [c for c in display_cols if c in jobs.columns]

    print("\n--- Results Preview ---")
    try:
        import pandas as pd
        pd.set_option("display.max_columns", None)
        pd.set_option("display.max_colwidth", 40)
        pd.set_option("display.width", 120)
        print(jobs[available].head(10).to_string(index=False))
    except Exception:
        # Fallback: simple print
        for _, row in jobs[available].head(10).iterrows():
            print(" | ".join(str(row.get(c, "")) for c in available))

    if len(jobs) > 10:
        print(f"\n... and {len(jobs) - 10} more. See full results in: {args.output}")


if __name__ == "__main__":
    main()
