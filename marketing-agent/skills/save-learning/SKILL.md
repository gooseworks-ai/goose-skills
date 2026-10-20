---
name: save-learning
description: >-
  Shared step of the marketing playbooks (make-static-ads, analyze-performance, email-lifecycle,
  write-outreach): saves a short brand rule or finding in the human's own words, one idea per rule,
  retires the playbook's own older rules it replaces, and reads the result back to confirm. Loaded by
  those playbooks; not for direct use.
version: 0.1.1
---

# save-learning

Learnings are the brand's short rules. Every playbook writes them through this atom and nowhere else. There are two server paths, and this atom picks between them:
- **Brain path:** when `brain_*` tools are listed (the Brand Brain). Save with `gooseworks:brain_save`, read back with `gooseworks:brain_open` / `gooseworks:brain_search`.
- **Older path:** otherwise (production today). Save with `gooseworks:brand_update` `patch.facts`, read back with `gooseworks:brand_read`.
- **Local mode** (no GooseWorks, [the `marketing-guide` skill](../marketing-guide/SKILL.md) §5): append to `gooseworks-local/<brand-slug>/brand-notes.md`, same opening, their words, dated. Read the file first; mark your own superseded line `retired <date>`; read it back.

The playbooks do not change between the paths.

Long evidence, tables and reports belong in a brand document (the `save-to-brain` skill (`../save-to-brain/SKILL.md`)); a learning is the rule or finding itself, in the human's words.

## When you may write one

- Only with the human's own words in `user_statement`: what they typed. An explicit approval such as "yes, save that rule" counts; your draft never goes there. On the older path also send `knowledge_intent: "user_correction"`; on the brain path, source `you`. Without their words, don't write it: put the finding in your document instead.
- **Brand facts the marketer states** (an offer, a price) follow the guide's rule of that name (§3): save only an unambiguous fact, ask once if their words conflict, and search first (step 1 of either path) so one fact is one save.
- `must` and `dont` only for rules the human stated or approved. Findings are `insight`; style guidance is `do`.
- **One exception, brain path only:** a numbers-only **measured readout** of our own work (a budget move's before → after, a test result) may be saved as a fact without the human's words. It comes from the `run-memory` skill (`../run-memory/SKILL.md`) and goes to kind 23, field `experiment_readout.<id>`, with source `our_work`. Only a `worked` or `didn't work` verdict, labelled truth or claimed, and never from a scheduled run. It states numbers and dates, never a rule.
- **Found, not confirmed** (the marketing-guide §1.4). A save waits for the human's yes in the GooseWorks app even in their own words: never call it confirmed or approved, and never accept a proposal unless the human said so in this conversation. Even then, the app may require them to accept it there; relay the link the refusal gives.

## The text

- **One idea per learning**, plain words, so it can be found, merged and retired on its own.
- Opening:
  - **The brand's fixed openings:** `Claims sign-off (learn-my-brand, …`, `Claims you may use — …`, `Never say — …`, `Policy: …`, `Banned words — …`, `Not public — …`. Keep these openings exactly: they are a data format every playbook reads. Only the `claims-gate` skill (`../claims-gate/SKILL.md`) §5 writes or retires the marker and `Claims you may use —` facts. No playbook writes or retires the others; a playbook's own policy rule goes under its own `[<source> …]` opening.
  - **shared:** `Standing offer: <offer> until <date | ongoing> [owner, <date>]` only. email-lifecycle writes it and may retire or rewrite it when the owner changes the offer.
  - everyone else: `[<source> YYYY-MM-DD]`, source = `learning` (analyze-performance; add ` A-NN` for an angle) · `market` (research-market) · `angle A-NN` · `listening` (research-market's listening) · `search` (improve-search-visibility) · `lifecycle` (email-lifecycle) · `content` (make-content) · `social` (run-organic-social) · `ads` (make-static-ads) · `outreach` (research-audience) · `outreach-copy` (write-outreach) · `creators` (work-with-creators). One source per playbook, so "retire your own" never reaches another playbook's facts.
- Example: `[lifecycle 2026-10-16] Never send a promo email the day after a shipping delay email.`
- A **typed fact** (brain path, step 2) carries the value only, without the opening. Its kind and field say what it is, and `request_key` starts with the playbook slug.

## Steps: brain path (`brain_*` tools listed)

1. **Read** the brain's rules and what is working. Use `gooseworks:brain_map` (the core already lists every rule and the never-list) with `kind: 14` for the full rules and `kind: 23` for learnings, or `gooseworks:brain_search` `source_types: ["learning"]` for the topic. Look for a learning that already says the same thing, and check `waiting_for_yes` too: the same rule may already be waiting for the human's yes. Don't save it twice.
2. **Pick the target.**
   - If the rule fits a **registered fact field**, save it as that fact (`brain_save` `fact`: kind + field). Engines read typed fields directly. Fields:
     - 15 "How we work together": `agent_may_do_alone.<item>`, `alert_on.<item>`, `reply_rule.<item>`, `reporting_rhythm`.
     - 18 "How we count results": `winning_number`, `conversion.<item>`, `attribution_window`, `lead_definition`, `naming_convention`.
     - 20 "Our plan": `no_go_list`, `target_cpa`, `target_roas`, `priority_products`, `decision.<item>`, `experiment.<item>`.
     - 23 "What is working": `worn_out_angle.<item>`, `experiment_readout.<item>`, `lesson`.
     
     An unknown field is refused with the allowed list. Pick from that list, or fall back to a learning. Never invent a field. The `operating_plan.*` fields (budget caps, approvers, goals) belong to the playbooks whose spec owns them, not to this atom.
   - Otherwise, save a **learning** (`brain_save` target `learning`, with the kind and the text).
3. **Save** with the human's words in `user_statement`, source `you` (`our_work` for a readout), and `is_public: false` unless the human says the rule is public-facing. Use a stable `request_key` such as `<playbook>.<YYYYMMDD>.<n>`, so a retried call never duplicates. Use `expected_version: 0` for a new item. For an existing one, pass its `revision` from `brain_open` as `expected_revision`, and on a version conflict re-open it and retry once.
   - **The text limit is explicit: 300 characters.** A longer learning is refused, not cut. See "Long learnings" below.
4. **Retire your own superseded learning.** Save the replacement on the old learning's `id` (the old text becomes history), or close a dropped one with `valid_until` = today. Never touch another playbook's learning; if yours contradicts it, tell the human. If both are refused, retire it on the older path (`brand_update` `{id, active: false}`) and note it in the run's hand-over.
5. **Read back.** `gooseworks:brain_open` the saved record, or check `brain_save` `proposal` `list` when the answer says it waits for a yes. Compare the stored text with what you sent. A missing one is reported as not saved.
6. **Tell the human in one line** what was saved, and whether it waits for their yes: "I've saved that rule. It's waiting for your yes in GooseWorks before ads follow it."

## Steps: older path (no `brain_*` tools; one `brand_update` call per save)

1. **Read** `gooseworks:brand_read` `sections: ["learnings"]`. Lean returns every `must`/`dont`; use `detail: "full"` when you also need `do`/`insight`/`template_hint` rows and their ids. Look for a learning that already says the same thing.
2. **Retire your own superseded learnings** in the same call: `{id, active: false}` for each of your playbook's learnings (same opening) that the new one replaces or contradicts. Never retire another playbook's learning; if yours contradicts it, tell the human. Exceptions: the `claims-gate` skill (`../claims-gate/SKILL.md`) §5 retires and rewrites the claims marker; `Standing offer:` (above).
3. **Add** every learning the human gave you, one idea each.
4. **Read back** the learnings and compare each stored text with what you sent. A missing one is reported as not saved. Check here too whether reads hide retired (`active: false`) rows; a retired learning that still shows is deleted (`delete: true`).
5. **Tell the human in one line** what was saved, in plain words: "I've saved that as a rule for future ads."

## Long learnings (both paths)

- **Brain path:** the 300-character limit is explicit, and longer text is refused. Show the human a version of 300 characters or fewer that keeps their meaning, and save it on their yes; their yes makes it their words. Keep the full original in the related brand document (through the `save-to-brain` skill (`../save-to-brain/SKILL.md`); for claims, the Brand record). In a scheduled run with no human, don't save it. Put it in the report's "Decisions for you".
- **Older path (interim, remove when production has `brain_*` tools):** the server cuts learning text over 300 characters without an error. Still write it as one learning (the stored copy will be cut), keep the full text in the related brand document, and tell the human in one line where the full text lives. In read-back, a stored text that matches the first 300 characters of a longer learning counts as saved, provided the full text is in that document.
- On either path, never split one idea into several learnings, ration them, or quietly shorten or reword one to fit. Any limit handling lives here, nowhere else.
