---
name: linkedin-message-writer
description: >
  Research LinkedIn profiles and write personalized messages for any LinkedIn message type —
  connection requests, InMails, DMs, message requests, post comments, and comment replies.
  Takes LinkedIn URLs as input, researches each person (profile data + recent posts via Apify),
  and generates messages tailored to each lead's background, interests, and recent activity.
  Exports tool-ready CSVs for Dripify, Expandi, Botdog, PhantomBuster, or generic format.
  No LinkedIn cookies or login required.
tags: [outreach, social]
---

# LinkedIn Message Writer

Research LinkedIn leads and write personalized messages for any LinkedIn message type. Takes LinkedIn URLs, researches each person using Apify (profile + recent posts), and writes messages based on what it finds.

No LinkedIn cookies. No database setup. Just LinkedIn URLs in, personalized messages out.

## When to Auto-Load

Load this skill when:
- User says "write LinkedIn messages", "LinkedIn outreach", "connect with these leads on LinkedIn", "send LinkedIn messages"
- User has a list of LinkedIn URLs and wants to reach out
- User wants to write personalized connection requests, InMails, DMs, or comments

## Prerequisites

### Apify API Token

Required for researching LinkedIn profiles and posts. Set in `.env`:

```
APIFY_API_TOKEN=your_token_here
```

No LinkedIn cookies, login, or session tokens needed. Apify handles scraping without any LinkedIn credentials.

That's it. One env var. Nothing else.

---

## LinkedIn Message Types Reference

This skill writes any text-based LinkedIn message type. Each type has different constraints.

| Message Type | Who Can Receive | Character Limit | When to Use |
|-------------|----------------|-----------------|-------------|
| **Connection request** | 2nd/3rd degree connections | 200 (free) / 300 (premium) | First touch. Must earn the accept. No selling. |
| **InMail** | Anyone (requires premium credits) | Subject: 200, Body: 1,900 | Standalone pitch to people who won't accept cold connections. Senior execs, busy people. |
| **DM** | 1st-degree connections only | 8,000 | Follow-ups after connection accepted. Conversational, not broadcast. |
| **Message request** | Group members, event attendees, #OpenToWork | 8,000 | Warm context — you share a group or event. Reference the shared context. |
| **Post comment** | Anyone (public posts) | 1,250 | Warm-up before connecting. Show you engaged with their content. Not a pitch. |
| **Comment reply** | Anyone (in a thread) | 1,250 | Engage in a conversation they started. Add value, don't pitch. |

### Key Rules Per Type

**Connection request (200/300 chars):**
- This is the gatekeeper. If they don't accept, nothing else happens.
- Lead with the signal — what they did/said/posted that caught your attention.
- One sentence of relevance. No pitch, no CTA, no "I'd love to..."
- MUST be under the character limit. Count every character. If over, rewrite — never truncate.
- Free accounts: 200 chars. Premium/Sales Navigator: 300 chars. Ask the user which they have.

**InMail (subject 200 + body 1,900 chars):**
- Must work standalone — they haven't accepted your connection.
- Subject: curiosity-driven, not salesy. Not "Quick question" or "Partnership opportunity."
- Body: include context for why you're reaching out (the signal). Be specific.
- Higher commitment ask is OK here — you're using a premium credit.

**DM (8,000 chars):**
- Conversational. These read like DMs, not emails.
- Shorter is almost always better. A 2-sentence message outperforms a 5-sentence one.
- Good for follow-up sequences after connection accepted.
- Sequence structure: Day 0 connection → Day 3 value-first → Day 7 social proof → Day 14 breakup.

**Message request (8,000 chars):**
- Always reference the shared context (group name, event name, OpenToWork status).
- More casual than InMail since you have something in common.

**Post comment (1,250 chars):**
- Add genuine value. Share an insight, ask a smart question, build on their point.
- NOT "Great post!" or "Love this!" — that's noise.
- This is a warm-up move, not a pitch. The goal is to get noticed before connecting.

**Comment reply (1,250 chars):**
- Continue the conversation. Reference what they said specifically.
- Shorter than a standalone comment. 2-3 sentences max.

---

## Workflow

### Phase 0: Intake

Ask the user these questions. Skip any already answered.

**Leads:**
1. Where are your leads? (CSV file, paste LinkedIn URLs, database, CRM — whatever they have)
2. How many leads? (affects cost estimate and whether to use post scraper)

**Message type:**
3. What kind of LinkedIn message do you want to write? (connection request, InMail, DM, message request, post comment, comment reply, or a sequence of multiple types)
4. If connection request: do you have a free or premium LinkedIn account? (affects character limit: 200 vs 300)

**Goal:**
5. What's the objective? (book meetings, drive demo requests, get replies, build relationships, promote content, warm up before outreach)
6. What's the angle or hook? (pain-based, hiring signal, competitor displacement, event-based, content engagement, mutual connection, cold)

**Tone:**
7. Which tone? Present options:
   - **Casual Professional** — Friendly, human, slightly informal. Like messaging a peer. (default)
   - **Thought Leader** — Lead with insight or a contrarian take. Position sender as expert.
   - **Provocative** — Challenge assumptions, pattern-interrupt. Higher risk, higher reward.
   - **Enterprise Formal** — Polished, structured. For regulated industries or C-suite targets.
   - **Custom** — User pastes reference messages that have worked, or describes the vibe.
8. Any reference messages that have worked well? (these override tone presets)

**Context:**
9. What does your company/product do? (one-liner for the AI to work with)
10. Any proof points? (customer names, metrics, case studies to reference)

**Output:**
11. Which LinkedIn outreach tool do you use? (Dripify / Expandi / Botdog / PhantomBuster / Just give me a CSV)

### Phase 1: Load Leads

Accept leads from whatever source the user provides:

- **CSV file:** Read the CSV. Look for a column containing LinkedIn URLs (common names: `linkedin_url`, `LinkedIn URL`, `LinkedIn`, `profile_url`, `url`). If ambiguous, ask the user which column.
- **Pasted URLs:** User pastes LinkedIn URLs directly. Parse them.
- **Pasted list:** User pastes names + companies or other data. Extract what's available.
- **Database/CRM:** Ask the user how to access it. Use whatever tool or export they provide.

**Minimum required:** At least one LinkedIn URL per lead.

Present the lead count to the user and confirm before proceeding to research.

### Phase 2: Research

Research each lead using two Apify actors. Both require only `APIFY_API_TOKEN` — no LinkedIn cookies.

#### Step 1: Profile Data

Use `harvestapi/linkedin-profile-scraper` to get profile data for all leads.

**API call:**
```bash
curl -X POST "https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/runs?token=$APIFY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      {"url": "https://www.linkedin.com/in/PROFILE_1/"},
      {"url": "https://www.linkedin.com/in/PROFILE_2/"}
    ]
  }'
```

**Cost:** $0.003 per profile. 100 leads = $0.30.

**Returns per lead:**
- firstName, lastName, headline
- jobTitle, companyName, companySize, companyIndustry
- Full work history (positions array with title, company, description, duration)
- Education (schools, degrees)
- Skills (with endorsement counts)
- Location, followerCount, connectionsCount
- isCreator, isPremium, isVerified flags

**Polling for results:**
```bash
# Check run status
curl "https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/runs/{RUN_ID}?token=$APIFY_API_TOKEN"

# When status is SUCCEEDED, fetch results
curl "https://api.apify.com/v2/datasets/{DATASET_ID}/items?token=$APIFY_API_TOKEN"
```

#### Step 2: Recent Posts (Optional)

Use `harvestapi/linkedin-profile-posts` to get recent posts. Run this when:
- User asks for deep personalization
- Lead count is small (under 50) and budget allows
- User explicitly wants to reference what leads are posting about

Skip this when:
- Lead count is large (100+) and user wants speed over depth
- User says basic personalization is fine

**API call:**
```bash
curl -X POST "https://api.apify.com/v2/acts/harvestapi~linkedin-profile-posts/runs?token=$APIFY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profileUrls": [
      "https://www.linkedin.com/in/PROFILE_1/",
      "https://www.linkedin.com/in/PROFILE_2/"
    ]
  }'
```

**Cost:** $0.002 per post. ~20 posts per profile = ~$0.04 per lead. 50 leads = $2.00.

**Returns per post:**
- content (full post text)
- engagement (likes, comments, shares, reaction breakdown)
- postedAt (timestamp)
- postImages (if any)
- author info (name, headline)

**Polling:** Same pattern as Step 1.

#### Step 3: Present Research Summary

After research completes, present a summary table:

```
Leads researched: {count}
Profile data: {count} profiles retrieved
Posts scraped: {count} posts from {count} leads (or "skipped")
Research cost: ~${total}

Sample leads:
| Name | Title | Company | Recent Post Topic | Personalization Angle |
|------|-------|---------|-------------------|----------------------|
| Jane Smith | VP Sales | Acme Corp | Posted about AI in sales | Reference her AI post |
| ... | ... | ... | ... | ... |
```

If the user asked to filter/qualify leads, do that now based on profile data (title, company, industry, etc.) and present which leads made the cut.

### Phase 3: Write Messages

Generate personalized messages for each lead based on the research.

#### Personalization Hierarchy

Use the best available signal for each lead. In order of strength:

1. **Recent post content** — Reference a specific post they wrote. Strongest signal.
2. **Work history details** — Reference a specific achievement from their profile (e.g., "scaled from 0 to $8M GMV" is better than "you're a Co-founder").
3. **Creator topics/hashtags** — Reference what they post about broadly.
4. **Current role + company** — Reference their current position and what the company does.
5. **Education/background** — Mutual school, shared background. Weakest but still personal.

If the user provided reference messages that have worked, analyze those for tone, length, structure, and vocabulary. Use them as the template — don't override with defaults.

#### Writing Process

1. **Generate samples first.** Write messages for 3-5 leads with different signal richness levels. Present to user.
2. **Iterate.** User reviews, gives feedback. Adjust tone/approach. Max 3 rounds.
3. **Batch generate.** After approval, write messages for all remaining leads.

#### Character Limit Enforcement

After generating any message, count the characters. If over the limit:
- Rewrite from scratch. Do NOT truncate.
- Truncated messages look broken and unprofessional.
- For connection requests (200/300 chars), every character matters. Be ruthless.

### Phase 4: Export

#### Universal CSV Format

Generate a CSV with these columns:

```
linkedin_url, first_name, last_name, company, title, message_type, message_subject, message_body
```

For sequence-based campaigns (connection + follow-ups), use:

```
linkedin_url, first_name, last_name, company, title, connection_request, followup_1, followup_2, followup_3, inmail_subject, inmail_body
```

#### Tool-Specific Formatting

**Dripify:**
- Columns: `Profile URL`, `Note`, `Message 1`, `Message 2`, `Message 3`
- One row per lead with all messages in separate columns

**Expandi:**
- Columns: `LinkedIn URL`, `Connection message`, `Follow-up #1`, `Follow-up #2`, `Follow-up #3`, `InMail subject`, `InMail message`

**Botdog:**
- Columns: `linkedin_profile_url`, `connection_note`, `message_1`, `message_2`, `message_3`

**PhantomBuster:**
- Columns: `profileUrl`, `message`
- PhantomBuster typically handles one action at a time — may need separate CSVs for connection + follow-ups

**Generic CSV / Other:**
- Use the universal format
- Ask the user what their tool expects and adjust if needed

#### Save Files

Save to the current working directory:
```
{campaign-name}-{YYYY-MM-DD}.csv
```

### Phase 5: Review & Deliver

Present final summary:

```
Campaign: {name}
Message type: {type}
Leads: {count}
Tool: {dripify/expandi/etc.}
Personalization: {profile-only / profile+posts}
Research cost: ~${amount}
Export file: {file_path}
```

Show 3-5 sample messages from the export for final review.

**Do NOT mark as done without explicit user confirmation.** Ask: "Messages look good? Anything to adjust before you import?"

After confirmation:
- Provide the file path
- Give tool-specific import instructions
- Remind user to verify the first few messages after import

---

## Cost Estimates

| Leads | Profile Only | Profile + Posts |
|-------|-------------|----------------|
| 10 | ~$0.03 | ~$0.43 |
| 50 | ~$0.15 | ~$2.15 |
| 100 | ~$0.30 | ~$4.30 |
| 500 | ~$1.50 | ~$21.50 |

Profile scraper: $0.003/profile. Post scraper: ~$0.04/lead (20 posts × $0.002).

---

## Error Handling

| Error | Fix |
|-------|-----|
| `APIFY_API_TOKEN` not set | Ask user to add it to `.env` |
| Apify run fails or times out | Retry once. If still fails, skip that lead and note it. |
| LinkedIn URL is invalid or profile not found | Skip the lead, report it to user |
| 0 profiles returned | Check URL format — must be full LinkedIn URL with `https://` |
| Post scraper returns 0 posts | Person doesn't post publicly. Use profile data only for personalization. |
