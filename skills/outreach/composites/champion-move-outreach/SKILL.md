---
name: champion-move-outreach
version: 1.0.0
description: >
  End-to-end champion/buyer/user job change signal composite. Takes a set of
  known people (past buyers, champions, power users), detects when they move
  to a new company, researches the new company for ICP fit, and drafts
  personalized outreach leveraging the existing relationship. Tool-agnostic —
  works with any people source, detection method, and outreach platform.
tags: [outreach]

graph:
  provides:
    - movers-with-icp-fit           # People who moved to ICP-fit companies
    - new-company-research          # Research on the new companies
    - personalized-email-sequences  # Outreach drafts leveraging existing relationship
  requires:
    - people-list                   # Known buyers, champions, users to track
    - your-company-context          # What you sell, ICP definition
  connects_to:
    - skill: cold-email-outreach
      when: "User wants to launch the campaign via their outreach tool"
      passes: movers-with-icp-fit, personalized-email-sequences
    - skill: linkedin-outreach
      when: "User wants LinkedIn outreach instead of or alongside email"
      passes: movers-with-icp-fit
  capabilities: [web-search, contact-finding, email-drafting]
---

# Champion Move Outreach

Tracks known buyers, champions, and power users for job changes. When someone who already knows your product moves to a new company, that's the highest-conversion outbound signal in B2B — they already trust you, they're in a new role trying to make an impact, and they have firsthand experience with what your product delivers.

**Why this is the #1 signal:** Every other signal (funding, hiring, leadership change) targets strangers. This targets people who already know, like, and trust your product. Conversion rates on champion-move outreach are 3-5x higher than cold outreach because:
- They don't need to be educated on what you do
- They have a positive experience to anchor on
- They want quick wins at the new company (bringing in a tool they trust IS a quick win)
- They can internally champion the deal because they have firsthand results to cite

## When to Auto-Load

Load this composite when:
- User says "track my champions", "check for job changes", "who moved from our customer accounts", "champion tracking"
- User has a list of past buyers/users and wants to know if anyone changed jobs
- An upstream workflow (TAM Pulse) triggers a champion change check

---

## Step 0: Configuration (One-Time Setup)

On first run for a client/user, collect and store these preferences. Skip on subsequent runs.

### People to Track

| Question | Purpose | Stored As |
|----------|---------|-----------|
| Where does your list of people to track come from? | Defines the input source | `people_source` |
| What categories of people are you tracking? | Determines outreach tone per person | `tracked_categories` |

**People source options:**
- CRM export (Salesforce, HubSpot) — pull closed-won contacts, active users, power users
- CSV file — manually curated list
- Supabase `people` table — filter by `lead_status = 'customer'` or similar
- Manual list — names + LinkedIn URLs

**Tracked categories:**

| Category | Who They Are | Why They Matter | Stored As |
|----------|-------------|-----------------|-----------|
| **Past buyers** | Signed the contract at their previous company | Can sign again. Know the ROI. Can articulate value to new leadership. | `past_buyers` |
| **Past champions** | Advocated for your product internally, drove adoption | Will champion again. Often have stronger conviction than the original buyer. | `past_champions` |
| **Power users** | Used your product daily, know it deeply | Can demonstrate value hands-on. Often become the internal expert at the new company. | `power_users` |
| **Lost deal contacts** | Evaluated your product but chose a competitor or no decision | Weaker signal but still valid — they know you exist. New company = fresh start. | `lost_deal_contacts` |

### ICP Definition (for qualifying the new company)

| Question | Purpose | Stored As |
|----------|---------|-----------|
| What industries do you sell to? | Filter out non-ICP companies | `target_industries` |
| What company sizes? (employee count ranges) | Filter out too-small or too-large | `target_company_size` |
| What geographies? | Filter if relevant | `target_geographies` |
| Any disqualifiers? (e.g., government, non-profit, specific verticals) | Hard no's | `disqualifiers` |
| What's the minimum viable deal? | Don't chase companies too small to pay | `minimum_deal_size` |

### Signal Detection Config
| Question | Options | Stored As |
|----------|---------|-----------|
| How should we detect job changes? | LinkedIn profile monitoring / Apollo job change data / Web search / Manual check | `detection_tool` |
| How often should we check? | Weekly / Biweekly / Monthly | `check_frequency` |

### Outreach Config
| Question | Options | Stored As |
|----------|---------|-----------|
| Where do you want outreach sent? | Smartlead / Instantly / Outreach.io / CSV export | `outreach_tool` |
| Email or multi-channel? | Email only / Email + LinkedIn | `outreach_channels` |

### Your Company Context
| Question | Purpose | Stored As |
|----------|---------|-----------|
| What does your company do? (1-2 sentences) | New company research context | `company_description` |
| What results did customers typically see? | Proof points for outreach | `customer_results` |
| Any specific results from the tracked person's previous company? | Strongest possible proof | `specific_results` |

**Store config in:** `clients/<client-name>/config/signal-outreach.json` or equivalent.

---

## Step 1: Detect Job Changes

**Purpose:** For each person in the tracking list, determine if they've moved to a new company.

### Input Contract

```
tracked_people: [
  {
    full_name: string             # Required
    linkedin_url: string          # Strongly recommended (most reliable for matching)
    email: string | null          # Previous email (will be outdated after move)
    last_known_company: string    # The company they were at when you knew them
    last_known_title: string      # Their title when you knew them
    category: "past_buyer" | "past_champion" | "power_user" | "lost_deal_contact"
    relationship_context: string | null  # e.g. "Signed $50K deal in 2025", "Led implementation"
  }
]
```

### Process

For each person, use the configured `detection_tool`:

1. **Check current position** against `last_known_company`:
   - **LinkedIn:** Visit profile (or use scraping tool) → compare current company to `last_known_company`
   - **Apollo:** People search by name + LinkedIn URL → check current employer
   - **Web search:** `"{full_name}" AND ("{last_known_company}" OR "joined" OR "new role")` — look for announcements
   - **Any other tool:** Must return the same output contract

2. **For each person, determine:**
   - Are they still at the same company? → No signal, skip.
   - Have they moved? → Signal detected. Capture new company + new title.
   - Has their profile gone dark (no updates, no activity)? → Flag for manual check.

3. **For each mover, extract:**
   - New company name
   - New title
   - Approximate start date at new company
   - New company domain (for research in Step 2)
   - Was this a promotion (higher title) or lateral move?

### Output Contract

```
movers: [
  {
    person: {
      full_name: string
      linkedin_url: string
      category: string                # "past_buyer", "past_champion", etc.
      relationship_context: string
      previous_company: string
      previous_title: string
    }
    move: {
      new_company: string
      new_company_domain: string
      new_title: string
      start_date: string              # ISO date or approximate
      days_in_new_role: integer
      is_promotion: boolean           # Higher title than before?
    }
  }
]
no_change: [
  { full_name: string, still_at: string }
]
unable_to_verify: [
  { full_name: string, reason: string }  # Profile private, no data, etc.
]
```

### Human Checkpoint

```
## Job Change Detection Results

Tracked: X people
Moved: Y people
No change: Z people
Unable to verify: W people

### People Who Moved
| Name | Category | Was At | Now At | New Title | Days In |
|------|----------|--------|--------|-----------|---------|
| Jane Doe | Past buyer | Acme Corp | NewCo Inc | VP Sales | 45 days |
| Bob Lee | Power user | Beta LLC | StartupX | Sales Manager | 12 days |
| ...  | ...      | ...    | ...    | ...       | ...     |

### Unable to Verify
| Name | Reason |
|------|--------|
| Sam Chen | LinkedIn profile set to private |

Proceed to research their new companies? (Y/n)
```

---

## Step 2: Research New Company & Qualify Against ICP

**Purpose:** For each mover, research their new company and determine if it's a fit for your product. This is the critical gate — just because someone you know moved doesn't mean their new company is a prospect.

### Input Contract

```
movers: [...]                         # From Step 1 output
icp_criteria: {
  target_industries: string[]
  target_company_size: string         # e.g. "50-500 employees"
  target_geographies: string[]
  disqualifiers: string[]
  minimum_deal_size: string
}
your_company: {
  description: string
}
```

### Process

For each mover's new company:

1. **Research the new company** using web search (tool-agnostic — always available):
   - What does the company do? (1-2 sentence summary)
   - What industry are they in?
   - Approximate company size (employees)
   - Location/HQ
   - Funding stage (if applicable)
   - Any recent news (funding, product launches, leadership changes)

2. **Qualify against ICP:**

   | Criterion | Check | Pass/Fail |
   |-----------|-------|-----------|
   | Industry | Is `new_company.industry` in `target_industries`? | Hard filter |
   | Size | Is employee count within `target_company_size` range? | Hard filter |
   | Geography | Is location in `target_geographies`? (Skip if no geo filter) | Soft filter |
   | Disqualifiers | Does the company match any `disqualifiers`? | Hard filter |
   | Deal viability | Could this company afford `minimum_deal_size`? | Judgment call |

3. **Assess the person's position at the new company:**

   | Factor | What to Check | Why It Matters |
   |--------|--------------|----------------|
   | **Authority level** | Is their new title at or above their old title? | Higher = more budget authority |
   | **Department fit** | Are they in a department that buys/uses your product? | Must be in the right department |
   | **Influence trajectory** | Promoted into a leadership role? | More influence = stronger champion |
   | **Seniority mismatch** | Were they a user before, now they're a VP? | Adjust outreach — they're a buyer now, not a user |

4. **Determine outreach approach based on category + new position:**

   | Category at Old Company | New Position Level | Approach |
   |------------------------|--------------------|----------|
   | Past buyer → Buyer-level title | **Re-sell:** "You bought us before, bring us to [new company]" |
   | Past buyer → Higher title | **Executive re-sell:** "Now that you run [department], [product] scales with you" |
   | Past champion → Buyer-level title | **Upgrade:** "You championed us internally — now you own the budget" |
   | Past champion → Same level | **Lateral champion:** "Bring what worked at [old company] to [new company]" |
   | Power user → Any level | **Bottom-up:** "You know the product inside out — want to bring it to your new team?" |
   | Lost deal contact → Any | **Fresh start:** "Different company, different needs. Worth a second look?" |

### Output Contract

```
qualified_movers: [
  {
    person: {
      full_name: string
      linkedin_url: string
      category: string
      relationship_context: string
      previous_company: string
      previous_title: string
    }
    move: {
      new_company: string
      new_company_domain: string
      new_title: string
      start_date: string
      days_in_new_role: integer
      is_promotion: boolean
    }
    new_company_research: {
      description: string             # What the company does
      industry: string
      employee_count: string          # Approximate
      location: string
      funding_stage: string | null
      recent_news: string[]           # 2-3 relevant items
    }
    qualification: {
      icp_fit: "strong" | "moderate" | "weak"
      icp_reasoning: string           # Why it's a fit or not
      authority_level: "buyer" | "influencer" | "user"
      outreach_approach: string       # "re-sell", "upgrade", "lateral champion", "bottom-up", "fresh start"
    }
    priority_tier: "tier_1" | "tier_2" | "tier_3"
  }
]
disqualified_movers: [
  {
    full_name: string
    new_company: string
    disqualification_reason: string   # "Industry not in ICP", "Company too small", etc.
  }
]
```

### Tier Assignment

- **Tier 1 (Act Today):** Past buyer or champion + strong ICP fit + <30 days in new role. This is the warmest possible lead.
- **Tier 2 (Act This Week):** Past buyer/champion + moderate ICP fit, OR power user + strong ICP fit, OR any category + strong fit but 30-60 days in.
- **Tier 3 (Queue):** Lost deal contacts + strong fit, OR any category with moderate fit and 60+ days in.
- **Disqualify:** New company doesn't pass ICP hard filters.

### Human Checkpoint

```
## New Company Research & Qualification

### Tier 1 — Act Today (X movers)
| Name | Category | New Company | ICP Fit | Approach | Days In |
|------|----------|-------------|---------|----------|---------|
| Jane Doe | Past buyer | NewCo Inc (Series B, 120 employees, SaaS) | Strong | Re-sell | 45 days |

  Research: NewCo Inc is a logistics SaaS platform. 120 employees, Series B,
  HQ in Austin. Recently launched an enterprise tier. Strong fit — same
  industry, right size, Jane has budget authority as VP Sales.

### Tier 2 — Act This Week (X movers)
| ... |

### Disqualified (X movers)
| Name | New Company | Reason |
|------|-------------|--------|
| Sam Lee | TinyStartup | 8 employees, pre-revenue — below minimum deal size |

Approve before we draft outreach?
```

---

## Step 3: Find New Contact Details

**Purpose:** Get the mover's new email address and any additional context at the new company.

### Input Contract

```
qualified_movers: [...]               # From Step 2 output
contact_tool: string                  # From config
```

### Process

1. **Find new work email** — their old email is outdated. Use the configured `contact_tool`:
   - **Apollo:** Search by name + new company domain → email
   - **Clearbit:** Prospector lookup by name + domain
   - **Web search:** `"{full_name}" AND "@{new_company_domain}"` or company contact patterns
   - **LinkedIn:** InMail or connection request (flag for manual if no email found)

2. **Verify the email is at the new company** — don't accidentally email their old address.

3. **Flag contacts without email** — these should be routed to LinkedIn outreach instead.

### Output Contract

```
contactable_movers: [
  {
    ...qualified_mover_fields,
    new_email: string
    email_confidence: "verified" | "likely" | "pattern_guess"
    preferred_channel: "email" | "linkedin" | "both"
  }
]
email_not_found: [
  {
    ...qualified_mover_fields,
    linkedin_url: string              # Fall back to LinkedIn
    preferred_channel: "linkedin"
  }
]
```

### Human Checkpoint

```
## Contact Details

| Name | New Company | Email | Confidence | Channel |
|------|-------------|-------|------------|---------|
| Jane Doe | NewCo Inc | jane.doe@newco.com | Verified | Email |
| Bob Lee | StartupX | — | Not found | LinkedIn |

X contacts with email, Y LinkedIn-only

Approve before we draft outreach?
```

---

## Step 4: Draft Personalized Outreach

**Purpose:** Draft outreach that leverages the existing relationship. This is NOT cold email — these people know you. The tone, length, and approach are fundamentally different from the other signal composites. Pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
contactable_movers: [...]             # From Step 3 output
your_company: {
  description: string
  customer_results: string[]          # General results customers see
  specific_results: {                 # Results at their specific previous company (if available)
    [company_name]: string            # e.g. "Acme Corp: reduced call handling time by 40%"
  }
}
sequence_config: {
  touches: integer                    # Default: 3
  timing: integer[]                   # Default: [1, 7, 14] (more spaced — less urgency, warmer relationship)
  tone: string                       # Default: "casual-direct" (you know this person)
  cta: string                        # Default: "quick catch-up call"
}
```

### Process

1. **Tone is fundamentally different from cold outreach:**

   | Cold Outreach | Champion Move Outreach |
   |---------------|----------------------|
   | Formal introduction | Casual reconnection |
   | Prove you're legitimate | They already trust you |
   | Signal-Proof-Ask framework | Relationship-Context-Ask framework |
   | "I noticed..." | "Hey — congrats on the move!" |
   | 50-90 words Touch 1 | Can be shorter — no education needed |
   | Professional-sharp tone | Casual-direct tone (you know each other) |

2. **Build the email around the relationship, not the product:**

   | Element | Source | How to Use |
   |---------|--------|-----------|
   | Relationship anchor | `relationship_context` | "You were one of our first champions at [old company]" |
   | Their results | `specific_results` or `customer_results` | "The 40% improvement your team saw at [old company]..." |
   | New role congratulations | `move.new_title` + `move.new_company` | "Congrats on VP Sales at NewCo" |
   | New company relevance | `new_company_research` | "NewCo's push into enterprise makes this a natural fit" |
   | Category-specific angle | `category` + `qualification.outreach_approach` | See table below |

3. **Email angle by outreach approach:**

   | Approach | Touch 1 Template Shape | Example |
   |----------|----------------------|---------|
   | **Re-sell** | Congrats + "remember the results?" + "bring it to [new company]" | "Hey Jane — congrats on the VP Sales gig at NewCo. You saw what [product] did at Acme (40% faster call handling). NewCo's sales team could see the same lift. Worth a quick catch-up?" |
   | **Upgrade** | Congrats + "you championed this" + "now you own the budget" | "Congrats on the promotion. You pushed for [product] at [old company] — now you actually control the budget. Want to talk about bringing it to NewCo?" |
   | **Lateral champion** | Congrats + "you know what works" + "replicate it" | "Hey — saw you landed at NewCo. You know firsthand what [product] does. If the team there has the same [pain], happy to help you set it up." |
   | **Bottom-up** | Congrats + "you were a power user" + "your new team will love it" | "Congrats on the move. You were one of our best users at [old company]. If you want [product] on your desk at NewCo, I can get you set up quickly." |
   | **Fresh start** | Congrats + acknowledge the past + "different situation, worth a second look" | "Hey — congrats on the move to NewCo. I know the timing wasn't right when we spoke at [old company]. Different company, different needs — open to a fresh conversation?" |

4. **Sequence design (warmer, more spaced):**

   | Touch | Day | Purpose | Length | Notes |
   |-------|-----|---------|--------|-------|
   | Touch 1 | 1 | Reconnect + congrats + soft ask | 40-70 words | Shorter than cold — they know you |
   | Touch 2 | 7 | Share a relevant result or update | 30-50 words | New feature, new customer in their industry, case study |
   | Touch 3 | 14 | Low-pressure check-in | 20-30 words | "No rush — whenever the timing is right" |

   **Key difference from cold sequences:** More spacing between touches (they're not a stranger you'll lose if you wait), warmer tone, and Touch 3 is a check-in not a breakup.

5. **Follow `email-drafting` hard rules** with one exception: Rule 6 ("never lie about how you found them") is flipped — you SHOULD reference exactly how you know them. That's the whole point.

### Output Contract

```
email_sequences: [
  {
    contact: {
      full_name: string
      new_email: string
      new_title: string
      new_company: string
      category: string
      relationship_context: string
      outreach_approach: string
    }
    sequence: [
      {
        touch_number: integer
        send_day: integer
        subject: string
        body: string
        personalization_elements: {
          relationship_anchor: string     # How the relationship was referenced
          their_results: string | null    # Specific results referenced
          new_role_reference: string      # How the new role was acknowledged
          new_company_relevance: string   # Why new company is a fit
        }
        word_count: integer
      }
    ]
    channel: "email" | "linkedin"
  }
]
```

### Human Checkpoint

Present samples covering different outreach approaches:

```
## Sample Outreach for Review

### Jane Doe — VP Sales @ NewCo Inc
Category: Past buyer | Approach: Re-sell | 45 days in new role

**Touch 1 — Day 1**
Subject: Congrats on NewCo — quick thought
> Hey Jane — congrats on the VP Sales move to NewCo. Your team at Acme
> saw a 40% improvement in call handling after going live with [product].
> NewCo's enterprise push could see the same lift.
>
> Worth a 15-minute catch-up?

**Touch 2 — Day 7**
Subject: NewCo + [product] — a few ideas
> Quick follow-up — we just launched [new feature] that would've
> been perfect for the workflow your team ran at Acme. Happy to
> walk you through it.

**Touch 3 — Day 14**
Subject: Whenever the timing is right
> No rush on this. If [product] makes sense for what you're building
> at NewCo, I'm a quick call away. Either way, congrats again on the role.

---

### Bob Lee — Sales Manager @ StartupX (LinkedIn only)
Category: Power user | Approach: Bottom-up | 12 days in new role

**LinkedIn Message:**
> Hey Bob — congrats on StartupX! You were one of our most active users
> at Beta LLC. If you want [product] set up for your new team, happy
> to fast-track it. Let me know.

---

Approve these samples? I'll generate the rest in the same style.
```

---

## Step 5: Handoff to Outreach

Identical to `funding-signal-outreach` Step 5. Package contacts + email sequences for the configured outreach tool. Route LinkedIn-only contacts to `linkedin-outreach` skill.

### Additional Note for This Composite

Some contacts will be email, some will be LinkedIn-only. Split the output:
- **Email contacts** → outreach tool (Smartlead, Instantly, CSV, etc.)
- **LinkedIn contacts** → LinkedIn automation tool (Dripify, Expandi) or manual LinkedIn queue

### Output Contract

```
campaign_package: {
  email_campaign: {
    tool: string
    file_path: string
    contact_count: integer
  }
  linkedin_campaign: {
    file_path: string              # CSV for LinkedIn tool or manual queue
    contact_count: integer
  }
  total_contacts: integer
  sequence_touches: integer
  next_action: string
}
```

### Human Checkpoint

```
## Campaign Ready

Signal type: Champion/buyer/user job change
Email contacts: X people → [outreach tool]
LinkedIn contacts: Y people → LinkedIn message queue
Total: Z people across W companies
Sequence: 3 touches over 14 days

Ready to launch?
```

---

## Execution Summary

| Step | Tool Dependency | Human Checkpoint | Typical Time |
|------|----------------|-----------------|--------------|
| 0. Config | None | First run only | 5 min (once) |
| 1. Detect job changes | Configurable (LinkedIn, Apollo, web search) | Review movers list | 2-5 min |
| 2. Research + qualify | Web search (always available) | Approve qualified movers | 3-5 min |
| 3. Find new email | Configurable (Apollo, Clearbit, etc.) | Review contact details | 1-2 min |
| 4. Draft outreach | None (LLM reasoning) | Review samples, iterate | 5-10 min |
| 5. Handoff | Configurable (Smartlead, CSV, etc.) | Final launch approval | 1 min |

**Total human review time: ~15-25 minutes**

---

## Key Differences from Other Signal Composites

| Dimension | Funding / Hiring / Leadership | Champion Move |
|-----------|------------------------------|---------------|
| **Relationship** | Cold — they don't know you | Warm — they know and (hopefully) like you |
| **Input** | List of companies | List of people |
| **Signal about** | The company | The person |
| **Qualification** | Is the company relevant? | Is the NEW company relevant? (Person is already qualified) |
| **Tone** | Professional, prove credibility | Casual, reference shared history |
| **Conversion rate** | 2-5% reply rate | 10-25% reply rate |
| **Sequence spacing** | Tight (Day 1/5/12) | Relaxed (Day 1/7/14) |
| **Touch 3** | Breakup | Check-in (leave door open) |

---

## Tips

- **Run this check monthly, not daily.** Job changes don't happen overnight. Monthly cadence catches moves within the first 30 days, which is the optimal outreach window.
- **Keep your tracking list fresh.** Add new champions, buyers, and power users as deals close. Remove people who've left the industry entirely.
- **Specific results beat generic proof.** "Your team saw 40% improvement" is 10x better than "our customers see great results." If you have specific data from their previous company, use it.
- **Don't be pushy.** These are warm contacts. A desperate tone ("We need your business!") destroys the relationship advantage. Casual and helpful wins.
- **Promotions are the best sub-signal.** Someone who was a champion and is now a VP is the warmest possible lead — they already believe in your product AND now control budget.
- **Lost deal contacts are worth tracking too.** "Different company, different needs" is a legitimate re-engagement angle. Their objection at the old company may not apply at the new one.
- **LinkedIn is often better than email for this signal.** The relationship is personal, not company-to-company. A LinkedIn message feels more natural than a cold-looking email from a sales tool.
- **If the person was a VERY close contact (executive sponsor, etc.), skip the automated sequence.** Pick up the phone or send a personal email from the founder/AE. Don't automate relationships that deserve a personal touch.
