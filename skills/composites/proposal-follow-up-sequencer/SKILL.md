---
name: proposal-follow-up-sequencer
description: Build prioritized follow-up plans for sent proposals, quotes, and open deals by diagnosing stall reasons, choosing the right next action, and drafting buyer-specific follow-up sequences.
tags: [outreach]
---

# Proposal Follow-Up Sequencer

Turn sent proposals, quotes, and open deal threads into a clear follow-up plan. This skill diagnoses why each deal is stalled, ranks which opportunities deserve attention first, and writes specific follow-up messages that move the buyer toward a decision without sounding like "just checking in."

Core principle: proposal follow-up is not reminder sending. It is deal recovery. Each touch should reduce a real buying risk, give the buyer something useful, or make the next decision step easier.

## When To Use

- A proposal, quote, SOW, pilot plan, or renewal offer has been sent and the buyer has not responded.
- A founder or seller wants to know which open proposals to chase first.
- A buyer replied with timing, budget, stakeholder, procurement, legal, or implementation hesitation.
- A team needs a follow-up sequence for deals in proposal, negotiation, procurement, renewal, or pilot approval stages.
- A seller wants to recover old proposals without sending generic bump emails.
- A sales manager wants a weekly follow-up plan for stalled open deals.

## Inputs

Ask for the smallest complete packet available:

1. Proposal or quote details: offer, price, scope, expiration date, and date sent.
2. Buyer company, industry, size, and use case.
3. Primary contact, role, authority level, and relationship strength.
4. Other stakeholders: decision-maker, technical validator, finance, legal, procurement, champion, blocker.
5. Discovery notes: pain, desired outcome, urgency, timeline, current alternative, and success criteria.
6. Last buyer message or meeting notes.
7. Known objections or risks: price, timing, priority, trust, switching cost, implementation, security, legal, internal alignment.
8. Deal value, expected close date, and current stage.
9. Previous follow-ups already sent, with dates and replies.
10. Available proof points: customer stories, metrics, ROI math, implementation plan, security docs, samples, references.

If inputs are incomplete, proceed with conservative assumptions and mark missing details as `Needed To Improve Follow-Up`.

## Operating Rules

- Do not write "just checking in", "circling back", or "touching base" unless the user explicitly requests that tone.
- Do not pressure the buyer with fake urgency, false scarcity, fabricated discounts, or invented deadlines.
- Do not invent proof, customer names, legal claims, security certifications, implementation capacity, or pricing authority.
- Prefer one clear next step over multiple vague options.
- Match the message to the stall reason. A budget stall needs ROI or scope options; a stakeholder stall needs internal-forwardable material; a timing stall needs a low-friction next checkpoint.
- Separate buyer-facing copy from internal deal notes.
- Respect opt-out, do-not-contact, legal, procurement, and privacy constraints.
- If the buyer has gone cold after several touches, end with a clean breakup email instead of indefinite nudging.

## Workflow

### Phase 1: Normalize The Deal

Create a deal snapshot:

| Field | Value |
|---|---|
| Buyer | [Company and contact] |
| Offer | [Proposal or quote summary] |
| Amount | [$ value or unknown] |
| Sent Date | [Date] |
| Days Since Sent | [Number] |
| Last Buyer Signal | [Most recent reply, meeting, or action] |
| Current Stage | [Proposal / Negotiation / Procurement / Legal / Renewal / Pilot Approval] |
| Decision Owner | [Name or role] |
| Champion | [Name or role] |
| Main Risk | [Biggest likely reason for no movement] |
| Recommended Next Action | [Action] |

If there are multiple deals, produce one row per deal before writing copy.

### Phase 2: Diagnose The Stall Reason

Classify the primary stall reason. Use evidence from the deal, not guesswork.

| Stall Reason | Evidence | Best Follow-Up Move |
|---|---|---|
| Busy or low priority | Positive intent but no next meeting, short replies, no deadline | Make the next step tiny and specific |
| Budget concern | Price hesitation, asks for discount, compares alternatives | Reframe ROI, offer scope options, anchor cost of inaction |
| Internal alignment | "Need to discuss internally", multiple stakeholders missing | Provide forwardable summary and decision checklist |
| Technical validation | Security, integration, data, migration, or implementation questions | Send technical proof, checklist, or validation call offer |
| Procurement or legal | Vendor setup, contract, PO, tax, data processing, compliance | Ask for process owner and required documents |
| Timing | "Next quarter", "after launch", "too busy right now" | Set a future checkpoint tied to their event |
| Trust gap | New vendor, no proof, unclear delivery risk | Send proof, sample deliverable, reference, or small pilot option |
| Champion gap | Contact lacks authority or went quiet after sharing internally | Help them sell it internally or find economic buyer |
| Competitive comparison | Mentions other vendors or current solution | Provide comparison framing and switching risk analysis |
| No real opportunity | Weak discovery, no pain, no urgency, no authority | Send graceful close-the-loop and deprioritize |

If two reasons are plausible, choose the one with the highest deal impact and mention the secondary risk.

### Phase 3: Score Follow-Up Priority

For each deal, score from 1-5:

- **Value:** contract amount or strategic importance.
- **Urgency:** deadline, event, pain severity, or expiring decision window.
- **Buyer Fit:** ICP match, ability to pay, use case clarity.
- **Engagement:** recency and quality of buyer interaction.
- **Recoverability:** likelihood that a specific action can unblock the deal.

Compute:

```
Priority Score = Value + Urgency + Buyer Fit + Engagement + Recoverability
```

Priority tiers:

| Score | Tier | Action |
|---|---|---|
| 21-25 | A | Personal follow-up today; consider founder/exec involvement |
| 16-20 | B | Personalized follow-up this week |
| 11-15 | C | Light sequence or timed nurture |
| 5-10 | D | Breakup, recycle, or deprioritize |

### Phase 4: Choose The Follow-Up Strategy

Pick one primary strategy:

1. **Decision Simplifier**: Make the next step smaller, clearer, and easier.
2. **Internal Champion Kit**: Give the contact a forwardable summary for stakeholders.
3. **ROI Reframe**: Connect the price to cost of delay, saved time, risk reduction, or revenue upside.
4. **Proof Drop**: Send a relevant case study, sample, benchmark, or reference.
5. **Risk Reversal**: Offer a pilot, phased scope, implementation plan, or success criteria.
6. **Process Unblocker**: Ask for the procurement/legal/security path and owner.
7. **Timing Anchor**: Tie follow-up to a concrete event or date.
8. **Clean Breakup**: Politely close the loop and make it easy to re-open later.

Do not combine more than two strategies in one message.

### Phase 5: Draft The Sequence

Generate a sequence with timing. Default to 4 touches over 14-21 days unless the user requests otherwise.

#### Touch 1: Value-Based Follow-Up

Use when the proposal was sent 2-5 business days ago.

```
Subject: Next step on [outcome]

Hi [First Name],

I was thinking about [specific pain or goal from discovery] after sending the proposal.

The part I would prioritize first is [specific scope item], because it directly affects
[business outcome or risk].

If it is useful, I can make the decision easier by sending [one useful asset: ROI summary,
implementation outline, stakeholder summary, sample deliverable].

Would [specific next step] be useful before you decide?

[Sender]
```

#### Touch 2: Objection-Specific Follow-Up

Use when there is a known likely stall reason.

```
Subject: [Concern] on [project/offer]

Hi [First Name],

One thing that may be worth clarifying: [likely concern stated plainly].

Here is how I would think about it:
- [Point 1: evidence, tradeoff, or scope clarification]
- [Point 2: implementation, ROI, or risk reduction]
- [Point 3: what changes if they say yes now]

If [concern] is the main blocker, I can [specific help: adjust scope, send summary,
walk through implementation, answer security questions].

Should I send that over, or is something else holding this up?

[Sender]
```

#### Touch 3: Champion Forward

Use when the contact needs internal buy-in.

```
Subject: Forwardable summary for [project]

Hi [First Name],

I put the decision in a short internal format in case it helps:

Problem: [Pain]
Proposed fix: [Offer]
Expected impact: [Outcome]
Decision needed: [Yes/no, pilot approval, scope choice, procurement step]
Main risk addressed: [Risk]
Open question: [Question]

If helpful, I can turn this into a one-page version for [finance / leadership / technical team].

[Sender]
```

#### Touch 4: Clean Breakup

Use after several unanswered touches or when fit is uncertain.

```
Subject: Closing the loop

Hi [First Name],

I have not heard back, so I will close the loop on my side for now.

If [problem/outcome] becomes a priority again, the fastest path would be [specific next step].

Either way, thanks for considering it.

[Sender]
```

## Output Format

### 1. Deal Priority Table

| Deal | Score | Tier | Stall Reason | Next Action | Timing |
|---|---:|---|---|---|---|
| [Company] | [Score] | [A-D] | [Reason] | [Action] | [Date/time] |

### 2. Deal Diagnosis

For each deal:

- **Why it is stalled:** [Evidence-based diagnosis]
- **What would unblock it:** [Specific action]
- **Risk if ignored:** [Revenue, timing, relationship, or opportunity cost]
- **Do not do:** [Messaging or action to avoid]

### 3. Follow-Up Sequence

For each priority A or B deal:

- Touch number
- Send date or interval
- Channel
- Objective
- Subject line
- Message body
- Internal note

### 4. Buyer-Facing Assets

Include any useful add-ons:

- Forwardable executive summary.
- ROI note.
- Scope options table.
- Implementation checklist.
- Procurement/security questions.
- Pilot success criteria.
- Breakup email.

### 5. Needed To Improve Follow-Up

List missing details that would materially improve the sequence:

- [Missing stakeholder]
- [Missing proof point]
- [Missing objection detail]
- [Missing deadline]

## Message Quality Checklist

Before finalizing, verify:

- The first line references a real buyer-specific detail.
- The message has one clear CTA.
- The email gives value even if the buyer does not reply.
- The sequence does not repeat the same ask in different words.
- The tone is calm and specific, not needy.
- No proof, urgency, discount, or authority is invented.
- There is a clear stop condition.

## Variants

### Founder-Led Follow-Up

Use for high-value, strategic, or stuck executive deals:

- Shorter.
- More direct.
- Focus on outcome and tradeoff.
- Avoid operational detail unless it is the blocker.

### Procurement Follow-Up

Use when the business decision is made but process is stuck:

- Ask for process owner.
- Ask for required vendor forms.
- Ask whether legal, security, tax, or payment setup is the next step.
- Do not renegotiate value unless the buyer reopens scope.

### Low-Trust Buyer Follow-Up

Use when the buyer is interested but unsure the seller can deliver:

- Send a sample deliverable.
- Offer a small pilot or phased scope.
- Clarify success criteria.
- Name what is not included to reduce ambiguity.

### Expired Proposal Recovery

Use when the quote is old:

- Acknowledge the time gap.
- Ask whether the problem still exists.
- Offer to refresh scope instead of pretending the old proposal is current.
- Do not create urgency around an expired date.

## Example Mini Output

```
Deal: Acme Logistics website audit
Score: 18 / Tier B
Stall reason: Busy or low priority, with possible stakeholder gap.
Next action: Send a decision simplifier plus a forwardable summary.

Subject: Quick way to decide on the audit

Hi Jordan,

After looking at the quote request flow, I think the highest-leverage part is the
first screen and the quote CTA. That is where visitors either understand the offer
or leave before calling.

If helpful, I can send a one-page version you can forward internally with:
- the problem
- the proposed fix
- expected impact
- what I need to deliver it in 24 hours

Would that make the decision easier?
```

