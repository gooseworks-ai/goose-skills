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

## Round 8 — Akhil's hand test (18 Oct, GooseWorks, staging) + Sonnet dry-run findings

What the hand test showed (transcript read in full, beyond Akhil's list):
- First question was a seven-part form (funnel rates, churn, margin, plan prices, tracking, hours, research) — "What type of question is this?"
- Never asked which product or offer.
- Asked before looking: Meta connection, social accounts, onboarding (who makes ads, platforms) and the site's pricing were never checked; asked a technical question (signup event, UTMs).
- Went into email without saying the plan covers every channel.
- After approval it went on to request ad generation itself, and filled each concept's proof with unsigned kit product copy to get the quote — a claims-gate breach and out of scope.
- The plan lived only as campaign-record text; no readable file, no link.

Fixed:
- **Look first** (`references/intake.md` + SKILL Before you start 2): brand, products and prices, onboarding, Meta, social accounts, campaigns, pending creative, email program and calendar, performance definitions, research files, claims, and the live site — all before the first question.
- **Ask like a person**: one short message — what I found (2–3 lines), product and offer first, then goal/dates/budget in one sentence, then a statement of what the plan covers ("every channel that could work… say if you want ads only"), then at most one or two plan-changing gaps with a stated default. Never a technical question; margin, funnel rates, hours become labelled assumptions; company-types' "Ask if missing" lists became "look first; ask only what changes the plan".
- **Channels covered, said up front** — in the first message and as an In short bullet in the plan.
- **No ad-making**: asked to make or price ads, it stops and offers the next job in plain words; never requests generation or fills proof with unsigned text.
- **write-report**: the plan follows write-report §1 (In short first, point sentence per section, plain words, sourced and dated facts, no ids — tests numbered 1, 2) and §2 delivery (local clickable file, brand copy via save-to-brain with a link, campaign record); section headings siblings read are unchanged; jargon headings renamed ("If the goal needs changing"); link tags moved out of every asset row into one rule.
- Ambiguities from the re-run resolved: version numbering continues from the campaign record's brief version; margin is a labelled assumption unless the plan turns on it; sources that disagree → live site wins, said in one line; the found paragraph stays at 2–3 lines.
- meta.json: `atoms` local only, `shared_atoms` added (claims-gate, write-report, save-to-brain, spend-gate).

Sonnet re-run (Akhil's exact ask and answers, staging, 0 credits) — tests/test-by-hand.md "Re-run 18 Oct": passes 1–6 (6's ad-quote branch not exercised). Graded against write-report §3: top 5 lines say what to do and why ✓; a non-marketer can follow the In short and story ✓, but full link-tag strings in all 23 asset rows and the "Renegotiation case" heading were jargon → fixed above; no ids/paths/tool names ✓ (link tags aside); the local link opens ✓, the brand link is a one-hour presigned URL → noted in the closing line and server-needs #14.
Not changed: plan length (~29 KB) — the In short carries the 30-second read and the working sections are what makers and the paid run consume.

## Round 9 — schedules rule (AGENTS.md §8 "Schedules", 18 Oct)
The recurring offer was unconditional ("offer once to replan monthly"). Now the agent judges at the end of the run: a standing or always-on plan with live channels and weekly reads gets a monthly replan offer with its reason and cadence; a one-off push that ends on a date gets no schedule (at most one mid-point replan suggestion). Scheduled replans go through write-report and open with what changed; created paused per spend-gate.

## Round 10 — independent senior-marketer review of Akhil's feedback (AGENTS §2b; `marketing-agent-test/results/reviews/social-plan-search-review.md`, 18 Oct)

Verdicts on Akhil's points (the review's, checked here):
| Point | Review's verdict | Ours | What changed |
|---|---|---|---|
| The questions were weird (a form) | Right | Agree | Already fixed in Round 8 (look first, one short message). |
| Ask about products first | Partly right — for a one-product SaaS the bigger question is **who** the campaign is for | Agree | The first message now asks product and offer, then **audience second** (new people or people who already know you, and how many), before the money. For a one-product brand it states the product and asks only the offer. |
| An ads campaign turned into email | Right that it should span channels; say so up front | Agree | Already fixed (coverage stated in the first message and in In short). Founder outreach added to what's covered. |
| Tracking is never a question (our Round 8 fix) | Over-correction | Agree | One plain-words question when the goal is paid conversions and nothing on file shows attribution: "When someone upgrades, can you see what brought them?" Never jargon. |

What the operator missed, from the review, now in the playbook:
- **Buyer's season**, not only the seller's date — `launch-and-calendar.md` § The buyer's calendar; step 1; In short names it when it differs.
- **Retargeting frequency check** — `budget-and-tests.md` §2b (list × match rate, CPM → weekly frequency; cap near ~5/week); worked example ($450 / 1,000 emails ≈ 11 per person per week).
- **Founder one-to-one outreach** as a win-back channel — channel-decision table, self-serve SaaS live channels, first-message coverage line.
- **Tie the plan to the business result** — step 1 names it; every leg says how it moves it; SaaS legs carry tagged links to count signups.
- **Check the audience is the buyer** — channel-decision lens 1 and step 4: say once if a channel reaches peers or builders instead of buyers, then follow the marketer's choice.
- **Stale real-brand facts** — the GooseWorks example with $99/$299/$599 (SKILL.md, intake.md) replaced by a fictional brand (Fernly); a rule that examples are never a source of facts.
- **write-report's new shape** (Decisions for you, What we're not doing, ≤ 150-word In short, body ≤ 3,000 words, ≤ 6 moves) — template restructured; working tables moved to an appendix with their headings unchanged so siblings still find them.

Pushback (with reasons):
- **Frequency cap "about 5 per week" as a hard line:** kept as the default, but allowed up to ~8 when several fresh creatives rotate — retargeting tolerance depends on creative variety (our run-paid reading guide uses 5–8 for retargeting). A single number would over-cut small but well-rotated legs.
- **"GooseWorks' buyers are buried in BFCM creative all November":** right as a pattern, but the playbook must derive the buyer's season from the brand's research and personas, not assume it — the calendar section says "never assume them" and the BFCM line is one illustration among several.
- **Plan length (~29 KB acceptable):** the review accepted it; the newer write-report budget does not. Followed write-report: body ≤ 3,000 words, tables in the appendix.

## Round 11 — eval 2026-10-19-v2 (with skill 13/16 must-pass, baseline 11/16)

**Side-by-side read of the two transcripts.** Both arms were contaminated the same way: each found the approved Thanksgiving plan already on the staging brand (written by earlier hand tests) and largely re-delivered it, so neither actually planned. Per the orchestrator, contamination itself is ignored — but it exposed a real playbook gap: the skill arm pasted the stored v4 brief in its old shape (Decision/Status at the top), with the stale "$99/mo" price its own notes contradicted ($29/$59/$149 on the live site), research codes (T-06, T-03), and its old two-variable test. The skill's own economics, frequency and test checks never ran.

**Judge evidence checked against the transcript and output file** (to avoid chasing ±2 noise): every with-skill failure is real — no live pricing fetch (no web fetch in the transcript), research codes and "mode: goal push to a date" in the file (M8), long re-paste in the closing chat (S6/E12), test 1 changing subject and angle (E8), no retargeting frequency (E7). The baseline's M7/E4/E5/E10/S5 failures are also real (no In short, no per-leg sourced math, no levers, no maker/claim columns, no dated sources).

**Where the skill already beat the plain model:** In short with "Do this first" (M7), per-leg math with sources (E4), the case for changing the goal with levers (E5), complete asset rows with claim and maker (E10), dated sources (S5), the audience question asked well (turn 3: "lapsed users or new people?").

**Fixes (make that value show every run):**
- **An existing plan is input, never the deliverable.** Step 1: say a plan exists, then refresh it — re-check every number against today's look-first facts (live prices first), re-run the money math, channel/buyer check, frequency check and tests, write it in the current shape with one "What changed since the last plan" line. Never paste a stored plan. Test 8 added.
- **Live site fetch is required every run** (home + pricing via the host's web fetch or browser); live prices beat saved notes and old plans; with no web access, say so and label prices unconfirmed. (M1/E1)
- **brand_read kept small**: lean read, then the hero product's record, then learnings in their own call — the full-detail all-sections read overflowed (80k chars) and was skipped. One `tools_load` for campaigns, meta, social and files up front (the run never found `social_account_list`).
- **No research codes or visible "mode:" line** in the plan: codes translated into words; mode and slug moved into the hidden comment. (M8)
- **Closing chat is a literal three-line template** plus the approval ask; no tables, no re-pasted sections. (S6/E12)
- **Attack step names the five things a generic plan gets wrong**: today's-price economics, channel vs actual buyer, retargeting audience size + weekly frequency + cap, one-variable tests with an "unclear" action, the buyer's busy moment. (E7/E8 and the value the eval should see)

**Pushback on criteria (§2b):**
- **E8 "every test has one variable":** right as a default, but a founder with a ~500-person list sometimes runs a bundled "package" test (new subject + new angle) because there's only one send; acceptable if the plan says what it can't tell you. The playbook allows that with the caveat; a strict judge may still fail it.
- **E7 "cap if frequency exceeds about 5 per week":** kept as default, with up to ~8 allowed when several fresh creatives rotate (logged Round 10).
- **M6/E12 "chat did not re-paste":** right for hosts with files; in a hosted chat with no files write-report requires the full plan in the chat. The playbook says so; a judge should not fail a hosted-chat run for that.
- **S3 approval respected / contamination:** a run that finds an approved plan and refreshes it is behaving like a real marketer, not "duplicating" — the criterion should reward a refresh with re-checked numbers, not a copy.

## Round 12 — run memory and the Brand Brain (2026-10-19)

Ask (orchestrator, for Akhil): wire `atoms/run-memory` in, read `brain_map` first where the brain tools are listed (fallback kept), and keep the money-move results flowing run to run. Checked on staging first: `brain_map` on Personal Day (23 chapters; chapter 20 holds only onboarding answers so far; operating-plan sections as listed in `brain_save`).

What changed:
- `references/run-memory.md` (new): job `campaign plan`, subject = campaign slug (plans, refreshes and replans share it). The record holds the plan's **bets** — each leg and test with owner, read date and how we'll know on the business number. Start scores every bet from analyze-performance's and run-paid-campaigns' records (a leg that never ran is neither credited nor blamed; paid verdicts stay labelled claimed unless the store check confirms). On approval only: `target_cpa` / `target_roas`, `experiment.<slug>-t<n>` and approved reallocations as `decision.*` proposed to chapter 20 through save-learning's fact path.
- SKILL.md look-first: `brain_map` first with the chapters a plan needs (fallback kept); the last plan and how its bets did; step 3 and the refresh use the scored bets; the run record in Output. replan.md reads the run records and scores bets with the four verdicts. intake.md rows; Test 4b.

**Adversarial critique (subagent, effort high):** a scheduled weekly run of run-paid-campaigns with nobody present checks last week's 40% raise; analyze-performance then reads the outcome; 26 Oct and 2 Nov follow. Verdict before fixes: MAJOR REMAINING 9 (6 here and in run-paid, 3 in analyze), plus 3 in the shared run-memory atom (sent to its owner).

Findings touching this playbook: none of its own (the reviewer found its paths, job slugs and titles line up with both writers). Its chain depended on analyze-performance's findings 10–11 and the atom's finding 1 — fixed or mitigated there.

## Round 13 — Codex review of PR #322 (2026-10-20)

| # | Finding | Fix |
|---|---|---|
| 2 MAJOR | The monthly replan schedule pointed the server's worker at skill files it doesn't have. | `references/run-memory.md` § Setting up the schedule: method copied to `plans/method/` (incl. claims-gate), automation created paused with a self-contained prompt (paths, reads and writes, "draft for approval only; never overwrite the live brief, move money, publish, spend or save to the brain"). SKILL Output line and skill.meta.json updated. |

## Round 14 — second Codex review of PR #322 (2026-10-20)

| # | Finding | Fix |
|---|---|---|
| 1 MAJOR | The scheduled prompt copied files to `plans/method/references/…` but read `references/…` and `shared/…` from the workspace root. | Full workspace paths throughout the prompt, plus the mapping line for the copied files' relative links. |
| 2 (from the paid finding) | A found or waiting chapter-20 target could feed the plan's economics. | It is listed under "Decisions for you"; the economics never rest on it until confirmed (`references/run-memory.md` § Start). |

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

### Report top (write-report shape)

| Finding | Fix |
|---|---|
| Reports opened with "Do this first" before the reader knew what was researched, so the move couldn't be judged (Akhil; 4 marketer reviewers: keep the answer on screen one, but rest it on findings shown above it) | In short now: "What we looked at" (scope, sources, date, main limit) → 2–3 numbered findings with how sure (confirmed / likely / first look) → "So, do this first (because of 1 and 2)", naming the findings; a first-look base makes the first move the one that closes the gap (write-report §1) |
| In short stated provisional or first-look things as fact; counts described a different thing than the claim beside them; first moves assumed unconfirmed assets | write-report §3 checks, now blocking: nothing stronger than the body, every number counts exactly its claim, no unconfirmed asset in the first move (→ "confirm X" or a decision) |
| Plan In short | "What this plan rests on" (research and numbers with dates, the main gap) → goal, who/channels, money as numbered points with how sure → "So, do this first (because of …)", assuming no unconfirmed budget, proof or offer. Section headings unchanged (other playbooks read them); closing message and Done-when updated |

### Works without GooseWorks, economics and calendar

| Finding | Fix |
|---|---|
| The plan stopped without GooseWorks (Akhil, validated) | Before you start 1 offers local mode (guide §5): live site, the marketer's answers and their connectors (read-only); the plan is saved in the local `plans/<slug>/` in place of the campaign record. `intake.md` § Local mode. |
| "Start from scratch" dropped stored facts; "100 sign-ups a day" (~3,000 a month) went unflagged against "> 1,000 free users" in total | **First half rejected — owner was simulating a first run** (Akhil, 20 Oct): "start from scratch" now makes it a first run (no earlier plans, notes or run records; one line "Starting fresh: I won't use earlier plans or notes."; brand rules and approved claims still apply). **Kept:** a new number that contradicts what the marketer said earlier in this conversation is flagged before planning on it. |
| $200 per paying account against a $29.50 first month was called "normal" | `unit-economics.md`: self-serve break-even cost per paying account (margin × expected months retained) and payback in months, always in the economics box, with a worked example. |
| A Meta leg run through GooseWorks was priced on sign-ups, but a GooseWorks campaign is Traffic-only | `unit-economics.md` §3 and `channel-decision.md` lens 7: price it as cost per landing-page view ÷ the site's sign-up rate, or make "founder sets up a conversion campaign" a dated step; `intake.md` folds "can Meta see the sign-up too?" into the one plain measurement question. (The brief's wording "× the sign-up rate" was corrected to ÷.) |
| The calendar had no dated step for the offer going live on the landing page | `launch-and-calendar.md`: "offer live on the landing page (with any code)" is a T-7 dependency; no paid launch before it. |
| Retargeting an uploaded list: business emails match lower than the 40–60% rule of thumb | `budget-and-tests.md` §2b: ~30–60% for business emails, 40–60% for consumer lists. |
| `references/run-memory.md` linked `../write-report/SKILL.md` (broken) | Now `../../../atoms/…`. |
| Consistency pass: plan-campaign offers local mode but its metadata still required GooseWorks; the tracking question named only what brought a buyer in | `skill.meta.json`: `needs.gooseworks` optional (local mode) + `connectors_optional`, and a local-mode writes line, as in run-paid-campaigns / analyze-performance. Step 3: "Can Meta see when someone signs up?" when Meta ads are likely. `references/run-memory.md`: local path line. |

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| Stale report-top wording: test-by-hand item 4 and the 18 Oct staging line still said In short ("Do this first:") | Item 4 now: the plan passes write-report §3 (§1's shape); the staging line is marked as the pre-20 Oct shape. Done-when points at write-report §3 too. |
| Connector rule copies in channel-decision lens 7 and unit-economics §3 ("one named yes each, created paused") | Both point to run-paid-campaigns' one connector rule (`meta-levers.md`). |
| Owner (Akhil): "start from scratch / remove the old plan / I won't answer" was test setup simulating a first run, not a defect | The earlier "resets the strategy, not the facts" fix is rejected (row above marked). Step 1: "start from scratch" is a first run — no earlier plans, notes or run records, one line "Starting fresh: I won't use earlier plans or notes."; brand rules and approved claims still apply. Kept: a new number that contradicts what the marketer said earlier in this conversation is flagged. Test 8 added. |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Contradiction: SKILL Before you start 3 asked "Can Meta see when someone signs up?" as its own question; `references/intake.md` §1–2 folds Meta into the one plain measurement question | `intake.md` §2 is the single source; SKILL step 3 keeps only "≤ 4 plain questions, product and offer first" + the blockers line and points to it. |
| Look-first bullets (brain chapters, connections, plans, research, run memory, claims, live site) repeated `intake.md` §1 | One line: "Do `references/intake.md` §1 in full before the first message". Unique bits moved into §1: `competitor_read`, creators roster, claims-contract row, the `brand_read` call-split gotcha, the no-web-fetch fallback. |
| Copied setup (connection, `get_started`, workspace clause) and the plain-words line | Replaced by the guide setup line (job line "plan your campaign"); local-mode deviation and the tool groups kept. |
| Step 8 and 9 restated write-report §2–3 (word budgets, banned words, file path, `file_url` expiry) | Pointers to write-report §2 (topic `campaign-plan`) and §3; plan-specific saves and the 3-line chat close kept. |
| Schedule branch copied the "worker has no skills folder" text | "Set it up by guide §3 Schedules"; method folder and prompt pointer kept; branch left in place. |
| Done when: "the split is defensible" (not checkable) | "every budget line traces to a goal-chain leg and the lines sum to the budget". |
| Description 944 chars, deliverables list | 653 chars: what it is, one trigger per branch, the three Not-fors kept. |
| One name for the person | "founder"/"the human" → "marketer" in SKILL, atoms and references where it means the approver; kept as a role (founder outreach, founder hours, owner column, `human` hand-off role). Source label "human" → "marketer". |
| `intake.md` opened with a dated hand-test story | Cut to the positive rule (read first, then 3–4 plain questions). |

## 2026-10-20 — Codex review round 1

| Finding | Fix |
|---|---|
| #7 No complete local branch: setup loaded GooseWorks groups, and after the yes the playbook always checked server creatives, called `campaign_upsert`, wrote concepts and returned a server link | Before you start 1: local mode skips every `gooseworks:` call through write-back (tool groups only with GooseWorks). `references/brief-template.md` § Write-back has a local branch: the approved plan saved as the next version with its Approved Status line (the file run-paid-campaigns and analyze-performance read), the run record re-saved, one "Approved and saved in this folder" line; no creative check, campaign record, concepts or server link. New Test 4c. |
| #9 The chat line always said "also saved to your brand" | Step 9's line depends on the mode ("saved in this folder" locally; hosted chat without files says it isn't saved). Done-when has the local version. |
| #10 An accepted replan schedule always led to `automation_upsert` | Created by marketing-guide §3 Schedules (local mode: the host's scheduler, or "not available"); `references/run-memory.md` § Setting up the schedule marked GooseWorks-only. |

Second pass (independent review of this fix, effort high):

| Finding | Fix |
|---|---|
| Local mode said what it skips but not what it reads instead | Before you start 1 points to `references/intake.md` § 1's local look-first pass, which now lists `claims.md` (through the claims gate) and the local `plans/<slug>/` for step 1's existing-plan check. |

## 2026-10-20 — Codex review round 2

| Finding | Fix |
|---|---|
| B5 Video ads and photos were "human-executed / we don't make these yet" | Hand-offs, the closing offer, the brief-and-assets step and the calendar's lead times route them to the goose-video and goose-product-photos skills (offered as the next job); without GooseWorks the same rows go to whoever makes them; real creators filming stay with creators. Unreleased producer removed from `skill.meta.json`. |
| B7 The brief claimed write-report's shape but had no The story and Sources was not last | Working sections are `###` under `## The story` and `## Appendix — working detail`; Sources is last; the Status line sits under the title. Heading names are unchanged (the step skills' output lines now say `###`). |
| B10 `skill.meta.json` said `foundation/guide §5` | Now the marketing-guide skill reference. |
