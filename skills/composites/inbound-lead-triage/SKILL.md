---
name: inbound-lead-triage
version: 1.0.0
description: >
  Triages all inbound leads from a given period — demo requests, free trial signups,
  content downloads, webinar registrations, chatbot conversations. Classifies by urgency,
  qualifies against ICP, enriches with context, and produces a prioritized action queue
  with recommended response for each lead. Tool-agnostic — works with any CRM, form tool,
  or lead source.
tags: [lead-generation]
---

# Inbound Lead Triage

Pulls all inbound leads from a specified period, classifies them by source urgency, qualifies against ICP, enriches with company/person context, and produces a prioritized action queue. Turns a messy inbox of form fills into a clear "who to call first" list.

## When to Auto-Load

Load this composite when:
- User says "triage my inbound leads", "review new leads", "check demo requests"
- User wants to process a batch of inbound leads from any period
- User asks "who should I follow up with first?"
- A scheduled workflow triggers periodic inbound review

## Architecture

```
[Lead Sources] → Step 1: Collect → Step 2: Classify & Rank → Step 3: Qualify → Step 4: Enrich → Step 5: Route & Respond
                    ↓                    ↓                        ↓                  ↓                    ↓
              Raw lead list      Urgency-ranked list       ICP-scored list    Context-rich list    Action queue + drafts
```

Each step has a clear input/output contract. Tools are configured once per client, not hardcoded.

---

## Step 0: Configuration (Once Per Client)

On first run, ask the user to configure their lead sources and preferences. Save to the current working directory or wherever the user prefers (e.g., `config/inbound-triage.json`).

```json
{
  "lead_sources": {
    "demo_requests": {
      "source_tool": "HubSpot | Salesforce | Typeform | CSV | other",
      "access_method": "API | CSV export | MCP tool | manual paste",
      "fields_available": ["name", "email", "company", "title", "message"]
    },
    "free_trial_signups": {
      "source_tool": "product database | Stripe | CSV | other",
      "access_method": "API | CSV export | manual paste",
      "fields_available": ["name", "email", "company", "signup_date", "plan"]
    },
    "content_downloads": {
      "source_tool": "HubSpot | Marketo | CSV | other",
      "access_method": "API | CSV export | manual paste",
      "fields_available": ["name", "email", "company", "content_title", "download_date"]
    },
    "webinar_registrations": {
      "source_tool": "Zoom | Luma | CSV | other",
      "access_method": "API | CSV export | manual paste",
      "fields_available": ["name", "email", "company", "webinar_title", "attended"]
    },
    "chatbot_conversations": {
      "source_tool": "Intercom | Drift | Crisp | CSV | other",
      "access_method": "API | CSV export | manual paste",
      "fields_available": ["name", "email", "company", "conversation_summary", "intent"]
    }
  },
  "urgency_overrides": {},
  "response_preferences": {
    "demo_request_sla": "< 1 hour",
    "trial_signup_sla": "< 4 hours",
    "default_sla": "< 24 hours"
  },
  "qualification_prompt_path": "path/to/existing/qualification-prompt.md or null"
}
```

**On subsequent runs:** Load config silently, skip setup.

**If user provides a raw CSV or pastes leads inline:** Skip source config — just classify what's given.

---

## Step 1: Collect Leads

### Input
- Time period (e.g., "last 24 hours", "this week", "since Monday")
- Lead sources to check (all configured sources by default, or user specifies)

### Process
1. Pull leads from each configured source for the specified period
2. Normalize into a common schema regardless of source:

```
{
  "name": "",
  "email": "",
  "company": "",
  "title": "",           // if available
  "source_type": "",     // demo_request | free_trial | content_download | webinar | chatbot | other
  "source_detail": "",   // which form, which webinar, which content piece
  "timestamp": "",
  "raw_message": "",     // form message, chat transcript, or null
  "raw_fields": {}       // all original fields preserved
}
```

3. Deduplicate by email — if same person appears in multiple sources, merge into one record with all source types listed (this is a stronger signal)

### Output
- Normalized lead list with source classification
- Dedup report: "X leads from Y sources, Z duplicates merged"

### Human Checkpoint
Present the collected leads count by source. Ask: "These are the leads I found. Proceed with triage?"

---

## Step 2: Classify & Rank by Urgency

### Urgency Tier System

Rank every lead into one of four urgency tiers based on their source type and behavioral signals.

**Tier 1 — Respond NOW (< 1 hour SLA)**
- Demo requests (explicit buying intent)
- Chatbot conversations where the prospect asked about pricing, integration, or implementation
- Any lead that mentions a competitor by name
- Any lead that mentions a timeline ("looking to switch by Q2", "evaluating this month")
- Multi-source leads: appeared in 2+ sources (e.g., downloaded content AND requested demo)

**Tier 2 — Respond TODAY (< 4 hours SLA)**
- Free trial signups (active evaluation intent)
- Chatbot conversations with product questions (not pricing)
- Webinar attendees who actually attended (not just registered)
- Content downloads of bottom-funnel content (case studies, ROI calculators, comparison guides, pricing pages)

**Tier 3 — Respond within 24 hours**
- Webinar registrants who did NOT attend
- Content downloads of mid-funnel content (how-to guides, industry reports, templates)
- Free trial signups with personal email domains (gmail, yahoo — lower commercial intent)

**Tier 4 — Batch response / nurture**
- Content downloads of top-funnel content (blog posts, general ebooks, infographics)
- Webinar registrants for broad/educational topics with no other signal
- Any lead where company or title is missing and can't be enriched

### Signal Boosters (Move Up One Tier)
- Company matches existing ICP (known good industry, size, stage)
- Person has a title that maps to buyer persona
- Company is already in pipeline (existing deal — warm context)
- Person previously engaged (downloaded other content, attended other webinar)
- Company was flagged by a signal composite (funding, hiring, leadership change)

### Signal Dampeners (Move Down One Tier)
- Personal email domain with no company info
- Bot-like behavior (form filled in < 3 seconds, nonsense fields)
- Existing customer (unless upsell signal — keep at tier but flag differently)
- Competitor employee (flag separately — competitive intelligence, not a lead)

### Urgency Override
If the user configured custom urgency rules in `urgency_overrides`, apply those after the default classification.

### Output
- Lead list sorted by urgency tier, then by timestamp within each tier
- Each lead tagged with: `urgency_tier`, `urgency_reason`, `signal_boosters[]`, `signal_dampeners[]`

---

## Step 3: Qualify Against ICP

### Process
For each lead, run a lightweight ICP qualification check. This is NOT the full `lead-qualification` capability — it's a fast pass to separate likely-fit from unlikely-fit.

1. **If a qualification prompt exists** (from `lead-qualification` capability): Apply it in fast mode — check hard disqualifiers only, skip deep enrichment
2. **If no qualification prompt:** Use the company context to do a basic fit check:
   - Does the company size/industry/stage roughly match ICP?
   - Does the person's title map to a buyer/user persona?
   - Any obvious disqualifiers? (wrong geography, wrong industry, too small/large)

### Qualification Categories
- **Strong fit** — Company and person clearly match ICP
- **Likely fit** — Partial data but what's available looks good
- **Unknown fit** — Not enough data to determine (needs enrichment)
- **Poor fit** — Clearly outside ICP (but still log — they came inbound for a reason)
- **Flag: Competitor** — Employee of a known competitor
- **Flag: Existing customer** — Already a customer (route to CS/upsell, not sales)

### Output
- Each lead tagged with: `icp_fit`, `fit_reasoning` (one sentence)
- Leads with "poor fit" or "flag" categories are separated into a secondary list

---

## Step 4: Enrich with Context

### Process
For leads in Tier 1 and Tier 2 (and strong/likely fit Tier 3), gather context that helps the responder have a better conversation.

**Company enrichment (per unique company):**
- What does the company do? (one sentence)
- Company size, stage, industry
- Any recent news or signals? (check if any signal composites have flagged this company)
- Are they in our pipeline already? (check your CRM — HubSpot, Salesforce, CSV)
- Previous engagement history (other people from this company who engaged)

**Person enrichment:**
- Current role and tenure
- LinkedIn headline (if available via enrichment tools)
- Any prior engagement with us (previous downloads, webinar attendance, email replies)
- Mutual connections or warm intro paths (if detectable)

**Engagement context:**
- What content did they download? (summarize the topic — the responder should know what the lead is interested in)
- What did they say in the demo request form? (quote key phrases)
- What was the chatbot conversation about? (3-sentence summary)
- Which webinar did they attend? (topic relevance to product)

### Tool Flexibility
- Use whatever enrichment tools are configured (SixtyFour or Orthogonal, LinkedIn scraper, web search)
- If no enrichment tools are configured, do a basic web search for company + person
- Skip enrichment for Tier 4 leads (not worth the cost — batch-nurture them)

### Output
- Each Tier 1-3 lead has an enrichment block with company context, person context, and engagement context
- Enrichment is best-effort — missing fields are noted, never blocks the process

---

## Step 5: Route & Recommend Response

### For Each Lead, Determine:

**1. Response action:**

| Urgency | ICP Fit | Action |
|---------|---------|--------|
| Tier 1 | Strong/Likely | **Immediate personal outreach** — draft personalized email or call script |
| Tier 1 | Unknown | **Immediate outreach + qualify on call** — draft email with discovery questions |
| Tier 1 | Poor | **Still respond** (they requested a demo) — draft polite response, qualify on call |
| Tier 2 | Strong/Likely | **Same-day personal outreach** — draft personalized welcome/check-in email |
| Tier 2 | Unknown | **Same-day templated outreach** — send template with one personalized line |
| Tier 2 | Poor | **Templated response** — standard welcome, no prioritization |
| Tier 3 | Strong/Likely | **Next-day personalized outreach** — draft email referencing what they engaged with |
| Tier 3 | Unknown/Poor | **Add to nurture sequence** — automated drip, no manual effort |
| Tier 4 | Any | **Nurture sequence only** — batch add to appropriate drip campaign |
| Flag: Competitor | — | **Log for competitive intel** — do not send sales outreach |
| Flag: Customer | — | **Route to CS team** — flag upsell opportunity if relevant |

**2. Draft response (for Tier 1-3 leads with personal outreach):**

Draft a response email that:
- References the specific action they took ("I saw you requested a demo of...", "Thanks for downloading our guide on...")
- Connects their likely interest to a relevant product capability
- Uses enrichment context naturally (don't be creepy — reference public info only)
- Has a clear CTA appropriate to the tier:
  - Tier 1: "Are you free [specific time slots] this week for a quick call?"
  - Tier 2: "Would it be helpful if I walked you through [relevant feature]?"
  - Tier 3: "I put together [relevant resource] that builds on what you downloaded. Happy to chat if you have questions."

**3. Assign owner (if team structure is configured):**
- Route by territory, account size, or round-robin based on client config
- If no team structure: all leads go to the user

---

## Output Format

### Primary: Prioritized Action Queue

Present as a clear, actionable table organized by urgency tier:

```markdown
## Inbound Lead Triage: [Period]
Generated: [timestamp]

### Summary
- **Total leads:** X from Y sources
- **Tier 1 (respond now):** X leads
- **Tier 2 (respond today):** X leads
- **Tier 3 (respond within 24h):** X leads
- **Tier 4 (nurture):** X leads
- **Flagged:** X competitors, X existing customers

---

### 🔴 Tier 1 — Respond NOW

#### Lead: [Name] — [Company] — [Title]
- **Source:** Demo request via [tool] at [time]
- **Urgency reason:** Explicit demo request + company matches ICP
- **ICP fit:** Strong — [one sentence reasoning]
- **Company:** [one sentence what they do, size, stage]
- **Signal context:** [any signals from other composites]
- **Engagement:** "[quote from form message or chat]"
- **Recommended action:** Personal email + calendar link
- **Draft response:**
  > [ready-to-send email draft]

---

#### Lead: [Name] — [Company] — [Title]
...

---

### 🟡 Tier 2 — Respond TODAY
...

### 🟢 Tier 3 — Respond Within 24h
...

### ⚪ Tier 4 — Add to Nurture
[Batch list — name, company, source, content engaged with. No individual drafts.]

### 🔵 Flagged
- **Competitors:** [list with company name — route to competitive intel]
- **Existing customers:** [list with company name — route to CS]
```

### Secondary: CSV Export

Also produce a flat CSV with all leads and their triage data:
- All original fields
- `urgency_tier`, `urgency_reason`, `icp_fit`, `fit_reasoning`
- `recommended_action`, `response_draft`
- `company_context`, `person_context`, `engagement_context`

Save to the current working directory or wherever the user prefers (e.g., `leads/inbound-triage-[date].csv`).

---

## Handling Edge Cases

**No leads in period:**
Report "No new inbound leads found for [period]" with a note on which sources were checked.

**Lead with no email:**
Still triage if company + name are available. Flag as "no direct contact — needs manual lookup."

**Lead from a very large company (enterprise):**
Boost urgency by one tier. Enterprise inbound is rare and high-value. Note: "Enterprise lead — consider executive-level response."

**Lead that's already in an active outbound sequence:**
Flag: "Already in outbound sequence [campaign name] — check for overlap before responding." Don't send a second competing message.

**Duplicate lead (same person, same source, same period):**
Keep the most recent submission. Note the repeat engagement as a signal booster.

**Partial data (no company, no title):**
Classify based on what IS available. Source type still determines urgency tier. Note: "Incomplete data — consider enrichment before outreach."

**High volume (100+ leads in period):**
For Tier 3-4 leads, skip individual enrichment. Batch-qualify company names against ICP, produce summary stats instead of individual briefs. Focus human attention on Tier 1-2 only.

---

## Cadence

- **2-3x daily** (for active teams): Triage new leads every few hours to hit SLA targets
- **Daily AM** (minimum): Morning triage of all leads from previous day/overnight
- **Weekly** (lightweight): Summary stats on inbound volume, source effectiveness, response times

---

## Tools Required

The agent should have access to:
- **CRM / form tool access** — to pull inbound leads (HubSpot, Salesforce, Typeform, etc.)
- **Web search** — for company/person enrichment when other tools aren't available
- **Lead enrichment tools** — SixtyFour or Orthogonal, LinkedIn scraper, or similar (optional, enhances quality)
- **Email drafting** — references `email-drafting` capability for response frameworks
- **Calendar tool** — to include available time slots in Tier 1 responses (gcalcli or similar)
