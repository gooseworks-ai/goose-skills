---
name: hiring-signal-outreach
version: 1.0.0
description: >
  End-to-end hiring signal composite. Takes any set of companies, detects job
  postings that your product augments or replaces, finds relevant people
  (the hiring manager, buyers, champions, users), and drafts personalized
  outreach using the job role as the hook. Tool-agnostic — works with any
  company source, job board, contact finder, and outreach platform.
tags: [outreach]

graph:
  provides:
    - companies-with-hiring-signals  # Companies posting roles your product augments/replaces
    - contact-list                   # People at those companies to reach out to
    - personalized-email-sequences   # Outreach drafts using job posting as the hook
  requires:
    - company-list                   # Any list of companies (CSV, CRM, manual, Supabase)
    - your-company-context           # What you sell, what roles your product augments/replaces
  connects_to:
    - skill: cold-email-outreach
      when: "User wants to launch the campaign via their outreach tool"
      passes: contact-list, personalized-email-sequences
    - skill: linkedin-outreach
      when: "User wants LinkedIn outreach instead of or alongside email"
      passes: contact-list
  capabilities: [web-search, job-search, contact-finding, email-drafting]
---

# Hiring Signal Outreach

Detects job postings at target companies where the role being hired for is one your product augments, replaces, or directly supports. Finds the right people to contact (not just the person being hired — the hiring manager, budget holder, and potential champions), then drafts personalized outreach using the job posting as the hook.

**Why hiring signals work:** When a company posts a job, they've already acknowledged the problem your product solves. They've budgeted for it (headcount is budget). They're actively evaluating how to solve it. Your email arrives at exactly the moment they're thinking about this problem — and you're offering a faster, cheaper, or complementary solution.

## When to Auto-Load

Load this composite when:
- User says "check if any of these companies are hiring for roles we replace", "job posting signals", "hiring signal outreach"
- User has a list of companies and wants to find those hiring for relevant roles
- An upstream workflow (TAM Pulse, company monitoring) triggers a hiring signal check

---

## Step 0: Configuration (One-Time Setup)

On first run for a client/user, collect and store these preferences. Skip on subsequent runs.

### Role Mapping (Critical — This Defines What Signals Matter)

| Question | Purpose | Stored As |
|----------|---------|-----------|
| What does your product do? (1-2 sentences) | Match against job descriptions | `company_description` |
| What job roles does your product **replace**? | Strongest signal — they're hiring for what you automate | `roles_replaced` |
| What job roles does your product **augment**? | Good signal — your product makes this person more effective | `roles_augmented` |
| What job roles **buy** your product? | Contact finding — who holds the budget | `buyer_titles` |
| What job roles **champion** your product? | Contact finding — who feels the pain daily | `champion_titles` |
| What job roles **use** your product? | Contact finding — who would operate it | `user_titles` |
| What keywords in a job description indicate relevance? | Filters out false positives | `jd_keywords` |

**Example for an AI calling product:**
```
roles_replaced: ["BDC Representative", "Call Center Agent", "Appointment Setter"]
roles_augmented: ["Sales Manager", "BDC Manager", "Service Advisor"]
buyer_titles: ["VP Sales", "Director of Operations", "General Manager", "COO"]
champion_titles: ["BDC Manager", "Sales Manager", "Fixed Ops Director"]
user_titles: ["BDC Rep", "Service Advisor", "Sales Consultant"]
jd_keywords: ["inbound calls", "outbound calls", "appointment setting", "customer follow-up"]
```

### Signal Detection Config
| Question | Options | Stored As |
|----------|---------|-----------|
| How should we find job postings? | LinkedIn Jobs / Indeed / Apollo / Google Jobs / Web search | `job_search_tool` |
| How far back should we look? | 7 / 14 / 30 days | `lookback_days` |

### Contact Finding Config
| Question | Options | Stored As |
|----------|---------|-----------|
| How should we find contacts at these companies? | Apollo / LinkedIn / Clearbit / Web search | `contact_tool` |

### Outreach Config
| Question | Options | Stored As |
|----------|---------|-----------|
| Where do you want outreach sent? | Smartlead / Instantly / Outreach.io / Lemlist / CSV export | `outreach_tool` |
| Email or multi-channel? | Email only / Email + LinkedIn | `outreach_channels` |

### Your Company Context
| Question | Purpose | Stored As |
|----------|---------|-----------|
| What problem do you solve? | Email hook | `pain_point` |
| Name 2-3 proof points (customers, metrics, results) | Email credibility | `proof_points` |
| What's the cost comparison vs. a full-time hire? | ROI angle for outreach | `cost_comparison` |
| How fast can you deploy vs. a new hire? | Speed angle | `deployment_speed` |

**Store config in:** `clients/<client-name>/config/signal-outreach.json` or equivalent.

---

## Step 1: Detect Hiring Signals

**Purpose:** For each company in the input list, find active job postings that match roles your product replaces or augments.

### Input Contract

```
companies: [
  {
    name: string          # Required
    domain: string        # Required
    industry?: string     # Optional
    size?: string         # Optional
  }
]
roles_replaced: string[]          # From config
roles_augmented: string[]         # From config
jd_keywords: string[]             # From config
lookback_days: integer             # From config (default: 14)
```

### Process

For each company (or in batches):

1. **Search for job postings** using the configured `job_search_tool`:
   - **LinkedIn Jobs:** Search `company_name + role_title` for each role in `roles_replaced` and `roles_augmented`
   - **Indeed:** Same search pattern
   - **Apollo:** Company enrichment → job postings
   - **Google Jobs:** `site:linkedin.com/jobs OR site:indeed.com "{company}" "{role}"`
   - **Web search:** `"{company_name}" AND ("hiring" OR "job" OR "careers") AND ("{role_1}" OR "{role_2}")`

2. **For each job posting found, extract:**
   - Job title
   - Location (remote/onsite/hybrid)
   - Posted date
   - Job description summary (key responsibilities)
   - Source URL

3. **Classify each posting:**
   - **Replaces:** The job title matches `roles_replaced`. Your product could eliminate or reduce the need for this hire. This is the strongest signal.
   - **Augments:** The job title matches `roles_augmented`. Your product makes this person more effective — they'd want it as a tool. Good signal.
   - **Keyword match:** Title doesn't match but the JD contains `jd_keywords`. Weaker signal — verify relevance.

4. **Filter:** Drop companies with no matching job postings. Drop postings older than `lookback_days`.

### Output Contract

```
companies_hiring: [
  {
    company: {
      name: string
      domain: string
      industry: string
    }
    job_postings: [
      {
        title: string
        location: string
        posted_date: string
        description_summary: string     # 2-3 sentence summary of the role
        source_url: string
        signal_type: "replaces" | "augments" | "keyword_match"
        relevance_reasoning: string     # Why this posting matters for your product
      }
    ]
    posting_count: integer
    strongest_signal: "replaces" | "augments" | "keyword_match"
  }
]
```

### Human Checkpoint

```
Found hiring signals at X of Y companies:

| Company | Postings | Strongest Signal | Top Role | Posted |
|---------|----------|-----------------|----------|--------|
| Acme Corp | 3 | Replaces | BDC Representative | 3 days ago |
| Beta Inc | 1 | Augments | Sales Manager | 1 week ago |
| ...     | ...      | ...             | ...      | ...    |

Signal breakdown: X "replaces" (strongest), Y "augments", Z "keyword match"

Proceed with qualification? (Y/n)
```

---

## Step 2: Qualify & Prioritize

**Purpose:** Rank companies by outreach priority based on signal strength, relevance, and timing. Pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
companies_hiring: [...]           # From Step 1 output
your_company: {
  description: string
  pain_point: string
  proof_points: string[]
  cost_comparison: string
  deployment_speed: string
}
```

### Process

For each company, evaluate:

| Criterion | Weight | How to Assess |
|-----------|--------|---------------|
| **Signal type** | Highest | "Replaces" > "Augments" > "Keyword match" |
| **Posting volume** | High | Multiple relevant postings = scaling that function = bigger need |
| **Recency** | High | Posted <7 days ago = actively evaluating. 14+ days = may have candidates already |
| **Role seniority** | Medium | Hiring a VP of the function you sell into = strategic buy. Hiring an individual contributor = operational buy. Both are good, different approach. |
| **Industry fit** | Medium | Is their industry one where your product has proven results? |

### Scoring

- **Tier 1 (Act Today):** "Replaces" signal + posted within 7 days. They're literally budgeting for what you sell.
- **Tier 2 (Act This Week):** "Replaces" signal 7-14 days old, OR "Augments" signal <7 days with multiple postings.
- **Tier 3 (Queue):** "Augments" or "keyword match" signals. Worth reaching out but lower urgency.
- **Drop:** Keyword match only with weak relevance after reviewing the JD.

For each qualified company, generate:
- **Relevance reasoning:** Why this hiring pattern matters for your product
- **Outreach angle:** The specific connection between their job posting and your product
  - "Replaces" → "Before you fill that role, consider what [product] does instead"
  - "Augments" → "Your new [role] will need tools like [product] to hit the ground running"
- **Recommended framing:** Replace (you don't need to hire for this), Complement (your new hire will be 3x more effective with this), or Scale (you need 5 of these people — or 1 person + our product)

### Output Contract

```
qualified_companies: [
  {
    ...company_hiring_fields,
    priority_tier: "tier_1" | "tier_2" | "tier_3"
    relevance_reasoning: string
    outreach_angle: string
    recommended_framing: "replace" | "complement" | "scale"
  }
]
dropped_companies: [
  { name: string, drop_reason: string }
]
```

### Human Checkpoint

```
## Qualification Results

### Tier 1 — Act Today (X companies)
| Company | Signal | Top Role | Framing | Angle |
|---------|--------|----------|---------|-------|
| Acme Corp | Replaces | BDC Rep (x3) | Replace | Before you hire 3 BDC reps... |

### Tier 2 — Act This Week (X companies)
| ... |

### Tier 3 — Queue (X companies)
| ... |

### Dropped (X companies)
| Company | Reason |
|---------|--------|
| ...     | ...    |

Approve this list before we find contacts?
```

---

## Step 3: Find Relevant People

**Purpose:** For each qualified company, find the right people to contact. Unlike the funding composite, here we also identify who posted the job (the hiring manager) — they're often the best first contact.

### Input Contract

```
qualified_companies: [...]        # From Step 2 output
buyer_titles: string[]            # From config
champion_titles: string[]         # From config
user_titles: string[]             # From config
max_contacts_per_company: integer  # Default: 3-5
```

### Process

For each qualified company, use the configured `contact_tool`:

1. **First: Identify the hiring manager.** The person who posted or owns the job posting is the most relevant contact.
   - Check the job posting source for the hiring manager's name
   - If not listed, search for people at the company with titles one level above the posted role
   - The hiring manager is often the strongest contact because they own the problem your product solves

2. **Second: Find buyer-level contacts.** People with `buyer_titles` at this company — they control budget.

3. **Third: Find champions.** People with `champion_titles` — they feel the pain daily and can advocate internally.

4. **Classify each contact:**
   - **Hiring manager** — Posted the role. Directly owns the problem. Best for "replace" framing.
   - **Buyer** — Controls budget. Best for ROI/cost-comparison framing.
   - **Champion** — Lives the pain. Best for "complement" or "make your life easier" framing.
   - **User** — Would operate the product. Best for bottom-up adoption.

5. **Cap at `max_contacts_per_company`.** Prioritize: hiring manager > buyer > champion > user.

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
      role_type: "hiring_manager" | "buyer" | "champion" | "user"
    }
    company: {
      name: string
      domain: string
      priority_tier: string
      outreach_angle: string
      recommended_framing: string
    }
    job_context: {
      relevant_posting_title: string        # The job posting that triggered this signal
      signal_type: string                    # "replaces" or "augments"
      posting_url: string
      description_summary: string
    }
  }
]
```

### Human Checkpoint

```
## Contacts Found

### Acme Corp (Tier 1 — Hiring 3x BDC Reps, "Replace" framing)
| Name | Title | Role Type | Email | LinkedIn |
|------|-------|-----------|-------|----------|
| Sarah Chen | VP Sales | Hiring Manager | sarah@acme.com | ... |
| Mike Johnson | COO | Buyer | mike@acme.com | ... |
| Lisa Park | BDC Manager | Champion | lisa@acme.com | ... |

Relevant posting: "BDC Representative" (posted 3 days ago)

### Beta Inc (Tier 2 — Hiring Sales Manager, "Complement" framing)
| ... |

Total: X contacts across Y companies

Approve before we draft emails?
```

---

## Step 4: Draft Personalized Emails

**Purpose:** For each contact, draft a personalized email sequence using three layers of personalization: the job posting context, your company's value, and the prospect's company context. Pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
contacts: [...]                   # From Step 3 output (includes job_context per contact)
your_company: {
  description: string
  pain_point: string
  proof_points: string[]
  cost_comparison: string         # e.g. "4x cheaper than a full-time hire"
  deployment_speed: string        # e.g. "Live in 2 weeks vs. 3-month hiring cycle"
}
sequence_config: {
  touches: integer                # Default: 3
  timing: integer[]               # Default: [1, 5, 12]
  personalization_tier: 1 | 2 | 3
  tone: string
  cta: string
}
```

### Process

1. **Select framework based on framing:**
   - "Replace" framing → **Signal-Proof-Ask** (reference the job posting, show what your product does instead, soft ask)
   - "Complement" framing → **BAB** (before: your new hire struggles with X / after: with our tool they're 3x faster / bridge: here's how)
   - "Scale" framing → **PAS** (problem: you need 5 people for this / agitate: that's $500K/year in salary / solve: or 1 person + our product)

2. **Build three layers of personalization per contact:**

   | Layer | Source | Used In |
   |-------|--------|---------|
   | **Job posting context** | Step 1 — the specific role, responsibilities, what the JD says | Subject line + hook |
   | **Your company context** | Config — what you do, proof points, cost comparison | Body — proof + offer |
   | **Prospect company context** | Step 2 — industry, what they do, why they're hiring | Body — relevance framing |

3. **Adapt email angle by `role_type`:**

   | Role Type | Email Angle | Example Hook |
   |-----------|-------------|--------------|
   | **Hiring manager** | "Before you fill that role" | "I saw you're hiring a BDC Rep — before you finalize that, worth seeing what [product] does instead." |
   | **Buyer** | Cost/ROI comparison | "You're budgeting for 3 BDC reps ($180K/year). [Product] handles the same workload for a fraction of that." |
   | **Champion** | "This will make your life easier" | "When your new BDC rep starts, they'll need tools to be effective from day one. That's what [product] does." |
   | **User** | "You'll want this on your desk" | "If you're scaling the BDC function at [company], [product] handles [task] so you can focus on [higher-value work]." |

4. **Follow `email-drafting` skill rules:**
   - Touch 1: 50-90 words. Hook with job posting signal.
   - Touch 2: 30-50 words. Different proof point or cost/speed comparison.
   - Touch 3: 20-40 words. Social proof or breakup.
   - All hard rules apply.

### Output Contract

```
email_sequences: [
  {
    contact: { full_name, email, title, role_type, company_name }
    job_context: { posting_title, signal_type }
    sequence: [
      {
        touch_number: integer
        send_day: integer
        subject: string
        body: string
        framework: string
        personalization_layers: {
          job_posting: string      # What from the JD was referenced
          company_context: string  # What proof/value was used
          prospect_context: string # What about their company was referenced
        }
        word_count: integer
      }
    ]
  }
]
```

### Human Checkpoint

Present 3-5 sample sequences showing each role_type and framing:

```
## Sample Emails for Review

### Hiring Manager: Sarah Chen, VP Sales @ Acme Corp
Signal: Hiring 3x BDC Representatives | Framing: Replace

**Touch 1 — Day 1**
Subject: Before you fill those BDC roles
> Hi Sarah — I noticed Acme is hiring three BDC reps. Before you go through
> a 3-month hiring cycle, worth seeing what companies like [peer] are doing
> instead...
> [full email]

### Buyer: Mike Johnson, COO @ Acme Corp
Signal: Same | Framing: ROI

**Touch 1 — Day 1**
Subject: $180K/year in BDC hires — or this
> Hi Mike — Acme's hiring 3 BDC reps. At ~$60K each fully loaded, that's
> $180K/year. [Product] handles the same call volume for...
> [full email]

---

Approve these samples? I'll generate the rest in the same style.
```

---

## Step 5: Handoff to Outreach

Identical to `funding-signal-outreach` Step 5. Package contacts + email sequences for the configured outreach tool. See that composite for the full handoff process.

### Output Contract

```
campaign_package: {
  tool: string
  file_path: string
  contact_count: integer
  sequence_touches: integer
  estimated_send_days: integer
  next_action: string
}
```

### Human Checkpoint

```
## Campaign Ready

Tool: [configured tool]
Signal type: Hiring signal
Contacts: X people across Y companies
Sequence: 3 touches over 12 days

Ready to launch?
```

---

## Execution Summary

| Step | Tool Dependency | Human Checkpoint | Typical Time |
|------|----------------|-----------------|--------------|
| 0. Config | None | First run only | 5 min (once) |
| 1. Detect | Configurable (LinkedIn Jobs, Indeed, web search) | Review companies with postings | 2-5 min |
| 2. Qualify | None (LLM reasoning) | Approve tier rankings | 2-3 min |
| 3. Find People | Configurable (Apollo, LinkedIn, etc.) | Approve contact list | 2-3 min |
| 4. Draft Emails | None (LLM reasoning) | Review samples, iterate | 5-10 min |
| 5. Handoff | Configurable (Smartlead, CSV, etc.) | Final launch approval | 1 min |

**Total human review time: ~15-20 minutes**

---

## Tips

- **"Replaces" signals are gold.** If they're hiring for what your product does, you have the strongest possible outreach angle. Prioritize these.
- **Time the outreach to the posting age.** Day 1-7: "Before you start interviewing." Day 7-14: "While you're evaluating candidates." Day 14+: "Before you extend an offer."
- **Don't say "you don't need to hire."** Instead frame it as "your team gets this capability faster" or "complement your new hire with this." Less threatening to the hiring manager who already committed to the req.
- **Multiple postings for the same role = scaling signal.** If they're hiring 3x BDC reps, the pain is 3x bigger and the cost comparison is 3x more compelling.
- **The hiring manager is your best first contact** because they own the problem. But cc'ing or separately reaching the buyer (their boss) with an ROI angle creates a pincer effect.
