---
name: spend-gate
description: >-
  Shared step of the marketing playbooks (make-static-ads, research-market, run-paid-campaigns,
  work-with-creators): gets the human's yes before any credits are spent. Shows the price exactly as
  quoted, or asks for one yes to a credit ceiling for paid data reads, stays under it and logs each
  charge. Also covers scheduled runs. Loaded by those playbooks; not for direct use.
version: 0.1.0
---

# spend-gate

No credit is spent before the human's yes in this conversation. Money is always a credit number exactly as GooseWorks gives it — never dollars, never your own total presented as a price. Never name tools, endpoints or vendors to the marketer: describe the work in plain words ("Reddit threads about dog allergies, newest first").

Pick the branch by the tool:

## A. Engine-quoted work (ads, photos, video, any tool with a dry run or a price check)

1. Ask the tool for its quote (its dry run, `quote_only`, or `gooseworks:data_price_provider` for fal and ElevenLabs calls).
2. Show each quote exactly as given. Several quotes are shown one by one, never added up by you.
3. Ask for a yes to that quote. Submit only after it; a changed plan needs a new quote and a new yes.
4. If an answer comes back as a card waiting for a press, follow the server's card rule and wait for the human.

## B. Proxy data reads (no price check exists) — one yes

Covers `gooseworks:data_call_provider` / `gooseworks:data_post_provider` with ScrapeCreators, `gooseworks:competitor_research` with `mentions`, and capped imports (`gooseworks:knowledge_sync`, `gooseworks:knowledge_import` with a `source`, `gooseworks:ads_library_scrape` for Google). Endpoint paths, query keys and recency options: `proxy-endpoints.md` in this folder.

Paid reads deepen a free result; they are never the starting point. Offer them only after the playbook's free pass, in the same message as the draft answer (`../marketing-guide/research-pattern.md` (in the `marketing-guide` skill)), and ask **once**.

1. **Read the price history:** `research/credits-log/<YYYY-MM>.md` for this month and last (the scope in [the `marketing-guide` skill](../marketing-guide/SKILL.md) §2).
2. **Plan the top-up** with a cap on every row (pages per query, items per page, comments per post, profiles per list) and say in plain words what it adds to the free result.
3. **Estimate and ask one yes** to "up to N credits", labelled an estimate:
   - with history: N from the logged charges for these kinds of reads;
   - with no history: never invent a price. Say what the top-up adds and roughly how many reads it takes, that the first read shows the real price, and let the human name the ceiling in the same yes ("up to how many credits?"); with no number given, run only the probe call and report its price before anything else. The first call runs as the probe **inside that same ceiling** — never a separate yes.
   Caps that tools take in their own unit (a few import tools take a small dollar cap) are described in words — "a small capped import" — and the credits charged are reported afterwards; never quote the dollar figure.
4. **Run inside it.** Run the probe call first and keep its results. If the real per-call charge means the plan cannot fit, trim the plan to fit the ceiling — never cross it; ask again only if the human wants more. Then the cheapest and most decisive rows first; stop a row when it saturates. Calls that depend on earlier results (comments on the posts a search finds) fit inside the same ceiling. A playbook may reserve part of the ceiling for a named purpose (research-market's crisis reserve for its listening).
5. **Log every charge** as it comes back, in `research/credits-log/<YYYY-MM>.md` (same scope as step 1; read it, add the row, write the whole file back):
   `date | playbook | tool/endpoint | query kind | items | credits`
   "Query kind" describes the read ("brand name search, TikTok, past month"), never a private person's name or contact.
6. **Stop at the ceiling.** If the next call would cross it, stop. A failed call is retried once only when its error says that is safe; a bad path or key is logged, never guessed again.
7. **Report:** credits charged against the ceiling, in plain words. Endpoint detail stays in the log.

If the human declines or trims the top-up, the free result stands; name what the paid reads would have added as a gap ("not read: TikTok comments — top-up not approved").

## C. Scheduled runs (automations)

- Create every automation paused. Switch it on only on the human's yes in this conversation.
- The yes names any standing per-run data ceiling ("up to N credits per run"); the run writes that ceiling into its prompt and logs every charge. Without one, a scheduled run uses free sources only and never spends on data.
- The coworker's own run cost is not priced in advance: say so, and after the first run show the credits it used (`gooseworks:automation_list`) so the human can pause it.
- A yes given in chat never carries over to a scheduled run unless it was given as a standing per-run ceiling.
