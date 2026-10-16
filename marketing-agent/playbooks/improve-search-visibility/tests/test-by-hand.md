# improve-search-visibility — test by hand

## How to test it (sharpened after critique)

Run it on a brand with a live site you can open yourself, from a host that can browse logged-out if you can (otherwise be ready to paste a few answers). Ask: **"When people ask ChatGPT or Google for products like mine, am I in the answer?"**

It passes when, in order:
1. It reads your brand first, looks up your app and your site itself, and asks at most five things (countries, who ships and how many pages a month, competitor-naming stance, locations if local, Search Console — optional) — each with its best guess.
2. It shows 12–15 buyer questions grouped by stage, including 3+ brand-accuracy questions, in the words a buyer would type; none are vanity head terms; it waits for your yes and your must-wins.
3. It tells you how each surface will be observed, asks your yes to one paid probe (is your site indexed?), then asks your yes to a ceiling ("up to N credits", marked as an estimate) and stops at it. Without a browser it hands you the 20-paste set: 5 questions including at least one brand question, ChatGPT ×2, AI Overview ×1, AI Mode ×1.
4. The report gives, per question and surface, named k of N, who is named instead and the source types cited, with an unstable flag — and says for each surface whether it was looked up, seen by the agent's browser, or pasted by you.
5. You (or a colleague, on a different day from any paste) re-ask two or three **stable** AI rows (chatgpt.com in a private window, not signed in; same country) or any Google organic row, and the read holds.
6. You get a page map — every question cluster mapped to the page that should answer it, with priority and quarter — and the five fixes come from its top rows. The five fixes are finished: you could paste each one today; each names where it goes, who ships it, minutes, the gap it closes, time to show and risk. Briefs for new pages are listed separately.
7. Nothing live was touched; nothing was sent; no fact appears that you never approved.

Telltale failures: generic advice ("add an FAQ", "improve E-E-A-T"); one run reported as fact; a rank "in ChatGPT"; FAQ markup sold as a rich result; a fix on a page that can't be crawled; llms.txt in the five.

## Staging run — 2026-10-16, brand Personal Day (DTC acne-safe skincare), up to the first paid step

| Step | Call | What came back |
|---|---|---|
| Connection | `account_whoami`, `brand_read` (list) | staging, org gooseworks; 8 brands; Personal Day coworker agent `9d554b73-…` |
| Brain read | `brand_read` sections summary, products, onboarding, learnings, sources | description (dermatologist-developed, acne-safe, created by Lili Reinhart), 20 products, 1 learning, onboarding profile fields empty, sources incl. own Google ads |
| Competitors | `competitor_read` | 5 tracked: Paula's Choice, The Ordinary, CLEARSTEM, CeraVe, Prequel — profiles with positioning and proof points (useful for "named instead") |
| Claims | `knowledge_search` `source_types: ["claim"]` | 7 "approved" claims created automatically from the site and press (Free Returns, Free Shipping on $45+, 4.9 stars / 234 reviews, Allure/NewBeauty/Byrdie quotes) — no human sign-off; treated as candidates per learn-my-brand's notice |
| Search knowledge | `knowledge_search` "search terms, buyer questions…" | empty (`no_match`) — no question set, no search terms in the brain → confirms server-needs §2 |
| Last run | `file_list` `search/` in the coworker workspace | empty → first run |
| Page list (free) | `knowledge_import` `website: {action: discover}` | 25 pages listed, `provider_requests: 0` (free): collections, product pages, About, FAQ. **Added to the page-and-foundation atom as the free way to find the pages behind the gaps.** |
| Foundation, site-wide (host shell, free) | `curl robots.txt`; homepage as OAI-SearchBot / PerplexityBot / browser | Shopify robots; no AI search or training bot blocked; all three agents get 200 (no CDN blocking); sitemap declared; canonical present; key copy visible without JavaScript |
| Foundation, pages | `curl` home, `/collections/cleansers-moisturizers`, `/products/overdew-barrier-cream`, `/pages/faq` | **Homepage `<title>` is just "Personal Day"** — no category words (a likely this-week fix: title + answer-first opening). Collection title "Cleansers & Moisturizers – Personal Day", meta description good. Product page: Product + Offer + AggregateRating + FAQPage markup present. FAQ page: 24 Q&As with FAQPage markup (no Google rich result since May 2026; still liftable text) |
| Question set (drafted, not saved — needs the human's yes) | — | e.g. best acne-safe moisturizer that won't clog pores · non-comedogenic skincare brand for acne-prone skin · hypochlorous acid spray for acne · blackhead nose strips that actually work · Personal Day vs CLEARSTEM · is Personal Day skincare legit · Personal Day reviews · what is Lili Reinhart's skincare brand |

**Stopped before the first paid step.** Would have asked: "May I run one paid Google lookup — checking whether Google has your site indexed — so I can tell you the price?", then run `gooseworks:data_call_provider` (provider scrapecreators, `/v1/google/search`, query `site:personalday.com`, region US), then asked a yes to a ceiling covering ~13 question lookups + ~4 page index checks ("up to N credits", an estimate), logging each charge in `research/credits-log/<YYYY-MM>.md`. *(Credit flow updated in the 16 Oct cross-set fix pass; the staging run itself stopped before the probe.)* AI surfaces (ChatGPT, AI Overview, AI Mode) were not observable from this host without a logged-out browser — the run would hand the human the 20-paste minimum set (4 must-wins + "is Personal Day skincare legit").

Not run: Reddit/YouTube presence (`/v1/reddit/search`, `/v1/youtube/search`, paid); `brand_update` learning write-back (only after the human has read a report).
