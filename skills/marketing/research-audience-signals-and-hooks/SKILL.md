---
name: research-audience-signals-and-hooks
description: >-
  For a list of companies, finds dated, linked timing signals from the last 90 days (funding, new
  leaders, hiring, launches), drops stale ones and noise, scores timing, and gives one personal hook
  per person from their recent public work. Facts only, no message copy. Use alone when you already
  have the company list and, for hooks, the people; otherwise run research-audience.
version: 0.1.0
---

# signals-and-hooks

**Reads:** account table; people (for hooks); `../research-audience/references/signals-and-hooks.md`; champions list if the human supplied one.

**Does:**
1. News first, per account: a web search for the company over the last 90 days (funding, new leader, launch, expansion, acquisition, layoffs, awards that matter to the buyer). Then the signals that matter for this motion (the reference table): careers page and job boards, company news and posts. Stop once one strong fresh signal is found unless a second is cheap. Anything from the last 14 days is a **timely opening** for the report.
2. Record each as fact · URL · publish date · retrieved date · why now. Re-check job posts are still live.
3. Drop anything past its window and anything on the noise list. Funding alone never makes an account tier A.
4. Score timing by judgment against the anchors (strength, recency, capped at 40), with the reason written in the row.
5. Per person (run again after people-and-contacts, from SKILL step 6), find one hook from their professional public activity in the last ~60 days; tie it to the pain. None found → "none found". Account rows (independent shops, chains) get one hook too, from the shop's recent posts or events. Never use banned topics.

**Writes:** `signal_1/2` (+url, date), timing points, `hook` (+url).

**Rules:** no URL, no signal. Never write outreach copy here — facts only.
