# Rival content map (free)

Use for the requested competitor, audit or pSEO branch. It answers **what kinds of pages do the rivals have that we don't?** ("They have 12 comparison pages and 40 integration pages; you have none.") Everything here is free: sitemaps and the host's own fetch (marketing-guide §3, "Public data"; the `marketing-data-access` skill (`../../marketing-data-access/SKILL.md`) lists sitemaps as a free source).

## Who to map
Use the requested rivals. Otherwise choose a focused set from the tracked roster (`competitor_read`) and observed search competitors, explaining the selection. The requested comparison count wins.

## 1. Read each sitemap
`/sitemap.xml`, else `/sitemap_index.xml` (follow its child sitemaps), else the `Sitemap:` line in `/robots.txt`, else the blog feed (`/feed`, `/blog/feed`). If these are absent or incomplete, inspect public blog/resource/navigation indexes or available crawl exports for the requested scope. Record discovery methods and limits; do not imply the sitemap is a complete content inventory. Hosts that cannot fetch mark the unavailable checks and say why.

## 2. Sort every URL by page type
Use the URL first, the page title when the URL is unclear. Adapt patterns to the site (a `/compare/` folder is the same type as `/vs/`).

| Page type | Typical URL patterns |
|---|---|
| Comparison ("X vs Y") | `/vs/`, `/compare/`, `-vs-` |
| Alternatives | `/alternatives/`, `/alternative-to-` |
| Integration | `/integrations/`, `/apps/`, `/marketplace/` |
| Use case or role | `/use-cases/`, `/for-`, `/solutions/`, `/roles/` |
| Industry | `/industries/`, `/for-<industry>` |
| Template or example | `/templates/`, `/examples/` |
| Glossary or "what is" | `/glossary/`, `/what-is/` |
| Free tool or calculator | `/tools/`, `/calculator` |
| Case study | `/customers/`, `/case-studies/`, `/stories/` |
| Pricing | `/pricing` |
| Docs and help | `/docs/`, `/help/` |
| Blog (editorial) | `/blog/`, `/posts/`, `/articles/` |
| Location | `/locations/`, `/<city>/` |
| Other | anything else |

## 3. Spot the templated sets
A type with dozens of near-identical URLs that vary on one thing (a rival's name, a tool, an industry, a city) is a templated set. For each: page count, what varies, whether it looks clean or auto-generated. Sample 3–5 pages per set (one obvious, one long-tail, one in between) and score each 1–5 on:

| Dimension | What to look for |
|---|---|
| Depth | real sections and detail, not a paragraph swapped per page |
| Unique value per page | facts that only this page has (a real comparison, real integration steps) |
| Data | tables, prices, screenshots, specifics |
| Freshness | a visible date, current prices |
| Internal links | links to related pages and back to a hub |

Average ≥ 4: well built, hard to beat without a real difference. 3–4: beatable with better pages. < 3: thin — easy to beat, and a quality risk if it's ours. Our own templated sets use the same score (and the foundation check's risk rule).

## 4. The page-type gap table (goes in the report's story)

| Page type | You | Rival A | Rival B | Rival C | Gap? |
|---|---|---|---|---|---|
| Comparison | 0 | 12 | 8 | 3 | **yes** |
| Integration | 2 | 40 | 28 | 15 | partly |
| Case study | 0 | 22 | 15 | 8 | **yes** |

A candidate gap means we lack useful coverage for an intent relevant to our buyers while a checked rival invests in it. Two rivals provide stronger evidence, not a prerequisite. A type everyone has is not automatically ours to copy: weigh it against what buyers ask (don't follow the herd). Counts come from sitemaps on the date read; in the story say it plainly ("from each site's public list of pages, read 19 Oct — it can miss pages"), never the word "sitemap" outside the developer section.

## 5. Where it lands

For an AI-answer check, a relevant gap becomes a needed roadmap row and a first-page brief. For a topic/ranking-gap request, continue to the topic-level matrix in `seo-jobs.md`; page-family counts alone do not fulfill it. For a pSEO request, continue to the complete page-family blueprint, data model and pilot in `seo-jobs.md` rather than stopping at one sample page.

Use `seo-data.md` for ranking, demand and traffic evidence. A set's existence or template score never proves it ranks or drives traffic. Topic architecture and a useful pSEO blueprint can be drafted without numerical volume/difficulty, with demand confidence stated.
