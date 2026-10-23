# server-needs — research-audience

What this playbook needs that the customer's GooseWorks connector does not have. Checked against gooseworks-app `origin/dev` (a31cc243d, 19 Oct 2026) and the staging tool list. Ordered by priority. Each: the need, the exact ask, and what the playbook does meanwhile.

## Managed lead and contact access

The implementation adds `marketing_data_describe` and `marketing_data_lookup` to the connector. Describe exposes only curated current operations and schemas; lookup defaults to a free request-bound quote and requires approval before execution. It supports people/company search and enrichment plus work-email finding and verification through existing managed providers. Deployment is required before these appear on a customer's connector. The playbook checks the live tool list and uses its public/export fallback on older deployments.

Follow [references/data-sources.md](references/data-sources.md) for the full search-before-reveal, per-row verification and budget rules. Never request mobile/phone enrichment or personal email. LinkedIn engagement candidates come from research-competitors; they may be qualified in list mode but engagement alone proves neither pain nor consent. Personal data stays in workspace files; aggregate reports and credit logs contain counts and query kinds only.

## Other needs

| # | Need | Step | Meanwhile |
|---|---|---|---|
| 5 | **Job-change and hiring feeds** (role changes for named people; job posts by company and function) | Watches, signals | Champion watch through the paid LinkedIn profile read (snapshot, then compare), only for the champions list (public praise under their own name, or people the marketer named); hiring through careers pages and job boards via web search. |
| 6 | **Scheduled runs with an enforced credit ceiling** — `automation_upsert` jobs have no spend-limit field | Watches | Per spend-gate's automation rule: created paused; the yes names a standing per-run ceiling; the ceiling lives in the job prompt. |
| 7 | **A lists / contacts store in the product** (rows, statuses, suppression every playbook respects) | List, ledger | Files in the brand coworker workspace (`research/audience/`). Risk: with no coworker, a teammate can't see the ledger. Personal data never goes to the brain. |
| 8 | **CRM read** (customers, open deals, past contacts) for exclusions and inbound scoring | Before you start, score-a-list | The marketer uploads or pastes an export. |
| 9 | **Web page reading through the proxy** for hosts with no web tool | Free pass | Host web tools; hosted chat without them gets thinner lists, said plainly. |
| 10 | **Fresh firmographics and funding** | Signals | Funding counts only with a dated press source, never alone. |
| 11 | **A sending layer** (domains, warm-up, sequences, reply handling) | — | Out of scope. write-outreach drafts; the marketer sends from their own tool. GooseWorks' @agentmail.to inbox is not a cold-email sender. |
