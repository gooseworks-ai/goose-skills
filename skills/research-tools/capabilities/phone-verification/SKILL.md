---
name: phone-verification
description: Verify phone numbers using SMS one-time codes via the Didit API. Use when you need to confirm a user owns a phone number, implement SMS-based 2FA, or validate phone during signup/onboarding flows.
source: orthogonal
---


# Phone Verification

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Verify phone numbers by sending SMS one-time verification codes via Didit.

## Quick Start

```bash
# Send verification code via SMS
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/phone/send","body":{"phone_number":"+14155551234"}}'

# Verify the code user provides
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/phone/check","body":{"phone_number":"+14155551234","code":"123456"}}'
```

## Workflow

### 1. Send Verification Code

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/phone/send"}'
  -d '{"phone_number": "+14155551234"}'
```

**Request format:**
- Phone must be in E.164 format (e.g., `+14155551234`)
- Include country code with `+` prefix

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

### 2. Verify Code

When the user provides the code they received:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/phone/check"}'
  -d '{"phone_number": "+14155551234", "code": "123456"}'
```

**Response (success):**
```json
{
  "success": true,
  "verified": true
}
```

## Phone Number Format

Always use E.164 format:
- US: `+14155551234`
- UK: `+447911123456`
- Germany: `+4915123456789`

## Use Cases

- **User signup:** Verify phone before creating account
- **SMS 2FA:** Add phone-based second factor authentication
- **Account recovery:** Verify ownership via SMS
- **Delivery confirmation:** Confirm contact number for orders

## Integration Example (TypeScript)

```typescript
import Orthogonal from "@orth/sdk";

const orthogonal = new Orthogonal({

});

// Send verification code via SMS
const sendResult = await orthogonal.run({
  api: "didit",
  path: "/v3/phone/send",
  body: { phone_number: "+14155551234" }
});

// Verify the code
const verifyResult = await orthogonal.run({
  api: "didit",
  path: "/v3/phone/check",
  body: { 
    phone_number: "+14155551234",
    code: "123456"
  }
});

if (verifyResult.data.verified) {
  console.log("Phone verified!");
}
```
