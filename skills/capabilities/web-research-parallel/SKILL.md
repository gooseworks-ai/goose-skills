---
name: web-research-parallel
description: Web research API with OpenAI-compatible chat completions and async tasks
source: orthogonal
---


# Parallel - Web Research API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Web research API that returns OpenAI ChatCompletions-compatible responses.

## Capabilities

- **Retrieve FindAll Run Status**: Retrieve a FindAll run (free)
- **FindAll Run Result**: Retrieve the FindAll run result at the time of the request (free)
- **Cancel FindAll Run**: Cancel a FindAll run (free)
- **Retrieve Task Run Input**: Retrieves the input of a run by run_id (free)
- **Retrieve Task Run**: Retrieves run status by run_id (free)
- **Ingest FindAll Run**: Transforms a natural language search objective into a structured FindAll spec
- **Retrieve Task Run Result**: Retrieves a run result by run_id, blocking until the run is completed (free)
- **Create FindAll Run**: Starts a FindAll run
- **Search**: Searches the web
- **Chat API**: Parallel Chat is a web research API that returns OpenAI ChatCompletions compatible streaming text and JSON
- **Extract**: Extracts relevant content from specific web URLs
- **Create Task Run**: Initiates a task run

## Usage

### Retrieve FindAll Run Status (free)
Retrieve a FindAll run.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1beta/findall/runs/{findall_id}"}'
```

### FindAll Run Result (free)
Retrieve the FindAll run result at the time of the request.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1beta/findall/runs/{findall_id}/result"}'
```

### Cancel FindAll Run (free)
Cancel a FindAll run.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1beta/findall/runs/{findall_id}/cancel"}'
```

### Retrieve Task Run Input (free)
Retrieves the input of a run by run_id.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1/tasks/runs/{run_id}/input"}'
```

### Retrieve Task Run (free)
Retrieves run status by run_id.The run result is available from the /result endpoint.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1/tasks/runs/{run_id}"}'
```

### Ingest FindAll Run
Transforms a natural language search objective into a structured FindAll spec.Note: Access to this endpoint requires the parallel-beta header.The generated specification serves as a suggested starting point and can be furthercustomized by the user.

Parameters:
- objective* (string) - Input model for FindAll ingest.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1beta/findall/ingest","body":{"objective":"Find all AI startups in San Francisco"}}'
```

### Retrieve Task Run Result (free)
Retrieves a run result by run_id, blocking until the run is completed.

Parameters:
- timeout (integer)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1/tasks/runs/{run_id}/result"}'
```

### Create FindAll Run
Starts a FindAll run.This endpoint immediately returns a FindAll run object with status set to ‘queued’.You can get the run result snapshot using the GET /v1beta/findall/runs//result endpoint.You can track the progress of the run by:Polling the status using the GET /v1beta/findall/runs/ endpoint,Subscribing to real-time updates via the /v1beta/findall/runs//eventsendpoint,Or specifying a webhook with relevant event types during run creation to receivenotifications.

Parameters:
- objective* (string) - Input model for FindAll run.
- entity_type* (string) - Type of the entity for the FindAll run.
- match_conditions* (MatchCondition · object[]) - List of match conditions for the FindAll run.
- generator* (enum<string>) - Generator for the FindAll run. One of base, core, pro, preview.
- match_limit* (integer) - Maximum number of matches to find for this FindAll run. Must be between 5 and 1000 (inclusive).
- exclude_list (ExcludeCandidate · object[] | null) - List of entity names/IDs to exclude from results.
- metadata (Metadata · object) - Metadata for the FindAll run.
- webhook (Webhook · object) - Webhook for the FindAll run.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1beta/findall/runs"}'
  "goal": "Find all AI startups in San Francisco"
}'
```

### Search
Searches the web.To access this endpoint, pass the parallel-beta header with the valuesearch-extract-2025-10-10.

Parameters:
- mode (enum<string> | null) - Request to Search API.
- objective (string | null) - Natural-language description of what the web search is trying to find. May include guidance about preferred sources or freshness. At least one of objective or search_queries must be provided.
- search_queries (string[] | null) - Optional list of traditional keyword search queries to guide the search. May contain search operators. At least one of objective or search_queries must be provided.
- processor (enum<string> | null) - DEPRECATED: use mode instead.
- max_results (integer | null) - Upper bound on the number of results to return. May be limited by the processor. Defaults to 10 if not provided.
- max_chars_per_result (integer | null) - DEPRECATED: Use excerpts.max_chars_per_result instead.
- excerpts (object) - Optional settings to configure excerpt generation.
- source_policy (object) - Optional source policy governing domain and date preferences in search results.
- fetch_policy (object) - Fetch policy: determines when to return cached content from the index (faster) vs fetching live content (fresher). Default is to disable live fetch and return cached content from the index.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1beta/search","body":{"objective":"AI agent frameworks comparison 2024"}}'
```

### Chat API
Parallel Chat is a web research API that returns OpenAI ChatCompletions compatible streaming text and JSON.

Parameters:
- model (string)
- messages (array)
- stream (boolean)
- response_format (object)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/chat/completions"}'
  "model": "parallel",
  "messages": [
    {"role": "user", "content": "What are the latest developments in quantum computing?"}
  ]
}'
```

### Extract
Extracts relevant content from specific web URLs.To access this endpoint, pass the parallel-beta header with the valuesearch-extract-2025-10-10.

Parameters:
- urls* (string[]) - Extract request.
- objective (string) - If provided, focuses extracted content on the specified search objective.
- search_queries (string[]) - If provided, focuses extracted content on the specified keyword search queries.
- fetch_policy (object) - Fetch policy: determines when to return cached content from the index (faster) vs fetching live content (fresher). Default is to use a dynamic policy based on the search objective and url.
- excerpts (boolean) - Include excerpts from each URL relevant to the search objective and queries. Note that if neither objective nor search_queries is provided, excerpts are redundant with full content. default:true
- full_content (boolean) - Include full content from each URL. Note that if neither objective nor search_queries is provided, excerpts are redundant with full content. default:false

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1beta/extract","body":{"urls":["https://example.com/article"]}}'
```

### Create Task Run
Initiates a task run.Returns immediately with a run object in status ‘queued’.Beta features can be enabled by setting the ‘parallel-beta’ header.

Parameters:
- processor* (string) - Task run input with additional beta fields.
- input* (string) - Input to the task, either text or a JSON object.
- metadata (object) - User-provided metadata stored with the run. Keys and values must be strings with a maximum length of 16 and 512 characters respectively.
- source_policy (object) - Optional source policy governing preferred and disallowed domains in web search results.
- task_spec (object) - Task specification. If unspecified, defaults to auto output schema.
- mcp_servers (object[]) - Optional list of MCP servers to use for the run.To enable this feature in your requests, specify mcp-server-2025-07-17 as one of the values in parallel-beta header (for API calls) or betas param (for the SDKs).
- enable_events (boolean) - Controls tracking of task run execution progress. When set to true, progress events are recorded and can be accessed via the Task Run events endpoint. When false, no progress events are tracked. Note that progress tracking cannot be enabled after a run has been created. The flag is set to true by default for premium processors (pro and above).To enable this feature in your requests, specify events-sse-2025-07-24 as one of the values in parallel-beta header (for API calls) or betas param (for the SDKs).
- webhook (object) - Callback URL (webhook endpoint) that will receive an HTTP POST when the run completes.This feature is not available via the Python SDK. To enable this feature in your API requests, specify the parallel-beta header with webhook-2025-08-12 value.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1/tasks/runs"}'
  "processor": "base",
  "input": "Research the competitive landscape of AI coding assistants"
}'
```

## Use Cases

1. **Research Automation**: Get comprehensive research on any topic
2. **OpenAI Drop-in**: Use with existing OpenAI SDK code
3. **Competitive Analysis**: Research competitors and market
4. **Due Diligence**: Gather information for investment decisions

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"parallel API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"parallel","path":"/v1beta/findall"}'   # Get endpoint details
```
