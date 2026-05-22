---
name: buyer-committee-mapper
description: Turn CRM notes, call transcripts, email threads, and public research into a buyer committee map for B2B deals, including champions, economic buyers, evaluators, blockers, missing stakeholders, decision criteria, political risks, and a mutual action plan.
tags: [outreach, research]
---

# Buyer Committee Mapper

Build a clear stakeholder map for an active B2B opportunity. The goal is to stop treating a company as one lead and expose the real buying system: who cares, who can block, who owns budget, who signs, and what each person needs to believe before the deal advances.

## When to Use

- "Map the buying committee for this deal"
- "Who are we missing in this opportunity?"
- "Turn these call notes into a mutual action plan"
- "Find the economic buyer and blockers"
- "Prepare stakeholder strategy before the next sales call"

## Phase 0: Intake

Collect the strongest available inputs before analysis. Work with partial data, but label confidence clearly.

Required inputs:
1. Account name, website, and deal stage.
2. Current contact list with names, titles, departments, and known relationship strength.
3. Recent call notes, transcript excerpts, email thread summaries, or CRM notes.
4. Product being sold and the business problem it solves.
5. Target close date or urgency driver, if any.

Optional inputs:
1. Deal value, current plan, expansion target, or renewal date.
2. Known competitors or incumbent tools.
3. Procurement, security, legal, or technical review status.
4. Public signals such as hiring, funding, leadership changes, product launches, or compliance deadlines.
5. Internal constraints such as discount policy, implementation capacity, or executive sponsor availability.

## Phase 1: Extract Stakeholders

Create one row per person or role mentioned in the inputs. If the role exists but the name is unknown, keep it as an unnamed stakeholder rather than dropping it.

Classify each stakeholder:

| Role | Meaning | Typical Evidence |
| --- | --- | --- |
| Champion | Wants the deal to happen and will spend internal capital | Shares context, introduces others, explains process, volunteers pain |
| Economic buyer | Owns budget or final business approval | Talks about budget, ROI, contract value, priorities, timing |
| Technical evaluator | Validates feasibility, integration, security, data, or workflow fit | Asks implementation, architecture, API, security, or migration questions |
| Daily user | Feels the workflow pain and will use the product | Describes day-to-day problems, adoption concerns, current workaround |
| Procurement or legal | Controls terms, vendor review, privacy, security, purchasing flow | Mentions forms, redlines, vendor onboarding, compliance steps |
| Blocker | Can slow or stop the deal because of incentives, risk, politics, or preference | Pushes competitor, questions priority, controls access, avoids next steps |
| Executive sponsor | Senior leader who can create urgency or unblock cross-functional conflict | Owns strategic initiative, sets timeline, can align teams |

For each stakeholder, capture:
- Name and title.
- Function and seniority.
- Role in the deal.
- Stance: advocate, neutral, skeptical, blocker, unknown.
- Influence: high, medium, low.
- Access level: direct contact, indirect via champion, not reached.
- Evidence from the inputs.
- What they care about.
- What they need next.
- Confidence score from 1 to 5.

## Phase 2: Detect Missing Committee Members

Compare the known stakeholders to the buying motion. Flag missing roles with a practical reason.

Use these common patterns:

| Deal Type | Usually Missing If Not Present |
| --- | --- |
| Technical product | Engineering lead, security owner, data owner, implementation owner |
| Sales or marketing product | Revenue leader, operations owner, daily user manager, finance approver |
| Finance or compliance product | Finance owner, legal, security, compliance, executive sponsor |
| Enterprise deal | Procurement, legal, security, economic buyer, executive sponsor |
| Expansion or renewal | Account owner, champion, executive sponsor, procurement, usage owner |

For each missing stakeholder, specify:
- Why they probably matter.
- What risk appears if they stay invisible.
- Best path to reach them.
- Suggested ask to the champion.

## Phase 3: Decision Process Map

Infer the deal path from the inputs and public context. Separate known facts from assumptions.

Map:
1. Current stage.
2. Decision criteria.
3. Evaluation steps already completed.
4. Remaining technical, security, legal, procurement, budget, and executive steps.
5. Who owns each step.
6. Deadline and urgency driver.
7. Competitor or status quo alternative.
8. Exit criteria for the next meeting.

If the process is unclear, produce the exact discovery questions needed to uncover it.

## Phase 4: Political Risk Analysis

Identify deal risks beyond product fit.

Score each risk as high, medium, or low:

| Risk | What to Look For |
| --- | --- |
| Single-threaded deal | Only one contact, no access to buyer or evaluator |
| Weak champion | Friendly but not influential, avoids internal introductions |
| Hidden economic buyer | Budget owner not identified or never engaged |
| Technical veto | Evaluator not involved until late |
| Procurement surprise | Vendor, security, or legal review not planned |
| Status quo inertia | Pain exists but no committed change event |
| Competitor preference | Existing vendor, internal build, or executive relationship |
| No mutual plan | Next steps are vague or owned only by the seller |

For each risk, include:
- Evidence.
- Severity.
- Likely impact on close date.
- Mitigation action.
- Owner.

## Phase 5: Stakeholder-Specific Messaging

Create concise talk tracks for each important stakeholder. The message must connect their priorities to the deal outcome, not just repeat product features.

For each stakeholder, provide:
- Primary concern.
- Proof point needed.
- Message angle.
- Suggested next ask.
- If skeptical: the most likely objection and response.

Use this format:

| Stakeholder | Concern | Message Angle | Proof Needed | Next Ask |
| --- | --- | --- | --- | --- |
| Name or role | Specific concern | One sentence | Case study, metric, technical doc, pilot result | Specific ask |

## Phase 6: Mutual Action Plan

Build a plan that both sides can agree to. Avoid fake certainty; mark assumed dates if exact dates are missing.

Include:
1. Target outcome.
2. Business reason for the deadline.
3. Milestones from now to decision.
4. Buyer owner and seller owner for every step.
5. Required stakeholder meetings.
6. Review artifacts needed.
7. Risks that could move the date.
8. Decision meeting agenda.

Output the plan as a short table:

| Step | Buyer Owner | Seller Owner | Due | Done Means |
| --- | --- | --- | --- | --- |
| Confirm success criteria | Champion | Seller | Date | Criteria written and shared |
| Technical review | Technical evaluator | Solutions lead | Date | Open issues resolved |
| Business case review | Economic buyer | Seller | Date | ROI and budget path accepted |
| Procurement path | Procurement | Seller | Date | Vendor steps and timeline known |
| Decision meeting | Economic buyer | Seller | Date | Approve, reject, or define final blocker |

## Phase 7: Final Output

Produce a single markdown report with these sections:

1. Deal snapshot.
2. Buyer committee map.
3. Missing stakeholders.
4. Decision process.
5. Political risks.
6. Stakeholder talk tracks.
7. Mutual action plan.
8. Next meeting agenda.
9. Discovery questions still unanswered.

Keep the report practical. A seller should be able to use it before a call without rereading the whole CRM history.

## Quality Bar

Before finalizing, verify:

- Every stakeholder classification cites evidence or is marked as an assumption.
- The economic buyer is identified or explicitly listed as missing.
- The champion is not confused with the buyer unless evidence supports both roles.
- Every high-risk item has a mitigation.
- The mutual action plan has buyer-owned steps, not only seller tasks.
- The next meeting agenda advances the deal instead of merely checking in.

## Tools Required

This skill can run as pure reasoning when the user provides deal notes. Live research improves the result:

- Web search for company news, leadership changes, funding, hiring, and public priorities.
- Webpage fetch for company pages, leadership pages, careers pages, security pages, and procurement pages.
- Optional LinkedIn or job-posting tools when available for stakeholder and hiring signal research.

## Trigger Phrases

- "Map this buyer committee"
- "Build a stakeholder map for this opportunity"
- "Who is missing from this deal?"
- "Create a mutual action plan from these notes"
- "Find the blockers in this opportunity"
