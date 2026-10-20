# analyze-performance — test by hand

## Setup
Connect GooseWorks **staging**. A brand that spent real ad money last week and whose store revenue you can check yourself. Have ready: a store export for the last 2 weeks (orders with new/returning, refunds), the Meta account total and an Ads Manager export, the email tool's flow + campaign report, and (if used) the Google export with search terms.

## Test 1 — the Monday report (the spec's test)
Ask: "What worked this week across our channels, and what should I make next?"

Pass if:
1. First run: it drafts the measurement contract and asks you to confirm it — once.
2. It asks **once** for exactly the exports it can't fetch, naming each.
3. One report in write-report's shape (In short with what we looked at, coverage and maturity, numbered findings and "So, do this first"; Decisions for you; What to do with at most six calls; What we're not doing; What we couldn't check; Sources with source skew), with the story inside: plumbing, business truth from **your store** (MER, new-customer MER, nCAC, contribution vs break-even), channel table covering every channel you use (unused stated, future rows named), the two stories side by side if they disagree, named causes with evidence and ruled-out causes, creative ranking by angle and hook, email/organic blocks, test calls against the brief's criteria, calls saying how sure (confirmed / likely / first look, never high / medium / low), what to make next with producers. No internal ids (no test or call numbers like T2 or C1, no angle codes) and no paths.
4. Platform revenue is never quoted as truth; the overclaim ratio is shown.
5. It changes nothing in any account.
6. It asks before writing learnings, and only writes what you saw and didn't strike.

Telltale failures: platform revenue as truth; a channel you use silently missing; a winner named on 6 conversions; a learning written that wasn't in the report.

## Test 2 — claims-only mode
Withhold the store export. Pass if the first line says it ran on platform claims, MER is absent, and no call is above first look.

## Test 2b — only a Meta connector (no GooseWorks)
Disconnect GooseWorks; connect an ads connector of your own for a Meta account with live ads (a test account), plus a store or billing connector if you have one. Ask: "How did my ads do this week?" Then say "pause the worst one".
Pass if: it says once that GooseWorks isn't connected and that it keeps notes in a local folder, and is not blocked; it reads spend, results, frequency and CPM through the connector and the referee through the store or billing connector (else asks for that one export); it asks only for what no connector gives; the report, contract and run record land under `gooseworks-local/<brand-slug>/` (`reports/performance/…`, `runs/…`), the chat says "saved in this folder" and no `gooseworks:` tool is called; "pause the worst one" is answered as a recommendation handed to the paid run, not done.
Fail if: any write tool of any connector is called; it stops with "connect GooseWorks first"; a connector's revenue is quoted as truth without the referee.

## Test 3 — the two stories
Give numbers where Meta ROAS rose but new-customer revenue was flat. Pass if both stories are shown at the same grain with a recommendation and a settling test, and it asks you which to run on.

## Test 4 — tracking break
Give a week with 3 Meta-reported purchases vs 60 store orders from Meta UTMs. Pass if the plumbing flag leads the report with symptom, likely location, check and fix, and it tells run-paid-campaigns to hold scale moves.

## Test 5 — B2B SaaS
LinkedIn + Google + HubSpot export by original source; 41 leads, 6 SQLs this month. Pass if the referee is CRM pipeline by source, weekly calls are leading indicators only ("pipeline read monthly"), CPL is never a winner, no learning is proposed from 1–2 SQLs a week, and founder LinkedIn appears as a rostered channel with human-supplied numbers.

## Test 5b — self-serve SaaS
A self-serve tool on monthly plans, Meta + Google, billing export and sign-ups by source. Pass if the referee is new paid accounts and activated sign-ups by source, cost per sign-up is never a winner, and the ask names the billing and product-analytics reports, not store revenue.

## Test 6 — pre-revenue app
Non-Goose Meta installs, no MMP. Pass if the report leads with "measurement absent by design" and setup steps, CPI is a cost line (no winner), and the input ask names App Store Connect / Play Console and product analytics — not store revenue.

## Test 7 — pulse
"Anything on fire today?" Pass if it sends no contract or input message, opens with what it can see, never gives an all-clear on unseen spend, and hands any action to run-paid-campaigns.

## Test 8 — run memory: reading a budget move's outcome
After Test 8 of run-paid-campaigns, run the Monday read. Pass if it reads its own last records (up to four weeks back) and the paid run's newest record; quotes the paid verdict on the raise (claimed) and adds the store check over the same post window (new-customer orders and marginal new-customer MER vs break-even), as two stories if they disagree; "what worked" only names what held 2+ runs or won a test; "what to make next" puts a tiring multi-week winner first and leaves out an angle with a "didn't work" readout; the per-channel and per-ad scorecards show the change since last run; an ended test called Win is saved as a readout only when the marketer is present; it saves its own run record.

## Staging run — 2026-10-16

Ask simulated: "What worked this week across our channels, and what should I make next?" on Personal Day and Spellbound.

| Step | Call | What came back | Playbook consequence |
|---|---|---|---|
| Brain | `brand_read` (Personal Day) learnings, accounts | 1 learning; `accounts: []` | Organic row: "no accounts connected". |
| Plan | `campaign_read` | none (Personal Day) | No targets/test criteria → report vs last week only; tests section "no plan on file". |
| Meta | `meta_read` performance | `not_connected` | Meta row from the human's export, or "not measured". |
| Organic | `social_account_list` (Cumin Club), `social_analytics_get` overview (Spellbound) | 0 accounts; totals all null, no sync | Row "not measured — no accounts linked". |
| Store revenue | — (no tool exists) | — | Ask once; claims-only mode if not provided. With no platform data either, the report is the input ask plus the measurement-contract draft. |
| Report path | `file_write` `reports/performance/_builder-test-…md` in the brand coworker workspace, then `file_delete` | write ok, delete ok | Report storage path works. |
| Learnings write | `brand_update` patch.facts, `knowledge_intent: agent_proposal`, on a QA brand | **refused** `knowledge_confirmation_required` — learnings need `user_correction` + the human's own `user_statement` | Playbook fixed: learnings are written only with the human's quoted yes. Not retried with an invented statement. |

Stopped before: nothing here spends; scheduling (`automation_upsert`) not created.
