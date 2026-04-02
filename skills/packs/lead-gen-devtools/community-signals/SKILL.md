---
name: community-signals
description: Extract leads from developer forums (Hacker News, Reddit) by detecting intent signals — alternative seeking, competitor pain, scaling challenges, DIY solutions, and migration intent. Scores users by intent strength and cross-platform presence.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Grep, Glob, WebSearch
argument-hint: [queries-json-path]
---

# Community Signals

Extract high-intent leads from developer community forums by detecting buying signals in public discussions. Currently supports Hacker News and Reddit.

## When to Use

- User wants to find leads from developer communities or forums
- User wants to identify people publicly expressing pain with competitors
- User wants to find people asking "what tool should I use for X"
- User mentions Hacker News, Reddit, Stack Overflow, or developer forums as lead sources
- User describes prospects who discuss tools, complain about solutions, or ask for recommendations in public forums
- User wants to find developers who built DIY/hacky solutions for problems the user's product solves

## Prerequisites

- Python 3.9+ with `requests` and optionally `python-dotenv`
- Apify API token in `.env` (for Reddit scraping)
- No auth needed for Hacker News (free Algolia API)
- Working directory: the project root containing this skill

## Phase 1: Collect Context

### Step 1: Gather Product & ICP Information

Ask the user for the following. Do NOT proceed without this — the entire query generation depends on it.

> "To find the right leads from developer communities, I need to understand:
> 1. **What does your product do?** (one-liner)
> 2. **Who are your competitors?** (list the main ones)
> 3. **What specific problems does your product solve?** (the pain points)
> 4. **Who is your ideal buyer?** (role, company type, tech stack)
> 5. **Any specific technologies or keywords** associated with your space?"

If the user has already provided this context (e.g., from running the github-repo-signals skill), use that — don't ask again.

## Phase 2: Generate Search Queries

### Step 2: Generate Queries Across 9 Categories

Based on the user's product info, generate 3-5 search queries per category. These are the fixed categories — do not skip any:

**Category 1: Alternative Seeking** (intent score: 9)
People actively looking to switch tools.
- Pattern: "[competitor] alternative", "alternative to [competitor]", "looking for [product type]"
- Example: "twilio alternative", "alternative to agora", "looking for video SDK"

**Category 2: Competitor Pain** (intent score: 8)
People frustrated with a specific competitor.
- Pattern: "[competitor] issues", "frustrated with [competitor]", "[competitor] doesn't support"
- Example: "twilio video quality issues", "frustrated with agora pricing", "vonage api unreliable"

**Category 3: Problem Space Questions** (intent score: 6)
People trying to solve the exact problem the product addresses.
- Pattern: "how to [thing product does]", "best way to [problem]", "recommendations for [category]"
- Example: "how to add video calling to app", "best webrtc framework", "real-time communication SDK"

**Category 4: Tool Comparison** (intent score: 8)
People actively comparing options — in buying mode.
- Pattern: "[competitor A] vs [competitor B]", "comparing [tools]", "which [product type] should I use"
- Example: "twilio vs agora", "comparing video APIs", "which webrtc platform"

**Category 5: DIY / Built Own Solution** (intent score: 9)
People who built a custom solution — validated the need, would pay for a proper product.
- Pattern: "I built my own [thing]", "Show HN: [thing product replaces]", "custom [solution type]"
- Example: "I built my own video conferencing", "Show HN: open source video call", "custom webrtc server"

**Category 6: Scaling Challenges** (intent score: 7)
People hitting limits that the product solves.
- Pattern: "[problem] at scale", "scaling [thing]", "[thing] breaks with many users"
- Example: "webrtc scaling issues", "video calls lagging with 50+ participants", "scaling real-time communication"

**Category 7: Migration Intent** (intent score: 9)
People who have already decided to leave — looking for where to go.
- Pattern: "migrating from [competitor]", "moving away from [competitor]", "switching from [competitor]"
- Example: "migrating from twilio video", "moving away from agora", "switching video API providers"

**Category 8: Budget / Pricing Pain** (intent score: 7)
Cost is the trigger — open to cheaper or better-value alternatives.
- Pattern: "[competitor] too expensive", "[competitor] pricing", "cheaper alternative to [competitor]"
- Example: "twilio too expensive", "agora pricing 2026", "cheaper video API"

**Category 9: Feature Gap Complaints** (intent score: 7)
Needs something their current tool doesn't do — and the user's product does.
- Pattern: "does [competitor] support [feature]", "[competitor] missing [feature]", "wish [competitor] had"
- Example: "does twilio support recording", "agora missing breakout rooms", "wish vonage had better docs"

### Step 3: Discover Relevant Subreddits

Do a web search to find subreddits where the user's ICP is active. Search for:
- "[product category] subreddit"
- "[technology] subreddit"
- "[competitor name] subreddit"

Common developer subreddits to consider (pick the relevant ones):
- r/programming, r/webdev, r/devops, r/selfhosted
- r/kubernetes, r/aws, r/googlecloud, r/azure
- r/node, r/python, r/golang, r/rust
- r/startups, r/SaaS, r/entrepreneur
- r/sysadmin, r/networking
- Technology-specific: r/VOIP, r/machinelearning, r/dataengineering, etc.

Select 5-10 subreddits most relevant to the user's space.

### Step 4: Present Queries for Review

Present ALL generated queries to the user in a structured table:

```
Category                  | Queries
--------------------------|------------------------------------------
Alternative Seeking       | "twilio alternative", "agora alternative", ...
Competitor Pain           | "twilio issues", "frustrated with agora", ...
...                       | ...

Subreddits to scan: r/webdev, r/VOIP, r/programming, ...
```

Ask:
> "Here are the search queries I've generated. Would you like to:
> 1. Run with these as-is
> 2. Add or remove specific queries
> 3. Add or remove subreddits
>
> Estimated cost: HN is free. Reddit via Apify will cost approximately $[estimate based on query count x ~$0.05 per query]."

Wait for user approval before proceeding.

### Step 5: Save Queries File

Once approved, save the queries as a JSON file:

```bash
cat > ${CLAUDE_SKILL_DIR}/../.tmp/community_queries.json << 'QUERIESEOF'
{
    "product": "Product Name",
    "queries": [
        {"category": "alternative_seeking", "query": "twilio alternative"},
        {"category": "alternative_seeking", "query": "agora alternative"},
        {"category": "competitor_pain", "query": "twilio video quality issues"}
    ],
    "subreddits": ["r/webdev", "r/VOIP", "r/programming"]
}
QUERIESEOF
```

## Phase 3: Execute Scan

### Step 6: Verify Environment

```bash
python3 -c "import requests; print('OK')"
```

### Step 7: Run the Tool

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/community_signals.py \
    --queries ${CLAUDE_SKILL_DIR}/../.tmp/community_queries.json \
    --days 30 \
    --max-reddit-posts 50 \
    --max-reddit-comments 20 \
    --output ${CLAUDE_SKILL_DIR}/../.tmp/community_signals.csv
```

The tool will:
1. Search Hacker News (stories + comments) for all queries — free
2. Search Reddit via Apify for all queries + scan subreddits — pay per result
3. Filter to last 30 days
4. Deduplicate users across platforms
5. Score by intent strength, signal count, category diversity, and cross-platform presence
6. Fetch HN user profiles (karma, bio) — free
7. Export two CSV files: `_users.csv` and `_signals.csv`

**Optional flags:**
- `--skip-reddit` — only search HN (free, for testing)
- `--skip-hn` — only search Reddit
- `--days 7` — narrower time window for very fresh signals

## Phase 4: Analyze & Recommend

### Step 9: Analyze the Results

Read the output CSV files and present a structured briefing:

**9a. Overall Stats**
- Total signals found (HN + Reddit)
- Unique users
- Split by platform (HN vs Reddit)
- Cross-platform matches (same username on both)

**9b. Signal Category Breakdown**
- How many signals per category
- Which categories produced the most results
- Which categories had the highest-engagement posts (upvotes, comments)

**9c. Top Subreddits Discovered**
- Which subreddits appeared most frequently
- This tells the user where their prospects hang out — valuable for community marketing, not just outreach

**9d. Highest-Intent Users**
- List top 15-20 users by composite score
- For each: username, platform, categories they appeared in, sample post/comment, engagement
- Flag cross-platform users prominently

**9e. Common Themes**
- What are people specifically asking for or complaining about?
- Any patterns in the pain points that the user's product addresses?
- Any surprising findings (e.g., a competitor getting mentioned negatively much more than others)?

### Step 10: Recommend Next Steps

Based on findings + user's product context:

1. **If strong signals found (>50 high-intent users):**
   - Recommend enriching top users via SixtyFour
   - For HN users: use their HN bio/karma + username for enrichment context
   - For Reddit users: username is the only identifier — enrichment hit rates may be lower
   - Suggest starting with HN users (more likely to have real names in bio)

2. **If cross-platform matches found:**
   - These are highest priority — someone active on both HN and Reddit in your space is deeply engaged
   - Recommend enriching these first

3. **If specific subreddits emerged as hotspots:**
   - Recommend ongoing monitoring of those subreddits
   - Suggest the user consider community engagement (commenting, answering questions) in those subreddits

4. **If "alternative seeking" or "migration intent" signals dominate:**
   - These are the most time-sensitive leads — they're actively evaluating RIGHT NOW
   - Recommend immediate outreach

5. **If "DIY / built own" signals found:**
   - These are the highest-quality leads — they've validated the need
   - Recommend personalized outreach referencing their project

6. **Always include:**
   - Cost estimate for enrichment
   - Suggested outreach angle per signal category
   - Reminder that community forum users respond better to helpful engagement than cold outreach

### Step 11: Ask for Go-Ahead

> "Would you like me to:
> 1. Enrich the top [N] users via SixtyFour (estimated cost: $X)
> 2. Run a deeper scan on the hotspot subreddits
> 3. Export this data for manual review first
> 4. Combine these results with GitHub signals data (if available)"

Wait for user confirmation.

## Output Schema

**`community_signals_users.csv`** — One row per unique user across all platforms

| Column | Description |
|--------|-------------|
| username | Forum username |
| platform | hackernews or reddit |
| composite_score | Overall lead score (intent + diversity + cross-platform) |
| intent_score | Sum of category-weighted intent scores |
| signal_count | Number of matching posts/comments |
| categories | Which signal categories they appeared in |
| platforms_active | Which platforms they were found on |
| subreddits | Reddit subreddits they posted in |
| hn_karma | HN karma score (HN users only) |
| hn_bio | HN profile bio (HN users only) |
| total_engagement | Sum of upvotes + comments across their signals |
| first_seen | Earliest matching post/comment |
| latest_seen | Most recent matching post/comment |
| sample_url | Link to one of their matching posts |

**`community_signals_signals.csv`** — One row per matching post/comment

| Column | Description |
|--------|-------------|
| platform | hackernews or reddit |
| author | Username |
| category | Signal category code |
| category_label | Human-readable category name |
| content_type | story, comment, or post |
| title | Post/story title |
| text | Post/comment body (truncated) |
| subreddit | Reddit subreddit (if applicable) |
| score | Upvotes |
| num_comments | Comment count |
| created_at | Date posted |
| query_matched | Which search query found this |
| url | Permalink to the post/comment |

## Scoring System

**Intent scores by category:**
| Category | Score per Signal |
|----------|-----------------|
| Alternative Seeking | 9 |
| DIY / Built Own | 9 |
| Migration Intent | 9 |
| Competitor Pain | 8 |
| Tool Comparison | 8 |
| Scaling Challenge | 7 |
| Budget / Pricing | 7 |
| Feature Gap | 7 |
| Problem Space | 6 |

**Composite score bonuses:**
- +2 per unique category the user appeared in (diversity)
- +10 if user found on multiple platforms (cross-platform)
- +2 per signal (capped at +10)

## Cost Estimates

| Platform | Cost | Notes |
|----------|------|-------|
| Hacker News | **Free** | Algolia API, 10k req/hr |
| Reddit (Apify) | ~$0.004/result + $0.04/run | Pay per result |
| **Typical run** (45 queries) | **~$5-10 total** | HN free + Reddit ~$5-10 |

## Limitations

- **Reddit comments:** Can't search comments directly — finds posts first, then fetches comments on those posts. Some comment-only discussions may be missed.
- **Reddit date filter:** No native date range parameter in Apify actor. Filtering happens in post-processing using `created_at` timestamps.
- **User identity:** Forum usernames are pseudonymous. Enrichment hit rates will be lower than GitHub (where people often use real names). HN users are more identifiable (many put real names in bio).
- **Rate limits:** HN Algolia: 10k req/hr. Apify: depends on plan.
