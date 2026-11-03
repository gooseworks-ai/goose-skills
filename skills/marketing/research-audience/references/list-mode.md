# List mode — named accounts and people (only when asked)

Load when the marketer asks for named people or accounts ("find me 50 right-fit people with emails", "an ABM list", "retail buyers to pitch"), brings a list to score ("which of these sign-ups should we call first?"), asks for a watch ("tell me when a past champion changes jobs"), or says yes to the list offer after an audience report. This is the job lead-gen users come for: make it **fast, complete and honest**.

## Pick the job from the ask — never ask which

| The ask | Job | Reference |
|---|---|---|
| "Find / build me a list of …" | **Build a list** | this file, below |
| A file or pasted rows + "score / qualify / who first" | **Score a list they bring** (incl. inbound triage) | [score-a-list.md](score-a-list.md) |
| "Tell me when …", "watch …" | **A standing watch** | [watches.md](watches.md) |

## Build a list — fast

**Start with "since last time"** ([run-memory.md](run-memory.md)): what happened to the earlier lists, from the ledger — which segments, sources and signals replied — and use it in this list's sources and weights. **Don't run the audience research first.** Use the saved buyer groups (`research/audience/buyer-groups.md`) when they exist — the lead group, or the one the ask names. With none, draft the fit definition straight from the ask, the brand's site and the brain ([the `research-audience-fit-definition` skill](../../research-audience-fit-definition/SKILL.md)); offer the audience report afterwards as a decision. **No question before the first rows.** The customer list for exclusions, the outcomes of earlier lists and any open fit line are asked **in the closing decisions** — the rows come first (when the marketer has already given a customer export, use it).

### Before building — two lines, then keep going
The first message opens with these, before any row is built; neither is a question, and the build goes on in the same turn.
1. **What the list can't do yet** (unless the connector has the contact routes, [data-sources.md](data-sources.md) § When the contact routes exist): "Heads-up: I'll find right-fit companies and the right person at each (name, title, LinkedIn) with a dated reason. I can't find or check email addresses yet, so before you send you'll run the list through an email finder (such as Apollo or Hunter) and a checker (such as ZeroBounce or NeverBounce)." Say it **before** any paid top-up is offered, so nobody pays for a list they expected to be email-ready.
2. **Is this the group to build?** Re-read the **current** `research/audience/buyer-groups.md` (and the brain's audience items) now — never a group name carried in from an older pack, a request line or an earlier chat. If the group asked for isn't today's lead, say so in one line: "Your lead group is <X> (<its evidence>); <Y> ranks #<n> with <its evidence> — building <Y> as asked; say *switch* for <X>." If the group came only from an older file, not the marketer's own words, build the current lead and say so.

### Order of work
1. **Fit definition** — [the `research-audience-fit-definition` skill](../../research-audience-fit-definition/SKILL.md) with [fit-and-scoring.md](fit-and-scoring.md) and [list-by-company-type.md](list-by-company-type.md): every line sourced or assumed; for hiring-led lists, the role map ([list-sources.md](list-sources.md) § Hiring).
2. **Sources** — pick one or two from [list-sources.md](list-sources.md) by the situation, and say why.
3. **Accounts** — [the `research-audience-account-sourcing` skill](../../research-audience-account-sourcing/SKILL.md): every account from a search this run ran, named in its source column — never brands remembered as well known; gates confirmed with a dated source, exclusions, dedupe; the rough universe size.
4. **Timing** — [the `research-audience-signals-and-hooks` skill](../../research-audience-signals-and-hooks/SKILL.md) with [signals-and-hooks.md](signals-and-hooks.md): signals per account.
5. **People and routes** — [the `research-audience-people-and-contacts` skill](../../research-audience-people-and-contacts/SKILL.md) with [contacts-and-compliance.md](contacts-and-compliance.md); breadth first. **When the connector has the contact routes** ([data-sources.md](data-sources.md) § When the contact routes exist): search for a count and a sample, then — inside the one approved ceiling — find work emails and check every one.
5b. **Hooks** — signals-and-hooks again, one hook per person (or "none found").
6. **Score, segment, QA** — [the `research-audience-score-segment-qa` skill](../../research-audience-score-segment-qa/SKILL.md).
7. **Ledger** — the `outcomes-ledger` skill (`../../outcomes-ledger/SKILL.md`), `entity: person`: suppression loaded before sourcing; every row shown is ledgered.
8. **Run record** — run-memory's End steps for the `prospect list` (or `lead scoring`) job ([run-memory.md](run-memory.md)): the counts, the "send first" call as a recommendation with its test, links to the list folder and the ledger — no person's data.

### Speed and cost — proportional to the ask
- **What the free pass delivers — say it in "In short", in "What we looked at":** a free pass costs about 13–20 lookups per fully built person ([data-sources.md](data-sources.md) § Yield), so within its budget it builds **the full account list asked for (with gates and signals) and people with routes for the top 10–15 accounts**; the other accounts carry "people to find". With the database and email routes on the connector, the same run builds every row. Never imply a full people list the budget couldn't build.
- **Up to ~50 accounts:** at most three workers, one per source or segment, one level, each given a short brief (the relevant atom pasted whole plus the fit definition and its slice of accounts) — never the whole playbook, never a skill load, no GooseWorks calls inside workers. Each worker at most 15 searches and 15 page reads. You do the fit, the QA and the delivery. About 100 web calls in all.
- **Bigger lists (100+) or a broad ask:** the same shape — accounts first, people for the top accounts by tier and value — and the top-up or the routes fill the rest. Never pad.
- **The free pass ends with what's real:** the number found vs asked, why, and the top-up that would close the gap — one credit yes (spend-gate branch B).

## In the report

The list is written through the `write-report` skill (`../../write-report/SKILL.md`) as its own short report (list-first; no audience sections unless they were run): "In short" says what we looked at (the sources, the asked group, what the free pass covered), then **who to contact first and why**, resting on that; then the fit definition in plain words (assumed lines first), the list section ([output-format.md](output-format.md) § The list in the report), the sources used, what was dropped and why, the before-you-send checks per region flag, and a link to `list.csv`. Email honesty, once: until the connector checks addresses, they are printed on a page or pattern-backed and labelled — the marketer checks them before sending. A thin result is said plainly with what would fill it.

**When the ask already includes the messages** ("…then write the emails"), don't offer — once the list is delivered, go straight on with write-outreach's SKILL.md on this list in the same conversation. Otherwise **the closing decisions** always include: "**want the messages written for this list?**" (write-outreach) — plus the top-up if the list is short, a watch if one would help (watches.md), and the audience report if none exists.
