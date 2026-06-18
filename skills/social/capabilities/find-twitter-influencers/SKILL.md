---
name: find-twitter-influencers
description: Find Twitter/X influencers to promote a product or brand. Use when asked to find influencers, discover Twitter accounts for partnerships, identify creators in a niche, or build an influencer outreach list.
source: orthogonal
---


# Find Twitter Influencers

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Discover, score, and enrich Twitter/X influencers relevant to a company, product, or niche. Returns a ranked list with engagement metrics, relevance reasoning, and contact info.

## Workflow

### 1. Parse the Request

Extract from the user's query:
- **Company name or domain** (required) — the brand seeking influencers
- **Niche/vertical** (optional) — e.g., "fintech Twitter", "AI/ML creators", "DTC beauty"
- **Size preference** (optional) — mid-tier (10K-100K), macro (100K+), or mixed (default: 10K+ minimum)
- **Max results** (optional, default 20 — scale up or down if the user asks)

### 2. Resolve the Company

Use Brand.dev to get domain, industry, description, target audience, and keywords. This context drives all subsequent searches.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve-by-name","query":{"name":"Acme","Corp":""}}'
```

If a domain is provided directly:
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"brand-dev","path":"/v1/brand/retrieve","query":{"domain":"acme.com"}}'
```

From the result, build a **company context string**: company name, domain, industry, description, and target audience keywords. Example: `"Acme Corp acme.com developer tools API platform engineering teams"`. Use this in all search queries.

### 3. Discover Candidates

Run three strategies **in parallel** to maximize coverage:

**Strategy A — Exa search for curated influencer lists** (primary, highest signal):

IMPORTANT: x.com and twitter.com profiles are NOT in Exa's search index, so `includeDomains: ["x.com"]` will return zero Twitter results. Instead, search for curated list pages, blog posts, and articles about influencers in the niche. Use `contents.text` to get the page content so you can extract Twitter handles from it.

Run 5+ query variations to maximize coverage. Include the **core niche** AND **adjacent niches** — many influencers span related topics. Each query returns 10 results with text content:

```bash
# Query 1: Core niche — curated lists
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "best {niche} Twitter accounts to follow",
  "numResults": 10,
  "contents": {"text": {"maxCharacters": 5000}}
}'

# Query 2: Core niche — different phrasing
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "top {industry} influencers on X Twitter must follow",
  "numResults": 10,
  "contents": {"text": {"maxCharacters": 5000}}
}'

# Query 3: Core niche — thought leaders
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "{niche} thought leaders creators Twitter handles",
  "numResults": 10,
  "contents": {"text": {"maxCharacters": 5000}}
}'

# Query 4: Adjacent niche 1 (e.g., if niche is "identity verification", try "fraud prevention")
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "top {adjacent_niche_1} influencers Twitter accounts to follow",
  "numResults": 10,
  "contents": {"text": {"maxCharacters": 5000}}
}'

# Query 5: Adjacent niche 2 (e.g., "cybersecurity", "regtech", "biometrics")
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "best {adjacent_niche_2} experts creators on X Twitter",
  "numResults": 10,
  "contents": {"text": {"maxCharacters": 5000}}
}'
```

**Choosing adjacent niches**: From the company context (Step 2), identify 2-3 related verticals. Examples:
- Identity verification → fraud prevention, cybersecurity, regtech, biometrics
- Fintech → banking, payments, DeFi, financial regulation
- AI/ML → data science, MLOps, developer tools
- DTC beauty → skincare, wellness, lifestyle, clean beauty

These queries return listicle pages (e.g., "Top 60 Fintech Influencers", "FinTwit Accounts to Follow") whose text content contains Twitter handles, bios, and follower counts. Parse these in Step 4.

**Strategy B — Exa findSimilar** (expand from strong listicle finds):

After Strategy A returns results, pick 1-2 of the best curated list URLs and find similar pages:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/findSimilar"}'
  "url": "https://example.com/top-fintech-twitter-influencers",
  "numResults": 5,
  "contents": {"text": {"maxCharacters": 5000}}
}'
```

This surfaces additional curated lists that keyword search may miss. Do NOT use Twitter/X profile URLs for findSimilar — they are not in Exa's index and will return empty results.

**Strategy C — Fiber natural-language-search** (catch LinkedIn-heavy professionals):

Some influencers are better indexed on LinkedIn but have active Twitter accounts. Fiber can surface these. Run 2-3 queries covering the core niche and adjacent topics:

```bash
# Core niche
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles"}'
  "query": "{niche} thought leader content creator with Twitter presence at {industry} companies",
  "pageSize": 20
}'

# Adjacent niche — broader coverage
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/natural-language-search/profiles"}'
  "query": "{adjacent_niche} influencer expert with large social media following",
  "pageSize": 20
}'
```

Cross-reference Fiber results with Twitter in Step 5 — only keep people with active Twitter accounts. Also extract LinkedIn URLs from Fiber results — these are critical for contact enrichment in Step 7.

### 4. Extract & Deduplicate Usernames

From the **text content** of Exa listicle pages, parse Twitter handles using multiple patterns:
- `@username` mentions in the article text
- URLs matching `x.com/username` or `twitter.com/username`
- Strip trailing URL paths (e.g., `/status/123`, `/followers`) — only keep base profile usernames
- Discard non-profile patterns (search pages, hashtag pages, `x.com/home`, `x.com/search`)
- Deduplicate by username (case-insensitive)
- Flag and remove obvious brand/company accounts (e.g., `@stripe`, `@shopify`) — focus on individual creators

From Fiber results, extract any Twitter/X URLs from social profiles. Add new handles to the candidate pool.

Also extract LinkedIn URLs mentioned alongside Twitter handles in listicle pages — save these for contact enrichment in Step 7.

Target: ~100-150 unique handles after dedup. Curated list pages typically mention 20-50 handles each, so 5+ good listicle results across core and adjacent niches yield a large candidate pool.

### 5. Get Twitter Profiles + Engagement

Use Scrape Creators to fetch structured Twitter data. This is a two-step process: fetch profiles for ALL candidates (cheap, 1 credit each), then fetch tweets for the top ~2x the target result count after profile filtering (e.g., ~40 if targeting 20 results).

**Step 1 — Fetch profiles for all candidates:**

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/profile","query":{"handle":"examplehandle"}}'
```

Returns nested JSON. Key fields are inside `core` and `legacy` objects:
- `core.screen_name`, `core.name` — handle and display name
- `legacy.description` — bio text
- `legacy.followers_count`, `legacy.friends_count`, `legacy.statuses_count` — counts
- `legacy.location`, `legacy.created_at` — location and account age
- `is_blue_verified` — verification status

The profile URL is `https://x.com/{screen_name}`.

**IMPORTANT — Parallelize profile fetches:** Do NOT fetch profiles one-by-one in a sequential loop. Instead, launch ALL profile fetch calls in parallel (multiple tool calls in a single message). This dramatically reduces total wait time from minutes to seconds. Group into batches of 10-15 parallel calls if needed.

Apply **hard filters** to narrow the pool:
- Fewer than 10,000 followers (default minimum — adjustable if user specifies a different threshold)
- Empty bio or bio completely unrelated to the niche
- Suspended or not-found accounts (API returns error)
- Bio indicates they've left X (e.g., "find me on Mastodon/Bluesky", "abandoned this site")
- **Too broad/generic accounts** — Remove accounts whose content is not specifically relevant to the target niche. For example, a general "tech evangelist" account with 500K+ followers that rarely tweets about the niche is less valuable than a 20K-follower specialist. If an account's bio and recent tweets show no specific connection to the target niche or adjacent niches, exclude it regardless of follower count

**Step 2 — Fetch tweets for top candidates** (after profile filtering — fetch ~2x the target result count to allow for filtering, e.g., ~40 if targeting 20 results):

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"examplehandle"}}'
```

Returns an array of tweet objects. **IMPORTANT — The data is nested inside each tweet object:**
- `legacy.full_text` — tweet text
- `legacy.favorite_count` — likes (integer)
- `legacy.retweet_count` — retweets (integer)
- `legacy.reply_count` — replies (integer)
- `legacy.created_at` — timestamp
- `views.count` — view count (may not always be present)
- `url` — direct link to the tweet (top-level field)

Note: `favorite_count`, `retweet_count`, `reply_count` are inside the `legacy` object, NOT at the top level of each tweet.

**IMPORTANT — Parallelize tweet fetches:** Just like profile fetches, launch ALL tweet fetch calls in parallel (multiple tool calls in a single message). Do NOT use sequential for-loops. This is the single biggest speed optimization.

For each candidate, identify the **top 3 tweets by engagement** (likes + retweets + replies). Save the best one with its URL for inclusion in the final results table.

From the tweet data, calculate:
- **Average likes** per tweet
- **Average retweets** per tweet
- **Average replies** per tweet
- **Engagement rate**: (avg likes + avg retweets + avg replies) / followers * 100
- **Post frequency**: inferred from `created_at` dates
- **Content themes**: what topics they tweet about most (from `full_text`)

**Additional hard filters** (applied after tweet fetch):
- No tweets in the last 30 days (inactive)
- Protected/private accounts

Skip reply-only accounts (>80% of tweets are replies to others with minimal engagement).

### 6. Score & Rank

Apply a composite scoring model:

| Factor | Weight | Signal |
|--------|--------|--------|
| **Relevance** | 40% | Bio keywords, content themes, audience overlap with target company |
| **Engagement rate** | 25% | Higher is better; micro-influencers often outperform macro here |
| **Follower count** | 15% | Log-scaled — diminishing returns above 100K |
| **Content quality** | 10% | Original content vs retweets, thread depth, media usage |
| **Audience alignment** | 10% | Do their followers match the company's target audience? Inferred from bio + content themes |

**Scoring guidelines:**
- Relevance: Compare bio and recent tweet topics against the company context string from Step 2. Exact niche match = high score. Adjacent niche = medium. Generic/unrelated = low.
- Engagement rate benchmarks: >3% excellent, 1-3% good, <1% below average (varies by follower tier)
- Content quality: Penalize accounts that are >50% retweets. Reward original threads, insights, and media-rich posts.

Rank all candidates by composite score. Select the top N (default 20) for the final list. 20 is a good default — enough to give the user real options without overwhelming them. Scale up if the user asks for more, but always include at least the top 20 if that many qualify.

### 7. Enrich Contacts

For the final list, find email addresses and LinkedIn profiles. The key insight: **discover LinkedIn URLs first** — they dramatically improve match rates for all enrichment APIs.

**Step 1 — Collect what you already have**: From previous steps, gather:
- Emails visible in Twitter bios (many influencers list them directly)
- LinkedIn URLs extracted from Exa listicle page text (Step 4)
- LinkedIn URLs from Fiber NL search results (Step 3, Strategy C)
- Website URLs from Twitter profile data (Step 5)
- "DM for collabs" or "Open DMs" notes from bios

**Step 2 — Discover LinkedIn URLs** for candidates missing them:
```bash
# Exa search to find LinkedIn profiles by name
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"exa","path":"/search"}'
  "query": "Jane Smith site:linkedin.com/in",
  "numResults": 3,
  "includeDomains": ["linkedin.com"]
}'
```

Launch ALL these Exa searches in parallel (multiple tool calls in a single message). Match by name + job title/company from their Twitter bio. LinkedIn URLs are indexed by Exa, unlike Twitter profiles.

**Step 3 — Fiber kitchen-sink** (best coverage for professionals):
```bash
# With LinkedIn URL (best match rate — ALWAYS prefer this):
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/kitchen-sink/person"}'
  "profileIdentifier": "https://linkedin.com/in/janesmith"
}'
```

Note: Fiber kitchen-sink does NOT accept a Twitter URL parameter. Use `profileIdentifier` (LinkedIn URL) for best results. The name+company fallback has low match rates for influencers — invest in finding LinkedIn URLs in Step 2 instead.

**Step 4 — Hunter email-finder** (if you have their name + domain from their website/LinkedIn):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"hunter","path":"/v2/email-finder","query":{"domain":"janesmithcreative.com"}}'
```

**Step 5 — Tomba LinkedIn-to-email** (if LinkedIn URL was discovered):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tomba","path":"/v1/linkedin","query":{"url":"https://linkedin.com/in/janesmith"}}'
```

Also extract from enrichment results:
- LinkedIn URL (for outreach or further research)
- Personal website or newsletter link
- Other social profiles

### 8. Present Results

Output a ranked markdown table with ALL qualifying influencers. Use **full plain-text URLs** — do NOT use markdown link syntax like `[text](url)` or `[@handle](url)` because these often don't render as clickable links in all contexts. Instead, write out the full URL directly.

```
## Twitter Influencers for {Company} — {Niche}

Found {N} influencers ranked by relevance and engagement:

| # | Name | Twitter | Followers | Eng. Rate | Why They Fit | Top Tweet | Email | LinkedIn |
|---|------|---------|-----------|-----------|--------------|-----------|-------|----------|
| 1 | Jane Smith | https://x.com/janesmith | 45.2K | 3.8% | {1-line reason} | https://x.com/janesmith/status/123 | jane@... | https://linkedin.com/in/janesmith |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... |

### Size Distribution
- Mid-tier (10K-100K): {count}
- Macro (100K+): {count}

### Notes
- Engagement rates above 3% are excellent for partnership ROI
- Influencers marked with "DM preferred" indicated in their bio they prefer DMs over email
- {Any caveats about the search — e.g., niche is small so fewer results}
```

**Default to showing 20 results.** This is double the old default of 10, giving the user more options without overwhelming them. If fewer than 20 qualify, show all that qualify. If the user asks for more, scale up accordingly.

The **Top Tweet** column should contain the URL to each influencer's highest-engagement tweet (by likes + retweets + replies). This gives the user an immediate feel for the influencer's content style and reach.

Include a brief summary of search coverage: how many candidates were found, how many passed filtering, and any gaps (e.g., "Few macro influencers found in this niche — consider broadening to adjacent topics").

### 9. Optional Deep Dive

Only if the user requests more detail on specific influencers:

**Full tweet analysis** (recent content, top tweets, audience reactions):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/profile","query":{"handle":"TARGET"}}'
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"scrapecreators","path":"/v1/twitter/user-tweets","query":{"handle":"TARGET"}}'
```

If deeper tweet history is needed, Nyne can fetch recent newsfeed data asynchronously:
```bash
# Step 1: POST to start async retrieval
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"","path":"","body":{"social_media_url":"https://x.com/TARGET"}}'
# Step 2: Poll with GET using request_id
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"nyne","path":"/person/newsfeed","query":{"request_id":"REQUEST_ID"}}'
```

**LinkedIn profile** (full work history, credentials, other ventures):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"fiber","path":"/v1/linkedin-live-fetch/profile/single","body":{"identifier":"https://linkedin.com/in/TARGET"}}'
```

**Deep enrichment** (AI-powered research — slow, ~30-60s):
```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"sixtyfour","path":"/enrich-lead"}'
  "lead_info": {"first_name": "Jane", "last_name": "Smith", "linkedin_url": "https://linkedin.com/in/janesmith"},
  "struct": {"work_email": "Work email", "personal_email": "Personal email", "phone": "Phone number", "audience_size": "Total audience across platforms", "collab_history": "Known brand collaborations", "content_style": "Content style and themes"}
}'
```

## Tips

- **Exa cannot search Twitter directly** — x.com/twitter.com profiles are NOT in Exa's search index. `includeDomains: ["x.com"]` returns zero Twitter results. Instead, search for curated list pages and listicles about influencers, then extract handles from the page text
- **Request text content from Exa** — Always use `contents: { text: { maxCharacters: 5000 } }` when searching for influencer lists. The page text contains @handles, profile URLs, and bios that you need to parse
- **Query variation is key** — Vary phrasing across queries: "best fintech Twitter accounts to follow", "top finance creators on X", "FinTwit must-follow" all surface different listicle pages
- **findSimilar works on listicle pages, not Twitter URLs** — Use findSimilar on the best curated list URLs from Strategy A to find more lists. Do NOT pass x.com URLs — they return empty results
- **Mid-tier influencers often outperform** — accounts with 10K-100K followers frequently have 2-3x the engagement rate of 500K+ accounts. Include a healthy mix of mid-tier and macro
- **Brand accounts vs personal** — Filter out corporate accounts (@stripe, @shopify). Look for individual creators even if they work at companies (e.g., @pmarca not @a16z)
- **Engagement rate varies by tier** — >5% is elite for any size. 2-3% is strong for 50K+ followers. <0.5% is a red flag regardless of follower count
- **Content themes matter more than follower count** — An account with 8K followers tweeting daily about the exact niche beats a 200K account that occasionally mentions it
- **Scrape Creators returns nested JSON** — Profile data is inside `core` (name, screen_name) and `legacy` (followers_count, description, etc.) objects. Tweet engagement data is inside each tweet's `legacy` object (`legacy.favorite_count`, `legacy.retweet_count`, `legacy.reply_count`), NOT at the top level. Always access `tweet['legacy']['favorite_count']`, not `tweet['favorite_count']`
- **Two-step profile + tweets** — Fetch profiles first for all candidates (1 credit each), apply hard filters (followers, bio relevance), then fetch tweets for ~2x the target result count. This saves credits compared to fetching tweets for everyone
- **Each tweet includes a direct URL** — The `url` field on each tweet object (top-level, not inside legacy) gives you `https://x.com/{handle}/status/{id}`. The profile URL is `https://x.com/{screen_name}`
- **ALWAYS parallelize API calls** — The single biggest performance improvement. Never fetch profiles or tweets in sequential for-loops. Always use multiple parallel tool calls in a single message. For example, fetch 10-15 profiles simultaneously, wait for results, then fetch the next batch. Same for tweets, LinkedIn lookups, and email enrichment. This can reduce total execution time from 10+ minutes to 2-3 minutes
- **Default to 20 results** — Double the old default of 10. Enough to give real options without overwhelming. Scale up if the user asks for more
- **Use full URLs, not markdown links** — Write `https://x.com/handle` and `https://linkedin.com/in/name` as plain text in the results table. Markdown link syntax like `[@handle](url)` or `[Profile](url)` often doesn't render as clickable links and makes the output harder to use
- **Check for newsletters/Substacks** — Many Twitter influencers run newsletters. These are high-signal for partnership potential and often listed in the bio
- **Fiber catches LinkedIn-heavy people** — Some professionals (B2B especially) are more discoverable via LinkedIn but still have active Twitter accounts. Don't skip Strategy C for B2B niches
- **Fiber kitchen-sink has no Twitter URL param** — Use `profileIdentifier` (LinkedIn URL) for best match rate. The name+company fallback has very low match rates for influencers
- **LinkedIn URL discovery is critical** — Fiber kitchen-sink with name+company often returns "could not find anyone". Invest in finding LinkedIn URLs first via Exa (`site:linkedin.com/in "Jane Smith"`) or from listicle page text. LinkedIn URLs in `profileIdentifier` have dramatically better match rates
- **Contact enrichment is a waterfall** — Check Twitter bio first (free), then Fiber with LinkedIn URL (best coverage), then Hunter/Tomba only if needed
- **DM culture** — Many influencers prefer Twitter DMs for collaboration inquiries. Note "DM for collabs" or "Open DMs" from bios as a contact method
- **Adjacent niches expand the pool** — Narrow B2B niches (identity verification, regtech, etc.) may only have 10-20 active influencers on X. Always search 2-3 adjacent verticals to hit the target count. For example: identity verification → fraud prevention, cybersecurity, biometrics, regtech
- **X migration is real** — Many B2B/security influencers have migrated to Mastodon, Bluesky, or Threads since 2022. Filter out accounts whose bio says "find me on [other platform]" or that haven't tweeted in 30+ days. Note migration trends in the results summary so the user can consider multi-platform outreach
- **Scrape Creators returns tweets sorted by popularity** — The `user-tweets` endpoint returns top tweets, not chronologically sorted. To check if an account is truly active, look at the `created_at` dates across all returned tweets — if the newest tweet is months old, the account may be inactive even though it has high historical engagement
