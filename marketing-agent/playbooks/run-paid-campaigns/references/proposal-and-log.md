# The weekly moves proposal and the change log

Load at steps 2, 7 and 8. Numbers below are illustrative. Two audiences: the **proposal** is for the marketer (plain words, no ids, no tool or playbook names); the **change log** is for the server and the sibling playbooks (exact grammar below — the server parses it).

## The proposal (what the marketer reads)

```markdown
# Paid moves — week of 13 Oct · <brand> · <campaign>

What a customer may cost: $40 (from the plan, 2 Oct) · Data 6–12 Oct, settled through 10 Oct
Checks: tracking ✓ · landing page ✓ · stock: Clear Serum ~6 days left ✗ (restock 24 Oct) · 1 ad rejected (see 6)
Pacing: $4,180 of $9,000 this month (46% at day 13 of 31 — slightly ahead). If you approve everything below: about $8,850 by month-end, inside $9,000.
What I can see: the ads GooseWorks made (31% of Meta spend) in detail; your export for the rest of Meta and Google. Not visible: frequency (I use the click-rate trend instead).
Real sales this week: new-customer revenue per ad dollar 1.9, below the 2.5 that breaks even — so no scaling this week.

## Since last time
- Raising "Sales – Broad" from $100 to $140 a day (you made that change on 30 Sep) — **worked**: over 7 settled days it brought about 2.1 more orders a day, at about $36 per extra order against your $40 limit (Meta's own counts; the rest of the account was flat).
- Swapping the "Problem hook" static for its new version in "Retargeting – 30d" (applied 7 Oct) — **too early**: readable 21 Oct, so I'm leaving that ad set alone until then.
- Pausing "Lifestyle static" — done 7 Oct — **can't tell**: the same ad set got new ads the same day, so the two changes can't be separated.
- Google: excluding 6 wasted search terms — not confirmed yet. Did you make that change?

## This week
| # | Move | Ad / ad set | Why (window, spend, results vs $40) | Confidence | What should happen | How | Check |
| 1 | Graduate — your pick A, B or C | "Angle B" test winners → main sales ad set | $0.58 per page view vs $1.04 for the other angles; 2.6% of its visitors bought (1,410 visits, ~$22/order); 37 orders | High | the new ads take budget inside the main ad set; it may re-learn for ~3 days (A) | A: approval link · B/C: instructions for you | 20 Oct: cost per order on the new ads ≤ $40 |
| 2 | Pause | "UGC unboxing" | $128 spent (3.2× the $40 limit), 0 orders, click rate 0.41% vs 1.3% | High | its spend moves to the other ads; it saves money only if the ad set budget is also cut | Say: "pause the UGC unboxing ad" | 15 Oct: shows paused |
| 3 | **Your call** | "Founder story" | $410, 8 orders, $51 per order (1.28×), click rate 1.6% → 1.1% over 3 weeks | Low | see both readings | Kill = say it; hold = nothing | 20 Oct |
| 4 | Swap the creative | "3 benefits static" → "Benefits v2" | click rate down 38% over 3 weeks at the same spend | Medium | click rate back toward 1.2%; ~3 days re-learning | Approval link (type GO LIVE) | 21 Oct |
| 5 | Hold | 3 ads launched 10 Oct | 4 days, $96, still learning | — | — | nothing | 17 Oct · trip-wire: any of them past $120 with no order → say "pause <name>" |
| 6 | Fix | rejected ad "Skin check" (reason: speaks to the viewer's skin condition) | — | — | a reworded version from the static-ad maker, then a swap | I've sent the reason to the ad maker | when the new version is picked |
| 7 | Hold (no scale) | main sales ad set ($200/day) | $34 per order on 71 orders, steady 3 weeks — but real sales are below break-even | Medium | — | nothing | 20 Oct: scale only if store-joined cost ≤ $40 or real sales clear break-even |
| 8 | Pause before stock-out | ads selling "Clear Serum" | ~6 days of stock left at current sales | High | no paid clicks to an out-of-stock page | Say: "pause the Clear Serum ads" | on restock: instructions to switch them back on |
| 9 | Lower budget (instructions) | Google "Search – Non-brand", $80 → $65/day | your export: $1,120, 14 conversions, $80 each (2× the limit) | High | ~$105/week less spend; 1–3 fewer conversions | Instructions below | 20 Oct |

Move 3 — both readings
- Kill: 28% over the limit and the click rate has slid three weeks running — a fatigue curve; about $90 a week above the limit.
- Hold: 8 orders is noise (the true cost could be anywhere from ~$33 to ~$70); the last 3 days haven't settled; this ad brings the highest order value ($74 vs $58), so it's near break-even.
- My recommendation: hold 7 days. If it passes $60 per order by $800 spent, or the click rate drops below 0.9%, say "pause Founder story".

## To approve
1. Approval links (one approval each; type GO LIVE for increases and live swaps): move 1-A <link> · move 4 <link>
2. To pause, say it in your own words, for example: "pause the UGC unboxing ad and the Clear Serum ads". A plain "yes" won't pause anything.
3. Instructions for you (move 9) are below — reply "done" when applied.
Anything you don't approve stays as it is.
```

Rules: every move has its evidence and a check; holds have dates and trip-wires; near-threshold calls show both readings; collisions are shown and resolved; the header shows pacing against the ceiling with everything approved; the first section is "Since last time" from the run-memory outcome check (`run-memory.md`); a pause never claims savings the budget doesn't produce; **no ids, no tool or playbook names** — moves are numbered for this proposal only. The per-ad scorecard sits under the moves as "Your top ads" (the run record's table, plain names); the proposal is saved every run to `ads/campaigns/<slug>/proposals/<YYYY-MM-DD>.md`.

**Verdicts on earlier moves** (the same words in the proposal, the run record and `decisions.md`'s Outcome line):
- **worked** / **didn't work** — extra results per day and what each extra result cost against the allowable, before → after, both windows named, labelled Meta's counts (claimed) or store-joined (truth), netted against the rest of the account.
- **too early** — with the date it becomes readable.
- **can't tell** — with the reason: another change on the same ad set in either window, a tracking break, stale data, no ad-set view (ads GooseWorks didn't make in the ad set and no export), or too few results to separate from noise. Say what would make the next one readable.
Never judge a raise on the new average cost per result, from unsettled days, or from a window shorter than its baseline.

## state.md — the server's campaign-harness contract

Path: `ads/campaigns/<slug>/state.md` in the brand's coworker workspace (slug from the brief's Status comment; else the campaign name, lower-case, hyphenated). The server finds the folder **only** through this frontmatter, closes recommendations **only** in the `## Open recommendations` section by deleting the `- R<n> (` bullet, and stamps `updated_at` / `updated_by`. It needs a coworker workspace — with none, server-side logging can't happen; say so.

Grammar (matched exactly):
- Frontmatter between `---` lines: `key: value` scalars and `[a, b]` lists, keys lower-case.
- `meta_push_ids: [<push id>, <push id>]` — every push id `prepare_meta_ad_push` returns is added here at once (the server matches outcomes by it), plus `goose_campaign_id: <id>`.
- `## Open recommendations` — one bullet per open move, on **one line**: `- R<n> (YYYY-MM-DD): <move> — evidence <…> — <status>`. When empty, the line `None.`
- Other sections are yours; the server leaves them alone. Keep every follow-up in `## Checks due` (one line per move: `- R<n> check YYYY-MM-DD: <rule> · trip-wire <…>`) — the server deletes a recommendation's bullet when it closes it, so a check written only in the bullet would be lost. Steps 2 and 9 read `## Checks due`; remove a line once its check has been applied.

```markdown
---
campaign: serum-launch
stage: running
goose_campaign_id: 5f1c…
meta_push_ids: [7f2a…, 9ab3…]
meta_campaign_id: 2384…
updated_at: 2026-10-13
updated_by: run-paid-campaigns
---

# State — serum-launch

Allowable CPA: $40 (brief v2, 2 Oct) · Ceiling: $9,000/month · Attribution: 7d click / 1d view · Regime: high-volume · Off-limits: "Retargeting – Always on" · Brief version: 2
Health (2026-10-13): pixel ✓ · stock: Clear Serum ~6 days ✗ (restock 24 Oct) · disapprovals: 1 (ad 2391…, personal attributes — sent to the static-ad maker) · push failures: none
Replan triggers fired: stock cover < 3 weeks on a featured SKU (Clear Serum)

## Open recommendations
- R7 (2026-10-13): graduate Angle B winners into Sales – Broad (option A link, push 9ab3…) — evidence report:2026-10-13, cost/LPV $0.58, 37 orders — awaiting; check 2026-10-20: CPA on new ads ≤ $40 keep, > $50 pause them
- R11 (2026-10-13): swap 3 benefits static → Benefits v2 (change 41c…) — evidence report:2026-10-13, CTR −38% over 3 wks — awaiting
- R17 (2026-10-13): card — Google Search – Non-brand daily $80 → $65 — evidence user export 6–12 Oct, CPA $80 — awaiting the human ("done")

## Checks due
- R7 check 2026-10-20: CPA on the new ads ≤ $40 keep, > $50 pause them · trip-wire none
- R10 check 2026-10-20: CPA > $60 at $800 spent or CTR < 0.9% → give the pause sentence
- R17 check 2026-10-20: Search – Non-brand CPA ≤ $65 and conversions within 1–3 of last week

## Meta objects
| push_id | Campaign / ad set (Meta ids) | Ads (Meta ad id → name) | Destination | Flight ends | Budget type |
| 7f2a… | Angle B – Traffic (238…/239…) | 2384… UGC unboxing · 2385… Problem hook | /serum?utm_… | 20 Oct | lifetime $900 |
```

Pushes made before this playbook ran have no push id here and no tool lists them: treat those ads as non-Goose (cards) until the human gives the push link or id.

## decisions.md — the change log

Path: `ads/campaigns/<slug>/decisions.md`. **Append-only**, dates never earlier than the newest entry — an older event logged late takes today's date and names its real date in the Outcome line. The server appends a block for every Meta outcome it sees (approved, declined, paused, swapped) when the call named the push or campaign; this playbook appends, in the same grammar, what the server can't see: card moves once the human says "done", declines the human gives in chat, holds the human chose, and each check's result. Re-read immediately before appending (the server writes the same file).

Grammar (one line per field, no paragraph breaks):
```markdown
---
campaign: serum-launch
---

# Decisions — serum-launch

### 2026-10-13 — Founder story held
- Recommended: R10 — kill or hold (near threshold)
- Evidence: report:2026-10-13 — $410, 8 orders, CPA $51
- Decided: human chose hold; trip-wire $60 CPA at $800
- Outcome: open until 2026-10-20

### 2026-10-14 — Google budget lowered (applied by the human)
- Recommended: R17 — Search – Non-brand daily $80 → $65
- Evidence: user request — export 6–12 Oct, CPA $80 = 2× allowable, 14 conv / $1,120
- Decided: human said "done" at 09:12
- Outcome: applied; expected −$105/week; check 2026-10-20

### 2026-10-14 — Sales – Broad raise read
- Recommended: R5 — card — Sales – Broad daily $100 → $140 (applied by the human 2026-09-30)
- Evidence: user request — your export, pre 23–29 Sep vs post 4–10 Oct, 7d click / 1d view
- Decided: check rule from Checks due
- Outcome: worked — +2.1 orders/day at $36 per extra order vs $40 allowable (claimed); rest of account flat
```

After appending a card's or a hold's outcome, delete its `- R<n> (` bullet from `## Open recommendations` yourself (the server only closes moves made with `recommendation_ref`). **Launches and graduations** carry no `recommendation_ref` (`prepare_meta_ad_push` doesn't take one): once push status shows approved or declined, delete their bullet yourself and, if `decisions.md` has no block for that push, append one with `Evidence: push:<id>`. `Evidence` uses the server's forms: `change:<id>`, `push:<id>`, `report:<YYYY-MM-DD>` or `user request`.

Each **final** check result (worked / didn't work / can't tell) is appended as its own block (above) with the verdict word in the Outcome line, so the verdict lives in the log as well as in the run record. A `too early` appends nothing: it only rewrites the date on that move's `## Checks due` line, which stays until the final read.

Never keep a second ledger anywhere else; analyze-performance and plan-campaign read the `### YYYY-MM-DD — <title>` blocks to trace results to decisions. The run record (`run-memory.md`) links these two files and adds only the baseline recipe, the result numbers and the scorecard.

## The yardstick in the brain (targets and caps)

When `brain_*` tools are listed, the yardstick is also read from — and changes are proposed to — the Brand Brain, so every playbook uses the same numbers:
- **Read** at Before you start step 4: `gooseworks:brain_map` chapter 20 "Our plan" (`target_cpa`, `target_roas`, `decision.*`, `experiment.*`) and chapter 15 "How we work together", plus the operating plan (`brain_open` record type `operating_plan`): the daily spend cap and currency, protected campaigns and ad sets, approvers, and the emergency stop. **An emergency stop that is set → stage pauses and fixes only; no launch, scale or swap.** Protected entities are off-limits like the brief's.
- **Precedence:** the approved brief → a confirmed brain target → `state.md` → derived or asked. A found (unconfirmed) or waiting target is used labelled "waiting for your yes". When the brief and a confirmed brain target differ, say both and use the brief for this campaign.
- **Propose, never set.** When the marketer states or changes the allowable cost, a target return or a cap in this conversation: the target goes through `../../../atoms/save-learning/ATOM.md`'s fact path (kind 20, `target_cpa` or `target_roas`, their words as the statement; `applies_to` the hero product when the campaign sells one product and the brand has other campaigns with other targets); a **daily** cap they state goes to the operating plan with `gooseworks:brain_save` `operating_plan` (`daily_spend_cap_minor_units`, `spend_cap_currency`) — a typed write this playbook may make directly because its spec owns those sections (AGENTS §8 "Two seams only", ruling of 20 Oct) — with source `you`, `is_public: false` and the marketer's words as `user_statement`. Every such save is **found, never confirmed**: plan, budget and target changes wait for the marketer's yes in the GooseWorks app, so say so in one line ("Saved; it waits for your yes in GooseWorks before it counts") and keep using the brief's number until it is confirmed. Never accept the proposal yourself. A monthly ceiling stays in the brief and `state.md` (the operating plan has no monthly money field; `server-needs.md`). Never from a scheduled run.
- Without `brain_*` tools: the brief, `state.md` and the offer to update the brief's Economics section, as before.
