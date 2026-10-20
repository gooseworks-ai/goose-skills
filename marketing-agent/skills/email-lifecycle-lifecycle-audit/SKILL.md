---
name: email-lifecycle-lifecycle-audit
description: >-
  Step of the email-lifecycle playbook: audits list, consent, live flows, recent sends and sending
  setup, marking every item verified, from-you or unknown. Run email-lifecycle instead; not for direct
  use.
version: 0.1.0
---

# lifecycle-audit

**Reads:** the optional audit items from intake message 1 (flows list, 90-day campaign report, list size, the "original" text of one recent campaign, the spam-rate chart — it asks nothing separately); `lifecycle/program.md` and the latest `lifecycle/deliverability/*.md` if present; the latest `reports/performance/*.md`; whatever the marketer handed over (tool exports, screenshots, Postmaster chart); the customer's own email-tool connector if the host has one (read only). Loads `../email-lifecycle/references/deliverability.md` and `../email-lifecycle/references/benchmarks.md`.

**Does:**
1. **Plumbing.** For each checklist item in `deliverability.md`, collect evidence. Authentication is green only from a marketing test email's headers (sent through the email tool) showing `spf=pass`, `dkim=pass` aligned with the From domain, and `dmarc=pass` — SPF on the tool's own return-path is fine (Mailchimp, and HubSpot without a dedicated IP, can't align SPF; that is not a fix item). Check the headers came through the email tool (its Return-Path or DKIM signature, a List-Unsubscribe header) — a personal Gmail or Workspace email's headers don't count and stay unknown; with a shell, `dig TXT` supports it (return-path domain, `_dmarc`, DKIM selector). A root-domain record alone is "present — not verified for marketing mail". Mark every item verified / from you / unknown. Never mark unknown items green.
2. **List.** Size; engaged-30/90 counts and share (clicks and orders, not opens); growth and churn in the last 30 days; consent source per channel; any bought, scraped or marketplace-sourced segment (hard stop for those contacts); last send date (6+ months dormant → re-permission first).
3. **Flows live** — in the email tool and in the store platform (Shopify's default abandoned-checkout email, Shopify Email automations, review-app request emails such as Judge.me or Okendo), so the build order can switch off duplicates. Name, trigger, status, message count, the last 90 days' recipients, conversion or revenue per recipient. Look for the classic breaks: buyers still receiving cart emails (no "placed order since" filter), overlapping flows with no priority, dead or expired codes, links to removed products, missing fallbacks.
4. **Read-back against last cycle.** For each flow in `lifecycle/program.md`, compare its recorded hypothesis and target — and the last run record's numbers for it (`../email-lifecycle/references/run-memory.md`: same window length, same attribution setting, settled, never opens) — with this cycle's result (the weekly read's email rows or the marketer's export): beat it → keep, promote the winning test; missed it → its weakest message is first in line to rewrite; no data → "not measured". Write each flow's result and next hypothesis into the state block for step 2's ranking.
5. **Recent sends (90 days).** Cadence by segment, revenue or conversion per recipient, unsubscribes, complaints, bounces; the worst three sends and why.
6. **Verdict.** GREEN / AMBER / RED with the blockers first. Only missing consent or complaints ≥ 0.3% stop the writing. Red or unknown authentication blocks switching on and broadcasts, not drafting: flows are still written, marked "switch on after fix #N", and unknown items go on the marketer's fix list. Bulk-sender rules are requirements at ≈ 5,000+ a day to Gmail/Outlook (a list above ~5,000 with unknown Gmail share is treated as bulk); below that, amber best practice. If the list's main market is one where people buy over chat (India, Southeast Asia, Brazil, much of Latin America), the first line says WhatsApp is likely the main channel and is not covered yet.

**Writes:** the report in the format at the end of `deliverability.md`, shown to the marketer before any writing, and saved later as `lifecycle/deliverability/<YYYY-MM-DD>.md`. A short "state of the program" block (list, flows live with last cycle's result vs target, what is broken, what is missing) feeds the flow choice. In chat, the report names no tools or ids — "your sending isn't verified yet: here's the one setting to change".

**Never:** estimates a number it did not see; calls opens engagement; treats an AI guess of the tool's setting as verified.
