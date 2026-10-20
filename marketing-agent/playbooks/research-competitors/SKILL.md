---
name: research-competitors
description: >-
  Use when a founder or marketer asks "what are my competitors running right now, and what works for them?", "competitor teardown", "what's new with my competitors", "what ads are they running", "how do they price", "what are their founders posting", "find gaps and angles", "what changed this week", or "X just launched / shut down / cut prices". Researches every main rival on every dimension — news first, then ads on every platform, founder and company posts, launches and demo videos, pricing, positioning, reviews, community talk, hiring, partnerships, events, AI answers — and delivers a readable report: "Do this first", time-boxed openings, the landscape, same-shape rival profiles, a swipe file of formats, angles and watch triggers. Saved so the next run reports what changed. Weekly watch and react modes. Never copies their words or disparages. Not for what people say about you — use research-market; not for who your buyers are and their words — use research-audience.
---

# research-competitors

Competitor research tells the founder what to do next; it is not a list of ads. Craft: `references/research-spec.md`; worker briefs: `atoms/`; the report: `references/report-format.md` — next to this file.

**The rule that matters most: free pass first, ask nothing, report once** (AGENTS §8 research pattern). Research every dimension for every main rival, browser-only sources included, before the first message; never ask permission for free work or offer to pay for what a free read could get. An ask that names an area ("what ads are they running?") gets that area covered completely, news and launches first.

## Before you start

1. **Connection and brand.** Use the GooseWorks server the project names. No GooseWorks tools listed (after one `gooseworks:tools_load`) → say only: "Connect GooseWorks first — I research your competitors and save what I find through it." First call `gooseworks:get_started` with the marketer's words; send `client` on every call that takes it; don't show a menu unrelated to research. A named brand not in the account → create it from its website (`gooseworks:brand_setup`) without asking and wait for its research (`gooseworks:job_get`). Several matches → list and ask (the one question allowed). Keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read the brain.** When `brain_*` tools are listed, `gooseworks:brain_map` first (core rules, the never-list, items waiting for a yes), then `gooseworks:brain_open` / `gooseworks:brain_search` for the chapters this job needs; otherwise `gooseworks:brand_read` (`summary`, `kit`, `products`, `competitors`, `organic`, `learnings`), `gooseworks:competitor_read` (+ `suggestions`), `gooseworks:automation_list`; workspace: `research/competitors/` (last report, rival records), `research/market/` (the newest market report and its "which market" decision), `research/audience/` (`buyer-groups.md` and the latest audience report), `plans/`, `reports/performance/`. Brand facts: brain first, website second. Claims: only the read step of `../../atoms/claims-gate/ATOM.md` now; off-limits rules from the brain's `dont` and `must` facts.
3. **Load the last run.** The Start steps of `../../atoms/run-memory/ATOM.md` for this job (`competitor research` or `competitor watch`; inputs, numbers and checks in `references/run-memory.md`): the last record and report, every earlier recommendation checked against a source, 3–5 lines of "since last time" that open the chat and the report's story, open items carried forward. No record → say it's the first run; this run's numbers become the baseline.
4. **Do not ask the founder anything yet** (one-line status notes are fine), never change the host's settings or permissions, and never seed a search or a worker with names or claims from memory — only what a source gave you.

## Steps

1. **Find the field yourself, before any worker starts.** About 6–10 searches by the main run: news for our brand and the category (last 90 days), then "best <category>", "<brand> alternatives", "<the strongest saved rival> alternatives", "<category> tools", and one AI answer. The saved roster is a starting list, never the answer. State the **frame of reference** in one line — the category we compete in (research-market's decision when it exists) and the other frames we could claim (e.g. "AI ad-creative tool" vs "AI agents for go-to-market teams"), because the frame decides which rivals matter. Then choose 3–6 main rivals — the ones buyers compare us with now, each with its reason — and 2–4 adjacent options (doing it yourself, an agency, the platforms' own tools). A name you'd only watch goes in the brief competition line, not as a main rival. Anything from the last 30 days is a candidate **timely opening**.

2. **Brief the workers — lean.** Exactly one subagent per main rival with `atoms/rival-pass/ATOM.md`, one with `atoms/category-pass/ATOM.md`, one with rival-pass on our own brand — no more, no workflow on top. Paste the short brief's full text with `brand_id`, our product summary, approved claims, the frame, a typical-buyer scenario for pricing ("a 10-person team making 40 ads a month"), the off-limits list and today's date; workers don't load skills or start their own subagents. Standard depth is the brief's cap (about 12 searches and 12 fetches each); a deep teardown — quarterly, or when the founder asks — doubles it. A cheaper model is fine. Workers use web search, page fetch and the free server reads, and return everything, including the pages that need the browser. Edge cases — no browser, a stalled or stopped worker, facts from earlier research, a bad rival on the list, a report already saved today, a late read — follow `atoms/edge-cases/ATOM.md`.

3. **Open the browser-only sources yourself, before the report.** Workers often can't. For every main rival and for us: the Meta, LinkedIn, Google and TikTok ad libraries, searched by the advertiser's page or name (not the domain), plus the pages workers listed (X and LinkedIn posts, script-only pricing pages, review pages that block fetch). Tell the founder once, in one line, first.

4. **Go deep on what moved.** For the 1–2 biggest launches, watch the demo and the 3 best third-party posts (`references/rival-craft.md` §5) and break each into hook, setup, reveal, proof, CTA; write a **format brief** per demo. Counter-position only if the **leverage test** passes — we are the challenger here, we genuinely do the same job better, we have dated proof, and our answer can reach enough of the rival's buyers to matter; then draft the **counter-position kit** (`references/angles-and-gaps.md` "Launches"). Otherwise it goes under "What we're not doing": not every launch needs an answer. For each timely opening, draft the move (spec §4) with an end date.

5. **Write the story.** In the shape of `references/report-format.md`: You vs them, what changed since last time (each saved snapshot), at most six ranked moves, the formats and angles (`references/angles-and-gaps.md`). A new entrant hitting us harder than a main rival gets a short rival pass (§1, §2, §6, §7, §15) now. "Do this first" and the top angle are never something the report itself calls table stakes. Where a sibling report (market, audience, a plan) disagrees, say so in one line and why; end the story with **what this means for positioning** (a pointer — writing positioning is on the backlog). Close a finding with **For you** only where it matters ("nothing to do here" is fine). Name the source skew; keep the baselines table. Check every number, date, quote and "no ads found" against what a worker or the browser returned; drop what you can't trace.

6. **Check, then deliver.** Run the check in `references/report-format.md` (count the words, links inline, owners on moves), then deliver through `../../atoms/write-report/ATOM.md`: local file `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-competitor-research.md` with a clickable link and an offer to open it (an artifact in hosted chat), and the brand copy `research/competitors/<YYYY-MM-DD>-report.md` through `../../atoms/save-to-brain/ATOM.md` (`keep-history`) with its link (`gooseworks:file_url`). Also save each rival record, `landscape.md`, `angle-bank.md` (`supersede`), and swipe items to the inspiration library (`gooseworks:social_inspiration_save`).

7. **Save the run — before the closing message.** The End steps of `../../atoms/run-memory/ATOM.md`: the run record with the numbers in `references/run-memory.md`, this run's moves as recommendations (id, owner, review-by, how we'll know) and the outcomes of the last ones. When the founder answers a decision afterwards, re-save the same day's record with it (`references/run-memory.md`).

8. **One message: the draft and the decisions,** in the closing-message shape in `references/report-format.md`, with the one-line "saved this run's notes" folded in (at most five one-line decisions): the one thing to do first and the link; which openings to act on · the rivals covered (add or drop any?) · sign-off for the claims the top moves need · a paid top-up only for what free reads and the browser couldn't get, named, with the estimate and one yes to "up to N credits" (`../../atoms/spend-gate/ATOM.md` branch B; with no price history the founder names N) · **a repeat, only if it would help this brand** — judge it (rivals shipping, raising or advertising actively: a weekly what-changed report, silent unless something crosses a threshold, plus a full teardown each quarter; a quiet field: quarterly, or none) and, if yes, give the reason and the cadence, and say that scheduled runs have no browser, so ad libraries are read only in runs you start (`references/watch-and-react.md`, created paused). Optional, one line each: tracking new rivals (`gooseworks:competitor_save`), keeping the top angles as rules (`../../atoms/save-learning/ATOM.md`).

9. **Watch and react** (`references/watch-and-react.md`, same dimensions). **What changed** (on ask, or the scheduled repeat): opens with what changed against the stored numbers and each rival's snapshot; a report only when something crosses a threshold, a run record every time. **React now** ("X just launched / shut down"): verify, read the market's reaction, alert this turn with the window, the move and a draft brief.

## Approval gates

- The free pass needs no yes and asks nothing; a paid top-up needs one yes to a ceiling; schedules are created paused.
- Only with the founder's yes: newsletter or trial sign-ups, tracking a rival, saved rules, new claims.
- Research recommends; it never makes the asset. Never publish, contact anyone, copy a rival's words or footage, mock a rival or its customers, or claim their spend or results. Named comparisons need sign-off and dated proof.

## Output and write-back

| Artifact | Where (save mode) | Read by |
|---|---|---|
| Report | local `gooseworks-reports/<brand-slug>/<D>-competitor-research.md` + `research/competitors/<D>-report.md` + document (keep-history) | the founder, the next run |
| Rival records + snapshots | `research/competitors/<slug>.md` (supersede) | the watch, plan-campaign, make-content |
| Landscape | `research/competitors/landscape.md` (supersede) | plan-campaign |
| Angle bank (`A-NN`, tag `angle:a-nn` — ids stay out of the report) | `research/competitors/angle-bank.md` (supersede) | make-static-ads, make-video-ads, plan-campaign |
| Swipe items | inspiration library | the ad and content makers |
| What-changed reports | `research/competitors/watch/<D>.md` (keep-history; line 2 `Week of …`) + local copy | the founder, analyze-performance |

## Done when

- No question before the report (beyond picking a brand); the frame of reference is stated; rivals were chosen from category evidence; news covered every rival and our brand; every ad library was searched for every main rival and us — in the browser where workers couldn't, or the report says once which couldn't be opened and why — and every rival has a same-shape profile.
- The report passes write-report §3 (In short ≤ 150 words, "Do this first" not table stakes and nothing unverified; Decisions for you; body ≤ 3,000 words; ≤ 6 moves; What we're not doing; baselines; couldn't-check; sources with the skew line; no ids or jargon), leads with timely openings, counter-positions only where the leverage test passed, states disagreements with sibling reports, and ends with what it means for positioning.
- It was saved to the brand and opens locally; the closing message held only decisions, and a repeat was offered only with a reason it would help.

## Out of scope

Making the ads (make-static-ads, make-video-ads) · budgets and channel bets (plan-campaign) · what people say about our brand and the market (research-market) · our own search visibility (improve-search-visibility) · writing positioning (write-my-positioning, backlog).
