# Queries and coverage

Load at steps 1 and 3. Proxy paths, query keys and recency options: `../../../atoms/spend-gate/proxy-endpoints.md`.

## The watchlist (`social/listening/watchlist.md`)

The example is a fictional fresh dog-food brand called "Good Boy Kitchen" — never copy its rows or numbers.

```markdown
# Listening watchlist — <brand>
Version: v<n> · Last changed: <date> · Changed: <+query (reason)>, <−query (precision x%)>
Counting window: Monday–Sunday, timezone <IANA> · Triage window: start of that week up to the run
Escalation: <name, channel> (from operating rules / asked <date>) — or "none on record"
Owned accounts (never counted as mentions): <brand handles>, <founder and exec handles>

| # | query | kind | platforms / scope | exclusions | precision last week | status |
|---|---|---|---|---|---|---|
| Q1 | "Good Boy Kitchen" dog food | brand + category word | TikTok, Instagram, YouTube, X | "kitchen remodel" | <x% (n/N)> or – | active |
| Q2 | Good Boy Kitchen | bare name, scoped | Reddit r/dogs, r/DogAdvice; #dogfood | – | – | active |
| Q3 | goodboykitchen | handle without @ | all | – | – | active |
| Q4 | <founder name> dog food | founder + topic | TikTok, X | – | – | active |
| Q5 | <tracked rival> | competitor | competitor mentions | – | – | active |
| Q6 | "itchy dog" food | category / problem | TikTok, Reddit | – | – | active |
```

What to include:
- Brand name exactly, common misspellings, spaced/unspaced forms; the handle without the @; the domain.
- **A common-word brand name** ("Personal Day", "Ritual", "Good Boy Kitchen") needs two kinds of query: the name plus a category word everywhere, and **the bare name scoped to the category's own communities** (its subreddits, hashtags) — the scope does the filtering, and that is where "anyone tried <brand>?" threads live.
- Product and range names; the founder's and visible execs' names (paired with a topic word when the name is common or famous).
- Brand and campaign hashtags.
- Competitors: tracked rivals through `competitor_research` `mentions`; untracked ones as normal queries (or offer to track them — free).
- Category and problem terms buyers actually use (from research-market's voice-of-customer bank when it exists).
- Exclusions for every query whose bare form is noisy.

**Precision** = hits really about the brand ÷ hits read. First run: "–" until step 4 has measured it — never estimate it. Drop or tighten a query under ~30%. Never change the query set silently: a change is versioned and footnoted in the report, because week-over-week counts are only comparable on the same set.

**Owned voices:** posts by the brand's own accounts and by its founder or execs are owned, not mentions — exclude them from mention counts, sentiment and outliers. Their comment sections are a covered surface only where a comments endpoint exists (none for LinkedIn: "paste").

## Coverage — what this playbook can reach

| Surface | How | Mark |
|---|---|---|
| TikTok, Instagram, YouTube, Reddit search, comments, hashtags, trending | proxy | covered (paid); TikTok keyword search and Reddit newest-first; Instagram reels and YouTube recency-filtered, relevance order; TikTok hashtag and Instagram general search unfiltered samples |
| X search | proxy | covered (paid) — relevance sample, no recency filter |
| LinkedIn post search | proxy | covered (paid), recency filter; comments not covered |
| Threads, Pinterest, Facebook videos (keyword) and Facebook post comments (by post link) | proxy | covered (paid); Facebook post search does not exist — not covered |
| Competitor mentions (TikTok, Instagram, X, Reddit, YouTube) | `competitor_research` `mentions` | covered (paid, no price before it charges — priced from the credits log; cached repeats free) |
| The brand's own and rivals' recent posts | `brand_read` `organic` | covered (free) — check `last_synced_at` |
| Own managed accounts' metrics | `social_analytics_get` | covered (free) |
| Google Business, Yelp, Nextdoor, App Store / Play, Amazon reviews and Q&A, G2, Trustpilot | not on the listening path | not covered — paste them; a customer-research run reads reviews |
| Discord, Slack, Facebook private groups, DMs, LinkedIn comments, support inbox | private | pasted only |
| Hacker News, niche forums | host browser or fetch, if available | read-by-fetch or not covered |

Default platforms by company type: DTC — TikTok, Instagram, Reddit, YouTube; B2B SaaS — LinkedIn, X, Reddit (HN and G2 by paste or fetch; founder posts are owned); consumer app — TikTok, Reddit, X (App Store reviews and Discord by paste); marketplace seller — TikTok, Reddit (Amazon Q&A and reviews: name the gap and say customer research covers reviews); local business — Instagram, local subreddits (Google/Yelp/Nextdoor by paste, said up front); services firm — LinkedIn and the founder's name; pre-revenue — category-only listening (problem threads, competitor complaints, outliers, trends), one cheap brand-name check, and "0 brand mentions across N queries" said plainly, never padded.

## Reaching the counting week

Paging, recency and floor rules are in `../atoms/listening-window/ATOM.md` § How far each search pages.

## Pull caps (a sane first plan; adjust from the credits log)

- Brand queries: pages as above, at most 3 per query per platform; stop early when a page is under 50% on-target.
- Competitor mentions: one `competitor_research` `mentions` call per deep rival (default platforms TikTok and Instagram unless the type says otherwise).
- Comments (stage B): top 5 posts per account (brand and each deep rival) by views this week × top 100 comments by likes; in a hosted chat, top 3 × 50.
- Outlier baselines (stage B): the author's last 10–20 posts, only for the top ~10 candidates.
- Trends: one trending-feed call per covered platform, plus the use count of at most 5 candidate sounds or formats.
- Crisis reserve: up to 3 calls.
