---
name: news-signal-outreach
version: 1.0.0
description: >
  End-to-end news-triggered signal composite. Takes any piece of news — an article,
  LinkedIn post, tweet, announcement, event, trend, regulation, product launch,
  acquisition, layoff, expansion, or any other public event — and evaluates whether
  the companies or people mentioned are ICP fits. If yes, identifies the connection
  between the news and your product, finds the right people to contact, and drafts
  personalized outreach using the news as the hook. Tool-agnostic. Accepts both
  company-level and person-level news triggers.

  AUTO-TRIGGER: Load this composite whenever a user shares a URL (LinkedIn post,
  article, tweet, blog post) or mentions a company/person they "came across",
  "saw", or "found" from any external source and asks about relevance, fit,
  ICP match, or whether to reach out. The user does NOT need to explicitly say
  "outreach" — any signal evaluation request from an external source triggers this.
tags: [outreach]

graph:
  provides:
    - icp-qualified-targets         # Companies/people from the news that fit ICP
    - relevance-angles              # How the news connects to your product
    - contact-list                  # People to reach out to
    - personalized-email-sequences  # Outreach drafts using the news as the hook
  requires:
    - news-input                    # The news item(s) — URL, text, or structured data
    - your-company-context          # What you sell, ICP, proof points
  connects_to:
    - skill: cold-email-outreach
      when: "User wants to launch the campaign via their outreach tool"
      passes: contact-list, personalized-email-sequences
    - skill: linkedin-outreach
      when: "User wants LinkedIn outreach instead of or alongside email"
      passes: contact-list
  capabilities: [web-search, contact-finding, email-drafting]
---

# News Signal Outreach

The catch-all signal composite. Every other composite handles a specific signal type (funding, hiring, leadership change, champion move). This one handles **everything else** — any piece of news or public event that could create a reason to reach out.

A regulation change. A product recall. A competitor acquisition. A market expansion. A layoff. An earnings miss. A new partnership. An industry report. A conference keynote. A viral LinkedIn post. Any external event that shifts a company's priorities, creates urgency, or opens a window for your product.

**Why this composite exists:** The world generates an infinite stream of potential outreach triggers. The four structured signal composites handle the most common patterns. This composite handles the long tail — the unpredictable, opportunistic moments that often produce the best outreach because nobody else is sending a templated sequence about them.

## When to Auto-Load

Load this composite when ANY of these are true:
- User shares ANY URL (LinkedIn post, article, tweet, blog, news) and asks about a company or person mentioned in it
- User says "came across", "saw this post", "found this article", "check this out", "is this relevant", "is this company a fit", "should we reach out"
- User mentions a company or person they discovered from an external source (social media, news, conference, podcast, newsletter) and asks about relevance or fit
- User asks "can we reach out to anyone based on this?"
- User says "check if this news is relevant to our prospects", "news-based outreach", "trigger-based outreach"
- User has a list of companies and wants to check recent news for outreach angles
- The news doesn't fit neatly into funding, hiring, leadership change, or champion move categories
- An upstream workflow surfaces a news item that needs evaluation

**Key principle:** If the user shares an external signal (URL, post, article, mention) and asks ANY question about the companies/people in it — load this composite. Don't wait for the word "outreach." The composite handles both evaluation-only (Steps 1-3) and full outreach (Steps 1-6).

## Input Flexibility

This composite accepts three input modes:

| Mode | Input | Example |
|------|-------|---------|
| **News → Companies** | A news item. Extract companies/people mentioned, qualify them. | "Here's an article about new FDA regulations on telehealth" |
| **Companies → News** | A list of companies. Find recent news about them, evaluate relevance. | "Check these 50 companies for any news we can use as an outreach angle" |
| **Person → News** | A person or list of people. Find recent news about them or their company, evaluate relevance. | "Check if any of these prospects have been in the news" |

---

## Step 0: Configuration (One-Time Setup)

On first run for a client/user, collect and store these preferences. Skip on subsequent runs.

### ICP Definition

| Question | Purpose | Stored As |
|----------|---------|-----------|
| What does your company do? (1-2 sentences) | Relevance matching | `company_description` |
| What problem do you solve? | Connection angle identification | `pain_point` |
| What industries do you sell to? | ICP filter | `target_industries` |
| What company sizes? | ICP filter | `target_company_size` |
| What geographies? | ICP filter (optional) | `target_geographies` |
| Any disqualifiers? | Hard no's | `disqualifiers` |
| Who are your buyers? (titles) | Contact finding | `buyer_titles` |
| Who are your champions? (titles) | Contact finding | `champion_titles` |
| Who are your users? (titles) | Contact finding | `user_titles` |

### Your Company Context

| Question | Purpose | Stored As |
|----------|---------|-----------|
| What specific outcomes does your product deliver? | Relevance angle building | `product_outcomes` |
| Name 2-3 proof points (customers, metrics) | Email credibility | `proof_points` |
| What categories of news are most relevant to your product? | Helps prioritize | `relevant_news_categories` |

**Examples of `relevant_news_categories`:**
```
# For a cybersecurity product:
relevant_news_categories: ["data breach", "compliance regulation", "security incident",
  "digital transformation", "cloud migration", "IPO/going public"]

# For a sales AI product:
relevant_news_categories: ["sales team scaling", "market expansion", "new product launch",
  "competitor acquisition", "cost cutting", "revenue miss"]

# For an HR tech product:
relevant_news_categories: ["layoffs", "rapid hiring", "remote work policy",
  "DEI initiative", "union activity", "culture crisis"]
```

### Signal Detection Config
| Question | Options | Stored As |
|----------|---------|-----------|
| How should we find news? | Web search / Google News / RSS feeds / Social media | `news_tool` |
| How far back should we look? (when scanning companies for news) | 7 / 14 / 30 / 60 days | `lookback_days` |

### Contact Finding & Outreach Config
| Question | Options | Stored As |
|----------|---------|-----------|
| How should we find contacts? | Apollo / LinkedIn / Clearbit / Web search | `contact_tool` |
| Where do you want outreach sent? | Smartlead / Instantly / Outreach.io / CSV export | `outreach_tool` |
| Email or multi-channel? | Email only / Email + LinkedIn | `outreach_channels` |

**Store config in:** `clients/<client-name>/config/signal-outreach.json` or equivalent.

---

## Step 1: Parse & Extract

**Purpose:** Take the raw news input — whatever form it arrives in — and extract structured entities (companies, people) and the core event.

### Input Contract

Three modes:

**Mode A: News → Companies/People**
```
news_input: {
  mode: "news_to_targets"
  items: [
    {
      type: "url" | "text" | "structured"
      content: string               # URL to article, raw text, or structured summary
      source: string | null          # "TechCrunch", "LinkedIn post", "user provided", etc.
    }
  ]
}
```

**Mode B: Companies → News**
```
news_input: {
  mode: "targets_to_news"
  companies: [
    {
      name: string
      domain: string
      industry?: string
    }
  ]
  lookback_days: integer
}
```

**Mode C: People → News**
```
news_input: {
  mode: "people_to_news"
  people: [
    {
      full_name: string
      company: string
      linkedin_url?: string
    }
  ]
  lookback_days: integer
}
```

### Process

#### Mode A: News → Companies/People

1. **Fetch and parse the news content:**
   - If URL → fetch the page, extract article text
   - If raw text → use as-is
   - If structured → use as-is

2. **Extract entities:**
   - Companies mentioned (name, role in the story — subject, affected party, partner, competitor)
   - People mentioned (name, title, company, role in the story)
   - The core event (what happened, in one sentence)
   - Event category (regulation, acquisition, partnership, product launch, market event, crisis, expansion, contraction, etc.)
   - Date of event
   - Affected industries

3. **Expand if needed:** If the news implies a broader set of affected companies beyond those mentioned:
   - "New FDA regulation on telehealth" → all telehealth companies, not just ones in the article
   - "Major data breach at [company]" → the breached company AND their competitors (who can capitalize)
   - "Industry report shows X trend" → companies in that industry

#### Mode B: Companies → News

1. **For each company, search for recent news** using configured `news_tool`:
   - Web search: `"{company_name}" AND (news OR announced OR launches OR raises OR expands OR partners)` within `lookback_days`
   - Filter results against `relevant_news_categories` from config
   - Extract the same fields as Mode A for each news item found

2. **Group results:** Company → list of news items, ranked by relevance to your product

#### Mode C: People → News

1. **For each person, search for recent news/activity:**
   - Web search: `"{full_name}" AND "{company}"` within `lookback_days`
   - LinkedIn activity (if available): recent posts, shares, comments
   - Look for: promotions, speaking engagements, published articles, quoted in press, new projects

2. **Group results:** Person → list of news items/activity

### Output Contract

```
extracted_signals: [
  {
    entity: {
      type: "company" | "person"
      name: string
      company: string               # Company name (same as name if type=company)
      domain: string | null
      role_in_news: string           # "subject", "affected", "partner", "competitor", "mentioned"
    }
    news: {
      headline: string              # One-line summary of what happened
      event_category: string        # "regulation", "acquisition", "expansion", "crisis", etc.
      event_date: string
      full_summary: string          # 2-3 sentence summary
      source_url: string | null
      affected_industries: string[]
    }
  }
]
```

### Human Checkpoint

```
## Extracted Signals

Source: [news source/input description]
Event: [one-line summary]
Category: [event category]

### Companies/People Extracted
| Entity | Type | Role in News | Industry |
|--------|------|-------------|----------|
| Acme Corp | Company | Subject | Healthcare |
| Jane Doe | Person | Quoted (CEO) | Healthcare |
| HealthTech sector | Industry | Affected | Healthcare |

Also evaluating: X companies in [affected industry] not directly mentioned

Proceed with ICP qualification? (Y/n)
```

---

## Step 2: Qualify Against ICP

**Purpose:** For each extracted entity, determine if they're an ICP fit. Drop companies/people that don't match. Pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
extracted_signals: [...]              # From Step 1 output
icp_criteria: {
  target_industries: string[]
  target_company_size: string
  target_geographies: string[]
  disqualifiers: string[]
}
your_company: {
  description: string
  pain_point: string
}
```

### Process

For each entity:

1. **If entity is a company:**
   - Check industry against `target_industries`
   - Estimate company size (from news context or quick web search)
   - Check geography if relevant
   - Check against `disqualifiers`
   - Result: Pass / Fail with reasoning

2. **If entity is a person:**
   - Identify their company
   - Qualify the company through the same ICP checks above
   - Additionally check: is this person's role relevant? (matches `buyer_titles`, `champion_titles`, or `user_titles`)
   - Result: Pass / Fail with reasoning

3. **For entities implied but not mentioned** (e.g., "all telehealth companies" from a regulation news):
   - Use web search or existing company lists to identify specific companies in the affected space
   - Qualify each against ICP
   - This step may surface new companies not in your existing pipeline

### Output Contract

```
icp_qualified: [
  {
    entity: { ... }                   # From Step 1
    news: { ... }                     # From Step 1
    icp_assessment: {
      fit: "strong" | "moderate"
      industry_match: boolean
      size_match: boolean | "unknown"
      reasoning: string               # Why they're a fit
    }
  }
]
icp_disqualified: [
  {
    entity_name: string
    reason: string
  }
]
```

### Human Checkpoint

```
## ICP Qualification

### Qualified (X entities)
| Entity | Type | Industry | Size | ICP Fit | Reasoning |
|--------|------|----------|------|---------|-----------|
| Acme Corp | Company | Healthcare SaaS | ~200 | Strong | Core ICP industry, right size |
| MedTech Inc | Company | HealthTech | ~500 | Moderate | Adjacent industry, large |

### Disqualified (X entities)
| Entity | Reason |
|--------|--------|
| BigPharma Co | Enterprise (50K+ employees) — above target size |

Approve qualified list?
```

---

## Step 3: Identify Connection Angle

**Purpose:** This is the critical thinking step. For each ICP-qualified entity, determine the specific connection between the news event and your product. Why should they care about your product RIGHT NOW because of THIS news? Pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
icp_qualified: [...]                  # From Step 2 output
your_company: {
  description: string
  pain_point: string
  product_outcomes: string[]
  proof_points: string[]
  relevant_news_categories: string[]
}
```

### Process

For each qualified entity, answer three questions:

#### Question 1: "Why does this news create urgency for our product?"

Map the news event category to a product relevance pattern:

| Event Category | How It Creates Urgency | Example |
|---------------|----------------------|---------|
| **Regulation change** | They need to comply, your product helps them comply or adapt faster | "New data privacy law → they need [your compliance tool] before enforcement date" |
| **Acquisition / Merger** | Systems need integration, processes need standardization, new leadership evaluates stack | "Acquired a company → need to unify [function your product handles]" |
| **Market expansion** | New market = new challenges, need tools that scale | "Expanding to EMEA → need [your product] for localized [function]" |
| **Product launch** | Scaling up means scaling operations | "Launching enterprise tier → need [your product] to handle enterprise [function]" |
| **Competitive pressure** | Competitor moved, they need to respond | "Competitor launched [X] → they need to level up [area your product addresses]" |
| **Cost cutting / Layoffs** | Do more with less, automation becomes essential | "Cut 15% of staff → need [your product] to maintain output with smaller team" |
| **Crisis / Incident** | Reactive buying — they need a solution NOW | "Data breach → urgently need [your security product]" |
| **Partnership** | New partner = new workflows, new opportunities | "Partnered with [company] → need [your product] to support the integration" |
| **Earnings / Growth** | Over-performing = scaling challenges. Under-performing = efficiency pressure | "Revenue grew 3x → [function your product handles] can't keep up manually" |
| **Industry trend / Report** | Category awareness is high, they're thinking about this | "Industry report says [trend] → they're likely evaluating solutions in this space" |
| **Person-level news** | Published an article, spoke at a conference, posted on LinkedIn about a topic you solve | "Posted about [pain] → they're actively thinking about this problem" |

#### Question 2: "What's the specific angle?"

Craft a one-sentence connection:
```
"Because [news event], [company] now needs [specific outcome your product delivers]."
```

Examples:
- "Because Acme just acquired BetaCo, they need to unify two separate CRM systems — exactly what [product] does in 30 days."
- "Because the new HIPAA amendment takes effect in Q3, [company] needs to audit their data handling — [product] automates this."
- "Because [person] just posted about struggling with [pain], they're actively looking for a solution — [product] solves this."

#### Question 3: "How strong is this connection?"

| Strength | Criteria | Example |
|----------|---------|---------|
| **Direct** | The news explicitly describes a problem your product solves | Layoff in your product's department → they need automation |
| **Adjacent** | The news implies a downstream need your product addresses | Market expansion → implies scaling, which implies need for your tool |
| **Thematic** | The news is in the same category as your product's domain | Industry report about the trend you're in → awareness play |

### Output Contract

```
connection_angles: [
  {
    entity: { ... }
    news: { ... }
    icp_assessment: { ... }
    connection: {
      urgency_reason: string          # Why this news creates urgency
      specific_angle: string          # One-sentence connection
      connection_strength: "direct" | "adjacent" | "thematic"
      timing_note: string             # How time-sensitive this outreach is
      recommended_framework: string   # Which email framework fits best
    }
  }
]
```

### Framework Selection Based on Connection Strength

| Connection Strength | Recommended Framework | Why |
|--------------------|----------------------|-----|
| **Direct** | **Signal-Proof-Ask** | The news IS the hook — reference it directly, show proof, ask |
| **Adjacent** | **PAS** | Problem (implied by the news) → Agitate (what happens if they don't act) → Solve |
| **Thematic** | **AIDA** | Attention (news reference) → Interest (how it relates to them) → Desire (your product) → Action |

### Human Checkpoint

```
## Connection Angles

### Direct Connections (X entities) — Act quickly
| Entity | News | Angle | Timing |
|--------|------|-------|--------|
| Acme Corp | Acquired BetaCo | "Need to unify CRM systems — [product] does this in 30 days" | This week (integration planning starts immediately) |

### Adjacent Connections (X entities)
| Entity | News | Angle | Timing |
|--------|------|-------|--------|
| MedTech Inc | Expanding to EMEA | "Localized [function] becomes a requirement — [product] supports 15 languages" | This month |

### Thematic Connections (X entities)
| Entity | News | Angle | Timing |
|--------|------|-------|--------|
| HealthCo | Industry report on [trend] | "They're likely evaluating [category] solutions" | Flexible |

Approve these angles before we find contacts?
```

---

## Step 4: Find Relevant People

**Purpose:** For each qualified entity with a connection angle, find the right people to contact.

### Input Contract

```
connection_angles: [...]              # From Step 3 output
buyer_titles: string[]                # From config
champion_titles: string[]             # From config
user_titles: string[]                 # From config
max_contacts_per_company: integer     # Default: 3-5
```

### Process

1. **If the entity is already a person** (Mode C or person mentioned in news):
   - They're the primary contact. Still find 1-2 additional contacts at their company (buyer if they're a champion, champion if they're a buyer) for multi-threading.

2. **If the entity is a company:**
   - Use configured `contact_tool` to find people matching `buyer_titles`, `champion_titles`, `user_titles`
   - Prioritize people whose role is closest to the news event:

   | News Category | Prioritize These Contacts |
   |--------------|--------------------------|
   | Regulation / Compliance | Legal, Compliance, Operations leadership |
   | Acquisition / Merger | COO, CTO, VP Operations, Integration leads |
   | Market expansion | VP Sales, VP Marketing, Country/Regional leads |
   | Cost cutting / Layoffs | COO, CFO, VP Operations |
   | Product launch | CTO, VP Product, VP Engineering |
   | Crisis / Incident | CISO, VP Engineering, CTO (for security), CEO/COO (for operational) |
   | General growth | Default to `buyer_titles` from config |

3. **For each contact, note their relevance to the news:**
   - Are they directly affected by the news? (Their department, their function)
   - Are they the decision-maker for the response to this news?
   - Are they the person who will feel the pain this news creates?

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
      news_relevance: string         # Why THIS person for THIS news
    }
    company: {
      name: string
      domain: string
    }
    connection: {
      specific_angle: string
      connection_strength: string
      urgency_reason: string
    }
    news: {
      headline: string
      event_category: string
      source_url: string | null
    }
  }
]
```

### Human Checkpoint

```
## Contacts Found

### Acme Corp — "Acquired BetaCo" (Direct connection)
| Name | Title | Role | Why This Person |
|------|-------|------|----------------|
| Sarah Kim | COO | Buyer | Owns post-acquisition integration |
| David Park | VP Operations | Champion | Will manage unified workflows |
| Amy Chen | Director of Sales Ops | User | Directly affected by CRM unification |

### MedTech Inc — "Expanding to EMEA" (Adjacent connection)
| ... |

Total: X contacts across Y companies

Approve before we draft emails?
```

---

## Step 5: Draft Personalized Outreach

**Purpose:** Draft outreach where the news event is the hook, your product is the solution, and the email demonstrates you understand their specific situation. Pure LLM reasoning — inherently tool-agnostic.

### Input Contract

```
contacts: [...]                       # From Step 4 output
your_company: {
  description: string
  pain_point: string
  product_outcomes: string[]
  proof_points: string[]
}
sequence_config: {
  touches: integer                    # Default: 3
  timing: integer[]                   # Default varies by connection strength (see below)
  tone: string                       # Default: "casual-direct"
  cta: string                       # Default: "15-min call"
}
```

### Process

1. **Adjust sequence timing by connection strength:**

   | Strength | Timing | Rationale |
   |----------|--------|-----------|
   | **Direct** | Day 1 / 3 / 7 | Urgency is real — they're actively dealing with this |
   | **Adjacent** | Day 1 / 5 / 12 | Standard timing — urgency is implied, not immediate |
   | **Thematic** | Day 1 / 7 / 14 | Slower cadence — this is awareness, not crisis response |

2. **Build the email around the news, not the product:**

   The news is the subject. Your product is the punchline. Never lead with the product.

   | Element | Source | How to Use |
   |---------|--------|-----------|
   | News hook | Step 1 `news.headline` | Open with what happened — show you're informed |
   | Impact on them | Step 3 `connection.urgency_reason` | Explain what this means for their specific role |
   | Your angle | Step 3 `connection.specific_angle` | Connect the dots to your product naturally |
   | Proof | Config `proof_points` | Show a peer who faced a similar situation |
   | CTA | Config | Low-friction ask |

3. **Email structure by connection strength:**

   **Direct connection (Signal-Proof-Ask):**
   ```
   Hook: Reference the specific news event
   Impact: What this means for them (1 sentence)
   Proof: A peer who faced the same situation and used your product
   Ask: Soft CTA
   ```

   **Adjacent connection (PAS):**
   ```
   Problem: The downstream challenge the news creates
   Agitate: What happens if they don't address it (1 sentence)
   Solve: How your product helps, with a proof point
   Ask: Soft CTA
   ```

   **Thematic connection (AIDA):**
   ```
   Attention: Reference the news/trend
   Interest: How it relates to their company specifically
   Desire: What your product does in this context
   Action: Soft CTA
   ```

4. **Personalization layers:**

   | Layer | What Gets Personalized | Source |
   |-------|----------------------|--------|
   | News reference | The specific event and its relevance | Step 1 news data |
   | Company context | What their company does, their industry, their situation | Step 2 ICP research |
   | Role context | Why THIS person cares about this news | Step 4 `news_relevance` |
   | Your company fit | How your product specifically helps in this scenario | Step 3 connection angle |

5. **Follow `email-drafting` skill hard rules.** Additionally:
   - **Never sensationalize negative news.** If the signal is a layoff, breach, or crisis, be empathetic, not opportunistic. "I know this is a challenging time" not "Your layoffs mean you need our tool!"
   - **Don't pretend you just happened to see the news.** Be direct: "Saw the news about [event]" not "I came across an interesting article."
   - **If the news is about a crisis, wait 48-72 hours before reaching out.** Immediate outreach during a crisis looks predatory.

### Output Contract

```
email_sequences: [
  {
    contact: { full_name, email, title, company_name, role_type, news_relevance }
    news_context: { headline, event_category, source_url }
    connection: { specific_angle, connection_strength }
    sequence: [
      {
        touch_number: integer
        send_day: integer
        subject: string
        body: string
        framework: string
        personalization_elements: {
          news_reference: string       # How the news was referenced
          company_context: string      # How their company situation was used
          role_context: string         # How their specific role was leveraged
          product_connection: string   # How the product was positioned
        }
        word_count: integer
      }
    ]
  }
]
```

### Human Checkpoint

Present samples grouped by connection strength:

```
## Sample Outreach for Review

### Direct Connection: Sarah Kim, COO @ Acme Corp
News: Acme acquired BetaCo | Angle: CRM unification | Framework: Signal-Proof-Ask

**Touch 1 — Day 1**
Subject: Unifying Acme + BetaCo systems
> Hi Sarah — saw the BetaCo acquisition. Congrats. The integration
> sprint typically surfaces a CRM unification challenge fast —
> two systems, overlapping data, different workflows.
>
> [Peer company] faced the same thing after their acquisition last year.
> [Product] had both systems unified in 30 days. Happy to share how.
>
> Worth a 15-minute call?

**Touch 2 — Day 3**
> [New angle — data migration complexity, with a specific metric]

**Touch 3 — Day 7**
> [Breakup with offer to share the integration playbook]

---

### Adjacent Connection: Dr. Lee, VP Product @ MedTech Inc
News: EMEA expansion | Angle: Localization needs | Framework: PAS

**Touch 1 — Day 1**
Subject: EMEA expansion + [function] localization
> [full email]

---

Approve these samples? I'll generate the rest in the same style.
```

---

## Step 6: Handoff to Outreach

Identical to the other signal composites. Package contacts + email sequences for the configured outreach tool.

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
Signal type: News-triggered
News event: [headline]
Connection strengths: X direct, Y adjacent, Z thematic
Contacts: N people across M companies
Sequence: 3 touches (timing varies by connection strength)

Ready to launch?
```

---

## Execution Summary

| Step | Tool Dependency | Human Checkpoint | Typical Time |
|------|----------------|-----------------|--------------|
| 0. Config | None | First run only | 5 min (once) |
| 1. Parse & Extract | Web fetch (for URLs) or none (for text) | Review extracted entities | 2-3 min |
| 2. Qualify ICP | Web search (for company research) | Approve qualified list | 2-3 min |
| 3. Connection Angle | None (LLM reasoning) | Approve angles + strength ratings | 3-5 min |
| 4. Find People | Configurable (Apollo, LinkedIn, etc.) | Approve contact list | 2-3 min |
| 5. Draft Emails | None (LLM reasoning) | Review samples, iterate | 5-10 min |
| 6. Handoff | Configurable (Smartlead, CSV, etc.) | Final launch approval | 1 min |

**Total human review time: ~15-25 minutes**

---

## Key Difference from Other Signal Composites

| Dimension | Structured Signals (Funding, Hiring, etc.) | News Signal |
|-----------|-------------------------------------------|-------------|
| **Signal type** | Predefined, narrow | Arbitrary, broad — anything can be a trigger |
| **Detection** | Targeted search (job boards, funding databases) | Open-ended (any news source) |
| **Extra step** | — | Step 3: Connection Angle identification. Other composites have obvious connections (funding = money to spend). News requires explicit reasoning about WHY this event matters for your product. |
| **Input modes** | Companies in → signals out | Three modes: News→Companies, Companies→News, People→News |
| **Timing** | Predictable windows (post-raise, pre-hire) | Varies wildly by event type — crisis = 48hr delay, trend = flexible |
| **Sensitivity** | Generally positive (funding, hiring, growth) | Can be negative (layoffs, crises, failures). Requires empathy calibration. |

---

## Sensitivity Guidelines

Some news events require careful tone calibration:

| Event Type | Tone | What NOT to Do |
|-----------|------|---------------|
| **Layoffs** | Empathetic. "I know this is a tough time." | Don't say "your layoffs mean you need us!" |
| **Data breach / Security incident** | Helpful, not salesy. "If you need help with [specific thing]." | Don't pile on or blame. Don't reach out same-day. |
| **Earnings miss / Revenue decline** | Efficiency-focused. "Do more with what you have." | Don't reference the miss directly in the subject line. |
| **Executive departure / Fired CEO** | Skip the drama entirely. Focus on the new leader or the company's direction. | Don't mention the departure unless it's public and amicable. |
| **Lawsuit / Legal trouble** | Generally avoid unless your product directly helps with compliance/legal. | Don't reference the lawsuit. It looks ambulance-chasey. |
| **Product failure / Recall** | Only reach out if you have a direct solution. | Don't gloat or compare. |

**Rule of thumb:** If you wouldn't bring it up in a face-to-face conversation at a conference, don't put it in a cold email.

---

## Tips

- **Direct connections are rare but powerful.** Most news creates adjacent or thematic connections. When you find a direct one, prioritize it — these convert at 2-3x the rate.
- **Speed matters for direct connections.** The first vendor to reference a relevant news event looks informed. The fifth looks like they're running the same playbook.
- **Don't force weak connections.** If you can't articulate the angle in one sentence, the connection is too weak. Drop it.
- **News about competitors is gold.** If a competitor raises funding, gets acquired, has a security breach, or launches a product — their customers and prospects are suddenly open to conversations.
- **Negative news requires a 48-72 hour cooling period.** Reaching out the day of a layoff or breach is predatory. Wait, then lead with empathy.
- **Industry reports and trend pieces make great thematic triggers.** "The Gartner report on [category] just dropped — here's what it means for [company]" positions you as thoughtful, not reactive.
- **Combine with other signal composites.** News often contains embedded signals: an acquisition article mentions the acquiring company is hiring 50 people (hiring signal), a new CEO is named (leadership change signal), or the company just raised funding (funding signal). Route these to the appropriate specialist composite for better outreach.
