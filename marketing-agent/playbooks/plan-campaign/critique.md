# plan-campaign — critique log

Every round: finding → fix, or why rejected. Critics are subagents; none read old skills.

## Round 1 — pre-write scope + depth (one critic, senior strategist lens, effort high, 2026-10-16)

### Scope (MAJOR)

| # | Finding | Fix |
|---|---|---|
| S1 | Unit economics never derived; run-paid-campaigns asks for allowable cost downstream of the plan that spends against it. | Plan owns the **economics box** (contribution/order, payback window, allowable CAC, target CAC, break-even ROAS) per company type; siblings inherit it. `references/unit-economics.md`, step 2. |
| S2 | Goal-chain math, forecast and renegotiation case have no process. | Step 2: baseline → incremental target → orders → sessions → spend per leg; three scenarios; every assumption labelled; renegotiation case structure (gap, what each lever buys, recommendation). |
| S3 | No per-test success criteria; breaks analyze-performance (calls tests against them) and run-paid-campaigns (stages against "structure and targets"). | Test plan table requires hypothesis, variable, cells, $/cell, readable threshold, end date, primary metric, decision rule per outcome; plus a **paid structure** line per paid leg. `references/budget-and-tests.md`. |
| S4 | Replan monthly only; no event-driven triggers. | Brief pre-commits **replan triggers** (stock cover, CAC > allowable +30% post-learning, account restriction, competitor move on the date, tracking break, date slip, budget cut, early winner); **trigger replan** mode revises only the affected leg. Replan inputs include the change log and learnings. `references/replan.md`. |
| S5 | Launch craft missing (pillar 10). | Launch tier T1/T2/T3 sets budget and channel count; phases pre-launch / launch day / 48-hour watch / sustain / debrief; message tested on a few customers (human); enablement row on asset list; debrief on calendar. `references/launch-and-calendar.md`. |
| S6 | DTC-shaped; gaps for SaaS (pipeline chain, cycle vs date), apps (install→retained, ASA, SKAN), marketplace sellers (ACoS/TACoS, listing readiness, deals calendar), local (capacity ceiling, radius, offline attribution), services (referrals, capacity); channel roster incomplete. | `references/company-types.md`; channel roster expanded with conditional rows per type in `channel-decision.md`. |
| S7 | Budget covers media only. | Budget split carries media, production, creator fees + seeding, discount cost, tools, and a 10–20% **held reserve**. |
| S8 | Lead times don't drive the calendar. | Lead-time table (statics 2–5d, video 5–10d, creators 3–6w, PR 4–8w, SEO 3–6m, tracking QA by T-7); assets that miss their slot are flagged or cut. |

### Scope (MINOR)
- M1 measurement plan per leg (UTMs, codes, events, window, MER target, "how heard") → added as a brief section; analyze-performance reads it.
- M2 offer line (none / existing / needs plan-offers; margin impact; promo collision) → brief section.
- M3 read and respect the brand's promo calendar → step 1 reads it; collisions flagged.
- M4 founder hours per leg → channel-decision "Founder hours".
- M5 sign-off on goal-chain assumptions, not just the split → approval gate added.
- M6 scope creep: CTV/AI-assistant rows are one-liners; competitor input is read-only from research-competitors' digest → applied.
- M7 Done-when adds "the numbers reconcile" → applied.

### Depth
Adopted: the brief structure (header with input status, economics box, goal chain + scenarios, channel table with binding lens + flip condition, phased split, test table, backwards calendar, asset table with claim IDs, replan triggers); platform minimums (Meta ~50 events/ad set/week, Google tCPA ~30/30d, LinkedIn $3–5k/month floor, TikTok daily minimums); readable-test math (small budgets test big swings); creative volume (~8–15 net-new/month per ~$10k Meta); 70/20/10 + reserve; base rates labelled as rules of thumb; failure-mode list; seven-lens channel scoring with verdicts Run / Test / Later / No.

Rejected / adjusted:
- Critic's T-shirt "Later" vs spec's "doesn't fit": kept four verdicts (Run/Test/Later/No) — "Later" with a flip condition is more useful to the monthly replan than a binary.
- "Message tested on a few real customers": the agent cannot run that; it is written as a human step on the calendar, not something the playbook claims to do.

### Overlap noted for the consolidation pass
- Claims check / approved-claim lookup also lives in make-static-ads and make-video-ads.
- The economics box is read by run-paid-campaigns and analyze-performance; a shared atom later.

## Round 2 — adversarial run (effort high, 2026-10-16: DTC skincare serum launch $8k; B2B SaaS $49/seat "100 customers" on $5k; pre-revenue app $2k "as many installs as possible") + contract check across the three playbooks + staging run

### MAJOR — all fixed
| # | Finding | Fix |
|---|---|---|
| A1 | Ask list DTC-shaped and asked before the company type was loaded → second round of questions or invented inputs (baseline, founder hours, creative capacity, tracking, promo calendar, repeat rate, B2B and app specifics). | company-types loaded **before** the ask; every type has an "Ask if missing" list plus a common list; onboarding fields read first. |
| A2 | Non-numeric goal ("make it big") loops on "ask again"; "as many installs as possible" never triggers the renegotiation case. | Step 5 of Before you start: offer 2–3 concrete goal options from the brand's own numbers, steering vanity metrics to business ones; the founder picks. |
| A3 | Step 2 forecast per-leg results before channels existed. | Step 2 = economics + top-down implied-CAC check; per-leg targets, scenarios and the renegotiation case moved to step 5 (goal-chain atom split into part 1 / part 2). |
| A4 | Repeat rate never asked → wrong Meta verdict for replenishable products. | In the DTC ask list. |
| A5 | New product has no approved claims; claims borrowed from other products; concepts blocked. | Applicability rule stated; "claims signed off — learn-my-brand" calendar row by T-30 and a dependency; learn-my-brand added to hand-offs. |
| A6 | Worked test example hook ("still breaking out?") violates Meta's personal-attributes policy and the acne/drug-claim line. | Example replaced; step 8 attack and the angle table now check personal-attributes and regulated-claim risk. |
| A7 | Paid-structure example ("purchase-optimised $180/day" via GooseWorks levers) can't be built: new Meta campaigns are Traffic-only with lifetime budgets. | GooseWorks Meta levers defined precisely in budget-and-tests §5 and the execution lens; examples rewritten (push into existing ad set; Traffic angle test; Google as cards). |
| A8 | B2B funnel wrong for self-serve. | B2B split into self-serve (signup → activated → paid, ARPA × margin × payback) and sales-led (pipeline). |
| A9 | Pre-revenue app economics box unfillable → invented payer rate. | Pre-revenue branch: no allowable CAC; founder's provisional cap per activated user; zero paid is the default. |
| A10 | Reconcile formula said ×. | ÷ everywhere. |
| A11 | Production line priced credit-made assets in dollars. | Counts, priced in credits at make time by the makers; dollars only for freelancers/shoots. |
| C1 (contract) | "Approved claims" read from `knowledge_search [claim]` and kit proof points — contradicts learn-my-brand, whose sign-off marker + "Approved claims" rules + dated Brand record define approval (staging: all 7 "approved" claims were research-made press quotes). | Approved = learn-my-brand's sign-off only; no marker → all candidates, "needs proof (sign-off)"; kit proof-point allowance deleted; concept proof requires both the sign-off and server applicability. |
| C2 (contract) | Research outputs read from the wrong place (research-market and research-competitors write `research/market/*.md` and `research/competitors/*.md` + brand documents) → false "research not done". | Reads those files (coworker scope) with `knowledge_search [document]` fallback; meta `reads` updated. |
| S1 (staging) | `unknown`-applicability claims refused as concept proof. | Built into write-back. |

### MINOR — fixed
Learning floor is now a written judgment call; hybrid DTC + retail guidance (sell-through, destination choice, retailer calendar); brandType → company-type mapping; approvals check moved to Before you start and repeated before concept edits; Status line set on approval and version bumped; `status: planned` only from draft (active stays active); SaaS, app and waitlist base rates; minimums for conditional rows (ASA, Reddit, Pinterest, sponsorships); conditional rows only for the brand's type; "goal push to a date" mode; credit cost wording ("each run uses credits; exact cost not shown"); reserve as % of media and committed to the best test when all is unproven; reference load steps corrected; research check uses "or"; stale competitor dossiers flagged; chat shows five lines + key tables, the full brief saved as a draft on the record; asset list, tier and headline added to approvals; intake in the human's words; offer cost only for a named offer; implied-CAC threshold now judgment; `budget_cents` = total budget; "matching campaign" defined; one UTM convention shared with run-paid-campaigns and analyze-performance; change-log slug recorded in the Status line; trigger-replan reads fired triggers from analyze's report and run-paid's state.md; T+2 / T+30 calendar rows reassigned to the pulse / the next weekly read; `get_started` used for setup only, its generic next step overridden.

### Not changed (with reason)
- "Description ~210 words, trim to ~60": trimmed to ~150 words; trigger phrases must stay (they are how the playbook is found) and §5 allows ≤ 1,536 chars.
- "Atoms add little beyond references": kept — they are the hidden step procedures (§3), references stay the craft; the duplication was reduced by moving procedure detail out of SKILL.md.
- Saving a draft before approval: kept (free, reversible, lets the human read the full brief at the link instead of a 15-section chat dump); it is skipped when creative plans are pending.

## Round 3 — final round (effort xhigh, 2026-10-16)

Critic verdict: MAJOR REMAINING: 1 — fixed:
| # | Finding | Fix |
|---|---|---|
| M1 | Step 9's draft save would overwrite the approved `brief_md` of a live campaign during every replan, so run-paid-campaigns and analyze-performance would run on an unapproved plan, with no restore on a no. | Draft saved to the record only for a new campaign (or one whose brief is itself an unapproved draft); for an approved live campaign the draft goes to the workspace `plans/<slug>/draft-v<N>.md` and `brief_md` changes only after the yes. Test 1 #7 aligned. |

MINOR fixed: one message (research gap + missing inputs + goal options together); partial answers become labelled assumptions (only goal, budget, date block); business facts re-read from the last brief and analyze's definitions; step 2 flags-and-continues, the case lands at step 5; claims sign-off at T-30 everywhere and a "product record + photos by T-35" row for uncatalogued products; atoms point at research files; `## Audience and message` section holds segment and headline; budget examples corrected ($3k/month can't fully feed one Meta ad set at $25 CPA; T1 vs Traffic angle test separated; one Traffic campaign per cell when $/cell must hold; Facebook placements only); retail legs get their own allowable or are labelled halo; search ad copy and keyword lists handed to make-content as asset rows; `tools_load` before concluding a tool is missing; `brand_read` learnings fetched in a second call; installs-insisting founder handled; tier "n/a" outside launches.

Not changed: "get_started untested with cards on" — the staging session runs in a no-cards client; the playbook uses get_started for setup only and says its steps override the generic next step. Logged for the consolidation pass.

**Status after round 3: no MAJOR open.**

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
- **Routing C2 (MAJOR):** "we sold out" removed from this description (it belongs to the paid run: pause first, replan second); "our CAC blew up — replan" kept, with "Not for reading this week's numbers — analyze-performance".
- **Contracts F4 (MAJOR, reader side):** the replan reads the `### YYYY-MM-DD — <title>` blocks of `decisions.md` (incl. the server's Meta outcomes) and the open recommendations in `state.md`.
- **Depth:** the brief opens with a **one-page decision** ("Do this first, because…" per §8, goal and scenario, where we run and don't, split, first test, what's needed this week); clearly irrelevant mandatory channels fold into one "Not relevant:" line, each with its reason; chat leads with the decision.
- **Claims (§8):** claims read through the shared `atoms/claims-gate/ATOM.md` (sign-off token `signed-off`, `Claims you may use —` facts, scoped sign-off when none); local claims procedure removed. Contracts M1 (status check missed "not yet signed off") answered by the atom.
- **Contracts minor:** reads work-with-creators' roster when a creator leg is Run/Test.
- **Coverage M3 / M7:** landing / product-page copy and sales or retailer enablement are explicit **human** hand-off rows (no maker covers them), not silent.
- **No ids to the marketer:** hand-offs and the asset list's producer column use role words; the change-log slug moved into an HTML comment.

Rejected / deferred (with reason):
- Coverage M2 (offer design), Gap-1 (search ad copy), PR/communities/affiliates, per-location plans: each would be new scope or a new playbook — pending with Akhil per the orchestrator; kept as human-executed rows.
- Routing C15 ("should we be on TikTok?" organic → run-organic-social): that is run-organic-social's description change; this description says "should we even run ads", which is the paid/mixed question.
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

2026-10-16 final contract check: references/channel-decision.md: the example channel row cites "buyer segments (customer research)", not a playbook name (the brief is read by the marketer).
2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; shared atoms moved to `shared_atoms`.
