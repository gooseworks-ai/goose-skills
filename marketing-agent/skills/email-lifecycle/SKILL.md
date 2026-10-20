---
name: email-lifecycle
description: >-
  Lifecycle email, SMS and push: audits the list and deliverability, then writes the flows this kind
  of business needs first, loadable as-is in your own tool, plus segments, cadence and this week's
  broadcasts. Never sends anything. Use when: set up my welcome and abandoned-cart emails; trial
  onboarding or waitlist launch emails; win back lapsed customers; plan this week's emails and texts;
  push notifications for my app; why are my emails going to spam; plan our Black Friday email and SMS
  sends; a send went wrong. Not for cold outreach to prospects — use write-outreach; not the editorial
  newsletter issue — use make-content; not the whole cross-channel Black Friday plan — use
  plan-campaign.
version: 0.1.0
---

# email-lifecycle

One marketer want: "Cart and welcome emails make money while I sleep — mine do not exist." The playbook drafts and stages a lifecycle program; the marketer loads it into their own tool and presses send.

## What you get

1. **Deliverability and list report** — every plumbing item green / red / unknown, each marked *verified* (the agent saw it), *from you* or *unknown*. Never a green the agent did not see. Red and unknown items come with the exact fix and who does it.
2. **Flow pack** — the flows you asked for, or else the top two this business can load today (a third is offered), each a build sheet in your tool's own terms: trigger, filters, exit, re-entry, consent per market, priority and suppressions, timing, and every message finished, plus its goal metric, its test, a holdout where one fits, and the result it should beat. Each flow is marked **ready to load** or **not ready**, with the blocker in plain words ("waiting on your answer about returns", "needs your app to tell the email tool who installed", "your current plan can't run this — here are the options").
3. **Segments, priority and cadence** — segment definitions in the company's own terms (clicks, orders, activity — not opens), the flow priority map and frequency cap, the proposed send cadence.
4. **This week's broadcasts and the month's calendar** — broadcasts finished and ready to schedule (email; SMS only where consent exists and the moment is high-intent); the calendar as one table of dates and ideas.
5. **Proposals awaiting a yes** — offer depth with margin math, cadence, sunset slice, tool or plan changes, a tracking plan for missing events, any high-stakes send.

## Before you start

1. **Setup first:** do the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2 (connect, brand, brain read) before anything else; the job line is "build your email program"; `get_started` also takes `wants: "more"`; groups to load: files, campaigns, media, automation, brand. **Incident mode** (step 2) runs its pause list before the brain read.
2. **Pick the mode** (`references/modes-and-incidents.md`): **build**, **weekly**, **monthly**, **seasonal** or **incident**. **Incident first:** the first reply is the "pause now" list as click-by-click steps for the marketer — before any brain read, intake or audit. Otherwise do only the work the asked outcome needs and say in one line what you are not doing this run.
3. **Read the brand brain.** Brain chapters: 2 "What we sell" (prices, offers, policies), 5 "Who we sell to", 11 "How we sound", 15 "How we work together", 17 "Accounts and tools" (the email tool), 18 "How we count results", 20 "Our plan"; `gooseworks:brain_open` for full product records. Fallback path: `brand_read` sections `summary`, `kit`, `products`, `onboarding`, `learnings`, and full product records (`product_ids`) for products the flows will feature. Load the `claims-gate` skill (`../claims-gate/SKILL.md`) and read the contract only; the scoped sign-off, if needed, comes in intake message 2. The standing first-order offer and brand-wide policies come from the `Standing offer:`, any `Policy:` and earlier `[lifecycle …]` facts (else the Brand record, read with `file_read`); never from search snippets. For a message signed by a person, read their voice card if one exists (the `voice-card` skill (`../voice-card/SKILL.md`), read only); if none, write in the brand voice, say the note isn't yet in their own voice, and offer to build the card later.
4. **Load the last run, then read what the program already knows.** Run the Start steps of the `run-memory` skill (`../run-memory/SKILL.md`) with `references/run-memory.md` (incident mode: after the pause list) — steps 1–2 now: the newest record across the email jobs gives last run's numbers with their windows and its open recommendations ("add a second cart email"), so intake message 1 asks for the export that covers them; steps 3–4 inside step 1's audit, once the exports are in: each recommendation checked done / not done / unknown from the flows list, a test email or the marketer's word, and judged against its baseline when a settled window exists. Then `gooseworks:file_read` `lifecycle/program.md` (flows live, each flow's hypothesis and last result, segments, cadence); `gooseworks:file_list` `reports/performance/` and read the latest weekly read's email rows; `gooseworks:campaign_read` to list the brand's campaigns, then read each active one in full for its email/SMS rows and hand-offs; the latest `search/fixes/` file's "For your email program — review requests" section (a review-request brief); `content/newsletter/` for make-content's next issue; `Graphic ready:` lines under this playbook's own header-art requests in `lifecycle/flows/`. The marketer's email-tool connector, when listed, is read only (`references/intake.md` Q2).
5. **Ask only what is missing, in two short messages** (`references/intake.md` has the wording). **Message 1** (≤ 8 questions, prefilled with best guesses; skip what the brand type or a campaign brief already settles): the email tool and plan first, unless the brain names it (the guide's rule "The marketer's own tools": no tool → options for their type; its connector listed → read it and drop the questions it answers; not listed → one ask to connect, then the questions — `references/intake.md` Q2), what counts as the win, how the list was collected and consent per channel, markets, the standing offer if the brain doesn't hold it, and — optional, as click-by-click steps — the flows list and last 90 days' report from their tool, the "original message" text of one recent campaign they received from their own list, and the spam-rate chart if they use Google's sender dashboard. **Message 2** comes after step 2, only for facts the chosen flows use (≤ 6), prefilled from the brand's own site and labelled "from your site — confirm". Never guess consent, discount depth, prices, stock, shipping or return promises, renewal terms, trial length, existing event names, reward amounts or time zones.
6. **Hard stops.** A purchased, scraped or no-consent list, or customers imported from marketplace orders: stop for those contacts, say why in one line, offer the re-permission route. A list not mailed in 6+ months (a waitlist: 3+ months): the first send is a re-permission or re-confirm, not a promo.

## Steps

### 1. Audit what exists and read last cycle's results
Run the atom the `email-lifecycle-lifecycle-audit` skill (`../email-lifecycle-lifecycle-audit/SKILL.md`) (reads `references/deliverability.md`). It reports list health, live flows (including the store platform's own automations that would duplicate ours), the last 90 days of sends, consent per channel and market, authentication from a real campaign's headers, complaints, bounces and unsubscribe mechanics — and shows the **deliverability and list report** before any writing. Only missing consent or complaints at or above 0.3% stop the writing; red or unknown authentication blocks switching on and broadcasts, not drafting. Then it **reads back each live flow against the hypothesis and target saved last cycle** in `lifecycle/program.md` and the last run record's numbers (from the weekly read's email rows or the marketer's export, re-pulled for the same window length and attribution setting — `references/run-memory.md`; never on opens): beat it → keep and promote the winning test; missed it → that flow's weakest message is first in line to rewrite; no data → "not measured", never guessed.

### 2. Choose the flows for this business
Read `references/flow-library.md` (first flows by business type, ranking, and §4 "Buildable today"). Build what the marketer asked for; otherwise the top two **buildable today** for this business type, ranked by expected value — weighted by last cycle's measured results where they exist — with a broken live flow ahead of any missing one. Blocked flows are still written and marked with their blocker in words; flows needing events that don't exist yet get a tracking plan labelled "proposed — confirm with engineering". State the plan in three lines, send intake message 2, and wait for the answers (write with placeholders only if the marketer says to go ahead). If the claims marker is not `signed-off`, intake message 2 also carries the claims gate's scoped sign-off for the 3–5 lines the chosen flows need (as its own block, not counted in the six questions).

### 3. Define segments, priority and cadence
Read `references/segments-cadence-offers.md`. Segment definitions in the company's own terms on clicks, orders and activity — never opens alone. The flow priority map, the global frequency cap, the suppressions, and the proposed cadence per engagement tier. **Approval gate:** the cadence is a proposal; it never creeps up silently.

### 4. Write the flows
Run the atom the `email-lifecycle-flow-writer` skill (`../email-lifecycle-flow-writer/SKILL.md`) once per flow (reads `references/loadable-flow-format.md`, `references/copy-craft.md`, `references/worked-flows.md`). Real syntax of the brand's tool; messages finished in the brand voice, one job each, lengths and shapes varied; consent and prices per market; push and in-app for apps (`references/sms-push-whatsapp.md`); B2B journeys keyed to activation events. Each flow records its **hypothesis for this cycle** (what it should do, against which number) and its goal metric, test and holdout rule. New header art is an optional request line for make-static-ads and never blocks "ready to load". An unsettled fact stays a visible [placeholder] with its question, and the flow is marked not ready.

### 5. Price every offer
Run the atom the `email-lifecycle-offer-math` skill (`../email-lifecycle-offer-math/SKILL.md`) for any discount, threshold or reward. Offers come only from the standing offer or a ladder the marketer approved (rules in the atom). **Approval gate:** the marketer approves every discount depth.

### 6. Calendar and this week's broadcasts
Run the atom the `email-lifecycle-broadcast-planner` skill (`../email-lifecycle-broadcast-planner/SKILL.md`): the month's calendar as one table, around plan-campaign's moments and the brand's promotional dates, with a pull-back week after a tentpole; this week's broadcasts finished, stock confirmed, within the plan's monthly send limit. SMS only for high-intent moments with SMS consent. Broadcasts wait while authentication is red or unknown.

### 7. Check everything before staging
Run the `claims-gate` skill (`../claims-gate/SKILL.md`) over every message (check and cut only — any sign-off already happened in message 2), then the atom the `email-lifecycle-send-check` skill (`../email-lifecycle-send-check/SKILL.md`) for flow logic, overlaps, offer leakage, stock, fallbacks, consent per market, compliance and disclosure (`../ad-policy-check/disclosure.md` (in the `ad-policy-check` skill)), SMS rules, rendering, the AI-copy failure list and the voice check.

### 8. Stage for the marketer
In chat (no tool names, ids or claim ids — statuses in words), on a repeat run opening with **since last time** in 3–5 lines (run-memory step 4: last run's recommendations done or not, what they changed with the windows and whose numbers they are, deliverability against last time — in plain words, never "baseline", "recipe", "review by", "claimed" or recommendation ids; say "your email tool's own count"): the deliverability summary, the build order (which flow to switch on first and why, and which live flow to turn off), **one flow in full**, each other flow in one line, this week's broadcasts, and the decisions awaiting a yes — blockers always in plain words. The full pack (since last time on a repeat run — at the top of the story, its most important line also in "In short" — then deliverability report, build order, every flow, broadcasts, decisions) is one document written and delivered through the `write-report` skill (`../write-report/SKILL.md`): a local file with a clickable link on hosts with files (`gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-email-program.md`), an artifact or the full text in hosted chat, plus the saved copy's link. Never point the marketer at workspace paths; the `lifecycle/` files are working copies. QA steps before switching on: seed sends to Gmail, Outlook, Apple Mail and Yahoo, a dark-mode check, one test order, sign-up or trial through each trigger.

### 9. Write back
Save with `gooseworks:file_write` (read before write): `lifecycle/program.md` (opens "Do this first, because…"; holds flows live and staged with each flow's hypothesis, target and last result, segments, priority map, cadence, sunset rule, approved discount depth, margin ranges as the marketer stated them), `lifecycle/flows/<flow-slug>.md`, `lifecycle/calendar/<YYYY-MM>.md` (the interim home for offers, read by plan-campaign), `lifecycle/broadcasts/<YYYY-MM-DD>.md`, `lifecycle/deliverability/<YYYY-MM-DD>.md`. Save the program sheet to the brain through the `save-to-brain` skill (`../save-to-brain/SKILL.md`) (`versioned: supersede`, artifact "Lifecycle program"). Save the **run record** through the End steps of the `run-memory` skill (`../run-memory/SKILL.md`) with `references/run-memory.md`: this run's numbers with windows, sources and labels, the recommendations with review dates and baseline recipes, and the outcomes of last run's — counts only, never a name or address from an export. Learnings: one the `save-learning` skill (`../save-learning/SKILL.md`) call, here, by `references/intake.md` § Saving what the marketer said (the standing offer, confirmed policies, cross-playbook rules, and what to do when one already exists). Offer the weekly mode as a recurring run, set up by marketing-guide §3 Schedules (prompt and limits in `references/modes-and-incidents.md`).

## Approval gates

- **Sending and status:** nothing is ever sent, scheduled, switched on or paused by the playbook — not even in an incident. The marketer makes every status change in their tool.
- **Offer depth:** every discount, threshold or reward is proposed with its margin math; the marketer approves.
- **Cadence:** proposed and approved; it never rises silently.
- **Claims:** only what the claims gate allows; a yes in chat counts only through the gate's scoped sign-off.
- **High-stakes sends** — a launch, an apology or correction, a price change, a brand incident, drug-like or financial wording — are flagged for a human read before staging.
- **Sunsetting:** the slice is named with its size and recent revenue, proposed, never done silently.
- **Whole-list SMS sends, the first send to a dormant list or old waitlist, tool or plan changes, and any sending-domain migration** are proposals with the risk stated.
- **Referral rewards and review requests:** reward economics and the review platform need the marketer's sign-off; review requests go to every customer, never only the happy ones.

## Output and write-back

Paths and readers: step 9 and the marketing-guide's §4 lifecycle row. Results live in the brand's own tool; each week the marketer hands an export to analyze-performance, whose email rows come back here at step 1 and reweight the flows. The typed brain home the program needs is in `server-needs.md`.

## Done when

"Flows you could load into your tool as-is, deliverability checks green." Check: run it on a brand with a real list; the marketer loads the **two flows they asked for, or the top two buildable today for their business type** (for a store: welcome and abandoned checkout) without editing a message — any flow not loadable today carries its blocker in plain words, and if fewer than two are buildable, the ready ones plus every blocked flow written with its blocker count — and the deliverability report contains no green the agent did not verify or the marketer did not supply. Any edit before loading means it is not done. In-run check: send-check passed on every flow, and no flow marked ready to load holds a [placeholder].

## Out of scope

- Sending, scheduling, pausing or switching flows on in the marketer's tool — the marketer.
- Cold outreach to prospects, and emails a person sends to named accounts (demo-request replies, reconnects, win-back of specific business accounts) — write-outreach.
- Judging which flow or send made money — analyze-performance (its email rows feed step 1's read-back).
- The whole cross-channel campaign — plan-campaign; this playbook fills the send calendar around its moments.
- The editorial newsletter issue (subject included) — make-content; this playbook owns cadence, segment, send time, exclusions and staging.
- Not covered yet: designing offers from scratch (here only the standing offer or an approved ladder); list growth — popups, quizzes, lead magnets (the welcome flow honours exactly what the popup promised); app screens, paywalls and the native permission flow (proposals to the product team; in-app messages through the messaging tool are in scope); WhatsApp templates, DM and chatbot automation (the report says so when the market makes it the main channel); replying to reviews (review requests stay here); transactional email redesign.
