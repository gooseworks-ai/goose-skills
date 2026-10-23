# Human version

The SEO playbook now handles the five requested jobs without a new playbook: scoped audits, ranking/topic gaps, subject clusters, domain metrics and pSEO blueprints. Eight fictional example reports demonstrate the outputs and their missing-data behavior. Local checks pass; live paid extraction and a fresh isolated model run were not verified.

---

# Agent version

## Current acceptance cases — 22 October 2026

Read `fixtures/coldfield.json`, execute the requested branch and compare the result with `fixture-reports/`. The supplied .test domains and metrics are fictional. Setup and source observations are supplied by the fixture; no live source is fetched. These reports were produced by a manual walkthrough in the implementation chat, then checked against the evidence. They are not a fresh-agent benchmark or proof of live extraction.

| Exact request / condition | Output to inspect | Required behavior |
|---|---|---|
| Audit our site's SEO and tell me the top 10 fixes | [Audit example](fixture-reports/audit.md) | Ten distinct supported findings; blockers first; all 18 supplied pages inventoried; parameter sampling declared; URLs, action, owner/effort, verification and structural risk/undo |
| What topics do competitors rank for that we haven't written about? | [Gap example](fixture-reports/gaps.md) | Topic/query matrix; dated ranking URLs/positions; ratio is an update, iced-coffee comparison already covered; existing unranked latte page stays a candidate |
| Map a topic cluster for cold brew coffee | [Cluster example](fixture-reports/cluster.md) | Pillar plus supporting intents, links/anchors and order; quantity vs dilution boundary; no site, capacity or keyword-provider gate |
| Pull SEO metrics for us and two rivals | [Native SEO example](fixture-reports/metrics.md) | Use the actual managed-operation contract with synthetic native responses; three domains, sourced DR/link/traffic fields; absent market/window and keyword count remain explicit |
| Plan pSEO page sets | [pSEO example](fixture-reports/pseo.md) | Family selection, template, typed fields/sources, records, useful differences, quality/index rules, pilot and engineering review; city set rejected, unknown model held |
| SEO source unavailable | [Missing-source example](fixture-reports/metrics-missing.md) | Incomplete; unavailable values, prerequisite and no fake/paid call |
| Only total website traffic available | [Traffic-only example](fixture-reports/metrics-traffic-only.md) | Website traffic separate; no organic count inferred from channel share; requested SEO fields remain incomplete |
| Existing authorized customer SEO report | [Export example](fixture-reports/metrics-export.md) | Read the supplied consistent export without demanding a new connection; preserve source, market, period and score scale |

Run the local evidence checks from this folder:

```bash
python3 tests/run-fixtures.py
```

**Executed:** all eight cases passed. The checks validate source matching, requested count, priority blockers, covered-vs-new topics, ranking vs page existence, link closure, per-page data readiness, native metric mapping and missing-value behavior. They make zero model, network, provider, write-back or paid calls. Passing them confirms these example artifacts, not how a future agent behaves.

**Fresh isolated model test limitation:** an attempted tools-disabled Claude CLI run could not initialize inside the sandbox. Automatic approval review then rejected the elevated run because it could send internal skill/fixture text to an external service without specific authorization. It was not retried or worked around. No external model report was produced. A new isolated model run needs that authorization; manual fixture execution and local checks remain available meanwhile.

**Live metric test prerequisite:** the deployed connection must list `marketing_data_describe` and `marketing_data_lookup`; an approved request-bound quote is required before a paid `domain_seo_metrics` / `domain_seo_overview` run. Verify returned fields, native dates/market, partial failures and actual charge receipt. Backend free verification of credentials and active actor schemas is not a paid extraction test. No live paid run, brand save, site change or send was made here.

## AI visibility regression (existing branch)

On an explicit ChatGPT/Google visibility request, preserve the free evidence pass, fresh answer counts and sources, comparable history, one credit decision and readable linked report. The default weekly slice is five fixes; an explicit count overrides it. Unchecked engines and earlier observations never become today's misses or counts. Repeat checks evaluate actual shipped changes after the recorded review timing; one noisy flip does not establish a trend.

## Historical run notes

The records below describe earlier versions and their actual tools/limits. They are retained as evidence; their old intake and two-stage credit wording is not the current procedure.

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
