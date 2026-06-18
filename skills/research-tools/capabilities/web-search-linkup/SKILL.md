---
name: web-search-linkup
description: Web search and content fetching - search the web or extract content from URLs
source: orthogonal
---


# Linkup - Web Search & Fetch API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Search the web and fetch content from any URL.

## Capabilities

- **Search**: The /search endpoint allows you to retrieve web content
- **Fetch**: The /fetch endpoint allows you to fetch a single webpage from a given URL

## Usage

### Search
The /search endpoint allows you to retrieve web content.

Parameters:
- q* (string) - The natural language question for which you want to retrieve context.
- depth* (string) - Defines the precision of the search. standard returns results faster; deep takes longer but yields more comprehensive results.
- outputType* (string) - The type of output you want to get. Use structured for a custom-formatted response defined by structuredOutputSchema.
- structuredOutputSchema (object) - Required only when outputType is structured. Provide a JSON schema (as a string) representing the desired response format. The root must be of type object.
- includeSources (boolean) - Relevant only when outputType is structured. Defines whether the response should include sources. Please note that it modifies the schema of the response, see below
- includeImages (boolean) - Defines whether the API should include images in its results.
- fromDate (string) - The date from which the search results should be considered, in ISO 8601 format (YYYY-MM-DD). It must be before toDate, if provided, and later than 1970-01-01.
- toDate (string) - The date until which the search results should be considered, in ISO 8601 format (YYYY-MM-DD). It must be later than fromDate, if provided, or than 1970-01-01.
- includeDomains (string[]) - The domains you want to search on. By default, don't restrict the search. You can provide up to 100 domains.
- excludeDomains (string[]) - The domains you want to exclude of the search. By default, don't restrict the search.
- includeInlineCitations (boolean) - Relevant only when outputType is sourcedAnswer. Defines whether the answer should include inline citations.
- maxResults (number) - The maximum number of results to return.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/search"}'
  "q": "latest AI developments 2024",
  "depth": "standard",
  "outputType": "sourcedAnswer"
}'
```

### Fetch
The /fetch endpoint allows you to fetch a single webpage from a given URL.

Parameters:
- url* (string) - The URL of the webpage you want to fetch.
- renderJs (boolean) - Defines whether the API should render the JavaScript of the webpage.
- includeRawHtml (boolean) - Defines whether the API should include the raw HTML of the webpage in its response.
- extractImages (boolean) - Defines whether the API should extract the images from the webpage in its response.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/fetch","body":{"url":"https://example.com/article"}}'
```

## Use Cases

1. **Research**: Search for information on any topic
2. **Content Aggregation**: Fetch and process web content
3. **Fact Checking**: Verify information from multiple sources
4. **News Monitoring**: Track news on specific topics

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"linkup API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/search"}'   # Get endpoint details
```
