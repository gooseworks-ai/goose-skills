# Local mode for run-paid-campaigns

Load at Before you start 1 when GooseWorks isn't connected (the `marketing-guide` skill (`../../marketing-guide/SKILL.md`) §5). Every `gooseworks:` call in this playbook, its steps and its references is skipped. The table says what replaces each one; everything else runs as written. The levers are the marketer's ads-platform connector (by `meta-levers.md` § With an ads-platform connector) and written instructions (`written-instructions.md`).

| Where | With GooseWorks | Local mode |
|---|---|---|
| Brief and rules (Before you start 2) | the brain, `campaign_read` | the newest approved plan in `gooseworks-local/<brand-slug>/plans/<slug>/`, `brand-notes.md`, claims through the claims gate |
| Baseline audit (step 0, `baseline-audit.md`) | exports plus `meta_read` for the ads GooseWorks made | the connector's account-wide reads, else the exports; no ad is "GooseWorks-made" |
| Health gate (step 1, `launch-and-graduate.md`) | `push_status`, `meta_read` pages | the connector's delivery, disapproval and Page reads, else the marketer's export or screenshot; a check nothing can show is "unknown" and asked |
| Weekly read (step 3, `reading-results.md`) | `meta_read` trailing windows, by subtraction | the connector's own date-range reads (exact windows, no subtraction), else the export; coverage = the share of spend they show |
| Outcome check (step 2, `run-memory.md`) | `change_status`, `push_status`, the server's `decisions.md` blocks | the local `decisions.md` blocks (every one is yours), the connector's read-back values and times, the marketer's "done" |
| Money-move recipe (`run-memory.md` § The baseline recipe) | `meta_read` by subtraction, else the ad-set export | the connector's date-range read for the stored ad ids, else the ad-set export |
| Launch (step 5, `launch-and-graduate.md`) | routes 1–2 (GooseWorks pushes); make-static-ads' batch files; `video_read` | route 3 (written launch cards), or new campaigns, ad sets and ads created **paused** through the connector, each switched on by its own named yes. Creative is the marketer's own files or ads already in the account, checked here (health gate item 3) |
| Stage and apply (steps 7–8) | approval pages, the pause tool | connector cards and written instructions (the apply-and-log skill's lever list) |
| Targets and caps (`proposal-and-log.md` § The yardstick in the brain) | brain proposals | the approved plan's numbers; a target the marketer states goes to `brand-notes.md` through save-learning |
| Schedule (Output, Recurring) | `automation_upsert` | marketing-guide §3 Schedules, local branch |
| Saving | the workspace and brand documents | the same paths under `gooseworks-local/<brand-slug>/`, through the save-to-brain, run-memory and write-report local branches |
