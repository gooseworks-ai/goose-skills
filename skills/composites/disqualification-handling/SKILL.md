---
name: disqualification-handling
version: 1.0.0
description: >
  Handles disqualified and near-miss inbound leads gracefully. Drafts polite rejection emails,
  referral requests (right company wrong person), and nurture routing (future fit). Ensures no
  inbound lead gets ignored and every disqualification preserves the relationship. Tool-agnostic.
tags: [outreach]
---

# Disqualification Handling

Processes leads that didn't pass ICP qualification. Instead of ignoring them, this composite handles each category appropriately: polite rejection, referral request, or nurture routing. No inbound lead should feel ghosted.

## When to Auto-Load

Load this composite when:
- User says "handle the disqualified leads", "draft rejection emails", "what do we do with the ones that didn't qualify?"
- `inbound-lead-qualification` has completed and disqualified/near-miss leads need handling
- User has a list of leads that don't fit and wants appropriate responses

## Architecture

```
[Disqualified Leads] → Step 1: Categorize → Step 2: Draft Responses → Step 3: Route to Destination
                              ↓                      ↓                         ↓
                     4 handling categories    Tailored email per type    Nurture/CRM/archive
```

---

## Step 0: Configuration (Once Per Client)

On first run, establish response preferences.

```json
{
  "sender_name": "",
  "sender_title": "",
  "company_name": "",
  "tone": "warm-professional | casual-friendly | formal",
  "nurture_sequence_tool": "Smartlead | HubSpot | Mailchimp | CSV export | none",
  "referral_incentive": "none | mention mutual value | offer resource",
  "include_resource_link": true,
  "resource_url": "",
  "resource_description": "",
  "feedback_survey_url": "",
  "do_not_contact_list": "Supabase | CSV | none"
}
```

**On subsequent runs:** Load config silently.

---

## Step 1: Categorize Disqualified Leads

### Input
Leads from `inbound-lead-qualification` with sub-verdicts. Categorize each into one of four handling paths:

### Category 1: Right Company, Wrong Person → REFERRAL REQUEST
**Trigger:** `mismatch_type = right_company_wrong_person`
- The company fits ICP but the person who came inbound isn't a buyer/champion/user
- Example: A marketing intern at a perfect-fit company downloaded a whitepaper
- Goal: Get an introduction to the right person at that company

**Identify the referral target:**
- Using the ICP's buyer personas, determine who at this company we SHOULD be talking to
- If enrichment data or CRM has other contacts at the company, note them (but still ask for the intro — warmer than cold outreach)

### Category 2: Close But Not Quite → NURTURE (FUTURE FIT)
**Trigger:** `sub_verdict = near_miss_nurture` OR score 30-49 without a referral opportunity
- Company is almost ICP but not today — too small, too early stage, wrong geography (but expanding), missing a key requirement that might change
- Example: A 15-person startup that's clearly growing fast but below your 50-employee minimum
- Goal: Stay on their radar. When they hit the threshold, you're top of mind.

### Category 3: Clearly Outside ICP → POLITE DECLINE
**Trigger:** `sub_verdict = disqualified_polite` OR score < 30
- Not a fit now and unlikely to become one
- Example: A freelancer, a student, a company in an excluded industry
- Goal: Decline gracefully. Don't burn bridges — they might refer someone, post about you, or their situation might change unexpectedly.

### Category 4: Special Flags → ROUTE DIFFERENTLY
**Trigger:** `sub_verdict = disqualified_competitor` OR `pipeline_status = existing_customer`
- **Competitor employee:** Do NOT send a rejection email. Log for competitive intelligence. No outreach.
- **Existing customer:** Do NOT treat as disqualified. Route to customer success / account management. May be an upsell or support need.

### Output
Each lead tagged with: `handling_category`, `handling_action`, `referral_target_persona` (for Category 1)

---

## Step 2: Draft Responses

### Category 1 Response: Referral Request Email

**Objective:** Thank them, subtly indicate they may not be the right person, and ask for an introduction — without making them feel dismissed.

**Structure:**
1. **Thank them** for their interest (reference what they did — demo request, download, etc.)
2. **Acknowledge their role** — show you understand what they do
3. **Pivot to the right person** — frame it as "wanting to make sure the right person gets the most value"
4. **Make the ask easy** — provide a specific persona/title to connect you with
5. **Offer something in return** — a resource relevant to THEIR role (not just the buyer's)

**Template framework:**

```
Subject: Thanks for checking us out, [First Name]

Hi [First Name],

Thanks for [downloading our guide on X / requesting a demo / signing up for the trial].
[One sentence connecting their action to a genuine insight — "it's a great resource for
understanding Y."]

I took a look at [Company] — [one sentence showing you understand the company].
Given what [Product] does, I think [target persona title, e.g., "your VP of Engineering"
or "whoever leads infrastructure decisions"] would get the most out of a conversation
with us.

Would you be open to making an introduction? Happy to send you a quick blurb you
can forward, so it's zero effort on your end.

[If resource_link configured: "In the meantime, here's [resource] that might be
useful for [something relevant to THEIR role]."]

Thanks,
[Sender Name]
```

**Rules:**
- Never say "you're not the right person" or "you don't have buying authority"
- Never use the word "unfortunately" or "however"
- Frame the referral as maximizing value, not correcting a mistake
- Keep it under 120 words
- If you know the specific name of the right person (from enrichment/CRM), mention them: "I think [Name] on your [team] would find this valuable"

### Category 2 Response: Nurture Warm-Down Email

**Objective:** Keep the relationship warm without false promises. Position yourself as a future resource.

**Structure:**
1. **Thank them** for their interest
2. **Be honest (but tactful)** about fit — don't say "you're disqualified", say "given where [Company] is today, the timing might not be perfect"
3. **Offer genuine value** — share a resource relevant to their current stage/situation
4. **Leave the door open** — invite them to reach out when circumstances change
5. **No hard CTA** — this is a soft touch, not a sales push

**Template framework:**

```
Subject: [First Name] — thanks for your interest in [Product]

Hi [First Name],

Thanks for [action they took]. I looked into [Company] and really like
[genuine compliment — what they're building, their growth, their approach].

Based on where [Company] is right now, I think [honest reason the timing
isn't right, framed positively — e.g., "you'd get the most value from us
once your team scales past X" or "this tends to be most impactful after Y
milestone"].

In the meantime, [here's a resource / I'd recommend / you might find this useful] —
[brief description of why it's relevant to them NOW, not just to your product].

I'll keep an eye on [Company] — would love to reconnect when the timing
is better. Feel free to reach out anytime.

Best,
[Sender Name]
```

**Rules:**
- Never say "disqualified", "not a fit", "don't meet our criteria"
- Frame timing as the issue, not them — "not yet" beats "not ever"
- The shared resource should be genuinely useful to them at their current stage, not just a product pitch
- Keep it under 100 words
- Warm but not overly familiar

### Category 3 Response: Polite Decline Email

**Objective:** Decline gracefully while leaving a positive impression of your brand.

**Structure:**
1. **Thank them** for their interest
2. **Brief honest explanation** — keep it high-level ("we specialize in X and it sounds like you need Y")
3. **Redirect if possible** — suggest an alternative tool/service if you know one
4. **Close warmly**

**Template framework:**

```
Subject: Thanks for reaching out, [First Name]

Hi [First Name],

Thanks for your interest in [Product]. I appreciate you taking the time to
[action they took].

We're focused specifically on [your niche/ICP in plain language], and it
sounds like [their situation — framed neutrally, not critically] might be
a different use case from what we're built for.

[If you know an alternative: "You might want to check out [Alternative] —
they're strong for [their actual need]."]

[If no alternative: "I don't want to waste your time, but if your needs
evolve, we'd be happy to chat."]

Best of luck with [something specific to their situation],
[Sender Name]
```

**Rules:**
- Never apologize ("sorry we can't help") — you're not obligated
- Never be dismissive or condescending
- Keep it under 80 words
- If you can genuinely suggest an alternative, do — it builds goodwill
- Don't over-explain why they don't fit. One sentence is enough.

### Category 4: No Email

- **Competitor:** Add to competitive intel tracking. No outbound response. Log: "Competitor employee [Name] from [Company] engaged via [source] on [date]."
- **Existing customer:** Draft a brief internal routing note: "Existing customer [Company] ([contact name]) came inbound via [source]. Current plan: [plan]. Account owner: [owner]. Possible upsell signal." Route to CS/AM.

---

## Step 3: Route to Destination

### For Each Category:

| Category | Email Action | CRM Action | Sequence Action |
|----------|-------------|------------|-----------------|
| Referral Request | Draft ready for human review & send | Tag as `referral_pending` | None — single touch |
| Nurture | Draft ready for human review & send | Tag as `nurture_future_fit`, set reminder for re-evaluation in 3-6 months | Add to nurture drip if configured |
| Polite Decline | Draft ready for human review & send | Tag as `disqualified_responded`, note reason | None — single touch |
| Competitor | No email | Tag as `competitor_employee`, log in competitive intel | None |
| Existing Customer | No sales email | Flag for CS/AM team, note the inbound action | None |

### Nurture Sequence Setup (Category 2)

If a nurture sequence tool is configured:
1. Group nurture leads by their "why not yet" reason — this determines the drip content
2. Suggest sequence themes:
   - "Too small right now" → Growth-stage content, case studies of similar companies that grew into ICP
   - "Wrong stage" → Stage-appropriate content, milestone-based check-ins
   - "Missing requirement" → Product update notifications, roadmap content
3. Add to appropriate sequence or produce a CSV for manual import

### Re-Evaluation Triggers

For Category 2 (nurture) leads, define when to re-evaluate:
- Company raises funding → re-run qualification
- Company headcount crosses threshold → re-run qualification
- Person gets promoted → re-run qualification
- 6 months have passed → manual re-evaluation prompt

If signal composites are active (`funding-signal-outreach`, `hiring-signal-outreach`, `champion-move-outreach`), these triggers happen automatically.

---

## Output Format

### Primary: Response Queue for Human Review

```markdown
## Disqualification Handling: [Date]

### Summary
- **Total disqualified/near-miss leads:** X
- **Referral requests (right co, wrong person):** X
- **Nurture (future fit):** X
- **Polite decline:** X
- **Competitor (no response):** X
- **Existing customer (route to CS):** X

---

### Referral Requests — Review & Send

#### [Name] — [Title] at [Company]
- **Why not them:** [one sentence — e.g., "Marketing coordinator, we need VP Engineering"]
- **Referral target:** [Title/persona we want to reach]
- **Known contacts at company:** [from enrichment/CRM, if any]
- **Draft email:**
  > [email draft]

---

### Nurture — Review & Send

#### [Name] — [Title] at [Company]
- **Why not yet:** [one sentence — e.g., "20 employees, ICP starts at 50"]
- **Re-evaluate when:** [trigger — e.g., "headcount crosses 50" or "6 months"]
- **Draft email:**
  > [email draft]

---

### Polite Decline — Review & Send

#### [Name] — [Title] at [Company]
- **Why not a fit:** [one sentence]
- **Suggested alternative:** [if known]
- **Draft email:**
  > [email draft]

---

### Flagged (No Outreach)

**Competitors:**
- [Name] from [Company] — [what they did] on [date]

**Existing Customers:**
- [Name] from [Company] — [what they did] — Current account owner: [name]
```

### Secondary: CSV Export

Append to the qualification CSV or produce a separate handling CSV:
- All lead fields + `handling_category`, `handling_action`, `email_draft`, `referral_target`, `nurture_trigger`, `re_evaluate_date`

Save to the current working directory or wherever the user prefers.

---

## Handling Edge Cases

**Lead who's clearly a bot or spam:**
Skip all categories. Tag as `spam` and archive. Don't waste an email draft. Signs: gibberish name, test@test.com, form filled in < 2 seconds, obvious fake company.

**Lead who requested a demo but is clearly disqualified:**
Still draft a polite decline. A demo request deserves a human response even if the answer is no. Consider: if they're a strong referral opportunity (right company), prioritize the referral path over the decline path.

**Lead at a competitor's customer:**
This is NOT a competitor employee — this is someone at a company that uses a competitor. They came inbound, which means they might be looking to switch. Do NOT disqualify. Route back to qualification as a high-priority signal.

**Multiple people from the same company, some qualified, some not:**
For disqualified people at a company where someone else qualified: Draft a softer version that acknowledges "we're already in touch with your team at [Company]" — don't send a rejection to someone whose colleague is in active talks.

**Lead who's a journalist, analyst, or investor:**
Not a customer, but not a "decline" either. Flag separately: "Non-customer interest from [Name], [Role] at [Publication/Fund]. May be PR/AR opportunity." Route to marketing or founder.

**Very high-volume batches (50+ disqualified):**
- Category 3 (polite decline) and Category 2 (nurture) can use lighter-touch templates rather than personalized drafts
- Category 1 (referral requests) should always be personalized — these are the highest-value disqualified leads

---

## Email Hard Rules

All draft emails must follow these rules regardless of category:

1. **No lies.** Don't say "we'd love to work with you" if you're declining them.
2. **No guilt.** Don't make them feel bad for reaching out.
3. **No jargon.** "ICP", "qualification", "disqualified" never appear in emails.
4. **Brevity.** Referral < 120 words. Nurture < 100 words. Decline < 80 words.
5. **One CTA maximum.** Referral: make the intro. Nurture: check the resource. Decline: none or soft redirect.
6. **No false urgency.** These are goodwill emails, not sales emails.
7. **Genuine value.** If you offer a resource, it should actually help them — not be a disguised pitch.
8. **Reply-friendly.** Write in a way that they COULD reply if they wanted to. No "noreply" energy.

---

## Tools Required

- **Email drafting** — references `email-drafting` capability for tone and structure
- **CRM access** — to update lead status, add tags, set reminders
- **Nurture sequence tool** — to add leads to drip campaigns (Smartlead, HubSpot, etc.)
- **Supabase client** — for pipeline lookups and signal cross-reference
- **Read/Write** — for CSV output and config management
