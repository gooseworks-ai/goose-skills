---
name: utm-tracking-plan-builder
description: Create campaign tracking taxonomies, UTM naming rules, QA checklists, and analytics handoff docs for paid, lifecycle, partner, and content campaigns.
tags: [ads, monitoring]
---

Use this skill when the user needs campaign links and analytics naming to be consistent before launch, or when messy campaign data needs to be cleaned into a usable taxonomy.

The goal is to produce a practical tracking plan that marketers, sales, RevOps, and analytics teams can use without debating naming every time a campaign ships.

## Non-Negotiables

- Do not invent analytics platform capabilities or claim a setup is working without evidence.
- Keep naming rules simple enough for humans to follow under deadline pressure.
- Use one canonical taxonomy and map exceptions back to it.
- Preserve existing conventions when they are already used in reports, dashboards, or CRM fields.
- Flag any change that would break historical reporting.
- Separate launch-ready rules from cleanup recommendations for old data.
- Do not ask the user to rebuild every campaign just to make the plan look tidy.

## Intake

Identify what the user already has:

- campaign channels
- ad platforms or email tools
- analytics destination
- CRM or warehouse destination
- current naming examples
- reporting questions that matter
- team owners
- launch date or migration deadline

If the user only has a messy export, infer patterns from the data and label uncertain fields clearly.

## Workflow

### 1. Identify Reporting Jobs

Start by listing the decisions the taxonomy must support.

Common jobs:

- compare channels
- compare campaigns
- compare audiences
- compare offers
- compare creative angles
- attribute qualified pipeline
- track partner or influencer performance
- separate tests from evergreen campaigns
- diagnose missing or broken tracking

Reject fields that do not answer a reporting job. Extra fields become clutter and reduce compliance.

### 2. Audit Current Names

Review existing campaign names, link examples, exports, dashboards, or CRM fields.

Extract:

- repeated patterns
- inconsistent spellings
- duplicated channel names
- missing fields
- over-specific values
- ambiguous abbreviations
- values that mix multiple concepts
- fields used by current dashboards

Classify each issue as launch blocker, reporting risk, or cleanup later.

### 3. Define The Canonical Taxonomy

Create a concise standard with required and optional fields.

Use stable field meanings:

- source: where traffic originates
- medium: channel class
- campaign: initiative or launch
- content: creative, message, or placement variant
- term: keyword, audience, or targeting detail when relevant

Add internal fields only when the team has a destination for them, such as CRM campaign, lifecycle stage, offer, region, owner, or experiment id.

For each field, define:

- purpose
- allowed format
- allowed values or value pattern
- examples
- owner
- when to leave blank

### 4. Build Naming Rules

Write rules that prevent future drift:

- lowercase unless the existing analytics tool requires otherwise
- use one word separator consistently
- avoid spaces
- avoid punctuation that breaks exports
- keep values short but readable
- do not encode the same fact in two fields
- do not put dates in every field unless the team reports by launch cohort
- make tests explicitly identifiable
- reserve temporary values for experiments only

If the user has legacy naming, include a translation map from old values to new values.

### 5. Create Campaign Templates

Produce templates for the user's actual channels.

Common templates:

- paid search
- paid social
- organic social
- email lifecycle
- newsletter sponsorship
- webinar or event
- partner referral
- creator or influencer
- sales outbound
- retargeting

For each template, provide:

- required fields
- sample values
- final link pattern in plain text
- analytics expectation
- CRM or reporting expectation

### 6. Add QA Checks

Create a pre-launch checklist:

- every destination page loads
- every link includes required fields
- field values match the allowed list
- campaign values match launch brief
- paid platform names map to canonical source values
- test variants are distinguishable
- CRM campaign or owner is present when required
- no internal notes are exposed in public links
- reporting owner has a sample link before launch

Create a post-launch checklist:

- traffic appears in analytics
- conversions retain the campaign fields
- CRM records show expected source values
- dashboard filters do not split one campaign into multiple rows
- missing values are logged for cleanup

### 7. Produce The Handoff

Return one compact operating document.

The handoff should include:

1. Status: ready, needs review, or insufficient evidence
2. Reporting jobs supported
3. Canonical taxonomy
4. Allowed values
5. Channel templates
6. QA checklist
7. Legacy cleanup map
8. Owner rules
9. Risks and unresolved questions

## Quality Check

Before finishing, verify:

- The taxonomy can answer the user's stated reporting questions.
- Required fields are few enough that the team will actually use them.
- Values are readable without a decoder.
- Legacy reporting risks are called out.
- The plan distinguishes launch rules from historical cleanup.
- No claim depends on unverified analytics behavior.
