---
name: setup-outreach-campaign-smartlead
description: >
  Set up a complete outbound email campaign in Smartlead. Asks the user for
  campaign goal, audience, messaging, schedule, and mailbox allocation.
  Creates the campaign, adds leads, saves email sequences, sets schedule,
  and assigns available mailboxes. Use when a user wants to launch email
  outreach via Smartlead.
tags: [outreach]

graph:
  provides:
    - smartlead-campaign
    - email-sequence
  requires:
    - lead-list
  connects_to:
    - skill: company-contact-finder
      when: "User doesn't have a lead list and needs to find contacts first"
      passes: nothing (upstream source)
    - skill: contact-cache
      when: "Before adding leads, deduplicate against already-contacted leads"
      passes: lead-list (emails)
    - skill: luma-event-attendees
      when: "User wants event attendees as the lead source"
      passes: person-list
    - skill: conference-speaker-scraper
      when: "User wants conference speakers as the lead source"
      passes: person-list
  capabilities: [smartlead-api]
---

# setup-outreach-campaign-smartlead

Set up a complete outbound email campaign in Smartlead: create the campaign, add leads, write a 2-3 email sequence, configure the schedule, and allocate mailboxes.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| campaign_name | Yes | -- | Name for the campaign (e.g., "Truewind - Accounting Firms - Feb 2026") |
| campaign_goal | Yes | -- | What outcome the campaign drives (book demos, drive signups, etc.) |
| lead_list | Yes | -- | CSV file path OR person-list JSON from upstream skill |
| value_proposition | Yes | -- | Core pain point or benefit the emails address |
| cta | Yes | -- | Call to action (e.g., "Book a 15-min demo", "Reply to learn more") |
| tone | No | semi-formal | Email tone: casual, semi-formal, formal |
| personalization_angle | No | -- | Hook for personalization (event attendance, job posting, news mention) |
| timezone | No | America/New_York | Timezone for send schedule |
| send_days | No | [1,2,3,4,5] | Days of week to send (0=Sun, 6=Sat) |
| start_hour | No | 08:00 | Start of send window |
| end_hour | No | 18:00 | End of send window |
| max_leads_per_day | No | 20 | Max new leads contacted per day |
| min_time_btw_emails | No | 10 | Minutes between emails from same mailbox |
| num_mailboxes | No | 5 | Number of mailboxes to allocate |
| mailbox_selection | No | auto | "auto" (pick free ones) or "manual" (show list to user) |

## Setup

Requires a Smartlead account with API access. **This skill does not use the Gooseworks proxy** — the user must supply their own Smartlead API key.

```bash
export SMARTLEAD_API_KEY=your_api_key_here
```

You can find your API key in the Smartlead dashboard under **Settings → API Keys**. If `SMARTLEAD_API_KEY` is not set, ask the user for it before proceeding.

All API calls go to `https://server.smartlead.ai/api/v1` with `?api_key=$SMARTLEAD_API_KEY` appended.

Rate limit: 10 requests per 2 seconds.

## Procedure

### Step 1: Gather Campaign Info

Ask the user the following questions. Group them conversationally — don't dump all at once.

**Campaign identity:**
- "What is the name for this campaign?" (e.g., "Truewind - Accounting Firms - Feb 2026")
- "What is the goal?" (e.g., book demos, drive trial signups, conference follow-up)

**Audience & leads:**
- "Who is the target audience?" (ICP: title, company type, size, industry)
- "How are you providing the lead list?" — options: CSV file, output from a prior skill (company-contact-finder, luma-event-attendees), or "I need to find leads first" (chain to company-contact-finder)

**Messaging:**
- "What is the core value proposition or pain point?"
- "What is the call to action?" (e.g., "Book a 15-min demo")
- "What tone — casual, semi-formal, or formal?"
- "Any personalization angle?" (e.g., reference their job posting, event, industry news)

**Schedule:**
- "What days should emails be sent?" (default: Mon-Fri)
- "What hours and timezone?" (default: 8am-6pm ET)
- "Max new leads per day?" (default: 20)
- "When should the campaign start?" (default: tomorrow)

**Mailboxes:**
- "How many mailboxes to allocate?" (default: 5)
- "Auto-select free mailboxes, or show me a list to choose from?"

After gathering answers, present a summary and confirm before proceeding.

### Step 2: Create the Campaign

```
POST https://server.smartlead.ai/api/v1/campaigns/create?api_key=$SMARTLEAD_API_KEY

Body:
{
  "name": "<campaign_name>",
  "client_id": null
}
```

**Response:**
```json
{
  "ok": true,
  "id": 3023,
  "name": "Test email campaign",
  "created_at": "2022-11-07T16:23:24.025929+00:00"
}
```

Capture `campaign_id` from `id`. All subsequent calls use this.

### Step 3: Find and Allocate Mailboxes

This step determines which mailboxes are available and assigns them to the campaign.

#### 3a: Fetch all email accounts

```
GET https://server.smartlead.ai/api/v1/email-accounts/?api_key=$SMARTLEAD_API_KEY&offset=0&limit=100
```

Returns a list of all email accounts with `id`, `from_email`, `from_name`, `daily_sent_count`, `warmup_details`, `is_smtp_success`, `is_imap_success`.

#### 3b: Identify which mailboxes are currently in use

Fetch all campaigns:

```
GET https://server.smartlead.ai/api/v1/campaigns?api_key=$SMARTLEAD_API_KEY
```

For each campaign with `status` = `"ACTIVE"` or `"STARTED"`, fetch its email accounts:

```
GET https://server.smartlead.ai/api/v1/campaigns/{campaign_id}/email-accounts?api_key=$SMARTLEAD_API_KEY
```

Build a set of all `email_account_id` values currently assigned to active campaigns.

#### 3c: Filter for free mailboxes

A mailbox is "free" if:
1. Its `id` is NOT in the active-campaign set from 3b
2. `is_smtp_success` = true AND `is_imap_success` = true (account is functional)

Sort free mailboxes by `daily_sent_count` ascending (prefer coolest/least-used mailboxes).

#### 3d: Select and assign

If `mailbox_selection` = "auto": select the first N free mailboxes.

If `mailbox_selection` = "manual": display all accounts as a table (name, email, daily_sent_count, status) and let the user pick.

If fewer than N free mailboxes are available, tell the user: "Only X free mailboxes found. Proceed with X, or pick some currently-in-use mailboxes?"

Assign selected mailboxes:

```
POST https://server.smartlead.ai/api/v1/campaigns/{campaign_id}/email-accounts?api_key=$SMARTLEAD_API_KEY

Body:
{
  "email_account_ids": [101, 204, 305, 412, 518]
}
```

### Step 4: Ingest Leads

#### 4a: Parse the lead list

**From CSV:** Read the file, map columns to Smartlead fields. Flexible column matching:
- `email` (required) — also matches `Email`, `email_address`
- `first_name` — also matches `firstname`, `first`, `First Name`
- `last_name` — also matches `lastname`, `last`, `Last Name`
- `company_name` — also matches `company`, `organization`, `Company`
- Any extra columns become `custom_fields`

**From upstream skill (person-list JSON):** Map fields:
```
first_name  <- name.split()[0]
last_name   <- name.split()[1:]
email       <- email
company_name <- company
custom_fields <- { "title": title, "linkedin_url": linkedin_url }
```

#### 4b: Validate and deduplicate

- Remove rows without a valid email
- Deduplicate by email (keep first occurrence)
- Report: total rows, valid, invalid, duplicates removed

#### 4c: Upload in batches

Smartlead accepts max 100 leads per call. Chunk the list and call for each batch:

```
POST https://server.smartlead.ai/api/v1/campaigns/{campaign_id}/leads?api_key=$SMARTLEAD_API_KEY

Body:
{
  "lead_list": [
    {
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com",
      "company_name": "Acme Corp",
      "custom_fields": {"title": "CFO"}
    }
  ],
  "settings": {
    "ignore_global_block_list": false,
    "ignore_unsubscribe_list": false,
    "ignore_duplicate_leads_in_other_campaign": false
  }
}
```

**Response:**
```json
{
  "ok": true,
  "upload_count": 95,
  "total_leads": 100,
  "already_added_to_campaign": 2,
  "duplicate_count": 1,
  "invalid_email_count": 2,
  "unsubscribed_leads": 0
}
```

Report totals across all batches to the user.

### Step 5: Craft the Email Sequence

Write a 2-3 email sequence based on the user's inputs from Step 1. Default structure:

**Email 1 — Cold intro (Day 0)**
- Subject: short, curiosity-driven or relevant to their pain
- Body: 3-5 sentences. Acknowledge their world, surface the problem, introduce the solution briefly, clear CTA
- Personalize with `{{first_name}}` and any custom fields

**Email 2 — Follow-up (Day 3)**
- Subject: different angle (metric, case study, specific outcome)
- Body: 2-4 sentences. Add value, restate CTA
- Leave subject blank to send as same-thread reply

**Email 3 — Breakup (Day 8)**
- Subject: brief, direct ("Still relevant?", "Closing the loop")
- Body: 2-3 sentences. Acknowledge they're busy, keep door open, soft CTA

Present the full sequence to the user as a formatted table. Wait for approval or edits.

After user approves, save:

```
POST https://server.smartlead.ai/api/v1/campaigns/{campaign_id}/sequences?api_key=$SMARTLEAD_API_KEY

Body:
{
  "sequences": [
    {
      "seq_number": 1,
      "seq_delay_details": { "delay_in_days": 0 },
      "seq_variants": [
        {
          "subject": "Subject line here",
          "email_body": "<p>Email body as HTML</p>",
          "variant_label": "A"
        }
      ]
    },
    {
      "seq_number": 2,
      "seq_delay_details": { "delay_in_days": 3 },
      "seq_variants": [
        {
          "subject": "",
          "email_body": "<p>Follow-up body</p>",
          "variant_label": "A"
        }
      ]
    },
    {
      "seq_number": 3,
      "seq_delay_details": { "delay_in_days": 5 },
      "seq_variants": [
        {
          "subject": "",
          "email_body": "<p>Breakup body</p>",
          "variant_label": "A"
        }
      ]
    }
  ]
}
```

Note: blank `subject` on emails 2+ makes them send as replies in the same thread.

### Step 6: Set the Schedule

```
POST https://server.smartlead.ai/api/v1/campaigns/{campaign_id}/schedule?api_key=$SMARTLEAD_API_KEY

Body:
{
  "timezone": "America/New_York",
  "days_of_the_week": [1, 2, 3, 4, 5],
  "start_hour": "08:00",
  "end_hour": "18:00",
  "min_time_btw_emails": 10,
  "max_new_leads_per_day": 20,
  "schedule_start_time": "2026-02-25T00:00:00.000Z"
}
```

`days_of_the_week`: 0=Sunday, 1=Monday, ..., 6=Saturday.

### Step 7: Confirm and Optionally Start

Present a full summary:

```
Campaign: "Truewind - Accounting Firms - Feb 2026"
Campaign ID: 12345
Leads added: 87 (3 rejected as duplicates)
Email sequence: 3 emails (Day 0, Day 3, Day 8)
Schedule: Mon-Fri, 8am-6pm ET, starting Feb 25
Mailboxes: jane@truewind.ai, alex@truewind.ai (+3 more)
Status: DRAFTED
```

Ask: "Do you want to START the campaign now, or leave it as a draft?"

If start:
```
POST https://server.smartlead.ai/api/v1/campaigns/{campaign_id}/status?api_key=$SMARTLEAD_API_KEY

Body:
{ "status": "START" }
```

If draft: skip. User can start from Smartlead UI later.

## Optional: Update Campaign Settings

If the user wants to configure tracking or stop conditions, use:

```
POST https://server.smartlead.ai/api/v1/campaigns/{campaign_id}/settings?api_key=$SMARTLEAD_API_KEY

Body:
{
  "track_settings": ["DONT_TRACK_EMAIL_OPEN"],
  "stop_lead_settings": "REPLY_TO_AN_EMAIL",
  "send_as_plain_text": false,
  "follow_up_percentage": 100,
  "enable_ai_esp_matching": true
}
```

Allowed `track_settings`: `DONT_TRACK_EMAIL_OPEN`, `DONT_TRACK_LINK_CLICK`, `DONT_TRACK_REPLY_TO_AN_EMAIL`
Allowed `stop_lead_settings`: `REPLY_TO_AN_EMAIL`, `CLICK_ON_A_LINK`, `OPEN_AN_EMAIL`

## Smartlead API Reference

All endpoints use base URL `https://server.smartlead.ai/api/v1` with `?api_key=` query param.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/campaigns/create` | POST | Create a new campaign |
| `/campaigns` | GET | List all campaigns |
| `/campaigns/{id}` | GET | Get campaign by ID |
| `/campaigns/{id}/schedule` | POST | Set campaign schedule |
| `/campaigns/{id}/settings` | POST | Update tracking/stop settings |
| `/campaigns/{id}/sequences` | POST | Save email sequences |
| `/campaigns/{id}/leads` | POST | Add leads (max 100 per call) |
| `/campaigns/{id}/email-accounts` | GET | List mailboxes on a campaign |
| `/campaigns/{id}/email-accounts` | POST | Assign mailboxes to campaign |
| `/campaigns/{id}/status` | POST | Change campaign status (START/PAUSED/STOPPED) |
| `/campaigns/{id}/analytics` | GET | Top-level campaign analytics |
| `/email-accounts/` | GET | List all email accounts (offset/limit) |

## Example Prompts

- "Set up a Smartlead campaign for Truewind targeting accounting firms"
- "Create an outreach campaign — I have a CSV of leads"
- "Launch a cold email campaign to CFOs at mid-market companies"
- "Set up a 3-email sequence in Smartlead and allocate 5 free mailboxes"

## Metadata

```yaml
metadata:
  requires:
    env: ["SMARTLEAD_API_KEY"]
  cost: "Free (Smartlead API included with plan that has API access)"
```
