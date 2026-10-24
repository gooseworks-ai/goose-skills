---
name: improve-search-visibility
description: >-
  SEO and AI-answer visibility. Use for a site SEO or technical audit with ranked fixes,
  competitor keyword and topic gaps, a topic cluster, SEO metrics for domains, a programmatic
  SEO page-set plan, or checking where ChatGPT and Google name the brand. Delivers the requested
  audit, comparison, map or blueprint with dated evidence and clear data limits. Also covers app
  store listings and local search. Drafts changes; never edits live. Full pages go to make-content;
  paid search goes to run-paid-campaigns.
version: 0.2.1
---

# Human version

Get the search work you asked for: an SEO audit, competitor gaps, a topic map, domain metrics, a plan for templated pages, or an AI-answer visibility check. The report shows the evidence, the priorities and what remains unknown. Changes stay drafts for review.

---

# Agent version

## What you get

One readable, linked report containing the requested deliverable. An audit returns the requested number of ranked fixes; a topic map shows the pillar, supporting pages and links; a pSEO plan includes the templates and data needed to build useful page sets. SEO metrics are obtained and shown when access allows, with missing data stated plainly. Finished copy and code belong in the report's closing editor section; new-page briefs use the existing page-map shape.

## Before you start

1. **Identify the job from the request** using `references/seo-jobs.md`. An explicit request controls the scope, domains, topic and count. Run only the relevant branch; an SEO audit, metrics comparison or cold-brew cluster does not require an AI-answer survey. A mixed ask combines the relevant sections in one report.
2. **Setup and evidence:** use the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2 and its `research-pattern.md`. The job line is "I check your search visibility through it." Read the relevant brand-brain chapters (2 products, 5 audience, 7 competitors, 8 search terms, 9 differences, 17 accounts/tools), using `brain_map` / `brain_open` / `brain_search` when listed, else `brand_read`, `competitor_read` and `knowledge_search`. Read earlier search work and the last matching job record through the `run-memory` skill (`../run-memory/SKILL.md`) with `references/run-memory.md`. Ask only for a necessary fact that these sources cannot supply. A named subject can be mapped without a site or rival set; use the known brand workspace without inventing brand-specific relevance.
3. **Read the claims contract** through the `claims-gate` skill (`../claims-gate/SKILL.md`) when drafting factual site copy, profiles or listing text. Research findings cite their sources; recommendations are not approved advertising claims.

## Steps

### 1. Gather the free evidence for the requested job

Load `references/seo-jobs.md` and complete its selected branch. Use public pages, sitemaps, feeds, available connectors and the host's search/fetch/browser. Open sources this run; record date, scope and method. Earlier numbers are a dated comparison, never today's evidence.

- **Site or technical audit:** use the `improve-search-visibility-page-and-foundation-check` skill (`../improve-search-visibility-page-and-foundation-check/SKILL.md`) and `references/foundation-check.md`. Inventory the site, then check the requested scope with coverage stated. Diagnose technical issues here; hand implementation to engineering.
- **Competitor ranking/topic gaps, subject clusters or pSEO:** use the matching section of `references/seo-jobs.md`, reusing `references/rival-content-map.md` and `references/page-map.md`. A page-type count is not a ranking or topic-gap result.
- **Domain metrics, and metric support for an audit/gap/pSEO plan:** use `references/seo-data.md`. Obtain the relevant available metrics and show them; a missing source is a visible prerequisite, not a substitute number.
- **AI-answer visibility:** do `references/free-pass.md`, including the `improve-search-visibility-question-set`, `improve-search-visibility-citation-check`, `improve-search-visibility-entity-footprint` and, for apps, `improve-search-visibility-store-listing-audit` skills (their sibling `../<slug>/SKILL.md` files). Use the exact sampling and comparison rules in `references/citation-protocol.md` and `references/run-memory.md`.

**Done:** the selected branch's required output can be supported, or each missing piece has a specific access/evidence reason. An unavailable metric source does not stop free audit or planning work.

### 2. Deliver the result and the decisions left in one turn

Write and deliver the report now through the `write-report` skill (`../write-report/SKILL.md`), using `references/report-template.md`. Lead with the answer to the actual request: the audit's leading finding, the rival gaps, the topic architecture, the metrics table's conclusion or the recommended page family. A visibility check leads with this run's counts per checked engine. On repeat runs, add 3–5 lines on what changed from comparable evidence.

Put only unresolved decisions together: a missing necessary domain or market, competing site positionings when a rewrite depends on the choice, permission to name rivals in public copy, structural changes, claims sign-off and paid evidence. Gather any credit approval through the `spend-gate` skill (`../spend-gate/SKILL.md`), with one stated ceiling and the exact live tool's pricing rules. Skip paid work when the free evidence already answers the request. A metrics-only report with no usable metrics says **incomplete — source unavailable**, shows the unavailable cells and the needed access; it does not claim the request was completed.

### 3. Complete approved data reads and update the same report

Use `references/seo-data.md` for managed SEO data and `references/citation-protocol.md` for Google/AI checks. Read the live schema before calling; stop at the approved ceiling and record every charge. Re-deliver the same report with the new evidence. A declined top-up leaves the free result standing and names the remaining limitation.

### 4. Rank and finish the requested work

Use `references/prioritising.md`. Honor the requested count; when unspecified, use ten priorities for an audit and five this-week fixes for a recurring visibility check. Return fewer only when the evidence supports fewer, explaining why. The count never limits the audit inventory, a complete topic map or the planned page families.

For fixes, use the `improve-search-visibility-fix-writer` skill (`../improve-search-visibility-fix-writer/SKILL.md`) and run the claims gate over factual draft copy. Findings state affected URLs/templates, evidence, impact, action, owner and how to verify. Where implementation details are unavailable, provide a precise engineering handoff instead of guessed code. New-page briefs follow `references/page-map.md`; a cluster or pSEO plan need not include full articles or a brief for every proposed URL.

### 5. Save, check and close

Run write-report's checks plus the applicable branch's acceptance checks in `references/seo-jobs.md`. Deliver one clickable report and its saved brand copy; state a save failure plainly. Save the selected working artifacts below through the `save-to-brain` skill (`../save-to-brain/SKILL.md`), reading before write. Save the matching job record through run-memory; only marketer-stated rules go through the `save-learning` skill (`../save-learning/SKILL.md`) with prefix `[search YYYY-MM-DD]`.

After an update, chat is at most three lines: the main change, the report/saved-copy links and any decision still open. Offer a repeat only when useful under marketing-guide §3: usually monthly for an ongoing visibility check, or one re-check after an audit fix ships. Do not turn a one-off cluster or pSEO plan into a standing monitor. Approved automations are created paused with `gooseworks:automation_upsert`, under spend-gate and the self-contained method in `references/run-memory.md`.

## Approval gates

- **Credits:** a yes before paid reads; exact listed tool and spend-gate rules, one ceiling, every charge logged.
- **Publishing:** drafts only. Pages, profiles, listings and crawler settings stay unchanged.
- **Structural changes:** proposals with risk, verification and undo; implementation needs approval.
- **Claims and rival names:** public copy passes claims-gate and respects the marketer's naming stance.
- **Outreach:** inclusion/correction requests are drafts, never sent; no hidden affiliation or fake reviews.

## Output and write-back

| Artifact | Where | Reader |
|---|---|---|
| Report, all selected jobs | local `gooseworks-reports/<brand-slug>/<date>-<job>.md` (or hosted artifact) + `search/visibility/<date>-<job>.md` + brand document "Search — <job> — <Brand> — <date>" (keep-history). Existing visibility checks retain `<date>-search-visibility.md` locally and `search/visibility/<date>.md` | marketer; analyze-performance; research-competitors |
| Site inventory and audit findings | `search/audits/<date>.md` | next audit; engineering |
| Topic/ranking gaps | `search/gaps/<date>.md` | make-content briefs; next gap check |
| Topic map | `search/clusters/<topic-slug>.md` | make-content; next map update |
| pSEO blueprint | `search/pseo/<date>-<subject>.md` | engineering and make-content; next planning run |
| Dated metric evidence | `search/metrics/<date>.md` | this report and the next comparable check |
| Roadmap and question set, when used | `search/page-map.md` (supersede); `search/questions.md` | next run |
| Ranked fixes and new-page briefs | `search/fixes/<date>.md`; `search/briefs/<page-slug>.md`. Preserve the "For your email program — review requests" section when present | marketer; next run; make-content; email-lifecycle |
| Verbatim AI answers | `search/visibility/<date>-runs.md` (not imported) | next visibility check |
| Run record | `runs/improve-search-visibility/<job>/[<subject>/]<date>.md` (keep-history), per `references/run-memory.md` | next run of the same job |
| Paid reads and marketer rules | `research/credits-log/<YYYY-MM>.md` (spend-gate); learning `[search YYYY-MM-DD]` (save-learning) | all proxy users; all playbooks |

## Done when

- The requested audit, gap table, topic map, metrics comparison, pSEO blueprint or visibility check is delivered with its branch's evidence and completion checks satisfied.
- Requested counts are honored when supported; scope and inaccessible evidence are explicit. Unavailable numeric data stays unavailable, never inferred from page counts or AI mentions.
- The report is readable, opens from its link and is saved to the brand, or the save failure is stated. No live changes or sends occurred.

## Out of scope

Full pages/articles and video drafts → make-content, using the briefs. Paid search → run-paid-campaigns. Organic revenue attribution → analyze-performance. Marketplace feeds/listings and review replies remain uncovered. Link-building campaigns and PR remain outside this job; individual inclusion requests may be drafted. Engineering implements migrations, faceted-navigation changes and speed fixes after reviewing the diagnosis and risk; identifying those SEO issues belongs in this audit.
