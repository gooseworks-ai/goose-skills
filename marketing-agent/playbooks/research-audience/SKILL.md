---
name: research-audience
description: >-
  Builds outbound prospect lists of businesses to pitch (not consumers). Use when the marketer says "find me 50 right-fit people with verified emails", "build me a prospect list", "find retail or wholesale buyers / distributors", "ABM target list", "partners to approach", "top up last month's list". Accounts first, then the right people: fit-scored and tiered by fit, timing and account value, each with a sourced contact route and an honest email status (never a guess passed off as verified), dated buying signals with links, a hook, a compliance flag, and a three-line angle per segment (pain, proof, ask). Shows a five-account sample before the full build, asks a credit ceiling before paid lookups, hands the list over, and learns from the replies you report. Never sends or contacts anyone. Not for personas or customer research — that's market research (research-market). Not for influencers (work-with-creators). Cold email sequences are not covered yet.
---

# research-audience

One want: a list worth emailing, not a scrape. Accounts first, then the right people inside them, every row sourced and dated. This playbook builds and hands over; it never sends, connects, DMs or writes to a CRM. Say everything to the marketer in plain words — never name playbooks, tools, ids or vendors.

## What you get

1. **The fit definition** (signed off by the human, saved with the brand): motion, list unit, firmographics or retail profile, situation/trigger, personas with title synonyms, account value, disqualifiers, negative ICP, exclusions, list size.
2. **The list**, accounts first: accounts tiered by fit, timing and value, each with 1–3 people in buying roles — or account-level rows where the route is a portal, buying office or shop. Per row: name, current title (source + date), company and domain, contact route and **email status** (`verified-by-tool` / `published` / `pattern-guess` / `catch-all` / `none`), fit score with the written reason, value tier, 1–2 buying signals (fact + URL + date), one hook, segment, persona role, region flag, provenance. Shape: [references/output-format.md](references/output-format.md).
3. **The summary on top**, opening "Do this first, because…": delivered vs asked and why, the funnel, what was dropped and why, the segments each with a **three-line angle (pain → proof → ask)**, the rough universe size, credits spent against each ceiling, and what to do before sending.
4. **Files** in the brand's workspace: a CSV that imports into common outreach tools, the summary, the dropped rows, and the ledger so the next batch never repeats a person.

## Before you start

1. **Connection and brand.** First GooseWorks call of the conversation: `gooseworks:get_started` with the marketer's words (`wants: "more"`); it settles setup and the brand only — when it asks which brand, ask in one line and call it again. A needed tool not listed → one `gooseworks:tools_load` (`brand`, `files`, `media`, `data`, `automation`). Still no GooseWorks tools → say only: "Connect GooseWorks first — I build your prospect lists through it." Send `client` on every call that takes it. Then a free `gooseworks:brand_read` summary.
2. **Scope screen.** In scope: B2B buyers, retail and wholesale buyers, distributors, partners, agency prospects, marketplace supply, B2B2C partners. Out: consumers and early users (private individuals — offer partner or B2B lists instead), journalists, investors, creators (the creator playbook). An ambiguous ask ("50 people to email") gets one question listing these, with your recommendation from the brand read.
3. **The honest limit, once:** "There's no email checker here — you'll get published or pattern-backed addresses, clearly labelled, and some people will be LinkedIn-only; run the addresses through your own email checker before sending." No web-reading tool on this host → "published addresses will be rare." Retail lists with UK independents → "UK shops that aren't limited companies can't be emailed or cold-messaged — they'll be letter or visit rows."
4. **Workspace.** Brand coworker scope (`coworker_agent_id` from the `brand_read` list) for every file, under `research/audience/`. No coworker → the default workspace with every path prefixed `brands/<brand-slug>/`, and tell the human teammates won't see the ledger. `gooseworks:account_whoami` once for the balance.
5. **Brain read.** `gooseworks:brand_read` (onboarding, competitors, learnings) and `gooseworks:knowledge_search` for: target customers / segments, win/loss notes, customer list and logos, past outbound outcomes, do-not-contact rules, the newest `Prospect fit definition — <Brand>` and `Outreach lessons — <Brand>` documents (`file_read` `research/audience/fit-definition.md` and the newest `research/audience/lessons/*.md` first). `gooseworks:competitor_read` for competitor **domains** (names and handles can be mis-resolved). Customers, logos, win/loss and do-not-contact rules usually aren't on file — ask.
6. **Ledger.** Run [`../../atoms/outcomes-ledger/ATOM.md`](../../atoms/outcomes-ledger/ATOM.md) with `entity: person`: stale lists flagged, outcomes asked once (never required), suppression loaded. A saved definition + ledger → a top-up: "same definition, next N?" Unchanged definition skips the sample; a changed one runs both gates.
7. **Ask only what the brain and the request cannot settle**, in one message: the fit gaps; exclusions (B2B: a customer / open-deal / do-not-contact export, asked never required; retail: read the brand's own store locator when the host can read web pages, then ask for retailers in talks, exclusivity and distributor territories — never consumer lists); retail: chains vs independents and the wholesale route; account value (what a big vs small account is worth to them — deal size, strategic fit); geography; how many people they can work this week (ask, never cap); optional warm paths. Never guess an ICP.

## Steps

**1. Pin down "right-fit".** Run [atoms/fit-definition](atoms/fit-definition/ATOM.md) with [references/fit-and-scoring.md](references/fit-and-scoring.md) and [references/list-by-company-type.md](references/list-by-company-type.md): the list unit, every line of the definition (account value included for account-based lists), played back finished. Partner and app lists default to 20–30.

**2. Ask to spend — with the definition.** Paid public-data lookups follow [`../../atoms/spend-gate/ATOM.md`](../../atoms/spend-gate/ATOM.md) (proxy branch). The credits log is the only basis for an estimate, so: **with history** for every kind of read the sample needs, Gate 1 asks a yes to "up to N credits" for the five-account sample (an estimate from logged charges and the counts in [references/data-sources.md](references/data-sources.md)); **without**, Gate 1 asks one yes for a single probe read ("one quick read; GooseWorks tells us its cost after it runs"), and the "up to N" ask for the sample follows in the next message, estimated from the probe's per-call charge; pricier reads (profiles, company pages) count their first call as their own probe inside that ceiling. → **Gate 1** (definition + sample spend or probes).

**3. Calibration sample.** Five accounts that pass the gates, through steps 4–7 at full depth, shown as finished rows: "Is this the right kind of account and person? What would you change?" Fewer than five pass → show what passed and why, and fix the definition — never widen to fill. No-contact-route accounts are a yield fact, not a definition problem. Ledger the rows as they are shown. Then show what the sample charged, its email-status mix and how many lookups the full build needs, and ask a yes to "up to N credits" for it (estimate, separate from the sample). In the same message, if any segment's proof line has no signed-off claim, put the 1–2 proof lines the angles need to the human through the claims gate's scoped sign-off; a no leaves "proof needed". → **Gate 2**.

**4. Find accounts.** Run [atoms/account-sourcing](atoms/account-sourcing/ATOM.md): sources that suit the list unit; evidence-first for tech or situation gates; hard gates and exclusions before any spend on people; dedupe on root domain and parent.

**5. Timing and value.** Run [atoms/signals-and-hooks](atoms/signals-and-hooks/ATOM.md) with [references/signals-and-hooks.md](references/signals-and-hooks.md): only signals with a URL and a date count; weigh strength and recency by judgment and say why. Set the account's value tier from the definition (`n/a` for independent shops and venues).

**6. People and contact routes.** Run [atoms/people-and-contacts](atoms/people-and-contacts/ATOM.md) with [references/contacts-and-compliance.md](references/contacts-and-compliance.md): 1–3 people per account in different roles (more for top-value accounts), current title from a dated source, a public contact route, honest email status, region flag. Unconfirmable employment → dropped. Independent shops are account rows (UK sole traders: no email or cold message); chains get an account row plus 1–2 dated category-buyer rows. Then the hook step for each kept row.

**7. Score, segment, QA.** Run [atoms/score-segment-qa](atoms/score-segment-qa/ATOM.md): gates then points, every point cited; tiers by fit, timing and value; segments by angle × signal, each with its three-line angle — the proof line only from signed-off claims through [`../../atoms/claims-gate/ATOM.md`](../../atoms/claims-gate/ATOM.md), else "proof needed: <what would do>"; the pre-handover checklist. A shortfall is reported, never padded.

**8. Hand over.** Write the files and documents (below), present the summary and list, and give the email-check instruction. Pasted checker results are merged (see contacts-and-compliance) and the counts re-issued.

**9. Re-check and top-ups.** `recheck_by` (list date + 30 days) goes in the summary and ledger. Offer once: a monthly top-up of the next N, or a re-check of unsent rows. Only with a yes, create it with `gooseworks:automation_upsert` per the spend-gate automation rule: `enabled: false` (paused) until the human switches it on; the yes names a standing per-run data ceiling and hears that the run itself uses credits (shown after the first run via `gooseworks:automation_list`); no data spend in a scheduled run without one. The `agent_prompt` carries what the coworker needs: the saved definition's path, the ledger's exclusion rule, the region rules, the ceiling, and "contact nobody". Needs a brand coworker; without one, offer only the free re-check reminder in the summary.

## Approval gates

1. **Fit definition + sample spend** — nothing is searched before a yes.
2. **Sample + full-build spend** — five real rows, what they charged, and a yes to the full-build ceiling. The human can stop here.

Spend stops at each ceiling and asks. A definition that clearly doesn't match what sources return stops and asks — never silently widened. **Handover is a boundary, not a gate:** nobody is contacted by this playbook. The human checks emails and sends from their own tool (D3).

## Output and write-back

Files (brand coworker scope, `research/audience/`), read before write:
- `<YYYY-MM-DD>-<list-slug>/list.csv`, `catch-all.csv` (after an email check), `dropped.csv` (tier C included), `summary.md` — columns and summary in the output format. Hosted chat: a `gooseworks:file_url` download link (it expires within the hour — offer a fresh one); with a shell, also a local copy.
- `ledger.csv` — kept by `../../atoms/outcomes-ledger/ATOM.md` (every row shown, permanent suppression, re-check dates).
- Every paid lookup is logged per the spend-gate in `research/credits-log/<YYYY-MM>.md` (`date | playbook | tool/endpoint | query kind | items | credits`) — the kind of query, never a prospect's name.

Brand documents through [`../../atoms/save-to-brain/ATOM.md`](../../atoms/save-to-brain/ATOM.md):
- `research/audience/fit-definition.md` → `Prospect fit definition — <Brand> — <YYYY-MM-DD>` (`versioned: supersede`; tags `[research-audience, fit-definition]`). Opens "Do this first, because…" (the segment to send first and why), then "Outbound prospect definition — who we pitch, not the brand's customers; not for ads or consumer copy."
- `research/audience/lessons/<YYYY-MM-DD>.md` → `Outreach lessons — <Brand> — <YYYY-MM-DD>` (written by the outcomes-ledger, `keep-history`): per-segment numbers only, no personal data.
- Learnings only through [`../../atoms/save-learning/ATOM.md`](../../atoms/save-learning/ATOM.md), in the human's own words, text starting `[outreach YYYY-MM-DD]`.

The brand's `audience` text is never written here — it describes the brand's customers, and ads read it. If the human describes their customer differently, say so and offer to update it as a separate step.

See [server-needs.md](server-needs.md).

## Done when

"People you would actually email — fit-scored, every contact route sourced, zero invented emails." Check: the operator would email at least 80% of rows; every person row has a dated title source and every row a sourced route; nothing says verified unless a checker said so; each segment's angle has a pain, a proof (or "proof needed") and an ask; a shortfall is stated with its reason. (The spec's "every email verified" needs the human's checker until GooseWorks has one — critique.md R2.)

## Out of scope

- Writing or sending sequences, LinkedIn automation, DMs, booking meetings — not covered yet (do-outreach, backlog). Sell-sheets and line sheets — no playbook yet.
- Email checking as a service, buying data lists, visitor de-anonymisation, intent feeds — the human's own tools.
- CRM writes, lead scoring and routing — human/tool territory (pillar 14).
- Lists of consumers, early users or any private individuals; wealth screening — never.
- Creators — **work-with-creators**. Personas and voice of customer — **research-market**. Journalist lists — no playbook yet.
