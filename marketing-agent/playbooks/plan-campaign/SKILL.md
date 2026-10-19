---
name: plan-campaign
description: >-
  I have this budget and a launch date — what do I run, where? Plan my launch, drop or Black Friday push; plan a
  campaign; where should I advertise; should we even run ads; how should I split $5k; plan next month; replan the
  budget; our CAC blew up — replan. Turns a product, an offer, a goal, a budget and a date into a plan a founder can
  approve and a designer can start from today: a one-screen summary, the money math, an honest forecast (or the case
  for changing the goal), every channel that could work — ads, email, organic, creators — kept or dropped with its
  reason, a budget split with a reserve, tests, a backwards calendar and a complete asset list. Zero paid is a valid
  answer. Delivered as a readable plan you can open in one click. Never spends. Not for pausing ads on a sold-out
  product — use run-paid-campaigns; not for an email-only send plan — use email-lifecycle; not for reading this
  week's numbers — use analyze-performance.
---

# plan-campaign

## What you get

A **campaign plan** a founder reads in 30 seconds and a designer can start from today, written and delivered through `../../atoms/write-report/ATOM.md`: a clickable file, a copy saved to the brand, and the same text on the GooseWorks campaign record. It opens with **In short** (do this first, because…; the goal and whether the money gets there; which channels the plan covers and why; where we run and where we don't; the split; the first test; what's needed this week), then Decisions for you, the story, What to do (at most six moves) and What we're not doing — with the long working tables in an appendix (`references/brief-template.md`): who it's for and what we say, the money math and forecast, channel decisions, budget split, paid structure, tests, angles per channel, offer, backwards calendar, asset list, how we'll measure it, hand-offs, replan triggers, what we couldn't check.

Everything the marketer reads is in plain words: no playbook, tool or id names; credits exactly as GooseWorks quotes them.

## Before you start

1. **Connection and brand** — follow `../../foundation/guide` (`get_started` with the marketer's words for setup and brand only; one `tools_load` for a missing group before concluding anything). No GooseWorks tools → say only: "Connect GooseWorks first — I plan your campaigns through it." Note the brand's `coworker_agent_id`; with none, use the default workspace with paths prefixed `brands/<brand-slug>/` and tell the marketer once.
2. **Look first — ask nothing yet.** Everything below is free; do all of it before the first question (`references/intake.md` has the full list and what each answers):
   - The brand brain: `gooseworks:brand_read` (summary, kit, products with prices, onboarding — who makes the ads, who runs them, platforms, spend band, goals; then learnings in full) and `gooseworks:knowledge_search` for the task (past results, offers, pricing).
   - What's connected: `gooseworks:meta_read` (is a Meta account connected, which Pages, recent spend and results on ads GooseWorks made) and `gooseworks:social_account_list` (organic accounts). The store's products come in with the catalog.
   - What's already planned or measured: `gooseworks:campaign_read` (existing campaigns — update a matching one, never duplicate), `gooseworks:ads_creative_read` approvals view (pending creative plans), email-lifecycle's `lifecycle/program.md` and `lifecycle/calendar/<YYYY-MM>.md` (list size, flows, planned sends, offers), analyze-performance's `reports/performance/definitions.md` and newest weekly read (margin, real numbers, tracking state), the last approved brief's money and status sections.
   - Research: research-market's `research/market/<D>-read.md`, `personas.md`, `voc-bank.md`, `demand.md` and research-competitors' `research/competitors/<D>-report.md`, `angle-bank.md`, `landscape.md` (`gooseworks:file_read`; else `knowledge_search` documents); `gooseworks:competitor_read`; the creator roster `creators/roster.csv` when creators may be a leg.
   - Claims: through `../../atoms/claims-gate/ATOM.md` (only the `signed-off` marker's `Claims you may use —` facts count).
   - The brand's public site with the host's fetch or browser: product and pricing pages, any live offer.
3. **Then one short message, like a person would ask** (`references/intake.md` § The first message). Open with what you found in two or three lines. Then, in this order and in plain words:
   - **Which product (or plan) is this for, and is there an offer?** Name what you found and ask to confirm (example in `references/intake.md`). For a one-product brand, state the product and ask only about the offer.
   - **Who is it for: new people, or people who already know you** (past customers, free or lapsed users, the email list) — and roughly how many could you reach? For a one-product brand this shapes the plan more than the product does.
   - **The goal, the dates and the budget**, in one sentence — skip any the marketer already gave.
   - **What the plan will cover:** "I'll look at every channel that could work for you — ads, email to your list, organic posts, creators — and keep only the ones that fit. Say if you want ads only."
   - At most one more question only the marketer can answer and that would change the plan, with why it matters and what you'll assume if they don't know. When the goal is sales or paid accounts and nothing on file shows it, ask in plain words whether they can see what brought a buyer in ("When someone upgrades, can you see what brought them?") — never in jargon.

   Never more than about four questions, no sub-lists, no form. Never ask what the look-first pass found, and never a technical question (pixels, link tags, events, attribution) — the one plain-words "can you see what brought them?" is the most you ask about measurement. Anything else missing becomes a labelled assumption; only the product, audience, goal, budget and date block planning.
4. **A goal that isn't a number** ("make it big", "as many installs as possible"): offer 2–3 concrete options built from the brand's own numbers and the budget (metric + target + date), steering vanity metrics to the one the business needs. The founder picks; you never set it.
5. **Research missing?** If the customer-words bank or the angle bank is missing, say so in one line and offer to do that research first; if the marketer wants to go ahead, angles are labelled "starting point". Public benchmarks for the money math may be looked up with web search and are labelled as such.

## Steps

1. **Frame the job.** Mode — *launch*, *goal push to a date*, *always-on month*, *monthly replan*, *trigger replan* (replans: `references/replan.md`; a "CAC blew up" replan with no performance read from the last ~7 days recommends reading the numbers first). Launch tier T1/T2/T3 with the reason (`references/launch-and-calendar.md`; "n/a" outside launches). Note promo dates and other live campaigns, and the **buyer's** busy season in the window, not only the seller's dates (`references/launch-and-calendar.md` § The buyer's calendar). Read `references/company-types.md` for the brand's type. Name the business result the plan is judged on (signups or paid accounts for SaaS, orders for DTC, bookings for local) — every leg says how it moves that number.
2. **Money math and the top-down check** — atom `atoms/goal-chain` part 1, `references/unit-economics.md`. What a customer may cost, with a source on every number; subtract the baseline; budget ÷ incremental goal against history or labelled base rates. If it already needs a miracle, say so in one line and continue — the full case comes at step 5.
3. **The live picture.** Competitors' current campaigns from the stored research (don't re-scrape), seasonal moments, stock on anything featured; in replan mode the performance reads and the paid change log (`ads/campaigns/<slug>/decisions.md`, its `### YYYY-MM-DD — …` blocks).
4. **Channel decision** — atom `atoms/channel-decision`, `references/channel-decision.md`. Every channel that could work, ads and non-ads alike, kept or dropped with the deciding reason and a brand fact; channels that clearly don't apply fold into one "Not relevant:" line with reasons. No channel is assumed — Meta included. For each channel check that the people it reaches are the **buyer** (not peers, builders or rivals); if the marketer chose a channel that reaches someone else, say so once, plainly, and then follow their choice. Zero paid is valid.
5. **Budget, tests, forecast** — atoms `atoms/budget-and-tests` then `atoms/goal-chain` part 2, `references/budget-and-tests.md`. All budget lines; any retargeting or known-list leg states its audience size and weekly frequency and is capped near ~5 a week (§2b); tests with one variable, money per cell, when it can be read, an end date and what each result means; per-leg targets, three scenarios, and — if the expected one misses — the case for changing the goal, with the founder choosing the lever.
6. **Calendar backwards from the date** — `references/launch-and-calendar.md`, incl. "claims signed off" by T-30 when the hero product has none.
7. **Write the plan** — atom `atoms/brief-and-assets`, `references/brief-template.md`, following `../../atoms/write-report/ATOM.md` §1: In short first, plain words, no ids, every fact with its source and date. Angles from the angle bank and customers' words; signed-off claims only, verbatim; ad-policy risk per angle; the asset list complete enough for a designer.
8. **Attack it before showing it.** Numbers reconcile (leg target = leg spend ÷ expected cost; lines sum to the budget); every channel kept or dropped has its reason; no unsigned claim; no angle addressing the viewer's personal attributes or making a regulated claim; every asset has a producer and a due date inside its lead time; then write-report §3's mechanical check (banned words, In short ≤ 150 words, body ≤ 3,000 words before the appendix, ≤ 6 moves, every required section present) and its read-as-the-founder check.
9. **Deliver for approval** — write-report §2: the file `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-campaign-plan.md` with a clickable link (or an artifact / the full plan in a hosted chat), a copy saved to the brand through `../../atoms/save-to-brain/ATOM.md` as `plans/<slug>/<YYYY-MM-DD>-plan-v<N>.md` ("Campaign plan — <Brand> — <date> v<N>", `versioned: supersede`) with its `gooseworks:file_url` link (it expires after about an hour — say the plan is also saved in the brand's documents), and — on a new campaign, or one whose brief is an unapproved draft, with no creative plans pending — the same text on the campaign record as `status: "draft"`. An **approved** live brief is never overwritten before the yes. In chat, at most three lines (the one thing to do first, the link, the decisions needed), then ask for approval of the goal and forecast, the channels, the split, the asset list, the tier and the headline message.

## Approval gates

- This playbook **never spends**, never launches and never makes ads. Every output is a proposal.
- The marketer approves the goal and forecast, the **channel decisions**, the **budget split**, the asset list, the tier and the headline message; in a replan, every reallocation with its reason.
- An unrealistic goal goes back to the founder as the case for changing it; the lever is their choice.

## Output and write-back

After the yes (`references/brief-template.md` § Write-back):
- **Campaign record** — `gooseworks:campaign_upsert`: the approved plan as `brief_md` (status line "Approved <date> by <name>", version bumped), `status: "planned"` only if it was a draft, `goal`, `budget_cents` (the total), dates, `hero_product_ids`, `channels` (paid social only when a paid-social leg runs), `intake` in the marketer's own words. Re-save the readable file and the brand copy with the approved status.
- **Concepts** for each paid static or video angle — `gooseworks:add_campaign_concept` / `gooseworks:update_campaign_concept` (pending plans checked first): person, message, and proof **only** when the claim is signed off and accepted by the server for that product; otherwise proof stays empty and the gap is named. A zero-paid plan has none.
- **Making the ads is not this playbook.** If the marketer asks to make or price the ads, stop here: say in plain words that making the ads is the next step and it starts with a claims check, and offer it. Never request generation or approve a credit quote, and never fill a concept's proof with unsigned text to get one.
- **Hand-offs** in the plan by role (static ads, video ads, photos, content, paid, email, organic social, creators, claims, human), and in the closing message as plain offers of the next job.
- **Repeat it? Judge first.** At the end of the run, decide whether a repeat would help this brand. A standing or always-on plan with live channels and weekly performance reads → offer a **monthly replan** (reason: the split and tests should follow what the reads show; cadence: first week of each month). A one-off push that ends on a date (a launch, a Thanksgiving window) → no schedule; at most suggest one replan at its mid-point checkpoint. Offer only with the reason and the cadence; on a yes create it with `gooseworks:automation_upsert` per `../../atoms/spend-gate/ATOM.md`'s automation rule (created paused; each run uses credits). Each scheduled replan is delivered through `../../atoms/write-report/ATOM.md`, opening with what changed since the last plan.

## Done when

- The marketer was asked only what the look-first pass couldn't find, in one short message that started with the product and offer.
- The plan opens with In short and says which channels it covers and why, where we run and where we don't, platform by platform.
- A designer could start from the asset list today; the split is defensible; the numbers reconcile, and every number says where it came from.
- No number the marketer withheld was invented; no unsigned claim appears; an unrealistic goal produced the case for changing it.
- The plan opens with one click, is saved to the brand, and — after the yes — the campaign record holds the approved plan.

## Out of scope

- Making or pricing any asset — make-static-ads, make-video-ads, make-product-photos, make-content (offered as the next job).
- Launching, pausing or moving money — run-paid-campaigns.
- Doing the research — research-market, research-competitors (offered when missing).
- Approving claims — learn-my-brand.
- Measuring results — analyze-performance (this plan writes what it will be judged on).
- Offer mechanics — interim: the plan's offer line plus email-lifecycle's send calendar.
