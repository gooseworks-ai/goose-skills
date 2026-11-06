# Local mode for the revenue leak check

Load at Before you start 1 when GooseWorks isn't connected (the `marketing-guide` skill (`../../marketing-guide/SKILL.md`) §5). The checks read the marketer's own tools, so most of this job runs without GooseWorks. Every `gooseworks:` call is skipped; everything else runs as written.

## Why this job offers it

The checks need the marketer's store, ad accounts, email tool and analytics (their connectors or exports) and public pages, all of which the host reaches without GooseWorks. Nothing in a check needs GooseWorks' brand memory or paid data to run.

## What changes

- **The brand** is the one the marketer names (ask if none). Notes live in `gooseworks-local/<brand-slug>/`: `brand-notes.md` (facts the marketer stated, dated), `claims.md` (only if a suggested wording needed a claims decision), and on the GooseWorks paths: `reports/revenue-leaks/<D>.md`, `runs/find-revenue-leaks/<job-slug>/<D>.md`.
- **What it reads first:** `brand-notes.md` (competitors, the sending domain, the shipping countries, the margin, past answers) and the last run record, through run-memory's local branch.
- **Tools:** host connectors and exports only (`coverage.md`). GooseWorks' analytics read and social analytics are gone: Google Analytics needs a connector or an export; social reach comes from the public profile (first look).
- **No paid reads at all.** The no-login checks use the host's browser, fetch and web search; with no browser, the marketer pastes screenshots and links.
- **Saving:** the report through write-report's local branch ("saved in this folder"); the run record through run-memory's local branch; rules the marketer states through save-learning (to `brand-notes.md`). No personal data in the folder: totals and counts only.
- **Schedules:** the host's scheduler only (`run-memory.md` § Setting up a schedule).
- **Say once** what local mode can't give, in one line: brand memory the team can see, GooseWorks schedules, and a copy saved to the brand.
