---
name: person-lookup
description: Look up information about a person - work history, social profiles, contact info
source: orthogonal
---


# Person Lookup

## Cost Warning

Nyne `/person/search` uses PeopleDataLabs under the hood — **$0.30 per record returned**. For a single person lookup this is fine ($0.30), but avoid large result sets.

**Cheaper alternatives for multi-result searches:**
- Apollo `mixed_people/search`: **$0.01 flat** per call → `$GOOSEWORKS_API_BASE/v1/proxy/apollo/mixed_people/search`
- Fiber `/v1/natural-language-search/profiles`: **$0.02/record** → `$GOOSEWORKS_API_BASE/v1/proxy/fiber/v1/natural-language-search/profiles`

Use Nyne only when you need to look up a **specific individual** by name + company.

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Find detailed information about a person including work history, education, social profiles, and contact information.

## When to Use

- User asks about a specific person
- User wants to find someone's background
- User asks "who is [name]?"
- Research on a professional
- Finding contact information

## How It Works

Uses the Nyne API to search person databases and aggregate professional information.

## Usage

### Search for a Person

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search","body":{"query":"Dario Amodei Anthropic"}}'
```

<details>
<summary>curl equivalent</summary>

```bash
curl -X POST "https://api.orth.sh/v1/run" \

  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search","body":{"query":"Dario Amodei Anthropic"}}'
```
</details>

## Parameters

- **query** (required) - Search query combining name, company, or other identifiers
  - Examples: "Sam Altman OpenAI", "Dario Amodei CEO Anthropic", "Jensen Huang NVIDIA"

## Response

Returns comprehensive person data:
- Full name and current title
- Current employer and role
- Work history (previous companies, roles)
- Education (schools, degrees)
- Location
- Social profiles (LinkedIn, Twitter, etc.)
- Skills and expertise
- Contact information (when available)

**Note:** Nyne searches are async - the POST returns a `request_id`. Poll with GET `/person/search?request_id=<id>` until status is complete. Results may take a few seconds.

## Examples

**User:** "Who is Dario Amodei?"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search","body":{"query":"Dario Amodei Anthropic CEO"}}'
```

**User:** "Look up Sam Altman"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search","body":{"query":"Sam Altman OpenAI"}}'
```

**User:** "Find info about Jensen Huang"
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/search","body":{"query":"Jensen Huang NVIDIA CEO"}}'
```

## Error Handling

- Nyne searches are async — if the initial POST doesn't return results, poll with GET using the `request_id`
- **404** — Person not found; try different name spellings or add company context
- **429** — Rate limit exceeded; wait and retry
- Multiple results for common names — add company or title to narrow down

## Tips

- Include company name for more accurate results
- Add job title for disambiguation
- Results are cached - same queries are faster
- Multiple results may be returned for common names
