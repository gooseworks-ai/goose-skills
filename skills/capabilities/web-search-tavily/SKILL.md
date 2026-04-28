---
name: web-search-tavily
description: AI-powered web search, crawling, extraction, and deep research
source: orthogonal
---


# Tavily - AI Search & Research API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Comprehensive web search, crawling, content extraction, and deep research.

## Capabilities

- **Tavily Search**: Execute a search query using Tavily Search
- **Get Research Task Status**: Retrieve the status and results of a research task using its request ID (free)
- **Create Research Task**: Tavily Research performs comprehensive research on a given topic by conducting multiple searches, analyzing sources, and generating a detailed research report
- **Tavily Extract**: Extract web page content from one or more specified URLs using Tavily Extract
- **Tavily Map**: Tavily Map traverses websites like a graph and can explore hundreds of paths in parallel with intelligent discovery to generate comprehensive site maps
- **Tavily Crawl**: Tavily Crawl is a graph-based website traversal tool that can explore hundreds of paths in parallel with built-in extraction and intelligent discovery

## Usage

### Tavily Search
Execute a search query using Tavily Search.

Parameters:
- query* (string) - The search query to execute with Tavily.
- search_depth (enum<string>) - Controls the latency vs. relevance tradeoff and how results[].content is generated: advanced: Highest relevance with increased latency. Best for detailed, high-precision queries. Returns multiple semantically relevant snippets per URL (configurable via chunks_per_source). basic: A balanced option for relevance and latency. Ideal for general-purpose searches. Returns one NLP summary per URL. fast: Prioritizes lower latency while maintaining good relevance. Returns multiple semantically relevant snippets per URL (configurable via chunks_per_source). ultra-fast: Minimizes latency above all else. Best for time-critical use cases. Returns one NLP summary per URL. Cost: basic, fast, ultra-fast: 1 API Credit advanced: 2 API Credits See Search Best Practices for guidance on choosing the right search depth.
- chunks_per_source (integer) - Chunks are short content snippets (maximum 500 characters each) pulled directly from the source. Use chunks_per_source to define the maximum number of relevant chunks returned per source and to control the content length. Chunks will appear in the content field as: <chunk 1> [...] <chunk 2> [...] <chunk 3>. Available only when search_depth is advanced.
- max_results (integer) - The maximum number of search results to return.
- topic (enum<string>) - The category of the search.news is useful for retrieving real-time updates, particularly about politics, sports, and major current events covered by mainstream media sources. general is for broader, more general-purpose searches that may include a wide range of sources.
- time_range (enum<string>) - The time range back from the current date to filter results based on publish date or last updated date. Useful when looking for sources that have published or updated data.
- start_date (string) - Will return all results after the specified start date based on publish date or last updated date. Required to be written in the format YYYY-MM-DD
- end_date (string) - Will return all results before the specified end date based on publish date or last updated date. Required to be written in the format YYYY-MM-DD
- include_answer (boolean) - Include an LLM-generated answer to the provided query. basic or true returns a quick answer. advanced returns a more detailed answer.
- include_raw_content (boolean) - Include the cleaned and parsed HTML content of each search result. markdown or true returns search result content in markdown format. text returns the plain text from the results and may increase latency.
- include_images (boolean) - Also perform an image search and include the results in the response.
- include_image_descriptions (boolean) - When include_images is true, also add a descriptive text for each image.
- include_favicon (boolean) - Whether to include the favicon URL for each result.
- include_domains (string[]) - A list of domains to specifically include in the search results. Maximum 300 domains.
- exclude_domains (string[]) - A list of domains to specifically exclude from the search results. Maximum 150 domains.
- country (enum<string>) - Boost search results from a specific country. This will prioritize content from the selected country in the search results. Available only if topic is general.
- auto_parameters (boolean) - When auto_parameters is enabled, Tavily automatically configures search parameters based on your query's content and intent. You can still set other parameters manually, and your explicit values will override the automatic ones. The parameters include_answer, include_raw_content, and max_results must always be set manually, as they directly affect response size. Note: search_depth may be automatically set to advanced when it's likely to improve results. This uses 2 API credits per request. To avoid the extra cost, you can explicitly set search_depth to basic.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/search"}'
  "query": "latest developments in AI agents",
  "search_depth": "advanced",
  "include_answer": true
}'
```

### Get Research Task Status (free)
Retrieve the status and results of a research task using its request ID.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/research/{request_id}"}'
```

### Create Research Task
Tavily Research performs comprehensive research on a given topic by conducting multiple searches, analyzing sources, and generating a detailed research report.

Parameters:
- input* (string) - The research task or question to investigate.
- model (enum<string>) - The model used by the research agent. "mini" is optimized for targeted, efficient research and works best for narrow or well-scoped questions. "pro" provides comprehensive, multi-angle research and is suited for complex topics that span multiple subtopics or domains
- stream (boolean) - Whether to stream the research results as they are generated. When 'true', returns a Server-Sent Events (SSE) stream. See Streaming documentation for details.
- output_schema (object) - A JSON Schema object that defines the structure of the research output. When provided, the research response will be structured to match this schema, ensuring a predictable and validated output shape. Must include a 'properties' field, and may optionally include 'required' field.
- citation_format (enum<string>) - The format for citations in the research report.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/research","body":{"input":"Compare different AI agent frameworks for production use"}}'
```

### Tavily Extract
Extract web page content from one or more specified URLs using Tavily Extract.

Parameters:
- urls* (string[]) - The URL to extract content from.
- query (string) - User intent for reranking extracted content chunks. When provided, chunks are reranked based on relevance to this query.
- chunks_per_source (integer) - Chunks are short content snippets (maximum 500 characters each) pulled directly from the source. Use chunks_per_source to define the maximum number of relevant chunks returned per source and to control the raw_content length. Chunks will appear in the raw_content field as: <chunk 1> [...] <chunk 2> [...] <chunk 3>. Available only when query is provided. Must be between 1 and 5.
- extract_depth (enum<string>) - The depth of the extraction process. advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency.basic extraction costs 1 credit per 5 successful URL extractions, while advanced extraction costs 2 credits per 5 successful URL extractions.
- include_images (boolean) - Include a list of images extracted from the URLs in the response. Default is false.
- include_favicon (boolean) - Whether to include the favicon URL for each result.
- format (enum<string>) - The format of the extracted web page content. markdown returns content in markdown format. text returns plain text and may increase latency.
- timeout (number) - Maximum time in seconds to wait for the URL extraction before timing out. Must be between 1.0 and 60.0 seconds. If not specified, default timeouts are applied based on extract_depth: 10 seconds for basic extraction and 30 seconds for advanced extraction.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/extract","body":{"urls":["https://example.com/article1","https://example.com/article2"]}}'
```

### Tavily Map
Tavily Map traverses websites like a graph and can explore hundreds of paths in parallel with intelligent discovery to generate comprehensive site maps.

Parameters:
- url* (string) - The root URL to begin the mapping.
- instructions (string) - Natural language instructions for the crawler. When specified, the cost increases to 2 API credits per 10 successful pages instead of 1 API credit per 10 pages.
- max_depth (integer) - Max depth of the mapping. Defines how far from the base URL the crawler can explore.
- max_breadth (integer) - Max number of links to follow per level of the tree (i.e., per page).
- limit (integer) - Total number of links the crawler will process before stopping.
- select_paths (string[]) - Regex patterns to select only URLs with specific path patterns (e.g., /docs/.*, /api/v1.*).
- select_domains (string[]) - Regex patterns to select crawling to specific domains or subdomains (e.g., ^docs\.example\.com$).
- exclude_paths (string[]) - Regex patterns to exclude URLs with specific path patterns (e.g., /private/.*, /admin/.*).
- exclude_domains (string[]) - Regex patterns to exclude specific domains or subdomains from crawling (e.g., ^private\.example\.com$).
- allow_external (boolean) - Whether to include external domain links in the final results list.
- timeout (number<float>) - Maximum time in seconds to wait for the map operation before timing out. Must be between 10 and 150 seconds.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/map","body":{"url":"https://example.com"}}'
```

### Tavily Crawl
Tavily Crawl is a graph-based website traversal tool that can explore hundreds of paths in parallel with built-in extraction and intelligent discovery.

Parameters:
- url* (string) - The root URL to begin the crawl.
- instructions (string) - Natural language instructions for the crawler. When specified, the mapping cost increases to 2 API credits per 10 successful pages instead of 1 API credit per 10 pages.
- chunks_per_source (integer) - Chunks are short content snippets (maximum 500 characters each) pulled directly from the source. Use chunks_per_source to define the maximum number of relevant chunks returned per source and to control the raw_content length. Chunks will appear in the raw_content field as: <chunk 1> [...] <chunk 2> [...] <chunk 3>. Available only when instructions are provided. Must be between 1 and 5.
- max_depth (integer) - Max depth of the crawl. Defines how far from the base URL the crawler can explore.
- max_breadth (integer) - Max number of links to follow per level of the tree (i.e., per page).
- limit (integer) - Total number of links the crawler will process before stopping.
- select_paths (string[]) - Regex patterns to select only URLs with specific path patterns (e.g., /docs/.*, /api/v1.*).
- select_domains (string[]) - Regex patterns to select crawling to specific domains or subdomains (e.g., ^docs\.example\.com$).
- exclude_paths (string[]) - Regex patterns to exclude URLs with specific path patterns (e.g., /private/.*, /admin/.*).
- exclude_domains (string[]) - Regex patterns to exclude specific domains or subdomains from crawling (e.g., ^private\.example\.com$).
- allow_external (boolean) - Whether to include external domain links in the final results list.
- include_images (boolean) - Whether to include images in the crawl results.
- extract_depth (enum<string>) - Advanced extraction retrieves more data, including tables and embedded content, with higher success but may increase latency. basic extraction costs 1 credit per 5 successful extractions, while advanced extraction costs 2 credits per 5 successful extractions.
- format (enum<string>) - The format of the extracted web page content. markdown returns content in markdown format. text returns plain text and may increase latency.
- include_favicon (boolean) - Whether to include the favicon URL for each result.
- timeout (number<float>) - Maximum time in seconds to wait for the crawl operation before timing out. Must be between 10 and 150 seconds.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/crawl"}'
  "url": "https://docs.example.com",
  "max_depth": 3
}'
```

## Use Cases

1. **Research**: Comprehensive research on any topic
2. **Content Aggregation**: Extract and process web content
3. **Market Intelligence**: Track industry trends
4. **Documentation**: Crawl and index documentation sites
5. **Fact-Finding**: Get accurate, sourced answers

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"tavily API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/search"}'   # Get endpoint details
```
