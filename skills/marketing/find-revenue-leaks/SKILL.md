---
name: find-revenue-leaks
description: >-
  Runs every public revenue playbook a store's connected tools allow, in one pass, and returns a
  ranked list of leaks and plays with the money at stake. Use when: find where my store is losing
  money; run all the revenue checks; audit my store for revenue leaks; what's broken in my ads,
  email and checkout; check everything I've connected; run every playbook against my Shopify, Meta,
  Google, Klaviyo and Analytics. Read-only: every fix is a recommendation for your yes. Says which
  checks it can run, which it skips and what connecting would add; re-runs show what's new, fixed
  and still open. Not for this week's numbers and what worked — use analyze-performance; not for
  making the changes — use run-paid-campaigns (ads) or email-lifecycle (flows).
version: 0.1.0
---

# find-revenue-leaks

Runs all 51 public revenue playbooks against one brand at once. Each playbook is a check: which tools it reads, the exact question, the innocent explanation to rule out, and what to do with the answer. This skill picks the checks the brand's tools allow, runs them read-only, sizes what it finds, and hands back one ranked list.

## What you get

- **One report** (`references/report-shape.md`): a ranked table of leaks, then plays, each with its **estimated monthly money at stake** (the math, the window and the source shown; "not sized" where the data can't support a number), **how sure**, **effort** and who does it, the recommended action, and a link to the check's public method page. Then the clean checks, and the skipped checks grouped by what connecting would add.
- **A run record**, so the next run opens with what's new, what was fixed and what is still open.
- **Nothing changed** in any account. Every "pause", "fix" or "send" is a recommendation for the marketer's yes.

## Before you start

1. **Setup:** do the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2 (connect, brand, brain read). The job line is "I run these checks through it." Call `get_started` with `wants: "analyse"`. This skill offers **local mode** (guide §5, `references/local-mode.md`): the checks read the marketer's own tools and public pages, so without GooseWorks it runs on their connectors and exports and keeps its notes in the local folder.
2. **Read the brain** for what the checks need filled in: products and bestsellers, the shipping countries, margins or product cost, the sending domain, competitors (the brain's competitor list), offers and codes, and the accounts. Brand Brain tools when listed (`brand_knowledge_browse`, then the chapters the checks need), else `gooseworks:brand_read` (lean: summary, products, competitors, accounts, learnings) and `gooseworks:knowledge_search`.
3. **Load the last run** with the Start steps of the `run-memory` skill (`../run-memory/SKILL.md`), job `revenue leak check` (or `quick leak check`), per `references/run-memory.md`. No record → first run; this run is the baseline.

## Steps

### 1. Work out what can run, and say so first (free)

Load `references/coverage.md`. For each tool, settle **available** (a live read-only connector that answered one read, GooseWorks' own analytics or social read when connected, an export in hand, or a no-login check), **not connected**, or **not used**. A connector counts only when the host lists it and one read returns data; never claim one you can't see. When the brain and the tool list don't say which store, email tool or ad platforms the brand uses, ask once (guide §3, "The marketer's own tools").

Then select every check whose **Needs** are all available, and send **one message** before running anything:
- "I can run N of the 51 checks now" with the tools behind them; the start-here checks first.
- Skipped checks grouped by the tool that would add them ("connect your email tool, or send its flow report: <n> more checks, including your cart and win-back emails"), and which exports would do instead.
- Any blank the checks need that neither the brain nor the site answers (the sending domain, a peak date), and any paid read worth a yes (step 3).

Don't wait on the answer to start the free checks unless an answer changes which checks run.

### 2. Load the checks

Load `references/playbook-index.md` and take each selected check's `ask`, `steps`, `check` and `then` from the public playbook index (the local copy when this folder is the repo checkout; otherwise the public copy on the repo's main branch; otherwise each playbook's own file). If none loads, say so and stop: never run a check from its title or memory.

### 3. Run them, read-only

Load `references/running-checks.md`. Pull each data set once, at the widest window the selected checks need; run each check's `ask` as written; rule out its `check` before calling anything a leak; record found, clean, partial or couldn't run. Only read tools, on every connector and on GooseWorks. Public pages through the host's browser, fetch and web search (the `marketing-data-access` skill (`../marketing-data-access/SKILL.md`) for anything bulk). **A paid read only deepens a free one** (more of the brand's or a rival's ads than the browser can page through): quote it and get one credit yes, to a ceiling, through the `spend-gate` skill (`../spend-gate/SKILL.md`) §B, before it runs. A declined top-up leaves the free result standing.

### 4. Rank

Load `references/ranking.md`. Size each finding by its kind (wasted spend, lost sales, margin given away, spend exposed, upside), with the math, the window and the truth or claimed label; say "not sized" rather than guess. Merge findings that share a cause. Order: tracking breaks that make other numbers unreliable, then leaks by money at stake, then unsized leaks, then plays. Each gets how sure (confirmed, likely, first look) and effort (minutes, an afternoon, a project). Compare with the last run record: new, still open, worse, smaller, fixed, not re-checked.

### 5. Write and deliver the report

Through the `write-report` skill (`../write-report/SKILL.md`) in `references/report-shape.md`'s shape: topic `revenue-leaks`, brand copy `reports/revenue-leaks/<YYYY-MM-DD>.md`, title `Revenue leak check — <Brand> — <YYYY-MM-DD>`, tags `[find-revenue-leaks, revenue-leaks]`, `keep-history`, through the `save-to-brain` skill (`../save-to-brain/SKILL.md`). Its checks, plus: every money figure shows its math and window and says estimate; no playbook example quoted as a result; every finding links its method page; no customer data.

Any suggested ad or page wording that states a fact, benefit or result goes through the `claims-gate` skill (`../claims-gate/SKILL.md`) first, or shows as "needs your OK".

### 6. On the marketer's reply

- **A yes to an action** is handed on, never done here: the marketer makes the change, or it is offered as their next job in plain words ("I can prepare those pauses for your approval in your ads check"). Record their decision.
- **A fact or rule they state** (a margin, a country list, "never discount the hero product") is saved through the `save-learning` skill (`../save-learning/SKILL.md`), in their words.
- **New exports or connections** → re-run only the checks they open, and re-save the same report.

### 7. Save the run

The End steps of the `run-memory` skill (`../run-memory/SKILL.md`), per `references/run-memory.md`: coverage, the findings table with each finding's key and status vs last run, the clean checks, each recommended action as a recommendation (owner, review-by from the check's cadence, "the same check comes back clean"). Re-save it when the marketer replies.

### 8. Offer a schedule, only when it helps

By `references/run-memory.md` § Setting up a schedule: a monthly full run when anything was found; a weekly quick run when a daily or weekly check found something. Created paused (guide §3 Schedules, spend-gate §C).

## Approval gates

- **Nothing changes** in any account: no pause, budget or bid change, send, publish, store, discount, flow or feed edit. Every `then` is a recommendation; a yes hands it to the marketer or to the job that owns it.
- **Credits:** a quote and the marketer's yes before any paid read, one ceiling (spend-gate). Free checks never wait on it.
- **Shopping the store:** browse and reach the payment step only; never pay, order, sign up with a real address or submit a form.
- **Claims:** suggested wording only through claims-gate.
- **Schedules:** created paused; the marketer switches them on.

## Output and write-back

| What | Where | Read by |
|---|---|---|
| The report | delivered by write-report (local file `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-revenue-leaks.md`, or an artifact in hosted chat) + brand copy `reports/revenue-leaks/<YYYY-MM-DD>.md` and brand document "Revenue leak check — <Brand> — <date>" (keep-history) | the marketer; this job's next run |
| Run record | `runs/find-revenue-leaks/<job-slug>/<YYYY-MM-DD>.md` (keep-history) through run-memory | this job's next run |
| Scheduled method | `reports/revenue-leaks/method/` | the scheduled worker |
| Paid reads | `research/credits-log/<YYYY-MM>.md` (spend-gate) | every proxy user |
| Rules the marketer states | learnings through save-learning | every playbook |

Local mode: the same paths under the local brand folder (`references/local-mode.md`).

## Done when

- The opening message said which checks run, which were skipped, and what connecting would add, before anything ran.
- Every selected check came back found, clean, partial or couldn't run, with its window and source; none was run from memory.
- The findings are ranked leaks first, then plays; each has money at stake with its math and window (or "not sized"), how sure, effort and a method link; no example number appears as the brand's.
- Nothing changed in any account; credits were spent only after a yes.
- The report opens from its link and is saved (or the failure is stated), and the run record is saved, so the next run can say what's new, fixed and still open.

## Out of scope

- Making any fix: pausing, budgets and launches (run-paid-campaigns), rebuilding email flows (email-lifecycle), page, checkout or speed fixes (the marketer or their developer).
- The weekly performance read, attribution and "which ad won" (analyze-performance).
- Search and AI-answer visibility in depth (improve-search-visibility); competitor teardowns (research-competitors).
- Standing alerts for the daily checks: not built yet; a weekly quick run covers the gap.
