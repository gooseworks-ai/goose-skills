---
name: get-brand-assets
description: Get company logos, brand colors, fonts, and style guides
source: orthogonal
---


# Get Brand Assets

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Extract logos, colors, fonts, and design assets from any company's brand. Useful for partnerships, design work, and brand research.

## When to Use

- User needs a company's logo
- User asks "what are [company]'s brand colors?"
- User is designing something that needs brand assets
- User wants to match a company's visual style
- Creating pitch decks or partnership materials

## How It Works

Uses Brand.dev API to extract brand information directly from company websites.

## Usage

### Get Full Brand Data

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"stripe.com"}}'
```

### Get Simplified Brand Data (logo + colors)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve-simplified","query":{"domain":"notion.so"}}'
```

### Get Brand Fonts

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/fonts","query":{"domain":"linear.app"}}'
```

### Get Design System/Styleguide

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/styleguide","query":{"domain":"vercel.com"}}'
```

### Take Brand Screenshot

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/screenshot","query":{"domain":"figma.com"}}'
```

## Parameters

- **domain** (required) - Company website domain (e.g., stripe.com)

## Response

### Full brand data includes:
- **Logos** - Various formats and sizes
- **Colors** - Primary, secondary, accent colors with hex codes
- **Fonts** - Font families used on the site
- **Industry** - Company industry/category
- **Description** - Company description
- **Social links** - Twitter, LinkedIn, etc.

### Simplified data includes:
- Domain
- Company title
- Primary colors
- Logo URLs
- Backdrop images

### Fonts include:
- Font family names
- Usage (headings, body, etc.)
- Fallback fonts
- Element counts

### Styleguide includes:
- Color palette
- Typography scale
- Spacing values
- UI component styles
- Shadow definitions

## Examples

**User:** "Get Notion's logo and brand colors"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve-simplified","query":{"domain":"notion.so"}}'
```

**User:** "What fonts does Linear use?"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/fonts","query":{"domain":"linear.app"}}'
```

**User:** "I need the full design system for Vercel"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/styleguide","query":{"domain":"vercel.com"}}'
```

## Tips

- Use the main company domain for best results
- Simplified endpoint is faster if you just need logo + colors
- Logo URLs are direct links you can download
- Colors are provided in hex format
- Styleguide extraction is comprehensive but takes longer
