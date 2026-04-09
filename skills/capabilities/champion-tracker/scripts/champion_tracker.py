#!/usr/bin/env python3
"""
Champion Tracking Engine

Track product champions for job changes and qualify their new companies against ICP.
When a champion moves to a new company, they're the easiest re-sell — they already know the product.

Subcommands:
    init    Validate champion CSV, enrich all profiles via Apify, create baseline snapshot
    check   Re-enrich profiles, compare against baseline, detect job changes, output CSV
    status  Show baseline stats (champion count, last run, errors)

Usage:
    python3 champion_tracker.py init -i champions.csv --dry-run
    python3 champion_tracker.py init -i champions.csv
    python3 champion_tracker.py check --dry-run
    python3 champion_tracker.py check -o changes.csv
    python3 champion_tracker.py status

Environment:
    APIFY_API_TOKEN: Required for LinkedIn enrichment.
"""

import argparse
import csv
import json
import os
import re
import shutil
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# --- .env loading: traverse up from script dir to find .env ---
def _load_dotenv():
    """Walk up from script directory to project root looking for .env."""
    current = Path(__file__).resolve().parent
    for _ in range(10):  # max 10 levels up
        env_path = current / ".env"
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, _, value = line.partition("=")
                        os.environ.setdefault(key.strip(), value.strip())
            return
        parent = current.parent
        if parent == current:
            break
        current = parent

_load_dotenv()

# --- Import Apify Guard (shared cost protection) ---
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))
try:
    from tools.apify_guard import confirm_cost, set_auto_confirm
except ImportError:
    # Graceful fallback if guard not available
    def confirm_cost(phase_name, num_runs, est_cost):
        pass
    def set_auto_confirm(auto):
        pass

# --- Import LinkedInEnricher from lead-qualification (with fallback) ---
SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
SKILLS_ROOT = SKILL_DIR.parent

_enricher_module = None
try:
    enrich_path = SKILLS_ROOT / "lead-qualification" / "scripts" / "enrich_leads.py"
    if enrich_path.exists():
        import importlib.util
        spec = importlib.util.spec_from_file_location("enrich_leads", enrich_path)
        _enricher_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(_enricher_module)
except Exception:
    _enricher_module = None

if _enricher_module:
    LinkedInEnricher = _enricher_module.LinkedInEnricher
    normalize_linkedin_url = _enricher_module.normalize_linkedin_url
    parse_enriched_profile = _enricher_module.parse_enriched_profile
    is_valid_linkedin_url = _enricher_module.is_valid_linkedin_url
else:
    # --- Inline fallback (minimal copy) ---
    print("Warning: Could not import from lead-qualification. Using inline fallback.", file=sys.stderr)

    try:
        import requests
    except ImportError:
        print("Error: requests library required. Install with: pip3 install requests", file=sys.stderr)
        sys.exit(1)

    _ACTOR_ID = "supreme_coder~linkedin-profile-scraper"
    _GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
    _GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")
    if _GOOSEWORKS_API_KEY:
        _BASE_URL = f"{_GOOSEWORKS_API_BASE}/v1/proxy/apify"
    else:
        _BASE_URL = "https://api.apify.com/v2"
    _COST_PER_1K = 3.00

    def normalize_linkedin_url(url: str) -> str:
        url = url.strip().rstrip("/")
        url = re.sub(r"^https?://(www\.)?", "https://", url)
        if not url.startswith("http"):
            url = f"https://linkedin.com/in/{url}"
        return url

    def is_valid_linkedin_url(url: str) -> bool:
        if not url or not url.strip():
            return False
        return "linkedin.com/in/" in normalize_linkedin_url(url)

    def parse_enriched_profile(raw: Dict) -> Dict:
        if raw.get("_enrichment_error"):
            return {"enriched_title": "", "enriched_company": "", "enrichment_status": "failed"}
        experience = raw.get("experience", raw.get("positions", raw.get("workExperience", [])))
        current_title = ""
        current_company = ""
        if isinstance(experience, list) and experience:
            current = experience[0]
            if isinstance(current, dict):
                current_title = current.get("title", current.get("position", ""))
                current_company = current.get("companyName", current.get("company", current.get("organization", "")))
        headline = raw.get("headline", raw.get("title", raw.get("tagline", "")))
        if not current_title and headline:
            current_title = headline
        return {
            "enriched_headline": str(headline or ""),
            "enriched_title": str(current_title or ""),
            "enriched_company": str(current_company or ""),
            "enriched_location": str(raw.get("location", raw.get("geo", "")) or ""),
            "enriched_industry": str(raw.get("industry", "") or ""),
            "enriched_connections": str(raw.get("connections", raw.get("connectionsCount", "")) or ""),
            "enriched_about": str(raw.get("about", raw.get("summary", "")) or ""),
            "enrichment_status": "success",
        }

    class LinkedInEnricher:
        def __init__(self, api_token: str):
            self.api_token = api_token

        def estimate_cost(self, num_profiles: int) -> str:
            cost = (num_profiles / 1000) * _COST_PER_1K
            return f"${cost:.2f}"

        def enrich_batch(self, urls: List[str], timeout: int = 300) -> List[Dict]:
            resp = requests.post(
                f"{_BASE_URL}/acts/{_ACTOR_ID}/runs",
                json={"urls": urls},
                params={"token": self.api_token},
                timeout=30,
            )
            resp.raise_for_status()
            run_id = resp.json()["data"]["id"]
            start = time.time()
            while time.time() - start < timeout:
                r = requests.get(f"{_BASE_URL}/acts/{_ACTOR_ID}/runs/{run_id}", params={"token": self.api_token}, timeout=30)
                r.raise_for_status()
                status = r.json()["data"]["status"]
                if status == "SUCCEEDED":
                    dataset_id = r.json()["data"]["defaultDatasetId"]
                    dr = requests.get(f"{_BASE_URL}/datasets/{dataset_id}/items", params={"token": self.api_token, "format": "json"}, timeout=30)
                    dr.raise_for_status()
                    return dr.json()
                elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                    raise Exception(f"Apify actor run {status}")
                time.sleep(5)
            raise TimeoutError(f"Apify run timed out after {timeout}s")

        def enrich_profiles(self, urls: List[str], batch_size: int = 50, timeout: int = 300, **kwargs) -> Dict[str, Dict]:
            results = {}
            batches = [urls[i:i + batch_size] for i in range(0, len(urls), batch_size)]
            for batch_num, batch in enumerate(batches, 1):
                print(f"   Batch {batch_num}/{len(batches)} ({len(batch)} profiles)...", end=" ", flush=True)
                try:
                    items = self.enrich_batch(batch, timeout=timeout)
                    print(f"done ({len(items)} results)")
                    for item in items:
                        profile_url = item.get("url", item.get("profileUrl", item.get("linkedin_url", "")))
                        if profile_url:
                            results[normalize_linkedin_url(profile_url)] = item
                except Exception as e:
                    print(f"error: {e}")
                    for url in batch:
                        results[normalize_linkedin_url(url)] = {"_enrichment_error": str(e)}
            return results


# --- Constants ---
COST_PER_1K = 3.00
SNAPSHOTS_DIR = SKILL_DIR / "snapshots"
ARCHIVE_DIR = SNAPSHOTS_DIR / "archive"
BASELINE_PATH = SNAPSHOTS_DIR / "baseline.json"
OUTPUT_DIR = SKILL_DIR / "output"

REQUIRED_COLUMNS = {"name", "linkedin_url"}
OPTIONAL_COLUMNS = {"original_company", "original_title", "email", "source", "notes"}

# Company name suffixes to strip during normalization
COMPANY_SUFFIXES = re.compile(
    r",?\s*\b(inc\.?|incorporated|llc|l\.l\.c\.?|ltd\.?|limited|corp\.?|corporation|"
    r"co\.?|company|plc|gmbh|ag|sa|s\.a\.?|pty\.?|pvt\.?|private|"
    r"group|holdings|international|intl\.?)\b\.?",
    re.IGNORECASE,
)

# ICP title keywords for B2B / outbound sales signal
B2B_TITLE_KEYWORDS = {
    "sales", "sdr", "bdr", "revenue", "growth", "demand gen",
    "demand generation", "business development", "go-to-market", "gtm",
    "account executive", "ae", "pipeline", "outbound", "commercial",
}

OUTBOUND_LEADERSHIP_KEYWORDS = {
    "vp sales", "vp of sales", "vice president sales", "vice president of sales",
    "head of sales", "director of sales", "sales director", "director sales",
    "head of growth", "vp growth", "vp of growth", "director of growth",
    "head of revenue", "chief revenue officer", "cro",
    "head of business development", "director of business development",
    "vp business development", "head of demand gen",
}

SENIORITY_KEYWORDS = {
    "vp", "vice president", "director", "head of", "chief", "cxo",
    "c-level", "ceo", "coo", "cfo", "cro", "cmo", "cto", "svp",
    "senior vice president", "evp", "executive vice president",
    "founder", "co-founder", "cofounder", "partner", "managing director",
    "general manager", "gm", "president",
}


# ============================================================
# Core Functions
# ============================================================

def load_champion_csv(csv_path: str) -> List[Dict]:
    """Read and validate champion CSV. Returns list of row dicts."""
    path = Path(csv_path)
    if not path.exists():
        print(f"Error: File not found: {csv_path}")
        sys.exit(1)

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        print("Error: CSV is empty")
        sys.exit(1)

    columns = set(rows[0].keys())
    missing = REQUIRED_COLUMNS - columns
    if missing:
        print(f"Error: Missing required columns: {', '.join(sorted(missing))}")
        print(f"Required: {', '.join(sorted(REQUIRED_COLUMNS))}")
        print(f"Found: {', '.join(sorted(columns))}")
        sys.exit(1)

    # Validate LinkedIn URLs
    valid_count = 0
    invalid_rows = []
    for i, row in enumerate(rows, 1):
        url = row.get("linkedin_url", "").strip()
        if is_valid_linkedin_url(url):
            valid_count += 1
        else:
            invalid_rows.append((i, row.get("name", ""), url))

    if invalid_rows:
        print(f"\nWarning: {len(invalid_rows)} rows with invalid/missing LinkedIn URLs:")
        for row_num, name, url in invalid_rows[:5]:
            print(f"   Row {row_num}: {name} — '{url}'")
        if len(invalid_rows) > 5:
            print(f"   ... and {len(invalid_rows) - 5} more")
        print()

    print(f"Loaded {len(rows)} champions ({valid_count} with valid LinkedIn URLs)")
    return rows


def load_baseline() -> Optional[Dict]:
    """Load baseline snapshot from disk. Returns None if not found."""
    if not BASELINE_PATH.exists():
        return None
    with open(BASELINE_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_baseline(data: Dict):
    """Save baseline snapshot, archiving the previous one if it exists."""
    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)

    # Archive existing baseline
    if BASELINE_PATH.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        archive_path = ARCHIVE_DIR / f"baseline_{timestamp}.json"
        shutil.copy2(BASELINE_PATH, archive_path)
        print(f"   Archived previous baseline → {archive_path.name}")

    with open(BASELINE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"   Baseline saved → {BASELINE_PATH}")


def normalize_company_name(name: str) -> str:
    """Normalize company name for comparison: strip suffixes, lowercase, collapse whitespace."""
    if not name:
        return ""
    normalized = name.strip()
    normalized = COMPANY_SUFFIXES.sub("", normalized)
    normalized = re.sub(r"[^\w\s]", "", normalized)  # strip punctuation
    normalized = re.sub(r"\s+", " ", normalized).strip().lower()
    return normalized


def detect_changes(baseline: Dict, current_profiles: Dict[str, Dict]) -> List[Dict]:
    """
    Compare current enriched profiles against baseline.
    Returns list of dicts with change details for each champion who moved.
    """
    changes = []
    champions = baseline.get("champions", {})

    for linkedin_url, champion_data in champions.items():
        normalized_url = normalize_linkedin_url(linkedin_url)
        current = current_profiles.get(normalized_url)
        if not current or current.get("_enrichment_error"):
            continue

        # Parse current profile
        parsed = parse_enriched_profile(current)
        current_company = parsed.get("enriched_company", "")
        current_title = parsed.get("enriched_title", "")

        # Get baseline company
        baseline_company = champion_data.get("enriched_company", "")
        original_company = champion_data.get("original_company", "")

        # Compare: use baseline enriched company if available, else original
        compare_company = baseline_company or original_company

        if not current_company or not compare_company:
            continue

        # Normalized comparison
        if normalize_company_name(current_company) != normalize_company_name(compare_company):
            changes.append({
                "name": champion_data.get("name", ""),
                "linkedin_url": linkedin_url,
                "previous_company": compare_company,
                "previous_title": champion_data.get("enriched_title", champion_data.get("original_title", "")),
                "new_company": current_company,
                "new_title": current_title,
                "email": champion_data.get("email", ""),
                "notes": champion_data.get("notes", ""),
                "source": champion_data.get("source", ""),
                "raw_profile": current,
            })

    return changes


def qualify_new_company(change: Dict) -> Tuple[float, str, str]:
    """
    Score a champion's new company against Artisan ICP (0-4 scale).

    Signals:
      1. B2B signal: title keywords (sales, SDR, revenue, growth)
      2. Outbound motion signal: sales leadership title
      3. Company size: from profile data if available; 0.5 benefit-of-doubt if not
      4. Seniority/budget signal: VP, Director, Head of, C-level

    Returns: (score, verdict, notes)
    """
    score = 0.0
    notes_parts = []

    title_lower = change.get("new_title", "").lower()
    headline = ""
    raw = change.get("raw_profile", {})
    if raw:
        headline = str(raw.get("headline", raw.get("title", raw.get("tagline", "")))).lower()

    combined_text = f"{title_lower} {headline}"

    # Signal 1: B2B / sales keywords in title
    b2b_matches = [kw for kw in B2B_TITLE_KEYWORDS if kw in combined_text]
    if b2b_matches:
        score += 1.0
        notes_parts.append(f"B2B signal ({', '.join(b2b_matches[:3])})")

    # Signal 2: Outbound leadership
    outbound_matches = [kw for kw in OUTBOUND_LEADERSHIP_KEYWORDS if kw in combined_text]
    if outbound_matches:
        score += 1.0
        notes_parts.append(f"Outbound leadership ({outbound_matches[0]})")

    # Signal 3: Company size (from raw profile if available)
    company_size = None
    if raw:
        # Try common field names for company employee count
        for field in ["companySize", "employeeCount", "company_size", "staffCount"]:
            val = raw.get(field)
            if val:
                # Could be "51-200" or a number
                if isinstance(val, (int, float)):
                    company_size = int(val)
                elif isinstance(val, str):
                    # Extract first number from range like "51-200"
                    match = re.search(r"(\d+)", val.replace(",", ""))
                    if match:
                        company_size = int(match.group(1))
                break

        # Also check experience[0] for company info
        experience = raw.get("experience", raw.get("positions", []))
        if isinstance(experience, list) and experience:
            current_exp = experience[0]
            if isinstance(current_exp, dict):
                for field in ["companySize", "employeeCount", "staffCount"]:
                    val = current_exp.get(field)
                    if val and company_size is None:
                        if isinstance(val, (int, float)):
                            company_size = int(val)
                        elif isinstance(val, str):
                            match = re.search(r"(\d+)", val.replace(",", ""))
                            if match:
                                company_size = int(match.group(1))

    if company_size is not None:
        # Artisan ICP: SMB to mid-market (roughly 10-1000)
        if 10 <= company_size <= 1000:
            score += 1.0
            notes_parts.append(f"Company size ~{company_size} (SMB/mid-market)")
        elif company_size > 1000:
            score += 0.5
            notes_parts.append(f"Company size ~{company_size} (enterprise, partial fit)")
        else:
            notes_parts.append(f"Company size ~{company_size} (very small)")
    else:
        # Benefit of the doubt
        score += 0.5
        notes_parts.append("Company size unknown (0.5 benefit-of-doubt)")

    # Signal 4: Seniority / budget authority
    seniority_matches = [kw for kw in SENIORITY_KEYWORDS if kw in combined_text]
    if seniority_matches:
        score += 1.0
        notes_parts.append(f"Seniority ({seniority_matches[0]})")

    # Determine verdict
    if score >= 3:
        verdict = "Strong Fit"
    elif score >= 2:
        verdict = "Good Fit"
    elif score >= 1.5:
        verdict = "Possible Fit"
    else:
        verdict = "Weak Fit"

    notes = "; ".join(notes_parts) if notes_parts else "No strong ICP signals detected"
    return score, verdict, notes


def calculate_days_since_change(raw_profile: Dict) -> Optional[int]:
    """
    Parse experience[0].startDate from the enriched profile.
    Returns days elapsed since the position started, or None if unparseable.
    """
    experience = raw_profile.get("experience", raw_profile.get("positions", raw_profile.get("workExperience", [])))
    if not isinstance(experience, list) or not experience:
        return None

    current = experience[0]
    if not isinstance(current, dict):
        return None

    start_date_str = current.get("startDate", current.get("start", current.get("dateRange", "")))
    if not start_date_str:
        return None

    start_date_str = str(start_date_str)

    # Try common date formats
    for fmt in ["%Y-%m-%d", "%Y-%m", "%b %Y", "%B %Y", "%m/%Y", "%Y"]:
        try:
            dt = datetime.strptime(start_date_str.strip(), fmt)
            delta = datetime.now() - dt
            return max(0, delta.days)
        except ValueError:
            continue

    # Try extracting "Month Year" patterns like "Jan 2025" or "January 2025"
    match = re.search(r"([A-Za-z]+)\s+(\d{4})", start_date_str)
    if match:
        try:
            dt = datetime.strptime(f"{match.group(1)} {match.group(2)}", "%b %Y")
            return max(0, (datetime.now() - dt).days)
        except ValueError:
            try:
                dt = datetime.strptime(f"{match.group(1)} {match.group(2)}", "%B %Y")
                return max(0, (datetime.now() - dt).days)
            except ValueError:
                pass

    # Try just a year
    year_match = re.search(r"(20\d{2})", start_date_str)
    if year_match:
        dt = datetime(int(year_match.group(1)), 6, 15)  # mid-year estimate
        return max(0, (datetime.now() - dt).days)

    return None


def generate_output_csv(changes: List[Dict], output_path: str):
    """Write final change-detection CSV."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "champion_name", "linkedin_url", "previous_company", "previous_title",
        "new_company", "new_title", "change_detected_date", "position_start_date",
        "days_since_change", "icp_score", "icp_verdict", "icp_notes",
        "email", "notes",
    ]

    rows = []
    for change in changes:
        raw = change.get("raw_profile", {})
        days = calculate_days_since_change(raw)

        # Try to get position start date string
        start_date = ""
        experience = raw.get("experience", raw.get("positions", []))
        if isinstance(experience, list) and experience:
            current = experience[0]
            if isinstance(current, dict):
                start_date = str(current.get("startDate", current.get("start", "")) or "")

        score, verdict, icp_notes = qualify_new_company(change)

        rows.append({
            "champion_name": change.get("name", ""),
            "linkedin_url": change.get("linkedin_url", ""),
            "previous_company": change.get("previous_company", ""),
            "previous_title": change.get("previous_title", ""),
            "new_company": change.get("new_company", ""),
            "new_title": change.get("new_title", ""),
            "change_detected_date": datetime.now().strftime("%Y-%m-%d"),
            "position_start_date": start_date,
            "days_since_change": str(days) if days is not None else "",
            "icp_score": f"{score:.1f}",
            "icp_verdict": verdict,
            "icp_notes": icp_notes,
            "email": change.get("email", ""),
            "notes": change.get("notes", ""),
        })

    path = Path(output_path)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nOutput written: {path} ({len(rows)} changes)")
    return rows


# ============================================================
# Subcommands
# ============================================================

def cmd_init(args):
    """Initialize baseline from champion CSV."""
    rows = load_champion_csv(args.input)

    # Collect valid LinkedIn URLs
    valid_urls = []
    for row in rows:
        url = row.get("linkedin_url", "").strip()
        if is_valid_linkedin_url(url):
            valid_urls.append(url)

    unique_urls = list(set(normalize_linkedin_url(u) for u in valid_urls))
    cost = (len(unique_urls) / 1000) * COST_PER_1K

    print(f"\nInit plan:")
    print(f"  Champions:          {len(rows)}")
    print(f"  Valid LinkedIn URLs: {len(valid_urls)} ({len(unique_urls)} unique)")
    print(f"  Estimated cost:     {len(unique_urls)} profiles x ${COST_PER_1K}/1k = ${cost:.2f}")
    print()

    if args.dry_run:
        print("Dry run — exiting without calling Apify.")
        return

    # Check API token
    api_token = os.getenv("GOOSEWORKS_API_KEY") or os.getenv("APIFY_API_TOKEN")
    if not api_token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)

    # Cost confirmation
    batch_count = (len(unique_urls) + 49) // 50
    confirm_cost(
        "Init: Profile Enrichment",
        num_runs=batch_count,
        est_cost=cost,
    )

    # Enrich all profiles
    print("Enriching profiles via Apify...")
    enricher = LinkedInEnricher(api_token)
    enriched_data = enricher.enrich_profiles(urls=valid_urls, batch_size=50, timeout=300)

    # Build baseline
    baseline = {
        "created": datetime.now(timezone.utc).isoformat(),
        "updated": datetime.now(timezone.utc).isoformat(),
        "champion_count": len(rows),
        "enriched_count": 0,
        "error_count": 0,
        "champions": {},
    }

    enriched_count = 0
    error_count = 0

    for row in rows:
        url = row.get("linkedin_url", "").strip()
        normalized = normalize_linkedin_url(url) if is_valid_linkedin_url(url) else ""

        champion_entry = {
            "name": row.get("name", ""),
            "linkedin_url": url,
            "original_company": row.get("original_company", ""),
            "original_title": row.get("original_title", ""),
            "email": row.get("email", ""),
            "source": row.get("source", ""),
            "notes": row.get("notes", ""),
        }

        # Merge enriched data
        if normalized and normalized in enriched_data:
            raw = enriched_data[normalized]
            if raw.get("_enrichment_error"):
                champion_entry["enrichment_status"] = "failed"
                champion_entry["enrichment_error"] = raw["_enrichment_error"]
                error_count += 1
            else:
                parsed = parse_enriched_profile(raw)
                champion_entry.update(parsed)
                champion_entry["last_enriched"] = datetime.now(timezone.utc).isoformat()
                enriched_count += 1
        elif not normalized:
            champion_entry["enrichment_status"] = "no_url"
            error_count += 1
        else:
            champion_entry["enrichment_status"] = "no_result"
            error_count += 1

        # Key by LinkedIn URL (or name if no URL)
        key = normalized or row.get("name", f"unknown_{len(baseline['champions'])}")
        baseline["champions"][key] = champion_entry

    baseline["enriched_count"] = enriched_count
    baseline["error_count"] = error_count

    save_baseline(baseline)

    print(f"\nBaseline created:")
    print(f"  Champions:  {len(rows)}")
    print(f"  Enriched:   {enriched_count}")
    print(f"  Errors:     {error_count}")


def cmd_check(args):
    """Re-enrich profiles, compare against baseline, detect job changes."""
    baseline = load_baseline()
    if not baseline:
        print("Error: No baseline found. Run 'init' first.")
        print(f"Expected: {BASELINE_PATH}")
        sys.exit(1)

    champions = baseline.get("champions", {})
    if not champions:
        print("Error: Baseline has no champions.")
        sys.exit(1)

    cache_days = getattr(args, 'cache_days', 7)
    force_enrich = getattr(args, 'force', False)
    cache_cutoff = datetime.now(timezone.utc) - timedelta(days=cache_days)

    # Collect URLs to re-enrich, applying cache filter
    urls_to_check = []
    skipped_cached = 0
    for url, data in champions.items():
        if not is_valid_linkedin_url(url):
            continue
        if not force_enrich:
            last_enriched = data.get("last_enriched")
            if last_enriched:
                try:
                    enriched_dt = datetime.fromisoformat(last_enriched.replace("Z", "+00:00"))
                    if enriched_dt > cache_cutoff:
                        skipped_cached += 1
                        continue
                except (ValueError, TypeError):
                    pass
        urls_to_check.append(url)

    unique_urls = list(set(normalize_linkedin_url(u) for u in urls_to_check))
    cost = (len(unique_urls) / 1000) * COST_PER_1K

    print(f"\nCheck plan:")
    print(f"  Champions in baseline: {len(champions)}")
    if not force_enrich:
        print(f"  Skipped (cached <{cache_days}d): {skipped_cached}")
    print(f"  URLs to re-enrich:     {len(unique_urls)}")
    print(f"  Estimated cost:        {len(unique_urls)} profiles x ${COST_PER_1K}/1k = ${cost:.2f}")
    print()

    if args.dry_run:
        print("Dry run — exiting without calling Apify.")
        return

    # Check API token
    api_token = os.getenv("GOOSEWORKS_API_KEY") or os.getenv("APIFY_API_TOKEN")
    if not api_token:
        print("Error: Set GOOSEWORKS_API_KEY or APIFY_API_TOKEN env var.", file=sys.stderr)
        sys.exit(1)

    if not unique_urls:
        print("All profiles are within the cache window. Use --force to re-enrich all.")
        return

    # Cost confirmation
    batch_count = (len(unique_urls) + 49) // 50
    confirm_cost(
        "Check: Profile Re-enrichment",
        num_runs=batch_count,
        est_cost=cost,
    )

    # Re-enrich profiles (only those that need it)
    print("Re-enriching profiles via Apify...")
    enricher = LinkedInEnricher(api_token)
    current_profiles = enricher.enrich_profiles(
        urls=urls_to_check, batch_size=50, timeout=300, no_cache=True
    )

    # Detect changes
    print("\nComparing against baseline...")
    changes = detect_changes(baseline, current_profiles)

    if not changes:
        print("\nNo job changes detected.")
        # Update baseline timestamp
        baseline["updated"] = datetime.now(timezone.utc).isoformat()
        baseline["last_check"] = datetime.now(timezone.utc).isoformat()
        baseline["last_check_changes"] = 0
        save_baseline(baseline)
        return

    print(f"\n{len(changes)} job change(s) detected:")
    for c in changes:
        print(f"   {c['name']}: {c['previous_company']} → {c['new_company']}")

    # Qualify new companies
    print("\nQualifying new companies against ICP...")
    for c in changes:
        score, verdict, notes = qualify_new_company(c)
        print(f"   {c['name']} @ {c['new_company']}: {verdict} ({score:.1f}/4) — {notes}")

    # Generate output CSV
    output_path = args.output
    if not output_path:
        date_str = datetime.now().strftime("%Y-%m-%d")
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        output_path = str(OUTPUT_DIR / f"changes-{date_str}.csv")

    generate_output_csv(changes, output_path)

    # Update baseline with current data
    enrich_ts = datetime.now(timezone.utc).isoformat()
    for url, data in champions.items():
        normalized = normalize_linkedin_url(url) if is_valid_linkedin_url(url) else ""
        if normalized and normalized in current_profiles:
            raw = current_profiles[normalized]
            if not raw.get("_enrichment_error"):
                parsed = parse_enriched_profile(raw)
                data.update(parsed)
                data["last_enriched"] = enrich_ts

    baseline["updated"] = datetime.now(timezone.utc).isoformat()
    baseline["last_check"] = datetime.now(timezone.utc).isoformat()
    baseline["last_check_changes"] = len(changes)
    save_baseline(baseline)


def cmd_status(args):
    """Show baseline stats."""
    baseline = load_baseline()
    if not baseline:
        print("No baseline found. Run 'init' first.")
        print(f"Expected: {BASELINE_PATH}")
        return

    champions = baseline.get("champions", {})
    created = baseline.get("created", "unknown")
    updated = baseline.get("updated", "unknown")
    last_check = baseline.get("last_check", "never")
    last_changes = baseline.get("last_check_changes", "n/a")

    # Count statuses
    statuses = {}
    for data in champions.values():
        status = data.get("enrichment_status", "unknown")
        statuses[status] = statuses.get(status, 0) + 1

    # Count companies
    companies = set()
    for data in champions.values():
        company = data.get("enriched_company") or data.get("original_company", "")
        if company:
            companies.add(normalize_company_name(company))

    # Check archive
    archive_count = 0
    if ARCHIVE_DIR.exists():
        archive_count = len(list(ARCHIVE_DIR.glob("baseline_*.json")))

    print(f"\nChampion Tracker Status")
    print(f"{'=' * 40}")
    print(f"  Champions:       {len(champions)}")
    print(f"  Unique companies: {len(companies)}")
    print(f"  Created:         {created[:19]}")
    print(f"  Last updated:    {updated[:19]}")
    print(f"  Last check:      {last_check[:19] if last_check != 'never' else 'never'}")
    print(f"  Changes found:   {last_changes}")
    print(f"  Archived runs:   {archive_count}")
    print(f"\n  Enrichment status:")
    for status, count in sorted(statuses.items()):
        print(f"    {status:15s} {count}")


# ============================================================
# CLI Entry Point
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Champion Tracking Engine — detect job changes and qualify new companies",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Initialize baseline from champion list
    python3 champion_tracker.py init -i champions.csv --dry-run
    python3 champion_tracker.py init -i champions.csv

    # Check for job changes
    python3 champion_tracker.py check --dry-run
    python3 champion_tracker.py check -o changes.csv

    # View status
    python3 champion_tracker.py status

Environment:
    APIFY_API_TOKEN: Required for LinkedIn enrichment.
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # init
    init_parser = subparsers.add_parser("init", help="Initialize baseline from champion CSV")
    init_parser.add_argument("-i", "--input", required=True, help="Path to champion CSV")
    init_parser.add_argument("--dry-run", action="store_true", help="Show cost estimate and exit")

    # check
    check_parser = subparsers.add_parser("check", help="Check for job changes against baseline")
    check_parser.add_argument("-o", "--output", help="Output CSV path (default: output/changes-YYYY-MM-DD.csv)")
    check_parser.add_argument("--dry-run", action="store_true", help="Show cost estimate and exit")
    check_parser.add_argument("--cache-days", type=int, default=7, help="Skip profiles enriched within N days (default: 7)")
    check_parser.add_argument("--force", action="store_true", help="Bypass cache, re-enrich all profiles")

    # status
    subparsers.add_parser("status", help="Show baseline stats")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "init":
        cmd_init(args)
    elif args.command == "check":
        cmd_check(args)
    elif args.command == "status":
        cmd_status(args)


if __name__ == "__main__":
    main()
