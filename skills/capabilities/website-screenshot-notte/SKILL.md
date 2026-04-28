---
name: website-screenshot-notte
description: Take screenshots of any website using Notte browser automation. Use when asked to screenshot, capture, or snap a webpage.
source: orthogonal
---


# Website Screenshot

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Take screenshots of any website URL and save them as image files.

## Requirements

- Orthogonal CLI: `npm install -g @orth/cli`

## Workflow

Take a screenshot of a URL in 4 steps:

### Step 1: Start a browser session

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/start","body":{"headless":true}}'
```

Save the `session_id` from the response.

### Step 2: Navigate to the URL

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute","body":{"type":"goto","url":"https://example.com"}}'
```

### Step 3: Take the screenshot

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/screenshot","body":{}}'
```

For a full-page screenshot:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/screenshot","body":{"full_page":true}}'
```

### Step 4: Stop the session

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/stop"}'
```

## Full Example

```bash
# 1. Start session
SESSION=$(curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/start","body":{"headless":true}}' | python3 -c "import json,sys;d=json.load(sys.stdin);print(json.dumps(d.get('data',d)))" | python3 -c "import sys,json; print(json.load(sys.stdin)['session_id'])")

# 2. Navigate
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/$SESSION/page/execute","body":{"type":"goto","url":"https://example.com"}}'

# 3. Screenshot
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/$SESSION/page/screenshot","body":{}}'

# 4. Cleanup
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/$SESSION/stop"}'
```

## Options

| Parameter | Description |
|-----------|-------------|
| `full_page` | Set to `true` to capture the entire scrollable page |
| `headless` | Set to `false` to see the browser window (default: true) |
| `viewport_width` | Custom viewport width in pixels |
| `viewport_height` | Custom viewport height in pixels |

## Tips

- Always stop the session when done to free resources
- Sessions auto-expire after 3 minutes of idle time
- Use `-o` flag to save the screenshot to a file (required for binary data)
- The output file must not already exist (use a unique name or delete first)
