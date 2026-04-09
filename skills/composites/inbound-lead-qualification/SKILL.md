---
name: inbound-lead-qualification
version: 1.0.0
description: >
  Qualifies inbound leads against full ICP criteria — company size, industry, use case fit,
  role/seniority of the person. Checks CRM and existing customer base for duplicates and
  existing relationships. Outputs a scored CSV with qualification status, reasoning, and
  pipeline overlap flags. Tool-agnostic — works with any CRM, enrichment tool, or data source.
tags: [lead-generation]
---

# Inbound Lead Qualification

Takes a set of inbound leads and validates each against your full ICP criteria. Not a fast-pass triage (that's `inbound-lead-triage`) — this is the thorough qualification step that determines whether a lead is genuinely worth pursuing, and produces a scored CSV for the team.

## When to Auto-Load

Load this composite when:
- User says "qualify these inbound leads", "check if these leads are ICP", "score my inbound"
- An upstream triage has been completed and leads need deeper qualification
- User has a batch of leads and wants a qualified/disqualified verdict on each

## Architecture

```
[Inbound Leads] → Step 1: Load ICP & Config → Step 2: CRM/Pipeline Check → Step 3: Company Qualification → Step 4: Person Qualification → Step 5: Use Case Fit → Step 6: Score & Verdict → Step 7: Output CSV
```

---

## Step 0: Configuration (Once Per Client)

On first run, establish the ICP definition and CRM access. Save to the current working directory or wherever the user prefers (e.g., `config/lead-qualification.json`).

```json
{
  "icp_definition": {
    "company_size": {
      "min_employees": null,
      "max_employees": null,
      "sweet_spot": "",
      "notes": ""
    },
    "industry": {
      "target_industries": [],
      "excluded_industries": [],
      "notes": ""
    },
    "use_case": {
      "primary_use_cases": [],
      "secondary_use_cases": [],
      "anti_use_cases": [],
      "notes": ""
    },
    "company_stage": {
      "target_stages": [],
      "excluded_stages": [],
      "notes": ""
    },
    "geography": {
      "target_regions": [],
      "excluded_regions": [],
      "notes": ""
    }
  },
  "buyer_personas": [
    {
      "name": "",
      "titles": [],
      "seniority_levels": [],
      "departments": [],
      "is_economic_buyer": false,
      "is_champion": false,
      "is_user": false
    }
  ],
  "hard_disqualifiers": [],
  "hard_qualifiers": [],
  "crm_access": {
    "tool": "HubSpot | Salesforce | CSV export | none",
    "access_method": "",
    "tables_or_objects": []
  },
  "existing_customer_source": {
    "tool": "HubSpot | Salesforce | CSV | none",
    "access_method": ""
  },
  "qualification_prompt_path": "path/to/lead-qualification/prompt.md or null"
}
```

**If `lead-qualification` capability already has a saved qualification prompt:** Reference it directly — don't rebuild ICP criteria from scratch.

**On subsequent runs:** Load config silently.

---

## Step 1: Load ICP Criteria & Parse Leads

### Process
1. Load the client's ICP config (or qualification prompt from `lead-qualification` capability)
2. Parse the inbound lead list — accept any format:
   - Output from `inbound-lead-triage` (already normalized)
   - Raw CSV with any column structure
   - Pasted list of names/emails/companies
   - CRM export
3. Identify what data is available vs. missing per lead:
   - **Have:** Fields present in the input
   - **Need:** Fields required for qualification but missing
   - **Gap report:** "X leads have company name, Y have title, Z have nothing but email"

### Output
- Parsed lead list with available/missing field inventory
- Gap report for the user

### Human Checkpoint
If >50% of leads are missing critical fields (company name or person title), recommend running `inbound-lead-enrichment` first. Ask: "Many leads are missing company/title data. Want me to enrich them first, or qualify with what's available?"

---

## Step 2: CRM & Pipeline Check

### Process
For each lead, check against existing data sources to identify overlaps:

**Check 1 — Existing customer?**
- Search customer database by company domain/name
- If match found: Flag as `existing_customer` with customer details (plan, account owner, contract status)
- This is NOT a disqualification — it's a routing flag (upsell vs. new business)

**Check 2 — Already in pipeline?**
- Search your CRM (HubSpot, Salesforce, CSV) for the company in active deals
- If match found: Flag as `in_pipeline` with deal details (stage, owner, last activity)
- Critical: Sales rep should know before reaching out that a colleague already has this account

**Check 3 — Previous engagement?**
- Search outreach logs for the email/company
- If match found: Flag as `previously_contacted` with history summary (when, what channel, outcome)

**Check 4 — Known from signal composites?**
- Search your CRM or signal tracking system for the company
- If match found: Flag as `signal_flagged` with signal type and date

### Output
Each lead tagged with:
- `pipeline_status`: `new` | `existing_customer` | `in_pipeline` | `previously_contacted`
- `pipeline_detail`: One sentence explaining the overlap (or null)
- `signal_flags`: Any signal composite matches

### Handling Overlaps
- **Existing customer:** Don't disqualify. Mark separately. Might be expansion/upsell.
- **In pipeline:** Don't disqualify. Flag for sales rep coordination. Note the existing deal owner.
- **Previously contacted but no response:** Still qualify. The inbound signal means they're now warmer.
- **Previously contacted and rejected:** Still qualify the inbound. People change their minds. Note the prior context.

---

## Step 3: Company Qualification

### Process
For each lead's company, evaluate against every ICP company dimension:

**Dimension 1 — Company Size**
- Check employee count against ICP range
- Sources: enrichment data, LinkedIn company page, web search
- Score: `match` | `borderline` | `mismatch` | `unknown`
- Note: If the lead is from a subsidiary or division, evaluate the relevant unit, not the parent company

**Dimension 2 — Industry**
- Check against target and excluded industry lists
- Be smart about classification: "AI-powered HR platform" matches both "AI/ML" and "HR Tech"
- Score: `match` | `adjacent` (related but not core target) | `mismatch` | `unknown`

**Dimension 3 — Company Stage**
- Seed, Series A, Series B+, Growth, Public, Bootstrapped
- Sources: SixtyFour or Orthogonal, news, enrichment data
- Score: `match` | `borderline` | `mismatch` | `unknown`

**Dimension 4 — Geography**
- Check HQ location and/or the specific person's location
- For remote-first companies, check where the majority of the team is
- Score: `match` | `borderline` | `mismatch` | `unknown`

**Dimension 5 — Use Case Fit**
- Based on what the company does, could they plausibly use the product?
- This is the most nuanced dimension — requires understanding both the product and the company's operations
- Sources: company website, product description, job postings (hint at internal tools/processes)
- Score: `strong_fit` | `moderate_fit` | `weak_fit` | `no_fit` | `unknown`

### Output
Each lead gets a `company_qualification` block:
```
{
  "company_size": { "score": "", "value": "", "reasoning": "" },
  "industry": { "score": "", "value": "", "reasoning": "" },
  "stage": { "score": "", "value": "", "reasoning": "" },
  "geography": { "score": "", "value": "", "reasoning": "" },
  "use_case": { "score": "", "value": "", "reasoning": "" },
  "company_verdict": "qualified | borderline | disqualified | insufficient_data"
}
```

---

## Step 4: Person Qualification

### Process
For each lead's contact person, evaluate against buyer persona criteria:

**Dimension 1 — Title/Role Match**
- Check title against buyer persona title lists
- Handle variations: "VP of Marketing" = "Vice President, Marketing" = "VP Marketing"
- Be smart about title inflation at small companies (a "Director" at a 10-person startup ≠ "Director" at a 10,000-person enterprise)
- Score: `exact_match` | `close_match` | `adjacent` | `mismatch` | `unknown`

**Dimension 2 — Seniority Level**
- Map to: Individual Contributor, Manager, Director, VP, C-Level, Founder
- Check against ICP seniority requirements
- Score: `match` | `too_junior` | `too_senior` | `unknown`

**Dimension 3 — Department**
- Engineering, Product, Marketing, Sales, Operations, Finance, HR, etc.
- Check against ICP department targets
- Score: `match` | `adjacent` | `mismatch` | `unknown`

**Dimension 4 — Authority Type**
- Based on title + seniority, classify:
  - `economic_buyer` — Can sign the check
  - `champion` — Wants it, can influence the decision
  - `user` — Would use it daily, can validate need
  - `evaluator` — Tasked with research, limited decision power
  - `gatekeeper` — Can block but not approve
  - `unknown`

**Dimension 5 — Right Person, Wrong Company (or Vice Versa)**
- If company qualifies but person doesn't: Flag as `right_company_wrong_person` — this is a referral opportunity
- If person qualifies but company doesn't: Flag as `right_person_wrong_company` — rare for inbound, but possible with job changers

### Output
Each lead gets a `person_qualification` block:
```
{
  "title_match": { "score": "", "value": "", "reasoning": "" },
  "seniority": { "score": "", "value": "", "reasoning": "" },
  "department": { "score": "", "value": "", "reasoning": "" },
  "authority_type": "",
  "person_verdict": "qualified | borderline | disqualified | insufficient_data",
  "mismatch_type": "null | right_company_wrong_person | right_person_wrong_company"
}
```

---

## Step 5: Use Case Fit Assessment

### Process
This step connects the company's likely needs to your product's actual capabilities. It goes deeper than Step 3's company-level use case check.

1. **Infer the lead's intent** from their inbound action:
   - Demo request message → What did they say they need?
   - Content downloaded → What topic were they researching?
   - Webinar attended → What problem were they trying to solve?
   - Free trial signup → What feature did they try first?
   - Chatbot conversation → What questions did they ask?

2. **Map intent to product capabilities:**
   - Does the product actually solve what they seem to need?
   - Is this a primary use case or a stretch?
   - Are there known limitations that would disappoint them?

3. **Assess implementation feasibility:**
   - Based on company size and stage, can they realistically implement?
   - Do they likely have the technical resources / team to adopt?
   - Any known blockers for companies like this? (e.g., "banks need SOC2 and we don't have it yet")

### Output
```
{
  "inferred_intent": "",
  "intent_source": "",
  "product_fit": "strong | moderate | weak | unknown",
  "product_fit_reasoning": "",
  "implementation_feasibility": "easy | moderate | complex | unlikely",
  "known_blockers": []
}
```

---

## Step 6: Score & Verdict

### Scoring Logic

Combine all dimensions into a final qualification verdict.

**Composite Score Calculation:**

| Dimension | Weight | Possible Values |
|-----------|--------|-----------------|
| Company Size | 15% | match=100, borderline=50, mismatch=0, unknown=30 |
| Industry | 20% | match=100, adjacent=60, mismatch=0, unknown=30 |
| Company Stage | 10% | match=100, borderline=50, mismatch=0, unknown=30 |
| Geography | 10% | match=100, borderline=50, mismatch=0, unknown=30 |
| Use Case Fit | 25% | strong=100, moderate=60, weak=20, no_fit=0, unknown=30 |
| Person Title/Role | 15% | exact=100, close=75, adjacent=40, mismatch=0, unknown=30 |
| Person Seniority | 5% | match=100, too_junior=20, too_senior=60, unknown=30 |

**Hard overrides (bypass the score):**
- Any hard disqualifier present → `disqualified` regardless of score
- Any hard qualifier present → `qualified` regardless of score (but still show the full breakdown)
- Existing customer → Route separately, don't score as new lead

**Verdict thresholds:**
- **Score ≥ 75:** `qualified` — Pursue actively
- **Score 50-74:** `borderline` — Qualified with caveats, may need manual review
- **Score 30-49:** `near_miss` — Not qualified now, but close enough to consider (referral or nurture)
- **Score < 30:** `disqualified` — Does not fit ICP

**Sub-verdicts for routing:**
- `qualified_hot` — Score ≥ 75 AND Tier 1/2 urgency from triage
- `qualified_warm` — Score ≥ 75 AND Tier 3/4 urgency
- `borderline_review` — Score 50-74, needs human judgment call
- `near_miss_referral` — Score 30-49 AND right_company_wrong_person (referral opportunity)
- `near_miss_nurture` — Score 30-49, might fit in the future
- `disqualified_polite` — Score < 30, needs polite decline
- `disqualified_competitor` — Competitor employee
- `existing_customer_upsell` — Existing customer with expansion signal

### Output
Each lead gets:
```
{
  "composite_score": 0-100,
  "verdict": "",
  "sub_verdict": "",
  "top_qualification_reasons": [],
  "top_disqualification_reasons": [],
  "summary": "One sentence: why this lead is/isn't a fit"
}
```

---

## Step 7: Output CSV

### CSV Structure

Produce a CSV with ALL input fields preserved plus qualification columns appended:

**Core qualification columns:**
- `qualification_verdict` — qualified | borderline | near_miss | disqualified
- `qualification_sub_verdict` — qualified_hot | qualified_warm | borderline_review | near_miss_referral | near_miss_nurture | disqualified_polite | disqualified_competitor | existing_customer_upsell
- `composite_score` — 0-100
- `summary` — One sentence qualification reasoning

**Pipeline check columns:**
- `pipeline_status` — new | existing_customer | in_pipeline | previously_contacted
- `pipeline_detail` — One sentence on the overlap
- `signal_flags` — Any signal composite matches

**Company qualification columns:**
- `company_size_score` — match | borderline | mismatch | unknown
- `industry_score` — match | adjacent | mismatch | unknown
- `stage_score` — match | borderline | mismatch | unknown
- `geography_score` — match | borderline | mismatch | unknown
- `use_case_score` — strong | moderate | weak | no_fit | unknown

**Person qualification columns:**
- `title_match_score` — exact_match | close_match | adjacent | mismatch | unknown
- `seniority_score` — match | too_junior | too_senior | unknown
- `authority_type` — economic_buyer | champion | user | evaluator | gatekeeper | unknown
- `mismatch_type` — null | right_company_wrong_person | right_person_wrong_company

**Use case columns:**
- `inferred_intent` — What they seem to need
- `product_fit` — strong | moderate | weak | unknown
- `implementation_feasibility` — easy | moderate | complex | unlikely

### Save Location
The current working directory or wherever the user prefers (e.g., `leads/inbound-qualified-[date].csv`).

### Summary Report

After producing the CSV, present a summary:

```markdown
## Inbound Lead Qualification: [Period]

**Total leads processed:** X
**Qualified:** X (Y%) — X hot, X warm
**Borderline (manual review):** X (Y%)
**Near miss:** X (Y%) — X referral opportunities, X nurture
**Disqualified:** X (Y%)

**Pipeline overlaps:**
- Existing customers: X (route to CS)
- Already in pipeline: X (coordinate with deal owner)
- Previously contacted: X (now warmer — re-engage)

**Top qualification reasons:**
1. [reason] — X leads
2. [reason] — X leads

**Top disqualification reasons:**
1. [reason] — X leads
2. [reason] — X leads

**Data quality:**
- Leads with full data: X
- Leads with partial data (some dimensions scored as 'unknown'): X
- Leads needing enrichment: X

**CSV saved to:** [path]
```

---

## Handling Edge Cases

**Lead with only an email (no name, no company):**
- Extract company domain from email
- If corporate domain: look up the company, proceed with company qualification (person qualification will be mostly "unknown")
- If personal email (gmail, yahoo): Score as `insufficient_data`, recommend enrichment or manual review

**Same company, multiple leads:**
- Qualify the company once, apply to all leads from that company
- Person qualification runs individually for each
- Flag the multi-contact opportunity: "3 people from [Company] came inbound — potential committee buy"

**Contradictory signals:**
- Company is strong fit but person is completely wrong (e.g., intern at a perfect company)
- Score honestly. The sub-verdict `right_company_wrong_person` routes this to referral handling in `disqualification-handling`

**Borderline calls:**
- When the score is 50-74 and could go either way, lean toward qualifying for inbound leads
- Rationale: they came to YOU. The intent signal tips borderline cases toward "worth a conversation"
- Note this lean in the reasoning: "Borderline on [dimension], but inbound intent suggests pursuing"

**Scoring with missing data:**
- Unknown dimensions score at 30 (not 0, not 50) — absence of data is mildly negative but not disqualifying
- If >3 dimensions are "unknown", the lead is `insufficient_data` regardless of score — recommend enrichment first

---

## Tools Required

- **CRM access** — to check pipeline, existing customers, outreach history
- **Web search** — for company research when enrichment data is sparse
- **Enrichment tools** — SixtyFour or Orthogonal, LinkedIn scraper, or similar (optional, enhances accuracy)
- **Read/Write** — for CSV I/O and config management
