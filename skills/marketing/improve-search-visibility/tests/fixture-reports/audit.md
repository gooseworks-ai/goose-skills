**Fictional fixture example — supplied test evidence, not a live site check.**

# Coldfield — SEO audit, 22 October 2026

## In short

We checked the supplied inventory of all **18 HTML pages**, plus specific navigation and sorted-URL examples. The category is marked not to appear in search, the filter product blocks the checked Googlebot request, and the brewer points search engines at a missing product. These confirmed access and indexing defects come before copy improvements. Start with the first three fixes, each as an engineering proposal for review.

## Coverage and limits

The evidence includes page responses, key HTML/rendered differences and a supplied mobile performance export. Parameter URLs were sampled; there is no complete facet crawl, server log or Search Console export. We cannot certify every filter combination or explain a traffic drop. No AI-answer survey was needed for this audit. Paid domain-metric extraction was not run in this fixture; the audit's confirmed findings stand on the supplied page evidence.

## Top 10 fixes

| Priority | Observed evidence | Action and reason | Owner / effort | Verify |
|---|---|---|---|---|
| 1 | `/collections/cold-brew` returns 200 but its HTML says `noindex`; the category is intended to be public (A1) | Remove the exclusion only from this intended public category. Search cannot index the intended page while that instruction remains. | Engineering. Agent: 5 min (S) - Human: 5 min | Public page returns 200 with intended index controls and canonical; inspect index status after recrawl. |
| 2 | `/products/filter`: ordinary request is 200; checked Googlebot request receives a CDN 403 challenge (A3) | Investigate the edge rule and allow verified search retrieval without opening an unrestricted bypass. | Engineering. Agent: 15 min (M) - Human: 10 min | Authorized bot fetch receives product content; protective rules remain effective. |
| 3 | `/products/brewer` names `/products/old-brewer`, a 404, as its preferred search URL (A2) | Point the intended product's canonical at its correct live URL after reviewing variant behavior. | Engineering. Agent: 5 min (S) - Human: 5 min | Target is 200 and matches the intended primary product; check variant samples too. |
| 4 | Brewer dimensions, price and description exist only in the rendered page (A6) | Serve the essential product facts and links in crawler-visible HTML. This is a rendering handoff, not a guess about the code. | Engineering. Agent: 30 min (L) - Human: 15 min | Raw response includes current facts; buying interactions and price freshness still work. |
| 5 | `/guides/clean-filter` is 404 and still linked/listed; `/guides/filter-care` already answers the task (A4) | Propose a matching 301 redirect, then update product links and sitemap to filter-care. | Engineering. Agent: 5 min (S) - Human: 5 min | Old URL redirects once to the live relevant guide; links point directly there. |
| 6 | Two checked sort variants return identical inventory and each declares itself primary (A5) | Decide the primary URLs and correct canonical/link behavior on the affected pattern. Expand the sample before applying a site-wide parameter policy. | Engineering. Agent: 15 min (M) - Human: 10 min | Approved sample variants point to intended primaries; useful navigation remains usable. |
| 7 | Filter page shows $19, while its existing product markup says $9 (A9) | Make the existing Offer price use the live product value. Avoid a second competing markup block. | Engineering. Agent: 5 min (S) - Human: 5 min | Visible price, currency and existing Offer block agree. |
| 8 | Category mobile field LCP is 4.8 seconds at the 75th percentile; INP 170 ms and CLS .04 are not poor in the supplied export (A10) | Profile the slow loading path, fix the measured bottleneck, then recheck. The evidence does not identify an image or script as the cause. | Engineering. Agent: 30 min (L) - Human: 15 min | Compare settled field measurements on the same page/device basis after the fix. |
| 9 | Both product titles say exactly `Shop | Coldfield`, despite different products (A8) | Give each product a distinct factual title, using the confirmed product names. | Site editor. Agent: 5 min (S) - Human: 5 min | Live titles distinguish brewer from filter without unapproved claims. |
| 10 | Ratio article gives one 1:8 recipe without explaining concentrate vs ready-to-drink (A11) | Update the existing article around that distinction and link a separate serving/dilution guide. Do not create a second competing ratio URL. | Content editor. Agent: 15 min (M) - Human: 10 min | Recipe uses are clear, validated facts are sourced, and the dilution link exists. |

## Implementation review

Each structural change needs an engineering PR and preview before approval. For priorities 1–3 and 6, retain the previous setting/mapping and test intended public/private paths before rollout; revert the narrow change if it breaks the approved behavior. For priority 5, confirm the destination matches the old cleaning intent and check campaign links before redirecting; undo by restoring the prior approved route. For rendering, preserve the current buying flow and use the prior implementation as rollback.

The implementation is unknown, so this report gives observed URLs and verification rather than invented CMS fields or code. A ten-item audit is a ranked backlog, not a promise that ten changes go live this week.


Sources: the supplied Coldfield fixture packet, dated 22 October 2026. These .test domains were not browsed. This local example was saved by the fixture exercise; saving to a live brand was not exercised. Nothing was changed, sent or published.
