---
name: web-search-valyu
description: Web search, AI answers, content extraction, and async deep research
source: orthogonal
---


# Valyu - Search, Answer & Deep Research

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Search the web, get AI answers, extract content, and run deep research tasks.

## Capabilities

- **Get Status**: Reference for getting deep research task status via GET /v1/deepresearch/tasks/{id}/status
- **Update Task**: Reference for adding follow-up instructions to a running task via POST /v1/deepresearch/tasks/{id}/update
- **Cancel Task**: Reference for cancelling a running task via POST /v1/deepresearch/tasks/{id}/cancel
- **Delete Task**: Reference for deleting a task via DELETE /v1/deepresearch/tasks/{id}/delete
- **Get Batch Status**: Reference for getting batch status via GET /v1/deepresearch/batches/
- **List Batch Tasks**: Reference for listing tasks in a batch via GET /v1/deepresearch/batches//tasks
- **Cancel Batch**: Reference for cancelling a batch via POST /v1/deepresearch/batches//cancel
- **Search**: Reference for the Valyu Search endpoint to search the web, research, and proprietary datasets via POST /v1/search
- **Answer**: Reference for the Valyu Answer endpoint that blends search results into AI-generated answers via POST /v1/answer
- **Contents**: Reference for the Valyu Contents endpoint that extracts clean, structured content from any URL via POST /v1/contents
- **Create Batch**: Reference for creating a new batch via POST /v1/deepresearch/batches
- **Create Task**: Reference for creating a new deep research task via POST /v1/deepresearch/tasks
- **Add Tasks to Batch**: Reference for adding tasks to a batch via POST /v1/deepresearch/batches//tasks

## Usage

### Get Status
Reference for getting deep research task status via GET /v1/deepresearch/tasks/{id}/status.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/tasks/{id}/status"}'
```

### Update Task
Reference for adding follow-up instructions to a running task via POST /v1/deepresearch/tasks/{id}/update.

Parameters:
- instruction* (string) - Follow-up instruction to add to the running task. Must be submitted before the writing phase begins.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/tasks/{id}/update","body":{"query":"Updated research query"}}'
```

### Cancel Task
Reference for cancelling a running task via POST /v1/deepresearch/tasks/{id}/cancel.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/tasks/{id}/cancel"}'
```

### Delete Task
Reference for deleting a task via DELETE /v1/deepresearch/tasks/{id}/delete.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/tasks/{id}/delete"}'
```

### Get Batch Status
Reference for getting batch status via GET /v1/deepresearch/batches/.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/batches/{id}"}'
```

### List Batch Tasks
Reference for listing tasks in a batch via GET /v1/deepresearch/batches//tasks.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/batches/{id}/tasks"}'
```

### Cancel Batch
Reference for cancelling a batch via POST /v1/deepresearch/batches//cancel.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/batches/{id}/cancel"}'
```

### Search
Reference for the Valyu Search endpoint to search the web, research, and proprietary datasets via POST /v1/search.

Parameters:
- query* (string) - The query string for the search
- max_num_results (integer) - Maximum number of results to return (1-20 for standard API keys, up to 100 with a special API key)
- search_type (enum<string>) - Type of search to perform.'web' searches and returns web content. 'proprietary' uses Valyu's full-text multimodal indicies (arxiv/pubmed/proprietary academic content). 'news' searches and returns only news articles.
- fast_mode (boolean) - Enable fast mode for reduced latency but shorter results. Best for general purpose queries.
- max_price (number<float>) - Maximum price in dollars for a thousand retrievals (CPM). Only applies when provided. If not provided, adjusts automatically based on search type and max number of results.
- relevance_threshold (number<float>) - Minimum relevance score for results (0.0-1.0)
- included_sources (string[]) - List of specific sources to search (URLs, domains or dataset names). When a URL or domain path is provided (e.g., 'https://valyu.ai/blog' or 'valyu.ai/blog'), only that specific path will be searched. For entire domains, use either the domain name (e.g., 'valyu.ai') or the base URL (e.g., 'https://valyu.ai').
- excluded_sources (string[]) - List of specific sources to exclude from search (URLs, domains, or dataset names). When a URL or domain path is provided (e.g., 'https://valyu.ai/blog' or 'valyu.ai/blog'), only that specific path will be excluded. For entire domains, use either the domain name (e.g., 'valyu.ai') or the base URL (e.g., 'https://valyu.ai').
- category (string) - Natural language category/guide phrase to help guide the search to the most relevant content. For example 'agentic use-cases
- response_length (default:short) - Controls the length of content returned per result. Can be an integer for character count or predefined values: 'short' (25k), 'medium' (50k), 'large' (100k), 'max' (full)
- country_code (string) - 2-letter ISO country code to bias search results to a specific country
- is_tool_call (boolean) - Tunes retrieval process based on whether the API is being called by an AI agent as a tool call, or a user query.
- start_date (string<date>) - Start date for time-filtered searches (YYYY-MM-DD)
- end_date (string<date>) - End date for time-filtered searches (YYYY-MM-DD)
- url_only (boolean) - When set to true, only returns URLs for results (no content). Only applies when search_type is 'web' or 'news'.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/search","body":{"query":"AI agent frameworks comparison"}}'
```

### Answer
Reference for the Valyu Answer endpoint that blends search results into AI-generated answers via POST /v1/answer.

Parameters:
- query* (string) - The search query
- system_instructions (string) - Custom instructions for AI processing
- structured_output (object) - JSON schema for structured output. When provided, enables JSON mode and returns structured data
- search_type (string) - Type of search to perform
- fast_mode (boolean) - Enable fast mode for reduced latency but shorter results. Best for general purpose queries.
- data_max_price (number) - Maximum price in dollars for data retrieval (search costs only, does not affect AI costs)
- included_sources (string[]) - List of specific sources to search (URLs, domains or dataset names). When a URL or domain path is provided (e.g., 'https://valyu.ai/blog' or 'valyu.ai/blog'), only that specific path will be searched. For entire domains, use either the domain name (e.g., 'valyu.ai') or the base URL (e.g., 'https://valyu.ai').
- excluded_sources (string[]) - List of specific sources to exclude from search (URLs, domains, or dataset names). When a URL or domain path is provided (e.g., 'https://valyu.ai/blog' or 'valyu.ai/blog'), only that specific path will be excluded. For entire domains, use either the domain name (e.g., 'valyu.ai') or the base URL (e.g., 'https://valyu.ai').
- start_date (string) - Start date filter (YYYY-MM-DD)
- end_date (string) - End date filter (YYYY-MM-DD)
- country_code (string) - 2-letter ISO country code to bias search results to a specific country
- streaming (boolean) - Enable Server-Sent Events (SSE) streaming. When true, returns a stream of chunks: search_results first, then content deltas, then metadata, then [DONE].

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/answer","body":{"query":"What are the best practices for building AI agents?"}}'
```

### Contents
Reference for the Valyu Contents endpoint that extracts clean, structured content from any URL via POST /v1/contents.

Parameters:
- urls* (string[]) - List of URLs to process (maximum 10 URLs per request)
- response_length (default:short) - Content length configuration: "short": 25,000 characters (good for summaries) "medium": 50,000 characters (good for articles) "large": 100,000 characters (good for academic papers) "max": No character limit Custom integer: Specific character limit
- max_price_dollars (number) - Maximum cost limit in dollars for the entire request. If not specified, defaults to 2x the estimated cost.
- extract_effort (string) - Processing effort level: "normal": Fastest extraction speed (Fastest) "high": Enhanced extraction with better content quality and reliability (Slower) "auto": Automatically chooses the right effort level (Slowest)
- screenshot (boolean) - Request page screenshots. When true, each result will include a screenshot_url field containing a pre-signed URL to a screenshot image of the page. Screenshots are captured during page rendering.
- summary (boolean) - Toggle AI processing (false is default)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/contents","body":{"urls":["https://example.com/article"]}}'
```

### Create Batch
Reference for creating a new batch via POST /v1/deepresearch/batches.

Parameters:
- name (string) - Optional name for the batch
- mode (enum<string>) - DeepResearch mode for all tasks in this batch
- output_formats ((string | object)[]) - Default output formats for all tasks (markdown, pdf, toon, or structured JSON schema). Cannot mix JSON schema with markdown/pdf. toon requires a JSON schema.
- search (object) - Search configuration applied to all tasks in the batch (cannot be overridden per task)
- webhook_url (string<uri>) - HTTPS URL to receive notifications when the batch completes
- metadata (object) - Custom metadata for tracking and organization

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/batches","body":{"name":"Competitor Research"}}'
```

### Create Task
Reference for creating a new deep research task via POST /v1/deepresearch/tasks.

Parameters:
- query* (string) - Research query or task description
- mode (string) - DeepResearch mode: fast: Ideal for quicker answers and lightweight research. Typically completes in ~2–5 minutes. standard: A balanced option for deeper insights without long wait times. Runs for ~10–20 minutes. heavy: Designed for in-depth, long-running research tasks. Can run for up to ~90 minutes.
- model (string) - DeepResearch mode (deprecated, use 'mode' instead)
- output_formats (string) - Output formats. Use ['markdown'], ['markdown', 'pdf'], or a JSON schema object for structured output. Cannot mix JSON schema with markdown/pdf.
- strategy (string) - Natural language strategy instructions prepended to the system prompt
- search (object) - Search configuration parameters
- urls (string[]) - URLs to extract content from (max 10)
- files (object[]) - File attachments (PDFs, images, documents). Max 10 files.
- mcp_servers (object[]) - MCP server configurations for custom tools (max 5 servers)
- code_execution (boolean) - Enable/disable code execution during research
- previous_reports (string[]) - Previous deep research IDs to use as context (max 3)
- webhook_url (string) - HTTPS URL for webhook notifications. When provided, Valyu will POST the full task result to this URL when the task completes or fails. The request includes X-Webhook-Signature and X-Webhook-Timestamp headers for verification. HTTP URLs are rejected—only HTTPS is supported.
- metadata (object) - Custom metadata for tracking
- deliverables (object[]) - Additional file outputs to generate from the research (CSV, Excel, PowerPoint, Word, PDF). Max 10 deliverables.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/tasks","body":{"query":"Comprehensive analysis of vector databases market"}}'
```

### Add Tasks to Batch
Reference for adding tasks to a batch via POST /v1/deepresearch/batches//tasks.

Parameters:
- tasks* (object[]) - Array of tasks to add to the batch (1-100 tasks per request)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/batches/{id}/tasks"}'
```

## Use Cases

1. **Research Automation**: Comprehensive research on any topic
2. **Content Intelligence**: Extract and analyze web content
3. **Market Analysis**: Research markets and competitors
4. **Due Diligence**: Gather information for decisions
5. **Knowledge Base Building**: Collect structured information

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"valyu API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch"}'   # Get endpoint details
```
