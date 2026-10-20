---
name: email-lifecycle-broadcast-planner
description: >-
  Step of the email-lifecycle playbook: builds the month's send calendar and writes this week's email
  and SMS broadcasts against the approved cadence and segments. Run email-lifecycle instead; not for
  direct use.
version: 0.1.0
---

# broadcast-planner

**Reads:** make-content's next newsletter issue if any; `../email-lifecycle/references/segments-cadence-offers.md`, `../email-lifecycle/references/copy-craft.md`, `../email-lifecycle/references/sms-push-whatsapp.md`, `../email-lifecycle/references/modes-and-incidents.md` (seasonal); the approved cadence and segments from `lifecycle/program.md`; the brand's promotional calendar and launch dates (brain or asked); campaign records with an email/SMS leg via `gooseworks:campaign_read`; last week's results from the latest `reports/performance/*.md`; stock for every product it will feature (asked if the brain does not hold it).

**Does:**
1. **The month's calendar.** One row per planned send: date, segment, type (value / promotional / launch / newsletter), the one idea, offer if any (from the ladder only), channel. Campaign moments come from plan-campaign's brief; the rest are filled to the approved cadence with roughly 60–70% useful sends in non-sale weeks; a pull-back week after any tentpole. Flags blackout dates and shipping cut-offs. Totals the month's sends (sequences built as broadcasts + broadcasts + newsletter, after exits) against the plan's monthly send limit; spreads the sends or proposes the upgrade.
2. **This week's sends, finished.** Per send: segment and exclusions (recent purchasers, people mid-checkout flow, unengaged), send time and time-zone basis, subject + 2 alternates, preview, body, CTA with tracked URL, plain text, the test (subject, send time or offer; winner on clicks or orders; test slice size), stock confirmed for each featured product. Newsletter: slot make-content's issue (`content/newsletter/<date>.md`) with segment, send time and exclusions; this atom does not write the issue.
3. **SMS** only for high-intent moments with SMS consent, with brand name, STOP language, quiet hours, segment count.
4. **Margin box** from offer-math beside every discount.

**Writes:** `lifecycle/calendar/<YYYY-MM>.md` and `lifecycle/broadcasts/<YYYY-MM-DD>.md` (week starting date), plus the same in chat.
