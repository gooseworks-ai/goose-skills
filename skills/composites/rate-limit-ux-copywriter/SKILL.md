---
name: rate-limit-ux-copywriter
description: >
  Write rate-limit and quota UX copy for developer-facing API surfaces: 429 error response messages, rate-limit documentation prose, retry-after guidance, quota tier descriptions, and upgrade path prompts. Scoped to the developer-facing copy layer of rate limiting — not the conceptual rate-limit explainer section of API docs (use openapi-docs-narrative) and not help center support articles about rate limits (use help-center-article-generator). Use when an API team needs to replace "Too Many Requests" with copy that tells developers what to do next without generating a support ticket.
tags: [content]
---

# Rate Limit UX Copywriter

Write the copy that wraps your rate-limiting system. This skill covers the developer-facing text layer: 429 error bodies, rate limit response headers, quota documentation, retry guidance, developer dashboard quota UI, and upgrade prompts — the copy that turns a confusing HTTP 429 into a developer-trustworthy product experience.

**Built for:** API product managers, DevRel engineers, and backend engineers who have a working rate-limiting system but whose error responses say "Too Many Requests" and nothing else, and whose quota docs don't exist yet.

## Best Fit

- 429 error response body copy
- `Retry-After` and rate limit header documentation strings
- Quota tier description tables
- Developer dashboard rate-limit status UI microcopy
- Rate-limit upgrade prompt copy
- In-SDK rate limit warning messages
- API docs rate-limit context section copy (distinct from the narrative explainer)

## Use Something Else

- For the full conceptual rate-limit explainer in API docs, use `openapi-docs-narrative` (section: `rate-limits`).
- For help center articles answering "Why am I being rate limited?", use `help-center-article-generator`.
- For quota tier pricing copy aimed at buyers, this skill does not cover commercial/pricing copy.

## Inputs

| Field | Required | Notes |
|-------|----------|-------|
| `rate_limit_type` | Yes | Per-second, per-minute, per-hour, per-day, per-account, per-endpoint, etc. |
| `limit_values` | No | Actual numeric limits by tier |
| `tier_names` | No | Free, Pro, Enterprise, etc. |
| `retry_after_behavior` | No | Fixed window, sliding window, or token bucket |
| `headers_used` | No | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`, etc. |
| `upgrade_path` | No | URL or action for upgrading quota |
| `contact_path` | No | Support alias or contact URL for enterprise quota requests |
| `api_name` | Yes | Name of the API |
| `copy_surface` | Yes | Which surfaces to write copy for. See Surface Menu below. |

## Surface Menu

Specify one or more surfaces per request:

| Surface ID | What needs copy |
|------------|----------------|
| `error-body` | 429 JSON error response body |
| `headers` | Rate limit response header documentation strings |
| `quota-table` | Tier quota comparison table |
| `dashboard-ui` | Rate limit status panel microcopy |
| `upgrade-prompt` | Inline upgrade nudge copy |
| `sdk-warning` | SDK client-side rate limit warning message |
| `docs-section` | Short rate-limit context prose for docs page |

## Phase 0 — Intake

Ask only for what is missing.

1. What is the API called?
2. What kind of rate limiting does it use? (per-second, per-minute, per-day, per-account)
3. What are the actual limits by tier? (e.g., Free: 100 req/min, Pro: 1000 req/min)
4. Which surfaces need copy? (error body, docs, dashboard, upgrade prompt, SDK warning)
5. What should a developer do when they hit the limit? (Wait and retry, upgrade, contact sales)

## Phase 1 — Rate Limit Context Model

Before writing any copy, understand the rate limiting model:

| Model | Behavior | Copy implication |
|-------|----------|-----------------|
| **Fixed window** | Resets on the clock (e.g., every minute at :00) | State the reset time explicitly |
| **Sliding window** | Resets N seconds after your last request | Explain "your window moves with your requests" |
| **Token bucket** | Refills at a steady rate; burst allowed | Explain burst capacity and refill rate |
| **Concurrent** | Limits simultaneous open connections, not request count | Different — not time-based |

Confirm the model before writing retry guidance, since the retry strategy differs by model.

## Phase 2 — 429 Error Body Copy

### 429 Response Template

The 429 error body should answer four questions: what happened, which limit was hit, when it resets, and what to do.

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "You have exceeded the request limit for your plan. Slow down and retry after the window resets.",
    "limit": 100,
    "remaining": 0,
    "reset_at": "2026-05-15T14:01:00Z",
    "retry_after": 42,
    "docs_url": "https://docs.example.com/rate-limits",
    "upgrade_url": "https://app.example.com/upgrade"
  }
}
```

| Field | Value | Copy notes |
|-------|-------|-----------|
| `code` | `rate_limit_exceeded` | Machine-readable. Use `rate_limit_exceeded`, not `too_many_requests`. |
| `message` | Human-readable prose | Tell the developer exactly what to do. See message templates below. |
| `limit` | Integer | The limit that was hit |
| `remaining` | `0` on a 429 | Confirms the bucket is empty |
| `reset_at` | ISO 8601 UTC | When the window resets. Required. |
| `retry_after` | Seconds as integer | Echo of the `Retry-After` header. Required. |
| `docs_url` | URL | Deep link to rate limit docs. Do not link to the homepage. |
| `upgrade_url` | URL | Only include if an upgrade would raise this specific limit. |

### Error Message Copy Templates

**General rate limit (fixed window):**
```
"You have exceeded [N] requests per [period] on the [Free/Pro] plan.
Your limit resets at [time] UTC ([N] seconds). Retry after that time,
or upgrade to [Plan] for [N] requests per [period]."
```

**Per-endpoint rate limit:**
```
"The [GET /v2/users] endpoint is rate-limited to [N] requests per [period].
Your limit resets in [N] seconds. Consider caching responses or using the
[bulk endpoint] for high-volume reads."
```

**Concurrent connection limit:**
```
"You have reached the maximum of [N] concurrent connections.
Close an existing connection before opening a new one."
```

**Account-level quota:**
```
"Your account has reached its monthly API quota of [N] requests.
Your quota resets on [date]. To continue, upgrade your plan or contact
[sales / support] for a quota increase."
```

### Message Writing Rules

- State the limit that was hit, not just "rate limit exceeded"
- State the reset time in both absolute UTC and as a relative seconds value
- Suggest the specific action (retry after N seconds, use bulk endpoint, upgrade)
- Do not write "please" in error messages — it does not help and wastes space
- Do not write "sorry" — own the limit as a feature, not an apology
- Do not use the message field for upsell unless an upgrade is a genuine solution

## Phase 3 — Rate Limit Header Documentation

Document the headers included in every API response (not just 429s) that let developers track their usage.

```markdown
## Rate limit headers

Every API response includes headers showing your current rate limit status:

| Header | Type | Description |
|--------|------|-------------|
| `X-RateLimit-Limit` | integer | Your plan's request limit for this endpoint per [period] |
| `X-RateLimit-Remaining` | integer | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp | When the current window resets |
| `Retry-After` | integer (seconds) | Seconds to wait before retrying. Present on 429 responses only. |

### Using the headers

Check `X-RateLimit-Remaining` proactively to avoid hitting the limit:

```javascript
const remaining = parseInt(response.headers['x-ratelimit-remaining'], 10);
const resetAt = parseInt(response.headers['x-ratelimit-reset'], 10);

if (remaining < 10) {
  const waitMs = (resetAt - Math.floor(Date.now() / 1000)) * 1000;
  console.warn(`Approaching rate limit. Consider pausing for ${waitMs}ms.`);
}
```
```

## Phase 4 — Quota Tier Documentation Table

```markdown
## Plans and limits

| Plan | Requests per minute | Requests per day | Concurrent connections | Webhook endpoints |
|------|--------------------|-----------------|-----------------------|-------------------|
| Free | 60 | 1,000 | 2 | 1 |
| Pro | 1,000 | 100,000 | 10 | 10 |
| Enterprise | Custom | Custom | Custom | Unlimited |

Limits apply per account. Burst traffic above the per-minute limit is absorbed up to
[N] requests before throttling begins.

Need higher limits? [Contact us →](URL)
```

### Quota Table Rules

- Include every meaningful dimension (per-minute, per-day, concurrent, feature-specific)
- Show "Custom" for enterprise rather than a number that can be negotiated
- Add a note about burst capacity if the API supports it
- Link directly to the upgrade or contact page, not the pricing homepage

## Phase 5 — Developer Dashboard Microcopy

For the rate-limit status panel in a developer dashboard or settings page:

```markdown
**API usage**

[Progress bar: 850 / 1,000 requests used this minute]

85% of your per-minute limit used.
Resets in 14 seconds.

[View full usage →]

---

**Monthly quota**

[Progress bar: 82,400 / 100,000 requests used this month]

You've used 82% of your monthly quota. At this rate, you'll reach your limit
in approximately 6 days.

[Upgrade plan →] to avoid interruptions.
```

### Dashboard Copy Rules

- Use the exact same time units consistently (don't mix "seconds" and "minutes" for the same counter)
- Show both the absolute usage number and the percentage
- Predictive language ("you'll reach your limit in ~N days") is helpful but must be clearly marked as an estimate
- The upgrade CTA should appear at 80%+ usage

## Phase 6 — Upgrade Prompt Copy

```markdown
**You've reached your rate limit**

Your [Free] plan allows [60] requests per minute. You've hit that limit.

- [Pro plan →] — [1,000] requests per minute, no interruptions
- [Contact us →] — Custom limits for high-volume or enterprise use

Your current window resets in [N] seconds if you'd like to continue on your current plan.
```

### Upgrade Prompt Rules

- State the current limit and the upgrade limit side by side
- Do not write "upgrade now to unlock unlimited API access" unless it is actually unlimited
- Give the developer the option to wait if they do not want to upgrade
- Keep to under 75 words

## Phase 7 — SDK Warning Copy

For SDK client-side warnings before a 429 is hit (proactive, using `X-RateLimit-Remaining`):

```javascript
// SDK warning message — not an error, just a heads-up
console.warn(
  `[ExampleSDK] Rate limit warning: ${remaining} requests remaining in the current window. ` +
  `Window resets in ${secondsToReset}s. Consider adding a delay or using batch endpoints.`
);
```

SDK warning rules:
- Prefix with the SDK name so it is clear where the warning comes from
- Show remaining count and reset time
- Suggest a concrete action (delay, batch endpoint)
- Fire at a threshold (e.g., fewer than 10 remaining), not at every request

## Phase 8 — Output

Deliver the requested surfaces as a single document with clear labeled sections. Include:

1. Rate limit context model assessment
2. 429 error body with field documentation
3. Error message copy variants (general, per-endpoint, account-level as applicable)
4. Header documentation table and code example
5. Quota tier table
6. Dashboard microcopy
7. Upgrade prompt copy
8. SDK warning template

Flag any placeholder values that need real numbers or URLs.

## Guardrails

- Do not write apologetic error messages ("sorry for the inconvenience")
- Do not invent limit values — if not provided, use `[N]` placeholders
- Do not link to the pricing or upgrade page from a 429 error unless upgrading actually solves the specific limit hit
- Do not promise "unlimited" requests in upgrade copy unless the plan is genuinely unlimited
- If the retry window model is not confirmed, default to showing both absolute time and relative seconds and flag the assumption
