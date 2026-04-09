---
name: topical-authority-mapper
description: >
  Map complete topic clusters for any subject area — hub pages, spoke articles,
  supporting content, internal linking architecture. Identifies content gaps,
  priority order, and builds a structured content calendar. Produces topic maps
  that build genuine topical authority, not random blog posts.
tags: [seo]
---

# Topical Authority Mapper

Most content strategies are just keyword lists turned into blog posts. Real topical authority requires a structured map: pillar pages that own broad topics, cluster pages that go deep on subtopics, and an internal linking architecture that tells Google "we comprehensively cover this subject." This skill builds that map.

**Core principle:** Google rewards topical depth, not random keyword coverage. A site with 15 interlinked articles that thoroughly cover "sales automation" will outrank a site with 50 unrelated blog posts that happen to mention the phrase. This skill builds the cluster architecture that creates genuine authority.

## When to Use

- "What content should we create to dominate [topic]?"
- "Build a topic cluster strategy for our blog"
- "Map out our topical authority for [category]"
- "Create a content calendar based on topic clusters"
- "What content gaps do we have?"

## Tool Enhancement (Optional)

Topic cluster mapping is significantly better with keyword data that shows search volume, difficulty, and semantic relationships across hundreds of subtopic variations.

### Agent Prompt to User

> "I can build a comprehensive topical authority map using competitive analysis and content gap identification. For the most precise results — especially accurate volume data and keyword clustering at scale — I'd recommend connecting a keyword data API."
>
> **Recommended: DataForSEO** (pay-per-use, ~$0.01/keyword, no monthly minimum)
> - Sign up at dataforseo.com → get API login + password
> - Set `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` env vars
>
> **Alternatives that also work:**
> - **Keywords Everywhere API** ($1 per 10 credits = 100K keywords, very cheap) → set `KEYWORDS_EVERYWHERE_API_KEY`
> - **SEMrush API** (if you have a subscription) → set `SEMRUSH_API_KEY`
> - **Ahrefs API** (if you have a subscription) → set `AHREFS_API_TOKEN`
>
> "Want to use one of these, or should I proceed with baseline mode? Baseline uses our existing SEO tools and web research — still produces a strong topic map, but with less granular volume data per subtopic."

### Mode Selection

- **Enhanced mode** — Bulk keyword data via DataForSEO / Keywords Everywhere / SEMrush / Ahrefs. Gets search volume, difficulty, and semantic grouping for every subtopic. Enables data-driven prioritization and precise gap identification. Also supports keyword clustering APIs that automatically group related terms.
- **Baseline mode** — Uses `seo-domain-analyzer` for domain metrics, `web_search` for topic research, `reddit-post-finder` for question mining, competitor analysis via `site-content-catalog`. Topic mapping and cluster architecture are equally strong. Volume estimates are directional rather than exact.

## Phase 0: Intake

1. **Your site URL** — For existing content audit
2. **Target topics** — 1-5 broad topic areas you want authority in (e.g., "sales automation", "content marketing", "data privacy")
3. **Competitors** — 2-5 competitor URLs who rank well for these topics
4. **ICP** — Who reads your content? (role, pain, goal)
5. **Content capacity** — How many articles can your team produce per month?
6. **Existing content** — Do you have a blog? How many articles? (we'll audit it)
7. **Time horizon** — 3-month plan? 6-month? 12-month?
8. **Tool preference** — Enhanced mode with keyword API, or baseline? (see Tool Enhancement above)

## Phase 1: Current State Audit

### 1A: Your Existing Content

Run `site-content-catalog` on your site:

```bash
python3 skills/site-content-catalog/scripts/catalog_content.py \
  --url "<your_site_url>" \
  --output json
```

Map all existing content:
- Blog posts by topic
- Resource pages, guides, glossary
- Landing pages with content
- Identify which topics you already have content for
- Note: thin pages, outdated content, orphan pages (no internal links)

### 1B: Competitor Content Mapping

For each competitor, run `site-content-catalog`:

```bash
python3 skills/site-content-catalog/scripts/catalog_content.py \
  --url "<competitor_url>" \
  --output json
```

Map their content architecture:
- How do they structure topic clusters?
- Which topics have pillar pages?
- How deep do their clusters go?
- Internal linking patterns
- Content freshness (update dates)

### 1C: Domain Authority Baseline

Run `seo-domain-analyzer` for your site and competitors:

- Your domain authority vs. competitors
- Keyword overlap analysis
- Where competitors rank that you don't

## Phase 2: Topic Universe Expansion

### 2A: Subtopic Discovery

For each target topic area, generate the full subtopic universe:

**Enhanced mode (DataForSEO / Keywords Everywhere):**

```
# DataForSEO keyword suggestions
POST /v3/dataforseo_labs/google/keyword_suggestions/live
{
  "keyword": "<topic>",
  "limit": 500
}

# DataForSEO related keywords
POST /v3/dataforseo_labs/google/related_keywords/live
{
  "keyword": "<topic>",
  "limit": 500
}
```

Extract:
- All related keywords and questions
- Search volumes per keyword
- Keyword difficulty scores
- Semantic groups (auto-clustered by meaning)

**Baseline mode:**

Use multiple sources to build the subtopic list:
- `web_search` for "topic + [what/how/why/best/vs/guide/examples]"
- `reddit-post-finder` for questions people ask about the topic
- Google autocomplete patterns (via web search)
- Competitor content titles (from Phase 1B)
- PAA questions from search results

### 2B: Question Mining

Run `reddit-post-finder` for each topic area:

```bash
python3 skills/reddit-post-finder/scripts/search_reddit.py \
  --subreddit "<relevant_subs>" \
  --keywords "<topic>" \
  --days 365 --sort top --time year
```

Extract:
- Questions people ask (→ individual article topics)
- Recurring themes (→ cluster pillars)
- Misconceptions (→ myth-busting content)
- Comparisons people make (→ vs/ content)
- Use cases discussed (→ use-case content)

### 2C: Keyword Clustering

Group all discovered keywords/subtopics into semantic clusters:

**Enhanced mode:** Use DataForSEO keyword clustering API or group by SERP overlap (keywords that share 3+ ranking URLs likely belong to the same cluster).

**Baseline mode:** Manual semantic grouping based on:
- Shared root concepts
- User intent alignment (informational / commercial / navigational)
- Topic hierarchy (broad → specific)

## Phase 3: Cluster Architecture

### 3A: Pillar-Cluster Mapping

For each topic area, design the cluster hierarchy:

```
PILLAR: [Broad Topic] — "The Complete Guide to [Topic]"
│
├── CLUSTER 1: [Subtopic Group A]
│   ├── Article: [Specific subtopic A1]
│   ├── Article: [Specific subtopic A2]
│   └── Article: [Specific subtopic A3]
│
├── CLUSTER 2: [Subtopic Group B]
│   ├── Article: [Specific subtopic B1]
│   ├── Article: [Specific subtopic B2]
│   └── Article: [Specific subtopic B3]
│
├── CLUSTER 3: [Subtopic Group C]
│   ├── Article: [Specific subtopic C1]
│   └── Article: [Specific subtopic C2]
│
└── SUPPORTING: [Glossary terms, FAQs, tools]
    ├── Glossary: [Term 1]
    ├── Glossary: [Term 2]
    └── FAQ: [Common questions]
```

### 3B: Content Type Assignment

For each piece in the cluster:

| Content Type | When to Use | Typical Word Count |
|-------------|-------------|-------------------|
| **Pillar page** | Broad topic overview, links to all cluster content | 3,000-5,000+ |
| **Cluster article** | Deep dive on subtopic | 1,500-3,000 |
| **Comparison post** | vs/ or alternatives content | 2,000-3,500 |
| **How-to guide** | Step-by-step instruction | 1,500-2,500 |
| **Glossary entry** | Definition + context | 500-1,000 |
| **Tool/Calculator** | Interactive resource | 500 + tool |
| **Case study** | Proof point | 1,000-2,000 |
| **Listicle** | Curated collection | 1,500-3,000 |

### 3C: Internal Linking Architecture

Design the linking structure:

1. **Pillar → All cluster articles** (every cluster article gets a link from the pillar)
2. **Cluster articles → Pillar** (every article links back to the pillar)
3. **Cluster articles ↔ Related cluster articles** (cross-links within the cluster)
4. **Cross-cluster links** where topics overlap
5. **Supporting content → Relevant cluster articles** (glossary terms link to articles that explain them in depth)

Map specific anchor text for each link.

## Phase 4: Gap Analysis & Prioritization

### 4A: Coverage Gap Matrix

| Subtopic | Your Content | Competitor A | Competitor B | Volume | Difficulty | Gap? |
|----------|-------------|-------------|-------------|--------|-----------|------|
| [subtopic 1] | ✗ None | ✓ Pillar page | ✓ Blog post | [vol] | [diff] | ✓ High priority |
| [subtopic 2] | ✓ Thin post | ✓ Deep guide | ✗ None | [vol] | [diff] | ✓ Update needed |
| [subtopic 3] | ✓ Strong guide | ✓ Similar | ✓ Similar | [vol] | [diff] | ✗ Covered |
| [subtopic 4] | ✗ None | ✗ None | ✗ None | [vol] | [diff] | ✓ White space |

### 4B: Priority Scoring

Score each content piece to create:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Search volume** | 25% | Monthly search demand |
| **Competitive gap** | 25% | How much better can you be than what exists? |
| **Intent alignment** | 20% | Does the searcher match your ICP? |
| **Cluster completeness** | 15% | Does this fill a critical gap in a cluster? |
| **Effort** | 15% | How much work to create high-quality content? |

### 4C: Content Calendar

Based on content capacity and priority scores:

**Month 1:** Build [N] pillar foundations
- [Pillar 1] — [rationale]
- [3-5 highest-priority cluster articles]

**Month 2:** Deepen Cluster 1, start Cluster 2
- [5-8 articles] — [rationale]

**Month 3:** Complete Cluster 2, begin Cluster 3
- [5-8 articles] — [rationale]

**Months 4-6:** Expansion
- [Continue pattern based on capacity]

## Phase 5: Output

```markdown
# Topical Authority Map — [Site/Client] — [DATE]

## Executive Summary
- Topic areas mapped: [N]
- Total content pieces identified: [N] (pillars: [N], clusters: [N], supporting: [N])
- Existing content: [N] pages ([N] strong, [N] need updates, [N] gaps)
- Net new content needed: [N] pages
- Estimated timeline to full coverage: [N] months at [N] articles/month

---

## Topic Map: [Topic Area 1]

### Cluster Architecture
[Visual tree structure per Phase 3A]

### Pillar Page
- **Target keyword:** [keyword] ([volume]/mo, [difficulty])
- **Title:** [recommended title]
- **Content type:** Comprehensive guide
- **Word count target:** [X]-[Y]
- **Links to:** [all cluster articles listed]
- **Status:** [Exists — needs update / New — priority [P0/P1/P2]]

### Cluster: [Subtopic Group A]

#### Article: [Subtopic A1]
- **Target keyword:** [keyword] ([volume]/mo, [difficulty])
- **Content type:** [how-to / comparison / listicle / etc.]
- **Word count target:** [X]-[Y]
- **Links to:** Pillar + [related articles]
- **Links from:** Pillar + [related articles]
- **Priority:** [P0/P1/P2]
- **Anchor text:** "[anchor]" from pillar, "[anchor]" from [related article]

#### Article: [Subtopic A2]
...

### Cluster: [Subtopic Group B]
...

---

## Topic Map: [Topic Area 2]
...

---

## Internal Linking Matrix

| From ↓ / To → | Pillar | Article A1 | Article A2 | Article B1 | ... |
|----------------|--------|-----------|-----------|-----------|-----|
| **Pillar** | — | ✓ "[anchor]" | ✓ "[anchor]" | ✓ "[anchor]" | |
| **Article A1** | ✓ "[anchor]" | — | ✓ "[anchor]" | | |
| **Article A2** | ✓ "[anchor]" | ✓ "[anchor]" | — | | |
| **Article B1** | ✓ "[anchor]" | | | — | |

---

## Content Calendar

### Month 1: Foundation
| Week | Content Piece | Type | Cluster | Keywords | Priority |
|------|--------------|------|---------|----------|----------|
| W1 | [Pillar: Topic 1] | Pillar page | — | [kw] ([vol]) | P0 |
| W1 | [Article A1] | Cluster article | A | [kw] ([vol]) | P0 |
| W2 | [Article A2] | Cluster article | A | [kw] ([vol]) | P0 |
| W2 | [Article B1] | Cluster article | B | [kw] ([vol]) | P0 |

### Month 2: Depth
...

### Month 3: Expansion
...

---

## Coverage Gap Report

### High Priority (Competitors rank, you don't)
| Topic | Competitor Coverage | Your Status | Volume | Recommended Action |
|-------|-------------------|-------------|--------|--------------------|
| [topic] | A: Pillar, B: Blog post | None | [vol] | Create [content type] |

### Medium Priority (Weak coverage)
| Topic | Your Current Page | Issue | Volume | Recommended Action |
|-------|------------------|-------|--------|--------------------|
| [topic] | [URL] | Thin (400 words) | [vol] | Expand to [X] words, add [sections] |

### Existing Content Updates Needed
| URL | Issue | Action Required | Effort |
|-----|-------|----------------|--------|
| [url] | Outdated (2023 data) | Update stats, refresh examples | 2 hours |
| [url] | No internal links | Add [N] links to cluster articles | 30 min |
| [url] | Missing from pillar | Add link from pillar with "[anchor]" | 15 min |

---

## Metrics to Track
- **Topical coverage %** — Articles created vs. total identified
- **Internal link density** — Avg links per article within cluster
- **Cluster ranking velocity** — Time from publish to page 1 per cluster
- **Pillar page rankings** — Position for head terms
- **Organic traffic by cluster** — Traffic attributed to each topic cluster
```

Save to the current working directory or wherever the user prefers.

For large topic maps (3+ topic areas), also export a summary CSV:
`content-calendar-[YYYY-MM-DD].csv`

## Cost

| Component | Cost |
|-----------|------|
| Site catalog (your site, once) | ~$0.05-0.10 |
| Site catalog per competitor | ~$0.05-0.10 |
| SEO domain analyzer | ~$0.10-0.20 |
| Reddit scraper (per topic area) | ~$0.05-0.10 |
| DataForSEO keyword data (enhanced) | ~$0.50-3.00 (depending on keyword count) |
| Keywords Everywhere (enhanced alt) | ~$0.01-0.10 |
| Page fetches (competitor content analysis) | ~$0.01-0.05 |
| Analysis | Free (LLM reasoning) |
| **Total per topic area (baseline)** | **~$0.25-0.50** |
| **Total per topic area (enhanced)** | **~$0.75-3.50** |
| **3 topic areas (baseline)** | **~$0.75-1.50** |
| **3 topic areas (enhanced)** | **~$2.25-10.50** |

## Tools Required

- **Apify API token** — `APIFY_API_TOKEN` env var
- **Upstream skills:** `site-content-catalog`, `seo-domain-analyzer`, `reddit-post-finder`, `fetch_webpage`
- **Optional (enhanced):** DataForSEO (`DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD`), Keywords Everywhere (`KEYWORDS_EVERYWHERE_API_KEY`), SEMrush (`SEMRUSH_API_KEY`), or Ahrefs (`AHREFS_API_TOKEN`)

## Scheduling

For ongoing topical authority tracking:
- Run quarterly to reassess coverage gaps
- Monthly: check for new subtopics emerging in the space
- After each content batch: update the map with published URLs and internal links

## Trigger Phrases

- "Map our topical authority for [topic]"
- "Build a topic cluster strategy"
- "What content gaps do we have?"
- "Create a content calendar for SEO"
- "How do we build authority in [topic area]?"
- "Plan our content architecture"
