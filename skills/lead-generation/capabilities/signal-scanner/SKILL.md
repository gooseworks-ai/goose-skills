---
name: signal-scanner
description: >
  Detect buying signals across TAM companies and watchlist personas.
  Three-phase architecture: (1) free diff-based signals from existing data
  (headcount growth, tech stack changes, funding rounds), (2) Apify-powered
  signals (job postings, LinkedIn content analysis, profile changes), and
  (3) post-processing with dedup, scoring, and lead status updates.
  Writes signals to Supabase signals table for downstream activation.
tags: [lead-generation]
---

# Signal Scanner

Scheduled scanner that detects buying signals on TAM companies and watchlist personas, writes them to the `signals` table, and sets up downstream activation.

## When to Use

- After TAM Builder has populated companies and personas
- As a recurring scan (daily/weekly) to detect timing-based outreach triggers
- When you need to move from static lists to intent-driven outreach

## Prerequisites

- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- `APIFY_TOKEN` in `.env` (for Phase 2 signals)
- `ANTHROPIC_API_KEY` in `.env` (optional, for LLM content analysis)
- TAM companies populated via `tam-builder`
- Watchlist personas created for Tier 1-2 companies

## Signal Types

| Priority | Signal | Level | Source | Cost |
|----------|--------|-------|--------|------|
| P0 | Headcount growth (>10% in 90d) | Company | Data diffs | Free |
| P0 | Tech stack changes | Company | Data diffs | Free |
| P0 | Funding round | Company | Data diffs | Free |
| P0 | Job posting for relevant roles | Company | Apify linkedin-job-search | ~$0.001/job |
| P1 | Leadership job change | Person | Apify linkedin-profile-scraper | ~$3/1k |
| P1 | LinkedIn content analysis | Person | Apify linkedin-profile-posts + LLM | ~$2/1k + LLM |
| P1 | LinkedIn profile updates | Person | Apify linkedin-profile-scraper | ~$3/1k |
| P2 | New C-suite hire | Company | Derived from person scans | Free |

## Config Format

See `configs/example.json` for full schema. Key sections:

- `client_name` — which client's TAM to scan
- `signals.*` — enable/disable each signal type with thresholds
- `scan_scope` — filter by tier, status, lead_status

## Database Write Policy

**CRITICAL: Never write signals or update lead statuses without explicit user approval.**

The signal scanner writes to multiple tables: `signals` (insert), `enrichment_log` (insert), `companies` (patch snapshots), and `people` (patch lead_status). These writes affect downstream outreach decisions — bad signals lead to bad outreach timing.

**Required flow:**
1. **Always run `--dry-run` first** to detect signals without writing to the database
2. Present the dry-run results to the user: signal count, types, top signals, affected companies/people
3. **Get explicit user approval** before running without `--dry-run`
4. Only then run the actual scan that writes to the database

**Why this matters:**
- Signals drive outreach timing — incorrect signals trigger premature outreach
- `lead_status` changes from `monitoring` to `signal_detected` are hard to undo across many records
- Snapshot updates affect future signal diffs — bad snapshots cascade into future scans
- Enrichment log entries track Apify credit spend

**The agent must NEVER pass `--yes` on a first run.** The `--yes` flag is only for pre-approved scheduled scans where the user has already validated the signal detection logic.

## Usage

```bash
# Dry run first (ALWAYS DO THIS) — detect signals without writing to DB
python skills/capabilities/signal-scanner/scripts/signal_scanner.py \
  --config skills/capabilities/signal-scanner/configs/my-client.json --dry-run

# Full scan (only after user reviews dry-run results and approves)
python skills/capabilities/signal-scanner/scripts/signal_scanner.py \
  --config skills/capabilities/signal-scanner/configs/my-client.json

# Test mode (5 companies max)
python skills/capabilities/signal-scanner/scripts/signal_scanner.py \
  --config configs/example.json --test --dry-run

# Free signals only (skip Apify)
# Set all Apify signals to enabled: false in config
```

### Flags

| Flag | Effect |
|------|--------|
| `--config PATH` | Path to config JSON (required) |
| `--test` | Limit to 5 companies, 3 people |
| `--yes` | Auto-confirm Apify cost prompts. **Only use for pre-approved scheduled scans.** |
| `--dry-run` | Detect signals but don't write to DB. **Always run this first.** |
| `--max-runs N` | Override Apify run limit (default 50) |

## Output

### Signals table writes
Each signal includes: `client_name`, `company_id`, `person_id`, `signal_level` (company or person), `signal_type`, `signal_source`, `strength`, `signal_data` (JSON), `activation_score`, `detected_at`, `acted_on`, `run_id`.

### Other database writes
- Person `lead_status` updated to `signal_detected` when activation_score >= threshold
- Company `metadata._signal_snapshot` updated for next diff cycle
- Person `raw_data._signal_snapshot` updated for next diff cycle
- `enrichment_log` entries with `tool='apify'`, `action='search'` or `'enrich'`, plus `credits_used`

### Console output
- Summary stats printed to stdout

## Activation Score

```
activation_score = strength * recency_multiplier * account_fit

Recency:   <24h = 1.5, 1-3d = 1.2, 3-7d = 1.0, 1-2w = 0.8, 2-4w = 0.5
Account:   Tier 1 = 1.3, Tier 2 = 1.0, Tier 3 = 0.7
```

## Connects To

- **Upstream:** `tam-builder` (provides companies + people)
- **Downstream:** `cold-email-outreach` (acts on signals)

## File Structure

```
signal-scanner/
├── SKILL.md
├── configs/
│   └── example.json
└── scripts/
    └── signal_scanner.py
```
