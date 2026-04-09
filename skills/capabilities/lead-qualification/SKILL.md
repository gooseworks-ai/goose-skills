---
name: lead-qualification
description: >
  Lead qualification engine with conversational intake. Asks structured questions to understand
  your qualification criteria, generates a reusable qualification prompt, then batch-enriches leads
  via Apify LinkedIn scraping and scores them with parallel processing. Outputs qualified/disqualified
  verdicts with confidence scores and reasoning to CSV or whatever output format the user prefers.
  Supports calibration mode for prompt refinement.
---

# Lead Qualification Engine

Qualify leads against custom criteria through a structured intake process, then score lead lists in parallel with confidence ratings and reasoning.

## Three Modes of Operation

### Mode 1: Full Intake + Qualify
No existing qualification prompt. Run intake to build one, save it, then qualify leads.

**Trigger:** User provides no qualification prompt file.

### Mode 2: Reuse Prompt + Qualify
User references an existing qualification prompt file — skip intake, go straight to scoring.

**Trigger:** User tags or references a file in `skills/lead-qualification/qualification-prompts/`.

### Mode 3: Refine / Calibrate
User has seen results and wants to adjust criteria. Update the saved prompt, re-run.

**Trigger:** User says something like "refine", "adjust", "that's wrong", or provides feedback on qualification results.

---

## Phase 1: Intake (Mode 1 Only)

The goal is to build a complete picture of who the user considers qualified vs disqualified. Present questions in bulk rounds so the user can answer efficiently.

### Round 1 — Core Questions (Present All at Once)

Present these questions as a numbered list. Tell the user: *"Answer what's relevant, skip what's not. I'll follow up on anything I need to clarify."*

**Product & Campaign Context:**
1. What's your product/service in one sentence?
2. What problem does it solve and for whom?
3. What's the specific campaign or outreach angle? (e.g., "targeting companies that just raised Series A", "going after teams switching from Competitor X")

**Company-Level Criteria:**
4. What company sizes are you targeting? (e.g., 1-10, 11-50, 51-200, 201-1000, 1000+)
5. What industries or verticals are a good fit?
6. Any industries or company types to explicitly EXCLUDE?
7. Geographic targets? Or is this global?
8. Geographic exclusions?
9. Does company stage matter? (e.g., seed, Series A, Series B+, public)
10. Any revenue range or funding range that matters?

**Person-Level Criteria:**
11. What job titles or roles are your ideal buyers?
12. What titles are explicitly disqualified?
13. Does seniority level matter? (e.g., must be Director+, VP+, C-level)
14. What departments should they be in? (e.g., growth, marketing, sales, engineering)
15. Minimum tenure at current company? (e.g., 6+ months to have buying power)
16. Does total years of experience matter?

**Behavioral & Situational Signals:**
17. Are there tech stack signals that qualify or disqualify? (e.g., "uses Salesforce" = good fit)
18. Does recent company activity matter? (e.g., hiring spree, funding round, product launch)
19. Are there content/posting signals? (e.g., "posted about AI" = relevant)
20. Any other signals that indicate high intent or good fit?

**Dealbreakers & Instant Qualifiers:**
21. What are your HARD DISQUALIFIERS — things that instantly make someone a "no" regardless of other factors?
22. What are your STRONGEST QUALIFIERS — things that make someone an almost certain "yes"?

### Round 2 — Follow-Up Probes

Based on the user's answers, ask 5-10 targeted follow-ups to resolve ambiguity. Examples:
- "You said mid-market — does that mean 50-500 or 50-1000 employees?"
- "You mentioned VP of Growth — would a 'Head of Growth' also qualify, or only VP title?"
- "You didn't mention geography — should I treat this as global?"
- "For tenure, you said 6 months minimum. What about someone who's 4 months in but was promoted internally?"
- "You mentioned Series A companies. What about bootstrapped companies with equivalent revenue?"

### Round 3 — Edge Case Scenarios (Optional but Recommended)

Present 3-5 hypothetical lead profiles that test boundary cases. Ask "Would you qualify this person?"

Example scenarios to construct (adapt based on the user's criteria):
- Someone who fits the title but is at a company that's slightly too large/small
- Someone at the right company but with a borderline title
- Someone who matches on everything but has low tenure
- Someone who doesn't match the title exactly but has high intent signals
- Someone at a competitor's customer

This round catches implicit criteria the user hasn't articulated.

### Generate & Save Qualification Prompt

After intake is complete, synthesize all answers into a structured qualification prompt. Save it to:

```
skills/lead-qualification/qualification-prompts/[campaign-name].md
```

The saved prompt MUST follow this structure:

```markdown
# Qualification Prompt: [Campaign Name]

Generated: [date]

## Campaign Context
- **Product:** [one-liner]
- **Campaign Angle:** [specific angle]
- **Problem Solved:** [what and for whom]

## Hard Disqualifiers (Instant No)
- [list each with explanation]

## Hard Qualifiers (Instant Yes)
- [list each with explanation]

## Company Criteria
| Criterion | Qualified | Disqualified | Notes |
|-----------|-----------|--------------|-------|
| Size | [range] | [range] | |
| Industry | [list] | [list] | |
| Geography | [list] | [list] | |
| Stage | [list] | [list] | |
| Funding/Revenue | [range] | [range] | |

## Person Criteria
| Criterion | Qualified | Disqualified | Notes |
|-----------|-----------|--------------|-------|
| Titles | [list] | [list] | |
| Seniority | [level+] | [below level] | |
| Department | [list] | [list] | |
| Tenure | [minimum] | [below minimum] | |
| Experience | [range] | [range] | |

## Behavioral & Situational Signals
- [list signals that boost qualification]
- [list signals that reduce qualification]

## Confidence Rules
- **High Confidence:** Enough data available for company size, title, tenure, and at least one signal.
- **Medium Confidence:** Missing one or two non-critical data points but core criteria are clear.
- **Low Confidence:** Missing critical data points (e.g., no company size, unclear title). Still make a yes/no call but flag it.

## Edge Case Guidance
- [specific guidance derived from Round 3 scenarios]
- [any nuanced rules from the intake conversation]

## Qualification Reasoning Instructions
When evaluating a lead, structure your reasoning as:
1. Check hard disqualifiers first — if any match, immediately disqualify.
2. Check hard qualifiers — if any match, lean strongly toward qualifying.
3. Evaluate company criteria against thresholds.
4. Evaluate person criteria against thresholds.
5. Factor in behavioral/situational signals as tiebreakers.
6. Assign confidence based on data completeness.
7. Write 2-3 sentence reasoning summarizing the decision.
```

---

## Phase 2: Lead Qualification

### Step 1 — Parse Input

Accept any of these input formats:
- **CSV file path** — Read directly from filesystem (default)
- **LinkedIn profile URLs** — One or more URLs provided inline
- **Inline list** — Names/companies listed in the message
- **Google Sheet URL** — If the user provides a Google Sheet, use whatever Google Sheets tool is available to read it
- **Any other source** — Ask the user to export as CSV or paste the data

Detect the format automatically based on what the user provides.

### Step 1.5 — Batch Enrichment via Apify

**When:** The input contains a `linkedin_url` column (or LinkedIn URLs are available).
**Skip when:** No LinkedIn URLs are present, or the user explicitly says to skip enrichment.

Before LLM qualification, batch-enrich all leads to gather structured profile data. This is MUCH faster and cheaper than per-lead web searches during qualification.

**Run the enrichment script:**

```bash
python3 skills/lead-qualification/scripts/enrich_leads.py INPUT_CSV \
  --output ENRICHED_CSV \
  --cache-hours 24
```

Use `--dry-run` first to show the cost estimate without calling Apify.

**What this does:**
1. Reads all LinkedIn URLs from the input CSV
2. Checks local cache (24h default) — skips profiles already enriched
3. Sends uncached URLs to Apify in batches of 50
4. Returns enriched CSV with: `enriched_title`, `enriched_company`, `enriched_industry`, `enriched_location`, `enriched_connections`, `enriched_education`, `enriched_experience_years`, `enriched_headline`, `enriched_about`, `enrichment_status`
5. Cost: ~$3 per 1,000 profiles (~$0.03 per 100 leads)

**After enrichment, use the enriched CSV as input for Steps 2-4.** The enriched data lets the LLM qualification step work from structured fields instead of doing web searches, dramatically improving speed and consistency.

**If enrichment fails for some profiles:** They'll have `enrichment_status: failed` in the output. The LLM qualification step should fall back to web search for those leads only.

### Step 2 — Calibration Batch

Before processing the full list, run the first 5-10 leads and present results to the user in a table.

If batch enrichment was run (Step 1.5), use the enriched columns (`enriched_title`, `enriched_company`, etc.) as the primary data source. Only fall back to web search for leads where `enrichment_status` is `failed` or `no_url`.

```
| # | Name | Title | Company | Qualified | Confidence | Reasoning |
|---|------|-------|---------|-----------|------------|-----------|
| 1 | ... | ... | ... | Yes | High | ... |
| 2 | ... | ... | ... | No | Medium | ... |
| ... |
```

Ask: **"Do these look right? Should I adjust any criteria before processing the full list?"**

If the user flags issues:
1. Discuss what needs to change
2. Update the saved qualification prompt file
3. Re-run the calibration batch
4. Confirm again before proceeding

Repeat until the user approves.

### Step 3 — Full Run (Parallelized)

Once calibration is approved, process ALL remaining leads using parallel subagents. **You MUST parallelize — do NOT process leads sequentially.**

**Parallelization protocol (mandatory):**

1. **Calculate batch count:**
   - Total remaining leads / 15 = number of batches (round up)
   - Target: ~15 leads per batch
   - Minimum: 2 batches (even for small lists, to validate parallelism works)
   - Maximum: 10 concurrent batches (to avoid overwhelming context)

2. **Prepare batch inputs:**
   For each batch, create a self-contained context package:
   - The full qualification prompt (from `qualification-prompts/` file)
   - The batch of lead rows (with ALL columns including enriched data from Step 1.5)
   - Instructions for output format: Name, Qualified (Yes/No), Confidence (High/Medium/Low), Reasoning (2-3 sentences)
   - Instruction: "For leads with `enrichment_status=failed` or `no_url`, do a quick web search. Spend no more than 30 seconds per lead on search."

3. **Launch parallel Task agents:**
   Use the Task tool to launch ALL batches simultaneously in a single message with multiple tool calls:

   ```
   Task: "Qualify leads batch 1/N"
   Context: [qualification prompt] + [batch 1 lead rows]

   Task: "Qualify leads batch 2/N"
   Context: [qualification prompt] + [batch 2 lead rows]

   ... (launch ALL at once — do NOT wait for batch 1 before launching batch 2)
   ```

4. **Collect and merge results:**
   - Wait for all Task agents to complete
   - Merge all batch results into a single list
   - Preserve original row order from the input
   - If any batch fails, retry that batch once. If it fails again, flag those leads as "qualification_failed" and proceed.

5. **Validate completeness:**
   - Count: total qualified + disqualified + failed = total input leads
   - If any leads are missing, identify and re-process them

**Per-lead processing (within each batch agent):**
1. Read all available data from the input row (including enriched columns from Step 1.5)
2. If enriched data is present (`enrichment_status: success` or `cached`): use `enriched_title`, `enriched_company`, etc.
3. If enriched data is missing (`enrichment_status: failed` or `no_url`): do a quick web search (max 30 seconds)
4. Apply the qualification prompt:
   - Check hard disqualifiers first — if any match, immediately disqualify
   - Check hard qualifiers — if any match, lean strongly toward qualifying
   - Evaluate all criteria
   - Determine: Qualified (Yes/No), Confidence (High/Medium/Low)
   - Write 2-3 sentence reasoning
5. Return the result

### Step 4 — Output Results

**Default: CSV**

1. Write a CSV with all original columns PLUS three new columns:
   - `Qualified` — Yes / No
   - `Confidence` — High / Medium / Low
   - `Reasoning` — 2-3 sentence explanation
2. Save to the current working directory or wherever the user prefers
3. Tell the user the file path

**If the user prefers Google Sheets or another destination:**
- Write to Google Sheets if tools are available
- Write to Notion if requested
- Export in any format the user asks for

### Step 5 — Summary

After output is complete, present a summary:

```
## Qualification Results: [Campaign Name]

**Total leads processed:** X
**Qualified:** X (Y%)
**Disqualified:** X (Y%)

**Confidence breakdown:**
- High: X leads
- Medium: X leads
- Low: X leads (may need manual review)

**Top disqualification reasons:**
1. [reason] — X leads
2. [reason] — X leads
3. [reason] — X leads

**Output:** [Google Sheet link or CSV path]
**Qualification prompt saved to:** skills/lead-qualification/qualification-prompts/[campaign-name].md
```

---

## Tools Required

The qualification agent should have access to:

- **Apify LinkedIn Enrichment** — `scripts/enrich_leads.py` for batch profile enrichment before qualification
  - Uses `supreme_coder~linkedin-profile-scraper` Apify actor ($3/1k profiles, no cookies)
  - Requires `APIFY_API_TOKEN` environment variable
  - Run with `--dry-run` first to preview cost
- **Web Search** — to research leads when enrichment data is sparse or missing
- **Fetch (web page)** — to pull LinkedIn profiles, company pages, etc.
- **Read/Write** — for CSV I/O and saving qualification prompts
- **Glob/Grep** — to find existing qualification prompt files
- **Optional: Google Sheets tools** — if the user wants to read from or write to Google Sheets

---

## Example Usage

### Full intake + qualify from CSV:
```
Qualify leads for our outbound campaign. Here's the lead list: leads.csv
```
→ Agent detects no saved prompt, starts intake, builds prompt, then qualifies.

### Reuse existing prompt:
```
Qualify these leads using @skills/lead-qualification/qualification-prompts/series-a-founders.md
— lead list: leads.csv
```
→ Agent skips intake, goes straight to calibration + qualification.

### Qualify LinkedIn profiles directly:
```
Using the series-a-founders qualification prompt, qualify these people:
- https://linkedin.com/in/person1
- https://linkedin.com/in/person2
- https://linkedin.com/in/person3
```

### Refine after seeing results:
```
Those results look off — also disqualify anyone at a consulting firm, and lower the
tenure minimum to 3 months for Director+ titles.
```
→ Agent updates the saved prompt and re-runs.
