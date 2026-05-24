---
name: security-questionnaire-responder
description: Turn messy vendor security questionnaires, procurement spreadsheets, RFP security sections, and customer trust follow-ups into accurate, evidence-backed response drafts.
tags: [content, outreach]
---

# Security Questionnaire Responder

Draft reliable answers for vendor security reviews, procurement packets, and RFP security sections. The skill helps an agent gather source material, answer only what can be supported, flag unknowns, and produce a reusable response matrix.

Core principle: security answers are sales assets, but they must behave like evidence. Never guess, never overstate certification status, and always preserve a reviewer-friendly trail from answer to source.

## When To Use

- A prospect sends a security questionnaire before procurement approval.
- A sales team needs short and long answers for common security questions.
- A founder needs to answer a lightweight due diligence packet.
- A solutions engineer has SOC reports, policies, or trust center copy and needs a clean response set.
- A team wants to build or refresh a reusable security FAQ.

## Inputs

Ask for the smallest complete packet available:

1. The questionnaire content, spreadsheet export, or list of questions.
2. Company trust center copy, security page text, compliance summary, or policy excerpts.
3. Approved certifications and attestations, including exact scope and dates if available.
4. Product architecture notes: hosting model, data storage, subprocessors, encryption, authentication, logging, backups, retention, and incident response.
5. Commercial context: customer size, industry, deadline, and whether the answer should be concise, detailed, or executive-friendly.
6. Any forbidden claims, under-review certifications, or topics that require security team approval.

If the user cannot provide source material, proceed only with public research and mark every answer as unverified until the user supplies authoritative material.

## Operating Rules

- Evidence first. Every answer must cite the source type used: provided policy, trust center, SOC report, architecture note, contract language, or public documentation.
- No certification inflation. If a company is preparing for SOC 2, say that it is in progress, not certified.
- No invented controls. If the source packet does not support a control, mark it as unknown or needs owner review.
- Match the buyer's format. Preserve question numbering and answer style whenever the buyer gave a template.
- Separate public-safe copy from confidential detail. Flag content that should only be shared under NDA.
- Optimize for procurement speed: clear yes/no answer first, then explanation, then evidence note.

## Workflow

### Phase 1: Normalize The Questionnaire

Convert the input into a response table with these fields:

- Question id
- Original question
- Control area
- Required answer type
- Draft answer
- Confidence
- Evidence note
- Owner review needed
- Public or confidential

Group questions into control areas:

- Company and governance
- Access control and identity
- Data protection and encryption
- Infrastructure and hosting
- Secure development
- Vulnerability management
- Logging, monitoring, and incident response
- Backup, recovery, and business continuity
- Privacy, data retention, and subprocessors
- Compliance and audits
- AI, model, and data usage
- Customer-specific or contract-specific questions

### Phase 2: Build The Evidence Map

Read the provided source packet and extract reusable facts:

- Compliance status: certifications, audit windows, report availability, scope, and exclusions.
- Data flow: what customer data is collected, where it is stored, and who can access it.
- Encryption: data in transit, data at rest, key management, secrets handling.
- Access controls: SSO, MFA, RBAC, least privilege, employee access review.
- Security operations: monitoring, vulnerability scanning, patching, incident response, backup testing.
- Vendor risk: subprocessors, cloud providers, data residency, contractual commitments.
- AI usage: whether customer data trains models, retention rules, model providers, opt-out or isolation controls.

For each fact, record whether it is approved source material, public source material, or inferred from architecture notes.

### Phase 3: Answer With The Buyer Pattern

For each question, classify the answer pattern:

- Direct yes or no.
- Short factual sentence.
- Detailed explanation.
- Policy summary.
- Control description.
- Attachment or evidence request.
- Requires security owner review.

Use this response structure unless the buyer demands another format:

Answer: start with the direct answer in one sentence.
Detail: add two to four sentences with scope and caveats.
Evidence: cite the source type and the exact fact used.
Review flag: state whether security, legal, privacy, or engineering must approve.

If the real answer is not available:

Answer: Pending confirmation.
Detail: explain what information is missing and who should provide it.
Evidence: state that no supporting source was found in the packet.
Review flag: owner review required.

### Phase 4: Produce Reusable Assets

After completing the question set, produce:

1. Buyer-ready response matrix.
2. Internal review list sorted by risk and owner.
3. Reusable security FAQ entries for repeated future questions.
4. Procurement cover note that summarizes security posture without overselling.
5. Missing-evidence checklist for the security or legal team.

## Quality Bar

Before finalizing, check:

- Every yes or no answer has a caveat if the source scope is limited.
- Every certification claim includes the exact framework and status.
- AI and data-training answers are explicit and do not hide uncertainty.
- Answers avoid vague phrases like industry standard unless paired with a specific control.
- The output is easy for a procurement reviewer to paste into their portal.
- High-risk claims are flagged for human approval.

## Output Format

Return the response matrix first, followed by the internal review list and reusable FAQ.

For the matrix, use a markdown table unless the user asked for a spreadsheet-ready CSV. Keep long answers readable by using concise paragraphs after the table when needed.

Confidence levels:

- High: directly supported by approved source material.
- Medium: supported by public material or architecture notes, but not final policy language.
- Low: plausible but needs owner confirmation.
- Blocked: no reliable source found.

## Example Prompts

- Help answer this customer security questionnaire using our trust center notes.
- Turn this procurement security spreadsheet into a buyer-ready response matrix.
- Draft security answers for this RFP, but flag anything that legal or security needs to approve.
- Build a reusable security FAQ from these completed questionnaires.
- Rewrite these answers so they are concise, accurate, and do not overclaim compliance.
