---
name: research-market
description: >-
  Use when a founder or marketer asks for market research or a brand watch: "do the market research for <brand>", "which market are we in", "how big is my market", "is my category growing", "what's changing in my market", "how do people buy in my category", "what do others charge", "what are people saying about me and my category", "who's talking about us", "what's trending in my category", "watch my brand", "tell me if something blows up". Delivers a readable market report — which market the brand is in, its size top-down and bottom-up, what's changing, how and where buyers find and buy, pricing norms, where attention is, demand, what people are saying now, the competition in brief, and what it means for positioning — or, in brand-watch mode, alerts only when something crosses a threshold. Researches first, asks only decisions at the end. Not for who the buyers are and their own words — use research-audience; not for a deep look at rivals — use research-competitors.
---

# research-market

Market research decides **which market the brand is in, how big the reachable part is, and what's changing in it** — then what that means for the brand. It reads the buyer groups research-audience owns and sizes them; it doesn't build its own. Rivals get one short section that points to competitor research. It also runs a light **brand watch**: risk first, alerts only. The worker briefs are in `atoms/` and the craft in `references/`, next to this file.

**The rule that matters most: free pass first, ask nothing, report once** (AGENTS §8 research pattern). Do every dimension before the first message to the founder; never stop to ask "go deeper?"; never ask for free work. A broad ask gets everything; an ask that names an area — **the market** · **what people are saying** — gets that area covered completely, with news first.

## Before you start

1. **Connection and brand.** Use the GooseWorks server the project says to use (a test folder's README may name staging). No GooseWorks tools listed (after one `gooseworks:tools_load`) → say only: "Connect GooseWorks first — I research your market and save what I find through it." First call: `gooseworks:get_started` with the marketer's words (`wants: "more"`); send `client` on every call that takes it; don't show a menu unrelated to research. A named brand not in the account → create it from its website (`gooseworks:brand_setup`) without asking and wait for its research (`gooseworks:job_get`). Several matches → list and ask (the one question allowed). Keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read the brain and the sibling reports.** `gooseworks:brand_read` (`summary`, `kit`, `products`, `competitors`, `learnings`, `sources`, `organic`, `accounts`), `gooseworks:knowledge_search`, `gooseworks:competitor_read`; workspace: `research/market/` (the last report and watch log), `research/audience/` (`buyer-groups.md` — the groups with their counts — and the latest audience report), `research/competitors/` (the latest report), `plans/`, `research/credits-log/`. Brand facts come from the brain first, the website second; where they differ, say so and use neither as a claim. Claims: only the read step of `../../atoms/claims-gate/ATOM.md` now.
3. **Do not ask the founder anything yet** (one-line status notes are fine), never change the host's settings, and never seed a search with names or claims from memory.

## Steps — the market report

1. **Frame.** Company type, products, markets, the area asked, first run or "what changed since <date>".
2. **News first.** Web-search the last 90 days for the brand and the category: launches, funding, shutdowns, acquisitions, regulation, platform changes, price moves.
3. **Brief the workers.** Read each brief and paste its full text into the worker's instructions with the brand facts, `brand_id`, research-audience's buyer groups and the window: `atoms/market-pass/ATOM.md` (which market, size top-down and bottom-up, change, buying, pricing, attention, demand, baselines) and `atoms/listening/ATOM.md` (what people are saying). A cheaper model is fine for this reading work. Keep each return as it arrives. An item marked "tell the founder now" goes to chat at once (`references/listening-craft.md` § Risk). Edge cases — no browser, a stalled or stopped worker, facts from earlier research, a bad rival on the list, a report already saved today, a late read — follow `atoms/edge-cases/ATOM.md`.
4. **Open what needs the browser yourself** — the pages workers list, one site at a time, after one line to the founder.
5. **Write the story** (`references/report-format.md`). Lead with **which market we're in** (2–3 candidates, the one buyers use, the recommendation) and **how big the reachable part is** — likely buyers × price per buyer group, from research-audience's groups (no buyer groups yet: the groups this run can see, marked provisional, and running audience research is a decision). Where a sibling report disagrees (a different lead buyer, a different first move, a fact), say so in one line and why. End the story with **what this means for positioning** — who we're for, what we're up against, why we win — as a pointer; writing positioning is on the backlog. Close a finding with **For you** only where it matters ("nothing to do here" is fine). Name the source skew. Keep the baselines table. Check every number, date and quote against what a worker returned.
6. **Deliver it** through `../../atoms/write-report/ATOM.md`: local `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-market-research.md` with a clickable link and an offer to open it (an artifact in hosted chat); the brand copy `research/market/<YYYY-MM-DD>-read.md` through `../../atoms/save-to-brain/ATOM.md` (`keep-history`) with its link (`gooseworks:file_url`); `demand.md` and `watchlist.md` (`supersede`); outliers to the inspiration library (`references/listening-craft.md`).
7. **One message: the draft and the decisions** (write-report §2: three lines, then at most five numbered decisions): the one thing to do first and the link; the decisions from the report's "Decisions for you" box — e.g. which market to compete in, a paid top-up only for what free reads and the browser couldn't get (one yes to "up to N credits", `../../atoms/spend-gate/ATOM.md` branch B), running audience research if there are no buyer groups yet — and **a repeat only if it would help this brand**, with the reason and the cadence (a monthly one-page pulse plus a full report each quarter; a brand watch weekly, daily during a launch or a crisis; scheduled runs have no browser, so say what they can't read; created paused, spend-gate branch C). Never ask for free work again.

## Brand watch — alerts only

"Watch my brand", "anyone talking about us this week?", "tell me if something blows up", or a scheduled watch: run `atoms/listening/ATOM.md` alone in brand-watch mode — risk first, then mentions since the last watch. Something crosses a threshold → a short alert in chat (what happened, linked; reach; how many separate people; what we know and don't; who handles it, or "decide who handles this now"; for a serious risk the hold list of ads, scheduled posts and emails that touch the product) and a dated note `research/market/watch/<YYYY-MM-DD>.md` through write-report's short form. Nothing crosses a threshold → say nothing to the founder on a scheduled run (one line when they asked), and save only the counts checked, for the next baseline. Replies are not drafted here (BACKLOG card "Reply drafts", owner run-organic-social).

## Approval gates

- The free pass needs no yes; a paid top-up needs one yes to a ceiling; schedules are created paused.
- Rivals tracked and rules saved only on the founder's yes. Research recommends; it never makes the asset.
- Never contact, reply to or report anyone; pause nothing — the hold list is a recommendation.

## Output and write-back

| Artifact | Where it lives | Who reads it next |
|---|---|---|
| Market report | local `gooseworks-reports/<brand-slug>/<D>-market-research.md` + `research/market/<D>-read.md` + document (keep-history) | the founder; plan-campaign; research-audience and research-competitors (sibling reports); analyze-performance and run-organic-social ("What people are saying"); the next run |
| Demand read | `research/market/demand.md` + document (supersede) | plan-campaign |
| Brand-watch notes | `research/market/watch/<D>.md` (keep-history; alerts, or counts only) | the founder, the next watch, analyze-performance |
| Listening watchlist | `research/market/watchlist.md` + document (supersede) | the next run |
| Outlier posts | inspiration library (tag `research-market`) | the ad and content makers, work-with-creators, run-organic-social |

## Done when

- No question before the report (beyond picking the brand); news ran first; browser-only pages opened or named as couldn't-read.
- The report passes write-report §3 (In short ≤ 150 words with "Do this first" and nothing unverified; Decisions for you; body ≤ 3,000 words; ≤ 6 moves; What we're not doing; couldn't-check; sources with the skew line; no ids, paths, tool names or jargon).
- It decides which market, sizes it top-down and bottom-up from research-audience's groups (or provisional ones), covers change, buying, pricing, attention, demand and what people are saying, keeps rivals to one short section, states disagreements with sibling reports, ends with what it means for positioning, and keeps a baselines table.
- It was saved to the brand and opens locally; the closing message held only decisions; a repeat was offered only with a reason. A brand watch alerted only above a threshold.

## Out of scope

Who the buyers are, their problems and their words, and the customer-quote bank (research-audience) · deep rival profiles and ads (research-competitors) · reply drafts (BACKLOG, owner run-organic-social) · writing positioning (write-my-positioning, backlog) · channels and budgets (plan-campaign).
