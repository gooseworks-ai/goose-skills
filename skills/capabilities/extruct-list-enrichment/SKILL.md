---
name: extruct-list-enrichment
description: >
  Add research-powered enrichment columns to Extruct company tables. Design
  enrichment columns (funding, verticals, tech stack, hiring signals), trigger
  AI-driven enrichment runs, monitor progress, and quality-check results.
  Each enrichment record costs $0.075 on the Pro plan.
tags: [lead-generation]
---

# Extruct List Enrichment

Add research-powered enrichment columns to Extruct company tables. Each column runs an AI agent per row to research and populate structured data.

## Prerequisites

### Extruct API Token

Get your API token from [Extruct Settings](https://app.extruct.ai/settings). Add to `.env`:
```
EXTRUCT_API_TOKEN=your-token-here
```

### Extruct Plan & Pricing

**Enrichment is only available on the Pro plan ($149/mo).** Free and Starter users cannot run enrichment.

**Cost per enrichment record: $0.075.** Each row × each column = 1 record.

| Scenario | Rows | Columns | Records | Cost |
|----------|------|---------|---------|------|
| Test batch | 10 | 2 | 20 | $1.50 |
| First campaign | 200 | 3 | 600 | $45.00 |
| Full enrichment | 500 | 4 | 2,000 | $150.00 |

Pro plan includes up to 2,000 enrichment records/mo ($149/mo). Budget is shared with search — records used here reduce what's available for list building.

**Agent behavior:**
- If user is on Free or Starter: tell them enrichment requires Pro ($149/mo) and stop
- If user is on Pro: calculate `rows × columns`, show the dollar cost and remaining monthly budget, and confirm before triggering
- If estimated records exceed remaining monthly budget: warn the user, suggest reducing rows (test batch first) or columns

### Existing Table

You need an Extruct company table with rows already uploaded (via `extruct-list-building` or manual upload). Each row must have a domain — enrichment agents use the domain as their research starting point.

## Workflow

### 1. Confirm the table

Get the table ID from the user (URL or ID). Fetch table metadata. Show the user: table name, row count, existing columns.

### 2. Get column configs

Two paths:

**Path A: Pre-designed columns** — User has column configs ready from a prior design step. Confirm and proceed.

**Path B: Design on the fly** — Confirm with the user:

1. **What data point?** — what to research (e.g. "funding stage", "primary vertical", "tech stack")
2. **Output format** — pick the right format:

| Format | When to use | Extra params |
|---|---|---|
| `text` | Free-form research output | — |
| `number` / `money` | Numeric data (revenue, headcount) | — |
| `select` | Single choice from known categories | `labels: [...]` |
| `multiselect` | Multiple tags from known categories | `labels: [...]` |
| `json` | Structured multi-field data | `output_schema: {...}` |
| `grade` | 1-5 score | — |
| `label` | Single tag from list | `labels: [...]` |
| `date` | Date values | — |
| `url` / `email` / `phone` | Contact info | — |

3. **Agent type** — default `research_pro`. Use `llm` when no web research needed (classification from existing profile data).

### 3. Write the prompt

Craft a clear prompt using `{input}` for the row's domain value. Prompt guidelines:

- Be specific about what to find
- Specify the exact output format in the prompt (e.g. "Return ONLY a number in millions USD")
- Include fallback instruction (e.g. "If not found, return N/A")
- For `select`/`multiselect`, the labels constrain the output — the prompt should guide which label to pick

### 4. Create the column(s)

Create columns via the Extruct API with the `column_configs` array.

### 5. Trigger enrichment (only the new columns)

Always scope the enrichment run to the newly created column(s) only. Avoid broad or implicit run payloads when you only intend to enrich specific columns.

### 6. Monitor progress

Poll table data and check cell statuses. Show the user:
- Current % complete (done cells / total cells)
- Number of failed cells (if any)
- Estimated time remaining (based on rate so far)

Stop polling when all cells are done or failed.

### 7. Quality spot-check

After enrichment completes (or after 50%+ is done), fetch a sample of 5-10 enriched rows and display for review.

**Present to user as a table.** Ask:
- "Does the data quality look right?"
- "Any columns returning garbage or N/A too often?"
- "Should we adjust any prompts and re-run?"

If quality issues are found:
1. Delete the problematic column
2. Adjust the prompt
3. Re-create and re-run

## Cost Confirmation Before Running

**Before every enrichment run, present this to the user:**
> "This enrichment run: [rows] rows × [columns] columns = [total] records at $0.075/record = $[cost]. Your plan: Pro ($149/mo, [remaining] records left this month). After this run: [remaining - total] records left. Proceed?"

**Always run a test batch (10 rows) first to validate prompt quality.** A bad prompt across 500 rows wastes money and requires re-runs — that's a double spend.

## Scripts

This skill includes Python scripts for automated enrichment:

```bash
# Add a single text column
python3 skills/extruct-list-enrichment/scripts/enrich_table.py \
  --table-id <TABLE_ID> \
  --column-name "Latest Funding" \
  --prompt "What is the latest funding round for {input}?" \
  --format text

# Add a select column with labels
python3 skills/extruct-list-enrichment/scripts/enrich_table.py \
  --table-id <TABLE_ID> \
  --column-name "Primary Vertical" \
  --prompt "What vertical does {input} operate in?" \
  --format select --labels "SaaS,FinTech,HealthTech,EdTech,Other"

# Add multiple columns from a config file
python3 skills/extruct-list-enrichment/scripts/enrich_table.py \
  --table-id <TABLE_ID> --config columns.json

# Test batch (10 rows only)
python3 skills/extruct-list-enrichment/scripts/enrich_table.py \
  --table-id <TABLE_ID> --column-name "..." --prompt "..." --test

# Dry run (cost estimate only)
python3 skills/extruct-list-enrichment/scripts/enrich_table.py \
  --table-id <TABLE_ID> --column-name "..." --prompt "..." --dry-run
```

**Flags:**
- `--table-id` (required): Extruct table ID or URL
- `--column-name`: column display name
- `--prompt`: enrichment prompt (use `{input}` for domain)
- `--format`: output format (`text`, `number`, `select`, `grade`, etc.)
- `--agent-type`: `research_pro` (default) or `llm`
- `--labels`: comma-separated labels for select/multiselect
- `--config`: path to column configs JSON
- `--test`: enrich first 10 rows only
- `--dry-run`: show cost estimate, no API calls
- `--yes`: skip confirmation prompt

**API client:** `scripts/extruct_client.py` — thin urllib wrapper for the Extruct REST API. Zero external dependencies.
