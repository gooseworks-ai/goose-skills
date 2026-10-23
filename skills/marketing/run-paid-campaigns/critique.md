# run-paid-campaigns — critique log

## Round 1 — pre-write scope + depth (one critic, senior paid-media lens, effort high, 2026-10-16)

### Scope (MAJOR)

| # | Finding | Fix |
|---|---|---|
| 1 | The spec promises what the Meta tools cannot do. NEW_CAMPAIGN is Traffic-only (LPV/link clicks, lowest cost, lifetime budget, broad countries, no Instagram actor). Budget changes only on Goose-created ad sets. Pause only Goose-published ads, only with the user's words this turn; no resume tool. `meta_read performance` = Goose creatives only, no frequency/CPM/learning status/disapprovals/breakdowns. | `references/meta-levers.md` states can / can't plainly. Founder's own Meta campaigns and app-install campaigns → written-instructions mode (spec's "app installs in scope at launch (same levers)" is false today — recorded in server-needs). "One-tap yes" becomes: approval links (increases need GO LIVE) + one ready sentence the human says to fire pauses + written-instruction cards. Kill = pause, never revert. |
| 2 | Traffic-objective trap: judging Goose Traffic launches on purchase CPA is a category error. | Goose launches are framed as **angle/hook tests** read on CTR, cost per LPV and store conversion via UTMs; winners graduate by EXISTING_AD_SET push into the founder's conversion-optimised ad set; scaling that ad set is a written instruction. `references/launch-and-graduate.md`. |
| 3 | Lifetime-budget math. | Scale steps expressed against implied daily pace ((lifetime − spent) ÷ days left); no lifetime raise in a flight's last days; end-date change is a written instruction. |
| 4 | Health gate before every weekly read (tracking, landing page/stock/price/offer, disapprovals, payment/spend limit). | Step 2 health gate; a break blocks scale moves and flags the window; unreadable items come from analyze-performance's plumbing flags or the human. |
| 5 | Pacing and ceiling. | Proposal header: month-to-date vs plan, projected month-end if all moves approved, vs ceiling; trip-wires written for the human because kill-switches can't be scheduled; account spending limit recommended as a written instruction. |
| 6 | Learning and significant edits. | Learning derived from events/week; max one significant edit per ad set per week (a swap counts); learning-limited ad sets → consolidation instruction. |
| 7 | Reactive mode missing. | Entry point "something broke / sold out / offer ended / disapproved" → immediate pause or swap proposal, same gates. |
| 8 | Attribution and maturity. | Same setting/window; last ~72h immature; comparisons across an attribution-setting change are void. |
| 9 | Company-type gaps (DTC breakeven ROAS + MER referee; B2B cost per SQL, lag, higher-funnel optimisation; apps no install levers, SKAN delays, cost per retained user; local: broad-country-only means NEW_CAMPAIGN can't do radius; services lead quality). | `references/company-types.md`. |
| 10 | Expected effect has no server field. | Goes in the `reason` text and in the R# entry in `ads/campaigns/<slug>/state.md` (expected direction + range from own history or "unknown", check date, decision rule). |

### Scope (MINOR) — all applied
Social-proof loss on swap flagged; UTMs on every destination; Advantage+ creative enhancements toggles checked (can alter approved claims); Q4/BFCM CPM season; retargeting exclusions and brand-search/retargeting not counted as "winners"; bid caps/dayparting only by written instruction when evidence warrants; concurrency — a refused budget proposal is relayed, re-read, never retried.

### Scope creep (accepted)
- Launch step executes plan-campaign's test plan; it does not design a new one. It flags when the server can't express the brief's structure.
- The "why" is one line citing analyze-performance.
- Allowable cost is read from the campaign brief's economics box first, asked only if absent, then written back to the brief.
- Expected effects: ranges from this account's history, direction-only, or "unknown" — never invented numbers.

### Depth — adopted
Weekly proposal shape (header, section 0 scoring last week's R#s, move table with evidence/confidence/expected effect/applied-how/check, near-threshold row with both readings and a trip-wire); noise math (1/√n; z ≈ (a−b)/√(a+b)); same-spend-level comparison and re-ranking by spend; breakdown effect; marginal vs average CPA; incrementality; rules of thumb (scale +20–30% every 3–4 days, kill bands, CTR/hook-rate floors, frequency proxy, refresh cadence, learning budget, Google tCPA ±15–20%, pacing ±10%) labelled as such; 16 failure modes; written-instruction card format; change-log flow with pending-until-"done" for human-applied moves.

### Open dependency
- `prepare_meta_ad_push` refers to an "ad-context tool" for the existing ad-set id (`get_meta_ad_context`), which is not in the staging tool list. Recorded in server-needs.md.

## Round 2 — adversarial run (one critic, effort high, 2026-10-16): DTC Monday with mixed Goose/founder objects + Google; B2B LinkedIn + Google, no Meta; pre-revenue app Meta installs + Apple Search Ads

### MAJOR — all fixed
| # | Finding | Fix |
|---|---|---|
| 1 | Push/change ids never stored; `pause_meta_ad_push` without `push_id` targets only the latest push, so pausing an ad from an older push fails; `push_status`/`change_status` need ids no step keeps. | `state.md` gets a **Meta objects** block (push_id → campaign/ad set/ad ids/destination/flight end/budget type) and proposal ids per R#; every pause passes `push_id` + `meta_ad_ids`; unknown push → card; "list pushes" added to server-needs (#15). |
| 2 | Approval links shown at staging but only created in apply → three human actions. | Meta propose/prepare calls now run at **staging** (they change nothing; the approval page is the yes); ids stored; never re-proposed; chat yes needed only for pauses and cards. SKILL step 7–8, apply-and-log atom, meta-levers. |
| 3 | Meta-first ordering: `meta_read` before channel scope; Meta pitch to a no-Meta plan; Page check, UTMs, rotation formats Meta-hard-coded. | Channel scope moved into Before you start (3); `meta_read` only if Meta is chosen; per-platform UTMs, health checks and formats. |
| 4 | Worked example taught bad moves: pause "saves $/day" (spend just moves to sibling ads), a Traffic test scaled, two edits on one ad set. | Example rewritten: R7 is a graduate move; R8's effect states spend moves to siblings; a collision (R13 deferred vs R7) is shown and resolved; rule added to moves.md. |
| 5 | Graduation may be refused (render lock) and risks learning reset on the founder's main ad set; Instagram placement constraint. | Graduation is the human's call with options A/B/C and the risk stated; render-lock unverified → server-needs #16; Instagram note in route 1. |
| 6 | No path when exports don't arrive; pacing would be invented. | **No-export mode** (coverage %, pacing unknown, relative cards, one "what an export unlocks" line); exports asked at most every two weeks; screenshots accepted. |
| 7 | No low-volume lead-gen or app modes. | **Volume regime** set in Before you start (high-volume / low-volume lead-gen / app) changing windows, thresholds, cadence; low-volume = monthly decisions, upstream signals weekly, "no moves; next decision <date>"; learning formula scoped to Meta; CRM lead-source check; app health checks (SDK/MMP, SKAN/AEM, listing); video creative via `video_read`/`video_share`; Apple Search Ads launch card; never Traffic to an app-store URL; provisional allowable with framed options for pre-revenue. |
| 8 | Change-log overwrite races with the server's `recommendation_ref` writes. | Re-read before every write; edit only this playbook's sections; server line format unknown → server-needs #17. |

### MINOR — fixed
Step references corrected; 1.3–1.5× threshold gap closed; windows via `days: 14` minus `days: 3` with "approximate" trends; `refresh_meta_sync` only for a known-missing object; a bare "yes" doesn't fire pauses; trip-wires surfaced by an optional mid-week check; brief Economics edited section-only; one R# id scheme with card aliases; low stock no longer invalidates past numbers; launch rules owned here (not an external launch skill); `evidence` = `report:<date>` or `user request`; scheduled runs only stage.

### Not changed (with reason)
- "Expected effect" kept in the move table even when "unknown" — the spec requires one per move, and "unknown" is an honest value.
- Host-rule conflict (cards are technical steps) — decision Q6 explicitly accepts cards; logged as server-needs #18 for the server owners.

## Round 2b — contract check (effort high, 2026-10-16; all three playbooks)
All tools named exist and are used within their descriptions; no vendor keys; money gates hold; no playbook calls another. Fixes for this playbook:
- M3 rotation requests existed only in chat → written to `ads/campaigns/<slug>/rotation-requests.md` (makers' read).
- M4 no video path → `video_read` / `video_share` added to needs; videos launch by cards until the server confirms a video can be pushed as a render (server-needs #20).
- M5 SKILL vs atom contradiction on when Meta items are proposed and where ids live → atom rewritten to stage-then-apply; `state.md` carries push/change ids per R#.
- M6 slug and workspace unconfirmed → slug taken from the brief's Status line (plan-campaign writes it), else derived once and recorded with the campaign id; null-workspace fallback stated; server confirmation still open (server-needs #10, #17).
- m5 health line now in `state.md` header for analyze-performance; m6 exports reused from analyze's input summary; m10 Economics edits bump the brief version; m12 meta-levers keeps behaviour, defers to the live schema.

## Round 3 — final round (effort xhigh, 2026-10-16)

Critic verdict: MAJOR REMAINING: 3 (money gates, tool use and stage-then-approve order checked clean) — all fixed:
| # | Finding | Fix |
|---|---|---|
| M1 | Launch never read the makers' hand-off files, so push copy, AI labels and special-ad-category flags had no source (and the agent would write copy itself, bypassing the makers' claims check). | Step 5 and the health gate read `ads/batches/<yyyymmdd>-<slug>.md` and `ads/videos/<project_id>.md`; copy taken verbatim (UTMs appended only), else the human pastes the approved copy; flags carried into approvals and cards; special-category creative only via route 1 into a declaring campaign or by card; `picked` tag required; meta `reads` updated. |
| M2 | "An ad got rejected" prescribed a pause (a no-op) with no fix route. | Rejection branch: exact reason → state.md health line; review-request card or hand-off to the makers' disapproval-fix mode; scan other live ads for the same claim/visual (account-restriction trigger); swap when a fixed render is picked. Test case added. |
| M3 | Worked proposal scaled Sales – Broad while blended new-customer MER was below break-even. | R13 is now a Hold with the reason and a re-decide rule; the Scale row in moves.md says no scale while blended is below break-even. |

MINOR fixed: inputs path; slug rule aligned to the brief's Status line; `goose_campaign_id` on every push; no pause sentence for an ad with a pending swap; scale cadence one step per weekly run; stock-out vs restock date and offer-end tags; very-low-volume B2B monthly method (60–90 days, CPL × qualified rate, consolidation, offline-conversion import); unused approval links logged as declined; example hygiene (dates, trip-wire on R12, no ids in the human-facing table); "Replan triggers fired" line in the state.md header and the brief's triggers read; rotation requests carry For/Status and are de-duplicated; app/low-volume/rejection test cases; server-needs #22–24.

**Status after round 3: no MAJOR open** (targeted fixes; verified by the round-4 check below if run).

## Round 4 — verification (effort xhigh, 2026-10-16, all three playbooks)
Round-3 majors verified FIXED in all three. One NEW major in plan-campaign: N1 — search ad copy, keyword lists and PDP copy were handed to make-content, whose out-of-scope refuses them (ad copy → makers; keywords → improve-search-visibility), so the Google leg had no producer. **Fixed:** marked human-executed until a maker covers them; the asset row carries angle, searcher's words and signed-off claims; run-paid-campaigns' Google launch card takes the confirmed copy and proposes keywords from the demand read. Gap logged for the consolidation pass.
Minors fixed: one push per angle cell (a push carries one copy set and one URL); propose vs prepare params aligned in run-paid step 7; `picked` tag required everywhere; brief version + Budget split read by run-paid, changed legs staged as R#s; null-workspace fallback aligned; `tools_load` in all three; margin line in definitions.md; T1 example threshold and one-ad-set-per-angle; Brand record version per the marker; one UTM id (`src`).
Verifier verdicts: run-paid-campaigns NO MAJOR REMAINING; analyze-performance NO MAJOR REMAINING; plan-campaign 1 (N1, now fixed).

## Round 5 — clean check (effort high, 2026-10-16, all three)
Round-4 edits verified (N1 routing consistent with make-content's out-of-scope and run-paid's route 3; step-7 params match the tool contract; `picked`, `tools_load`, null-workspace, margin line, Brand record version, UTM `src` consistent). **No new major. Verdict: NO MAJOR REMAINING for plan-campaign, run-paid-campaigns and analyze-performance.**
Minors applied: paid-structure example uses one Sales–Broad duplicate per angle; one push per angle cell and copy set with the lead creative's `src`; swapped ads joined by Meta ad id; run-paid reads research-market's demand read; plan's hand-off list names the search/PDP line.

## Round 6 — cross-set review fix pass (2026-10-16; reviews/2026-10-16-{coverage,contracts,depth,routing}.md)

Fixed:
- **Routing R1 (MAJOR):** description was invalid YAML (opened with a quoted phrase) → `>-` block form, ≤ 1,024 chars, trigger phrases first, "Not for X — use Y" last; verified with a YAML parser.
- **§5:** atoms renamed `atoms/<atom>/ATOM.md` (frontmatter replaced by a one-line hidden-atom comment); nothing the marketer reads names a playbook, tool or id.
- **§8 connection / workspace:** connection and brand via `foundation/guide`; no coworker workspace → default workspace with `brands/<brand-slug>/` prefix, told to the marketer.
- **§8 automations:** schedules follow `atoms/spend-gate/ATOM.md`'s automation rule (created paused; each run uses credits, exact cost not shown in advance).
- **Contracts F4 (MAJOR):** change log rebuilt on the server's campaign-harness contract, verified in gooseworks-app `origin/dev` `apps/api/src/services/ads-harness-docs.service.ts`: `state.md` frontmatter (`campaign`, `stage`, `goose_campaign_id`, `meta_push_ids: [..]`, `meta_campaign_id`, `updated_at`, `updated_by`), every returned push id added to `meta_push_ids` at once, one-line `- R<n> (YYYY-MM-DD): …` bullets under `## Open recommendations` (the server deletes them on close; `None.` when empty), `decisions.md` append-only `### YYYY-MM-DD — <title>` blocks with Recommended / Evidence / Decided / Outcome lines, `evidence` as `change:` / `push:` / `report:` / `user request`. The server needs a coworker workspace (no fallback) — said to the marketer. Server-needs #17 and #24 deleted (answered), #10 rewritten.
- **Routing C1 (MAJOR):** "an ad got rejected — check the account and the other live ads"; the rejection branch detects, writes the reason, scans other ads and sends a `Fix needed:` request line to the format's maker, who rewrites it; "Not for rewriting a rejected ad" in the description.
- **Routing C2 / C3 (MAJOR):** "we sold out or the sale ended — pause or swap the ads now" kept here only; "decides and acts" plus "act on this week's performance read"; "Not for how the ads did or which ad won — analyze-performance". F14: "give me the Google, TikTok or LinkedIn changes" added.
- **Depth:** first-run **baseline audit** (`references/baseline-audit.md`): ad sets vs the learning floor, overlap, spend concentration, creative age and mix, click-rate trend, retargeting/brand share, tracking, hygiene — seeds the first moves in the same proposal.
- **Coverage (brand incident):** a brand-crisis branch — pause sentence for affected Goose ads, instructions for the rest, hold on every launch and scale, nothing back on until the marketer says so, replan trigger recorded.
- **Contracts F5c / §8 tags:** picks read from make-static-ads' batch file and the lower-case `picked` tag; `offer-ends:<yyyymmdd>` lower-case.
- **Contracts §2.3:** restated parameter limits removed from meta-levers, atoms and references.
- **Routing U2:** no internal ids shown ("did you apply R14 (G1)?" → "did you lower the Google budget we talked about last week?"); the proposal numbers moves; cards carry plain titles; R-ids live only in `state.md`.
- **Request lines (§8):** rotation and fix requests use `Rotation needed:` / `Fix needed:` lines with `return to:`; answers read next run.
- **Coverage M1 (light):** Amazon / marketplace cards (Sponsored Products budgets, bids, search-term negatives, TACoS) and a marketplace note in reading-results — inside the existing written-instruction mode, no new levers claimed.
- **Coverage M9:** the Monday schedule runs after the weekly performance read.

Rejected / deferred (with reason):
- Gap-1 (writing search ads) — new scope, pending with Akhil; the Google launch card still takes confirmed copy from the brief's asset row.
- Contracts F5a (server tag writes may be rejected: `tags` vs `user_tags`) — a server bug; the batch file is read first so picks survive it (server-needs row added).

## Round 7 — adversarial + contract critique (effort high, 2026-10-16, after the Round 6 fix pass)
Passed: YAML parses (844 / 967 / 963 chars, `>-`), routing splits as agreed, the server parsers (parseFrontmatter, closeRecommendation, findCampaignSlugs, appendDecision) accept the state.md / decisions.md example, atom paths resolve, learning examples ≤ 300 chars.
MAJOR found and fixed:
- run-paid M1: the decisions.md example had dates out of order → reordered; late-logged events take today's date and name their real date in Outcome.
- run-paid M2: launches never closed (`prepare_meta_ad_push` takes no `recommendation_ref`) and check rules vanished when the server deleted a bullet → a `## Checks due` section (server never touches it) holds every follow-up; launch/graduate bullets are closed by this playbook from push status, with an `Evidence: push:<id>` block if the server wrote none.
- analyze M3: totalling a big pasted Shopify CSV by eye in a hosted chat → never by eye; ask for the summary report and mark the referee not measured until it arrives; never derive new vs returning from an orders export; total in code when a code tool exists.
MINOR fixed: playbook/id names left in the brief template and brief atom (roles now); analyze reference paths to shared atoms (`../../../atoms/`); restated `rank_by` default and `goal`/`channels` enum text removed; learning example rewritten as a maker-actionable rule; the Monday report headline opens "Do this first, because…"; brand-crisis branch names still-open approval links ("don't approve these") and says scheduled emails/posts are paused separately; "CAC blew up" replans recommend reading the numbers first; loose line in plan Approval gates.
Not ours: `foundation/guide` not written yet (orchestrator); the makers still read `For:/Status:` rotation blocks instead of §8 request lines (make-static-ads / make-video-ads owners).
Verdict after fixes: no MAJOR open in plan-campaign, run-paid-campaigns or analyze-performance (targeted fixes; not re-reviewed by another critic).

2026-10-16 final contract check: batch-file path read as `ads/batches/<YYYY-MM-DD>-<slug>.md` (was `<yyyymmdd>`), matching make-static-ads (SKILL.md, skill.meta.json, references/launch-and-graduate.md).
2026-10-16 final contract check: references/moves.md: the `Rotation ready:` answer now carries the maker's hand-off file, as make-static-ads and make-video-ads write it.
2026-10-16 final contract check: references/reading-results.md: plan-campaign unit-economics link made resolvable (`../../plan-campaign/references/unit-economics.md`).
2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; `spend-gate` moved to `shared_atoms`.

## Round 8 — run memory and the Brand Brain (2026-10-19)

Ask (orchestrator, for Akhil): wire `atoms/run-memory` in, read `brain_map` first where the brain tools are listed (fallback kept), and keep the money-move results flowing run to run. Checked on staging first: `brain_map` on Personal Day (23 chapters; chapter 20 holds only onboarding answers so far; operating-plan sections as listed in `brain_save`).

What changed:
- `references/run-memory.md` (new): job `weekly ads check`, subject = campaign slug, ids = the harness `R<n>` (never a second id). The **outcome check replaces "score last week"**: done from a source (approved ≠ applied), then worked / didn't work / too early (readable date) / can't tell (why). The **baseline recipe** is stored with every money move: object, ad ids and Goose share, metric (extra results per day, cost per extra result vs the allowable), pre/post windows (7 or 14 days by volume; learning skip after a 30%+ step; 72-hour settle), attribution, how to pull, control, readable-from date. **Per-ad scorecard** (top 10 + all others, settled window, return only truth or labelled claimed, vs last run, verdict) and **money-move table** in every record. Freeze an ad set until its move is read.
- `proposal-and-log.md`: "Since last time" opens the proposal; the four verdicts defined; final verdicts appended to `decisions.md`; § The yardstick in the brain — chapter 20 `target_cpa` / `target_roas` and the operating plan (daily cap, protected entities, **emergency stop → pauses and fixes only**) read first, changes proposed for the marketer's yes (targets via save-learning's fact path; a stated daily cap via `brain_save` operating_plan), never from a scheduled run.
- SKILL.md: brain-first read; Load the last run; step 2 is the outcome check; step 4 writes the recipe; step 10 saves the run; proposal file saved every run (`ads/campaigns/<slug>/proposals/`). Atoms, moves.md (freeze, failure mode 18), reading-results (subtract counts, never ratios), skill.meta.json, server-needs #11, #26–29, Test 8.

**Adversarial critique (subagent, effort high):** a scheduled weekly run of run-paid-campaigns with nobody present checks last week's 40% raise; analyze-performance then reads the outcome; 26 Oct and 2 Nov follow. Verdict before fixes: MAJOR REMAINING 9 (6 here and in run-paid, 3 in analyze), plus 3 in the shared run-memory atom (sent to its owner).

| # | Finding | Fix |
|---|---|---|
| 4 MAJOR | Freeze vs "rotate before decay" contradicted; a fatigue call the day after a 40% raise. | Fatigue in a frozen ad set → hold with a click-rate trip-wire; a trip overrides the freeze and declares the earlier move `can't tell`; no fatigue call in the week after a 30%+ step (run-memory.md, moves.md, draft-moves). |
| 5 MAJOR | Recipe's "every ad id in the ad set" had no source (`meta_read` sees Goose ads only), so the brand's own ad would be missed. | Ad list from the marketer's export or words at staging; unknown → "mixed", export required. |
| 6 MAJOR | Fallback used the approval date as the post-window start; claimed `change_status` returns an applied date (unconfirmed). | Applied date from a source showing the change; else assume approval + 1, skip one more day, label "applied date assumed"; recompute review-by once known (server-needs #27). |
| 8 MAJOR | "An export that never came" → `Not run`, so every scheduled run would be Not run. | Not run only for a stale sync or missing connection; a missing export is a no-export run with Numbers and coverage. |
| 9 MAJOR | The server deletes an approved move's bullet and a mid-week record could drop R5, losing its recipe. | Every unclosed money move is copied with its full recipe into every record until a final verdict. |
| 1 (atom) MAJOR, mitigated here | A `readout to save` and an ask from a scheduled run had no return path. | The paid record carries the readout (field, value, request key) and asks with owner `marketer`; analyze-performance's Monday read, with the marketer present, asks them and saves the readout; answers land in `reports/performance/inputs/`. Atom fix requested from the owner. |
| 12 MINOR | A `too early` appended a block and could delete the check line. | Only final verdicts append; `too early` moves the check date. |
| 13 MINOR | Example raised a founder ad set by approval link, and reused `41c…`. | R5 is now a card the human applied; ids unique. |
| 14 MINOR | Dates (21 Oct a Wednesday) and only the 7-day case. | Readable-from example gives both 7- and 14-day cases and the Monday run that reads each. |
| 15 MINOR | Low-spend ads can drop from one of the two trailing reads. | Every stored ad id must be in both reads, else `can't tell`. |

**Pushed back — finding 7** (`evidence` should be `report:<id>`, not `report:<YYYY-MM-DD>`): the Round 6 contract check read the server's harness code and found `report:<YYYY-MM-DD>`; the tool description says `<id>`. Not changed on one reviewer's reading; logged as server-needs #29 to confirm.
**Not fixed (pre-existing example hygiene):** the proposal example still says "week of 13 Oct" (a Tuesday in 2026); harmless to the logic.
Status: all majors in this playbook fixed; not re-reviewed by a second critic (no evals, as asked).

## Round 9 — Codex review of PR #322 (2026-10-20)

| # | Finding | Fix |
|---|---|---|
| 1 MAJOR | `references/run-memory.md` assumed applied = approval + 1 day when only the approval date was known, against run-memory's source-only rule; both windows could shift into a false verdict. (Round 8's fix 6 introduced it.) | Without a sourced time for when the budget changed: `can't tell (applied date unknown)`, ask for Meta's change history or a by-day export, carry the move; windows are never built from an assumed date. server-needs #27 and Test 8 updated. |
| 2 MAJOR | The weekly schedule pointed the server's worker at skill files it doesn't have. | `references/run-memory.md` § Setting up the schedule: method copied to `ads/method/` (SKILL, references, atoms, shared atoms, versioned), automation created paused with a self-contained prompt: paths, reads and writes, approval gates, the spending rule, caps and emergency stop, and "never pause, apply, publish, launch or accept; stage proposals only". SKILL Output line and skill.meta.json updated. |
| 3 | Direct `brain_save` operating-plan write. | Now allowed by AGENTS §8 (20 Oct ruling) for the owning playbook; the text cites it, says the save is found, never confirmed, waits for the marketer's yes in the app, and the brief's number stays in use until confirmed. |
| 4 | Ids. | Matches the shared rule (a stable source id is the record id): `R<n>` is the id; a dated id only where no `R<n>` exists. Wording aligned. |

## Round 10 — second Codex review of PR #322 (2026-10-20)

Confirmed: Round 9's four fixes. Two new majors, both fixed:
| # | Finding | Fix |
|---|---|---|
| 1 MAJOR | The scheduled prompt copied files to `ads/method/references/…` but told the worker to read `references/…` from the workspace root. | Every path in the prompt is now a full workspace path (`ads/method/references/run-memory.md`, `ads/campaigns/<slug>/state.md` …), plus one line mapping the copied files' relative links (`references/`, `atoms/`, `../../atoms/…` → `ads/method/shared/`) and saying links to other playbooks aren't copied. |
| 2 MAJOR | `proposal-and-log.md` let a found or waiting target be "used" as the yardstick, against SKILL step 4. | Found or waiting targets, caps and stops appear only under "Decisions for you" and never compute a verdict, scale step, pacing or ceiling, or stage a move until confirmed. A pending stop or a pending lower cap may only block increases and launches; it never authorises a change. SKILL step 4 and the scheduled prompt say the same. |

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

### Works without GooseWorks (Akhil's ask, validated by a marketer reviewer)

| Finding | Fix |
|---|---|
| Step 1 stopped with "Connect GooseWorks first" although Meta has its own connector; session 9617ba6d treated "Meta not connected" as a blocker even though step 3 says Meta can run as instructions (Akhil: right) | Step 1 picks a mode: GooseWorks (a connector, if present, fills the reads GooseWorks lacks and changes what it has no lever for) · ads connector only (local mode, guide §5) · neither (local mode on exports, cards). A missing connection is never a blocker. |
| The agent overclaimed "I can build the campaign, ad sets and ads in your account directly" while meta-levers.md says new GooseWorks campaigns are Traffic-only, Facebook placements | Step 3: three lever types (GooseWorks · connector · written instructions); never claim a lever the run lacks; on a conversion goal the first message states the Traffic / Facebook-only limit and the alternatives (existing conversion ad set, a paused conversion campaign through their connector, or set up by them). Test 1 telltale added. |
| No safe way to change an account through a connector | Guide §3 rule (one card and one named yes per change, a bare "yes" never counts, one call, read back, created paused, ≤ +30% per step, no deletes, list uploads or spending-limit changes, weaker than the approval page said once); `meta-levers.md` § With an ads connector; `apply-and-log` steps 9–11 (re-read before the call, read back, log in `decisions.md`); health gate reads tracking and disapprovals from the connector. Test 4b added. |
| Memory without GooseWorks | Local folder `gooseworks-local/<brand-slug>/` on the same paths; the agent writes every `decisions.md` block; the approved local plan is the brief; host scheduler only, scheduled runs only stage. |
| `references/run-memory.md` linked `../run-memory/SKILL.md` (broken from `references/`) | Now `../../../atoms/…`. |
| Consistency pass: where run records go without GooseWorks | `references/run-memory.md`: one local-mode line (same path under `gooseworks-local/<brand-slug>/`). |

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| HIGH: video ads could launch with no claims check — make-video-ads (held back) used to check video claims, so "Claims were checked there", meta-levers' creative line, the approval gate and Test 7 were false for videos and the marketer's own files | Step 5 and `launch-and-graduate.md` § Health gate item 3: creative no released maker checked (GooseWorks videos via `video_read` with their scenes, the marketer's own files, a reused ad) goes through the claims gate (copy, spoken lines, on-screen text, end card) and ad-policy check before staging, plus one question on AI-made people or voices (the label goes on the card); unreadable script or text → "not claim-checked", no launch until the marketer confirms the lines. False sentences fixed (health gate, meta-levers creative line, approval gate). Test 7 rewritten (an end-card claim cut, the own file held). `shared_atoms` + claims-gate, ad-policy-check. |
| The connector rule was written out ~7 times and drifted (the guide made the connector's confirm step mandatory and lacked "switching on is its own yes" and "never an object GooseWorks has a lever for"; the description said connector changes were Meta-only while written-instructions and plan-campaign allowed any platform) | Decided: any ads platform's connector, same protocol. One canonical text: `references/meta-levers.md` § With an ads-platform connector (any platform) — account check, never-list, card, named yes, re-read, one call + the connector's own confirm step if it has one, ≤ 30% steps, created paused, switching on its own yes, read-back, log. `apply-and-log` 9–11 now hold only the bookkeeping; the guide §3, data-access, SKILL steps 1, 3, 8, the description, written-instructions and plan-campaign's channel-decision / unit-economics point to it. Test 4b: the same pass lines with another platform's connector. |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Description 1,020 chars (at the limit), mechanics inside | 656 chars: identity, one trigger per branch (adds "the account got restricted" for routing case R58), the two Not-fors. |
| Step 4 restated `atoms/draft-moves`; steps 7–8 restated `atoms/apply-and-log` | Each step names its atom section plus a completion check. |
| Step 2 restated the outcome-check mechanics held in `references/run-memory.md` and `proposal-and-log.md` | Keeps the four verdict words and the "since last time" lines; points to run-memory § Start. |
| Step 10 (save the run) happened inside step 7 | Folded into step 7; step 10 deleted. No other file referenced step 10. |
| Before you start 3 restated Meta limits (Traffic objective, Facebook placements) | Points to `references/meta-levers.md` only. |
| Copied setup, workspace clause, brain-read preamble, plain-words line | Guide setup line (job line "run your ads"); kept the mode picks, the "can't log Meta outcomes without a workspace" line, chapters 20/15/23 and the operating plan, and budgets in the marketer's currency. |
| Approval gates restated apply-and-log's approval mechanics | One pointer bullet to apply-and-log + meta-levers; the gates unique here kept (graduation, claim-checked creative, both readings). |
| Scheduling copy | "Set it up by guide §3 Schedules"; local-mode scheduler line dropped (guide §5 holds it). |
| Done when was one long sentence | Four checkable bullets ("every approval link shown was returned by the server", baseline recipe and check date per move). |
| One name for the person | "the human"/"founder" → "marketer" in atoms and references (incl. log examples "Decided: marketer …"); "Founder story" ad name kept. |

Reactive branches not moved (item 3, later).

## 2026-10-20 — Codex review round 1

| Finding | Fix |
|---|---|
| #8 Step 7 pointed to apply-and-log's Stage, which was the GooseWorks path only, so a connector-only run would try to create approval pages | apply-and-log now picks steps by each move's lever: GooseWorks levers 1–8; connector levers 1, 2, 4 then 9–11; written instructions 1, 2, 4 (no tool call) then 7 on "done". Local mode has only the last two and calls no `gooseworks:` tool (no ids in a local `state.md`). Step 7 and Before you start 2 and 7 say so. |
| #10 An accepted weekly schedule always led to `automation_upsert` | Recurring: created by marketing-guide §3 Schedules (local mode: the host's scheduler, or "not available"); `references/run-memory.md` § Setting up the schedule marked GooseWorks-only. |
| #14 The proposal had its own shape (High / Medium / Low, no decisions, exclusions, gaps or sources), scheduled runs sent it through write-report and interactive runs didn't | One template in `references/proposal-and-log.md`, in write-report's shape: In short; Decisions for you (near-threshold calls, graduation options, waiting targets, unknown statuses); The story (Checks and pacing, Since last time, This week, Your top ads); What to do (the approval bundles); What we're not doing; What we couldn't check; Sources with source skew; how sure as confirmed / likely / first look. New § Delivery used by both apply-and-log step 4 and the scheduled run; the scheduled prompt asks for the same shape. `moves.md` uses the same certainty words. |
| #1–3, #11 (shared, claims-gate) local claims could be reused when declined, could not be withdrawn or narrowed, lost their proof, and had no separate-approver path | Fixed in claims-gate (`local-claims.md`). New Test 4c: a declined, an out-of-scope and a proof-gone row are all cut across runs; a "yes" in chat when Dana approves writes pending rows only. |

Second pass (independent review of this fix, effort high):

| Finding | Fix |
|---|---|
| The baseline audit's "Account at a glance" block sat on top of the first proposal, ahead of In short; What you get and `moves.md` still described a proposal "header" | The block is the first section of the story (`### Account at a glance`), its main finding in In short; What you get, "What to do: approve in three bundles" and `moves.md` ("Checks and pacing") match the new template. |
| Step 7's Done-when needed server approval links, which local mode never has | "(GooseWorks levers)". |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| B3 Local mode still reached `meta_read`, `push_status`, `video_read` and GooseWorks pushes in step 0, the baseline audit, reading results, run memory and launch | New `references/local-mode.md`: one table of what replaces each GooseWorks read and lever (connector date-range reads or exports, local `decisions.md` blocks and connector read-backs, route 3 or paused connector launches, the marketer's own creative). Pointers in SKILL.md (Before you start 1, step 0, step 5, Output), `baseline-audit.md`, `reading-results.md`, `run-memory.md`, `launch-and-graduate.md` (routes 1–2 marked GooseWorks only) and the health-gate and weekly-read steps. |
| B5 Tired or rejected video ads went to "whoever makes their videos"; metadata named make-video-ads | Offered as the next job with the goose-video skill (without GooseWorks: whoever makes them), in SKILL.md and `moves.md`; unreleased producer gone from `skill.meta.json`. |
| B6 The proposal had facts without dated, clickable sources | A Source column in This week, source links in Checks and pacing and Since last time, a linked Sources list, and the rule (write-report §1). |
| B1 (shared) A local claims approver could not be changed safely or carried into a hosted chat | Fixed in claims-gate. New Test 4d: the approver changes, the old one's later yes doesn't count, and pasted rows without the history fail closed. |
| B10 `skill.meta.json` said `foundation/guide §5` | Now the marketing-guide skill reference. |
