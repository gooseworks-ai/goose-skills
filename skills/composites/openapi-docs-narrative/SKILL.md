---
name: openapi-docs-narrative
description: >
  Write the conceptual and narrative spine of API documentation: authentication flows, error model, pagination strategy, versioning policy, idempotency guide, and rate-limit context. These are the sections that OpenAPI/Swagger spec generation cannot produce. Scoped to reference-doc narrative copy for developer portals and API docs sites — not help center support articles (use help-center-article-generator) and not SDK quickstarts (use sdk-quickstart-hardening-guide). Use when an API team has a working spec but their docs portal still reads like raw JSON.
tags: [content, research]
---

# OpenAPI Docs Narrative

Write the human-readable layer of API documentation that spec generators can't produce. This skill covers authentication, errors, pagination, versioning, idempotency, and other cross-cutting concepts that every API consumer needs to understand before they write a single line of code.

**Built for:** API product managers, developer-experience writers, and backend teams who have a working OpenAPI spec or endpoint set but whose documentation portal still reads like raw YAML.

## Best Fit

- Authentication and authorization guides (API keys, OAuth, JWT, scoped tokens)
- Error reference pages (error codes, error object shapes, retry guidance)
- Pagination documentation (cursor, offset, keyset strategies)
- Versioning policy pages (how versions are numbered, how long they are supported)
- Idempotency guides (how to use idempotency keys, which endpoints support them)
- Rate limit and quota context pages (not copy — use `rate-limit-ux-copywriter` for copy)
- Getting-started conceptual overview (not quickstart code — use `sdk-quickstart-hardening-guide`)

## Use Something Else

- For step-by-step SDK quickstart with runnable code, use `sdk-quickstart-hardening-guide`.
- For support KB articles from tickets, use `help-center-article-generator`.
- For changelog entries, use `api-release-notes-composer`.
- For webhook payload and event catalog, use `webhook-catalog-author`.
- For Postman collection narrative, use `postman-collection-storyteller`.

## Inputs

| Field | Required | Notes |
|-------|----------|-------|
| `section` | Yes | Which doc section to write. See Section Menu below. |
| `api_name` | Yes | The name of the API or product |
| `api_description` | No | One paragraph on what the API does |
| `auth_scheme` | No | API key, OAuth 2.0, JWT, HMAC, mTLS, etc. |
| `base_url` | No | Used in code examples |
| `error_format` | No | Sample error object JSON, or description of error shape |
| `pagination_type` | No | cursor, offset, page-number, keyset, link-header |
| `versioning_strategy` | No | URL path, header, date-based, semver |
| `audience` | No | External developers, internal consumers, or both |
| `tone` | No | Technical/direct (default), friendly, enterprise |
| `existing_draft` | No | Any existing prose to improve rather than write from scratch |

## Section Menu

Specify one or more of these sections per request:

| Section ID | What it covers |
|------------|---------------|
| `authentication` | Auth methods, credential formats, token scoping, rotation |
| `errors` | Error object structure, status codes used, retry logic |
| `pagination` | Strategy type, how to use cursors/offsets, result limits |
| `versioning` | Version numbering, support lifecycle, migration expectations |
| `idempotency` | Idempotency key usage, which endpoints support it, failure behavior |
| `rate-limits` | Conceptual rate limit explainer (pairs with `rate-limit-ux-copywriter`) |
| `environments` | Production, sandbox, staging endpoints and key differences |
| `overview` | Conceptual intro: what the API is, who it's for, what you can build |

## Phase 0 — Intake

Ask only for what is missing. Skip questions where the section makes the answer obvious.

1. Which section(s) should I write?
2. What is the API called and what does it do in one paragraph?
3. What auth scheme does the API use?
4. What does a typical error response look like? (Paste an example or describe the shape.)
5. What pagination strategy does the API use?
6. Is there an existing draft or docs page I should improve rather than start fresh?

If the user pastes an existing docs page, focus on rewriting and improving it. Ask fewer questions.

## Phase 1 — Audience and Depth Calibration

Before writing, calibrate depth and tone:

| Audience | Depth | Style |
|----------|-------|-------|
| External developers (general) | Full context, code examples for multiple languages | Friendly-technical |
| External developers (enterprise) | Full context, compliance notes, security considerations | Formal-technical |
| Internal developers | Concise, assume API familiarity, reference-style | Technical, minimal prose |
| Mixed | Full context, optional "Advanced" callout sections | Friendly-technical |

## Phase 2 — Section Writing

### `authentication` — Auth Guide

```markdown
# Authentication

The [API Name] API uses [auth scheme] for all requests.

## [Auth Method 1: e.g., API Keys]

[What API keys are in this context. One paragraph.]

### Getting your key

[How to obtain a key. Portal URL placeholder, or CLI command if applicable.]

### Using your key

All requests must include your API key in the `Authorization` header:

```http
GET /v2/resources HTTP/1.1
Host: api.example.com
Authorization: Bearer YOUR_API_KEY
```

### Key rotation

[How to rotate keys without downtime. Dual-key overlap period if applicable.]

### Scoped tokens

[If the API supports scopes, list them and explain what each scope grants.]

| Scope | Access |
|-------|--------|
| `read:users` | Read user profiles |
| `write:users` | Create and update user records |
| `admin` | Full account access |

## Security considerations

- Never expose API keys in client-side code or public repositories
- Use environment variables for key storage
- Rotate keys immediately if compromised
- [Link to key management docs →]
```

### `errors` — Error Reference

```markdown
# Errors

The [API Name] API uses standard HTTP status codes. All error responses include a JSON body.

## Error object

```json
{
  "error": {
    "code": "resource_not_found",
    "message": "The requested user does not exist.",
    "request_id": "req_01abc",
    "docs_url": "https://docs.example.com/errors/resource_not_found"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Machine-readable error code. Use this for programmatic handling. |
| `message` | string | Human-readable description. Do not use this for programmatic handling. |
| `request_id` | string | Include this in support requests for fast debugging. |
| `docs_url` | string | Link to the specific error reference page. |

## Status codes used

| Code | Meaning | Common cause |
|------|---------|--------------|
| `200` | OK | Request succeeded |
| `201` | Created | Resource created |
| `400` | Bad Request | Malformed request, missing required field |
| `401` | Unauthorized | Missing or invalid API key |
| `403` | Forbidden | Valid key, insufficient scope |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate resource or state conflict |
| `422` | Unprocessable Entity | Valid format, invalid business logic |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |

## Retrying requests

Retry requests that receive `429` or `5xx` responses using exponential backoff:

```python
import time

def with_retry(request_fn, max_retries=3):
    for attempt in range(max_retries):
        response = request_fn()
        if response.status_code not in (429, 500, 502, 503, 504):
            return response
        wait = 2 ** attempt
        time.sleep(wait)
    raise Exception("Max retries exceeded")
```

Do not retry `4xx` responses (except `429`). They indicate a client error that won't resolve by retrying.
```

### `pagination` — Pagination Guide

Choose the appropriate template based on the API's strategy.

**Cursor pagination:**

```markdown
# Pagination

The [API Name] API uses cursor-based pagination for collection endpoints.

## How it works

Each list response includes a `next_cursor` value. Pass this value as the `cursor`
query parameter on your next request to fetch the following page.

```http
GET /v2/users?limit=50
```

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "cur_01abc",
    "has_more": true
  }
}
```

```http
GET /v2/users?limit=50&cursor=cur_01abc
```

When `has_more` is `false`, you have reached the last page.

## Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | 20 | 100 | Records per page |
| `cursor` | string | — | — | Opaque cursor from previous response |

## Cursor stability

Cursors are stable for [X hours/days]. Do not store cursors beyond that window.
Cursors are invalidated by [deletion of the record they point to / dataset changes].
```

### `versioning` — API Versioning Policy

```markdown
# API Versioning

## Version strategy

[API Name] uses [URL path versioning / date-based versioning / header versioning].

```http
GET /v2/users
Authorization: Bearer YOUR_KEY
```

## Supported versions

| Version | Status | End of life |
|---------|--------|-------------|
| v3 | Current | — |
| v2 | Maintained | 2027-01-01 |
| v1 | Deprecated | 2026-07-01 |

## What constitutes a breaking change

We treat these as breaking changes that require a version bump:
- Removing a field from a response
- Changing a field type
- Removing an endpoint
- Changing required parameters
- Changing authentication requirements

We do not treat these as breaking:
- Adding new optional fields to responses
- Adding new optional query parameters
- Adding new endpoints
- Fixing bugs where the old behavior was clearly wrong

## Upgrade process

When a new major version is released, we provide:
1. A migration guide
2. A [90-day / 6-month] overlap period where both versions are live
3. Deprecation headers on old-version responses

We send breaking-change announcements to [list / changelog / email].
```

### `idempotency` — Idempotency Guide

```markdown
# Idempotency

## What is idempotency

An idempotent request produces the same result when repeated. For write operations,
this means you can safely retry a request without creating duplicate records.

## Which endpoints support idempotency

Idempotency keys are supported on `POST` requests that create or mutate resources:

| Endpoint | Idempotent |
|----------|-----------|
| `POST /v2/payments` | ✓ |
| `POST /v2/users` | ✓ |
| `DELETE /v2/users/:id` | ✓ (naturally idempotent) |
| `GET /v2/users` | ✓ (all GETs are naturally idempotent) |

## How to use idempotency keys

Include an `Idempotency-Key` header with a unique string per logical operation.
Use a UUID or ULID. Do not reuse keys across different operations.

```http
POST /v2/payments HTTP/1.1
Authorization: Bearer YOUR_KEY
Idempotency-Key: 01HZXR7B4F6NCQZK38T5P1E29M
Content-Type: application/json

{ "amount": 5000, "currency": "usd", "customer": "cust_01abc" }
```

## Key behavior

- Keys are scoped to your account and expire after [24 hours / 7 days].
- If you submit the same key with different request bodies, the API returns a `409 Conflict`.
- A successful response is cached against the key; subsequent requests with the same key return the cached response without re-executing.
```

### `overview` — Conceptual Introduction

```markdown
# [API Name] API Overview

[Two to three paragraphs. What the API is, what it lets developers build, and what
the high-level request/response model looks like. No marketing language.]

## Base URL

```
https://api.example.com
```

All requests use HTTPS. HTTP requests are not supported.

## Request format

The API accepts JSON bodies for all `POST`, `PUT`, and `PATCH` requests.
Set the `Content-Type: application/json` header on requests with a body.

## Response format

All responses are JSON. Successful responses return an HTTP `2xx` status code
and a response body shaped to the endpoint.

## Authentication

All requests require a valid API key. See [Authentication →](#authentication).

## Next steps

- [Quickstart →](#quickstart)
- [Authentication →](#authentication)
- [Errors →](#errors)
- [API Reference →](#reference)
```

## Phase 3 — Copy Quality Rules

Apply these rules to every section written:

- Write in second person: "You can use…", "Your request should include…"
- Use active voice throughout
- Never use "simply" or "just" or "easily"
- Include at least one code example per major concept
- HTTP examples should use real header names and realistic placeholder values
- Tables for enumerations (status codes, scopes, parameters) rather than prose lists
- Cross-link related sections instead of repeating content
- Aim for scannable structure: every section should be navigable with a table of contents

## Phase 4 — Output

Deliver:
1. The requested section(s) as formatted Markdown
2. A list of placeholder values the team needs to fill in (e.g., `[URL: support contact]`, `[X hours: cursor TTL]`)
3. Notes on any assumptions made due to missing inputs

## Guardrails

- Do not invent auth flows, error codes, or behavior not described by the user
- Do not write marketing copy — API docs are for developers who have already decided to integrate
- Do not use "industry-leading", "powerful", or "seamless"
- If the user provides contradictory information (e.g., says "cursor pagination" but provides an offset-based example), surface the conflict before writing
- Mark all real-URL placeholders clearly so the team does not ship placeholder text
