---
name: api-deprecation-sunset-planner
description: >
  Plan and draft the complete deprecation-to-removal communication pipeline for an API endpoint, field, auth scheme, or SDK version: deprecation header strategy, phased announcement timeline, per-channel copy (docs, email, response headers, in-SDK warnings), upgrade prompts, and a final shutdown checklist. Scoped to planned deprecation comms — not emergency breaking changes (use breaking-change-comms-kit) and not changelog entries for already-shipped removals (use api-release-notes-composer). Use when an API team knows what they are deprecating and needs a full deprecation runway plan before the first announcement goes out.
tags: [content, research]
---

# API Deprecation Sunset Planner

Plan the full deprecation runway from first announcement to final removal. This skill produces the complete deprecation communication pipeline — header strategy, phased timeline, per-channel copy, migration prompts, and a shutdown checklist — so the team can run a clean deprecation without surprising consumers or burning support bandwidth.

**Built for:** API product managers, DevRel engineers, and backend teams who know what they're deprecating and need a structured plan before anything goes out. The goal is a deprecation that consumers see coming, understand, and migrate from — without needing a support ticket.

## Best Fit

- Endpoint deprecations (retiring a URL path)
- Response field deprecations (removing a field from an existing response)
- Authentication scheme deprecations (retiring API key format, OAuth flow, etc.)
- SDK major version deprecations (v2 → v3 migration window)
- Webhook event type renaming or removal
- API version end-of-life planning

## Use Something Else

- For emergency breaking changes that must go live before a full deprecation runway, use `breaking-change-comms-kit`.
- For changelog entries documenting a removal that already shipped, use `api-release-notes-composer`.
- For the full set of channel copy during an active breaking change window, use `breaking-change-comms-kit`.
- For developer newsletter announcing the deprecation, use `developer-newsletter-composer`.

## Inputs

| Field | Required | Notes |
|-------|----------|-------|
| `deprecated_item` | Yes | What is being deprecated: endpoint path, field name, auth scheme, SDK version |
| `replacement` | Yes | What consumers should use instead |
| `reason` | No | Why this is being deprecated (briefly) |
| `planned_removal_date` | Yes | When the item will be removed (hard cutoff) |
| `announcement_date` | No | When the deprecation will first be announced |
| `consumer_estimate` | No | Rough estimate of how many consumers use this item |
| `detectable` | No | Can the API tell which consumers are still using the deprecated item? (yes/no) |
| `deprecation_header` | No | Header name to use (default: `Deprecation`) |
| `support_contacts` | No | Support alias, Slack channel, GitHub discussion URL |
| `api_name` | Yes | Name of the API |

## Phase 0 — Intake

Ask only for what is missing.

1. What specifically is being deprecated? (Endpoint path, field name, auth scheme, SDK version)
2. What replaces it? What must consumers use instead?
3. When will it be removed? (The hard cutoff date)
4. When do you want the first announcement to go out?
5. Can your system detect which consumers are currently using the deprecated item?

## Phase 1 — Deprecation Assessment

Before generating any comms, assess the deprecation's complexity:

### Impact Assessment

| Dimension | Questions to answer |
|-----------|---------------------|
| **Breadth** | How many consumers use this? Is usage concentrated or distributed? |
| **Migration effort** | Is this a field rename (low) or a full auth flow change (high)? |
| **Detectability** | Can you identify and contact specific consumers who need to migrate? |
| **Replacement maturity** | Is the replacement generally available, or still in beta? |
| **Runway adequacy** | Is the planned removal date realistic for the migration effort required? |

Produce an assessment:

```
DEPRECATION ASSESSMENT

Item: GET /v1/users (endpoint)
Replacement: GET /v2/users
Reason: v1 response shape does not support pagination
Consumer estimate: ~40% of active API consumers
Migration effort: Medium — response shape changed, consumers need minor updates
Detectable: Yes — API can log requests to /v1/users
Replacement maturity: GA since 2025-06-01
Planned removal: 2026-09-01
Announcement planned: 2026-05-15
Runway: 109 days

Assessment: Runway is adequate for a Medium-effort migration.
Recommendation: Use 90-day standard deprecation timeline.
```

### Minimum Runway Guidelines

| Migration effort | Minimum recommended runway |
|------------------|-----------------------------|
| Low (field rename, header change) | 60 days |
| Medium (endpoint replacement, minor schema change) | 90 days |
| High (auth overhaul, SDK major version, full resource migration) | 180 days |
| Critical (auth, widely used, high migration effort) | 365 days |

Flag if the planned removal date is shorter than the minimum for the effort level.

## Phase 2 — Deprecation Header Strategy

Define how the deprecated item will signal its status in API responses.

### HTTP Deprecation Headers

Use the IETF `Deprecation` header (RFC 9745) for endpoint and field deprecations:

```http
Deprecation: Sat, 01 Sep 2026 00:00:00 GMT
Sunset: Sat, 01 Sep 2026 00:00:00 GMT
Link: <https://docs.example.com/migration/v1-users>; rel="deprecation"
```

| Header | Value | Notes |
|--------|-------|-------|
| `Deprecation` | HTTP date of removal | When the item stops working |
| `Sunset` | HTTP date of removal | Mirrors Deprecation for client library compatibility |
| `Link` | URL with `rel="deprecation"` | Links to the migration guide |

### When to Start Sending Deprecation Headers

Send deprecation headers on every response from the deprecated endpoint or containing the deprecated field from the first announcement date. Do not wait until close to the sunset date.

### SDK Deprecation Markers

For SDK method deprecations, use the language-idiomatic deprecation marker:

```javascript
// JavaScript/TypeScript
/** @deprecated Use client.users.listV2() instead. Removes 2026-09-01. */
client.users.list = function() { ... }

// Python
import warnings
def list_users(self, *args, **kwargs):
    warnings.warn(
        "list_users() is deprecated. Use list_users_v2() instead. Removes 2026-09-01.",
        DeprecationWarning,
        stacklevel=2
    )
```

## Phase 3 — Phased Communication Timeline

Build a deprecation comms timeline from the removal date backward.

### Standard Deprecation Timeline (90-day example)

| Phase | Timing | Actions |
|-------|--------|---------|
| **D-90: Announcement** | Day 0 | Enable deprecation headers. Post initial announcement. Email all consumers (if detectable, email affected only). Publish migration guide. |
| **D-60: First reminder** | Day 30 | Email reminder. Update docs with warning banner. Post community reminder (Discord/Slack). |
| **D-30: Escalation** | Day 60 | Email "final 30 days" notice. Increase docs banner prominence. Post in all relevant community channels. |
| **D-14: Last chance** | Day 76 | Email consumers still on deprecated item (if detectable). Post "2 weeks left" community update. |
| **D-7: Final warning** | Day 83 | Email final warning. Status page upcoming change notice. |
| **D-0: Removal** | Day 90 | Remove deprecated item. Update docs. Publish removal notice. Update changelog. |
| **D+3: Post-removal** | Day 93 | Monitor for unexpected support spike. Publish post-removal notice if support volume is high. |

Compress or extend based on the impact assessment runway recommendation.

```
DEPRECATION TIMELINE — GET /v1/users sunset

2026-05-15  (D-0/Announcement)  Enable Deprecation headers. Email all consumers.
                                 Publish migration guide. Changelog entry.
2026-06-14  (D-30 reminder)     Email reminder. Update docs banner to prominent warning.
                                 Discord/Slack community reminder.
2026-07-15  (D-60 escalation)   Email "final 60 days" notice. Increase docs prominence.
2026-08-01  (D-30 final)        Email "final 30 days." Post all channels.
2026-08-15  (D-14 last-chance)  Email unconverted consumers (if detectable).
2026-08-25  (D-7 final warning) Email final warning. Status page notice.
2026-09-01  (D-0 removal)       Remove /v1/users. Update docs. Publish removal changelog.
2026-09-04  (D+3 follow-up)     Support review. Post-removal notice if needed.
```

## Phase 4 — Per-Channel Copy

### Initial Announcement Email

```
Subject: Deprecation notice: [Deprecated item] removes on [Date]

Starting today, [deprecated item] is deprecated and will be removed on [Date].

What to use instead: [replacement item] — [one-sentence description]
Migration guide: [URL]

[If detectable: We can see your account is actively using [deprecated item].
You'll need to migrate before [Date] to avoid service interruption.]

[If workaround period applies:] During the deprecation window, [deprecated item] will
continue to work normally. Deprecation headers are now included in responses.

Questions? [support alias or channel]
— [Team name]
```

---

### Reminder Email (D-30)

```
Subject: Reminder: [Deprecated item] removes in 30 days ([Date])

A reminder: [deprecated item] will stop working on [Date] — 30 days from now.

If you haven't started your migration, now is the time. [Migration guide →](URL)

[If detectable: We can see your account is still using [deprecated item] on
average [N] times per [day/week].]

Questions? [support alias]
— [Team name]
```

---

### Last-Chance Email (D-14, for detectable consumers only)

```
Subject: Action required: [Deprecated item] removes in 14 days

[Deprecated item] will stop working on [Date] — 14 days from now.
Your account is still using it.

→ Migration guide: [URL]
→ Need help? [support alias]

If you need more time, contact [support alias] before [Date] to discuss options.
— [Team name]
```

---

### Docs Banner Copy

**Warning stage (D-90 to D-30):**
```
⚠ Deprecated: [Item name] will be removed on [Date]. Migrate to [replacement] using the [migration guide →](URL).
```

**Final stage (D-30 to D-0):**
```
⛔ Removal in [N] days: [Item name] will stop working on [Date]. [Migrate now →](URL)
```

---

### Discord/Slack Community Post

**Initial:**
```
📣 Deprecation notice: [Item name] is deprecated and will be removed on [Date].

Replacement: [What to use instead]
Migration guide: [URL]

Deprecation response headers are now live. Check your integration logs for Deprecation/Sunset headers.

Questions? Reply here or reach out in #api-support.
```

**D-30 reminder:**
```
⏰ 30 days left: [Item name] retires on [Date].

If you haven't migrated yet: [migration guide URL]

We'll post another reminder at D-7.
```

---

### Status Page Upcoming Change

```
[Upcoming] [Item name] removal — [Date]
[API name]: [Item name] will be removed on [Date].
Consumers using this item must migrate to [replacement] before that date.
Migration guide: [URL]
```

---

### Changelog Entry

Use in conjunction with `api-release-notes-composer`. Supply this brief:

```
Deprecated: [Item name]
Replacement: [What to use instead]
Sunset date: [Date]
Migration guide URL: [URL]
```

## Phase 5 — Migration Guide Outline

Produce a migration guide outline (full content via `api-release-notes-composer` or `breaking-change-comms-kit`):

```markdown
# Migration: [Deprecated item] → [Replacement]

## What is changing and why

## Who is affected

## Migration steps

### Step 1:
### Step 2:

## Before and after

**Before:**

**After:**

## Testing your migration

## Deadline and support
```

## Phase 6 — Shutdown Checklist

Provide this checklist for the day of removal:

```markdown
## Removal day checklist — [Date]

Pre-removal (the day before):
- [ ] Confirm migration guide is current and links are not broken
- [ ] Confirm docs banner has been updated to "Removal tomorrow" language
- [ ] Notify on-call team that a change is scheduled

Removal (D-0):
- [ ] Remove / disable the deprecated endpoint, field, or scheme
- [ ] Update API docs — remove deprecated item from reference, update all examples
- [ ] Remove deprecation header from all responses (no longer needed after removal)
- [ ] Publish removal entry in changelog (use api-release-notes-composer)
- [ ] Post removal notice in Discord/Slack and on status page
- [ ] Update SDK to throw a clear error if old method is called

Post-removal (D+3):
- [ ] Review support ticket volume — is there an unexpected spike?
- [ ] If spike: triage whether affected consumers were notified and when
- [ ] If a large enterprise consumer is blocked: escalate to account management
- [ ] Archive the deprecated item's docs page (do not delete — keep for historical search)
```

## Phase 7 — Output

Deliver as a single document:

1. Deprecation assessment
2. Minimum runway check
3. Deprecation header configuration
4. Phased communication timeline
5. All channel copy (email × 3, docs banner × 2, Discord/Slack × 2, status page, changelog brief)
6. Migration guide outline
7. Removal day checklist
8. `[URL: ...]` and `[FILL: ...]` placeholders list

## Guardrails

- Do not generate comms before confirming the replacement exists and is generally available
- Do not set a removal date that is shorter than the minimum runway for the effort level without flagging it
- Do not omit the migration guide link from any channel copy
- Do not write removal comms (D-0 or later) before the planned removal date is confirmed
- If the deprecated item has no detectable consumer signal, flag that targeted last-chance emails are not possible and widen to all-consumer communications
- Flag if the replacement is still in beta — deprecating an item before the replacement is GA is a support risk
