# improve-search-visibility — test by hand

## How to test it (sharpened after critique)

Run it on a brand with a live site you can open yourself, from a host that can browse logged-out if you can (otherwise be ready to paste a few answers). Ask: **"When people ask ChatGPT or Google for products like mine, am I in the answer?"**

It passes when, in order:
1. **No questions before the work.** Its first message to you already answers "am I in ChatGPT?" — question by question, who's named instead and why — with the draft five fixes. It asked you nothing before that.
2. That first message carries **all** the decisions left, together: one credit yes for the exact Google results ("up to N credits", marked an estimate — or you name the ceiling), plus only the facts it can't find (who ships, may we name competitors), and the question list for edits. One yes, never a probe yes and then a ceiling yes.
3. **One report you open with one click**: a local file link on a computer host (an artifact or the full report in a hosted chat), plus a "saved to your brand" link that opens. Never a list of workspace paths.
4. **It reads like a good marketer wrote it** (write-report §3): the top five lines tell you what to do first and why; a non-marketer can follow it; no question ids, codes, tool names, file paths or jargon in the story — technical detail only in the closing "for whoever edits your site" section.
5. You re-ask two or three questions yourself in a private window and the read holds.
6. The roadmap maps each topic to the page that should answer it, and the five fixes are finished: you could hand each to whoever edits the site today, and you start at least one that week.
7. Nothing live was touched; nothing was sent; no fact appears that you never approved.

Telltale failures (the 18 Oct hand test hit the first four; the 19 Oct evals hit the next five): a first turn that ends "say the word and I'll write the report"; yesterday's answers counted as today's; a number with no source opened this run; the brand's own marketing lines or unread rival facts in fix copy; a bare file path instead of a link, or the report never saved to the brand; intake questions before any result; two credit yeses; reports left only in the workspace with paths shown as links; a report full of ids and "0/1" scoring; generic advice ("add an FAQ", "improve E-E-A-T"); one run reported as fact; a rank "in ChatGPT"; FAQ markup sold as a rich result; a fix on a page that can't be crawled; llms.txt in the five.

## Staging run — 2026-10-16, brand Personal Day (DTC acne-safe skincare), up to the first paid step

| Step | Call | What came back |
|---|---|---|
| Connection | `account_whoami`, `brand_read` (list) | staging, org gooseworks; 8 brands; Personal Day coworker agent `9d554b73-…` |
| Brain read | `brand_read` sections summary, products, onboarding, learnings, sources | description (dermatologist-developed, acne-safe, created by Lili Reinhart), 20 products, 1 learning, onboarding profile fields empty, sources incl. own Google ads |
| Competitors | `competitor_read` | 5 tracked: Paula's Choice, The Ordinary, CLEARSTEM, CeraVe, Prequel — profiles with positioning and proof points (useful for "named instead") |
| Claims | `knowledge_search` `source_types: ["claim"]` | 7 "approved" claims created automatically from the site and press (Free Returns, Free Shipping on $45+, 4.9 stars / 234 reviews, Allure/NewBeauty/Byrdie quotes) — no human sign-off; treated as candidates under the claims gate's contract |
| Search knowledge | `knowledge_search` "search terms, buyer questions…" | empty (`no_match`) — no question set, no search terms in the brain → confirms server-needs §2 |
| Last run | `file_list` `search/` in the coworker workspace | empty → first run |
| Page list (free) | `knowledge_import` `website: {action: discover}` | 25 pages listed, `provider_requests: 0` (free): collections, product pages, About, FAQ. **Added to the page-and-foundation atom as the free way to find the pages behind the gaps.** |
| Foundation, site-wide (host shell, free) | `curl robots.txt`; homepage as OAI-SearchBot / PerplexityBot / browser | Shopify robots; no AI search or training bot blocked; all three agents get 200 (no CDN blocking); sitemap declared; canonical present; key copy visible without JavaScript |
| Foundation, pages | `curl` home, `/collections/cleansers-moisturizers`, `/products/overdew-barrier-cream`, `/pages/faq` | **Homepage `<title>` is just "Personal Day"** — no category words (a likely this-week fix: title + answer-first opening). Collection title "Cleansers & Moisturizers – Personal Day", meta description good. Product page: Product + Offer + AggregateRating + FAQPage markup present. FAQ page: 24 Q&As with FAQPage markup (no Google rich result since May 2026; still liftable text) |
| Question set (drafted, not saved — needs the human's yes) | — | e.g. best acne-safe moisturizer that won't clog pores · non-comedogenic skincare brand for acne-prone skin · hypochlorous acid spray for acne · blackhead nose strips that actually work · Personal Day vs CLEARSTEM · is Personal Day skincare legit · Personal Day reviews · what is Lili Reinhart's skincare brand |

**Stopped before the first paid step.** Would have asked: "May I run one paid Google lookup — checking whether Google has your site indexed — so I can tell you the price?", then run `gooseworks:data_call_provider` (provider scrapecreators, `/v1/google/search`, query `site:personalday.com`, region US), then asked a yes to a ceiling covering ~13 question lookups + ~4 page index checks ("up to N credits", an estimate), logging each charge in `research/credits-log/<YYYY-MM>.md`. *(Credit flow updated in the 16 Oct cross-set fix pass; the staging run itself stopped before the probe.)* AI surfaces (ChatGPT, AI Overview, AI Mode) were not observable from this host without a logged-out browser — the run would hand the human the 20-paste minimum set (4 must-wins + "is Personal Day skincare legit").

Not run: Reddit/YouTube presence (`/v1/reddit/search`, `/v1/youtube/search`, paid); `brand_update` learning write-back (only after the human has read a report).


## Re-run — 18 Oct, Sonnet, staging, GooseWorks, Akhil's exact ask ("I need to improve my SEO and EEO for Goosework's brand.")

Free pass only; the paid Google top-up was offered and declined (0 credits).
- **Stops:** 0 before the first answer (the 18 Oct hand test had 4–5); 1 gating message in total.
- **First message:** ChatGPT names Gooseworks on 5 of 5 brand questions and 0 of 8 buyer questions (the 3 most important asked 3 times each); Creatify, AdCreative.ai, Canva, Arcads win instead from vendor lists, Reddit and rivals' pages; Google's AI answer to "is Gooseworks legit" describes a namesake (Gooseworx); draft five fixes; one credit yes; assumptions from the last run to confirm.
- **Report:** `gooseworks-reports/gooseworks/2026-10-18-search-visibility.md` in the marketer's folder, clickable; saved to the brand with a working link. Write-report §3: pass (see critique.md round 6 for the minor slips, fixed in the template).
