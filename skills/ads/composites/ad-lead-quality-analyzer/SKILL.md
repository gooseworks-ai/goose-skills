---
name: ad-lead-quality-analyzer
description: For paid lead-gen and participant-recruitment ads, replaces vanity CPA with true CAC per qualified lead by joining ad-platform data with downstream funnel events, surfaces tracking gaps, and classifies every creative into Scale / Keep / Investigate / Cut.
tags: [ads]
---

# Ad Lead Quality Analyzer

Meta optimizes for whatever conversion event you fire. For lead-gen and participant-recruitment campaigns that's almost always "signup" — but a signup is worthless if the lead never qualifies, never completes the requested action, or never gets paid out. The lowest-CPA campaign is often the one bringing in the *worst* leads.

This skill joins what the ad platform knows (spend, signups) with what your own product knows (downstream funnel) and replaces vanity CPA with **true CAC per qualified lead**. It then classifies every creative into actionable buckets so you stop scaling the wrong winners.

**Core principle:** The ad platform's CPA is a half-truth. Real optimization needs both halves of the funnel — pre-signup (the platform has it) and post-signup (you have it). Until they're joined, you're flying blind.

## When to Use

- "Which ads are bringing in real leads vs. junk?"
- "True CAC per qualified contributor / customer / participant"
- "Why is my lowest-CPA campaign performing worst downstream?"
- "Audit lead quality across creatives / audiences / placements"
- "Should I trust Meta's CPA when scaling?"
- "Find the creatives that look like winners but aren't"

## Pipeline Pattern Assumptions (Read First)

This skill is opinionated about **what** to measure (true CAC per qualified lead, with cohort maturation, with vanity scoring) and agnostic about **how** the data is sourced.

It assumes one of three standard attribution patterns:

| Pattern | Setup | Join Key |
|---|---|---|
| **A. UTM-only** *(most common)* | UTM params captured on signup form, stored on lead/user record. Downstream events joined by user_id inside your DB. | `utm_content` (typically the ad ID) on both sides, or `fbclid` |
| **B. UTM + CAPI send-back** *(best)* | Same as A, plus your app fires Conversions API events back to Meta when downstream stages hit. Meta then optimizes for quality, not signups. | `event_id` / `external_id` |
| **C. Meta Lead Ads + CRM sync** | Meta-hosted lead form, `lead_id` syncs to CRM/DB, joined there. | `lead_id` |

If none of these patterns is wired up, the skill switches to **`tracking-gap` mode** — it produces a fix-the-tracking report instead of an analysis.

## Phase 0: Discovery Interview

6 short questions. Don't proceed until each is answered (default = "I don't know — let's find out").

1. **Where do downstream events live?** (Postgres / MySQL / Airtable / custom internal admin / spreadsheet / "no idea")
2. **Can the agent query that source directly?** (DB credentials / API endpoint / CSV export / "needs a person to pull it")
3. **Does the signup form capture `utm_*` params or `fbclid`?** ("I don't know" → inspect the signup form's HTML / network requests)
4. **Is the app sending CAPI events back to Meta** for any downstream stage? (None / signup-only / signup + qualification / full funnel)
5. **What is a "qualified lead"?** (Default: ≥1 unit of value-producing action completed within 14 days of signup. Examples: first purchase; demo attended; subscription activated; trial converted; first task completed and paid out)
6. **Cost basis per qualified lead?** (Flat payout, variable, tiered by quality, or N/A — needed to compute margin)

Output of Phase 0: a one-paragraph **Pipeline Brief** stating the assumed pattern (A/B/C), the join key, the qualification definition, and any unknowns.

## Phase 1: Tracking Validation (Gating Step)

Pull a sample of 10–20 recent signups from the downstream source. For each, check:

- Is `utm_source` / `utm_campaign` / `utm_content` present? (Or `fbclid`? Or `lead_id`?)
- Does the join key resolve back to a specific Meta ad?
- Are there orphan signups (in your DB but no Meta join key)?
- Are there orphan Meta signups (in Meta but no matching DB record)?

**Coverage thresholds:**

| Coverage | Action |
|---|---|
| ≥80% joinable | Proceed to Phase 2 (`analysis` mode) |
| 50–80% joinable | Proceed with explicit confidence caveat on every finding |
| <50% joinable | Switch to **`tracking-gap` mode**. Skip Phases 2–6. Output the gap report. |

Output of Phase 1: a **Data Quality Report** with coverage %, sample of orphan records, and exact field-level findings.

## Phase 2: Build the Per-Creative Funnel

For every ad / ad set / campaign with statistical volume (default ≥30 signups in the window), construct:

| Stage | Count | Conv. from prev. | What a drop here means |
|---|---|---|---|
| Impressions | n | — | — |
| Link Clicks | n | CTR | Hook / placement issue |
| Signups | n | Click → Signup | LP / form friction (use `ad-to-landing-page-auditor`) |
| Qualified action started | n | Signup → Started | **Vanity signups** — wrong promise in the ad |
| Qualified action approved | n | Started → Approved | Wrong audience or fraud |
| Payout / value event | n | Approved → Paid | The "real" conversion |
| Repeat action (configurable window) | n | Retention | One-and-done quality |

The skill should pull Meta-side data via the existing Meta Marketing API connection (MCP, native API, or pasted CSV) and downstream-side data via whichever source Phase 0 identified.

## Phase 3: Compute True CAC

Per creative / ad set / campaign:

- **Platform CPA** = spend ÷ signups *(what Meta reports)*
- **True CAC** = spend ÷ qualified leads *(what actually matters)*
- **Quality Multiplier** = True CAC ÷ Platform CPA *(how badly the platform is misleading you per ad — higher = worse vanity problem)*
- **Margin per qualified lead** = (cost-basis or LTV-equivalent value) − True CAC

## Phase 4: Score and Classify Each Creative

Compute three quality scores per creative with sufficient volume:

- **Vanity score** = 1 − (Started ÷ Signups). High = clicks but no work
- **Audience-fit score** = Approved ÷ Started. Low = wrong people getting through
- **Retention score** = Repeat ÷ Approved. Low = one-and-done

Then classify into action buckets:

| Bucket | Rule | Action |
|---|---|---|
| **Scale** | Low True CAC + good quality + sufficient volume | Increase budget, watch for diminishing returns |
| **Keep** | Mid True CAC + acceptable quality | Hold |
| **Investigate** | High True CAC but high quality (often low volume) | Give it more budget before deciding |
| **Cut** | Low Platform CPA + high vanity score *(the dangerous one — looks like a winner)* | Pause and replace |
| **Insufficient data** | Below volume threshold | Wait, do not act |

Every classification cites the data and gets a confidence flag (sample size + CI on True CAC).

## Phase 5: Cohort Maturation Handling

The biggest analysis trap: judging signups before they've had time to complete the funnel.

- **Exclude signups newer than the qualification window** (default 14 days) from "Cut" decisions
- Show two parallel views in the report:
  - **Mature cohort** (≥14 days old) — the basis for action
  - **Recent cohort** (<14 days) — leading indicator only
- If recent-cohort True CAC is diverging sharply from mature, flag a **creative-fatigue** or **audience-shift** hypothesis for investigation in `meta-ads-analyzer`

## Phase 6: Generate Report

Use this exact structure.

```
1. PIPELINE BRIEF
   - Pattern (A/B/C), join key, qualification definition, unknowns

2. DATA QUALITY
   - Coverage %, orphan counts, confidence level

3. HEADLINE
   - Overall True CAC vs. Platform CPA
   - Overall Quality Multiplier
   - Period-over-period delta

4. PER-CREATIVE TABLE
   - Ad ID | Spend | Signups | Qualified | Platform CPA | True CAC | Quality Mult. | Vanity | Class

5. ACTION LIST (prioritized)
   - Cut (dangerous winners) → Scale (proven quality) → Investigate (low-vol promising) → Keep
   - Each action: hypothesis + expected impact + rollback plan

6. AUDIENCE / PLACEMENT PATTERNS
   - Which interests / lookalikes / geos / placements correlate with qualified leads
   - Which correlate with vanity signups

7. TRACKING GAPS (if any from Phase 1)
   - Specific fields, code locations, or events to wire up
```

## Tracking-Gap Mode (Output if Phase 1 Fails)

If <50% of signups are joinable, the skill stops the analysis and outputs:

```
1. WHAT'S BROKEN
   - Specific symptoms (e.g. "0 signups have utm_content; signup form's hidden fields are empty")

2. WHAT TO ADD
   - Code-level recommendations (e.g. "preserve URL params on form submit and POST to /signup as utm_source, utm_campaign, utm_content, fbclid")
   - Schema changes (e.g. "add columns to leads table: utm_source, utm_campaign, utm_content, fbclid, signup_timestamp")
   - CAPI event setup (recommended, not required)

3. HOW TO VERIFY
   - The 5-minute test: drop a tagged URL, complete signup, query DB, confirm fields populated

4. EXPECTED IMPACT
   - "Once fixed, re-run this skill in `analysis` mode in N days when you have enough signups for statistical volume"
```

## Output Standards (Mandatory)

- **Every recommendation is a hypothesis with expected impact and rollback**, not a directive
- **Never recommend cutting a creative purely on Platform CPA** — that's the bug this skill exists to fix
- **Always show True CAC alongside Platform CPA** in any number reported back to the user
- **Cohort-tag every figure** as Mature, Recent, or Combined — never let the reader confuse them
- **Flag confidence level** on every per-creative recommendation (low / medium / high based on sample size + CI)
- **Disambiguate "leads"** — define "signup", "qualified", "paid" clearly in the Pipeline Brief and use them consistently

## What This Skill Will Not Do

- **Will not write to ad accounts** — pure analysis. Action via Meta Ads Manager or whatever write tool the calling agent has available.
- **Will not fix tracking for you** — it tells you what's broken and how to fix it; the fix is a code change in your app.
- **Will not generate creative or copy variants** — use `messaging-ab-tester` and `ad-angle-miner`.
- **Will not diagnose Meta system mechanics** (Breakdown Effect, Learning Phase) — pass the output to `meta-ads-analyzer` for that layer.
- **Will not compute true LTV** — uses first-payout / first-value as proxy. Multi-touch LTV modeling is a different skill.

## Related Skills

- **`meta-ads-analyzer`** — Run after this skill to interpret *why* a creative's quality is low using Meta's system mechanics
- **`ad-campaign-analyzer`** — Use for cross-channel budget reallocation once true CAC is known
- **`ad-to-landing-page-auditor`** — Pair with this when "Click → Signup" drop-off is the leak
- **`messaging-ab-tester`** — Use to generate replacement creatives for anything in the Cut bucket
