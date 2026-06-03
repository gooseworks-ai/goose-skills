---
name: webhook-catalog-author
description: >
  Build a complete, developer-facing webhooks event catalog: event taxonomy and naming conventions, payload schema documentation with field tables, signing and verification instructions, retry and delivery guarantee policies, deduplication patterns, and a consumer implementation checklist. Scoped to webhooks reference documentation — not general API narrative (use openapi-docs-narrative) and not changelog entries (use api-release-notes-composer). Use when an API team ships webhook events but the docs stop at "we send a POST request to your endpoint."
tags: [content, research]
---

# Webhook Catalog Author

Write the full developer reference for your webhook system. This skill covers every layer of webhooks documentation that teams skip: event taxonomy, payload schemas, signing/verification, delivery guarantees, retries, deduplication, and a consumer checklist. The output is ready to publish to a developer portal.

**Built for:** API teams, DevRel engineers, and platform engineers who have a working webhook system but whose docs say "we'll send you a POST" and nothing else.

## Best Fit

- Event catalog reference pages (all events, their payloads, when they fire)
- Webhook security documentation (signature verification)
- Delivery and retry policy documentation
- Consumer implementation guides (endpoint setup, verification, deduplication)
- Payload schema reference tables

## Use Something Else

- For conceptual API auth/error/pagination docs, use `openapi-docs-narrative`.
- For help center articles from support tickets, use `help-center-article-generator`.
- For Postman collection narrative, use `postman-collection-storyteller`.
- For new webhook event announcement copy, use `api-release-notes-composer`.

## Inputs

| Field | Required | Notes |
|-------|----------|-------|
| `api_name` | Yes | Name of the API or product |
| `event_list` | Yes | List of webhook event names, or prose description of what events exist |
| `payload_examples` | No | Sample JSON payloads for each event |
| `signing_scheme` | No | HMAC-SHA256, RSA, Ed25519, or "none" |
| `signing_header` | No | The header name used to deliver the signature |
| `retry_policy` | No | Retry count, backoff strategy, timeout |
| `delivery_guarantee` | No | At-least-once, at-most-once, or exactly-once |
| `idempotency_field` | No | Field in the payload used for deduplication (e.g., `event.id`) |
| `endpoint_requirements` | No | Required response codes, timeout requirements |
| `existing_docs` | No | Existing webhook docs to improve |

## Phase 0 — Intake

Ask only for what is missing.

1. What is the API called?
2. What webhook events does it send? (List them or paste the event names)
3. Do you have sample payloads I can use to document the schemas?
4. How does the API sign webhook requests? (HMAC, RSA, or unsigned)
5. What is the retry policy if the consumer endpoint fails?
6. Is there a unique ID field in payloads that consumers can use for deduplication?

If the user pastes event names or sample payloads, start processing immediately.

## Phase 1 — Event Taxonomy

Before writing any reference, organize the event list into a taxonomy. Events should be grouped by resource and named consistently.

### Naming Convention Audit

Check the provided event names against these standard patterns:

| Pattern | Example | Notes |
|---------|---------|-------|
| `resource.action` | `user.created` | Most common; prefer this |
| `resource.action.qualifier` | `payment.failed.insufficient_funds` | Use only when action alone is ambiguous |
| `resource_action` | `user_created` | Acceptable; flag if inconsistent with other events |
| `ACTION_RESOURCE` | `USER_CREATED` | Discourage; uppercase is non-standard for webhooks |

Flag naming inconsistencies:

```
NAMING AUDIT

✓ user.created — follows resource.action pattern
✓ user.updated — consistent
✗ project_archived — inconsistent with dot-notation events above
✗ PAYMENT.FAILED — uppercase; recommend: payment.failed
```

### Event Taxonomy Table

Produce a grouped event catalog table as the opening of the webhooks reference:

```markdown
## Events

| Event | Trigger | Resource |
|-------|---------|----------|
| `user.created` | A new user account is created | User |
| `user.updated` | A user's profile is updated | User |
| `user.deleted` | A user account is deleted | User |
| `project.created` | A new project is created | Project |
| `project.archived` | A project is moved to archived state | Project |
| `payment.succeeded` | A payment is processed successfully | Payment |
| `payment.failed` | A payment attempt fails | Payment |
```

## Phase 2 — Payload Schema Documentation

Write a reference section for each event.

### Per-Event Reference Template

```markdown
### `user.created`

Fired when a new user account is created.

#### Payload

```json
{
  "event": {
    "id": "evt_01abc",
    "type": "user.created",
    "created_at": "2026-05-15T12:00:00Z",
    "api_version": "2026-01-01"
  },
  "data": {
    "user": {
      "id": "usr_01abc",
      "name": "Taylor Kim",
      "email": "taylor@example.com",
      "created_at": "2026-05-15T12:00:00Z",
      "plan": "pro"
    }
  }
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `event.id` | string | Unique event ID. Use for deduplication. |
| `event.type` | string | Event type. Always `user.created` for this event. |
| `event.created_at` | string (ISO 8601) | When the event was generated. |
| `event.api_version` | string | The API version that generated this event. |
| `data.user.id` | string | The new user's unique identifier. |
| `data.user.name` | string | The user's display name. |
| `data.user.email` | string | The user's email address. |
| `data.user.created_at` | string (ISO 8601) | When the user was created. |
| `data.user.plan` | string | Subscription plan: `free`, `pro`, or `enterprise`. |
```

### Payload Documentation Rules

- Document every field in the payload with type and description
- Use ISO 8601 for all datetime fields; note the format explicitly
- Mark nullable fields as `string | null`
- Mark enum fields with their possible values
- Use realistic but non-real placeholder values in examples
- If field names are inconsistent between events, note it and recommend standardization

## Phase 3 — Security: Signing and Verification

This is the most safety-critical section. Write it with full code examples.

### Signing Documentation Template

```markdown
## Verifying webhook signatures

All webhook requests from [API Name] include a signature header so you can verify
that the request came from us and was not tampered with.

### Signature header

```
[HEADER_NAME]: sha256=[SIGNATURE_HEX]
```

The value is an HMAC-SHA256 hex digest of the raw request body, computed using
your webhook signing secret.

### Getting your signing secret

Your signing secret is in [Settings → Webhooks → [URL]].
Use the **signing secret**, not your API key.

### Verification code

```javascript
const crypto = require('crypto');

function verifyWebhook(rawBody, signatureHeader, signingSecret) {
  const expected = crypto
    .createHmac('sha256', signingSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const received = signatureHeader.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(received, 'hex')
  );
}
```

```python
import hmac
import hashlib

def verify_webhook(raw_body: bytes, signature_header: str, signing_secret: str) -> bool:
    expected = hmac.new(
        signing_secret.encode('utf-8'),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    received = signature_header.replace('sha256=', '')
    return hmac.compare_digest(expected, received)
```

> ⚠ Always use a constant-time comparison (`timingSafeEqual` / `compare_digest`).
> Do not use `===` or `==` for signature comparison — these are vulnerable to timing attacks.

### Rotation

If your signing secret is compromised:
1. Generate a new secret in [Settings → Webhooks → [URL]]
2. Update your consumer endpoint to accept the new secret
3. There is a [N-minute] overlap period where both secrets are valid
4. Remove the old secret after confirming your endpoint uses the new one
```

### Security Rules

- Always include the timing-safe comparison warning
- Always include the signing secret rotation procedure
- Show code examples in at least two languages
- Explicitly use `rawBody` — warn against parsing before verifying
- If the API is unsigned, note this explicitly and recommend the user validate the source IP if available

## Phase 4 — Delivery and Retry Policy

```markdown
## Delivery

### Guarantee

[API Name] webhooks use **at-least-once delivery**. You may receive the same event
more than once. Use the `event.id` field to deduplicate.

### Endpoint requirements

Your endpoint must:
- Accept `POST` requests
- Respond with a `2xx` status code within **[N] seconds**
- Return the response before processing — do not wait for long-running work

### Retry policy

If your endpoint does not return a `2xx` within the timeout, or returns a `4xx` or `5xx`,
we retry delivery using exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 5 minutes |
| 3 | 30 minutes |
| 4 | 2 hours |
| 5 | 6 hours |

After [N] failed attempts, the event is marked undeliverable and you will receive
an alert at [notification method].

### Viewing failed deliveries

You can inspect and manually retry failed webhook deliveries in [Settings → Webhooks → [URL]].
```

## Phase 5 — Deduplication Guide

```markdown
## Deduplication

Because [API Name] uses at-least-once delivery, your consumer must be idempotent.

Use the `event.id` field as your deduplication key:

```javascript
const processedEvents = new Set(); // Use a persistent store in production (Redis, DB)

app.post('/webhooks', (req, res) => {
  const event = req.body;

  if (processedEvents.has(event.event.id)) {
    // Already processed — acknowledge and skip
    return res.status(200).send('ok');
  }

  processedEvents.add(event.event.id);

  // Process the event
  handleEvent(event);

  res.status(200).send('ok');
});
```

Key properties of `event.id`:
- Globally unique across all events for your account
- Stable across retries — the same event delivery always has the same `event.id`
- Safe to use as a database primary key or cache key
```

## Phase 6 — Consumer Implementation Checklist

```markdown
## Consumer checklist

Before going to production with your webhook consumer:

- [ ] **Verify signatures** on every incoming request ([Verification guide →](#verifying-webhook-signatures))
- [ ] **Respond within [N] seconds** — offload long-running work to a background job
- [ ] **Return 2xx immediately** — do not block the response on processing
- [ ] **Implement deduplication** using `event.id` ([Deduplication guide →](#deduplication))
- [ ] **Handle retries gracefully** — your handler must be idempotent
- [ ] **Log `event.id` and `event.type`** on every received event for debugging
- [ ] **Test in sandbox/staging** before enabling production webhooks
- [ ] **Monitor for failed deliveries** in [Settings → Webhooks → [URL]]
```

## Phase 7 — Output

Deliver as a single Markdown document with these sections:

1. Events table (full taxonomy)
2. Per-event payload reference (all events)
3. Signing and verification (with code examples)
4. Delivery and retry policy
5. Deduplication guide
6. Consumer checklist

Also deliver:
- Naming convention issues found during the taxonomy audit
- A list of `[URL: ...]` placeholders needing real links
- Any payload fields that were ambiguous and need clarification from the team

## Guardrails

- Do not invent event names or payload fields not described by the user
- Do not skip the timing-safe comparison warning in the signing section
- Do not present unsigned webhooks as secure without noting the limitation
- Do not use realistic-looking fake user data (no real names, real emails)
- If a delivery guarantee is not specified, default to documenting at-least-once and flag that the user should confirm
- Flag any event naming inconsistencies rather than silently normalizing them
