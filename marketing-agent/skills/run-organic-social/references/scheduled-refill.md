# The scheduled refill (every two weeks, nobody present)

Load at step 8, only after the marketer said yes to the repeat. The scheduled worker runs on the GooseWorks server. It has **no skills folder, no browser and no shell**, so it cannot load this playbook or its shared atoms. Before creating the automation, copy the method into the brand's workspace, then give the automation a prompt that works on its own.

## 1. Copy the method

With `gooseworks:file_write` (coworker scope), write each file below under `social/method/`. Head each one `Method version: <skill.meta.json version>, copied <YYYY-MM-DD>`. Copy again whenever the automation is changed or switched on, so the worker never runs an old method.

| Method file | Copied from |
|---|---|
| `refill.md` | SKILL.md: step 7 (the refill), steps 4–6 (writing, checking and delivering), "Approval gates" and "Output and write-back" |
| `run-record.md` | references/run-record.md |
| `slot-anatomy.md`, `calendar-craft.md`, `post-checks.md`, `report-shape.md`, `platform-native.md`, `platform-strategy.md`, `voice-card-social.md` | the references of those names (`voice-card.md` becomes `voice-card-social.md`) |
| `plan-calendar.md`, `post-check.md`, `platform-research.md` | this playbook's steps of those names (`../../run-organic-social-<name>/SKILL.md`) |
| `shared/run-memory.md`, `shared/write-report.md`, `shared/save-to-brain.md`, `shared/spend-gate.md`, `shared/claims-gate.md`, `shared/voice-card.md`, `shared/disclosure.md` | the shared skills of those names (`../../ad-policy-check/disclosure.md` for disclosure) |
| `shared/claim-types.md`, `shared/proxy-endpoints.md` | `../../claims-gate/claim-types.md` and `../../spend-gate/proxy-endpoints.md` (only verified endpoints are called) |

**Tell the worker how links map** (first line of `refill.md`): `references/<x>.md` and `../run-organic-social/references/<x>.md` mean `social/method/<x>.md`; `../run-organic-social-<x>/SKILL.md` (this playbook's own steps) means `social/method/<x>.md`; any other `../<x>/SKILL.md` or `../../<x>/SKILL.md` means `social/method/shared/<x>.md`, and a file beside a shared skill (`claim-types.md`, `proxy-endpoints.md`, `disclosure.md`) means `social/method/shared/<file>`; `voice-card.md` in references means `voice-card-social.md`.

Also copy the brand-specific settings the worker needs into `social/method/brand.md`: the platforms and accounts in the plan, the time zone, the marketer's posting windows, who approves each named person's posts, and the per-run ceiling (or "free sources only").

## 2. Create the automation

`gooseworks:automation_upsert` with `execution_mode: "agent"`, the prompt below as `agent_prompt`, a cron every second week in the marketer's time zone (the day before the calendar runs out), and `enabled: false` (spend-gate branch C). Switch it on only when the marketer says so, and copy the method again at that moment.

```text
Social calendar refill (every two weeks, nobody present) for brand <brand name> (<brand_id>), workspace scope <scope>. Method version <version>, copied <date>. Read with file_read, in this order: social/method/refill.md, social/method/brand.md, social/method/run-record.md, then the other social/method/ files and social/method/shared/*.md as they are referred to. Ask nothing. Never post, schedule, publish, approve or spend beyond the spending rule: drafts in files and proposals only. Never accept a proposal.
1. Start (social/method/run-record.md and social/method/shared/run-memory.md): the last record is the newest file under runs/run-organic-social/social-calendar/. Read it whole. None → say this is the first tracked run, invent no "since last time", and freeze baselines from this run's reads. Check each open recommendation and format test from a source only: brand_read organic own posts (TikTok/IG), social_analytics_get, social_post_list, the paid own-post reads inside the ceiling. Nothing shows it → unknown, asked once in "Decisions for you" with today as asked-on.
2. Reconcile every calendar slot in social/calendar/ dated before today that isn't reconciled, plus the record's too-new and not-read rows. Don't ask which posts went out: what no source shows is not read. Score settled posts (3+ days old) against the frozen baselines; give each test a verdict or carry it with its first id.
3. Read the brand brain: brain_map core and chapters 11, 14, 15, 19, 20, 23 when brain_* tools are listed, otherwise brand_read lean and knowledge_search. Apply every rule and never-list item. Refresh only platform cards older than 30 days, and only if you have web search; otherwise keep them and say so. Read the voices (social/method/platform-research.md §3c) only with free sources or inside the ceiling; otherwise skip and say so.
4. Write the next two weeks (social/method/plan-calendar.md, social/method/slot-anatomy.md, social/method/calendar-craft.md), carried tests first. Claims: only signed-off lines or plain product facts; no new claim sign-off without the marketer, so any other claim line is cut and asked in "Decisions for you". Posts that speak for a named person say "needs <approver>'s yes". Designed slots get slide copy only (no renderer here). Check every post (social/method/post-check.md). Save social/calendar/<start-date>.md.
5. Write the report (social/method/report-shape.md, social/method/shared/write-report.md) to social/plans/<YYYY-MM-DD>-social-plan.md, opening with "Since <last run date>", and import it (social/method/shared/save-to-brain.md, title "Social plan — <brand name> — <YYYY-MM-DD>", tags run-organic-social, social-plan, keep-history). Scan it for paths, tool names, ids, codes and brackets before saving.
6. Write the run record at runs/run-organic-social/social-calendar/<YYYY-MM-DD>.md (title "Run record — social calendar — <brand name> — <YYYY-MM-DD>", tags run-organic-social, run-record, keep-history, import). If any import answer shows a price, skip that import, keep the file, and say so in the report. A run that could not read its sources writes "Not run: <why>" and carries every test and recommendation forward unchanged.
Never: save a learning or a measured readout (mark it "readout pending"); change a managed account's strategy (a proposal in "Decisions for you" instead); create or update posts in the product; contact or reply to anyone.
<Spending rule: "Free sources only: X and LinkedIn go unscored this run." | "Paid own-post reads up to <N> credits this run, for the accounts in social/method/brand.md, logged in research/credits-log/<YYYY-MM>.md; stop at the ceiling.">
```

## 3. Tell the marketer

One line on what the repeat does and doesn't do: "Every two weeks it reads how your posts did, writes the next two weeks and saves the report to your brand. It never posts, and it asks before anything that needs your yes." If X or LinkedIn is in the plan and there's no ceiling, add that those platforms go unscored (step 8). Its own run cost is unknown until the first run; show it afterwards from `gooseworks:automation_list`.
