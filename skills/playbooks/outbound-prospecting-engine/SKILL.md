---
type: playbook
name: outbound-prospecting-engine
description: >
  End-to-end outbound prospecting: detect intent signals, research companies,
  find decision-maker contacts, personalize messaging, launch campaign.
---

# Outbound Prospecting Engine

Build and run a complete outbound prospecting system: signal detection → company research → contact finding → personalization → campaign launch.

## When to Use

- "Set up outbound prospecting for [client]"
- "Build a lead gen engine targeting [ICP]"
- "Find and reach out to companies that need [solution]"

## Prerequisites

- Client context.md with ICP, value props, positioning
- Signal keywords (what to monitor for intent)
- Approved messaging / email sequences (or generate them)

## Steps

### 1. Define Signal Sources

Based on the client's ICP and motion, select which signals to monitor:

| Signal Source | Best For | Skill |
|--------------|---------|-------|
| Job postings | Companies with allocated budget | job-posting-intent |
| Funding announcements | Companies with fresh capital | funding-signal-monitor |
| LinkedIn posts/comments | Practitioners discussing the problem | linkedin-post-research + linkedin-commenter-extractor |
| Conference attendees | People actively engaged with the space | luma-event-attendees |
| Competitor customers | Companies already buying similar solutions | competitor-post-engagers |

### 2. Run Signal Detection

Execute selected signal skills with client-specific keywords. Run in parallel.

**Output**: Raw signal list — companies + signal context.

### 3. Qualify & Score

**Skill**: lead-qualification

Filter against ICP criteria. Score each lead:
- Multi-signal leads = highest priority
- Job posting + funding = strongest intent
- Single social mention = lowest (awareness only)

### 4. Find Decision-Maker Contacts

**Skill**: company-contact-finder

For top qualified companies, find the specific decision-makers:
- Target titles from client's ICP
- Get email addresses and LinkedIn URLs

### 5. Deduplicate

**Skill**: contact-cache

Check all leads against the contact cache. Add new leads to cache. Skip any that have been contacted before.

### 6. Personalize Outreach

For each lead, generate personalized email sequence using:
- The signal that surfaced them (the "why now")
- Their company context (what they do, their pain)
- The client's value proposition (how it solves their pain)

### 7. Launch Campaign

**Skill**: cold-email-outreach

Set up the outreach campaign in your chosen tool:
- Create campaign with name and schedule
- Upload lead list
- Configure 2-3 email sequence (personalized per lead or per segment)
- Allocate mailboxes
- Set sending schedule

### 8. Monitor & Iterate

- Track open rates, reply rates, meeting bookings
- A/B test subject lines and messaging
- Re-run signal detection weekly to add new leads
- Update contact cache with outcomes

## Ongoing Cadence

- **Weekly**: Re-run signal detection, qualify new leads, add to campaign
- **Bi-weekly**: Review campaign metrics, adjust messaging
- **Monthly**: Review overall pipeline contribution, adjust signal sources

## Human Checkpoints

- **After Step 3**: Review qualified lead list before finding contacts
- **After Step 6**: Review personalized email copy before launching campaign
- **After Step 8**: Review campaign performance metrics
