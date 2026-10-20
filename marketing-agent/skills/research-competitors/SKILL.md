---
name: research-competitors
description: >-
  Competitor research: what every main rival is running, launching, charging and saying now, what
  works for them, and what that means for you. Use when the marketer asks for competitor research or a
  teardown, "what ads are my competitors running", "how do they price", "find gaps and angles", "what
  changed this week" (a weekly watch), or "X just launched / shut down / cut prices" (react now).
  Delivers a readable report saved to the brand, so the next run reports what changed. Never copies
  their words or disparages them. Not for what people say about you or your market — use
  research-market; not for who your buyers are — use research-audience.
version: 0.4.1
---

# research-competitors

Competitor research tells the marketer what to do next; it is not a list of ads. Craft: `references/research-spec.md`; worker briefs: its step skills (`research-competitors-<step>`); the report: `references/report-format.md` — next to this file.

**The rule that matters most: free pass first, ask nothing, report once** (`../marketing-guide/research-pattern.md` (in the `marketing-guide` skill) — read it before the first search). Research every dimension for every main rival, browser-only sources included, before the first message; never ask permission for free work or offer to pay for what a free read could get. An ask that names an area ("what ads are they running?") gets that area covered completely, news and launches first.

## Before you start

1. **Setup first:** do the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2 (connect, brand, brain read) before anything else; the job line is "I research your competitors and save what I find through it." Here: a named brand not in the account → create it from its website (`gooseworks:brand_setup`) without asking and wait for its research (`gooseworks:job_get`); don't show a menu unrelated to research. Fallback brand read: `gooseworks:brand_read` (`summary`, `kit`, `products`, `competitors`, `organic`, `learnings`). Either path: `gooseworks:competitor_read` (+ `suggestions`), `gooseworks:automation_list`; workspace: `research/competitors/` (last report, rival records), `research/market/` (the newest market report and its "which market" decision), `research/audience/` (`buyer-groups.md` and the latest audience report), `plans/`, `reports/performance/`. Brand facts: brain first, website second. Claims: only the read step of the `claims-gate` skill (`../claims-gate/SKILL.md`) now.
2. **Run memory:** job `competitor research` or `competitor watch`; what this job hands the atom is in `references/run-memory.md`. Its "since last time" opens the chat and the report's story.
3. Never change the host's settings or permissions, and never seed a search or a worker with names or claims from memory — only what a source gave you.

## Steps

1. **Find the field yourself, before any worker starts.** About 6–10 searches by the main run: news for our brand and the category (last 90 days), then "best <category>", "<brand> alternatives", "<the strongest saved rival> alternatives", "<category> tools", and one AI answer. The saved roster is a starting list, never the answer. State the **frame of reference** in one line — the category we compete in (research-market's decision when it exists) and the other frames we could claim (e.g. "AI ad-creative tool" vs "AI agents for go-to-market teams"), because the frame decides which rivals matter. Then choose 3–6 main rivals — the ones buyers compare us with now, each with its reason — and 2–4 adjacent options (doing it yourself, an agency, the platforms' own tools). **If the frame or the main rivals differ from the last run's, say so in one line with the reason** ("Last run compared us with Jasper and Copy.ai; this run with Creatify, because…") — the frame never swings silently. A name you'd only watch goes in the brief competition line, not as a main rival. Anything from the last 30 days is a candidate **timely opening**.

2. **Brief the workers — lean.** Exactly one subagent per main rival with the `research-competitors-rival-pass` skill (`../research-competitors-rival-pass/SKILL.md`) (**a new entrant you'd call closest to our buyer, or hitting us harder than a main rival, counts as a main rival** — it gets its own worker, never just a name), one with the `research-competitors-category-pass` skill (`../research-competitors-category-pass/SKILL.md`), one with rival-pass on our own brand — no more, no workflow on top. Paste the short brief's full text with `brand_id`, our product summary, approved claims, the frame, a typical-buyer scenario for pricing ("a 10-person team making 40 ads a month"), the off-limits list and today's date; workers don't load skills or start their own subagents. Standard depth is the brief's cap (about 12 searches and 12 fetches each); a deep teardown — quarterly, or when the marketer asks — doubles it. A cheaper model is fine. Workers use web search, page fetch and the free server reads, and return everything, including the pages that need the browser. Edge cases — no browser, a stalled or stopped worker, facts from earlier research, a bad rival on the list, a report already saved today, a late read — follow the `research-competitors-edge-cases` skill (`../research-competitors-edge-cases/SKILL.md`).

3. **Open the browser-only sources yourself, before the report.** Workers often can't. For every main rival and for us: the Meta, LinkedIn, Google and TikTok ad libraries, searched by the advertiser's page or name (not the domain), plus the pages workers listed (X and LinkedIn posts, script-only pricing pages, review pages that block fetch). Tell the marketer once, in one line, first.

4. **Go deep on what moved.** For the 1–2 biggest launches, watch the demo and the 3 best third-party posts (`references/rival-craft.md` §5) and break each into hook, setup, reveal, proof, CTA; write a **format brief** per demo. Counter-position only if the **leverage test** passes — we are the challenger here, we genuinely do the same job better, we have dated proof, and our answer can reach enough of the rival's buyers to matter; then draft the **counter-position kit** (`references/angles-and-gaps.md` "Launches"). Otherwise it goes under "What we're not doing": not every launch needs an answer. For each timely opening, draft the move (spec §4) with an end date.

5. **Write the story** in the shape of `references/report-format.md`, formats and angles from `references/angles-and-gaps.md`. A new entrant that surfaces only now (from the category pass) and is closest to our buyer gets a short rival pass before the report (the `research-competitors-rival-pass` skill (`../research-competitors-rival-pass/SKILL.md`) items 1, 4, 5, 6, 7) — never a profile-less "closest rival". Check every number, date, quote and "no ads found" against what a worker or the browser returned; drop what you can't trace.

6. **Check, then deliver.** Run the check in `references/report-format.md`, then deliver through the `write-report` skill (`../write-report/SKILL.md`) (topic `competitor-research`; brand copy `research/competitors/<YYYY-MM-DD>-report.md`, `keep-history`). Also save, in the shapes in `references/report-format.md`, each rival record, `landscape.md` and `angle-bank.md` (`supersede`) through the `save-to-brain` skill (`../save-to-brain/SKILL.md`), and swipe items to the inspiration library (`gooseworks:social_inspiration_save`).

7. **Save the run — before the closing message.** The End steps of the `run-memory` skill (`../run-memory/SKILL.md`), with the numbers and recommendations in `references/run-memory.md`. When the marketer answers a decision afterwards, re-save the same day's record with it (`references/run-memory.md`).

8. **One message: the draft and the decisions,** in the closing-message shape in `references/report-format.md`, with the one-line "saved this run's notes" folded in (at most five one-line decisions): the one thing to do first and the link; which openings to act on · the rivals covered (add or drop any?) · sign-off for the claims the top moves need · a paid top-up only for what free reads and the browser couldn't get, named, with the estimate and one yes to "up to N credits" (the `spend-gate` skill (`../spend-gate/SKILL.md`) branch B) · **a repeat, only if it would help this brand** (marketing-guide §3 **Schedules**; a quiet field: quarterly, or none), saying that scheduled runs have no browser, so ad libraries are read only in runs you start (`references/watch-and-react.md`). Optional, one line each: tracking new rivals (`gooseworks:competitor_save`), keeping the top angles as rules (the `save-learning` skill, `../save-learning/SKILL.md`).

9. **Watch and react** (`references/watch-and-react.md`, same dimensions). **What changed** (on ask, or the scheduled repeat): opens with what changed against the stored numbers and each rival's snapshot; a report only when something crosses a threshold, a run record every time. **React now** ("X just launched / shut down"): verify, read the market's reaction, alert this turn with the window, the move and a draft brief.

## Approval gates

- The free pass needs no yes and asks nothing; a paid top-up needs one yes to a ceiling; schedules are created paused.
- Only with the marketer's yes: newsletter or trial sign-ups, tracking a rival, saved rules, new claims.
- Research recommends; it never makes the asset. Never publish, contact anyone, copy a rival's words or footage, mock a rival or its customers, or claim their spend or results. Named comparisons need sign-off and dated proof.

## Output and write-back

Paths and readers: the research-competitors rows of the marketing-guide's §4 table. Each file's title, tags and save mode: `references/report-format.md`; what-changed reports: `references/watch-and-react.md`.

## Done when

- No question before the report, beyond picking a brand.
- The frame of reference is stated; rivals were chosen from category evidence; a change of frame or rivals since the last run is stated with its reason.
- News covered every rival and our brand.
- Every ad library was searched for every main rival and us — in the browser where workers couldn't, or the report says once which couldn't be opened and why.
- Every rival has a same-shape profile, with a praise and a complaint — including any rival the report calls closest to our buyer.
- The report passes write-report §3 and the report-format check; its first move is not table stakes; it has the baselines table, leads with timely openings, counter-positions only where the leverage test passed, states disagreements with sibling reports, and ends with what it means for positioning.
- It was saved to the brand and opens locally.
- The run record was saved before the closing message, with this run's moves as recommendations and the last run's outcomes.
- The closing message held only decisions, and a repeat was offered only with a reason it would help.

## Out of scope

Making the ads (make-static-ads; video ads: the goose-video skill) · budgets and channel bets (plan-campaign) · what people say about our brand and the market (research-market) · our own search visibility (improve-search-visibility) · writing positioning (write-my-positioning, backlog).
