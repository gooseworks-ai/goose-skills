---
name: sales-call-recap-engine
description: Turn sales call transcripts or rough notes into customer-safe recap emails, CRM notes, action items, risks, and next-touch recommendations without inventing commitments.
tags: [outreach, research]
---

Use this skill when the user provides a sales call transcript, meeting notes, discovery notes, demo notes, or a messy post-call dump and wants a clean follow-up package.

The goal is to turn the conversation into usable deal motion: a concise customer-facing recap, an internal CRM note, owners and due dates for follow-up tasks, open questions, and a clear recommendation for the next touch.

## Non-Negotiables

- Do not invent commitments, pricing, timelines, technical claims, integrations, security answers, or next steps.
- Keep customer-facing copy limited to what was explicitly said or clearly agreed.
- Put uncertainty in internal notes, not in the customer recap.
- Separate external recap content from internal CRM commentary.
- Preserve sensitive details only when they are necessary for the sales process; otherwise summarize or redact them.
- If the source is too thin to prove a customer-facing statement, mark it as an open question.
- Never send messages automatically. Produce drafts and task lists for review.

## Intake

First identify what evidence is available.

Ask for missing inputs only when they are necessary to avoid guessing:

- transcript or notes
- account name and contacts
- date of call
- deal stage
- product or offer discussed
- seller-side owner
- known next meeting or deadline
- CRM format preference, if any

If the user only has rough notes, proceed with a lower-confidence output and label assumptions clearly.

## Workflow

### 1. Normalize The Source

Read the transcript or notes once for structure before writing.

Extract:

- participants and roles
- stated business problem
- current workflow or tool stack
- impact or urgency
- decision process and stakeholders
- budget or procurement hints
- competitors or alternatives
- objections and unresolved concerns
- promises made by either side
- dates, owners, and follow-up commitments

Mark each item as confirmed, inferred, or unknown.

### 2. Build The Evidence Map

Create a compact internal map before drafting:

- customer pains
- value hooks
- proof points requested
- product areas discussed
- risks
- open questions
- next-step candidates

Use this map to keep every output grounded. If two notes conflict, call out the conflict instead of smoothing it over.

### 3. Draft The Customer Recap

Write a short email that a rep could send without sounding automated.

Required structure:

- thanks and one-line context
- what was discussed
- agreed next steps
- requested materials or answers
- next meeting or proposed time
- clear sign-off

Keep the tone plain, specific, and useful. Avoid hype, pressure, and internal labels like score, risk, champion, blocker, or procurement weakness.

### 4. Draft The CRM Note

Write the internal CRM note separately.

Include:

- call summary
- deal stage signal
- qualification notes
- stakeholder map
- pain and impact
- objections
- competitors
- requested follow-up
- next action
- risk level with reason
- confidence level based on source quality

Use concise fields so the note can be pasted into Salesforce, HubSpot, Pipedrive, Close, or a spreadsheet.

### 5. Create Follow-Up Tasks

Produce a task list with:

- task
- owner
- due date or timing
- source evidence
- priority

If no due date was agreed, recommend one based on urgency and label it as suggested.

### 6. Recommend The Next Touch

Choose one best next action:

- send recap email
- send technical answer
- send proof point or case study
- schedule stakeholder call
- prepare security or procurement packet
- qualify budget or decision process
- disqualify or nurture

Explain the reason in one or two sentences.

## Output Format

Return the result in this order:

1. Status: ready, needs review, or insufficient evidence
2. Customer-facing recap email
3. CRM note
4. Follow-up tasks
5. Risks and open questions
6. Recommended next touch
7. Evidence gaps

Keep the final package compact enough to use immediately. If the transcript is long, do not summarize every topic; prioritize what changes the next sales action.

## Quality Check

Before finishing, run this checklist:

- No customer-facing statement relies on an internal inference.
- Every task has an owner or a clear suggested owner.
- Every due date is either stated by the customer or marked as suggested.
- The CRM note includes risk without leaking it into the customer recap.
- The next touch is singular and actionable.
- The output can be pasted into email and CRM without cleanup.
