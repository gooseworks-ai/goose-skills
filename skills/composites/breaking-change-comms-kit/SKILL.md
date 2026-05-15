---
name: breaking-change-comms-kit
description: >
  Build a coordinated, multi-channel communication plan for a breaking API or platform change. Produces a phased timeline, migration steps, per-channel copy (docs banner, email, in-product warning, status page notice), and a support-ready FAQ. Scoped to breaking-change rollout comms — not general feature launch assets (use feature-launch-playbook) and not API changelog entries (use api-release-notes-composer). Use when an engineering or DevRel team needs to roll out a breaking change without surprising consumers and without burning support bandwidth.
tags: [content, outreach]
---

# Breaking Change Comms Kit

Coordinate a breaking change rollout across every channel your API consumers rely on. This skill produces the full comms package: migration guide, timeline, channel-specific copy, and a support FAQ — so developers get the information they need before they hit the wall.

**Built for:** API teams, DevRel, and developer-support leads who need to ship a breaking change cleanly. The goal is zero surprise upgrades and minimal support tickets.

## Best Fit

- Endpoint removal or renaming
- Field removal or type change in API responses
- Authentication scheme changes
- SDK major version bumps with non-backward-compatible contracts
- Webhook payload schema breaking changes
- Required parameter additions
- Pagination contract changes

## Use Something Else

- For changelog entries only, use `api-release-notes-composer`.
- For general product feature launch copy, use `feature-launch-playbook`.
- For deprecation-only planning (no breaking change yet), use `api-deprecation-sunset-planner`.
- For incident comms, use `status-incident-comms-writer`.

## Inputs

| Field | Required | Notes |
|-------|----------|-------|
| `change_summary` | Yes | What is breaking and what replaces it |
| `affected_surface` | Yes | Endpoint(s), field(s), auth scheme, SDK version, etc. |
| `break_date` | Yes | When the breaking change goes live |
| `deprecation_date` | No | When the old behavior was first deprecated (if applicable) |
| `migration_path` | Yes | What consumers must do to stay compatible |
| `affected_audience` | No | All consumers, specific tiers, specific SDK users |
| `support_contacts` | No | Slack channel, email alias, GitHub discussion URL |
| `tone` | No | Technical/direct (default), empathetic, enterprise-formal |

## Phase 0 — Intake

Ask only for what is missing. Keep it conversational.

1. What is breaking? Be specific: endpoint path, field name, auth header, SDK method.
2. What replaces it? What does the consumer need to use instead?
3. When does the old behavior stop working? (the hard cutoff date)
4. Was this previously announced as deprecated? If yes, when?
5. Who is affected — all API consumers, or a specific tier / SDK version?
6. Where should affected developers go for help? (Slack, email, GitHub)

## Phase 1 — Impact Assessment

Before writing any copy, map the impact to guide urgency and channel selection.

### Impact Tiers

| Tier | Criteria | Comms Approach |
|------|----------|----------------|
| **Critical** | Auth, core resource CRUD, required for all consumers | Maximum lead time (90+ days), all channels, dedicated migration page |
| **High** | Widely-used endpoint or field, affects most integrations | 60-day lead, email + docs + in-product warning |
| **Medium** | Specific feature area, affects a subset of consumers | 30-day lead, docs + email |
| **Low** | Rarely-used edge, minimal consumer impact | 14-day lead, docs + changelog |

Produce an impact tier assessment before writing comms:

```
IMPACT ASSESSMENT

Change: Removing `X-Token` auth header support
Tier: Critical — affects 100% of API consumers
Deprecation window: Previously announced 2026-01-15
Hard cutoff: 2026-07-01 (167 days from today)
Recommended lead time: 90 days minimum ✓
```

## Phase 2 — Rollout Timeline

Build a comms timeline from the hard cutoff date backward.

### Standard Timeline Template

| Day | Action |
|-----|--------|
| T-90 | Initial announcement: email + docs banner + changelog entry |
| T-60 | Reminder: email + in-product warning for affected consumers |
| T-30 | Final warning: email + prominent docs banner + Slack/Discord post |
| T-14 | Last-chance: email to consumers who have not migrated (if detectable) |
| T-7 | Final heads-up: email + status page notice |
| T-0 | Change goes live: update docs, publish removal notice, close deprecation banner |
| T+3 | Post-removal check: confirm no unexpected support spike, publish closure notice |

Compress or expand based on impact tier and available lead time:

```
ROLLOUT TIMELINE — Auth Header Change (T-0: 2026-07-01)

2026-04-02  (T-90)  Initial announcement — email, docs banner, changelog
2026-05-01  (T-60)  Reminder email + in-product warning
2026-06-01  (T-30)  Final warning email + docs banner escalation
2026-06-17  (T-14)  Last-chance email to unmigrated consumers
2026-06-24  (T-7)   Status page preview notice
2026-07-01  (T-0)   Change live — remove old endpoint, update docs
2026-07-04  (T+3)   Post-removal support review
```

## Phase 3 — Migration Guide

The migration guide is the most important artifact. Write it first.

### Migration Guide Structure

```markdown
# Migration Guide: [Change Name]

## What is changing

[One paragraph. State exactly what stops working and when.]

## Who is affected

[Specific criteria: SDK versions, API versions, auth methods, endpoint users.]

## What to do

### Step 1: [Action]
[Minimal, copy-paste-safe instructions. Code examples where applicable.]

### Step 2: [Action]
...

## Before and after

**Before:**
[Code or request example showing old behavior]

**After:**
[Code or request example showing new behavior]

## Testing your migration

[How to verify the migration worked before the cutoff date. Staging environment, test mode, etc.]

## If you need help

[Link to support channel, GitHub discussion, migration office hours, or contact alias.]
```

### Migration Guide Rules

- One step per action; do not bundle multiple changes into one step
- Show real code, not pseudo-code
- Include language variants if the change affects SDK methods across languages
- State the testing/verification step explicitly — do not assume consumers will figure it out
- Do not use "simply", "just", or "easy" — migration work is real work

## Phase 4 — Per-Channel Copy

Generate copy for each relevant channel. Use the impact tier to select channels.

### Docs Banner

```markdown
> ⚠ **Breaking change on 2026-07-01:** `X-Token` auth header support is being removed.
> Migrate to `Authorization: Bearer <token>` before July 1st.
> [Migration guide →](/docs/migration/auth-header)
```

Banner rules:
- One sentence on what is changing and when
- One sentence on what to do
- One link to the migration guide
- Use `⚠` for breaking changes, `ℹ` for deprecations

### Email Announcement

```
Subject: Action required — [Change Name] breaking change on [Date]

Hi [developer name / team],

On [Date], we're removing support for [old behavior]. This affects anyone who [specific criterion].

What you need to do:
1. [Step 1]
2. [Step 2]

[Link to migration guide]

We've provided a [staging environment / test endpoint] so you can verify your migration before the deadline.

Questions? [Support channel / contact]

— [Team name]
```

Email rules:
- Subject must include "action required" and the date
- First sentence states the change and date — no preamble
- Steps are numbered, not bulleted
- Single CTA: migration guide
- Offer a support escalation path
- Keep to under 200 words

### In-Product Warning

```
This integration uses a deprecated API method (X-Token auth).
It will stop working on July 1, 2026. [Migrate now →]
```

In-product rules:
- One sentence max
- Include the hard date
- Deep link to migration guide, not docs home

### Status Page Notice

```
[Upcoming] Auth header change — July 1, 2026
X-Token header support is being removed on July 1, 2026.
All integrations must migrate to Authorization: Bearer.
Migration guide: [URL]
```

### Slack / Discord Announcement

```
📢 Breaking change heads-up: we're removing X-Token auth header support on July 1, 2026.

If you use the API, you'll need to switch to `Authorization: Bearer <token>` before that date.

→ Migration guide: [URL]
→ Questions: #api-support
```

## Phase 5 — Support FAQ

Produce 5–8 FAQ entries that support staff can use verbatim when tickets arrive.

```markdown
## Breaking Change FAQ — [Change Name]

**Q: My app broke after [Date]. What happened?**
A: On [Date], we removed support for [old behavior]. Your app needs to [one-sentence action]. See the migration guide: [URL]

**Q: How do I know if I'm affected?**
A: You're affected if your integration [specific criterion, e.g., "sends the X-Token header" or "calls GET /v1/users"].

**Q: Can I get an extension?**
A: The deadline is firm at [Date]. If your migration is in progress and you need a short-term exception, contact [support alias] before [Date-7].

**Q: I migrated but things still aren't working. What should I check?**
A: [Most common post-migration issue and how to diagnose it.]

**Q: Where can I find help?**
A: [Support channel, migration office hours, or contact information.]
```

FAQ rules:
- Write answers in first person plural from the team's perspective
- The "broke" FAQ must always come first — it is the highest-volume ticket
- Include a clear escalation path for consumers who need a deadline extension
- Do not write "unfortunately" or "we apologize" in support copy

## Phase 6 — Output Package

Deliver everything as one document with clear section headers:

1. Impact assessment
2. Rollout timeline
3. Migration guide
4. Docs banner copy
5. Email copy (initial announcement)
6. In-product warning copy
7. Slack/Discord copy
8. Status page notice
9. Support FAQ

Mark any section that needs a real URL placeholder with `[URL: <description>]` so the team can fill them in.

## Guardrails

- Do not invent migration steps not derivable from the change description
- Do not omit the hard-cutoff date from any channel copy
- Do not use "breaking change" in support FAQ copy — consumers already know it broke; use action-oriented language
- Do not write comms that leave consumers without a migration path
- If the user has not provided a migration path, ask before generating Phase 3 and beyond
- Flag if the declared lead time is shorter than the recommended minimum for the impact tier
