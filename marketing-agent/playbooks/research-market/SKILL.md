---
name: research-market
description: >-
  Use when a founder or marketer asks "who actually buys this, and what do they say in their own words?", "who is my customer", "research my audience", "who should we target", "build me a persona", "mine our reviews", "voice of customer", "why do people buy / not buy", "what words do customers use", "is my category growing", or says the messaging feels stale. Delivers a sourced voice-of-customer bank (verbatim, linked, tagged quotes), 2–4 ranked buyer segments with the primary segment, its job and what to lead with, an anti-persona, the competitors and alternatives buyers name, and an honest demand read — as a readable report, each finding ending in what it means for you, saved to the brand for ads, content, social and planning. Researches first and asks only decisions at the end. Never contacts customers; thin evidence gets an interview kit, not invention. Not for a list of businesses or people to pitch — use research-audience; not for what rivals run — use research-competitors.
---

# research-market

Who buys, why, what stops them, the exact words they use — and which buyer to lead with. Built only from evidence a reviewer can click. The craft is in `references/`; this file is the order of work.

**The rule that matters most: free pass first, ask nothing, report once** (AGENTS §8 research pattern). Before the first message to the founder, read every free source where buyers talk and build the bank, the segments and the report. Never ask the founder to copy reviews you can read yourself, and never end at "cold start" without having read what is public. A broad ask gets everything; an ask that names an area (their words · segments · alternatives and switching · demand) gets that area covered completely — and news on the brand and category always runs first.

## Before you start

1. **Connection and brand.** No GooseWorks tools listed (after one `gooseworks:tools_load`) → say only: "Connect GooseWorks first — I research your buyers and save what I find through it." First call of the conversation: `gooseworks:get_started` with the marketer's words (`wants: "more"`); send `client` on every call that takes it. Pick the brand (list and ask if several — the one question allowed before research); keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read the brain.** `gooseworks:brand_read` (`summary`, `kit`, `products`, `competitors`, `learnings`, `sources`, `organic`, `accounts`); `gooseworks:knowledge_search` (`source_types: ["evidence", "document"]`) for customer evidence and earlier research; `gooseworks:competitor_read` (+ `suggestions`); workspace (`gooseworks:file_list`, `file_read`): `research/market/` (a previous bank means a refresh — extend it), `research/competitors/` (rival records, reviews already read), `social/listening/*-report.md` (`VoC` quotes newer than the bank), `research/credits-log/`. Claims: only the read step of `../../atoms/claims-gate/ATOM.md` now; its sign-off waits for step 9. The founder's stated belief about the buyer comes from the brand's audience field — quote it at the top of the report, or "no stated belief on record".
3. **Do not message the founder yet.** Rivals come from the roster, suggestions and the free pass; private material is asked for in step 9, only for what the free pass could not reach.

## Steps

1. **Frame.** Company type, products in scope, markets (brain and the brand's own site), first run or refresh, and the question in the founder's words. Pick the source plan for the type (`references/sources-by-company-type.md`). With an empty brand brain, read the brand's website first; if it still can't be told what the brand sells, say so in the report and offer to learn the brand first.

2. **News first.** Web-search the last 90 days for the brand and the category — launches, new segments, pricing changes, funding, an acquisition, a rival's exit. New buyers often arrive with the news; it also tells you which reviews are stale.

3. **Read where buyers talk — the free pass.** Load `references/mining-method.md`. Three corpora — own customers, the 3–5 closest rivals' customers, the category — from the sources for this company type (`references/sources-by-company-type.md`): review sites read page by page in the host browser the way a person would (sorted by lowest and newest, no bulk scraping, never logging in), community threads and comments found by web search and read in the browser, the brand's own case studies (labelled curated). One worker per corpus where the host has subagents. Batches of 20–25 per source, stratified by rating, to saturation; verbatim rows with links and tags written to `research/market/voc-bank.jsonl` after every batch; count everything read. What the free pass can't reach goes on the "couldn't read" list with what it would add. Never pause for paid reads — they are offered in step 9.

4. **Theme, name alternatives, check the floor.** Themes `T-NN` (established at 3+ quotes from 3+ authors; signal below), product defects to a separate list, and every alternative buyers name, typed, with switching direction and quoted prices. Cold start only if, after the full free pass, fewer than ~30 first-hand items speak about the brand's own buyers (what counts: `references/recognition-and-interviews.md` § The evidence floor): rival and category rows become "category context — not your buyers", segments are provisional (no audience proposal), and "Do this first" is the interview kit, starting with the provisional segment. Re-open ~10% of kept links (at least 5) to check the quote verbatim.

5. **Build and rank segments.** 2–4 segments and an anti-persona from this run's themes — every trait traced to `T-`/`V-` ids or "unknown". Score evidence share, pain intensity, willingness-to-pay signal, reachability, product fit; name the **primary segment**, its job and each segment's message implication (`references/output-formats.md` § personas.md). B2B: role × company size, with the buying committee.

6. **Read demand honestly.** `references/mining-method.md` § Demand: labelled proxies (review and post dates, search phrasings and suggestions, Google Trends where the browser can open it) and category priors marked "known pattern, not measured"; otherwise "unknown".

7. **For you, and You vs them.** Every finding closes with **For you**: does it fit us, and why, from our facts; if yes, what to make — format, hook, product, the approved claim behind it (or "needs your sign-off", or "you'd need proof of X first") — and who makes it. **You vs them**: what buyers praise and complain about in us versus each named alternative — ahead (say it louder), behind, where everyone sounds the same. Weigh what buyers say over what rivals do. Facts-only asks (an investor update, a board slide, a market map) skip both. Shapes in `references/output-formats.md`.

8. **Deliver the report.** Write it to `research/market/<YYYY-MM-DD>-read.md` (`references/output-formats.md` § the read). In a host with files, also write it locally and offer to open it; in a hosted chat, an artifact or document if the host can, else the full report in chat. Save through `../../atoms/save-to-brain/ATOM.md`: the read (`keep-history`), `voc-bank.md`, `personas.md`, `demand.md` (`supersede`), `voc-bank.jsonl` (`import: no`). Propose the ranked-segment summary to `knowledge.audience` with `gooseworks:brand_update` as an `agent_proposal` (≤ 2,000 characters, rationale citing the bank; skipped in a cold start without own segments).

9. **One message: the draft and the decisions.** Three lines — the primary segment and its job, the top "For you", the link — then the decisions, at most five numbered, the rest one line each as optional:
   - the recognition check: is this your buyer? what didn't you know? which quote would you put in an ad tomorrow? (answers recorded verbatim; one revision);
   - private material that would change the answer, named specifically (support tickets, survey or cancel reasons, call notes, win/loss) — never reviews the free pass could read;
   - sign-off for the claims the top "For you" lines need (claims-gate scoped sign-off);
   - a paid top-up if gaps remain — name them; one yes to "up to N credits" (`../../atoms/spend-gate/ATOM.md` branch B: with no price history the founder names N, and nothing paid runs before the report);
   - rivals buyers named to track (`gooseworks:competitor_save` on a yes);
   - which area to go deeper on, if any;
   - keeping rules (the primary segment's lead message, the top objection, buyer words) through `../../atoms/save-learning/ATOM.md`, on the founder's words, prefixed `[market YYYY-MM-DD]`;
   - a refresh cadence (quarterly is normal), and a paused review-source refresh where the brand has a coworker and a confirmed source (spend-gate branch C).
   Never ask a fact the free pass could find.

## Approval gates

- The free pass needs no yes; a paid top-up needs one yes to a ceiling.
- The audience summary is a proposal the owner accepts; rules only on the founder's own words; rivals tracked only on a yes; schedules created paused.
- Research recommends; it never makes the asset. Never contact a customer, reviewer or community; the interview and survey kit is handed to the human. A quote is buyer language, never a claim.

## Output and write-back

| Artifact | Where it lives | Who reads it next |
|---|---|---|
| The read (the report) | `research/market/<YYYY-MM-DD>-read.md` + document (keep-history) | the founder; plan-campaign (primary segment); the next refresh |
| Segments + anti-persona | `research/market/personas.md` + document (supersede); summary proposed to `knowledge.audience` | plan-campaign, work-with-creators, make-content, run-organic-social |
| Voice-of-customer bank | `research/market/voc-bank.md` + document (supersede); `voc-bank.jsonl` (not imported) | make-static-ads, make-video-ads, make-content, run-organic-social, research-competitors, plan-campaign |
| Demand read | `research/market/demand.md` + document (supersede) | plan-campaign |
| Rivals named by buyers | the read; roster entries on a yes | research-competitors, listen-social |
| Rules | `[market …]` learnings, on the founder's words | ad and content generation |

## Done when

- No question was asked before the report (beyond picking the brand); news ran first; review sites, communities and comments were read for own customers, rivals' customers and the category, with n read per source and a couldn't-read list.
- The report opens with "Do this first, because…" naming the primary segment, its job and what to lead with; segments carry score evidence and message implications; every finding ends with "For you" and the report has "You vs them" (unless facts-only).
- At least 20 kept quotes (normally 30–60), verbatim, linked and dated; themes counted; every trait cites ids or says unknown; the demand read labels every line.
- It arrived as a document and was saved; the closing message held only decisions.
- Or: after the full free pass the floor was not met — the report says "Cold start", shows what was read, and hands over the kit.

## Out of scope

What rivals run, price and post (research-competitors) · this week's mentions and replies (listen-social) · writing positioning (write-my-positioning, backlog) · contacting customers · channels and budgets (plan-campaign) · prospect lists (research-audience).
