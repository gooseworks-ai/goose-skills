---
name: research-audience
description: >-
  Builds outbound prospect lists of businesses to pitch (not consumers). Use when the marketer says "find me 50 right-fit people with verified emails", "build me a prospect list", "find retail or wholesale buyers / distributors", "ABM target list", "partners to approach", "top up last month's list". Researches the market for free first — web, company sites, public profiles, directories, job boards, news — and delivers a readable report plus a list: accounts tiered by fit, timing and value, the right people with a sourced contact route and an honest email status (never a guess passed off as verified), dated signals with links, a hook, a compliance flag, and a pain-proof-ask angle per segment with what to send first. One credit yes only to deepen it. Never sends or contacts anyone. Not for personas or customer research — that's market research (research-market). Not for influencers (work-with-creators). Cold email sequences are not covered yet.
---

# research-audience

A prospect list is research: who is worth pitching now, why, and how to reach them — not a scrape. The craft is in the references; this file is the order of work.

**The rule that matters most: free pass first, ask nothing, report once** (AGENTS §8 research pattern). Before the first message, draft the fit definition yourself and build real rows from free sources — web search, company sites, public profiles, directories, job boards, news. The marketer's first message from you is the report with a real sample, the draft definition and the decisions left. Paid reads only deepen it, with one credit yes. Never ask a fact the free pass could find.

## What you get

1. **A readable report** (`research/audience/<YYYY-MM-DD>-report.md`, opened on request): "Do this first, because…", the timely openings (accounts with a live signal this week), the draft fit definition with each line marked *sourced* or *assumed*, the segments — each with a pain → proof → ask angle and **For you** (does it fit us, what to send first) — **You vs them** (accounts already using a rival, where we're ahead, where everyone sounds the same), the funnel and what was dropped, and "what we could not read". Every fact has a date and a link and is labelled fact or inference. Shape: [references/output-format.md](references/output-format.md).
2. **The list** (`list.csv`): accounts first, tiered by fit, timing and value, 1–3 people in buying roles (account rows for portals, buying offices and shops). Per row: title with dated source, contact route and **email status** (`verified-by-tool` / `published` / `pattern-guess` / `catch-all` / `none`), fit reason with every point cited, signals with URL and date, one hook, segment, region flag.
3. **The ledger**, so the next batch never repeats a person.

## Before you start

1. **Connection and brand.** First GooseWorks call: `gooseworks:get_started` with the marketer's words (`wants: "more"`); it settles setup and the brand only (when it asks which brand, ask in one line and call it again). A needed tool not listed → one `gooseworks:tools_load` (`brand`, `files`, `media`, `data`, `automation`). Still none → say only: "Connect GooseWorks first — I build your prospect lists through it." Send `client` on every call that takes it. Keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read the brain and the ledger — free.** `gooseworks:brand_read` (summary, products, competitors, learnings, onboarding); `gooseworks:competitor_read` (rival **domains** — names and handles can be mis-resolved); `gooseworks:knowledge_search` for customers, logos, win/loss, past outbound, do-not-contact rules; workspace (brand coworker scope; no coworker → default workspace with `brands/<brand-slug>/` paths): `research/audience/fit-definition.md`, the newest `lessons/*.md` and report, `research/market/personas.md`, `research/competitors/` rival records. Run [`../../atoms/outcomes-ledger/ATOM.md`](../../atoms/outcomes-ledger/ATOM.md) (`entity: person`) for suppression and stale lists — its outcomes question waits for the message in step 7. Claims: only the read step of [`../../atoms/claims-gate/ATOM.md`](../../atoms/claims-gate/ATOM.md) now.
3. **Do not message the marketer yet.** Stop first only when the ask is out of scope — consumers or early users (private individuals: say so in one line and offer partner or B2B lists), journalists, investors, creators. An ambiguous ask ("50 people to email") gets the most likely in-scope reading from the brand, stated as an assumption in the report.

## Steps

1. **Draft the fit definition yourself** with [atoms/fit-definition](atoms/fit-definition/ATOM.md), [references/fit-and-scoring.md](references/fit-and-scoring.md) and [references/list-by-company-type.md](references/list-by-company-type.md). Read the brand's own site with the host browser first — what it sells, pricing, case studies and customer logos, integrations, who it says it's for — then the brain. Every line is marked *sourced* (with the link) or *assumed* (to confirm in step 7): motion, list unit, firmographics or retail profile, trigger, personas and title synonyms, account value, gates, negative ICP, exclusions, size.

2. **Free pass — accounts.** [atoms/account-sourcing](atoms/account-sourcing/ATOM.md): web search, industry directories and association lists, "best <category>" roundups, LinkedIn public company pages and company sites read in the host browser, evidence-first searches (job posts naming the pain or tool), rivals' public customer and case-study pages, ad libraries in the browser when "spends on ads" is part of fit. Confirm gates on public pages; dedupe on root domain and parent; note the rough universe size.

3. **Free pass — timing.** [atoms/signals-and-hooks](atoms/signals-and-hooks/ATOM.md) with [references/signals-and-hooks.md](references/signals-and-hooks.md): news first (funding, new leaders, launches, expansion, layoffs), then careers pages and job boards, company news and posts. Every signal: fact · URL · date · why now; strength and recency weighed by judgment. Value tier from the definition.

4. **Free pass — people and routes.** [atoms/people-and-contacts](atoms/people-and-contacts/ATOM.md) with [references/contacts-and-compliance.md](references/contacts-and-compliance.md): team and about pages, press releases, speaker pages, public profile headlines in search results, published addresses and pattern evidence, region flags. Build as many finished rows as the free pass yields — never fewer than five real sample rows unless the universe is that thin (then say so); then the hook step per kept row.

5. **Score, segment, synthesize.** [atoms/score-segment-qa](atoms/score-segment-qa/ATOM.md): gates then points, tiers by fit, timing and value; segments by angle × signal with pain → proof → ask (proof only a signed-off claim; otherwise "you'd need proof of X first"); **For you** per segment (fits us or not, from our facts; what to send first; nothing to make yet — sequences aren't covered, so the human writes from the angle); **You vs them** from rival domains found in the accounts; timely openings; the QA checklist. A shortfall is said, never padded.

6. **Deliver the document.** Write the report, `list.csv` and `dropped.csv` under `research/audience/<YYYY-MM-DD>-<list>/` and ledger every row shown. In a host with files, also write them locally and offer to open the report; in hosted chat, an artifact or document if the host can, else the full report in chat — and a `gooseworks:file_url` link either way (it expires within the hour). Save through [`../../atoms/save-to-brain/ATOM.md`](../../atoms/save-to-brain/ATOM.md) (titles in the output format).

7. **One message: the draft and the decisions.** Three lines — the biggest finding, what to send first, the link — and the honest limit once ("there's no email checker here: addresses are published or pattern-backed, clearly labelled; run them through your own checker before sending"). Then only what's left to decide: corrections to the *assumed* lines of the definition; an exclusions export if they have one; the 1–2 proof lines the angles need (claims-gate scoped sign-off); a **paid top-up** if the list is short of the number or rows need confirming — say what it adds (titles confirmed on profiles, firmographics at scale, more accounts), the estimate, and one yes to "up to N credits" ([`../../atoms/spend-gate/ATOM.md`](../../atoms/spend-gate/ATOM.md) branch B, the probe inside it); outcomes since the last list (asked once, never required); an optional re-check or monthly top-up (spend-gate §C: created paused, a per-run ceiling named in the yes).

8. **On their answers.** Re-run the steps the corrections touch, the top-up inside its ceiling (log every charge), merge any pasted email-checker results (`verified-by-tool`, catch-alls to `catch-all.csv`), then re-deliver the updated report and list in the same way. Lessons and outcomes go through the outcomes ledger; a rule the marketer states goes through [`../../atoms/save-learning/ATOM.md`](../../atoms/save-learning/ATOM.md) as `[outreach YYYY-MM-DD]`.

## Approval gates

- The free pass needs no yes and asks nothing. A paid top-up needs one yes to a ceiling; it stops there.
- The marketer's corrections to the definition and the proof sign-off come in the same message as the draft — never before research.
- **Boundary:** nobody is contacted by this playbook. The marketer checks emails and sends from their own tool (D3). Schedules, saved rules and new claims only on their yes.

## Output and write-back

| Artifact | Where (save mode) | Read by |
|---|---|---|
| Report | `research/audience/<D>-<list>/report.md` → `Prospect report — <Brand> — <D>` (keep-history) | the marketer, the next run |
| List, dropped, catch-alls | `research/audience/<D>-<list>/list.csv`, `dropped.csv`, `catch-all.csv` | the marketer's outreach tool |
| Fit definition | `research/audience/fit-definition.md` → `Prospect fit definition — <Brand> — <D>` (supersede) | later runs |
| Ledger | `research/audience/ledger.csv` (outcomes-ledger) | every later run |
| Lessons | `research/audience/lessons/<D>.md` → `Outreach lessons — <Brand> — <D>` (keep-history, via outcomes-ledger) | later runs |
| Paid charges | `research/credits-log/<YYYY-MM>.md` (spend-gate) | every playbook's estimates |

The brand's `audience` text is never written here. See [server-needs.md](server-needs.md).

## Done when

The report arrived with no question asked before it, opening with "Do this first", with a real sample of finished rows, every fact dated and linked, the definition's assumptions marked, every segment's angle and For you, You vs them, and what could not be read. The operator would genuinely reach out to at least 80% of rows by the route given; every person row has a dated title source; nothing says verified unless a checker said so; a shortfall is stated with its reason.

## Out of scope

Writing or sending sequences, DMs, booking meetings — not covered yet (do-outreach, backlog) · sell-sheets and line sheets — no playbook yet · email checking as a service, bought data, intent feeds · CRM writes and lead routing · lists of private individuals; wealth screening — never · creators — **work-with-creators** · personas and voice of customer — **research-market** · journalist lists — no playbook yet.
