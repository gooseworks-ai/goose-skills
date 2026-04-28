---
name: restaurant-booking
description: Book restaurant reservations via browser automation. Use when asked to make dinner reservations, book a table, or find availability at restaurants. Supports OpenTable, Resy, and direct restaurant booking sites.
source: orthogonal
---


# Restaurant Booking

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Book reservations using Notte browser automation via Orthogonal.

## Requirements

- Orthogonal CLI (`npm install -g @orth/cli`) or API key
- Guest info: name, email, phone

## Quick Flow

1. Start Notte session
2. Navigate to booking site (OpenTable preferred)
3. Select date/time/party size
4. Fill contact form
5. Submit and confirm

## CLI Method (Recommended)

### 1. Start a Notte Session

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/start"}'
  --body '{"browser_type":"chromium","headless":true,"solve_captchas":true,"idle_timeout_minutes":10}'
```

Save the `session_id` from the response.

### 2. Navigate to OpenTable

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute"}'
  --body '{"type":"goto","url":"https://www.opentable.com/r/{restaurant}?datetime=2026-02-17T19:00&covers=2"}'
```

### 3. Click Time Slot

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute"}'
  --body '{"type":"click","selector":"button:has-text(\"7:00 PM\")"}'
```

### 4. Select Seating (if prompted)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute"}'
  --body '{"type":"click","selector":"button:has-text(\"Select\")"}'
```

### 5. Fill the Form

```bash
# First name
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute"}'
  --body '{"type":"fill","selector":"input#firstName","value":"John"}'

# Last name
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute"}'
  --body '{"type":"fill","selector":"input#lastName","value":"Doe"}'

# Email
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute"}'
  --body '{"type":"fill","selector":"input#email","value":"john@example.com"}'

# Phone
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute"}'
  --body '{"type":"fill","selector":"input#phoneNumber","value":"4155551234"}'
```

### 6. Accept Terms

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute"}'
  --body '{"type":"click","selector":"text=I agree to the restaurant"}'
```

### 7. Submit Reservation

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute"}'
  --body '{"type":"click","selector":"button:has-text(\"Complete reservation\")"}'
```

### 8. Verify Confirmation

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/scrape"}'
  --body '{"only_main_content":true}'
```

Look for "confirmed" in the response.

## API Method (curl)

```bash
# Start session
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{
    "api": "notte",
    "path": "/sessions/start",
    "body": {
      "browser_type": "chromium",
      "headless": true,
      "solve_captchas": true,
      "idle_timeout_minutes": 10
    }
  }'

# Execute actions (same pattern)
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{
    "api": "notte",
    "path": "/sessions/{session_id}/page/execute",
    "body": {"type":"goto","url":"https://www.opentable.com/..."}
  }'
```

## Key Selectors (OpenTable)

| Field | Selector |
|-------|----------|
| First name | `input#firstName` |
| Last name | `input#lastName` |
| Email | `input#email` |
| Phone | `input#phoneNumber` |
| Terms checkbox | `text=I agree to the restaurant` |
| Submit | `button:has-text('Complete reservation')` |
| Time slots | `button:has-text('7:00 PM')` |
| Seating select | `button:has-text('Select')` |

## Finding Restaurant IDs

Search OpenTable and extract from URL:
- `restref=1906` → Foreign Cinema
- Restaurant slug in URL path

Example URL format:
```
https://www.opentable.com/r/{restaurant-slug}?restref={id}&datetime={YYYY-MM-DDTHH:MM}&covers={n}
```

## Tips

- OpenTable holds table for 5 minutes - move fast
- Use `fill` action with `value` param (not `type` with `text`)
- Click terms via label text, not checkbox directly
- No credit card needed - reservations are free
- Confirmation email sent automatically

## Resy Alternative

If restaurant uses Resy:
```
https://resy.com/cities/{city}/venues/{restaurant}?date={YYYY-MM-DD}&seats={n}
```

Similar flow but different selectors. Scrape page first to identify form fields.

## After Booking

1. Create calendar event with `gog calendar create`
2. Add attendees and location
3. Include confirmation number in description
