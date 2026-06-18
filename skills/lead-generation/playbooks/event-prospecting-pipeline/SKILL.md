---
type: playbook
name: event-prospecting-pipeline
description: Find attendees at conferences/events, research their companies, qualify against ICP, and launch outreach
---

# Event Prospecting Pipeline

End-to-end workflow: find event attendees → research → qualify against ICP → deduplicate → outreach.

## When to Use

- "Find leads from [event name/URL]"
- "Who's speaking at [conference]? Get me their contact info"
- "Find AI events in SF and get me decision-maker contacts"
- "Find leads from upcoming conferences and launch outreach"

> **For Luma-only qualified lead gen** with built-in Google Sheets + Slack alerting, use [[skills/composites/get-qualified-leads-from-luma/SKILL.md]] instead. This playbook is the full pipeline including outreach.

## Steps

### 1. Find Attendees / Speakers
**Skills:** luma-event-attendees OR conference-speaker-scraper

- If user provides a Luma event URL or topic → use `luma-event-attendees`
- If user provides a conference website → use `conference-speaker-scraper`
- If user provides a topic/location → use `luma-event-attendees` Apify search mode to find events first

**Output:** Person list with names, bios, LinkedIn/Twitter URLs, companies.

### 2. Research & Enrich
**Capability:** Web search

For each person/company:
- Company funding stage, size, product
- Person's current role and seniority
- Recent news or activity

Skip if user just wants a raw attendee list.

### 3. Qualify Against ICP
**Skill:** lead-qualification

Filter the enriched list against the client's ICP criteria. Score each lead.

### 4. Find Decision-Maker Contacts
**Skill:** company-contact-finder

For qualified companies, find the specific decision-makers with email addresses.

### 5. Deduplicate
**Skill:** contact-cache

Check all leads against the contact cache to prevent duplicate outreach across strategies.

### 6. Output Results
**Capability:** Google Sheets or CSV export

Export qualified, deduplicated leads with columns: Name, Title, Company, LinkedIn URL, Email, Signal, Score.

### 7. Launch Outreach (optional)
**Skill:** cold-email-outreach

If approved, set up personalized outreach via your chosen outreach tool or direct email via AgentMail API (agentmail.dev).

## Human Checkpoints

- **After Step 3**: Review qualified lead list before finding contacts
- **After Step 6**: Review final list and email copy before launching outreach
