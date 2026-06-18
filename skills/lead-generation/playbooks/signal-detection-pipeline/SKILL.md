---
type: playbook
name: signal-detection-pipeline
description: Detect buying signals from multiple sources, qualify leads, and generate outreach context
---

# Signal Detection Pipeline

Monitor multiple signal sources to find companies actively in-market for your client's solution. Combine signals for higher-confidence leads.

## When to Use

- "Find companies that might need [our product]"
- "Run signal detection for [problem area]"
- "Find buying signals in [industry/topic]"

## Signal Sources

Run the sources relevant to the client's ICP. Each is independent — run in parallel.

### Job Posting Signals (Strongest)
**Skill:** job-posting-intent

Companies hiring for roles in the problem area = budget allocated and pain acknowledged.
- Input: Job keywords, ICP criteria
- Output: Qualified companies with outreach angles

### Funding Signals
**Skill:** funding-signal-monitor

Recently funded companies = budget available, growth mandate.
- Input: Industry, funding stage filter
- Output: Funded companies with timing context

### Conference Attendance Signals
**Skill:** luma-event-attendees

People attending events in the problem space = actively engaged.
- Input: Event URLs or topic search
- Output: Person/company list

### Reddit Pain Signals
**Skill:** reddit-post-finder

People complaining about or discussing the problem = experiencing the pain.
- Input: Keywords, relevant subreddits
- Output: Posts with authors, context

### LinkedIn Content Signals
**Skill:** linkedin-post-research + linkedin-commenter-extractor

People posting about or engaging with the problem = thought leaders or practitioners.
- Input: Keywords, time frame
- Output: Posters and commenters with engagement data

## Combining Signals

After running relevant sources:

1. **Deduplicate** companies appearing across multiple signals (multi-signal = strongest leads)
2. **Score** each lead: assign signal strength based on source quality and recency
   - Job posting + funding = highest intent
   - LinkedIn post + Reddit complaint = validated pain
   - Single conference attendance = lowest (awareness only)
3. **Enrich** top leads with web search for company details
4. **Consolidate** into a single Google Sheet: Company, Signal Sources, Signal Strength, Context, Outreach Angle
5. **Prioritize** companies with multiple signal types

## Human Checkpoints

- **After combining signals**: Review consolidated list before outreach
