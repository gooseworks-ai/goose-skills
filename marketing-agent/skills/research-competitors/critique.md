# Critique log — research-competitors

## Round 1 — scope + depth, before writing (subagent, effort high, 2026-10-16)

Inputs: spec 04, page 00 (§3–4, pillars 1, 4, 6, parts 3–4), page 01 (pillars 1, 6, 15), source-map greps, the staging server contract, reader specs 03/07/08/09/12/14.

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | "Spends no money" is wrong: proxy calls, Google transparency import, mentions and every watch automation run cost credits (MAJOR) | Free-first ladder; any paid row through `atoms/paid-pull`; watch opt-in states per-run cost. Spec's "no approval gates except the watch" overridden for spend; logged here. |
| 2 | Step 2 rebuilds what the server has (dossiers, Meta ads with start dates) (MAJOR) | Steps 2–3 read and free-refresh server research first; effort goes to pages, pricing, funnel, other libraries. |
| 3 | Wrong-page risk: suggestions carry CONFIRMED/UNSURE Meta page verdicts (MAJOR) | Step 1 plays back each rival's Meta page and the server's verdict before `competitor_save`; "never name/copy" question asked. |
| 4 | No web-fetch path; hosted chats cannot read pages (MAJOR) | Every section carries a status read / read-by-browser / from server research / not read; never filled from the dossier summary or memory (teardown-checklist). Server need #4. |
| 5 | "Long-running = works" overclaimed (MAJOR) | Inference rules with discounts; iteration clusters as the strongest signal; spend/ROAS/CTR claims banned; every "works" line labelled inference + confidence (reading-ads-honestly.md). |
| 6 | Angle bank has no schema; downstream cannot link angles to results (MAJOR) | Required fields with stable `A-NN` ids, claim mapping, status, test status updated by analyze-performance (angles-and-gaps.md). |
| 7 | Write-back shape unspecified (MAJOR) | Roster via `competitor_save`; workspace files + knowledge documents; ≤3 top angles as `insight` facts after the human sees them; rival ads stay in the server's competitor template pool. Server needs #5, #6. |
| 8 | Missing teardown elements: offer architecture, funnel, testing velocity, format mix, creator ads, vs pages, brand bidding, review weaknesses (from VoC, not re-mined), do-nothing row, hiring/funding (MAJOR) | All in teardown-checklist sections and SKILL steps 3–11. |
| 9 | No company-type branches (MAJOR) | Branch table (DTC, B2B SaaS, app, marketplace, local, services, pre-revenue) in teardown-checklist. |
| 10 | Reactive mode missing (MAJOR) | React mode: verify, refresh, diff, options incl. do nothing, routed owners, no reflex price-matching (watch-and-react § React). |
| 11 | "Every ad live today" is unstable (MAJOR) | "Active as of <date>", date ≤7 days old; active = `ad_ended_at` equals last scrape date; dead links marked ended. Done-when reworded accordingly. Server need #2. |
| 12 | Search/AI footprint has no tool and overlaps improve-search-visibility (MINOR) | Step 10 reads that playbook's report when it exists; otherwise optional paid search or "not read". |
| 13 | Social: read `organic` before paying (MINOR) | Step 8. |
| 14 | Comparative and trademark guardrails (MINOR) | Angle guardrails field; Approval gates. |
| 15 | Gaps need a method (MINOR) | Reasons-to-buy × rivals matrix with buyer weight; gap / unvalidated / contested / table stakes (angles-and-gaps.md). |
| 16 | Cap output: 3–5 deep (MINOR) | Step 1. |
| 17 | Weekly digest: thresholds, one screen, diff vs snapshot, free refresh default (DEPTH) | watch-and-react.md thresholds, snapshot block, digest format; standing automation only on a yes. |

Rejected / changed from the critic:
- Critic suggested brand learnings for angles "because ad generation reads facts not documents". **Kept but capped at 3** and only after the human has seen them, because facts steer every generation and a wrong angle there is costly.
- The spec's open item says the weekly digest waits for the recurring layer (P2). **Changed:** `automation_upsert` (agent mode, cron) exists on the server today, so the standing watch is offered now, opt-in, with its cost stated. The missing piece is a server-side credit ceiling (server need #7).

## Round 2 — adversarial run (3 brands × 3 modes) + contract check (subagents, effort high, 2026-10-16)

| # | Finding (severity, source) | Resolution |
|---|---|---|
| 1 | "Live today" unmet: 7-day scrape, "a few" spot-opens, hosted chat can't open links (MAJOR) | Free refresh of every deep rival on hand-over day; header states "ads active as of <scrape date> · links spot-checked n / not checked"; platform-funded Meta scrape and paid full read (status ACTIVE, country) named; Done-when reworded. |
| 2 | Inference rules dishonest about the server sample (MAJOR) | Scrape date = `last_researched_at`; active iff last-seen = scrape date; days running = last-seen − start; from the sample only "new concept seen" / "still seen"; stops, kills, counts, variant growth need a full-library read (reading-ads-honestly, watch thresholds). Server need #13. |
| 3 | No branch when research-market hasn't run (MAJOR) | Offer research-market first, or continue with every row "unvalidated" and the bank marked "no buyer evidence yet". |
| 4 | Hosted chat output hollow; Google advertiser id unknown; USD cap (MAJOR) | Ask once for pasted pricing/vs/G2 text and the Transparency page; sections marked not read up front; USD ceiling shown as the tool states it. Server need #16. |
| 5 | Endpoints undefined; "proxy search endpoint" (MAJOR) | `references/public-data.md` (vendor OpenAPI-checked paths and keys); Google results endpoint named; credits log shared. |
| 6 | Set discovery stalls for a pre-revenue brand; `unresolved`; shell unused (MAJOR) | Model-knowledge candidates labelled "unverified" with fewer than 3 candidates; ask for exactly what `unresolved` lists; `read-by-fetch` includes shell curl and Apple's public lookup. |
| 7 | Hooks clash with personal-attribute ad policy (MAJOR) | Guardrail in SKILL step 13, angles-and-gaps and reading-ads-honestly. |
| 8 | One angle cannot become a static-ad brief (MAJOR) | Angle row adds product, offer, reference ads, exact proof wording, slug. |
| 9 | Watch automation can't honestly execute (cap, unread fields, snapshot, angle bank, waiting, new rivals) (MAJOR) | Free sources only; method file saved to the workspace; "not re-read since" for offer/pages/reviews; snapshot rewrite + previous; angle saturation update; check status once; "new, no baseline"; cost unpriced until week one. |
| 10 | UNSURE Meta pages never acted on (MAJOR) | Ask for the library link or open it; no ads read until confirmed. |
| 11 | Angle bank location mismatched with readers; test-status loop unimplemented (MAJOR, contract #3–4) | NOTICE to plan-campaign and make-video-ads; slugs match make-static-ads' `angle:<slug>` tag; this playbook refreshes test status from analyze-performance's report and tagged creatives. |
| 12 | Claims not read per learn-my-brand's sign-off contract (MAJOR, contract #6) | Before you start reads the Claims sign-off learning → Brand record table; before sign-off, product facts only and angles "needs proof". |
| 13 | Standing watch reads less than the spec's watch (MAJOR, contract #8) | Digest line 2 lists "not re-read this run"; search row added to thresholds; logged here as a deliberate reduction (the standing run is free-only; offers/pages/reviews are re-read in chat runs). |
| 14 | Frontmatter invalid YAML (MAJOR, contract #1) | Folded block. |
| 15 | Minor: library country; carousel/partnership only when seen; first-run velocity; claims query; removal without a card; status polling; app/SaaS snapshot lines; react for untracked rivals, hosted verification, list vs promo, pre-revenue; competitor-research marker line on imports; get_started/client; video ads via media_list; brand-bidding wording; make-video-ads reads reference media not the file; needs list; parameter re-description trimmed | All applied. |

Rejected / changed:
- "Name `goose_run_task` as a priced page-reading fallback": not adopted — unverified whether the coworker can read pages, and it burns unpriced coworker credits.
- "The automation should never spend": adopted for the watch (its free sources cover ads, dossier and social).

## Round 3 — final adversarial + contract re-check (subagent, effort xhigh, 2026-10-16)

Verdict: not clean (5 MAJOR). All fixed:

| # | Finding (severity) | Resolution |
|---|---|---|
| 1 | Angle join key wrong: makers tag `angle:A-NN`, videos carry `A-NN`, analyze-performance cites `A-NN` — slug tags would always come back empty (MAJOR) | `A-NN` is the key everywhere (SKILL, angles-and-gaps, output-formats, meta); slug is a human label; learnings prefix `[angle A-NN <slug> …]`; NOTICE and conventions corrected. |
| 2 | Scrape date anchored on the dossier's `last_researched_at`, not the ad source's `last_scraped_at` (MAJOR) | Scrape date = the ad-library source's `last_scraped_at`, cross-checked with the latest `ad_ended_at`; re-read after a refresh; same rule in snapshot and automation prompt. |
| 3 | Free Meta re-import sold as a "fuller read" — it is the same capped sample (MAJOR) | Relabelled "re-import of the sample — never a full-library read"; full library = browser or paid read only. |
| 4 | Watch could report old ads newly entering the sample as "new concept seen" (MAJOR) | Snapshot stores ad ids per cluster; diff by id; "new concept" needs no prior ids + start after previous scrape + active; others are "newly sampled", never top three. |
| 5 | Claims marker and never-say list read from a lean learnings read (MAJOR) | Full learnings read (`detail: "full"`) plus `knowledge_search` learning "Claims sign-off"; claims = `must` learnings starting "Claims you may use" (updated learn-my-brand contract). |
| 6–13 | Minor: video-ad attribution; sample country; pagination; automation digest retirement tags and import wait; per-rival tags; digest line order with marker line; `knowledge_sync` in needs; test contradictions | Attribution by `metadata.ad_library.ad_library_source_id`, team-saved rows never active; "server sample, all countries"; page `next_cursor` until empty; tags `competitor-watch`, wait for ready, delete only the previous; tags `rival:<slug>`; marker line 1, `Week of` line 2; needs updated; tests aligned. |

## Round 4 — confirmation pass (subagent, effort xhigh, 2026-10-16)

Verdict: **clean** — the five round-3 MAJORs verified fixed (A-NN key everywhere; scrape date from the source's `last_scraped_at`, re-verified read-only on staging; re-import relabelled; id-based "new concept" rule consistent in reference, thresholds and prompt; full learnings read for claims). Adversarial check of the standing watch run by a server coworker: stays free-only, diff rules hold.

Minor findings, all applied: `execution_mode: "agent"` named in SKILL and reference; video-ad ids included in the automation's read and snapshot; digest retirement limited to last week's dated title; meta reads use the current claims contract wording; test freshness row names `brand_read` competitors → `last_scraped_at`; shared conventions note updated (`[angle A-NN <slug> …]`, `source_class`).

**Final state: clean at round 4 (xhigh); later listen-social rounds touched only the shared `atoms/paid-pull` recency wording and `references/public-data.md` paging rules, both verified byte-identical and consistent with this playbook in rounds 5–7.**

## Round 8 — fix pass from the 16 Oct cross-set review (2026-10-16)

| Source | Change |
|---|---|
| depth §4 | The full active ad library of the top 3 rivals is read by default (host browser, or one paid read per rival through the spend gate); a teardown on the server sample alone is labelled "partial — sample only" in the files and the hand-over. |
| contracts M16 | Rivals never come from model knowledge: only the roster, server suggestions, research-market's list, the founder's answer or one search through the spend gate, each labelled with its source. |
| contracts F5b | Angle tags lower-case (`angle:a-07`), queried lower-case, ids compared case-insensitively. |
| contracts F1 (chain) | Angle test status reads analyze-performance's `[learning … A-NN]` facts, now short enough to keep the id. |
| §8 "Do this first" | The hand-over, competitor files, landscape, angle bank and watch digest open with "Do this first, because…" (the digest keeps `Week of …` as line 2 for analyze-performance). |
| routing (no playbook names to the marketer) | "Run research-market first" becomes plain words ("I'd first find out what your buyers say"). |
| contracts F3-style claims | Claims through the claims-gate atom; without sign-off, its scoped sign-off is offered for the 3–5 proof lines the top angles need. |
| contracts M11 | Standing watch created paused, free sources only. |
| AGENTS §3/§5/§8 | Local `atoms/paid-pull` and `atoms/save-to-brain` copies deleted; the playbook loads the shared `atoms/save-to-brain/ATOM.md` and `atoms/spend-gate/ATOM.md` (this session owns both) and `atoms/save-learning`, `atoms/claims-gate` (learn-my-brand). `references/public-data.md` moved once to `atoms/spend-gate/proxy-endpoints.md`. Description rewritten in `>-` form under 1,024 characters with a "Not for … — use …" line. Connection sentence, `get_started`, `brands/<slug>/` no-coworker fallback and credits log `research/credits-log/<YYYY-MM>.md` per §8. |
| contracts F1/F2/M4 (learnings) | Learnings through save-learning: at most 3 rules per run, ≤300 characters, prefix per §8, only on the human's words, retiring this playbook's own earlier facts in the same call. |
| contracts M10/M11, routing U4/U5 (money) | Spend through the spend gate: one probe, a yes to a ceiling labelled an estimate, stop at it, log every charge; tool caps taken in dollars are described in words, never quoted; automations created paused and switched on only on a yes. |
| contracts M3 | "A lean read can miss the marker" removed — a lean `brand_read` returns every must/dont. |

Rejected / deferred:
- depth §4 MINOR "the 14-step teardown is heavy": kept — content, social and releases sections are short and feed the snapshot the watch diffs against; first runs may mark them light. Logged, not changed.

## Round 9 — adversarial + contract critique of the fix pass (subagent, effort high, 2026-10-16)

For this playbook 4 MAJOR, all fixed:
| # | Finding | Resolution |
|---|---|---|
| 2 (MAJOR) | The standing watch deleted last week's digest (a period artifact) and matched a title it never set | Digest titled `Competitor watch — <Brand> — <date>`, keep-history: only a same-day re-run's exact-title copy is replaced; other weeks never deleted. |
| 4 (MAJOR) | Every rival file shared one title, so retiring one rival's old copy could delete another's | Title `Competitor file: <Rival> — <Brand> — <date>`; save-to-brain now deletes only rows carrying every caller tag, incl. `rival:<slug>`. |
| 6 (MAJOR) | Digest "owner" and react options named playbooks to the marketer | Plain-word owners ("the campaign plan", "a new ad", "an email to customers", "a comparison page", "the founder"). |
| 7 (MAJOR) | Contracts-review item: method files drift from the live playbook (unlogged) | Method file and agent prompt carry `Method version: <version>, copied <date>`; re-copied whenever the run is changed or switched on. |
| 10, 12, 13, 15 (MINOR) | Watch without a coworker; no `automation_list` read; "— use"; default full read assumed Meta; stale marker reference and wrong marker text on the digest | Coworker check; automation runs shown at the top; "— use"; the top 3's main library for the company type (Meta for DTC/apps, LinkedIn/Google for B2B); marker lines defined in output-formats, digest marker "Weekly record; kept as history". |

## Round 10 — confirmation (subagent, effort high, 2026-10-16)

Verdict: **clean** (watch over three weeks walked: dated digests, no other week deleted, free-only). Minor: the react save now names its mode, title and tags (`supersede`, `Competitor file: <Rival> — <Brand> — <date>`, `rival:<slug>`).

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: skill.meta.json: removed "≤300 chars" from the learnings line (save-learning forbids shortening to fit today's server); shared atoms moved to `shared_atoms`.
2026-10-16 orchestrator ruling: bare `atoms/<shared>` path in server-needs.md converted to file-relative form.

## Round 11 — rebuild after the founder's hand test (2026-10-17)

**Why.** Sonnet 5.5 ran the 0.1 playbook for Juicebox (AI recruiting search; rivals Loxo, hireEZ, Findem, Eightfold, Fetcher). It read only the Meta ad libraries, then asked "go deeper or stop?"; read Google/LinkedIn ads and pricing only when pushed, social and news only when asked; found the biggest story (Fetcher shut down 16 Oct; Juicebox bought its assets) through one web search only when the founder asked about news; never read founder posts, launches and demos, funding, hiring, partnerships, events or buyer reviews; ended in a chat summary. Founder's verdict: "it does nothing… bare minimum". Cause: ~2,400 words of procedure and too little research craft — a literal model treated step 3 (ads) as the whole job.

**What changed (rewrite, not patch; version 0.2.0).**
- `references/research-spec.md` (the orchestrator's independent senior-marketer spec) is the craft reference: every dimension, the moves, guardrails, company-type weights, done checklist, document structure.
- SKILL.md rewritten as process only (~1,050 words incl. tables): the first rule is "do the whole job before reporting — never stop after one source to ask 'go deeper?'"; news first for every rival and our own brand; one worker per rival in parallel plus a category worker; the host's web search, fetch and browser used freely; paid reads an optional top-up; deep dive on the biggest launches (demo + third-party posts broken into beats; counter-position with proof, not naming by default); deliver a readable document and save it; ask only the decisions at the end.
- New local atoms: `atoms/rival-pass/ATOM.md` (the full per-rival brief — 15 dimensions with exact searches and depth, company-type weighting, fact/inferred/unknown, a fixed return shape incl. snapshot and couldn't-read) and `atoms/category-pass/ATOM.md` (money searches, AI answers, community, creator demos, category ad winners, our brand in the field).
- `references/report-format.md` replaces `output-formats.md`: the spec's document (Do this first table with why now / upside / effort / evidence / guardrail, timely openings, landscape with map, messaging, pricing and channel heatmap, same-shape profiles, swipe file with beat breakdowns, angles, triggers, sources and couldn't-read) plus record shapes.
- `references/watch-and-react.md` rebuilt on the same dimension list (diff thresholds per dimension; react-now alert with verification, market reaction, window, move and draft brief).
- `references/angles-and-gaps.md`: angles derived from the research (complaints, worn-out phrases, empty seats, launches we beat, founder claims, openings, proven formats); never drive the run.
- `teardown-checklist.md` and `output-formats.md` deleted (folded into the atoms and report format).
- New output path `research/competitors/<D>-report.md` (keep-history); guide §4 index row updated. Existing paths kept: rival records, landscape, angle bank (`A-NN`, `angle:a-nn`), watch notes (line 2 `Week of …`).
- Spec edit: the Juicebox / Fetcher specifics in `research-spec.md` were replaced with neutral examples, so (a) the Sonnet re-run cannot "find" the story by reading the playbook, and (b) runs for other brands never see a real brand's news as an example fact. Meaning unchanged.

### Folded in during the rebuild (2026-10-17)

- **AGENTS §8 "Research playbooks: the shared pattern"**: no question before the free pass (the old "ask once" step removed; rivals are confirmed in the closing message); one closing message with the draft and only the decisions; review sites read page by page in the host browser, no bulk scraping (rival-pass §10); a paid top-up is offered once, after the free pass.
- **spend-gate atom (owned here) → single yes**: branch B now asks one yes to a ceiling; with no price history the first call is the probe inside that ceiling; if the real price means the plan cannot fit, the plan is trimmed, never the ceiling crossed.
- **Akhil's area-picker idea — decision: adopted in a modified form.** Not asked up front: §8 rule 1 says ask nothing before the free pass, and the hand test failed precisely because questions came before research; a vague ask therefore gets "Everything" by default. A scope the ask already names ("what ads are they running?") is honoured and covered completely for every rival, with news and launches still run first. The four area groups (ads and creative · social, content and founder posts · news, launches, funding and hiring · pricing, positioning, reviews and buyer talk) are offered in the closing message as "which area to go deeper on next" and can focus the weekly watch. Reason a reviewer can check: an up-front picker would add a stop before any result, which is the failure mode §8 was written to remove.

## Round 12 — depth critique and contract check (2026-10-17)

Both critics read the text from before the §8 pattern fold-in, so every finding was re-checked against the current text first.

**Depth critique (senior marketer, against research-spec.md), 9 major.** Fixed:
- M1, a question before research: already gone with the fold-in. Also: claims-gate is now read-only up front, with the scoped sign-off moved to step 7; off-limits rules are read from brain `dont`/`must` facts; the spec §6 "ask at the start" block is marked superseded.
- M2, the unplaced paid top-up: step 3 now says "never pause for paid reads"; step 7 names the gaps, the estimate and one yes.
- M3, reading-ads-honestly saying LinkedIn and Google are "paid, on a yes": now every public library is read free in the browser for every main rival; the proxy is the approved top-up only. Stale step references fixed. Per-library date rules and B2B hook, proof and format types added (Thought Leader Ads tied to founder voice).
- M4, invented demo beats: rival-pass §5 now says how to watch (video tool → transcript → media_analyze) and tags each breakdown "from video" / "from transcript only" / "couldn't watch".
- M5, a launch demo analysed but no brief: step 4 now writes a format brief per demo (beat → our feature and approved proof), plus the counter-position kit with an ad-policy check before ads on a rival's launch terms.
- M6, context running out in hosted chat: without subagents, each profile is written to the rival's file as a draft before the next. The rival-pass inputs now include our claims, the off-limits list and the communities.
- M7, thin profiles: report §4 is a full profile template of about a page.
- M8, angles ignoring this run's reviews: buyer evidence can be review and community quotes from this run. Added "no segment file". 10–20 rows. The positioning map is required.
- M9, delivery: publish as a page or document wherever the host can (Claude Code included); otherwise a local file plus an offer to open it. Link via file_url. Three-line chat.

Minors fixed:
- the news sweep and the full read are split;
- an adjacent-options section in category-pass;
- newsletters in funnel;
- an X founder fallback;
- the move menu, with Upside always inferred;
- a swipe row requiring hook direction, reveal feature, approved proof, length and channel, at 8–15 items;
- heatmap columns by company type, with Partnerships;
- the example brand made consistent;
- the watch adds email, events and partnerships, and the scheduled prompt now lists dimensions by type;
- react-now alerts this turn, checks own-brand news, adds the shutdown tone rule and an ad-policy check, and asks about tracking at the end;
- a rule to re-run as a watch when the last report is under 30 days old;
- "What you get" cut, Watch and react made step 8.

**Contract check (AGENTS §5/§8, guide §4), 3 major.** Fixed:
- D1, the question before research, as M1 above; test-by-hand now fails any question before the report.
- D2, missing brand-document titles and tags: report, landscape and angle bank now have `<Artifact> — <Brand> — <D>` titles and tags in report-format. "Angle bank" still matches plan-campaign's `knowledge_search` fallback.
- D3, meta needs: added `ads_library_scrape` (labelled unverified), `media_analyze` and `file_url`; dropped `account_whoami`; added `ad-policy-check` to `shared_atoms`.

Minors fixed:
- a browser row in the ads table;
- `ads_library_scrape` marked unverified, matching server-needs #14;
- the paid top-up in step 7;
- founder-facing template text no longer names tools or playbooks;
- rival record line 2 is "Do this first";
- the watch re-saves changed rival records through save-to-brain, in the scheduled prompt too;
- the section order;
- the test path;
- the server-needs step numbers;
- `reads` lists `search/visibility/<date>.md`;
- the guide §4 inspiration-library row now lists research-competitors as a writer (a reader-side row in the orchestrator's guide, the only change outside this folder).

**AGENTS §8 point 7, "Every finding ends in 'For you'" (approved 17 Oct), folded in:**
- one more free-pass worker runs rival-pass §1–10 on our own brand;
- step 5 closes every finding with "For you" and builds "You vs them";
- report-format holds the line shape and the guardrails (no proof, no claim; don't follow the herd; facts-only; empty brain), plus a new §3 "You vs them" (later sections renumbered, landscape now copies §3, §4 and §7);
- the swipe-file column became "For you";
- "Research recommends; it never makes the asset" is now a gate;
- the test adds these as pass criteria.

M9 was revised to match §8 point 4: in a host with files, a file plus an offer to open it, not "publish everywhere". The step-4 format brief and counter-position kit moved to angles-and-gaps "Launches" to keep SKILL.md near 1,000 words (now about 1,070).

## Round 13 — Sonnet re-runs of the Juicebox ask (2026-10-17)

**Run 1** (text from before §8 point 7) was stopped part-way. Its Loxo, hireEZ and Eightfold workers drove the in-app browser, which prompts the human on every action; they sat blocked for about 2 hours. Before the stop:
- the Fetcher worker found the shutdown and Juicebox's purchase of the assets unprompted;
- the hireEZ and Eightfold workers found their launches (agentic relaunch, CRM; AI Interviewer, TalentForge).

**Run 2**, on the current text, Sonnet, WebSearch and WebFetch only, no GooseWorks calls, brain simulated from juicebox.ai. Result:
- **Passed:**
  - no question before the report;
  - news on our own brand found the Fetcher deal first, so it became move 1 with its window (2026-11-19) and the respectful-tone guardrail;
  - 7 parallel workers (5 rivals, category, own brand);
  - a readable report with "Do this first", 5 timely openings, "You vs them", same-shape profiles, a 12-item swipe file, 13 angles, triggers and a long couldn't-read list;
  - "For you" on every finding;
  - a closing message with only decisions (rivals, sign-off, one-yes top-up, inbox, area, watch, rules).
  - It also found things the old run never did: rivals' pages aimed at Juicebox's name, Juicebox's own site contradicting itself on prices and counts, Findem's new self-serve tier, and hireEZ's agentic relaunch.
- **Missed, because of the test setup:**
  - no ad library opened under fetch (403s, script-only pages), so "what are they running" in ads is unanswered;
  - founder posts were cut when a shared 200-search cap ran out.
- **Missed, because of the simulation:** with no saved roster the run picked hireEZ, SeekOut, Gem, Findem and Metaview from the web, not Loxo and Eightfold. In a real run the brain's roster supplies them.

**Playbook defects it reported, all fixed:**
- No degraded mode when ad libraries won't open. Now: rival-pass §2 has fallbacks, the "partial" tag, "none found" only when a library opened, a one-line limit in the report, and the top-up as the first decision.
- Unbudgeted search load. Now: a priority order when searches run short (news → launches → founder → ads → pricing → positioning → reviews), and the news queries combined with OR.
- "For you" requiring approved claims while sign-off comes after the report. Now: lines can be marked "needs your sign-off".
- The own-brand pass reusing a rival brief. Now: rival-pass has an "our own brand" mode.
- No rule for a new entrant found mid-run (Pin). Now: step 5 adds a short rival pass on it.
- No tag for launches with no video. Now: "from page text only".
- Review counting mixed in rivals' quotes. Now: first-hand reviews are counted separately from quotes on rivals' comparison pages; paraphrases are marked.
- A swipe-file mix impossible without ads or video. Now: fewer or text-only, said so.
- "Names no vendors" was ambiguous. Now: our own tools only.
- The heatmap had no column for pages aimed at us. Now it does.
- Snapshots with no ad ids. Now: links checked, marked "not read".
- No tie-break for conflicting dates. Now: the primary source's date.
- spend-gate (owned here): a first run with no price history no longer invents an estimate; the human names the ceiling in the same yes, or only the probe runs.

**Not changed, by design:** "pick the brand (ask if several)" stays the one possible question before research; nothing can be researched without it.

**Still weak:**
- Ads and founder posts depend on a host browser and an uncapped search budget. In a fetch-only host they are the couldn't-read list plus the paid top-up.
- No run yet with a real browser and a real brain roster (Loxo, Eightfold).

## Round 14 — the founder's GooseWorks re-test (2026-10-18)

**Why.** The founder asked "Ok I want to do the competitor research for gooseworks". Read from the transcript:
- It looked for its worker briefs under the wrong folder, never read rival-pass or category-pass, and wrote its own brief telling workers "a browser is not available".
- It reported that no ad library could be read and offered a paid read. When the founder said "Can't you do it on your own", it read Meta in the browser in 2 minutes.
- It chose rivals from memory (Jasper, Copy.ai, Pencil…); the category pass then ranked Higgsfield, Holo and Melius above them.
- It seeded the own-brand pass with unsourced claims, then "corrected" the founder on a figure he never gave.
- It asked whether to track rivals instead of pricing the top-up, and asked again for free LinkedIn and Google reads.
- It patched a section above §1 instead of rewriting, leaving contradictions in the report.
- Nothing was saved to the brand.
- The report was dense tables with Fact/Inferred tags, a "Jobs served" line, ids and symbols.

**What changed:**
- **SKILL.md steps rewritten:**
  - The field is found first: news, then the category's money searches and AI answers. Rivals come from that evidence, never from memory.
  - Each worker gets its brief in full, with `brand_id` (the briefs sit next to SKILL.md, and that is now said).
  - Workers use search and fetch and hand back "Needs the browser" pages. The main run opens every ad library for every main rival and for us, by advertiser name, before the report, with one line to the founder first, never silent on a prompt.
  - Facts are checked against the returns, and late reads mean a rewrite.
  - Delivery goes through write-report: a local `gooseworks-reports/<slug>/<D>-competitor-research.md` plus the brand copy and its link.
  - The closing message: three lines and at most five decisions, including the weekly or monthly repeat.
  - A paid top-up is offered only for what free reads and the browser couldn't get, with no tracking precondition. Free work is never asked about.
  - Before you start: the server the project names; a missing brand is created without asking; facts come from the brain first; never change settings; never seed from memory.
- **The report.** `references/report-format.md` follows write-report: In short, timely openings, who we compared and why, the rivals one by one, how they compare, You vs them, formats worth borrowing, angles worth testing, what to do, what we're watching, what we couldn't check, sources. "For you" is a plain sentence. No ids, tags or symbols. Angle ids stay in the angle bank for the makers.
- **The watch note** became a write-report "what-changed" report; line 2 `Week of …` is kept for analyze-performance. The scheduled repeat is weekly or monthly.
- **rival-pass and category-pass:** a "Needs the browser" return; ad libraries searched by advertiser name; never check unsourced claims about us.
- **Supporting files:** meta 0.3.0 (write-report, brand_setup, job_get, file_url); the test uses the founder's exact ask and write-report §3; listen-social references point to research-market.

**Schedules rule updated (AGENTS §8, 18 Oct):** the repeat offer in step 7 is now a judgment call — offered only when repeating would help this brand, with the reason and a cadence; never for one-off questions. (The in-flight re-run used the earlier fixed-offer wording.)

## Round 14 — Sonnet re-run (2026-10-18)

Sonnet ran the founder's exact ask ("Ok I want to do the competitor research for gooseworks") with read-only staging, web search and page fetch only, and no browser.

**Result:**
- **Rivals chosen from evidence:** Arcads, SuperScale, Higgsfield, Creatify and AdCreative.ai, with Holo and Novoads as short reads. It dropped the saved roster's cyclist and the names buyers never compare.
- **No question before the report.**
- **Timely openings:**
  - Higgsfield's video "Ad Multiplier" on 6–8 Oct, after a $400M raise, with a counter-position for GooseWorks' 14 July static remix;
  - rivals' billing anger;
  - Meta's 30 Oct AI-ad terms, marked "not re-checked".
- **Against write-report §3:**
  - "In short" leads with "Do this first" (a plain credits-and-billing page by 25 Oct);
  - plain words, dated links, a plain "For you" sentence on each finding;
  - no ids, Fact/Inferred tags or symbols found.
- **Weaknesses:**
  - The "In short" bullets run long.
  - Ad libraries couldn't be read, as the test forbade the browser; the report said so once rather than with columns of question marks.

**Defects it reported, fixed:**
- **No fallback without a browser:** the server's free ad sample for tracked rivals, said once in "In short"; "Done when" accepts that.
- **The browser heads-up vs "don't message the founder":** status notes are allowed.
- **The three-line closing message read too strictly:** now three lines of summary, then the decisions.
- **Facts from earlier research flowed in unchecked:** they are now re-checked or marked.
- **No rule to reject a bad roster entry:** one now exists.

These live in a new local atom, `atoms/edge-cases`.

**Still weak:** the run never touched the browser path that matters most here, the ad libraries. It needs a hand test in a host whose browser doesn't ask per site, or the fix logged in server-needs.




## Round 15 — senior-marketer review (2026-10-18): verdicts per AGENTS §2b

| Review point | Verdict | What changed / why not |
|---|---|---|
| §6 #1 Stale "who your buyers are → research-market" pointer | **Agree** | The description now points to research-audience. The brain read includes `research/audience/profile.md` and `plans/`; the meta reads are updated. |
| §6 #7 "Do this first" can't be table stakes | **Agree** | Step 5 and "Done when": neither "Do this first" nor the top angle may be something the report calls table stakes. The re-run led with a billing page it had itself called "not a reason to choose you". |
| §6 #7 Leverage test before counter-positioning | **Agree** | Step 4: counter-position only if we're the challenger, genuinely do the job better, have dated proof, and our answer reaches enough of the rival's buyers. Otherwise it goes under "What we're not doing". The re-run's "we've had this since July" against Higgsfield's video launch would now fail the test. |
| §6 #7 Frame-of-reference line | **Agree** | Step 1 states the frame in one line (research-market's decision when it exists) and the other frames we could claim, since the frame decides which rivals matter. The report has "The frame we compared in". |
| §6 #6 Sibling reports, disagreements, positioning | **Agree** | Same as research-market. |
| §6 #8 Cadence: weekly, silent below thresholds, quarterly teardown; scheduled runs have no browser | **Agree** | watch-and-react: a weekly what-changed report only when something crosses a threshold (otherwise snapshots only), a quarterly full teardown, and the offer says scheduled runs can't read ad libraries. |
| "For you" on every finding inflates moves; at most 6 moves | **Agree** | "For you" only where it matters; at most 6 moves; formats and angles cut to the top 5 each in the report, with the rest in the angle bank. |
| Baselines; source skew | **Agree** | A baselines table (rank for "<rival> alternative", AI answers, reviews, active ads per library) and a skew line. |
| Unrealistic measures ("ranking by end of November") | **Agree** | "What to do" success checks must be on a realistic timeline. |
| Vanity measures (GitHub stars as "ahead") | **Agree, by rule** | Covered by "Where we're ahead" needing what buyers value; nothing to hard-code. |
| §3 #7 Paid read offered upfront for B2B | **Push back** | As in research-market: it reintroduces a pre-research question and spend ask, and the gap was partly the browserless test. Kept after the free pass. |
| §3 #10 Battlecards for B2B sales | **Not now** | Backlog card "Sales collateral"; the competitor report notes where a battlecard would help. |


## Round 16 — eval fixes (2026-10-19; trustworthy with-skill run 16/20 must-pass vs baseline 6/20)

Each failure was confirmed against `evals/results/2026-10-19/research-competitors/with-skill/` (main session plus 26 subagent logs). The v2 with-skill run is set aside: it re-delivered a cached report from the shared staging brand (contamination). No re-runs this round.

| Check | Verdict | What changed / why not |
|---|---|---|
| E7 field before rivals | **Real — fixed** | The run read the roster and launched the rival workers in parallel with the category worker, before any field search. Step 1 is now done by the main run itself, before any worker: about 6–10 searches (news, "best <category>", "<brand> alternatives", "<strongest saved rival> alternatives", one AI answer); the roster is a starting list, never the answer. category-pass now goes deeper after that choice. |
| Cost: 46 min, $35 | **Real — fixed** | The run started **26 subagents**, not 7. Every one loaded the whole skill on start, rival workers spawned their own sub-workers, the main run also started a workflow, and each worker made 50–60 uncapped web calls. Now: rival-pass is a short worker brief (the full method moved to `references/rival-craft.md`, read only for a section that needs depth); workers must not load skills or start subagents; exactly one worker per main rival plus the category and own-brand workers, with no workflow on top; a cap of about 12 searches and 12 fetches per worker, doubled for a deep quarterly teardown. |
| E8 same-shape profiles (founder-post line and two quotes missing; "watch only" rival) | **Real — fixed** | The worker's return shape requires a founder-posts line or "couldn't read (reason)", the headline word for word, a praise and a complaint quoted with links, and pricing with unit and source type. A name we'd only watch now goes in the brief competition line, not as a main rival. |
| E10 launch breakdown not labelled by how it was read | **Real — fixed** | The breakdown is in the return shape with "from video / transcript only / page text only". |
| E2 links only in the end list | **Real — fixed** | Inline link and date on every fact, in the worker brief and the pre-delivery check. |
| E3 "In short" about 170 words, leaning on facts the body said must be confirmed | **Real — fixed** | The pre-delivery check: count the words (150 or fewer), and nothing unconfirmed or awaiting sign-off. |
| E5 body over 3,000 words | **Real — fixed** | The check counts the body; profiles target about 400–600 words from workers, trimmed in synthesis. |
| E6 moves without owners | **Real — fixed** | The check requires a named role for each move. |
| S5 closing message too long | **Real — fixed** | An exact closing-message shape in `report-format.md`. |
| E9 ads "couldn't open (no browser)" | **Pass, and the rule held** | No change. |
| The v2 run re-delivered a cached report | **Contamination — one real rule** | edge-cases: an earlier report newer than 7 days is reused as the base — re-check news, launches and prices, then deliver what changed, never untouched. Older, or asked for fresh: refresh in full. Say which, in chat and in the first "In short" bullet. |

**§2b pushback:** none on the criteria; each one matches what a senior marketer expects. One note on E5 (body under 3,000 words with five rivals): it holds only if profiles stay short. That is now enforced at the worker, not trimmed at the end.

Expected cost now: 7 lean workers at about 24 web calls each, plus the main run. About **$8–12 and 15–20 minutes** for a standard run, against $35 and 46 minutes. A deep quarterly teardown is roughly double.


## Round 17 — ports from the old library (2026-10-19): verdicts per AGENTS §2b

Sources as in research-market's Round 6. Old skills were read as reference only.

| Port | Verdict | Where it went |
|---|---|---|
| Pricing teardown (competitive-pricing-intel §2B, §2C, feature gating, §2D; battlecard-generator §1E hidden costs) | **Ported** | rival-craft §6: what a typical buyer actually pays (one stated scenario), the packaging model, a feature-gating table, hidden costs, and change severity for the watch. The rival-pass brief carries the scenario; the report's pricing table now has a "what a buyer like ours pays" column and the cheapest tier with the key features. watch-and-react thresholds use the severity scale. |
| Wayback mechanics (web-archive-scraper "How it works") | **Ported** | rival-craft §6: the CDX query with `collapse=digest` (only change dates), raw snapshots with `id_`, about 15 requests a minute. Used for pricing, headline and customer-logo history. |
| Rivals' lost customers and real users (customer-discovery: Wayback logos, job postings, integration directories, Step 5 confidence) | **Ported** | rival-craft §9: logos gone since a year ago ("likely lost", a switch target), "experience with <rival>" job posts, integration directories, and confirmed / likely / a guess with evidence. Added to the rival-pass brief within its read cap, and to the report's profiles. |
| Channel scorecard against stage (company-current-gtm-analysis §3A) | **Ported, in words not letter grades** | The report's "How they compare" grades each channel strong / fine for their stage / weak / couldn't check, judged against the rival's stage. write-report bans invented scores, and A–F grades read as false precision. The research-spec's promised channel heatmap now exists. |
| Topic gap (competitor-content-tracker Phase 5) | **Ported** | The report's "How they compare": topics rivals publish on that we don't, and topics buyers ask about that nobody covers. |
| Transcripts for demo breakdowns (transcript-intelligence workflow and guardrails) | **Ported** | rival-craft §5: the proxy transcript reads as a paid top-up, an extraction schema (hook and payoff with timestamps, claims with evidence, objections, CTA, sponsorship, quotable lines) and the accuracy guardrails. |
| Free feeds for scheduled watches (blog-feed-monitor, hacker-news-scraper; sitemaps from data-access) | **Ported** | watch-and-react item 9: diff each rival's blog and changelog feed since the last snapshot, Hacker News search for launches, and sitemaps for new comparison or pricing pages. These are what a browserless scheduled run can still read. |
| Battlecard (battlecard-generator Phase 3) | **Seeded, not built** | BACKLOG seed note on card #7, as agreed: the surface stays frozen. |
| Objection map | **Not ported here** | Belongs to research-audience (review gap #6). research-competitors' "where we win, where we lose" stays its competitive half. |
| Apify topic tracking, BuiltWith scraping, review scrapers | **Rejected** | Vendor keys or scraping vendor sites, against the free-pass rules. Methods are kept where they work on public pages. |


## Round 18 — run memory and the Brand Brain (2026-10-19)

**Wired in.**
- `brain_map` comes first when `brain_*` tools are listed, with the fallback kept.
- A new Before-you-start step 3 runs run-memory Start.
- Step 7 saves the run record before the closing message; step 9 (watch and react) opens with what changed against the stored numbers.
- New `references/run-memory.md`:
  - jobs: `competitor research` (quarterly or on ask) and `competitor watch` (weekly);
  - the numbers per rival and for us: active ads per library, longest-running ad, entry and typical-buyer price, launches in 90 days, reviews, open roles, our rank for "<rival> alternative", AI answers;
  - rival snapshots stay the source of truth;
  - tests and outcome sources;
  - the founder's answers;
  - scheduled rules.
- Meta updated.

**Critique (subagent, high effort): scheduled weekly watch with nobody present (4th watch, two open recommendations, one rival price rise) and a first run with no history.** Fixed:
- **The what-changed report had no Decisions for you, What to do or What we're not doing**, though unknowns and recommendations were routed there. All three added, and "Since <last run>" sits in "In short" after "Do this first".
- **Quiet-week questions had nowhere to go.** Now `to ask` in the record, asked in the next report or the next run with the founder present.
- **Watch and teardown were separate record chains.** Every job now reads the newest record of either job.
- **A recommendation not yet due** was forced into `not done` or `unknown`, which triggered a pointless question. Now it is carried as "not due until <date>" and never asked.
- **The comparison page had no URL and the blog post had no source.** The planned title or slug is stored, and the check reads the brand's sitemap and blog feed (added to the prompt's sources).
- **The copied method files pointed at files the server-side run doesn't have.** The setup now also copies `rival-craft.md` (news queries, price-change severity, Wayback), the category prompts from the last report, and the shared atoms under `method/shared/`, with a note on how their links map.
- **An older report with no run record** gives "first tracked run; last report <date>", with its baselines and moves carried over.
- **Founder decisions were lost** because the save came after the closing message. Reordered, and a same-day re-save records later answers.
- **Prompt fixes:**
  - rivals come from the last record's Numbers rows, not every file in the folder;
  - rival-record re-imports carry `rival:<slug>` tags so old copies get cleaned;
  - a partial snapshot read keeps the fields it didn't re-read, with their last-read date;
  - a price shown during an import → skip that import and say so;
  - brand name and scope are in the prompt, and every file is read with `file_read`;
  - react-now in a scheduled run goes into "Act now" only, with no questions.
- **Line 2 of the watch report differed between two files.** It's now defined once (in watch-and-react), and report-format points there.
- **rival-pass's snapshot lacked the review rating and site.** Added, so its numbers match the run record's.

**Flagged to the orchestrator, not edited here** (shared run-memory atom and AGENTS, owned elsewhere):
- the atom has no `open` status for a recommendation not due yet — handled here as `unknown — not due until <date>`, never asked;
- "asked on" exists only in the Outcomes table, not in Recommendations, so a carried question's date gets lost;
- `daily` is missing from the cadence list (handled here as "old after 3 days");
- open questions are routed to "the report's Decisions for you" even on quiet scheduled runs that send no report (handled here as `to ask` in the record);
- AGENTS §8 Schedules says every scheduled run produces a report, which contradicts silent watches;
- the atom's saved-line wording "so next week starts from here" is wrong for quarterly and ad hoc jobs.

- **19 Oct, Codex review 2 of the run-memory PR:** not-yet-due recommendations now use the shared atom's `open` status instead of `unknown`, so they never reach "Decisions for you" before their review date.

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

- **The frame swung silently between runs** (18 Oct compared us with Jasper/Copy.ai; 20 Oct called Creatify "the rival most like us"). → Step 1 now states any change of frame or main rivals since the last run in one line with the reason; Done-when checks it.
- **Top angle failed on our own page** ("see the cost before anything is made" while our page doesn't say what a video costs). → `angles-and-gaps.md`: an own-page test before an angle ranks; if we don't deliver it on our pages, the first step is fixing them. "Gap" now requires it.
- **Profiles were complaints only, all Trustpilot.** → rival-pass item 7 and rival-craft §10: a praise and a complaint from more than one source where they exist, sites named, one-site skew said; SKILL step 5 and Done-when check every profile has both.
- **A new entrant called "closest to our buyer" got no profile** (Holo). → Step 2: such an entrant counts as a main rival and gets its own worker; step 5: one surfacing late gets a short rival pass before the report.
- **Meta "active" and Google "all-time" counts sat side by side.** → `reading-ads-honestly.md`: counts aren't comparable across libraries; label each with what it counts; ad count is creative volume, never spend. rival-pass return shape and run-memory Numbers row carry the label. The baselines table in `report-format.md` (writer 1's file) should split the row per library — flagged.
- **Juicebox buying Fetcher's assets was called a "switch campaign".** → research-spec §3.1 "Name the event exactly" (an inherited-customer migration offer + owning "<rival> alternative" searches; our race is for the customers it doesn't keep); rival-pass news item asks who bought what and who now serves the old customers.

### Report top (write-report shape)

| Finding | Fix |
|---|---|
| Reports opened with "Do this first" before the reader knew what was researched, so the move couldn't be judged (Akhil; 4 marketer reviewers: keep the answer on screen one, but rest it on findings shown above it) | In short now: "What we looked at" (scope, sources, date, main limit) → 2–3 numbered findings with how sure (confirmed / likely / first look) → "So, do this first (because of 1 and 2)", naming the findings; a first-look base makes the first move the one that closes the gap (write-report §1) |
| In short stated provisional or first-look things as fact; counts described a different thing than the claim beside them; first moves assumed unconfirmed assets | write-report §3 checks, now blocking: nothing stronger than the body, every number counts exactly its claim, no unconfirmed asset in the first move (→ "confirm X" or a decision) |
| "230 live Meta ads" beside "paying to say works inside Claude" when only a few were Claude ads | The format's check names this case; the In short template asks for "how sure" per finding |
| Ad counts compared across libraries (coordinator, from writer 4) | Baselines split per library, each labelled with what it counts; never added up or compared across libraries; a count is not spend |
| Same-day sibling reports gave different first moves and lead buyers | write-report: read same-brand reports from the last 14 days; name a different first move or lead buyer in one line and merge or say why this one wins |
| Test | test-by-hand item 5 checks the new top; a fail line for the 20 Oct case |
| Rival record, landscape and angle-bank line 2 ("Do this first, because…") | Kept: they are working records planners read, not reports |

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| Stale report-top wording: research-spec §1 and §7 ("Do this first" with 3–5 moves, half a page) and the description | research-spec now points at the write-report §1 shape and `report-format.md`; ranked moves (at most six) sit in What to do. Description: "the findings and the first move they support". "Ad and video briefs" → ad briefs. |
| write-report's new top rules copied into Done when, report-format's check and test item 5 | Each now points at write-report §3 and keeps only this playbook's own checks (not table stakes, baselines, inline links, roles and dates on moves, the extra banned words, no Fact/Inferred tags). |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Copied setup (server choice, connection line, get_started, `client`, brand pick, brain_* read) | One "Setup first" line to guide §1–2, plus what is unique: create a missing brand from its site, no unrelated menu, the fallback brand_read sections, and the files this job reads |
| "AGENTS §8 research pattern" (builder doc at runtime) | "guide §3 **Research pattern**" |
| Run-memory start restated the atom | Pointer: the two job names and `references/run-memory.md` |
| "Do not ask the founder anything yet" repeated the top rule | Removed; the host-settings and no-memory-seeding rules kept |
| Step 5 restated report-format and research-spec rules (You vs them, six moves, sibling disagreement, positioning, For you, praise and complaint, events, source skew, baselines) | Step 5: write in the shape of report-format.md, the new-entrant rival pass, and the trace check |
| Step 6 restated write-report's delivery (local file, link, artifact, file_url) | Deliver through write-report with this job's topic and brand path; the extra records stay |
| Step 8 restated the schedule rule and spend-gate's no-history rule | Pointer to guide §3 **Schedules**; the no-browser note for scheduled runs stays |
| Output table repeated guide §4's row (save modes are in report-format.md) | Pointer line |
| Done when was one long sentence; no run record | Split into bullets; added "run record saved before the closing message" |
| "Founder" and "marketer" both named the user | "Marketer" in SKILL.md. References still say "founder" in places (later pass) |
| Description 1,010 characters, opened "Use when a founder or marketer asks" | 647 characters, leading with "Competitor research". Routing cases R06, R32 and R68 still match |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| B5 "We don't make video ads yet" in the report's For-you rule; metadata named make-video-ads | A video idea is offered as the next job with the goose-video skill; unreleased producer removed. |
| B10 "worker briefs: `atoms/`" | "its step skills (`research-competitors-<step>`)". |
