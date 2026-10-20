# From gap to fix

Load at step 4 (pattern and fixes).

## Find the pattern (countable statements only)
1. Take the cited URLs from lost and partial rows; classify each by source type.
2. Count by stage and surface. Write statements a reader can check: "6 of 8 lost comparison runs cite rivals' own 'vs' pages; Halden has none." "Category answers cite three listicles; Halden is in none." "Brand answers call Shiftwise 'an AI workforce platform' (its 2022 positioning) — traced to its Crunchbase profile."
3. For each lost key question, open the passage the engine lifted from the winner and the brand's nearest page. Note what the winner has: a first sentence that answers outright, the entity named, numbers (price, size, counts), a comparison table, a visible date, a page that matches the intent at all.

## Lever by cause
| Cause | Fix type | Counts in the five? |
|---|---|---|
| Our page blocked, unindexed, JS-only, wrong canonical | foundation fix (exact line or setting) | yes — blockers first |
| Our page exists but can't be lifted | rewrite: title, meta, H1, answer-first opening, fact block, Q&A block, internal links | yes |
| Near-winner on Google (positions ~4–15, or impressions high and clicks low) | title/meta rewrite, refresh, internal links from strong pages | yes |
| No page for the intent | page brief to make-content (comparison, alternatives, use-case, location page) | no — listed under the five |
| Name collision (engines answer about a namesake: "is <brand> legit" returns another company) | a visible one-line "who we are — not <namesake>" on About and the homepage, the brand's full name in every page title, consistent profiles, `alternateName` / `sameAs` in the existing Organization markup | yes — usually fix #1 |
| Wrong or old brand description in answers | entity fix: exact field values on the profile the engine cites, plus our About page and Organization markup | yes |
| Absent from cited listicles / review roundups | inclusion request: one drafted email to the page's editor naming the page, the gap and the facts (the human sends it) | yes, if the cited page is maintained and plausibly updated |
| Review platforms thin (count, recency), or reviews filed under an old name or domain | the ask: a review-request flow brief to email-lifecycle (a post-purchase or post-install ask with the direct review link; Google Business Profile reviews where the business has one); an old-domain profile → claim it and point it at the current site, or ask the platform to merge (replying to reviews is not covered yet) | yes (the brief) |
| Old, duplicate or wrong pages (a retired range, a merged page, old claims still live) | **301 redirect to the matching page + update internal links** (the default); noindex only when no equivalent page exists. First check what still points there — live ads, emails, profiles: a redirect keeps them working; a noindexed page left live for ads still shows its old claims, so fix the claims or move the ads | yes |
| Reddit/forum threads cited, brand absent | name the threads; a disclosed founder reply the human may post | only as the disclosed reply |
| YouTube videos cited | video brief to make-content | no |
| Answer from training memory (no search) | name it; entity and third-party fixes help over months; nothing promised this week | no |
| No Search Console / no Bing Webmaster Tools | verification + sitemap submission, exact steps for the site's CMS | yes — 15 minutes, and it unlocks the next run's data |
| Retrieval crawler blocked (robots or CDN) | a proposal with the exact robots line or CDN setting and the risk | yes, after the human's yes |

## Hard limits
- No Wikipedia article about the brand (notability and conflict-of-interest rules). Wikidata only with ≥ 2 independent published sources, each statement referenced.
- No posts that hide the poster's tie to the brand; no fake reviews; no incentive tied to a positive rating, no undisclosed incentives, no review gating. A platform's own disclosed review programme (G2, Capterra gift-card campaigns) is fine.
- No llms.txt as a fix: no major engine has confirmed using it; Google says it uses no special AI files or markup.
- Schema is hygiene, not a citation lever: valid Product/Offer, Organization (+sameAs), LocalBusiness, SoftwareApplication, Article, Breadcrumb. FAQ rich results are no longer shown by Google (removed for all sites May 2026); a visible Q&A block still helps engines lift answers, and FAQPage markup is optional and harmless.
- Competitor facts on our pages need a public source and must respect the human's stance on naming rivals.

## The inclusion request (template, drafted not sent)
```
To: [editor or contact found on the page; "find on the page" if none]
Subject: [Page title] — a [category] option for [the page's audience]
Hi [name], your "[page title]" ([URL], updated [date]) covers [category] for [audience]. [Brand] is [one-line description, canonical]. For your readers: [2–3 checkable facts — price, the one difference, a proof point from the approved claims]. [One reason the editor's readers gain: a data point only the brand has, a real side-by-side test they can reproduce, or an honest "when not to use us" line — not just "happy to give you a free account".] Happy to set you up to test it. [Name, role, brand]
```
Many "best X" lists are affiliate-driven; if the cited lists all carry affiliate links, say so and note that an affiliate programme may be the real ask (a decision for the human, not drafted here).
