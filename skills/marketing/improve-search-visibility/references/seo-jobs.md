# Human version

Match the work to the request. An audit needs ranked findings, a competitor gap needs topic and ranking evidence, a cluster needs a page architecture, and a pSEO plan needs useful templates and real data. These jobs share research; they do not all need an AI-answer survey.

---

# Agent version

## Choose the branch

| Request | Job slug | Required result |
|---|---|---|
| Audit our SEO / technical audit / traffic drop | `seo-audit` | coverage statement, evidence-backed findings, requested number of priorities (default ten), verification and handoff |
| Topics/keywords rivals rank for that we lack | `keyword-gaps` | query/topic gap matrix with rival ranking URLs and own coverage, ranked create/update actions |
| Map a named subject, such as cold brew coffee | `topic-cluster` with subject slug | pillar, supporting pages, intent boundaries, links and sensible order |
| SEO metrics for domains | `seo-metrics` | comparable dated domain table and source/coverage notes |
| Plan templated or programmatic SEO page sets | `pseo-plan` with subject slug | ranked page families, template/data blueprint, pilot and quality checks |
| Am I in ChatGPT / Google answers? | `search-visibility-check` | observed per-question visibility, page map and this-week fixes |

Use only the selected sections. User-specified domains and counts win; a subject-only cluster does not need a site or competitors. A broad "improve my SEO" defaults to an audit, with AI visibility added when the request or findings make it relevant. For mixed asks, combine the outputs in one report and identify the main job for the run record.

## Site and technical audit

1. **Inventory and coverage.** Read sitemaps (including children), robots declarations, feeds and relevant navigation/index pages. Record discovered URLs, page types and discovery limits. A 25-page discovery result is a lead, not the site's inventory. Apply `foundation-check.md` site-wide checks, then inspect important landing/product/category/content pages and each relevant template, including unusual URL states and recent changes. A small site can be checked fully; a large one needs stated representative coverage. Expand a sample when defects vary within a template. An explicitly complete audit remains incomplete where pages could not be checked.
2. **Diagnose at the requested depth.** Check crawl/index controls, status/redirects, canonical/hreflang, rendering, internal discovery/linking, duplicate or competing intents, titles/headings/content usefulness, structured data and speed evidence. Include migration/faceted-navigation risks when those structures exist; describe the affected patterns and engineering investigation needed rather than pretending to have server logs or complete crawl data. With a traffic drop, use Search Console and the foundation reference's cause distinctions. Mark pass/fail/not checked per check and scope.
3. **Add performance context.** Use `seo-data.md` for own-site data and comparable domain metrics when available; show source and market. A missing paid source does not hide visible crawl/content failures or become an invented zero.
4. **Rank the findings.** Use `prioritising.md`; return the requested count, ten by default. Each item names the affected URL/template, observed evidence with source/date, likely consequence, exact action or engineering handoff, owner, effort and verification. Structural actions include risk/undo. Ten findings are not a promise to implement ten changes this week. If only seven are supported, report seven.

**Acceptance:** the report answers the audit request directly, declares coverage, distinguishes confirmed defects from hypotheses, checks blockers before copy polish, and supplies the requested priority count or a defensible smaller number. Template samples never become a claim that every page passed.

## Competitor topic and ranking gaps

1. **Own inventory first.** From sitemaps/feeds/indexes and available site search, collect titles/URLs and infer candidate topics/intents. Open likely matching pages before declaring a topic absent or weak. Record how complete the inventory is; with partial discovery use "no matching page found in checked inventory", not "you have never written this".
2. **Find competitor opportunities.** Reuse `rival-content-map.md` for page families. For topics, inspect rival titles/pages and ranked-query/page data from `seo-data.md`; free search can verify selected queries when a full ranked-keyword source is unavailable. Candidate coverage alone is not proof of ranking.
3. **Verify and classify.** Each ranking claim has query, region/language, observation date, rival URL and position/result scope. Match our content by intent, not exact title. Mark absent, weak, overlapping or covered. Keep promising topics without ranking evidence in a separate "topics to validate" list. "Not on page one" never means "does not rank anywhere".
4. **Deliver the matrix.** `Topic / query | Buyer intent | Rival URL and observed rank | Our matching URL / coverage | Gap / action | Demand source or unknown | Priority / reason`. Add provider estimates when available, clearly sourced. Prioritize relevance, attainable intent and useful differentiation. Numeric volume/difficulty are helpful, not prerequisites. A selected-query sample is not an exhaustive competitor keyword census.
5. **Give the next action.** Recommend create/update/merge/keep, with a short brief starter for the leading gaps. Use existing page briefs if the user requested execution-ready briefs; do not add an entire calendar by default.

**Acceptance:** topics and page types are distinct, each claimed ranking is supported, existing own content is checked, and the result tells the marketer what to create or update. State both ranking-data and inventory limits.

## Subject-led topic cluster

1. **Research the subject and audience.** Use supplied audience/market and known brand context; otherwise state a reasonable general-reader assumption. For cold brew coffee, investigate the process, ratios, equipment/beans, troubleshooting, storage and serving questions using source pages, search suggestions and results. Avoid generic lists unrelated to the subject.
2. **Separate intents into pages.** Group queries by what one useful page can answer. Keep one primary intent per page; inspect overlapping results where boundaries are uncertain. A pillar covers the subject and routes to deeper pages. Supporting pages earn a separate URL through a distinct task, question or depth, not a word-count quota. Existing content maps to keep/update/merge/new when a site is supplied.
3. **Deliver the map.** Show a simple tree or table: `Page / working URL | Role (pillar/supporting) | Intent / questions | Existing or new | What makes it useful | Priority`. Add pillar→supporting and supporting→pillar links, relevant sibling links and natural anchors. Give a short build order, stating why the first pages come first. One subject does not require a full site architecture or calendar.
4. **Demand is optional enrichment.** Use `seo-data.md` only when the request calls for measured prioritization or the source is already available within authorization. Otherwise say "ordered by reader need and judgment; volumes not measured". No provider is needed to create the basic architecture; do not invent volumes/difficulty or claim topical coverage guarantees rankings.

**Acceptance:** a reader can see the pillar, supporting intents, linking and order; close duplicates are resolved; a site, rivals, paid keyword numbers and publishing capacity are not mandatory inputs for a basic map.

## Programmatic SEO page-set plan

1. **Discover page families.** Reuse the rival pattern counts and samples in `rival-content-map.md`; evaluate patterns suited to the actual product (comparisons, integrations, use cases, locations, templates, tools, etc.). Inventory our existing families. Rival page count is investment evidence, not search demand or traffic.
2. **Qualify the families.** For each, explain buyer intent, demand evidence (source or unknown), product fit, unique value per variation, data availability and build feasibility. Test representative head and tail variations with search; use managed keyword estimates when available. Do not infer numeric traffic from authority × page count. A family with no useful variable data or no distinct user benefit is rejected or parked, with the reason.
3. **Blueprint every recommended family.** Supply URL/slug pattern; title/meta/H1 templates; sections and internal links; per-page variable fields, field types, sources and freshness; example records/pages; ownership of updates. Explain which parts vary and how the page stays useful beyond substituted names. Rival facts require current sources; product/comparison copy remains subject to claims and naming gates.
4. **Technical and quality plan.** State CMS assumptions and prerequisites. Define unique URL/canonical rules, handling of overlapping or empty variants, sitemap/hub discovery, rendered/indexable content, refresh/removal process and checks for duplicate/unsupported claims. Review representative rendered examples before a pilot; publish only useful, complete variants after approval. Diagnose missing access instead of inventing integrations.
5. **Sequence the build.** Rank families by evidence, intent, useful data and effort. Give a small representative pilot, success/quality checks and a decision on expansion. Counts and dates match the actual data and capacity; do not prescribe hundreds of pages or guaranteed traffic. Engineering receives the blueprint; full page production is a later requested job.

**Acceptance:** the marketer and engineering can assess the page set, template, data and pilot without another discovery exercise. Pattern discovery plus one example page is not a complete pSEO plan. Missing keyword metrics limit demand confidence, not the ability to draft the useful blueprint.
