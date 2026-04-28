---
name: send-sms-textbelt
description: Send SMS text messages to phone numbers. Use when the user asks to send a text, send an SMS, text someone, message a phone number, or send a notification via text message.
source: orthogonal
---


# Send Text Message

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Send SMS messages via the Textbelt API on Orthogonal.

## Workflow

### Step 1: Gather Info

Ask the user for:
- **Phone number** (required) - US/Canada: 10-digit with area code. International: E.164 format (e.g., +44...)
- **Message** (required) - Max 800 characters. No URLs allowed.

### Step 2: Send the Message

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"textbelt","path":"/text"}'
  "phone": "<phone_number>",
  "message": "<message_text>"
}'
```

### Step 3: Confirm Delivery

The response includes a `textId`. Use it to check delivery status:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"textbelt","path":"/status/{textId}"}'
```

This endpoint is free.

## Response

### Send Response (`/text`)
- **success** (boolean) - `true` if message was queued
- **textId** (string) - Message ID for delivery tracking (only on success)
- **quotaRemaining** (integer) - Remaining SMS credits
- **error** (string) - Error message (only on failure)

### Status Response (`/status/{textId}`)
- **status** (string) - `DELIVERED`, `SENDING`, `FAILED`, or `UNKNOWN`

## Constraints

- Max 800 characters per message
- No URLs in message text
- Sender name is optional and not visible to the recipient in most countries

## Optional Parameters

When sending, you can also include:
- `sender` (string) - Business/org name for regulatory purposes
- `replyWebhookUrl` (string) - US only: URL to receive reply webhooks
- `webhookData` (string) - Extra data passed to webhook (max 100 chars)

## Error Handling

- **success: false** with `error` field describes the issue (e.g., invalid phone number, insufficient credits)
- US/Canada numbers only work from US/Canada IP region
- International numbers require E.164 format (e.g., `+44...`)
- Messages containing URLs are rejected — use descriptions instead
- Max 800 characters — longer messages are rejected, not truncated
