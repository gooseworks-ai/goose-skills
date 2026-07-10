---
name: extruct-list-segmentation
description: >
  Take an enriched Extruct table and a hypothesis set, then segment companies
  by hypothesis fit and assign tiers based on data richness and signal strength.
  Outputs a tiered, segmented list ready for email generation. Zero additional
  Extruct credits — reads from already-enriched data.
tags: [lead-generation]
---

# Extruct List Segmentation

Take an enriched Extruct table + hypothesis set and produce a tiered, segmented list. This decides WHO gets which message and in what order.

## Prerequisites

### Extruct API Token

Get your API token from [Extruct Settings](https://app.extruct.ai/settings). Add to `.env`:
```bash
EXTRUCT_API_TOKEN=your-token-here
```

### Inputs

| Input | Source | Required |
|-------|--------|----------|
| Enriched table | Extruct table ID (after `extruct-list-enrichment`) | yes |
| Hypothesis set | `User-provided file path or inline hypothesis set` or context file | yes |
| Context file | User-provided file path | recommended |

## Workflow

### Step 1: Load data

Fetch enriched table data from Extruct via the API. Parse all rows and their enrichment column values.

Read the hypothesis set file. Parse each hypothesis into:
- Number and short name
- Description with data points
- Best-fit company type

### Step 2: Match companies to hypotheses

For each company row, evaluate which hypothesis fits best. Consider:

1. **Enrichment data alignment** — do the enrichment column values match the hypothesis's "best fit" description?
2. **Signal strength** — how many enrichment columns have useful data (not N/A)?
3. **Specificity** — does the company's profile match the hypothesis narrowly or broadly?

Assign each company ONE primary hypothesis. If multiple fit, pick the strongest signal.

**Decision framework:**

```
For each company:
  1. Read all enrichment values
  2. For each hypothesis:
     - Does the company's vertical/industry match the "best fit"?
     - Do enrichment values confirm the hypothesis pain point?
     - Is there a specific data point that makes this hypothesis resonate?
  3. Pick the hypothesis with the strongest evidence
  4. If no hypothesis fits well, mark as "Unmatched"
```

### Step 3: Assign tiers

Three tiers based on fit strength and data richness:

| Tier | Criteria | Action |
|------|----------|--------|
| **Tier 1** | Strong hypothesis fit + data-rich (3+ enrichment fields populated) + clear hook signal | Personalized email with review |
| **Tier 2** | Medium hypothesis fit OR data-rich but no clear hook | Standard templated email |
| **Tier 3** | Weak fit OR missing data (2+ fields N/A) OR unmatched hypothesis | Hold for re-enrichment or different campaign |

**Tier 1 signals (any of these):**
- CEO/leadership made a public statement related to the hypothesis
- Recent news directly relevant to the pain point
- Hiring for roles that signal the hypothesis pain
- High hypothesis fit score from enrichment (grade 4-5)

**Tier 3 signals (any of these):**
- Most enrichment fields returned N/A
- No hypothesis match above threshold
- Company profile too generic to confidently segment

### Step 4: Generate output

Output a segmented list in two formats:

**Markdown table (for review):**

```markdown
## Segmented List: [Campaign Name]

### Tier 1 — [N] companies (personalized outreach)

| Company | Domain | Hypothesis | Tier Rationale | Hook Signal |
|---------|--------|-----------|----------------|-------------|
| [name] | [domain] | #[N] [name] | [why this tier] | [specific hook] |

### Tier 2 — [N] companies (templated outreach)

| Company | Domain | Hypothesis | Tier Rationale |
|---------|--------|-----------|----------------|
| [name] | [domain] | #[N] [name] | [why this tier] |

### Tier 3 — [N] companies (hold/re-enrich)

| Company | Domain | Issue |
|---------|--------|-------|
| [name] | [domain] | [what's missing] |
```

**CSV (for downstream tools):**

Save to `output/{campaign-slug}-segmented-{YYYY-MM-DD}.csv` with columns:
- `company_name`, `domain`, `tier`, `hypothesis_number`, `hypothesis_name`, `tier_rationale`, `hook_signal`

If the user specifies a different output path, use that instead.

### Step 5: Review with user

Present summary stats:
- Total companies: N
- Tier 1: N (X%)
- Tier 2: N (X%)
- Tier 3: N (X%)
- Unmatched: N

Ask:
- "Does the tier distribution look right? (Typical: 10-20% Tier 1, 50-60% Tier 2, 20-30% Tier 3)"
- "Any companies that should move tiers?"
- "Ready to proceed to email generation?"

## Cost

No Extruct API credits consumed. This skill only reads existing table data and applies LLM reasoning.

## Scripts

This skill includes a Python script for automated segmentation:

```bash
# Segment from Extruct table
python3 skills/capabilities/extruct-list-segmentation/scripts/segment_list.py \
  --table-id <TABLE_ID> --hypotheses hypotheses.md

# Segment from CSV
python3 skills/capabilities/extruct-list-segmentation/scripts/segment_list.py \
  --input leads-enriched.csv --hypotheses hypotheses.md

# Custom output path
python3 skills/capabilities/extruct-list-segmentation/scripts/segment_list.py \
  --table-id <TABLE_ID> --hypotheses hypotheses.md \
  --output output/campaign-segmented.csv
```

**Flags:**
- `--table-id`: Extruct table ID or URL (mutually exclusive with --input)
- `--input`: input CSV file path
- `--hypotheses` (required): path to hypothesis set markdown file
- `--output`: output CSV path (default: `output/segmented-{date}.csv`)

**API client:** `scripts/extruct_client.py` — thin urllib wrapper, only used when reading from Extruct tables. Zero external dependencies.
