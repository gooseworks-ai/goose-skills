# Monthly unit-economics read and the daily pulse

## Monthly unit-economics read (first Monday of the month — its own file, summarised in that week's report)

Feeds plan-campaign's monthly replan. Saved as `reports/performance/monthly/<YYYY-MM>.md` and registered as a brand document (the `save-to-brain` skill (`../../save-to-brain/SKILL.md`), keep-history — a period artifact; local mode: its local branch, under `gooseworks-local/<brand-slug>/`). Delivered through the `write-report` skill (`../../write-report/SKILL.md`). Needs a customer-level store export (orders by customer for the last ~120 days) for the cohort lines — ask for it in that week's one input message.

- **MER and new-customer MER trend** over the last 3 months, monthly, vs break-even.
- **nCAC trend** vs allowable; **payback**: months of contribution to recover nCAC (B2B: CAC payback in months).
- **Cohort repeat** (DTC): of last month's and the month before's new customers, the share that bought again within 30/60/90 days, from the store export — judge customers by what they do over time, not day one.
- **Channel scorecard**: each channel vs its target from the brief, over the month, on blended/store-joined numbers; channels missing target two months running are named for plan-campaign.
- **Tests ended this month** and their calls; **learnings due for review** (REVIEW BY passed) — proposed in the decisions block to re-confirm, downgrade or retire (they need the marketer's words).
- **Brand signals**, only if a sibling has written them: research-market's sentiment counts from "What people are saying" (share of voice only if the section has it), improve-search-visibility's last check and citation movement. This playbook does not measure them.

## Daily pulse (interim, exception-only)

Interim until a watch-and-alert layer exists. Runs only when the marketer asks ("anything on fire?") or on a schedule they explicitly approved. **Says nothing unless a threshold breaks** — a pulse that reports every wobble trains over-reaction.

**It opens with what it can see** ("I can see Goose ads on Meta (31% of Meta spend); nothing else"), and never gives an all-clear on spend it can't see — instead: "Paste today's numbers from <platform> if you want those checked."

**Inputs, by mode** (2 minutes, plus anything the marketer pastes):
- **GooseWorks connected:** `meta_read` performance over the last 1–3 days, and `push_status` for the push ids in run-paid-campaigns' `state.md`.
- **Local mode** (`local-mode.md`): the marketer's ads connector over the last 1–3 days (account-wide, read-only), else today's export or screenshot; the paid run's local `state.md` for what was launched. No `gooseworks:` call. With neither a connector nor numbers pasted, there is nothing to check: say so in one line.

Checks (on what the inputs show; "Goose ad" below means any ad the inputs cover):
- Pacing: month-to-date spend more than ~15% off plan.
- Spend anomaly: a Goose ad set with zero delivery, or a day's spend > ~1.5× its normal.
- Rejections / failed creatives on a recent push.
- A Goose ad's CPA past ~2× allowable on mature data with real spend.
- A known stock-out or ended offer still being advertised.
- Zero reported conversions on a day with normal spend (cheapest catch of a tracking break).
- Fatigue: a Goose ad's 3-day CTR well below its 28-day CTR at steady spend.

After a launch, the first pulse (T+2) is the 48-hour read: pacing, rejections, early CTR vs the brand's norm.

Output when something breaks: one line per issue — what, evidence, the proposed action and who takes it (almost always run-paid-campaigns, as a pause/swap proposal behind its gate). Otherwise: "Nothing needs you today in what I can see" — plus the coverage line.

Scheduling either the Monday report or the pulse is a standing configuration change: offer once, and create it only on an explicit yes, by marketing-guide §3 Schedules:
- **GooseWorks connected:** `gooseworks:automation_upsert`; say scheduled runs use credits; the method copied into the workspace and the self-contained prompt in `run-memory.md` § Setting up the schedule.
- **Local mode:** the host's own scheduler, created off; its prompt names this playbook, the brand, local mode, the pulse or weekly job, and the scheduled rules in `run-memory.md` § Scheduled runs (read and report only; ask nothing). It reads the connector, or the exports the marketer left in the folder. No host scheduler → say it isn't available here. Never `gooseworks:automation_upsert`.
