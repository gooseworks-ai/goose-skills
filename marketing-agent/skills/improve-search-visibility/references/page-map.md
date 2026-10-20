# The page map (the search roadmap)

Load at step 4. Pillar 4's core output is a prioritised map from what buyers ask to the page that answers it. The five fixes are this week's slice of it; the briefs are the pages it says are missing. It is a standing record: every run updates it, never starts over.

## Shape (`search/page-map.md`)
```
Do this first: <the one move and why — the report's "So, do this first" line, copied>
Page map — <Brand> — <YYYY-MM-DD> v<N> · country <cc> · demand source: Search Console impressions (last 3 months) | none (ranked by value × winnability)

| Cluster | Questions (ids) | Primary query | Demand | Page that answers it | Best position now | State | Winnable | Priority | Owner | Quarter | This run's evidence |
| sensitive-skin moisturizer | Q1, Q3, Q4 | moisturizer for sensitive skin | 12.4k impr. | /collections/moisturizers | not in top 10 | rewrite | 3 | 1 | store admin | Q4-2026 | ChatGPT 0/3, cites 2 listicles; page has no answer-first intro |
| X vs Y | Q7 | x vs y | — | none | — | needed (brief) | 2 | 3 | writer | Q1-2027 | rivals' own "vs" pages cited 6/8 runs |
| brand facts | Q9–Q11 | halden reviews | 900 impr. | /pages/about + profiles | #1 | fix | 3 | 2 | founder | now | Crunchbase repeats 2022 positioning |
```
- **State:** ok · rewrite · fix (profile or foundation) · needed (brief) · merge (two pages compete for one cluster; proposal with redirect risk) · blocked (foundation blocker) · parked (not winnable now, or a comparison when the human said not to name competitors; why).
- **Demand:** always name the source. In order: Search Console impressions summed over the cluster's queries (when shared); Google Keyword Planner ranges (when the brand shares its Ads account); Google Trends relative interest and autocomplete presence (free, in the browser — relative, not counts); a vendor's AI prompt-volume estimate only if the brand already has that account, labelled "estimate". None → "no demand data, ranked by judgment". Never invent volumes.
- **Priority:** 1 = do first. Blockers on key question pages and false brand facts rank first; then near-winners (positions ~4–15 or cited sometimes); then missing pages by demand × winnability; prestigious-but-hopeless clusters are parked with the reason.
- **Quarter:** "now" for this-week fixes; then fill quarters in priority order at the human's stated capacity (pages a month from intake), so the map reads as a realistic quarterly roadmap. The map grows from 12–15 questions toward 25–40 over runs.

## How the five and the briefs come from it
- The five fixes are the top-priority rows whose fix the named person can ship this week (plus site-wide blockers, which always come first).
- Every "needed" row of priority ≤ 5 gets a page brief (below); lower rows wait.
- On a re-run, rows whose fix shipped are re-checked against this run's evidence; a row that moved changes state, one that didn't keeps its priority with a note.

## Page brief — make-content's brief input shape (`search/briefs/<page-slug>.md`)
```
Page brief — <working title> · from the search roadmap, topic "<cluster>" · <date>
Cluster: <name> · Intent: learn | do | decide | trust | be convinced · Stage: discovery | problem | comparison | price | brand
Format · where it publishes (URL to create) · by when (the map's quarter)
Audience: <role/segment>, their situation, what they already know
Questions the page must answer word for word: <AI form> / <Google form> for each question
Information gain: what the cited winners say (URLs, date read) → what ours must add
H2 outline (as claims): …
Facts the page must state: <fact> — source: "Claims you may use" fact | product record field | [PROOF NEEDED]
Claims allowed / never say: from the claims gate (scoped sign-off status)
Competitor names: allowed | not allowed (the human's stance) · public source for each competitor fact
Internal links to add: the hub page for this topic ↔ this page (both directions); this page ↔ its closest sibling pages in the same cluster; glossary or explainer pages → this page where the term appears — each with the page, the exact anchor text and where in the page it sits
Markup: Product | Organization | LocalBusiness | SoftwareApplication | Article | none
Format · length: <a format name from make-content's format list> · <target words>
CTA: <action> → to confirm with you
Live data: the answers this rests on (question, engine, date)
```
make-content's drafts carry this brief's path on their first line, so the next run can see which briefs became pages.
