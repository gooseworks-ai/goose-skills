---
name: marketing-data-access
description: >-
  How to get live public data (ads libraries, social posts and comments, search results, creator
  profiles) and paid media generation through GooseWorks, with no vendor key. Load before any playbook
  step that reads public data or calls an outside model: which proxy call fits the job, what it costs,
  how to get the human's yes, and what to do when the data is not reachable. Not for brand facts (read
  the brand brain) or the customer's own ad accounts (the GooseWorks ads tools, or an ads connector
  they have).
version: 0.1.0
---

# marketing-data-access

One door to outside data and models: the GooseWorks proxy. The customer never needs a vendor account or key, and GooseWorks bills the calls in credits.

## The three calls

| Call | Use it for | Cost |
|---|---|---|
| `gooseworks:data_call_provider` | GET: public social and search data (`scrapecreators`), ElevenLabs voice list, fal job polls | ScrapeCreators reads are paid; the result says what it cost |
| `gooseworks:data_post_provider` | POST: fal models (image, video, transcription), ElevenLabs speech and music, ScrapeCreators bulk reads | Paid |
| `gooseworks:data_price_provider` | Price fal and ElevenLabs calls before running them | Free, read-only |

Read each tool's own description for its parameters; this skill never repeats them. Prefer the purpose-built GooseWorks tools when one fits the job (`ads_library_scrape`, `competitor_research`, `social_inspiration_search`, `photos_generate`, `video_*`, `ads_generate`): they carry the brand, the review flow and the billing gate. Use the raw proxy only for what those tools do not cover.

## Which ScrapeCreators read fits the job

Pick by the question. Paths below are the ones the playbooks use today; query keys, recency options and paging live in `../spend-gate/proxy-endpoints.md` (in the `spend-gate` skill) (never guess a key).

| Question | Reads |
|---|---|
| What ads is a brand running? | Meta Ad Library (`/v1/facebook/adLibrary/search/companies`, `/v1/facebook/adLibrary/company/ads`, `/v1/facebook/adLibrary/search/ads`, `/v1/facebook/adLibrary/ad`), `/v1/google/ad`, `/v1/linkedin/ads/search`, `/v1/tiktok/ad-library/search` |
| What is ranking on Google for a query? | `/v1/google/search` (organic page one only: no AI Overview, no People-Also-Ask, no local pack) |
| What are people saying about a topic? | `/v1/reddit/search`, `/v1/reddit/post/comments`, `/v1/twitter/search/posts`, `/v1/threads/search`, `/v1/tiktok/search/keyword`, `/v2/instagram/reels/search`, `/v1/youtube/search`, `/v1/linkedin/search/posts`, `/v1/pinterest/search` |
| What do customers say under posts and videos? | `/v1/tiktok/video/comments`, `/v2/instagram/post/comments`, `/v1/youtube/video/comments`, `/v1/facebook/post/comments` |
| What is a brand or creator posting? | `/v2/instagram/user/posts`, `/v1/instagram/user/reels`, `/v3/tiktok/profile/videos`, `/v1/youtube/channel-videos`, `/v1/linkedin/company/posts`, `/v1/twitter/user-tweets` |
| What does this video say? (transcript of a public video) | `/v1/youtube/video/transcript`, `/v1/tiktok/video/transcript`, `/v2/instagram/media/transcript` |
| Who is this X account? | `/v1/twitter/profile`, then `/v1/twitter/user-tweets` for its posts |
| Who is this creator, and how do I reach them? | `/v1/instagram/profile`, `/v1/linkedin/profile`, link-in-bio reads (`/v1/linktree`, `/v1/linkbio`, `/v1/komi`, `/v1/pillar`) |
| What is trending? | `/v1/tiktok/get-trending-feed`, `/v1/instagram/reels/trending`, `/v1/youtube/shorts/trending`, search suggestions and typeahead reads |
| What do buyers say about a product on TikTok Shop? | `/v1/tiktok/shop/product/reviews` |

## Free sources that need no proxy

Use these first, with the host's own fetch, including in scheduled runs that have no browser:
- **Hacker News:** the public Algolia search API (`https://hn.algolia.com/api/v1/search?query=<terms>&tags=story`, add `&numericFilters=created_at_i><unix>` for recent) for launches, developer chatter and B2B buying signals.
- **RSS and Atom feeds:** blogs, changelogs and press pages (`/feed`, `/rss`, `/blog/rss.xml`, or the `<link rel="alternate">` in a page's head) to watch what rivals publish and ship.
- **Sitemaps:** `/sitemap.xml` to map a site's page types (comparison, alternatives, pricing, use-case pages) without crawling it.

## Money rules

Every paid call goes through the `spend-gate` skill (`../spend-gate/SKILL.md`), which holds the rules: branch A for priced calls (fal, ElevenLabs), branch B for ScrapeCreators reads. Two more here:
1. **Retry safely.** Reuse the same `idempotency_key` when retrying a fal or ElevenLabs call, so nothing is charged twice.
2. **Read narrow first.** One query, one page; widen only when the first page answers the question badly.

## Never

- Never use or ask for a vendor key (`APIFY_API_TOKEN`, `FAL_KEY`, `APOLLO_API_KEY`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY` or any other).
- Never put credentials or secrets in `query` or `body`.
- Never present one source as another (organic Google results are not an AI-answer read).

## When the data is not reachable

The proxy covers public social and search data, fal and ElevenLabs. It does **not** cover today: people and company enrichment, email finding at scale and email verification, AI-answer engines (ChatGPT, Perplexity, AI Overviews), Search Console, page-speed data, app-store listings, or the customer's own email, store and analytics tools.

When a step needs one of these, in this order:
1. Use a connector the host agent already has for the customer's own account, read-only (only run-paid-campaigns makes changes through one: the marketing-guide §3, "Connectors").
2. Use the host's own web search, web fetch or browser for public pages and news (launches, funding, press, job posts, changelogs). This is free and should be the default for anything recent.
3. Ask the human for the export or a screenshot, in plain words.
4. Otherwise skip the step and say plainly what went unread. Never estimate the missing number. When only the marketer can do the step (finding or checking email addresses), say so and name two or three outside tools as examples, never an endorsement (the marketing-guide §3).

If GooseWorks is not connected at all, follow the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1 step 1; in local mode, use steps 1–3 only, with no paid reads, and say once what went unread.
