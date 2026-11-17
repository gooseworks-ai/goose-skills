---
name: brand-approval-check
description: Post-launch check for campaign 24375984134 (Assistedly.ai Brand (MA)) in
  account 5871596696. Verifies both RSA policy approval statuses and early
  delivery, appends a timestamped status line to
  output/brand-approval-check.log, and writes the one-shot report
  reports/2026-10-20-brand-approval.md on the first run where both ads are
  APPROVED. Scheduled for 2026-10-20 only.
---

# Assistedly.ai Brand (MA) — ad approval check

Run the ad-approval check for the Assistedly.ai brand campaign
  (campaign 24375984134, account 5871596696, config
  /Users/dev/google-ads-optimizer/config/google-ads.yaml):

  1. Execute with the shell tool:
     /Users/dev/google-ads-optimizer/venv/bin/python
     /Users/dev/google-ads-optimizer/scripts/check-brand-approval.py
  2. Report the output in a few lines: ad approval statuses
     (REVIEW_IN_PROGRESS vs APPROVED) and delivery
     (impressions / clicks / cost / conversions).
  3. If the output contains FIRST_APPROVED, state that the launch gate
     passed and that reports/2026-10-20-brand-approval.md was written; the
     next gate is the 7-day review (~2026-10-27).
  4. If the output contains CHECK_FAILED, report the error class and message
     only (the script never prints secrets).

  Rules: never print secrets; never fabricate metrics.
