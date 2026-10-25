# Human version

Use real, dated search evidence and comparable metrics. Website visits, organic search traffic, keyword rankings and backlink scores measure different things. Show unavailable fields honestly; a successful traffic lookup does not complete a request for SEO metrics it cannot supply.

---

# Agent version

## 1. Inspect access before a lookup

Read the live tools and the `marketing-data-access` skill (`../../marketing-data-access/SKILL.md`). Use a listed customer connector or existing export for its supported data. Own Search Console reports provide clicks, impressions, query/page positions and indexing for that property; they do not reveal rival Search Console data or equivalent vendor domain estimates.

The managed marketing-data interface, **only when listed**, is:
- `gooseworks:marketing_data_describe`: free operation discovery and native parameter schemas; read it first. An `available: false` result is missing setup, not permission to use another provider directly.
- `gooseworks:marketing_data_lookup`: request the exact supported operation, starting with `quote_only: true`. It returns a quote and request-bound token; after the user's yes, execute that unchanged request with `quote_only: false`, the quote token and approved credit ceiling, following the live schema. If either tool is absent, label this managed source unavailable; never invent the call or operation.

The curated SEO operations take `query: {domain: <domain>}`:
- `domain_seo_metrics`: managed Ahrefs actor, with authority, traffic and backlink sections requested by the service.
- `domain_seo_overview`: managed Semrush actor, using the service's verified domain input.

The free quote returns `status: quoted`, `source`, `cost` (SEO actor runs: `kind: maximum_budget`), `quote_token` and expiry. Execution returns `status: success` or `partial_failure`, native `data` items, `source`, `cost`/debit receipt and limitations. A partial failure is incomplete evidence, not an automatic retry. These are provider-native datasets. Inspect actual returned fields before using them: a requested section is not proof that every metric was returned. Record source-specific names/scales, dates, coverage and missing values. For example, Ahrefs items may use `domain_rating`, `backlinks`, `refdomains`, `website_overall_search_traffic` and `data_captured_at`; Semrush may use `domain_authority`, `organic_search_visits`, `organic_keywords` and `scrapedAt`. Keep Semrush authority distinct from Ahrefs DR. An `organic_keywords` array is a returned list, not the domain's total keyword count. Different result types may appear as separate dataset items; match domains and metric meanings before combining. A source may expose no usable ranking-page list or difficulty data even when its domain overview succeeds. Inspect `marketing_data_describe` for supported operations; never invent a ranked-keyword operation.

The separate `website_traffic` operation takes `query: {company: <domain>}` and supplies estimated **total** visits/channel shares. Keep it separate from organic traffic, keyword counts and authority. A channel share is not a count of organic-search visits; do not multiply it into a substitute SEO metric. A missing value is not zero.

A free quote for an actor run is a **maximum spending cap**, not a guaranteed exact bill. Present its wording and returned credits; execute only after approval for that bound. The service controls actor inputs, limits and billing. Validate the result's actual charge/receipt and never rerun a failed paid job without the approval required by spend-gate. A source absent from the live description remains unavailable despite this reference.

No local vendor keys, direct actor runs or scraped analytics dashboards. Additional requested fields without a supported source stay explicit prerequisites in the report.

## 2. Obtain and validate the evidence

1. Fix the requested domains, country/language and period from the request or known market. State assumptions. Reuse only fresh enough, same-method evidence; never pass an older run off as current.
2. Gather free own-property data, supplied reports and selected search observations. A sitemap is content coverage, not indexing or traffic proof. Search observations support the queried results only, with engine/region/date and checked depth.
3. For the requested domain metrics, acquire the fields the actual source supports. Use `marketing_data_describe` and a free quote for each exact domain request when available. Combine the needed quotes in one approval through the `spend-gate` skill (`../../spend-gate/SKILL.md`); credits come from returned quotes, not invented prices. Keep the request/token binding and stop at the agreed total and per-request ceilings. A quote failure or unavailable source leaves the read unexecuted and visible.
4. After approval, execute the unchanged supported requests. Validate domain, metric meaning, units, period and source. Record the response's date/coverage, retrieval timestamp, credit receipt and limitations. Values from incompatible providers/markets/windows are not a direct comparison; display the mismatch or keep separate.
5. If a supported SEO source returns the requested fields, use them with their provenance and limits. If domain overviews do not return ranked keywords/pages, an exhaustive rival keyword list still needs another supported source. Free public search still permits a clearly scoped topic/ranking-gap sample; subject architecture and pSEO blueprints can proceed without fabricated numeric demand.

## 3. Show the requested metrics

Use a metric-by-domain table with enough context to compare:

`Metric | Us | Rival A | Rival B | Source / market / period | Caveat`

Relevant rows: organic-search traffic estimate, organic ranking-keyword count, referring domains/backlinks and a source-specific authority score **when actually returned**. Label provider estimates. Do not combine different authority scales. If supported, show top organic pages and ranked keywords in their own small tables with URLs and query evidence. The supported total-visits/channel-share source belongs in a separately labelled website-traffic section, not under an organic-search heading.

Include unavailable requested rows and a short reason (unsupported source, absent access, denied spend, failed response or no provider data), with the exact prerequisite to finish. A metrics-only report that cannot obtain the requested SEO measures is **incomplete** even if it contains website visits. An audit can still deliver confirmed free findings while naming its missing performance context.

Save the dated table, source metadata and limitations to `search/metrics/<date>.md`; the main report includes the useful comparison, not only a link to raw evidence. Re-runs compare like metrics, markets, periods and methods.
