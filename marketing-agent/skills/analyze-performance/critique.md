# analyze-performance — critique log

## Round 1 — pre-write scope + depth (one critic, senior analytics lens, effort high, 2026-10-16)

Verdict: the spec is five playbooks in one coat (weekly read, tracking audit, CRO audit, channel optimisation audits, monitoring). Only the weekly read is a want this agent can do well with today's data. The "referee" number (store/CRM revenue) is listed as live data but no tool fetches it — the biggest risk.

### Per-part verdicts and what we did

| # | Part | Critic | Decision | Why |
|---|---|---|---|---|
| 1 | Revenue join | KEEP-DEEP, human-provided | **Keep-deep.** Weekly **input contract**; source order: a store/CRM/analytics connector the host agent already has (Shopify, Stripe, GA4, HubSpot — the user's own, read-only) → an export file → pasted numbers. Missing → **claims-only mode**: every number labelled *claimed*, no MER, no call above low confidence. | Page 01a/01-what-the-agent-must-know: "let the customer's own agent bring the rest". |
| 2 | Metric-change digger | KEEP-DEEP as "the why" | **Keep-deep** with a fixed cause checklist; ruled-out causes stated; confidence per cause; fatigue/auction causes "candidate" when frequency/CPM unseen. | |
| 3 | Plumbing audit | KEEP-LIGHT as symptom flags | **Keep-light**: detect breaks from the numbers (claims ÷ store ratio jump, zero-conversion days, ROAS spike with flat orders, LPV/click drop); output symptom, likely location, what to check, and the fix when the cause is identifiable. Feed/disapproval status is read by run-paid-campaigns (it owns push failures); this report carries what run-paid-campaigns or the human reports. | The spec's run-paid-campaigns gate still needs a finished fix instruction where one can be written; where it can't, the instruction is "what to check". |
| 4 | Creative ranking | KEEP-DEEP | **Keep-deep** in angle → hook → format terms; minimum-spend gates; weekly coverage statement; `insight.available=false` → numbers only, no winner. Fatigue *trend* reported here; the fatigue *move* belongs to run-paid-campaigns. | |
| 5 | Email/SMS | KEEP-LIGHT | **Keep-light**: one row + flow vs broadcast share, revenue per recipient, unsubscribe/complaint rate; opens untrusted (Apple MPP); email-attributed revenue double-counts. Deep flow audit is email-lifecycle's. | |
| 6 | Organic | KEEP-LIGHT | **Keep-light**: top posts by multiple of the account's own median, hook named, flagged as paid candidates; no organic revenue attribution. | |
| 7 | Landing page / message match + funnel | MOVE | **Keep-light, rejected the move.** For the top winning and losing ads only: open the destination page (when the host can browse) and check product, offer, price, stock and headline match the ad; read the store funnel only if the human provides it. Fixes stay with audit-my-pages (backlog). | Spec asks for it and a mismatch is a top cause of weak conversion; the check is cheap and read-only. A "CTR up, click→purchase down" trigger points to it. |
| 8a | App cohorts | MOVE/park | **Keep-light as a named row + input ask** (MMP / RevenueCat / App Store Connect export when the human has one); "not measured" otherwise. | Consumer apps are in the ICP; keep the slot visible. |
| 8b | Google search-terms audit | MOVE to run-paid | **Split:** this playbook reads a pasted search-terms report and lists wasted-spend terms in its calls; run-paid-campaigns stages the negative-keyword instructions. | Reading is analysis; adding negatives is an account action. |
| 9 | Test calls + learnings | KEEP-DEEP | **Keep-deep** with readout standard and anti-noise rules (below). | |
| 10 | Monday report | KEEP-DEEP | **Keep-deep**, fixed shape every week. | |
| 11 | Monthly brand read | CUT | **Replaced** by a monthly **unit-economics mode** (MER trend, nCAC, payback, repeat) that feeds plan-campaign's replan; brand-search/SOV/citations are carried in only if listen-social or improve-search-visibility has written them. | No tool for brand-search volume; those siblings own it. |
| 12 | Daily pulse | CUT or move | **Keep-light, exception-only**: says nothing unless a threshold breaks (pacing ±15%, zero-spend or spend spike, a push failure/disapproval, a Goose ad's CPA past 2× allowable). Scheduling it (automation) needs the human's explicit yes. | Spec keeps it as interim until watch-and-alert; exception-only avoids over-reaction. |

### Scope gaps (MAJOR) — all applied
1. **Measurement contract** on first run (definitions, sources of truth, reporting week and timezone, revenue definition, attribution windows, weekly input checklist), stored in `reports/performance/definitions.md` in the brand's coworker workspace (no structured brain field exists — server-needs).
2. Unit economics: contribution after ads, MER, new-customer MER, nCAC, new vs returning; break-even MER = 1 ÷ contribution %.
3. Marginal vs average (what the last $1k bought).
4. Lag and maturity; restate last week; B2B leading indicators weekly, pipeline monthly.
5. Baselines: last week, trailing 4-week, same week last year; promo/launch annotations.
6. Confidence labels and minimum-n rules.
7. Coverage statement (share of spend and revenue the read sees; unmeasured channels named).
8. Incrementality recommendation when the stories disagree (geo holdout, spend step-down, Conversion Lift, post-purchase survey).
9. Calls carried forward and scored.
10. Data hygiene (test/wholesale orders, subscription renewals, refunds, currency/timezone).
Company types: B2B (pipeline by channel, cost per SQL/opp, payback), apps (cost per payer, retention — named gap), local (calls/bookings/codes from POS or booking export), services (monthly read, tiny n), DTC (marketplace halo, stock-aware calls, discount depth).

### Learnings log design — adopted
Fixed text template inside `brand_update patch.facts` (CLAIM / EVIDENCE / CONFIDENCE / SCOPE / SEEN / REVIEW BY / SUPERSEDES); kind mapping (do/dont only when replicated or high confidence; insight for medium; low never written); anti-noise rules (ended tests or 2+ week patterns only; no snapshots; one claim; search before writing; supersede old; ≤ 3 per week; review dates; must have been in a report the human saw). Open: whether `facts` written as agent_proposal land as pending — verified in the staging test (see tests/test-by-hand.md).

## Round 2 — adversarial run (effort high, 2026-10-16: DTC skincare with Meta+Google Shopping+Klaviyo+organic+Ulta; B2B SaaS LinkedIn+Google+HubSpot; pre-revenue app with non-Goose Meta installs) + contract check + staging run

### MAJOR — all fixed
| # | Finding | Fix |
|---|---|---|
| M1 | No channel roster → "every channel used is present" uncheckable; unreadable channels shown as "not used". | **Channel roster** in the contract, seeded from onboarding, briefs, change log, sibling files; confirmed once; the channel table iterates over it; unreadable = "used — not measured (send X)". |
| M2 | Referee hard-coded as store revenue — breaks pre-revenue apps, misframes B2B. | **Referee-by-company-type table** (DTC store/new-customer; DTC+retail with sell-through; B2B CRM by source + self-reported; apps store-console downloads + activation/D7; local bookings); claims-only fires only when that type's referee is missing and names its export; "measurement absent by design" becomes a plumbing flag with setup steps. |
| M3 | Creative ranked on the platform's optimisation event (crowns CPI / CPL). | Ranked on the type's business number; proxy-only → "cheap <event>, quality unknown": no winner, no learning, "test" not "scale"; B2B cost per SQL by campaign. |
| M4 | Overclaim ratio compared gross claims with net revenue; missing claimants silently dropped; retail ignored. | Like-for-like (claimed purchases ÷ store orders, or vs gross); "≥" floor when a claimant is missing; view-through share; "DTC MER" label; retail sell-through ask; retail/marketplace halo cause; Meta cuts capped at medium while retail is unmeasured. |
| M5 | Baseline columns (4-wk, LY) never asked for; cohort read's customer export never requested. | First run asks five weekly buckets + same week LY; later runs this week + restated last; "vs plan only" for new brands; monthly asks the customer-level export. |
| M6 | Up to seven asks per run; decisions lost (report saved before the story pick); a technical attribution question. | **One input message** (contract defaults pre-filled; only number/target, margin %, timezone asked), no mid-run asks, **one decisions block** at the end; on reply the report is re-saved with Decisions, the story pick recorded in `definitions.md`, scheduling offer recorded; attribution defaults pre-filled, never asked. |
| M7 | Daily pulse could give a false all-clear; scheduled runs can't collect exports. | Pulse opens with coverage, never all-clears unseen spend, push ids from `state.md`; scheduling warns it runs claims-only without a connector. |
| M8 | Learnings had no n floor; retirements invisible; write not confirmed. | Patterns must clear test n floors on referee-joined data; each proposal shows "retires: <old>"; `brand_read` confirms after write. |
| M9 | `meta_read` trailing windows used as the week; Goose ads double-counted with the export; contradictory maturity rule. | Exports are the week's source; `meta_read` identifies Goose ads and cross-checks; de-dupe by ad id; equal-lag comparison then restate. |
| C (contract) | Durable files only in the workspace; competitor digest / listen-social paths missing; video angles unread; slug source; margin's two homes; report layout. | `atoms/save-to-brain` registers the contract and monthly read as brand documents; paths named (`research/competitors/watch/`, `social/listening/`); `video_read` for video angles; slug from the brief's Status; the brief's Economics wins; layout `reports/performance/<date>.md`, `monthly/`, `inputs/`, `definitions.md`; input summary for run-paid-campaigns to reuse; angle-test learnings cite `A-NN` for research-competitors. |
| S (staging) | Learning writes refused as agent proposals. | `user_correction` + the human's quoted words. |

### MINOR — fixed
Export cheat sheet; non-Goose ads "unannotated"; report order fixed and labels per section; "Not used" / "Future rows" collapsed to one line each; contract amend path; budget pacing in the report; B2B < ~20 SQLs/month = weekly leading indicators, monthly pipeline by lead-created week; first run has no trend; founder LinkedIn as a rostered, human-supplied channel; T+2 48-hour read handled by the pulse.

### Not changed (with reason)
- "Move the pulse to run-paid-campaigns": kept here as the spec places it, but exception-only, coverage-first and handing every action to run-paid-campaigns.
- "Drop the atoms": kept as hidden step procedures (§3); SKILL steps now point to them in one line each.
- "~80% of numbers still typed by the founder": true and unfixable without connectors — server-needs #1–3, #16–17; the playbook minimises it (one message, connectors first, exports reused by run-paid-campaigns).

## Round 3 — final round (effort xhigh, 2026-10-16)

Verdict from the critic: MAJOR REMAINING: 2 — both fixed:
| # | Finding | Fix |
|---|---|---|
| M1 | DTC could almost never name a creative winner ("purchases unjoined" treated as a proxy) and the files contradicted each other (examples and test calls crowned winners on platform purchases). | Purchases are the DTC business event: rank within platform on purchase CPA, labelled claimed, capped at medium; high only when UTM-joined store orders or the account-level new-customer number moved with it. "Quality unknown" kept for upstream proxies only (installs, leads, sign-ups, ATC, LPV, clicks). Contract §1, SKILL step 4, learnings floor aligned. |
| M2 | Pulse and monthly asks went through the full Monday intake. | "Route first" at the top of Steps: pulse = Before you start 1–2 + pulse only; monthly = add the customer-level export to the one input message, then weekly + monthly. |

MINOR fixed: step references; revenue-join atom's overclaim formula now like-for-like; meta needs (`competitor_read` removed, `account_whoami` added); contract saved on first run (draft if unconfirmed); report file named for the Monday of the run; 13 months of weekly store totals asked once so the LY column stays real; Meta export window for first run; pulse adds zero-conversion-day and 3-day vs 28-day CTR checks; angle id column; `ads/videos/<project_id>.md` read; run-paid's inputs path aligned; roster re-checked each run; review-date retirements go through the decisions block; save-to-brain scope note; B2B, app and pulse test cases; AOV and SKU mix in the truth table.

Not changed: unnamed sibling paths for run-organic-social's calendar, work-with-creators' roster and improve-search-visibility's last check — those siblings' outputs were not final when checked; the roster seeding names them and the consolidation pass should pin paths.

**Status after round 3: no MAJOR open.** (Round-3 fixes were targeted at the two findings; not re-reviewed by a fresh critic.)

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
- **Contracts F1 (MAJOR):** the learning fact was ~460 chars and the server silently cuts at 300 (`LEARNING_TEXT_MAX_CHARS`) — now one rule per fact, `[learning YYYY-MM-DD A-NN] <rule> · scope · n · confidence · review <date>` (~180 chars), written through the shared `atoms/save-learning/ATOM.md` with read-back; the evidence block lives in the weekly report's Tests section. `do`/`dont` only for rules the human states; at most 3 per run; the 8-newest-facts limit noted. Server-needs #5 corrected (2,000 → 300).
- **Contracts F4 (reader side):** last week's recommendations are scored against the `### YYYY-MM-DD — <title>` blocks of `decisions.md` (run-paid-campaigns' and the server's).
- **Contracts F5c / §8 tags:** make-static-ads' batch files `ads/batches/<yyyymmdd>-<slug>.md` are read for creative id → angle, hook, test and picks; tags queried lower-case (`angle:a-07`).
- **Contracts M6:** listen-social's report is the newest file named exactly `social/listening/<YYYY-MM-DD>.md` (not items, replies or watchlist files). Exact path to be confirmed by the orchestrator relay.
- **Routing C3 (MAJOR):** "Diagnoses and recommends"; kill/scale/hold are **recommendations**; "Not for acting on the recommendations — run-paid-campaigns" in the description; the report's section renamed Recommendations.
- **Routing C5 (MAJOR):** "why did sales drop this week; sales are flat — what changed" added; also "how are my ads doing", "is my tracking working".
- **Depth / routing (hosted chat):** a **minimum useful read** (referee totals this week + last week and one ad export per paid platform → MER, new-customer cost, marginal read, creative ranking) asked first; **history once**, up to ~13 months, shorter accepted; big exports in a hosted chat → ask for summary views or totals, and if pasted, summarise by week / channel / campaign / ad without echoing rows.
- **Shared atoms:** local `atoms/save-to-brain` deleted; the contract (`versioned: supersede`) and monthly read (`keep-history`) go through `atoms/save-to-brain/ATOM.md`.
- **Coverage M1 (light):** marketplace referee (total sales by ASIN, TACoS, organic rank) and the Seller Central / Amazon Ads exports in the contract.
- **Contracts §2.3:** restated `meta_read` limits removed.
- **No names to the marketer:** "what to make next" producers are roles (static ads, video ads, content); replan triggers say "worth replanning".

Rejected / deferred (with reason):
- Coverage m2 (per-location split), outreach / creators beyond future rows, organic-search row — new scope pending with Akhil; they stay as named rows when the roster has them.
- Path relay from the work-with-creators session: the creator roster is `creators/roster.csv` (outcomes-ledger schema, wave results); reads updated.

## Round 7 — adversarial + contract critique (effort high, 2026-10-16, after the Round 6 fix pass)
Passed: YAML parses (844 / 967 / 963 chars, `>-`), routing splits as agreed, the server parsers (parseFrontmatter, closeRecommendation, findCampaignSlugs, appendDecision) accept the state.md / decisions.md example, atom paths resolve, learning examples ≤ 300 chars.
MAJOR found and fixed:
- run-paid M1: the decisions.md example had dates out of order → reordered; late-logged events take today's date and name their real date in Outcome.
- run-paid M2: launches never closed (`prepare_meta_ad_push` takes no `recommendation_ref`) and check rules vanished when the server deleted a bullet → a `## Checks due` section (server never touches it) holds every follow-up; launch/graduate bullets are closed by this playbook from push status, with an `Evidence: push:<id>` block if the server wrote none.
- analyze M3: totalling a big pasted Shopify CSV by eye in a hosted chat → never by eye; ask for the summary report and mark the referee not measured until it arrives; never derive new vs returning from an orders export; total in code when a code tool exists.
MINOR fixed: playbook/id names left in the brief template and brief atom (roles now); analyze reference paths to shared atoms (`../../../atoms/`); restated `rank_by` default and `goal`/`channels` enum text removed; learning example rewritten as a maker-actionable rule; the Monday report headline opens "Do this first, because…"; brand-crisis branch names still-open approval links ("don't approve these") and says scheduled emails/posts are paused separately; "CAC blew up" replans recommend reading the numbers first; loose line in plan Approval gates.
Not ours: `foundation/guide` not written yet (orchestrator); the makers still read `For:/Status:` rotation blocks instead of §8 request lines (make-static-ads / make-video-ads owners).
Verdict after fixes: no MAJOR open in plan-campaign, run-paid-campaigns or analyze-performance (targeted fixes; not re-reviewed by another critic).

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: batch-file path read as `ads/batches/<YYYY-MM-DD>-<slug>.md` (was `<yyyymmdd>`), matching make-static-ads (SKILL.md, skill.meta.json, references/creative-and-channels.md).
2026-10-16 final contract check: listen-social's report read as the newest `social/listening/<D>-report.md` (D = counting week's Monday), matching its writer (SKILL.md, skill.meta.json).
2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; shared atoms moved to `shared_atoms` as plain slugs.
2026-10-16 orchestrator ruling: bare `atoms/<shared>` path in server-needs.md converted to file-relative form.

## Round 8 — run memory and the Brand Brain (2026-10-19)

Ask (orchestrator, for Akhil): wire `atoms/run-memory` in, read `brain_map` first where the brain tools are listed (fallback kept), and keep the money-move results flowing run to run. Checked on staging first: `brain_map` on Personal Day (23 chapters; chapter 20 holds only onboarding answers so far; operating-plan sections as listed in `brain_save`).

What changed:
- `references/run-memory.md` (new): jobs `weekly performance read`, `monthly read`, `daily pulse`. Numbers: business truth, overclaim ratio, a **per-channel scorecard** and a **per-ad scorecard** (same keys and settled window as the paid run's), an angle history line, each vs last run. Start reads up to four weekly records back. **What worked** = held 2+ runs or won a test; **what to make next** = tiring multi-week winners first, nothing that already failed, unmade items carried. Experiment readouts (kind 23 `experiment_readout.<slug>-t<n>`) for Win/Loss only, never from a scheduled run; worn-out angles on the marketer's yes.
- A money move's result: the paid run's verdict (claimed) plus this playbook's **store check over the move's own windows** (truth), side by side; the store number decides.
- SKILL.md: brain-first read (chapters 18, 20, 22, 23); Load the last runs; steps 4–5 use the history; step 8 saves the run. Monday report opens with "Since last time"; creative ranking shows weeks won; calls carried forward use the four verdicts. skill.meta.json, Test 8.

**Adversarial critique (subagent, effort high):** a scheduled weekly run of run-paid-campaigns with nobody present checks last week's 40% raise; analyze-performance then reads the outcome; 26 Oct and 2 Nov follow. Verdict before fixes: MAJOR REMAINING 9 (6 here and in run-paid, 3 in analyze), plus 3 in the shared run-memory atom (sent to its owner).

| # | Finding | Fix |
|---|---|---|
| 10 MAJOR | The store check had no data path: the input message asked only this week and last, never the move's windows. | The one input message asks for daily store totals over every open money move's windows (named from the paid record); missing → `can't tell (store data for <dates>)`, carried; the report says which paid record it used (it usually runs first). |
| 11 MAJOR | The one run with the marketer present didn't pick up the paid run's asks or pending readout. | It asks the paid run's named exports, saves them to `reports/performance/inputs/` for the paid run, and saves the paid run's `readout to save` rows as stated. |
| 16 MINOR | It could mark a move done from the approval block. | Status and applied date only from the paid record; else "approved, applied date unknown". |
| 17 MINOR | Scorecard window differed from the paid run's. | Same settled `days: 14` minus `days: 3`; 7/28-day reads only for the fatigue trend. |
| 18 MINOR | Older-path calls (`knowledge_intent`, `active: false`) used with the brain listed. | Defers to save-learning's two paths. |
| 19 MINOR | The `-store` readout had no verdict condition. | Only when the store check gives worked / didn't work; not when the paid verdict is `can't tell (no ad-set view)`. |

Status: all majors in this playbook fixed; not re-reviewed by a second critic.

## Round 9 — Codex review of PR #322 (2026-10-20)

| # | Finding | Fix |
|---|---|---|
| 2 MAJOR | The Monday report / pulse schedule pointed the server's worker at skill files it doesn't have. | `references/run-memory.md` § Setting up the schedule: method copied to `reports/performance/method/`, automation created paused with a self-contained prompt (paths, reads and writes, claims-only rule, the spending rule, "read and report only; never apply, publish or spend; save no learning or readout"). SKILL approval-gates line, monthly-and-pulse and skill.meta.json updated. |

## Round 10 — second Codex review of PR #322 (2026-10-20)

| # | Finding | Fix |
|---|---|---|
| 1 MAJOR | The scheduled prompt copied files to `reports/performance/method/references/…` but read `references/…` and `definitions.md` from the workspace root. | Full workspace paths throughout the prompt (`reports/performance/method/…`, `reports/performance/definitions.md`, `ads/campaigns/<slug>/decisions.md`), plus the mapping line for the copied files' relative links. |

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

### Report top (write-report shape)

| Finding | Fix |
|---|---|
| Reports opened with "Do this first" before the reader knew what was researched, so the move couldn't be judged (Akhil; 4 marketer reviewers: keep the answer on screen one, but rest it on findings shown above it) | In short now: "What we looked at" (scope, sources, date, main limit) → 2–3 numbered findings with how sure (confirmed / likely / first look) → "So, do this first (because of 1 and 2)", naming the findings; a first-look base makes the first move the one that closes the gap (write-report §1) |
| In short stated provisional or first-look things as fact; counts described a different thing than the claim beside them; first moves assumed unconfirmed assets | write-report §3 checks, now blocking: nothing stronger than the body, every number counts exactly its claim, no unconfirmed asset in the first move (→ "confirm X" or a decision) |
| Monday report Headline led with the move | Headline: numbered findings with how sure, then "So, do this first (because of …)"; the lines above it already say what was read and what's missing |

### Works without GooseWorks, and the self-serve referee

| Finding | Fix |
|---|---|
| Step 1 stopped without GooseWorks although measurement-contract §4 already accepts the marketer's own connectors, read-only (Akhil, validated) | Step 1 offers local mode (guide §5); "tools that give data directly" now leads with connectors the marketer has (ads, store, CRM, billing, product analytics), read-only, never their write tools, each replacing its export in the one message. Test 2b added. |
| No referee for self-serve SaaS (plan-campaign's company-types has one) | Measurement contract §1: a **Self-serve SaaS** row — new paid accounts and activated sign-ups by source, from billing + product analytics; cost per sign-up is a leading signal only. Minimum read and export cheat sheet updated; Test 5b added. |
| `references/run-memory.md` linked `../run-memory/SKILL.md` (broken) | Now `../../../atoms/…`. |

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| Owner (Akhil, from email-lifecycle): playbooks that depend on the marketer's own tool never ask which one | Before you start, tools paragraph: the first run's one message asks which store, CRM, billing or analytics tool holds the referee unless known (the guide's "The marketer's own tools"): listed → read it; named, not listed → one line on connecting, then the export; none → two or three that fit, and that leg runs claims-only meanwhile. |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Before you start 5 restated `measurement-contract.md` §4 (minimum read, history, hosted-chat exports) | Pointer + "one message, nothing asked mid-run"; kept only what §4 lacks (first-run contract draft and roster, which tool holds the referee, "Not checked" exports, the paid run's needs). |
| The paragraph after step 5 re-explained the guide's own-tools and read-only connector rules | Kept only the GooseWorks read list; "no tool → that leg runs claims-only" folded into step 5. |
| What you get spelled out the whole Monday report | One line + pointer to `references/monday-report.md`. |
| Copied setup and brain-read preamble | Guide setup line (job line "read your results"); chapter numbers and every file path kept, plus the brand_read sections and knowledge_search tag. |
| Scheduling copy | "Set it up by guide §3 Schedules". |
| Out of scope named backlog playbooks (audit-my-pages, watch-and-alert) | "not covered yet". |
| Done when opened by restating the description | Opener deleted; the check kept. |
| Description 963 chars, deliverables list | 623 chars; one trigger per branch; Not-fors kept. |
| One name for the person | "the human"/"founder" → "marketer" in SKILL, atoms and references. |

## 2026-10-20 — Codex review round 1

Codex (round 1) reviewed the released set after the hand-test fixes. Findings for this playbook, and the shared fixes it relies on:

| Finding | Fix |
|---|---|
| #6 Local mode went straight into GooseWorks-only reads (brain, campaign record, workspace, creative tags, video reads), so a connector-only marketer could not get past setup | New `references/local-mode.md`: the local folder (brand notes, claims, the approved local plan, the contract and reports, the paid run's `state.md`/`decisions.md` and run records), then connectors and exports; every `gooseworks:` call skipped. Before you start 2, the GooseWorks reads line ("connected only") and Output point to it. Test 2b now checks "saved in this folder" and no `gooseworks:` call. |
| #10 An accepted schedule always led to `automation_upsert` | Approval gates: created by marketing-guide §3 Schedules (now mode-aware: GooseWorks automation, else the host's scheduler, else "not available"); `references/run-memory.md` § Setting up the schedule marked GooseWorks-only. |
| #12 The Monday report bypassed write-report: missing sections and sources, high/medium/low, internal ids (C1, T2, A-07) | Step 6 delivers through the write-report skill. `references/monday-report.md` rewritten in its shape (In short with what we looked at, numbered findings with confirmed / likely / first look and "So, do this first"; Decisions for you as the decisions block; the performance tables inside The story; What to do with at most six calls; What we're not doing; What we couldn't check; Sources with source skew). Headings other skills look up kept (Business truth, Two stories, What to make next, Learnings proposed, Replan triggers fired, `## Decisions`). `tests-and-learnings.md` § How sure now uses write-report's three words; the references and atoms that said medium / low follow it. The scheduled prompt asks for the same shape. Test 1 checks the shape and no ids. |
| #15 Step 2 required `ads/videos/<project_id>.md`, which only the unreleased make-video-ads writes | Removed from the required reads; `video_read` gives videos' angle and hook names, a video without them is unannotated, and the older note is read only if it exists. |
| #5, #9 (shared) run-memory, save-to-brain and write-report still called GooseWorks in local mode | Fixed in those skills (local branches that call no `gooseworks:` tool; "saved in this folder", never `file_url`). |

Second pass (independent review of this fix, effort high):

| Finding | Fix |
|---|---|
| "Who takes what" and `creative-and-channels.md` still said "we don't make video ads yet", against Out of scope's goose-video | Both now offer video items as the next job with the goose-video skill. |
| The example In short was within 3 words of the 150-word cap | Trimmed to about 120. |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| A15 (partly) `skill.meta.json` still named make-video-ads as the writer of `ads/videos/<project_id>.md` | Reads: `video_read`, a video without names is unannotated; the unreleased producer is gone from reads and writes. |
| B4 The pulse and its schedule were GooseWorks-only (`meta_read`, `push_status`, `automation_upsert`) | `monthly-and-pulse.md`: inputs by mode (local: the ads connector over 1–3 days, else today's export; nothing to check without either), the monthly read saved by the local branch, and scheduling by marketing-guide §3 (local: the host's scheduler, or not available). `creative-and-channels.md`'s data line points to `local-mode.md`. |
| B5 Video routing still said "we don't make video ads yet" | Done in round 1's second pass; metadata now matches. |
| B6 The Monday template had facts without dated, clickable sources | Source links beside each material fact (section source lines, a Source column, inline in calls and make-next), linked Sources list; the rule points to write-report §1, which now says an export links to the marketer's own file under a readable name. |
| B8 "Learnings proposed (saved to your brand…)" was wrong in local mode | "kept only after you've seen them". |
| B10 Meta descriptions said `foundation/guide §5` | Now the marketing-guide skill (`../marketing-guide/SKILL.md`) §5. |
