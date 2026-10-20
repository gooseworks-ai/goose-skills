---
name: analyze-performance-intake
description: >-
  Step of the analyze-performance playbook: gathers the week's numbers from tools, exports and pastes,
  cleans them, and writes the coverage line or switches to claims-only mode. Run analyze-performance
  instead; not for direct use.
version: 0.1.1
---

# Intake, hygiene and coverage (atom)

**Load:** `../analyze-performance/references/measurement-contract.md`.

**Inputs:** the measurement contract (company type, referee, channel roster); tool reads (`meta_read performance`, `social_analytics_get`, `ads_creative_read`, `video_read`, `campaign_read`); the marketer's connectors / exports / screenshots / pastes from the one input message.

**Do:**
1. Start from the minimum useful read (contract §4) and tick the rest against the roster; big pasted exports are totalled in code when a code tool exists; with none, never totalled by eye — ask for the summary report and mark the referee not measured until it arrives (contract §4); never echoed. Then: what arrived, what didn't ("not checked this week" — no mid-run asks).
2. Hygiene: strip test, wholesale, staff orders and subscription renewals from new revenue; net refunds; align timezone and currency; note discount depth.
3. Maturity: compare this week as first reported with last week as first reported; show last week restated separately. Exports are the week's source; `meta_read` identifies Goose ads and cross-checks — de-duplicate by ad id.
3b. Save the input summary to `reports/performance/inputs/<YYYY-MM-DD>.md` for run-paid-campaigns to reuse.
4. Coverage line: per channel — truth / claimed / not measured / not used; share of Meta spend seen in detail.
5. The type's referee missing (or no total spend) → claims-only mode (labels, no MER, calls capped at first look, first-line notice).

**Output:** a clean dataset per channel with labels, the coverage line, and the list of asks for next week.
