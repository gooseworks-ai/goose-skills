# Modes and incidents

Load at "Pick the mode". Each mode is a named stage with its own input; run only what the ask needs.

## Build (first run, or flows missing)
Audit → flow choice → segments and cadence → the flows the marketer asked for, else the top two buildable today for the business type (a third offered), plus repairs to broken live flows → offers priced → this month's calendar (one table) and this week's broadcasts → checks → staged. About 8–12 messages, one flow shown in full in chat, the rest in files. Email first; SMS only where consent exists. Later build runs add the next flows by expected value, and the SMS layer.

## Weekly
Input: last week's performance read from analyze-performance (`reports/performance/<latest>.md`), or the marketer's export.
1. Hygiene check: complaints, bounces, unsubscribes per send vs the thresholds in `deliverability.md`.
2. This week's broadcasts (email + SMS) from the calendar and any campaign leg in plan-campaign's record; stock confirmed.
3. Read-back and one flow refresh: compare each live flow with the hypothesis and target recorded in `lifecycle/program.md` (and its own benchmark row in `benchmarks.md`, its own 4-week trend — never a welcome flow against a post-purchase flow, never opens). The flow furthest below its target gets one message rewritten or one test added; a test that won is promoted; each flow's result and next hypothesis are written back to the program sheet. Nothing provided → say "no results this week; no flow refresh".

## Monthly
Inputs to ask for: the tool's segment counts for the engagement tiers and each segment's attributed revenue for the last 365 days (for RFM and the sunset slice). Sunset proposal (named slice), deliverability recheck, segment refresh (RFM rescore), next month's send calendar, a look at what competitors sent if the marketer forwarded examples.

## Recurring weekly (optional)
On the marketer's yes and their time zone, `gooseworks:automation_upsert` creates an agent job, saved paused, under the `spend-gate` skill (`../../spend-gate/SKILL.md`)'s automation rule (the run makes no paid data calls; the yes names that). The server-side agent does not have this playbook, so the prompt is self-contained: never send; read the newest run record in `runs/email-lifecycle/` and `lifecycle/program.md`; mark a recommendation done only from the flows list or the marketer's word, never judge a flow on opens; write `lifecycle/broadcasts/<date>.md` with stock marked "confirm" and the results-export request at the top of the file (an unattended run cannot ask); skip the flow refresh without an export; write the week's run record (`runs/email-lifecycle/weekly-email-check/<date>.md`, counts only, "no export this week" when there was none, every open recommendation carried forward) — rules in `run-memory.md`.

## Seasonal (Black Friday / holiday / the brand's big moment)
Start 4–6 weeks out: build engagement first (send the engaged segment more good content so inbox providers see a healthy sender before volume rises); VIP early access; suppress recent buyers from discount sends; a shipping-cutoff send; a pull-back week after; the post-season welcome for new customers. Volume increase and offers are proposals with end dates.

## Incidents — "pause now" list first, then a staged draft behind the high-stakes gate

Incident mode skips the brain read, intake and audit, and the pause list needs no GooseWorks data: give it in the first reply, before any tool call, then connect. The first reply is the pause list as click-by-click steps the marketer takes in their tool. The agent never changes a flow's or campaign's status itself — not even to pause, even if a connector would let it. Read the brain only after that, for the correction draft.

| Incident | Pause now | Then |
|---|---|---|
| Stock-out of a featured product | every flow block and broadcast featuring it (list them by name) | swap to the named fallback product; a waitlist / back-in-stock capture; a back-in-stock flow when it returns |
| Spam-complaint or unsubscribe spike | all promotional sends; keep transactional | triage per `deliverability.md`; engaged-30 only for 2–4 weeks; find the send and the source that caused it |
| Send mistake (wrong price, broken link, wrong segment, "Hi ,") | the remaining batches / the flow step | a short correction draft (only when the mistake affects the reader — a broken link usually doesn't need an apology email); whether to honour a wrong price is the marketer's call |
| Leaked or stacking code | the code's use in flows | a new code pool; expiry or usage limit on the leaked code proposed to the marketer |
| Checkout or site outage during a send | the remaining sends and SMS | a "we're back" note only to the people who clicked during the outage |
| Brand incident (a viral complaint, recall or safety issue — often flagged by research-market, which posts a hold list in chat naming the promo emails that touch the product) | every promotional send and any flow featuring the affected product; transactional only | a short holding note drafted for the marketer's read, matching what the brand says on social; promos resume only on the marketer's yes |
| Account suspended by the tool | everything | gather the tool's stated reason; answer its compliance questions with consent evidence; no switching tools in a panic |
| Data-privacy request (delete / unsubscribe everywhere) | — | name the tools where the person must be suppressed; the marketer executes |

Every incident draft is flagged high-stakes for a human read before staging.
