#!/usr/bin/env python3
"""
Signal Scanner — Layer 2 of the Signal-First Outbound Architecture
-------------------------------------------------------------------
Three-phase scanner that detects buying signals across TAM companies
and watchlist personas, writes them to the signals table, and scores
them for downstream activation.

Phase 1: Diff-based signals (free) — headcount, tech stack, funding
Phase 2: Apify-powered signals (paid) — job postings, LinkedIn content, profile changes
Phase 3: Post-processing — dedup, scoring, lead status updates

Usage:
    python signal_scanner.py --config configs/example.json
    python signal_scanner.py --config configs/example.json --test --yes
    python signal_scanner.py --config configs/example.json --dry-run
"""

import argparse
import hashlib
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Add project root to path for imports
_script_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(_script_dir.parents[3]))  # repo root
sys.path.insert(0, str(_script_dir.parent))       # skill dir (standalone install)

from tools.supabase.supabase_client import SupabaseClient
from tools.apify_guard import (
    guarded_apify_run,
    fetch_dataset,
    confirm_cost,
    set_limit,
    set_auto_confirm,
    get_run_count,
)


# ── GooseWorks Proxy ─────────────────────────────────────────────────────────
GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    APIFY_BASE_URL = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    APIFY_BASE_URL = "https://api.apify.com/v2"

# ── Constants ─────────────────────────────────────────────────────────────────

APIFY_ACTOR_JOB_SEARCH = "harvestapi~linkedin-job-search"
APIFY_ACTOR_PROFILE_POSTS = "harvestapi/linkedin-profile-posts"
APIFY_ACTOR_PROFILE_SCRAPER = "harvestapi~linkedin-profile-scraper"

SIGNAL_STRENGTHS = {
    "headcount_growth": 6,
    "tech_stack_change": 5,
    "funding_round": 8,
    "job_posting": 6,
    "linkedin_content": 7,  # 7-9 based on relevance
    "job_change": 8,
    "title_change": 6,
    "headline_change": 4,
    "new_csuite_hire": 7,
}

# Recency multipliers for activation scoring
RECENCY_MULTIPLIERS = [
    (timedelta(hours=24), 1.5),
    (timedelta(days=3), 1.2),
    (timedelta(days=7), 1.0),
    (timedelta(days=14), 0.8),
    (timedelta(days=28), 0.5),
]

# Tier-based account fit multipliers
TIER_MULTIPLIERS = {1: 1.3, 2: 1.0, 3: 0.7}

# Default activation threshold for updating lead_status
ACTIVATION_THRESHOLD = 6.0

# Test mode limits
TEST_COMPANY_LIMIT = 5
TEST_PERSON_LIMIT = 3


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_signal_hash(signal_type, entity_id, signal_data):
    """Create a SHA-256 dedup hash from signal type, entity, and data."""
    raw = f"{signal_type}|{entity_id}|{json.dumps(signal_data, sort_keys=True)}"
    return hashlib.sha256(raw.encode()).hexdigest()


def build_signal_row(
    client_name,
    company_id=None,
    person_id=None,
    signal_type="",
    strength=5,
    signal_data=None,
    signal_source="signal-scanner",
    run_id=None,
):
    """Build a signal dict ready for insert into the signals table.

    Fields match the signals schema in tools/supabase/schema.sql.
    signal_level is derived: 'person' if person_id is set, else 'company'.
    dedup_hash is kept in-memory only (not a DB column) for dedup_signals().
    """
    now = datetime.now(timezone.utc).isoformat()
    entity_id = person_id or company_id or ""
    sig_data = signal_data or {}

    row = {
        "client_name": client_name,
        "company_id": company_id,
        "person_id": person_id,
        "signal_level": "person" if person_id else "company",
        "signal_type": signal_type,
        "signal_source": signal_source,
        "strength": strength,
        "signal_data": sig_data,
        "detected_at": now,
        "acted_on": False,
        "run_id": run_id,
    }

    # dedup_hash is used for in-memory dedup only — not a DB column.
    # Stored on the dict for dedup_signals() but stripped before insert.
    row["_dedup_hash"] = make_signal_hash(signal_type, entity_id, sig_data)

    return row


def get_snapshot(entity, key="_signal_snapshot"):
    """Extract the signal snapshot from an entity's metadata or raw_data."""
    meta = entity.get("metadata") or {}
    if isinstance(meta, str):
        try:
            meta = json.loads(meta)
        except (json.JSONDecodeError, TypeError):
            meta = {}
    return meta.get(key, {})


def recency_multiplier(detected_at_str):
    """Calculate recency multiplier based on signal age."""
    try:
        detected = datetime.fromisoformat(detected_at_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return 0.5
    age = datetime.now(timezone.utc) - detected
    for threshold, mult in RECENCY_MULTIPLIERS:
        if age <= threshold:
            return mult
    return 0.3  # older than 4 weeks


# ── Phase 1: Diff-Based Signals (Free) ───────────────────────────────────────

def scan_headcount_growth(sb, companies, config, client_name, run_id):
    """Detect headcount growth > threshold over lookback period."""
    cfg = config.get("signals", {}).get("headcount_growth", {})
    if not cfg.get("enabled"):
        return []

    threshold_pct = cfg.get("threshold_pct", 10)
    signals = []

    for co in companies:
        snapshot = get_snapshot(co)
        current_count = co.get("employee_count")

        if current_count is None:
            continue

        prev_count = snapshot.get("employee_count")
        if prev_count is None or prev_count == 0:
            continue

        pct_change = ((current_count - prev_count) / prev_count) * 100

        if pct_change >= threshold_pct:
            signals.append(build_signal_row(
                client_name=client_name,
                company_id=co["id"],
                signal_type="headcount_growth",
                strength=SIGNAL_STRENGTHS["headcount_growth"],
                signal_data={
                    "previous_count": prev_count,
                    "current_count": current_count,
                    "pct_change": round(pct_change, 1),
                    "company_name": co.get("name", ""),
                },
                run_id=run_id,
            ))

    print(f"  Headcount growth: {len(signals)} signals (threshold: {threshold_pct}%)")
    return signals


def scan_tech_stack_changes(sb, companies, config, client_name, run_id):
    """Detect tech stack additions/removals by diffing against snapshot."""
    cfg = config.get("signals", {}).get("tech_stack_change", {})
    if not cfg.get("enabled"):
        return []

    signals = []

    for co in companies:
        snapshot = get_snapshot(co)
        current_stack = set(co.get("tech_stack") or [])
        prev_stack = set(snapshot.get("tech_stack") or [])

        if not current_stack and not prev_stack:
            continue
        if not prev_stack:
            # First scan — no baseline to diff against
            continue

        added = current_stack - prev_stack
        removed = prev_stack - current_stack

        if added or removed:
            signals.append(build_signal_row(
                client_name=client_name,
                company_id=co["id"],
                signal_type="tech_stack_change",
                strength=SIGNAL_STRENGTHS["tech_stack_change"],
                signal_data={
                    "added": sorted(added),
                    "removed": sorted(removed),
                    "company_name": co.get("name", ""),
                },
                run_id=run_id,
            ))

    print(f"  Tech stack changes: {len(signals)} signals")
    return signals


def scan_funding_changes(sb, companies, config, client_name, run_id):
    """Detect funding stage or amount changes."""
    cfg = config.get("signals", {}).get("funding_round", {})
    if not cfg.get("enabled"):
        return []

    signals = []

    for co in companies:
        snapshot = get_snapshot(co)
        current_stage = co.get("funding_stage") or ""
        current_total = co.get("total_funding") or 0
        prev_stage = snapshot.get("funding_stage") or ""
        prev_total = snapshot.get("total_funding") or 0

        stage_changed = current_stage and current_stage != prev_stage and prev_stage
        total_changed = current_total > prev_total and prev_total > 0

        if stage_changed or total_changed:
            signals.append(build_signal_row(
                client_name=client_name,
                company_id=co["id"],
                signal_type="funding_round",
                strength=SIGNAL_STRENGTHS["funding_round"],
                signal_data={
                    "previous_stage": prev_stage,
                    "current_stage": current_stage,
                    "previous_total": prev_total,
                    "current_total": current_total,
                    "company_name": co.get("name", ""),
                },
                run_id=run_id,
            ))

    print(f"  Funding changes: {len(signals)} signals")
    return signals


# ── Phase 2: Apify-Powered Signals (Paid) ────────────────────────────────────

def scan_job_postings(sb, companies, config, client_name, run_id, apify_token):
    """Search LinkedIn job postings for intent-indicating roles."""
    cfg = config.get("signals", {}).get("job_postings", {})
    if not cfg.get("enabled"):
        return []

    keywords = cfg.get("keywords", [])
    max_jobs = cfg.get("max_jobs_per_company", 50)
    posted_limit = cfg.get("posted_limit", "week")

    if not keywords:
        print("  Job postings: skipped (no keywords configured)")
        return []

    # Filter companies with LinkedIn URLs
    companies_with_li = [
        co for co in companies
        if co.get("linkedin_url")
    ]
    if not companies_with_li:
        print("  Job postings: skipped (no companies with LinkedIn URLs)")
        return []

    # Cost estimate: 1 run per company
    num_runs = len(companies_with_li)
    est_cost = num_runs * 0.001 + num_runs * max_jobs * 0.001
    confirm_cost("Job Posting Search", num_runs=num_runs, est_cost=est_cost)

    signals = []

    for co in companies_with_li:
        li_url = co["linkedin_url"]
        payload = {
            "jobTitles": keywords,
            "companyLinkedin": [li_url],
            "maxItems": max_jobs,
            "postedLimit": posted_limit,
            "sortBy": "date",
        }

        try:
            actor_run_id = guarded_apify_run(APIFY_ACTOR_JOB_SEARCH, payload, apify_token)
            # Fetch dataset from run
            check_url = f"{APIFY_BASE_URL}/actor-runs/{actor_run_id}?token={apify_token}"
            check = json.load(urllib.request.urlopen(check_url, timeout=30))
            dataset_id = check["data"]["defaultDatasetId"]
            jobs = fetch_dataset(dataset_id, apify_token)
        except Exception as e:
            print(f"    Error fetching jobs for {co.get('name', '?')}: {e}")
            continue

        for job in jobs:
            job_title = job.get("title", "")
            job_url = job.get("url", job.get("jobUrl", ""))

            signals.append(build_signal_row(
                client_name=client_name,
                company_id=co["id"],
                signal_type="job_posting",
                strength=SIGNAL_STRENGTHS["job_posting"],
                signal_data={
                    "job_title": job_title,
                    "job_url": job_url,
                    "company_name": co.get("name", ""),
                    "location": job.get("location", ""),
                    "posted_date": job.get("postedDate", ""),
                },
                run_id=run_id,
            ))

        # Log enrichment
        sb.log_enrichment([{
            "client_name": client_name,
            "entity_type": "company",
            "entity_id": co["id"],
            "tool": "apify",
            "action": "search",
            "credits_used": len(jobs) * 0.001 + 0.001,
            "run_id": run_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }])

    print(f"  Job postings: {len(signals)} signals across {len(companies_with_li)} companies")
    return signals


def scan_linkedin_content(sb, people, config, client_name, run_id, apify_token):
    """Analyze LinkedIn posts from watchlist personas for relevance signals."""
    cfg = config.get("signals", {}).get("linkedin_content", {})
    if not cfg.get("enabled"):
        return []

    problem_desc = cfg.get("problem_description", "")
    relevance_threshold = cfg.get("relevance_threshold", 6)
    max_posts = cfg.get("max_posts", 10)
    use_llm = cfg.get("llm_analysis", False)

    # Check for Anthropic key if LLM analysis requested
    anthropic_key_env = config.get("anthropic_key_env", "ANTHROPIC_API_KEY")
    anthropic_key = os.environ.get(anthropic_key_env, "")
    if use_llm and not anthropic_key:
        print("  LinkedIn content: LLM analysis requested but no ANTHROPIC_API_KEY — falling back to keyword matching")
        use_llm = False

    people_with_li = [p for p in people if p.get("linkedin_url")]
    if not people_with_li:
        print("  LinkedIn content: skipped (no people with LinkedIn URLs)")
        return []

    # Cost estimate
    num_runs = len(people_with_li)
    est_cost = num_runs * 0.002  # ~$2/1k profiles
    confirm_cost("LinkedIn Content Analysis", num_runs=num_runs, est_cost=est_cost)

    signals = []

    for person in people_with_li:
        li_url = person["linkedin_url"]
        payload = {
            "profileUrls": [li_url],
            "maxPosts": max_posts,
        }

        try:
            actor_run_id = guarded_apify_run(APIFY_ACTOR_PROFILE_POSTS, payload, apify_token)
            check_url = f"{APIFY_BASE_URL}/actor-runs/{actor_run_id}?token={apify_token}"
            check = json.load(urllib.request.urlopen(check_url, timeout=30))
            dataset_id = check["data"]["defaultDatasetId"]
            posts = fetch_dataset(dataset_id, apify_token)
        except Exception as e:
            print(f"    Error fetching posts for {person.get('full_name', '?')}: {e}")
            continue

        for post in posts:
            post_text = post.get("text", post.get("postText", ""))
            if not post_text:
                continue

            # Score relevance
            if use_llm:
                score = _llm_score_post(post_text, problem_desc, anthropic_key)
            else:
                score = _keyword_score_post(post_text, problem_desc)

            if score >= relevance_threshold:
                # Map score to strength: 6 → 7, 8 → 8, 10 → 9
                strength = min(9, max(7, 7 + (score - relevance_threshold)))

                signals.append(build_signal_row(
                    client_name=client_name,
                    company_id=person.get("company_id"),
                    person_id=person["id"],
                    signal_type="linkedin_content",
                    strength=strength,
                    signal_data={
                        "post_text": post_text[:500],
                        "relevance_score": score,
                        "person_name": person.get("full_name", ""),
                        "post_url": post.get("url", post.get("postUrl", "")),
                        "analysis_method": "llm" if use_llm else "keyword",
                    },
                    run_id=run_id,
                ))

        # Log enrichment
        sb.log_enrichment([{
            "client_name": client_name,
            "entity_type": "person",
            "entity_id": person["id"],
            "tool": "apify",
            "action": "enrich",
            "credits_used": 0.002,
            "run_id": run_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }])

    print(f"  LinkedIn content: {len(signals)} signals across {len(people_with_li)} people")
    return signals


def _llm_score_post(post_text, problem_description, api_key):
    """Score a LinkedIn post's relevance using Claude API. Returns 1-10."""
    prompt = f"""Score how relevant this LinkedIn post is to the following problem space.

Problem space: {problem_description}

LinkedIn post:
{post_text[:1000]}

Return ONLY a single integer from 1-10:
1-3: Not relevant
4-5: Tangentially related
6-7: Adjacent topic, shows awareness
8-9: Directly discusses the problem
10: Explicitly mentions needing a solution

Score:"""

    try:
        body = json.dumps({
            "model": "claude-haiku-4-5-20251001",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": prompt}],
        }).encode()

        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=body,
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
            text = result["content"][0]["text"].strip()
            return int(text)
    except Exception:
        return 0


def _keyword_score_post(post_text, problem_description):
    """Simple keyword-based post scoring. Returns 1-10."""
    if not post_text or not problem_description:
        return 0

    text_lower = post_text.lower()
    keywords = [w.strip().lower() for w in problem_description.replace(",", " ").split() if len(w.strip()) > 3]

    if not keywords:
        return 0

    matches = sum(1 for kw in keywords if kw in text_lower)
    ratio = matches / len(keywords)

    if ratio >= 0.5:
        return 8
    elif ratio >= 0.3:
        return 7
    elif ratio >= 0.15:
        return 6
    elif ratio >= 0.05:
        return 4
    return 2


def scan_profile_changes(sb, people, config, client_name, run_id, apify_token):
    """Detect job changes, title changes, and headline updates."""
    cfg = config.get("signals", {}).get("profile_changes", {})
    if not cfg.get("enabled"):
        return []

    detect_job = cfg.get("detect_job_change", True)
    detect_title = cfg.get("detect_title_change", True)
    detect_company = cfg.get("detect_company_change", True)

    people_with_li = [p for p in people if p.get("linkedin_url")]
    if not people_with_li:
        print("  Profile changes: skipped (no people with LinkedIn URLs)")
        return []

    # Cost estimate: ~$3/1k profiles
    num_runs = len(people_with_li)
    est_cost = num_runs * 0.003
    confirm_cost("Profile Change Detection", num_runs=num_runs, est_cost=est_cost)

    signals = []

    for person in people_with_li:
        li_url = person["linkedin_url"]
        payload = {
            "profileUrls": [li_url],
        }

        try:
            actor_run_id = guarded_apify_run(APIFY_ACTOR_PROFILE_SCRAPER, payload, apify_token)
            check_url = f"{APIFY_BASE_URL}/actor-runs/{actor_run_id}?token={apify_token}"
            check = json.load(urllib.request.urlopen(check_url, timeout=30))
            dataset_id = check["data"]["defaultDatasetId"]
            profiles = fetch_dataset(dataset_id, apify_token)
        except Exception as e:
            print(f"    Error fetching profile for {person.get('full_name', '?')}: {e}")
            continue

        if not profiles:
            continue

        profile = profiles[0]
        snapshot = get_snapshot(person, key="_signal_snapshot")

        current_title = profile.get("title", profile.get("headline", ""))
        current_company = profile.get("companyName", profile.get("company", ""))
        current_headline = profile.get("headline", "")

        prev_title = snapshot.get("title", "")
        prev_company = snapshot.get("company", "")
        prev_headline = snapshot.get("headline", "")

        # Only detect changes if we have a baseline
        if snapshot:
            # Job change (company changed)
            if detect_job and current_company and prev_company:
                if _normalize(current_company) != _normalize(prev_company):
                    signals.append(build_signal_row(
                        client_name=client_name,
                        company_id=person.get("company_id"),
                        person_id=person["id"],
                        signal_type="job_change",
                        strength=SIGNAL_STRENGTHS["job_change"],
                        signal_data={
                            "previous_company": prev_company,
                            "current_company": current_company,
                            "person_name": person.get("full_name", ""),
                            "current_title": current_title,
                        },
                        run_id=run_id,
                    ))

            # Title change
            if detect_title and current_title and prev_title:
                if _normalize(current_title) != _normalize(prev_title):
                    if _normalize(current_company) == _normalize(prev_company):
                        signals.append(build_signal_row(
                            client_name=client_name,
                            company_id=person.get("company_id"),
                            person_id=person["id"],
                            signal_type="title_change",
                            strength=SIGNAL_STRENGTHS["title_change"],
                            signal_data={
                                "previous_title": prev_title,
                                "current_title": current_title,
                                "person_name": person.get("full_name", ""),
                            },
                            run_id=run_id,
                        ))

            # Headline change
            if detect_company and current_headline and prev_headline:
                if current_headline != prev_headline:
                    signals.append(build_signal_row(
                        client_name=client_name,
                        company_id=person.get("company_id"),
                        person_id=person["id"],
                        signal_type="headline_change",
                        strength=SIGNAL_STRENGTHS["headline_change"],
                        signal_data={
                            "previous_headline": prev_headline,
                            "current_headline": current_headline,
                            "person_name": person.get("full_name", ""),
                        },
                        run_id=run_id,
                    ))

        # Update snapshot on the person's raw_data
        update_snapshot(sb, "person", person["id"], {
            "title": current_title,
            "company": current_company,
            "headline": current_headline,
        })

        # Log enrichment
        sb.log_enrichment([{
            "client_name": client_name,
            "entity_type": "person",
            "entity_id": person["id"],
            "tool": "apify",
            "action": "enrich",
            "credits_used": 0.003,
            "run_id": run_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }])

    print(f"  Profile changes: {len(signals)} signals across {len(people_with_li)} people")
    return signals


def _normalize(text):
    """Normalize text for comparison (lowercase, strip whitespace/punctuation)."""
    return (text or "").lower().strip().rstrip(".,;:")


# ── Phase 3: Post-Processing ─────────────────────────────────────────────────

def dedup_signals(sb, signals, client_name, lookback_days=30):
    """Remove signals that already exist in the DB within the lookback window.

    Uses signal_type + company_id + signal_data to match against existing signals.
    The _dedup_hash is computed in-memory for fast comparison — it's not stored in the DB.
    """
    if not signals:
        return []

    # Fetch recent signals for this client
    cutoff = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).isoformat()
    existing = sb._request(
        "GET",
        "signals",
        params={
            "client_name": f"eq.{client_name}",
            "detected_at": f"gte.{cutoff}",
            "select": "signal_type,company_id,person_id,signal_data",
        },
    ) or []

    # Rebuild dedup hashes from existing DB signals for comparison
    existing_hashes = set()
    for row in existing:
        entity_id = row.get("person_id") or row.get("company_id") or ""
        h = make_signal_hash(
            row.get("signal_type", ""),
            entity_id,
            row.get("signal_data") or {},
        )
        existing_hashes.add(h)

    deduped = [s for s in signals if s.get("_dedup_hash") not in existing_hashes]
    dupes = len(signals) - len(deduped)
    if dupes:
        print(f"  Dedup: removed {dupes} duplicate signals")

    return deduped


def score_signals(signals, companies_by_id):
    """Add activation_score to each signal based on strength, recency, and tier."""
    for sig in signals:
        strength = sig.get("strength", 5)
        detected = sig.get("detected_at", "")
        rec_mult = recency_multiplier(detected)

        # Look up company tier
        co_id = sig.get("company_id")
        tier = 3  # default
        if co_id and co_id in companies_by_id:
            tier = companies_by_id[co_id].get("tier", 3) or 3
        tier_mult = TIER_MULTIPLIERS.get(tier, 0.7)

        sig["activation_score"] = round(strength * rec_mult * tier_mult, 2)

    return signals


def update_snapshot(sb, entity_type, entity_id, snapshot_data):
    """Store current values as the signal snapshot for next diff."""
    snapshot_data["_snapshot_at"] = datetime.now(timezone.utc).isoformat()

    if entity_type == "company":
        # Read current metadata, merge snapshot
        companies = sb.get_companies(filters={"id": f"eq.{entity_id}"}, select="metadata")
        meta = {}
        if companies:
            meta = companies[0].get("metadata") or {}
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except (json.JSONDecodeError, TypeError):
                    meta = {}
        meta["_signal_snapshot"] = snapshot_data
        sb.patch_companies_by_ids([entity_id], {"metadata": meta})

    elif entity_type == "person":
        # Read current raw_data, merge snapshot
        people = sb.get_people(filters={"id": f"eq.{entity_id}"}, select="raw_data")
        raw = {}
        if people:
            raw = people[0].get("raw_data") or {}
            if isinstance(raw, str):
                try:
                    raw = json.loads(raw)
                except (json.JSONDecodeError, TypeError):
                    raw = {}
        raw["_signal_snapshot"] = snapshot_data
        sb.patch_person_by_id(entity_id, {"raw_data": raw})


def update_company_snapshots(sb, companies):
    """Batch-update signal snapshots for all scanned companies."""
    for co in companies:
        snapshot_data = {}
        if co.get("employee_count") is not None:
            snapshot_data["employee_count"] = co["employee_count"]
        if co.get("tech_stack"):
            snapshot_data["tech_stack"] = co["tech_stack"]
        if co.get("funding_stage"):
            snapshot_data["funding_stage"] = co["funding_stage"]
        if co.get("total_funding") is not None:
            snapshot_data["total_funding"] = co["total_funding"]

        if snapshot_data:
            update_snapshot(sb, "company", co["id"], snapshot_data)


# ── Orchestration ─────────────────────────────────────────────────────────────

def run_scan(sb, config, run_id, auto_confirm=False, test_mode=False, dry_run=False):
    """Orchestrate all three phases of signal scanning."""
    client_name = config["client_name"]
    scope = config.get("scan_scope", {})
    tiers = scope.get("company_tiers", [1, 2])
    tam_status = scope.get("tam_status", "active")
    lead_statuses = scope.get("person_lead_statuses", ["monitoring", "signal_detected", "qualified"])

    # Get Apify token (prefer GooseWorks proxy key)
    apify_token = GOOSEWORKS_API_KEY
    if not apify_token:
        apify_token_env = config.get("apify_token_env", "APIFY_TOKEN")
        apify_token = os.environ.get(apify_token_env, "")

    if auto_confirm:
        set_auto_confirm(True)

    # ── Load companies ────────────────────────────────────────────
    print("\n[1/5] Loading companies...")
    all_companies = sb.get_all_companies(client_name)

    # Filter by tier and status
    companies = [
        co for co in all_companies
        if (co.get("tier") in tiers) and (co.get("tam_status", "active") == tam_status)
    ]
    if test_mode:
        companies = companies[:TEST_COMPANY_LIMIT]

    companies_by_id = {co["id"]: co for co in companies}
    print(f"  Loaded {len(companies)} companies (tiers {tiers}, status={tam_status})")

    # ── Load people ───────────────────────────────────────────────
    print("\n[2/5] Loading people...")
    people = []
    for status in lead_statuses:
        batch = sb.get_people(
            filters={
                "client_name": f"eq.{client_name}",
                "lead_status": f"eq.{status}",
            }
        )
        people.extend(batch)

    if test_mode:
        people = people[:TEST_PERSON_LIMIT]

    print(f"  Loaded {len(people)} people (statuses: {lead_statuses})")

    # ── Phase 1: Diff-based signals (free) ────────────────────────
    print("\n[3/5] Phase 1: Diff-based signals...")
    all_signals = []

    all_signals.extend(scan_headcount_growth(sb, companies, config, client_name, run_id))
    all_signals.extend(scan_tech_stack_changes(sb, companies, config, client_name, run_id))
    all_signals.extend(scan_funding_changes(sb, companies, config, client_name, run_id))

    phase1_count = len(all_signals)
    print(f"  Phase 1 total: {phase1_count} signals")

    # ── Phase 2: Apify-powered signals (paid) ─────────────────────
    print("\n[4/5] Phase 2: Apify-powered signals...")
    phase2_count = 0

    if apify_token:
        all_signals.extend(scan_job_postings(sb, companies, config, client_name, run_id, apify_token))
        all_signals.extend(scan_profile_changes(sb, people, config, client_name, run_id, apify_token))
        all_signals.extend(scan_linkedin_content(sb, people, config, client_name, run_id, apify_token))
        phase2_count = len(all_signals) - phase1_count
        print(f"  Phase 2 total: {phase2_count} signals")
    else:
        print("  Skipped (no APIFY_TOKEN set)")

    # ── Phase 3: Post-processing ──────────────────────────────────
    print("\n[5/5] Phase 3: Post-processing...")

    # Dedup
    all_signals = dedup_signals(sb, all_signals, client_name)

    # Score
    all_signals = score_signals(all_signals, companies_by_id)

    if dry_run:
        print(f"\n  DRY RUN — would write {len(all_signals)} signals")
        for sig in all_signals[:10]:
            print(f"    {sig['signal_type']}: {sig.get('signal_data', {}).get('company_name', sig.get('signal_data', {}).get('person_name', '?'))} (score: {sig.get('activation_score', '?')})")
        if len(all_signals) > 10:
            print(f"    ... and {len(all_signals) - 10} more")
        return all_signals

    # Write signals to DB — strip _dedup_hash (in-memory only, not a DB column)
    if all_signals:
        db_signals = [{k: v for k, v in s.items() if not k.startswith("_")} for s in all_signals]
        written = sb.insert_signals(db_signals)
        print(f"  Wrote {written} signals to database")

    # Update company snapshots
    update_company_snapshots(sb, companies)

    # Update lead_status for high-scoring person signals
    person_signals = [s for s in all_signals if s.get("person_id") and s.get("activation_score", 0) >= ACTIVATION_THRESHOLD]
    if person_signals:
        person_ids = list({s["person_id"] for s in person_signals})
        sb.update_lead_status(person_ids, "signal_detected")
        print(f"  Updated {len(person_ids)} people to lead_status=signal_detected")

    # Summary
    print(f"\n{'='*50}")
    print(f"Signal Scan Complete — {client_name}")
    print(f"  Phase 1 (free):  {phase1_count} raw signals")
    print(f"  Phase 2 (Apify): {phase2_count} raw signals")
    print(f"  After dedup:     {len(all_signals)} unique signals")
    print(f"  Apify runs used: {get_run_count()}")
    if all_signals:
        avg_score = sum(s.get("activation_score", 0) for s in all_signals) / len(all_signals)
        print(f"  Avg activation:  {avg_score:.1f}")
    print(f"{'='*50}")

    return all_signals


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Signal Scanner — detect buying signals across TAM")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--test", action="store_true", help=f"Limit to {TEST_COMPANY_LIMIT} companies, {TEST_PERSON_LIMIT} people")
    parser.add_argument("--yes", action="store_true", help="Auto-confirm Apify cost prompts")
    parser.add_argument("--dry-run", action="store_true", help="Detect signals but don't write to DB")
    parser.add_argument("--max-runs", type=int, default=50, help="Apify run limit (default 50)")
    args = parser.parse_args()

    # Load config
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"ERROR: Config not found: {config_path}")
        sys.exit(1)

    with open(config_path) as f:
        config = json.load(f)

    client_name = config.get("client_name")
    if not client_name:
        print("ERROR: config must include 'client_name'")
        sys.exit(1)

    # Set Apify limits
    set_limit(args.max_runs)

    # Init Supabase
    sb_url = os.environ.get("SUPABASE_URL")
    sb_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not sb_url or not sb_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        sys.exit(1)

    sb = SupabaseClient(sb_url, sb_key)
    if not sb.test_connection():
        print("ERROR: Cannot connect to Supabase")
        sys.exit(1)

    # Create run record
    run_record = sb.create_run("signal_scan", "signal-scanner", client_name, config=config)
    run_id = run_record["id"] if run_record else None

    print(f"Signal Scanner — {client_name}")
    print(f"  Run ID: {run_id}")
    print(f"  Mode: {'TEST' if args.test else 'FULL'} {'(DRY RUN)' if args.dry_run else ''}")

    try:
        signals = run_scan(
            sb, config, run_id,
            auto_confirm=args.yes,
            test_mode=args.test,
            dry_run=args.dry_run,
        )
        sb.update_run_status(run_id, "completed", summary={
            "total_signals": len(signals),
            "signal_types": list({s["signal_type"] for s in signals}),
            "apify_runs": get_run_count(),
        })
    except Exception as e:
        print(f"\nERROR: {e}")
        if run_id:
            sb.update_run_status(run_id, "failed", error_message=str(e))
        raise


if __name__ == "__main__":
    main()
