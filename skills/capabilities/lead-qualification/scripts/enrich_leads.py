#!/usr/bin/env python3
"""
Batch LinkedIn Profile Enrichment via Apify

Enriches a CSV of leads by bulk-scraping their LinkedIn profiles.
Uses the harvestapi~linkedin-profile-scraper Apify actor ($3/1k profiles, no cookies).

Usage:
    # Dry run — show cost estimate, don't call Apify
    python3 enrich_leads.py leads.csv --dry-run

    # Enrich and output to new CSV
    python3 enrich_leads.py leads.csv --output leads-enriched.csv

    # Custom LinkedIn URL column name
    python3 enrich_leads.py leads.csv --url-column li_url

    # Force fresh (skip cache)
    python3 enrich_leads.py leads.csv --no-cache

Environment:
    APIFY_API_TOKEN: Required. Get at https://console.apify.com/account/integrations
"""
import argparse
import csv
import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import requests
except ImportError:
    print("Error: requests library required. Install with: pip3 install requests")
    sys.exit(1)

# --- Constants ---
ACTOR_ID = "harvestapi~linkedin-profile-scraper"
GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    BASE_URL = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    BASE_URL = "https://api.apify.com/v2"
COST_PER_1K = 3.00  # $3 per 1,000 profiles
ACTOR_URL = "https://console.apify.com/actors/harvestapi~linkedin-profile-scraper"

# --- .env loading ---
script_dir = Path(__file__).parent
env_path = script_dir.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())

# --- Cache directory ---
CACHE_DIR = script_dir.parent / ".cache"


def get_cache_path(linkedin_url: str) -> Path:
    """Generate cache file path for a single LinkedIn profile."""
    CACHE_DIR.mkdir(exist_ok=True)
    url_hash = hashlib.md5(normalize_linkedin_url(linkedin_url).encode()).hexdigest()[:12]
    return CACHE_DIR / f"profile_{url_hash}.json"


def load_cache(cache_path: Path, max_age_hours: int = 24) -> Optional[Dict]:
    """Load cached profile data if fresh enough."""
    if not cache_path.exists():
        return None
    age_seconds = time.time() - cache_path.stat().st_mtime
    age_hours = age_seconds / 3600
    if age_hours > max_age_hours:
        return None
    with open(cache_path) as f:
        return json.load(f)


def save_cache(cache_path: Path, data: Dict):
    """Save profile data to cache."""
    CACHE_DIR.mkdir(exist_ok=True)
    with open(cache_path, "w") as f:
        json.dump(data, f, indent=2)


def normalize_linkedin_url(url: str) -> str:
    """Normalize LinkedIn URL for consistent caching and deduplication."""
    url = url.strip().rstrip("/")
    url = re.sub(r"^https?://(www\.)?", "https://", url)
    if not url.startswith("http"):
        url = f"https://linkedin.com/in/{url}"
    return url


def is_valid_linkedin_url(url: str) -> bool:
    """Check if a URL looks like a LinkedIn profile URL."""
    if not url or not url.strip():
        return False
    normalized = normalize_linkedin_url(url)
    return "linkedin.com/in/" in normalized


class LinkedInEnricher:
    """Batch LinkedIn profile enrichment via Apify."""

    def __init__(self, api_token: str):
        self.api_token = api_token

    def estimate_cost(self, num_profiles: int) -> str:
        """Return human-readable cost estimate."""
        cost = (num_profiles / 1000) * COST_PER_1K
        return f"${cost:.2f}"

    def _start_actor_run(self, urls: List[str]) -> str:
        """Start an Apify actor run with a batch of URLs. Returns run ID."""
        response = requests.post(
            f"{BASE_URL}/acts/{ACTOR_ID}/runs",
            json={"urls": urls},
            params={"token": self.api_token},
            timeout=30,
        )

        if response.status_code == 402:
            raise ValueError(
                f"Apify actor not available. Ensure you have access at: {ACTOR_URL}"
            )
        response.raise_for_status()

        run_data = response.json()
        return run_data["data"]["id"]

    def _poll_run(self, run_id: str, timeout: int = 300) -> Dict:
        """Poll an actor run until completion. Returns run data."""
        start_time = time.time()
        while True:
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Apify actor run timed out after {timeout}s (run: {run_id})")

            response = requests.get(
                f"{BASE_URL}/acts/{ACTOR_ID}/runs/{run_id}",
                params={"token": self.api_token},
                timeout=30,
            )
            response.raise_for_status()

            run_data = response.json()["data"]
            status = run_data["status"]

            if status == "SUCCEEDED":
                return run_data
            elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                raise Exception(f"Apify actor run {status} (run: {run_id})")

            time.sleep(5)

    def _fetch_dataset(self, dataset_id: str) -> List[Dict]:
        """Fetch results from an Apify dataset."""
        response = requests.get(
            f"{BASE_URL}/datasets/{dataset_id}/items",
            params={"token": self.api_token, "format": "json"},
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def enrich_batch(self, urls: List[str], timeout: int = 300) -> List[Dict]:
        """Enrich a single batch of LinkedIn profile URLs via Apify."""
        run_id = self._start_actor_run(urls)
        run_data = self._poll_run(run_id, timeout=timeout)
        dataset_id = run_data["defaultDatasetId"]
        usage_usd = run_data.get("usageTotalUsd", 0)
        items = self._fetch_dataset(dataset_id)
        return items

    def enrich_profiles(
        self,
        urls: List[str],
        batch_size: int = 50,
        timeout: int = 300,
        no_cache: bool = False,
        cache_hours: int = 24,
    ) -> Dict[str, Dict]:
        """
        Enrich all LinkedIn URLs with cache-first strategy.

        Returns: {normalized_url: enriched_data_dict}
        """
        results = {}
        uncached_urls = []

        # Step 1: Check cache for each URL
        for url in urls:
            normalized = normalize_linkedin_url(url)
            if not no_cache:
                cache_path = get_cache_path(url)
                cached = load_cache(cache_path, max_age_hours=cache_hours)
                if cached:
                    results[normalized] = cached
                    continue
            uncached_urls.append(url)

        if results:
            print(f"   {len(results)} profiles loaded from cache")

        if not uncached_urls:
            print("   All profiles cached, no Apify calls needed")
            return results

        # Step 2: Split uncached into batches and process
        batches = [uncached_urls[i:i + batch_size] for i in range(0, len(uncached_urls), batch_size)]
        total_batches = len(batches)

        print(f"   Enriching {len(uncached_urls)} profiles via Apify ({total_batches} batch{'es' if total_batches > 1 else ''})...")

        for batch_num, batch in enumerate(batches, 1):
            print(f"   Batch {batch_num}/{total_batches} ({len(batch)} profiles)...", end=" ", flush=True)

            try:
                items = self.enrich_batch(batch, timeout=timeout)
                print(f"done ({len(items)} results)")

                # Match results back to URLs and cache them
                for item in items:
                    # Try to match by URL field in the response
                    profile_url = item.get("linkedinUrl", item.get("url", item.get("profileUrl", item.get("linkedin_url", ""))))
                    if profile_url:
                        normalized = normalize_linkedin_url(profile_url)
                        results[normalized] = item
                        save_cache(get_cache_path(profile_url), item)
                    else:
                        # If no URL in response, try matching by name or other fields
                        # Store with a generated key
                        results[f"_unmatched_{len(results)}"] = item

            except TimeoutError:
                # Retry once on timeout
                print(f"timeout, retrying...")
                try:
                    items = self.enrich_batch(batch, timeout=timeout)
                    print(f"   Retry succeeded ({len(items)} results)")
                    for item in items:
                        profile_url = item.get("linkedinUrl", item.get("url", item.get("profileUrl", item.get("linkedin_url", ""))))
                        if profile_url:
                            normalized = normalize_linkedin_url(profile_url)
                            results[normalized] = item
                            save_cache(get_cache_path(profile_url), item)
                except Exception as e:
                    print(f"   Retry failed: {e}")
                    # Mark all URLs in this batch as failed
                    for url in batch:
                        results[normalize_linkedin_url(url)] = {"_enrichment_error": str(e)}

            except Exception as e:
                print(f"error: {e}")
                for url in batch:
                    results[normalize_linkedin_url(url)] = {"_enrichment_error": str(e)}

        return results


def parse_enriched_profile(raw: Dict) -> Dict:
    """
    Parse raw Apify profile data into standardized enriched columns.
    Handles varying field names across actor versions.
    """
    if raw.get("_enrichment_error"):
        return {
            "enriched_headline": "",
            "enriched_title": "",
            "enriched_company": "",
            "enriched_location": "",
            "enriched_industry": "",
            "enriched_connections": "",
            "enriched_about": "",
            "enriched_education": "",
            "enriched_experience_years": "",
            "enrichment_status": "failed",
        }

    # Extract current title and company from experience
    experience = raw.get("experience", raw.get("positions", raw.get("workExperience", [])))
    current_title = ""
    current_company = ""
    earliest_year = None
    latest_year = None

    if isinstance(experience, list) and experience:
        # First entry is usually current position
        current = experience[0]
        if isinstance(current, dict):
            current_title = current.get("title", current.get("position", ""))
            current_company = current.get("companyName", current.get("company", current.get("organization", "")))

        # Calculate experience years
        for exp in experience:
            if isinstance(exp, dict):
                start = exp.get("startDate", exp.get("start", ""))
                end = exp.get("endDate", exp.get("end", ""))
                for date_str in [start, end]:
                    if date_str and isinstance(date_str, str):
                        year_match = re.search(r"(19|20)\d{2}", str(date_str))
                        if year_match:
                            year = int(year_match.group())
                            if earliest_year is None or year < earliest_year:
                                earliest_year = year
                            if latest_year is None or year > latest_year:
                                latest_year = year

    experience_years = ""
    if earliest_year and latest_year:
        experience_years = str(latest_year - earliest_year)

    # Extract education
    education_list = raw.get("education", raw.get("educations", []))
    education_str = ""
    if isinstance(education_list, list) and education_list:
        edu = education_list[0]
        if isinstance(edu, dict):
            school = edu.get("school", edu.get("schoolName", edu.get("institution", "")))
            degree = edu.get("degree", edu.get("degreeName", ""))
            field = edu.get("fieldOfStudy", edu.get("field", ""))
            parts = [p for p in [school, degree, field] if p]
            education_str = " — ".join(parts)

    # Extract headline (try multiple field names)
    headline = raw.get("headline", raw.get("title", raw.get("tagline", "")))

    # If no current_title from experience, fall back to headline
    if not current_title and headline:
        current_title = headline

    return {
        "enriched_headline": str(headline or ""),
        "enriched_title": str(current_title or ""),
        "enriched_company": str(current_company or ""),
        "enriched_location": (lambda loc: loc.get("linkedinText", "") if isinstance(loc, dict) else str(loc or ""))(raw.get("location", raw.get("geo", ""))),
        "enriched_industry": str(raw.get("industry", "") or ""),
        "enriched_connections": str(raw.get("connectionsCount", raw.get("connections", "")) or ""),
        "enriched_about": str(raw.get("about", raw.get("summary", "")) or ""),
        "enriched_education": education_str,
        "enriched_experience_years": experience_years,
        "enrichment_status": "success",
    }


def merge_enrichment(
    rows: List[Dict], enriched_data: Dict[str, Dict], url_column: str
) -> List[Dict]:
    """Merge enriched profile data back into the original CSV rows."""
    enriched_columns = [
        "enriched_headline", "enriched_title", "enriched_company",
        "enriched_location", "enriched_industry", "enriched_connections",
        "enriched_about", "enriched_education", "enriched_experience_years",
        "enrichment_status",
    ]

    merged = []
    for row in rows:
        url = row.get(url_column, "").strip()
        enriched_row = dict(row)

        if not url or not is_valid_linkedin_url(url):
            # No LinkedIn URL — mark as no_url
            for col in enriched_columns:
                enriched_row[col] = ""
            enriched_row["enrichment_status"] = "no_url"
        else:
            normalized = normalize_linkedin_url(url)
            raw_profile = enriched_data.get(normalized)

            if raw_profile and raw_profile.get("_enrichment_error"):
                parsed = parse_enriched_profile(raw_profile)
                enriched_row.update(parsed)
            elif raw_profile:
                parsed = parse_enriched_profile(raw_profile)
                enriched_row.update(parsed)
            else:
                # URL was valid but no result returned
                for col in enriched_columns:
                    enriched_row[col] = ""
                enriched_row["enrichment_status"] = "failed"

        merged.append(enriched_row)

    return merged


def main():
    parser = argparse.ArgumentParser(
        description="Batch LinkedIn profile enrichment via Apify",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Dry run — see cost estimate
    python3 enrich_leads.py leads.csv --dry-run

    # Enrich leads
    python3 enrich_leads.py leads.csv -o leads-enriched.csv

    # Skip cache, force fresh enrichment
    python3 enrich_leads.py leads.csv --no-cache

Environment:
    APIFY_API_TOKEN: Required. Get at https://console.apify.com/account/integrations
        """,
    )

    parser.add_argument("input_csv", help="CSV file with LinkedIn URL column")
    parser.add_argument("--output", "-o", help="Output CSV path (default: input with '-enriched' suffix)")
    parser.add_argument("--url-column", default="linkedin_url", help="LinkedIn URL column name (default: linkedin_url)")
    parser.add_argument("--no-cache", action="store_true", help="Skip cache, always fetch fresh")
    parser.add_argument("--cache-hours", type=int, default=24, help="Cache max age in hours (default: 24)")
    parser.add_argument("--dry-run", action="store_true", help="Show cost estimate and exit")
    parser.add_argument("--batch-size", type=int, default=50, help="Profiles per Apify run (default: 50)")
    parser.add_argument("--timeout", type=int, default=300, help="Timeout per batch in seconds (default: 300)")

    args = parser.parse_args()

    # Read input CSV
    input_path = Path(args.input_csv)
    if not input_path.exists():
        print(f"Error: File not found: {args.input_csv}")
        sys.exit(1)

    with open(input_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        print("Error: CSV is empty")
        sys.exit(1)

    if args.url_column not in rows[0]:
        print(f"Error: Column '{args.url_column}' not found in CSV")
        print(f"Available columns: {', '.join(rows[0].keys())}")
        sys.exit(1)

    # Analyze URLs
    all_urls = [row.get(args.url_column, "").strip() for row in rows]
    valid_urls = [url for url in all_urls if is_valid_linkedin_url(url)]
    unique_urls = list(set(normalize_linkedin_url(u) for u in valid_urls))

    # Check cache
    cached_count = 0
    if not args.no_cache:
        for url in unique_urls:
            cache_path = get_cache_path(url)
            if load_cache(cache_path, max_age_hours=args.cache_hours) is not None:
                cached_count += 1

    need_enrichment = len(unique_urls) - cached_count
    cost = (need_enrichment / 1000) * COST_PER_1K

    # Print summary
    print(f"\nEnrichment plan:")
    print(f"  Total leads:         {len(rows)}")
    print(f"  With LinkedIn URL:   {len(valid_urls)} ({len(unique_urls)} unique)")
    print(f"  Already cached:      {cached_count}")
    print(f"  Need enrichment:     {need_enrichment}")
    print(f"  Estimated cost:      {need_enrichment} profiles x ${COST_PER_1K}/1k = ${cost:.2f}")
    print()

    if args.dry_run:
        print("Dry run — exiting without calling Apify.")
        sys.exit(0)

    # Check API token
    api_token = GOOSEWORKS_API_KEY or os.getenv("APIFY_API_TOKEN")
    if not api_token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.")
        sys.exit(1)

    if need_enrichment == 0 and cached_count > 0:
        print("All profiles cached. Merging cached data into output...")
    elif need_enrichment > 0:
        print(f"Starting enrichment...")

    # Run enrichment
    enricher = LinkedInEnricher(api_token)
    enriched_data = enricher.enrich_profiles(
        urls=valid_urls,
        batch_size=args.batch_size,
        timeout=args.timeout,
        no_cache=args.no_cache,
        cache_hours=args.cache_hours,
    )

    # Merge enriched data into rows
    merged_rows = merge_enrichment(rows, enriched_data, args.url_column)

    # Determine output path
    output_path = args.output
    if not output_path:
        stem = input_path.stem
        output_path = str(input_path.parent / f"{stem}-enriched.csv")

    # Write output CSV
    if merged_rows:
        fieldnames = list(merged_rows[0].keys())
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(merged_rows)

    # Print summary
    statuses = {}
    for row in merged_rows:
        status = row.get("enrichment_status", "unknown")
        statuses[status] = statuses.get(status, 0) + 1

    print(f"\nEnrichment complete:")
    print(f"  Output:    {output_path}")
    print(f"  Total:     {len(merged_rows)} leads")
    for status, count in sorted(statuses.items()):
        print(f"  {status:12s} {count}")


if __name__ == "__main__":
    main()
