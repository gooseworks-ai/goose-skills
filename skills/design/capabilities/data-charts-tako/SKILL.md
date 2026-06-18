---
name: data-charts-tako
description: Search and visualize the world's data - get charts, insights, and embeddable knowledge cards for finance, economics, demographics, sports, and more
source: orthogonal
---


# Tako Knowledge Search & Visualization

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Search for data with natural language and get interactive charts, AI-generated insights, and embeddable knowledge cards. Covers finance, economics, demographics, sports, politics, climate, and health from sources like S&P Global, World Bank, and more.

## When to Use

- User asks a data question ("What's NVIDIA's revenue?", "US GDP growth?")
- User wants to compare metrics ("Tesla vs Ford market cap")
- User needs a chart or visualization for a report
- User wants to turn their own data into a chart
- User asks for insights or analysis on a data trend

## Usage

### Search for Data

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/knowledge_search","body":{"inputs":{"text":"NVIDIA vs AMD revenue since 2018"}}}'
```

With search effort and source options:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/knowledge_search","body":{"inputs":{"text":"US inflation rate 2020-2025","search_effort":"deep"},"source_indexes":["tako","web"]}}'
```

With dark mode chart images:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/knowledge_search","body":{"inputs":{"text":"Bitcoin price history"},"output_settings":{"knowledge_card_settings":{"image_dark_mode":true}}}}'
```

### Get Chart Insights

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/beta/chart_insights","query":{"card_id":"sXQPVnixcDUf2Iw35Via"}}'
```

### Visualize Your Own Data

Provide data as CSV strings. Tako picks the best chart type automatically.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/beta/visualize"}'
Q1 2024,100
Q2 2024,150
Q3 2024,220
Q4 2024,310"], "query": "Show quarterly revenue as a bar chart"}'
```

Request a specific chart type:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/beta/visualize"}'
US,500
EU,300
Asia,250"], "query": "Sales by region", "viz_component_type": "pie"}'
```

### Create a Custom Chart

Build charts from scratch with full control over components and layout.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/thin_viz/create/","body":{"components":[{"component_type":"header","config":{"title":"Sales by Region"}},{"component_type":"categorical_bar","config":{"datasets":[{"label":"Revenue (M)","data":[{"x":"US","y":500},{"x":"EU","y":300},{"x":"Asia","y":250}]}]}}],"title":"Sales by Region","source":"Internal Data"}}'
```

### List Available Chart Types

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/thin_viz/default_schema/"}'
```

### Get Tako Tool Descriptions

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/tako_tools_description"}'
```

## Parameters

### Knowledge Search (POST /v1/knowledge_search)

Body:
- **inputs.text** (string, required) - Natural language query (e.g. "Tesla vs Ford market cap")
- **inputs.search_effort** (string) - "fast", "medium", "deep", or "auto"
- **source_indexes** (array) - Priority order: "tako", "web", "tako_deep_v2". Default: ["tako"]
- **country_code** (string) - ISO 3166-1 alpha-2 (e.g. "US", "GB"). Default: "US"
- **locale** (string) - e.g. "en-US", "de-DE". Default: "en-US"
- **output_settings** (object) - `{"knowledge_card_settings": {"image_dark_mode": true}}` for dark mode

### Chart Insights (GET /v1/beta/chart_insights)

- **card_id** (string, required) - Card ID from Knowledge Search or Create Card response

### Visualize Datasets (POST /v1/beta/visualize)

Body:
- **csv** (array of strings, required) - CSV data with headers in first row. Example: `["name,value
Apple,3.7
NVIDIA,3.4"]`
- **query** (string) - How to visualize (e.g. "Show as a bar chart")
- **viz_component_type** (string) - Force chart type: bar, grouped_bar, stacked_bar, timeseries, pie, choropleth, scatter, boxplot, heatmap, waterfall, histogram, table, treemap

### Create Card (POST /v1/thin_viz/create/)

Body:
- **components** (array, required) - Each needs `component_type` (header, categorical_bar, pie, scatter, table, choropleth, heatmap, histogram, boxplot, treemap, waterfall, bubble, etc.) and `config` (type-specific data)
- **title** (string) - Card title
- **description** (string) - Card description
- **source** (string) - Data source attribution for footer

### List Default Schemas (GET /v1/thin_viz/default_schema/)

No parameters.

### Tool Descriptions (GET /v1/tako_tools_description)

- **index_ids** (string) - Comma-separated index IDs to filter

## Response

### Knowledge Search — `data.outputs.knowledge_cards[]`

- **card_id** - Unique ID (use for Chart Insights or embed URLs)
- **title** - Chart title
- **description** - Text description of the data and trends
- **card_type** - "chart", "table", "company", or "text"
- **webpage_url** - Interactive card page on Tako
- **image_url** - Static chart image (embed in messages, reports)
- **embed_url** - Embeddable iframe URL
- **relevance** - "High", "Medium", or "Low"
- **sources** - Data sources with name and description
- **visualization_data** - Raw chart data points

### Chart Insights — `data`

- **insights** - Array of AI-generated observations
- **description** - Chart description

### Create Card — `data`

- **card_id**, **title**, **webpage_url**, **image_url**, **embed_url**

## Examples

```bash
# What's the US unemployment rate?
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/knowledge_search","body":{"inputs":{"text":"US unemployment rate"}}}'

# Compare company revenues
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/knowledge_search","body":{"inputs":{"text":"Apple vs Microsoft vs Google revenue","search_effort":"deep"}}}'

# Get insights on a chart
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/beta/chart_insights","query":{"card_id":"sXQPVnixcDUf2Iw35Via"}}'

# Visualize your own CSV data
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/beta/visualize"}'
North America,500
Europe,300
Asia,250
LatAm,100"], "query": "Show sales by region"}'

# Create a custom bar chart
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tako","path":"/v1/thin_viz/create/","body":{"components":[{"component_type":"categorical_bar","config":{"datasets":[{"label":"Revenue","data":[{"x":"Q1","y":100},{"x":"Q2","y":200}]}]}}],"title":"Quarterly Revenue"}}'
```

## Tips

- **Knowledge Search** is the main endpoint — start here for any data question
- Use **image_url** to display charts in Slack, Discord, or other channels
- **embed_url** gives an interactive iframe for web pages
- Call **List Default Schemas** before Create Card to see available chart types
- Set `search_effort: "deep"` for complex multi-metric comparisons
- Data coverage: stock prices, revenue, GDP, unemployment, population, sports stats, weather, health, and more

## Error Handling

- **400** - Invalid body or missing required fields
- **401** - Invalid API key
- **404** - Card not found (Chart Insights) or no results found (Knowledge Search)
- Empty `knowledge_cards` array — try rephrasing or using `source_indexes: ["tako", "web"]`
