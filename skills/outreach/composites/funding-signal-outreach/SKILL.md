---
name: funding-signal-outreach
version: 1.0.0
description: >
  End-to-end funding signal composite. Takes any set of companies, detects recent
  funding events, qualifies against your company context, finds relevant people
  (buyers, champions, users), and drafts personalized outreach. Tool-agnostic —
  works with any company source, contact finder, and outreach platform.
tags: [outreach]

graph:
  provides:
    - qualified-funded-companies    # Companies with recent funding, ranked by relevance
    - contact-list                  # People at funded companies matched to buyer personas
    - personalized-email-sequences  # Ready-to-send email drafts per contact
  requires:
    - company-list                  # Any list of companies (CSV, CRM export, manual, Supabase)
    - your-company-context          # What you sell, who you sell to, proof points
  connects_to:
    - skill: cold-email-outreach
      when: "User wants to launch the campaign via their outreach tool"
      passes: contact-list, personalized-email-sequences
    - skill: linkedin-outreach
      when: "User wants LinkedIn outreach instead of or alongside email"
      passes: contact-list
  capabilities: [web-search, contact-finding, email-drafting]
---

# Funding Signal Outreach

Detects recent funding events across a set of companies, qualifies them against your company's context, finds the right people to reach out to, and drafts personalized emails. The full chain from signal to outreach-ready.

## When to Auto-Load

Load this composite when:
- User says "check if any of these companies raised funding", "funding signal outreach", "reach out to recently funded companies"
- User has a list of companies and wants to act on funding signals
- An upstream workflow (TAM Pulse, company monitoring) triggers a funding signal check

## Architecture

This composite is **tool-agnostic**. Each step defines a data contract (what goes in, what comes out). The specific tools that fulfill each step are configured once per client/user, not asked every run.

```
┌─────────────────────────────────────────────────────────────────┐
│                  FUNDING SIGNAL OUTREACH                        │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │  DETECT  │──▶│ QUALIFY  │──▶│  FIND    │──▶│  DRAFT   │    │
│  │ Funding  │   │ & Rank   │   │  People  │   │  Emails  │    │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │
│       │              │              │              │            │
│  Input: companies  + your company  + buyer       + signal      │
│  Tool: web search    context        personas      context      │
│    or apollo         (LLM)         Tool: apollo   (LLM)       │
│    or crunchbase                     or linkedin              │
│    or any                            or clearbit              │
│                                      or any                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 0: Configuration (One-Time Setup)

On first run for a client/user, collect and store these preferences. Skip on subsequent runs.

### Company Source Config
| Question | Options | Stored As |
|----------|---------|-----------|
| Where does your company list come from? | CSV file / Salesforce / HubSpot / Supabase / Manual list | `company_source` |
| What fields identify a company? | At minimum: company name + domain. Optional: industry, size, location | `company_fields` |

### Signal Detection Config
| Question | Options | Stored As |
|----------|---------|-----------|
| How should we detect funding signals? | Web search (free) / Apollo / Crunchbase API / PitchBook | `signal_tool` |
| How far back should we look? | 7 / 14 / 30 / 60 / 90 days | `lookback_days` |

### Contact Finding Config
| Question | Options | Stored As |
|----------|---------|-----------|
| How should we find contacts at these companies? | Apollo / LinkedIn Sales Nav / Clearbit / Web search / Manual | `contact_tool` |
| Do you have API access? | Yes (provide key) / No (use free tier or web search) | `contact_api_access` |

### Outreach Config
| Question | Options | Stored As |
|----------|---------|-----------|
| Where do you want outreach sent? | Smartlead / Instantly / Outreach.io / Lemlist / Apollo / CSV export | `outreach_tool` |
| Email or multi-channel? | Email only / Email + LinkedIn | `outreach_channels` |

### Your Company Context
| Question | Purpose | Stored As |
|----------|---------|-----------|
| What does your company do? (1-2 sentences) | Qualification + email personalization | `company_description` |
| What problem do you solve? | Email hook | `pain_point` |
| Who are your ideal buyers? (titles, departments) | Contact finding filters | `buyer_personas` |
| Name 2-3 proof points (customers, metrics, results) | Email credibility | `proof_points` |
| What's your product's price range? (SMB / Mid-Market / Enterprise) | Funding stage qualification | `price_tier` |

**Store config in:** `clients/<client-name>/config/signal-outreach.json` or equivalent.

---

## Step 1: Detect Funding Signals

**Purpose:** For each company in the input list, determine if they have raised funding within the lookback window.

### Input Contract

```
companies: [
  {
    name: string          # Required
    domain: string        # Required
    industry?: string     # Optional, helps qualification
    size?: string         # Optional
    location?: string     # Optional
  }
]
lookback_days: integer    # From config (default: 30)
```

### Process

For each company (or in batches):

1. **Search for funding announcements** using the configured `signal_tool`:
   - **Web search:** Query `"{company_name}" AND ("raised" OR "funding" OR "Series") AND "2026"` for each company
   - **Apollo:** Use company enrichment endpoint to pull funding data
   - **Crunchbase:** Query funding rounds API filtered by date
   - **Any other tool:** Must return the same output contract

2. **Extract funding details** from results:
   - Did they raise? (yes/no)
   - How much?
   - What stage? (Seed, A, B, C, D+)
   - When? (exact date or approximate)
   - Who led the round? (investors)
   - Source URL (for verification)

3. **Filter:** Drop companies with no funding signal detected.

### Output Contract

```
funded_companies: [
  {
    name: string
    domain: string
    industry: string
    funding_amount: string        # e.g. "$15M"
    funding_stage: string         # e.g. "Series A"
    funding_date: string          # ISO date or "March 2026"
    lead_investors: string[]      # e.g. ["Sequoia", "a16z"]
    source_url: string            # Link to announcement
    confidence: "high" | "medium" # High = multiple sources or official PR
    original_company_data: object # Pass through all original fields
  }
]
```

### Human Checkpoint

Present results as a table:

```
Found funding signals for X of Y companies:

| Company | Amount | Stage | Date | Investors | Confidence |
|---------|--------|-------|------|-----------|------------|
| Acme    | $15M   | Series A | 2026-02-15 | Sequoia | High |
| ...     | ...    | ...   | ...  | ...       | ...        |

Proceed with qualification? (Y/n)
```

---

## Step 2: Qualify & Prioritize

**Purpose:** Given funded companies + your company context, rank them by outreach priority. This step is pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
funded_companies: [...]           # From Step 1 output
your_company: {
  description: string             # From config
  pain_point: string              # From config
  buyer_personas: string[]        # From config
  proof_points: string[]          # From config
  price_tier: string              # From config
}
```

### Process

For each funded company, evaluate:

| Criterion | Weight | How to Assess |
|-----------|--------|---------------|
| **Stage fit** | High | Does the funding stage match your price tier? Series A → SMB/mid-market tools. Series C → enterprise. |
| **Industry relevance** | High | Is their industry one where your product solves a real problem? |
| **Timing urgency** | Medium | How recent is the funding? <14 days = urgent window. 30-60 days = still viable. 60+ = cooling. |
| **Size signal** | Medium | Post-raise team size estimate. Do they have enough people to need your product? |
| **Round size** | Low | Larger rounds = more budget for tooling. But even small rounds trigger vendor evaluation. |

### Scoring

Assign each company a priority tier:

- **Tier 1 (Act Today):** Stage fit + industry relevance + funded within 14 days
- **Tier 2 (Act This Week):** Two of three criteria met, or funded 15-30 days ago with strong fit
- **Tier 3 (Queue):** Marginal fit or funding 30+ days old. Worth reaching out but not urgent.
- **Drop:** No relevance to your product/market. Remove from pipeline.

For each qualified company, generate:
- **Relevance reasoning:** 1-2 sentences on why this company would care about your product right now
- **Outreach angle:** The specific hook connecting their funding to your product's value
- **Recommended approach:** Direct pain-point, aspirational growth, or operational efficiency framing

### Output Contract

```
qualified_companies: [
  {
    ...funded_company_fields,
    priority_tier: "tier_1" | "tier_2" | "tier_3"
    relevance_reasoning: string
    outreach_angle: string
    recommended_approach: string
    estimated_team_size: string    # Post-raise estimate
  }
]
dropped_companies: [
  {
    name: string
    drop_reason: string
  }
]
```

### Human Checkpoint

Present qualified companies grouped by tier:

```
## Qualification Results

### Tier 1 — Act Today (X companies)
| Company | Stage | Amount | Angle | Why |
|---------|-------|--------|-------|-----|
| ...     | ...   | ...    | ...   | ... |

### Tier 2 — Act This Week (X companies)
| ... |

### Tier 3 — Queue (X companies)
| ... |

### Dropped (X companies)
| Company | Reason |
|---------|--------|
| ...     | ...    |

Approve this list before we find contacts? You can promote, demote, or drop any company.
```

---

## Step 3: Find Relevant People

**Purpose:** For each qualified company, find the right people to contact based on your buyer personas.

### Input Contract

```
qualified_companies: [...]        # From Step 2 output
buyer_personas: [                 # From config
  {
    title_patterns: string[]      # e.g. ["VP Sales", "Head of Revenue", "CRO"]
    department: string            # e.g. "Sales", "Engineering"
    seniority: string             # e.g. "VP+", "Director+", "Manager+"
    role_type: "buyer" | "champion" | "user"
  }
]
max_contacts_per_company: integer # Default: 3-5
```

### Process

For each qualified company, use the configured `contact_tool`:

1. **Search for people matching buyer personas:**
   - **Apollo:** People search with company domain + title filters
   - **LinkedIn Sales Nav:** Company page → filter by title/seniority
   - **Clearbit:** Prospector API with role filters
   - **Web search:** `site:linkedin.com/in "{company}" "{title}"` queries
   - **Any other tool:** Must return the same output contract

2. **For each person found, collect:**
   - Full name
   - Current title
   - Email (if available from the tool)
   - LinkedIn URL
   - Role type classification (buyer / champion / user)

3. **Prioritize contacts within each company:**
   - Buyers first (decision-makers who control budget)
   - Champions second (mid-level who feel the pain daily)
   - Users third (end-users who can advocate bottom-up)

4. **Cap at `max_contacts_per_company`** — typically 3-5 people per company to avoid carpet-bombing.

### Output Contract

```
contacts: [
  {
    person: {
      full_name: string
      first_name: string
      last_name: string
      title: string
      email: string | null
      linkedin_url: string | null
      role_type: "buyer" | "champion" | "user"
    }
    company: {
      name: string
      domain: string
      funding_amount: string
      funding_stage: string
      funding_date: string
      priority_tier: string
      outreach_angle: string
      relevance_reasoning: string
    }
  }
]
contacts_without_email: [...]     # Same structure, flagged for manual lookup
```

### Human Checkpoint

Present contacts grouped by company:

```
## Contacts Found

### Acme Corp (Tier 1 — Series A, $15M)
| Name | Title | Role Type | Email | LinkedIn |
|------|-------|-----------|-------|----------|
| Jane Doe | VP Sales | Buyer | jane@acme.com | linkedin.com/in/janedoe |
| John Smith | Sales Manager | Champion | john@acme.com | linkedin.com/in/johnsmith |

### Beta Inc (Tier 1 — Series B, $40M)
| ... |

Total: X contacts across Y companies (Z without email)

Approve before we draft emails?
```

---

## Step 4: Draft Personalized Emails

**Purpose:** For each contact, draft a personalized email sequence that connects the funding signal to your product's value. This step is pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
contacts: [...]                   # From Step 3 output
your_company: {                   # From config
  description: string
  pain_point: string
  proof_points: string[]
}
sequence_config: {
  touches: integer                # Default: 3
  timing: integer[]               # Default: [1, 5, 12] (days)
  personalization_tier: 1 | 2 | 3 # Default: 2
  tone: string                    # Default: "casual-direct"
  cta: string                     # Default: "15-min call"
}
```

### Process

1. **Select framework based on signal type:**
   - Funding signal → **Signal-Proof-Ask** (reference the raise, show proof, soft ask)
   - If the funding is for the exact problem you solve → **BAB** (before/after framing)

2. **Build personalization context per contact:**

   | Field | Source | Example |
   |-------|--------|---------|
   | Signal reference | Step 1 | "Congratulations on the $15M Series A" |
   | Company context | Step 2 | "As you scale the sales team post-raise..." |
   | Role-specific pain | Step 3 role_type | Buyer → budget/ROI, Champion → daily friction, User → workflow |
   | Proof point | Config | "Companies like [peer] use us to..." |
   | Outreach angle | Step 2 | "Scale fast with fresh capital" |

3. **Generate emails following `email-drafting` skill rules:**
   - Touch 1: 50-90 words. Hook with funding signal + proof + soft CTA.
   - Touch 2: 30-50 words. New angle (different proof point or asset offer).
   - Touch 3: 20-40 words. Social proof drop or breakup.
   - All hard rules from `email-drafting` apply (no filler, no "just checking in", one CTA per email, etc.)

4. **By personalization tier:**
   - **Tier 1:** One template per touch with merge fields. Same for all contacts.
   - **Tier 2:** One template per (role_type + priority_tier) combination. Swap pain points and proof.
   - **Tier 3:** Unique email per contact. Reference their specific title, company's specific funding context.

### Output Contract

```
email_sequences: [
  {
    contact: { full_name, email, company_name, ... }
    sequence: [
      {
        touch_number: integer
        send_day: integer
        subject: string
        body: string               # With merge fields resolved or ready
        framework: string
        word_count: integer
      }
    ]
  }
]
```

### Human Checkpoint

Present 3-5 sample email sequences (one per tier if Tier 2, one per contact if Tier 3):

```
## Sample Emails for Review

### Contact: Jane Doe, VP Sales @ Acme Corp (Tier 1, Series A $15M)

**Touch 1 — Day 1**
Subject: Before the Series A hiring sprint
> Hi Jane — congrats on the raise. As Acme scales the sales team...
> [full email]

**Touch 2 — Day 5**
Subject: How [peer company] handled post-raise scaling
> [full email]

**Touch 3 — Day 12**
Subject: One last thought
> [full email]

---

Approve these samples? I'll generate the rest in the same style.
Iterate? Tell me what to change (tone, length, angle, CTA).
```

After approval, generate remaining emails and output the full set.

---

## Step 5: Handoff to Outreach

**Purpose:** Package the contacts + email sequences for the configured outreach tool. This step adapts its output format to the tool.

### Input Contract

```
email_sequences: [...]            # From Step 4 output
outreach_tool: string             # From config
outreach_channels: string         # From config
```

### Process

Based on `outreach_tool` from config:

| Tool | Action |
|------|--------|
| **Smartlead** | Chain to `cold-email-outreach` Phase 4 (Smartlead MCP automation) |
| **Instantly** | Generate Instantly-format CSV |
| **Outreach.io** | Generate Outreach-compatible CSV |
| **Lemlist** | Generate Lemlist-format CSV |
| **Apollo** | Generate Apollo sequence import CSV |
| **CSV export** | Generate generic CSV with all fields |

If `outreach_channels` includes LinkedIn:
- Chain to `linkedin-outreach` skill for LinkedIn message sequences
- Output CSV for LinkedIn automation tool (Dripify, Expandi, etc.)

### Output Contract

```
campaign_package: {
  tool: string
  file_path: string               # Path to CSV or campaign ID
  contact_count: integer
  sequence_touches: integer
  estimated_send_days: integer
  next_action: string             # "Upload to [tool]" or "Campaign created, activate when ready"
}
```

### Human Checkpoint

```
## Campaign Ready

Tool: Smartlead (or CSV export, etc.)
Contacts: 23 people across 8 companies
Sequence: 3 touches over 12 days
File: skills/composites/funding-signal-outreach/output/{campaign-name}-{date}.csv

Ready to launch? (This is the final gate before emails are sent or files are created)
```

---

## Execution Summary

| Step | Tool Dependency | Human Checkpoint | Typical Time |
|------|----------------|-----------------|--------------|
| 0. Config | None | First run only | 5 min (once) |
| 1. Detect | Configurable (web search, Apollo, etc.) | Review funded company list | 2-5 min |
| 2. Qualify | None (LLM reasoning) | Approve/adjust tier rankings | 2-3 min |
| 3. Find People | Configurable (Apollo, LinkedIn, etc.) | Approve contact list | 2-3 min |
| 4. Draft Emails | None (LLM reasoning) | Review sample emails, iterate | 5-10 min |
| 5. Handoff | Configurable (Smartlead, CSV, etc.) | Final launch approval | 1 min |

**Total human review time: ~15-20 minutes** to go from "here are my target companies" to "outreach is live."

---

## Tips

- **Run weekly** — funding signals have a 1-3 week outreach window before the company is flooded with vendor pitches
- **Tier 1 companies should be contacted within 48 hours** of the funding announcement for maximum impact
- **3-5 contacts per company** is the sweet spot. More than that and you risk the "we're being carpet-bombed" effect
- **Signal-Proof-Ask** framework works best for funding signals because the signal itself is the hook
- **Don't mention the funding amount in the email** unless it's public and impressive. Focus on what the funding means for them (growth, hiring, new tools), not the number itself
