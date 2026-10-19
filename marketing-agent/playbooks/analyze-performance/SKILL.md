---
name: analyze-performance
description: >-
  What worked this week across every channel we run, why, and what do I make next? Write my Monday report; how
  are my ads doing; which ad won; are my ads actually making money; Meta says 4x ROAS but revenue is flat; why
  did sales drop this week; sales are flat — what changed; did the test win; is my tracking working; monthly
  numbers for the replan; anything on fire today. Diagnoses and recommends: judges every channel on the
  business's real number (store revenue, qualified pipeline, retained users), not platform claims. One Monday
  report: tracking breaks, a three-line headline, every channel present, named causes for what moved, creative
  ranked by angle and hook, test calls, recommendations with confidence, what to make next. Lessons saved after
  you've seen them; a monthly read; an exception-only daily pulse. Not for acting on the recommendations
  (pausing, scaling, launching) — use run-paid-campaigns; not for replanning the budget — use plan-campaign.
---

# analyze-performance

## What you get

- **The Monday report** — saved to `reports/performance/<YYYY-MM-DD>.md` and shown in chat; same shape every week (`references/monday-report.md`): coverage and maturity header · plumbing flags with fixes · three-line headline · business truth (the type's referee: DTC net and new-customer revenue, MER, nCAC, contribution vs break-even; B2B pipeline by source; app activated/retained users) · channel table over the brand's channel roster · two stories when platform and blended disagree · why it moved (named causes, evidence, confidence, ruled-out causes) · creative ranked by angle → hook → format on the business number · channel blocks · test calls · recommendations (kill / scale / hold) with confidence and "would change if" — run-paid-campaigns decides and acts on them · what to make next · proposed learnings · one decisions block.
- **Learnings** written to the brand brain after the human has seen and kept them.
- **Monthly unit-economics read** for plan-campaign's replan; **daily pulse** on request, exception-only (`references/monthly-and-pulse.md`).

## Before you start

1. **Connection and brand** — follow `../../foundation/guide` (`get_started` with the marketer's words for setup and brand only; one `tools_load` for a missing group before concluding anything). No GooseWorks tools → say only: "Connect GooseWorks first — I read your results through it." Note `coworker_agent_id` (file scope `{type: "agent", agent_id: …}`); with none, the default workspace with every path prefixed `brands/<brand-slug>/`, and tell the marketer.
2. **Read the brain and the plan** (free): `gooseworks:brand_read` sections `summary, kit, products, learnings, onboarding, accounts`; `gooseworks:knowledge_search` `["learning"]` for past results; `gooseworks:campaign_read` — live briefs (Economics, targets, Test plan, Measurement plan, Replan triggers, the change-log slug in Status); workspace (`gooseworks:file_list` / `file_read`): `reports/performance/definitions.md`, the latest dated report and its Decisions, `ads/campaigns/<slug>/state.md` (frontmatter `meta_push_ids`, health line, open recommendations) and the `### YYYY-MM-DD — <title>` blocks of `decisions.md` (what was actually done — written by run-paid-campaigns and the server), make-static-ads' batch files `ads/batches/<YYYY-MM-DD>-<slug>.md` (creative id → angle, hook, test; picks) and `ads/videos/<project_id>.md`, `lifecycle/program.md` (which flows exist), the newest `research/competitors/watch/<YYYY-MM-DD>.md` (line 2), and research-market's "What people are saying" section — in the newest `research/market/<D>-read.md` (mentions, sentiment, trends, risks; check the section's own window line before treating it as this week's, and read share of voice only if it is there).
3. **Company type and referee** — `references/measurement-contract.md` §1. The type decides the referee, the ranking metric, the cadence (B2B under ~20 SQLs a month: weekly = leading indicators, pipeline monthly; services: monthly) and the inputs.
4. **One message, once — lead with the minimum.** Ask first for the **minimum useful read** (`references/measurement-contract.md` §4): this week's and last week's referee totals (e.g. store sales by new vs returning) plus one ad export per paid platform — enough for MER, new-customer cost, the marginal read and a creative ranking. In the same message, on the first run only: the contract draft with defaults pre-filled (ask only the number and target, margin %, timezone — never technical settings), the roster to confirm, and **history once** (as many weeks of store totals as they have, up to ~13 months — a shorter span is fine, the comparisons just say so). Everything else is optional this week. Work with what arrives — no mid-run asks; missing items are "not checked this week". In a hosted chat, ask for platform summary views or totals rather than row-level files, and if a large export is pasted with no code tool, don't total it by eye — ask for the summary report and mark the referee not measured until it arrives; with a code tool, total it in code. Never echo rows. If the referee is missing → **claims-only mode** (§5).

Tools that give data directly: `gooseworks:meta_read` performance view (Goose ads only, trailing windows ranked by spend — used to identify Goose ads and cross-check, not as the week's totals); `gooseworks:social_account_list` + `gooseworks:social_analytics_get` (the brand's TikTok/Instagram accounts — other platforms come from the human); `gooseworks:ads_creative_read` (statics' lower-case tags, e.g. `angle:a-07`, `picked`; the batch file is the fallback when tags are missing) and `gooseworks:video_read` (videos' angle and hook names).

## Steps

**Route first.** "Anything on fire today?" → run Before you start 1–2, then only the pulse in `references/monthly-and-pulse.md` — no input message, no contract. "Monthly numbers / replan" (or the first Monday of the month) → add the customer-level store export to this week's one input message, run the weekly read, then the monthly read. Everything else → the weekly read below.

1. **Hygiene, maturity, coverage** — atom `atoms/intake`. On a first run, save the contract (confirmed, or as "draft — awaiting confirmation" if the human sent exports without confirming) to `definitions.md` and register it as a brand document through `../../atoms/save-to-brain/ATOM.md` (`versioned: supersede`); re-check the roster against the briefs and `state.md` and propose an amendment when a new channel appears. Strip test/wholesale/staff orders and renewals; net refunds; align timezones; equal-lag comparison; de-duplicate Goose ads against the export by ad id; save the input summary; write the coverage line over the roster.
2. **Business truth and the join** — atom `atoms/revenue-join`, `references/revenue-join.md`. The type's referee vs last week, the 4-week average and the same week last year (or "vs plan only" for a new brand); for DTC: MER (labelled DTC MER when retail exists), new-customer MER, nCAC, contribution after ads vs break-even; the overclaim ratio on like-for-like terms; marginal vs average; budget pacing vs the month. When platform and blended disagree: both stories at the same grain, a recommendation, the cheapest settling test.
3. **Plumbing and the why** — atom `atoms/diagnose`, `references/diagnosis.md`. Plumbing first (breaks from the numbers, run-paid-campaigns' health line, and "measurement absent by design" with setup steps). Then, for every material move, the cause checklist with evidence and confidence and ruled-out causes; light page/message match on the top winning and losing ads.
4. **Creative ranking and channel reads** — atom `atoms/rank-and-read`, `references/creative-and-channels.md`. Angle → hook → format ranked by spend and judged on the type's business event (DTC: purchase CPA within the platform, claimed, capped at medium unless store new-customer orders moved with it); when only an upstream proxy exists (installs, leads, clicks), "cheap <event>, quality unknown" — no winner, no learning, "test" not "scale"; ads without a maker's angle annotation are "unannotated", never guessed from names. Then each rostered channel: email/SMS, organic, Google (+ wasted-spend terms), apps, local, B2B pipeline.
5. **Tests and recommendations** — atom `atoms/call-and-learn`, `references/tests-and-learnings.md`. Ended tests called against the brief's criteria; last week's calls scored; this week's recommendations with confidence and "would change if" (the decision and the action are run-paid-campaigns'); fired replan triggers; the "what to make next" list; at most ~3 proposed learnings (n floors apply), each showing what it would retire.
6. **Write and show the report** — `references/monday-report.md`. Check: labels per section (truth / claimed / derived); no platform revenue as truth; every rostered channel present; every call has confidence; three actionable headline lines. Save it, show it, and end with **one decisions block**: which story to run on (if two), which learnings to keep or strike, any contract amendment, any re-test.
7. **On the human's reply** — re-save the report with a Decisions section; record the story pick in `definitions.md`; write the kept learnings through `../../atoms/save-learning/ATOM.md` (their words as the statement; one idea per learning; own superseded ones retired; say which landed). Nothing becomes a learning unless it appeared in a report the human saw.
8. **Monthly read** when routed above — `references/monthly-and-pulse.md`.

## Approval gates

Nothing here is irreversible: this playbook reads and recommends; it never moves money, changes campaigns or publishes. Its judgment points end at the human:
- Which story to run the business on when platform and blended disagree.
- Whether a messy test result is enough to act on, or the test runs again.
- Learnings are written only from the human's own words after they have seen them.
- Kill/scale recommendations become real only when run-paid-campaigns decides on them, behind its money gate.
- Scheduling the report or pulse (`gooseworks:automation_upsert`) is offered once — a scheduled run uses credits, runs claims-only unless a connector exists, and should run before the paid run — and follows `../../atoms/spend-gate/ATOM.md`'s automation rule (created paused, switched on by the marketer); the offer is recorded in `definitions.md` so it isn't repeated.

## Output and write-back

- Workspace (brand coworker scope, `gooseworks:file_write`, re-read before writing): `reports/performance/<YYYY-MM-DD>.md` (weekly — named for the Monday of the run week, kept when re-saved with Decisions), `reports/performance/monthly/<YYYY-MM>.md`, `reports/performance/inputs/<YYYY-MM-DD>.md`, `reports/performance/definitions.md`. The contract (`versioned: supersede`) and the monthly read (a period artifact, `keep-history`) are also registered as brand documents through `../../atoms/save-to-brain/ATOM.md`.
- Learnings → the brand brain through the save-learning atom (read by every planner and maker; angle learnings start `[learning YYYY-MM-DD A-NN]` so research-competitors can update its bank).
- Who takes what: **run-paid-campaigns** — calls, plumbing flags, Google wasted-spend terms, the input summary · **plan-campaign** — weekly and monthly reads, fired replan triggers · **make-static-ads / make-video-ads / make-content** — what to make next · **run-organic-social** — organic overperformers · **email-lifecycle** — the flow-and-send read · **improve-search-visibility** — the re-check nudge.

## Done when

It tells you what worked this week on every channel you use — why, and what to make next — judged on your real number, not platform claims. Check: on a brand with live spend and its store or CRM numbers provided, each rostered channel's winner, the why and the next-make are stated and grounded; platform revenue is never quoted as truth; learnings were written only from your words after you saw them. Without the referee it says plainly that it ran claims-only — the Done-when check needs the referee.

## Out of scope

- Applying any change (pausing, scaling, budgets, negatives) — run-paid-campaigns.
- Making the next creative — make-static-ads, make-video-ads, make-content.
- The monthly replan itself — plan-campaign (fed by this playbook).
- Fixing the pages it checks — audit-my-pages (backlog); the check here is read-only.
- Brand-search volume, share of voice, citations — research-market ("What people are saying"), improve-search-visibility (carried in when they exist).
- Standing alerts and watchers — watch-and-alert (backlog); the exception-only pulse covers the gap.
- The deep email flow audit — email-lifecycle; the organic content mix — run-organic-social.
