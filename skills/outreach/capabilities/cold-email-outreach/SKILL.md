---
name: cold-email-outreach
description: >
  End-to-end cold email outreach orchestration. Handles goal alignment, lead
  ingestion from any source (CSV, paste, CRM export, database), sequence design,
  email generation, campaign setup in the user's chosen outreach tool, and launch.
  Tool-agnostic — supports Smartlead (full MCP automation), Instantly, Lemlist,
  Apollo, or manual CSV export.
tags: [outreach]
---

# Cold Email Outreach

The final mile of the outbound pipeline. Takes leads from wherever the user has them, builds email sequences, loads campaigns into the user's chosen outreach tool, and launches.

**Tool-agnostic:** Asks the user which outreach platform they use. Defaults to Smartlead if they have MCP tools configured. Falls back to CSV export for any other tool or manual workflow.

## When to Use

Use this skill when:
- User says "launch a campaign", "send outreach", "email these leads", "set up cold email"
- User has a list of leads and wants to run an outbound email campaign
- User wants to create and configure a campaign in Smartlead or another outreach tool

## Supported Outreach Tools

This skill does NOT assume a specific tool. It asks first, then adapts.

| Tool | Integration | How It Works |
|------|------------|--------------|
| **Smartlead** (default) | MCP tools (`mcp__smartlead__*`) | Full automation: create campaign, add sequences, import leads, allocate mailboxes, configure schedule, launch |
| **Instantly** | CSV import | Generate CSV matching Instantly's import format, user uploads manually |
| **Lemlist** | CSV import | Generate CSV with Lemlist-compatible columns |
| **Apollo** | CSV import | Generate CSV matching Apollo sequence import format |
| **Manual / Other** | CSV + instructions | Export leads + emails as generic CSV, provide setup instructions |

**Tool selection logic:**
1. Ask user in Phase 0: "Which outreach tool do you use?"
2. If **Smartlead** → use MCP tools for full automation
3. If **Instantly / Lemlist / Apollo** → generate tool-specific import CSV
4. If **Other or unknown** → generate generic CSV (`email`, `first_name`, `last_name`, `company`, `title`, `subject`, `body` per touch) and ask user for their tool's import requirements

## Prerequisites

### Environment Variables

**For Smartlead (full automation):**
```
SMARTLEAD_API_KEY=your_api_key_here
```
All Smartlead API calls go to `https://server.smartlead.ai/api/v1` with `?api_key=$SMARTLEAD_API_KEY` appended. Rate limit: 10 requests per 2 seconds.

**For CSV-based tools:** No env vars needed.

## Phase 0: Intake

Ask all questions at once. Organize by category. Skip any already answered.

### Campaign Goal
1. What's the objective? (book meetings, drive demo requests, get replies, nurture)
2. What's the outreach angle or hook? (hiring signal, competitor displacement, event-based, pain-based, cold database)
3. What should we name this campaign?

### Outreach Tool
4. Which outreach tool do you use? (Smartlead / Instantly / Lemlist / Apollo / Other / Just give me a CSV)

### Lead Source
5. Where are your leads? Accept any of these:
   - **CSV file** — read the file, map columns to required fields
   - **Pasted list** — names, emails, companies pasted directly
   - **CRM export** — Salesforce, HubSpot, or other CRM data
   - **Database query** — if the user has a database, help them query it
   - **Upstream output** — data from a prior task in this conversation
6. Any exclusions? (specific companies, recently contacted leads, certain titles)
7. Max campaign size? (default: 200)

**Minimum required per lead:** email address. Nice to have: first_name, last_name, company, title.

### Sequence Design
8. How many touches? (default: 3)
9. Timing between touches? (default: Day 1 / Day 5 / Day 12)
10. Personalization tier? (Tier 1: merge fields only / Tier 2: segment-specific / Tier 3: unique per lead)

### Sending Config (skip if CSV export)
11. Which email accounts should send? (list accounts or "use all available")
12. Sending schedule? (default: Mon-Fri 8am-5pm in recipient's timezone)
13. Daily send limit per account? (default: 30/day)
14. Track opens and clicks? (default: opens yes, clicks no)

## Phase 1: Lead Ingestion

### Parse Leads

Accept leads from whatever source the user provides:

- **CSV file:** Read the file. Flexibly match columns:
  - `email` (required) — also matches `Email`, `email_address`
  - `first_name` — also matches `firstname`, `first`, `First Name`
  - `last_name` — also matches `lastname`, `last`, `Last Name`
  - `company_name` — also matches `company`, `organization`, `Company`
  - Any extra columns become custom fields
- **Pasted data:** Parse whatever format the user provides. Extract emails, names, companies.
- **CRM/Database:** Help the user query or export, then parse the result.

### Validate & Deduplicate

- Remove rows without a valid email
- Deduplicate by email (keep first occurrence)
- Report: total rows, valid, invalid, duplicates removed

### Present & Confirm

Show a sample table (10-15 leads) with:
- Name, Title, Company, Email

Tell user: total eligible leads, how many were invalid/removed.

Ask user to confirm or adjust before proceeding.

## Phase 2: Sequence Design

Present the sequence plan as a table before writing any copy:

| Touch | Day | Email Type | Framework | CTA |
|-------|-----|-----------|-----------|-----|
| 1 | 1 | Cold intro | Signal-Proof-Ask | 15-min call |
| 2 | 5 | New angle / asset | PAS | Resource offer |
| 3 | 12 | Social proof | BAB | Open to chat? |

Get user approval on the structure before generating copy in Phase 3.

## Phase 3: Email Generation

Write the email copy directly using these guidelines.

### Email Structure Formula

Every cold email follows this skeleton:

```
Hook (1 sentence) → Evidence (1-2 sentences) → Offer (1 sentence)
```

**Word count targets:**
- Cold intro (Touch 1): 50-90 words
- Follow-up (Touch 2-3): 30-50 words
- Breakup (final touch): 20-40 words

### By Personalization Tier

**Tier 1 (Generic):** Generate one template per touch with merge fields (`{first_name}`, `{company}`, `{title}`). Same template for all leads.

**Tier 2 (Segment):** Generate one template per segment per touch. Segments are defined by role, industry, or signal type. Swap pain points and proof points between segments.

**Tier 3 (Deep):** Generate unique email per lead per touch. Cap at 50 leads — recommend Tier 2 above that volume.

### Hard Rules

1. **No filler openers.** Never "I hope this finds you well"
2. **No "just checking in" follow-ups.** Every touch adds a new reason to reply
3. **Under 150 words per email.** Most should be 80-120.
4. **One CTA per email.** Always low-friction.
5. **No selling in the first sentence.** Lead with them, not you.
6. **Subject lines under 50 chars.** No caps, no exclamation marks, no emoji.
7. **Sign off with name only.** No "Best regards."

### Review Loop

1. Generate sample emails for 3-5 leads first
2. Present to user for review
3. Iterate until approved (max 3 rounds)
4. Generate remaining emails after approval

## Phase 4: Campaign Setup

### If Smartlead (MCP Automation)

Full automation via MCP tools. Execute in this order:

**Step 1: Find and allocate mailboxes**

```
mcp__smartlead__get_email_accounts
```

Returns all email accounts with `id`, `from_email`, `from_name`, `daily_sent_count`, `is_smtp_success`, `is_imap_success`.

To find **free mailboxes** (not already assigned to active campaigns):

1. Fetch all campaigns: `mcp__smartlead__get_campaigns`
2. For each campaign with status `ACTIVE` or `STARTED`, fetch its email accounts: `mcp__smartlead__get_campaign_email_accounts`
3. Build a set of all `email_account_id` values currently assigned to active campaigns
4. A mailbox is "free" if its `id` is NOT in the active set AND `is_smtp_success` = true AND `is_imap_success` = true
5. Sort free mailboxes by `daily_sent_count` ascending (prefer least-used)
6. Select the requested number of free mailboxes

If fewer free mailboxes than requested, tell the user and ask how to proceed.

Present available/selected accounts to user for confirmation.

**Step 2: Create campaign**

```
mcp__smartlead__create_campaign
  name: {campaign_name}
```

Save the returned `campaign_id`.

**Step 3: Add sequence steps**

```
mcp__smartlead__save_campaign_sequences
  campaign_id: {campaign_id}
  sequences: [
    { seq_number: 1, subject: "...", email_body: "...", seq_delay_details: { delay_in_days: 0 } },
    { seq_number: 2, subject: "...", email_body: "...", seq_delay_details: { delay_in_days: 4 } },
    { seq_number: 3, subject: "...", email_body: "...", seq_delay_details: { delay_in_days: 7 } }
  ]
```

**Merge variable mapping:** Convert `{first_name}` → `{{first_name}}`, `{company}` → `{{company}}` (Smartlead uses double-brace syntax).

**Note:** Blank `subject` on emails 2+ makes them send as replies in the same thread.

**Step 4: Import leads (batch 100)**

```
mcp__smartlead__add_leads_to_campaign
  campaign_id: {campaign_id}
  lead_list: [{ email: "...", first_name: "...", last_name: "...", company_name: "...", ... }]
```

Smartlead accepts max 100 leads per call. Chunk the list and call for each batch. Extra columns become `custom_fields`.

**Step 5: Assign sending accounts**

```
mcp__smartlead__add_email_accounts_to_campaign
  campaign_id: {campaign_id}
  email_account_ids: [...]
```

**Step 6: Set schedule**

```
mcp__smartlead__update_campaign_schedule
  campaign_id: {campaign_id}
  schedule: {
    timezone: "America/New_York",
    days_of_the_week: [1, 2, 3, 4, 5],
    start_hour: "08:00",
    end_hour: "18:00",
    min_time_btw_emails: 10,
    max_new_leads_per_day: 20
  }
```

`days_of_the_week`: 0=Sunday, 1=Monday, ..., 6=Saturday.

**Step 7: Configure settings**

```
mcp__smartlead__update_campaign_settings
  campaign_id: {campaign_id}
  settings: {
    track_settings: [],
    stop_lead_settings: "REPLY_TO_AN_EMAIL",
    send_as_plain_text: false,
    follow_up_percentage: 100
  }
```

Allowed `track_settings`: `DONT_TRACK_EMAIL_OPEN`, `DONT_TRACK_LINK_CLICK`, `DONT_TRACK_REPLY_TO_AN_EMAIL`
Allowed `stop_lead_settings`: `REPLY_TO_AN_EMAIL`, `CLICK_ON_A_LINK`, `OPEN_AN_EMAIL`

### If CSV-Based Tool (Instantly, Lemlist, Apollo, Other)

**Step 1: Generate CSV**

Columns depend on personalization tier:

**Tier 1 (same template for all):**
- CSV columns: `email`, `first_name`, `last_name`, `company`, `title`, `custom_field_1` (signal/hook)
- Separate file with sequence templates (subjects + bodies with merge fields)

**Tier 2/3 (per-segment or per-lead emails):**
- CSV columns: `email`, `first_name`, `last_name`, `company`, `title`, `touch_1_subject`, `touch_1_body`, `touch_2_subject`, `touch_2_body`, `touch_3_subject`, `touch_3_body`

**Step 2: Save file**

Save to the current working directory:
```
{campaign-name}-{YYYY-MM-DD}.csv
```

**Step 3: Provide tool-specific import instructions**

**Instantly:**
- Upload CSV → Sequences → Create new sequence
- Map columns: Email → email, First Name → first_name, etc.
- Paste sequence templates into each step
- Set delays between steps

**Lemlist:**
- People → Import → Upload CSV
- Map custom variables to columns
- Create campaign → add email steps → insert variables

**Apollo:**
- Sequences → Create Sequence → add email steps
- Contacts → Import → Upload CSV
- Add imported contacts to sequence

**Other / Manual:**
- Provide the CSV path and explain the column structure
- Ask user what format their tool expects, adjust if needed

## Phase 5: Review & Launch

Present campaign summary:

```
Campaign: {name}
Leads: {count}
Sequence: {touches} touches over {days} days
Sending: {accounts} accounts × {daily_limit}/day = {daily_volume} emails/day
Estimated completion: {date}
Tool: {smartlead/instantly/etc.}
```

### Hard Approval Gate

**Do NOT activate the campaign without explicit user confirmation.** Present the summary, then ask: "Ready to launch? Type 'yes' to activate."

- **Smartlead:** `mcp__smartlead__update_campaign_status` → set status to `START`
- **CSV tools:** Tell user the file is ready for import, provide the file path

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

## Cost

| Component | Cost |
|-----------|------|
| Smartlead campaign setup | Free (API included with Smartlead plan) |
| CSV export | Free |
| Email copy generation | Free (LLM reasoning) |

## Error Handling

| Error | Fix |
|-------|-----|
| `SMARTLEAD_API_KEY` not set | Ask user to add it to `.env` or export it |
| Smartlead rate limit (429) | Wait 2 seconds and retry |
| Lead upload fails | Check email format, retry batch |
| No free mailboxes | Show all accounts, ask user which to use |
| Campaign creation fails | Check API key validity |
