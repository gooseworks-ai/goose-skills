---
name: research-market
description: >-
  Market research and brand watch: which market the brand is in, how big the reachable part is, what's
  changing, how buyers buy and what they pay, what people are saying now, and what it means for
  positioning. Use when the marketer asks for market research, "how big is my market", "what's
  changing in my category", "what do others charge", "what are people saying about us", "is there
  demand for <idea>", or "watch my brand / tell me if something blows up" (alerts only, risk first).
  Researches first, asks only decisions at the end, and delivers a readable report saved to the brand.
  Not for who the buyers are and their own words — use research-audience; not for a deep look at
  rivals — use research-competitors.
version: 0.4.1
---

# research-market

Market research decides **which market the brand is in, how big the reachable part is, and what's changing in it** — then what that means for the brand. It reads the buyer groups research-audience owns and sizes them; it doesn't build its own. Rivals get one short section that points to competitor research. It also runs a light **brand watch**: risk first, alerts only. The worker briefs are its step skills (`research-market-<step>`) and the craft is in `references/`, next to this file.

**The rule that matters most: free pass first, ask nothing, report once** (`../marketing-guide/research-pattern.md` (in the `marketing-guide` skill) — read it before the first search). Do every dimension before the first message to the marketer; never stop to ask "go deeper?"; never ask for free work. A broad ask gets everything; an ask that names an area — **the market** · **what people are saying** — gets that area covered completely, with news first.

## Before you start

1. **Setup first:** do the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2 (connect, brand, brain read) before anything else; the job line is "I research your market and save what I find through it." Here: call `get_started` with `wants: "more"`; a named brand not in the account → create it from its website (`gooseworks:brand_setup`) without asking and wait for its research (`gooseworks:job_get`); don't show a menu unrelated to research. Fallback brand read: `gooseworks:brand_read` (`summary`, `kit`, `products`, `competitors`, `learnings`, `sources`, `organic`, `accounts`) and `gooseworks:knowledge_search`. Either path: `gooseworks:competitor_read`; workspace: `research/market/` (the last report and watch log), `research/audience/` (`buyer-groups.md` — the groups with their counts — and the latest audience report), `research/competitors/` (the latest report), `plans/`, `research/credits-log/`. Where the brain and the website differ on a brand fact, say so and use neither as a claim. Claims: only the read step of the `claims-gate` skill (`../claims-gate/SKILL.md`) now.
2. **Run memory:** job `market research`, `market pulse` or `brand watch`; what this job hands the atom is in `references/run-memory.md`. Its "since last time" opens the chat and the report's story.
3. **An idea, not a market?** When the ask names a product, offer or concept that doesn't exist yet ("is there demand for …?"), run the same steps pointed at it, with `references/idea-validation.md`.
4. Never change the host's settings, and never seed a search with names or claims from memory.

## Steps — the market report

1. **Frame.** Company type, products, markets, the area asked, first run or "what changed since <date>".
2. **News first.** Web-search the last 90 days for the brand and the category: launches, funding, shutdowns, acquisitions, regulation, platform changes, price moves.
3. **Brief the workers.** Read each brief and paste its full text into the worker's instructions with the brand facts, `brand_id`, research-audience's buyer groups and the window: the `research-market-market-pass` skill (`../research-market-market-pass/SKILL.md`) (which market, size top-down and bottom-up, change, buying, pricing, attention, demand, baselines) and the `research-market-listening` skill (`../research-market-listening/SKILL.md`) (what people are saying). Exactly these two workers (or the main run does both, one after the other, on a host without subagents) — no workflow on top, and workers don't load skills or start their own. A cheaper model is fine for this reading work. Keep each return as it arrives. An item marked "tell the marketer now" goes to chat at once (`references/listening-craft.md` § Risk). Edge cases — no browser, a stalled or stopped worker, facts from earlier research, a bad rival on the list, a report already saved today, a late read — follow the `research-market-edge-cases` skill (`../research-market-edge-cases/SKILL.md`).
4. **Open what needs the browser yourself** — the pages workers list, one site at a time, after one line to the marketer.
5. **Write the story** in the shape of `references/report-format.md`. Size the reachable part from research-audience's groups (no buyer groups yet: the groups this run can see, marked provisional, and running audience research is a decision), with the realistic-share rule in the `research-market-market-pass` skill (`../research-market-market-pass/SKILL.md`) §2. **When the recommended market contradicts the brand's stated positioning,** say so plainly, list what this run didn't test (buyer interviews, win/loss, a live test), and frame it as the founders' decision; never give it a deadline under a week unless something outside forces it (a launch, an event, a renewal). Quote 3–5 buyers **word for word with links** to the post itself (never a community's home page) — from research-audience's quote bank or this run's listening, never composites or paraphrase; a quote taken from an earlier report is re-opened, or labelled "from <report>, not re-checked". Check every number, date and quote against what a worker returned.
6. **Check, then deliver.** Run the check in `references/report-format.md`, then deliver through the `write-report` skill (`../write-report/SKILL.md`) (topic `market-research`; brand copy `research/market/<YYYY-MM-DD>-read.md`, `keep-history`). Also save `demand.md` and `watchlist.md` (`supersede`) through the `save-to-brain` skill (`../save-to-brain/SKILL.md`), and outliers to the inspiration library (`references/listening-craft.md`).
7. **Save the run — before the closing message.** The End steps of the `run-memory` skill (`../run-memory/SKILL.md`), with the numbers and recommendations in `references/run-memory.md`. A monthly pulse opens with what changed against the stored numbers. When the marketer answers a decision afterwards, re-save the same day's record with it (`references/run-memory.md`).

8. **One message: the draft and the decisions,** in the closing-message shape in `references/report-format.md`, with the one-line "saved this run's notes" folded in (at most five one-line decisions): the one thing to do first and the link; the decisions from the report's "Decisions for you" box — e.g. which market to compete in, a paid top-up only for what free reads and the browser couldn't get (one yes to "up to N credits", the `spend-gate` skill (`../spend-gate/SKILL.md`) branch B), running audience research if there are no buyer groups yet — and **a repeat only if it would help this brand** (marketing-guide §3 **Schedules**), saying what scheduled runs can't read without a browser.

## Brand watch — alerts only

"Watch my brand", "anyone talking about us this week?", "tell me if something blows up", or a scheduled watch: run the `research-market-listening` skill (`../research-market-listening/SKILL.md`) alone in brand-watch mode — risk first, then mentions since the last watch. Something crosses a threshold → a short alert in chat (what happened, linked; reach; how many separate people; what we know and don't; who handles it, or "decide who handles this now"; for a serious risk the hold list of ads, scheduled posts and emails that touch the product) and a dated note `research/market/watch/<YYYY-MM-DD>.md` in the brand-watch note shape (`references/report-format.md`). Nothing crosses a threshold → say nothing to the marketer on a scheduled run (one line when they asked). Either way, run-memory's Start and End steps run with job `brand watch`: the counts are judged against the last brand-watch record, and the new record (counts, alerts or "nothing crossed a threshold") is the next baseline.

## Approval gates

- The free pass needs no yes; a paid top-up needs one yes to a ceiling; schedules are created paused.
- Rivals tracked and rules saved only on the marketer's yes. Research recommends; it never makes the asset.
- Never contact, reply to or report anyone; pause nothing — the hold list is a recommendation.

## Output and write-back

Paths and readers: the research-market rows of the marketing-guide's §4 table. Each file's title, tags and save mode: `references/report-format.md` (the watchlist's shape: `references/listening-craft.md`).

## Done when

- No question before the report, beyond picking the brand; news ran first; browser-only pages opened or named as couldn't-read.
- The report passes write-report §3 and the report-format check.
- It decides which market, sizes it top-down and bottom-up from research-audience's groups (or provisional ones), covers change, buying, pricing, attention, demand and what people are saying, keeps rivals to one short section, states disagreements with sibling reports, ends with what it means for positioning, and keeps a baselines table.
- It quotes 3–5 buyers word for word, each linked to the post itself.
- It was saved to the brand and opens locally.
- The run record was saved before the closing message, with this run's moves as recommendations and the last run's outcomes.
- The closing message held only decisions; a repeat was offered only with a reason. A brand watch alerted only above a threshold, and saved its record either way.

## Out of scope

Who the buyers are, their problems and their words, and the customer-quote bank (research-audience) · deep rival profiles and ads (research-competitors) · reply drafts (BACKLOG, owner run-organic-social) · writing positioning (write-my-positioning, backlog) · channels and budgets (plan-campaign).
