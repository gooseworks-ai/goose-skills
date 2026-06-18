---
name: aeo
description: >
  Check and improve your brand's visibility across AI search engines (ChatGPT, Perplexity, Gemini, Grok, Claude, DeepSeek).
  Set up tracking, run visibility analyses, audit your website for AI readability, and get actionable recommendations.
  Uses the npx goose-aeo@latest CLI.
tags: [seo]
---

You are helping a user check and improve their brand's Answer Engine Optimization (AEO) — how visible they are across AI search engines like ChatGPT, Perplexity, Gemini, Grok, Claude, and DeepSeek.

You use the `npx goose-aeo@latest` CLI to do everything. Always use `--json` for machine-readable output — never rely on interactive prompts.

## Auto-Detect: What Does the User Need?

Before doing anything, check the current state:

```bash
cat .goose-aeo.yml 2>/dev/null || echo "NOT_FOUND"
```

Then route based on state and what the user asked:

| State | User says | Action |
|-------|-----------|--------|
| No `.goose-aeo.yml` | Anything AEO-related | Start with **Setup** |
| Config exists, no runs | "run", "check", "analyze" | Go to **Run Analysis** |
| Config exists, has runs | "run", "check" | Go to **Run Analysis** |
| Config exists, has runs | "audit", "score my site" | Go to **Website Audit** |
| Config exists, has runs | "recommend", "what should I do" | Go to **Recommendations** |
| Config exists, has runs | General AEO request | Show status summary, offer all options |

If in doubt, run `npx goose-aeo@latest status --json` to see the full picture (company name, query count, previous runs) and ask the user what they'd like to do.

---

## Setup

Set up AEO tracking for a domain. Have a natural conversation with the user to gather what's needed.

### Gather Information

Ask the user for:
- **Company domain** (e.g., `athina.ai`) — required
- **Company name** (e.g., "Athina AI") — if not provided, derive from domain
- **A few competitors** — ask "Who are your main competitors?" If they're not sure, say you'll auto-discover them.
- **Which AI engines to monitor** — default is Perplexity, OpenAI, and Gemini. Ask if they want to add Grok, Claude, or DeepSeek. More providers = higher cost per run.

Do NOT proceed until you have at least the company domain.

### Check Prerequisites

Check which API keys are available:

```bash
node -e "
const keys = {
  GOOSE_AEO_PERPLEXITY_API_KEY: !!process.env.GOOSE_AEO_PERPLEXITY_API_KEY,
  GOOSE_AEO_OPENAI_API_KEY: !!process.env.GOOSE_AEO_OPENAI_API_KEY,
  GOOSE_AEO_GEMINI_API_KEY: !!process.env.GOOSE_AEO_GEMINI_API_KEY,
  GOOSE_AEO_GROK_API_KEY: !!process.env.GOOSE_AEO_GROK_API_KEY,
  GOOSE_AEO_CLAUDE_API_KEY: !!process.env.GOOSE_AEO_CLAUDE_API_KEY,
  GOOSE_AEO_DEEPSEEK_API_KEY: !!process.env.GOOSE_AEO_DEEPSEEK_API_KEY,
  GOOSE_AEO_FIRECRAWL_API_KEY: !!process.env.GOOSE_AEO_FIRECRAWL_API_KEY,
};
console.log(JSON.stringify(keys, null, 2));
"
```

Tell the user which keys are set and which are missing for their chosen providers. If keys are missing, ask them to provide the values. When they do, write them to `.env`:

```bash
echo 'GOOSE_AEO_PERPLEXITY_API_KEY=pplx-...' >> .env
```

The `GOOSE_AEO_OPENAI_API_KEY` is also needed for query generation and analysis (not just as a monitored provider). Make sure the user knows this.

### Run Init

Build the flags from what the user told you:

```bash
npx goose-aeo@latest init \
  --domain <domain> \
  --name "<company name>" \
  --providers <comma-separated-providers> \
  --competitors "<comma-separated-competitor-domains>" \
  --json
```

If the user didn't provide competitors, the tool will auto-discover them using Perplexity (if the API key is set).

Show the user the competitors and providers configured. Ask: "Do these competitors look right? Want to add or remove any?"

If the user wants changes, edit `.goose-aeo.yml` directly — do NOT re-run init.

### Generate Queries

Generate a small batch for review:

```bash
npx goose-aeo@latest queries generate --limit 10 --dry-run --json
```

Show the queries in a readable numbered list. Ask: "Do these look like the kind of things your potential customers would search for?"

If queries are off-topic, update the company description in `.goose-aeo.yml` and re-generate. To add specific queries: `npx goose-aeo@latest queries add "<query text>" --json`. To remove: `npx goose-aeo@latest queries remove <id> --json`.

Once approved, generate the full set:

```bash
npx goose-aeo@latest queries generate --limit 50 --json
```

### Hand Off

Tell the user setup is complete and offer to run their first analysis right away. Mention approximate cost: 50 queries x 3 providers ~ $2-5 per run.

---

## Run Analysis

Execute queries against AI search engines and generate a visibility report.

### Pre-Flight

```bash
npx goose-aeo@latest status --json
```

Show: company name, number of queries, number of previous runs.

### Cost Estimate

```bash
npx goose-aeo@latest run --dry-run --json
```

Tell the user: number of queries, which providers, total API calls, estimated cost. Ask for confirmation before proceeding.

### Execute

```bash
npx goose-aeo@latest run --confirm --json
```

This may take several minutes. Tell the user it's running.

### Analyze

```bash
npx goose-aeo@latest analyze --json
```

Note how many responses were analyzed, analysis cost, and any alerts from metric drops.

### Report

```bash
npx goose-aeo@latest report --json
```

Present a **conversational summary** — do NOT dump raw numbers:

- **Overall visibility:** mention rate, prominence score, share of voice
- **By provider:** mention rate per engine
- **Key insights:** best/worst provider, competitor comparison, any alerts
- **Recommendations:** 2-3 actionable suggestions based on results

### Next Steps

Offer:
1. **"See the dashboard"** — `npx goose-aeo@latest dashboard`
2. **"Audit my website"** — run a website readability audit
3. **"Get recommendations"** — detailed improvement recommendations
4. **"Compare with previous run"** — if 2+ runs exist, run a diff

---

## Website Audit

Scrape website pages and score each for AI search readability across 6 dimensions.

### Pre-Flight

```bash
npx goose-aeo@latest status --json
```

If not set up, direct the user to setup first.

### Run Audit

```bash
npx goose-aeo@latest audit --json
```

This may take a minute or two as it scrapes pages and scores each one.

### Present Results

**Overall score:** "Your site scores X.X / 10 for AI search readability"
- >= 7: well-optimized
- 4-7: room for improvement
- < 4: needs significant work

**Per-page highlights:** Best and worst scoring pages.

**Dimension breakdown** — explain which are strongest and weakest:
- **Positioning Clarity**: Does your site clearly explain what you do upfront?
- **Structured Content**: Do pages use headings, lists, FAQs that AI can parse?
- **Query Alignment**: Does your content match what people ask AI engines?
- **Technical Signals**: Schema markup, meta descriptions, clean HTML?
- **Content Depth**: Enough detail for AI to form a meaningful citation?
- **Comparison Content**: Do you compare yourself to alternatives?

**Recommendations:** Present as numbered actionable items.

### Offer to Fix

Based on lowest-scoring dimensions, offer specific actions:
- Low structuredContent: "Want me to add FAQ sections to your key pages?"
- Low comparisonContent: "Want me to create a comparison page?"
- Low queryAlignment: "Want me to create content pages that answer your tracked queries?"
- Low technicalSignals: "Want me to improve meta descriptions and add schema markup?"
- Low positioningClarity: "Want me to rewrite your homepage intro?"
- Low contentDepth: "Want me to expand content on your thinnest pages?"

---

## Recommendations

Analyze latest run data and produce actionable visibility improvement recommendations.

### Pre-Flight

```bash
npx goose-aeo@latest status --json
```

If no runs exist, tell the user to run an analysis first.

### Generate

```bash
npx goose-aeo@latest recommend --json
```

### Present Results

**Overall summary:** Big picture of the brand's AI visibility position.

**Visibility gaps:** For each gap — the topic, affected queries, which competitors are mentioned instead, and the specific recommendation.

**Source opportunities:** Domains frequently cited by AI engines, how often, and how to get featured there.

**Competitor insights:** Who's outperforming, on which queries, and what they might be doing differently.

### Offer Next Steps

1. **"Draft content for gaps"** — create blog posts, landing pages, or FAQ content for visibility gaps
2. **"Create a comparison page"** — draft a vs/comparison page if competitors are being mentioned instead
3. **"Write a guest post pitch"** — draft outreach for source opportunity domains
4. **"Update queries"** — add new query angles the recommendations suggest
5. **"See the dashboard"** — `npx goose-aeo@latest dashboard` for visual exploration

---

## Error Handling

- **"No company found" / no `.goose-aeo.yml`**: Run setup first.
- **"GOOSE_AEO_OPENAI_API_KEY is required"**: Tell the user to set the env var — it's needed for query generation, analysis, and recommendations.
- **Provider API key missing**: Tell the user which key is needed and how to set it.
- **No pages scraped during audit**: Check the domain in `.goose-aeo.yml` and whether the site is publicly accessible.
- **All-zero visibility**: Explain this means AI engines aren't mentioning the brand yet — this is the baseline to improve from.
- **Partial run failure**: Some providers may have succeeded. Check error count and report which failed.
- Never silently swallow errors — always show them and suggest a fix.
