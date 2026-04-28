---
name: web-search-andi
description: Fast, high-quality web search with intelligent ranking and instant answers
source: orthogonal
---


# Andi Search - Intelligent Web Search

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Fast, high-quality search with intelligent ranking, instant answers, and research-grade results.

## Capabilities

- **Search**: Fast, high-quality search API with intelligent ranking, instant answers, and result enrichment

## Usage

### Search
Fast, high-quality search API with intelligent ranking, instant answers, and result enrichment.

Parameters:
- q* (string) - Search query (or array of up to 5 queries)
- limit (string) - Number of results (1-100)
- depth (string) - Search depth: fast or deep
- intent (string) - Search intent. Supported Intents: ImageSearchIntent - Prioritize image results, VideoSearchIntent - Prioritize video results, NewsSearchIntent - Prioritize news articles, WeatherSearchIntent - Weather information, ComputationIntent - Mathematical calculations and computations, NavigationalSearchIntent - Direct navigation to websites, Not detected or specified: FallbackSearchIntent - General web search (default)
- metadata (string) - Metadata level: basic or full
- format (string) - Response format: json
- extracts (string) - Enable content extracts/highlights
- safe (string) - Enable safe search filtering
- country (string) - Country code (US, GB, etc.)
- language (string) - Language code (en, es, fr, etc.)
- units (string) - Units: metric or imperial
- noCache  (string) - Force skip all caches
- dateRange (string) - Date range filter. Restrict results to specific time periods using relative or absolute date filters: Relative date range (dateRange parameter): day or 24h - Last 24 hours; week or 7d - Last 7 days; month or 30d - Last 30 days; year or 1y - Last year; 90d - Last 90 days
- includeDomains (string) - Comma-separated domains to include
- excludeDomains (string) - Comma-separated domains to exclude
- includeTerms (string) - Comma-separated terms/phrases to boost
- excludeTerms (string) - Comma-separated terms/phrases to exclude
- parseOperators (string) - Extract operators from query string

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"andi","path":"/v1/search","query":{"q":"how%20does%20RAG%20work"}}'
```

## Use Cases

1. **Research**: Find high-quality sources on any topic
2. **Fact-Finding**: Get accurate answers with sources
3. **Technical Lookup**: Find documentation and guides
4. **News Monitoring**: Track current events
5. **Competitive Intelligence**: Research companies and products

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"andi API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"andi","path":"/v1/search"}'   # Get endpoint details
```
