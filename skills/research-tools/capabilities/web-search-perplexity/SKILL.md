---
name: web-search-perplexity
description: Perplexity AI search and chat completions with real-time web data
source: orthogonal
---


# Perplexity - AI Search & Chat

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


AI-powered search and chat completions with real-time web data.

## Capabilities

- **Chat Completions**: Generates a model’s response for the given chat conversation
- **Search**: Get ranked search results from Perplexity’s continuously refreshed index with advanced filtering and customization options
- **Sonar Chat Completions API**: Creates an asynchronous chat completion job
- **Get Async Chat Completion Response**: Retrieves the status and result of a specific asynchronous chat completion job
- **List Async Chat Completions**: Lists all asynchronous chat completion requests for the authenticated user

## Usage

### Chat Completions
Generates a model’s response for the given chat conversation.

Parameters:
- model* (enum<string>) - The name of the model that will complete your prompt. Choose from our available Sonar models: sonar (lightweight search), sonar-pro (advanced search), sonar-deep-research (exhaustive research), or sonar-reasoning-pro (premier reasoning).
- messages* (object[]) - A list of messages comprising the conversation so far.
- search_mode (string) - Controls search mode: 'academic' prioritizes scholarly sources, 'sec' prioritizes SEC filings, 'web' uses general web search. See academic guide and SEC guide.
- reasoning_effort (string) - Perplexity-Specific: Controls how much computational effort the AI dedicates to each query for deep research models. 'low' provides faster, simpler answers with reduced token usage, 'medium' offers a balanced approach, and 'high' delivers deeper, more thorough responses with increased token usage. This parameter directly impacts the amount of reasoning tokens consumed. WARNING: This parameter is ONLY applicable for sonar-deep-research. Defaults to 'medium' when used with sonar-deep-research.
- max_tokens (integer) - OpenAI Compatible: The maximum number of completion tokens returned by the API. Controls the length of the model's response. If the response would exceed this limit, it will be truncated. Higher values allow for longer responses but may increase processing time and costs.
- temperature (number) - The amount of randomness in the response, valued between 0 and 2. Lower values (e.g., 0.1) make the output more focused, deterministic, and less creative. Higher values (e.g., 1.5) make the output more random and creative. Use lower values for factual/information retrieval tasks and higher values for creative applications.
- top_p (number) - OpenAI Compatible: The nucleus sampling threshold, valued between 0 and 1. Controls the diversity of generated text by considering only the tokens whose cumulative probability exceeds the top_p value. Lower values (e.g., 0.5) make the output more focused and deterministic, while higher values (e.g., 0.95) allow for more diverse outputs. Often used as an alternative to temperature.
- language_preference (string) - Perplexity-Specific: Specifies the preferred language for the chat completion response (i.e., English, Korean, Spanish, etc.) of the response content. This parameter is supported only by the sonar and sonar-pro models. Using it with other models is on a best-effort basis and may not produce consistent results.
- search_domain_filter (array) - A list of domains to limit search results to. Currently limited to 20 domains for Allowlisting and Denylisting. For Denylisting, add a - at the beginning of the domain string. More information about this here.
- return_images (boolean) - Perplexity-Specific: Determines whether search results should include images.
- return_related_questions (boolean) - Perplexity-Specific: Determines whether related questions should be returned.
- search_recency_filter (string) - Perplexity-Specific: Filters search results based on time (e.g., 'week', 'day').
- search_after_date_filter (string) - Perplexity-Specific: Filters search results to only include content published after this date. Format should be %m/%d/%Y (e.g. 3/1/2025)
- search_before_date_filter (string) - Perplexity-Specific: Filters search results to only include content published before this date. Format should be %m/%d/%Y (e.g. 3/1/2025)
- last_updated_after_filter (string) - Perplexity-Specific: Filters search results to only include content last updated after this date. Format should be %m/%d/%Y (e.g. 3/1/2025)
- last_updated_before_filter (string) - Perplexity-Specific: Filters search results to only include content last updated before this date. Format should be %m/%d/%Y (e.g. 3/1/2025)
- top_k (number) - OpenAI Compatible: The number of tokens to keep for top-k filtering. Limits the model to consider only the k most likely next tokens at each step. Lower values (e.g., 20) make the output more focused and deterministic, while higher values allow for more diverse outputs. A value of 0 disables this filter. Often used in conjunction with top_p to control output randomness.
- stream (boolean) - OpenAI Compatible: Determines whether to stream the response incrementally.
- presence_penalty (number) - OpenAI Compatible: Positive values increase the likelihood of discussing new topics. Applies a penalty to tokens that have already appeared in the text, encouraging the model to talk about new concepts. Values typically range from 0 (no penalty) to 2.0 (strong penalty). Higher values reduce repetition but may lead to more off-topic text.
- frequency_penalty (number) - OpenAI Compatible: Decreases likelihood of repetition based on prior frequency. Applies a penalty to tokens based on how frequently they've appeared in the text so far. Values typically range from 0 (no penalty) to 2.0 (strong penalty). Higher values (e.g., 1.5) reduce repetition of the same words and phrases. Useful for preventing the model from getting stuck in loops.
- response_format (object) - Enables structured JSON output formatting.
- disable_search (boolean) - Perplexity-Specific: When set to true, disables web search completely and the model will only use its training data to respond. This is useful when you want deterministic responses without external information. More information about this here.
- enable_search_classifier (boolean) - Perplexity-Specific: Enables a classifier that decides if web search is needed based on your query. See more here.
- web_search_options (object) - Perplexity-Specific: Configuration for using web search in model responses.
- media_response (object) - Perplexity-Specific: Configuration for controlling media content in responses, such as videos and images. Use the overrides property to enable specific media types.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/chat/completions"}'
  "model": "sonar",
  "messages": [
    {"role": "user", "content": "What are the latest developments in AI agents?"}
  ]
}'
```

### Search
Get ranked search results from Perplexity’s continuously refreshed index with advanced filtering and customization options.

Parameters:
- query* (string) - A search query. Can be a single query or a list of queries for multi-query search.
- max_results (integer) - The maximum number of search results to return.
- max_tokens (integer) - The maximum total number of tokens of webpage content returned across all search results. This sets the overall content budget for the search operation. Higher values return more content in the snippet fields. Use in combination with max_tokens_per_page to control content distribution.
- search_domain_filter (string[]) - A list of domains/URLs to limit search results to. Maximum 20 domains.
- max_tokens_per_page (integer) - Controls the maximum number of tokens retrieved from each webpage during search processing. Higher values provide more comprehensive content extraction but may increase processing time.
- country (string) - Country code to filter search results by geographic location (e.g., 'US', 'GB', 'DE').
- search_recency_filter (string) - Filters search results based on recency. Specify 'day' for results from the past 24 hours, 'week' for the past 7 days, 'month' for the past 30 days, or 'year' for the past 365 days.
- search_after_date (string) - Filters search results to only include content published after this date. Format should be %m/%d/%Y (e.g., '10/15/2025').
- search_before_date (string) - Filters search results to only include content published before this date. Format should be %m/%d/%Y (e.g., '10/16/2025').
- last_updated_after_filter (string) - Perplexity-Specific: Filters search results to only include content last updated after this date. Format should be %m/%d/%Y (e.g., '07/01/2025').
- last_updated_before_filter (string) - Perplexity-Specific: Filters search results to only include content last updated before this date. Format should be %m/%d/%Y (e.g., '12/30/2025').
- search_language_filter (string[]) - Perplexity-Specific: Filters search results to only include content in the specified languages. Accepts an array of ISO 639-1 language codes (2 lowercase letters). Maximum 10 language codes per request.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/search","body":{"query":"latest AI developments February 2024"}}'
```

### Sonar Chat Completions API
Creates an asynchronous chat completion job.

Parameters:
- request (object) - required Show child attributes

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/async/chat/completions"}'
  "model": "sonar",
  "messages": [
    {"role": "user", "content": "Write a comprehensive analysis of vector databases"}
  ]
}'
```

### Get Async Chat Completion Response
Retrieves the status and result of a specific asynchronous chat completion job.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/async/chat/completions/{request_id}"}'
```

### List Async Chat Completions
Lists all asynchronous chat completion requests for the authenticated user.

Parameters:
- limit (integer) - Maximum number of requests to return.
- next_token (string) - Token for fetching the next page of results. Ensure this token is URL-encoded when passed as a query parameter.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/async/chat/completions"}'
```

## Use Cases

1. **Research**: Get AI-synthesized answers with sources
2. **Current Events**: Access real-time information
3. **Technical Questions**: Get accurate technical answers
4. **Fact-Checking**: Verify information with web sources
5. **Content Creation**: Generate content grounded in facts

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"perplexity API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"perplexity","path":"/chat/completions"}'   # Get endpoint details
```
