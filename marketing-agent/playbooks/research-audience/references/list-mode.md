# List mode — named accounts and people (only when asked)

Load when the marketer asks for named people or accounts ("find me 50 right-fit people with emails", "an ABM list", "retail buyers to pitch"), brings a list to score ("which of these sign-ups should we call first?"), asks for a watch ("tell me when a past champion changes jobs"), or says yes to the list offer after an audience report. This is the job lead-gen users come for: make it **fast, complete and honest**.

## Pick the job from the ask — never ask which

| The ask | Job | Reference |
|---|---|---|
| "Find / build me a list of …" | **Build a list** | this file, below |
| A file or pasted rows + "score / qualify / who first" | **Score a list they bring** (incl. inbound triage) | [score-a-list.md](score-a-list.md) |
| "Tell me when …", "watch …" | **A standing watch** | [watches.md](watches.md) |

## Build a list — fast

**Start with "since last time"** ([run-memory.md](run-memory.md)): what happened to the earlier lists, from the ledger — which segments, sources and signals replied — and use it in this list's sources and weights. **Don't run the audience research first.** Use the saved buyer groups (`research/audience/buyer-groups.md`) when they exist — the lead group, or the one the ask names. With none, draft the fit definition straight from the ask, the brand's site and the brain ([atoms/fit-definition](../atoms/fit-definition/ATOM.md)); offer the audience report afterwards as a decision. **No question before the first rows.** The customer list for exclusions, the outcomes of earlier lists and any open fit line are asked **in the closing decisions** — the rows come first (when the marketer has already given a customer export, use it).

### Order of work
1. **Fit definition** — [atoms/fit-definition](../atoms/fit-definition/ATOM.md) with [fit-and-scoring.md](fit-and-scoring.md) and [list-by-company-type.md](list-by-company-type.md): every line sourced or assumed; for hiring-led lists, the role map ([list-sources.md](list-sources.md) § Hiring).
2. **Sources** — pick one or two from [list-sources.md](list-sources.md) by the situation, and say why.
3. **Accounts** — [atoms/account-sourcing](../atoms/account-sourcing/ATOM.md): gates confirmed with a dated source, exclusions, dedupe; the rough universe size.
4. **Timing** — [atoms/signals-and-hooks](../atoms/signals-and-hooks/ATOM.md) with [signals-and-hooks.md](signals-and-hooks.md): signals per account.
5. **People and routes** — [atoms/people-and-contacts](../atoms/people-and-contacts/ATOM.md) with [contacts-and-compliance.md](contacts-and-compliance.md); breadth first. **When the connector has the contact routes** ([data-sources.md](data-sources.md) § When the contact routes exist): search for a count and a sample, then — inside the one approved ceiling — find work emails and check every one.
5b. **Hooks** — signals-and-hooks again, one hook per person (or "none found").
6. **Score, segment, QA** — [atoms/score-segment-qa](../atoms/score-segment-qa/ATOM.md).
7. **Ledger** — `../../../atoms/outcomes-ledger/ATOM.md`, `entity: person`: suppression loaded before sourcing; every row shown is ledgered.
8. **Run record** — run-memory's End steps for the `prospect list` (or `lead scoring`) job ([run-memory.md](run-memory.md)): the counts, the "send first" call as a recommendation with its test, links to the list folder and the ledger — no person's data.

### Speed and cost — proportional to the ask
- **What the free pass delivers — say it in "In short", right after who to contact first:** a free pass costs about 13–20 lookups per fully built person ([data-sources.md](data-sources.md) § Yield), so within its budget it builds **the full account list asked for (with gates and signals) and people with routes for the top 10–15 accounts**; the other accounts carry "people to find". With the database and email routes on the connector, the same run builds every row. Never imply a full people list the budget couldn't build.
- **Up to ~50 accounts:** at most three workers, one per source or segment, one level, each given a short brief (the relevant atom pasted whole plus the fit definition and its slice of accounts) — never the whole playbook, never a skill load, no GooseWorks calls inside workers. Each worker at most 15 searches and 15 page reads. You do the fit, the QA and the delivery. About 100 web calls in all.
- **Bigger lists (100+) or a broad ask:** the same shape — accounts first, people for the top accounts by tier and value — and the top-up or the routes fill the rest. Never pad.
- **The free pass ends with what's real:** the number found vs asked, why, and the top-up that would close the gap — one credit yes (spend-gate branch B).

## In the report

The list is written through `../../../atoms/write-report/ATOM.md` as its own short report (list-first; no audience sections unless they were run): "In short" opens with **who to contact first and why**; then the fit definition in plain words (assumed lines first), the list section ([output-format.md](output-format.md) § The list in the report), the sources used, what was dropped and why, the before-you-send checks per region flag, and a link to `list.csv`. Email honesty, once: until the connector checks addresses, they are printed on a page or pattern-backed and labelled — the marketer checks them before sending. A thin result is said plainly with what would fill it.

**When the ask already includes the messages** ("…then write the emails"), don't offer — once the list is delivered, go straight on with write-outreach's SKILL.md on this list in the same conversation. Otherwise **the closing decisions** always include: "**want the messages written for this list?**" (write-outreach) — plus the top-up if the list is short, a watch if one would help (watches.md), and the audience report if none exists.
