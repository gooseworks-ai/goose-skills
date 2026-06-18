---
name: verify-email
description: Verify if an email address is valid and deliverable
source: orthogonal
---


# Email Verification

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Check if an email address is valid, exists, and can receive mail. Prevent bounces before sending.

## When to Use

- User wants to verify an email before sending
- User asks "is this email address real?"
- Cleaning an email list
- Before cold outreach to avoid bounces
- Validating user-provided email addresses

## How It Works

Uses Hunter or Tomba APIs to verify email deliverability through multiple checks including syntax, domain, and mailbox verification.

## Usage

### Verify with Hunter

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-verifier","query":{"email":"john@example.com"}}'
```

### Verify with Tomba

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-verifier","query":{"email":"jane@company.com"}}'
```

## Parameters

- **email** (required) - The email address to verify

## Response

### Hunter Response
Returns `data` object:
- **status** (string) - `valid`, `invalid`, `accept_all`, or `unknown`
- **score** (integer) - Confidence score 0-100
- **result** (string) - `deliverable`, `undeliverable`, or `risky` *(deprecated — use `status`)*
- **regexp** (boolean) - Syntax is valid
- **gibberish** (boolean) - Address looks random
- **disposable** (boolean) - Temporary email service
- **webmail** (boolean) - Free webmail provider (Gmail, Yahoo, etc.)
- **mx_records** (boolean) - Domain has MX records
- **smtp_server** (boolean) - SMTP server responds
- **smtp_check** (boolean) - Mailbox exists on server
- **accept_all** (boolean) - Server accepts all addresses
- **block** (boolean) - Email is blocked
- **sources** (array) - Web pages where this email was found

### Tomba Response
Returns `data.email` object:
- **status** (string) - `valid`, `invalid`, or `accept_all`
- **result** (string) - `deliverable`, `undeliverable`, or `risky`
- **score** (integer) - Confidence score 0-100
- **smtp_provider** (string) - Email provider name (e.g., "Google Workspace")
- **mx** (object) - `records` array of MX hostnames
- **mx_check**, **smtp_server**, **smtp_check** (boolean) - Verification checks
- **accept_all**, **greylisted**, **block** (boolean) - Server behavior flags
- **gibberish**, **disposable**, **webmail**, **regex** (boolean) - Address quality checks
- **whois** (object) - Domain registration: `registrar_name`, `referral_url`, `created_date`

Also returns `data.sources` array with `uri`, `website_url`, `extracted_on`, `last_seen_on`, `still_on_page`.

## Result Types

| Status | Meaning | Action |
|--------|---------|--------|
| **valid** | Mailbox exists and accepts mail | Safe to send |
| **invalid** | Mailbox doesn't exist or domain has no MX | Don't send |
| **accept_all** | Server accepts any address — can't confirm mailbox | Send with caution |
| **unknown** | Couldn't verify (timeout, greylisting) | Verify manually |

## Examples

**User:** "Check if hello@acme.com is a real email"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-verifier","query":{"email":"hello@acme.com"}}'
```

**User:** "Verify sarah.jones@startup.io before I send my pitch"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/email-verifier","query":{"email":"sarah.jones@startup.io"}}'
```

## Error Handling

- **400** - Missing or malformed `email` parameter
- **401** - Invalid API key — check `orth auth`
- **429** - Rate limit exceeded — wait and retry
- If both APIs return `unknown`, the mail server is likely blocking verification — try later
- Tomba may return `greylisted: true` — means the server deferred; retry after a few minutes

## Tips

- Always verify emails before bulk sending to protect sender reputation
- "Valid" doesn't guarantee delivery - content still matters
- Role-based emails (info@, sales@) may be valid but less effective for outreach
- Disposable emails (tempmail, etc.) are detected and flagged
- Some corporate domains block verification - "unknown" doesn't mean invalid
