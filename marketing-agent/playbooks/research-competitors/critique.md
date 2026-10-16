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
