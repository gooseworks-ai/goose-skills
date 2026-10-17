---
name: research-competitors
description: >-
  Use when a founder or marketer asks "what are my competitors running right now, and what works for them?", "competitor teardown", "what's new with my competitors", "what ads are they running", "how do they price", "what are their founders posting", "find gaps and angles", "what changed this week", or "X just launched / shut down / cut prices". Researches every main rival on every dimension — news first, then ads on every platform, founder and company posts, launches and demo videos, pricing, positioning, reviews, community talk, hiring, partnerships, events, AI answers — and delivers a readable report: "Do this first", time-boxed openings, the landscape, same-shape rival profiles, a swipe file of formats, angles and watch triggers. Saved so the next run reports what changed. Weekly watch and react modes. Never copies their words or disparages. Not for what customers say about you — use listen-social; not for who your buyers are — use research-market.
---

# research-competitors

Competitor research tells the founder what to do next; it is not a list of ads. The craft is in `references/research-spec.md` — read it first. This file is the order of work; the report's shape is `references/report-format.md`.

**The rule that matters most: free pass first, ask nothing, report once** (AGENTS §8 research pattern). Research every dimension for every main rival before the first message to the founder. Never stop after one source to ask "go deeper?" or whether to continue — depth is part of the request. A broad ask gets everything; an ask that names an area ("what ads are they running?") gets that area covered completely for every rival — and news and launches always run first, because a rival's shutdown or launch outranks anything in the ads.

## Before you start

1. **Connection and brand.** No GooseWorks tools listed (after one `gooseworks:tools_load`) → say only: "Connect GooseWorks first — I research your competitors and save what I find through it." First call of the conversation: `gooseworks:get_started` with the marketer's words (`wants: "more"`); send `client` on every call that takes it. Pick the brand (list and ask if several); keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read the brain.** `gooseworks:brand_read` (`summary`, `kit`, `products`, `competitors`, `organic`, `learnings`), `gooseworks:competitor_read` (+ `suggestions`), `gooseworks:automation_list`; workspace (`gooseworks:file_list`, `file_read`): `research/competitors/` (last report, rival records), `research/market/voc-bank.md` and `personas.md`, `reports/performance/`. Claims: only the read step of `../../atoms/claims-gate/ATOM.md` now — its scoped sign-off waits for step 7. Off-limits rules (a partner rival, "never name them") come from the brain's `dont` and `must` facts.
3. **Do not message the founder yet.** Use the brain's rival list; with none, build it from the roster, suggestions and a news search. The founder corrects it in step 7. The only reason to stop first is that no rival can be found at all. If the last report is under 30 days old and the ask is broad, run the weekly watch instead and say so — unless news shows a big move.

## Steps

1. **Frame.** Name the company type and weight the dimensions by it (spec §5) and the jobs this run serves (§2) — or facts-only. List 3–6 main rivals, 2–4 adjacent options (spreadsheet, agency, DIY) and any new entrant, each with a reason and source (roster, suggestions, research-market, news search — never memory alone).

2. **News first — rivals and our own brand.** A headline sweep for every rival (last 90 days) and the full news read for our brand (queries in `atoms/rival-pass/ATOM.md` §1); the rival workers do each rival's full read. Anything from the last 30 days is a candidate **timely opening** and leads the report. Our own news stops us "discovering" the founder's own deal.

3. **Research every rival in parallel.** One worker per main rival — a subagent where the host supports it — briefed with `atoms/rival-pass/ATOM.md` plus our product summary and approved claims, the off-limits list and the category's communities: news, every ad library (LinkedIn and Google included, free in the browser), organic and founder posts, launches and demo videos, pricing with changes, positioning, funnel and email, customers, 30+ reviews read page by page like a person, community talk, events, partnerships, hiring, search, and what it couldn't read. One more worker runs `atoms/category-pass/ATOM.md` (money searches, AI answers, community, creator demos, category ad winners, adjacent options), and one runs rival-pass §1–10 on **our own brand** — our ads in the same libraries, recent posts, product and pricing — so every finding can be held against our side. Without subagents, go rival by rival and write each finished profile to `research/competitors/<slug>.md` as a draft before the next; work from the files in step 5. Never pause for paid reads — they are offered in step 7.

4. **Go deep on what moved.** For the 1–2 biggest launches, watch the demo and the 3 best third-party posts (rival-pass §5 says how) and break each into hook, setup, reveal, proof, CTA. Then write a **format brief** per demo and, where we already do it better and can prove it, the **counter-position kit** (both in `references/angles-and-gaps.md` "Launches"). For each timely opening, draft the move (spec §4) with an end date.

5. **Synthesize.** Merge the profiles; build the landscape, **You vs them** (ahead — say it louder; behind; where everyone sounds the same), "what changed since last run" (diff each saved snapshot), 3–5 ranked moves, the swipe file and the angle list. Angles come out of the research — complaints, gaps, worn-out phrases, launches we beat (`references/angles-and-gaps.md`). If the category pass shows a new entrant hitting us harder than a main rival, run a short rival pass on it (§1, §2, §6, §7, §15) before the report and say so. Every finding closes with **For you** — fits us or not, from our facts; if yes, what to make, the approved claim behind it, and who makes it — by the rules in `references/report-format.md` (no proof, no claim; lines awaiting sign-off marked so; don't follow the herd; facts-only and empty-brain cases). Named comparisons are flagged.

6. **Deliver the document.** Write it to `research/competitors/<YYYY-MM-DD>-report.md`. In a host with files (Claude Code, Cursor), also write it locally and offer to open it; in a hosted chat, an artifact or document if the host can, else the full report in chat. Save through `../../atoms/save-to-brain/ATOM.md` with the titles and tags in report-format: the report (`keep-history`), each rival record with its snapshot, `landscape.md`, `angle-bank.md` (`supersede`); swipe items to the inspiration library (`gooseworks:social_inspiration_save`). Link the saved report (`gooseworks:file_url`).

7. **One message: the draft and the decisions.** Three lines — the biggest finding, the top move, the link — then only what is left to decide: which openings to act on; the rivals covered ("add or drop any?" — new ones tracked with `gooseworks:competitor_save` on a yes); sign-off for the claims the top moves need (claims-gate scoped sign-off); a paid top-up if gaps remain — name the gaps it fills, give the estimate, one yes to "up to N credits" (`../../atoms/spend-gate/ATOM.md` branch B, the probe inside it); a research inbox for rivals' newsletters and trials; which area to go deeper on next, if any (ads and creative · social, content and founder posts · news, launches, funding and hiring · pricing, positioning, reviews and buyer talk); the weekly watch; keeping the top angles as rules (`../../atoms/save-learning/ATOM.md`, on the founder's words). Never ask a fact the free pass could find.

8. **Watch and react** (`references/watch-and-react.md`, same dimensions). **Weekly watch** ("what changed this week?", or scheduled on a yes — created paused): diff each snapshot; a one-page note. **React now** ("X just launched / shut down"): verify, read the market's reaction, alert this turn with the window, move and draft brief.

## Approval gates

- The free pass needs no yes and asks nothing; a paid top-up needs one yes to a ceiling.
- Only with the founder's yes: newsletter or trial sign-ups (research inbox, company details), tracking a rival, a schedule, saved rules, new claims.
- Research recommends; it never makes the asset — making is the ad, video and content playbooks' job.
- Never: publish, contact anyone, copy a rival's words or footage, mock a rival or its customers, or claim their spend or results. Named comparisons need sign-off and dated proof.

## Output and write-back

| Artifact | Where (save mode) | Read by |
|---|---|---|
| Report | `research/competitors/<D>-report.md` (keep-history) | the founder, the next run |
| Rival records + snapshots | `research/competitors/<slug>.md` (supersede) | the watch, plan-campaign, make-content |
| Landscape | `research/competitors/landscape.md` (supersede) | plan-campaign |
| Angle bank (`A-NN`, tag `angle:a-nn`) | `research/competitors/angle-bank.md` (supersede) | make-static-ads, make-video-ads, plan-campaign |
| Swipe items | inspiration library | the ad and content makers |
| Watch notes | `research/competitors/watch/<D>.md` (keep-history; line 2 `Week of …`) | the founder, analyze-performance |

## Done when

Every box in `references/research-spec.md` §6 "What done looks like" is ticked (or the couldn't-read list says why); news covered every rival and our own brand; every rival has a same-shape profile; the report opens with "Do this first", leads with timely openings, has "You vs them", closes every finding with "For you" (unless facts-only), and arrives as a document — with no question asked before it.

## Out of scope

Making the ads (make-static-ads, make-video-ads) · budgets and channel bets (plan-campaign) · what customers say about our brand (listen-social) · our own search visibility (improve-search-visibility) · writing positioning (write-my-positioning, backlog).
