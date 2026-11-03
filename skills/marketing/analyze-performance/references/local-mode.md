# Local mode for analyze-performance

Load at Before you start 2 when GooseWorks isn't connected (the `marketing-guide` skill (`../../marketing-guide/SKILL.md`) §5). It replaces step 2's reads and the GooseWorks reads line. Every `gooseworks:` call in this playbook is skipped; everything else runs as written.

## What to read instead (free, with the host's file tools)

In `gooseworks-local/<brand-slug>/`:
- `brand-notes.md` (facts and rules the marketer stated) and, through the claims gate, `claims.md`.
- The newest approved plan in `plans/<slug>/` (its Status line says Approved): Economics, targets, Test plan, Measurement plan, Replan triggers. No approved plan → the targets come from the contract or the one message.
- `reports/performance/definitions.md`, the latest dated report and its Decisions, and `reports/performance/inputs/`.
- The paid run's `ads/campaigns/<slug>/state.md`, the `### YYYY-MM-DD — <title>` blocks of its `decisions.md`, and its run records under `runs/run-paid-campaigns/`.
- This playbook's own run records under `runs/analyze-performance/` (run-memory's local branch).

Then the marketer's connectors (read-only: ads platforms, store, CRM, billing, product analytics) and exports, by `measurement-contract.md` §4.

## What changes

- **No GooseWorks reads:** no brain, campaign record, Meta read, social analytics, creative tags or video reads. Every ad is "unannotated" unless the marketer names its angle. Organic numbers come from the marketer's exports or a connector.
- **Saving:** the report, the contract, the inputs and the run records go to the same paths under `gooseworks-local/<brand-slug>/`, through the save-to-brain and run-memory local branches. The report is delivered by write-report's local branch ("saved in this folder"). Kept learnings go to `brand-notes.md` through save-learning. Readouts and worn-out angles are not saved as facts: they stay in the run record.
- **Schedules:** the guide's §3 Schedules, local branch. Never `gooseworks:automation_upsert`.
- **Say once** what local mode can't give (the guide's §5 list), in one line.
