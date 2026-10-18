# Listening craft — what people are saying

Load with `../atoms/listening/ATOM.md`. Carried over from listen-social (removed 18 Oct; its listening lives here now). Reply drafting is not covered — a card in `../../../BACKLOG.md`.

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
- **Paid top-up** (bulk reads through `../../../atoms/spend-gate/proxy-endpoints.md`, one yes): full counts per platform, comments on the top posts, author baselines, platforms behind logins. Caps for a first plan: ≤3 pages per query per platform (stop early when a page is under half on-target); comments on the top 5 posts per account × top 100 comments; baselines for the top ~10 outlier candidates; a crisis reserve of up to 3 calls inside the same ceiling.
- Not on this path: review sites (the buyer-voice pass reads them), private groups, DMs, the support inbox.

## Who is speaking, and when

- **independent** — counts as a mention.
- **owned** — the brand's accounts, its founder and execs: never a mention (their comment sections are read).
- **affiliated** — paid advisers and ambassadors, gifted or PR posts, affiliate and shop links, retailers, fan accounts reposting the founder's promotion: shown, never counted as independent or as outliers.
- A famous founder's name counts only with a topic word; say the count is topic-filtered.
- **Undated** items (tag and discover pages often hide dates): listed "date unknown", checked for risk, never counted.
- **The window:** the last 30 days by default (the last 7 days when the ask says "this week"), plus anything risky up to the moment of the run. Say the window in the section's first line.

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

What to pull out for the report: sales signals ("anyone tried…", "switching from…"), rival complaints, unprompted posts worth asking to reuse (a rights request, never permission), creators whose content fits, misinformation about the brand, press or high-reach pickups.

## Risk — checked first, the moment it is seen

| Level | What qualifies | What happens |
|---|---|---|
| **Serious (S1)** | harm attributed to the product with ≥50k views in 24 hours, a poster with ≥100k followers, or ≥3 separate people reporting the same harm; contamination, injury or a recall; legal or regulatory action; a data breach; discrimination or misconduct; anything press has picked up | Tell the founder in chat **at once**, before the report: what it says (quoted, linked), reach, how many separate people, what we know and don't, who handles it (operating rules, else "no one on record — decide who handles this now"), and a **hold list**: live paid ads (`gooseworks:meta_read` shows those GooseWorks launched; ask about others), posts scheduled in `social/calendar/`, promo emails in `lifecycle/` that touch the product. Pause nothing. |
| **Rising (S2)** | a credible complaint gaining speed, or one from a high-reach poster | In chat before continuing if it is moving fast; top of the report. |
| **Low (S3)** | isolated, low reach | In the report. |

Never reply, comment, hide, report, or contact anyone; never draft a statement that denies, blames or guesses a cause. A monthly or on-ask read catches problems late — say so whenever S1 or S2 appears.

## Outliers and trends

**Outlier** = a post's views ÷ the median of the author's last 10–20 posts, flagged at ≥3×, with ≥5 posts of history and the post ≥48 hours old. Baselines are read on the author's public profile; where views aren't shown, "baseline not read" and no outlier claim. Exclude owned, affiliated, and negative or risky posts about the brand.

Each keeper gets a one-line why — **hook** (first 1–2 seconds or first line) · **format** (talking head, green screen, before/after, list, demo, street interview, carousel, long review…) · **topic** in buyer words — and is saved with `gooseworks:social_inspiration_save` after checking `gooseworks:social_inspiration_library` for the same post: link, platform, handle, caption, date, stats as returned, the post id; `note` "<multiple>× vs median of <n> posts · hook: … · format: … · topic: …"; tags `research-market`, `outlier` or `competitor-winner`, the format.

**Trend** = a sound, format, meme, topic or hashtag rising across unrelated accounts; one viral post is not a trend. For each: first seen (dated evidence), platform, 3–5 sample posts with dates and links, stage (emerging · peaking · saturated), fit for the brand, brand safety (offensive or tragic origins → skip), audio rights ("unverified — check the platform's commercial music library" unless the page says commercial use is allowed), confidence, and a **post-by date** (run-organic-social reads it). How long a trend has left is an estimate, never a fact. Skips get one line with the reason.
