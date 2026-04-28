---
name: web-search-jina
description: Jina Search - fast web search returning SERP results
source: orthogonal
---


# Jina Search - Web Search API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Simple, fast web search using Jina's search foundation.

## Capabilities

- **Search**: Use s

## Usage

### Search
Use s.jina.ai to search the web and get SERP

Parameters:
- q (string) - Search query

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"jina-s","path":"/","query":{"q":"latest%20AI%20news"}}'
```

## Use Cases

1. **Quick Research**: Fast search for any topic
2. **Information Gathering**: Get relevant web results
3. **Fact Checking**: Find sources for verification
4. **Technical Lookup**: Search documentation and guides

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"jina-s API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"jina-s API endpoints"}'   # Get endpoint details
```
