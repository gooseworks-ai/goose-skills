# Run memory for email-lifecycle

What this playbook hands the `run-memory` skill (`../../run-memory/SKILL.md`) at the start and end of every run. The atom finds the last record, checks recommendations, writes "since last time" and saves the new record. This file says what is specific to email: the numbers, where they come from, and how to tell whether last run's recommendations happened and worked.

## Jobs

| Mode | `job` | `cadence` | `subject` |
|---|---|---|---|
| build | `email program build` | `ad hoc` | — |
| weekly (asked, or the paused automation) | `weekly email check` | `weekly` | — |
| monthly | `monthly email review` | `monthly` | — |
| seasonal | `seasonal email plan` | `ad hoc` | the moment's slug (`black-friday-2026`) |
| incident | `send incident` | `ad hoc` | — |

`playbook` = `email-lifecycle`. Records live in `runs/email-lifecycle/<job-slug>/[<subject>/]<date>.md`.

**When each Start step runs.** Atom steps 1–2 (find and read the last record) run before intake, so intake message 1 asks for the export that covers the windows last run's recommendations need. Steps 3–4 (check each recommendation, write since last time) run inside step 1's audit, once the marketer's exports are in. Never write since last time before the numbers exist. With no export, say so: "not measured this time".

**One program, several jobs.**
- **Recommendations.** Find the newest record across all the email jobs: `file_list` `runs/email-lifecycle/`, then each job folder. Its open recommendations, whichever job made them, are checked this run. A weekly check follows up what the build run recommended.
- **Numbers.** Compare only with the newest record whose window has the same length: weekly against weekly, monthly against monthly. A build run's 90-day read is the baseline for the first monthly review. Never compare a 7-day window with a 90-day one.
- **Incidents.** An incident record is short: what happened, the pause list given, and what the marketer said they paused. The next weekly check reads it, so a paused flow isn't judged as a failing one.

**What it does not replace.** `lifecycle/program.md` stays the source of truth for flows live and staged, each flow's hypothesis and target, segments and cadence. `lifecycle/deliverability/<date>.md` stays the full deliverability report. The run record holds only the numbers below, the recommendations with their baseline recipes, and their outcomes, and it links those files by path.

## Numbers (from the exports the marketer gave)

Every number needs four things:
- **its window:** start and end dates;
- **its source:** "from your <tool> export, <date>", the tool's dashboard via the customer's own read-only connector, or analyze-performance's latest report;
- **the tool's attribution setting:** e.g. "5-day click";
- **a label:** `claimed` for revenue the email tool attributes to itself. `truth` only when joined to the store's or CRM's own orders.

Nothing seen → the cell says "not shared", never an estimate.

| Block | Numbers |
|---|---|
| Per live flow | recipients; click rate (unique clicks ÷ recipients); placed-order or conversion rate; revenue per recipient; unsubscribe rate. Also messages live in the flow, and the test running, if any |
| Broadcasts | sends in the window; recipients; revenue per recipient; unsubscribe, complaint and bounce rate per send (the worst one named) |
| Deliverability | spam-complaint rate (from Google's sender dashboard if shared, else the tool's own); bounce rate; authentication as verified / from you / unknown (from the audit, never upgraded here) |
| List | size; engaged in the last 90 days (clicks or orders); net growth in the window |

**Opens are not a result.** Apple Mail's privacy feature marks most messages as opened. So an open rate never judges a flow, a subject line or a recommendation, and it is not recorded as a flow result. The one use: a sudden drop at one mailbox provider can be a deliverability warning. If the export shows that, record it under deliverability as "possible inbox placement problem", with the provider.

**Settled windows.** A window ends at least the attribution window before today (5 days for a 5-day-click setting), because later orders are still being credited.

## Recommendations and how to check them

The run's moves become recommendations. They come from:
- the build order ("switch on the abandoned-checkout flow, switch off Shopify's default one");
- a flow change ("add a second cart email at 24 hours");
- a deliverability fix;
- a test;
- the sunset slice;
- a cadence change.

Each recommendation carries:
- **id:** `<YYYYMMDD>-<n>`.
- **owner:** usually `marketer`, because they load and switch on everything.
- **review by:** a relative timing at first, because nobody knows yet when the marketer will switch it on. A flow change or new flow is `4 weeks after live`, or once it has reached the volume test below, whichever is later. A deliverability fix is checked at the next run. The run that first sees it live records `live since <date>`: the flows list's own date, the marketer's date, or else the first date seen, marked as such. From that day the review date is fixed. Never judge from the date it was recommended.
- **parts:** a move with several parts ("add a second cart email and a buyer filter") is `done` only when every part is shown, else `not done (partly: …)`.
- **how we'll know:** the flow, the metric (revenue per recipient, or placed-order rate for flows that don't sell directly), the threshold, and the **baseline recipe**: the flow and its message count; the window length; the attribution setting; the recipients in the baseline window; the baseline value with its label.

**Did it happen? `done` only from a source:**

| Recommendation | Done when |
|---|---|
| Switch a flow on or off, add or change a message | the flows list (export, screenshot or read-only connector) shows it live with the new message count, or the marketer says so here |
| Deliverability fix (authentication, DMARC, unsubscribe header) | a new marketing test email's headers show it passing (the audit's rule) |
| Sunset or cadence change | the marketer says so, or the next export shows the suppressed segment |
| A test | the tool shows both versions running, with their split |

A written flow in `lifecycle/flows/` means "drafted, not live", which is `not done`.

**Did it work?** Re-pull both windows from the export the marketer gives this run, never from last run's number, which was still filling in:
- **Before:** the same length, ending the day before it went live.
- **After:** starts the day after, and settled.
- **Both:** the same attribution setting.

Verdicts:
- **`worked` / `didn't work`:** revenue per recipient (or the flow's metric) before → after, with recipients in each window and the label. Say if unsubscribes or complaints rose.
- **`too early`:** fewer than about 30 orders in either window (or 1,000 recipients for a non-selling flow). Give the date it should be readable.
- **`can't tell`:** for any of these reasons:
  - a sale, a tentpole like Black Friday, a price change or a stock-out falls in only one window;
  - the flow's trigger or filters changed too;
  - tracking or the attribution setting changed.

  For seasonal windows, compare with the same weeks last year if the export has them.

An open recommendation is carried with its id into this run's build order and decisions, marked "still open from <date>", never re-issued as new. A move that didn't work isn't recommended again without a new reason. A test that won is promoted in `lifecycle/program.md`, and the record notes that it was.

## Scheduled weekly run (nobody present)

The atom's scheduled rules apply in full. In this playbook:
- An unattended run usually has **no new export**. It still reads the last record and writes a new one.
  - Its numbers say "no export this week". Only a record with numbers becomes a baseline.
  - It carries every open recommendation forward.
  - It puts the export request at the top of the broadcasts file, and any `unknown` once in "Decisions for you".
- **The automation prompt** (`modes-and-incidents.md`, "Recurring weekly") must include these instructions, because the server-side agent doesn't have this playbook:
  - Read the newest record in `runs/email-lifecycle/`.
  - Never mark a recommendation done without the flows list or the marketer's word.
  - Never judge a flow on opens.
  - Write the new record with counts only, never names or email addresses.

## Never

- Never put an email address, a name or a phone number from an export in the record. Counts and segment names only.
- Never compare flows with each other on these numbers. Each flow is compared with its own last window and its own target (`benchmarks.md`).

`outcome_sources` = the marketer's exports and screenshots (flows list, 90-day or weekly report, Google's sender dashboard); the customer's own email-tool connector (read only); analyze-performance's `reports/performance/<latest>.md` email rows; `lifecycle/program.md`; a test email's headers; the marketer's own word in the conversation.
