---
name: leadership-change-outreach
version: 2.0.0
description: >
  End-to-end leadership change signal composite. Takes any set of companies,
  detects recent leadership changes (new VP+, C-suite hires and promotions),
  evaluates relevance to your product, and drafts personalized outreach.
  Uses Apollo People Search (free) for fast detection + Apollo Enrichment (1 credit/person)
  for employment history, start dates, LinkedIn URLs, and verified emails.
tags: [outreach]

graph:
  provides:
    - companies-with-leadership-changes  # Companies with relevant new leaders
    - new-leader-profiles                # Details on the new leaders (enriched)
    - personalized-email-sequences       # Outreach drafts to new leaders
  requires:
    - company-list                       # Any list of companies (with domains)
    - your-company-context               # What you sell, what leaders care about
  connects_to:
    - skill: cold-email-outreach
      when: "User wants to launch the campaign via their outreach tool"
      passes: new-leader-profiles, personalized-email-sequences
    - skill: linkedin-outreach
      when: "User wants LinkedIn outreach instead of or alongside email"
      passes: new-leader-profiles
  capabilities: [apollo-lead-finder, email-drafting]
---

# Leadership Change Outreach

Detects new leadership hires at target companies and evaluates whether the new leader is relevant to your product — as a direct buyer, a champion, or someone whose mandate aligns with what you sell. If relevant, enriches their profile and drafts personalized outreach that speaks to their new-role priorities.

**Why leadership changes work:** New leaders re-evaluate everything in their first 90 days. They inherit a vendor stack they didn't choose, a team they didn't build, and KPIs they need to hit fast. They're the most receptive buyers in any organization because:
- They want to put their stamp on the department
- They have a mandate (and often budget) to make changes
- They need quick wins to build credibility with their new org
- They haven't yet formed loyalty to existing vendors

## When to Auto-Load

Load this composite when:
- User says "check for leadership changes", "new executive hires", "leadership signal outreach"
- User has a list of companies and wants to find those with relevant new leaders
- An upstream workflow (TAM Pulse, company monitoring) triggers a leadership change check

## Detection Method: Apollo (Free Search + Enrichment)

This composite uses a two-phase Apollo pipeline that replaces slower web search approaches:

1. **Apollo Free Search** — `search_people` with `q_organization_domains` + `person_titles` filters. Returns person IDs, obfuscated names, and titles. No credits consumed. Scans 100+ people across dozens of companies in ~30 seconds.
2. **Local Post-Filter** — Strict title matching to remove noise from Apollo's fuzzy matching (regional titles, sub-function heads, non-GTM roles). Typically reduces results by 50-60%.
3. **Apollo Enrichment by ID** — `people/match` with the person `id` from free search. Returns full employment history with `start_date`/`end_date` for every role, LinkedIn URL, verified email, and full name. Costs 1 credit per person.
4. **Change Detection** — Filter enriched results by `start_date` on the `current: true` employment entry within the lookback window.

**Why this beats web search:** Web search relies on press releases and announcements — most leadership changes below C-suite are never publicly announced. Apollo pulls from LinkedIn profile data directly, catching changes that web search misses. Speed: ~90 seconds total vs 5+ minutes for web search.

**Cost:** 1 Apollo credit per person enriched. With a tight post-filter (VP+ GTM titles only), a scan of 10-15 companies typically costs 30-50 credits.

**Important:** Apollo tracks start dates at month granularity (e.g., `2026-02-01`), not exact day. Set lookback windows accordingly — use full months rather than exact day counts.

---

## Step 0: Configuration (One-Time Setup)

On first run for a client/user, collect and store these preferences. Skip on subsequent runs.

### Leader Relevance Mapping

| Question | Purpose | Stored As |
|----------|---------|-----------|
| What does your product do? (1-2 sentences) | Match against leader mandates | `company_description` |
| What leader titles are **direct buyers** of your product? | Highest priority — they can sign the check | `buyer_leader_titles` |
| What leader titles could **champion** your product? | They'd advocate internally or be an entry point | `champion_leader_titles` |
| What leader titles have **mandates your product supports**? | Their goals align with your product's value | `aligned_leader_titles` |
| What departments are relevant? | Filter out irrelevant leadership changes | `relevant_departments` |

**Example for a sales AI product:**
```
buyer_leader_titles: ["VP Sales", "CRO", "Chief Revenue Officer", "SVP Sales"]
champion_leader_titles: ["Director of Sales Ops", "Head of Revenue Operations", "VP Business Development"]
aligned_leader_titles: ["COO", "CEO", "VP Operations"]
relevant_departments: ["Sales", "Revenue", "Operations", "Business Development"]
```

### Signal Detection Config
| Question | Options | Stored As |
|----------|---------|-----------|
| How far back should we look? | 30 / 60 / 90 days (default: 90) | `lookback_days` |
| Minimum seniority for detection? | VP+ (default) / Head+ / Director+ | `min_seniority` |

### Apollo Title List

The free search uses `person_titles` to filter. Define these based on the client's buyer/champion/aligned titles. Default VP+ GTM titles:

```python
titles = [
    # C-Suite
    'CRO', 'Chief Revenue Officer',
    'CMO', 'Chief Marketing Officer',
    'CCO', 'Chief Commercial Officer',
    # VP-level (Sales, Marketing, Growth, Revenue, RevOps, Demand Gen, BD, Partnerships, CS, Commercial, GTM)
    'VP of Sales', 'VP Sales', 'Vice President of Sales', 'Vice President Sales',
    'SVP Sales', 'SVP of Sales',
    'VP of Marketing', 'VP Marketing', 'Vice President of Marketing',
    'SVP Marketing', 'SVP of Marketing',
    'VP of Growth', 'VP Growth', 'Vice President of Growth',
    'VP of Revenue', 'VP Revenue', 'Vice President of Revenue',
    'VP of Revenue Operations', 'VP RevOps',
    'VP of Demand Generation', 'VP Demand Gen',
    'VP of Business Development', 'VP Business Development',
    'VP of Partnerships', 'VP Partnerships',
    'VP of Customer Success', 'VP Customer Success',
    'VP of Commercial', 'VP Commercial',
    'VP GTM', 'VP of GTM',
    # Head-level
    'Head of Sales', 'Head of Marketing', 'Head of Growth',
    'Head of Revenue', 'Head of Revenue Operations', 'Head of RevOps',
    'Head of Demand Generation', 'Head of Demand Gen',
    'Head of Business Development', 'Head of Partnerships',
    'Head of Customer Success', 'Head of Commercial',
    'Head of GTM',
]
```

**Important:** Do NOT use Apollo's `person_seniority` filter (e.g., `['vp', 'c_suite']`) — it's too broad and returns regional managers, ICs with inflated titles, etc. Use explicit `person_titles` and post-filter locally instead.

### Post-Filter Rules

Apollo does fuzzy title matching, so results will include noise. Apply a strict local post-filter that:

1. **Rejects non-GTM functions:** engineering, talent, legal, privacy, data science, analytics, product marketing, field marketing, partner marketing, customer marketing, content, communications, community, solutions marketing, enablement, marketing operations
2. **Rejects regional/sub-segment roles:** Area VP, AVP, regional heads, EMEA/APAC/Americas-specific roles, enterprise sales by region (West/East/Central/etc.), channel sales, velocity sales, sales development, sales finance, sales strategy
3. **Rejects Apollo garbage:** Any title containing "related to search terms"
4. **Requires valid prefix:** Title must start with VP/Vice President/SVP/Head of/Chief/CRO/CMO/CCO/President

This typically reduces results by 50-60% (e.g., 100 raw → 40 filtered).

### Outreach Config
| Question | Options | Stored As |
|----------|---------|-----------|
| Where do you want outreach sent? | Smartlead / Instantly / Outreach.io / CSV export | `outreach_tool` |
| Email or multi-channel? | Email only / Email + LinkedIn | `outreach_channels` |

### Your Company Context
| Question | Purpose | Stored As |
|----------|---------|-----------|
| What problem do you solve? | Email hook | `pain_point` |
| Name 2-3 proof points (customers, metrics, results) | Email credibility | `proof_points` |
| What quick wins can a new leader get from your product? | First-90-days angle | `quick_wins` |
| What does the "before" state look like without your product? | Pain framing | `before_state` |

**Store config in:** `clients/<client-name>/config/signal-outreach.json` or equivalent.

---

## Step 1: Detect Leadership Changes (Apollo Pipeline)

**Purpose:** For each company in the input list, find VP+ GTM leaders and detect who started recently.

### Input Contract

```
companies: [
  {
    name: string          # Required
    domain: string        # Required (used for q_organization_domains)
    industry?: string     # Optional
    size?: string         # Optional
  }
]
titles: string[]                      # From config (default VP+ GTM list above)
lookback_days: integer                # From config (default: 90)
```

### Process

#### Phase 1: Apollo Free Search (~30 seconds)

Use `apollo_client.search_people()` with:
```python
filters = {
    'q_organization_domains': '\n'.join([c['domain'] for c in companies]),  # All domains in one query
    'person_titles': titles,       # From config
    'per_page': 100,
    'page': 1
}
```

**Key details:**
- Use `q_organization_domains` (NOT `organization_domains`) — the `q_` prefix is required for domain filtering
- All company domains can be passed in a single query (newline-separated)
- Free tier returns: `id`, `first_name`, `last_name` (obfuscated as "?"), `title`, `organization.name`, `last_refreshed_at`
- Free tier does NOT return: full last name, LinkedIn URL, email, or employment history
- If `total_entries > 100`, paginate with `page: 2`, etc.

#### Phase 2: Local Post-Filter (~instant)

Apply the strict post-filter rules from Step 0 to remove noise. This is critical — Apollo's fuzzy title matching will return regional managers, sub-function heads, and non-GTM roles.

```python
def is_valid_gtm_leader(title):
    """Returns True only for top-level GTM leadership roles."""
    tl = title.lower().strip()

    # 1. Reject non-GTM functions
    reject_keywords = ['engineering', 'engineer', 'talent', 'legal', 'privacy',
                       'data science', 'analytics', 'product marketing',
                       'field marketing', 'partner marketing', 'customer marketing',
                       'content', 'communications', 'community',
                       'channel sales', 'solutions marketing',
                       'enablement', 'education', 'operations & marketing',
                       'marketing operations']
    if any(kw in tl for kw in reject_keywords):
        return False

    # 2. Reject regional/sub-segment roles
    regional_keywords = ['area vice president', 'avp ', 'regional', 'emea', 'apac',
                         'apj', 'americas', 'enterprise sales west', 'enterprise sales east',
                         'enterprise sales central', 'enterprise sales south',
                         'enterprise sales north', 'enterprise sales -',
                         'enterprise sales,', 'na enterprise',
                         'majors sales', 'velocity sales',
                         'canada', 'latin america', 'u.s.', 'uk&i',
                         'chief of staff', 'sales finance', 'sales strategy',
                         'sales development']
    if any(kw in tl for kw in regional_keywords):
        return False

    # 3. Reject Apollo garbage
    if 'related to search terms' in tl:
        return False

    # 4. Must start with a valid prefix
    valid_prefixes = [
        'vp ', 'vp,', 'vp/', 'vice president of', 'vice president,',
        'svp', 'senior vice president',
        'head of sales', 'head of marketing', 'head of growth',
        'head of revenue', 'head of demand gen', 'head of business development',
        'head of partnerships', 'head of customer success', 'head of commercial',
        'head of gtm',
        'chief revenue officer', 'chief marketing officer', 'chief commercial officer',
        'cro', 'cmo', 'cco',
        'president',
    ]
    return any(tl.startswith(p) for p in valid_prefixes)
```

#### Phase 3: Apollo Enrichment by ID (~1 second per person)

For each person that passes the post-filter, enrich using the `id` from free search:

```python
# Use the person's id from free search — this is the key to making enrichment work
# without full names (which free tier obfuscates)
url = "https://api.apollo.io/api/v1/people/match"
payload = {"api_key": api_key, "id": person_id}
```

**What enrichment returns (1 credit per person):**
- `name` — full name (no longer obfuscated)
- `employment_history` — array of all roles with `start_date`, `end_date`, `title`, `organization_name`, `current` (boolean)
- `linkedin_url` — full LinkedIn profile URL
- `email` + `email_status` — verified work email
- `city`, `state`, `country` — location

**Important:** Do NOT use `bulk_enrich_people` with first_name + organization_name — free search obfuscates last names, and Apollo can't match without them. Always enrich by `id`.

**Rate limiting:** Add a small delay (0.5s) every 5 requests to avoid 429s. If rate limited, respect the `Retry-After` header.

#### Phase 4: Change Detection

For each enriched person, extract the `current: true` employment entry and check its `start_date`:

```python
emp_history = person.get('employment_history', [])
current_role = next((e for e in emp_history if e.get('current')), None)
start_date = current_role.get('start_date', '') if current_role else ''  # e.g. "2026-02-01"

# Check if within lookback window
# Note: Apollo uses month granularity (YYYY-MM-01), not exact day
```

Determine change type:
- **new_hire**: Previous role was at a different company
- **internal_promotion**: Previous role was at the same company

### Output Contract

```
leadership_changes: [
  {
    company: {
      name: string
      domain: string
    }
    new_leader: {
      full_name: string
      new_title: string
      start_date: string              # ISO date (month granularity: "2026-02-01")
      previous_company: string
      previous_title: string
      change_type: "new_hire" | "internal_promotion"
      linkedin_url: string
      email: string
      email_status: string            # "verified", "guessed", etc.
      city: string
      state: string
      country: string
    }
  }
]
```

### Output Files

Save two files:
1. **CSV** (`leadership-change-scan.csv`) — all enriched people sorted by start_date descending, with columns: name, title, company, domain, start_date, change_type, previous_title, previous_company, previous_end_date, email, email_status, linkedin_url, city, state, country
2. **Markdown** (`leadership-change-outreach.md`) — formatted report with signal summary, qualification, and email drafts

### Human Checkpoint

```
Scanned X companies → Y raw results → Z after post-filter → W enriched

Leadership changes in last {lookback_days} days:

| Company | New Leader | Title | Started | Previous Role | Type |
|---------|-----------|-------|---------|---------------|------|
| Acme Corp | Jane Smith | VP Sales | 2026-02-01 | Dir. Sales @ Competitor Inc | new_hire |
| Beta Inc | Tom Brown | CRO | 2026-01-01 | VP Revenue @ Beta Inc | internal_promotion |

Credits used: W

Proceed with relevance evaluation? (Y/n)
```

---

## Step 2: Evaluate Relevance & Prioritize

**Purpose:** For each leadership change, evaluate whether the new leader is relevant to your product — and determine the best outreach approach. Pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
leadership_changes: [...]            # From Step 1 output
your_company: {
  description: string
  pain_point: string
  proof_points: string[]
  quick_wins: string[]
  before_state: string
}
buyer_leader_titles: string[]
champion_leader_titles: string[]
aligned_leader_titles: string[]
```

### Process

For each leadership change, evaluate across three dimensions:

#### A) Role Relevance

| Category | Match Criteria | Priority |
|----------|---------------|----------|
| **Direct buyer** | Title matches `buyer_leader_titles` | Highest — they can make the purchase decision |
| **Champion** | Title matches `champion_leader_titles` | High — they can advocate and influence the buyer |
| **Aligned mandate** | Title matches `aligned_leader_titles` | Medium — their goals benefit from your product |
| **No relevance** | Title matches none of the lists | Drop |

#### B) Timing Window

| Days in Role | Window | Outreach Tone |
|-------------|--------|---------------|
| 0-30 days | **Honeymoon** | "Welcome aboard — here's something to help you hit the ground running" |
| 31-60 days | **Assessment** | "Now that you've had a month to assess the stack, here's what peers are doing" |
| 61-90 days | **Action** | "You're probably finalizing your roadmap — here's a quick win to consider" |
| 90+ days | **Established** | Weaker signal but still valid — "Saw you joined [company] recently" |

#### C) Background Signal

The new leader's previous company and role adds context:

| Background | Signal | How to Use |
|-----------|--------|-----------|
| Came from a **customer** of yours | Strongest possible — they already know your product | "You used [product] at [previous company] — want to bring it to [new company]?" |
| Came from a **competitor's customer** | They have experience with the category | "At [previous company] you used [competitor] — here's how [product] compares" |
| Came from **same industry** | They understand the pain points | Reference industry-specific problems they've seen |
| Came from **different industry** | Fresh perspective, may be open to new approaches | "The playbook from [old industry] doesn't always translate — here's what works in [new industry]" |
| **Internal promotion** | They know the existing stack and its shortcomings | "Now that you own the budget, here's what your team has been asking for" |

### Scoring

- **Tier 1 (Act Today):** Direct buyer + <30 days in role + external hire. Fresh eyes, budget authority, evaluating everything.
- **Tier 2 (Act This Week):** Direct buyer 30-60 days in, OR champion <30 days, OR came from a customer/competitor customer.
- **Tier 3 (Queue):** Aligned mandate, OR 60-90 days in role, OR internal promotion with champion title.
- **Drop:** No role relevance, OR >90 days in role with weak fit.

For each qualified leader, generate:
- **Relevance reasoning:** Why this leader would care about your product right now
- **Outreach angle:** The specific hook based on their role + timing + background
- **Key insight:** One thing about their situation that makes the outreach personal

### Output Contract

```
qualified_leaders: [
  {
    ...leadership_change_fields,
    role_relevance: "direct_buyer" | "champion" | "aligned_mandate"
    timing_window: "honeymoon" | "assessment" | "action" | "established"
    background_signal: string         # e.g. "Came from a competitor customer"
    priority_tier: "tier_1" | "tier_2" | "tier_3"
    relevance_reasoning: string
    outreach_angle: string
    key_insight: string
  }
]
dropped_leaders: [
  { name: string, company: string, drop_reason: string }
]
```

### Human Checkpoint

```
## Relevance Evaluation

### Tier 1 — Act Today (X leaders)
| Leader | Company | Title | Days In | Type | Angle |
|--------|---------|-------|---------|------|-------|
| Jane Smith | Acme | VP Sales | 32 | Direct buyer, Assessment window | "Now that you've assessed the sales stack at Acme..." |

### Tier 2 — Act This Week (X leaders)
| ... |

### Tier 3 — Queue (X leaders)
| ... |

### Dropped (X leaders)
| Leader | Company | Reason |
|--------|---------|--------|
| ...    | ...     | ...    |

Approve before we draft outreach?
```

---

## Step 3: Enrich Leader Profile

**Purpose:** For each qualified leader, gather additional context to power personalization. Apollo enrichment (Step 1) already provides email, LinkedIn URL, and full employment history. This step adds context that Apollo doesn't provide.

### Input Contract

```
qualified_leaders: [...]              # From Step 2 output (already has email, linkedin, emp history from Apollo)
```

### Process

Apollo enrichment from Step 1 already gives us:
- Full name, verified email, LinkedIn URL
- Complete employment history (all prior roles with start/end dates)
- Location (city, state, country)

For each qualified leader, add context that Apollo doesn't provide:

1. **LinkedIn activity** (optional but high-value — use `linkedin-profile-post-scraper` if available):
   - Recent posts or shares — what are they talking about?
   - Any posts about starting the new role — what did they say about their priorities?

2. **Previous company context** (derive from employment history):
   - What does their previous company do?
   - Did they use your product (or a competitor's) there?
   - What was their tenure? (Long tenure = deep expertise. Short tenure = may be a career mover.)

3. **New company context:**
   - What does the new company do?
   - Any recent company news beyond the leadership change?

### Output Contract

```
enriched_leaders: [
  {
    ...qualified_leader_fields,
    email: string | null               # Already from Apollo
    linkedin_url: string               # Already from Apollo
    linkedin_activity: {
      recent_posts: string[]           # 2-3 most relevant post summaries
      new_role_post: string | null     # What they said about starting this role
    } | null
    previous_company_context: string   # 1-2 sentences about their old company
    new_company_context: string        # 1-2 sentences about what this company does
    personalization_hooks: string[]    # 3-5 things to reference in the email
  }
]
```

### Human Checkpoint

```
## Enriched Leader Profiles

### Jane Smith — VP Sales @ Acme Corp (Tier 1)
- Email: jane.smith@acme.com (verified)
- LinkedIn: linkedin.com/in/janesmith
- Previously: Director of Sales @ Competitor Inc (3 years)
- New role post: "Excited to join Acme Corp as VP Sales..."
- Personalization hooks:
  1. Posted about "scaling outbound without scaling headcount" 2 weeks ago
  2. Previous company used [competitor product]
  3. Acme recently raised Series B ($40M)

### Tom Brown — CRO @ Beta Inc (Tier 2)
| ... |

Approve before we draft outreach?
```

---

## Step 4: Draft Personalized Outreach

**Purpose:** Draft outreach to each new leader that demonstrates you understand their situation — new role, new priorities, tight timeline. Pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
enriched_leaders: [...]               # From Step 3 output
your_company: {
  description: string
  pain_point: string
  proof_points: string[]
  quick_wins: string[]
  before_state: string
}
sequence_config: {
  touches: integer                    # Default: 3
  timing: integer[]                   # Default: [1, 5, 12]
  tone: string                       # Default: "professional-sharp" (executives expect this)
  cta: string                        # Default: "15-min intro call"
}
```

### Process

1. **Select framework based on role relevance:**
   - **Direct buyer** → **Signal-Proof-Ask** (reference the role change, show proof, ask for time)
   - **Champion** → **BAB** (before: the current state they inherited / after: what it looks like with your product / bridge: quick wins in 30 days)
   - **Aligned mandate** → **PAS** (problem: what their mandate implies / agitate: why current tools fall short / solve: your product)

2. **Build personalization from enriched profile:**

   | Personalization Element | Source | Example |
   |------------------------|--------|---------|
   | Role change reference | Step 1 | "Congrats on the VP Sales role at Acme" |
   | Timing-aware framing | Step 2 timing_window | "Now that you've had a month to assess..." |
   | Background connection | Step 2 background_signal | "At Competitor Inc you used [similar tool]..." |
   | LinkedIn activity reference | Step 3 linkedin_activity | "Your post about scaling outbound resonated..." |
   | Company context | Step 3 new_company_context | "With Acme's Series B and growth plans..." |
   | Quick win offer | Config quick_wins | "Most VPs see [result] within their first 30 days with us" |

3. **Adapt email angle by timing window:**

   | Window | Touch 1 Approach | Subject Line Pattern |
   |--------|-----------------|---------------------|
   | **Honeymoon** (0-30d) | Welcome + quick win offer. Light touch — they're still onboarding. | "Quick win for your first 90 days at {company}" |
   | **Assessment** (31-60d) | Acknowledge they've been evaluating. Offer peer comparison. | "What other {title}s are doing differently" |
   | **Action** (61-90d) | They're making decisions now. Be direct about value. | "{Product} for {company}'s {goal}" |

4. **Follow `email-drafting` skill rules:**
   - Touch 1: 50-90 words. Reference the role change + one personalization hook + soft CTA.
   - Touch 2: 30-50 words. New proof point or quick-win offer.
   - Touch 3: 20-40 words. Peer social proof or graceful breakup.
   - **Tone: professional-sharp by default.** Executives respond to conciseness and specificity, not chattiness.

### Output Contract

```
email_sequences: [
  {
    leader: { full_name, email, title, company_name, role_relevance, timing_window }
    sequence: [
      {
        touch_number: integer
        send_day: integer
        subject: string
        body: string
        framework: string
        personalization_elements: {
          role_change: string          # How the role change was referenced
          timing: string              # How the timing window was used
          background: string          # How their background was leveraged
          company_context: string     # How their company context was used
          linkedin_reference: string | null  # Any LinkedIn activity referenced
        }
        word_count: integer
      }
    ]
  }
]
```

### Human Checkpoint

Present samples covering different timing windows and role types:

```
## Sample Outreach for Review

### Jane Smith, VP Sales @ Acme Corp
Tier 1 | Direct buyer | Assessment window (32 days) | Previously at Competitor Inc

**Touch 1 — Day 1**
Subject: What other new VPs of Sales are changing first
> Hi Jane — congrats on the move to Acme. A month in, you've probably
> identified what's working and what isn't in the sales stack.
>
> [Product] is what [peer company] brought in during a similar transition —
> [specific result] within 30 days. [Your post about scaling outbound
> without scaling headcount] is exactly the problem we solve.
>
> Worth a 15-minute intro?

**Touch 2 — Day 5**
Subject: The playbook from [previous company] → Acme
> [full email referencing their background]

**Touch 3 — Day 12**
Subject: One last thought
> [breakup email]

---

Approve these samples? I'll generate the rest in the same style.
```

---

## Step 5: Handoff to Outreach

Identical to `funding-signal-outreach` Step 5. Package contacts + email sequences for the configured outreach tool.

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
Signal type: Leadership change
Contacts: X new leaders across Y companies
Sequence: 3 touches over 12 days

Ready to launch?
```

---

## Execution Summary

| Step | Tool Dependency | Human Checkpoint | Typical Time |
|------|----------------|-----------------|--------------|
| 0. Config | None | First run only | 5 min (once) |
| 1. Detect | Apollo Free Search + Enrichment by ID | Review leadership changes + credits used | ~90 sec (machine) |
| 2. Evaluate | None (LLM reasoning) | Approve relevance + tier rankings | 2-3 min |
| 3. Enrich | LinkedIn post scraper (optional) | Review enriched profiles | 1-2 min |
| 4. Draft | None (LLM reasoning) | Review samples, iterate | 5-10 min |
| 5. Handoff | Configurable (Smartlead, CSV, etc.) | Final launch approval | 1 min |

**Total machine time: ~90 seconds** (Step 1 dominates — free search ~30s + enrichment ~60s for ~40 people)
**Total human review time: ~15-20 minutes**
**Typical Apollo credit cost: 30-50 credits** (1 per person enriched, after post-filter)

---

## Key Difference from Other Signal Composites

In funding and hiring composites, the signal is about the company, and you then find people to contact. In leadership change, **the signal IS the person.** The new leader is both the signal and the primary contact. This changes the flow:

- **Funding/Hiring:** Detect signal → Qualify company → Find people → Draft emails
- **Leadership change:** Detect signal (person) → Evaluate relevance (person-to-product fit) → Enrich person → Draft emails

Step 3 is "Enrich" not "Find People" because you already know who to contact. The enrichment is about gathering enough context to write a deeply personalized email.

---

## Tips

- **External hires are stronger signals than internal promotions.** External hires are more likely to re-evaluate the vendor stack because they don't have loyalty to existing tools.
- **The 30-60 day window is the sweet spot.** Too early (first week) and they're still onboarding. Too late (90+ days) and they've already made their decisions.
- **Reference their LinkedIn "new role" post if they made one.** It shows you've done your homework and often reveals their stated priorities.
- **Don't mention the predecessor.** Saying "replacing John" can be awkward. Just reference the role and the company.
- **Quick wins beat big transformations.** New leaders need early credibility. Position your product as "a win in your first quarter" not "a 6-month implementation."
- **If they came from a customer of yours, that's the strongest possible hook.** Lead with it. "You used [product] at [old company] — want to bring it to [new company]?"

### Apollo-Specific Tips

- **Always use `q_organization_domains` (with `q_` prefix)** for domain filtering. The non-prefixed `organization_domains` returns random companies.
- **Never use `person_seniority` filters** (e.g., `['vp', 'c_suite']`). Apollo maps too many titles to these levels — you'll get AEs, recruiters, and ICs. Use explicit `person_titles` + local post-filter instead.
- **Enrich by `id`, not by name.** Free search obfuscates last names. The `id` field from free search is the only reliable way to link to enrichment without full names.
- **`bulk_enrich_people` won't work here.** It requires first_name + last_name + organization_name for matching, but free search hides last names. Use individual `people/match` calls with `{"id": person_id}` instead.
- **Apollo start dates are month-granularity** (e.g., `2026-02-01` not `2026-02-14`). When setting lookback windows, round to full months. A "last 15 days" scan should check the current and previous month.
- **Credits are only consumed on successful enrichment matches.** If Apollo can't match a person (returns `None`), no credit is charged.
- **Rate limit handling:** Add 0.5s delay every 5 enrichment calls. On 429, respect the `Retry-After` header (typically 60s).
