---
name: status-incident-comms-writer
description: >
  Draft API and infrastructure incident communications for developer-facing status pages and consumer email notifications: initial acknowledgement, timed rolling updates, resolution summary, and a customer-facing postmortem. Scoped to developer and API consumer incident comms — not uptime monitoring (use uptime-monitor) and not general breaking-change rollout comms (use breaking-change-comms-kit). Use when an engineering or DevRel team needs to communicate a live API or service incident to developers without writing from scratch under pressure.
tags: [content]
---

# Status Incident Comms Writer

Draft developer-facing incident communications under pressure. This skill produces the full incident communication arc — from the first "we're investigating" post to the final public postmortem — so your team can spend its time fixing the problem, not writing copy.

**Built for:** Engineering leads, DevRel teams, and developer-support managers who need to communicate a live API or infrastructure incident to developers while simultaneously trying to resolve it.

## Best Fit

- API downtime or degraded availability incidents
- Webhook delivery failures or event processing delays
- Authentication service disruptions
- Database or storage outages affecting API consumers
- Third-party dependency failures affecting the API surface
- Elevated error rates, latency spikes, or data processing delays

## Use Something Else

- For setting up uptime monitoring and alerts, use `uptime-monitor`.
- For coordinating a planned breaking-change rollout, use `breaking-change-comms-kit`.
- For deprecation sunset announcements, use `api-deprecation-sunset-planner`.

## Inputs

| Field | Required | Notes |
|-------|----------|-------|
| `incident_description` | Yes | What is failing, what impact it has on consumers |
| `incident_status` | Yes | `investigating`, `identified`, `monitoring`, `resolved` |
| `affected_services` | Yes | Specific endpoints, webhooks, auth, SDK, etc. |
| `start_time` | Yes | ISO 8601 or human-readable timestamp |
| `end_time` | No | Required for resolved/postmortem comms |
| `root_cause` | No | Required for postmortem; not needed for initial comms |
| `consumer_impact` | No | What developers are experiencing (errors, latency, data gaps) |
| `workaround` | No | Any temporary workaround available |
| `next_update_time` | No | When the next update will be posted |
| `channel` | No | `status-page` (default), `email`, `slack`, or `all` |

## Phase 0 — Intake

Minimal intake — incidents move fast. Ask only for what is required.

1. What is failing right now? (Specific services or endpoints)
2. What status phase are you in? (Investigating / identified / monitoring / resolved)
3. When did the incident start?
4. Is there a workaround developers can use right now?

Do not ask for root cause during the `investigating` phase — it is not yet known.

## Phase 1 — Incident Severity Assessment

Before writing, assign a severity level to calibrate communication frequency and channel selection:

| Severity | Criteria | Communication cadence |
|----------|----------|-----------------------|
| **SEV-1 (Critical)** | Full API down, auth broken, all consumers affected | Every 15-30 minutes |
| **SEV-2 (High)** | Subset of endpoints failing, degraded success rate, major feature broken | Every 30-60 minutes |
| **SEV-3 (Medium)** | Non-critical feature degraded, elevated latency, partial webhook failure | Every 1-2 hours |
| **SEV-4 (Low)** | Minor issue, workaround available, minimal consumer impact | Once at detection, once at resolution |

State the severity level before writing any comms:

```
SEVERITY ASSESSMENT

Status: Investigating
Affected: All webhook deliveries failing — 100% failure rate since 14:22 UTC
Impact: Consumers using webhooks cannot receive real-time events
Workaround: None available
Severity: SEV-2 (High)
Recommended update cadence: Every 30-60 minutes
```

## Phase 2 — Status Page Update Templates

### Initial Acknowledgement (Investigating)

```markdown
**Investigating — [Affected Service] disruption**

We are investigating an issue affecting [specific service/endpoint].

**Impact:** [One sentence on what consumers are experiencing. Be specific: "Webhook deliveries are failing" not "some features may be degraded."]

**Affected:** [List specific endpoints, features, or services]

**Started:** [Time in UTC] ([Time in user's timezone if known])

We are actively investigating. Our next update will be posted by [time].

— [Team name]
```

**Rules for initial acknowledgement:**
- Post within 5 minutes of declaring an incident
- Be specific about impact — "degraded performance" is not acceptable
- Do not speculate on root cause
- Commit to a next-update time and honor it
- Do not include "we apologize for the inconvenience" in the first post — it wastes space; action matters more

---

### Identified Update (Root Cause Known)

```markdown
**Identified — [Affected Service] disruption**

We have identified the cause of the [service] issue.

**Root cause:** [One sentence. Specific. Technical enough to be credible.]

**Impact:** [Current state — is it the same, improving, or worsening?]

**Current status:** Our engineering team is [actively deploying a fix / rolling back / rerouting traffic].

**Expected resolution:** [Time estimate if available] / [We will update at [time] with status]

— [Team name]
```

**Rules:**
- State the root cause in one sentence — do not write a full explanation here
- State what the team is actively doing, not just what the problem is
- Give an expected resolution time only if you are confident; "we will update by [time]" is safer than a wrong ETA

---

### Rolling Update (During Resolution)

```markdown
**Update [N] — [Time UTC]**

[One to two sentences on current status: improving, stable, still investigating.]

[If applicable: "The fix has been deployed and we are monitoring recovery. Webhook delivery failure rate has dropped from 100% to 12%."]

Next update: [time UTC]
```

**Rules:**
- Mark each update with a number and timestamp
- Include a measurable signal if available (error rate percentage, latency reading)
- Keep rolling updates under 75 words
- Always include the next-update time

---

### Monitoring Update (Fix Deployed, Watching)

```markdown
**Monitoring — Fix deployed**

We have deployed a fix for the [service] issue. [Service] is recovering and we are
monitoring for full stabilization.

**Current state:** [Error rate, latency, or delivery rate — specific metric if available]

We will confirm resolution when metrics return to baseline. Next update: [time UTC]
```

---

### Resolution Notice

```markdown
**Resolved — [Affected Service] incident**

The [service] incident has been resolved as of [time UTC].

**Duration:** [Start time] – [End time] ([N hours N minutes])

**Impact summary:** [How many consumers were affected, what they experienced, for how long.]

**Fix:** [One sentence on what was done to resolve the incident.]

We will publish a full postmortem on [date]. [Link once available]

Thank you for your patience.
— [Team name]
```

**Rules:**
- Include the exact resolved time in UTC
- Include total duration
- State the impact concisely — do not minimize it
- Link the postmortem when it is available; if not yet written, commit to a date

---

### Consumer Email Notification

Use for SEV-1/SEV-2 incidents or when consumers rely on email rather than a status page.

```
Subject: [ACTION REQUIRED / Service notice]: [API Name] [service] incident — [status]

We are [investigating / have identified / have resolved] an issue affecting [service].

Impact: [One sentence. Be specific.]
Started: [Time UTC]
[Resolved: [Time UTC]]

[If workaround is available]: Temporary workaround: [one sentence on what to do now]

We will post updates to our status page: [URL]

Questions? Contact: [support alias or channel]

— [Team name]
```

**Email rules:**
- Subject must include the incident status in brackets
- Include "ACTION REQUIRED" only if consumers need to change their behavior (e.g., retry with backoff, switch to a fallback endpoint)
- Do not send more than one email per severity level per hour; direct developers to the status page for rolling updates

## Phase 3 — Slack / Discord Incident Thread

For internal or community-facing Slack/Discord:

```
⚠️ Incident update — [Time UTC]

Status: [Investigating / Identified / Monitoring / Resolved]
Affected: [Services]
Impact: [One sentence]
[Workaround if available]

Status page: [URL]
Next update: [time]
```

Rules:
- Use the thread, not the channel, for rolling updates
- Pin the first message in the thread
- Post the resolution update in both the thread and the original channel

## Phase 4 — Postmortem

Write only after the incident is resolved and the team has completed an internal review.

```markdown
# Postmortem: [Incident Title]

**Date:** [Date]
**Duration:** [Start] – [End] ([N hours N minutes])
**Severity:** [SEV level]
**Status:** Resolved

## Impact

[Two to four sentences: who was affected, what they experienced, measurable impact
(requests failed, webhooks delayed, data window affected).]

## Timeline

| Time (UTC) | Event |
|------------|-------|
| [HH:MM] | First alert triggered |
| [HH:MM] | On-call engineer paged |
| [HH:MM] | Root cause identified |
| [HH:MM] | Fix deployed |
| [HH:MM] | Monitoring confirms recovery |
| [HH:MM] | Incident declared resolved |

## Root cause

[Two to four sentences on the technical root cause. Be specific and honest.
Do not blame a single person. Do not use "human error" without explaining the systemic cause.]

## Resolution

[One to two sentences on what was done to fix the incident.]

## What went well

- [Thing the team did right during the incident]
- [Communication that worked]

## What could be improved

- [Gap in detection, alerting, or response]
- [Tooling or process that slowed resolution]

## Action items

| Action | Owner | Target date |
|--------|-------|-------------|
| [Add alert for [signal]] | [Team/person] | [Date] |
| [Improve [component]] | [Team/person] | [Date] |

---

*If you experienced impact during this incident and have questions, contact [support alias].*
```

**Postmortem rules:**
- Publish within 5 business days of resolution
- Be honest about what broke and why — vague postmortems erode developer trust more than the incident itself
- Action items must have owners and dates — unassigned action items are not action items
- Do not assign blame to individuals

## Phase 5 — Output

Deliver all applicable templates for the current incident phase in a single document:

- Severity assessment
- Status page updates (all applicable phases)
- Consumer email (if SEV-1 or SEV-2)
- Slack/Discord thread copy
- Postmortem template (pre-filled where information is available)

Mark fields that require engineering team input with `[FILL: description]`.

## Guardrails

- Do not speculate on root cause during the `investigating` phase
- Do not minimize impact — "some consumers may experience" when 100% are failing is not acceptable
- Do not commit to a resolution ETA unless the team has confirmed it
- Do not write a postmortem until the incident is resolved
- Do not omit the incident duration from the resolution notice
- Never write "we apologize for the inconvenience" as the first or only response — action and information come first
