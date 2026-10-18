---
name: research-audience
description: >-
  Audience research: who our people are and how to reach them. Use when the marketer says "research our audience", "who is our audience", "who should we target", "who are our best customers", "what do they want", "what problems do they have", "what words do they use", "where does our audience hang out", "which communities, newsletters, podcasts or events", "how do we reach them". Researches for free first — the brand, web search, reviews, Reddit and community threads, public posts, job posts, publications and events — and delivers a readable report: named segments, what each wants, their problems and how we solve them, their own words, where they hang out, and how to find and reach each, with what to do first. Builds a list of named people with sourced contact routes only when asked ("find me 50 right-fit people with emails"). Never contacts anyone. Not for market size, trends or how people buy — that's market research (research-market). Not for influencers to pay (work-with-creators).
---

# research-audience

Audience research answers, for the people a brand sells to: **who they are** (named segments), **what they want**, **their problems and how we solve them**, **their language**, **where they hang out**, and **how to find and reach them**. A list of named people to email is a separate, optional mode — only when the marketer asks for one. The craft is in [references/audience-research.md](references/audience-research.md); this file is the order of work.

**The rule that matters most: free pass first, ask nothing, report once** (AGENTS §8 research pattern). Before the first message, cover every segment on every dimension from free sources and write the report. Never stop after a few finds to ask "which segment should I go deeper on?" — researching each segment *is* the job. Paid reads only deepen it, with one credit yes.

## What you get

1. **The audience report** (written through [`../../atoms/write-report/ATOM.md`](../../atoms/write-report/ATOM.md), opens with one click, saved to the brand): in short (do this first, and why); who the audience is — 2–5 named segments, ranked, the primary one named; per segment what they want, their problems and how we solve them (or "you'd need proof of X first"), their words (verbatim, linked), where they hang out (named communities, channels, publications, podcasts, events, creators, with how active), and how to reach them (the first three moves); **You vs them** (how rivals talk to these people; where everyone sounds the same); what to do; what we couldn't check; sources. Shape: [references/audience-research.md](references/audience-research.md) § The report.
2. **The audience profile** — the durable short version other work reads (segments, words, hangouts, reach), saved to the brand.
3. **Only in list mode:** named accounts and people with dated sources and honest contact routes, a ledger so the next batch never repeats a person ([references/list-mode.md](references/list-mode.md)).

## Before you start

1. **Connection and brand.** First GooseWorks call: `gooseworks:get_started` with the marketer's words (`wants: "more"`); it settles setup and the brand only (when it asks which brand, ask in one line and call it again). A needed tool not listed → one `gooseworks:tools_load` (`brand`, `files`, `media`, `data`). Still none → say only: "Connect GooseWorks first — I research your audience and save what I find through it." Send `client` on every call that takes it. Keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read the brain — free.** `gooseworks:brand_read` (summary, kit — especially `audience` — products, competitors, organic, learnings); `gooseworks:knowledge_search` for customer evidence, reviews and earlier research; `gooseworks:competitor_read`. Workspace, in the **brand coworker scope** (`coworker_agent_id`; the `brands/<brand-slug>/` prefix only when there is no coworker): `research/audience/` (the last profile and report — a re-run reports what changed), `research/market/` (segments, the voice-of-customer bank, the demand read — reuse them, never redo them), `research/competitors/` (rival records). Claims: only the read step of [`../../atoms/claims-gate/ATOM.md`](../../atoms/claims-gate/ATOM.md) now.
3. **Do not message the marketer yet.** No stop before research. A list ask ("50 right-fit people with emails") switches on list mode for the primary segment — the audience pass still runs first, lighter, because the list is only as good as the segment it's built on. Out of scope (consumers as named individuals, journalists, investors, creators to pay): one line and the nearest thing this playbook does.

## Steps

1. **Frame.** From the brand's own site in the host browser (what it sells, to whom, pricing, customer logos and case studies, the words it uses), the brain's `audience` text, and research-market's segments if present: the 2–5 candidate segments, named in plain words ("in-house growth leads at consumer brands spending on Meta", "agencies running client ads"), each with how you'd recognise one and why it's a candidate. Company type sets the dimensions ([references/audience-research.md](references/audience-research.md) § By company type). Where the brand's own facts disagree (site vs brain), note it for the report.

2. **News first.** Web search, last 90 days, for what is changing *for these people* — new tools and platform changes they must adopt, layoffs and hiring in their roles, budget shifts, regulation, the conversations everyone in the category is having. Anything in the last 30 days is a candidate opening.

3. **Research every segment.** One worker per segment — a subagent where the host supports it — briefed with [atoms/segment-pass](atoms/segment-pass/ATOM.md): wants, problems and how we solve them, their language, where they hang out, how to reach them, read from reviews of the products they use, Reddit and community threads, their own public posts and talks, job posts for their roles, the newsletters, podcasts and events they follow, and how rivals target them. Without subagents, segment by segment, each written to `research/audience/segments/<slug>.md` before the next. Never pause for paid reads.

4. **Synthesize.** Rank the segments (how many, how much pain, how well we fit, how reachable) and name the primary one. For every finding, **For you** — does it fit us, from our product and facts; if yes, what to do (the message to lead with, the channel, the asset, who makes it, the signed-off claim behind it or "you'd need proof of X first"). **You vs them** from rivals' sites, ads and posts. Don't follow the herd: weigh what the audience says over what rivals do. The reach plan: per segment, the first three moves with how we'll know they worked.

5. **List mode (only when asked).** Run [references/list-mode.md](references/list-mode.md) on the primary segment (or the one the marketer named): accounts first, then the right people, sourced titles, honest email status, region flags, the outcomes ledger ([`../../atoms/outcomes-ledger/ATOM.md`](../../atoms/outcomes-ledger/ATOM.md), `entity: person`). The list becomes a section of the report plus `list.csv`. If the free pass finds few named people, say so plainly and offer the top-up — never pad.

6. **Write and deliver** through [`../../atoms/write-report/ATOM.md`](../../atoms/write-report/ATOM.md): the report as a local file with a clickable link in a host with files (an artifact or the full report in hosted chat), saved to the brand through [`../../atoms/save-to-brain/ATOM.md`](../../atoms/save-to-brain/ATOM.md) with a `gooseworks:file_url` link. Run write-report's §3 check before handing it over.

7. **One message, at most three lines** (write-report §2): the one thing to do first, the link, and the decisions — corrections to the segments; whether to build a named list for one segment (if not asked); proof lines to sign off for the top messages (claims-gate scoped sign-off); a **paid top-up** to deepen it (what it adds — comment and post reads at volume, LinkedIn post search, more named people in list mode — the estimate, one yes to "up to N credits", [`../../atoms/spend-gate/ATOM.md`](../../atoms/spend-gate/ATOM.md) branch B); a repeat only if it would help this brand (below).

8. **Offer a repeat only when it helps** (AGENTS §8 Schedules). Judge it: an audience report is worth refreshing when the audience is moving — new tools or platforms they're adopting, a launch into a new segment, a channel the plan depends on — typically quarterly, with the reason ("your primary segment is changing fast around AI agents; a quarterly refresh catches new communities and words"). A stable audience: no offer. **List mode is one-off — never offer to repeat a list**; a top-up of the next batch is a new ask. When offered and accepted: created paused, per spend-gate §C, each run's report opening with what changed.

9. **On their answers.** Re-run only what changes, the top-up inside its ceiling (log every charge), and re-deliver the report the same way. A rule the marketer states goes through [`../../atoms/save-learning/ATOM.md`](../../atoms/save-learning/ATOM.md) as `[outreach YYYY-MM-DD]`.

## Approval gates

- The free pass needs no yes and asks nothing. A paid top-up needs one yes to a ceiling; it stops there.
- Research recommends; it never makes the asset and never contacts anyone. In list mode the marketer checks emails and sends from their own tool (D3).
- Schedules, saved rules and new claims only on the marketer's yes.

## Output and write-back

| Artifact | Where (save mode) | Read by |
|---|---|---|
| Audience report | local `gooseworks-reports/<brand-slug>/<D>-audience.md`; workspace `research/audience/<D>-report.md` → `Audience report — <Brand> — <D>` (keep-history) | the marketer, the next run |
| Audience profile | `research/audience/profile.md` → `Audience profile — <Brand> — <D>` (supersede) | plan-campaign (channels), make-content and run-organic-social (words, places), work-with-creators (who the audience follows), list mode |
| Segment notes | `research/audience/segments/<slug>.md` | the next run |
| List mode: list, dropped, ledger | `research/audience/<D>-<list>/list.csv`, `dropped.csv`; `research/audience/ledger.csv` (outcomes-ledger) | the marketer's outreach tool, later runs |
| Paid charges | `research/credits-log/<YYYY-MM>.md` (spend-gate) | every playbook's estimates |

The brand's `audience` field is not written here (see critique.md: who proposes it after the market/audience split is the orchestrator's call). See [server-needs.md](server-needs.md).

## Done when

The report passes write-report §3 and arrived with no question asked before it. It names 2–5 segments with the primary one; each has what they want, problems with how we solve them, at least five verbatim phrases with links, named places they hang out with evidence of activity, and three first moves to reach them; every finding has For you; You vs them is there; what couldn't be checked is listed. In list mode: every person row has a dated source, nothing says verified unless a checker did, a shortfall is stated.

## Out of scope

Market size, trends, demand and how people buy — **research-market** · what rivals run and price — **research-competitors** · creators to pay — **work-with-creators** · writing or sending sequences, DMs — not covered yet · channel budgets — **plan-campaign** · contacting anyone · lists of private individuals.
