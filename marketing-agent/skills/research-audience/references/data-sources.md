# Data sources, costs and yield

Load at audience steps 1–3 (free pass), list-mode steps 2–5, and audience step 8 (the top-up estimate). Every paid lookup goes through the GooseWorks proxy; no vendor keys anywhere.

## Audience research — the free pass (always first, no yes needed)

| Need | Free source |
|---|---|
| Who actually pays, stays and leaves — and why | the brand's own customer data, asked for once up front (customer or order export, cancel reasons, win/loss notes, support themes); synced reviews and pasted exports via `gooseworks:knowledge_search` — first, and it wins conflicts |
| What the brand sells, to whom, in which words | the brand's site in the host browser; `gooseworks:brand_read` (summary, kit, products, organic, learnings) |
| Earlier buyer groups and quote bank; the market's sizing | workspace `research/audience/` (this playbook's last run — extend, don't re-mine); `research/market/` (the market report — its figures are context; group sizes are counted here) |
| Group size in buyers | store and company directories, company counts by size band, association member lists, job-post counts for the role, industry figures — community member counts are reach only |
| Wants | their own public posts and talks, review headlines, "how do I…" threads; job posts for what a role is measured on (the employer's view, never the group's voice) |
| Problems and language | review sites for the tools they use (G2, Capterra, Trustpilot, app stores — page by page in the browser), Reddit and community threads (`site:reddit.com`), Hacker News, public video comments |
| Where they hang out | web search for the role's communities, newsletters, podcasts, conferences and meetups; subreddit pages (member counts); event pages (dates, speakers) |
| How rivals reach them | rivals' sites and pricing pages, ad libraries in the browser, rivals' community and event presence |

Same reading rules as below: as a person would, public pages only, no logins, no scripted paging. A host without web search or a browser: say so in "what we couldn't check" and build what the brain and research-market's files allow.

**Paid top-up for audience research** (one yes, after the draft): comment and post reads at volume on the platforms the group uses — the first decision when the forums this audience uses were unreadable (`/v1/reddit/search`, `/v1/reddit/post/comments`, `/v1/tiktok/video/comments`, `/v2/instagram/post/comments`, `/v1/youtube/video/comments`), LinkedIn post search (`/v1/linkedin/search/posts`), X search (`/v1/twitter/search/posts`). Keys and recency: `../../spend-gate/proxy-endpoints.md` (in the `spend-gate` skill).

## List mode — the free pass

Today the customer's GooseWorks connector has **no** people search, company database, email finder or email checker — the server has them, but not on the connector yet (server-needs). Most of a good list is on public pages anyway:

| Need | Free source |
|---|---|
| Brand, ICP, customers, rivals, past learnings, ledger | `gooseworks:brand_read`, `gooseworks:knowledge_search`, `gooseworks:competitor_read`, workspace files |
| What the brand sells, prices, who it's for, customer logos | the brand's site in the host browser |
| Accounts | host web search (directories, association lists, roundups, exhibitor and sponsor lists, `site:` filters), company sites and LinkedIn public company pages in the host browser, rivals' public customer pages, ad libraries in the browser |
| Timing | host web search for news (last 90 days), careers pages, job boards, company news and posts |
| People and published addresses | team/about/leadership pages, press releases, speaker and podcast-guest pages, profile headlines in search results |
| Switch intent | web search with the nine kinds of buying language ([list-sources.md](list-sources.md)); Hacker News search API (`hn.algolia.com/api/v1/search_by_date`, free, no key); public forum threads in the host browser |
| Developer activity | the public GitHub API (`api.github.com/repos/<owner>/<repo>/issues`, `/pulls`, `/forks`, `/contributors`; `/users/<login>` for the self-declared company) — free and keyless but about 60 requests an hour, so look up company fields only for the top ~50 people by weight; the paid `/v1/github/user` at volume. Companies only — never developers as rows |
| Events | conference, meetup and podcast pages; public speaker platforms; sponsor and exhibitor pages; calls for papers — speakers, sponsors and exhibitors only, never attendee lists |
| Rivals' customers | rivals' case-study, customer and testimonial pages; integration partner pages |

Use the host browser where there is one; a fetch tool that summarises pages misses obfuscated addresses and blocked sites — when a page protects its emails, record "address on page, protected" and the contact form, never a guess. Read pages as a person would — no bulk scraping, no paging through hundreds of results by script; public pages only, no logins, respect each site's terms. A hosted chat without web search or a browser: say so in the report's "what we could not read", build what the brain and free server reads allow, and make the paid top-up the way to the sample.

## List mode — the paid top-up (only after the free result, one yes)

What it adds, in plain words: confirming titles hidden on public pages, firmographics at scale, more accounts and people when the free pass falls short of the number, posts for hooks. Through `gooseworks:data_call_provider` (provider `scrapecreators`):

| Need | Paths |
|---|---|
| Web search at volume | `/v1/google/search` |
| Company facts (size, industry, HQ, a few employees, posts) | `/v1/linkedin/company` |
| A person's public profile (titles often hidden) | `/v1/linkedin/profile` |
| Recent posts (pain statements, hooks) | `/v1/linkedin/search/posts`, `/v1/linkedin/company/posts`, `/v1/twitter/user-tweets`, `/v1/threads/user/posts` |
| Who is running ads now, at volume | Meta `/v1/facebook/adLibrary/search/companies`, `/v1/facebook/adLibrary/company/ads`; Google `/v1/google/adLibrary/advertisers/search`, `/v1/google/company/ads`; LinkedIn `/v1/linkedin/ads/search`; TikTok `/v1/tiktok/ad-library/search` |
| Small shops and venues (owner, IG, link-in-bio) | `/v1/instagram/profile`, `/v1/linktree`, `/v1/linkbio`, `/v1/komi`, `/v1/pillar` |
| Developer-tool ICPs | `/v1/github/user`, `/v1/github/repository` |

Paths are from the provider's public documentation as checked on 2026-10-16. The live tool is the truth: if a path is refused or changed, say so in one line and use another route. Never put a key, token or secret in a query.

Not usable for this playbook even though it exists: `/v1/find-creator-emails` (built for creators' public business emails — fine for work-with-creators, not for B2B people); `/v1/detect-age-gender` (never infer protected traits about prospects).

## When the contact routes exist (server-needs #1–#4)

Check the connector's `data_call_provider` description for its provider list at the start of a list run (it names the providers it accepts); when a new one appears, one small probe call inside the ceiling confirms the path and its charge. When email checking, email finding or people search is listed, use it, inside the one approved ceiling:

1. **Search before you pay per person.** People search returns a count and a sample first — show "≈<n> match; here are 10" in the report before any reveals. One broad search ("<titles> at <industry> companies, <size>, <country>") beats one search per company; list title variants with OR; use explicit title lists, never seniority buckets (they pull in juniors and recruiters); filter companies by domain.
2. **Accounts before people, still.** Only accounts that passed the gates get people looked up.
3. **Cheapest route first, stop early.** Per account: the public pages you already read → the cheapest finder → the next. Stop at three good people per account (company matches, title matches a target); per person, stop at the first found address the checker passes. Merge and dedupe by profile URL at every step.
4. **Check every address before it counts as sendable** — one checker by default; a second only when the first says `unknown`. `valid` → `verified-by-tool (<checker>, <date>)`; `accept_all` → `catch-all` (small batches only); `unknown` → re-check later, not sendable yet; `invalid` → drop the address (keep the row if another route exists). Disposable or webmail → drop for person rows at companies with their own domain. Two checkers agree → high confidence; one finder alone (no check) → never "verified".
5. **Never:** phone finders or "enrich mobile" options, "personal" email modes, reveal-by-name when a record id exists, the deprecated free people search that hides surnames.
6. **Log** every charge (query kind and count, never a person's name or address) and stop before the next call could pass the ceiling.

The routes, paths and prices are in [../server-needs.md](../server-needs.md). Until they appear, everything above runs on the free pass and the marketer's own checker.

## Credits

Spending follows the `spend-gate` skill (`../../spend-gate/SKILL.md`) (proxy branch): one yes to a ceiling "up to N credits", estimated from the credits log (or, with no history, from one small probe run inside that same ceiling), labelled an estimate; stop at it. `gooseworks:data_price_provider` does not price these lookups (server-needs #1). Every charge is logged in `research/credits-log/<YYYY-MM>.md` (`date | playbook | tool/endpoint | query kind | items | credits`) — the kind of query, never a prospect's name. Never retry a failed paid call blindly; a resubmit pays again. The counts below are for a list built mostly from paid reads; a top-up that only fills gaps in a free result needs far fewer — count the rows it touches.

## Yield (approximate, from outbound practice — use it to size the lookup counts you show)

To deliver ~50 contactable people in B2B, "kept" meaning an account that passes every gate:

| Stage | Count | Typical lookups |
|---|---|---|
| Accounts screened (search results, ad-library hits, lists the human supplied) | 200–250 | ~1 search per 8–10 candidates → 20–30 |
| Accounts kept (gates confirmed on the company page) | ~100 (about 2–2.5 screened per kept) | 1 company read each → ~100 |
| Signal checks on kept accounts | ~100 | 1–2 searches each → 100–200 |
| People found | ~140 | 1 search to find the profile + 1 read each → ~280 |
| Hidden titles needing a second source | ~40% of people | 1 search each → ~55 |
| With a usable contact route | 60–70 | 1–2 searches for published emails / pattern evidence each → 60–120 |
| Hooks | ~50 | 1 search each → ~50 |
| Handover re-checks (job posts still live, five-row QA) | — | ~15 |
| Delivered after QA | ~50 | — |

Roughly **13–20 lookups per delivered person** for a B2B list; a top-up that confirms titles and firmographics for rows the free pass found needs about 2–3 lookups per row. Lists sourced from evidence (job posts naming a tool) keep more of what they screen. Retail-independent, local and marketplace lists are cheaper per row (one account row, simpler routes); chains add 1–2 buyer-row lookups each, and each UK independent adds one register check (paid search when the host has no web reader). Re-runs are cheaper: definition, exclusions and many accounts are already known.

The paths above say only what to pull and why. Query keys, recency options, paging and per-endpoint pricing notes are in `../../spend-gate/proxy-endpoints.md` (in the `spend-gate` skill) ("Profiles, creators and companies" and the search sections) — use them from there.
