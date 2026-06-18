---
name: sales-call-prep
version: 1.1.0
description: >
  Pre-sales-call intelligence composite. Deep dives on the person AND their company
  before a sales call, then maps findings to your product to generate talking points,
  objection prep, and a call strategy. Goes beyond generic attendee research — this
  is sales-specific intelligence that helps SDRs, AEs, and founders walk into calls
  with a plan. Tool-agnostic — works with any CRM, research source, and calendar.
tags: [research]
---

# Sales Call Prep

The pre-call intelligence report that turns a 50/50 sales call into an 80/20 one. Researches the company (with a sales lens — not Wikipedia facts, but buying signals, pain indicators, competitive landscape, and budget context), researches the person (not just their bio, but their authority level, priorities, likely objections, and what they care about), then maps everything to your product to generate a specific call strategy.

**What makes this different from `meeting-brief`:**

| Dimension | `meeting-brief` | `sales-call-prep` |
|-----------|-----------------|-------------------|
| Focus | Who is this person? | How do I sell to this person? |
| Company research | Basic overview | Sales-lens: pain signals, budget indicators, competitive stack, decision process |
| Person research | LinkedIn + GitHub + news | Authority mapping, buying style, priorities, likely objections |
| Product connection | None | Maps your product's value to their specific situation |
| Output | Background brief | Call strategy with talk track, questions, and objection prep |
| Audience | Anyone with a meeting | SDR, AE, founder walking into a sales call |

## When to Auto-Load

Load this composite when:
- User says "prep me for my sales call", "call prep for [company]", "research [person] before our demo"
- User says "I have a call with [person] at [company] tomorrow", "meeting prep for a prospect"
- User has an upcoming meeting with a prospect (not an internal meeting, not a customer check-in)
- An upstream workflow (meeting lifecycle, daily BDR rhythm) triggers call prep for sales meetings

---

## Step 0: Configuration (One-Time Setup)

On first run, collect and store these preferences. Skip on subsequent runs.

### Your Product Context

| Question | Purpose | Stored As |
|----------|---------|-----------|
| What does your company do? (2-3 sentences) | Frame product-to-prospect mapping | `company_description` |
| What problem do you solve? | Identify if the prospect has this problem | `pain_point` |
| Who is your ideal buyer? (title, department) | Map to the person on the call | `ideal_buyer` |
| What are your top 3 proof points? (customer, metric, result) | Arm the seller with specific evidence | `proof_points` |
| What are the top 5 objections you hear? And how do you handle each? | Pre-load objection handling | `common_objections` |
| What competitors do you run into? And what's your positioning against each? | Competitive prep | `competitors` |
| What's your pricing model? (ballpark) | Budget qualification context | `pricing_model` |
| What does your typical sales process look like? (stages, timeline) | Calibrate call objectives by stage | `sales_process` |
| What discovery questions do you typically ask? | Augment with prospect-specific questions | `discovery_questions` |

### Data Source Config

| Question | Options | Stored As |
|----------|---------|-----------|
| Where do you track deals? | Salesforce / HubSpot / Pipedrive / Close / Supabase / None | `crm_tool` |
| Where do you track outreach? | Smartlead / Instantly / Outreach / None | `outreach_tool` |

**Store config** in the current working directory or wherever the user prefers.

---

## Step 1: Gather Context

**Purpose:** Understand what this meeting is, who's attending, and what stage the deal is at. Pull any existing data from CRM/outreach history.

### Input Contract

```
meeting_input: {
  # Option A: Calendar-driven (meeting already scheduled)
  calendar_event: {
    title: string
    date: string
    time: string
    attendees: [ { name: string, email: string } ]
    description: string | null
    meeting_link: string | null
  }

  # Option B: Manual input (user tells you who the call is with)
  manual: {
    person_name: string
    person_title: string | null
    person_email: string | null
    person_linkedin: string | null
    company_name: string
    company_domain: string | null
    meeting_type: string | null       # "discovery", "demo", "follow-up", "negotiation", etc.
    notes: string | null              # Any context the user provides
  }
}
```

### Process

1. **Identify the prospect(s)** from calendar or manual input. Filter out internal team members.

2. **Check ALL prior interaction sources** (critical — do this before any web research):

   The goal is to reconstruct a complete interaction timeline before the call. Walking into a meeting without knowing you've already emailed someone, had a deal in pipeline, or that a teammate talked to their colleague is a credibility killer. Check every available source.

   #### A) CRM Records (Attio, Salesforce, HubSpot, Pipedrive, etc.)

   Check for BOTH the person AND their company. Pull:

   | What to Check | What to Pull | Why It Matters |
   |---------------|-------------|----------------|
   | **Company record** | Does the company exist in your CRM? What lists is it on? | Shows if they're already a prospect, customer, or cold |
   | **Contact record** | Does THIS person exist? Are there other contacts at the company? | Tells you if a colleague already engaged with you |
   | **Active deals** | Any open deal for this company? Stage, value, owner, age? | You might already be mid-cycle with them — don't restart the conversation |
   | **Closed deals** | Any won or lost deals? If lost, what was the reason? | Lost deals = you know their objections. Won deals = upsell conversation. |
   | **Deal notes** | Notes from previous calls, meetings, or interactions | Read every note — they contain gold for personalization |
   | **Deal history** | Stage changes, timeline, velocity | Shows how fast (or slow) they move |
   | **Other contacts at company** | Names, titles, roles of other people you've talked to | Reference them: "I was speaking with [colleague] about..." |
   | **Comments / activities** | Any logged calls, emails, tasks, or comments on their record | May contain context that didn't make it into deal notes |

   #### B) Outreach / Sequencing Tool (SmartLead, Instantly, Outreach, Lemlist, etc.)

   Search by email AND by name. Pull:

   | What to Check | What to Pull | Why It Matters |
   |---------------|-------------|----------------|
   | **Campaign membership** | Were they in a campaign? Which one? When? | You already reached out — don't pretend this is a cold intro |
   | **Emails sent** | Exact subject lines and email bodies you sent them | Know what you said so you don't repeat yourself or contradict it |
   | **Their reply** | Did they reply? What did they say? Full reply text. | Their exact words are the best conversation opener: "You mentioned X..." |
   | **Lead category** | Interested / Not interested / Out of office / Bounced / etc. | If they were marked "interested," you know their temperature |
   | **Trigger signal** | What signal sourced this outreach? (hiring, funding, leadership change) | Reference the original signal: "When we first reached out, it was because [signal]..." |
   | **Sequence position** | Which email in the sequence did they respond to (or stop at)? | Tells you what messaging resonated vs. fell flat |
   | **Email account used** | Which sender mailbox was used? | Know which "version of you" they interacted with |

   #### C) Other Interaction Sources

   Check any additional places where prior contact may have occurred:

   | Source | What to Check |
   |--------|---------------|
   | **Client notes file** | Any existing notes — may reference past conversations, call summaries, or decisions |
   | **Previous content/outputs** | Past call preps, outreach drafts, or research that included this person or company |
   | **Calendar** | Previous meetings with this person or company |
   | **LinkedIn messages** | Direct messages or InMail exchanges (ask user if they recall any) |
   | **Referral context** | How did this meeting come about? Warm intro from whom? Ask user. |
   | **Shared Slack/email threads** | Any back-channel conversations about this prospect |

   #### D) Compile Interaction Timeline

   After checking all sources, build a chronological timeline of every touchpoint:

   ```
   interaction_timeline: [
     { date: "2026-01-15", type: "outreach_sent", detail: "Email 1 of hiring-signal campaign. Subject: 'The new CCO mandate'" },
     { date: "2026-01-18", type: "reply_received", detail: "Replied: 'Interesting, let's chat next month'" },
     { date: "2026-02-01", type: "deal_created", detail: "Deal created in Attio. Stage: Meeting booked. Value: $36K" },
     { date: "2026-02-10", type: "call_completed", detail: "Discovery call. Notes: 'Interested in outbound automation, evaluating Clay'" },
     { date: "2026-02-10", type: "deal_stage_change", detail: "Stage moved to Evaluation" },
   ]
   ```

   **This timeline goes directly into the 30-Second Brief and Call Strategy.** If you have prior interactions, the call type, opening line, and discovery questions all change:

   | Prior Interaction | How It Changes the Call |
   |-------------------|----------------------|
   | No prior interaction | True cold discovery — qualify from scratch |
   | Outreach sent, no reply | Warm-ish — they've seen your name. Reference the email: "I sent you a note about X a few weeks ago..." |
   | Outreach sent, they replied positively | Warm — pick up where the conversation left off. Don't re-pitch. |
   | Outreach sent, they replied negatively | Handle carefully — they already said no. Understand why before re-engaging. |
   | Active deal in CRM | You're mid-cycle — this is a follow-up, not a discovery call. Read all notes. |
   | Lost deal in CRM | Re-engagement — acknowledge the history: "I know we talked back in [month] and the timing wasn't right..." |
   | Colleague already engaged | Multi-thread — reference the colleague: "I've been working with [name] on..." |

3. **Determine call type and objective:**

   | Call Type | How to Detect | Default Objective |
   |-----------|--------------|-------------------|
   | **Cold discovery** | No prior deal, first meeting | Qualify: Do they have the problem? Budget? Authority? Timeline? |
   | **Warm discovery** | They replied to outreach positively | Qualify + build rapport. They already showed interest — figure out why. |
   | **Demo** | Post-qualification, scheduled demo | Show value. Map product to their specific pain. Get next step. |
   | **Follow-up** | Post-demo, they're evaluating | Handle objections. Introduce new proof. Advance to proposal. |
   | **Negotiation** | Proposal sent, discussing terms | Close. Handle final objections. Align on timeline and terms. |
   | **Champion call** | Internal champion, not decision maker | Arm the champion. Give them ammunition to sell internally. |
   | **Executive meeting** | VP+ or C-suite involved | Be strategic, not tactical. ROI and vision, not features. |

### Output Contract

```
meeting_context: {
  call_type: string
  call_objective: string
  prospect: {
    name: string
    title: string | null
    email: string | null
    linkedin_url: string | null
    company: string
    company_domain: string | null
  }
  prior_interactions: {
    has_prior_contact: boolean           # Critical flag — changes the entire call approach
    interaction_timeline: [              # Chronological list of all touchpoints
      {
        date: string
        type: "outreach_sent" | "reply_received" | "deal_created" | "deal_stage_change" |
              "call_completed" | "note_added" | "linkedin_message" | "referral" | "other"
        source: "crm" | "outreach_tool" | "email" | "linkedin" | "notes" | "calendar" | "other"
        detail: string                   # What happened, in one sentence
      }
    ]
    crm_context: {
      company_record_exists: boolean
      contact_record_exists: boolean
      active_deal: {
        stage: string
        age_days: integer
        amount: number | null
        owner: string | null
        notes: string[]
      } | null
      closed_deals: [ { outcome: "won" | "lost", amount: number, reason: string | null } ]
      other_contacts: [ { name: string, title: string } ]
      comments_and_activities: string[]
    } | null
    outreach_context: {
      campaign_name: string | null
      campaign_status: string | null
      emails_sent: integer
      emails_sent_detail: [ { seq_number: integer, subject: string, date: string } ]
      their_reply: string | null         # Full reply text
      reply_date: string | null
      lead_category: string | null       # Interested, Not Interested, etc.
      trigger_signal: string | null      # What signal sourced the outreach
    } | null
    other_context: {
      client_notes_mentions: string[]    # Relevant mentions from notes.md
      previous_outputs: string[]         # Previous call preps, research, etc.
      referral_source: string | null     # How this meeting came about
    } | null
  }
  additional_attendees: [ { name: string, title: string } ] | null
}
```

---

## Step 2: Company Deep Dive

**Purpose:** Research the prospect's company with a sales lens. Not a Wikipedia summary — focus on signals that indicate need, budget, urgency, and competitive landscape.

### Input Contract

```
prospect: { company, company_domain, ... }  # From Step 1
your_company: { ... }                        # From config
```

### Process

Research across seven dimensions. Use web search (always available) as the primary tool.

#### A) Company Overview (Quick Context)

| What to Find | Where to Look | Why It Matters for the Call |
|-------------|--------------|---------------------------|
| What they do (1-2 sentences) | Website, Crunchbase, LinkedIn | Sets the context for everything else |
| Industry / vertical | Website | Determines which proof points to use |
| Company size (employees) | LinkedIn, Crunchbase | Maps to pricing tier and complexity |
| HQ location | Website | Timezone, regional context |
| Founded year | Crunchbase | Maturity indicator |
| Business model (B2B/B2C/marketplace) | Website | Affects how they think about tools |

#### B) Financial & Growth Signals

| What to Find | Where to Look | Why It Matters for the Call |
|-------------|--------------|---------------------------|
| Funding history | Crunchbase, web search | Indicates budget availability and growth stage |
| Last funding date + amount | Crunchbase, press releases | Recent raise = fresh budget, evaluating vendors |
| Revenue estimate (if public or disclosed) | Press, SEC filings, web search | Budget calibration |
| Growth trajectory (hiring velocity, office expansion) | LinkedIn, job boards | Growing = buying. Flat/contracting = harder sell. |
| Recent layoffs | Web search, news | Budget pressure — position as cost-saving, not cost-adding |

#### C) Pain & Need Indicators

| What to Find | Where to Look | Why It Matters for the Call |
|-------------|--------------|---------------------------|
| Job postings related to your product's domain | LinkedIn Jobs, Indeed | Hiring for the role = they have the problem you solve |
| Complaints/challenges on social media | LinkedIn posts, Twitter, Reddit | Direct evidence of pain you can reference |
| Industry-specific challenges | Industry reports, web search | Common pain points they're likely facing |
| Recent company news that implies need | Press, blog, LinkedIn | Expansion, new product, compliance change = new needs |
| Product reviews of their product (if applicable) | G2, Capterra, app stores | Their customers' complaints may point to needs your product addresses |

#### D) Technology & Competitive Stack

| What to Find | Where to Look | Why It Matters for the Call |
|-------------|--------------|---------------------------|
| Current tools in your category | Job postings (mentioning tools), website source, BuiltWith | Know what you're displacing or complementing |
| Competitor's product in use? | Web search, job postings, LinkedIn mentions | Prepare competitive positioning |
| Tech stack (relevant parts) | Job postings, website | Integration opportunities or blockers |
| Vendor evaluation signals | G2 comparisons, LinkedIn research posts | Actively shopping = high intent |

#### E) Decision-Making Landscape

| What to Find | Where to Look | Why It Matters for the Call |
|-------------|--------------|---------------------------|
| Organizational structure | LinkedIn, website team page | Who else is involved in the decision? |
| Other stakeholders (above/below the prospect) | LinkedIn | Who do they report to? Who reports to them? |
| Recent leadership changes | LinkedIn, web search | New leader = re-evaluating stack |
| Company culture signals | Glassdoor, careers page, LinkedIn | Fast-moving vs. bureaucratic affects sales cycle |
| Procurement style | Company size indicator | SMB = founder decides. Enterprise = procurement process. |

#### F) Relationship Mapping

| What to Find | Where to Look | Why It Matters for the Call |
|-------------|--------------|---------------------------|
| Mutual connections | LinkedIn | Warm intro potential, reference-ability |
| Past interactions with your company | CRM, outreach history | Don't repeat what they already know |
| Customer of a partner? | Partner records | Potential warm angle |
| In your existing customer's network? | LinkedIn, web search | "Your peer [company] uses us" |

#### G) Recent Company News (Last 90 Days)

| What to Find | Where to Look | Why It Matters for the Call |
|-------------|--------------|---------------------------|
| Product launches | Blog, press | New products = new ops challenges |
| Partnerships announced | Press, LinkedIn | New partnerships = integration needs |
| Awards / recognition | Web search | Compliment material, shows what they're proud of |
| Controversies / issues | Web search | Landmines to avoid |
| Earnings / performance | Press, SEC | Business health indicator |

### Output Contract

```
company_research: {
  overview: {
    name: string
    description: string
    industry: string
    employee_count: string
    location: string
    founded: string
    business_model: string
  }
  financial: {
    funding_total: string | null
    last_round: { amount: string, stage: string, date: string } | null
    revenue_estimate: string | null
    growth_signal: "growing" | "stable" | "contracting" | "unknown"
  }
  pain_indicators: [
    { signal: string, source: string, relevance_to_product: string }
  ]
  tech_stack: {
    known_tools: string[]
    competitor_in_use: string | null
    integration_opportunities: string[]
  }
  decision_landscape: {
    decision_maker_likely: string     # Title of likely decision maker
    other_stakeholders: string[]
    procurement_style: "founder_led" | "committee" | "procurement" | "unknown"
    estimated_sales_cycle: string
  }
  recent_news: [
    { headline: string, date: string, relevance: string }
  ]
  relationship_map: {
    mutual_connections: string[]
    peer_customers: string[]          # Your customers in their network
    past_interactions: string | null
  }
}
```

---

## Step 3: Person Deep Dive

**Purpose:** Research the specific person on the call. Not just their bio — understand their authority, priorities, communication style, and likely concerns.

### Input Contract

```
prospect: { name, title, email, linkedin_url, company }  # From Step 1
company_research: { ... }                                  # From Step 2
your_company: { ... }                                      # From config
```

### Process

#### A) Professional Profile

| What to Find | Where to Look | Why It Matters |
|-------------|--------------|----------------|
| Current title + department | LinkedIn | Authority level, budget ownership |
| Time in current role | LinkedIn | <6 months = new, evaluating stack. 2+ years = established, harder to displace incumbent |
| Career trajectory | LinkedIn experience | Moving up fast = ambitious, wants tools to accelerate. Lateral = stable, risk-averse. |
| Previous companies | LinkedIn | Industry experience, tools they've used before |
| Education | LinkedIn | Conversation starter, common ground |
| Skills / endorsements | LinkedIn | Technical vs. business orientation |

#### B) Authority & Buying Power Assessment

| Factor | How to Assess | Implication |
|--------|--------------|-------------|
| **Title level** | VP+ = likely has budget. Director = may have budget. Manager = influencer, not buyer. IC = user/champion. | Determines whether to talk ROI (buyer) or workflow (user) |
| **Department** | Does their department buy your product? | If they're in engineering and you sell to sales, they might be evaluating for someone else |
| **Reports to whom** | LinkedIn org structure | The person above them is likely the decision maker if they're not |
| **Team size** | LinkedIn, company page | Larger team = more at stake, bigger deal potential |
| **Budget indicators** | Title + company size + funding | "Does this person plausibly control the budget for our product?" |

**Authority classification:**

| Level | Who | How to Sell |
|-------|-----|-----------|
| **Economic buyer** | VP+, C-suite, founder | Talk ROI, strategic value, competitive advantage. Don't demo features. |
| **Technical buyer** | Director, senior manager, tech lead | Talk capabilities, integrations, implementation. Demo the product. |
| **Champion** | Manager, senior IC | Talk workflow improvement, daily life impact. Help them build the internal case. |
| **User** | IC, operator | Talk ease of use, time savings, learning curve. Get them excited to use it. |
| **Evaluator** | Analyst, consultant | Talk data, comparisons, proof points. Be thorough and transparent. |

#### C) What They Care About

| What to Find | Where to Look | Why It Matters |
|-------------|--------------|----------------|
| Recent LinkedIn posts | LinkedIn activity | What are they thinking about? What problems are they voicing? |
| Articles they've shared | LinkedIn shares | What topics interest them? |
| Comments they've made | LinkedIn engagement | What opinions do they hold? |
| Conference talks / webinars | Web search, YouTube | What are they publicly expert in? |
| Published content (blog, podcast) | Web search | Deep insight into their thinking |

#### D) Communication Style Signals

| Signal | How to Detect | How to Adapt |
|--------|--------------|-------------|
| **Data-driven** | Posts include numbers, references studies, shares reports | Lead with metrics and ROI. Bring a business case. |
| **Visionary** | Posts about trends, future of industry, big ideas | Lead with vision and strategic impact. Don't get stuck in details. |
| **Operational** | Posts about process, efficiency, team management | Lead with workflow improvement and implementation ease. |
| **Skeptical** | Posts questioning tools/trends, contrarian takes | Anticipate tough questions. Lead with proof, not claims. |
| **Relationship-oriented** | Posts about people, culture, team wins | Spend time on rapport. Don't rush to the pitch. |

#### E) Likely Objections (Predicted)

Based on their profile, company situation, and your common objections:

| Their Situation | Likely Objection | Pre-Load |
|----------------|-----------------|----------|
| Using a competitor | "We already have [tool]" | Prepare competitive positioning, switching cost analysis |
| Recently hired | "I'm still getting up to speed" | Position as "quick win for your first 90 days" |
| Small team / early stage | "We can't afford this right now" | Prepare ROI framing, start small options |
| Large enterprise | "Our procurement process takes 6 months" | Prepare for a longer cycle, ask about process early |
| Technical role | "Does it integrate with [our stack]?" | Prepare integration story |
| Recently burned by a vendor | "We tried something like this before" | Prepare "what's different" narrative |

### Output Contract

```
person_research: {
  profile: {
    name: string
    title: string
    department: string
    time_in_role: string
    previous_roles: [ { title: string, company: string, duration: string } ]
    education: string | null
  }
  authority: {
    level: "economic_buyer" | "technical_buyer" | "champion" | "user" | "evaluator"
    budget_authority: "confirmed" | "likely" | "unlikely" | "unknown"
    reports_to: string | null
    team_size: string | null
    assessment: string                # One-sentence assessment of their buying power
  }
  interests_and_priorities: {
    recent_posts_summary: string      # What they've been posting/sharing about
    key_topics: string[]              # Themes they care about
    public_opinions: string[]         # Positions they've taken publicly
    conversation_hooks: string[]      # Specific things to reference in the call
  }
  communication_style: {
    primary_style: string             # "data-driven", "visionary", "operational", "skeptical", "relationship-oriented"
    how_to_adapt: string              # Specific guidance
  }
  predicted_objections: [
    {
      objection: string
      likelihood: "high" | "medium" | "low"
      reasoning: string               # Why we predict this
      prepared_handle: string          # How to address it
    }
  ]
}
```

---

## Step 4: Product-to-Prospect Mapping

**Purpose:** This is the core value-add. Map your product's capabilities to this specific prospect's situation. Not generic value props — specific connections based on the research. Pure LLM reasoning.

### Input Contract

```
company_research: { ... }            # From Step 2
person_research: { ... }             # From Step 3
meeting_context: { ... }             # From Step 1
your_company: {
  description: string
  pain_point: string
  proof_points: string[]
  competitors: [ { name: string, positioning: string } ]
  pricing_model: string
  sales_process: string
  discovery_questions: string[]
}
```

### Process

#### A) Value Mapping

For each pain indicator found in Step 2, map to a specific product capability:

| Their Pain/Need | Your Product's Answer | Proof Point | How to Say It |
|----------------|----------------------|-------------|--------------|
| [pain from research] | [specific capability] | [customer/metric] | [one sentence pitch] |
| [another pain] | [another capability] | [proof] | [pitch] |

Only include pains where there's a genuine connection. Don't force-fit.

#### B) Competitive Positioning (If Relevant)

If they're using or evaluating a competitor:

| Dimension | Competitor | Your Product | How to Frame |
|-----------|-----------|-------------|-------------|
| [key differentiator 1] | [their approach] | [your approach] | [framing] |
| [key differentiator 2] | [their approach] | [your approach] | [framing] |

**Rules:**
- Never trash the competitor. Acknowledge what they do well. Differentiate on where you're stronger.
- If you don't know the competitor, ask the prospect: "What do you like about [tool]? What's missing?"
- Frame as "different approach" not "we're better"

#### C) Relevant Proof Points

Select 2-3 proof points most relevant to THIS prospect:

| Proof Point | Why It's Relevant to Them |
|------------|--------------------------|
| "[Customer] saw X% improvement" | Same industry / same size / same problem |
| "[Metric] in [timeframe]" | Matches their pain indicator |
| "[Company] switched from [competitor]" | They're using the same competitor |

**Selection criteria:** Same industry > same size > same problem > same competitor > general. Always choose the most specific proof point available.

#### D) Risk Factors & Landmines

Things that could derail the call:

| Risk | Source | Mitigation |
|------|--------|-----------|
| [risk — e.g., "just signed 2-year contract with competitor"] | [where you found this] | [how to handle] |
| [risk — e.g., "company culture is anti-vendor"] | [source] | [how to handle] |
| [risk — e.g., "recent bad press — sensitive topic"] | [source] | [avoid this topic] |

### Output Contract

```
product_mapping: {
  value_connections: [
    {
      their_pain: string
      your_answer: string
      proof_point: string
      how_to_say_it: string
      confidence: "strong" | "moderate" | "speculative"
    }
  ]
  competitive_positioning: {
    competitor_in_play: string | null
    differentiators: [ { dimension: string, their_approach: string, your_approach: string, framing: string } ]
    competitive_advice: string        # One paragraph on how to handle the competitive dynamic
  } | null
  relevant_proof_points: [
    { proof: string, why_relevant: string }
  ]
  risk_factors: [
    { risk: string, source: string, mitigation: string }
  ]
}
```

---

## Step 5: Generate Call Strategy & Brief

**Purpose:** Synthesize everything into a single pre-call document with: executive brief, call strategy, talk track, discovery questions, and objection prep.

### Input Contract

```
meeting_context: { ... }              # From Step 1
company_research: { ... }            # From Step 2
person_research: { ... }             # From Step 3
product_mapping: { ... }             # From Step 4
your_company: { ... }                # From config
```

### Report Structure

```
# Sales Call Prep: [Person Name] @ [Company]
**Date:** [meeting date/time] | **Call type:** [discovery/demo/follow-up/etc.]
**Prepared for:** [user's name/role]

---

## 30-Second Brief

[4-5 bullet points. Everything you need if you have 30 seconds before the call.]

- **Who:** [Name], [Title] at [Company] — [authority level]. [Time in role].
- **What they do:** [Company] is a [1-sentence description]. [Size, industry, stage].
- **Prior interaction:** [CRITICAL — "No prior contact" OR "We emailed them on [date] about [topic], they replied [summary]" OR "Active deal in [stage] since [date]" OR "Lost deal [date] — reason: [reason]". This single line changes the entire call approach.]
- **Why this call:** [How this meeting came about — outreach reply, inbound, referral, etc.]
- **Key signal:** [The one thing that makes this call timely — funding, hiring, pain post, etc.]
- **Your angle:** [One sentence on why your product matters to them right now]

---

## Company Intelligence

### Overview
[2-3 sentences on what the company does, their market position, and current trajectory]

### Business Context
| Factor | Detail | Sales Relevance |
|--------|--------|----------------|
| Size | [employees] | [pricing tier / complexity indicator] |
| Funding | [last round] | [budget indicator] |
| Growth | [signal] | [expanding = buying, contracting = cost-cutting] |
| Industry | [vertical] | [which proof points to use] |

### Pain Signals Found
| Signal | Source | Connection to Your Product |
|--------|--------|--------------------------|
| [pain] | [where you found it] | [how your product addresses this] |
| [pain] | [source] | [connection] |

### Their Current Stack
| Category | Tool | Implication |
|----------|------|------------|
| [your category] | [competitor or unknown] | [displacement or greenfield opportunity] |
| [adjacent] | [tool] | [integration opportunity] |

### Recent News
| Date | Headline | Relevance |
|------|----------|-----------|
| [date] | [news] | [why it matters for this call] |

---

## Prior Interactions

[If no prior interactions exist, state "No prior contact found across CRM, outreach tools, or other sources. This is a true cold meeting." and move on.]

[If prior interactions exist, this section becomes one of the most important in the brief.]

### Interaction Timeline
| Date | Type | Source | Detail |
|------|------|--------|--------|
| [date] | [outreach_sent / reply / deal / call / etc.] | [CRM / SmartLead / email / etc.] | [What happened] |

### What They Already Know About You
[Based on the outreach and interactions above, summarize what this person already knows about your product/company. This prevents you from re-explaining things they've already heard.]

### What You Already Know About Them
[Based on replies, call notes, CRM notes — summarize what you've learned from prior interactions. These are conversation gold: "Last time we spoke, you mentioned X..."]

### How Prior Interactions Should Shape This Call
[Specific guidance on how to adjust the call approach based on history. Examples:]
- "They replied positively to your hiring-signal outreach — open by referencing that: 'You mentioned you were interested when we first reached out about [topic]...'"
- "Deal has been in Evaluation for 18 days with no movement — this is a re-engagement call, not a discovery call. Ask what's changed since the last conversation."
- "Your colleague [name] already talked to their VP Sales — reference that: 'I know [colleague] has been working with [their VP]...'"
- "They were marked 'Not Interested' in a previous campaign 3 months ago — acknowledge it: 'I know we reached out before and the timing wasn't right. What's different now?'"

---

## Person Intelligence

### Profile
[1-2 paragraphs on who this person is — not their resume, but what makes them tick.
What they care about, what they've been vocal about, what their priorities likely are.]

### Authority Assessment
| Factor | Assessment |
|--------|-----------|
| Authority level | [economic buyer / technical buyer / champion / user] |
| Budget authority | [likely/unlikely] |
| Reports to | [name/title] |
| Decision process | [solo / committee / procurement] |

### Communication Style: [Type]
[2-3 sentences on how to adapt your communication to this person.
E.g., "Lead with data — they post frequently about metrics and ROI.
Don't spend too long on rapport. Get to the numbers quickly."]

### Conversation Hooks
[3-5 specific things you can reference to show you've done your homework]
1. [Their recent post about X — use as an opener or bridge]
2. [A project they led at their previous company]
3. [Something from company news they're likely proud of]
4. [Mutual connection or shared experience]
5. [A comment they made about a problem you solve]

---

## Call Strategy

### Objective
**Primary:** [What you want to achieve in this call — e.g., "Qualify: confirm pain, budget, timeline, authority"]
**Secondary:** [Backup objective — e.g., "If not qualified, get referral to right person"]

### Agenda Suggestion
[A proposed call structure. Adapt to call type.]

| Phase | Time | What to Do |
|-------|------|-----------|
| **Open** | 2 min | [How to open — rapport hook, agenda set] |
| **Discovery / Context** | 10-15 min | [Key questions to ask — see below] |
| **Value / Demo** | 10-15 min | [What to show or discuss — see value connections] |
| **Next Steps** | 3-5 min | [What to propose — see below] |

### Opening Line
> "[Suggested opening — references a conversation hook and sets the agenda naturally.
  E.g., 'Thanks for making time, [Name]. I saw your post about [topic] — that's actually
  a big part of why I wanted to connect. I'd love to learn about how [Company] is
  handling [pain area] and see if what we're building is relevant. Sound good?']"

### Discovery Questions (Prioritized)

**Must-ask** (qualify the deal):
1. [Question that confirms they have the pain your product solves]
2. [Question about how they're handling it today — incumbent tool or manual process?]
3. [Question about timeline — are they actively evaluating or just learning?]
4. [Question about decision process — who else is involved?]
5. [Question about budget — how do they typically buy tools in this category?]

**Should-ask** (deepen the conversation):
6. [Question specific to their company situation from research]
7. [Question about their priorities for the next 6-12 months]
8. [Question that surfaces a pain they might not have articulated]

**Nice-to-ask** (if time allows):
9. [Question about their experience with competitors]
10. [Question about what a successful outcome looks like for them]

### Value Points to Make
[Ordered by relevance to THIS prospect — not your generic pitch deck]

1. **[Value point]** — [How to frame it for this prospect, using their specific situation]
   - Proof: [Relevant proof point]
   - Transition: [How to move from discovery to this point naturally]

2. **[Value point]** — [Framing]
   - Proof: [Proof]

3. **[Value point]** — [Framing]
   - Proof: [Proof]

### Proposed Next Step
[What to suggest at the end of the call, based on call type]

| Call Type | Suggest |
|-----------|---------|
| Discovery (qualified) | "Would it be helpful to see a demo tailored to [their specific use case]? I can have that ready by [date]." |
| Discovery (not sure yet) | "Let me put together a one-pager on how [peer company] handled this. Can I send it over and follow up [date]?" |
| Demo | "Based on what we covered, it sounds like [stakeholder] should probably see this too. Can we set up a follow-up with them?" |
| Follow-up | "I can have a proposal over by [date]. Would it be useful to include [specific thing they asked about]?" |
| Negotiation | "If we can align on [terms], we could have you live by [date]. What does your approval process look like from here?" |

---

## Objection Prep

[Pre-loaded responses for likely objections, ordered by predicted likelihood]

### [Objection 1 — Highest Likelihood]
**They'll say:** "[Exact wording of the objection]"
**Why:** [Why we predict this based on research]
**Handle:**
> "[Suggested response — acknowledge, reframe, proof point]"

### [Objection 2]
**They'll say:** "[Objection]"
**Why:** [Reasoning]
**Handle:**
> "[Response]"

### [Objection 3]
**They'll say:** "[Objection]"
**Why:** [Reasoning]
**Handle:**
> "[Response]"

---

## Landmines & Things to Avoid

- [Thing NOT to bring up and why — e.g., "Don't mention their recent layoffs. Still sensitive."]
- [Topic to avoid — e.g., "Don't reference competitor by name unless they bring it up first."]
- [Assumption NOT to make — e.g., "Don't assume they have budget authority — verify first."]

---

## After the Call

### Notes Template
After the call, capture:
- [ ] **Outcome:** Qualified / Not qualified / Needs follow-up
- [ ] **Key pains confirmed:** [What they actually said they struggle with]
- [ ] **Decision process:** [Who's involved, timeline, budget]
- [ ] **Next step agreed:** [What happens next]
- [ ] **Objections raised:** [What came up, how you handled it]
- [ ] **Competitive mentions:** [Any competitors discussed]
- [ ] **Follow-up items:** [What you promised to send/do]
```


