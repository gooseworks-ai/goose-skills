---
name: web-scraping-olostep
description: Web scraping, crawling, and AI-powered answer extraction at scale
source: orthogonal
---


# Olostep - Web Scraping & Crawling API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Powerful web scraping, crawling, and AI-powered content extraction.

## Capabilities

- **Create Scrape**: Initiate a web page scrape
- **Create Answer**: The AI will perform actions like searching and browsing web pages to find the answer to the provided task
- **Maps**: This endpoint allows users to get all the urls on a certain website
- **Start Crawl**: Starts a new crawl
- **Start Batch**: Starts a new batch
- **Batch Items**: Retrieves the list of items processed for a batch
- **Crawl Info**: Fetches information about a specific crawl
- **Crawl Pages**: Fetches the list of pages for a specific crawl
- **Get Answer**: This endpoint retrieves a previously completed answer by its ID
- **Get Scrape**: Can be used to retrieve response for a scrape
- **Batch Info**: Retrieves the status and progress information about a batch
- **Retrieve Content**: Retrieve page content of processed batches and crawls urls

## Usage

### Create Scrape
Initiate a web page scrape

Parameters:
- url_to_scrape* (string) - The URL to start scraping from.
- wait_before_scraping (integer) - Time to wait in milliseconds before starting the scraping.
- formats (string[]) - Formats in which you want the content.
- remove_css_selectors (string) - Option to remove certain CSS selectors from the content. Optionally, you can also pass a JSON stringified array of specific selectors you want to remove. The CSS selectors removed when this option is set to default are ['nav','footer','script','style','noscript','svg',[role=alert],[role=banner],[role=dialog],[role=alertdialog],[role=region][aria-label*=skip i],[aria-modal=true]] Available options: `default`, `none`, `array`
- actions (object[]) - Actions to perform on the page before getting the content.
- country (string) - Residential country to load the request from. Supported values are: * US (United States) * CA (Canada) * IT (Italy) * IN (India) * GB (England) * JP (Japan) * MX (Mexico) * AU (Australia) * ID (Indonesia) * UA (UAE) * RU (Russia) * RANDOM Some operations, like scraping Google Search and Google News, support all countries.
- transformer (string) - Specify the HTML transformer to use, if any. Postlight's Mercury Parser library is used to remove ads and other unwanted content from the scraped content. Available options: `postlight`, `none`
- remove_images (boolean) - Option to remove images from the scraped content. Defaults to false.
- remove_class_names (string[]) - List of class names to remove from the content.
- parser (object) - When defining json as a format, you can use this parameter to specify the parser to use. Parsers are useful to extract structured content from web pages. Olostep has a few parsers built in for most common web pages, and you can also create your own parsers.
- llm_extract (object)
- links_on_page (object) - With this option, you can get all the links present on the page you scrape.
- screen_size (object) - Configuration for screen size. Preset dimensions are available through screen_type: desktop (1920x1080), mobile (414x896), or default (768x1024).
- metadata (object) - User-defined metadata. Not supported yet

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes","body":{"url_to_scrape":"https://example.com/page"}}'
```

### Create Answer
The AI will perform actions like searching and browsing web pages to find the answer to the provided task. Execution time is 3-30s depending upon complexity. For longer tasks, use the agent endpoint instead.

Parameters:
- task* (string) - The task to be performed.
- json_format (object) - The desired output JSON object with empty values as a schema, or simply describe the data you want as a string.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/answers","body":{"task":"What are the latest AI developments?"}}'
```

### Maps
This endpoint allows users to get all the urls on a certain website. It can take up to 120 seconds for complex websites. For large websites, results are paginated using cursor-based pagination

Parameters:
- url* (string) - The URL of the website for which you want the links
- search_query (string) - An optional search query to sort the links by search relevance.
- top_n (number) - An optional number to limit to only top n links for a search query.
- include_subdomain (boolean) - Include subdomains of the given URL. `true` by default.
- include_urls (string[]) - URL path patterns to include using glob syntax. For example: `/blog/**` to only include blog URLs. Only URLs matching these patterns will be returned.
- exclude_urls (string[]) - URL path patterns to exclude using glob syntax. For example: `/careers/**`. Excluded URLs will supersede included URLs.
- cursor (string) - OPTIONAL: Pagination cursor from a previous response. When provided, returns the next set of URLs from where the previous request left off due to response size limit.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/maps","body":{"url":"https://example.com"}}'
```

### Start Crawl
Starts a new crawl. You receive a `id` to track the progress. The operation may take 1-10 mins depending upon the site and depth and pages parameters.

Parameters:
- start_url* (string) - The starting point of the crawl.
- max_pages* (number) - Maximum number of pages to crawl. Recommended for most use cases like crawling an entire website.
- include_urls (string[]) - URL path patterns to include in the crawl using glob syntax. Defaults to `/**` which includes all URLs. Use patterns like `/blog/**` to crawl specific sections (e.g., only blog pages), `/products/*.html` for product pages, or multiple patterns for different sections. Supports standard glob features like * (any characters) and ** (recursive matching).
- exclude_urls (string[]) - URL path names in glob pattern to exclude. For example: `/careers/**`. Excluded URLs will supersede included URLs.
- max_depth (number) - Maximum depth of the crawl. Useful to extract only up to n-degree of links.
- include_external (boolean) - Crawl first-degree external links.
- include_subdomain (boolean) - Include subdomains of the website. `false` by default.
- search_query (string) - An optional search query to find specific links and also sort the results by relevance.
- top_n (number) - An optional number to only crawl the top N most relevant links on every page as per search query.
- webhook_url (string) - An optional POST request endpoint called when this crawl is completed. The body of the request will be same as the response of this [`v1/crawls/{crawl_id}`](./info#response-created) endpoint.
- timeout (number) - End the crawl after n seconds with the pages completed until then. May take ~10s extra from provided timeout.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/crawls"}'
  "start_url": "https://example.com",
  "max_pages": 100
}'
```

### Start Batch
Starts a new batch. You receive an `id` that you can use to track the progress of the batch as shown [here](/api-reference/batches/info). Note: Processing time is constant regardless of batch size

Parameters:
- items* (object[]) - Array of items to be processed in the batch.
- country (string) - Country for the batch execution. Provide in ISO 3166-1 alpha-2 codes like US(USA), IN(India), etc
- parser (object) - You can use this parameter to specify the parser to use. Parsers are useful to extract structured content from web pages. Olostep has a few parsers built in for most common web pages, and you can also create your own parsers.
- links_on_page (object) - Get all the links present on each page in the batch.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/batches"}'
  "items": [
    {"url_to_scrape": "https://example.com/page1"},
    {"url_to_scrape": "https://example.com/page2"}
  ]
}'
```

### Batch Items
Retrieves the list of items processed for a batch. You can then use the `retrieve_id` to get the content with the Retrieve Endpoint

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/batches/{batch_id}/items"}'
```

### Crawl Info
Fetches information about a specific crawl.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/crawls/{crawl_id}"}'
```

### Crawl Pages
Fetches the list of pages for a specific crawl.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/crawls/{crawl_id}/pages"}'
```

### Get Answer
This endpoint retrieves a previously completed answer by its ID.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/answers/{answer_id}"}'
```

### Get Scrape
Can be used to retrieve response for a scrape.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes/{scrape_id}"}'
```

### Batch Info
Retrieves the status and progress information about a batch. To retrieve the content for a batch, see here

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/batches/{batch_id}"}'
```

### Retrieve Content
Retrieve page content of processed batches and crawls urls.

Parameters:
- retrieve_id* (string) - The ID of the page content to retrieve. Available in the response of `/v1/crawls/{crawl_id}/pages`, `/v1/scrapes/{scrape_id}` or `/v1/batches/{batch_id}/items` endpoints
- formats (string[]) - Optional array to retrieve only specific formats in production. If not provided, all formats will be returned.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/retrieve","body":{"retrieve_id":"abc123"}}'
```

## Use Cases

1. **Data Collection**: Gather data from websites at scale
2. **Content Monitoring**: Track changes on competitor sites
3. **Research Automation**: Get AI-synthesized answers from web sources
4. **SEO Analysis**: Crawl and analyze site structure

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"olostep API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"olostep","path":"/v1/scrapes"}'   # Get endpoint details
```
