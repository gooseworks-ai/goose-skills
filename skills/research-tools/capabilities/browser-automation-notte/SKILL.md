---
name: browser-automation-notte
description: Browser automation - control browser sessions, scrape pages, and run AI agents
source: orthogonal
---


# Notte - Browser Automation API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Control browser sessions, scrape web pages, and run autonomous AI agents.

## Capabilities

- **Take Screenshot**: Take a screenshot of the current page
- **Get Session**: Get session status and details (free)
- **Stop Session**: Stop and clean up a browser session (free)
- **Get Session Cookies**: Get all cookies from the browser session (free)
- **Get Network Logs**: Get network request/response logs from the session (free)
- **Get Agent Status**: Get agent execution status and results (free)
- **Observe Page**: Observe the current page state and get available actions
- **Stop Agent**: Stop a running agent (free)
- **Scrape Webpage**: Scrape content from a URL without managing sessions
- **Execute Page Action**: Execute an action on the page (click, type, navigate, etc
- **Set Session Cookies**: Set cookies in the browser session
- **Start Session**: Start a new browser session
- **Scrape from HTML**: Extract structured content from raw HTML without using a browser
- **Start Agent**: Start an AI agent to autonomously complete a browser task
- **Scrape Page**: Scrape content from the current page in the session

## Usage

### Take Screenshot
Take a screenshot of the current page.

Parameters:
- full_page (boolean) - Capture full page
- session_id* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/screenshot","body":{}}'
```

### Get Session (free)
Get session status and details.

Parameters:
- session_id* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}"}'
```

### Stop Session (free)
Stop and clean up a browser session.

Parameters:
- session_id* (string) - Session ID

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/stop"}'
```

### Get Session Cookies (free)
Get all cookies from the browser session.

Parameters:
- session_id* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/cookies"}'
```

### Get Network Logs (free)
Get network request/response logs from the session.

Parameters:
- session_id* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/network/logs","query":{"session_id":"example"}}'
```

### Get Agent Status (free)
Get agent execution status and results.

Parameters:
- agent_id* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/agents/{agent_id}"}'
```

### Observe Page
Observe the current page state and get available actions.

Parameters:
- max_nb_actions (number) - Maximum actions to return (default: 100)
- min_nb_actions (number) - Minimum actions to return
- instruction (string) - Optional instruction to filter actions
- session_id* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/observe","body":{"instruction":"Find the search box"}}'
```

### Stop Agent (free)
Stop a running agent.

Parameters:
- session_id* (string) - Session ID the agent is running on

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/agents/{agent_id}/stop"}'
```

### Scrape Webpage
Scrape content from a URL without managing sessions.

Parameters:
- url* (string) - URL to scrape
- schema (object) - Structured extraction schema

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/scrape","body":{"url":"https://example.com"}}'
```

### Execute Page Action
Execute an action on the page (click, type, navigate, etc.).

Parameters:
- type* (string) - Action type: goto, click, type, scroll, select, hover, wait, screenshot
- url (string) - URL for goto action
- ref (string) - Element reference for click/type/select actions
- text (string) - Text for type action
- value (string) - Value for select action
- direction (string) - Scroll direction: up/down
- amount (number) - Scroll amount in pixels
- timeout (number) - Wait timeout in ms
- session_id* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/execute","body":{"instruction":"Click the search button"}}'
```

### Set Session Cookies
Set cookies in the browser session.

Parameters:
- cookies* (array) - Array of cookie objects
- session_id* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/cookies"}'
```

### Start Session
Start a new browser session. Configure browser type, proxies, viewport, and session timeout.

Parameters:
- headless (boolean) - Run in headless mode (default: true)
- browser_type (string) - Browser type: chromium, chrome, firefox
- proxies (boolean) - Enable proxy rotation
- solve_captchas (boolean) - Auto-solve CAPTCHAs
- idle_timeout_minutes (integer) - Idle timeout (default: 3)
- max_duration_minutes (integer) - Max duration (default: 15)
- viewport_width (integer)
- viewport_height (integer)
- user_agent (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/start"}'
  "url": "https://example.com",
  "timeout_minutes": 5
}'
```

### Scrape from HTML
Extract structured content from raw HTML without using a browser

Parameters:
- frames* (array) - Array of HTML frames to parse

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/scrape_from_html","body":{"html":"<html><body>Hello</body></html>"}}'
```

### Start Agent
Start an AI agent to autonomously complete a browser task.

Parameters:
- task* (string) - Task for the AI agent to perform
- session_id* (string) - Session ID to run the agent on
- url (string) - Starting URL
- max_steps (number) - Max steps (1-50, default: 20)
- use_vision (boolean) - Use vision model (default: true)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/agents/start"}'
  "task": "Search for AI news on Google and summarize the top results",
  "url": "https://google.com"
}'
```

### Scrape Page
Scrape content from the current page in the session.

Parameters:
- selector (string) - Playwright selector to scope the scrape
- scrape_links (boolean) - Scrape links (default: true)
- scrape_images (boolean) - Scrape images (default: false)
- only_main_content (boolean) - Only main content, exclude nav/footer (default: true)
- response_format (object) - Pydantic model or JSON Schema for structured extraction
- instructions (string) - Additional extraction instructions
- session_id* (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions/{session_id}/page/scrape","body":{}}'
```

## Use Cases

1. **Web Scraping**: Extract structured data from any webpage
2. **Browser Automation**: Automate complex browser workflows
3. **Testing**: Run automated browser tests
4. **AI Agents**: Deploy autonomous agents for web tasks
5. **Monitoring**: Track website changes and content

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"notte API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"notte","path":"/sessions"}'   # Get endpoint details
```
