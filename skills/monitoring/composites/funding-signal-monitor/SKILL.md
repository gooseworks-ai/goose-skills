---
name: funding-signal-monitor
version: 1.0.0
description: >
  Monitor web sources for Series A-C funding announcements. Aggregates signals from
  TechCrunch, Crunchbase (via web search), Twitter, Hacker News, and LinkedIn. Filters
  by stage, amount, and industry. Returns qualified recently-funded companies ready
  for outreach.
tags: [lead-generation]

---

# Funding Signal Monitor

Detect recently-funded startups as buying signals. When a company raises a round, they have fresh capital, aggressive growth plans, and urgent needs for tools and services. This skill finds those companies across multiple sources, qualifies them, and outputs a ranked list ready for outreach.

## Why This Works

When a company announces funding, they've:
- Received capital earmarked for growth (hiring, tooling, infrastructure)
- Committed to investors on aggressive milestones
- Entered a 12-18 month sprint to hit next-stage metrics
- Begun evaluating vendors immediately (the "post-raise buying window" is 1-3 months)

Series A-C companies are the sweet spot: enough money to buy, small enough to move fast.

## Cost

| Component | Cost |
|-----------|------|
| Web Search (WebSearch tool) | Free |
| Hacker News (Algolia API) | Free |
| Twitter scraper (Apify) | ~$0.05-0.10 per run |
| Reddit scraper (Apify) | ~$0.05-0.10 per run |

**Typical run:** $0.10-0.20 total. Web Search + HN are free and provide the bulk of results.

## Setup

### 1. Dependencies

```bash
pip3 install requests
```

### 2. Apify API Token (for Twitter/Reddit scrapers)

```bash
export APIFY_API_TOKEN="apify_api_YOUR_TOKEN_HERE"
```

Not required if you only want Web Search + HN results.

## Usage

### Phase 1: Configuration

Accept parameters from the user:

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| target-stages | Yes | — | Comma-separated: "Series A, Series B, Series C" |
| target-industries | No | all | Filter: "SaaS, AI, fintech, healthtech" |
| min-amount | No | none | Minimum raise amount (e.g., "$5M") |
| lookback-days | No | 7 | How far back to search |
| output-path | No | stdout | Where to save the markdown report |

### Phase 2: Multi-Source Search

Run these searches in parallel to maximize coverage:

#### A) Web Search (WebSearch tool)

Run 4-6 queries using the WebSearch tool. Vary the phrasing to catch different announcement styles:

- `"Series A announced this week 2026"`
- `"Series B funding round 2026"`
- `"startup raised Series A"`
- `"seed funding announcement startup"`
- `"[industry] startup funding"` (if industry filter specified)
- `"raised $" AND "Series" AND "2026"`

For each result, extract:
- Company name
- Amount raised
- Stage (Seed, A, B, C, etc.)
- Date of announcement
- Lead investors

#### B) Twitter Search (twitter-mention-tracker)

```bash
python3 skills/twitter-mention-tracker/scripts/search_twitter.py \
  --query "\"excited to announce\" AND (\"raised\" OR \"Series A\" OR \"Series B\" OR \"funding\")" \
  --since <7-days-ago> --until <today> --max-tweets 50 --output json
```

Funding announcements often break on Twitter first. Founders post "excited to announce" or "thrilled to share" when rounds close.

#### C) Hacker News (funding-signal-monitor helper script)

```bash
python3 skills/funding-signal-monitor/scripts/search_funding.py \
  --stages "Series A,Series B" --days 7 --min-points 5 --output json
```

Or use the hacker-news-scraper directly:

```bash
python3 skills/hacker-news-scraper/scripts/search_hn.py \
  --query "raised funding Series" --days 7 --output json
```

#### D) Reddit Search (reddit-post-finder)

```bash
python3 skills/reddit-post-finder/scripts/search_reddit.py \
  --subreddit "startups,SaaS,technology" \
  --keywords "raised,Series A,Series B,funding round" \
  --days 7 --sort hot --output json
```

### Phase 3: Consolidation & Qualification

After collecting results from all sources:

1. **Deduplicate** across sources. Same company appearing in multiple sources = higher confidence signal.

2. **For each company, assess:**

   | Criterion | How to Evaluate |
   |-----------|----------------|
   | Stage | Seed, A, B, C, or later — must match target-stages |
   | Amount raised | Parse from announcement — filter by min-amount if specified |
   | Industry | Infer from company description — filter if target-industries specified |
   | Cloud likelihood | Tech/SaaS/AI companies = high; traditional industries = lower |
   | Team size estimate | Series A = 10-30, Series B = 30-100, Series C = 100-300 |
   | Recency | More recent = more urgent buying window |

3. **Score each company:**
   - +3 points: Appears in multiple sources
   - +2 points: Stage matches target exactly
   - +2 points: Industry matches target
   - +1 point: High cloud likelihood (tech/SaaS/AI)
   - +1 point: Announced within last 3 days
   - -1 point: Stage is outside target range
   - -2 points: Non-tech industry (unless specifically targeted)

4. **Rank** by score descending.

### Phase 4: Output

Produce a ranked report with the following columns:

| Column | Description |
|--------|-------------|
| Rank | Score-based ranking |
| Company | Company name |
| Amount | Amount raised |
| Stage | Funding stage |
| Date | Announcement date |
| Investors | Lead investors |
| Industry | Company's industry/vertical |
| Source(s) | Where the signal was found (web, Twitter, HN, Reddit) |
| Cloud Likelihood | High / Medium / Low |
| Outreach Angle | Suggested approach based on stage and industry |

**Outreach angle templates:**

- **"Scale fast with fresh capital"** — Best for Series A. They're building the team and need tools to move fast before the money runs out.
- **"Operationalize before the next round"** — Best for Series B. They need to professionalize processes before Series C diligence.
- **"Enterprise-ready at scale"** — Best for Series C. They're going upmarket and need enterprise-grade tooling.

Save to the specified output path as markdown, or print to stdout.

Optionally export to Google Sheet using the google-sheets-write capability.

## Helper Script

A standalone Python script is included for searching Hacker News specifically for funding signals:

```bash
# Search HN for Series A and B announcements in last 7 days
python3 skills/funding-signal-monitor/scripts/search_funding.py \
  --stages "Series A,Series B" --days 7 --output json

# Filter to high-engagement posts only
python3 skills/funding-signal-monitor/scripts/search_funding.py \
  --stages "Series A,Series B,Series C" --days 14 --min-points 10 --output text

# Search all stages with industry keyword
python3 skills/funding-signal-monitor/scripts/search_funding.py \
  --stages "Series A" --days 7 --keywords "AI,fintech" --output json
```

## AI Agent Integration

When using this skill as an agent, the typical flow is:

1. User specifies target stages, optional industry filter, optional min amount
2. Agent runs multi-source search (Phase 2) in parallel
3. Agent consolidates and scores results (Phase 3)
4. Agent presents ranked list with outreach angles
5. User selects companies to pursue
6. Agent chains to `company-contact-finder` to find decision-makers
7. Agent chains to `cold-email-outreach` to launch outreach

**Example prompt:**
> "Find companies that raised Series A or B in the last week. Focus on SaaS and AI companies. We sell developer tools."

The agent should:
- Run all source searches
- Consolidate and score
- Present the top 10-15 companies with reasoning
- Suggest next steps (find contacts, launch outreach)

The agent should NOT:
- Do any outreach without user confirmation
- Skip the scoring/qualification step
- Rely on a single source (multi-source coverage is the point)

## Tips

- **Run weekly** for best coverage. Funding announcements have a ~1 week news cycle.
- **Combine with `company-contact-finder`** to get CTO/VP Eng contacts at funded companies.
- **Chain into `cold-email-outreach`** for automated outreach with funding-specific angles.
- **Track hits in `contact-cache`** to avoid duplicate outreach across weeks.
- **Web Search is your best source** — it aggregates TechCrunch, Crunchbase, VentureBeat, etc. Twitter and HN provide supplementary signals and early detection.
- **Multi-source appearances are the strongest signal.** A company that shows up on TechCrunch AND Hacker News AND Twitter is a higher-quality lead.

## Troubleshooting

### "No results found"
- Broaden your stages (add Seed or Series C)
- Extend lookback to 14 or 30 days
- Remove industry filter
- Check that scraper dependencies are installed

### "Too many results"
- Add an industry filter
- Increase min-amount
- Reduce lookback days
- Focus on Series B+ (fewer but larger rounds)

### "Twitter scraper failing"
- Check APIFY_API_TOKEN is set
- Fall back to Web Search + HN only (still effective)
- Twitter is supplementary — the skill works without it

## Links

- [HN Algolia API](https://hn.algolia.com/api)
- [Apify Console](https://console.apify.com)
- [Crunchbase](https://www.crunchbase.com) (for manual verification)
