---
name: uptime-monitor
description: Monitor website uptime - check availability, response times, and status
source: orthogonal
---


# Uptime Monitor - Website Availability Monitoring

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Monitor website uptime, check response times, and verify service availability.

## Workflow

### Step 1: Check Website Status
Verify site is accessible:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":{"url":"https://yoursite.com"}}'
```

### Step 2: Verify Page Content
Ensure page loads correctly:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://yoursite.com",
  "user_prompt": "Check if page loads and contains expected content. Report any error messages."
}'
```

### Step 3: Test API Health
Check API endpoints:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":{"url":"https://api.yoursite.com/health"}}'
```

### Step 4: Check Multiple Endpoints
Monitor critical paths:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/batches"}'
  "urls": [
    "https://yoursite.com",
    "https://yoursite.com/login",
    "https://api.yoursite.com/health",
    "https://yoursite.com/dashboard"
  ]
}'
```

### Step 5: Research Status Page
Check official status:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://status.yoursite.com",
  "user_prompt": "Extract current service status, any incidents, and affected components"
}'
```

### Step 6: Send Alert (if down)
Use SMS for critical alerts:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"textbelt","path":"/text"}'
  "phone": "+1234567890",
  "message": "ALERT: yoursite.com is down! Check immediately."
}'
```

## Monitoring Script

```bash
SITES=("https://example.com" "https://api.example.com/health")

for site in "${SITES[@]}"; do
  echo "Checking: $site"
  curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":"{\\"}'
done
```

## Example Usage

```bash
# Quick status check
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":{"url":"https://stripe.com"}}'

# Check status page
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapegraph","path":"/v1/smartscraper"}'
  "website_url": "https://status.github.com",
  "user_prompt": "What is the current status of GitHub services?"
}'

# Monitor competitor uptime
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":{"url":"https://competitor.com"}}'
```

## What to Monitor

1. **Homepage**: Main website accessible
2. **API Health**: Health check endpoints
3. **Login/Auth**: Authentication working
4. **Critical Features**: Core functionality
5. **Status Page**: Official service status

## Discover More

List all endpoints, or add a path for parameter details:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"linkup API endpoints"}' api show olostep
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"scrapegraph API endpoints"}' api show textbelt 
```

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes`"}' for endpoint parameters.
