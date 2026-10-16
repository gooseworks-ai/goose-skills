---
name: improve-search-visibility
description: >-
  "Am I in the answer when people ask ChatGPT or Google for products like mine?", "why does
  ChatGPT recommend my competitor", "check my AI visibility / AEO / GEO", "are we in AI Overviews",
  "SEO quick wins this week", "organic traffic is flat", "ChatGPT says something wrong about us",
  "fix my app store listing", "my Google Business Profile and local search". Agrees real buyer
  questions with you, checks ChatGPT and Google (organic, AI Overviews, AI Mode) and reports
  question by question where you are named, who wins instead and which sources the engines lean on.
  Reads the pages and profiles behind the gaps, keeps a cluster-to-page map as your search roadmap,
  and hands you five fixes finished enough to apply this week plus briefs for new pages. Never
  edits anything live. Not for writing the full page — use make-content; not Amazon or marketplace
  listings (not covered yet); not paid search — use run-paid-campaigns.
---

# improve-search-visibility

One marketer want: "When people ask ChatGPT or Google for products like mine, am I in the answer — and what do I fix this week?"

## What you get

1. **Visibility report** — opens "Do this first, because…". One row per agreed question × surface (ChatGPT with search, Google organic top 10, AI Overview, AI Mode; others when the buyer uses them): named in k of N runs, prominence, who is named instead, the cited sources by type, stable/unstable, how the row was observed (looked up / seen by the agent's browser / run by you), and the exact prompt so the marketer can check it. Brand questions add a fact check against the facts on file. Then **the pattern** behind the gaps in five lines or fewer. Before launch: "who owns your category answers and which sources to be in by launch".
2. **The page map** — the standing roadmap: every question cluster mapped to the page that answers it (existing or needed), with winnability, priority (weighted by real search demand when Search Console is shared), status and the quarter it belongs to. Kept across runs.
3. **Five fixes for this week**, drawn from the top of the page map — each finished: the exact text, code or field values, where it goes, who ships it, minutes, the gap it closes, why it ranks here, time to show, risk and undo. New pages the map calls for go out as **page briefs** (listed under the five, never counted in them).

## Before you start

1. **Connection and brand.** First GooseWorks call: `gooseworks:get_started` with the marketer's words (`wants: "more"`); it settles setup and the brand only. If a needed tool is missing, load its group once with `gooseworks:tools_load` (files, data, media, automation, brand). No `gooseworks:` tools listed after that → say only "Connect GooseWorks first — I check your search visibility through it." and stop. `gooseworks:brand_read` with no arguments lists brands: one → use it; several → the one the human named, else ask. Its `coworker_agent_id` is the workspace for every file below; no coworker → the default workspace with every path prefixed `brands/<brand-slug>/`, and say so.
2. **Read the brand brain.** `gooseworks:brand_read` with sections `summary`, `products`, `onboarding`, `competitors`, `learnings`, `sources` (lean is enough for the claims marker and every `must`/`dont`); `gooseworks:competitor_read`. Load `../../atoms/claims-gate/ATOM.md` and read the contract only (the sign-off marker's status and the "Claims you may use" facts); any scoped sign-off waits until step 10, when the lines the fixes need are known. Read research-market's `research/market/voc-bank.md` and `research/market/demand.md` (buyer words, how they search) if they exist.
3. **Read the last run.** `gooseworks:file_read` `search/questions.md` and `search/page-map.md`; `gooseworks:file_list` `search/visibility/` for the latest report and `content/drafts/` for page drafts whose first line names one of our `search/briefs/`. If a set exists this is a **re-run**: reuse it unless the human changes it, and diff only rows observed the same way both times.
4. **Find out before asking.** Is there an app? Look it up first: Apple's public search (`https://itunes.apple.com/search?term=<brand>&entity=software&country=<cc>`, country from the brain or `us`) with the host's fetch, and the Google Play store page the same way; if the host's fetch can't open a URL it built, use the host's web search ("<brand> app store"); ask only if both are unclear or unavailable. Read robots, sitemap and the site's pages yourself.
5. **Ask only what is missing — one message, at most five questions**, in plain words with your best guess: which countries (and cities) buyers search in; who can change the website this week (you, a developer, an agency) and roughly how many new pages a month you can publish; may pages name competitors; for a local business, the list of locations; and, optional, "Is your site connected to Google's free Search Console — the place Google shows which searches find you (and Bing Webmaster Tools, if you know)? If yes, a screenshot of its Performance page for the last 3 months helps" (click-by-click steps in `references/citation-protocol.md`). Never ask a technical question you can answer yourself. Never guess prices, claims, review numbers, competitor facts, locations or which namesake a brand is.
6. **Pick the run.** Default is the full run. Three entry points run alone when asked: **competitor suddenly cited**, **organic traffic dropped** (tell crawl/indexing, a core-update date, AI-Overview click loss and seasonality apart — flat impressions with falling clicks is not a ranking loss), **an AI answer says something false about us** (brand questions only). Do only the work the asked outcome needs.

## Steps

### 1. Place the battle
Read `references/battlegrounds.md`. From the brand type and footprint, name the two or three surfaces that decide findability and the modules that do not apply. **Pre-launch** (no live listing, or the site is not indexed yet): category questions only for the paid lookups, one name-collision question, and the store listing written as a launch-day draft.

### 2. Free blocker check (before anything paid)
Run the site-wide part of `atoms/page-and-foundation-check` (reads `references/foundation-check.md`): robots.txt by retrieval vs training bot, the CDN bot test (needs a shell; otherwise "not checked"), sitemap, the platform's duplicate domain, Search Console and Bing set up or not. Whether Google has the site indexed comes from Search Console if shared, else from the paid probe in step 4. A blocked or unindexed site is said first, its fix becomes #1, and the paid check shrinks to category questions.

### 3. Draft the question set → human agrees it
Run the atom `atoms/question-set`: 12–15 questions on a first run (about 8 category and problem, 3 brand, 2 comparison, plus city variants for local), grouped into clusters, weighted by Search Console impressions when shared. **Approval gate:** the human approves the list and stars 3–5 must-wins. Writes `search/questions.md`.

### 4. Plan the check and agree the credits
Read `references/citation-protocol.md`. Say how each surface will be observed: Google organic through `gooseworks:data_call_provider` (organic page one only); AI surfaces through the host's own browser (private window, not signed in; stop on any CAPTCHA) or else the human's **minimum paste set** in plain steps. Paid lookups follow `../../atoms/spend-gate/ATOM.md`'s proxy branch: a yes to one probe (the site-wide `site:` lookup, or the name-collision lookup before launch), then a yes to a ceiling "up to N credits" labelled an estimate, stop at it, and log every charge. Declined → run only what is free and mark the rest "not checked".

### 5. Run the citation check
Run the atom `atoms/citation-check` (runs per surface, recording, scoring and stability rules are in the protocol). Share of voice is measured against the brands the engines actually named; new rivals are listed for research-competitors in the report, never saved to the roster here.

### 6. Read the pattern
Read `references/gap-to-fix.md`. Countable statements about which source types the engines lean on and which gaps are on our pages vs other people's. The fix type follows the source type. False brand facts become top candidates.

### 7. Read the pages behind the gaps
Run the rest of `atoms/page-and-foundation-check` for the 3–6 pages behind the gaps, plus near-winners from Search Console. Everything pass / fail / **not checked**; what the host cannot see goes to a short developer checklist. Blockers outrank copy fixes.

### 8. Audit the profiles and the store listing
Run the atom `atoms/entity-footprint` (reads `references/entity-and-local.md`): the five profiles that matter for this type and, for a local business, the Business Profile per location with reviews. For apps, the atom `atoms/store-listing-audit` (reads `references/app-store-listing.md`); skip and say so when there is no app.

### 9. Update the page map
Read `references/page-map.md`. Map every cluster to the page that answers it — existing, needs a rewrite, or needed — with winnability, priority and the quarter it belongs to, folding in this run's pattern, page reads and profile gaps. The map opens "Do this first, because…" and is the roadmap the five fixes and the briefs are drawn from.

### 10. Rank and finish the five fixes
Read `references/prioritising.md` and `references/finished-fix-examples.md`. Take the top of the page map plus the blockers and profile fixes; score impact × confidence ÷ effort; five means five — fewer real fixes are reported as fewer. Run the atom `atoms/fix-writer` on each, then `../../atoms/claims-gate/ATOM.md` over every sentence that states a fact; if the marker is not `signed-off` and a fix needs a line nobody approved, put the gate's scoped sign-off for those 3–5 lines to the human in one message with the fix list, before the fixes are final. New pages the map calls for → page briefs in `search/briefs/<page-slug>.md`, in make-content's brief input shape.

### 11. Write the report and save
Use `references/report-template.md`. Save `search/visibility/<YYYY-MM-DD>.md`, `search/page-map.md`, `search/fixes/<YYYY-MM-DD>.md` (with a "For your email program — review requests" section when there is a review-request brief) and any briefs (read before write). Save to the brain through `../../atoms/save-to-brain/ATOM.md`: the report as "Search visibility" (`versioned: keep-history`; each wrong brand fact labelled "engine said — wrong"), the page map as "Search page map" (`versioned: supersede`), and the verbatim runs as `search/visibility/<YYYY-MM-DD>-runs.md` with `import: no` (raw AI answers, wrong facts included, never become brand knowledge). The pattern lives in those documents, not in learnings: only a rule the human states in their own words (e.g. "never name competitors on our pages") goes through `../../atoms/save-learning/ATOM.md` (prefix `[search YYYY-MM-DD]`, retiring in the same call its earlier `[search …]` facts the new rule replaces or contradicts). Offer a monthly re-run, created paused through `gooseworks:automation_upsert` under the spend gate's automation rule: its free steps run, and paid lookups happen only within a per-run ceiling the human named in the yes; the AI-answer part needs the human or a browser each time.

## Approval gates

- **Which battles:** the question list and the winnable-vs-prestigious call are recommended with reasons; the human picks before the check runs.
- **Credits:** the spend gate's proxy branch — a yes to one probe, then a yes to a ceiling; never your own sums shown as a price.
- **Publishing:** nothing live is edited or published — pages, profiles, listings, robots.txt. Every fix is a draft the human ships.
- **Structural changes** (robots rules, redirects, URL changes, noindex, merging pages, CDN bot settings): a proposal with the risk and the undo stated, never a this-week fix without the human's explicit yes.
- **Claims:** only what the claims gate allows; the live site supplies plain product facts only (name, price, size, listed ingredients, how to use); a yes in chat counts only through the gate's scoped sign-off.
- **Outreach:** inclusion and correction requests are drafted, never sent. No Wikipedia articles about the brand. No posts that hide the poster's tie to the brand.

## Output and write-back

| Artifact | Where | Read by |
|---|---|---|
| Question set (versioned) | `search/questions.md` | the next run |
| Page map (the roadmap) | `search/page-map.md` + brand document "Search page map — <Brand> — <date> v<N>" | the next run; the human; make-content through the briefs |
| Visibility report | `search/visibility/<date>.md` + brand document "Search visibility — <Brand> — <date>" | the human; analyze-performance's channel table; research-competitors (who is named instead) |
| Five fixes | `search/fixes/<date>.md` | the human, who ships them; the next run (fix dates explain movement) |
| Page briefs | `search/briefs/<page-slug>.md` | make-content, whose drafts name the brief on their first line |
| Review-request brief | "For your email program — review requests" section of the fixes file | email-lifecycle |
| Verbatim runs | `search/visibility/<date>-runs.md` (not imported) | the next run; the human on request |
| Rules the human stated (e.g. competitor naming) | brand learning `[search YYYY-MM-DD]` | every playbook via learnings |
| Paid lookups | `research/credits-log/<YYYY-MM>.md` (spend gate) | every playbook that estimates proxy prices |
| Monthly re-run (optional) | an automation, created paused | the human enables it |

## Done when

The marketer knows, question by question, where they are and are not named on ChatGPT and Google, who is named instead and why — and holds a page map and five fixes finished enough to apply this week. Check: the marketer (or a colleague, on a different day from any paste) re-asks two or three **stable** AI rows or any Google organic row with the given settings and the read holds, and they start at least one fix that week. Generic advice ("improve your E-E-A-T", "add more content") instead of finished fixes means it failed.

## Out of scope

- Writing full pages and articles — make-content (takes the page briefs).
- Videos as a fix — a brief to make-content when YouTube is the winning source.
- Marketplace listings and product feeds (Amazon, Merchant Center, shopping feeds in AI assistants) — optimize-listings (backlog, not covered yet); the report names the gap only.
- Link-building campaigns and PR — skipped on purpose (pillar 11); only one drafted inclusion or correction request per cited page is in scope.
- Standing weekly monitoring and alerts — watch-and-alert (backlog); until then, the monthly re-run.
- Paid search and ads inside AI assistants — run-paid-campaigns.
- Organic revenue attribution — analyze-performance.
- Sending review requests — email-lifecycle; replying to reviews and review monitoring — manage-reviews (backlog, not covered yet). This playbook only reports review count, recency and reply rate.
- Deep technical SEO (migrations, faceted navigation, site-speed engineering) — engineering; this playbook flags blockers on the pages it checked only.
