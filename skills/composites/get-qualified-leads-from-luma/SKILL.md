---
name: get-qualified-leads-from-luma
version: 1.0.0
description: >
  End-to-end lead prospecting from Luma events. Searches Luma for events by topic and location,
  extracts all attendees/hosts, qualifies them against a qualification prompt, outputs results
  to a Google Sheet, and sends a Slack alert with top leads. Use this skill whenever someone
  wants to find qualified leads from events, prospect event attendees, or run an event-based
  lead gen workflow. Also triggers for "find people at events and qualify them" or
  "who's attending X events that matches our ICP."
tags: [lead-generation]
---

# Get Qualified Leads from Luma Events

Search Luma for events by topic and location, extract all attendees and hosts, qualify them against your ICP, export to a Google Sheet, and send a Slack alert with the top leads.

This is a 5-step pipeline that chains together `luma-event-attendees`, `lead-qualification`, Google Sheets output, and Slack alerting.

## Step 0: Clarify Search Parameters

Before doing anything, make sure you have clear answers to these questions. If the user's prompt already covers them, skip ahead. Otherwise, ask:

1. **Location** — Where should events be? (e.g., "San Francisco", "New York", "London")
2. **Topics/Keywords** — What event topics? Suggest 3-5 keyword variations to maximize coverage. For example, if the user says "growth marketing", also suggest: "GTM", "demand gen", "startup growth", "growth hacking", "marketing leadership"
3. **Timeframe** — How recent should the events be? (e.g., "past 2 weeks", "past month", "this quarter"). Default to **past 30 days** if the user doesn't specify. Luma search can return events from months or years ago, so always confirm a timeframe to avoid stale results.
4. **Qualification prompt** — Does the user have an existing qualification prompt in `skills/lead-qualification/qualification-prompts/`? If not, what's their ICP at a high level? (Can use `lead-qualification` intake mode to build one)
5. **Slack channel/webhook** — Where should the alert go? A webhook URL or Slack channel name?
6. **How many top leads** in the Slack alert? (default: 5)

Present these as a numbered list. The user can answer in one shot.

## Step 1: Search Luma and Extract Attendees

Use the `luma-event-attendees` skill with **multiple keyword variations** to maximize coverage.

### Run parallel searches

Generate 3-5 keyword variations combining the user's topic with their location. Run them all in parallel:

```bash
# Run each search variation in parallel
python3 skills/luma-event-attendees/scripts/scrape_event.py --search "AI San Francisco" --output /tmp/luma_search_1.csv
python3 skills/luma-event-attendees/scripts/scrape_event.py --search "Growth Marketing San Francisco" --output /tmp/luma_search_2.csv
python3 skills/luma-event-attendees/scripts/scrape_event.py --search "GTM San Francisco" --output /tmp/luma_search_3.csv
```

### Filter by timeframe

After collecting results, filter out events outside the user's specified timeframe using the `event_date` column. Luma search returns events from all time periods, so this step is essential to avoid stale leads. If no timeframe was specified, default to the past 30 days.

### Deduplicate

Merge and deduplicate by name (case-insensitive). Handle `None` names gracefully — skip entries with no name.

Save the deduplicated result as a CSV:

```
/tmp/luma_all_attendees.csv
```

Report to the user:
- How many total results before dedup
- How many unique people after dedup
- How many have LinkedIn profiles
- How many events were covered

## Step 2: Save Attendee Data to CSV

Work with CSVs throughout the pipeline — Google Sheets creation happens only at the end (Step 4) because writing large datasets to Sheets mid-process is slow and error-prone.

The CSV from Step 1 (`/tmp/luma_all_attendees.csv`) is your working file. Columns should include:

| name | event_role | bio | title | company | linkedin_url | twitter_url | instagram_url | website_url | username | event_name | event_date | event_url |
|------|-----------|-----|-------|---------|-------------|-------------|---------------|-------------|----------|------------|------------|-----------|

## Step 3: Qualify Leads

Use the `lead-qualification` skill (Mode 2: reuse prompt) to qualify all attendees.

### Prepare batches

1. Read the qualification prompt from the file the user specified (e.g., `skills/lead-qualification/qualification-prompts/ai-event-attendees-gtm.md`)
2. Split attendees into batches of ~15-20 leads each
3. For each lead, include: id (row number), name, event_role, bio, title, company, linkedin_url, event_name

### Run parallel qualification

Launch all batches simultaneously using the Task tool with `sonnet` model subagents:

```
Task: "Qualify leads batch 1/N"
  - Include the full qualification prompt text
  - Include the batch of leads as JSON
  - Ask for output as JSON array: [{id, name, qualified, confidence, reasoning}]

Task: "Qualify leads batch 2/N"
  ... (launch ALL at once)
```

### Merge results

1. Collect all batch results
2. Merge into a single JSON array, preserving original IDs
3. Sort qualified leads by confidence (High first, then Medium, then Low)
4. Save results:
   - `/tmp/all_qual_results.json` — all 195 results
   - `/tmp/qualified_leads.json` — only qualified leads, sorted by confidence

Report to the user:
- Total leads processed
- Qualified count and percentage
- Breakdown by confidence level (High / Medium / Low)
- Top disqualification reasons

## Step 4: Create Google Sheet with Results

Now create the Google Sheet with all data — both raw attendees and qualification results.

### Use Rube MCP for Google Sheets

1. Use `RUBE_SEARCH_TOOLS` to find Google Sheets tools (search for "google sheet create")
2. Create a new sheet named: `Luma Leads - [Topic] - [Date]`
3. **Sheet 1 ("All Attendees"):** Write all attendee rows with original columns PLUS:
   - `Qualified` — Yes / No
   - `Confidence` — High / Medium / Low
   - `Reasoning` — 2-3 sentence explanation
4. **Sheet 2 ("Qualified Leads"):** Only qualified leads, sorted by confidence

### Writing strategy for large datasets

The Google Sheets API can be slow for large datasets. Use this approach:
- Write the header row first
- Write data in chunks of 50 rows using batch update operations
- If a chunk fails, retry once before moving on

### Fallback

If Rube/Sheets is unavailable, save as CSV:
```
/tmp/luma_qualified_leads_[date].csv
```

Present the Google Sheet link (or CSV path) to the user.

## Step 5: Send Slack Alert

Send a formatted Slack message with the top N qualified leads (default: 5, or whatever the user specified).

### If the user provided a webhook URL

Use Python with `urllib.request` to POST to the webhook:

```python
import json
import urllib.request

message = {
    "blocks": [
        {"type": "header", "text": {"type": "plain_text", "text": "Top N Qualified Leads from [Topic] Events"}},
        {"type": "section", "text": {"type": "mrkdwn", "text": "_From X attendees across Y events, Z qualified (P%). Here are the top N:_"}},
        # For each lead:
        {"type": "section", "text": {"type": "mrkdwn", "text": "*1. Name* [Confidence]\n   LinkedIn: url\n   Bio: ...\n   Why: reasoning"}},
        {"type": "divider"},
        # Link to spreadsheet at the bottom
        {"type": "section", "text": {"type": "mrkdwn", "text": "<sheet_url|View full spreadsheet> (X attendees, Y qualified)"}}
    ]
}

req = urllib.request.Request(webhook_url, data=json.dumps(message).encode(), headers={"Content-Type": "application/json"})
urllib.request.urlopen(req)
```

### If the user wants Slack via Rube MCP

Use `RUBE_SEARCH_TOOLS` to find Slack tools, then send via `SLACK_SEND_MESSAGE` or similar.

### Message format

The Slack alert should include for each top lead:
- **Name** and confidence level
- **LinkedIn URL** (clickable)
- **Bio** — one-line summary
- **Why** — the qualification reasoning (truncated to ~150 chars if needed)

End with a link to the full Google Sheet.

## Cost Estimate

| Component | Cost |
|-----------|------|
| Luma scraper (Apify) | $29/mo flat subscription |
| LinkedIn enrichment (optional) | ~$0.03 per 100 leads |
| Google Sheets | Free (via Rube/Composio) |
| LLM qualification | ~$0.10-0.30 per run (depends on batch size) |
| Slack webhook | Free |

**Typical run:** ~200 attendees across 3-5 search variations costs essentially just the Apify subscription + a few cents in LLM tokens.

## Example Prompts

**Quick run with existing prompt:**
> "Find qualified leads from AI and growth events in SF. Use the ai-event-attendees-gtm qualification prompt. Send top 5 to Slack webhook: https://hooks.slack.com/..."

**Full specification:**
> "Search Luma for startup, SaaS, and AI events in New York. Extract all attendees. Qualify them against our Series A founders ICP. Put everything in a Google Sheet and Slack me the top 10."

**Minimal (triggers clarifying questions):**
> "Find me leads from SF tech events"

## Troubleshooting

### Apify token not set
```bash
export APIFY_API_TOKEN="your_token"
# Or check skills/luma-event-attendees/.env
```

### No guests found
Some Luma events have `show_guest_list` disabled. The Apify scraper can still get featured guests, but full attendee lists may not be available for all events.

### Google Sheets writing is slow
This is normal for large datasets. The skill writes in 50-row chunks. If it's too slow or fails, results are always available as CSV in `/tmp/`.

### Slack webhook returns error
Verify the webhook URL is correct and the Slack app is still installed in the workspace. Test with a simple curl:
```bash
curl -X POST -H 'Content-Type: application/json' -d '{"text":"test"}' YOUR_WEBHOOK_URL
```
