---
name: renewal-command-center
version: 1.0.0
description: Run a renewal command center for B2B accounts by combining renewal dates, churn risk, expansion signals, stakeholder health, and next-best actions into a weekly account-by-account operating plan.
tags: [monitoring]
---

# Renewal Command Center

Use this playbook when a founder, customer success lead, or account owner needs to protect and expand renewals across a book of B2B accounts. The playbook turns scattered account data into a weekly renewal operating plan with risk tiers, expansion angles, owner actions, and executive escalation notes.

## When to Load

Load this playbook when the user asks to run a renewal review, prepare for upcoming renewals, build a customer success command center, identify renewal risk, plan save motions, prioritize customer success work, or combine churn and expansion signals into an account plan.

Do not use this playbook for net-new outbound prospecting. Use signal or lead generation skills for new logos. Do not use it for churned accounts that already left unless the user is explicitly planning a win-back motion.

## Outcome

Produce a practical renewal plan that includes:

- A prioritized account table sorted by renewal urgency and business impact.
- Clear renewal risk tier for each account.
- Expansion or contraction opportunity for each account.
- Root-cause hypotheses behind the risk or opportunity.
- Owner-level next actions for this week.
- Executive escalation notes for the accounts that need founder or leadership help.
- Missing-data questions that would materially improve the next review.

## Inputs

Ask only for missing context. If the user has a customer list or CRM export, start from that.

Useful inputs:

- Account list with company name, owner, plan, account value, renewal date, contract status, and primary contacts.
- Product usage data, seats, active users, feature adoption, limit usage, or health scores.
- Support tickets, escalations, implementation notes, NPS, CSAT, Slack threads, or email summaries.
- Recent business changes such as funding, leadership changes, layoffs, hiring, market moves, or new use cases.
- Current renewal targets, expansion targets, discount policy, and escalation rules.
- Known churn reasons and recent wins or losses.

If some data is missing, continue with the available evidence and mark confidence honestly.

## Operating Flow

### 1. Normalize the Account Book

Create one row per account. Capture:

- Account name.
- Owner.
- Renewal date or contract stage.
- Current value and plan.
- Stakeholders and champion status.
- Product usage summary.
- Open risks, escalations, and support pain.
- Expansion clues.
- Evidence confidence.

If values are missing, use unknown rather than guessing. If account names appear in several exports with small spelling differences, reconcile them and mention the merge.

### 2. Segment by Renewal Urgency

Group accounts by renewal window:

- Due in 0 to 30 days.
- Due in 31 to 60 days.
- Due in 61 to 90 days.
- Due after 90 days.
- Date unknown.

Within each window, sort by account value, health, and strategic importance. The closest renewal is not always the highest priority if a larger account has severe risk.

### 3. Run Churn Risk Detection

Use churn-risk-detector logic when support, usage, sentiment, or communication data is available.

Look for:

- Champion silence or stakeholder turnover.
- Usage decline, shallow adoption, or abandoned key features.
- Support spikes, repeated unresolved issues, or escalation language.
- Discount, downgrade, cancellation, or procurement pressure.
- Competitor mentions.
- Renewal approaching without a mutual plan.

Assign a risk tier:

- Red means urgent save motion.
- Orange means elevated risk that needs action soon.
- Yellow means early warning.
- Green means no material risk found.

Include the evidence behind every Red or Orange tier. Do not label an account high risk without a reason.

### 4. Run Expansion Signal Detection

Use expansion-signal-spotter logic when account value, usage, hiring, funding, team growth, or product-limit data is available.

Look for:

- Usage near plan limits.
- Multi-team or multi-department adoption.
- Power users or new internal champions.
- Hiring or funding that indicates budget and growth.
- New use cases mentioned in calls, tickets, Slack, or email.
- Product features that could justify a higher tier, add-on, or annual upgrade.

Classify expansion potential as High, Medium, Low, or None found. Pair the expansion angle with a tactful motion, not a generic upsell pitch.

### 5. Synthesize Voice of Customer

Use voice-of-customer-synthesizer logic when qualitative material is present.

Extract:

- What the account is trying to achieve.
- What outcomes they believe they have received.
- What objections or frustrations appear repeatedly.
- Which proof points would help the renewal conversation.
- Which quotes are safe to paraphrase internally.

Separate customer language from internal interpretation. If a quote is sensitive or too specific, summarize it instead.

### 6. Decide the Renewal Motion

Assign one primary motion per account:

- Save: renewal at risk and needs intervention.
- Stabilize: issues exist but can be handled by the owner.
- Expand: healthy account with clear growth path.
- Confirm: low-risk renewal that needs procurement or paperwork.
- Learn: insufficient evidence; gather missing context before acting.

Do not stack every possible motion on every account. Choose the one that best fits the evidence.

### 7. Build the Weekly Action Plan

For each priority account, produce:

- Owner.
- This-week action.
- Suggested message or meeting objective.
- Required prep.
- Escalation owner if needed.
- Due date.
- Success signal.

Make actions concrete. Prefer "book renewal alignment call with champion and confirm procurement path" over "follow up".

### 8. Create Executive Escalation Notes

For Red accounts, major expansions, or strategic logos, write a short leadership note:

- Situation.
- Evidence.
- Business impact.
- Recommended leader action.
- Risk if no action happens this week.

Keep escalation notes factual and calm. Do not exaggerate risk to force attention.

## Output Format

Return the result in this order:

1. Executive summary.
2. Renewal priority table.
3. Red and Orange account briefs.
4. Expansion opportunities.
5. Weekly owner action plan.
6. Missing data and next review improvements.

The priority table should include account, owner, renewal window, value if known, risk tier, expansion potential, primary motion, next action, and confidence.

## Quality Bar

- Tie every recommendation to evidence.
- Preserve uncertainty rather than inventing account health.
- Prioritize fewer, sharper actions over a long generic checklist.
- Treat renewal and expansion together; do not save an account and pitch expansion in the same breath unless the evidence supports it.
- Keep customer-facing copy respectful and specific.
- Flag accounts where the right action is to listen, diagnose, or repair trust before selling.

## Handoff

End with the three to five actions that should happen before the next renewal review. If the user wants a recurring operating cadence, suggest a weekly review structure with account owners, health updates, decision points, and follow-up tracking.
