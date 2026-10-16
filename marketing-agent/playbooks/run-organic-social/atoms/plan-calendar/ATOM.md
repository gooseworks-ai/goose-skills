---
name: plan-calendar
description: Hidden step of run-organic-social. Turns the audit, the mix, the brand's dated moments and sibling inputs into a two-week slot grid — every slot dated, timed, with platform, account, pillar, bucket and source — before any post is written. Loaded by run-organic-social; never listed.
---

# Plan the calendar

Inputs: the account audit, the voice cards, references/calendar-craft.md, and these sibling artifacts (read each one that exists; never fake one that doesn't):
- **make-content's repurposed sets:** `gooseworks:file_list` `content/repurposed/` and `content/drafts/` (unslotted social cuts are the raw material).
- **listen-social's latest weekly report:** `gooseworks:file_list` `social/listening/`, then read the newest `<D>-report.md` (`<D>` = the counting week's Monday). Take the trend read with each trend's post-by date (the reply queue is not ours). If its line-2 `Trends read:` date is older than 7 days, its trends are stale: use only the evergreen fallbacks.
  - `gooseworks:social_inspiration_search` gives the saved outliers.
- **plan-campaign:** `gooseworks:campaign_read` (list mode, then one campaign) for any campaign with an organic leg in the window.
- **analyze-performance's organic "what overperformed" read:** the latest `reports/performance/<date>.md`.
- **The brain:**
  - `gooseworks:knowledge_search` for "this week's focus, live promotions, launches, what not to promote, seasonal calendar"
  - `gooseworks:knowledge_search` `source_types: ["evidence"]` for voice-of-customer questions and phrases
- **The previous calendar:** `social/calendar/` (what went out, what's still queued).

## Procedure
1. **Window.** The next 14 days from the human's chosen start (default: next Monday). State the time zone.
2. **Capacity.** Slots per week per account, from calendar-craft.md's cadence rules. If the human's ask exceeds it, show the numbers and the recommendation, and let them choose.
3. **Fixed slots first:**
   - campaign and launch posts (dated)
   - seasonal and cultural moments for the brand's region. Look each date up with your web tool when you have one; otherwise list the moments and ask the human to confirm dates. Never assume a date from memory.
   - silent days
   - known trends with expiries
4. **Format-test slots:** place the 1–2 approved tests (references/calendar-craft.md, Format tests), with at least 2 slots on each side, and write them in the calendar header.
5. **Series slots next:** each account's 1–2 named series on their days.
6. **Fill the mix:** the remaining slots by the account's bucket ratios, pulling make-content's cuts first (they're finished thinking), then voice-of-customer questions, then pillar ideas.
7. **Flex slots:** 1–2 per week, marked "trend: swap within 48h if one lands". Each also gets an evergreen fallback draft, so the slot is never empty.
8. **Times:** the account's own best slots, or labelled starting guesses inside the human's free windows. Vary them.
9. **Balance check:**
   - no bucket over its share
   - product mentions within the cap (the managed account's plug-ratio cap when there is one)
   - no two consecutive posts on one account from the same bucket or sub-format (on TikTok every post is video, so vary talking head, POV, tutorial, photo-mode)
   - every video slot has a named shooter

## Output
A grid (one row per slot) that the drafting step fills:
`id · date · time tz · platform · account · format · pillar · bucket · series · test (T1/T2 side, or —) · source · person? · trend expiry`
