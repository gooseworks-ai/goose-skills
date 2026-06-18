---
name: inbound-lead-enrichment
version: 1.0.0
description: >
  Fills in missing data for inbound leads — researches the company, identifies the person's
  role and seniority, finds other stakeholders at the company, checks for existing CRM
  relationships, and updates the lead record. Produces enriched lead data ready for
  qualification or outreach. Tool-agnostic.
tags: [lead-generation]
---

# Inbound Lead Enrichment

Takes inbound leads with incomplete data and fills in the gaps. Researches the company, identifies the person's role, finds other stakeholders at the company, and checks for existing relationships in CRM. Turns a bare email address into a full lead profile.

## When to Auto-Load

Load this composite when:
- User says "enrich these leads", "fill in the missing data", "research these inbound leads"
- `inbound-lead-qualification` flags leads as `insufficient_data`
- `inbound-lead-triage` detects leads with missing company/title fields
- User has a list of emails or partial lead data and needs complete profiles

## Architecture

```
[Raw Leads] → Step 1: Assess Gaps → Step 2: Company Research → Step 3: Person Research → Step 4: Stakeholder Discovery → Step 5: Relationship Check → Step 6: Compile & Output
                   ↓                      ↓                         ↓                          ↓                             ↓                          ↓
            Gap inventory        Company profiles         Person profiles            Buying committee          CRM/pipeline matches       Enriched lead records
```

---

## Step 0: Configuration (Once Per Client)

On first run, establish enrichment tool preferences.

```json
{
  "enrichment_tools": {
    "company_research": {
      "primary": "SixtyFour | Orthogonal | web-search",
      "secondary": "web-search"
    },
    "person_research": {
      "primary": "SixtyFour | Orthogonal | web-search",
      "secondary": "web-search"
    },
    "stakeholder_finding": {
      "primary": "SixtyFour | Orthogonal | web-search",
      "secondary": "web-search"
    }
  },
  "crm_source": {
    "tool": "HubSpot | Salesforce | CSV | none",
    "access_method": ""
  },
  "buyer_personas": [],
  "enrichment_depth": {
    "tier_1_leads": "deep",
    "tier_2_leads": "deep",
    "tier_3_leads": "standard",
    "tier_4_leads": "minimal",
    "untiered_leads": "standard"
  }
}
```

**On subsequent runs:** Load config silently.

---

## Step 1: Assess Data Gaps

### Process
For each lead, inventory what's known vs. unknown:

**Required fields (must fill):**
- `company_name` — What company do they work for?
- `company_domain` — Company website domain
- `person_name` — Full name
- `person_title` — Current job title
- `person_email` — Contact email (usually already have this from inbound)

**Valuable fields (fill if possible):**
- `company_size` — Employee count or range
- `company_industry` — Industry classification
- `company_stage` — Funding stage or maturity
- `company_hq` — Headquarters location
- `company_description` — One sentence about what they do
- `person_seniority` — IC, Manager, Director, VP, C-Level, Founder
- `person_department` — Engineering, Sales, Marketing, etc.
- `person_linkedin` — LinkedIn profile URL
- `person_tenure` — How long at current company

**Bonus fields (nice to have):**
- `company_tech_stack` — Known technologies used
- `company_recent_news` — Any recent events (funding, launches, hires)
- `person_background` — Previous companies, education
- `person_social_activity` — Recent posts or engagement topics

### Gap Classification

For each lead, classify the enrichment effort needed:

| Gap Level | Missing | Enrichment Needed | Cost |
|-----------|---------|-------------------|------|
| **Minimal** | 1-2 valuable fields | Quick web search | Free |
| **Standard** | Company or title missing | Web search + possible API lookup | Low |
| **Deep** | Multiple required fields missing | Multi-source research | Medium |
| **Email-only** | Only have an email address | Full research from scratch | High |

### Output
- Gap inventory table showing each lead and what's missing
- Recommended enrichment depth per lead (based on gap level AND urgency tier if available)
- Cost estimate if paid tools will be used

### Human Checkpoint
"Here's what's missing across your leads. [X] need deep enrichment, [Y] need standard, [Z] just need a quick lookup. Estimated cost: [amount]. Proceed?"

---

## Step 2: Company Research

### Process
For each unique company in the lead list (deduplicate — don't research the same company twice for multiple leads):

**From email domain (if company name is missing):**
1. Extract domain from email (e.g., `jane@acme.com` → `acme.com`)
2. Skip personal email domains (gmail, yahoo, hotmail, outlook, etc.)
3. Look up the domain → company name, description

**Company profile research:**

| Field | Primary Source | Fallback Source |
|-------|---------------|-----------------|
| Company name | Domain lookup | Web search |
| Description | Company website (homepage, about page) | LinkedIn company page, web search |
| Employee count | SixtyFour or Orthogonal, LinkedIn company page | Web search |
| Industry | LinkedIn company page, SixtyFour or Orthogonal | Infer from website content |
| Stage/Funding | SixtyFour or Orthogonal, news articles | Web search |
| HQ Location | LinkedIn company page, website | Web search |
| Tech stack | Job postings, BuiltWith | Web search |
| Recent news | Web search (last 90 days) | Twitter/social mentions |

**Research depth by config:**
- **Deep:** All fields, multiple sources, verify across sources
- **Standard:** Required + valuable fields, primary source only
- **Minimal:** Company name + description + size only

### Output
Each company gets a `company_profile` block:
```
{
  "company_name": "",
  "company_domain": "",
  "company_description": "",
  "employee_count": "",
  "employee_range": "",
  "industry": "",
  "sub_industry": "",
  "stage": "",
  "last_funding": "",
  "hq_location": "",
  "tech_stack": [],
  "recent_news": [],
  "research_sources": [],
  "confidence": "high | medium | low"
}
```

### Handling Personal Email Domains
If the lead used a personal email (gmail, etc.):
1. Check if name + any other available data can identify the company (e.g., form field, chat message)
2. If company is mentioned in their form submission or chat, use that
3. If truly unknown, flag as `company_unidentified` — still proceed with person research if name is available

---

## Step 3: Person Research

### Process
For each lead, build a person profile:

**From name + company (if title is missing):**
1. Search LinkedIn for person at company (via configured tool or web search)
2. Cross-reference with SixtyFour or Orthogonal
3. If multiple matches, use email domain to disambiguate

**Person profile research:**

| Field | Primary Source | Fallback Source |
|-------|---------------|-----------------|
| Full name | Input data | LinkedIn profile |
| Current title | LinkedIn profile, SixtyFour or Orthogonal | Web search |
| Seniority level | Infer from title | LinkedIn profile |
| Department | Infer from title | LinkedIn profile |
| Tenure at company | LinkedIn profile | Web search |
| Previous companies | LinkedIn profile | Web search |
| Education | LinkedIn profile | Skip |
| LinkedIn URL | SixtyFour or Orthogonal, web search | Skip |
| LinkedIn headline | LinkedIn profile | Skip |
| Recent activity | LinkedIn posts (if scraper configured) | Skip |

**Seniority inference rules:**
- Titles containing: Intern, Associate, Coordinator, Specialist → `IC_junior`
- Titles containing: Analyst, Engineer, Designer, Developer (no "Senior/Lead/Staff") → `IC_mid`
- Titles containing: Senior, Lead, Staff, Principal → `IC_senior`
- Titles containing: Manager, Team Lead → `Manager`
- Titles containing: Director, Head of → `Director`
- Titles containing: VP, Vice President, SVP, EVP → `VP`
- Titles containing: Chief, C-level abbreviations (CTO, CMO, CRO, CFO), President → `C_Level`
- Titles containing: Founder, Co-founder, Owner → `Founder`

**Adjust for company size:**
- At companies <20 employees: inflate seniority one level (a "Manager" has Director-level scope)
- At companies >5000 employees: deflate seniority one level (a "Director" may have Manager-level autonomy)

### Output
Each lead gets a `person_profile` block:
```
{
  "full_name": "",
  "current_title": "",
  "seniority_level": "",
  "department": "",
  "tenure_months": null,
  "previous_companies": [],
  "education": "",
  "linkedin_url": "",
  "linkedin_headline": "",
  "recent_activity_summary": "",
  "research_sources": [],
  "confidence": "high | medium | low"
}
```

---

## Step 4: Stakeholder Discovery

### Process
For each company in the lead list, identify other relevant people — the buying committee.

**Why this matters:**
- Inbound leads are rarely the sole decision-maker
- Finding the rest of the buying committee early accelerates the deal
- Multi-threading (engaging multiple people at a company) dramatically improves win rates

**Who to find (based on buyer personas from config):**

1. **Economic buyer** — Person who signs the check. Usually VP+ or C-level in the relevant department.
2. **Champion** — Person most likely to push for adoption internally. Usually a senior IC or Director who feels the pain.
3. **Technical evaluator** — Person who will assess the product's technical fit. Usually engineering or ops.
4. **End user** — Person who will use the product daily. Their buy-in prevents post-sale churn.

**Process per company:**
1. Using the buyer personas, determine which roles to search for
2. Search via configured tool (SixtyFour or Orthogonal, LinkedIn, company-contact-finder)
3. For each stakeholder found, capture: name, title, seniority, LinkedIn URL, email (if available)
4. Note the relationship to the inbound lead: same team? Same department? Different function?

**Depth control:**
- **Deep enrichment** (Tier 1-2 leads): Find all 4 stakeholder types. Research each.
- **Standard enrichment** (Tier 3 leads): Find economic buyer + champion only.
- **Minimal enrichment** (Tier 4 / untiered): Skip stakeholder discovery.

### Output
Each company gets a `stakeholder_map`:
```
{
  "company": "",
  "inbound_lead": {
    "name": "",
    "title": "",
    "role_in_deal": "economic_buyer | champion | evaluator | user | unknown"
  },
  "stakeholders_found": [
    {
      "name": "",
      "title": "",
      "seniority": "",
      "linkedin_url": "",
      "email": "",
      "role_in_deal": "",
      "relationship_to_lead": "",
      "confidence": "high | medium | low"
    }
  ],
  "buying_committee_completeness": "full | partial | minimal",
  "recommended_multi_thread": ""
}
```

### Stakeholder Prioritization
If the inbound lead IS the economic buyer → stakeholders are supporting context
If the inbound lead is a user/evaluator → finding the economic buyer is critical
If the inbound lead is unknown → identifying their role determines the multi-threading strategy

---

## Step 5: Relationship Check

### Process
For each lead AND each discovered stakeholder, check existing systems for prior relationships:

**Check 1 — CRM (HubSpot, Salesforce, CSV):**
- Does this person already exist in our system?
- If yes: what's their current status? (active lead, contacted, nurture, customer, churned)
- If yes: who owns the relationship?

**Check 2 — Outreach history (`outreach_log`):**
- Have we emailed/messaged this person before?
- If yes: when, what channel, what was the outcome?
- Critical: prevent the "we cold-emailed you last week and you ignored us, now you came inbound" collision

**Check 3 — Company-level pipeline (`companies` table or CRM):**
- Is there an active deal with this company?
- If yes: at what stage? Who's the deal owner?
- An inbound lead at a company with an active deal is a HUGE signal — flag it prominently

**Check 4 — Signal history (`signals` table):**
- Has this company appeared in any signal scans?
- If yes: which signals? Were they acted on?

**Check 5 — Mutual connections (if data available):**
- Does anyone on our team know someone at this company?
- If yes: note the warm intro path

### Output
Each lead gets a `relationship_context` block:
```
{
  "person_in_crm": true/false,
  "person_crm_status": "",
  "person_outreach_history": [
    {
      "date": "",
      "channel": "",
      "campaign": "",
      "outcome": ""
    }
  ],
  "company_in_pipeline": true/false,
  "company_deal_stage": "",
  "company_deal_owner": "",
  "company_signal_history": [],
  "mutual_connections": [],
  "relationship_summary": ""
}
```

---

## Step 6: Compile & Output

### Enriched Lead Record

Merge all research into a single enriched record per lead:

```
{
  "original_data": {},
  "company_profile": {},
  "person_profile": {},
  "stakeholder_map": {},
  "relationship_context": {},
  "enrichment_metadata": {
    "enrichment_depth": "deep | standard | minimal",
    "fields_filled": X,
    "fields_still_missing": [],
    "sources_used": [],
    "confidence_overall": "high | medium | low",
    "enrichment_date": "",
    "cost_incurred": ""
  }
}
```

### Output Formats

**Primary: Enriched CSV**

Produce a CSV that extends the original lead data with all enriched fields:

| Original Fields | + Company Fields | + Person Fields | + Stakeholder Fields | + Relationship Fields | + Metadata |
|----------------|------------------|-----------------|---------------------|----------------------|-----------|
| All input columns | company_description, employee_count, industry, stage, hq, tech_stack, recent_news | current_title, seniority, department, tenure, linkedin_url, headline | stakeholder_1_name, stakeholder_1_title, stakeholder_1_role, ... (up to 4) | in_crm, crm_status, in_pipeline, deal_stage, outreach_history_summary | enrichment_depth, confidence, fields_missing, sources_used |

Save to the current working directory or wherever the user prefers (e.g., `leads/inbound-enriched-[date].csv`).

**Secondary: Enrichment Report**

```markdown
## Lead Enrichment Report: [Date]

### Summary
- **Total leads enriched:** X
- **Deep enrichment:** X leads (Tier 1-2)
- **Standard enrichment:** X leads (Tier 3)
- **Minimal enrichment:** X leads (Tier 4)

### Data Quality
- **Fully enriched** (all required + valuable fields): X leads
- **Mostly enriched** (all required, some valuable): X leads
- **Partially enriched** (some required fields still missing): X leads
- **Could not enrich** (insufficient starting data): X leads

### Company Research
- **Unique companies researched:** X
- **Companies already in CRM:** X
- **Companies with active deals:** X (flag for deal owner)
- **Companies with signal history:** X

### Stakeholder Discovery
- **Total stakeholders found:** X across Y companies
- **Economic buyers identified:** X
- **Champions identified:** X
- **Full buying committees mapped:** X companies

### Relationship Flags
- **Leads already in CRM:** X (update status, don't create duplicates)
- **Previously contacted leads:** X (check outreach history before re-engaging)
- **Companies with active deals:** X (coordinate with deal owner)
- **Warm intro paths found:** X

### Cost
- **Enrichment tool credits used:** [breakdown by tool]
- **Cost per lead:** [average]

### CSV saved to: [path]
```

---

## Handling Edge Cases

**Lead with only an email, nothing else:**
1. Extract domain → look up company
2. Search "[name] [company]" on LinkedIn/web
3. If still can't identify: flag as `enrichment_failed` with reason, recommend manual lookup
4. Don't waste paid API credits on truly unidentifiable leads — web search first

**Same company appears multiple times (multiple inbound leads):**
- Research the company ONCE, apply to all leads
- Stakeholder discovery runs once per company, not per lead
- Note the multi-lead signal: "3 people from [Company] came inbound — buying committee forming?"

**Lead claims a title that doesn't match LinkedIn:**
- Trust LinkedIn over self-reported form data (people sometimes inflate titles on forms)
- Note the discrepancy: "Form says 'VP of Engineering', LinkedIn says 'Senior Engineer'"
- Use the LinkedIn title for qualification purposes

**Company recently renamed, merged, or was acquired:**
- If the company domain redirects, follow the redirect
- Note the corporate action: "[Company] was acquired by [Parent] in [date]"
- Qualify against the current entity, not the historical one

**Person left the company since filling the form:**
- If LinkedIn shows a different company than the form submission, flag it
- Note: "Lead submitted via [Company] but now at [New Company] as of [date]"
- Qualify both companies if both are potentially relevant

**Enrichment tool rate limits or failures:**
- If primary tool fails, fall back to secondary (web search is always available)
- If both fail for a specific lead, mark as `enrichment_partial` and move on
- Never block the entire batch because one lead failed

**Very high volume (100+ leads):**
- Batch company research first (deduplicate companies)
- Parallelize person research via Task agents (15-20 leads per batch)
- Skip stakeholder discovery for Tier 4 and untiered leads
- Provide cost estimate before running paid enrichment tools

**Personal email domains:**
- If form had a company field: use it even though email is personal
- If no company info: attempt LinkedIn search by name
- Last resort: flag as `company_unidentified`, enrich person only

---

## Update Protocol

After enrichment is complete, update the source systems:

1. **If CRM is configured:** Create/update lead records with enriched data. Don't overwrite existing data — append or fill gaps only.
2. **Flag duplicates:** If enrichment reveals a lead already exists in CRM under a different email, flag the duplicate rather than creating a second record.

---

## Tools Required

- **Web search** — primary fallback for all research
- **SixtyFour or Orthogonal** — company + person lookup (optional, enhances depth)
- **LinkedIn scraper (Apify)** — person profile enrichment (optional)
- **Company-contact-finder** — stakeholder discovery
- **CRM access** — relationship checks (HubSpot, Salesforce, CSV)
- **Read/Write** — CSV I/O and config management
- **Task tool** — for parallelizing enrichment across large lead batches
