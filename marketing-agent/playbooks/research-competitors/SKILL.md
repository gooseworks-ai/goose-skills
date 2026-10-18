---
name: research-competitors
description: >-
  Use when a founder or marketer asks "what are my competitors running right now, and what works for them?", "competitor teardown", "what's new with my competitors", "what ads are they running", "how do they price", "what are their founders posting", "find gaps and angles", "what changed this week", or "X just launched / shut down / cut prices". Researches every main rival on every dimension — news first, then ads on every platform, founder and company posts, launches and demo videos, pricing, positioning, reviews, community talk, hiring, partnerships, events, AI answers — and delivers a readable report: "Do this first", time-boxed openings, the landscape, same-shape rival profiles, a swipe file of formats, angles and watch triggers. Saved so the next run reports what changed. Weekly watch and react modes. Never copies their words or disparages. Not for what people say about you — use research-market; not for who your buyers are — use research-market.
---

# research-competitors

Competitor research tells the founder what to do next; it is not a list of ads. The craft is in `references/research-spec.md`; the worker briefs are in `atoms/` and the report's shape in `references/report-format.md` — both folders sit next to this file.

**The rule that matters most: free pass first, ask nothing, report once** (AGENTS §8 research pattern). Research every dimension for every main rival — browser-only sources included — before the first message to the founder. Never stop to ask "go deeper?", never ask permission for free work, never offer to pay for what a free read could get. A broad ask gets everything; an ask that names an area ("what ads are they running?") gets that area covered completely — with news and launches first.

## Before you start

1. **Connection and brand.** Use the GooseWorks server the project says to use (a test folder's README may name staging). No GooseWorks tools listed (after one `gooseworks:tools_load`) → say only: "Connect GooseWorks first — I research your competitors and save what I find through it." First call: `gooseworks:get_started` with the marketer's words (`wants: "more"`); send `client` on every call that takes it; a menu unrelated to research is not shown. The named brand isn't in the account → create it from its website (`gooseworks:brand_setup`) without asking, and wait for its research (`gooseworks:job_get`) up to a few minutes. Several matches → list and ask (the one question allowed). Keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read the brain.** `gooseworks:brand_read` (`summary`, `kit`, `products`, `competitors`, `organic`, `learnings`), `gooseworks:competitor_read` (+ `suggestions`), `gooseworks:automation_list`; workspace: `research/competitors/` (last report, rival records), `research/market/` (the newest market report, `voc-bank.md`, `personas.md`), `reports/performance/`. Brand facts come from the brain first, the website second. Claims: only the read step of `../../atoms/claims-gate/ATOM.md` now. Off-limits rules come from the brain's `dont` and `must` facts. With an empty brain after the brand's research, "For you" says "I can't tell what fits you yet".
3. **Do not ask the founder anything yet** (one-line status notes are fine), never change the host's settings or permissions, and never seed a search or a worker with names or claims from memory — only what a source gave you.

## Steps

1. **Find the field before choosing rivals.** News for our brand and the category first (last 90 days), then the category's money searches (`atoms/category-pass/ATOM.md` §1–2: "best <category>", "<brand> alternatives", "<category> tools", AI answers). Choose 3–6 main rivals from that evidence plus the roster and suggestions — the ones buyers compare us with now, not the best-known names — and 2–4 adjacent options. Anything from the last 30 days is a candidate **timely opening**.

2. **Brief the workers.** Read each brief yourself and paste its full text into the worker's instructions, with `brand_id`, our product summary, approved claims, the off-limits list and the category's communities — never a summary of it. One subagent per main rival with `atoms/rival-pass/ATOM.md`, one with the rest of `atoms/category-pass/ATOM.md`, and one with rival-pass §1–10 on our own brand. A cheaper model is fine for this reading work. Workers use web search, page fetch and the free server reads, and return everything — profile, couldn't-read list, and the pages that need the browser. Keep each return as it arrives. Edge cases — no browser, a stalled or stopped worker, facts from earlier research, a bad rival on the list, a report already saved today, a late read — follow `atoms/edge-cases/ATOM.md`.

3. **Open the browser-only sources yourself, before the report.** Workers often can't. For every main rival and for us: the Meta, LinkedIn, Google and TikTok ad libraries, searched by the advertiser's page or name (not the domain), plus the pages workers listed (X and LinkedIn posts, script-only pricing pages, review pages that block fetch). Tell the founder once, in one line, what you're opening and that the browser may ask them to allow each site. If a step waits on their approval, say so and move on — never sit silent.

4. **Go deep on what moved.** For the 1–2 biggest launches, watch the demo and the 3 best third-party posts (rival-pass §5) and break each into hook, setup, reveal, proof, CTA; write a **format brief** per demo and, where we do it better and can prove it, the **counter-position kit** (`references/angles-and-gaps.md` "Launches"). For each timely opening, draft the move (spec §4) with an end date.

5. **Write the story.** Merge everything; build You vs them (ahead — say it louder; behind; where everyone sounds the same), "what changed since last time" (each saved snapshot), 3–5 ranked moves, the swipe file and the angles (`references/angles-and-gaps.md`). A new entrant hitting us harder than a main rival gets a short rival pass (§1, §2, §6, §7, §15) now. Every finding closes with **For you**, as a plain sentence (`references/report-format.md`). Check every number, date, quote and "no ads found" against what a worker or the browser returned; drop what you can't trace.

6. **Deliver it.** Through `../../atoms/write-report/ATOM.md` in the shape of `references/report-format.md`: local file `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-competitor-research.md` with a clickable link and an offer to open it (an artifact in hosted chat), and the brand copy `research/competitors/<YYYY-MM-DD>-report.md` through `../../atoms/save-to-brain/ATOM.md` (`keep-history`) with its link (`gooseworks:file_url`). Also save each rival record, `landscape.md`, `angle-bank.md` (`supersede`), and swipe items to the inspiration library (`gooseworks:social_inspiration_save`).

7. **One message: the draft and the decisions** (write-report §2 — three lines of summary, then at most five numbered decisions): the one thing to do first and the link; which openings to act on · the rivals covered (add or drop any?) · sign-off for the claims the top moves need · a paid top-up only for what free reads and the browser couldn't get, named, with the estimate and one yes to "up to N credits" (`../../atoms/spend-gate/ATOM.md` branch B; with no price history the founder names N) · **a repeat, only if it would help this brand** — judge it (rivals shipping, raising or advertising actively: yes, weekly or monthly; a quiet field: monthly at most, or none) and, if yes, give the reason and the cadence; each repeat is a new report that opens with what changed (`references/watch-and-react.md`, created paused). Optional, one line each: tracking the new rivals (`gooseworks:competitor_save`), a research inbox for their newsletters, keeping the top angles as rules (`../../atoms/save-learning/ATOM.md`, on the founder's words).

8. **Watch and react** (`references/watch-and-react.md`, same dimensions). **What changed** (on ask, or the scheduled repeat): diff each snapshot; a new report through write-report. **React now** ("X just launched / shut down"): verify, read the market's reaction, alert this turn with the window, the move and a draft brief.

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

- No question before the report (beyond picking a brand); rivals were chosen from category evidence; news covered every rival and our brand; every ad library was searched for every main rival and us — in the browser where workers couldn't, or the report says once which couldn't be opened and why — and every rival has a same-shape profile.
- The report passes write-report §3 (the top five lines say what to do and why; plain words; no ids, paths, tool names or jargon; the link opens), leads with timely openings, has "You vs them", and closes every finding with a plain "For you" (unless facts-only).
- It was saved to the brand and opens locally; the closing message held only decisions, and a repeat was offered only with a reason it would help.

## Out of scope

Making the ads (make-static-ads, make-video-ads) · budgets and channel bets (plan-campaign) · what people say about our brand and the market (research-market) · our own search visibility (improve-search-visibility) · writing positioning (write-my-positioning, backlog).
