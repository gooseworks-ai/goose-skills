# improve-search-visibility — server needs

What the playbook needs that the GooseWorks MCP does not have today (staging tool list read 2026-10-16). Each entry: the need, the step that needs it, and what the playbook does meanwhile.

## 1. An AI-answer check tool (the core gap) — HIGH

- **Need:** ask ChatGPT (with search), Google AI Overviews / AI Mode, Perplexity and Gemini a list of questions, N runs each, from a stated country, logged-out; return the verbatim answer, the brands named in order, and the cited URLs. Priced per question-run, quoted before running.
- **Step:** 1 (free pass) and 3 (top-up). It is the headline of the done-when ("where you are and are not cited").
- **Candidate:** GooseWorks' own `goose-aeo` engine, run server-side behind `gooseworks:data_call_provider` with GooseWorks' keys: it already generates questions, repeats queries across engines (ChatGPT, Perplexity, Gemini, Grok, Claude, DeepSeek), scores mentions and diffs runs over time. Hosted that way it would make scheduled monthly re-checks possible (today a scheduled run has no browser). Its rows are labelled "asked through the engine's API", never "what a buyer sees in the app", and it never returns to a skill as a vendor key.
- **Meanwhile:** Google organic results come through `gooseworks:data_call_provider` (provider scrapecreators, path `/v1/google/search`, paid; organic results only, page one — no AI Overview, no People-Also-Ask, no local pack). AI answers are read one of two ways: (a) a host with its own logged-out browser runs the questions itself; (b) otherwise the human runs the minimum paste set (5 questions: up to 4 key questions plus at least one brand question; ChatGPT twice, AI Overview and AI Mode once each — 20 pastes) in plain steps. Note for the orchestrator: the GooseWorks server instructions tell hosted agents never to send the customer to another app or ask a technical question; this playbook's paste set needs a carve-out for "open ChatGPT and copy its answer here". The report labels every row with how it was observed. The playbook never presents an organic-results read as an AI-answer read.

## 2. A home for the question set and visibility history — HIGH

- **Need:** a typed brain section "search terms we compete on" (source map §8): brand terms, priority questions per surface (Google, AI answers, app stores), negatives, the competitor-name stance, and dated visibility snapshots (question × engine × cited/named/absent).
- **Step:** 1 (question set), 5 (write-back); every re-run compares against it.
- **Meanwhile:** workspace files `search/questions.md`, `search/page-map.md` and `search/visibility/<date>.md`, saved to the brain through the shared save-to-brain atom (stops on any price; verbatim runs kept out with `import: no`); only human-stated rules go through the shared save-learning atom.
- **Brand Brain (staging, 19 Oct):** the brain now has chapter 8 "Search terms", but `brain_save` has no target for it, so the question set stays a workspace file plus brand document. A typed search-terms target would let other playbooks read the buyer questions directly.

## 2b. A home for the page map — MEDIUM

- **Need:** a typed brain section for the cluster → page roadmap (cluster, questions, demand, page, state, priority, quarter), versioned.
- **Step:** 4 (roadmap and the five fixes drawn from it).
- **Meanwhile:** `search/page-map.md` plus the brand document "Search page map — <Brand> — <date> v<N>" through the shared save-to-brain atom (`versioned: supersede`).

## 3. Search Console read — MEDIUM

- **Need:** read-only Search Console: queries, pages, clicks, impressions, average position, indexing status, 16 months.
- **Step:** 1 (question set and foundation check — real queries, indexed or not, near-winners at positions ~4–15).
- **Meanwhile:** ask the human for a Performance export (last 3 months, queries + pages) or a screenshot of Pages > Indexing; if the host agent already has a Search Console connector of the customer's own, read through that. Without it, indexing is checked with a `site:` query (organic results via the proxy) and the near-winner step is skipped and named as skipped.

## 4. Page fetch and page-speed read — MEDIUM

- **Need:** fetch a public URL as Googlebot would (status, redirect chain, headers incl. `x-robots-tag`, raw HTML vs rendered text, JSON-LD), fetch `/robots.txt`, and read PageSpeed field data (CrUX) for a URL.
- **Step:** 1 (page read and foundation check).
- **Meanwhile:** the host agent's own web fetch (or shell `curl` + the public PageSpeed Insights API) does it. A hosted chat that cannot fetch marks those items "not checked — <why>" and lists them as a developer checklist; it never asks the human for view-source.

## 5. App store listing read — MEDIUM (apps only)

- **Need:** read an App Store / Google Play listing (title, subtitle/short description, description, screenshots, ratings count and average, recent reviews) for the brand and 3 competitors; organic keyword rank where available.
- **Step:** 1 (store listing audit).
- **Meanwhile:** the host's web fetch reads the public listing pages; the human pastes the App Store Connect keyword field (not public). Keyword ranks are not claimed.

## 6. Reddit / YouTube / review-site presence read — LOW

- **Need:** "is the brand mentioned in the threads and videos that answer engines cite".
- **Step:** 6 (pattern) and 8 (third-party footprint).
- **Exists today:** `gooseworks:data_call_provider` scrapecreators `/v1/reddit/search` and `/v1/youtube/search` (paid). Not used by any step yet: the citation check already shows when Reddit or YouTube are cited. Adding them would go inside the same credit total.

## 7. Price check for scrapecreators calls — LOW

- **Need:** `gooseworks:data_price_provider` covers fal and ElevenLabs only. The playbook cannot quote a scrapecreators run in credits before asking the human.
- **Meanwhile:** the shared spend-gate's proxy branch: a yes to one probe (the site-wide `site:` lookup, which also answers "indexed?"), then a yes to a ceiling "up to N credits" labelled an estimate, stop at it, log every charge. The playbook never shows its own sum as a price.

## 8. Keyword and SEO data behind the proxy — HIGH (the biggest craft gap in the 19 Oct old-vs-new review)

- **Need:** a licensed keyword and SEO data provider on the GooseWorks proxy (`gooseworks:data_call_provider`), e.g. DataForSEO — the one the old programmatic-SEO and topic skills recommended: search volume and difficulty per query; keywords each rival page (or page pattern) ranks for; rival traffic estimates; backlinks. App-store search popularity for apps.
- **Step:** 1 (question weighting, rival content map), 4 (roadmap demand column and priorities), and backlog #17 (the B2B content roadmap: topic gaps, templated-page planning).
- **Meanwhile:** Search Console impressions when shared; Google Trends and autocomplete (relative only); a vendor estimate only if the brand already has that account. Otherwise the demand column says "no demand data, ranked by judgment". Volumes are never invented, and the provider never comes back to a skill as a vendor key (AGENTS §2.4). Scraping Semrush or Ahrefs pages is not a substitute (fragile, and against their terms).

## 9. Local pack and Maps rank — LOW (local businesses)

- **Need:** who appears in the Google local pack and Maps for "[service] near me / in [city]", per location.
- **Step:** 8 (local module), 9 (page map).
- **Meanwhile:** the agent's browser in a private window set to the city, or the human's screenshots; otherwise "not checked".
