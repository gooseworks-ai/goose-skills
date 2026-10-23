# server-needs — write-outreach

What this playbook would use that the GooseWorks connector does not have (checked against gooseworks-app `origin/dev`, 19 Oct 2026). Ordered by priority.

| # | Need | Step | Meanwhile |
|---|---|---|---|
| 1 | **A sending layer for cold email** — the customer's own domain and mailboxes (connected, not a GooseWorks inbox), warm-up, per-mailbox daily limits, stop-on-reply, opt-out handling, bounce and complaint feedback | Deliver | Drafts and a send file only; the marketer sends from their own tool. The only GooseWorks mailbox is a new workspace inbox on @agentmail.to — sending cold email from it would hurt deliverability and wouldn't come from the customer's domain, so this playbook never uses it. |
| 2 | **Email verification on the connector** (research-audience server-needs #1) | 6, send file | Rows not marked checked get "check before sending"; the marketer runs their own checker. |
| 3 | **Reading replies and campaign stats** from the customer's sending tool or mailbox | Results mode | The marketer pastes or uploads replies and numbers. |
| 4 | **LinkedIn sending** (invites, messages) | — | Not wanted: LinkedIn restricts automated outreach; the marketer sends by hand or with their own tool. |
| 5 | **A lists / contacts store in the product** with statuses and suppression every playbook respects (research-audience server-needs #7) | Ledger | `research/audience/ledger.csv` in the brand coworker workspace. |
