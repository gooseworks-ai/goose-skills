---
name: newsletter-signal-scanner
description: >
  Subscribe to and scan industry newsletters for buying signals, competitor mentions,
  ICP pain-point language, and market shifts. Parses incoming newsletter emails via
  AgentMail, matches against keyword campaigns, and delivers a weekly digest of
  actionable signals. Use when a marketing team wants to turn newsletter subscriptions
  into an ongoing intelligence feed without manual reading.
tags: [monitoring]
---

# Newsletter Signal Scanner

Turn your newsletter subscriptions into a structured intelligence feed. Monitors an AgentMail inbox for incoming newsletters, extracts signal-relevant content by keyword campaign, and delivers a weekly digest of what matters — competitor mentions, ICP pain language, market shifts, and emerging topics.

## When to Use

- "Monitor industry newsletters for competitor mentions"
- "Alert me when newsletters mention [topic] or [company]"
- "What are newsletters writing about this week in our space?"
- "Set up newsletter monitoring for [client]"

## Phase 0: Intake

### Newsletters to Monitor
1. Which newsletters should be subscribed to and monitored? (List names or URLs)
   - If unknown, ask: "What 3-5 newsletters does your ICP read?" — then use `sponsored-newsletter-finder` to discover others.
2. Which AgentMail inbox should receive them? (Or should we create a new one?)

### Keyword Campaigns
3. Competitor names to track (e.g., "Clay", "Apollo", "Outreach")
4. ICP pain-language terms to track (e.g., "outbound struggling", "pipeline dried up", "SDR ramp")
5. Market shift terms (e.g., "AI SDR", "agent-led growth", "GTM engineer")
6. Your brand name (to catch mentions)

### Output
7. Digest delivery: Slack channel, email, or markdown file? (default: markdown file)
8. Frequency: daily or weekly? (default: weekly)

Save campaign config to the current working directory as `newsletter-signals.json` (or user-specified path).

```json
{
  "inbox_id": "<agentmail_inbox_id>",
  "keyword_campaigns": {
    "competitors": ["Clay", "Apollo", "Outreach", "Salesloft"],
    "pain_language": ["pipeline is down", "outbound isn't working", "SDR ramp"],
    "market_shifts": ["AI SDR", "GTM engineer", "agent-led"],
    "brand_mentions": ["YourCompany", "yourcompany.com"]
  },
  "newsletters": [
    {"name": "Exit Five", "from_domain": "exitfive.com"},
    {"name": "The GTM Newsletter", "from_domain": "gtmnewsletter.com"}
  ],
  "output": {
    "format": "markdown",
    "path": "newsletter-signals-[DATE].md"
  }
}
```

## Phase 1: Scan Inbox

Use the AgentMail API (agentmail.dev) to fetch new emails from the monitored inbox:

```
Fetch emails from inbox <inbox_id> since <last_scan_date>
Filter to: known newsletter senders (match against newsletters config)
```

For each email:
- Extract subject, sender, date, full body text
- Strip HTML → plain text for analysis

## Phase 2: Apply Keyword Campaigns

For each newsletter email, scan for keyword matches:

```python
for email in emails:
    matches = {}
    for campaign, keywords in keyword_campaigns.items():
        found = []
        for keyword in keywords:
            if keyword.lower() in email.body.lower():
                # Extract context: 50 chars before + keyword + 50 chars after
                context = extract_context(email.body, keyword)
                found.append({"keyword": keyword, "context": context})
        if found:
            matches[campaign] = found
    email.signal_matches = matches
```

Only include emails with at least one keyword match in the digest.

## Phase 3: Extract Signal Snippets

For each matched email, extract clean signal snippets:

**Competitor mention example:**
> Newsletter: The GTM Newsletter | Date: 2026-03-05
> Campaign: competitors
> Keyword: "Clay"
> Context: "...teams that use **Clay** for enrichment are seeing 3x better personalization rates compared to..."

**Pain language example:**
> Newsletter: Exit Five | Date: 2026-03-04
> Campaign: pain_language
> Keyword: "outbound isn't working"
> Context: "...a lot of founders telling me **outbound isn't working** the way it used to. The reply rates I'm seeing..."

## Phase 4: Output Format

```markdown
# Newsletter Signal Digest — Week of [DATE]

## Summary
- Newsletters scanned: [N]
- Emails with signals: [N]
- Top trending topic: [topic]

---

## Competitor Mentions

### Clay
- **[Newsletter Name]** — [Date]
  > "[Context snippet]"
  Source: [email subject] | [URL if available]

### [Other Competitor]
...

---

## ICP Pain Language

Signals suggesting your ICP is feeling pain your product solves:

- **[Newsletter Name]** — [Date]
  > "[Context snippet]"
  — Relevance: [why this matters]

---

## Market Shift Signals

Emerging topics gaining newsletter coverage:

- **"[Topic]"** — mentioned in [N] newsletters this week
  > "[Context snippet]"

---

## Your Brand Mentions
[Any mentions of your company or product]

---

## Recommended Actions
1. [Specific action based on signals — e.g., "Exit Five is covering AI SDR fatigue — good moment to publish our take"]
2. [Competitive response if needed]
```

Save to the current working directory as `newsletter-signals-[YYYY-MM-DD].md` (or user-specified path).

## Phase 5: Setup — Subscribe to Newsletters

For first-time setup, subscribe the AgentMail address to target newsletters:

1. Get the AgentMail inbox address (via AgentMail API at agentmail.dev)
2. For each newsletter, visit subscription page and submit the AgentMail address
3. Confirm subscriptions (check inbox for confirmation emails)
4. Allow 1-2 weeks of accumulation before first full digest

## Scheduling

Run weekly (Monday morning recommended):

```bash
# Every Monday at 7am — before the team's standup
0 7 * * 1 python3 run_skill.py newsletter-signal-scanner --client <client-name>
```

## Cost

| Component | Cost |
|-----------|------|
| AgentMail inbox | Depends on AgentMail pricing |
| Email parsing + keyword matching | Free (local logic) |
| **Total** | **Near-zero ongoing cost** |

## Tools Required

- **AgentMail API** (agentmail.dev) — for inbox access. Requires `AGENTMAIL_API_KEY` environment variable and the `agentmail` pip package (`pip3 install agentmail`).

## Trigger Phrases

- "Scan newsletters for this week's signals"
- "What are industry newsletters saying about [topic]?"
- "Run newsletter signal scanner for [client]"
- "Set up newsletter monitoring"
