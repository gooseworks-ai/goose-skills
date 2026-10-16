---
name: spend-gate
description: >-
  Shared atom (owner: research-market session). Gets the human's yes before any credit is spent, in one of two branches - engine-quoted work (the quote shown exactly as GooseWorks gives it) or proxy data reads (one probe, then a yes to a ceiling, stop at it, log every charge). Also the rule for scheduled runs. Loaded by any playbook that spends credits; never listed.
---

# spend-gate

No credit is spent before the human's yes in this conversation. Money is always a credit number exactly as GooseWorks gives it — never dollars, never your own total presented as a price. Never name tools, endpoints or vendors to the marketer: describe the work in plain words ("Reddit threads about dog allergies, newest first").

Pick the branch by the tool:

## A. Engine-quoted work (ads, photos, video, any tool with a dry run or a price check)

1. Ask the tool for its quote (its dry run, `quote_only`, or `gooseworks:data_price_provider` for fal and ElevenLabs calls).
2. Show each quote exactly as given. Several quotes are shown one by one, never added up by you.
3. Ask for a yes to that quote. Submit only after it; a changed plan needs a new quote and a new yes.
4. If an answer comes back as a card waiting for a press, follow the server's card rule and wait for the human.

## B. Proxy data reads (no price check exists)

Covers `gooseworks:data_call_provider` / `gooseworks:data_post_provider` with ScrapeCreators, `gooseworks:competitor_research` with `mentions`, and capped imports (`gooseworks:knowledge_sync`, `gooseworks:knowledge_import` with a `source`, `gooseworks:ads_library_scrape` for Google). Endpoint paths, query keys and recency options: `proxy-endpoints.md` in this folder.

1. **Read the price history:** `research/credits-log/<YYYY-MM>.md` for this month and last (coworker scope, or the save-to-brain no-coworker fallback `brands/<brand-slug>/research/credits-log/…`). It is the only basis for an estimate.
2. **Probe once when there is no history:** ask one yes for a single small proxy read — "one quick read; GooseWorks tells us its cost after it runs" — keep its results (they are part of the run) and log it. That one probe prices every proxy read per call; kinds of read with no history of their own are estimated from it (planned calls × its per-call charge, said to be an estimate). A tool priced differently (competitor mentions, a capped import) gets its own first call inside the ceiling, never a separate probe yes.
3. **Ask for a ceiling.** Plan the pull with a cap on every row (pages per query, items per page, comments per post). Ask for a yes to "up to N credits", where N comes from the logged charges for these kinds of reads and is said to be an estimate. Caps that tools take in their own unit (a few import tools take a small dollar cap) are described in words — "a small capped import" — and the credits actually charged are reported afterwards; never quote the dollar figure.
4. **Run inside it.** Cheapest and most decisive rows first; stop a row when it saturates. Calls whose need depends on earlier results (comments on the posts a search finds) fit inside the same ceiling or get a new yes. A playbook may reserve part of its ceiling for a named purpose (listen-social's crisis reserve).
5. **Log every charge** as it comes back, in `research/credits-log/<YYYY-MM>.md` (same scope or fallback as step 1; read it, add the row, write the whole file back):
   `date | playbook | tool/endpoint | query kind | items | credits`
   "Query kind" describes the read ("brand name search, TikTok, past month"), never a private person's name or contact.
6. **Stop at the ceiling.** If the next call would cross it, stop and ask. A failed call is retried once only when its error says that is safe; a bad path or key is logged, never guessed again.
7. **Report:** credits charged against the ceiling, in plain words. Endpoint detail stays in the log.

If a declined or trimmed plan leaves a source unread, name it as a gap in the output ("not read: TikTok comments — not approved").

## C. Scheduled runs (automations)

- Create every automation paused. Switch it on only on the human's yes in this conversation.
- The yes names any standing per-run data ceiling ("up to N credits per run"); the run writes that ceiling into its prompt and logs every charge. Without one, a scheduled run uses free sources only and never spends on data.
- The coworker's own run cost is not priced in advance: say so, and after the first run show the credits it used (`gooseworks:automation_list`) so the human can pause it.
- A yes given in chat never carries over to a scheduled run unless it was given as a standing per-run ceiling.
