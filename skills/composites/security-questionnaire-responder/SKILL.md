---
name: security-questionnaire-responder
description: Turn vendor security questionnaires, procurement forms, policy notes, and evidence files into accurate buyer-ready responses while flagging unknowns, unsupported claims, risk items, and follow-up owners.
tags: [research, outreach]
---

# Security Questionnaire Responder

Help a vendor answer security, privacy, compliance, and procurement questionnaires without inventing facts. The goal is to produce a buyer-ready response pack that is complete, evidence-backed, and honest about unknowns.

## When to Use

- "Fill out this security questionnaire"
- "Help answer this vendor risk assessment"
- "Prepare SOC 2 or ISO questionnaire answers"
- "Turn our policies into procurement responses"
- "Find risky claims in these security answers"
- "Create an evidence pack for the buyer review"

## Ground Rules

Never fabricate security, privacy, compliance, legal, or operational claims. If the source material does not support an answer, mark it as unknown, partial, or needs owner review.

Do not present future plans as completed controls. Use planned, in progress, partially implemented, or not currently supported when that is the truth.

Separate answer drafting from final approval. Security, privacy, legal, or leadership owners should approve sensitive answers before they are sent to a buyer.

## Phase 0: Intake

Collect the strongest available inputs. Work with partial inputs, but label confidence.

Required inputs:

1. The questionnaire, spreadsheet, form, or buyer questions.
2. Company name and product being reviewed.
3. Buyer name, deal stage, and deadline.
4. Available security, privacy, compliance, and operations documents.
5. Names or roles of internal reviewers.

Useful evidence sources:

1. Security overview.
2. Privacy policy.
3. Data processing addendum.
4. SOC 2, ISO 27001, HIPAA, GDPR, PCI, or other compliance summaries.
5. Pen test summary or vulnerability management policy.
6. Incident response policy.
7. Business continuity and disaster recovery policy.
8. Access control, encryption, logging, backup, and retention notes.
9. Subprocessor list.
10. Architecture diagram or data flow description.
11. Product documentation.
12. Prior approved questionnaire answers.

## Phase 1: Normalize Questions

Turn the buyer input into a clean working table.

For each question, capture:

- Question id.
- Original question text.
- Required answer format.
- Domain.
- Buyer priority if visible.
- Due date if visible.
- Owner if already assigned.
- Source file or tab.

Use these domains:

| Domain | Examples |
| --- | --- |
| Company and product | Legal entity, product scope, hosting model, support |
| Data handling | Data types, data location, retention, deletion, subprocessors |
| Access control | SSO, MFA, RBAC, least privilege, joiner mover leaver process |
| Encryption | In transit, at rest, key management, secrets handling |
| Application security | SDLC, code review, dependency scanning, penetration testing |
| Infrastructure | Cloud provider, network controls, hardening, monitoring |
| Logging and audit | Audit logs, event retention, admin activity tracking |
| Incident response | Detection, escalation, notification, post incident review |
| Business continuity | Backups, recovery objectives, disaster recovery tests |
| Compliance | SOC 2, ISO, GDPR, HIPAA, PCI, customer audits |
| Privacy and legal | DPA, privacy policy, data subject requests, subprocessors |
| Procurement | Insurance, financials, support SLAs, contract terms |

## Phase 2: Build Evidence Library

Create an evidence inventory before answering.

For each source, record:

- Source name.
- Source type.
- Date or version.
- Owner if known.
- Relevant domains.
- Key claims supported.
- Limits or outdated areas.
- Whether it can be shared externally.

If the evidence conflicts, do not silently choose the nicer answer. Flag the conflict and recommend the reviewer who should decide.

## Phase 3: Draft Answers

Answer each question with the narrowest truthful statement supported by evidence.

For each row, produce:

- Proposed answer.
- Short buyer-facing explanation if needed.
- Evidence citation.
- Confidence: high, medium, low.
- Status: ready, needs review, missing evidence, not supported, out of scope.
- Internal owner.
- Notes for reviewer.

Use answer patterns:

| Situation | Response Pattern |
| --- | --- |
| Fully supported | Answer directly and cite evidence |
| Partially supported | Answer what is true, then state the limitation |
| Unknown | Say the information is not currently confirmed and assign owner |
| Not supported | State that the control is not currently supported or not applicable |
| Planned | State planned or in progress only if source evidence supports the plan |
| Buyer asks for proof | Attach or reference the approved external evidence |

## Phase 4: Risk Review

Identify answers that could create legal, security, or deal risk.

Flag:

- Absolute claims such as always, never, all, guaranteed, or fully compliant.
- Certification claims without evidence.
- Security controls that depend on a specific plan or tier.
- Answers that expose sensitive internal architecture.
- Answers that conflict with public policy pages.
- Answers that promise custom terms without approval.
- Questions about regulated data that the product does not officially support.
- Missing incident, subprocessor, retention, or deletion answers.
- Any buyer requirement marked mandatory where the answer is no or partial.

For each risk, include:

- Question id.
- Risk type.
- Why it matters.
- Suggested safer wording.
- Required approver.

## Phase 5: Stakeholder Routing

Assign unresolved questions to the right internal owner.

Default routing:

| Question Type | Owner |
| --- | --- |
| Encryption, access, infrastructure | Security or engineering |
| Data retention, deletion, subprocessors | Privacy or legal |
| Certifications and audits | Compliance or security |
| Contract, insurance, indemnity | Legal or finance |
| Support, uptime, SLA | Customer success or operations |
| Product-specific behavior | Product or engineering |
| Buyer exceptions | Deal owner and leadership |

Create a short reviewer packet for each owner:

- Questions assigned.
- Why they are blocked.
- Evidence already checked.
- Exact decision needed.
- Deadline.

## Phase 6: Buyer-Ready Package

Prepare a final package that a sales, legal, or security owner can review and send.

Include:

1. Completed questionnaire table.
2. Summary of ready answers.
3. Summary of answers needing approval.
4. Evidence list.
5. Red flag list.
6. Buyer follow-up questions.
7. Internal owner checklist.

Use this output format:

| ID | Question | Proposed Answer | Evidence | Confidence | Status | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| Q1 | Original question | Answer | Source name | High | Ready | Security |

## Phase 7: Follow-Up Messaging

Draft a concise buyer message for open items. Keep it practical and do not overexplain internal gaps.

Message should include:

- Completed materials attached or ready.
- Items under final review.
- Expected timing for remaining answers.
- Clarifying questions for ambiguous buyer requirements.
- Contact path for a security review call if needed.

## Quality Bar

Before finalizing, verify:

- Every answer has evidence, an assumption label, or an owner.
- No unsupported certification or compliance claim is made.
- Public policy answers do not conflict with drafted answers.
- Sensitive internal details are not overshared.
- Mandatory buyer requirements with no or partial answers are visible.
- The final output separates buyer-facing text from internal notes.
- Reviewer approval is required for legal, privacy, regulated data, and high-risk security answers.

## Tools Useful

This skill can run on provided files alone. Useful tools include:

- Spreadsheet reader for questionnaire workbooks.
- PDF and document extraction for policy files.
- Web fetch for public privacy, security, and subprocessor pages.
- Search across prior approved answers.
- CRM or deal notes when buyer context matters.

## Trigger Phrases

- "Answer this security questionnaire"
- "Fill this vendor assessment"
- "Prepare procurement security responses"
- "Review these compliance answers"
- "Create a security evidence pack"
- "Which questionnaire answers are risky?"
