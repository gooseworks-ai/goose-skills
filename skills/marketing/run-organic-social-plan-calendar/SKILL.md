---
name: run-organic-social-plan-calendar
description: >-
  Step of the run-organic-social playbook: turns the audit, research and dated moments into a two-week
  grid of empty post slots. Run run-organic-social instead; not for direct use.
version: 0.1.0
---

# Plan the calendar

Inputs: the account audit, the voice cards, `../run-organic-social/references/calendar-craft.md`, and these sibling artifacts (read each one that exists; never fake one that doesn't):
- **make-content's repurposed sets:** `gooseworks:file_list` `content/repurposed/` and `content/drafts/` (unslotted social cuts are the raw material).
- **This run's platform research** (`social/research/<date>-<platform>.md`): the patterns and examples every slot is modelled on, and the posting-time and format facts.
- **research-market's latest report** (the newest `research/market/<D>-read.md`): its "What people are saying" section — trends worth posting on, each with a post-by date, and the themes in people's words — and buyer language. Check the section's own date and window line first: research-market runs on ask or monthly, and a narrow run may cover only part of the market. A trend past its post-by date is stale; with no post-by date, a section older than 7 days is stale: use evergreen fallbacks. No such section → no trends from it.
- **plan-campaign:** `gooseworks:campaign_read` (list mode, then one campaign) for any campaign with an organic leg in the window.
- **analyze-performance's organic "what overperformed" read:** the latest `reports/performance/<date>.md`.
- **The brain:**
  - When `brain_*` tools are listed: reuse step 1's reads of chapters 19 "this week and what is coming", 20 "our plan" and 23 "what is working" (focus, live promotions, launches, what not to promote, past results); don't open them again. `gooseworks:brain_search` for the seasonal calendar and for customer questions and phrases.
  - Otherwise: `gooseworks:knowledge_search` for "this week's focus, live promotions, launches, what not to promote, seasonal calendar", and `source_types: ["evidence"]` for voice-of-customer questions and phrases.
- **The previous calendar:** `social/calendar/` (what went out, what's still queued).
- **The last run record** (the `run-memory` skill (`../run-memory/SKILL.md`) Start, loaded by SKILL.md): format tests still open, the per-format scorecard, and recommendations still open.

## Procedure
1. **Window.** The next 14 days from the human's chosen start (default: next Monday). State the time zone.
2. **Capacity.** Slots per week per account, from calendar-craft.md's cadence rules. If the human's ask exceeds it, show the numbers and the recommendation, and let them choose.
3. **Fixed slots first:**
   - campaign and launch posts (dated)
   - seasonal and cultural moments for the brand's region. Look each date up with your web tool when you have one; otherwise list the moments and ask the human to confirm dates. Never assume a date from memory.
   - silent days
   - known trends with expiries
4. **Format-test slots:** place the 1–2 tests (`../run-organic-social/references/calendar-craft.md`, Format tests): the missing posts of open tests carried from the last run record first, under their first ids, then new ones. Aim for 4 slots on each side (a test may span two calendars); write each in the calendar header with its record id.
5. **Series slots next:** each account's 1–2 named series on their days.
6. **Fill the mix:** the remaining slots by the account's bucket ratios, reweighted by the last run's per-format scorecard (more of what beat its baseline, less of what fell below), pulling make-content's cuts first (they're finished thinking), then voice-of-customer questions, then pillar ideas.
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
