# Rival content map (free)

Load in the free pass (step 1). It answers the content-strategy question a single page fix can't: **what kinds of pages do the rivals have that we don't?** ("They have 12 comparison pages and 40 integration pages; you have none.") Everything here is free: sitemaps and the host's own fetch (marketing-guide §3, "Public data"; the `marketing-data-access` skill (`../../marketing-data-access/SKILL.md`) lists sitemaps as a free source).

## Who to map
The brand plus 3–5 rivals: the tracked roster (`competitor_read`) first, then any rival the engines named most often in this run. Never more than five — the point is the pattern, not a census.

## 1. Read each sitemap
`/sitemap.xml`, else `/sitemap_index.xml` (follow its child sitemaps), else the `Sitemap:` line in `/robots.txt`, else the blog feed (`/feed`, `/blog/feed`). No sitemap and no feed → "not mapped — no sitemap" for that site; never crawl a site page by page. Hosts that can't fetch → "not checked" and say why.

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

Gap = we have none (or far fewer) of a type at least two rivals invest in **and** the type matches a buyer question in our set. A type everyone has is not automatically ours to copy: weigh it against what buyers ask (don't follow the herd). Counts come from sitemaps on the date read; in the story say it plainly ("from each site's public list of pages, read 19 Oct — it can miss pages"), never the word "sitemap" outside the developer section.

## 5. Where it lands
- A gap type that answers questions in our set becomes a **needed** row in the page map (one brief for the first page of the type, not the whole set), with the rivals' best example cited.
- A rival templated set scoring ≥ 4 on a question we lose explains *why* we lose it — say it in the pattern.
- Building a whole templated set of our own (e.g. "us vs every rival") is not a this-week fix and not this playbook's job yet: the report says so in "What we're not doing", and the page map holds only the first page of the type.

## Not done here — seed for the B2B content roadmap (backlog #17)
These parts of the old SEO skills need keyword data or a new job and wait for backlog card #17 (and server-needs §8):
- **Topic gap table** — topics each rival covers that we don't, and topics nobody owns, with volume and difficulty.
- **Templated-page planning** — scoring each pattern ("vs {rival}", "{tool} integration", "for {industry}") by demand, data availability and feasibility; the template blueprint (URL, title and meta templates, H1, sections, data per page); a build sequence.
- **Keyword validation** of each pattern's head and tail terms.
- **Topic-cluster architecture** at site scale (pillar and cluster pages for a whole subject).
