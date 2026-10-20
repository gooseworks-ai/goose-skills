---
name: run-paid-campaigns-apply-and-log
description: >-
  Step of the run-paid-campaigns playbook: stages the week's approval items, applies only what the
  marketer approves and keeps the change log. Run run-paid-campaigns instead; not for direct use.
version: 0.1.1
---

# Stage, apply and log (atom)

**Load:** `../run-paid-campaigns/references/meta-levers.md`, `../run-paid-campaigns/references/proposal-and-log.md` (exact grammar). **Steps by each move's lever** (the playbook's Before you start 3): GooseWorks levers — 1–8; connector levers — 1, 2, 4, then 9–11; written instructions — 1, 2, 4 (no tool call), then 7 on the marketer's "done". **Local mode** has only the last two and calls no `gooseworks:` tool; its files live under `gooseworks-local/<brand-slug>/` (host file tools).

## Stage (step 7)
1. Re-read `ads/campaigns/<slug>/state.md`. If it doesn't exist, create it with the frontmatter (`campaign`, `stage`, `goose_campaign_id`, `meta_push_ids: []`, `meta_campaign_id`, `updated_at`, `updated_by`; local mode: no ids), the header lines, `## Open recommendations` and `## Meta objects`.
2. Write each open move as one line `- R<n> (YYYY-MM-DD): <move> — evidence <…> — awaiting` under `## Open recommendations` (next free number; never reuse one), and its follow-up as `- R<n> check YYYY-MM-DD: <rule> · trip-wire <…>` under `## Checks due` (the server deletes bullets on close; checks must survive).
3. **GooseWorks levers only.** For each Meta budget change, swap or launch without an id yet: `gooseworks:propose_meta_budget_change` / `gooseworks:propose_meta_creative_replacement` (with `reason`, `evidence` as `report:<YYYY-MM-DD>` or `user request`, `recommendation_ref`), or `gooseworks:prepare_meta_ad_push` (with `goose_campaign_id`) then push status until it awaits approval. Put each returned change id in its bullet; **add each push id to `meta_push_ids` immediately** — the server finds this folder only through that list or `goose_campaign_id`. Never re-propose an item that already has an id.
4. Write the proposal in `proposal-and-log.md`'s one template (numbered moves, no ids) with the real approval links, the pause sentence and the cards; deliver it by its § Delivery, scheduled or not. Stop.

## Apply (step 8)
5. Pauses: `gooseworks:pause_meta_ad_push` only on the marketer's own words in this turn naming the ads (`user_instruction`), with `push_id` and `meta_ad_ids` from `## Meta objects`, and `recommendation_ref`. A bare "yes" → ask for the sentence. Report each ad's state after; anything not confirmed is named.
6. Links: read change or push status → approved / declined / waiting. Budget changes, swaps and pauses made with `recommendation_ref`: the server writes the `decisions.md` block and removes the bullet — never duplicate it. **Launches / graduations** (no `recommendation_ref` on `prepare_meta_ad_push`): when push status shows approved or declined, remove the bullet yourself and append a block with `Evidence: push:<id>` if none exists. Never say "done" early. A refused budget change (budget moved in Ads Manager): relay, re-read, never retry blind.
7. Instructions (cards), holds the marketer chose, declines given in chat, and check results (with the verdict word — worked / didn't work / too early / can't tell — in the Outcome line): re-read `decisions.md` immediately before writing, append a `### YYYY-MM-DD — <title>` block (Recommended / Evidence / Decided / Outcome, one line each, date never earlier than the newest block), then delete that recommendation's bullet from `state.md` (write `None.` if the section empties).

8. Save the run record (`../run-paid-campaigns/references/run-memory.md`), each change id and push id copied into its money-move row.

## Apply through a connector (any ads platform)
The rule is `../run-paid-campaigns/references/meta-levers.md` § With an ads-platform connector; follow it exactly. Here only the bookkeeping:
9. Staged by steps 1, 2 and 4: each change is an open `R<n>` bullet and its card. No connector call yet.
10. Apply each one only on its named yes, by that rule.
11. Log after the read-back: re-read `decisions.md`, append a `### YYYY-MM-DD — <title>` block (Recommended and Evidence as usual; Decided: the marketer's words; Outcome: applied <time>, read back <value> — the applied time the outcome check uses, or the failure) and delete the bullet from `state.md`. In local mode nothing else writes these files, so every block is yours.

**Never:** approve on the marketer's behalf; pause on your own judgement or a schedule; revert for a kill; break the connector rule; keep a ledger anywhere but these two files (the run record links them and adds only recipes, results and the scorecard).
