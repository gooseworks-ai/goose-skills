# Report template

Use the `write-report` skill (`../../write-report/SKILL.md`) for delivery and plain language. The requested job determines the report sections; do not require an AI-answer table in an SEO audit or a metrics dashboard in a simple topic map.

## Common shape

```
# <Brand or subject> — <requested SEO job>, <date>

## In short
What we looked at: <scope, date, sources and main limit>.
1. <The direct answer, supported by evidence below and labelled confirmed / likely / first look>.
2. <The most useful implication>.
So, do this first: <action and reason, or the missing prerequisite when the request is blocked>.

## Decisions for you
<Only unresolved decisions; omit when none. A paid read waits for the quote approval.>

## <The requested result>
<Use the branch below. Every number traces to its source and period.>

## What to do next
<Ranked recommendations or build order appropriate to the request.>

## What I couldn't check
<Specific missing access/data, what that limits, and what completes it.>

## Sources
<Dated links or supplied source/export references; methods, markets and source skew.>

## For whoever edits your site
<Only when needed: finished copy/code or engineering handoff, exact placement when known,
owner, Agent / Human effort, verification and risk/undo.>
```

Keep the summary within 150 words and the body concise, normally within 3,000 words. User-requested depth and counts take precedence over a fixed move count. Use technical names where needed to identify an audit defect accurately, with a plain explanation; put implementation code in the closing section.

## Branch sections

| Job | Required report content |
|---|---|
| SEO/technical audit | Scope and inventory/template coverage; confirmed findings vs hypotheses; requested number of ranked fixes, ten by default; affected URLs, evidence/date, consequence, action, owner/effort and verification; structural risk/undo; performance table where available |
| Competitor gaps | Topic/query matrix with rival ranking URL/evidence and our matching content; absent/weak/overlapping/covered status; create/update priorities; separate unverified candidate topics; inventory and ranking sample limits |
| Topic cluster | Pillar/supporting tree or map; distinct intents/questions per page; existing/new when a site is supplied; useful content angle; hub/sibling links and anchors; short order; measured demand or explicit judgment |
| pSEO plan | Evaluated page families with evidence; each recommended family's URL/title/meta/H1/sections and links; variable schema, records, sources, update owner; representative pages, quality/index rules and pilot/expansion criteria |
| SEO metrics | Metric-by-domain table with source/market/period and missing values; website visits separated from organic metrics; actual comparison limits; incomplete verdict if requested SEO fields could not be obtained |
| AI visibility | Since-last-time when comparable; today's per-question checks, engine/tries/date/location/method; own brand fact accuracy; why winners are cited; page roadmap, this-week fixes, new-page briefs and editor details |

## AI visibility details (only this branch)

Each checked question states brand mentions, who is named instead and sources. A single try is a first look, unfinished answers say "didn't finish", and unavailable engines say "not checked today" with an earlier date if useful. Signed-out answers differ from a signed-in buyer's personalized view; state that limit. Follow `citation-protocol.md` and the noise rules in `run-memory.md`; never describe one browser observation as a universal rank fact.

On a repeat, show what shipped, what changed after it and what the answers now cite. Preserve prior dates/methods; distinguish unchanged from unchecked. Recommend the requested number of fixes (default five for the weekly slice) and link the new-page briefs separately. Counts do not cap the roadmap.

## Delivery checks

The summary says no more than the evidence supports; every number counts the thing claimed beside it; comparison tables use like measurements or show the mismatch. Every requested deliverable is present or explicitly incomplete. No guessed CMS fields, keyword volumes or numeric traffic inferred from URL counts.

Run write-report's mechanical language/link checks. Keep internal question ids, recommendation ids, tool names, workspace paths, "proxy", "probe", "surface", "runs·route" and compact k/N scoring out of the human story. Use "asked three times, named once". Sources retain their real names and dates so the reader can assess the numbers. Working-note labels such as "derived", "claimed", "snapshot", "recipe" and "noise rule" belong in working records, not prose to the marketer.
