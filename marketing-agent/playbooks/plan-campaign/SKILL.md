---
name: plan-campaign
description: >-
  I have this budget and a launch date — what do I run, where? Plan my launch, drop or Black Friday push; where
  should I advertise; should we even run ads; how should I split $5k; plan next month; replan the budget; our
  CAC blew up — replan. Turns a goal, a budget and a date into a plan a founder can approve and a designer can
  start from today: a one-page decision, unit economics, an honest forecast (or the case for changing the goal),
  every relevant channel marked Run, Test, Later or No with its reason, a budget split with a reserve, tests
  with success criteria, a backwards calendar and a complete asset list. Zero paid is a valid answer. Never
  spends. Not for pausing ads on a sold-out product — use run-paid-campaigns; not for an email-only send plan —
  use email-lifecycle; not for reading this week's numbers — use analyze-performance.
---

# plan-campaign

## What you get

One **campaign brief**, saved on the GooseWorks campaign record, that opens with a **one-page decision** (do this first, because…; goal and scenario; where we run and don't; split; first test; what's needed this week), then fixed working sections (`references/brief-template.md`): status and assumptions · economics box (allowable cost, break-even) · goal chain with three scenarios · renegotiation case when needed · **channel decisions** (every candidate channel: verdict, binding reason, brand fact, flip condition) · budget split by phase incl. production, creators, offer cost and a reserve · paid structure per leg · tests with success criteria · angles per channel · offer line · backwards calendar · **asset list** (placement, spec, angle, message, approved claim, destination, producer, due date) · measurement plan · hand-offs (no silent legs) · replan triggers · risks.

## Before you start

1. **Connection and brand** — follow `../../foundation/guide` (`get_started` with the marketer's words for setup and brand only; one `tools_load` for a missing group — campaigns, files, automation — before concluding anything). No GooseWorks tools → say only: "Connect GooseWorks first — I plan your campaigns through it." Note the brand's `coworker_agent_id` (file scope `{type: "agent", agent_id: …}`); with none, the default workspace with every path prefixed `brands/<brand-slug>/`, and tell the marketer (a replan draft is then shown in chat rather than saved over an approved brief).
2. **Read the brain** (all free):
   - `gooseworks:brand_read` sections `summary, kit, products, onboarding, competitors` (lean), then a second call `sections: ["learnings"]`, `detail: "full"` for every learning; `product_ids` for hero products' prices. Onboarding says who makes creative, who runs ads, platforms and spend band. Kit `brandType` is a hint — map it to a company type in `references/company-types.md` and confirm from the products and where they are sold.
   - **Claims** — through `../../atoms/claims-gate/ATOM.md` (learn-my-brand's contract: the `Claims sign-off (learn-my-brand,` marker must say `signed-off`; usable claims are the `Claims you may use —` facts, verbatim, in scope, before their review date; everything else — kit approved claims, proof points, search rows — is a candidate). With no sign-off, the atom's scoped sign-off puts the few lines this plan's angles need to the marketer; if they decline, angles use plain product facts only. For concept proof the server also checks scope: a `["claim"]` search with `product_id` that comes back scope-unknown can't be used as proof.
   - **Research** — workspace `research/market/voc-bank.md`, `personas.md`, `demand.md` (research-market) and `research/competitors/angle-bank.md`, `landscape.md` (research-competitors) via `gooseworks:file_read`; fall back to `gooseworks:knowledge_search` `["document"]` ("Voice-of-customer bank", "Buyer segments", "Angle bank"). `gooseworks:competitor_read` for the roster (note `last_researched_at`; flag dossiers older than ~30 days). `knowledge_search` `["learning"]` for past tests.
   - `gooseworks:campaign_read` — existing campaigns. A **matching** campaign (same product or occasion, overlapping dates) is updated, not duplicated; its concepts are planning input.
   - `gooseworks:ads_creative_read` `view: "approvals"` — creative plans waiting on a matching campaign (saving it, or editing a concept, discards them).
   - Workspace: email-lifecycle's `lifecycle/calendar/<YYYY-MM>.md` for the window (promo dates, offers, planned sends); in replan mode `reports/performance/` (analyze-performance) and `ads/campaigns/<slug>/` (run-paid-campaigns: `state.md` header and open recommendations, and the `### YYYY-MM-DD — <title>` blocks of `decisions.md` — what was actually done, including the server's Meta outcomes); when a creator leg is Run/Test, the creator roster `creators/roster.csv` (work-with-creators) and its wave results. Missing files are fine — note them.
3. **Re-read business facts already given:** the latest approved brief's Economics and Status sections (margin, AOV, list size, capacity, founder hours) and analyze-performance's `reports/performance/definitions.md` (margin %, target). Don't re-ask what they hold.
4. **One message.** Load `references/company-types.md`. In **one** message: any research gap (the customer-words bank or the angle bank missing — say which in plain words, recommend doing that research first, and ask whether to proceed with angles labelled *starting point*), everything the type's "Ask if missing" list needs that the brain doesn't hold, and — when the goal isn't a number — the 2–3 goal options below. Never guess. After the reply, only goal, budget and date block; any other unanswered item becomes a labelled entry in "Assumptions to confirm".
5. **A goal that isn't a number** ("make it big", "as many installs as possible"): don't loop on "what's the number?". Offer 2–3 concrete options built from the brand's own numbers and the budget (metric + target + date), steering vanity metrics to the one the business needs (activated or retained users, not installs; qualified pipeline, not leads). The founder picks; you never set it. If they insist on a vanity metric (installs), plan to it and report the business metric (activated / retained users) beside it.

## Steps

1. **Frame the job.** A replan prompted by "CAC blew up" or a missed target with no performance read from the last ~7 days: recommend reading the numbers first (in plain words) before replanning. Mode — *launch*, *goal push to a date*, *always-on month*, *monthly replan*, *trigger replan* (replans: `references/replan.md`). Propose a launch tier T1/T2/T3 with the reason (tier table in `references/launch-and-calendar.md`; "n/a" outside launch mode). Note promo dates, seasonal moments and other live campaigns in the window.
2. **Economics and the top-down check** — atom `atoms/goal-chain` (part 1), `references/unit-economics.md`. The economics box with a source on every line (pre-revenue: no allowable CAC — the founder sets a provisional cap per activated user, and the brief says unit economics can't yet justify paid). Subtract the baseline. Implied CAC = budget ÷ incremental goal, against history or labelled base rates; stock or capacity against the goal. If it already needs a miracle, say so now in one line and continue — the full renegotiation case, with numbers per leg, comes at step 5 and is where the founder chooses.
3. **Read the live picture.** Competitors' current campaigns from the stored files and dossiers (don't re-scrape — research-competitors owns that), seasonal moments, stock on anything featured; in replan mode the performance reads and change log.
4. **Channel decision** — atom `atoms/channel-decision`, `references/channel-decision.md`. Every mandatory channel decided (irrelevant ones folded into one "Not relevant:" line with reasons) plus the rows live for this brand type: Run / Test / Later / No, binding lens, a reason citing a brand fact, evidence, confidence, flip condition; execution by GooseWorks levers or written instructions / human hands; founder hours per leg against what the founder said. No channel is assumed — Meta included. Zero paid is valid when the numbers say so.
5. **Budget, tests, forecast** — atom `atoms/budget-and-tests`, then `atoms/goal-chain` (part 2), `references/budget-and-tests.md`. All budget lines; learning minimums weighed with judgment; tests with one variable, $/cell, readable threshold, end date, primary business metric and Win / Lose / Unclear actions; one paid-structure line per paid leg. Then per-leg targets (leg spend ÷ expected CPA), three scenarios and — if the expected scenario misses — the **renegotiation case**: show it and let the founder pick the lever before finishing.
6. **Calendar backwards from the date** — `references/launch-and-calendar.md`. Phases, lead times, owners, including "product record and photos in GooseWorks" by T-35 when the hero product isn't in the catalog yet, and "claims signed off for the new product" (learn-my-brand) by T-30 when it has no approved claims. An asset whose brief date has passed is flagged and its leg re-scoped.
7. **Brief and asset list** — atom `atoms/brief-and-assets`, `references/brief-template.md`. Angles from the angle bank and customers' words; approved claims quoted exactly, within scope; ad-policy risk per angle; messages without approved proof marked **needs proof**; the asset list complete enough for a designer to start today; measurement plan; hand-offs; replan triggers.
8. **Attack it before showing it.** Numbers reconcile (leg target = leg spend ÷ expected CPA; lines sum to the budget); every number has a source; every channel row cites a brand fact; no claim outside the sign-off or its scope; no angle that addresses the viewer's personal attributes (skin condition, health, body, finances…) or makes a regulated claim (e.g. "treats acne" turns a cosmetic into a drug claim); every asset has a producer and a due date inside its lead time; creative volume matches each paid leg; no leg needs hours the founder doesn't have. Fix before presenting.
9. **Present for approval.** Save the full draft where the human can read it without touching anything live: on a **new** campaign (or one whose current brief is itself an unapproved draft) save it to the campaign record as `status: "draft"` — free — if no creative plans are pending; when the campaign's current brief is **approved** (replans, a matching live campaign), leave `brief_md` alone and write the draft to the workspace `plans/<slug>/draft-v<N>.md` with `gooseworks:file_write` — siblings keep running on the approved version until the yes. In chat, lead with the brief's **one-page decision** (the goal and which scenario hits it, where we run and where we don't, the split, the first test, what's needed from the marketer this week), then the decisions needed; the full brief is at the link. Ask for approval of: the goal-chain assumptions, the channel decisions, the budget split, the asset list, the tier and the headline message.

## Approval gates

- Everything the marketer reads is in plain words: no playbook, tool or id names; credits exactly as GooseWorks quotes them.

- This playbook **never spends** and never launches. Every output is a proposal.
- The human approves the goal-chain assumptions and forecast, the **channel decisions** (a bet with months of consequences), the **budget split**, the asset list, the tier and the headline message. In replan mode, every reallocation, each a finished recommendation with its reason and evidence.
- An unrealistic goal goes back to the founder as the renegotiation case; the lever is their choice.

## Output and write-back

After the human's yes — details in `references/brief-template.md` § Write-back:
- **Campaign record** — `gooseworks:campaign_upsert` on the same campaign: the approved brief (Status line "Approved <date> by <name>", version bumped), `status: "planned"` only if it was draft (an active campaign stays active), `name`, `goal` (the closest allowed value — the real metric lives in the brief), `budget_cents` (the total budget), dates, `hero_product_ids`, `channels: ["paid_social"]` only when a paid-social leg is Run/Test (the brief's channel decisions are the truth), `intake` in the human's own words.
- **Concepts** for each paid static/video angle — `gooseworks:update_campaign_concept` / `gooseworks:add_campaign_concept` (check pending plans first): `person`, `message`, and `proof` only when the claim is both signed off by learn-my-brand and accepted by the server for that product (server `applicability` `brand`, or `product` matching `product_id`; `unknown` is refused) — otherwise empty proof and the gap named; `evidence` `kind: "approved_claim"` with the claim id; `confidence`; `product_id`. Write concepts yourself; never `propose_campaign_concepts`. A zero-paid plan has none.
- **Never** request creative generation — that is the makers' step, behind their credit gate.
- **Hand-offs**, leg by leg, in the brief (role words — static ads, video ads, photos, content, paid, email, organic social, creators, claims, human) and in the closing message in plain words ("next, the static ads can be made from the asset list"), never by playbook name. Behind them: make-static-ads, make-video-ads, make-product-photos, make-content (asset list); run-paid-campaigns (paid legs, from this record); email-lifecycle (the calendar drives its sends); run-organic-social (drafts; human posts); work-with-creators (research half; human closes); learn-my-brand (claims for a new product); search ad copy, keywords and PDP copy (human-executed; run-paid-campaigns' Google card uses the confirmed rows); other human-executed legs (measured in analyze-performance's channel table).
- **Recurring:** offer once to replan monthly from the performance reads; each run uses credits (the exact cost isn't shown in advance); on an explicit yes create it with `gooseworks:automation_upsert` per `../../atoms/spend-gate/ATOM.md`'s automation rule (created paused; the marketer switches it on).

## Done when

- A designer could start from the asset list today.
- The brief says where we run, where we don't, and why — platform by platform, rejections included, each with a brand fact.
- The split is defensible: production, creators, offer cost and reserve are in it; each paid leg clears its minimum or says why it runs anyway.
- The numbers reconcile, and every number says whether it is the brand's own, the human's, a base rate or an assumption.
- No number the human withheld was invented; an unrealistic goal produced a renegotiation case, not a miracle plan.
- After the yes, the campaign record holds the approved brief (and concepts, when there are paid static/video legs).

## Out of scope

- Making any asset — make-static-ads, make-video-ads, make-product-photos, make-content.
- Launching, pausing or moving money — run-paid-campaigns.
- Doing the research — research-market, research-competitors (read only; recommended when missing).
- Approving claims — learn-my-brand (this plan schedules it when a new product needs them).
- Measuring results and calling tests — analyze-performance (this playbook writes the criteria).
- Negotiating the goal — a human conversation; this playbook hands over the case.
- Offer mechanics — interim: the brief's offer line plus email-lifecycle's send calendar, until plan-offers exists.
