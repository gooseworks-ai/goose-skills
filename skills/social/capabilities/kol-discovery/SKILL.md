---
name: kol-discovery
description: >
  Find Key Opinion Leaders (KOLs) in a given domain by combining web research
  with LinkedIn post search. Given a company/idea and target domain, generates
  authority keywords, searches LinkedIn posts to find prolific authors with
  high engagement, and merges with web-researched influencers. Use when someone
  wants to "find influencers in X space" or "who are the KOLs for Y industry."
tags: [outreach]
---

# KOL Discovery

Find Key Opinion Leaders in any domain by searching LinkedIn posts for prolific, high-engagement authors and merging with web-researched influencers.

**Core principle:** Search for **authority/thought-leadership keywords**, not pain-language. We want people who shape conversation in the space — conference speakers, newsletter writers, podcast hosts, and prolific LinkedIn posters.

## Phase 0: Intake

Ask the user these questions:

### Domain & Audience

1. What does your company/product do? What space are you in?
2. What specific domain or topic are the KOLs you want to find expert in?
3. Who is your target audience? (The people the KOLs influence)
4. Any KOLs you already know about? (LinkedIn URLs — these become the baseline)
5. Anyone to EXCLUDE? (Competitors, your own team, irrelevant voices)

## Phase 1: Generate Domain Keywords

Based on intake, generate 15-25 topic/authority keywords. These are NOT pain-language — they're the terms thought leaders use when sharing expertise:

- **Industry terms** — "freight tech", "supply chain innovation"
- **Thought leadership signals** — "lessons learned in logistics", "future of dispatch"
- **Conference/event terms** — "supply chain summit keynote"
- **Content creator signals** — "newsletter freight", "podcast logistics"

Also generate:
- **KOL title keywords** — titles that signal thought leadership (vp, founder, analyst, editor, host)
- **Vendor exclusion keywords** — titles to filter out (software engineer, recruiter, saas)
- **Domain relevance keywords** — core industry terms for relevance scoring

**Present keywords to user for approval before running.**

Save config in the current working directory or wherever the user prefers:

Config JSON structure:
```json
{
  "client_name": "example",
  "domain_keywords": ["\"freight tech\" thought leadership", "supply chain innovation"],
  "exclusion_patterns": ["hiring.*position", "we.re recruiting"],
  "kol_title_keywords": ["vp", "founder", "analyst", "editor", "host"],
  "vendor_exclude_keywords": ["software engineer", "saas", "recruiter"],
  "domain_relevance_keywords": ["freight", "logistics", "supply chain"],
  "country_filter": "",
  "max_posts_per_keyword": 50,
  "min_posts": 2,
  "min_total_engagement": 50,
  "top_n_kols": 50
}
```

## Phase 2: Run KOL Discovery Pipeline

```bash
python3 skills/kol-discovery/scripts/kol_discovery.py \
  --config kol-discovery.json \
  --output-dir . \
  [--test] [--web-kols kol-web-kols.json] [--yes]
```

**Flags:**
- `--config` (required) — path to client config JSON
- `--output-dir` — directory for output CSV (default: current working directory)
- `--test` — limit to 5 keywords (validation run)
- `--web-kols` — path to web-researched KOL JSON (agent generates this)
- `--yes` — skip cost confirmation prompts
- `--max-runs` — override Apify run limit

**What the script does:**

1. **Keyword search** — `apimaestro/linkedin-posts-search-scraper-no-cookies` for each domain keyword
2. **Author aggregation** — Group posts by author, compute engagement metrics
3. **Scoring** — Composite KOL score: engagement volume (log-scaled) + consistency (post count) + quality (avg engagement) + relevance (keyword breadth) + web research bonus
4. **Merge** — Combine post-data KOLs with web-researched KOLs, flag overlaps
5. **Export** — Ranked CSV

**Cost estimate:** ~$0.10 per keyword. Full run with 20 keywords: ~$2-3.

**Always run with `--test` first.**

## Phase 2b: Web Research (Agent-Driven)

Before or alongside the script, do web research to find known KOLs:
- Search for "top [industry] influencers on LinkedIn"
- Find conference speakers, newsletter authors, podcast hosts
- Check industry publications for frequent contributors

Save as JSON in the current working directory:

```json
[
  {
    "name": "Jane Doe",
    "linkedin_url": "https://www.linkedin.com/in/janedoe/",
    "source": "FreightWaves conference speaker 2025",
    "notes": "Hosts weekly logistics podcast"
  }
]
```

Pass to script via `--web-kols`.

## Phase 3: Review & Refine

Present results:
- **Top 20 KOLs** — rank, name, headline, KOL score, total engagement, top post
- **Source breakdown** — how many from post-data vs web-research vs both
- **Keyword performance** — which keywords surfaced the most KOLs

Common adjustments:
- **Too many irrelevant authors** — refine domain keywords, add exclusion patterns
- **Missing known KOLs** — add more keyword variants, expand web research
- **Too few results** — lower `min_posts` or `min_total_engagement` thresholds

## Phase 4: Output

CSV exported to the current working directory:

| Column | Description |
|--------|-------------|
| Rank | Overall rank by KOL Score |
| Name | Full name |
| LinkedIn URL | Profile link |
| Headline | From LinkedIn |
| KOL Score | Composite score |
| Total Posts | Posts found in search |
| Total Reactions | Sum of reactions across posts |
| Total Comments | Sum of comments across posts |
| Avg Engagement | Average reactions+comments per post |
| Top Post URL | Highest engagement post |
| Top Post Preview | First 100 chars of top post |
| Source | post-data / web-research / both |

## Tools Required

- **Apify API token** — set as `APIFY_API_TOKEN` in `.env`
- **Apify actors used:**
  - `apimaestro/linkedin-posts-search-scraper-no-cookies` (keyword search)

## Example Usage

**Trigger phrases:**
- "Find KOLs in the freight/logistics space"
- "Who are the influencers in [industry]?"
- "Discover thought leaders for [domain]"
- "Run KOL discovery for [client]"

**With existing config:**
```bash
python3 skills/kol-discovery/scripts/kol_discovery.py \
  --config clients/example/configs/kol-discovery.json \
  --output-dir clients/example/leads --yes
```
