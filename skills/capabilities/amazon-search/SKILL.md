---
name: amazon-search
description: Search Amazon products - find items, compare prices, read reviews
source: orthogonal
---


# Amazon Product Search

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Search for products on Amazon. Find items by keyword, category, or criteria.

## When to Use

- User wants to find a product on Amazon
- User asks "find me a [product] on Amazon"
- User wants to compare prices
- User needs product recommendations

## How It Works

Uses the SearchAPI Amazon Search engine to query Amazon's catalog.

## Usage

### Basic Product Search

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"amazon_search","q":"wireless earbuds"}}'
```

<details>
<summary>curl equivalent</summary>

```bash
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"amazon_search","q":"wireless earbuds"}}'
```
</details>

### Search with Category

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"amazon_search","q":"laptop","category_id":"electronics"}}'
```

## Parameters

- **engine** (required) - Must be `amazon_search`
- **q** (required) - Search query
- **category_id** - Amazon category (electronics, books, etc.)
- **page** - Page number for pagination

## Response

Top-level keys: `search_metadata`, `search_parameters`, `search_information`, `organic_results`, `filters`, `pagination`.

Each item in **`organic_results`** array:
- **position** (integer) - Result rank
- **asin** (string) - Amazon product ID
- **title** (string) - Product name
- **link** (string) - Product page URL
- **image** (string) - Product thumbnail URL
- **price** (string) - Display price (e.g., "$69.99")
- **extracted_price** (number) - Numeric price for comparison
- **original_price** / **extracted_original_price** - Pre-discount price (if on sale)
- **currency** (string) - Currency code (e.g., "USD")
- **rating** (number) - Star rating (0-5)
- **reviews** (integer) - Number of reviews
- **is_prime** (boolean) - Prime eligible
- **is_best_seller** / **is_amazon_choice** (boolean) - Badge flags
- **delivery** (string) - Delivery estimate text

**Pagination**: Use `page=2`, `page=3`, etc. for more results.

## Examples

**User:** "Find wireless earbuds on Amazon"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"amazon_search","q":"wireless earbuds"}}'
```

**User:** "Search for laptops under $500"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"amazon_search","q":"laptop under 500"}}'
```

**User:** "Find highly rated coffee makers"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"searchapi","path":"/api/v1/search","query":{"engine":"amazon_search","q":"coffee maker best rated"}}'
```

## Error Handling

- **400** - Invalid engine name or missing `q` parameter
- **401** - Invalid API key
- **429** - Rate limit — wait and retry
- Empty `organic_results` array means no products matched the query — try broader search terms
- Use separate `-q` flags if `&` in query string causes issues: `-q 'engine=amazon_search' -q 'q=wireless earbuds'`
