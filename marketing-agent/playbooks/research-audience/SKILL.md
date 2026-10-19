---
name: research-audience
description: >-
  Who our buyers are, in their own words, and how to reach them. Use when the marketer says "research our audience", "who is my customer", "who are our buyers", "build buyer personas", "voice of customer", "mine our reviews", "what words do customers use", "why do people buy us or leave", "where does our audience hang out", "how do we reach them". Reads the brand's own customer data first when it has customers, then researches for free — reviews, community threads, public posts, publications, events — and delivers a readable report: buyer groups sized in buyers with the lead one named, what each wants, their problems and how we solve them, a bank of their own words, where they gather and how to reach them, with what to do first. Saves the buyer groups and quote bank for all other work. Builds a named list only when asked ("50 right-fit people with emails"). Never contacts anyone. Not for market size, trends or pricing norms — that's market research (research-market).
---

# research-audience

Audience research answers, for the people a brand sells to: **who they are** (buyer groups, sized in buyers, with buying roles), **what they want**, **their problems and how we solve them**, **their words** (the customer-quote bank), **where they gather**, and **how to find and reach them**. It owns the brand's **one list of buyer groups** and the **quote bank**; market research reads them and sizes the market around them (its figures are context; group sizes are counted here), and every maker reads them. A list of named people is a separate mode, only when asked. The craft is in [references/audience-research.md](references/audience-research.md) and [references/quote-bank.md](references/quote-bank.md); this file is the order of work.

**The rule that matters most: the brand's own customers first, then free pass, report once** (AGENTS §8 research pattern). One specific question for the brand's customer data is allowed up front; after that, cover every group on every dimension from free sources before the next message. Never stop to ask "which group should I go deeper on?". Paid reads only deepen it, with one credit yes.

## What you get

1. **The audience report** through [`../../atoms/write-report/ATOM.md`](../../atoms/write-report/ATOM.md) (opens with one click, saved to the brand): in short; decisions for you; the buyer groups — ranked, each sized in buyers or companies, who uses / pays / approves, the lead one named — labelled provisional when the evidence doesn't clear the bar; per group what they want, their problems and how we solve them (or "you'd need proof of X first"), their words, where they gather and how to reach them; why they buy and why they leave (from the brand's own data, where it exists); how rivals talk to them; what to do; what we're not doing; what we couldn't check; sources with a source-skew line.
2. **Buyer groups** and the **quote bank** — the durable records every other playbook reads.
3. **Only in list mode:** named accounts and people with dated sources and honest contact routes ([references/list-mode.md](references/list-mode.md)).

## Before you start

1. **Connection and brand.** First GooseWorks call: `gooseworks:get_started` with the marketer's words (`wants: "more"`); it settles setup and the brand only (when it asks which brand, ask in one line and call it again). A needed tool not listed → one `gooseworks:tools_load` (`brand`, `files`, `media`, `data`). Still none → say only: "Connect GooseWorks first — I research your audience and save what I find through it." Send `client` on every call that takes it. Keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read the brain — free.** `gooseworks:brand_read` (summary, kit — especially `audience` — products, competitors, organic, learnings); `gooseworks:knowledge_search` for customer evidence, synced reviews, pasted exports and earlier research; `gooseworks:competitor_read`. Workspace, **brand coworker scope** (the `brands/<brand-slug>/` prefix only when there is no coworker): `research/audience/` (buyer groups, quote bank, last report — a re-run says what changed), `research/market/` (the latest market report — its market figures are context; group sizes are counted here), `research/competitors/` (rival records and report). **No audience bank yet but an older market one** (`research/market/voc-bank.md` / `.jsonl`): import its rows once — re-check each against [references/quote-bank.md](references/quote-bank.md), keep `id`s, drop vendor, agency, job-post and second-hand rows — and say so in Sources; the same for older market personas as candidate groups. Claims: only the read step of [`../../atoms/claims-gate/ATOM.md`](../../atoms/claims-gate/ATOM.md) now.
3. **Ask for the brand's own customer data — once, specifically, only when it has customers** (paid plans live, reviews of the brand, users or orders mentioned in the brain) and no export is on file. One message, then wait:
   > "Before I start: your own customers are the best evidence, and I can't read them publicly. Could you share **<the export that fits the company type — [references/audience-research.md](references/audience-research.md) § Customer data>**, plus any **cancel reasons, win/loss notes or support themes**? Paste or upload it — or say "go" and I'll start from public sources."
   No customers yet (pre-launch), or the marketer says go: start the free pass. Personal data in an export never goes to the brain; only counts and patterns do.
4. **No other question before the report.** A list ask ("50 right-fit people with emails") switches on list mode for the lead group; the audience pass still runs first, lighter. Out of scope (consumers as named individuals, journalists, investors, creators to pay): one line and the nearest thing this playbook does.

## Steps

1. **Frame — the brand's own side first.** If customer data came in, read it first ([references/audience-research.md](references/audience-research.md) § Customer data): who actually pays (company types, roles, plans, sizes), who stays and who leaves, the reasons they give. Then the brand's own site in the host browser (what it sells, to whom, pricing, logos, its words), the brain's `audience` text, and the latest market and competitor reports. Draft 2–5 candidate buyer groups by situation — never demographics — each with how to recognise one (usable as ad targeting or list criteria). Where the brand's own facts disagree (site vs brain vs customer data), customer data wins; otherwise make the conflict the first decision.

2. **News first.** Web search, last 90 days, for what is changing for these people: tools and platforms they must adopt, hiring and layoffs in their roles, budget shifts, regulation, the conversation everyone in the category is having.

3. **Research every group.** One worker per group — a subagent where the host supports it — briefed with [atoms/segment-pass](atoms/segment-pass/ATOM.md): wants, problems and how we solve them, first-hand words for the quote bank ([references/quote-bank.md](references/quote-bank.md) — no vendor copy, case studies or job posts as audience voice), where they gather (with evidence *this* group is there), how to reach them, how rivals talk to them. Without subagents, group by group, each written to `research/audience/segments/<slug>.md` before the next. Never pause for paid reads.

4. **Size and roles.** For each group, a count of buyers or companies (bottom-up: directories, store or company counts, job-post counts, industry figures, the brand's own customer mix), each input sourced or labelled an assumption; community member counts are reach, never group size. Who uses, who pays, who approves.

5. **Synthesize — on the evidence you have.** Rank the groups on stated criteria (size, pain, fit, reach). Name the top-ranked group as the **lead**; if it doesn't clear the evidence bar ([references/audience-research.md](references/audience-research.md) § Evidence bar), label it "provisional — <what's missing>", keep it out of "In short" as a settled finding, and make the evidence gap a decision. **Every move rests on sources this run read**; a move on a channel it couldn't read is dropped or labelled "unverified — check the community and its rules first", and never becomes "Do this first". **For you** only where a finding matters ("nothing to do here" is fine). How rivals talk to them; don't follow the herd. Read the latest market and competitor reports and say in one line where this one agrees or differs (a different lead group, a different first move).

6. **List mode (only when asked).** [references/list-mode.md](references/list-mode.md) on the lead group (or the one named), with the outcomes ledger ([`../../atoms/outcomes-ledger/ATOM.md`](../../atoms/outcomes-ledger/ATOM.md), `entity: person`). The list becomes a section of the report plus `list.csv`; a thin free result is said plainly, never padded.

7. **Write and deliver** through [`../../atoms/write-report/ATOM.md`](../../atoms/write-report/ATOM.md) (its length budget, banned-word check, decisions box, "what we're not doing" and source-skew line; "Do this first" names who does it; every group's unread sources merged into "What we couldn't check", each with what it would change), as a local file with a clickable link (an artifact or the full report in hosted chat). Save through [`../../atoms/save-to-brain/ATOM.md`](../../atoms/save-to-brain/ATOM.md): the report, the buyer groups and the quote bank (paths below), with a `gooseworks:file_url` link. Propose the ranked buyer-group summary to the brand's audience field with `gooseworks:brand_update` (`knowledge.audience`, `agent_proposal`, ≤ 2,000 characters, citing the bank) — skipped when the lead is provisional.

8. **One message, at most three lines** (write-report §2): the first move, the link, and the decisions — the brand-story conflict if any; corrections to the groups; a named list for one group (if not asked); proof lines to sign off (claims-gate scoped sign-off); a **paid top-up** when the key sources were unreadable — name the gap it fills first (the forums and review sites this audience uses), the estimate, one yes to "up to N credits" ([`../../atoms/spend-gate/ATOM.md`](../../atoms/spend-gate/ATOM.md) branch B); a repeat only if it helps (step 9).

9. **Offer a repeat only when it helps** (AGENTS §8 Schedules: audience twice a year, or on a trigger — a new product, a new market, a big shift in who buys or why they leave). Say the reason and the trigger for this brand. **Never repeat a list.** When accepted: created paused, per spend-gate §C, each run opening with what changed.

10. **On their answers.** Re-run only what changes, the top-up inside its ceiling (log every charge), re-deliver the same way. A rule the marketer states goes through [`../../atoms/save-learning/ATOM.md`](../../atoms/save-learning/ATOM.md) as `[outreach YYYY-MM-DD]`.

## Approval gates

- One upfront question is allowed — the customer-data ask, only when the brand has customers. Everything else free needs no yes. A paid top-up needs one yes to a ceiling; it stops there.
- Research recommends; it never makes the asset and never contacts anyone. In list mode the marketer checks emails and sends from their own tool (D3).
- The audience-field proposal is accepted by the owner in the app; schedules, saved rules and new claims only on the marketer's yes.

## Output and write-back

| Artifact | Where (save mode) | Read by |
|---|---|---|
| Audience report | local `gooseworks-reports/<brand-slug>/<D>-audience.md`; workspace `research/audience/<D>-report.md` → `Audience report — <Brand> — <D>` (keep-history) | the marketer, the next run, research-market and research-competitors (consistency) |
| Buyer groups | `research/audience/buyer-groups.md` → `Buyer groups — <Brand> — <D>` (supersede); summary proposed to the audience field | research-market, plan-campaign, make-content, run-organic-social, the ad and video makers, work-with-creators, list mode |
| Quote bank | `research/audience/voc-bank.md` → `Voice-of-customer bank — <Brand> — <D>` (supersede); `voc-bank.jsonl` (not imported) | the ad and video makers, make-content, run-organic-social, research-competitors, plan-campaign |
| Group notes | `research/audience/segments/<slug>.md` | the next run |
| List mode: list, dropped, ledger | `research/audience/<D>-<list>/list.csv`, `dropped.csv`; `research/audience/ledger.csv` (outcomes-ledger) | the marketer's outreach tool, later runs |
| Paid charges | `research/credits-log/<YYYY-MM>.md` (spend-gate) | every playbook's estimates |

See [server-needs.md](server-needs.md).

## Done when

The report passes write-report §3. Before it, at most one question — the customer-data ask, when the brand has customers. It names 2–5 buyer groups by situation, each sized in buyers or companies (sourced or labelled), with buying roles and how to recognise one; a lead group named, labelled provisional with what's missing when the evidence bar isn't met; per top group at least three problems in their words with counts and first-hand quotes (at least five for the lead group, three for the others, or "thin" said plainly; at least 70% from the last 18 months); at least four places the lead group gathers, with evidence the group is there; and for every group three reach moves resting on sources this run read. Agreement or disagreement with the market and competitor reports is stated. The buyer groups and quote bank are saved. In list mode: every person row has a dated source, nothing says verified unless a checker did, a shortfall is stated.

## Out of scope

Market size, trends, demand, pricing norms and the category frame — **research-market** · what rivals run and price — **research-competitors** · creators to pay — **work-with-creators** · writing or sending sequences, DMs — not covered yet · positioning — backlog · channel budgets — **plan-campaign** · contacting anyone · lists of private individuals.
