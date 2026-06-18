---
name: web-search
description: Search the web, platforms, and datasets. Use when asked to search, find, look up, research, or discover information from the web, YouTube, Amazon, eBay, news, academic sources, or any online platform.
source: orthogonal
---


# Search — General-Purpose Web & Platform Search

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Search the web, platforms, and proprietary datasets. Pick the best API for the task — or combine several for comprehensive results.

## 1. Tavily — Comprehensive Web Search & Research

Best for: General web search, deep research reports, site mapping, and crawling.

**Search the web:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/search"}'
  "query": "latest developments in AI agents",
  "search_depth": "advanced",
  "include_answer": true,
  "max_results": 10
}'
```

**Deep research** (async — returns a report with citations):
```bash
# Step 1: Start research task
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/research","body":{"input":"Compare AI agent frameworks for production use","model":"pro"}}'
# Step 2: Poll for results using request_id
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/research/{request_id}"}'
```

**Map a website** (discover all URLs):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/map","body":{"url":"https://docs.example.com","limit":200}}'
```

**Crawl a website** (extract content from multiple pages):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/crawl"}'
  "url": "https://docs.example.com",
  "max_depth": 3,
  "limit": 50
}'
```

Key parameters: `search_depth` (basic/fast/advanced/ultra-fast), `topic` (general/news), `time_range` (day/week/month/year), `include_domains`/`exclude_domains`, `include_answer`, `include_raw_content`, `country`.

## 2. Exa — Neural & Semantic Search

Best for: Finding similar content, semantic/embeddings-based search, category-filtered search (people, companies), and deep research.

**Neural web search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "startups building AI coding assistants",
  "numResults": 10,
  "type": "auto",
  "contents": {"text": true}
}'
```

**Find similar pages:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/findSimilar"}'
  "url": "https://example.com/article",
  "numResults": 10,
  "contents": {"text": true}
}'
```

**Get a sourced AI answer:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/answer","body":{"query":"What are the best practices for prompt engineering?"}}'
```

**Get page contents:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/contents","body":{"urls":["https://example.com"],"text":true,"summary":true}}'
```

**Deep research** (async):
```bash
# Step 1: Create task
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/research/v1","body":{"instructions":"Research the current state of AI coding assistants","model":"exa-research-pro"}}'
# Step 2: Poll with researchId
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/research/v1/{researchId}"}'
```

Key parameters: `type` (auto/neural/fast/deep), `category` (people/company), `includeDomains`/`excludeDomains`, `startPublishedDate`/`endPublishedDate`, `includeText`/`excludeText`.

## 3. Andi — Fast Web Search

Best for: Quick, high-quality web search with intelligent ranking and instant answers. Low latency.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"andi","path":"/v1/search","query":{"q":"how%20does%20RAG%20work","depth":"deep","limit":"20"}}'
```

Key parameters: `q` (query), `limit` (1-100), `depth` (fast/deep), `intent` (NewsSearchIntent, VideoSearchIntent, ImageSearchIntent), `dateRange` (day/week/month/year), `includeDomains`/`excludeDomains`, `country`, `language`.

## 4. Linkup — Question-Based Search with Sourced Answers

Best for: Natural language questions, sourced answers with citations, structured output.

**Search with sourced answer:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/search"}'
  "q": "What are the latest AI agent frameworks?",
  "depth": "deep",
  "outputType": "sourcedAnswer"
}'
```

**Structured output search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"linkup","path":"/search"}'
  "q": "Top 5 AI startups in 2025",
  "depth": "deep",
  "outputType": "structured",
  "structuredOutputSchema": {
    "type": "object",
    "properties": {
      "startups": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": {"type": "string"},
            "description": {"type": "string"},
            "funding": {"type": "string"}
          }
        }
      }
    }
  }
}'
```

Key parameters: `q` (natural language question), `depth` (standard/deep), `outputType` (searchResults/sourcedAnswer/structured), `fromDate`/`toDate`, `includeDomains`/`excludeDomains`, `maxResults`.

## 5. Valyu — Web, Proprietary Datasets & News Search

Best for: Searching across web, academic/proprietary datasets, and news. AI-generated answers. Deep research tasks.

**Web search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/search","body":{"query":"AI agent frameworks comparison","search_type":"web","max_num_results":10}}'
```

**Academic/proprietary search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/search","body":{"query":"transformer architecture improvements","search_type":"proprietary"}}'
```

**News search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/search","body":{"query":"OpenAI latest announcements","search_type":"news"}}'
```

**AI-generated answer:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/answer","body":{"query":"What are best practices for building AI agents?"}}'
```

**Deep research** (async):
```bash
# Step 1: Create task
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/tasks","body":{"query":"Comprehensive analysis of vector databases market","mode":"standard"}}'
# Step 2: Poll for status
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"valyu","path":"/v1/deepresearch/tasks/{id}/status"}'
```

Key parameters: `search_type` (web/proprietary/news), `fast_mode`, `included_sources`/`excluded_sources`, `relevance_threshold`, `start_date`/`end_date`, `country_code`.

## 6. SearchAPI — Multi-Platform Search

Best for: Searching specific platforms — Amazon, eBay, Walmart, YouTube, Airbnb, TripAdvisor, app stores, and ad libraries (Meta, TikTok, Reddit, LinkedIn).

All SearchAPI calls use the same endpoint with different `engine` values:

**Amazon product search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"amazon_search","q":"wireless%20headphones"}}'
```

**eBay search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"ebay_search","q":"vintage%20watch"}}'
```

**Walmart search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"walmart_search","q":"laptop"}}'
```

**YouTube search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"youtube","q":"AI%20agents"}}'
```

**YouTube video details / comments / transcripts:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"youtube_video","video_id":"dQw4w9WgXcQ"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"youtube_comments","video_id":"dQw4w9WgXcQ"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"youtube_transcripts","video_id":"dQw4w9WgXcQ"}}'
```

**Airbnb search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"airbnb","q":"Paris","adults":"2","check_in_date":"2025-06-01","check_out_date":"2025-06-07"}}'
```

**TripAdvisor search:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"tripadvisor","q":"best%20restaurants%20NYC"}}'
```

**Apple App Store:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"apple_app_store","term":"productivity"}}'
```

**Ad library search** (Meta, TikTok, Reddit, LinkedIn):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"meta_ad_library","q":"AI%20tools"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"tiktok_ads_library","q":"AI"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"reddit_ad_library","q":"software"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"linkedin_ad_library","q":"hiring"}}'
```

**Social media profiles:**
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"tiktok_profile","username":"openai"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"instagram_profile","username":"openai"}}'
```

Available engines: `amazon_search`, `ebay_search`, `walmart_search`, `youtube`, `youtube_video`, `youtube_comments`, `youtube_transcripts`, `youtube_channel`, `youtube_channel_videos`, `airbnb`, `tripadvisor`, `apple_app_store`, `meta_ad_library`, `tiktok_ads_library`, `reddit_ad_library`, `linkedin_ad_library`, `tiktok_profile`, `instagram_profile`.

## Tips

- **General web search**: Start with Tavily (`search_depth: "advanced"`) or Exa (`type: "auto"`) for best relevance
- **Speed matters**: Use Andi for fast results, Tavily `ultra-fast` for lowest latency
- **Sourced answers**: Linkup and Valyu both generate answers with citations — Linkup is best for Q&A, Valyu for blending web + proprietary data
- **Academic/research data**: Valyu's `proprietary` search type covers arxiv, pubmed, and academic datasets
- **News**: Use Valyu (`search_type: "news"`) or Tavily (`topic: "news"`) for current events
- **Deep research**: Tavily, Exa, and Valyu all offer async research tasks — Tavily for web-focused, Exa for comprehensive with citations, Valyu for web + academic mix
- **Find similar content**: Exa's `/findSimilar` is unique — pass a URL and get semantically similar pages
- **Platform-specific search**: SearchAPI is the only option for Amazon, eBay, Walmart, YouTube, Airbnb, TripAdvisor, and ad libraries
- **Domain filtering**: Most APIs support `include_domains`/`exclude_domains` to scope results
- **Async patterns**: Deep research tasks (Tavily, Exa, Valyu) are async — POST to start, GET to poll for results
- **Combine APIs**: For thorough research, run Tavily + Exa + Linkup in parallel and cross-reference results

## Discover More

List all endpoints for any API, or add a path for parameter details:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"tavily API endpoints"}' api show exa
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"andi API endpoints"}' api show linkup
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"valyu API endpoints"}' api show searchapi
```

Example: `curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavily","path":"/search`"}' for full parameter details.
