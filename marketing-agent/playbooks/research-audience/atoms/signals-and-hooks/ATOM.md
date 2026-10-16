---
name: signals-and-hooks
description: Hidden atom of research-audience. Finds dated, linked timing signals per account and one personalisation hook per person, drops stale signals and noise, and assigns timing points.
---

# signals-and-hooks

**Reads:** account table; people (for hooks); `references/signals-and-hooks.md`; champions list if the human supplied one.

**Does:**
1. Per account, check the signals that matter for this motion (the table in the reference), strongest first; stop once one strong fresh signal is found unless a second is cheap.
2. Record each as fact · URL · publish date · retrieved date · why now. Re-check job posts are still live.
3. Drop anything past its window and anything on the noise list. Funding alone never makes an account tier A.
4. Score timing by judgment against the anchors (strength, recency, capped at 40), with the reason written in the row.
5. Per person (run again after people-and-contacts, from SKILL step 6), find one hook from their professional public activity in the last ~60 days; tie it to the pain. None found → "none found". Account rows (independent shops, chains) get one hook too, from the shop's recent posts or events. Never use banned topics.

**Writes:** `signal_1/2` (+url, date), timing points, `hook` (+url).

**Rules:** no URL, no signal. Never write outreach copy here — facts only.
