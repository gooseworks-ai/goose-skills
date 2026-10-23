# Listening craft — what people are saying

Load with the `research-market-listening` skill (`../../research-market-listening/SKILL.md`). Carried over from listen-social (removed 18 Oct; its listening lives here now). Reply drafting is not covered yet.

## The watchlist

Saved as `research/market/watchlist.md` (save-to-brain, `supersede`, title `Listening watchlist — <Brand> — <run date>`, tags `research-market`, `listening-watchlist`). A plain table:

| query | kind | where | exclusions | precision last run |
|---|---|---|---|---|
| "<brand>" <category word> | brand + category | TikTok, Instagram, YouTube, X, LinkedIn, Reddit | <noise words> | <x% (n/N)> or "first run" |
| <brand> | bare name, scoped | the category's subreddits, hashtags | – | |
| <handle> | handle without the @ | all | – | |
| <founder> <topic word> | founder + topic | X, LinkedIn, TikTok | – | |
| <rival> | competitor | where buyers talk | – | |
| <problem phrase buyers use> | category / problem | TikTok, Reddit | – | |

Include: name forms and misspellings, handle, domain, products, founder and visible execs (with a topic word when the name is common or famous), brand hashtags, rivals, category and problem terms in buyers' words (from the voice-of-customer bank when it exists), exclusions.

**Name collisions — check before the first listen.** Web-search the bare brand name and read the first results and one platform's search page. Write down what else the name means (a phrase, another company, a person, a place) and turn each into an exclusion or a scope ("personal day" → exclude "day off", "PTO", "sick day"; scope the bare name to the skincare communities). Where search ignores minus terms, apply the exclusions when reading results. The report says what the name was confused with.

**Precision** = hits really about the brand ÷ hits read, measured on what was read. Never estimated. Tighten a query under ~30%. Changes are versioned in the file: counts are only comparable on the same query set.

## Where to listen, and how

Default platforms by company type: DTC — TikTok, Instagram, Reddit, YouTube · B2B SaaS — LinkedIn, X, Reddit, Hacker News · consumer app — TikTok, Reddit, X · marketplace seller — TikTok, Reddit · local business — Instagram, local subreddits · services firm — LinkedIn and the founder's name · pre-revenue — category-only (problem threads, rival complaints, trends) plus one brand-name check, and "0 brand mentions across N queries" said plainly.

- **Free first:** web search with recency words and `site:` queries; each platform's own public pages (Reddit search sorted by new and the category's subreddits, TikTok and Instagram tag pages, YouTube search filtered by upload date, X where it shows without a login); comments on the top posts; the server's free reads (`brand_read` `organic`, `gooseworks:social_inspiration_search` `source: "research"`).
- **Only the platform's own public pages,** or the paid read on a yes. Never unofficial mirrors, archives or unofficial APIs — they can break the platform's terms and hold deleted posts.
- **Counts from the free pass are samples** — say so. Week-over-week or month-over-month change only when both runs used the same method and query set.
- **Paid top-up** (bulk reads through `../../spend-gate/proxy-endpoints.md` (in the `spend-gate` skill), one yes): full counts per platform, comments on the top posts, author baselines, platforms behind logins. Caps for a first plan: ≤3 pages per query per platform (stop early when a page is under half on-target); comments on the top 5 posts per account × top 100 comments; baselines for the top ~10 outlier candidates; a crisis reserve of up to 3 calls inside the same ceiling.
- **Free feeds a plain fetch can read** (and a scheduled run, which has no browser): Hacker News search for B2B and developer brands — `https://hn.algolia.com/api/v1/search_by_date?query=<terms>&tags=story` (or `comment`, `show_hn`, `ask_hn`) with `&numericFilters=created_at_i><unix time>` for the window, Show HN launches in the category included; blog and changelog feeds — the `<link rel="alternate" type="application/rss+xml">` in a page's head, else `/feed`, `/rss`, `/atom.xml`, `/feed.xml`, `/rss.xml`, `/blog/feed`, `/index.xml`.
- **Transcripts** (paid top-up): for the top 5–10 videos per platform, a transcript read through the proxy says what people *say*, which captions and comments miss. An auto-transcript isn't exact: flag unclear brand names, numbers and health or money claims.
- Not on this path: review sites (audience research reads them), private groups, DMs, the support inbox.

## Who is speaking, and when

- **independent** — counts as a mention.
- **owned** — the brand's accounts, its founder and execs: never a mention (their comment sections are read).
- **affiliated** — paid advisers and ambassadors, gifted or PR posts, affiliate and shop links, retailers, fan accounts reposting the founder's promotion: shown, never counted as independent or as outliers.
- A famous founder's name counts only with a topic word; say the count is topic-filtered.
- **Undated** items (tag and discover pages often hide dates): listed "date unknown", checked for risk, never counted.
- **The window:** the last 30 days by default (the last 7 days when the ask says "this week"; since the last watch in brand-watch mode), plus anything risky up to the moment of the run. Say the window in the first line.
- **Source mix:** say what share of items came from each kind of source. Complaint sites (Trustpilot) over-represent angry customers, developer forums (Hacker News) over-represent developers, and missing Reddit or LinkedIn hides in-house marketers — name the skew and how it bends the picture.

## Classify

| Feeling | Use when |
|---|---|
| positive | clear praise or recommendation (read the words, not the emoji) |
| negative | complaint, warning, disappointment — product issue or service issue |
| mixed | praise and complaint together; never rounded |
| neutral | a mention without a view (a haul, a list, news) |
| question | asks something — a sales and content signal |
| unclear | tone can't be resolved; never guessed |

Counts with n; no percentages under ~30 items; net feeling is "positive n vs negative n", never a score. Themes are named in people's words, each with n, two quotes with links, and its "For you". Quotes worth keeping as buyer language go to the voice-of-customer bank.

**Two more tags** on any comment or post: **product request** ("I wish it could…") and **workaround** ("I just export it to a spreadsheet and…") — both are unmet needs. Keep the parent comment when a reply changes its meaning, and read comments under rivals' ads and posts too.

**How close to buying** (a separate scale, lowest to highest): curiosity → consideration → a price or availability question → a comparison → "I bought it" → repeat use → recommending it. Count each step; views and likes are attention, not demand.

What to pull out for the report: sales signals ("anyone tried…", "switching from…"), rival complaints, unprompted posts worth asking to reuse (a rights request, never permission), creators whose content fits, misinformation about the brand, press or high-reach pickups.

## Risk — checked first, the moment it is seen

| Level | What qualifies | What happens |
|---|---|---|
| **Serious (S1)** | harm attributed to the product with ≥50k views in 24 hours, a poster with ≥100k followers, or ≥3 separate people reporting the same harm; contamination, injury or a recall; legal or regulatory action; a data breach; discrimination or misconduct; anything press has picked up | Tell the founder in chat **at once**, before the report: what it says (quoted, linked), reach, how many separate people, what we know and don't, who handles it (operating rules, else "no one on record — decide who handles this now"), and a **hold list**: live paid ads (`gooseworks:meta_read` shows those GooseWorks launched; ask about others), posts scheduled in `social/calendar/`, promo emails in `lifecycle/` that touch the product. Pause nothing. |
| **Rising (S2)** | a credible complaint gaining speed, or one from a high-reach poster | In chat before continuing if it is moving fast; top of the report. |
| **Low (S3)** | isolated, low reach | In the report. |

Never reply, comment, hide, report, or contact anyone; never draft a statement that denies, blames or guesses a cause. A market report catches problems late; the brand-watch mode (weekly, daily during a launch or a crisis) is the faster path — offer it whenever S1 or S2 appears.

## Outliers and trends

**Outlier** = a post's views ÷ the median of the author's last 10–20 posts **of the same format** (a carousel is never judged against reels), flagged at ≥3×; flag collaborations and paid boosts, with ≥5 posts of history and the post ≥48 hours old. Baselines are read on the author's public profile; where views aren't shown, "baseline not read" and no outlier claim. Exclude owned, affiliated, and negative or risky posts about the brand.

Each keeper gets a one-line why — **hook** (first 1–2 seconds or first line) · **format** (talking head, green screen, before/after, list, demo, street interview, carousel, long review…) · **topic** in buyer words — and is saved with `gooseworks:social_inspiration_save` after checking `gooseworks:social_inspiration_library` for the same post: link, platform, handle, caption, date, stats as returned, the post id; `note` "<multiple>× vs median of <n> posts · hook: … · format: … · topic: …"; tags `research-market`, `outlier` or `competitor-winner`, the format.

**Trend** = a sound, format, meme, topic or hashtag rising across unrelated accounts — it shows acceleration, repetition across accounts that don't know each other, or spread across platforms, not just big lifetime views; one viral post is not a trend. Each gets one of five responses — join in · borrow the format · answer the question it raises · make an evergreen version · ignore — and a horizon: react this week, plan for next month, or shape the quarter. For each: first seen (dated evidence), platform, 3–5 sample posts with dates and links, stage (emerging · peaking · saturated), fit for the brand, brand safety (offensive or tragic origins → skip), audio rights ("unverified — check the platform's commercial music library" unless the page says commercial use is allowed), confidence, and a **post-by date** (run-organic-social reads it). How long a trend has left is an estimate, never a fact. Skips get one line with the reason.

## Voices the buyer follows

The 10–25 people the brand's buyers read — category founders, practitioners, newsletter writers, podcast hosts, analysts (from research-audience's "where they gather" when it exists). Read their last 7 days (30 in a full report) and cluster what they posted by topic. Flag:
- **convergence** — 3+ voices on one topic in one week;
- **spike** — a topic at 2× its volume last time;
- **underdog** — one voice early on a topic nobody else covers;
- **controversy** — a post with a high comment-to-reaction ratio (a debate to weigh in on).
A topic worth joining is worth joining within about 3 days of its peak — say the post-by date. In brand-watch mode, a convergence on the brand's category is an alert.

**Finding the voices** (when there's no list yet; paid top-up for LinkedIn post search): search the category's *authority* terms (not pain words), group the posts by author, keep authors with 2+ posts, rank by post count × engagement, drop recruiters and vendors, and merge with conference speakers, newsletter writers and podcast hosts found by web search. Save the list in the watchlist file.
